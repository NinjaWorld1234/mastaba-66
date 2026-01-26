const { db } = require('./server/database.cjs');
db.prepare("DELETE FROM courses WHERE id = 'test_verification'").run();
db.prepare("DELETE FROM episodes WHERE courseId = 'test_verification'").run();
console.log('Test course removed.');
db.close();
