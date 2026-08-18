import mongoose, { Document, Model, Schema } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ITask extends Document {
    spaceId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    assignee?: string;
    creator: string;
    status: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    sourceMessageId?: mongoose.Types.ObjectId;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
    spaceId: { type: Schema.Types.ObjectId, ref: "Space", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1000 },
    assignee: { type: String, ref: "User" },
    creator: { type: String, ref: "User", required: true },
    status: {
        type: String,
        enum: ["todo", "in_progress", "blocked", "done"],
        default: "todo",
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date },
    sourceMessageId: { type: Schema.Types.ObjectId, ref: "Message" },
    completedAt: { type: Date },
}, { timestamps: true });

TaskSchema.index({ spaceId: 1, status: 1, updatedAt: -1 });
TaskSchema.index({ assignee: 1, status: 1, dueDate: 1 });

const Task: Model<ITask> = mongoose.model("Task", TaskSchema);

export default Task;
