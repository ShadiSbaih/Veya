<div align="center">

# 📱 Risal — رسال

**A full-stack, real-time messaging app built with React Native (Expo) and Node.js**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)

</div>

---

## ✨ Overview

**Risal** (رسال — Arabic for "messenger") is a modern, real-time mobile messaging application that brings together a polished React Native client and a robust Node.js/Express backend. It features instant messaging via WebSocket, ephemeral stories, user profiles, media sharing, and an authentication system powered by Clerk.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Secure sign-up / sign-in with OTP email verification via Clerk |
| 💬 **Real-Time Messaging** | Instant message delivery using a persistent WebSocket connection |
| ⌨️ **Typing Indicators** | Live typing status broadcast to conversation participants |
| 🟢 **Online Presence** | Real-time online/offline status for all users |
| 📖 **Stories** | Ephemeral photo/video stories that auto-expire after 24 hours |
| 🔍 **User Search** | Search other users by name or handle to start a conversation |
| 🖼️ **Media Messages** | Send image and video attachments in conversations |
| 👤 **Profile Management** | Update display name, bio, handle, and avatar (Cloudinary CDN) |
| 🗑️ **Delete Conversations** | Remove chat threads with real-time sync across all participants |
| 🌗 **Dark / Light Mode** | Automatic system-level UI style switching |

---

## 🏗️ Architecture

```
risal/
├── client/          # Expo React Native application
│   ├── app/         # Expo Router file-based routes
│   │   ├── (auth)/  # Authentication screens (sign-in, OTP)
│   │   ├── (tabs)/  # Main app tabs (home, search, profile)
│   │   └── chat/    # Dynamic chat screen [id].tsx
│   ├── components/  # Shared UI components
│   ├── context/     # AppContext — global state & WebSocket lifecycle
│   ├── constants/   # API_BASE_URL, WS_URL config
│   ├── assets/      # Images, fonts, type definitions
│   └── utils/       # Helper utilities
│
└── server/          # Express + TypeScript API server
    ├── server.ts    # App entry point & HTTP/WS server bootstrap
    ├── config/      # Database connection (MongoDB)
    ├── controllers/ # Business logic (users, messages, stories)
    ├── models/      # Mongoose data models
    ├── routes/      # Express API routes
    ├── middlewares/ # Clerk auth guard middleware
    └── socket/      # WebSocket server (socketManager.ts)
```

---

## 🛠️ Tech Stack

