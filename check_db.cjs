const { db } = require('./server/database.cjs');
const courses = db.prepare('SELECT id, title, video_url FROM courses').all();
console.log('Courses in DB:', JSON.stringify(courses, null, 2));
const episodes = db.prepare('SELECT * FROM episodes').all();
console.log('Episodes in DB:', JSON.stringify(episodes, null, 2));
db.close();
