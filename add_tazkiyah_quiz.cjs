const { db } = require('./server/database.cjs');

console.log('--- Starting Update: Tazkiyah Quiz & Global Scores ---');

try {
    // 1. Update passing score for ALL quizzes to 80%
    console.log('1. Updating passing score for all quizzes to 80%...');
    const updateResult = db.prepare('UPDATE quizzes SET passing_score = 80').run();
    console.log(`   Updated ${updateResult.changes} quizzes.`);

    // 2. Find Last Episode of Tazkiyah Course
    console.log('2. Finding last episode for "course_tazkiyah"...');
    const lastEp = db.prepare('SELECT id, title, orderIndex FROM episodes WHERE courseId = ? ORDER BY orderIndex DESC LIMIT 1').get('course_tazkiyah');

    if (!lastEp) {
        throw new Error('No episodes found for course_tazkiyah!');
    }
    console.log(`   Found last episode: ${lastEp.title} (ID: ${lastEp.id}, Index: ${lastEp.orderIndex})`);

    // 3. Define Quiz Data
    const quizData = {
        id: 'quiz_tazkiyah_final',
        courseId: 'course_tazkiyah',
        title: 'امتحان مادة التزكية',
        questions: [
            // Yes/No Questions (1-15) - Correct: 0 for First option, 1 for Second. Assuming Options: ['نعم', 'لا']
            // Q1: No (Index 1)
            { id: 'q1', text: 'إتيان الطاعات لا يقدر عليه إلا المجتهدون وترك المعاصي يقدر عليه أي أحد', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q2: No (Index 1)
            { id: 'q2', text: 'الأعضاء المطلوب حفظها خمسة', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q3: No (Index 1)
            { id: 'q3', text: 'المطلوب من المسلم حفظ العين عن أمران', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q4: No (Index 1)
            { id: 'q4', text: 'يجوز أن نصغي بالأذن إلى البدع', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q5: No (Index 1)
            { id: 'q5', text: 'إذا كنت تجلس في مجلس غيبة تبقى جالسًا ولا إثم عليك لأنك تسمع فقط', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q6: No (Index 1)
            { id: 'q6', text: 'الإخلاف بالوعد من النفاق العقدي', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q7: No (Index 1)
            { id: 'q7', text: 'مطلوب من المسلم البحث في بواطن الأمور عند طلب الحلال', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q8: Yes (Index 0)
            { id: 'q8', text: 'معاصي اللسان ثمانية', options: ['نعم', 'لا'], correctAnswer: 0 },
            // Q9: No (Index 1)
            { id: 'q9', text: 'الكذب من صغائر الذنوب', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q10: No (Index 1)
            { id: 'q10', text: 'يجوز لعن الحيوان', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q11: No (Index 1)
            { id: 'q11', text: 'من الهوى المتّبع الرياء', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q12: No (Index 1)
            { id: 'q12', text: 'الحسد متشعبٌ من البخل', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q13: No (Index 1)
            { id: 'q13', text: 'كل من ظن نفسه أفضل من غيره فهو حسود', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q14: Yes (Index 0)
            { id: 'q14', text: 'أمهات أمراض القلوب لها مغرس واحد هو حب الدنيا', options: ['نعم', 'لا'], correctAnswer: 0 },
            // Q15: Yes (Index 0)
            { id: 'q15', text: 'الكبر: النظر إلى الغير بعين الاحتقار', options: ['نعم', 'لا'], correctAnswer: 0 },

            // MCQ Questions (16-20)
            // Q16: B
            { id: 'q16', text: 'يشهد عليك يوم القيامة:', options: ['لسانك', 'أعضاؤك كلها', 'الأيدي والأرجل', 'لا شيء من الأعضاء'], correctAnswer: 1 },
            // Q17: D
            { id: 'q17', text: 'حفظ العين عن أمور هي:', options: ['النظر إلى مسلم بعين الاحتقار', 'النظر إلى عيوب المسلمين', 'النظر إلى صورة مليحة بشهوة', 'جميع ما ذُكر صحيح'], correctAnswer: 3 },
            // Q18: C
            { id: 'q18', text: 'الغيبة: ذكرك أخاك بما يكره', options: ['بحضوره', 'بغيبته', 'بغيبته وحضوره', 'لا شيء مما ذُكر'], correctAnswer: 2 },
            // Q19: D
            { id: 'q19', text: 'حفظ الفرج يكون:', options: ['بحفظ القلب', 'بحفظ البطن', 'بحفظ اليد', 'الإجابة الأولى والثانية'], correctAnswer: 3 },
            // Q20: C
            { id: 'q20', text: 'أمهات أمراض القلوب في كتابنا:', options: ['أربعة', 'خمسة', 'ثلاثة', 'ستة'], correctAnswer: 2 }
        ]
    };

    console.log('3. Inserting/Updating Tazkiyah Quiz...');

    // Delete existing if any
    const existing = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(quizData.id);
    if (existing) {
        console.log('   Quiz already exists. Replacing...');
        db.prepare('DELETE FROM quizzes WHERE id = ?').run(quizData.id);
    }

    // Insert
    const insertQuiz = db.prepare(`
        INSERT INTO quizzes (id, courseId, title, questions, passing_score, afterEpisodeIndex)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertQuiz.run(
        quizData.id,
        quizData.courseId,
        quizData.title,
        JSON.stringify(quizData.questions),
        80, // passing score requested by user
        lastEp.orderIndex
    );

    console.log(`   Quiz "${quizData.title}" inserted successfully.`);
    console.log(`   - Connected to Course: ${quizData.courseId}`);
    console.log(`   - After Episode: ${lastEp.orderIndex}`);
    console.log(`   - Questions: ${quizData.questions.length}`);
    console.log(`   - Passing Score: 80%`);

    console.log('--- Operation Complete ---');

} catch (error) {
    console.error('❌ Error:', error);
}
