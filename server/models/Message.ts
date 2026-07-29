import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDecisionOption {
    id: string;
    text: string;
    votes: string[]; // User IDs of voters
}

export interface IDecisionData {
    question: string;
    options: IDecisionOption[];
}

export interface IMessage extends Document {
    sender: string;
    receiver?: string;
    conversationId: mongoose.Types.ObjectId;
    text?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    // New fields for Contextual Artifacts (Decisions)
    messageType?: "text" | "decision";
    decisionData?: IDecisionData;
    read: boolean;
    createdAt: Date;
}

const DecisionOptionSchema = new Schema<IDecisionOption>({
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: [{ type: String }]
}, { _id: false });

const DecisionDataSchema = new Schema<IDecisionData>({
    question: { type: String, required: true },
    options: [DecisionOptionSchema]
}, { _id: false });

const MessageSchema = new Schema<IMessage>({
    sender: { type: String, ref: "User", required: true },
    receiver: { type: String, ref: "User" },
    conversationId: {
        type: Schema.Types.ObjectId, ref: "Conversation",
        required: true
    },
    text: { type: String, trim: true },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video"] },
    messageType: { type: String, enum: ["text", "decision"], default: "text" },
    decisionData: { type: DecisionDataSchema },
    read: { type: Boolean, default: false },
}, { timestamps: true })

const Message: Model<IMessage> = mongoose.model("Message", MessageSchema)

export default Message