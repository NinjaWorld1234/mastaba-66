import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, RefreshCw, X } from 'lucide-react';
import { Quiz as QuizType, Question } from '../types';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface QuizProps {
  quiz: QuizType;
  onSuccess: () => void;
  onClose: () => void;
}

const Quiz: React.FC<QuizProps> = ({ quiz, onSuccess, onClose }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const question = quiz.questions[currentQuestionIdx];
  const totalQuestions = quiz.questions.length;
  const passingScore = quiz.passingScore || 70;

  const handleNext = () => {
    let newScore = score;
    if (selectedOption === question.correctAnswer) {
      newScore = score + 1;
      setScore(newScore);
    }

    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx(curr => curr + 1);
      setSelectedOption(null);
    } else {
      finishQuiz(newScore);
    }
  };

  const finishQuiz = async (finalScore: number) => {
    setIsSaving(true);
    try {
      await api.quizResults.save(quiz.id, finalScore, totalQuestions);
      setIsSubmitted(true);

      const percentage = (finalScore / totalQuestions) * 100;
      if (percentage >= passingScore) {
        onSuccess();
      }
    } catch (error) {
      console.error('Quiz save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCertificate = () => {
    alert("جاري تحميل الشهادة... (Simulation)");
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
        <div className="glass-panel p-10 rounded-3xl text-center max-w-lg w-full relative overflow-hidden">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{t('quiz.congratulations').replace('{{name}}', user?.name?.split(' ')[0] || 'User')}</h2>
          <p className="text-gray-300 mb-8">{t('quiz.completedSuccess')}</p>

          <div className="text-5xl font-bold text-gold-400 mb-2">{(score / totalQuestions) * 100}%</div>
          <p className="text-sm text-gray-400 mb-8">{t('quiz.finalScore')}</p>

          <div className="flex gap-4">
            <button onClick={() => { setIsSubmitted(false); setCurrentQuestionIdx(0); setScore(0); setSelectedOption(null); }} className="flex-1 py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-colors">
              {t('quiz.retry')}
            </button>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-bold transition-colors">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <span className="text-gray-400">
          {t('quiz.questionCount').replace('{{current}}', (currentQuestionIdx + 1).toString()).replace('{{total}}', totalQuestions.toString())}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-400">{t('quiz.remainingAttempts')}</span>
          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gold-500" style={{ width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 md:p-12 rounded-[2rem] border-2 border-white/5">
        <h2 className="text-2xl font-bold text-white mb-10 leading-relaxed">
          {question.text}
        </h2>

        <div className="space-y-4">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedOption(idx)}
              className={`w-full p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 border ${selectedOption === idx
                ? 'bg-emerald-500/20 border-emerald-500'
                : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedOption === idx ? 'border-emerald-500 bg-emerald-500' : 'border-gray-500'
                }`}>
                {selectedOption === idx && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={`text-lg ${selectedOption === idx ? 'text-white font-medium' : 'text-gray-300'}`}>
                {option}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-12 pt-8 border-t border-white/10">
          <button
            disabled={currentQuestionIdx === 0}
            onClick={() => {
              setCurrentQuestionIdx(p => p - 1);
              setSelectedOption(null);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {language === 'ar' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            <span>{t('quiz.previous')}</span>
          </button>

          <button
            disabled={selectedOption === null || isSaving}
            onClick={handleNext}
            className="flex items-center gap-2 px-10 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gold-500/20"
          >
            {isSaving ? (
              <span>...</span>
            ) : (
              <>
                <span>{currentQuestionIdx === totalQuestions - 1 ? t('quiz.finish') : t('quiz.next')}</span>
                {language === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
