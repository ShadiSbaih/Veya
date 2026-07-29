import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
    recipient: string;
    sender?: string;
    conversationId?: mongoose.Types.ObjectId;
    type: "new_message" | "new_decision" | "decision_closed" | "context_update";
    content: string;
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    recipient: { type: String, ref: "User", required: true },
    sender: { type: String, ref: "User" },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    type: { type: String, required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

const Notification: Model<INotification> = mongoose.model("Notification", NotificationSchema);
export default Notification;
