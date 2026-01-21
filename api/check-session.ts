import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db';

const SECRET_KEY = process.env.SECRET_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY) as { id: string; email: string; role: string };

        // Fetch fresh user data from database
        const user = await db.getUserById(decoded.id);

        if (!user) {
            return res.status(401).json({ valid: false, error: 'User not found' });
        }

        // Remove sensitive fields
        const { password, verification_code, verification_expiry, ...safeUser } = user;

        // Map to frontend format
        const mappedUser = {
            ...safeUser,
            nameEn: safeUser.name_en,
            joinDate: safeUser.join_date,
            emailVerified: safeUser.email_verified,
            educationLevel: safeUser.education_level,
        };

        return res.status(200).json({
            valid: true,
            user: mappedUser
        });

    } catch (e) {
        // Token invalid or expired
        return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
    }
}
