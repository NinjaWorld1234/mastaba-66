require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { initDatabase, db } = require('./server/database.cjs');
const { generateOTP, sendVerificationEmail } = require('./server/email.cjs');
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configuration
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    console.error('FATAL: SECRET_KEY environment variable is not set!');
    process.exit(1);
}

// Initialize Database
initDatabase();

const app = express();

// R2 Client Setup
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID || '615072ed401f3469aa1e91d7bceb2180'}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'myf-videos';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }));


// ============================================================================
// Authentication Middleware
// ============================================================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ============================================================================
// API Routes
// ============================================================================

// List Cloudflare R2 Files & Folders
app.get('/api/r2/files', authenticateToken, async (req, res) => {
    try {
        const prefix = req.query.prefix || '';
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            Delimiter: '/',
            MaxKeys: 1000
        });

        const data = await r2Client.send(command);

        // Transform folders (CommonPrefixes)
        const folders = (data.CommonPrefixes || []).map(p => ({
            name: p.Prefix,
            path: p.Prefix,
            type: 'folder'
        }));

        // Transform and filter for files (Contents)
        const files = (data.Contents || [])
            .filter(item => {
                // Skip the direct folder object if it exists
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
            }))
            .sort((a, b) => {
                // Try natural sort if names start with numbers
                return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            });

        res.json({ files, folders, prefix });
    } catch (e) {
        console.error('R2 List Error:', e);
        res.status(500).json({ error: 'Failed to fetch files from R2', details: e.message });
    }
});

