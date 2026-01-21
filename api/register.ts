import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';

const SECRET_KEY = process.env.SECRET_KEY || '';

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        email,
        password,
        name,
        nameEn,
        whatsapp,
        country,
        age,
        gender,
        educationLevel,
        role = 'student'
    } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({
            error: 'Missing required fields',
            errorAr: 'الحقول المطلوبة ناقصة'
        });
    }

    try {
        // Check if user exists
        const existing = await db.getUserByEmail(email);

        if (existing) {
            return res.status(400).json({
                error: 'User already exists',
                errorAr: 'هذا البريد مسجل مسبقاً'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        const joinDate = new Date().toISOString().split('T')[0];
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Insert user
        const newUser = await db.createUser({
            id,
            email,
            password: hashedPassword,
            name,
            name_en: nameEn || name,
            role,
            join_date: joinDate,
            whatsapp: whatsapp || undefined,
            country: country || undefined,
            age: age || undefined,
            gender: gender || undefined,
            education_level: educationLevel || undefined,
            verification_code: otp,
            verification_expiry: otpExpiry
        });

        if (!newUser) {
            return res.status(500).json({
                error: 'Failed to create user',
                errorAr: 'فشل في إنشاء المستخدم'
            });
        }

        // TODO: Send verification email
        console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);

        // Generate temporary token
        const accessToken = jwt.sign(
            { id, email, role, emailVerified: false },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        // Map to frontend format
        const user = {
            id,
            email,
            name,
            nameEn: nameEn || name,
            role,
            joinDate,
            points: 0,
            level: 1,
            emailVerified: false,
            whatsapp,
            country,
            age,
            gender,
            educationLevel
        };

        return res.status(201).json({
            accessToken,
            user,
            needsVerification: true,
            message: 'Registration successful. Please verify your email.',
            messageAr: 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني.'
        });

    } catch (e) {
        console.error('Register error:', e);
        return res.status(500).json({
            error: 'Internal server error',
            errorAr: 'خطأ في الخادم'
        });
    }
}
