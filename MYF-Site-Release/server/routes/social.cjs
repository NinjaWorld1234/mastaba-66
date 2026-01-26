const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const { authenticateToken } = require('../middleware.cjs');

router.use(authenticateToken);

// Messages
router.get('/messages', (req, res) => {
    const userId = req.user.id;
    try {
        const messages = db.prepare('SELECT * FROM messages WHERE (senderId = ? OR receiverId = ?) ORDER BY timestamp ASC').all(userId, userId);
        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/messages', (req, res) => {
    console.log('[Social API] POST /messages request received');
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    console.log('Sending message:', { senderId, receiverId, content });

    try {
        const id = 'msg_' + Date.now();
        const timestamp = new Date().toISOString();
        db.prepare(`
            INSERT INTO messages (id, senderId, receiverId, content, read, timestamp)
            VALUES (@id, @senderId, @receiverId, @content, @read, @timestamp)
        `).run({
            id,
            senderId,
            receiverId,
            content,
            read: 0,
            timestamp
        });
        res.status(201).json({ id, senderId, receiverId, content, read: 0, timestamp });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/messages/:id/read', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});



router.put('/messages/conversation/:userId/read', (req, res) => {
    const { userId: targetId } = req.params; // The sender whose messages we are marking as read
    const currentUserId = req.user.id;
    try {
        db.prepare('UPDATE messages SET read = 1 WHERE senderId = ? AND receiverId = ?').run(targetId, currentUserId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