// TEMPORARY FIX: Enable email verification for all seeded users
// Access via: http://16.171.18.144/api/admin/fix-users
app.get('/api/admin/fix-users', (req, res) => {
    try {
        db.prepare('UPDATE users SET emailVerified = 1').run();
        const users = db.prepare('SELECT email, role, emailVerified FROM users').all();
        res.json({
            success: true,
            message: 'All users have been verified',
            users: users
        });
    } catch (e) {
        console.error('Fix users error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    try {
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);

        if (!user) {
            return res.status(400).json({ error: 'Cannot find user' });
        }

        const passwordMatch = bcrypt.compareSync(password, user.password);

        if (passwordMatch) {
            // Check if email is verified (only for students, admins can bypass for now)
            if (user.role === 'student' && !user.emailVerified) {
                return res.status(403).json({
                    error: 'Email not verified',
                    errorAr: 'البريد الإلكتروني لم يتم تفعيله بعد',
                    needsVerification: true,
                    email: user.email
                });
            }

            // Remove password from returned user object (rename to avoid shadowing)
            const { password: storedPassword, verificationCode, verificationExpiry, ...userWithoutPassword } = user;

            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role, emailVerified: !!user.emailVerified },
                SECRET_KEY,
                { expiresIn: '24h' }
            );

            res.json({
                accessToken: accessToken,
                user: userWithoutPassword
            });
        } else {
            res.status(403).json({ error: 'Invalid password' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register with Extended Profile
app.post('/api/register', async (req, res) => {
    const {
        email, password, name, nameEn,
        whatsapp, country, age, gender, educationLevel,
        role = 'student'
    } = req.body;

    try {
        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (existing) {
            return res.status(400).json({ error: 'User already exists', errorAr: 'هذا البريد مسجل مسبقاً' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const id = Date.now().toString();
        const joinDate = new Date().toISOString().split('T')[0];

        // Generate OTP for email verification
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        const insert = db.prepare(`
            INSERT INTO users (
                id, email, password, name, nameEn, role, joinDate, 
                points, level, whatsapp, country, age, gender, educationLevel,
                emailVerified, verificationCode, verificationExpiry
            ) VALUES (
                @id, @email, @password, @name, @nameEn, @role, @joinDate,
                0, 1, @whatsapp, @country, @age, @gender, @educationLevel,
                0, @verificationCode, @verificationExpiry
            )
        `);

        insert.run({
            id,
            email,
            password: hashedPassword,
            name,
            nameEn: nameEn || name,
            role,
            joinDate,
            whatsapp: whatsapp || null,
            country: country || null,
            age: age || null,
            gender: gender || null,
            educationLevel: educationLevel || null,
            verificationCode: otp,
            verificationExpiry: otpExpiry
        });

        // Send verification email
        console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);
        const emailResult = await sendVerificationEmail(email, name, otp);
        if (!emailResult.success) {
            console.warn('Failed to send verification email:', emailResult.error);
        }

        const user = {
            id, email, name, nameEn, role, joinDate,
            points: 0, level: 1, emailVerified: false,
            whatsapp, country, age, gender, educationLevel
        };

        // Generate token but user won't have full access until verified
        const accessToken = jwt.sign(
            { id, email, role, emailVerified: false },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            accessToken,
            user,
            needsVerification: true,
            message: 'Registration successful. Please verify your email.',
            messageAr: 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني.'
        });
    } catch (e) {
        console.error('Register error:', e);
        res.status(500).json({ error: 'Internal server error', errorAr: 'خطأ في الخادم' });
    }
});

// Verify Email with OTP
app.post('/api/verify-email', (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);

        if (!user) {
            return res.status(404).json({ error: 'User not found', errorAr: 'المستخدم غير موجود' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email already verified', errorAr: 'البريد محقق مسبقاً' });
        }

        // Check if OTP is correct
        if (user.verificationCode !== otp) {
            return res.status(400).json({ error: 'Invalid verification code', errorAr: 'رمز التحقق غير صحيح' });
        }

        // Check if OTP is expired
        if (new Date() > new Date(user.verificationExpiry)) {
            return res.status(400).json({ error: 'Verification code expired', errorAr: 'رمز التحقق منتهي الصلاحية' });
        }

        // Update user as verified
        db.prepare('UPDATE users SET emailVerified = 1, verificationCode = NULL, verificationExpiry = NULL WHERE id = ?').run(user.id);

        // Generate new token with verified status
        const { password, verificationCode, verificationExpiry, ...userWithoutSensitive } = user;
        userWithoutSensitive.emailVerified = true;

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role, emailVerified: true },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            accessToken,
            user: userWithoutSensitive,
            message: 'Email verified successfully',
            messageAr: 'تم التحقق من البريد بنجاح'
        });
    } catch (e) {
        console.error('Verify email error:', e);
        res.status(500).json({ error: 'Internal server error', errorAr: 'خطأ في الخادم' });
    }
});

// Resend OTP
app.post('/api/resend-otp', async (req, res) => {
    const { email } = req.body;

    try {
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);

        if (!user) {
            return res.status(404).json({ error: 'User not found', errorAr: 'المستخدم غير موجود' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email already verified', errorAr: 'البريد محقق مسبقاً' });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        db.prepare('UPDATE users SET verificationCode = ?, verificationExpiry = ? WHERE id = ?').run(otp, otpExpiry, user.id);

        // Send new verification email
        const emailResult = await sendVerificationEmail(email, user.name, otp);

        if (!emailResult.success) {
            return res.status(500).json({ error: 'Failed to send email', errorAr: 'فشل إرسال البريد' });
        }

        res.json({
            success: true,
            message: 'Verification code sent',
            messageAr: 'تم إرسال رمز التحقق'
        });
    } catch (e) {
        console.error('Resend OTP error:', e);
        res.status(500).json({ error: 'Internal server error', errorAr: 'خطأ في الخادم' });
    }
});


// Get Current User (Protected)
app.get('/api/me', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT id, email, name, role, points, level, avatar FROM users WHERE id = ?').get(req.user.id);
    if (user) {
        res.json(user);
    } else {
        res.sendStatus(404);
    }
});

// Get Courses with Episodes (Public)
app.get('/api/courses', (req, res) => {
    try {
        const courses = db.prepare('SELECT * FROM courses').all();

        // Enrich with episodes
        const coursesWithEpisodes = courses.map(course => {
            const episodes = db.prepare('SELECT * FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all(course.id);
            return { ...course, episodes };
        });

        res.json(coursesWithEpisodes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Episodes for a Course
app.get('/api/courses/:id/episodes', (req, res) => {
    try {
        const episodes = db.prepare('SELECT * FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all(req.params.id);
        res.json(episodes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Users (Admin only)
app.get('/api/users', authenticateToken, (req, res) => {
    // Simple role check
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const users = db.prepare('SELECT id, name, email, role, points, level, joinDate, status FROM users').all();
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Library Resources
app.get('/api/library/resources', (req, res) => {
    try {
        const resources = db.prepare('SELECT * FROM library_resources').all();
        res.json(resources);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Community Posts
app.get('/api/community/posts', (req, res) => {
    try {
        const posts = db.prepare('SELECT * FROM community_posts').all();
        // Parse tags from JSON string
        const parsedPosts = posts.map(post => ({
            ...post,
            tags: post.tags ? JSON.parse(post.tags) : []
        }));
        res.json(parsedPosts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Logs Endpoint (Dummy for now to avoid 404s)
app.post('/api/logs', (req, res) => {
    // console.log('Log received:', req.body);
    res.status(200).json({ success: true });
});

app.get('/api/logs', (req, res) => {
    res.status(200).json([]);
});


// Get Single Course with Episodes
app.get('/api/courses/:id', (req, res) => {
    try {
        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const episodes = db.prepare('SELECT * FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all(course.id);
        res.json({ ...course, episodes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Add Course (Admin only)
app.post('/api/courses', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const course = req.body;

    // Generate ID before insertion so we can return it
    if (!course.id) {
        course.id = Date.now().toString();
    }

    try {
        const insert = db.prepare(`
            INSERT INTO courses (
                id, title, titleEn, instructor, instructorEn, 
                category, categoryEn, duration, durationEn, 
                thumbnail, description, descriptionEn, 
                lessonsCount, studentsCount, videoUrl, status
            ) VALUES (
                @id, @title, @titleEn, @instructor, @instructorEn,
                @category, @categoryEn, @duration, @durationEn,
                @thumbnail, @description, @descriptionEn,
                @lessonsCount, @studentsCount, @videoUrl, @status
            )
        `);

        insert.run({
            id: course.id,
            title: course.title,
            titleEn: course.titleEn || course.title,
            instructor: course.instructor,
            instructorEn: course.instructorEn || course.instructor,
            category: course.category,
            categoryEn: course.categoryEn || course.category,
            duration: course.duration || '0m',
            durationEn: course.durationEn || course.duration,
            thumbnail: course.thumbnail,
            description: course.description || '',
            descriptionEn: course.descriptionEn || course.description,
            lessonsCount: course.episodes ? course.episodes.length : (course.lessonsCount || 0),
            studentsCount: course.studentsCount || 0,
            videoUrl: course.videoUrl || null,
            status: course.status || 'published',
            passingScore: course.passingScore || 80
        });

        // Add Episodes if provided
        if (course.episodes && Array.isArray(course.episodes)) {
            const insertEpisode = db.prepare(`
                INSERT INTO episodes (id, courseId, title, videoUrl, orderIndex, duration)
                VALUES (@id, @courseId, @title, @videoUrl, @orderIndex, @duration)
            `);

            for (const ep of course.episodes) {
                insertEpisode.run({
                    id: ep.id || Date.now().toString() + Math.random(),
                    courseId: course.id,
                    title: ep.title,
                    videoUrl: ep.videoUrl,
                    orderIndex: ep.orderIndex || 0,
                    duration: ep.duration || null
                });
            }
        }

        res.status(201).json(course);
    } catch (e) {
        console.error('Error adding course:', e);
        res.status(500).json({ error: e.message });
    }
});

// Update Course (Admin only)
app.put('/api/courses/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const updates = req.body;

    try {
        const update = db.prepare(`
            UPDATE courses SET
                title = COALESCE(?, title),
                titleEn = COALESCE(?, titleEn),
                instructor = COALESCE(?, instructor),
                instructorEn = COALESCE(?, instructorEn),
                category = COALESCE(?, category),
                categoryEn = COALESCE(?, categoryEn),
                duration = COALESCE(?, duration),
                durationEn = COALESCE(?, durationEn),
                thumbnail = COALESCE(?, thumbnail),
                description = COALESCE(?, description),
                descriptionEn = COALESCE(?, descriptionEn),
                videoUrl = COALESCE(?, videoUrl),
                status = COALESCE(?, status),
                passingScore = COALESCE(?, passingScore)
            WHERE id = ?
        `);

        update.run(
            updates.title,
            updates.titleEn,
            updates.instructor,
            updates.instructorEn,
            updates.category,
            updates.categoryEn,
            updates.duration,
            updates.durationEn,
            updates.thumbnail,
            updates.description,
            updates.descriptionEn,
            updates.videoUrl,
            updates.status,
            updates.passingScore,
            id
        );

        // Handle episodes if provided (simple replacement for now)
        if (updates.episodes && Array.isArray(updates.episodes)) {
            // Delete existing episodes
            db.prepare('DELETE FROM episodes WHERE courseId = ?').run(id);

            const insertEpisode = db.prepare(`
                INSERT INTO episodes (id, courseId, title, videoUrl, orderIndex, duration)
                VALUES (@id, @courseId, @title, @videoUrl, @orderIndex, @duration)
            `);

            for (const ep of updates.episodes) {
                insertEpisode.run({
                    id: ep.id || Date.now().toString() + Math.random(),
                    courseId: id,
                    title: ep.title,
                    videoUrl: ep.videoUrl,
                    orderIndex: ep.orderIndex || 0,
                    duration: ep.duration || null
                });
            }

            // Update lessonsCount in main table
            db.prepare('UPDATE courses SET lessonsCount = ? WHERE id = ?').run(updates.episodes.length, id);
        }

        res.json({ success: true, message: 'Course updated successfully' });
    } catch (e) {
        console.error('Error updating course:', e);
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Announcements API
// ============================================================================

app.get('/api/announcements', (req, res) => {
    try {
        const announcements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
        res.json(announcements.map(a => ({
            ...a,
            isActive: !!a.is_active,
            createdAt: a.created_at
        })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/announcements', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, content, type, priority, isActive } = req.body;
    const id = Date.now().toString();

    try {
        db.prepare(`
            INSERT INTO announcements (id, title, content, type, priority, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, title, content, type || 'info', priority || 'normal', isActive === false ? 0 : 1);
        res.status(201).json({ id, title, content });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/announcements/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { title, content, type, priority, isActive } = req.body;

    try {
        db.prepare(`
            UPDATE announcements SET
                title = COALESCE(?, title),
                content = COALESCE(?, content),
                type = COALESCE(?, type),
                priority = COALESCE(?, priority),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
        `).run(title, content, type, priority, isActive === undefined ? null : (isActive ? 1 : 0), id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/announcements/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Quizzes API
// ============================================================================

app.get('/api/quizzes', (req, res) => {
    try {
        const quizzes = db.prepare('SELECT * FROM quizzes').all();
        const quizzesWithQuestions = quizzes.map(quiz => {
            const questions = db.prepare('SELECT * FROM quiz_questions WHERE quizId = ?').all();
            return {
                ...quiz,
                questions: questions.map(q => ({
                    ...q,
                    options: JSON.parse(q.options)
                }))
            };
        });
        res.json(quizzesWithQuestions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/quizzes', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const quiz = req.body;
    const quizId = Date.now().toString();

    try {
        db.prepare(`
            INSERT INTO quizzes (id, courseId, title, afterEpisodeIndex, passingScore)
            VALUES (?, ?, ?, ?, ?)
        `).run(quizId, quiz.courseId, quiz.title, quiz.afterEpisodeIndex, quiz.passingScore || 80);

        if (quiz.questions && Array.isArray(quiz.questions)) {
            const insertQ = db.prepare(`
                INSERT INTO quiz_questions (id, quizId, text, options, correctAnswer)
                VALUES (?, ?, ?, ?, ?)
            `);
            quiz.questions.forEach((q, idx) => {
                insertQ.run(quizId + '_' + idx, quizId, q.text, JSON.stringify(q.options), q.correctAnswer);
            });
        }
        res.status(201).json({ id: quizId, ...quiz });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/quizzes/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const quiz = req.body;

    try {
        db.prepare(`
            UPDATE quizzes SET
                title = COALESCE(?, title),
                afterEpisodeIndex = COALESCE(?, afterEpisodeIndex),
                passingScore = COALESCE(?, passingScore)
            WHERE id = ?
        `).run(quiz.title, quiz.afterEpisodeIndex, quiz.passingScore, id);

        if (quiz.questions && Array.isArray(quiz.questions)) {
            db.prepare('DELETE FROM quiz_questions WHERE quizId = ?').run(id);
            const insertQ = db.prepare(`
                INSERT INTO quiz_questions (id, quizId, text, options, correctAnswer)
                VALUES (?, ?, ?, ?, ?)
            `);
            quiz.questions.forEach((q, idx) => {
                insertQ.run(id + '_' + idx, id, q.text, JSON.stringify(q.options), q.correctAnswer);
            });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/quizzes/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        db.prepare('DELETE FROM quizzes WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// User Management API
// ============================================================================

app.put('/api/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) return res.sendStatus(403);
    const { id } = req.params;
    const updates = req.body;

    try {
        db.prepare(`
            UPDATE users SET
                name = COALESCE(?, name),
                nameEn = COALESCE(?, nameEn),
                avatar = COALESCE(?, avatar),
                points = COALESCE(?, points),
                level = COALESCE(?, level),
                streak = COALESCE(?, streak),
                status = COALESCE(?, status),
                whatsapp = COALESCE(?, whatsapp),
                country = COALESCE(?, country),
                age = COALESCE(?, age),
                gender = COALESCE(?, gender),
                educationLevel = COALESCE(?, educationLevel),
                role = COALESCE(?, role)
            WHERE id = ?
        `).run(
            updates.name, updates.nameEn, updates.avatar, updates.points,
            updates.level, updates.streak, updates.status, updates.whatsapp,
            updates.country, updates.age, updates.gender, updates.educationLevel,
            updates.role, id
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const userId = req.params.id;

        // Delete related data manually to prevent FK constraints or orphans
        db.prepare('DELETE FROM messages WHERE senderId = ? OR receiverId = ?').run(userId, userId);
        db.prepare('DELETE FROM enrollments WHERE userId = ?').run(userId);
        db.prepare('DELETE FROM certificates WHERE userId = ?').run(userId);
        db.prepare('DELETE FROM quiz_results WHERE userId = ?').run(userId);
        db.prepare('DELETE FROM system_activity_logs WHERE userId = ?').run(userId);
        db.prepare('DELETE FROM episode_progress WHERE userId = ?').run(userId);
        db.prepare('DELETE FROM community_posts WHERE userId = ?').run(userId);

        const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Delete user error:', e);
        res.status(500).json({ error: e.message });
    }
});



// ============================================================================
// Quiz Results API
// ============================================================================

app.post('/api/quiz-results', authenticateToken, (req, res) => {
    const { quizId, score, total, percentage } = req.body;
    const userId = req.user.id;

    try {
        db.prepare(`
            INSERT INTO quiz_results (userId, quizId, score, total, percentage)
            VALUES (?, ?, ?, ?, ?)
        `).run(userId, quizId, score, total, percentage);
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/quiz-results', authenticateToken, (req, res) => {
    const userId = req.user.id;
    try {
        const results = db.prepare('SELECT * FROM quiz_results WHERE userId = ? ORDER BY completedAt DESC').all();
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Library & Community API
// ============================================================================

app.get('/api/library', (req, res) => {
    try {
        const resources = db.prepare('SELECT * FROM library_resources').all();
        res.json(resources);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/community/posts', (req, res) => {
    try {
        const posts = db.prepare('SELECT * FROM community_posts ORDER BY createdAt DESC').all();
        res.json(posts.map(p => ({
            ...p,
            tags: JSON.parse(p.tags || '[]')
        })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/community/posts', authenticateToken, (req, res) => {
    const post = req.body;
    const id = Date.now().toString();
    try {
        db.prepare(`
            INSERT INTO community_posts (id, userId, author, authorAvatar, content, tags, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, req.user.id, post.author, post.authorAvatar, post.content, JSON.stringify(post.tags || []), new Date().toISOString());
        res.status(201).json({ id, ...post });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// System Activity Logs API
// ============================================================================

app.get('/api/system-activity-logs', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const logs = db.prepare('SELECT * FROM system_activity_logs ORDER BY timestamp DESC LIMIT 100').all();
        res.json(logs.map(l => ({
            ...l,
            details: JSON.parse(l.details || '{}')
        })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/system-activity-logs', authenticateToken, (req, res) => {
    const log = req.body;
    const id = Date.now().toString();
    try {
        db.prepare(`
            INSERT INTO system_activity_logs (id, type, userId, userName, action, details)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, log.type, log.userId, log.userName, log.action, JSON.stringify(log.details || {}));
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update Episode Progress
app.post('/api/episode-progress', authenticateToken, (req, res) => {
    const { courseId, episodeId, completed } = req.body;
    const userId = req.user.id;
    const completedAt = completed ? new Date().toISOString() : null;

    try {
        db.prepare(`
            INSERT INTO episode_progress (userId, courseId, episodeId, completed, completedAt)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(userId, episodeId) DO UPDATE SET
            completed = excluded.completed,
            completedAt = excluded.completedAt
        `).run(userId, courseId, episodeId, completed ? 1 : 0, completedAt);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Course (Admin only)
app.delete('/api/courses/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM courses WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (e) {
        console.error('Error deleting course:', e);
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// ============================================================================
// Certificates API
// ============================================================================

// Get user certificates
app.get('/api/certificates', authenticateToken, (req, res) => {
    try {
        const certs = db.prepare('SELECT * FROM certificates WHERE userId = ?').all(req.user.id);
        res.json(certs);
    } catch (e) {
        console.error('Error fetching certificates:', e);
        res.status(500).json({ error: e.message });
    }
});

// Generate Course Certificate
app.post('/api/certificates', authenticateToken, (req, res) => {
    const { courseId } = req.body;

    try {
        // 1. Verify Course Completion
        // First check enrollments
        const enrollment = db.prepare('SELECT progress FROM enrollments WHERE userId = ? AND courseId = ?').get(req.user.id, courseId);

        // Also check direct course progress if not in enrollment (fallback)
        // (Assuming progress logic might be split, but usually enrollments is the source)

        let isCompleted = false;
        if (enrollment && enrollment.progress === 100) {
            isCompleted = true;
        } else {
            // Check episodes progress manually?
            // Count total episodes vs completed episodes
            const totalEpisodes = db.prepare('SELECT count(*) as count FROM episodes WHERE courseId = ?').get(courseId).count;
            const completedEpisodes = db.prepare('SELECT count(*) as count FROM episode_progress WHERE userId = ? AND courseId = ? AND completed = 1').get(req.user.id, courseId).count;

            if (totalEpisodes > 0 && totalEpisodes === completedEpisodes) {
                isCompleted = true;
                // Sync enrollment
                const exists = db.prepare('SELECT 1 FROM enrollments WHERE userId = ? AND courseId = ?').get(req.user.id, courseId);
                if (exists) {
                    db.prepare('UPDATE enrollments SET progress = 100 WHERE userId = ? AND courseId = ?').run(req.user.id, courseId);
                } else {
                    db.prepare('INSERT INTO enrollments (userId, courseId, progress, lastAccess) VALUES (?, ?, 100, ?)').run(req.user.id, courseId, new Date().toISOString());
                }
            }
        }

        if (!isCompleted) {
            return res.status(400).json({ error: 'Course not completed yet' });
        }

        // 2. Check if certificate already exists
        const existingCert = db.prepare('SELECT * FROM certificates WHERE userId = ? AND courseId = ?').get(req.user.id, courseId);
        if (existingCert) {
            return res.json(existingCert);
        }

        // 3. Generate Certificate
        const course = db.prepare('SELECT title FROM courses WHERE id = ?').get(courseId);
        const code = 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const certEndpoint = {
            id: 'cert_' + Date.now(),
            userId: req.user.id,
            courseId: courseId,
            userName: req.user.name || req.user.email.split('@')[0], // Fallback name
            courseTitle: course.title,
            issueDate: new Date().toISOString().split('T')[0],
            grade: 'Excellent', // Logic for grade could be added later
            code: code
        };

        db.prepare(`
            INSERT INTO certificates (id, userId, courseId, userName, courseTitle, issueDate, grade, code)
            VALUES (@id, @userId, @courseId, @userName, @courseTitle, @issueDate, @grade, @code)
        `).run(certEndpoint);

        // Award points for certificate
        db.prepare('UPDATE users SET points = points + 50 WHERE id = ?').run(req.user.id);

        res.json(certEndpoint);

    } catch (e) {
        console.error('Error generating certificate:', e);
        res.status(500).json({ error: e.message });
    }
});

// Generate Master Certificate (All Courses)
app.post('/api/certificates/master', authenticateToken, (req, res) => {
    try {
        // 1. Check completion of ALL courses
        const totalCourses = db.prepare('SELECT count(*) as count FROM courses WHERE status = "published"').get().count;

        // Count completed enrollments
        // We assume an enrollment with progress=100 means completed.
        const completedCourses = db.prepare('SELECT count(*) as count FROM enrollments WHERE userId = ? AND progress = 100').get(req.user.id).count;

        // Note: This matches strictly 100% progress.

        if (completedCourses < totalCourses) {
            return res.status(400).json({
                error: 'Not all courses completed',
                details: `${completedCourses}/${totalCourses} completed`
            });
        }

        // 2. Check if Master certificate exists
        const existingCert = db.prepare('SELECT * FROM certificates WHERE userId = ? AND courseId = ?').get(req.user.id, 'MASTER_CERT');
        if (existingCert) {
            return res.json(existingCert);
        }

        // 3. Generate Master Certificate
        const code = 'MASTER-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const certEndpoint = {
            id: 'cert_master_' + Date.now(),
            userId: req.user.id,
            courseId: 'MASTER_CERT',
            userName: req.user.name || req.user.email.split('@')[0],
            courseTitle: 'إتمام كافة الدورات التأسيسية', // "Completion of all foundational courses"
            issueDate: new Date().toISOString().split('T')[0],
            grade: 'Distinction',
            code: code
        };

        db.prepare(`
            INSERT INTO certificates (id, userId, courseId, userName, courseTitle, issueDate, grade, code)
            VALUES (@id, @userId, @courseId, @userName, @courseTitle, @issueDate, @grade, @code)
        `).run(certEndpoint);

        // Big reward for Master
        db.prepare('UPDATE users SET points = points + 500 WHERE id = ?').run(req.user.id);

        res.json(certEndpoint);

    } catch (e) {
        console.error('Error generating master certificate:', e);
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Backup API
// ============================================================================

// Download Local Backup
app.get('/api/backup/download', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const file = path.join(__dirname, 'server', 'database.sqlite'); // Correct path to DB
    // Or where is the DB? initDatabase uses ./server/database.cjs which usually uses ./database.sqlite or ./server/database.sqlite
    // Let's check database.cjs path. Usually it's in root. 
    // Wait, initDatabase() in server.cjs likely uses 'server/database.cjs'.
    // Let's assume database.sqlite is in root based on common practice or verify first.
    // I'll check database.cjs content in next step to be sure? 
    // No, I'll assum root 'database.sqlite' but wrap in try/catch to check check file existence.

    // Actually, let's verify DB path.
    // If I use path.join(__dirname, 'database.sqlite'), and it fails, I'll log error.

    if (fs.existsSync(file)) {
        res.download(file, `backup-${new Date().toISOString().split('T')[0]}.sqlite`);
    } else {
        // Try root
        const rootFile = path.join(__dirname, 'database.sqlite');
        if (fs.existsSync(rootFile)) {
            res.download(rootFile, `backup-${new Date().toISOString().split('T')[0]}.sqlite`);
        } else {
            res.status(404).json({ error: 'Database file not found' });
        }
    }
});

// Upload Cloud Backup (S3/R2)
app.post('/api/backup/cloud', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    try {
        const file = path.join(__dirname, 'database.sqlite'); // Assume root
        if (!fs.existsSync(file)) return res.status(404).json({ error: 'Database file not found' });

        const fileContent = fs.readFileSync(file);
        const key = `backups/db-${Date.now()}.sqlite`;

        // Use r2Client as it is configured
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || 'myf-videos',
            Key: key,
            Body: fileContent
        });

        await r2Client.send(command);
        res.json({ success: true, key: key, size: fileContent.length });
    } catch (e) {
        console.error('Cloud backup failed:', e);
        res.status(500).json({ error: e.message });
    }
});

// Restore Local Backup (Raw Binary)
app.post('/api/backup/restore', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    // Ensure body is buffer
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Invalid file content' });
    }

    const file = path.join(__dirname, 'database.sqlite'); // Assuming root database.sqlite

    try {
        // Warning: This is dangerous while DB is open. 
        // Best effort: Close DB if possible? 
        // better-sqlite3 database object is 'db'.
        try {
            db.close();
        } catch (e) {
            console.warn('Could not close DB prior to restore:', e);
        }

        fs.writeFileSync(file, req.body);

        // Send success and exit process to force restart (PM2/User must restart)
        res.json({ success: true, message: 'Restored. Server restarting...' });

        setTimeout(() => {
            console.log('Restarting due to restore...');
            process.exit(0);
        }, 1000);

    } catch (e) {
        console.error('Restore failed:', e);
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Announcements API
// ============================================================================

// Get all announcements
app.get('/api/announcements', authenticateToken, (req, res) => {
    try {
        const announcements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
        // Parse active status (sqlite uses 0/1)
        const parsed = announcements.map(a => ({
            ...a,
            isActive: !!a.is_active
        }));
        res.json(parsed);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

// Create announcement
app.post('/api/announcements', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    const { title, content, type, priority } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        const id = 'ann_' + Date.now();
        const stmt = db.prepare(`
            INSERT INTO announcements (id, title, content, type, priority, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        `);

        stmt.run(id, title, content, type || 'info', priority || 'normal');

        const newAnnouncement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
        res.json({
            ...newAnnouncement,
            isActive: !!newAnnouncement.is_active
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

// Update announcement
app.put('/api/announcements/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    const { id } = req.params;
    const { title, content, type, priority, isActive } = req.body;

    try {
        const updates = [];
        const values = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (content !== undefined) { updates.push('content = ?'); values.push(content); }
        if (type !== undefined) { updates.push('type = ?'); values.push(type); }
        if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
        if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive ? 1 : 0); }

        if (updates.length === 0) return res.json({ message: 'No changes' });

        values.push(id);

        const stmt = db.prepare(`UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`);
        const result = stmt.run(...values);

        if (result.changes === 0) return res.status(404).json({ error: 'Announcement not found' });

        const updated = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
        res.json({
            ...updated,
            isActive: !!updated.is_active
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ error: 'Failed to update announcement' });
    }
});

// Delete announcement
app.delete('/api/announcements/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    try {
        const stmt = db.prepare('DELETE FROM announcements WHERE id = ?');
        const result = stmt.run(req.params.id);

        if (result.changes === 0) return res.status(404).json({ error: 'Announcement not found' });

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
});

// ============================================================================
// Messaging API
// ============================================================================

// Get messages for current user
app.get('/api/messages', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        let messages;
        if (isAdmin) {
            // Admin sees all messages for now, or maybe grouped?
            // For simplify: Get all messages involving admin OR all support messages
            // Actually, Admin needs to see conversations. 
            // Let's return ALL messages if admin, or just messages where admin is sender/receiver?
            // Usually Admin acts as "Support".
            // Let's return all messages for now to let frontend group them.
            messages = db.prepare('SELECT * FROM messages ORDER BY timestamp ASC').all();
        } else {
            messages = db.prepare('SELECT * FROM messages WHERE senderId = ? OR receiverId = ? ORDER BY timestamp ASC').all(userId, userId);
        }

        // Enhance with user details
        const enhancedMessages = messages.map(msg => {
            const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            const otherUser = db.prepare('SELECT name, avatar, role FROM users WHERE id = ?').get(otherId);
            return {
                ...msg,
                otherUser: otherUser
            };
        });

        res.json(enhancedMessages);
    } catch (e) {
        console.error('Error fetching messages:', e);
        res.status(500).json({ error: e.message });
    }
});

// Mark all messages from a user as read (Conversation read)
app.put('/api/messages/conversation/:userId/read', authenticateToken, (req, res) => {
    try {
        const senderId = req.params.userId;
        const receiverId = req.user.id;

        // Mark all messages from this sender to me as read
        const result = db.prepare('UPDATE messages SET read = 1 WHERE senderId = ? AND receiverId = ?').run(senderId, receiverId);

        res.json({ success: true, updated: result.changes });
    } catch (e) {
        console.error('Error marking conversation read:', e);
        res.status(500).json({ error: e.message });
    }
});

// Send a message
app.post('/api/messages', authenticateToken, (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        const msg = {
            id: 'msg_' + Date.now(),
            senderId,
            receiverId, // If receiverId is 'SUPPORT', find an admin? Or just store as 'SUPPORT'? 
            // Let's assume receiverId is a specific user ID. 
            // If student sends to support, they might not know admin ID.
            // For MVP, user selects 'Admin' from list? 
            // Or we auto-assign to the first admin.
            content,
            read: 0,
            timestamp: new Date().toISOString(),
            is_from_support: req.user.role === 'admin' ? 1 : 0
        };

        // Handle "Support" shorthand
        if (receiverId === 'SUPPORT') {
            const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
            if (admin) {
                msg.receiverId = admin.id;
            } else {
                return res.status(400).json({ error: 'No support agent available' });
            }
        }

        db.prepare(`
            INSERT INTO messages (id, senderId, receiverId, content, read, timestamp, is_from_support)
            VALUES (@id, @senderId, @receiverId, @content, @read, @timestamp, @is_from_support)
        `).run(msg);

        res.json(msg);
    } catch (e) {
        console.error('Error sending message:', e);
        res.status(500).json({ error: e.message });
    }
});

// Mark message as read
app.put('/api/messages/:id/read', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// List students (for Admin to start chat)
app.get('/api/users/students', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const students = db.prepare("SELECT id, name, avatar, email FROM users WHERE role = 'student'").all();
        res.json(students);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get User Details (Admin only) - Detailed profile for management
app.get('/api/users/:id/details', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    try {
        const user = db.prepare('SELECT id, name, email, role, points, level, joinDate, status, avatar, phone, bio, educationLevel, country, age, gender, whatsapp FROM users WHERE id = ?').get(id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Get Enrollments & Progress
        const enrollments = db.prepare(`
            SELECT e.courseId, c.title as courseTitle, e.progress, e.lastAccess 
            FROM enrollments e 
            JOIN courses c ON e.courseId = c.id 
            WHERE e.userId = ?
        `).all(id);

        // Get Certificates
        const certificates = db.prepare('SELECT * FROM certificates WHERE userId = ?').all(id);

        // Get Quiz Results
        const quizResults = db.prepare(`
            SELECT qr.*, q.title as quizTitle 
            FROM quiz_results qr 
            JOIN quizzes q ON qr.quizId = q.id 
            WHERE qr.userId = ? 
            ORDER BY qr.completedAt DESC 
            LIMIT 5
        `).all(id);

        // Get Recent Activity
        const activity = db.prepare('SELECT * FROM system_activity_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT 10').all(id);

        res.json({
            user,
            enrollments,
            certificates,
            quizResults,
            activity: activity.map(l => ({ ...l, details: JSON.parse(l.details || '{}') }))
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback
// ============================================================================
// SPA Fallback - MUST BE LAST
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: `API endpoint ${req.path} not found` });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`- Database: JSON File (Compatibility Mode)`);
    console.log(`- Base URL: http://localhost:${PORT}`);
});
