import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.js";
import Conversation from "../models/Conversation.js";
import Space, { SpaceStatus } from "../models/Space.js";

const SPACE_STATUSES: SpaceStatus[] = [
    "discussing",
    "deciding",
    "executing",
    "completed",
    "archived",
];

function parseOptionalDate(value: unknown): Date | undefined | null {
    if (value === undefined || value === null || value === "") return undefined;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
}

function serializeSpace(space: any) {
    return {
        _id: String(space._id),
        conversationId: String(space.conversationId),
        createdBy: String(space.createdBy),
        title: space.title,
        goal: space.goal,
        deadline: space.deadline,
        status: space.status,
        completedAt: space.completedAt,
        archivedAt: space.archivedAt,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
    };
}

async function findParticipantConversation(conversationId: string, userId: string) {
    if (!mongoose.isValidObjectId(conversationId)) return null;
    return Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] },
    });
}

export const createSpace = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId, title, goal } = req.body;
    const deadline = parseOptionalDate(req.body.deadline);

    if (!conversationId || !title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ success: false, message: "A conversation and Space title are required" });
    }
    if (deadline === null) {
        return res.status(400).json({ success: false, message: "Deadline must be a valid date" });
    }
    if (goal !== undefined && typeof goal !== "string") {
        return res.status(400).json({ success: false, message: "Goal must be text" });
    }

    const conversation = await findParticipantConversation(String(conversationId), userId);
    if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const existing = await Space.findOne({ conversationId: conversation._id });
    if (existing) {
        return res.status(409).json({ success: false, message: "This conversation is already a Space", space: serializeSpace(existing) });
    }

    const space = await Space.create({
        conversationId: conversation._id,
        createdBy: userId,
        title: title.trim(),
        goal: typeof goal === "string" && goal.trim() ? goal.trim() : undefined,
        deadline: deadline || undefined,
    });

    return res.status(201).json({ success: true, space: serializeSpace(space) });
};

export const getSpaces = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const conversations = await Conversation.find(
        { participants: { $in: [userId] } },
        { _id: 1 },
    );
    const conversationIds = conversations.map((conversation) => conversation._id);
    const spaces = await Space.find({ conversationId: { $in: conversationIds } }).sort({ updatedAt: -1 });

    return res.json({ success: true, spaces: spaces.map(serializeSpace) });
};

export const getSpaceByConversation = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const conversation = await findParticipantConversation(String(req.params.conversationId), userId);
    if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const space = await Space.findOne({ conversationId: conversation._id });
    if (!space) {
        return res.status(404).json({ success: false, message: "Space not found" });
    }

    return res.json({ success: true, space: serializeSpace(space) });
};

export const updateSpace = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const space = await Space.findById(req.params.spaceId);
    if (!space) {
        return res.status(404).json({ success: false, message: "Space not found" });
    }

    const conversation = await findParticipantConversation(String(space.conversationId), userId);
    if (!conversation) {
        return res.status(404).json({ success: false, message: "Space not found" });
    }

    const { title, goal, status } = req.body;
    const deadline = parseOptionalDate(req.body.deadline);
    if (deadline === null) {
        return res.status(400).json({ success: false, message: "Deadline must be a valid date" });
    }
    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
        return res.status(400).json({ success: false, message: "Title cannot be empty" });
    }
    if (goal !== undefined && typeof goal !== "string") {
        return res.status(400).json({ success: false, message: "Goal must be text" });
    }
    if (status !== undefined && !SPACE_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid Space status" });
    }

    if (title !== undefined) space.title = title.trim();
    if (goal !== undefined) space.goal = goal.trim() || undefined;
    if (deadline !== undefined) space.deadline = deadline || undefined;
    if (status !== undefined) space.status = status;

    if (space.status === "completed") {
        space.completedAt ??= new Date();
    } else {
        space.completedAt = undefined;
    }
    if (space.status === "archived") {
        space.archivedAt ??= new Date();
    } else {
        space.archivedAt = undefined;
    }

    await space.save();
    return res.json({ success: true, space: serializeSpace(space) });
};
