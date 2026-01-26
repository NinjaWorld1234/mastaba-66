
const { db } = require('./server/database.cjs');

console.log('Checking for broken video URLs...');

const courses = db.prepare('SELECT id, title, video_url FROM courses WHERE video_url LIKE "%r2.cloudflarestorage.com%"').all();
const episodes = db.prepare('SELECT id, title, videoUrl FROM episodes WHERE videoUrl LIKE "%r2.cloudflarestorage.com%"').all();

console.log(`Found ${courses.length} courses with broken URLs.`);
console.log(`Found ${episodes.length} episodes with broken URLs.`);

if (courses.length > 0) {
    console.log('Sample Broken Course URL:', courses[0].video_url);
}
if (episodes.length > 0) {
    console.log('Sample Broken Episode URL:', episodes[0].videoUrl);
}
