import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        return handleGet(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
    try {
        const users = await db.getAllUsers();

        // Map snake_case to camelCase for frontend
        const mappedUsers = users?.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            nameEn: user.name_en,
            role: user.role,
            avatar: user.avatar,
            points: user.points,
            level: user.level,
            streak: user.streak,
            joinDate: user.join_date,
            status: user.status,
            emailVerified: user.email_verified,
            country: user.country,
            age: user.age,
            gender: user.gender,
            educationLevel: user.education_level,
            whatsapp: user.whatsapp
        })) || [];

        return res.status(200).json(mappedUsers);

    } catch (e) {
        console.error('Users error:', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
