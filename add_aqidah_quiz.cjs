const { db } = require('./server/database.cjs');

console.log('--- Starting Update: Aqidah Quiz ---');

try {
    // 1. Update passing score for ALL quizzes to 80% (Just to be sure)
    db.prepare('UPDATE quizzes SET passing_score = 80').run();

    // 2. Define Quiz Data
    const quizData = {
        id: 'quiz_aqeeda_final',
        courseId: 'course_aqeeda',
        title: 'امتحان العقيدة',
        questions: [
            // Q1: B (1)
            { id: 'q1', text: 'ما معنى الإسلام؟', options: ['الإقرار باللسان فقط', 'الإقرار باللسان والتصديق بالقلب', 'الإقرار بالقلب فقط', 'لا شيء مما ذكر'], correctAnswer: 1 },
            // Q2: A (0)
            { id: 'q2', text: 'كيف الإيمان بالله إجمالاً؟', options: ['أن الله متصف بجميع صفات الكمال ومنزه عن النقص', 'متصف بالكمال ومنزه عن بعض النقص', 'متصف ببعض الكمال ومنزه عن بعض النقص', 'لا شيء مما ذكر'], correctAnswer: 0 },
            // Q3: A (0)
            { id: 'q3', text: 'كيف الاعتقاد بوجود الله تعالى؟', options: ['وجود الله واجب لا يلحقه عدم', 'وجوده ممكن وقد يلحقه عدم', 'وجوده مستحيل', 'لا شيء مما ذكر'], correctAnswer: 0 },
            // Q4: B (1)
            { id: 'q4', text: 'ما وظائف الملائكة؟', options: ['لا وظائف لهم', 'لهم وظائف مختلفة: الحفظ، كتابة الأعمال، الجنة والنار', 'يعبدون الله فقط', 'لا شيء مما ذكر'], correctAnswer: 1 },
            // Q5: B (1)
            { id: 'q5', text: 'كيف اعتقادنا بالتوراة والزبور والإنجيل؟', options: ['كتب منزلة وهي الآن صحيحة', 'كتب منزلة وهي الآن محرفة', 'كتب بشرية', 'لا شيء مما ذكر'], correctAnswer: 1 },
            // Q6: D (3)
            { id: 'q6', text: 'ما وجه إعجاز القرآن الكريم؟', options: ['الفصاحة والبلاغة', 'جمال التلاوة', 'أخبار الغيب', 'أ + ج'], correctAnswer: 3 },
            // Q7: B (1)
            { id: 'q7', text: 'كيف اعتقادنا برسل الله تعالى؟', options: ['واجب على الله إرسال رسل', 'أرسل الله الرسل فضلاً ورحمة', 'الرسل بشر عاديون', 'لا شيء مما ذكر'], correctAnswer: 1 },
            // Q8: B (1)
            { id: 'q8', text: 'هل يوجد نبي لله من غير الإنسان؟', options: ['نعم', 'لا', 'لا أعلم', 'لا شيء مما ذكر'], correctAnswer: 1 },
            // Q9: B (1)
            { id: 'q9', text: 'ماذا يجب للأنبياء؟', options: ['الصدق والأمانة فقط', 'الصدق والأمانة والتبليغ والفطانة', 'لا يجب لهم شيء', 'لا شيء مما ذكر'], correctAnswer: 1 },
            // Q10: A (0)
            { id: 'q10', text: 'جميع الأنبياء جاءوا بنفس العقيدة ولكن اختلفوا بالأحكام:', options: ['صحيح', 'خطأ', 'بعضهم جاء بعقائد مختلفة', 'لا شيء مما ذكر'], correctAnswer: 0 },
            // Q11: A (0)
            { id: 'q11', text: 'قوله تعالى: (النار يعرضون عليها…) يدل على:', options: ['وجود عذاب القبر', 'يوم القيامة فقط', 'نعيم القبر', 'لا شيء مما ذكر'], correctAnswer: 0 },
            // Q12: A (0)
            { id: 'q12', text: 'كيف اعتقادنا بالحساب؟', options: ['الله يحاسب كل فرد', 'الملائكة تحاسب', 'لا يوجد حساب', 'البشر يحاسبون بعضهم'], correctAnswer: 0 },
            // Q13: B (1)
            { id: 'q13', text: 'هل يشفع أحد يوم القيامة؟', options: ['الأنبياء فقط', 'الأنبياء والأولياء والعلماء والشهداء', 'لا أحد', 'لا شيء مما ذكر'], correctAnswer: 1 },
            // Q14: A (0)
            { id: 'q14', text: 'ما حكم الكافر أو المنافق بعد الحساب؟', options: ['يدخلون النار خالدين', 'يدخلون ثم يخرجون', 'يرحمون', 'غير ذلك'], correctAnswer: 0 },
            // Q15: A (0)
            { id: 'q15', text: 'نعتقد أن أفعال العباد كلها بإرادة الله:', options: ['صحيح', 'خطأ', 'في الاختيارية فقط', 'في الاضطرارية فقط'], correctAnswer: 0 },
            // Q16: A (0)
            { id: 'q16', text: 'كيف عرفنا الله دون أن نراه؟', options: ['بظهور آثار قدرته', 'لأن الأنبياء أخبرونا', 'لأننا تربينا على ذلك'], correctAnswer: 0 },
            // Q17: A (0)
            { id: 'q17', text: 'ما هي الإسراء والمعراج؟', options: ['الإسراء من مكة للأقصى والمعراج إلى السماوات', 'الإسراء من مكة للمدينة والمعراج منها للسماوات', 'الإسراء للسماء الأولى والمعراج منها للسابعة', 'لا شيء مما ذكر'], correctAnswer: 0 },
            // Q18: B (1)
            { id: 'q18', text: 'نعيم الجنة روحاني فقط:', options: ['صحيح', 'غير صحيح: روحاني وجسماني', 'جسماني فقط', 'مؤقت'], correctAnswer: 1 },
            // Q19: B (1)
            { id: 'q19', text: 'من هم المجتهدون الذين يُتّبعون؟', options: ['أبو حنيفة ومالك بن دينار والمحاسبي والليث', 'أبو حنيفة ومالك والشافعي وأحمد', 'الخلفاء الأربعة', 'غير ذلك'], correctAnswer: 1 },
            // Q20: B (1)
            { id: 'q20', text: 'المجتهدون اختلفوا في:', options: ['الأصول والفروع', 'الفروع فقط', 'الأصول فقط', 'لا شيء مما ذكر'], correctAnswer: 1 }
        ]
    };

    console.log('3. Inserting/Updating Aqidah Quiz...');

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
        10   // afterEpisodeIndex (Last episode index: 10)
    );

    console.log(`   Quiz "${quizData.title}" inserted successfully.`);
    console.log(`   - Connected to Course: ${quizData.courseId}`);
    console.log(`   - After Episode: 10`);
    console.log(`   - Questions: ${quizData.questions.length}`);
    console.log(`   - Passing Score: 80%`);

    console.log('--- Operation Complete ---');

} catch (error) {
    console.error('❌ Error:', error);
}
