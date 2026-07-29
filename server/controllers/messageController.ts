import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.js";
import Conversation from "../models/Conversation.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import Message from "../models/Message.js";
import { handleConversationEvent } from "../socket/socketManager.js";

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
        }
    })
}

// Get all conversations for the current user
export const getConversations = async (req: AuthRequest, res: Response<ApiResponse<{ conversations?: any[] }>>) => {
    const userId = req.user!.id;
    const conversations = await Conversation.find({ participants: { $in: [userId] } }).populate
        ("participants", "name email handle avatar isOnline lastSeen").populate("lastMessage").
        sort({ updatedAt: -1 })

    const shaped = conversations.map((c) => {
        const other = (c.participants as any[]).find((p: any) => String(p._id) !== userId);
        return {
            _id: c._id,
            isGroup: false,
            participant: other,
            lastMessage: c.lastMessage,
            updatedAt: c.updatedAt,
            // Contextual fields
            contextType: c.contextType,
            context: c.context,
            status: c.status,
        }
    })

    res.json({ success: true, conversations: shaped })
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
            res.json({
                success: true,
                conversation: {
                    _id: existing._id,
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

    res.status(201).json({
        success: true,
        conversation: {
            _id: conversation._id,
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
            const resourceType = file.mimetype.startsWith("video") ? "video" : "image";
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

    res.status(201).json({ success: true, message });
}

// get messages
export const createDecision = async (req: AuthRequest, res: Response) => {
    const senderId = req.user!.id;
    const { receiverId, question, options } = req.body;

    if (!receiverId || !question || !options || !Array.isArray(options)) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const conversation = await findConversation(senderId, receiverId);
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
        receiver: receiverId,
        conversationId: conversation._id,
        messageType: "decision",
        decisionData
    });

    conversation.lastMessage = message._id as any;
    await conversation.save();

    res.status(201).json({ success: true, message });
}

export const voteDecision = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    const { optionId } = req.body;

    const message = await Message.findById(messageId);
    if (!message || message.messageType !== "decision" || !message.decisionData) {
        return res.status(404).json({ success: false, message: "Decision not found" });
    }

    // Toggle vote
    let voted = false;
    message.decisionData.options.forEach(opt => {
        // Remove existing vote for this user on any option
        opt.votes = opt.votes.filter(id => id !== userId);
        
        // Add to selected option
        if (opt.id === optionId) {
            opt.votes.push(userId);
            voted = true;
        }
    });

    // If user clicked the option they already voted for, it was removed above.
    // If we wanted to allow them to cancel their vote, we'd need to check if they
    // were already voting for this option. Let's make it a toggle.
    
    // Actually, to make it a toggle:
    // If the user already had a vote on optionId, they want to remove it.
    // Let's refactor:
    
    const messageDoc = await Message.findById(messageId);
    if (!messageDoc || messageDoc.messageType !== "decision" || !messageDoc.decisionData) return res.status(404).json({success: false});

    let hasVotedForThis = false;
    messageDoc.decisionData.options.forEach(opt => {
        if (opt.id === optionId && opt.votes.includes(userId)) {
            hasVotedForThis = true;
        }
        // Remove from all
        opt.votes = opt.votes.filter(id => id !== userId);
    });

    // If they hadn't voted for this specific option, add the vote
    if (!hasVotedForThis) {
        const selectedOpt = messageDoc.decisionData.options.find(opt => opt.id === optionId);
        if (selectedOpt) {
            selectedOpt.votes.push(userId);
        }
    }

    // Force Mongoose to recognize the sub-document change
    messageDoc.markModified("decisionData");
    await messageDoc.save();

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
    await Message.updateMany({ conversationId, receiver: userId, read: false }, { read: true })

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
        await handleConversationEvent(userId, String(conversationId), { type: "chat_deleted", conversationId })
        
        // Delete all messages    
        await Message.deleteMany({ conversationId });
        
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