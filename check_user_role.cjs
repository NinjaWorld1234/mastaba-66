const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite');

const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = '1769949935044'").get();
console.log(user);

db.close();
