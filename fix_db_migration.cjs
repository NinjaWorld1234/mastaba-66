const { db, initDatabase } = require('./server/database.cjs');

try {
    initDatabase();
    console.log('Database initialization/migration forced successfully.');

    const columns = db.prepare("PRAGMA table_info(messages)").all();
    console.log('Messages table columns:', columns.map(c => c.name));

    if (!columns.find(c => c.name === 'isComplaint')) {
        console.error('CRITICAL: isComplaint column is still missing after migration!');
    } else {
        console.log('SUCCESS: isComplaint column exists.');
    }
} catch (err) {
    console.error('Migration failed:', err);
}
