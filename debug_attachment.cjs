const { db } = require('./server/database.cjs');
const { execSync } = require('child_process');

console.log('Checking last message in DB...');
const lastMsg = db.prepare('SELECT * FROM messages WHERE attachmentUrl IS NOT NULL ORDER BY timestamp DESC LIMIT 1').get();

if (!lastMsg) {
    console.log('❌ No messages with attachments found.');
} else {
    console.log('✅ Found message:', lastMsg.id);
    console.log('   Type:', lastMsg.attachmentType);
    console.log('   URL:', lastMsg.attachmentUrl);

    console.log('Testing URL Access...');
    try {
        // Use curl to check status code
        const cmd = `curl -I "${lastMsg.attachmentUrl}"`;
        const output = execSync(cmd, { encoding: 'utf-8' });
        console.log(output);
    } catch (e) {
        console.log('❌ Curl failed:', e.message);
    }
}
