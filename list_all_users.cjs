const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite');

const users = db.prepare("SELECT id, name, role, supervisor_id FROM users").all();
console.table(users);

db.close();
