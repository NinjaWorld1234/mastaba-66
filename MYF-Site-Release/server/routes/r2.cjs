const express = require('express');
const router = express.Router();

// List files from R2
router.get('/files', async (req, res) => {
    try {
        const { listFiles } = require('../r2.cjs');
        const prefix = req.query.prefix || '';
        const files = await listFiles(prefix);
        res.json(files);
    } catch (e) {
        console.error('R2 List Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get Upload URL
router.post('/upload-url', async (req, res) => {
    try {
        const { generateUploadUrl } = require('../r2.cjs');
        const { fileName, fileType } = req.body;
        if (!fileName) return res.status(400).json({ error: 'fileName is required' });
        const data = await generateUploadUrl(fileName, fileType || 'application/octet-stream');
        res.json(data);
    } catch (e) {
        console.error('R2 Upload URL Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Delete file
router.delete('/file', async (req, res) => {
    try {
        const { deleteFile } = require('../r2.cjs');
        const { key } = req.body;
        if (!key) return res.status(400).json({ error: 'key is required' });
        await deleteFile(key);
        res.json({ success: true });
    } catch (e) {
        console.error('R2 Delete Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Rename/Move file
router.post('/rename', async (req, res) => {
    try {
        const { renameFile } = require('../r2.cjs');
        const { oldKey, newKey } = req.body;
        if (!oldKey || !newKey) return res.status(400).json({ error: 'oldKey and newKey are required' });
        await renameFile(oldKey, newKey);
        res.json({ success: true });
    } catch (e) {
        console.error('R2 Rename Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Create folder
router.post('/folder', async (req, res) => {
    try {
        const { createFolder } = require('../r2.cjs');
        const { folderPath } = req.body;
        if (!folderPath) return res.status(400).json({ error: 'folderPath is required' });
        await createFolder(folderPath);
        res.json({ success: true });
    } catch (e) {
        console.error('R2 Folder Error:', e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
