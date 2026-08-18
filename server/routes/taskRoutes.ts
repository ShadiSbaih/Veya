import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createTask, createTaskFromMessage, getTasks, updateTask } from "../controllers/taskController.js";

const taskRouter = Router();

taskRouter.use(authMiddleware);
taskRouter.get("/space/:spaceId", getTasks);
taskRouter.post("/from-message/:messageId", createTaskFromMessage);
taskRouter.post("/", createTask);
taskRouter.patch("/:taskId", updateTask);

export default taskRouter;
