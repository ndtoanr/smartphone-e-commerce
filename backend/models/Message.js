const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // Receiver is optional, if null, it means it's sent to ADMIN. If it's sent by ADMIN, receiver is the User ID.
        // For simplicity, we can assume:
        // User -> Admin: sender=userID, receiver=null (or a specific admin ID, but let's say null for generic "admin inbox")
        // Admin -> User: sender=adminID, receiver=userID
    },
    content: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
