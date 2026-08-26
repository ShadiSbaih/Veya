🚀 Thrilled to share my latest project: **Risal** (رسال)! 📱

Risal is a real-time, cross-platform mobile messaging application inspired by the fluid experiences of WhatsApp and Instagram DMs. It is designed from the ground up for seamless communication, performance, and cross-platform compatibility.

🛠️ **Tech Stack & Architecture:**
Building a real-time chat app requires a robust stack, and I carefully selected these technologies for optimal performance and developer experience:

*   **Frontend:** React Native (0.81 with New Architecture enabled for top-tier animation and gesture performance) & Expo (managed workflow with Expo Router for Next.js-like file-based routing).
*   **Backend:** Node.js & Express API server.
*   **Database:** MongoDB & Mongoose (utilizing TTL indexes for our 24-hour ephemeral stories!).
*   **Authentication:** Clerk (seamless OTP verification and JWT management via `@clerk/express`).
*   **Real-time Communication:** Native WebSockets (`ws`) for low-latency, lightweight bi-directional communication, bypassing the heavy abstractions of other libraries.
*   **Media Management:** Cloudinary for stream-based direct uploads from memory, CDN delivery, and automatic media optimization.

✨ **Key Features:**
*   **Real-Time Messaging:** Instant 1-on-1 chats via a custom in-memory WebSocket presence model that broadcasts online/offline statuses and handles message routing instantly.
*   **Live Typing Indicators:** Real-time sync to show when the other participant is typing.
*   **Ephemeral Stories:** Share images and videos that automatically expire after 24 hours, handled entirely at the database level using MongoDB TTL indexes.
*   **Media Attachments:** Support for images and videos directly in messages.
*   **"Lazy User-Sync" Authentication:** Users sign in with OTP via Clerk, and their database record is lazily synced on the first API call, removing the need for a separate registration step!

Architecturally, I implemented a custom `Map<userId, WebSocket>` structure in Node to manage real-time presence. The app connects to the socket using Clerk's JWT for secure, authenticated real-time interactions.

Building this has been an incredible deep-dive into full-stack mobile development, real-time architectures, and modern React Native practices.

Check out the architecture and code here: [Insert Link/Repo] 💻

I'd love to hear your thoughts on real-time architectures or React Native development! What tools do you prefer for building chat applications? Let's connect! 🤝

#ReactNative #Expo #NodeJS #MongoDB #WebSockets #TypeScript #FullStack #MobileDevelopment #SoftwareEngineering #TechStack #Clerk #Cloudinary
