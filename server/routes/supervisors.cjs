const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const { authenticateToken } = require('../middleware.cjs');

// Apply authentication middleware to all routes
router.use(authenticateToken);
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin only.' });
    }
}

// Get all supervisors
router.get('/', isAdmin, (req, res) => {
    try {
        const supervisors = db.prepare(`
            SELECT id, email, name, role, 
                   supervisor_capacity as supervisorCapacity, 
                   supervisor_priority as supervisorPriority 
            FROM users 
            WHERE role = 'supervisor' 
            ORDER BY supervisor_priority ASC
        `).all();

        const supervisorsWithStats = supervisors.map(sv => {
            const studentCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?').get(sv.id).count;
            return {
                ...sv,
                studentCount
            };
        });

        res.json(supervisorsWithStats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Promote a user to supervisor
router.post('/promote', isAdmin, (req, res) => {
    const { userId, capacity, priority } = req.body;
    try {
        db.prepare(`
            UPDATE users 
            SET role = 'supervisor', 
                supervisor_capacity = ?, 
                supervisor_priority = ? 
            WHERE id = ?
        `).run(capacity || 10, priority || 0, userId);
        res.json({ success: true, message: 'User promoted to supervisor' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update supervisor settings
router.post('/settings', isAdmin, (req, res) => {
    const { supervisorId, capacity, priority } = req.body;
    console.log('[DEBUG_SV_SETTINGS] Request:', { supervisorId, capacity, priority });
    try {
        const info = db.prepare(`
            UPDATE users 
            SET supervisor_capacity = ?, 
                supervisor_priority = ? 
            WHERE id = ? AND role = 'supervisor'
        `).run(capacity, priority, supervisorId);

        console.log('[DEBUG_SV_SETTINGS] Update Result:', info);

        if (info.changes === 0) {
            console.warn('[DEBUG_SV_SETTINGS] Warning: No rows updated. Check ID or Role.');
        }

        res.json({ success: true, message: 'Supervisor settings updated' });
    } catch (e) {
        console.error('[DEBUG_SV_SETTINGS] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Assign student to supervisor
router.post('/assign', isAdmin, (req, res) => {
    const { studentId, supervisorId } = req.body;
    console.log('[DEBUG_SV_ASSIGN] Request:', { studentId, supervisorId });
    try {
        // supervisorId can be null to assign to Admin
        const info = db.prepare('UPDATE users SET supervisor_id = ? WHERE id = ?').run(supervisorId || null, studentId);
        console.log('[DEBUG_SV_ASSIGN] Result:', info);
        res.json({ success: true, message: 'Student assigned successfully' });
    } catch (e) {
        console.error('[DEBUG_SV_ASSIGN] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Demote supervisor and reassign students
router.post('/demote', isAdmin, (req, res) => {
    const { supervisorId, targetSupervisorId } = req.body;
    try {
        db.transaction(() => {
            // Reassign students
            db.prepare('UPDATE users SET supervisor_id = ? WHERE supervisor_id = ?')
                .run(targetSupervisorId || null, supervisorId);

            // Demote supervisor
            db.prepare(`
                UPDATE users 
                SET role = 'student', 
                    supervisor_capacity = 0, 
                    supervisor_priority = 0,
                    supervisor_id = NULL
                WHERE id = ?
            `).run(supervisorId);
        })();
        res.json({ success: true, message: 'Supervisor demoted and students reassigned' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get students assigned to the current supervisor
router.get('/my-students', (req, res) => {
    try {
        const supervisorId = req.user.id;
        console.log('[DEBUG_MY_STUDENTS] Fetching for supervisor:', supervisorId);

        const students = db.prepare(`
            SELECT u.id, u.name, u.email, u.role, u.points, u.level, u.joinDate, u.status,
            (SELECT COUNT(*) FROM episode_progress ep WHERE ep.user_id = u.id AND ep.completed = 1) as completedLessons,
            (SELECT GROUP_CONCAT(c.title, ', ') FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = u.id) as activeCourses
            FROM users u
            WHERE u.supervisor_id = ?
        `).all(supervisorId);

        console.log(`[DEBUG_MY_STUDENTS] Found ${students.length} students`);
        res.json(students);
    } catch (e) {
        console.error('[DEBUG_MY_STUDENTS] ERROR:', e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
