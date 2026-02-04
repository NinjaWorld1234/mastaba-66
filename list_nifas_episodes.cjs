const { db } = require('./server/database.cjs');

try {
    const episodes = db.prepare('SELECT id, title, orderIndex FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all('course_nifas');
    console.log('Episodes for Nifas:', episodes);

    if (episodes.length > 0) {
        console.log('Last Episode ID:', episodes[episodes.length - 1].id);
        console.log('Last Episode Index:', episodes[episodes.length - 1].orderIndex);
    } else {
        console.log('No episodes found for course_nifas');
    }
} catch (error) {
    console.error('Error fetching episodes:', error);
}
