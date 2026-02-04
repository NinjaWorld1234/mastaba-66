const { db } = require('./server/database.cjs');

console.log('Listing all users in the database:');
const users = db.prepare('SELECT id, name, email, role, status FROM users').all();
console.table(users);

if (users.length === 0) {
    console.log('No users found in the database.');
}
