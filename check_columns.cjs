const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite'); // Correct path!

const columns = db.prepare("PRAGMA table_info(users)").all();
console.table(columns);

db.close();
