import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        return handleGet(req, res);
    } else if (req.method === 'POST') {
        return handlePost(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
    try {
        const courses = await db.getAllCourses();

        // Map snake_case to camelCase for frontend
        const mappedCourses = courses?.map(course => ({
            id: course.id,
            title: course.title,
            titleEn: course.title_en,
            instructor: course.instructor,
            instructorEn: course.instructor_en,
            progress: 0,
            category: course.category,
            categoryEn: course.category_en,
            duration: course.duration,
            durationEn: course.duration_en,
            thumbnail: course.thumbnail,
            description: course.description,
            descriptionEn: course.description_en,
            lessonsCount: course.lessons_count,
            studentsCount: course.students_count,
            videoUrl: course.video_url,
            status: course.status,
            passingScore: course.passing_score
        })) || [];

        return res.status(200).json(mappedCourses);

    } catch (e) {
        console.error('Courses error:', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
    try {
        const {
            title, titleEn, instructor, instructorEn,
            category, categoryEn, duration, durationEn,
            thumbnail, description, descriptionEn,
            lessonsCount, studentsCount, videoUrl,
            status = 'published', passingScore = 80
        } = req.body;

        const id = crypto.randomUUID();

        const course = await db.createCourse({
            id,
            title,
            title_en: titleEn,
            instructor,
            instructor_en: instructorEn,
            category,
            category_en: categoryEn,
            duration,
            duration_en: durationEn,
            thumbnail,
            description,
            description_en: descriptionEn,
            lessons_count: lessonsCount || 0,
            students_count: studentsCount || 0,
            video_url: videoUrl,
            status,
            passing_score: passingScore
        });

        return res.status(201).json(course);

    } catch (e) {
        console.error('Create course error:', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
