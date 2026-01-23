/**
 * API Service for Al-Mastaba Platform
 * 
 * Handles all data interactions using Supabase.
 * Replaces the old local storage and REST API implementations.
 * 
 * @module services/api
 */

import { supabase } from '../lib/supabase';
import type {
    User,
    Course,
    Quiz,
    Question,
    Certificate,
    Announcement,
    SystemActivityLog,
    LibraryResource,
    Post,
    QuizResult
} from '../types';
import { sanitizeHTML, sanitizeObject } from '../utils/sanitize';

// ============================================================================
// Error Types
// ============================================================================

/** Standard API error structure */
interface ApiError {
    message: string;
    messageAr?: string;
    code?: string;
}

/** Auth error with additional verification info */
interface AuthError extends ApiError {
    needsVerification?: boolean;
    email?: string;
}

/** User data input for createUser */
interface CreateUserInput {
    email: string;
    password?: string;
    name: string;
    nameEn?: string;
    whatsapp?: string;
    country?: string;
    age?: number;
    gender?: string;
    educationLevel?: string;
    role?: string;
    status?: string;
    joinDate?: string;
    points?: number;
    level?: number;
    streak?: number;
    avatar?: string;
}

/** Search result item */
interface SearchResult {
    id: string;
    type: string;
    title: string;
    desc: string;
    instructor?: string;
    thumbnail?: string;
}

/** R2 File/Folder item */
interface R2Item {
    key?: string;
    name?: string;
    size?: number;
    lastModified?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_PREFIX = 'mastaba_';
const MAX_LOG_ENTRIES = 1000;

/**
 * Storage Helper Functions
 */

const getStoredData = <T>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(STORAGE_PREFIX + key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const setStoredData = <T>(key: string, data: T): void => {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
};

/**
 * Retrieves the current auth token
 */
export const getAuthToken = (): string | undefined => {
    try {
        const user = api.getCurrentUser();
        return user?.access_token || localStorage.getItem('authToken') || undefined;
    } catch {
        return undefined;
    }
};

// ============================================================================
// API Object
// ============================================================================

export const api = {
    // ========================================================================
    // Authentication & Users
    // ========================================================================

    login: async (email: string, password: string): Promise<User | null> => {
        try {
            // Use REST API for login (works with AWS SQLite backend)
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Login error:', errorData);

                // Check if email verification is required
                if (errorData.needsVerification) {
                    const authError: AuthError = {
                        message: errorData.error || 'Email not verified',
                        messageAr: errorData.errorAr,
                        needsVerification: true,
                        email: email
                    };
                    throw authError;
                }

                return null;
            }

            const data = await response.json();

            if (data.accessToken && data.user) {
                const user: User = {
                    ...data.user,
                    access_token: data.accessToken,
                    nameEn: data.user.nameEn || data.user.name,
                    joinDate: data.user.joinDate,
                    emailVerified: !!data.user.emailVerified,
                };
                localStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(user));
                localStorage.setItem('authToken', data.accessToken);
                return user;
            }
            return null;
        } catch (error: unknown) {
            const authError = error as { needsVerification?: boolean };
            if (authError.needsVerification) {
                throw error;
            }
            return null;
        }
    },

    register: async (userData: {
        email: string;
        password: string;
        name: string;
        nameEn?: string;
        whatsapp?: string;
        country?: string;
        age?: number;
        gender?: string;
        educationLevel?: string;
    }): Promise<{ user: User | null; error: { message: string; messageAr?: string } | null }> => {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                return { user: null, error: { message: data.error || data.errorAr || 'Registration failed', messageAr: data.errorAr } };
            }

            if (data.user) {
                const user: User = {
                    ...data.user,
                    access_token: data.accessToken,
                    nameEn: data.user.nameEn || data.user.name,
                    joinDate: data.user.joinDate,
                    emailVerified: !!data.user.emailVerified
                };

                // Store token for verification flow
                if (data.accessToken) {
                    localStorage.setItem('authToken', data.accessToken);
                }

                return { user, error: null };
            }

