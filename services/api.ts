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
                    const error: any = new Error(errorData.errorAr || 'Email not verified');
                    error.needsVerification = true;
                    error.email = email;
                    throw error;
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
        } catch (error: any) {
            if (error.needsVerification) {
                throw error;
            }
            console.error('Login error:', error);
            return null;
        }
    },

    register: async (userData: any): Promise<{ user: User | null; error: any }> => {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                return { user: null, error: data.error || data.errorAr || 'Registration failed' };
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

            return { user: null, error: 'Registration failed' };
        } catch (error: any) {
            return { user: null, error: error.message || 'Registration failed' };
        }
    },

    verifyOtp: async (email: string, token: string): Promise<{ success: boolean; user: User | null; error: any }> => {
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
        } catch (error: any) {
            return { success: false, user: null, error: error.message || 'Verification failed' };
        }
    },

    resendOtp: async (email: string): Promise<{ error: any }> => {
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
        } catch (error: any) {
            return { error: error.message || 'Failed to resend OTP' };
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
            return data.map((u: any) => ({
                ...u,
                nameEn: u.nameEn || u.name_en,
                joinDate: u.joinDate || u.join_date,
                emailVerified: u.emailVerified || u.email_verified
            }));
        } catch {
            return [];
        }
    },

    updateUser: async (id: string, updates: Partial<User>): Promise<User | null> => {
        // Map camelCase to snake_case for profile updates
        const profileUpdates: any = { ...updates };
        if (updates.nameEn) {
            profileUpdates.name_en = updates.nameEn;
            delete profileUpdates.nameEn;
        }
        if (updates.joinDate) {
            profileUpdates.join_date = updates.joinDate;
            delete profileUpdates.joinDate;
        }
        if (updates.emailVerified !== undefined) {
            profileUpdates.email_verified = updates.emailVerified;
            delete profileUpdates.emailVerified;
        }
        if (updates.educationLevel) {
            profileUpdates.education_level = updates.educationLevel;
            delete profileUpdates.educationLevel;
        }

        // Remove type only properties that aren't in DB
        delete profileUpdates.access_token;
        delete profileUpdates.password;

        const { data, error } = await supabase
            .from('users')
            .update(profileUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update user error:', error);
            return null;
        }

        return {
            ...data,
            nameEn: data.name_en,
            joinDate: data.join_date,
            emailVerified: data.email_verified
        };
    },

    createUser: async (userData: any): Promise<{ user: User | null; error: any }> => {
        const password = userData.password || 'TempPass123!';
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: password,
            options: {
                data: {
                    name: userData.name,
                    name_en: userData.nameEn || userData.name,
                }
            }
        });

        if (error) return { user: null, error };

        if (data.user) {
            const profileData = {
                id: data.user.id,
                email: userData.email,
                name: userData.name,
                name_en: userData.nameEn || userData.name,
                whatsapp: userData.whatsapp || '',
                country: userData.country || '',
                age: userData.age || 20,
                gender: userData.gender || 'male',
                education_level: userData.educationLevel || '',
                role: userData.role || 'student',
                status: userData.status || 'active',
                join_date: userData.joinDate || new Date().toISOString().split('T')[0],
                points: userData.points || 0,
                level: userData.level || 1,
                streak: userData.streak || 0,
                email_verified: false,
                avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=064e3b&color=fff&size=100`
            };

            const { data: profile, error: pError } = await supabase
                .from('users')
                .upsert(profileData)
                .select()
                .single();

            if (pError) return { user: null, error: pError };

            const user: User = {
                ...profile,
                nameEn: profile.name_en,
                joinDate: profile.join_date,
                emailVerified: profile.email_verified
            };

            return { user, error: null };
        }

        return { user: null, error: 'User creation failed' };
    },

    deleteUser: async (id: string): Promise<boolean> => {
        try {
            // Import supabaseAdmin dynamically to avoid issues if needed, 
            // but it's already at the top of the file in my plan? 
            // Wait, I didn't add it to imports in api.ts yet.
            const { supabaseAdmin } = await import('../lib/supabase');

            // 1. Delete from auth (requires service role)
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) {
                console.warn('Auth deletion error (might already be deleted):', authError);
            }

            // 2. Delete from public.users (in case RLS or triggers didn't catch it)
            const { error } = await supabase.from('users').delete().eq('id', id);

            if (error) {
                console.error('Delete user error:', error);
                return false;
            }
            return true;
        } catch (err) {
            console.error('deleteUser failed:', err);
            return false;
        }
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
            return data.map((c: any) => ({
                ...c,
                titleEn: c.titleEn || c.title_en,
                instructorEn: c.instructorEn || c.instructor_en,
                categoryEn: c.categoryEn || c.category_en,
                durationEn: c.durationEn || c.duration_en,
                descriptionEn: c.descriptionEn || c.description_en,
                lessonsCount: c.lessonsCount || c.lessons_count,
                studentsCount: c.studentsCount || c.students_count,
                videoUrl: c.videoUrl || c.video_url
            }));
        } catch {
            return [];
        }
    },

    addCourse: async (course: Course): Promise<void> => {
        const { error } = await supabase.from('courses').insert([{
            title: course.title,
            title_en: course.titleEn,
            instructor: course.instructor,
            instructor_en: course.instructorEn,
            category: course.category,
            category_en: course.categoryEn,
            duration: course.duration,
            duration_en: course.durationEn,
            thumbnail: course.thumbnail,
            description: course.description,
            description_en: course.descriptionEn,
            lessons_count: course.lessonsCount,
            students_count: course.studentsCount,
            video_url: course.videoUrl,
            status: course.status || 'published'
        }]);
        if (error) throw error;
    },

    updateCourse: async (courseId: string, updates: Partial<Course>): Promise<void> => {
        const mappedUpdates: any = {};
        if (updates.title) mappedUpdates.title = updates.title;
        if (updates.titleEn) mappedUpdates.title_en = updates.titleEn;
        if (updates.instructor) mappedUpdates.instructor = updates.instructor;
        if (updates.instructorEn) mappedUpdates.instructor_en = updates.instructorEn;
        if (updates.category) mappedUpdates.category = updates.category;
        if (updates.categoryEn) mappedUpdates.category_en = updates.categoryEn;
        if (updates.duration) mappedUpdates.duration = updates.duration;
        if (updates.durationEn) mappedUpdates.duration_en = updates.durationEn;
        if (updates.thumbnail) mappedUpdates.thumbnail = updates.thumbnail;
        if (updates.description) mappedUpdates.description = updates.description;
        if (updates.descriptionEn) mappedUpdates.description_en = updates.descriptionEn;
        if (updates.lessonsCount !== undefined) mappedUpdates.lessons_count = updates.lessonsCount;
        if (updates.studentsCount !== undefined) mappedUpdates.students_count = updates.studentsCount;
        if (updates.videoUrl) mappedUpdates.video_url = updates.videoUrl;
        if (updates.status) mappedUpdates.status = updates.status;

        const { error } = await supabase.from('courses').update(mappedUpdates).eq('id', courseId);
        if (error) throw error;
    },

    deleteCourse: async (courseId: string): Promise<void> => {
        const { error } = await supabase.from('courses').delete().eq('id', courseId);
        if (error) throw error;
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
    // Announcements
    // ========================================================================

    getAnnouncements: async (): Promise<Announcement[]> => {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return [];
        return data.map(a => ({
            ...a,
            isActive: a.is_active,
            createdAt: a.created_at
        }));
    },

    addAnnouncement: async (announcement: Announcement): Promise<void> => {
        const { error } = await supabase.from('announcements').insert([{
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            priority: announcement.priority,
            is_active: announcement.isActive !== undefined ? announcement.isActive : true
        }]);
        if (error) throw error;
    },

    deleteAnnouncement: async (id: string): Promise<void> => {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
    },

    updateAnnouncement: async (id: string, updates: Partial<Announcement>): Promise<void> => {
        const mappedUpdates: any = { ...updates };
        if (updates.isActive !== undefined) {
            mappedUpdates.is_active = updates.isActive;
            delete mappedUpdates.isActive;
        }

        const { error } = await supabase.from('announcements').update(mappedUpdates).eq('id', id);
        if (error) throw error;
    },

    // ========================================================================
    // Quizzes
    // ========================================================================

    getQuizzes: async (): Promise<Quiz[]> => {
        const { data, error } = await supabase.from('quizzes').select('*, quiz_questions(*)');
        if (error) return [];
        return data.map(q => ({
            ...q,
            titleEn: q.title_en,
            afterEpisodeIndex: q.after_episode_index,
            passingScore: q.passing_score,
            questions: q.quiz_questions.map((qn: any) => ({
                ...qn,
                textEn: qn.text_en,
                optionsEn: qn.options_en,
                correctAnswer: qn.correct_answer
            }))
        }));
    },

    addQuiz: async (quiz: Quiz): Promise<void> => {
        const { data, error } = await supabase
            .from('quizzes')
            .insert([{
                title: quiz.title,
                title_en: quiz.titleEn,
                after_episode_index: quiz.afterEpisodeIndex,
                passing_score: quiz.passingScore,
                course_id: quiz.courseId
            }])
            .select()
            .single();

        if (error) throw error;

        if (quiz.questions && quiz.questions.length > 0) {
            const questions = quiz.questions.map(q => ({
                quiz_id: data.id,
                text: q.text,
                text_en: q.textEn,
                options: q.options,
                options_en: q.optionsEn,
                correct_answer: q.correctAnswer
            }));
            await supabase.from('quiz_questions').insert(questions);
        }
    },

    updateQuiz: async (id: string, updates: Partial<Quiz>): Promise<void> => {
        const mappedUpdates: any = {};
        if (updates.title) mappedUpdates.title = updates.title;
        if (updates.titleEn) mappedUpdates.title_en = updates.titleEn;
        if (updates.afterEpisodeIndex !== undefined) mappedUpdates.after_episode_index = updates.afterEpisodeIndex;
        if (updates.passingScore !== undefined) mappedUpdates.passing_score = updates.passingScore;

        await supabase.from('quizzes').update(mappedUpdates).eq('id', id);
    },

    deleteQuiz: async (id: string): Promise<void> => {
        await supabase.from('quizzes').delete().eq('id', id);
    },

    quizResults: {
        save: async (quizId: string, score: number, total: number): Promise<void> => {
            const user = api.getCurrentUser();
            if (!user) return;
            await supabase.from('quiz_results').insert([{
                user_id: user.id,
                quiz_id: quizId,
                score,
                total,
                percentage: Math.round((score / total) * 100)
            }]);
        },

        get: async (): Promise<QuizResult[]> => {
            const user = api.getCurrentUser();
            if (!user) return [];
            const { data, error } = await supabase.from('quiz_results').select('*').eq('user_id', user.id).order('completed_at', { ascending: false });
            if (error) return [];
            return data.map(r => ({
                quizId: r.quiz_id,
                score: r.score,
                total: r.total,
                percentage: r.percentage,
                completedAt: r.completed_at
            }));
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

    getCertificates: async (): Promise<Certificate[]> => {
        const user = api.getCurrentUser();
        if (!user) return [];
        const { data, error } = await supabase.from('certificates').select('*').eq('user_id', user.id).order('issue_date', { ascending: false });
        if (error) return [];
        return data.map(c => ({
            ...c,
            studentId: c.user_id,
            issueDate: c.issue_date,
            userName: c.student_name,
            studentName: c.student_name,
            courseTitle: c.course_title
        }));
    },

    issueCertificate: async (certData: Omit<Certificate, 'id' | 'issueDate' | 'code'> & { userId?: string }): Promise<void> => {
        await supabase.from('certificates').insert([{
            user_id: certData.studentId || certData.userId,
            student_name: certData.studentName || certData.userName,
            course_id: certData.courseId,
            course_title: certData.courseTitle,
            grade: certData.grade,
            code: 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        }]);
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

    search: async (query: string, category: string = 'all'): Promise<any[]> => {
        const sanitizedQuery = query ? query.toLowerCase() : '';
        const results: any[] = [];
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
        listFiles: async (prefix: string = ''): Promise<{ files: any[]; folders: any[]; prefix: string }> => {
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
