const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');

// Middleware to be passed from server.cjs or defined here
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Get all courses
router.get('/', (req, res) => {
    try {
        const courses = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
        const coursesWithEpisodes = courses.map(c => {
            const episodes = db.prepare('SELECT * FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all(c.id);
            return {
                id: String(c.id),
                title: c.title,
                titleEn: c.title_en,
                instructor: c.instructor,
                instructorEn: c.instructor_en,
                category: c.category,
                categoryEn: c.category_en,
                duration: c.duration,
                durationEn: c.duration_en,
                thumbnail: c.thumbnail,
                description: c.description,
                descriptionEn: c.description_en,
                lessonsCount: c.lessons_count,
                studentsCount: c.students_count,
                videoUrl: c.video_url,
                status: c.status,
                passingScore: c.passing_score,
                quizFrequency: c.quiz_frequency,
                episodes: episodes.map(ep => ({
                    id: String(ep.id),
                    courseId: String(ep.courseId),
                    title: ep.title,
                    titleEn: ep.title_en,
                    videoUrl: ep.videoUrl,
                    orderIndex: ep.orderIndex,
                    duration: ep.duration,
                    isLocked: !!ep.isLocked
                }))
            };
        });
        res.json(coursesWithEpisodes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update progress
router.post('/episode-progress', authenticateToken, (req, res) => {
    const { courseId, episodeId, completed } = req.body;
    try {
        db.prepare(`
            INSERT INTO episode_progress (user_id, course_id, episode_id, completed)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, episode_id) DO UPDATE SET completed = excluded.completed
        `).run(req.user.id, courseId, episodeId, completed ? 1 : 0);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create Course
router.post('/', authenticateToken, (req, res) => {
    const course = req.body;
    try {
        const stmt = db.prepare(`
            INSERT INTO courses (id, title, title_en, instructor, instructor_en, category, category_en, duration, duration_en, thumbnail, description, description_en, lessons_count, students_count, video_url, status, passing_score, quiz_frequency)
            VALUES (@id, @title, @title_en, @instructor, @instructor_en, @category, @category_en, @duration, @duration_en, @thumbnail, @description, @description_en, @lessons_count, @students_count, @video_url, @status, @passing_score, @quiz_frequency)
        `);

        stmt.run({
            id: String(course.id),
            title: course.title,
            title_en: course.titleEn || course.title,
            instructor: course.instructor,
            instructor_en: course.instructorEn || course.instructor,
            category: course.category,
            category_en: course.categoryEn || course.category,
            duration: course.duration,
            duration_en: course.durationEn || course.duration,
            thumbnail: course.thumbnail,
            description: course.description || '',
            description_en: course.descriptionEn || course.description || '',
            lessons_count: course.lessonsCount || (course.episodes ? course.episodes.length : 0),
            students_count: course.studentsCount || 0,
            video_url: course.videoUrl || '',
            status: course.status || 'published',
            passing_score: course.passingScore || 80,
            quiz_frequency: course.quizFrequency || 0
        });

        // Insert Episodes if any
        if (course.episodes && Array.isArray(course.episodes)) {
            const epStmt = db.prepare(`
                INSERT INTO episodes (id, courseId, title, title_en, duration, videoUrl, orderIndex, isLocked)
                VALUES (@id, @courseId, @title, @title_en, @duration, @videoUrl, @orderIndex, @isLocked)
            `);
            for (const ep of course.episodes) {
                epStmt.run({
                    id: ep.id ? String(ep.id) : ('ep_' + Date.now() + Math.random()),
                    courseId: String(course.id),
                    title: ep.title,
                    title_en: ep.titleEn || ep.title,
                    duration: ep.duration || '',
                    videoUrl: ep.videoUrl || '',
                    orderIndex: ep.orderIndex || 0,
                    isLocked: ep.isLocked ? 1 : 0
                });
            }
        }

        res.status(201).json({ success: true, id: course.id });
    } catch (e) {
        console.error('Error adding course:', e);
        res.status(500).json({ error: e.message });
    }
});

// Update Course
router.put('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        // Update basic course info
        const allowedFields = ['title', 'title_en', 'instructor', 'instructor_en', 'category', 'category_en', 'duration', 'duration_en', 'thumbnail', 'description', 'description_en', 'lessons_count', 'students_count', 'video_url', 'status', 'passing_score', 'quiz_frequency'];
        const fieldsToUpdate = Object.keys(updates).filter(k => allowedFields.includes(k) || k === 'titleEn' || k === 'instructorEn' || k === 'quizFrequency');

        if (fieldsToUpdate.length > 0) {
            const setClause = fieldsToUpdate.map(k => {
                const dbKey = k === 'titleEn' ? 'title_en' : k === 'instructorEn' ? 'instructor_en' : k === 'quizFrequency' ? 'quiz_frequency' : k;
                return `${dbKey} = ?`;
            }).join(', ');
            const values = fieldsToUpdate.map(k => updates[k]);
            db.prepare(`UPDATE courses SET ${setClause} WHERE id = ?`).run(...values, id);
        }

        // Sync Episodes
        if (updates.episodes && Array.isArray(updates.episodes)) {
            // Delete old ones
            db.prepare('DELETE FROM episodes WHERE courseId = ?').run(id);
            // Insert new ones
            const epStmt = db.prepare(`
                INSERT INTO episodes (id, courseId, title, title_en, duration, videoUrl, orderIndex, isLocked)
                VALUES (@id, @courseId, @title, @title_en, @duration, @videoUrl, @orderIndex, @isLocked)
            `);
            for (const ep of updates.episodes) {
                epStmt.run({
                    id: ep.id || ('ep_' + Date.now() + Math.random()),
                    courseId: id,
                    title: ep.title,
                    title_en: ep.titleEn || ep.title,
                    duration: ep.duration || '',
                    videoUrl: ep.videoUrl || '',
                    orderIndex: ep.orderIndex || 0,
                    isLocked: ep.isLocked ? 1 : 0
                });
            }
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Error updating course:', e);
        res.status(500).json({ error: e.message });
    }
});

// Delete Course
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM courses WHERE id = ?').run(id);
        // Cascading delete handles episodes and enrollments if configured (FOREIGN KEY ... ON DELETE CASCADE)
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
