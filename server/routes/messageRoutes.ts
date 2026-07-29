import { Router } from "express";
import { deleteConversation, getConversations, getMessages, getOrCreateConversation, sendMessage, createConversation, updateConversationStatus, createDecision, voteDecision, updateConversationContext } from "../controllers/messageController.js";
import  upload from "../middlewares/upload.js";
import { authMiddleware } from "../middlewares/auth.js";

const messageRouter = Router();

messageRouter.use(authMiddleware);

messageRouter.get('/conversations', getConversations);
messageRouter.get('/conversations/:conversationId/messages', getMessages);
messageRouter.get('/conversations/with/:targetUserId', getOrCreateConversation);
messageRouter.post('/', createConversation);
messageRouter.post('/send', upload.single("file"), sendMessage);
messageRouter.post('/decision', createDecision);
messageRouter.post('/decision/:messageId/vote', voteDecision);

messageRouter.patch('/conversations/:conversationId/status', updateConversationStatus);
messageRouter.patch('/conversations/:conversationId/context', updateConversationContext);
messageRouter.delete('/conversations/:conversationId', deleteConversation);

export default messageRouter;