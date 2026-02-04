const { db } = require('./server/database.cjs');

console.log('Starting migration for Supervisor role...');

try {
    // Check if columns exist first to avoid errors (sqlite doesn't have IF NOT EXISTS for ADD COLUMN)
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const columnNames = tableInfo.map(c => c.name);

    if (!columnNames.includes('supervisor_id')) {
        console.log('Adding supervisor_id column...');
        db.prepare('ALTER TABLE users ADD COLUMN supervisor_id TEXT').run();
    }

    if (!columnNames.includes('supervisor_capacity')) {
        console.log('Adding supervisor_capacity column...');
        db.prepare('ALTER TABLE users ADD COLUMN supervisor_capacity INTEGER DEFAULT 0').run();
    }

    if (!columnNames.includes('supervisor_priority')) {
        console.log('Adding supervisor_priority column...');
        db.prepare('ALTER TABLE users ADD COLUMN supervisor_priority INTEGER DEFAULT 0').run();
    }

    console.log('Migration completed successfully.');
} catch (e) {
    console.error('Migration failed:', e);
}
