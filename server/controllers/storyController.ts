import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import Story from "../models/Story.js";

// Create a new story
export const createStory = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
        res.status(400).json({ success: false, message: "Media files is required" })
        return
    }

    try {
        const resourceType = file.mimetype.startsWith("video") ? "video" : "image";

        const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder:
                    "insta_chat_stories", resource_type: resourceType
            }, (error, result) => {
                if (error) reject(error)
                else resolve(result as any)
            })
            const readableStream = new Readable()
            readableStream.push(file.buffer)
            readableStream.push(null)
            readableStream.pipe(uploadStream)
        })

        const result = await uploadPromise;
        const story = await Story.create({
            user: userId,
            mediaUrl: result.secure_url,
            mediaType: resourceType,
        })

        await story.populate("user", "name avatar handle")
        res.status(201).json({ success: true, story })
    } catch (err) {
        console.error("Story upload error:", err);
        res.status(500).json({ success: false, message: "Story upload failed" });
        return
    }
}

// Get all recent stories (grouped by user, last 24 h only)
export const getStories = async (req: AuthRequest, res: Response) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 h ago
    const stories = await Story.find({ createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .populate("user", "name avatar handle");

    // Group stories by user
    const grouped: any = {};
    stories.forEach((s: any) => {
        const uid = String(s.user._id);
        if (!grouped[uid]) {
            grouped[uid] = {
                user: s.user,
                stories: []
            }
        }
        grouped[uid].stories.push(s);
    })
    res.json({ success: true, stories: Object.values(grouped) })
}