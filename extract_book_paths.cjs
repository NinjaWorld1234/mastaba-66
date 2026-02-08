const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite');

try {
    const courses = db.prepare(`
        SELECT c.id, c.title, b.path as book_path 
        FROM courses c 
        LEFT JOIN books b ON c.id = b.courseId
    `).all();
    console.log('--- Course Book Paths ---');
    courses.forEach(c => {
        console.log(`${c.id} | ${c.title} | ${c.book_path || 'NULL'}`);
    });
} catch (e) {
    console.error('Error:', e.message);
} finally {
    db.close();
}
