const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply authentication middleware to all chat routes
router.use(authMiddleware);

// Get or create direct chat room with a user
router.get('/direct/:participantId', chatController.getOrCreateDirectChat);

// Get all chat rooms for the current user
router.get('/rooms', chatController.getUserChatRooms);

// Get messages from a specific chat room
router.get('/rooms/:chatRoomId/messages', chatController.getChatRoomMessages);

// Send a message to a chat room
router.post('/send', chatController.sendMessage);

// Get all users for chat (cross-company)
router.get('/users', chatController.getAllUsers);

// Get unread message count
router.get('/unread-count', chatController.getUnreadMessageCount);

// Get recent unread messages for notifications
router.get('/recent-messages', chatController.getRecentMessages);

// Mark message as read
router.post('/mark-read', chatController.markMessageAsRead);

// Mark all messages as read
router.post('/mark-all-read', chatController.markAllMessagesAsRead);

module.exports = router;
