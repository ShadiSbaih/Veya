import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import { clerkMiddleware } from '@clerk/express'
import userRouter from "./routes/userRouter.js";
import messageRouter from "./routes/messageRoutes.js";
import storyRouter from "./routes/storyRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import spaceRouter from "./routes/spaceRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import http from "http"
import { initSocketServer } from "./socket/socketManager.js";


const app = express();
//Connect MongoDB

await connectDB();
// Reset all users to offline on server restart
try {
    await User.updateMany({}, { $set: { isOnline: false } });
    console.log("Reset all users to offline status.");
} catch (error) {
    console.error("Error resetting user statuses:", error);
}
// Middleware
app.use(cors())
app.use(express.json());
app.use(clerkMiddleware())

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/stories", storyRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/spaces", spaceRouter);
app.use("/api/tasks", taskRouter);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({
        success: false, message: err?.message ||
            "Something went wrong!"
    });
});

//https server and attach WebSocket
const server= http.createServer(app);
initSocketServer(server);

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
