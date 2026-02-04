const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite');
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='messages'").get();
console.log(schema.sql);

db.close();
