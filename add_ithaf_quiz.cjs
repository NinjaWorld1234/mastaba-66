const { db } = require('./server/database.cjs');

console.log('--- Starting Update: Fiqh Al-Ithaf Quiz ---');

try {
    // 1. Update global passing score again (just in case)
    db.prepare('UPDATE quizzes SET passing_score = 80').run();

    // 2. Define Quiz Data
    const quizData = {
        id: 'quiz_ithaf_final',
        courseId: 'course_fiqh2-it7af',
        title: 'امتحان فقه الإتحاف',
        questions: [
            // Q1: C (2)
            { id: 'q1', text: 'مؤلف متن إتحاف الطالب هو:', options: ['الإمام القدوري', 'الإمام الموصلي', 'الإمام أبو بكر الإحسائي'], correctAnswer: 2 },
            // Q2: A (0)
            { id: 'q2', text: 'أهل السنة والجماعة في العقيدة هم:', options: ['الأشاعرة والماتريدية وفضلاء الحنابلة', 'الأشاعرة والشيعة', 'الماتريدية والخوارج'], correctAnswer: 0 },
            // Q3: A (0)
            { id: 'q3', text: 'صفة الوحدانية تعني أن الله تعالى:', options: ['واحد في ذاته وأفعاله وصفاته', 'واحد في ذاته وأفعاله فقط', 'واحد في ذاته وصفاته فقط'], correctAnswer: 0 },
            // Q4: B (1)
            { id: 'q4', text: 'كرامات الأولياء:', options: ['لا نؤمن بها', 'نؤمن بها، ولا يصل الولي لدرجة الأنبياء', 'نؤمن بها، والأولياء مثل الأنبياء'], correctAnswer: 1 },
            // Q5: A (0)
            { id: 'q5', text: 'سيلان الدم وإن كان قليلاً من نواقض:', options: ['الوضوء', 'التيمم', 'كلاهما'], correctAnswer: 0 },
            // Q6: B (1)
            { id: 'q6', text: 'حكم غسل الجمعة:', options: ['مستحب', 'سنة مؤكدة', 'واجب'], correctAnswer: 1 },
            // Q7: A (0)
            { id: 'q7', text: 'الماء المطلق هو:', options: ['الطاهر المطهر لغيره', 'الطاهر غير المطهر', 'النجس'], correctAnswer: 0 },
            // Q8: C (2)
            { id: 'q8', text: 'السبب الموجب للموت هو:', options: ['انتهاء الأجل', 'الحوادث', 'الخياران معاً'], correctAnswer: 2 },
            // Q9: A (0)
            { id: 'q9', text: 'مقدار مسح الرأس الواجب:', options: ['ربع الرأس', 'كل الرأس', 'ثلاث شعرات'], correctAnswer: 0 },
            // Q10: C (2)
            { id: 'q10', text: 'حكم التتابع في الوضوء:', options: ['فرض', 'واجب', 'سنة'], correctAnswer: 2 },
            // Q11: C (2)
            { id: 'q11', text: 'مقدار الماء الكثير:', options: ['2.5م × 2.5م', '5م × 5م', '10م × 10م'], correctAnswer: 2 },
            // Q12: B (1)
            { id: 'q12', text: 'عرق الكلب:', options: ['طاهر', 'نجس', 'مشكوك فيه'], correctAnswer: 1 },
            // Q13: B (1)
            { id: 'q13', text: 'إذا ضر غسل الجرح فالمسح يكون:', options: ['على أقل الجرح', 'على أكثر الجرح', 'يجب وضع لفافة'], correctAnswer: 1 },
            // Q14: No (1) - "الإجابة الصحيحة: لا" -> 0: Yes, 1: No.
            { id: 'q14', text: 'يجوز التيمم قبل الوقت ويصلي الفرض فقط:', options: ['نعم', 'لا'], correctAnswer: 1 },
            // Q15: B (1)
            { id: 'q15', text: 'من مسح على جورب رقيق ثم خلعه وصلّى:', options: ['صلاته صحيحة', 'باطلة ويعيد', 'باطلة ولا يعيد'], correctAnswer: 1 },
            // Q16: B (1)
            { id: 'q16', text: 'بداية حساب مدة المسح 24 ساعة:', options: ['من الرابعة', 'من السابعة', 'من العاشرة'], correctAnswer: 1 }, // Note: Question likely refers to a specific case mentioned in class
            // Q17: A (0)
            { id: 'q17', text: 'أكثر مدة الحيض:', options: ['10 أيام', '40 يوماً', '3 أيام'], correctAnswer: 0 },
            // Q18: B (1)
            { id: 'q18', text: 'حكم قصر الصلاة للمسافر:', options: ['جائز', 'واجب', 'سنة'], correctAnswer: 1 },
            // Q19: C (2)
            { id: 'q19', text: 'مقدار النجاسة المعفو عنها من النجاسة المغلظة:', options: ['ربع العضو', 'لا مقدار محدد', 'قدر الدرهم'], correctAnswer: 2 },
            // Q20: C (2)
            { id: 'q20', text: 'يحرم على الحائض والجنب:', options: ['قراءة القرآن', 'مس القرآن', 'كلاهما'], correctAnswer: 2 },
            // Q21: B (1)
            { id: 'q21', text: 'النية في الصلاة من:', options: ['الواجبات', 'الشروط', 'الأركان'], correctAnswer: 1 },
            // Q22: A (0)
            { id: 'q22', text: 'القيام في صلاة الفرض:', options: ['ركن', 'واجب', 'جائز'], correctAnswer: 0 },
            // Q23: C (2)
            { id: 'q23', text: 'حكم قراءة التشهد في القعود الأخير:', options: ['شرط', 'ركن', 'واجب'], correctAnswer: 2 },
            // Q24: B (1)
            { id: 'q24', text: 'قراءة الفاتحة في أول ركعتين من الفرض:', options: ['ركن', 'واجب', 'شرط'], correctAnswer: 1 },
            // Q25: B (1)
            { id: 'q25', text: 'حكم الوتر والقنوت:', options: ['كلاهما سنة', 'الوتر واجب والقنوت سنة', 'كلاهما واجب'], correctAnswer: 1 },
            // Q26: B (1)
            { id: 'q26', text: 'الطمأنينة في الصلاة تتحقق بـ:', options: ['تسبيحة لفظاً', 'تسبيحة زمناً', 'ثلاث تسبيحات'], correctAnswer: 1 },
            // Q27: B (1)
            { id: 'q27', text: 'حكم التسبيح في الركوع والسجود:', options: ['شرط', 'سنة', 'ركن'], correctAnswer: 1 },
            // Q28: A (0)
            { id: 'q28', text: 'السجود على الأنف دون الجبهة:', options: ['صحيح مع الكراهة', 'صحيح بلا كراهة', 'صحيح عند الإمام وصحيح عند الصاحبين'], correctAnswer: 0 },
            // Q29: C (2)
            { id: 'q29', text: 'من مفسدات الصلاة:', options: ['ترك شرط أو ركن', 'الكلام والسلام والتأوه', 'كلاهما'], correctAnswer: 2 },
            // Q30: User said "A C". I will merge them into option D for clarity or select both if possible? 
            // System supports one index. I will add a 4th option D and select it.
            // Option D: "أ و ج معاً"
            { id: 'q30', text: 'أي العبارات صحيحة؟', options: ['يجوز لمفترض الاقتداء بمتنفل', 'لا يجوز لمتيمم الاقتداء بمتيمم', 'يجوز لغاسل القدمين الاقتداء بماسح الخفين', 'الإجابة أ و ج'], correctAnswer: 3 },
            // Q31: C (2)
            { id: 'q31', text: 'يسقط الترتيب في القضاء:', options: ['بالنسيان', 'إن كانت الفوائت أكثر من ست صلوات', 'كلاهما'], correctAnswer: 2 },
            // Q32: C (2)
            { id: 'q32', text: 'سجود السهو قبل السلام وحكمه:', options: ['واجب على الإمام إن سها المأموم', 'واجب على المأموم إذا سها الإمام', 'سنة مؤكدة'], correctAnswer: 2 },
            // Q33: C (2)
            { id: 'q33', text: 'يشترط في سجود التلاوة:', options: ['الطهارة والقبلة فقط', 'القبلة وستر العورة', 'الطهارة والقبلة وستر العورة'], correctAnswer: 2 },
            // Q34: A (0)
            { id: 'q34', text: 'تسقط عن المرأة الصلوات:', options: ['الجمعة والعيدين وأي صلاة في الحيض', 'العيدين والسفر', 'الجمعة فقط'], correctAnswer: 0 },
            // Q35: B (1)
            { id: 'q35', text: 'زكاة مال الطفل (100 ألف):', options: ['2500', 'يزكي عنه وليه', 'لا زكاة حتى يبلغ'], correctAnswer: 1 },
            // Q36: A (0)
            { id: 'q36', text: 'زكاة 120 شاة:', options: ['شاة', 'شاتان', 'ثلاث'], correctAnswer: 0 },
            // Q37: Yes (0) - "الإجابة الصحيحة: نعم" -> 0
            { id: 'q37', text: 'هل على ذهب الزينة زكاة؟', options: ['نعم', 'لا'], correctAnswer: 0 },
            // Q38: C (2)
            { id: 'q38', text: 'لا يجوز إعطاء الزكاة لـ:', options: ['البنت وابنة البنت', 'الابن وابن الابن', 'كلاهما'], correctAnswer: 2 },
            // Q39: B (1)
            { id: 'q39', text: 'بلع لقمة بعد أذان الفجر الثاني:', options: ['الصوم صحيح', 'باطل ويمسك ويقضي', 'باطل ويقضي ولا يمسك'], correctAnswer: 1 },
            // Q40: A (0)
            { id: 'q40', text: 'الكحل والادهان والزيت وقطرة الأذن:', options: ['لا تفسد الصوم', 'تفسده وعليه القضاء', 'تفسده وعليه القضاء والكفارة'], correctAnswer: 0 },
            // Q41: B (1)
            { id: 'q41', text: 'الحامل والمرضع إذا فاتهما رمضان:', options: ['تقضي فقط', 'تقضي وتفدي', 'تفدي فقط'], correctAnswer: 1 },
            // Q42: B (1)
            { id: 'q42', text: 'نية قضاء رمضان تمتد إلى:', options: ['الليل قبل الفجر', 'إلى ما قبل الظهر', 'إلى طلوع الشمس'], correctAnswer: 1 },
            // Q43: A (0)
            { id: 'q43', text: 'حكم الوقوف بعرفة:', options: ['ركن', 'شرط', 'واجب'], correctAnswer: 0 },
            // Q44: A (0)
            { id: 'q44', text: 'من ترك حلق الرأس:', options: ['عليه شاة', 'صدقة', 'لا شيء'], correctAnswer: 0 },
            // Q45: C (2)
            { id: 'q45', text: 'حكم الأضحية للمقتدر:', options: ['سنة', 'مستحبة', 'واجبة'], correctAnswer: 2 },
            // Q46: B (1)
            { id: 'q46', text: 'شرط صحة المسابقة بين الفرسان:', options: ['الجائزة من الطرفين', 'من طرف واحد', 'الجائزة حلال ليست حراماً'], correctAnswer: 1 },
            // Q47: C (2)
            { id: 'q47', text: 'حكم اللعب بالنرد:', options: ['جائز', 'مستحب', 'مكروه تحريماً'], correctAnswer: 2 },
            // Q48: C (2)
            { id: 'q48', text: 'من أصول التصوف:', options: ['لا ينفع ولا يضر إلا الله', 'أنك عبد تعمل ما يريد الله', 'كلاهما'], correctAnswer: 2 },
            // Q49: C (2)
            { id: 'q49', text: 'عورة الرجل للرجل:', options: ['السرة للركبة والركبة عورة', 'كل الجسد', 'السرة للركبة والركبة ليست عورة'], correctAnswer: 2 },
            // Q50: C (2)
            { id: 'q50', text: 'حكم صلاة الجنازة:', options: ['فرض عين على الأقارب', 'فرض عين على الأقارب وفرض كفاية على غيرهم', 'فرض كفاية'], correctAnswer: 2 }
        ]
    };

    console.log('3. Inserting/Updating Fiqh Al-Ithaf Quiz...');

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
        15   // afterEpisodeIndex (Last episode index: 15)
    );

    console.log(`   Quiz "${quizData.title}" inserted successfully.`);
    console.log(`   - Connected to Course: ${quizData.courseId}`);
    console.log(`   - After Episode: 15`);
    console.log(`   - Questions: ${quizData.questions.length}`);
    console.log(`   - Passing Score: 80%`);

    console.log('--- Operation Complete ---');

} catch (error) {
    console.error('❌ Error:', error);
}
