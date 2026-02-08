const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const fs = require('fs');

try {
    const books = db.prepare('SELECT * FROM books').all();
    console.log(`Exporting ${books.length} books...`);
    fs.writeFileSync('books_export.json', JSON.stringify(books, null, 2), 'utf8');

    const libraryResources = db.prepare('SELECT * FROM library_resources').all();
    console.log(`Exporting ${libraryResources.length} library resources...`);
    fs.writeFileSync('library_resources_export.json', JSON.stringify(libraryResources, null, 2), 'utf8');

    // Check if courses are linked to these books
    if (books.length > 0) {
        console.log('Sample Book Linked Course:', books[0].courseId);
    }

} catch (e) {
    console.error('Error during export:', e.message);
} finally {
    db.close();
}
