import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Edit, Trash2, Eye, Users, Clock, CheckCircle, BarChart, X, Save, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Quiz, Question } from '../types';

const AdminQuizManagement: React.FC = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [quizForm, setQuizForm] = useState<Partial<Quiz>>({
        title: '',
        courseId: '1', // Default first course
        questions: [],
        passingScore: 70
    });

    // Question Editing State
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0
    });

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = () => {
        setQuizzes(api.getQuizzes());
    };

    const handleDelete = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
            api.deleteQuiz(id);
            loadQuizzes();
        }
    };

    const handleEdit = (quiz: Quiz) => {
        setEditingId(quiz.id);
        setQuizForm({
            title: quiz.title,
            courseId: quiz.courseId,
            questions: quiz.questions,
            passingScore: quiz.passingScore
        });
        setIsModalOpen(true);
    };

    const handleAddQuestion = () => {
        if (!currentQuestion.text || currentQuestion.options?.some(o => !o)) return;

        const newQuestion: Question = {
            id: Date.now(),
            text: currentQuestion.text || '',
            textEn: currentQuestion.text || '',
            options: currentQuestion.options as string[],
            optionsEn: currentQuestion.options as string[],
            correctAnswer: currentQuestion.correctAnswer || 0
        };

        setQuizForm({
            ...quizForm,
            questions: [...(quizForm.questions || []), newQuestion]
        });

        setCurrentQuestion({
            text: '',
            options: ['', '', '', ''],
            correctAnswer: 0
        });
    };

    const handleRemoveQuestion = (idx: number) => {
        const updatedQuestions = [...(quizForm.questions || [])];
        updatedQuestions.splice(idx, 1);
        setQuizForm({ ...quizForm, questions: updatedQuestions });
    };

    const handleSaveQuiz = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            api.updateQuiz(editingId, quizForm);
        } else {
            api.addQuiz({
                id: Date.now().toString(),
                title: quizForm.title || 'اختبار جديد',
                titleEn: quizForm.title || 'New Quiz',
                courseId: quizForm.courseId || '1',
                questions: quizForm.questions || [],
                passingScore: quizForm.passingScore || 70
            });
        }

        setIsModalOpen(false);
        setEditingId(null);
        setQuizForm({ title: '', courseId: '1', questions: [], passingScore: 70 });
        loadQuizzes();
    };

    const stats = [
        { label: 'إجمالي الاختبارات', value: quizzes.length.toString(), icon: ClipboardList, color: 'from-emerald-500 to-teal-600' },
        { label: 'إجمالي الأسئلة', value: quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0).toString(), icon: AlertCircle, color: 'from-blue-500 to-cyan-600' },
        { label: 'معدل النجاح', value: '78%', icon: CheckCircle, color: 'from-violet-500 to-purple-600' },
        { label: 'متوسط الوقت', value: '25 د', icon: Clock, color: 'from-amber-500 to-orange-600' },
    ];

    return (
        <div className="animate-fade-in space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">إدارة الاختبارات</h2>
                    <p className="text-gray-300">إنشاء وإدارة الاختبارات والتقييمات</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setQuizForm({ title: '', courseId: '1', questions: [], passingScore: 70 });
                        setIsModalOpen(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /><span>اختبار جديد</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="text-right py-4 px-6 text-gray-300 font-medium">الاختبار</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium">الأسئلة</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium">درجة النجاح</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quizzes.map((quiz) => (
                            <tr key={quiz.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6">
                                    <div>
                                        <p className="text-white font-medium">{quiz.title}</p>
                                        <p className="text-gray-400 text-sm">Course ID: {quiz.courseId}</p>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-white">{quiz.questions?.length || 0}</td>
                                <td className="py-4 px-6 text-white">{quiz.passingScore}%</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEdit(quiz)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(quiz.id)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {quizzes.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-400">لا توجد اختبارات حالياً</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0a1815] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute left-4 top-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-white mb-6">{editingId ? 'تعديل اختبار' : 'إضافة اختبار جديد'}</h3>
                            <form onSubmit={handleSaveQuiz} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">عنوان الاختبار</label>
                                        <input
                                            required
                                            value={quizForm.title}
                                            onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">الرقم التعريفي للدورة</label>
                                        <input
                                            required
                                            value={quizForm.courseId}
                                            onChange={e => setQuizForm({ ...quizForm, courseId: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-4">
                                    <h4 className="text-lg font-bold text-white mb-4">الأسئلة ({quizForm.questions?.length})</h4>

                                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                                        {quizForm.questions?.map((q, idx) => (
                                            <div key={idx} className="bg-white/5 p-4 rounded-xl flex justify-between items-center group">
                                                <div>
                                                    <p className="text-white font-medium">{q.text}</p>
                                                    <p className="text-gray-400 text-sm">الإجابة الصحيحة: {q.options[q.correctAnswer]}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveQuestion(idx)}
                                                    className="p-2 text-red-400 hover:bg-white/10 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                                        <h5 className="text-emerald-400 font-bold mb-4 text-sm">إضافة سؤال جديد</h5>
                                        <div className="space-y-3">
                                            <input
                                                placeholder="نص السؤال"
                                                value={currentQuestion.text}
                                                onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                {currentQuestion.options?.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex gap-2">
                                                        <input
                                                            placeholder={`الخيار ${oIdx + 1}`}
                                                            value={opt}
                                                            onChange={e => {
                                                                const newOpts = [...(currentQuestion.options || [])];
                                                                newOpts[oIdx] = e.target.value;
                                                                setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                                            }}
                                                            className={`flex-1 bg-black/20 border ${currentQuestion.correctAnswer === oIdx ? 'border-emerald-500' : 'border-white/10'} rounded-lg px-3 py-2 text-white text-sm`}
                                                        />
                                                        <input
                                                            type="radio"
                                                            name="correctAnswer"
                                                            checked={currentQuestion.correctAnswer === oIdx}
                                                            onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: oIdx })}
                                                            className="mt-3"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddQuestion}
                                                className="w-full py-2 bg-emerald-600/50 hover:bg-emerald-600 rounded-lg text-white text-sm font-bold transition-colors"
                                            >
                                                + إضافة السؤال
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{editingId ? 'حفظ التعديلات' : 'إنشاء الاختبار'}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminQuizManagement;
