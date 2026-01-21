require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { initDatabase, db } = require('./server/database.cjs');
const { generateOTP, sendVerificationEmail } = require('./server/email.cjs');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

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
app.use(express.static(path.join(__dirname, 'dist')));

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

// Check Session / Validate Token
app.get('/api/check-session', authenticateToken, (req, res) => {
    try {
        const user = db.prepare(`
            SELECT id, email, name, nameEn, role, points, level, avatar, 
                   whatsapp, country, age, gender, educationLevel, emailVerified, joinDate
            FROM users WHERE id = ?
        `).get(req.user.id);

        if (user) {
            res.json({ valid: true, user });
        } else {
            res.status(404).json({ valid: false, error: 'User not found' });
        }
    } catch (e) {
        console.error('Check session error:', e);
        res.status(500).json({ valid: false, error: 'Internal server error' });
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

// Note: GET /api/courses already defined above (line 132)

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
// SPA Fallback
// ============================================================================
app.get(/(.*)/, (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`- Database: SQLite`);
    console.log(`- Base URL: http://localhost:${PORT}`);
});
