import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import User from "../models/User.js";

import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import { broadcastUserUpdate } from "../socket/socketManager.js";

// Get all users
export const getUsers = async (req: AuthRequest, res: Response) => {
    const users = await User.find({ _id: { $ne: req.user!.id } }).select("name email handle avatar bio isOnline lastSeen")
    res.json({ success: true, users })
}

// Get current user's profile
export const getProfile = async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id);
    if (!user) {
        res.status(404).json({ success: false, message: "User not found" })
    }
    res.json({ success: true, user })
}

// Search users
export const searchUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.query;
        if (!query) {
            res.json({ success: true, users: [] });
            return;
        }

        const regex = new RegExp(query as string, 'i');
        const users = await User.find({
            $and: [
                { _id: { $ne: req.user!.id } },
                {
                    $or: [
                        { name: regex },
                        { handle: regex },
                        { email: regex }
                    ]
                }
            ]
        }).select("name email handle avatar bio isOnline lastSeen").limit(20);

        res.json({ success: true, users });
    } catch (error) {
        console.error("Error in searchUsers:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
// Update profile (name, bio, handle, avatar)
export const updateProfile = async (req: AuthRequest, res: Response) => {
    console.log("=== updateProfile called ===");
    console.log("Content-Type header:", req.headers['content-type']);
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    const { name, bio, handle, avatarUrl: bodyAvatarUrl } = req.body;
    const file = req.file;

    if (handle) {
        const handleExists = await User.findOne({ handle, _id: { $ne: req.user!.id } })
        if (handleExists) {
            res.status(400).json({ success: false, message: "Handle already in use" });
            return;
        }
    }

    let avatarUrl = bodyAvatarUrl || "";
    if (file) {
        try {
            const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder:
                        "insta_chat_avatars"
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
            avatarUrl = result.secure_url;
        } catch (error) {
            console.error("Cloudinary upload error in User Controller :", error);
            res.status(500).json({ success: false, message: "Failed to upload avatar" });
            return;
        }

    }

    const updateData: any = {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(handle && { handle: handle.toLowerCase().trim() })
    }
    if (avatarUrl) {
        updateData.avatar = avatarUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user!.id,
        updateData,
        { returnDocument: 'after' }
    ).select("name email handle avatar bio isOnline lastSeen");

    if (updateData) {
        broadcastUserUpdate(updateData)
    }

    res.json({ success: true, user: updatedUser });
}