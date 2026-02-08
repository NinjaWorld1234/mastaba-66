const { db } = require('./server/database.cjs');

const quizData = {
    id: 'quiz_madkhal_final',
    courseId: 'course_madkhal',
    episodeId: 'ep_madkhal_6',
    title: 'امتحان مدخل للعلوم الشرعية',
    questions: [
        {
            id: 'q1',
            text: 'ما هو علم الحال؟',
            options: ['كل العبادات', 'الطهارة والصلاة', 'الزواج والميراث', 'كل ما يحتاجه في أي حال من أحواله'],
            correctAnswer: 3 // د
        },
        {
            id: 'q2',
            text: 'أكمل الحديث: "طلب العلم _____"',
            options: ['سنة على كل مسلم', 'فريضة على كل مسلم', 'على كل مكلف واجب', 'لا شيء مما ذكر'],
            correctAnswer: 1 // ب
        },
        {
            id: 'q3',
            text: 'أهم خلق يجب أن يلحظه ويصححه طالب العلم',
            options: ['النية الخالصة', 'رضا الناس', 'الهمة العالية', 'المناقشة والمناظرة'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q4',
            text: 'من أدب طالب العلم مع شيخه',
            options: ['أن لا يمشي أمامه', 'أن يأتي بالدرس قبل الشيخ', 'أن يجلس معظماً لشيخه مقلداً له', 'جميع ما ذكر'],
            correctAnswer: 3 // د
        },
        {
            id: 'q5',
            text: 'من أقوى أسباب الفهم',
            options: ['التقوى والحذر من المعاصي', 'السؤال عن الشيء الذي لم يفهمه', 'الصحبة الصالحة', 'جميع ما ذكر'],
            correctAnswer: 3 // د
        },
        {
            id: 'q6',
            text: 'معنى كلمة الفقه في اللغة',
            options: ['العلم', 'الفهم', 'الصدق', 'الذكر'],
            correctAnswer: 1 // ب
        },
        {
            id: 'q7',
            text: 'عند بداية طالب العلم بالدراسة الفقهية يبدأ بـ:',
            options: ['دراسة الآيات', 'استنباط الأحكام من الحديث', 'المتون والقواعد', 'القياس والاستحسان'],
            correctAnswer: 2 // ج
        },
        {
            id: 'q8',
            text: 'تعريف الفقه عند الفقهاء',
            options: ['العلم بالأدلة الشرعية المكتسبة من أدلتها التفصيلية', 'علم يبحث في أعمال المكلفين من حيث الحل والحرمة والفساد والصحة', 'جميع ما ذكر', 'لا شيء مما ذكر'],
            correctAnswer: 2 // ج
        },
        {
            id: 'q9',
            text: 'الحكم التكليفي عند الحنفية عددها:',
            options: ['خمسة', 'ستة', 'سبعة', 'أربعة'],
            correctAnswer: 1 // ب (Note: User said "ب- ستة" but usually it's 7 in Hanafi or 5 in Jumhoor. Sticking to user's choice: ب)
            // Correction: User explicitly said Answer: ب. Option ب is ستة.
        },
        {
            id: 'q10',
            text: 'ما هو المطلوب طلباً جازماً بدليل ظني؟',
            options: ['الفرض', 'الواجب', 'السنة', 'الإحرام'],
            correctAnswer: 1 // ب
        },
        {
            id: 'q11',
            text: 'ما هو المطلوب تركه تركاً جازماً بدليل قطعي؟',
            options: ['المكروه تنزيهاً', 'المكروه تحريماً', 'الحرام', 'المباح'],
            correctAnswer: 2 // ج
        },
        {
            id: 'q12',
            text: 'البدعة في الاصطلاح:',
            options: ['ما لم يفعله رسول الله ﷺ', 'ما ليس له أصل في الدين', 'ما لم يفعله الخلفاء الراشدون', 'لا شيء مما ذكر'],
            correctAnswer: 1 // ب
        },
        {
            id: 'q13',
            text: 'ما هي البدعة المقصودة في الحديث (كل بدعة ضلالة):',
            options: ['البدعة المحرّمة', 'البدعة السنية', 'البدعة التي ليس لها أصل في الدين', 'جميع ما ذكر'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q14',
            text: 'ما حكم الذكر الجماعي؟',
            options: ['سنة', 'بدعة', 'مكروه', 'واجب'],
            correctAnswer: 1 // ب (User said Answer: ب which is "بدعة" here. Wait, checking user input.
            // User input: "14. ما حكم الذكر الجماعي؟ ... الإجابات: أ- سنة, ب- بدعة ... الإجابة الصحيحة: ب".
            // NOTE: This contradicts traditional Sufi/Ash'ari stance often found in such courses, but I MUST FOLLOW USER INPUT EXACTLY.)
        },
        {
            id: 'q15',
            text: 'الأصل العام الذي نرجع إليه لجواز الاحتفال بالمولد النبوي',
            options: ['حديث (من سن في الإسلام سنة حسنة…)', 'قوله تعالى: (وذكّرهم بأيام الله)', 'إجماع المذاهب الأربعة', 'جميع ما ذكر'],
            correctAnswer: 3 // د
        },
        {
            id: 'q16',
            text: 'إذا كانت الدلالة قطعية والثبوت قطعي فإنه يدل على:',
            options: ['الفرض', 'الإحرام', 'الواجب', 'أ + ب'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q17',
            text: 'إذا كانت الكلمة تحمل عدة معانٍ فإن دلالتها تكون:',
            options: ['ظنية', 'قطعية', 'أ + ب', 'ثبوت ظني'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q18',
            text: 'أكمل: (المباحات بالنيات تصبح ___)',
            options: ['عبادات', 'معاملات', 'عادات', 'طيبات'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q19',
            text: 'منكر الواجب نحكم عليه:',
            options: ['كافر', 'مرتد', 'فاسق', 'أ + ب'],
            correctAnswer: 2 // ج
        },
        {
            id: 'q20',
            text: 'وُلد أبو حنيفة رحمه الله سنة:',
            options: ['80', '90', '81', '85'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q21',
            text: 'يعتبر الإمام محمد بن الحسن الشيباني شيخ الإمام:',
            options: ['أحمد بن حنبل', 'الشافعي', 'أبو حنيفة', 'مالك'],
            correctAnswer: 1 // ب
        },
        {
            id: 'q22',
            text: 'اسم شيخ الإمام أبي حنيفة الأشهر:',
            options: ['حماد بن سليمان', 'علقمة النسفي', 'أبو يوسف القاضي', 'الإمام مالك'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q23',
            text: 'من أسباب الاختلاف بين المذاهب الأربعة:',
            options: ['الاختلاف في دلالات الألفاظ', 'الاختلاف في اعتبار الدين من حيث التصحيح والتضعيف', 'اعتبار الحديث المشهور', 'جميع ما ذكر'],
            correctAnswer: 3 // د
        },
        {
            id: 'q24',
            text: 'السلفية الحقيقية هي في اتباع:',
            options: ['فهمي أنا للكتاب والسنة', 'اتباع المذاهب الأربعة', 'اختيار الأسهل من بين الأقوال', 'لا شيء مما ذكر'],
            correctAnswer: 1 // ب
        },
        {
            id: 'q25',
            text: 'انطلق المذهب الحنفي من:',
            options: ['المدينة', 'مكة', 'الكوفة', 'الشام'],
            correctAnswer: 2 // ج
        },
        {
            id: 'q26',
            text: 'حديث (ذو اليدين) يعتبره الحنفية:',
            options: ['منسوخ', 'يعملون به لأنه في البخاري', 'ضعيف', 'لا شيء مما ذكر'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q27',
            text: 'أكمل: (الحديث مضلة إلا ____)',
            options: ['المحدثون', 'النحاة', 'الفقهاء', 'المفسرون'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q28',
            text: 'هل يلزم من صحة الحديث العمل به؟',
            options: ['نعم', 'لا'],
            correctAnswer: 1 // ب
        },
        {
            id: 'q29',
            text: 'يقسم الحنفية الحديث إلى:',
            options: ['ثلاثة أقسام', 'قسمين', 'أربعة أقسام', 'لا شيء مما ذكر'],
            correctAnswer: 0 // أ
        },
        {
            id: 'q30',
            text: 'التصحيح والتضعيف في الحديث يعتبر أمراً:',
            options: ['اجتهادياً', 'ظنياً', 'قطعياً', 'أ + ب'],
            correctAnswer: 3 // د
        }
    ]
};

console.log('Adding Madkhal Quiz...');

try {
    // 1. Delete existing quiz if any (to allow updates)
    const existing = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(quizData.id);
    if (existing) {
        console.log('Quiz already exists. Deleting to update...');
        db.prepare('DELETE FROM options WHERE questionId IN (SELECT id FROM questions WHERE quizId = ?)').run(quizData.id);
        db.prepare('DELETE FROM questions WHERE quizId = ?').run(quizData.id);
        db.prepare('DELETE FROM quizzes WHERE id = ?').run(quizData.id);
    }

    // 2. Insert Quiz
    const insertQuiz = db.prepare(`
        INSERT INTO quizzes (id, courseId, title, questions, passing_score, afterEpisodeIndex)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Prepare questions with options (no need for separate table inserts)
    // The structure in quizData already matches what we want to stringify,
    // but the options array string/object format needs to be consistent with frontend expectations.
    // Frontend likely expects options as array of strings, and correct answer as index.

    insertQuiz.run(
        quizData.id,
        quizData.courseId,
        quizData.title,
        JSON.stringify(quizData.questions),
        70, // passing score
        6   // afterEpisodeIndex (Last episode index)
    );

    console.log(`Quiz "${quizData.title}" inserted successfully with ${quizData.questions.length} questions.`);

} catch (error) {
    console.error('Error adding quiz:', error);
}
