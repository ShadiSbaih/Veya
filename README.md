<div align="center">

# 📱 Risal · رسال

### A full-stack, real-time mobile messaging application

[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)](https://clerk.com/)
[![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-3448C5?style=flat-square)](https://cloudinary.com/)

</div>

---

## Table of Contents

**[Explanation](#-explanation)**
- [What is Risal?](#what-is-risal)
- [Why this stack?](#why-this-stack)
- [Architecture Overview](#architecture-overview)
- [Authentication & Security Design](#authentication--security-design)
- [Real-Time Presence Model](#real-time-presence-model)

**[Reference](#-reference)**
- [Tech Stack](#tech-stack)
- [Data Models](#data-models)
- [REST API](#rest-api)
- [WebSocket Events](#websocket-events)
- [Project File Map](#project-file-map)

**[Tutorial](#-tutorial)**
- [Run Risal Locally in 10 Minutes](#run-risal-locally-in-10-minutes)

**[How-to Guides](#-how-to-guides)**
- [Add a new REST endpoint](#how-to-add-a-new-rest-endpoint)
- [Add a new WebSocket event](#how-to-add-a-new-websocket-event)
- [Add a new tab screen](#how-to-add-a-new-tab-screen)
- [Run on a physical device](#how-to-run-on-a-physical-device)

**[Roadmap](#-roadmap) · [Contributing](#-contributing) · [License](#-license)**

---

## 🧭 Explanation

> *Understanding-oriented. This section explains what Risal is, why it was built this way, and how its parts fit together.*

### What is Risal?

**Risal** (رسال) is Arabic for *"messenger"*. It is a cross-platform mobile chat application — inspired by the feel of WhatsApp and Instagram DMs — built entirely with modern TypeScript across a React Native client and a Node.js server.

The app supports:

- 🔐 Email-based authentication with OTP verification
- 💬 Real-time one-to-one messaging over WebSocket
- ⌨️ Live typing indicators per conversation
- 🟢 Online/offline presence broadcasting
- 📖 Ephemeral stories (images & videos, 24-hour auto-expiry)
- 🔍 User search by name, handle, or email
- 🖼️ Media attachments (image & video) in messages
- 👤 Editable profile: name, bio, handle, avatar
- 🗑️ Conversation deletion with real-time sync to all participants
- 🌗 Automatic dark/light mode

---

### Why this stack?

Each technology choice was deliberate:

| Choice | Rationale |
|---|---|
| **Expo + Expo Router** | File-based routing gives the client a Next.js-like developer experience on native. Managed workflow eliminates native build complexity during development. |
| **Clerk** | Handles OTP delivery, JWT issuance, and session management out of the box. Removes the need to build and maintain a custom auth system. Its `@clerk/express` SDK allows the server to verify tokens with one middleware call. |
| **WebSocket (`ws`)** | Lightweight and low-latency. Chosen over Socket.IO for simplicity — the protocol requirements (message delivery, typing, presence) do not need the reconnection or room abstractions Socket.IO adds. |
| **Cloudinary** | Stream-based upload directly from server memory (no disk writes). Provides CDN delivery, automatic format optimization, and transformation URLs for free. |
| **MongoDB + Mongoose** | Flexible document model suits chat data (variable message shapes: text, image, video). The `expires` TTL index on the Story collection enforces 24-hour expiry at the database layer — no cron job needed. |
| **React Native New Architecture** | `newArchEnabled: true` in `app.json` opts into the JSI-based bridge for improved animation and gesture performance. |

---

### Architecture Overview

```
┌─────────────────────────────────────────┐
│               Expo Client               │
│                                         │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │ Expo     │  │  AppContext           │ │
│  │ Router   │  │  - Auth state        │ │
│  │ (tabs,   │  │  - Conversations     │ │
│  │  auth,   │  │  - Messages          │ │
│  │  chat)   │  │  - WS lifecycle      │ │
│  └──────────┘  └──────────────────────┘ │
│        │                │               │
│   HTTP (Axios)    WebSocket (ws)         │
└────────┼────────────────┼───────────────┘
         │                │
┌────────▼────────────────▼───────────────┐
│              Express Server             │
│                                         │
│  clerkMiddleware()  →  authMiddleware() │
│                                         │
│  /api/users   /api/messages             │
│  /api/stories                           │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  socketManager (ws)              │   │
│  │  Map<userId, WebSocket>          │   │
│  └──────────────────────────────────┘   │
│                                         │
│  MongoDB (Mongoose)   Cloudinary CDN    │
└─────────────────────────────────────────┘
```

**Request flow:**
1. Client attaches a Clerk JWT to every Axios request via an interceptor.
2. `clerkMiddleware()` on the server decodes and validates the token globally.
3. `authMiddleware` runs per-router — it reads the decoded identity, looks up or lazily creates the MongoDB user record, and attaches `req.user` for downstream controllers.
4. Controllers interact with Mongoose models and Cloudinary, then return JSON.

---

### Authentication & Security Design

Risal uses a **lazy user-sync** pattern. There is no explicit `/register` step:

1. The user signs in through Clerk (email + OTP).
2. Clerk issues a signed JWT session token.
3. On the **first API call**, `authMiddleware` detects that the Clerk user has no MongoDB record, calls `clerkClient.users.getUser()` to fetch their profile, and creates the `User` document automatically — including a unique handle with collision resolution.
4. All subsequent API calls find the existing record instantly.

The WebSocket connection is authenticated the same way: the client appends `?token=<jwt>` to the connection URL. The server calls `verifyToken()` from `@clerk/express` before registering the socket.

---

### Real-Time Presence Model

The server maintains a single in-memory `Map<userId, WebSocket>` called `onlineUsers`:

- **On connect:** the user's socket is added to the map; `broadcastOnlineStatus(userId, true)` fans out to all connected sockets.
- **On disconnect:** the socket is removed, the MongoDB `User` document is updated (`isOnline: false`, `lastSeen: now`), and `broadcastOnlineStatus(userId, false)` fans out.
- **Message routing:** `handleConversationEvent` looks up the `Conversation` document to find participant IDs, then delivers the event to each online participant's socket — excluding the sender.
- **Profile updates:** `broadcastUserUpdate` fans out the updated user object to all connected sockets so every client's conversation list and user cache stays fresh without polling.

---

## 📚 Reference

> *Information-oriented. Precise technical descriptions for use while building or debugging.*

### Tech Stack

**Client**

| Package | Version | Role |
|---|---|---|
| `expo` | ~54 | Framework & managed toolchain |
| `expo-router` | ~6 | File-based navigation |
| `react-native` | 0.81.5 | Cross-platform UI runtime |
| `@clerk/expo` | ^3 | Auth provider, hooks, token management |
| `axios` | ^1 | HTTP client (with JWT interceptor) |
| `expo-image` | ~3 | Optimised image component |
| `expo-image-picker` | ~17 | Camera & gallery access |
| `expo-video` | ~3 | Video playback in stories |
| `expo-linear-gradient` | ^57 | Gradient UI elements |
| `react-native-reanimated` | ~4 | Declarative animations |
| `react-native-gesture-handler` | ~2 | Native gesture recognition |
| `expo-secure-store` | ~15 | Secure token storage on-device |

**Server**

| Package | Version | Role |
|---|---|---|
| `express` | ^5 | HTTP API framework |
| `typescript` | ^7 | Type-safe server code |
| `mongoose` | ^9 | MongoDB ODM |
| `@clerk/express` | ^2 | JWT middleware & Clerk API client |
| `ws` | ^8 | WebSocket server |
| `cloudinary` | ^2 | Media upload & CDN delivery |
| `multer` | ^2 | Multipart file parsing (memory storage) |
| `tsx` + `nodemon` | latest | TypeScript hot-reload dev server |
| `dotenv` | ^17 | Environment variable loading |

---

### Data Models

#### User
| Field | Type | Notes |
|---|---|---|
| `_id` | `String` | Clerk user ID (e.g. `user_2abc…`) |
| `name` | `String` | Display name, required |
| `email` | `String` | Lowercase, unique |
| `handle` | `String` | Lowercase, unique, alphanumeric + underscore |
| `avatar` | `String` | Cloudinary URL, defaults to `""` |
| `bio` | `String` | Free text, defaults to `""` |
| `isOnline` | `Boolean` | Updated by WebSocket connect/disconnect |
| `lastSeen` | `Date` | Set on WebSocket disconnect |
| `createdAt` / `updatedAt` | `Date` | Auto-managed by Mongoose timestamps |

#### Message
| Field | Type | Notes |
|---|---|---|
| `sender` | `String` | Ref → User._id |
| `receiver` | `String` | Ref → User._id (optional for group future-proofing) |
| `conversationId` | `ObjectId` | Ref → Conversation._id |
| `text` | `String` | Trimmed; optional if `mediaUrl` present |
| `mediaUrl` | `String` | Cloudinary CDN URL |
| `mediaType` | `"image" \| "video"` | Enum |
| `read` | `Boolean` | Marked true when recipient fetches messages |
| `createdAt` | `Date` | Auto-managed |

#### Conversation
| Field | Type | Notes |
|---|---|---|
| `participants` | `String[]` | Array of User._id strings (exactly 2 for DMs) |
| `lastMessage` | `ObjectId` | Ref → Message._id; populated on fetch |
| `updatedAt` | `Date` | Updated on every new message; used for sorting |

#### Story
| Field | Type | Notes |
|---|---|---|
| `user` | `String` | Ref → User._id |
| `mediaUrl` | `String` | Cloudinary CDN URL, required |
| `mediaType` | `"image" \| "video"` | Enum, required |
| `createdAt` | `Date` | MongoDB TTL index — document auto-deleted after **86 400 seconds** (24 h) |

---

### REST API

All routes require a valid Clerk JWT in the `Authorization: Bearer <token>` header. The `authMiddleware` enforces this on every router.

**Base URL:** `http://<host>:3000`

#### `/api/users`

| Method | Path | Body / Query | Description |
|---|---|---|---|
| `GET` | `/` | — | Returns all users except the caller. Fields: `name email handle avatar bio isOnline lastSeen`. |
| `GET` | `/profile` | — | Returns the caller's full MongoDB user document. |
| `GET` | `/search?query=` | `query` (string) | Case-insensitive regex search on `name`, `handle`, `email`. Returns up to 20 results. |
| `PUT` | `/profile` | `multipart/form-data`: `name?`, `bio?`, `handle?`, `avatar?` (file) | Updates profile fields. Uploads avatar to Cloudinary `insta_chat_avatars/` folder. Broadcasts `user_update` to all connected sockets. Returns updated user. |

#### `/api/messages`

| Method | Path | Body / Params | Description |
|---|---|---|---|
| `GET` | `/conversations` | — | Returns all conversations for the caller, sorted by `updatedAt` desc. Each item has `_id`, `participant` (the other user, populated), `lastMessage` (populated), `updatedAt`. |
| `GET` | `/conversations/with/:targetUserId` | `targetUserId` param | Gets or creates a DM conversation with the target user. Returns the conversation object with `participant` populated. |
| `GET` | `/conversations/:conversationId/messages` | `conversationId` param | Returns all messages in the conversation (sorted `createdAt` asc). Marks all unread messages addressed to the caller as `read: true`. |
| `POST` | `/send` | `multipart/form-data`: `conversationId?`, `receiverId?`, `text?`, `file?` | Persists a message. Uploads media to Cloudinary `insta_chat/` if a file is present. Updates `conversation.lastMessage`. Returns the saved message with status `201`. |
| `DELETE` | `/conversations/:conversationId` | `conversationId` param | Verifies caller is a participant. Broadcasts `chat_deleted` event via WebSocket to all other participants **before** deleting. Deletes all messages then the conversation. |

#### `/api/stories`

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/` | — | Returns all non-expired stories grouped by user. |
| `POST` | `/` | `multipart/form-data`: `file` (required) | Uploads media to Cloudinary. Creates a Story document with a 24 h MongoDB TTL. |

---

### WebSocket Events

**Connection:** `ws://<host>:3000/ws?token=<clerk_jwt>`

The server verifies the token via `verifyToken()` before registering the socket. On success, the user is added to `onlineUsers` and their presence is broadcast.

#### Client → Server

| `type` | Additional fields | Description |
|---|---|---|
| `message` | `conversationId`, `payload` | Deliver a new message to all other conversation participants. |
| `typing` | `conversationId`, `isTyping` (boolean) | Broadcast typing state to other participants. |

#### Server → Client

| `type` | Payload fields | Triggered by |
|---|---|---|
| `message` | full Message object | Another participant sends a message to a conversation the client is in. |
| `typing` | `senderId`, `isTyping` | Another participant is typing in a shared conversation. |
| `online_status` | `userId`, `isOnline` | Any user connects or disconnects. |
| `user_update` | full User object | Any user updates their profile via `PUT /api/users/profile`. |
| `chat_deleted` | `conversationId` | A participant deletes a shared conversation. |

---

### Project File Map

| Path | Description |
|---|---|
| `client/app/_layout.tsx` | Root layout: Clerk provider, `useProtectedRoute` auth guard, Stack navigator |
| `client/app/(auth)/index.tsx` | Auth screen: email input → OTP verification flow |
| `client/app/(tabs)/index.tsx` | Home: story bar + conversation list |
| `client/app/(tabs)/search.tsx` | User search with debounced API calls |
| `client/app/(tabs)/profile.tsx` | Profile view/edit with avatar picker |
| `client/app/chat/[id].tsx` | Dynamic chat screen: message list, input, media picker |
| `client/context/AppContext.tsx` | Global state provider: auth, conversations, messages, WebSocket lifecycle |
| `client/constants/config.ts` | `API_BASE_URL` and `WS_URL` with platform-aware host selection |
| `client/components/StoriesBar.tsx` | Horizontal story strip on the home screen |
| `client/components/StoryViewer.tsx` | Full-screen story viewer with tap-to-advance |
| `client/components/ChatBubble.tsx` | Individual message bubble (text + media variants) |
| `client/components/ConversationItem.tsx` | Conversation list row with avatar, name, last message preview |
| `server/server.ts` | Express bootstrap: DB connect, middleware, routes, HTTP+WS server init |
| `server/middlewares/auth.ts` | `authMiddleware`: JWT validation + lazy MongoDB user sync |
| `server/middlewares/upload.ts` | Multer config (memory storage, used by profile & message routes) |
| `server/socket/socketManager.ts` | WebSocket server: connection auth, event routing, presence tracking, broadcasts |
| `server/controllers/userController.ts` | `getUsers`, `getProfile`, `searchUsers`, `updateProfile` |
| `server/controllers/messageController.ts` | `getConversations`, `getOrCreateConversation`, `getMessages`, `sendMessage`, `deleteConversation` |
| `server/controllers/storyController.ts` | `getStories`, `createStory` |

---

## 🎓 Tutorial

> *Learning-oriented. Follow these steps to go from zero to a running Risal instance.*

### Run Risal Locally in 10 Minutes

By the end of this tutorial you will have both the server and the Expo client running, you will be able to sign in, and send your first message.

#### Prerequisites

Before you begin, make sure you have:

- [ ] **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- [ ] **Git** — [git-scm.com](https://git-scm.com/)
- [ ] **Expo Go** app installed on your phone (iOS or Android), or an emulator running locally
- [ ] A free **Clerk** account — [clerk.com](https://clerk.com/)
- [ ] A free **Cloudinary** account — [cloudinary.com](https://cloudinary.com/)
- [ ] A running **MongoDB** instance — either [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier) or a local installation

---

#### Step 1 — Clone the repository

```bash
git clone https://github.com/ShadiSbaih/Risal.git
cd risal
```

---

#### Step 2 — Create a Clerk application

Clerk handles all authentication. Follow these steps:

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com/) and click **"Create application"**.
2. Give it a name (e.g. `Risal`).
3. Under **"Sign-in options"**, enable **Email address** and set the verification method to **Email verification code** (OTP). You can disable social logins for now.
4. Click **"Create application"**.
5. You are now on the application dashboard. In the left sidebar click **"API Keys"**.
6. Copy the two values you need:
   - **Publishable key** — starts with `pk_test_…` → goes in `client/.env`
   - **Secret key** — starts with `sk_test_…` → goes in `server/.env`

> **Optional — configure a username:** In the Clerk dashboard go to **User & Authentication → Email, Phone, Username**. Enable **Username** if you want users to set a custom handle during sign-up. Risal will fall back to the email prefix if no username is set.

---

#### Step 3 — Create a Cloudinary account and get credentials

Cloudinary stores all uploaded images and videos.

1. Go to [cloudinary.com](https://cloudinary.com/) and sign up for a free account.
2. After confirming your email, you land on the **Dashboard**.
3. Under **"Product Environment Credentials"**, copy:
   - **Cloud name**
   - **API Key**
   - **API Secret**

---

#### Step 4 — Configure the server environment

```bash
cd server
```

Create a file named `.env` in the `server/` directory with the following content:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/risal
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Replace every placeholder with your real values.

> **MongoDB Atlas tip:** After creating a free cluster, click **"Connect"** → **"Drivers"** and copy the connection string. Replace `<password>` with your database user password.

---

#### Step 5 — Configure the client environment

```bash
cd ../client
```

Find your machine's **local IP address** (not `localhost`):
- **Windows:** run `ipconfig` in a terminal → look for `IPv4 Address` under your active adapter (e.g. `192.168.1.9`)
- **macOS/Linux:** run `ifconfig | grep "inet "` → look for your LAN IP

Create a file named `.env` in the `client/` directory:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then open `client/constants/config.ts` and update the `HOST` value to your LAN IP:

```ts
const HOST = Platform.select({
    ios: "192.168.1.9",      // ← your actual LAN IP
    android: "192.168.1.9",  // ← same IP
    default: "localhost"
});
```

> **Why the LAN IP?** Physical devices and Android emulators cannot reach `localhost` of your development machine. They must use the actual network IP.

---

#### Step 6 — Install dependencies and start the server

```bash
# In the server/ directory
npm install
npm run server
```

You should see:

```
Server is running at http://localhost:3000
MongoDB connected
```

Leave this terminal open.

---

#### Step 7 — Start the Expo client

Open a **new terminal**:

```bash
# In the client/ directory
npm install
npx expo start
```

Expo Dev Tools will print a QR code in the terminal.

- **Physical device:** Open the **Expo Go** app and scan the QR code.
- **Android emulator:** Press `a` in the terminal.
- **iOS simulator:** Press `i` in the terminal.

---

#### Step 8 — Sign in and send your first message ✅

1. The app opens on the sign-in screen. Enter your email address and tap **Continue**.
2. Clerk sends a 6-digit OTP to your inbox. Enter it in the app.
3. You are now signed in and land on the **Home** tab.
4. Tap the **Search** tab (🔍), type a name or handle, and tap a result.
5. You are taken to the chat screen. Type a message and tap **Send**.

Congratulations — Risal is running.

---

## 🔧 How-to Guides

> *Problem-oriented. Step-by-step recipes for common contributor tasks.*

### How to add a new REST endpoint

**Example:** adding `GET /api/users/:id` to fetch a user by ID.

**1. Write the controller function** in `server/controllers/userController.ts`:

```ts
export const getUserById = async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.params.id)
        .select("name email handle avatar bio isOnline lastSeen");
    if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
    }
    res.json({ success: true, user });
};
```

**2. Import and register the route** in `server/routes/userRouter.ts`:

```ts
import { ..., getUserById } from "../controllers/userController.js";

userRouter.get("/:id", getUserById);
```

The `authMiddleware` is already applied to the whole router (`userRouter.use(authMiddleware)`), so the new route is automatically protected.

**3. Call it from the client** using the shared `api` instance from `AppContext.tsx`:

```ts
import { api } from "@/context/AppContext";

const { data } = await api.get(`/api/users/${userId}`);
```

---

### How to add a new WebSocket event

**Example:** adding a `message_read` event so the sender knows their message was read.

**1. Define the event shape** in `client/assets/types.ts` (or wherever your shared types live):

```ts
// Add to the WsEvent union
| { type: "message_read"; messageId: string; readBy: string }
```

**2. Emit from the server** — in the relevant controller (e.g. inside `getMessages` after marking as read):

```ts
import { handleConversationEvent } from "../socket/socketManager.js";

await handleConversationEvent(userId, conversationId, {
    type: "message_read",
    messageId: "<id>",
    readBy: userId,
});
```

**3. Handle it on the client** — in the `ws.onmessage` handler inside `AppContext.tsx`:

```ts
if (event.type === "message_read") {
    const { messageId, readBy } = event;
    setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, read: true } : m))
    );
}
```

---

### How to add a new tab screen

Expo Router uses the filesystem. To add a **Notifications** tab:

**1. Create the screen file** at `client/app/(tabs)/notifications.tsx`:

```tsx
import { View, Text } from "react-native";

export default function NotificationsScreen() {
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text>Notifications</Text>
        </View>
    );
}
```

**2. Register the tab** in `client/app/(tabs)/_layout.tsx`:

```tsx
<Tabs.Screen
    name="notifications"
    options={{
        title: "Notifications",
        tabBarIcon: ({ color }) => <IconSymbol name="bell" color={color} />,
    }}
/>
```

Expo Router picks up the new file automatically — no additional routing config needed.

---

### How to run on a physical device

If the client cannot reach the server on your physical device:

1. **Ensure both devices are on the same Wi-Fi network** as your development machine.

2. **Find your machine's LAN IP:**
   ```powershell
   # Windows
   ipconfig
   # Look for "IPv4 Address" under your Wi-Fi adapter
   ```

3. **Update `client/constants/config.ts`** with the correct IP:
   ```ts
   const HOST = Platform.select({
       ios: "192.168.1.X",     // ← your real IP
       android: "192.168.1.X",
       default: "localhost"
   });
   ```

4. **Ensure the server port (3000) is not blocked** by a firewall. On Windows, you may need to allow it:
   ```powershell
   netsh advfirewall firewall add rule name="Risal Dev Server" dir=in action=allow protocol=TCP localport=3000
   ```

5. Restart the Expo dev server (`npx expo start`) and re-scan the QR code.

---

## 📅 Roadmap

Planned features, roughly ordered by priority:

### Near-term
- [ ] **Read receipts** — double-tick UI in chat bubbles when recipient reads a message
- [ ] **Push notifications** — Expo Notifications for messages received while the app is in the background
- [ ] **Message reactions** — emoji reactions on individual messages
- [ ] **Voice messages** — record and send audio clips

### Medium-term
- [ ] **Group conversations** — extend `Conversation.participants` beyond 2 users
- [ ] **Message search** — full-text search within a conversation
- [ ] **Story reactions** — reply to a story directly into a DM
- [ ] **End-to-end encryption** — client-side key exchange for message privacy

### Long-term
- [ ] **Video calls** — WebRTC peer-to-peer calling
- [ ] **Message pinning** — pin important messages within a conversation
- [ ] **Multi-device sync** — persist WebSocket state across multiple client sessions

---

## 🤝 Contributing

### Branch strategy

| Branch | Purpose |
|---|---|
| `master` | Stable, deployable code. No direct commits. |
| `Development` | Integration branch. All feature branches merge here first. |
| `feature/<name>` | Individual feature or fix branches, cut from `Development`. |

### Workflow

1. Cut a branch from `Development`: `git checkout -b feature/my-feature Development`
2. Make your changes. Keep commits small and descriptive.
3. Open a pull request targeting `Development`.
4. After review and testing, `Development` is merged to `master` for release.

### Code style

- **TypeScript** is required for all new files in both `client/` and `server/`.
- Use `async/await`; avoid raw `.then()` chains in new code.
- Controllers must never `throw` — wrap logic in `try/catch` and return a JSON error response.
- Run `npm run lint` in `client/` before pushing.

---

## 📜 License

This project is for educational and personal use.  
All rights reserved © Shadi Sbaih.

---

<div align="center">
Built with ❤️ using Expo, React Native, Node.js, and TypeScript
</div>
