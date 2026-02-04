const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data/db.sqlite');

console.log('Assigning Supervisor to Student...');
try {
    const db = new Database(dbPath);
    const studentEmail = 'ahmed@example.com';
    const supervisorEmail = 'a@a.com';

    // Get Supervisor ID
    const supervisor = db.prepare('SELECT id FROM users WHERE email = ?').get(supervisorEmail);
    if (!supervisor) {
        console.error('Supervisor not found!');
        process.exit(1);
    }

    // Update Student
    const result = db.prepare('UPDATE users SET supervisor_id = ? WHERE email = ?').run(supervisor.id, studentEmail);

    if (result.changes > 0) {
        console.log(`✅ Success: Assigned ${studentEmail} to supervisor ${supervisorEmail} (ID: ${supervisor.id})`);
    } else {
        console.log(`❌ Failed: Student ${studentEmail} not found or no changes made.`);
    }

} catch (error) {
    console.error('Database error:', error.message);
}
