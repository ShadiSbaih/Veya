import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.js";
import Conversation from "../models/Conversation.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Space from "../models/Space.js";
import Task from "../models/Task.js";
import { handleConversationEvent, invalidateConversationCache } from "../socket/socketManager.js";

export type ApiResponse<T = {}> = {
    success: boolean;
    message?: string;
} & T;

// Start or get a conversation with a user
export const getOrCreateConversation = async (req: AuthRequest, res: Response<ApiResponse<{ conversation?: any }>>) => {
    const userId = req.user!.id;
    const targetUserId = String(req.params.targetUserId)

    let conversation: any = await findConversation(userId, targetUserId);

    if (conversation) {
        await conversation.populate("participants", "name email handle avatar isOnline lastSeen");
        await conversation.populate("lastMessage")
    } else {
        conversation = await Conversation.create({
            participants: [userId, String
                (targetUserId)]
        })
        await conversation.populate("participants", "name email handle avatar isOnline lastSeen");
    }

    const other = (conversation.participants as any[]).find((p: any) => String(p._id) !== userId);
    const space = await Space.findOne({ conversationId: conversation._id }).lean();

    res.json({
        success: true,
        conversation: {
            _id: conversation._id,
            participant: other,
            lastMessage: conversation.lastMessage,
            // Contextual fields
            contextType: conversation.contextType,
            context: conversation.context,
            status: conversation.status,
            space: space || undefined,
        }
    })
}

// Get all conversations for the current user
export const getConversations = async (req: AuthRequest, res: Response<ApiResponse<{ conversations?: any[] }>>) => {
    const userId = req.user!.id;
    const conversations = await Conversation.find({ participants: { $in: [userId] } }).populate
        ("participants", "name email handle avatar isOnline lastSeen").populate("lastMessage").
        sort({ updatedAt: -1 })
    const spaces = await Space.find({
        conversationId: { $in: conversations.map((conversation) => conversation._id) },
    }).lean();
    const spacesByConversation = new Map(spaces.map((space) => [String(space.conversationId), space]));

    const shaped = conversations.map((c) => {
        const other = (c.participants as any[]).find((p: any) => String(p._id) !== userId);
        const isGroup = c.participants.length > 2;
        return {
            _id: c._id,
            isGroup,
            participants: c.participants, // Include full array for group display
            participant: other,
            lastMessage: c.lastMessage,
            updatedAt: c.updatedAt,
            // Contextual fields
            contextType: c.contextType,
            context: c.context,
            status: c.status,
            space: spacesByConversation.get(String(c._id)),
        }
    })

    res.json({ success: true, conversations: shaped })
}

// Get a single conversation by ID
export const getConversationById = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    const c = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] }
    })
    .populate("participants", "name email handle avatar isOnline lastSeen")
    .populate("lastMessage");

    if (!c) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const other = (c.participants as any[]).find((p: any) => String(p._id) !== userId);
    const isGroup = c.participants.length > 2;
    const space = await Space.findOne({ conversationId: c._id }).lean();

    const shaped = {
        _id: c._id,
        isGroup,
        participants: c.participants,
        participant: other,
        lastMessage: c.lastMessage,
        updatedAt: c.updatedAt,
        contextType: c.contextType,
        context: c.context,
        status: c.status,
        space: space || undefined,
    };

    res.json({ success: true, conversation: shaped });
}

