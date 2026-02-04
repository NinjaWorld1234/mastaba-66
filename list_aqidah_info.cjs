const { db } = require('./server/database.cjs');

try {
    // 1. Find Course ID
    console.log('Searching for Aqidah course...');
    const courses = db.prepare("SELECT id, title FROM courses").all();
    const aqidahCourse = courses.find(c => c.title.includes('عقيدة') || c.title.includes('Aqidah'));

    if (!aqidahCourse) {
        console.log('❌ Course not found!');
        console.log('Available courses:', courses.map(c => c.title).join(', '));
        return;
    }

    console.log(`✅ Found Course: ${aqidahCourse.title} (ID: ${aqidahCourse.id})`);

    // 2. Find Last Episode
    const episodes = db.prepare('SELECT id, title, orderIndex FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all(aqidahCourse.id);
    console.log(`Episodes for ${aqidahCourse.title}:`, episodes);

    if (episodes.length > 0) {
        console.log('Last Episode ID:', episodes[episodes.length - 1].id);
        console.log('Last Episode Index:', episodes[episodes.length - 1].orderIndex);
    } else {
        console.log('No episodes found for this course.');
    }

} catch (error) {
    console.error('Error:', error);
}