            return { user: null, error: { message: 'Registration failed' } };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Registration failed';
            return { user: null, error: { message } };
        }
    },

    verifyOtp: async (email: string, token: string): Promise<{ success: boolean; user: User | null; error: ApiError | null }> => {
        try {
            const response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: token })
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, user: null, error: data.errorAr || data.error || 'Verification failed' };
            }

            if (data.success && data.user) {
                const user: User = {
                    ...data.user,
                    access_token: data.accessToken,
                    nameEn: data.user.nameEn || data.user.name,
                    joinDate: data.user.joinDate,
                    emailVerified: true
                };
                localStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(user));
                localStorage.setItem('authToken', data.accessToken || '');
                return { success: true, user, error: null };
            }

            return { success: true, user: null, error: null };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Verification failed';
            return { success: false, user: null, error: { message } };
        }
    },

    resendOtp: async (email: string): Promise<{ error: ApiError | null }> => {
        try {
            const response = await fetch('/api/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.errorAr || data.error || 'Failed to resend OTP' };
            }

            return { error: null };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to resend OTP';
            return { error: { message } };
        }
    },

    getUsers: async (): Promise<User[]> => {
        try {
            const token = getAuthToken();
            const response = await fetch('/api/users', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (!response.ok) return [];

            const data = await response.json();
            return data.map((u: Record<string, unknown>) => ({
                ...u,
                nameEn: u.nameEn || u.name_en,
                joinDate: u.joinDate || u.join_date,
                emailVerified: u.emailVerified || u.email_verified
            })) as User[];
        } catch {
            return [];
        }
    },

    updateUser: async (id: string, updates: Partial<User>): Promise<User | null> => {
        const token = getAuthToken();
        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) return null;

        // Return updated user (we might need to fetch it again or just merge)
        const currentUser = api.getCurrentUser();
        if (currentUser && currentUser.id === id) {
            const updatedUser = { ...currentUser, ...updates };
            localStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(updatedUser));
            return updatedUser;
        }
        return null;
    },

    getUserDetails: async (id: string): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(`/api/users/${id}/details`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user details');
        return await response.json();
    },

    createUser: async (userData: CreateUserInput): Promise<{ user: User | null; error: ApiError | null }> => {
        const token = getAuthToken();
        const response = await fetch('/api/register', { // Using register for creation
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        if (!response.ok) return { user: null, error: { message: data.error || 'Failed to create user' } };

        return { user: data.user, error: null };
    },

    deleteUser: async (id: string): Promise<boolean> => {
        const token = getAuthToken();
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok;
    },

    getCurrentUser: (): User | null => {
        try {
            const stored = localStorage.getItem(STORAGE_PREFIX + 'currentUser');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    },

    logout: (): void => {
        localStorage.removeItem(STORAGE_PREFIX + 'currentUser');
        localStorage.removeItem('authToken');
    },

    // ========================================================================
    // Courses
    // ========================================================================

    getCourses: async (): Promise<Course[]> => {
        try {
            const response = await fetch('/api/courses');
            if (!response.ok) return [];

            const data = await response.json();
            return data.map((c: Record<string, unknown>) => ({
                ...c,
                titleEn: c.titleEn || c.title_en,
                instructorEn: c.instructorEn || c.instructor_en,
                categoryEn: c.categoryEn || c.category_en,
                durationEn: c.durationEn || c.duration_en,
                descriptionEn: c.descriptionEn || c.description_en,
                lessonsCount: c.lessonsCount || c.lessons_count,
                studentsCount: c.studentsCount || c.students_count,
                videoUrl: c.videoUrl || c.video_url
            })) as Course[];
        } catch {
            return [];
        }
    },

    addCourse: async (course: Course): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(course)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add course');
        }
    },

    updateCourse: async (courseId: string, updates: Partial<Course>): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`/api/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update course');
        }
    },

    deleteCourse: async (courseId: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`/api/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete course');
        }
    },

    updateCourseProgress: async (courseId: string, progress: number): Promise<void> => {
        const user = api.getCurrentUser();
        if (!user) return;
        await supabase.from('enrollments').upsert({
            user_id: user.id,
            course_id: courseId,
            progress: progress,
            last_access: new Date().toISOString()
        }, { onConflict: 'user_id,course_id' });
    },

    updateEpisodeProgress: async (courseId: string, episodeId: string, completed: boolean): Promise<void> => {
        const user = api.getCurrentUser();
        if (!user) return;
        await supabase.from('episode_progress').upsert({
            user_id: user.id,
            course_id: courseId,
            episode_id: episodeId,
            completed,
            completed_at: completed ? new Date().toISOString() : null
        }, { onConflict: 'user_id,episode_id' });
    },

    // ========================================================================
    // Library
    // ========================================================================

    getLibraryResources: async (): Promise<LibraryResource[]> => {
        const { data, error } = await supabase.from('library_resources').select('*').order('created_at', { ascending: false });
        return error ? [] : data;
    },

    // ========================================================================
    // Community
    // ========================================================================

    getCommunityPosts: async (): Promise<Post[]> => {
        const { data, error } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false });
        return error ? [] : data;
    },


    // ========================================================================
    // Quizzes
    // ========================================================================

    getQuizzes: async (): Promise<Quiz[]> => {
        try {
            const response = await fetch('/api/quizzes');
            if (!response.ok) return [];
            return await response.json();
        } catch {
            return [];
        }
    },

    addQuiz: async (quiz: Quiz): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch('/api/quizzes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quiz)
        });
        if (!response.ok) throw new Error('Failed to add quiz');
    },

    updateQuiz: async (id: string, updates: Partial<Quiz>): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`/api/quizzes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update quiz');
    },

    deleteQuiz: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`/api/quizzes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete quiz');
    },

    quizResults: {
        save: async (quizId: string, score: number, total: number): Promise<void> => {
            const token = getAuthToken();
            const response = await fetch('/api/quiz-results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quizId, score, total, percentage: Math.round((score / total) * 100) })
            });
            if (!response.ok) throw new Error('Failed to save quiz results');
        },

        get: async (): Promise<QuizResult[]> => {
            const token = getAuthToken();
            const response = await fetch('/api/quiz-results', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return [];
            return await response.json();
        }
    },

    // ========================================================================
    // Activity Logs & Certificates
    // ========================================================================

    getLogs: async (): Promise<SystemActivityLog[]> => {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(MAX_LOG_ENTRIES);

        if (error) {
            console.error('Get logs error:', error);
            return [];
        }

        return data.map(l => ({
            id: l.id,
            userId: l.user_id || '',
            userName: l.user_name || 'System',
            action: l.action,
            details: l.details || '',
            timestamp: l.timestamp,
            date: l.date
        }));
    },

    logAction: async (userId: string, userName: string, action: string, details: string): Promise<void> => {
        const { error } = await supabase.from('activity_logs').insert([{
            user_id: userId,
            user_name: userName,
            action: action,
            details: details,
            date: new Date().toISOString().split('T')[0]
        }]);

        if (error) {
            console.error('Log action error:', error);
        }
    },

    // ========================================================================
    // Certificates
    // ========================================================================

    getCertificates: async (): Promise<Certificate[]> => {
        try {
            const token = getAuthToken();
            const response = await fetch('/api/certificates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return [];
            return await response.json();
        } catch {
            return [];
        }
    },

    generateCertificate: async (courseId: string): Promise<Certificate> => {
        const token = getAuthToken();
        const response = await fetch('/api/certificates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate certificate');
        }
        return await response.json();
    },

    generateMasterCertificate: async (): Promise<Certificate> => {
        const token = getAuthToken();
        const response = await fetch('/api/certificates/master', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate master certificate');
        }
        return await response.json();
    },

    // Legacy Supabase Issue (Keep for compatibility if needed, but unused)
    issueCertificate: async (certData: Omit<Certificate, 'id' | 'issueDate' | 'code'> & { userId?: string }): Promise<void> => {
        // No-op or throw in new system
        console.warn('Legacy issueCertificate called');
    },

    // ========================================================================
    // Messaging
    // ========================================================================

    getMessages: async (): Promise<any[]> => {
        const token = getAuthToken();
        const response = await fetch('/api/messages', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        return await response.json();
    },

    sendMessage: async (receiverId: string, content: string): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ receiverId, content })
        });
        if (!response.ok) throw new Error('Failed to send message');
        return await response.json();
    },

    markMessageRead: async (id: string): Promise<void> => {
        const token = getAuthToken();
        await fetch(`/api/messages/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    markConversationAsRead: async (userId: string): Promise<void> => {
        const token = getAuthToken();
        await fetch(`/api/messages/conversation/${userId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    // Admin helper
    getStudents: async (): Promise<User[]> => {
        const token = getAuthToken();
        const response = await fetch('/api/users/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        return await response.json();
    },

    // Backup
    downloadBackup: async (): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch('/api/backup/download', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.sqlite`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    uploadCloudBackup: async (): Promise<{ success: boolean; key: string, size: number }> => {
        const token = getAuthToken();
        const response = await fetch('/api/backup/cloud', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Cloud upload failed');
        return await response.json();
    },

    restoreBackup: async (file: File): Promise<void> => {
        const token = getAuthToken();
        // Send as raw binary
        const response = await fetch('/api/backup/restore', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/octet-stream'
            },
            body: file
        });
        if (!response.ok) throw new Error('Restore failed');
    },

    // ========================================================================
    // Announcements
    // ========================================================================

    getAnnouncements: async (): Promise<Announcement[]> => {
        const token = getAuthToken();
        const response = await fetch('/api/announcements', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        return await response.json();
    },

    addAnnouncement: async (data: Partial<Announcement>): Promise<Announcement> => {
        const token = getAuthToken();
        const response = await fetch('/api/announcements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add announcement');
        }
        return await response.json();
    },

    updateAnnouncement: async (id: string, data: Partial<Announcement>): Promise<Announcement> => {
        const token = getAuthToken();
        const response = await fetch(`/api/announcements/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update announcement');
        }
        return await response.json();
    },

    deleteAnnouncement: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`/api/announcements/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete announcement');
        }
    },



    // ========================================================================
    // Favorites & Search
    // ========================================================================

    getFavorites: async (): Promise<string[]> => {
        const user = api.getCurrentUser();
        if (!user) return [];
        const { data, error } = await supabase.from('enrollments').select('course_id').eq('user_id', user.id).eq('is_favorite', true);
        return error ? [] : data.map(f => f.course_id);
    },

    toggleFavorite: async (courseId: string): Promise<boolean> => {
        const user = api.getCurrentUser();
        if (!user) return false;
        const { data } = await supabase.from('enrollments').select('is_favorite').eq('user_id', user.id).eq('course_id', courseId).single();
        const newState = !data?.is_favorite;
        await supabase.from('enrollments').upsert({ user_id: user.id, course_id: courseId, is_favorite: newState }, { onConflict: 'user_id,course_id' });
        return newState;
    },

    isFavorite: async (courseId: string): Promise<boolean> => {
        const user = api.getCurrentUser();
        if (!user) return false;
        const { data } = await supabase.from('enrollments').select('is_favorite').eq('user_id', user.id).eq('course_id', courseId).single();
        return !!data?.is_favorite;
    },

    search: async (query: string, category: string = 'all'): Promise<SearchResult[]> => {
        const sanitizedQuery = query ? query.toLowerCase() : '';
        const results: SearchResult[] = [];
        if (category === 'all' || category === 'course') {
            const courses = await api.getCourses();
            results.push(...courses.filter(c => !sanitizedQuery || c.title.toLowerCase().includes(sanitizedQuery)).map(c => ({ id: c.id, type: 'course', title: c.title, desc: c.description || '', instructor: c.instructor, thumbnail: c.thumbnail })));
        }
        return results;
    },

    // ========================================================================
    // Cloudflare R2 Storage
    // ========================================================================
    r2: {
        listFiles: async (prefix: string = ''): Promise<{ files: R2Item[]; folders: R2Item[]; prefix: string }> => {
            const token = getAuthToken();
            const url = `/api/r2/files?prefix=${encodeURIComponent(prefix)}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to fetch R2 files');
            }

            return await response.json();
        }
    }
};

export default api;
