const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');

// Get all quizzes
router.get('/', (req, res) => {
    try {
        const quizzes = db.prepare('SELECT * FROM quizzes').all();
        res.json(quizzes.map(q => ({ ...q, questions: JSON.parse(q.questions || '[]') })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Save quiz results
router.post('/results', (req, res) => {
    const { userId, quizId, score, total, percentage } = req.body;
    try {
        db.prepare(`
            INSERT INTO quiz_results (id, userId, quizId, score, total, percentage, completedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('res_' + Date.now(), userId, quizId, score, total, percentage, new Date().toISOString());
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
