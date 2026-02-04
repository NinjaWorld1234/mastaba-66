const { db, initDatabase } = require('./server/database.cjs');

initDatabase();

const courseData = [
    { id: 'course_madkhal', title: '١. مدخل للعلوم الشرعية (مدخل لدراسة الفقه)' },
    { id: 'course_aqeeda', title: '٢. عقيدة (متن الجواهر الكلامية)' },
    { id: 'course_fiqh1-waseelit', title: '٣. فقه (الوسيلة)' },
    { id: 'course_nifas', title: '٤. أحكام النفاس' },
    { id: 'course_tafseer', title: '٥. تفسير (صفات المؤمنين)' },
    { id: 'course_tazkiyah', title: '٦. تزكية (فصل من بداية الهداية)' },
    { id: 'course_seerah', title: '٧. سيرة نبوية' },
    { id: 'course_arba3oon', title: '٨. الأربعون النووية' },
    { id: 'course_fiqh2-it7af', title: '٩. فقه (الإتحاف)' }
];

console.log('Updating course titles and ordering...');

const updateStmt = db.prepare('UPDATE courses SET title = ?, order_index = ? WHERE id = ?');

courseData.forEach((item, index) => {
    const result = updateStmt.run(item.title, index, item.id);
    if (result.changes > 0) {
        console.log(`Updated ${item.id}: ${item.title} (Order: ${index})`);
    } else {
        console.warn(`Warning: Course ${item.id} not found.`);
    }
});

console.log('Update completed.');
process.exit(0);
