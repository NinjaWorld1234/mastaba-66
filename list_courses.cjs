const { db } = require('./server/database.cjs');
const courses = db.prepare('SELECT id, title, folder_id FROM courses').all();
console.log(JSON.stringify(courses, null, 2));
process.exit(0);
