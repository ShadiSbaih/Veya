import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Space from "../models/Space.js";

export async function getAccessibleSpace(spaceId: string, userId: string) {
    if (!mongoose.isValidObjectId(spaceId)) return null;

    const space = await Space.findById(spaceId);
    if (!space) return null;

    const conversation = await Conversation.findOne({
        _id: space.conversationId,
        participants: { $in: [userId] },
    });
    if (!conversation) return null;

    return { space, conversation };
}
