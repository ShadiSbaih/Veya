import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Context Types ────────────────────────────────────────────────────────────

export type ConversationContextType =
    | "chat"
    | "plan"
    | "event"
    | "decision"
    | "study"
    | "project";

export type ConversationStatus = "active" | "completed" | "archived";

// Embedded metadata — all fields optional so existing records are unaffected
export interface IConversationContext {
    title?: string;
    description?: string;
    date?: string;       // ISO date string or human-readable date
    time?: string;       // e.g. "09:00 AM"
    location?: string;  // free-text location name
    course?: string;     // used by "study" context
    deadline?: string;   // ISO date string, used by "project" / "study"
    expiresAt?: string;  // ISO date string
}

// ─── Conversation Document ────────────────────────────────────────────────────

export interface IConversation extends Document {
    participants: string[];
    lastMessage?: mongoose.Types.ObjectId;
    updatedAt: Date;
    // Contextual fields (additive — all optional, backward-compatible)
    contextType: ConversationContextType;
    context?: IConversationContext;
    status: ConversationStatus;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ConversationContextSchema = new Schema<IConversationContext>({
    title:       { type: String, trim: true },
    description: { type: String, trim: true },
    date:        { type: String },
    time:        { type: String },
    location:    { type: String, trim: true },
    course:      { type: String, trim: true },
    deadline:    { type: String },
    expiresAt:   { type: String },
}, { _id: false }) // embedded — no separate _id

const ConversationSchema = new Schema<IConversation>({
    participants: [{ type: String, ref: "User", required: true }],
    lastMessage:  { type: Schema.Types.ObjectId, ref: "Message" },
    // New contextual fields — all have defaults so existing documents read fine
    contextType: {
        type: String,
        enum: ["chat", "plan", "event", "decision", "study", "project"],
        default: "chat",
    },
    context: { type: ConversationContextSchema, default: undefined },
    status: {
        type: String,
        enum: ["active", "completed", "archived"],
        default: "active",
    },
}, { timestamps: true })

// Existing index preserved
ConversationSchema.index({ participants: 1 })

const Conversation: Model<IConversation> = mongoose.model("Conversation",
    ConversationSchema)

export default Conversation;