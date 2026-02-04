const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data/db.sqlite');
console.log(`Connecting to database at: ${dbPath}`);

const db = new Database(dbPath);

const email = 'a@a.com';
const password = '111';
const name = 'Supervisor Quick Login';
const role = 'supervisor';

const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

if (existing) {
    console.log(`User ${email} already exists.`);
    // Start update role if needed
    if (existing.role !== role) {
        db.prepare('UPDATE users SET role = ? WHERE email = ?').run(role, email);
        console.log(`Updated role to ${role}`);
    }
} else {
    console.log(`Creating user ${email}...`);
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    db.prepare(`
    INSERT INTO users (id, email, password, name, role, joinDate, status, emailVerified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, hashedPassword, name, role, now, 'active', 1);

    console.log('User created successfully.');
}
