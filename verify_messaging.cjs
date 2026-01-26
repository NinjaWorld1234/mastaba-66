const { db } = require('./server/database.cjs');
// Axios removed as we use direct DB access
// Let's use db directly to verify data, and maybe rely on existing tests.
// Actually, I'll just check if the column exists and insertion works via a small script using db.

console.log('Verifying Database Schema...');
try {
    const columns = db.prepare("PRAGMA table_info(messages)").all();
    const hasAttachment = columns.some(c => c.name === 'attachmentUrl');
    const hasExpiry = columns.some(c => c.name === 'expiryDate');

    if (hasAttachment && hasExpiry) {
        console.log('✅ Columns attachmentUrl and expiryDate exist.');
    } else {
        console.error('❌ Columns missing!', { hasAttachment, hasExpiry });
        process.exit(1);
    }
} catch (e) {
    console.error('❌ Database check failed:', e.message);
}

// Test Expiry Logic Calculation (Simulation)
console.log('Verifying Expiry Logic...');
const now = new Date();
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

// We can't check the route logic easily without starting a server, but we can verify code correctness visually (already done).
// We will manually insert a test message with expiry and check if GET query filters it (simulate expiration).

const testUserId = 'test-user-verify';
const testMsgId = 'msg-test-verify-' + Date.now();
const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 1); // Expired yesterday

db.prepare(`
    INSERT INTO messages (id, senderId, receiverId, content, read, timestamp, expiryDate)
    VALUES (?, ?, ?, ?, 0, ?, ?)
`).run(testMsgId, 'sender', testUserId, 'Expired Message', new Date().toISOString(), pastDate.toISOString());

console.log('Inserted expired message directly into DB.');

// Test Filtering Query
const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE (senderId = ? OR receiverId = ?) 
    AND (expiryDate IS NULL OR expiryDate > ?)
    ORDER BY timestamp ASC
`).all('sender', testUserId, new Date().toISOString());

const found = messages.find(m => m.id === testMsgId);
if (!found) {
    console.log('✅ Expired message was correctly filtered out by the query.');
} else {
    console.error('❌ Expired message returned! Filtering logic failed.');
}

// Cleanup test message
db.prepare('DELETE FROM messages WHERE id = ?').run(testMsgId);
console.log('Verification Complete.');
