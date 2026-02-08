const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
    const books = db.prepare('SELECT * FROM books').all();
    console.log(`Found ${books.length} books in database.sqlite`);
    if (books.length > 0) {
        console.log('Sample Book:', books[0]);
    }

    // Also check for any PDF links in any table
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    for (const table of tables) {
        try {
            const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
            const textCols = columns.filter(c => c.type.toLowerCase().includes('text') || c.type.toLowerCase() === '');
            for (const col of textCols) {
                const results = db.prepare(`SELECT ${col.name} FROM ${table.name} WHERE ${col.name} LIKE '%.pdf%'`).all();
                if (results.length > 0) {
                    console.log(`Found PDF links in table ${table.name}, column ${col.name}:`, results.length);
                }
            }
        } catch (e) {
            // Ignore errors for some system tables
        }
    }

} catch (e) {
    console.error('Error querying database:', e.message);
} finally {
    db.close();
}
