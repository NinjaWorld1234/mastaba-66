/**
 * Quiz Service
 */
import type { Quiz, QuizResult } from '../../types';
import { getAuthToken } from './auth';

export const quizzesApi = {
    getQuizzes: async (): Promise<Quiz[]> => {
        const response = await fetch('/api/quizzes');
        return response.ok ? await response.json() : [];
    },

    addQuiz: async (quiz: Partial<Quiz>): Promise<void> => {
        const token = getAuthToken();
        await fetch('/api/quizzes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quiz)
        });
    },

    updateQuiz: async (id: string, quiz: Partial<Quiz>): Promise<void> => {
        const token = getAuthToken();
        await fetch(`/api/quizzes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quiz)
        });
    },

    deleteQuiz: async (id: string): Promise<void> => {
        const token = getAuthToken();
        await fetch(`/api/quizzes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    },

    quizResults: {
        save: async (quizId: string, score: number, total: number): Promise<void> => {
            const token = getAuthToken();
            await fetch('/api/quiz-results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quizId, score, total, percentage: Math.round((score / total) * 100) })
            });
        },
        get: async (): Promise<QuizResult[]> => {
            const token = getAuthToken();
            const response = await fetch('/api/quiz-results', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok ? await response.json() : [];
        }
    }
};
