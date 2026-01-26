const { db } = require('./server/database.cjs');

console.log('Running manual DB migration...');

try {
    db.prepare('ALTER TABLE messages ADD COLUMN attachmentUrl TEXT').run();
    console.log('✅ Added attachmentUrl');
} catch (e) {
    console.log('ℹ️ attachmentUrl:', e.message);
}

try {
    db.prepare('ALTER TABLE messages ADD COLUMN attachmentType TEXT').run();
    console.log('✅ Added attachmentType');
} catch (e) {
    console.log('ℹ️ attachmentType:', e.message);
}

try {
    db.prepare('ALTER TABLE messages ADD COLUMN expiryDate TEXT').run();
    console.log('✅ Added expiryDate');
} catch (e) {
    console.log('ℹ️ expiryDate:', e.message);
}

console.log('Migration finished.');
