require('dotenv').config();
const { db } = require('./server/database.cjs');
const path = require('path');
const fs = require('fs');

async function testBackup() {
    console.log('Starting backup test...');
    const backupDir = path.join(__dirname, 'data/test-backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const fileName = `test-backup-${Date.now()}.sqlite`;
    const backupPath = path.join(backupDir, fileName);

    console.log(`Target path: ${backupPath}`);
    try {
        if (typeof db.backup !== 'function') {
            throw new Error('db.backup is not a function! db type: ' + typeof db);
        }
        console.log('Calling db.backup()...');
        await db.backup(backupPath);
        console.log('Backup successful!');

        const stats = fs.statSync(backupPath);
        console.log(`Backup file size: ${stats.size} bytes`);

        // Use standard fs to check if it's a valid sqlite file (optional)
        const buffer = fs.readFileSync(backupPath, { encoding: null, flag: 'r' });
        console.log('File header:', buffer.slice(0, 16).toString());

    } catch (e) {
        console.error('Backup failed:', e);
    } finally {
        // Cleanup
        // if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
    }
}

testBackup();