// Create a new conversation (contextual or normal chat)
export const createConversation = async (req: AuthRequest, res: Response<ApiResponse<{ conversation?: any }>>) => {
    const userId = req.user!.id;
    const { participantIds, contextType = "chat", context } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        res.status(400).json({ success: false, message: "At least one participant is required" });
        return;
    }

    // Deduplicate and include the creator
    const allParticipants: string[] = Array.from(
        new Set([userId, ...participantIds.map(String)])
    );

    // For 1-on-1 chat, reuse an existing conversation if it already exists
    if (contextType === "chat" && allParticipants.length === 2) {
        const otherId = allParticipants.find((p) => p !== userId)!;
        const existing = await findConversation(userId, otherId);
        if (existing) {
            await existing.populate("participants", "name email handle avatar isOnline lastSeen");
            await existing.populate("lastMessage");
            const other = (existing.participants as any[]).find((p: any) => String(p._id) !== userId);
            const isGroup = existing.participants.length > 2;
            res.json({
                success: true,
                conversation: {
                    _id: existing._id,
                    isGroup,
                    participants: existing.participants,
                    participant: other,
                    lastMessage: existing.lastMessage,
                    updatedAt: existing.updatedAt,
                    contextType: existing.contextType,
                    context: existing.context,
                    status: existing.status,
                }
            });
            return;
        }
    }

    const conversation = await Conversation.create({
        participants: allParticipants,
        contextType,
        context: context || undefined,
        status: "active",
    });

    await conversation.populate("participants", "name email handle avatar isOnline lastSeen");

    const other = (conversation.participants as any[]).find((p: any) => String(p._id) !== userId);

    const isGroup = conversation.participants.length > 2;

    res.status(201).json({
        success: true,
        conversation: {
            _id: conversation._id,
            isGroup,
            participants: conversation.participants,
            participant: other,
            lastMessage: undefined,
            updatedAt: conversation.updatedAt,
            contextType: conversation.contextType,
            context: conversation.context,
            status: conversation.status,
        }
    });
}

// Update conversation status
export const updateConversationStatus = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!["active", "completed", "archived"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] }
    });

    if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    conversation.status = status;
    await conversation.save();

    res.json({ success: true, status: conversation.status });
}

// Update conversation context (Phase 7)
export const updateConversationContext = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { contextType, context } = req.body;

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] }
    });

    if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (contextType) {
        conversation.contextType = contextType;
    }
    if (context) {
        conversation.context = context;
    }

    await conversation.save();

    res.json({ success: true, conversation });
}

// Send a message
export const sendMessage = async (req: AuthRequest, res: Response<{ success: boolean; message?: any }>) => {
    const senderId = req.user!.id;
    const { receiverId, conversationId, text } = req.body;
    const file = req.file;

    if ((!receiverId && !conversationId) || (!text?.trim() && !file)) {
        res.status(400).json({ success: false, message: "receiverId/conversationId and (text or file) are required" });
        return;
    }

    let mediaUrl = "";
    let mediaType: "image" | "video" | undefined;

    if (file) {
        try {
            const isVideo = file.mimetype ? file.mimetype.startsWith("video") : false;
            const resourceType = isVideo ? "video" : "image";
            mediaType = resourceType;
            const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: "insta_chat", resource_type: resourceType
                }, (error, result) => {
                    if (error) reject(error)
                    else resolve(result as any)
                })
                const readableStream = new Readable()
                readableStream.push(file.buffer)
                readableStream.push(null);
                readableStream.pipe(uploadStream);
            })

            const result = await uploadPromise;
            mediaUrl = result.secure_url;
        } catch (error) {
            console.error("Cloudinary upload error in Message Controller :", error);
            res.status(500).json({ success: false, message: "Failed to upload Media" });
            return;
        }
    }

    let conversation;
    if (conversationId) {
        conversation = await Conversation.findOne({
            _id: conversationId, participants: {
                $in:
                    [senderId]
            }
        })
    } else {
        conversation = await findConversation(senderId, receiverId)
        if (!conversation) {
            conversation = await Conversation.create({ participants: [senderId, receiverId] })
        }
    }

    if (!conversation) {
        res.status(404).json({ success: false, message: "Conversation not found" });
        return
    }

    const message = await Message.create({
        sender: senderId,
        receiver: receiverId || conversation.participants.find((p) => String(p) !== senderId),
        conversationId: conversation._id,
        text: text?.trim(),
        mediaUrl: mediaUrl || undefined,
        mediaType,
    })

    conversation.lastMessage = message._id as any;
    conversation.updatedAt = new Date();
    await conversation.save();

    await notifyReceivers(conversation, senderId, "new_message", text?.trim() || "Sent an attachment");
    handleConversationEvent(senderId, String(conversation._id), { type: "message", payload: message });

    res.status(201).json({ success: true, message });
}

