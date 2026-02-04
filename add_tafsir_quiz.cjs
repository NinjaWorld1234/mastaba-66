const { db } = require('./server/database.cjs');

console.log('--- Starting Update: Tafsir Quiz ---');

try {
    // 1. Update passing score for ALL quizzes to 80% (Just to be sure)
    db.prepare('UPDATE quizzes SET passing_score = 80').run();

    // 2. Define Quiz Data
    const quizData = {
        id: 'quiz_tafsir_final',
        courseId: 'course_tafseer',
        title: 'امتحان التفسير',
        questions: [
            // Yes/No Questions (1-20). Correct: 0 for Yes, 1 for No. All are "Yes" (0).
            { id: 'q1', text: 'هل المؤمنون يخشعون في صلاتهم؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q2', text: 'هل المؤمنون يؤدون الزكاة بانتظام؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q3', text: 'هل المؤمنون يتجنبون الكذب؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q4', text: 'هل المؤمنون يصدقون بالآخرة؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q5', text: 'هل المؤمنون يتوكلون على الله في جميع أمورهم؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q6', text: 'هل المؤمنون يحافظون على عهدهم ووعودهم؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q7', text: 'هل المؤمنون يجتهدون في قراءة القرآن؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q8', text: 'هل المؤمنون يبتعدون عن الفواحش ما ظهر منها وما بطن؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q9', text: 'هل المؤمنون يصبرون عند الشدائد؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q10', text: 'هل المؤمنون يصدقون بالأنبياء جميعهم دون تفريق؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q11', text: 'هل المؤمنون يتجنبون أكل الربا؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q12', text: 'هل المؤمنون يحافظون على صلة الرحم؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q13', text: 'هل المؤمنون يتجنبون الغيبة والنميمة؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q14', text: 'هل المؤمنون يحبون الخير لإخوانهم كما يحبونه لأنفسهم؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q15', text: 'هل المؤمنون ينفقون في سبيل الله سراً وعلانية؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q16', text: 'هل المؤمنون يطلبون المغفرة من الله بانتظام؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q17', text: 'هل المؤمنون يتسامحون مع الآخرين؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q18', text: 'هل المؤمنون يتجنبون الحسد والغل؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q19', text: 'هل المؤمنون يعظمون شعائر الله؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            { id: 'q20', text: 'هل المؤمنون يتقربون إلى الله بالدعاء والعمل الصالح؟', options: ['نعم', 'لا'], correctAnswer: 0 },

            // MCQ Questions (21-40).
            // 21. B (1)
            { id: 'q21', text: 'كيف يمشي المؤمنون على الأرض؟', options: ['برفعة وكبرياء', 'بتواضع وسكينة', 'بسرعة واندفاع'], correctAnswer: 1 },
            // 22. B (1)
            { id: 'q22', text: 'كيف يرد المؤمنون على الجاهلين؟', options: ['يتجاهلونهم', 'يقولون سلامًا', 'يردون الإساءة بالإساءة'], correctAnswer: 1 },
            // 23. C (2)
            { id: 'q23', text: 'ماذا يفعل المؤمنون إذا ذُكّروا بآيات الله؟', options: ['يتجاهلونها', 'يخرّون عليها صمًّا وعميانًا', 'يستجيبون لها بالإيمان والعمل'], correctAnswer: 2 },
            // 24. C (2)
            { id: 'q24', text: 'كيف ينفق المؤمنون أموالهم؟', options: ['بإسراف وتبذير', 'ببخل وشح', 'باعتدال دون إسراف أو تقتير'], correctAnswer: 2 },
            // 25. A (0)
            { id: 'q25', text: 'من يعبد المؤمنون؟', options: ['الله وحده', 'الله والأصنام', 'أي شيء يختارونه'], correctAnswer: 0 },
            // 26. B (1)
            { id: 'q26', text: 'هل المؤمنون يقتلون النفس التي حرم الله؟', options: ['نعم بلا سبب', 'لا، إلا بالحق', 'نعم في أي وقت'], correctAnswer: 1 },
            // 27. A (0)
            { id: 'q27', text: 'كيف يتعامل المؤمنون مع الزنا؟', options: ['يتجنبونه تمامًا', 'يبررونه', 'يمارسونه سرًا'], correctAnswer: 0 },
            // 28. A (0)
            { id: 'q28', text: 'ماذا يفعل المؤمنون بعد ارتكابهم الذنوب؟', options: ['يتوبون ويستغفرون الله', 'يتفاخرون بما فعلوا', 'يتجاهلون'], correctAnswer: 0 },
            // 29. B (1)
            { id: 'q29', text: 'هل يشهد المؤمنون بالزور؟', options: ['نعم إذا في مصلحتهم', 'لا أبداً', 'أحياناً'], correctAnswer: 1 },
            // 30. C (2)
            { id: 'q30', text: 'ماذا يسألون الله لأسرهم؟', options: ['المال والجاه', 'طول العمر', 'قرة أعين من أزواجهم وذرياتهم'], correctAnswer: 2 },
            // 31. B (1)
            { id: 'q31', text: 'ماذا يطلب المؤمنون من الله بشأن مكانتهم؟', options: ['أن يكونوا أغنياء', 'أن يكونوا أئمة للمتقين', 'أن يكونوا مشاهير'], correctAnswer: 1 },
            // 32. B (1)
            { id: 'q32', text: 'كيف يكون سلوك المؤمنين في الصلاة؟', options: ['يتكاسلون', 'يحافظون عليها', 'يصلون أحياناً'], correctAnswer: 1 },
            // 33. B (1)
            { id: 'q33', text: 'هل يغفر الله للمؤمنين بعد الفواحش؟', options: ['لا يغفر', 'يغفر إذا تابوا', 'حسب الفاحشة'], correctAnswer: 1 },
            // 34. C (2)
            { id: 'q34', text: 'كيف يتعامل المؤمنون مع أموالهم؟', options: ['يبخلون', 'ينفقون دون حساب', 'ينفقون باعتدال وفي سبيل الله'], correctAnswer: 2 },
            // 35. B (1)
            { id: 'q35', text: 'كيف يتصرف المؤمنون إذا سمعوا اللغو؟', options: ['يشاركون', 'يعرضون عنه', 'يستمعون فقط'], correctAnswer: 1 },
            // 36. C (2)
            { id: 'q36', text: 'كيف يتصرف المؤمنون إذا أُذيت مشاعرهم؟', options: ['ينتقمون', 'يسكتون', 'يصبرون ويقولون سلامًا'], correctAnswer: 2 },
            // 37. B (1)
            { id: 'q37', text: 'ماذا يسعى إليه المؤمنون في الدنيا؟', options: ['جمع المال', 'رضا الله والعمل الصالح', 'الشهرة'], correctAnswer: 1 },
            // 38. A (0)
            { id: 'q38', text: 'هل يتسامح المؤمنون مع من يسيء إليهم؟', options: ['نعم', 'لا', 'حسب الشخص'], correctAnswer: 0 },
            // 39. A (0)
            { id: 'q39', text: 'هل يسعى المؤمنون لتحقيق العدل؟', options: ['نعم دائماً', 'حسب المصلحة', 'لا يهتمون'], correctAnswer: 0 },
            // 40. A (0)
            { id: 'q40', text: 'ماذا يعتقد المؤمنون في الأنبياء؟', options: ['يؤمنون بهم جميعاً', 'ببعضهم', 'لا يؤمنون'], correctAnswer: 0 }
        ]
    };

    console.log('3. Inserting/Updating Tafsir Quiz...');

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
        3   // afterEpisodeIndex (Last episode index: 3)
    );

    console.log(`   Quiz "${quizData.title}" inserted successfully.`);
    console.log(`   - Connected to Course: ${quizData.courseId}`);
    console.log(`   - After Episode: 3`);
    console.log(`   - Questions: ${quizData.questions.length}`);
    console.log(`   - Passing Score: 80%`);

    console.log('--- Operation Complete ---');

} catch (error) {
    console.error('❌ Error:', error);
}
