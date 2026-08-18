import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createSpace, getSpaceByConversation, getSpaces, updateSpace } from "../controllers/spaceController.js";

const spaceRouter = Router();

spaceRouter.use(authMiddleware);
spaceRouter.get("/", getSpaces);
spaceRouter.post("/", createSpace);
spaceRouter.get("/:conversationId", getSpaceByConversation);
spaceRouter.patch("/item/:spaceId", updateSpace);

export default spaceRouter;
