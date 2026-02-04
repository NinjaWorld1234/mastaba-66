const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data/db.sqlite');
const db = new Database(dbPath);

console.log('Testing Messaging Flow...');

// 1. Setup Test Users
const supervisorId = 'test_sup_' + Date.now();
const studentId = 'test_stu_' + Date.now();
const now = new Date().toISOString();

try {
    db.prepare("INSERT INTO users (id, email, name, role, status, password) VALUES (?, ?, ?, ?, ?, 'pass')").run(supervisorId, `sup_${Date.now()}@test.com`, 'Test Supervisor', 'supervisor', 'active');
    db.prepare("INSERT INTO users (id, email, name, role, status, supervisor_id, password) VALUES (?, ?, ?, ?, ?, ?, 'pass')").run(studentId, `stu_${Date.now()}@test.com`, 'Test Student', 'student', 'active', supervisorId);
    console.log('✅ Created Test Users (Student linked to Supervisor)');

    // 2. Student Sends Message
    const msg1Id = 'msg1_' + Date.now();
    db.prepare(`
        INSERT INTO messages (id, senderId, receiverId, content, read, timestamp, isComplaint)
        VALUES (?, ?, ?, ?, 0, ?, 0)
    `).run(msg1Id, studentId, supervisorId, 'Hello from Student', now);
    console.log('✅ Student sent message');

    // 3. Supervisor Fetches Messages
    // Logic from social.cjs: WHERE (senderId = ? OR receiverId = ?)
    const supMessages = db.prepare(`
        SELECT * FROM messages 
        WHERE (senderId = ? OR receiverId = ?) 
        ORDER BY timestamp ASC
    `).all(supervisorId, supervisorId);

    if (supMessages.find(m => m.id === msg1Id)) {
        console.log('✅ Supervisor successfully received the message');
    } else {
        console.error('❌ Supervisor DID NOT see the message');
    }

    // 4. Supervisor Replies
    const msg2Id = 'msg2_' + Date.now();
    db.prepare(`
        INSERT INTO messages (id, senderId, receiverId, content, read, timestamp, isComplaint)
        VALUES (?, ?, ?, ?, 0, ?, 0)
    `).run(msg2Id, supervisorId, studentId, 'Reply from Supervisor', new Date().toISOString());
    console.log('✅ Supervisor replied');

    // 5. Student Fetches Messages
    // Logic: WHERE (senderId = ? OR receiverId = ?) AND (expiry...) AND (isComplaint=0 OR NULL)
    const stuMessages = db.prepare(`
        SELECT * FROM messages 
        WHERE (senderId = ? OR receiverId = ?) 
        AND (isComplaint = 0 OR isComplaint IS NULL)
        ORDER BY timestamp ASC
    `).all(studentId, studentId);

    if (stuMessages.find(m => m.id === msg2Id)) {
        console.log('✅ Student successfully received the reply');
    } else {
        console.error('❌ Student DID NOT see the reply');
    }

    // Cleanup
    db.prepare("DELETE FROM users WHERE id = ?").run(supervisorId);
    db.prepare("DELETE FROM users WHERE id = ?").run(studentId);
    db.prepare("DELETE FROM messages WHERE id IN (?, ?)").run(msg1Id, msg2Id);
    console.log('✅ Cleanup complete');

} catch (e) {
    console.error('❌ Error:', e);
}
