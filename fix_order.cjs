const { db } = require('./server/database.cjs');

const courseOrder = [
    { id: 'course_madkhal', order: 0 },
    { id: 'course_aqeeda', order: 1 },
    { id: 'course_fiqh1-waseelit', order: 2 },
    { id: 'course_nifas', order: 3 },
    { id: 'course_tafseer', order: 4 },
    { id: 'course_tazkiyah', order: 5 },
    { id: 'course_seerah', order: 6 },
    { id: 'course_arba3oon', order: 7 },
    { id: 'course_fiqh2-it7af', order: 8 }
];

console.log('Starting course order update...');

for (const item of courseOrder) {
    const result = db.prepare('UPDATE courses SET order_index = ? WHERE id = ?').run(item.order, item.id);
    if (result.changes > 0) {
        console.log(`Updated ${item.id} to order_index ${item.order}`);
    } else {
        console.log(`Warning: Course ${item.id} not found or index already correct.`);
    }
}

// Verification
const sorted = db.prepare('SELECT id, title, order_index FROM courses ORDER BY order_index ASC').all();
console.log('Final Order in DB:');
console.table(sorted);

console.log('Course order update complete.');
