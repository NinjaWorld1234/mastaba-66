const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../database.cjs');
const { generateOTP, sendVerificationEmail } = require('../email.cjs');

const SECRET_KEY = process.env.SECRET_KEY || 'your-default-secret';

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (!user) return res.status(400).json({ error: 'Cannot find user' });

        const passwordMatch = bcrypt.compareSync(password, user.password);
        if (passwordMatch) {
            if (user.role === 'student' && !user.emailVerified) {
                return res.status(403).json({
                    error: 'Email not verified',
                    errorAr: 'البريد الإلكتروني لم يتم تفعيله بعد',
                    needsVerification: true,
                    email: user.email
                });
            }
            const { password: _, verificationCode, verificationExpiry, ...userWithoutPassword } = user;
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role, emailVerified: !!user.emailVerified },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            res.json({ accessToken, user: userWithoutPassword });
        } else {
            res.status(403).json({ error: 'Invalid password' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { email, password, name, nameEn, whatsapp, country, age, gender, educationLevel, role = 'student' } = req.body;
    try {
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const id = 'user_' + Date.now();
        const hashedPassword = bcrypt.hashSync(password, 10);
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const newUser = {
            id, email, password: hashedPassword, name, nameEn: nameEn || name, role,
            points: 0, level: 1, joinDate: new Date().toISOString().split('T')[0],
            verificationCode: otp, verificationExpiry: expiry, emailVerified: 0,
            whatsapp: whatsapp || '', country: country || '', age: age || 0,
            gender: gender || '', educationLevel: educationLevel || ''
        };

        db.prepare(`
            INSERT INTO users (id, email, password, name, nameEn, role, points, level, joinDate, verificationCode, verificationExpiry, emailVerified, whatsapp, country, age, gender, educationLevel)
            VALUES (@id, @email, @password, @name, @nameEn, @role, @points, @level, @joinDate, @verificationCode, @verificationExpiry, @emailVerified, @whatsapp, @country, @age, @gender, @educationLevel)
        `).run(newUser);

        await sendVerificationEmail(email, otp);
        res.status(201).json({ success: true, message: 'User registered. Please verify email.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Verify Email
router.post('/verify-email', (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.verificationCode !== otp) return res.status(400).json({ error: 'Invalid OTP' });
        if (new Date() > new Date(user.verificationExpiry)) return res.status(400).json({ error: 'OTP expired' });

        db.prepare('UPDATE users SET emailVerified = 1, verificationCode = NULL, verificationExpiry = NULL WHERE id = ?').run(user.id);
        const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role, emailVerified: true }, SECRET_KEY, { expiresIn: '24h' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, user: { ...userWithoutPassword, emailVerified: true }, accessToken });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const result = db.prepare('UPDATE users SET verificationCode = ?, verificationExpiry = ? WHERE LOWER(email) = LOWER(?)').run(otp, expiry, email);
        if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
        await sendVerificationEmail(email, otp);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