// get messages
export const createDecision = async (req: AuthRequest, res: Response) => {
    const senderId = req.user!.id;
    const { receiverId, conversationId, question, options } = req.body;

    if (!question || !options || !Array.isArray(options)) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    let conversation;
    if (conversationId) {
        conversation = await Conversation.findOne({
            _id: conversationId,
            participants: { $in: [senderId] }
        });
    } else if (receiverId) {
        conversation = await findConversation(senderId, receiverId);
    }

    if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const decisionData = {
        question,
        options: options.map((opt: string) => ({
            id: new mongoose.Types.ObjectId().toString(),
            text: opt,
            votes: []
        }))
    };

    const message = await Message.create({
        sender: senderId,
        receiver: receiverId || conversation.participants.find((p) => String(p) !== senderId),
        conversationId: conversation._id,
        messageType: "decision",
        decisionData
    });

    conversation.lastMessage = message._id as any;
    await conversation.save();

    await notifyReceivers(conversation, senderId, "new_decision", `Created a decision: ${question}`);
    handleConversationEvent(senderId, String(conversation._id), { type: "message", payload: message });

    res.status(201).json({ success: true, message });
}

export const voteDecision = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    const { optionId } = req.body;

    const messageDoc = await Message.findById(messageId);
    if (!messageDoc || messageDoc.messageType !== "decision" || !messageDoc.decisionData) {
        return res.status(404).json({ success: false, message: "Decision not found" });
    }
    const voterConversation = await Conversation.findOne({
        _id: messageDoc.conversationId,
        participants: { $in: [userId] },
    });
    if (!voterConversation) {
        return res.status(404).json({ success: false, message: "Decision not found" });
    }
    if (messageDoc.decisionData.status === "closed") {
        return res.status(400).json({ success: false, message: "Decision is closed" });
    }

    // Determine whether the user was already voting for this specific option
    const wasVotingForThis = messageDoc.decisionData.options
        .find(o => o.id === optionId)?.votes.includes(userId) ?? false;

    // Remove the user's vote from all options
    messageDoc.decisionData.options.forEach(opt => {
        opt.votes = opt.votes.filter(id => id !== userId);
    });

    // Re-add their vote only if it was not already on this option (toggle off if it was)
    if (!wasVotingForThis) {
        const selected = messageDoc.decisionData.options.find(o => o.id === optionId);
        selected?.votes.push(userId);
    }

    messageDoc.markModified("decisionData");
    await messageDoc.save();

    handleConversationEvent(userId, String(messageDoc.conversationId), { type: "message_update", payload: messageDoc });

    res.json({ success: true, message: messageDoc });
}

export const closeDecision = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;

    const messageDoc = await Message.findById(messageId);
    if (!messageDoc || messageDoc.messageType !== "decision" || !messageDoc.decisionData) {
        return res.status(404).json({ success: false, message: "Decision not found" });
    }

    const decisionConversation = await Conversation.findOne({
        _id: messageDoc.conversationId,
        participants: { $in: [userId] },
    });
    if (!decisionConversation) {
        return res.status(404).json({ success: false, message: "Decision not found" });
    }

    if (messageDoc.sender !== userId) {
        return res.status(403).json({ success: false, message: "Only the creator can close this decision" });
    }

    messageDoc.decisionData.status = "closed";
    messageDoc.markModified("decisionData");
    await messageDoc.save();

    const sorted = [...messageDoc.decisionData.options].sort((a, b) => b.votes.length - a.votes.length);
    const winnerText = sorted[0]?.text || "No winner";
    await notifyReceivers(decisionConversation, userId, "decision_closed", `Decision closed. Winner: ${winnerText}`);

    handleConversationEvent(userId, String(messageDoc.conversationId), { type: "message_update", payload: messageDoc });

    res.json({ success: true, message: messageDoc });
}

