import { verifyToken } from "@clerk/express";
import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

// Map userId -> Set<WebSocket> (supports multi-device / multi-tab)
const onlineUsers = new Map<string, Set<WebSocket>>();

// In-memory participant cache to avoid a DB hit per relayed message
const conversationParticipants = new Map<string, string[]>();

export const getOnlineUserIds = () => Array.from(onlineUsers.keys());

/** Send a raw string payload to all open sockets of a given user. */
export function sendToUser(userId: string, payload: string): void {
    onlineUsers.get(userId)?.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
}

/** Invalidate the cached participant list when a conversation is mutated. */
export function invalidateConversationCache(conversationId: string): void {
    conversationParticipants.delete(conversationId);
}

// Initialize socket server
export function initSocketServer(server: any) {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
        console.log("Client connected");

        // Extract token from query string: /ws?token=...
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
            ws.close(1008, "No token");
            return;
        }

        let userId: string;
        try {
            const decoded = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });
            userId = decoded.sub;
        } catch (error) {
            console.log("WS Verification Error :", error);
            ws.close(1008, "Invalid Token");
            return;
        }

        // Register user socket (supports multiple devices)
        const existing = onlineUsers.get(userId) ?? new Set<WebSocket>();
        const wasOffline = existing.size === 0;
        existing.add(ws);
        onlineUsers.set(userId, existing);

        if (wasOffline) {
            await User.findByIdAndUpdate(userId, { isOnline: true });
            broadcastOnlineStatus(userId, true);
        }

        ws.on("message", (data: Buffer) => {
            try {
                const msg = JSON.parse(data.toString());

                // Forward message to receiver(s)
                if (msg.type === "message") {
                    const { receiverId, conversationId, payload } = msg;
                    if (conversationId) {
                        handleConversationEvent(userId, conversationId, { type: "message", payload });
                    } else if (receiverId) {
                        sendToUser(receiverId, JSON.stringify({ type: "message", payload }));
                    }
                }

                // Forward typing indicator
                if (msg.type === "typing") {
                    const { receiverId, conversationId, isTyping } = msg;
                    if (conversationId) {
                        handleConversationEvent(userId, conversationId, { type: "typing", senderId: userId, isTyping });
                    } else if (receiverId) {
                        sendToUser(receiverId, JSON.stringify({ type: "typing", senderId: userId, isTyping }));
                    }
                }
            } catch (error: any) {
                console.error("Error processing message", error?.message);
            }
        });

        ws.on("close", async () => {
            const sockets = onlineUsers.get(userId);
            sockets?.delete(ws);
            // Only mark offline when ALL sockets for this user are gone
            if (!sockets?.size) {
                onlineUsers.delete(userId);
                await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
                broadcastOnlineStatus(userId, false);
            }
        });
    });

    return wss;
}

function broadcastOnlineStatus(userId: string, isOnline: boolean) {
    const payload = JSON.stringify({ type: "online_status", userId, isOnline });
    onlineUsers.forEach((_, uid) => sendToUser(uid, payload));
}

export async function handleConversationEvent(senderId: string, conversationId: string, event: any) {
    try {
        // Use cached participant list; only hit DB on first relay for this conversation
        let participants = conversationParticipants.get(conversationId);
        if (!participants) {
            const conversation = await Conversation.findById(conversationId, { participants: 1 });
            if (!conversation) return;
            participants = conversation.participants.map(String);
            conversationParticipants.set(conversationId, participants);
        }

        const payload = JSON.stringify(event);
        participants.forEach((pId) => {
            if (pId === senderId) return; // Don't echo to sender
            sendToUser(pId, payload);
        });
    } catch (error: any) {
        console.error("Conversation Event error", error?.message);
    }
}

export function broadcastUserUpdate(user: any) {
    const payload = JSON.stringify({ type: "user_update", user });
    onlineUsers.forEach((_, uid) => sendToUser(uid, payload));
}

export { onlineUsers };