### Client
| Technology | Purpose |
|---|---|
| [Expo 54](https://expo.dev/) | React Native framework & toolchain |
| [Expo Router 6](https://expo.github.io/router/) | File-based navigation |
| [React Native 0.81](https://reactnative.dev/) | Cross-platform mobile UI (iOS, Android, Web) |
| [@clerk/expo](https://clerk.com/docs/references/expo/overview) | Authentication & session management |
| [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | Camera & gallery access |
| [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) | UI gradients |
| [React Native Reanimated 4](https://docs.swmansion.com/react-native-reanimated/) | Smooth declarative animations |
| [Axios](https://axios-http.com/) | HTTP client with Clerk JWT interceptor |
| [WebSocket (native)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) | Real-time bidirectional events |

### Server
| Technology | Purpose |
|---|---|
| [Express 5](https://expressjs.com/) | HTTP API framework |
| [TypeScript 7](https://www.typescriptlang.org/) | Type-safe server code |
| [Mongoose 9](https://mongoosejs.com/) | MongoDB ODM |
| [@clerk/express](https://clerk.com/docs/references/nodejs/overview) | JWT verification middleware |
| [ws](https://github.com/websockets/ws) | WebSocket server |
| [Cloudinary](https://cloudinary.com/) | Image/video CDN & storage |
| [Multer 2](https://github.com/expressjs/multer) | Multipart file upload handling |
| [tsx + nodemon](https://github.com/privatenumber/tsx) | TypeScript dev hot-reload execution |

---

## 📊 Data Models

```
User        — _id (Clerk ID), name, email, handle, avatar, bio, isOnline, lastSeen
Message     — sender, receiver, conversationId, text, mediaUrl, mediaType, read
Conversation— participants[], lastMessage, updatedAt
Story       — user, mediaUrl, mediaType, createdAt (TTL: 24h auto-expire)
```

---

## 🌐 API Reference

### Users — `/api/users`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/sync` | Sync Clerk user to MongoDB on first login |
| `GET` | `/search?q=` | Search users by name or handle |
| `PUT` | `/profile` | Update display name, bio, handle, and avatar |

### Messages — `/api/messages`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/conversations` | Fetch all conversations for the authenticated user |
| `POST` | `/send` | Get or create a conversation and send a message |
| `GET` | `/:conversationId` | Fetch all messages in a conversation |
| `DELETE` | `/:conversationId` | Delete a conversation and broadcast removal to all participants |

### Stories — `/api/stories`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Fetch all active stories grouped by user |
| `POST` | `/` | Upload a new story (image or video) to Cloudinary |

---

## ⚡ WebSocket Events

The server maintains a `userId → WebSocket` map for real-time delivery.

**Connection URL:** `ws://<host>/ws?token=<clerk_jwt>`

| Event Type | Direction | Payload |
|---|---|---|
| `message` | Server → Client | New message object |
| `typing` | Server → Client | `{ senderId, isTyping }` |
| `online_status` | Server → All Clients | `{ userId, isOnline }` |
| `user_update` | Server → All Clients | Updated user profile object |
| `chat_deleted` | Server → Participants | `{ conversationId }` |

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [MongoDB](https://mongodb.com/) instance (local or Atlas)
- [Expo Go](https://expo.dev/client) app on your device, or an iOS/Android emulator
- A [Clerk](https://clerk.com/) account (free tier works)
- A [Cloudinary](https://cloudinary.com/) account (free tier works)

---

### 1. Clone & Install

```bash
git clone https://github.com/ShadiSbaih/Risal.git
cd risal

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

---

### 2. Configure Environment Variables

**`server/.env`**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/risal
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**`client/.env`**
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3000
EXPO_PUBLIC_WS_URL=ws://192.168.x.x:3000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

> **⚠️ Important:** Use your machine's **LAN IP address** (e.g. `192.168.1.x`), not `localhost`. Physical devices and emulators cannot reach `localhost` on the host machine.

---

### 3. Run the Server

```bash
cd server
npm run server   # Hot-reload development mode (nodemon + tsx)
# Server starts at http://localhost:3000
```

### 4. Run the Client

```bash
cd client
npx expo start

# Press 'a' → Android emulator
# Press 'i' → iOS simulator
# Scan QR code → Expo Go on physical device
```

---

## 📁 Key Files

| File | Description |
|---|---|
| `client/context/AppContext.tsx` | Global state — auth, conversations, messages, WebSocket lifecycle |
| `client/app/_layout.tsx` | Root layout with Clerk provider, auth guard, and navigation stack |
| `client/app/(auth)/index.tsx` | Auth screen — email sign-in, OTP verification |
| `client/app/(tabs)/index.tsx` | Home screen — story feed and conversation list |
| `client/app/chat/[id].tsx` | Dynamic chat screen with real-time messaging |
| `server/server.ts` | Express app bootstrap, route mounting, WebSocket init |
| `server/socket/socketManager.ts` | WebSocket server — connection auth, event routing, presence tracking |
| `server/controllers/messageController.ts` | Conversation management and message persistence |
| `server/controllers/userController.ts` | Profile updates, Cloudinary uploads, user search |
| `server/controllers/storyController.ts` | Story creation with 24-hour MongoDB TTL expiry |

---

## 🔒 Authentication Flow

```
1. User enters email        →  Clerk creates a one-time password (OTP)
2. User verifies OTP        →  Clerk issues a signed JWT session token
3. Client attaches JWT      →  Axios interceptor: Authorization: Bearer <token>
4. Server validates JWT     →  @clerk/express clerkMiddleware() on every route
5. First login sync         →  POST /api/users/sync creates a MongoDB user linked to Clerk ID
6. WebSocket authentication →  Token passed as ?token=<jwt> query parameter on connect
```

---

## 🌿 Branches

| Branch | Description |
|---|---|
| `master` | Stable, production-ready code |
| `Development` | Active feature development |

---

## 📜 License

This project is for educational and personal use. All rights reserved © Shadi Sbaih.

---

<div align="center">

**Built with ❤️ using Expo, React Native, and TypeScript**

</div>
