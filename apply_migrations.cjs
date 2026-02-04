const { initDatabase } = require('./server/database.cjs');

console.log('Applying migrations manually...');
try {
    initDatabase();
    console.log('Migrations applied successfully.');
} catch (error) {
    console.error('Migration failed:', error);
}