export const getMessages = async (req: AuthRequest, res: Response<ApiResponse<{ messages?: any[] }>>) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({
        _id: conversationId, participants: {
            $in: [userId]
        }
    })
    if (!conversation) {
        res.status(404).json({ success: false, message: "Conversation not found" });
        return
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    
    // Mark unread messages as read and notify their senders
    const unread = await Message.find({ conversationId, receiver: userId, read: false }, { sender: 1 });
    if (unread.length > 0) {
        await Message.updateMany({ conversationId, receiver: userId, read: false }, { read: true });
        // Notify each unique sender that their messages were read
        const senderIds = [...new Set(unread.map(m => String(m.sender)))];
        senderIds.forEach(senderId => {
            sendToUser(senderId, JSON.stringify({ type: "read_receipt", conversationId }));
        });
    }

    res.json({ success: true, messages });

}

// Delete a conversation
export const deleteConversation = async (req: AuthRequest, res: Response<ApiResponse>) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            res.status(404).json({ success: false, message: "Conversation not found" });
            return;
        }

        // Check if user is part of the conversation
        const isParticipant = conversation.participants.some((p) => String(p) === userId)
        if (!isParticipant) {
            res.status(403).json({ success: false, message: "Not authorized to delete this conversation" });
            return;
        }

        // Notify participant before the deleting 
        const payloadStr = JSON.stringify({ type: "chat_deleted", conversationId });
        conversation.participants.forEach((pId) => {
            sendToUser(String(pId), payloadStr);
        });
        invalidateConversationCache(String(conversationId));
        
        // Delete all messages    
        await Message.deleteMany({ conversationId });
        
        // Delete all notifications for this conversation
        await Notification.deleteMany({ conversationId });

        const space = await Space.findOne({ conversationId });
        if (space) {
            await Task.deleteMany({ spaceId: space._id });
            await Space.deleteOne({ _id: space._id });
        }
        
        // Delete the conversation itself 
        await Conversation.findByIdAndDelete(conversationId);
        res.json({ success: true, message: "Chat deleted Successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" })
    }
}


// Helper: find convo between two users
async function findConversation(userId: string, otherId: string) {
    return Conversation.findOne({
        $and: [
            { participants: { $elemMatch: { $eq: userId } } },
            { participants: { $elemMatch: { $eq: otherId } } },
            { $expr: { $eq: [{ $size: "$participants" }, 2] } }
        ]
    } as any)
}

import { sendToUser } from "../socket/socketManager.js";
// import { WebSocket } from "ws";

async function notifyReceivers(
    conversation: any, 
    senderId: string, 
    type: "new_message" | "new_decision" | "decision_closed" | "context_update", 
    contentStr: string
) {
    try {
        const senderDoc = await User.findById(senderId);
        let contextPrefix = "";
        if (conversation.contextType && conversation.contextType !== "chat" && conversation.context?.title) {
            let icon = "💬";
            if (conversation.contextType === "plan") icon = "🗺️";
            if (conversation.contextType === "event") icon = "📅";
            if (conversation.contextType === "study") icon = "📚";
            if (conversation.contextType === "project") icon = "💼";
            contextPrefix = `${icon} ${conversation.context.title} - `;
        }
        
        const text = `${contextPrefix}${senderDoc?.name}: ${contentStr}`;
        const receivers = conversation.participants.filter((p: any) => String(p._id || p) !== String(senderId));
        
        for (const recId of receivers) {
            const notif = new Notification({
                recipient: recId,
                sender: senderId,
                conversationId: conversation._id,
                type,
                content: text
            });
            await notif.save();
            await notif.populate("sender", "name avatar");
            
            sendToUser(String(recId), JSON.stringify({ type: "notification", payload: notif }));
        }
    } catch (err) {
        console.error("Error sending notification", err);
    }
}
