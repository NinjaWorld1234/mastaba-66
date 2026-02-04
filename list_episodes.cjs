const { db } = require('./server/database.cjs');

try {
    const episodes = db.prepare('SELECT id, title, orderIndex FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all('course_madkhal');
    console.log('Episodes for Madkhal:', episodes);

    if (episodes.length > 0) {
        console.log('Last Episode ID:', episodes[episodes.length - 1].id);
    } else {
        console.log('No episodes found for course_madkhal');
    }
} catch (error) {
    console.error('Error fetching episodes:', error);
}
