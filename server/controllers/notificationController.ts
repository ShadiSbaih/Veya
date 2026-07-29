import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import Notification from "../models/Notification.js";

export const getNotifications = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const notifications = await Notification.find({ recipient: userId })
        .populate("sender", "name avatar")
        .sort({ createdAt: -1 })
        .limit(50);
    res.json({ success: true, notifications });
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    res.json({ success: true });
};
