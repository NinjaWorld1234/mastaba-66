const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');

// Get all quizzes
router.get('/', (req, res) => {
    try {
        const quizzes = db.prepare('SELECT * FROM quizzes').all();
        res.json(quizzes.map(q => ({
            ...q,
            questions: JSON.parse(q.questions || '[]'),
            passingScore: q.passing_score || 70,
            titleEn: q.title_en || q.title
        })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create Quiz
router.post('/', (req, res) => {
    const { id, title, titleEn, courseId, questions, passingScore, afterEpisodeIndex, description } = req.body;
    try {
        db.prepare(`
            INSERT INTO quizzes (id, title, title_en, courseId, questions, passing_score, afterEpisodeIndex, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, title, titleEn, courseId, JSON.stringify(questions || []), passingScore || 70, afterEpisodeIndex, description || '');
        res.status(201).json({ success: true, id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Quiz
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, titleEn, courseId, questions, passingScore, afterEpisodeIndex, description } = req.body;
    try {
        db.prepare(`
            UPDATE quizzes 
            SET title = ?, title_en = ?, courseId = ?, questions = ?, passing_score = ?, afterEpisodeIndex = ?, description = ?
            WHERE id = ?
        `).run(title, titleEn, courseId, JSON.stringify(questions || []), passingScore || 70, afterEpisodeIndex, description || '', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Quiz
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);
        res.json({ success: true });
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
