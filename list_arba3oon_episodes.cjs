const { db } = require('./server/database.cjs');

try {
    const episodes = db.prepare('SELECT id, title, orderIndex FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all('course_arba3oon');
    console.log('Episodes for Arba3oon:', episodes);

    if (episodes.length > 0) {
        console.log('Last Episode ID:', episodes[episodes.length - 1].id);
        console.log('Last Episode Index:', episodes[episodes.length - 1].orderIndex);
    } else {
        console.log('No episodes found for course_arba3oon');
    }
} catch (error) {
    console.error('Error fetching episodes:', error);
}
