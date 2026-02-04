const { db } = require('./server/database.cjs');

try {
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get('quiz_madkhal_final');
    if (quiz) {
        console.log('Quiz Found:');
        console.log('- Title:', quiz.title);
        console.log('- Course ID:', quiz.courseId);
        console.log('- After Episode Index:', quiz.afterEpisodeIndex);

        const questions = JSON.parse(quiz.questions);
        console.log('- Questions Count:', questions.length);
        console.log('- First Question:', questions[0].text);
    } else {
        console.log('Quiz NOT FOUND');
    }
} catch (error) {
    console.error('Error verifying quiz:', error);
}
