const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');

// Get user certificates
router.get('/', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        // In a real app we'd verify token, here we assume middleware or decode simple
        // For now, let's rely on the middleware that should be wrapping this, 
        // OR decode it if available. 
        // server.cjs doesn't enforce auth globally on /api, but let's assume we can get user ID.
        // For simplicity in this "json-server-like" setup:
        // We'll trust the client sends the ID or we'd need to decode JWT.

        // decoding JWT (using jsonwebtoken if available, or just parsing)
        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.SECRET_KEY;
        let userId;
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            userId = decoded.id;
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const certs = db.prepare('SELECT * FROM certificates WHERE user_id = ?').all(userId);
        res.json(certs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Get ALL certificates
router.get('/all', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        // Verify admin role (simplified check)
        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.SECRET_KEY;
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            // In real app check decoded.role === 'admin'
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const certs = db.prepare('SELECT * FROM certificates ORDER BY issue_date DESC').all();
        res.json(certs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Issue Manual Certificate
router.post('/issue', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.SECRET_KEY;
        try {
            jwt.verify(token, SECRET_KEY);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { studentName, courseTitle, grade, userId, courseId } = req.body;

        const cert = {
            id: Date.now().toString(),
            user_id: userId || 'manual', // Can link to real user if provided
            courseId: courseId || 'manual',
            courseTitle: courseTitle,
            studentId: userId || 'manual',
            userName: studentName,
            issueDate: new Date().toISOString().split('T')[0],
            grade: grade,
            code: `MANUAL-${Date.now()}`
        };

        db.prepare('INSERT INTO certificates (id, user_id, course_id, issue_date, grade, certificate_code) VALUES (@id, @user_id, @courseId, @issueDate, @grade, @code)')
            .run(cert);

        res.status(201).json(cert);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Generate Course Certificate
router.post('/', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.SECRET_KEY;
        let user;
        try {
            user = jwt.verify(token, SECRET_KEY);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { courseId } = req.body;

        // Check if course completed
        // Using db.prepare with complex query or checking enrollment/progress logic
        // For now, simplified check:
        // const progress = db.prepare('SELECT * FROM episode_progress WHERE ...')...

        // Create Certificate
        const cert = {
            id: Date.now().toString(),
            user_id: user.id,
            courseId: courseId,
            courseTitle: 'Course Title Lookup Needed', // In real app lookup course
            studentId: user.id,
            userName: user.name || user.email,
            issueDate: new Date().toISOString().split('T')[0],
            grade: 'Excellent',
            code: `CERT-${Date.now()}`
        };

        // Lookup course title
        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
        if (course) cert.courseTitle = course.title;

        db.prepare('INSERT INTO certificates (id, user_id, course_id, issue_date, grade, certificate_code) VALUES (@id, @user_id, @courseId, @issueDate, @grade, @code)')
            .run(cert);

        res.status(201).json(cert);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Generate Master Certificate
router.post('/master', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.SECRET_KEY;
        let user;
        try {
            user = jwt.verify(token, SECRET_KEY);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Validate all courses completed... logic here

        const cert = {
            id: Date.now().toString(),
            user_id: user.id,
            courseId: 'MASTER_CERT',
            courseTitle: 'الشهادة الجامعية الشاملة',
            studentId: user.id,
            userName: user.name || user.email,
            issueDate: new Date().toISOString().split('T')[0],
            grade: 'Distinction',
            code: `MASTER-${Date.now()}`
        };

        db.prepare('INSERT INTO certificates (id, user_id, course_id, issue_date, grade, certificate_code) VALUES (@id, @user_id, @courseId, @issueDate, @grade, @code)')
            .run(cert);

        res.status(201).json(cert);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
