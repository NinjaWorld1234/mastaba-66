const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');
try {
    const students = db.prepare("SELECT email, role, emailVerified FROM users WHERE role = 'student'").all();
    console.log('Students found:', students);
} catch (e) {
    console.error('Error fetching students:', e);
}
