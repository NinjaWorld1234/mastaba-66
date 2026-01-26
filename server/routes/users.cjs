const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');

// Get current user list (Admin)
router.get('/', (req, res) => {
    try {
        const users = db.prepare('SELECT id, name, email, role, points, level, joinDate, status FROM users').all();
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get students list
router.get('/students', (req, res) => {
    try {
        const users = db.prepare('SELECT id, name, email, role, points, level, joinDate, status FROM users').all();
        const students = users.filter(u => u.role === 'student');
        res.json(students);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create new user (Admin)
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role = 'student' } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check existing
        const existing = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user
        const hashedPassword = await require('bcryptjs').hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword,
            role,
            joinDate: new Date().toISOString().split('T')[0],
            points: 0,
            level: 1,
            emailVerified: 1
        };

        db.prepare('INSERT INTO users (id, name, email, password, role, joinDate, points, level, emailVerified) VALUES (@id, @name, @email, @password, @role, @joinDate, @points, @level, @emailVerified)')
            .run(newUser);

        const { password: _, ...userWithoutPass } = newUser;
        res.json(userWithoutPass);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update user profile
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values, id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete user
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Favorites ---

// Get current user's favorites
router.get('/:id/favorites', (req, res) => {
    const { id } = req.params;
    try {
        const favorites = db.prepare('SELECT * FROM favorites WHERE userId = ?').all(id);
        res.json(favorites);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Toggle favorite
router.post('/:id/favorites/toggle', (req, res) => {
    const { id: userId } = req.params;
    const { targetId, type } = req.body;

    try {
        // Check if exists
        const existing = db.prepare('SELECT * FROM favorites WHERE userId = ? AND targetId = ? AND type = ?')
            .get(userId, targetId, type);

        if (existing) {
            // Remove
            db.prepare('DELETE FROM favorites WHERE userId = ? AND targetId = ? AND type = ?')
                .run(userId, targetId, type);
            res.json({ action: 'removed', success: true });
        } else {
            // Add
            db.prepare('INSERT INTO favorites (userId, targetId, type) VALUES (?, ?, ?)')
                .run(userId, String(targetId), type);
            res.json({ action: 'added', success: true });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
