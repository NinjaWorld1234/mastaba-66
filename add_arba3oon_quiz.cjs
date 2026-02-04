const { db } = require('./server/database.cjs');

console.log('--- Starting Update: Arba\'oon Quiz ---');

try {
    // 1. Update passing score for ALL quizzes to 80% (Just to be sure)
    db.prepare('UPDATE quizzes SET passing_score = 80').run();

    // 2. Define Quiz Data
    const quizData = {
        id: 'quiz_arba3oon_final',
        courseId: 'course_arba3oon',
        title: 'امتحان الأربعون النووية',
        questions: [
            // Q1: MCQ - Correct: A (Index 0)
            { id: 'q1', text: 'المقصود بجوامع الكلم:', options: ['قلة اللفظ وكثرة المعنى', 'قلة المعنى واللفظ الكثير', 'الكلام الفصيح فقط', 'لا شيء مما ذكر'], correctAnswer: 0 },

            // Yes/No Questions. Options: ['نعم', 'لا']. Correct: 0 for Yes, 1 for No.

            // Q2: Yes - Correct: 0
            { id: 'q2', text: 'اتفق العلماء على جواز العمل بالحديث الضعيف في فضائل الأعمال', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q3: No - Correct: 1
            { id: 'q3', text: 'لا يعود الضرر والنفع على الإنسان المسلم بحسب نيته فقط', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q4: Yes - Correct: 0
            { id: 'q4', text: 'الإحسان هو أن تعبد الله كأنك تراه فإن لم تكن تراه فإنه يراك', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q5: No - Correct: 1
            { id: 'q5', text: 'أول من جهر بالقرآن من الصحابة هو عمر بن الخطاب رضي الله عنه', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q6: Yes - Correct: 0
            { id: 'q6', text: 'البدعة الحسنة التي لا تخالف أصلاً من الدين وتندرج تحت مستحسن كالمولد النبوي', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q7: Yes - Correct: 0
            { id: 'q7', text: 'من أسباب هلاك الأمم السابقة كثرة سؤالهم لأنبيائهم بلا حاجة', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q8: Yes - Correct: 0
            { id: 'q8', text: 'سمي الحلال طيباً لأنه يطيب لآكله والحرام مضر وإن تلذذ به صاحبه', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q9: No - Correct: 1
            { id: 'q9', text: 'من أسباب قبول الدعاء كسب المال ولو كان حراماً أو حلالاً', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q10: Yes - Correct: 0
            { id: 'q10', text: 'من علامات كمال الإيمان حبك لأخيك ما تحب لنفسك', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q11: No - Correct: 1
            { id: 'q11', text: 'الردة عن الإسلام لا تعتبر من الكبائر', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q12: Yes - Correct: 0
            { id: 'q12', text: 'من ثمار الصمت النجاة في الدنيا والآخرة', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q13: Yes - Correct: 0
            { id: 'q13', text: 'وصية النبي ﷺ المتكررة "لا تغضب" تدل على عظم نفعها وشمولها', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q14: No - Correct: 1
            { id: 'q14', text: 'لا يشمل الإحسان إلى المخلوقات الإحسان إلى الحيوانات لأنها بلا عقل', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q15: Yes - Correct: 0
            { id: 'q15', text: 'الحياء خلق يبعث على ترك القبيح وفعل المليح', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q16: No - Correct: 1
            { id: 'q16', text: 'فعل المأمورات وترك المنهيات غير كافٍ في دخول الجنة', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q17: Yes - Correct: 0
            { id: 'q17', text: 'الصدقة تطفئ الخطيئة وتمحوها', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q18: No - Correct: 1
            { id: 'q18', text: 'الزهد بالدنيا هو الإقبال عليها بكل قوة', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q19: Yes - Correct: 0
            { id: 'q19', text: 'من أسس القضاء في الإسلام: البينة على من ادعى واليمين على من أنكر', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q20: No - Correct: 1
            { id: 'q20', text: 'أضعف درجات الإنكار هو الإنكار باليد', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q21: No - Correct: 1
            { id: 'q21', text: 'الغبطة هي تمني حصول النعمة مع زوالها عن صاحبها', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q22: No - Correct: 1 (Correction based on standard Islamic jurisprudence: Qada' (making up missed obligatory prayers) takes precedence over Nawafil. So "Nawafil is better than Qada" is FALSE => No.)
            { id: 'q22', text: 'التقرب إلى الله بالنوافل أفضل من قضاء الفوائت من الفرائض', options: ['نعم', 'لا'], correctAnswer: 1 },

            // Q23: Yes - Correct: 0
            { id: 'q23', text: 'تجاوز الله عن هذه الأمة الخطأ والنسيان وما استكرهوا عليه', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q24: Yes - Correct: 0
            { id: 'q24', text: 'العاقل هو من يغتنم الأوقات بما ينفعه في الآخرة', options: ['نعم', 'لا'], correctAnswer: 0 },

            // Q25: No - Correct: 1
            { id: 'q25', text: 'يغفر الله جميع الخطايا حتى الشرك', options: ['نعم', 'لا'], correctAnswer: 1 }
        ]
    };

    console.log('3. Inserting/Updating Arba\'oon Quiz...');

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
        16   // afterEpisodeIndex (Last episode index found: 16)
    );

    console.log(`   Quiz "${quizData.title}" inserted successfully.`);
    console.log(`   - Connected to Course: ${quizData.courseId}`);
    console.log(`   - After Episode: 16`);
    console.log(`   - Questions: ${quizData.questions.length}`);
    console.log(`   - Passing Score: 80%`);

    console.log('--- Operation Complete ---');

} catch (error) {
    console.error('❌ Error:', error);
}
