const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/db.sqlite');
console.log(`Checking database at: ${dbPath}`);

try {
    const db = new Database(dbPath, { readonly: true });
    const user = db.prepare('SELECT id, email, role, status FROM users WHERE email = ?').get('a@a.com');

    if (user) {
        console.log(`SUCCESS: User found: ${JSON.stringify(user)}`);
    } else {
        console.log('FAILURE: User a@a.com NOT found.');
    }
} catch (error) {
    console.error('Database error:', error.message);
}
