import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';

const SECRET_KEY = process.env.SECRET_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user by email (case-insensitive)
        const user = await db.getUserByEmail(email);

        if (!user) {
            return res.status(400).json({ error: 'Cannot find user' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(403).json({ error: 'Invalid password' });
        }

        // Check email verification for students
        if (user.role === 'student' && !user.email_verified) {
            return res.status(403).json({
                error: 'Email not verified',
                errorAr: 'البريد الإلكتروني لم يتم تفعيله بعد',
                needsVerification: true,
                email: user.email
            });
        }

        // Remove sensitive fields
        const { password: _, verification_code, verification_expiry, ...safeUser } = user;

        // Generate JWT token (30 days)
        const accessToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                emailVerified: user.email_verified
            },
            SECRET_KEY,
            { expiresIn: '30d' }
        );

        // Map snake_case to camelCase for frontend compatibility
        const mappedUser = {
            ...safeUser,
            nameEn: safeUser.name_en,
            joinDate: safeUser.join_date,
            emailVerified: safeUser.email_verified,
            educationLevel: safeUser.education_level,
        };

        return res.status(200).json({
            accessToken,
            user: mappedUser
        });

    } catch (e) {
        console.error('Login error:', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
