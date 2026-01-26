const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'myf-videos';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

// R2 Files
router.get('/r2/files', async (req, res) => {
    try {
        const prefix = req.query.prefix || '';
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            Delimiter: '/',
            MaxKeys: 1000
        });

        const data = await r2Client.send(command);
        const folders = (data.CommonPrefixes || []).map(p => ({
            name: p.Prefix,
            path: p.Prefix,
            type: 'folder'
        }));

        const files = (data.Contents || [])
            .filter(item => {
                if (item.Key === prefix) return false;
                const ext = path.extname(item.Key).toLowerCase();
                return ['.mp4', '.m4v', '.mov', '.webm', '.avi', '.mkv', '.mp3', '.wav', '.jpg', '.png', '.jpeg'].includes(ext);
            })
            .map(item => ({
                id: item.ETag,
                name: item.Key.replace(prefix, ''),
                fullName: item.Key,
                size: item.Size,
                lastModified: item.LastModified,
                url: `${R2_PUBLIC_DOMAIN}/${item.Key}`
            }));

        res.json({ files, folders, prefix });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/system-activity-logs', (req, res) => {
    try {
        const logs = db.prepare('SELECT * FROM system_activity_logs ORDER BY timestamp DESC LIMIT 1000').all();
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/system-activity-logs', (req, res) => {
    const { userId, action, details } = req.body;
    try {
        db.prepare(`
            INSERT INTO system_activity_logs (id, userId, action, details, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `).run('log_' + Date.now(), userId, action, details, new Date().toISOString());
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
