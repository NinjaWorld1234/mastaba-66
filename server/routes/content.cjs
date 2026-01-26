const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');

// Library
router.get('/library', (req, res) => {
    try {
        const resources = db.prepare('SELECT * FROM library_resources ORDER BY createdAt DESC').all();
        res.json(resources);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Announcements
router.get('/announcements', (req, res) => {
    try {
        const announcements = db.prepare('SELECT * FROM announcements ORDER BY date DESC').all();
        res.json(announcements);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/announcements', (req, res) => {
    const { title, content, type, date } = req.body;
    try {
        const id = 'ann_' + Date.now();
        db.prepare('INSERT INTO announcements (id, title, content, type, date) VALUES (?, ?, ?, ?, ?)').run(id, title, content, type, date || new Date().toISOString().split('T')[0]);
        res.status(201).json({ id, title, content, type, date });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Upload URL for Cloudflare R2
router.post('/upload-url', async (req, res) => {
    const { fileName, fileType } = req.body;
    try {
        if (!fileName || !fileType) {
            return res.status(400).json({ error: 'Missing fileName or fileType' });
        }

        const { generateUploadUrl } = require('../r2.cjs');
        const data = await generateUploadUrl(fileName, fileType);

        res.json(data);
    } catch (e) {
        console.error('R2 URL Gen Error:', e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
