import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.js";
import Message from "../models/Message.js";
import Task, { TaskPriority, TaskStatus } from "../models/Task.js";
import { getAccessibleSpace } from "../utils/spaceAccess.js";

const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

function parseOptionalDate(value: unknown): Date | undefined | null {
    if (value === undefined || value === null || value === "") return undefined;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
}

function serializeTask(task: any) {
    return {
        _id: String(task._id),
        spaceId: String(task.spaceId),
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        creator: task.creator,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        sourceMessageId: task.sourceMessageId ? String(task.sourceMessageId) : undefined,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
    };
}

function participantExists(participants: mongoose.Types.ObjectId[] | string[], userId: string) {
    return participants.some((participant) => String(participant) === String(userId));
}

async function validateTaskInput(
    body: any,
    participants: mongoose.Types.ObjectId[] | string[],
) {
    const { title, description, assignee, status, priority } = body;
    const dueDate = parseOptionalDate(body.dueDate);

    if (!title || typeof title !== "string" || !title.trim()) {
        return { error: "Task title is required" };
    }
    if (description !== undefined && typeof description !== "string") {
        return { error: "Task description must be text" };
    }
    if (assignee !== undefined && assignee !== null && !participantExists(participants, String(assignee))) {
        return { error: "Assignee must be a Space participant" };
    }
    if (status !== undefined && !TASK_STATUSES.includes(status)) {
        return { error: "Invalid task status" };
    }
    if (priority !== undefined && !TASK_PRIORITIES.includes(priority)) {
        return { error: "Invalid task priority" };
    }
    if (dueDate === null) return { error: "Due date must be valid" };

    return {
        title: title.trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : undefined,
        assignee: assignee ? String(assignee) : undefined,
        status: status as TaskStatus | undefined,
        priority: priority as TaskPriority | undefined,
        dueDate,
    };
}

export const createTask = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { spaceId, sourceMessageId } = req.body;
    const access = await getAccessibleSpace(String(spaceId), userId);
    if (!access) return res.status(404).json({ success: false, message: "Space not found" });

    const input = await validateTaskInput(req.body, access.conversation.participants);
    if ("error" in input) return res.status(400).json({ success: false, message: input.error });

    let sourceMessage;
    if (sourceMessageId !== undefined) {
        if (!mongoose.isValidObjectId(String(sourceMessageId))) {
            return res.status(400).json({ success: false, message: "Source message is invalid" });
        }
        sourceMessage = await Message.findOne({
            _id: sourceMessageId,
            conversationId: access.space.conversationId,
        });
        if (!sourceMessage) return res.status(404).json({ success: false, message: "Source message not found" });
    }

    const task = await Task.create({
        spaceId: access.space._id,
        title: input.title,
        description: input.description,
        assignee: input.assignee,
        creator: userId,
        status: input.status || "todo",
        priority: input.priority || "medium",
        dueDate: input.dueDate || undefined,
        sourceMessageId: sourceMessage?._id,
    });

    if (sourceMessage) {
        sourceMessage.entityType = "task";
        sourceMessage.entityId = task._id as any;
        await sourceMessage.save();
    }

    return res.status(201).json({ success: true, task: serializeTask(task) });
};

export const createTaskFromMessage = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    const { spaceId } = req.body;
    if (!mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({ success: false, message: "Message is invalid" });
    }

    const access = await getAccessibleSpace(String(spaceId), userId);
    if (!access) return res.status(404).json({ success: false, message: "Space not found" });

    const message = await Message.findOne({ _id: messageId, conversationId: access.space.conversationId });
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    if (!message.text?.trim()) {
        return res.status(400).json({ success: false, message: "Only text messages can become tasks" });
    }

    const body = {
        ...req.body,
        title: req.body.title || message.text.trim().slice(0, 160),
        sourceMessageId: messageId,
    };
    const input = await validateTaskInput(body, access.conversation.participants);
    if ("error" in input) return res.status(400).json({ success: false, message: input.error });

    const task = await Task.create({
        spaceId: access.space._id,
        title: input.title,
        description: input.description,
        assignee: input.assignee,
        creator: userId,
        status: input.status || "todo",
        priority: input.priority || "medium",
        dueDate: input.dueDate || undefined,
        sourceMessageId: message._id,
    });

    message.entityType = "task";
    message.entityId = task._id as any;
    await message.save();

    return res.status(201).json({ success: true, task: serializeTask(task) });
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    const access = await getAccessibleSpace(String(req.params.spaceId), req.user!.id);
    if (!access) return res.status(404).json({ success: false, message: "Space not found" });

    const tasks = await Task.find({ spaceId: access.space._id }).sort({ status: 1, dueDate: 1, updatedAt: -1 });
    return res.json({ success: true, tasks: tasks.map(serializeTask) });
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    const access = await getAccessibleSpace(String(task.spaceId), req.user!.id);
    if (!access) return res.status(404).json({ success: false, message: "Task not found" });

    const { title, description, assignee, status, priority } = req.body;
    const dueDate = parseOptionalDate(req.body.dueDate);
    if (dueDate === null) return res.status(400).json({ success: false, message: "Due date must be valid" });
    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
        return res.status(400).json({ success: false, message: "Task title cannot be empty" });
    }
    if (description !== undefined && typeof description !== "string") {
        return res.status(400).json({ success: false, message: "Task description must be text" });
    }
    if (assignee !== undefined && assignee !== null && !participantExists(access.conversation.participants, String(assignee))) {
        return res.status(400).json({ success: false, message: "Assignee must be a Space participant" });
    }
    if (status !== undefined && !TASK_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid task status" });
    }
    if (priority !== undefined && !TASK_PRIORITIES.includes(priority)) {
        return res.status(400).json({ success: false, message: "Invalid task priority" });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim() || undefined;
    if (assignee !== undefined) task.assignee = assignee ? String(assignee) : undefined;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || undefined;
    if (task.status === "done") task.completedAt ??= new Date();
    else task.completedAt = undefined;

    await task.save();
    return res.json({ success: true, task: serializeTask(task) });
};
