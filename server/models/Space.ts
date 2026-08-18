import mongoose, { Document, Model, Schema } from "mongoose";

export type SpaceStatus =
    | "discussing"
    | "deciding"
    | "executing"
    | "completed"
    | "archived";

export interface ISpace extends Document {
    conversationId: mongoose.Types.ObjectId;
    createdBy: string;
    title: string;
    goal?: string;
    deadline?: Date;
    status: SpaceStatus;
    completedAt?: Date;
    archivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SpaceSchema = new Schema<ISpace>({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        unique: true,
        index: true,
    },
    createdBy: { type: String, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    goal: { type: String, trim: true, maxlength: 500 },
    deadline: { type: Date },
    status: {
        type: String,
        enum: ["discussing", "deciding", "executing", "completed", "archived"],
        default: "discussing",
    },
    completedAt: { type: Date },
    archivedAt: { type: Date },
}, { timestamps: true });

SpaceSchema.index({ createdBy: 1, status: 1, updatedAt: -1 });

const Space: Model<ISpace> = mongoose.model("Space", SpaceSchema);

export default Space;
