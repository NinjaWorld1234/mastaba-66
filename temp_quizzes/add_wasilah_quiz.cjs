const { db } = require('./server/database.cjs');

console.log('--- Starting Update: Fiqh - Wasilat Al-Talab Quiz ---');

try {
    // 1. Update passing score for ALL quizzes to 80% (Just to be sure)
    db.prepare('UPDATE quizzes SET passing_score = 80').run();

    // 2. Define Quiz Data
    const quizData = {
        id: 'quiz_wasilah_final',
        courseId: 'course_fiqh1-waseelit',
        title: 'امتحان فقه - وسيلة الطلب',
        questions: [
            // Q1: B (1)
            { id: 'q1', text: 'يطلق على الشهادتين، والصلاة، والزكاة، والصوم، والحج:', options: ['أركان الإيمان', 'أركان الإسلام', 'شروط التوبة', 'الإحسان'], correctAnswer: 1 },
            // Q2: D (3)
            { id: 'q2', text: 'من أركان الإيمان:', options: ['الإيمان بالله وملائكته وكتبه', 'الإيمان بالرسل واليوم الآخر', 'الإيمان بالقدر خيره وشره', 'جميع ما سبق'], correctAnswer: 3 },
            // Q3: D (3)
            { id: 'q3', text: 'من الصفات الواجبة لله تعالى:', options: ['الوحدانية والقدم والبقاء', 'رعاية العباد بما هو أصلح', 'القدرة والإرادة والكلام والسمع والبصر', 'أ + ج'], correctAnswer: 3 },
            // Q4: D (3)
            { id: 'q4', text: 'الإيمان بالكتب السماوية يكون:', options: ['الاعتقاد بأنها كلام الله القديم غير المخلوق', 'أنها محفوظة من التحريف', 'الكتب المفصلة هي: القرآن، التوراة، الإنجيل، الزبور', 'أ + ج'], correctAnswer: 3 },
            // Q5: D (3)
            { id: 'q5', text: 'تثبت الردة بـ:', options: ['قول موجب للكفر عن اعتقاد أو فعل كالسجود لصنم', 'الاستهزاء بالحكم الشرعي أو السنة', 'استحلال الحرام أو تحريم الحلال المجمع عليه', 'جميع ما ذكر'], correctAnswer: 3 },
            // Q6: C (2)
            { id: 'q6', text: 'أمراض القلوب كثيرة، وأمهاتها هي:', options: ['القتل والسرقة والزنا', 'النظر للمحرمات', 'الكبر والعجب والرياء والحسد', 'شرب المسكرات وترك الصلاة'], correctAnswer: 2 },
            // Q7: B (1)
            { id: 'q7', text: 'التوبة واجبة، وشرطها:', options: ['الندم وترك الذنب فقط', 'الندم وترك الذنب والعزم على عدم العودة وقضاء الحقوق', 'لا يعتبر قضاء الفوائت شرطاً للتوبة', 'الاستغفار فقط'], correctAnswer: 1 },
            // Q8: C (2)
            { id: 'q8', text: 'أركان الوضوء أربعة وهي:', options: ['المضمضة والاستنشاق وغسل الوجه والرجلين', 'غسل الوجه واليدين للرسغين وغسل الرأس والرجلين', 'غسل الوجه واليدين للمرفقين ومسح الرأس وغسل الرجلين', 'النية والتسمية وغسل الوجه واليدين'], correctAnswer: 2 },
            // Q9: D (3)
            { id: 'q9', text: 'ينقض الوضوء:', options: ['ما خرج من السبيلين وسيلان نجس', 'القيء ونوم غير المتمكن والمباشرة الفاحشة', 'الإغماء والجنون والسكر وقهقهة المصلي', 'جميع ما ذكر'], correctAnswer: 3 },
            // Q10: B (1)
            { id: 'q10', text: 'فروض الغسل هي:', options: ['النية والتسمية وغسل البدن', 'المضمضة والاستنشاق وغسل البدن', 'النية والمضمضة وغسل الفرج فقط', 'النية والتسمية وغسل الفرج والبدن'], correctAnswer: 1 },
            // Q11: D (3)
            { id: 'q11', text: 'مما لا يوجب الغسل:', options: ['إنزال المني أو رؤيته بعد النوم', 'انقطاع الحيض والنفاس', 'الإيلاج', 'خروج المذي بالشهوة'], correctAnswer: 3 },
            // Q12: A (0)
            { id: 'q12', text: 'المياه التي يصح التطهير بها:', options: ['الماء المطلق ولو تغيّر بالمكث', 'ماء قليل وقعت فيه نجاسة', 'ماء استعمل لرفع حدث', 'ماء تغيرت أوصافه بطاهر'], correctAnswer: 0 },
            // Q13: D (3)
            { id: 'q13', text: 'ما ليس من مبيحات التيمم:', options: ['بعد الماء ميلاً', 'العجز عن استعمال الماء لمرض أو خوف', 'فقد آلة استخراج الماء', 'وضع جبيرة على الرجل'], correctAnswer: 3 },
            // Q14: C (2)
            { id: 'q14', text: 'ينقض التيمم:', options: ['كل ناقض للوضوء', 'ما يخرج من السبيلين', 'كل ناقض للوضوء والقدرة على استعمال الماء', 'مس المرأة'], correctAnswer: 2 },
            // Q15: B (1)
            { id: 'q15', text: 'يطهر البدن والثوب بـ:', options: ['الجفاف', 'الغسل بالماء أو مائع طاهر', 'المسح', 'الفرك'], correctAnswer: 1 },
            // Q16: B (1)
            { id: 'q16', text: 'الاستنجاء سنةٌ:', options: ['عند فقد الماء', 'عند عدم مجاوزة النجاسة مخرجها', 'سنة بكل حال', 'فرض بكل حال'], correctAnswer: 1 },
            // Q17: B (1)
            { id: 'q17', text: 'الشرط هو:', options: ['ما لا يصح العمل إلا به', 'ما لا يصح العمل إلا به ويكون خارجاً عنه', 'ما كان من جنس العمل', 'لا شيء مما ذكر'], correctAnswer: 1 },
            // Q18: D (3)
            { id: 'q18', text: 'من شروط الصلاة:', options: ['طهارة البدن والثوب والمكان وستر العورة', 'النية واستقبال القبلة ودخول الوقت والتحريمة', 'الركوع والسجود', 'أ + ب'], correctAnswer: 3 },
            // Q19: D (3)
            { id: 'q19', text: 'أركان الصلاة:', options: ['القيام والقراءة', 'القعود الأول والتشهد والسلام', 'الركوع والسجود والترتيب والقعود الأخير', 'أ + ج'], correctAnswer: 3 },
            // Q20: D (3)
            { id: 'q20', text: 'من واجبات الصلاة:', options: ['قراءة الفاتحة وسورة في الأوليين', 'الطمأنينة والتشهد', 'القنوت والجهر والإسرار', 'جميع ما ذكر'], correctAnswer: 3 },
            // Q21: A (0)
            { id: 'q21', text: 'مما يفسد الصلاة:', options: ['كلام الناس وما يشبهه', 'العمل القليل', 'الالتفات', 'كشف الرأس'], correctAnswer: 0 },
            // Q22: B (1)
            { id: 'q22', text: 'حكم صلاة الوتر وكيفيتها:', options: ['سنة مؤكدة', 'واجبة وتُصلى ثلاثاً والقنوت قبل الركوع', 'فرض', 'مندوبة'], correctAnswer: 1 },
            // Q23: B (1)
            { id: 'q23', text: 'يلزم سجود السهو بـ:', options: ['ترك سنة عمداً', 'ترك واجب سهواً', 'ترك مستحب', 'خطأ القراءة'], correctAnswer: 1 },
            // Q24: A (0)
            { id: 'q24', text: 'من شروط وجوب الزكاة:', options: ['مسلم مكلف مالك نصاب حولي نامٍ', 'الزروع والثمار', 'الذهب والفضة والنقود', 'المواشي'], correctAnswer: 0 },
            // Q25: B (1)
            { id: 'q25', text: 'تُصرف الزكاة:', options: ['للمرافق العامة', 'للمصارف السبعة', 'لأي مسلم', 'للطفل الغني'], correctAnswer: 1 },
            // Q26: A (0)
            { id: 'q26', text: 'مقدار صدقة الفطر:', options: ['نصف صاع بر أو صاع تمر أو قيمته', 'ما تيسر', 'تمر أو قمح فقط', 'غير محدد'], correctAnswer: 0 },
            // Q27: A (0)
            { id: 'q27', text: 'يشترط لصوم رمضان والنذر والنفل:', options: ['التبييت والتعيين', 'تصح النية حتى منتصف النهار', 'الإمساك قبل الفجر بمدة', 'السحور'], correctAnswer: 0 },
            // Q28: D (3)
            { id: 'q28', text: 'يفسد الصوم إذا:', options: ['أكل ناسياً', 'احتجم', 'دخل حلقه ذباب', 'دخل جوفه ماء خطأ أثناء المضمضة'], correctAnswer: 3 },
            // Q29: B (1)
            { id: 'q29', text: 'مما يبيح الفطر في رمضان:', options: ['التعب والعطش', 'المسافر والمريض الذي يخشى الضرر', 'الانتقال لمسافة قصيرة', 'لا يجوز تركه بحال'], correctAnswer: 1 },
            // Q30: B (1)
            { id: 'q30', text: 'فرض الحج:', options: ['الإحرام من الميقات والحلق', 'الإحرام والوقوف بعرفة وطواف الزيارة', 'مزدلفة والجمار', 'الطواف والسعي'], correctAnswer: 1 },

            // True/False Questions
            // Q31: T (0) - Correct: 0 -> Yes/True
            { id: 'q31', text: 'كمال الإيمان: إقرار باللسان وتصديق بالجنان وعمل بالأركان.', options: ['صحيح', 'خطأ'], correctAnswer: 0 },
            // Q32: T (0)
            { id: 'q32', text: 'الكبر احتقار الغير، والعجب استعظام النفس.', options: ['صحيح', 'خطأ'], correctAnswer: 0 },
            // Q33: T (0)
            { id: 'q33', text: 'لا يعتبر قضاء الفوائت شرطًا للتوبة.', options: ['صحيح', 'خطأ'], correctAnswer: 0 },
            // Q34: F (1)
            { id: 'q34', text: 'النية والتسمية والسواك والمضمضة والاستنشاق ومسح الرأس واجبات وضوء.', options: ['صحيح', 'خطأ'], correctAnswer: 1 },
            // Q35: T (0)
            { id: 'q35', text: 'الركن: ما لا يصح العمل إلا به، وهو جزء من ماهية العمل.', options: ['صحيح', 'خطأ'], correctAnswer: 0 },
            // Q36: T (0)
            { id: 'q36', text: 'يصح التيمم بما كان من جنس الأرض، لا ينطبع ولا يحترق.', options: ['صحيح', 'خطأ'], correctAnswer: 0 },
            // Q37: T (0)
            { id: 'q37', text: 'يطهر السيف والصقيل بالمسح.', options: ['صحيح', 'خطأ'], correctAnswer: 0 },
            // Q38: T (0)
            { id: 'q38', text: 'يفسد الصوم وتجب الكفارة مع القضاء إذا أكل أو شرب أو جامع عامداً.', options: ['صحيح', 'خطأ'], correctAnswer: 0 },
            // Q39: T (0)
            { id: 'q39', text: 'الحول: عام هجري كامل يشترط لوجوب الزكاة.', options: ['صحيح', 'خطأ'], correctAnswer: 0 },
            // Q40: F (1)
            { id: 'q40', text: 'الزيادة على بعدية الظهر والعشاء لتصير أربعاً مستحب.', options: ['صحيح', 'خطأ'], correctAnswer: 1 }
        ]
    };

    console.log('3. Inserting/Updating Fiqh - Wasilat Al-Talab Quiz...');

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
        13   // afterEpisodeIndex (Last episode index: 13)
    );

    console.log(`   Quiz "${quizData.title}" inserted successfully.`);
    console.log(`   - Connected to Course: ${quizData.courseId}`);
    console.log(`   - After Episode: 13`);
    console.log(`   - Questions: ${quizData.questions.length}`);
    console.log(`   - Passing Score: 80%`);

    console.log('--- Operation Complete ---');

} catch (error) {
    console.error('❌ Error:', error);
}
