const { db } = require('./server/database.cjs');

try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
    console.log(`Found ${courses.length} courses.`);

    const coursesWithEpisodes = courses.map(c => {
        const episodes = db.prepare('SELECT * FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all(c.id);
        console.log(`- Course ${c.id} has ${episodes.length} episodes.`);
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
    console.log('Final Result Sample:', JSON.stringify(coursesWithEpisodes[0], null, 2));
} catch (e) {
    console.error('FATAL ERROR:', e);
} finally {
    db.close();
}
