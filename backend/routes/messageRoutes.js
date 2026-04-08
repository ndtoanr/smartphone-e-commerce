const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// POST /api/messages - Send a message
// User sending to admin, or admin sending to user
router.post('/', protect, async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        // If receiverId is provided, it's admin sending to user.
        // Otherwise, user is sending to admin (receiver = null)

        // Check if the current user is admin trying to send without receiverId
        if (req.user.role === 'admin' && !receiverId) {
            return res.status(400).json({ message: 'Quản trị viên phải chỉ định người nhận (receiverId).' });
        }

        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId || null,
            content,
            isRead: false
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/messages/:userId - Get chat history for a specific user
// Accessible by the user themselves, or by an admin
router.get('/:userId', protect, async (req, res) => {
    try {
        // Check authorization: Must be the user themselves OR an admin
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
            return res.status(403).json({ message: 'Không có quyền truy cập.' });
        }

        // Messages where the user is either the sender (to admin/null) or receiver (from admin)
        const messages = await Message.find({
            $or: [
                { sender: req.params.userId, receiver: null },
                { receiver: req.params.userId } // Sent by admin to this user
            ]
        }).sort({ createdAt: 1 }); // Sort oldest to newest

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/messages/admin/conversations - Get list of users who have messaged (Admin only)
router.get('/admin/conversations', protect, admin, async (req, res) => {
    try {
        // Find all users who have sent messages to admin (receiver: null)
        const uniqueSenders = await Message.distinct('sender', { receiver: null });

        const conversations = [];

        for (const senderId of uniqueSenders) {
            const user = await User.findById(senderId).select('-password');
            if (user) {
                // Find the latest message from this user
                const lastMessage = await Message.findOne({ sender: senderId, receiver: null })
                    .sort({ createdAt: -1 });
                // Count unread messages from this user
                const unreadCount = await Message.countDocuments({ sender: senderId, receiver: null, isRead: false });

                conversations.push({
                    user,
                    lastMessage,
                    unreadCount
                });
            }
        }

        // Sort conversations by last message time
        conversations.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/messages/user/unread - Get unread message count for current user (from Admin)
router.get('/user/unread', protect, async (req, res) => {
    try {
        const unreadCount = await Message.countDocuments({
            receiver: req.user._id,
            isRead: false
        });
        res.json({ unreadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/messages/mark-read - Mark messages as read
router.put('/mark-read', protect, async (req, res) => {
    try {
        const { senderId } = req.body;

        if (req.user.role === 'admin') {
            // Admin marks messages from user (sender = senderId, receiver = null) as read
            if (!senderId) {
                return res.status(400).json({ message: 'Cần senderId' });
            }
            await Message.updateMany(
                { sender: senderId, receiver: null, isRead: false },
                { isRead: true }
            );
        } else {
            // User marks messages sent to them (receiver = req.user._id) as read
            await Message.updateMany(
                { receiver: req.user._id, isRead: false },
                { isRead: true }
            );
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
