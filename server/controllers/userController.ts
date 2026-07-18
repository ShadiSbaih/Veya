import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import User from "../models/User.js";
import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";

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
// Update profile (name, bio, handle, avatar)
export const updateProfile = async (req: AuthRequest, res: Response) => {
    const { name, bio, handle } = req.body;
    const file = req.file;

    if (handle) {
        const handleExists = await User.findOne({ handle, _id: { $ne: req.user!.id } })
        if (handleExists) {
            res.status(400).json({ success: false, message: "Handle already in use" });
            return;
        }
    }

    let avatarUrl = "";
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
            console.error(error);
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
        { new: true }
    ).select("name email handle avatar bio isOnline lastSeen");

    res.json({ success: true, user: updatedUser });
}