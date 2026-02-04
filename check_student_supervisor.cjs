const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data/db.sqlite');

try {
    const db = new Database(dbPath, { readonly: true });
    const email = 'ahmed@example.com';
    const user = db.prepare('SELECT id, name, role, supervisor_id FROM users WHERE email = ?').get(email);

    if (user) {
        console.log(`User found: ${user.name}`);
        console.log(`Supervisor ID: ${user.supervisor_id || 'NULL'}`);
        if (user.supervisor_id) {
            const sup = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(user.supervisor_id);
            console.log(`Supervisor Details: ${sup ? sup.name : 'Not Found!'}`);
        }
    } else {
        console.log('User ahmed@example.com NOT found.');
    }
} catch (error) {
    console.error('Database error:', error.message);
}
