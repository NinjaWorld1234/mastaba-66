const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('--- Students with Supervisors ---');
const assignments = db.prepare(`
    SELECT u.id as studentId, u.name as studentName, u.supervisor_id, s.name as supervisorName
    FROM users u
    LEFT JOIN users s ON u.supervisor_id = s.id
    WHERE u.supervisor_id IS NOT NULL
`).all();
console.table(assignments);

console.log('\n--- Supervisors Summary ---');
const summaries = db.prepare(`
    SELECT id, name, role, 
    (SELECT COUNT(*) FROM users WHERE supervisor_id = users.id) as studentCount
    FROM users 
    WHERE role = 'supervisor' OR role = 'admin'
`).all();
console.table(summaries);

db.close();
