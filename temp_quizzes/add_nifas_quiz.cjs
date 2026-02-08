const { db } = require('./server/database.cjs');

console.log('--- Starting Update: Ahkam Al-Nifas Quiz ---');

try {
    // 1. Update passing score for ALL quizzes to 80% (Just to be sure)
    db.prepare('UPDATE quizzes SET passing_score = 80').run();

    // 2. Define Quiz Data
    const quizData = {
        id: 'quiz_nifas_final',
        courseId: 'course_nifas',
        title: 'امتحان أحكام النفاس',
        questions: [
            // Q1: C (2)
            { id: 'q1', text: 'من أحكام الاستحاضة:', options: ['أن المرأة تصلي وتصوم ولا يأتيها زوجها', 'أن المرأة لا تصلي ولا تصوم ولا يأتيها زوجها', 'أن المرأة تصلي وتصوم ويأتيها زوجها'], correctAnswer: 2 },
            // Q2: B (1)
            { id: 'q2', text: 'صاحبة العادة المعروفة إذا رأت الدم زيادة على عادتها المعروفة:', options: ['تُرجع حيضها إلى آخر مرة رأت فيها الدم', 'تجعل ذلك حيضاً ما لم يجاوز أكثر الحيض', 'يكون كل ما نزل من الدم في هذه المرة استحاضة'], correctAnswer: 1 },
            // Q3: A (0)
            { id: 'q3', text: 'صاحبة العادة المعروفة إذا رأت الدم وزاد على عادتها وجاوز أكثر الحيض:', options: ['رُدت إلى أيام عادتها الأخيرة', 'رُدت إلى أيام عادتها الأولى', 'تكون هذه عادتها الجديدة وإن جاوزت أكثر الحيض'], correctAnswer: 0 },
            // Q4: A (0)
            { id: 'q4', text: 'طبع المرأة يزيد وينقص ولا يثبت على حال:', options: ['جملة صحيحة', 'جملة خاطئة'], correctAnswer: 0 },
            // Q5: B (1)
            { id: 'q5', text: 'صاحب العذر ابتداءً هو:', options: ['من يقدر على وضوء وصلاة بلا عذر', 'من لم يقدر على وضوء وصلاة بدون خروج عذر', 'من يقدر على وضوء وصلاة مع خروج العذر'], correctAnswer: 1 },
            // Q6: C (2)
            { id: 'q6', text: 'من أحكام أصحاب الأعذار:', options: ['لا ينتقض وضوؤهم بخروج الوقت', 'يصلون الفرض ونافلتَه فقط', 'ينتقض وضوؤهم في الوقت إن خرج منهم ناقض غير العذر المعروف'], correctAnswer: 2 },
            // Q7: A (0)
            { id: 'q7', text: 'من أحكام الحيض:', options: ['أن الحائض لا تصلي ولا تصوم', 'أن الحائض تصلي وتصوم', 'أن الحائض تصوم ولا تصلي'], correctAnswer: 0 },
            // Q8: B (1)
            { id: 'q8', text: 'أي مما يلي ليس من أحكام الحيض والنفاس؟', options: ['يحرمان الصلاة', 'يحرمان دخول المسجد', 'يوجبان الغسل'], correctAnswer: 1 },
            // Q9: A (0)
            { id: 'q9', text: 'إذا انقطع الدم تمام عشرة للحيض وأربعين للنفاس:', options: ['لا يحل الوطء إلا بالغسل', 'يحل الوطء بلا غسل', 'تصح الصلاة بدون غسل لأنها قضت كامل المدة'], correctAnswer: 0 },
            // Q10: C (2)
            { id: 'q10', text: 'إذا انقطع دم المرأة بعد ثلاثة أيام لأقل من عادتها:', options: ['تغتسل وتصلي وتصوم ويطؤها زوجها', 'تغتسل وتصلي ولا تصوم ولا يطؤها زوجها', 'تغتسل وتصلي وتصوم وتؤخر الوطء لتمام العادة'], correctAnswer: 2 },
            // Q11: C (2)
            { id: 'q11', text: 'الدم الصحيح هو:', options: ['ما ينقص عن ثلاثة ويزيد عن عشرة', 'ما ينقص عن ثلاثة ولا يزيد عن عشرة', 'ما لا ينقص عن ثلاثة ولا يزيد عن عشرة'], correctAnswer: 2 },
            // Q12: B (1)
            { id: 'q12', text: 'الطهر بين الدماء في مدة الحيض أو النفاس يسمى:', options: ['الطهر التام', 'الطهر المتخلل', 'الطهر الفاسد'], correctAnswer: 1 },
            // Q13: C (2)
            { id: 'q13', text: 'المبتدأة هي:', options: ['من نسيت عادتها', 'من سبق منها دم وطهر صحيحان', 'من كانت في أول حيض أو نفاس'], correctAnswer: 2 },
            // Q14: C (2)
            { id: 'q14', text: 'امرأة ولدت ثم انقطع دمها ثم عاد قبل الأربعين:', options: ['كل الأربعين نفاس', 'الأيام قبل الانقطاع فقط نفاس', 'إن استمر الدم 3–10 أيام فالنازل في الأربعين نفاس وإلا فهو استحاضة'], correctAnswer: 2 },
            // Q15: C (2)
            { id: 'q15', text: 'أقل النفاس وأكثره:', options: ['3 / 10 أيام', '3 / 40 يوماً', 'لا حد له / 40 يوماً'], correctAnswer: 2 },
            // Q16: A (0)
            { id: 'q16', text: 'العادة تثبت في الحيض والنفاس:', options: ['بمرتين', 'بثلاث', 'بمرة واحدة'], correctAnswer: 0 },
            // Q17: A (0)
            { id: 'q17', text: 'أكثر مدة الحيض:', options: ['10 أيام بلياليها', '40 يوماً', '3 أيام'], correctAnswer: 0 },
            // Q18: A (0)
            { id: 'q18', text: 'أكثر مدة الحيض بالساعات:', options: ['240 ساعة', '72 ساعة', 'لا حد له'], correctAnswer: 0 },
            // Q19: C (2)
            { id: 'q19', text: 'امرأة عادتها 25 يوماً، واستمر الدم بعد 40 يوماً:', options: ['كل الأربعين نفاس وما بعده استحاضة', 'يمكن أن يمتد النفاس لـ 60 يوماً', 'تُرد لعادتها 25 يوماً وما بعده استحاضة وتقضي الصلاة'], correctAnswer: 2 },
            // Q20: C (2)
            { id: 'q20', text: 'يحرم على الحائض والجنب:', options: ['قراءة القرآن', 'مس القرآن', 'الخياران معاً'], correctAnswer: 2 },
            // Q21: A (0)
            { id: 'q21', text: 'مبدأ حساب الحيض:', options: ['خروج الدم إلى الفرج الخارج', 'الشعور بالآلام', 'وضع الكرسف'], correctAnswer: 0 },
            // Q22: A (0)
            { id: 'q22', text: 'امرأة حامل بتوأم سقط الأول بعد الخامس:', options: ['يبدأ نفاسها من الأول إن كان بينهما أقل من 6 أشهر', 'يبدأ من الأول مطلقاً', 'من الثاني لأنه الحي'], correctAnswer: 0 },
            // Q23: C (2)
            { id: 'q23', text: 'من وضعت الكرسف ليلاً ورأت البياض صباحاً:', options: ['طهارتها من وقت إزالة الكرسف', 'طهارتها من وقت وضع الكرسف ويجب قضاء العشاء', 'طهارتها من وقت وضع الكرسف ولا شيء عليها'], correctAnswer: 2 },
            // Q24: A (0)
            { id: 'q24', text: 'جملة صحيحة واحدة:', options: ['الصوم يفسد إن نزل الدم ولو لحظة', 'تحرم الصلاة ولا تحرم السجدة', 'يحرم مس المصحف للجنُب والحائض ولو بغلاف'], correctAnswer: 0 },
            // Q25: B (1)
            { id: 'q25', text: 'الطهارة من الحدث للطواف عند الحنفية:', options: ['شرط صحة الطواف', 'واجب من واجبات الطواف', 'شرط من شروط الإحرام'], correctAnswer: 1 },
            // Q26: B (1)
            { id: 'q26', text: 'من حاضت قبل خروج الفجر:', options: ['تقضي الفجر', 'تسقط عنها', 'تسقط إن كان هناك متسع للاغتسال'], correctAnswer: 1 },
            // Q27: B (1)
            { id: 'q27', text: 'هل تُعذر المرأة بجهل أحكام الحيض؟', options: ['تعذر إن كانت كبيرة', 'لا تعذر فهو من علم الحال', 'تعذر لأن المجتمع لا يدرس هذه الأمور'], correctAnswer: 1 },
            // Q28: A (0)
            { id: 'q28', text: 'إشارة بلوغ المرأة:', options: ['نزول الحيض', 'نمو الشعر', 'بلوغ التاسعة'], correctAnswer: 0 },
            // Q29: C (2)
            { id: 'q29', text: 'ليست من ألوان الحيض:', options: ['المشحات', 'الدم الأسود', 'البياض الخالص'], correctAnswer: 2 },
            // Q30: C (2)
            { id: 'q30', text: 'دم المرأة 62 سنة يعتبر حيضاً إذا:', options: ['انقطع 3 أيام', 'كان لونه أسود أو أحمر', 'كلاهما'], correctAnswer: 2 },
            // Q31: B (1)
            { id: 'q31', text: 'من طهرت بعد الفجر:', options: ['تمسك وتقضي', 'لا تمسك وتقضي', 'تمسك ولا تقضي'], correctAnswer: 1 },
            // Q32: A (0)
            { id: 'q32', text: 'لا يشترط الاغتسال للصوم:', options: ['جملة صحيحة', 'جملة خاطئة'], correctAnswer: 0 },
            // Q33: C (2)
            { id: 'q33', text: 'المعتبر في وجوب الصلاة:', options: ['أول الوقت', 'آخر الوقت', 'هما سواء'], correctAnswer: 2 },
            // Q34: A (0)
            { id: 'q34', text: 'حكم غسل الإحرام للحائض:', options: ['مستحب', 'واجب', 'مكروه'], correctAnswer: 0 },
            // Q35: C (2)
            { id: 'q35', text: 'الدمان الصحيحان:', options: ['الحيض والاستحاضة', 'النفاس والاستحاضة', 'الحيض والنفاس'], correctAnswer: 2 },
            // Q36: C (2)
            { id: 'q36', text: 'حكم دم الإجهاض في الأسبوع الثالث:', options: ['حيض إن جاوز 3 أيام', 'استحاضة إن لم يتجاوز', 'هو حيض إن جاوز واستحاضة إن لم يتجاوز'], correctAnswer: 2 },
            // Q37: C (2)
            { id: 'q37', text: 'حكم سماع القرآن للحائض:', options: ['يجوز الاستماع', 'لا يجوز الاستماع ولا المس', 'يجوز الاستماع ولا يجوز المس ولا التلفظ'], correctAnswer: 2 },
            // Q38: C (2)
            { id: 'q38', text: 'ضابط انتهاء الحيض:', options: ['القصة البيضاء', 'الجفاف', 'كلاهما'], correctAnswer: 2 },
            // Q39: C (2)
            { id: 'q39', text: 'فتاة نزلت إفرازات بنية 12 يوماً ثم دم زهري:', options: ['حيض من الدم الزهري', 'حيض من أول يوم رأت الإفرازات', 'حيض من أول يوم بمقدار عادتها وما زاد استحاضة'], correctAnswer: 2 },
            // Q40: A (0)
            { id: 'q40', text: 'امرأة طهرت بعد 7 أيام ثم عاد الدم بعد 4 أيام:', options: ['صيامها باطل', 'لا يصح لأن طهرها لم يبلغ 15 يوماً', 'صيامها صحيح والدم استحاضة'], correctAnswer: 0 },
            // Q41: B (1) (User input capital C typically means C, but here it's listed as A, B, C. Wait, for Q40, user wrote "C- صيامها صحيح...". But correct answer listed is "أ" which is A. Okay, sticking to "الإجابة الصحيحة: ..." line.)
            // Q41: User: "الإجابة الصحيحة: ب" -> 1
            { id: 'q41', text: 'الدم قبل سن 9 سنوات:', options: ['حيض', 'استحاضة', 'حيض إن تجاوز ثلاثة أيام'], correctAnswer: 1 },
            // Q42: C (2)
            { id: 'q42', text: 'الإفرازات تنقض الوضوء وتنجس؟', options: ['إذا تغير لونها', 'إذا كثرت', 'طاهرة دوماً وغير نجسة'], correctAnswer: 2 },
            // Q43: A (0)
            { id: 'q43', text: 'علامة الطهر تختلف بين النفاس والحيض:', options: ['جملة صحيحة بضوابط', 'جملة صحيحة مطلقاً', 'جملة خاطئة'], correctAnswer: 0 },
            // Q44: B (1)
            { id: 'q44', text: 'بين الحيضين أو الحيض والنفاس يجب:', options: ['40 يوماً', '15 يوماً', 'لا تقدير لأقل الطهر'], correctAnswer: 1 },
            // Q45: B (1)
            { id: 'q45', text: 'المبتدأة إن استمر الدم:', options: ['حيضها 10 وطهرها 20', 'حيضها 3 وطهرها 20', 'حيضها 3 وطهرها 27'], correctAnswer: 1 },
            // Q46: B (1)
            { id: 'q46', text: 'ليست من أصحاب الأعذار:', options: ['جرح لا يرقأ', 'دم مستمر 3–10 أيام', 'انفلات ريح'], correctAnswer: 1 },
            // Q47: B (1)
            { id: 'q47', text: 'صاحب العذر استمراراً:', options: ['من لا يقدر على وضوء وصلاة بدون عذر', 'من يخرج منه العذر مرة في الوقت', 'من لا يأتيه العذر في وقت صلاة'], correctAnswer: 1 },
            // Q48: C (2)
            { id: 'q48', text: 'المرأة الحامل لا تحيض أبداً:', options: ['صحيحة', 'صحيحة حسب الحالة', 'خاطئة'], correctAnswer: 2 },
            // Q49: A (0)
            { id: 'q49', text: 'تعريف دم المرأة البالغة غير المريضة:', options: ['الحيض', 'النفاس', 'استحاضة'], correctAnswer: 0 },
            // Q50: B (1)
            { id: 'q50', text: 'الدم الحكمي يسمى:', options: ['استحاضة', 'طهر فاسد', 'طهر متخلل'], correctAnswer: 1 }
        ]
    };

    console.log('3. Inserting/Updating Ahkam Al-Nifas Quiz...');

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
        8   // afterEpisodeIndex (Last episode index found: 8)
    );

    console.log(`   Quiz "${quizData.title}" inserted successfully.`);
    console.log(`   - Connected to Course: ${quizData.courseId}`);
    console.log(`   - After Episode: 8`);
    console.log(`   - Questions: ${quizData.questions.length}`);
    console.log(`   - Passing Score: 80%`);

    console.log('--- Operation Complete ---');

} catch (error) {
    console.error('❌ Error:', error);
}
