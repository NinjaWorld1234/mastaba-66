
const { db } = require('./server/database.cjs');

console.log('Starting URL Fix...');

const PUBLIC_DOMAIN = 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev';

// Fix Courses
const courses = db.prepare('SELECT id, video_url FROM courses').all();
let coursesFixed = 0;
const updateCourse = db.prepare('UPDATE courses SET video_url = ? WHERE id = ?');

for (const c of courses) {
    if (c.video_url && c.video_url.includes('r2.cloudflarestorage.com')) {
        const path = c.video_url.split('/uploads/')[1];
        if (path) {
            const newUrl = `${PUBLIC_DOMAIN}/uploads/${path}`;
            updateCourse.run(newUrl, c.id);
            coursesFixed++;
        }
    }
}

// Fix Episodes
const episodes = db.prepare('SELECT id, videoUrl FROM episodes').all();
let episodesFixed = 0;
const updateEpisode = db.prepare('UPDATE episodes SET videoUrl = ? WHERE id = ?');

for (const e of episodes) {
    if (e.videoUrl && e.videoUrl.includes('r2.cloudflarestorage.com')) {
        const path = e.videoUrl.split('/uploads/')[1];
        if (path) {
            const newUrl = `${PUBLIC_DOMAIN}/uploads/${path}`;
            updateEpisode.run(newUrl, e.id);
            episodesFixed++;
        }
    }
}

console.log(`Fixed ${coursesFixed} courses.`);
console.log(`Fixed ${episodesFixed} episodes.`);
