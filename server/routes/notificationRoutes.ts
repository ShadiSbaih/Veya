import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { getNotifications, markAsRead } from "../controllers/notificationController.js";

const notificationRouter = Router();
notificationRouter.use(authMiddleware);
notificationRouter.get('/', getNotifications);
notificationRouter.patch('/read', markAsRead);

export default notificationRouter;
