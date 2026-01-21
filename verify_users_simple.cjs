const Database = require('./node_modules/better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'database.sqlite'));
try {
    const users = db.prepare('SELECT email, role, emailVerified FROM users').all();
    console.log('Users found:', users);
} catch (e) {
    console.error('Error querying users:', e.message);
}
db.close();
