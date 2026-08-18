# Veya — Conversations That Produce Outcomes

A full-stack, cross-platform collaboration app built with **Expo** (iOS · Android · Web) and a **Node.js / Express** backend. Veya combines real-time messaging, contextual conversations, collaborative decisions, Spaces, tasks, and outcome-focused workflows in one place.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1 — Clone the repo](#1--clone-the-repo)
  - [2 — Server setup](#2--server-setup)
  - [3 — Client setup](#3--client-setup)
  - [4 — Run](#4--run)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Data Models](#data-models)
- [Key Design Decisions](#key-design-decisions)

---

## Features

| Category | Feature |
|---|---|
| **Auth** | Clerk-powered sign-in / sign-up; lazy user sync to MongoDB on first request |
| **Messaging** | 1-on-1 and group chats; text + image/video attachments via Cloudinary |
| **Real-time** | WebSocket push for new messages, typing indicators, online/offline presence, read receipts, chat deletions, and user profile updates |
| **Stories** | 24-hour ephemeral image/video stories with per-user grouping; web-compatible upload |
| **Decisions** | In-chat polls — create options, vote (toggle), and close with winner announcement |
| **Spaces & tasks** | Turn a conversation into a Space with a goal, lifecycle status, deadline, and actionable tasks |
| **Contextual conversations** | Tag a chat as a **Plan / Event / Study / Project / Decision** with structured metadata (title, date, location, deadline…) |
| **Notifications** | Persistent in-app notifications with unread badge counter; real-time delivery over WS |
| **Profile** | Editable name, handle, bio, and avatar; updates broadcast to all connected peers instantly |
| **Multi-device** | Same account can be open on multiple devices/tabs simultaneously — all receive messages |
| **Cross-platform** | Single codebase runs on iOS, Android, and web browser |

---

## Tech Stack

### Client

| | |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 + [Expo Router](https://expo.github.io/router) v6 (file-based navigation) |
| UI | React Native 0.81 + React Native Web; Expo Linear Gradient; `@expo/vector-icons` |
| Branding | Veya app icon, adaptive Android icon, monochrome icon, splash mark, and web favicon |
| Auth | `@clerk/expo` v3 |
| HTTP | Axios (with automatic Clerk JWT injection via request interceptor) |
| Real-time | Native browser `WebSocket` API |
| Media | `expo-image-picker`, `expo-file-system` |
| State | React Context + `useRef` / `useState` (no external state library) |
| Language | TypeScript 5.9 |

### Server

| | |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 5 |
| Database | MongoDB Atlas via Mongoose 9 |
| Auth | `@clerk/express` — `clerkMiddleware` + `verifyToken` for WS |
| Real-time | `ws` v8 WebSocket server (shared HTTP server) |
| File storage | Cloudinary v2 (avatars, message media, stories) |
| File upload | Multer (in-memory buffer) → streamed to Cloudinary |
| Language | TypeScript 7 compiled on-the-fly by `tsx` / `nodemon` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Client (Expo)                    │
│                                                     │
│   AppContext                                        │
│   ├─ Axios (HTTP + Clerk JWT)  ──► REST API         │
│   └─ WebSocket (ws://)         ──► WS Server        │
└─────────────────────────────────────────────────────┘
                         │ HTTP + WS
                         ▼
┌─────────────────────────────────────────────────────┐
│               Express Server (port 3000)            │
│                                                     │
│   ┌─ REST Routes ──────────────────────────────┐   │
│   │  /api/users   /api/messages                │   │
│   │  /api/stories /api/notifications           │   │
│   └────────────────────────────────────────────┘   │
│                                                     │
│   ┌─ WebSocket Server (/ws) ───────────────────┐   │
│   │  Map<userId, Set<WebSocket>>               │   │
│   │  Participant cache (Map<convId, string[]>) │   │
│   └────────────────────────────────────────────┘   │
│                                                     │
│   MongoDB Atlas  ◄──────────────────────────────   │
│   Cloudinary     ◄──────────────────────────────   │
└─────────────────────────────────────────────────────┘
```

**Authentication flow:**
1. Clerk issues a JWT to the client.
2. Every HTTP request attaches it as `Authorization: Bearer <token>` via an Axios interceptor.
3. `authMiddleware` calls Clerk's `getAuth()` to verify the token, then lazy-creates a MongoDB `User` document if it doesn't exist yet.
4. The WebSocket handshake passes the token as a query param (`/ws?token=…`); `verifyToken` validates it server-side before registering the socket.

---

## Project Structure

```
chat app/
├── client/                        # Expo app
│   ├── app/
│   │   ├── (auth)/                # Sign-in / sign-up screens
│   │   ├── (tabs)/
│   │   │   ├── index.tsx          # Conversations list
│   │   │   ├── search.tsx         # User search + new chat
│   │   │   ├── notifications.tsx  # Notification feed
│   │   │   └── profile.tsx        # Profile + edit
│   │   └── chat/[id].tsx          # Chat screen
│   ├── components/
│   │   ├── StoriesBar.tsx         # Horizontal stories strip
│   │   ├── StoryViewer.tsx        # Full-screen story viewer
│   │   ├── ChatBubble.tsx         # Message bubble (text / media / decision)
│   │   ├── ContextHeader.tsx      # Contextual conversation banner
│   │   ├── ContextCreationModal.tsx
│   │   ├── DecisionCreationModal.tsx
│   │   ├── message-actions-sheet.tsx
│   │   ├── space-header.tsx        # Space status and task progress
│   │   ├── space-creation-modal.tsx
│   │   ├── task-creation-modal.tsx
│   │   ├── ConverstaionItem.tsx   # Conversation list row
│   │   ├── Avatar.tsx
│   │   └── SearchBar.tsx
│   ├── context/
│   │   └── AppContext.tsx         # Global state + WS lifecycle + Axios instance
│   ├── constants/
│   │   └── config.ts              # API_BASE_URL / WS_URL (platform-aware)
│   └── assets/
│       ├── types/                 # Shared TypeScript interfaces
│       ├── styles/                # StyleSheet files per screen
│       └── constants/Colors.ts   # Design token palette
│
└── server/                        # Express API + WS server
    ├── server.ts                  # Entry point — one shared http.Server
    ├── socket/
    │   └── socketManager.ts       # WS server, online-user map, event relay
    ├── controllers/
    │   ├── messageController.ts   # Conversations, messages, decisions
    │   ├── userController.ts      # Profile CRUD + broadcast
    │   ├── storyController.ts     # Story upload + grouped feed
    │   ├── notificationController.ts
    │   ├── spaceController.ts     # Space lifecycle
    │   └── taskController.ts      # Task creation and updates
    ├── models/
    │   ├── User.ts
    │   ├── Conversation.ts        # Supports contextual metadata + status
    │   ├── Message.ts             # Supports text / media / decision types
    │   ├── Notification.ts
    │   ├── Story.ts
    │   ├── Space.ts
    │   └── Task.ts
    ├── middlewares/
    │   ├── auth.ts                # Clerk verification + lazy user sync
    │   └── upload.ts              # Multer (memory storage)
    └── routes/
        ├── messageRoutes.ts
        ├── userRouter.ts
        ├── storyRoutes.ts
        ├── notificationRoutes.ts
        ├── spaceRoutes.ts
        └── taskRoutes.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **Expo CLI** — use the project-local `npx expo` command; a global Expo CLI install is not required
- A [Clerk](https://clerk.com) account (free tier is fine)
- A [MongoDB Atlas](https://cloud.mongodb.com) cluster
- A [Cloudinary](https://cloudinary.com) account (free tier is fine)

---

### 1 — Clone the repo

```bash
git clone https://github.com/ShadiSbaih/Risal.git
cd "chat app"
```

---

### 2 — Server setup

```bash
cd server
npm install
```

Create `server/.env` (see [Environment Variables](#environment-variables) below), then:

```bash
npm run server        # starts with nodemon + tsx hot-reload
```

The server listens on **`http://localhost:3000`**.  
WebSocket endpoint: **`ws://localhost:3000/ws`**

---

### 3 — Client setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Then update `client/constants/config.ts` with your local machine's IP address so physical devices can reach the server:

```typescript
const HOST = Platform.select({
    ios: "192.168.x.x",       // ← your LAN IP
    android: "192.168.x.x",   // ← your LAN IP
    default: "localhost",      // web browser
});
```

---

### 4 — Run

**Web browser (fastest for development):**
```bash
cd client
npm run web
```

**iOS simulator:**
```bash
npm run ios
```

**Android emulator:**
```bash
npm run android
```

**Physical device with Expo Go:**
Run `npm start`, install [Expo Go](https://expo.dev/go), and scan the QR code. Expo Go is useful for development but does not install Veya as a standalone launcher app.

**Standalone Android/iOS development build:**
Use `npm run android` or `npm run ios`. The Veya app name, launcher icon, adaptive icon, splash screen, and web favicon are configured in `client/app.json`. Rebuild after changing native branding.

---

## Environment Variables

### `server/.env`

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# Clerk backend keys — from Clerk Dashboard → API Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Cloudinary — from Cloudinary Dashboard → Settings → API Keys
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### `client/.env`

```env
# Clerk frontend key — same publishable key as above
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## API Reference

All routes (except `/`) require a valid Clerk JWT in the `Authorization: Bearer <token>` header.

### Users — `/api/users`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List all users (excluding self); online status from live WS map |
| `GET` | `/search?query=` | Search users by name, handle, or email |
| `GET` | `/profile` | Get own profile from MongoDB |
| `PUT` | `/profile` | Update name, handle, bio, avatar (multipart/form-data); broadcasts `user_update` to all peers |

### Messages — `/api/messages`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/conversations` | All conversations for the current user |
| `GET` | `/conversations/:id` | Single conversation by ID |
| `GET` | `/conversations/:id/messages` | Message history; marks received messages as read + emits `read_receipt` WS event |
| `GET` | `/conversations/with/:targetUserId` | Get or create a 1-on-1 conversation |
| `POST` | `/` | Create a conversation (1-on-1 or group, with optional contextual metadata) |
| `POST` | `/send` | Send a message (text and/or media attachment) |
| `PATCH` | `/conversations/:id/status` | Update conversation status (`active` \| `completed` \| `archived`) |
| `PATCH` | `/conversations/:id/context` | Update contextual metadata (type + context object) |
| `DELETE` | `/conversations/:id` | Delete conversation + all messages + notifications; emits `chat_deleted` WS event |
| `POST` | `/decision` | Create a poll/decision message |
| `POST` | `/decision/:messageId/vote` | Toggle a vote on a decision option |
| `PATCH` | `/decision/:messageId/close` | Close a decision; winner notification sent |

### Stories — `/api/stories`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Grouped stories from the last 24 hours |
| `POST` | `/` | Upload a new story (multipart/form-data, field: `file`) |

### Notifications — `/api/notifications`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Last 50 notifications for the current user |
| `PATCH` | `/read` | Mark all notifications as read |

### Spaces — `/api/spaces`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List the current user's Spaces |
| `POST` | `/` | Create a Space for a conversation |
| `GET` | `/:conversationId` | Get the Space attached to a conversation |
| `PATCH` | `/item/:spaceId` | Update Space title, goal, deadline, or lifecycle status |

### Tasks — `/api/tasks`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/space/:spaceId` | List tasks in a Space |
| `POST` | `/` | Create a task in a Space |
| `POST` | `/from-message/:messageId` | Convert a message into a task |
| `PATCH` | `/:taskId` | Update task status, priority, assignee, or due date |

---

## WebSocket Events

The client connects to `ws://<host>:3000/ws?token=<clerk_jwt>`.

### Client → Server

```jsonc
// Send or relay a chat message
{ "type": "message", "conversationId": "...", "payload": { /* message */ } }

// Typing indicator
{ "type": "typing", "conversationId": "...", "isTyping": true | false }
```

### Server → Client

| Event type | Payload | Description |
|---|---|---|
| `message` | `{ payload: Message }` | New incoming message |
| `message_update` | `{ payload: Message }` | Message mutated (vote, decision closed) |
| `typing` | `{ senderId, isTyping }` | Typing indicator from a peer |
| `online_status` | `{ userId, isOnline }` | User came online or went offline |
| `user_update` | `{ user: User }` | A peer updated their profile |
| `chat_deleted` | `{ conversationId }` | A conversation was deleted |
| `notification` | `{ payload: Notification }` | New notification (new message, decision, etc.) |
| `read_receipt` | `{ conversationId }` | Receiver opened the chat; sender's messages are now read |

---

## Data Models

### User
```typescript
{ _id: string (Clerk userId), name, email, handle, avatar, bio, isOnline, lastSeen }
```

### Conversation
```typescript
{
  participants: string[],
  lastMessage: ObjectId,
  contextType: "chat" | "plan" | "event" | "decision" | "study" | "project",
  context?: { title, description, date, time, location, course, deadline, expiresAt },
  status: "active" | "completed" | "archived"
}
```

### Message
```typescript
{
  sender, receiver, conversationId,
  text?, mediaUrl?, mediaType?: "image" | "video",
  messageType: "text" | "decision",
  decisionData?: { question, options: [{ id, text, votes: string[] }], status: "open" | "closed" },
  entityType?: "task" | "decision" | "agreement" | "question" | "event" | "resource",
  entityId?: ObjectId,
  read: boolean
}
```

### Notification
```typescript
{
  recipient, sender?, conversationId?,
  type: "new_message" | "new_decision" | "decision_closed" | "context_update",
  content: string, isRead: boolean
}
```

### Story
```typescript
{ user: ObjectId, mediaUrl, mediaType: "image" | "video" }
// TTL: fetched with createdAt >= (now - 24h) filter
```

### Space
```typescript
{
  conversationId: ObjectId,
  createdBy: string,
  title: string,
  goal?: string,
  deadline?: Date,
  status: "discussing" | "deciding" | "executing" | "completed" | "archived"
}
```

### Task
```typescript
{
  spaceId: ObjectId,
  title: string,
  description?: string,
  assignee?: string,
  creator: string,
  status: "todo" | "in_progress" | "blocked" | "done",
  priority?: "low" | "medium" | "high",
  dueDate?: Date,
  sourceMessageId?: ObjectId
}
```

---

## Key Design Decisions

**One shared HTTP + WS server**  
`http.createServer(app)` is passed to both Express and `WebSocketServer`, ensuring both HTTP and WebSocket traffic share a single TCP port (3000).

**Multi-device support via `Set<WebSocket>`**  
The online-users map is `Map<userId, Set<WebSocket>>`. Opening a second tab or device adds to the set; closing one removes only that socket. The user goes offline only when all sockets close.

**In-memory conversation participant cache**  
`handleConversationEvent` caches participant lists to avoid a MongoDB round-trip on every relayed message or typing event. The cache is invalidated when a conversation is deleted.

**Lazy user sync**  
Users are created in MongoDB the first time they make an authenticated request (not at sign-up time), keeping the auth flow simple and Clerk as the single source of truth.

**Clerk token in WS query string**  
WebSocket connections can't carry custom HTTP headers, so the Clerk JWT is passed as `?token=` and verified with `verifyToken` on the server before the socket is registered.

**Platform-aware media upload**  
Story and profile uploads detect `Platform.OS`. On native, React Native's `{ uri, type, name }` FormData shorthand is used. On web, the asset URI is fetched to obtain a real `Blob` before appending to FormData, since browsers don't support the RN shorthand.

**Exponential back-off on retries**  
All network retry loops use `Math.min(1000 * 2^attempt, 30_000)` capped at 30 s with a maximum of 6 attempts, preventing infinite hammering when the server is unreachable.
