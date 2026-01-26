const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const { authenticateToken } = require('../middleware.cjs');
const { deleteFile, generateDownloadUrl, uploadBufferToR2 } = require('../r2.cjs');

router.use(authenticateToken);

// Messages
router.get('/messages', async (req, res) => {
    const userId = req.user.id;
    try {
        // Filter out expired messages dynamically or rely on cleanup
        const messages = db.prepare(`
            SELECT * FROM messages 
            WHERE (senderId = ? OR receiverId = ?) 
            AND (expiryDate IS NULL OR expiryDate > ?)
            ORDER BY timestamp ASC
        `).all(userId, userId, new Date().toISOString());

        // Process messages to sign attachment URLs
        const signedMessages = await Promise.all(messages.map(async (msg) => {
            if (msg.attachmentUrl && msg.attachmentUrl.includes('uploads/')) {
                try {
                    // Extract key: assume typical URL structure ending in /uploads/KEY
                    // Or if it's already a relative path (though usually stored as absolute)
                    const parts = msg.attachmentUrl.split('uploads/');
                    if (parts.length > 1) {
                        const key = 'uploads/' + parts[1];
                        msg.attachmentUrl = await generateDownloadUrl(key);
                    }
                } catch (e) {
                    console.error('Failed to sign URL for msg:', msg.id, e);
                }
            }
            return msg;
        }));

        res.json(signedMessages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Unread Count
router.get('/messages/unread', (req, res) => {
    const userId = req.user.id;
    try {
        const result = db.prepare('SELECT COUNT(*) as count FROM messages WHERE receiverId = ? AND read = 0').get(userId);
        res.json({ count: result.count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Cleanup Expired Messages
router.delete('/messages/cleanup', async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    try {
        const now = new Date().toISOString();

        // Find messages with attachments to delete
        const expiredWithAttachments = db.prepare('SELECT attachmentUrl, attachmentType FROM messages WHERE expiryDate IS NOT NULL AND expiryDate < ? AND attachmentUrl IS NOT NULL').all(now);

        for (const msg of expiredWithAttachments) {
            if (msg.attachmentUrl) {
                // Extract key from URL
                // URL format: R2_PUBLIC_DOMAIN/key or https://.../key
                try {
                    const url = new URL(msg.attachmentUrl);
                    // Key is usually pathname relative to root, but might have leading slash
                    let key = url.pathname;
                    if (key.startsWith('/')) key = key.substring(1);

                    console.log(`Deleting expired attachment: ${key}`);
                    await deleteFile(key);
                } catch (err) {
                    console.error('Failed to delete file from R2:', err);
                }
            }
        }

        const result = db.prepare('DELETE FROM messages WHERE expiryDate IS NOT NULL AND expiryDate < ?').run(now);
        res.json({ success: true, deleted: result.changes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/messages', (req, res) => {
    console.log('[Social API] POST /messages request received');
    const { receiverId, content, attachmentUrl, attachmentType, attachmentName } = req.body;
    const senderId = req.user.id;

    console.log('Sending message:', { senderId, receiverId, content, attachmentType });

    try {
        const id = 'msg_' + Date.now();
        const timestamp = new Date().toISOString();

        let expiryDate = null;
        // If there is an attachment (Voice, Image, PDF), set expiry to 7 days
        if (attachmentUrl || attachmentType) {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            expiryDate = date.toISOString();
        }

        db.prepare(`
            INSERT INTO messages (id, senderId, receiverId, content, read, timestamp, attachmentUrl, attachmentType, attachmentName, expiryDate)
            VALUES (@id, @senderId, @receiverId, @content, @read, @timestamp, @attachmentUrl, @attachmentType, @attachmentName, @expiryDate)
        `).run({
            id,
            senderId,
            receiverId,
            content: content || '', // Content might be empty if just sending a file
            read: 0,
            timestamp,
            attachmentUrl: attachmentUrl || null,
            attachmentType: attachmentType || null,
            attachmentName: attachmentName || null,
            expiryDate
        });
        res.status(201).json({ id, senderId, receiverId, content, read: 0, timestamp, attachmentUrl, attachmentType, attachmentName, expiryDate });
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



// Mark conversation as read
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

/**
 * Radical Fix: Server-side Proxy Upload
 * Receives file bytes as application/octet-stream and uploads to R2
 */
router.post('/upload-proxy', async (req, res) => {
    try {
        let fileName = req.query.fileName;
        let fileType = req.headers['content-type'];
        let buffer;

        // Support both JSON (Base64) and raw binary
        if (req.body && req.body.base64Data) {
            // Case 1: JSON with Base64
            console.log(`[ProxyUpload] Decoding Base64 for ${req.body.fileName}`);
            fileName = req.body.fileName || fileName || `upload-${Date.now()}`;
            fileType = req.body.fileType || fileType || 'application/octet-stream';

            // Remove data:URL prefix if present
            const base64String = req.body.base64Data.replace(/^data:.*?;base64,/, '');
            buffer = Buffer.from(base64String, 'base64');
        } else if (Buffer.isBuffer(req.body) && req.body.length > 0) {
            // Case 2: Raw binary buffer
            console.log(`[ProxyUpload] Processing raw binary buffer`);
            buffer = req.body;
            fileName = fileName || `upload-${Date.now()}`;
        } else {
            return res.status(400).json({ error: 'No file data received. Ensure Content-Type is application/octet-stream for raw, or send JSON with base64Data.' });
        }

        if (!buffer || buffer.length === 0) {
            return res.status(400).json({ error: 'Empty file buffer' });
        }

        console.log(`[ProxyUpload] Received ${buffer.length} bytes for ${fileName} (${fileType})`);

        const publicUrl = await uploadBufferToR2(buffer, fileName, fileType);

        console.log(`[ProxyUpload] Success. URL: ${publicUrl}`);
        res.json({ publicUrl });
    } catch (e) {
        console.error('[ProxyUpload] Failed:', e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
