export interface User {
    _id: string;
    name: string;
    email: string;
    handle: string;
    avatar?: string;
    bio?: string;
    isOnline: boolean;
    lastSeen: string;
}

export interface DecisionOption {
    id: string;
    text: string;
    votes: string[]; // User IDs of voters
}

export interface DecisionData {
    question: string;
    options: DecisionOption[];
}

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
    _id: string;
    spaceId: string;
    title: string;
    description?: string;
    assignee?: string;
    creator: string;
    status: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    sourceMessageId?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    _id: string;
    sender: string;
    receiver: string;
    text?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    messageType?: "text" | "decision";
    decisionData?: DecisionData;
    entityType?: "task" | "decision" | "agreement" | "question" | "event" | "resource";
    entityId?: string;
    read: boolean;
    createdAt: string;
    conversationId: string;
}

// ─── Contextual Conversation Types ───────────────────────────────────────────

export type ConversationContextType =
    | "chat"
    | "plan"
    | "event"
    | "decision"
    | "study"
    | "project";

export type ConversationStatus = "active" | "completed" | "archived";

export type SpaceStatus =
    | "discussing"
    | "deciding"
    | "executing"
    | "completed"
    | "archived";

export interface Space {
    _id: string;
    conversationId: string;
    createdBy: string;
    title: string;
    goal?: string;
    deadline?: string;
    status: SpaceStatus;
    completedAt?: string;
    archivedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Embedded context metadata — all optional
export interface ConversationContext {
    title?: string;
    description?: string;
    date?: string;       // ISO date string or human-readable
    time?: string;       // e.g. "09:00 AM"
    location?: string;   // free-text location name
    course?: string;     // used by "study" context
    deadline?: string;   // ISO date string, used by "project" / "study"
    expiresAt?: string;  // ISO date string
}

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface Conversation {
    _id: string;
    isGroup?: boolean;
    participants?: User[];      // Full list of participants for groups
    participant?: User;         // For 1-on-1 chats (fallback)
    lastMessage?: Message;
    updatedAt: string;
    // Contextual fields — optional so existing usage is backward-compatible
    contextType?: ConversationContextType;
    context?: ConversationContext;
    status?: ConversationStatus;
    space?: Space;
}

export interface Story {
    _id: string;
    user: User;
    mediaUrl: string;
    mediaType: "image" | "video";
    createdAt: string;
}

export interface UserStory {
    user: User;
    stories: Story[];
}

export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
}

export interface WsEvent {
    type: string;
    payload?: any;
    senderId?: string;
    isTyping?: boolean;
    userId?: string;
    isOnline?: boolean;
    user?: User;
    conversationId?: string;
    [key: string]: any;
}

export interface Notification {
    _id: string;
    recipient: string;
    sender?: User;
    conversationId?: string;
    type: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}
