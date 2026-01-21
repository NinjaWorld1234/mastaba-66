import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db, sql } from '../lib/db';

const SECRET_KEY = process.env.SECRET_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            error: 'Email and OTP are required',
            errorAr: 'البريد ورمز التحقق مطلوبان'
        });
    }

    try {
        // Find user
        const user = await db.getUserByEmail(email);

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                errorAr: 'المستخدم غير موجود'
            });
        }

        if (user.email_verified) {
            return res.status(400).json({
                error: 'Email already verified',
                errorAr: 'البريد محقق مسبقاً'
            });
        }

        // Check OTP
        if (user.verification_code !== otp) {
            return res.status(400).json({
                error: 'Invalid verification code',
                errorAr: 'رمز التحقق غير صحيح'
            });
        }

        // Check expiry
        if (new Date() > new Date(user.verification_expiry)) {
            return res.status(400).json({
                error: 'Verification code expired',
                errorAr: 'رمز التحقق منتهي الصلاحية'
            });
        }

        // Update user as verified
        await db.updateUserVerification(user.id);

        // Remove sensitive fields
        const { password, verification_code, verification_expiry, ...safeUser } = user;

        // Generate new token with verified status
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role, emailVerified: true },
            SECRET_KEY,
            { expiresIn: '30d' }
        );

        // Map to frontend format
        const mappedUser = {
            ...safeUser,
            nameEn: safeUser.name_en,
            joinDate: safeUser.join_date,
            emailVerified: true,
            educationLevel: safeUser.education_level,
        };

        return res.status(200).json({
            success: true,
            accessToken,
            user: mappedUser,
            message: 'Email verified successfully',
            messageAr: 'تم التحقق من البريد بنجاح'
        });

    } catch (e) {
        console.error('Verify email error:', e);
        return res.status(500).json({
            error: 'Internal server error',
            errorAr: 'خطأ في الخادم'
        });
    }
}
