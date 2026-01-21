/**
 * Local Storage based API Service
 * 
 * This service provides CRUD operations for all platform entities.
 * Data is persisted to localStorage for offline capability.
 * 
 * @module services/api
 */

import {
    User,
    Course,
    CourseProgress,
    Announcement,
    Quiz,
    Question,
    Certificate,
    SystemActivityLog,
    QuizResult,
    MAX_LOG_ENTRIES,
    UserRole,
    UserStatus,
    AnnouncementTarget,
    AnnouncementPriority,
    LibraryResource,
    Post
} from '../types';
import { sanitizeHTML, sanitizeEmail, sanitizeObject } from '../utils/sanitize';

// ============================================================================
// Constants
// ============================================================================

/** API Configuration */
const USE_LIVE_API = true;
const API_URL = '/api';

/** Prefix for all localStorage keys to avoid conflicts */
const STORAGE_PREFIX = 'mastaba_';

/**
 * Retrieves the current auth token
 */
export const getAuthToken = (): string | undefined => {
    try {
        const user = getStoredData<User | null>('currentUser', null);
        return user?.access_token || localStorage.getItem('authToken') || undefined;
    } catch {
        return undefined;
    }
};

/**
 * Storage Helper Functions
 */

/**
 * Retrieves data from localStorage with JSON parsing
 * 
 * @param key - Storage key (without prefix)
 * @param defaultValue - Default value if key doesn't exist
 * @returns Parsed data or default value
 */
const getStoredData = <T>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(STORAGE_PREFIX + key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch {
        return defaultValue;
    }
};

/**
 * Stores data in localStorage with JSON stringification
 * 
 * @param key - Storage key (without prefix)
 * @param data - Data to store
 */
const setStoredData = <T>(key: string, data: T): void => {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
};

// ============================================================================
// Default Data
// ============================================================================

/** Default users for initial setup */
const DEFAULT_USERS: User[] = [
    {
        id: '1',
        name: 'أحمد محمد',
        nameEn: 'Ahmed Mohamed',
        email: 'ahmed@example.com',
        role: 'student',
        avatar: 'https://ui-avatars.com/api/?name=Ahmed+M&background=064e3b&color=fff&size=100',
        points: 1250,
        level: 5,
        streak: 12,
        joinDate: '2024-01-15',
        phone: '+966 50 123 4567',
        location: 'الرياض، السعودية',
        bio: 'طالب علم أسعى لتعلم القرآن الكريم والعلوم الشرعية',
        status: 'active'
    },
    {
        id: '2',
        name: 'مدير النظام',
        nameEn: 'System Admin',
        email: 'admin@example.com',
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=5E35B1&color=fff&size=100',
        points: 0,
        level: 0,
        streak: 0,
        joinDate: '2024-01-01',
        status: 'active'
    }
];

/** Default courses for initial setup */
const DEFAULT_COURSES: Course[] = [
    {
        id: '1',
        title: 'تفسير جزء عم',
        titleEn: 'Interpretation of Juz Amma',
        instructor: 'أ. بلال عبدالله',
        instructorEn: 'Prof. Bilal Abdullah',
        progress: 0,
        category: 'القرآن',
        categoryEn: 'Quran',
        duration: '1س 50د',
        durationEn: '1h 50m',
        thumbnail: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=225&fit=crop',
        description: 'تفسير مبسط لجزء عم مع شرح معاني الكلمات',
        descriptionEn: 'Simplified interpretation of Juz Amma with word meanings',
        lessonsCount: 12,
        studentsCount: 245,
        videoUrl: 'http://16.171.18.144/videos/Tazkiyah1.mp4'
    },
    {
        id: '2',
        title: 'قصص الأنبياء',
        titleEn: 'Stories of the Prophets',
        instructor: 'د. فاطمة الزهراء',
        instructorEn: 'Dr. Fatima Al-Zahraa',
        progress: 100,
        category: 'التاريخ',
        categoryEn: 'History',
        duration: '2س 15د',
        durationEn: '2h 15m',
        thumbnail: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=400&h=225&fit=crop',
        description: 'قصص الأنبياء من القرآن الكريم',
        descriptionEn: 'Stories of Prophets from the Holy Quran',
        lessonsCount: 25,
        studentsCount: 189,
        videoUrl: 'http://16.171.18.144/videos/Aqeeda1.mp4'
    },
    {
        id: '3',
        title: 'فقه الصلاة',
        titleEn: 'Jurisprudence of Prayer',
        instructor: 'الشيخ أحمد',
        instructorEn: 'Sheikh Ahmed',
        progress: 45,
        category: 'الفقه',
        categoryEn: 'Fiqh',
        duration: '45د متبقية',
        durationEn: '45m remaining',
        thumbnail: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=400&h=225&fit=crop',
        description: 'شرح مفصل لأحكام الصلاة',
        descriptionEn: 'Detailed explanation of prayer rules',
        lessonsCount: 8,
        studentsCount: 312
    },
    {
        id: '4',
        title: 'بناء الشخصية المسلمة',
        titleEn: 'Building Muslim Character',
        instructor: 'إمام زيد',
        instructorEn: 'Imam Zaid',
        progress: 10,
        category: 'الأخلاق',
        categoryEn: 'Ethics',
        duration: '3س 45د',
        durationEn: '3h 45m',
        thumbnail: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=225&fit=crop',
        description: 'تنمية الشخصية الإسلامية',
        descriptionEn: 'Developing Islamic personality',
        lessonsCount: 15,
        studentsCount: 156
    }
];

/** Default announcement */
const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
    {
        id: '1',
        title: 'بداية التسجيل في الدورة الصيفية',
        content: 'يسرنا الإعلان عن فتح باب التسجيل في الدورات الصيفية المكثفة...',
        date: '2024-05-15',
        target: 'all',
        priority: 'high',
        author: 'الإدارة'
    }
];

// ============================================================================
// API Object
// ============================================================================

/**
 * Main API object containing all CRUD operations
 */
export const api = {
    // ========================================================================
    // Authentication & Users
    // ========================================================================

    /**
     * Authenticates a user by email
     * Note: Password verification not implemented in demo version
     * 
     * @param email - User's email address
     * @param _password - Password (unused in demo)
     * @returns User object if found, null otherwise
     */
    login: async (email: string, password: string): Promise<User | null> => {
        if (USE_LIVE_API) {
            try {
                // For demo purposes, we're using a simple endpoint. 
                // In production, this would be a POST to /auth/login
                // json-server-auth expects /login
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log('Login Response Data:', data); // DEBUG: Log full response

                    const user: User = {
                        ...data.user,
                        access_token: data.accessToken || data.access_token,
                        // Ensure defaults for missing fields
                        nameEn: data.user.nameEn || data.user.name,
                        points: data.user.points ?? 0,
                        level: data.user.level ?? 1,
                        streak: data.user.streak ?? 0,
                        joinDate: data.user.joinDate ?? new Date().toISOString()
                    };
                    console.log('Constructed User Object:', user); // DEBUG: Log constructed user
                    setStoredData('currentUser', user);
                    localStorage.setItem('authToken', user.access_token || '');
                    api.logAction(user.id, user.name, 'Login', 'تسجيل دخول ناجح');
                    return user;
                } else if (res.status === 403) {
                    const data = await res.json();
                    if (data.needsVerification) {
                        // Throw a special error that the UI can catch
                        const error = new Error('Verification required') as any;
                        error.needsVerification = true;
                        error.email = data.email;
                        error.messageAr = data.errorAr;
                        throw error;
                    }
                    return null;
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('Login failed with status:', res.status, errorData);
                    return null;
                }
            } catch (e) {
                console.error('Live API login error:', e);
                return null;
            }
        }

        // Fallback only if USE_LIVE_API is false
        const sanitizedEmail = sanitizeEmail(email);
        let users = getStoredData<User[]>('users', []);

        // Initialize default users if empty
        if (users.length === 0) {
            users = DEFAULT_USERS;
            setStoredData('users', users);
        }

        const user = users.find(u => u.email === sanitizedEmail);
        if (user) {
            setStoredData('currentUser', user);
            api.logAction(user.id, user.name, 'Login', 'تسجيل دخول ناجح');
            return user;
        }
        return null;
    },

    /**
     * Gets all registered users
     * 
     * @returns Array of all users
     */
    getUsers: async (): Promise<User[]> => {
        if (USE_LIVE_API) {
            try {
                const res = await fetch(`${API_URL}/users`);
                if (res.ok) {
                    const users = await res.json();
                    setStoredData('users', users);
                    return users;
                }
            } catch (e) {
                console.warn('Live API getUsers failed, using cached data', e);
            }
        }
        return getStoredData<User[]>('users', DEFAULT_USERS);
    },

    /**
     * Creates a new user
     * 
     * @param user - User data without ID
     * @returns Created user with generated ID
     */
    createUser: async (user: Omit<User, 'id'>): Promise<User> => {
        const sanitizedUser = sanitizeObject(user);
        const newUser: User = {
            ...sanitizedUser,
            id: Date.now().toString()
        } as User;

        if (USE_LIVE_API) {
            try {
                const res = await fetch(`${API_URL}/register`, { // or /users depending on backend
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });
                if (!res.ok) throw new Error('Failed to create user on server');
                // api.logAction('system', 'System', 'Create User', `Created user ${newUser.name} on server`);
            } catch (e) {
                console.error('Create user on API failed', e);
            }
        }

        const users = await api.getUsers(); // Now async
        users.push(newUser);
        setStoredData('users', users);
        api.logAction('system', 'System', 'Create User', `Created user ${newUser.name}`);
        return newUser;
    },

    /**
     * Updates an existing user
     * 
     * @param userId - User ID to update
     * @param updates - Partial user data to update
     * @returns Updated user or null if not found
     */
    updateUser: async (userId: string, updates: Partial<User>): Promise<User | null> => {
        const sanitizedUpdates = sanitizeObject(updates);

        if (USE_LIVE_API) {
            try {
                const token = getAuthToken();
                await fetch(`${API_URL}/users/${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(sanitizedUpdates)
                });
            } catch (e) {
                console.warn('Update user on API failed', e);
            }
        }

        const users = getStoredData<User[]>('users', []); // Use stored data directly to avoid recursion or extra call
        const index = users.findIndex(u => u.id === userId);

        if (index !== -1) {
            users[index] = { ...users[index], ...sanitizedUpdates };
            setStoredData('users', users);

            // Also update current user if it's the one being updated
            const currentUser = getStoredData<User | null>('currentUser', null);
            if (currentUser && currentUser.id === userId) {
                const updatedCurrentUser = { ...currentUser, ...sanitizedUpdates };
                setStoredData('currentUser', updatedCurrentUser);
            }
            return users[index];
        }
        return null;
    },

    /**
     * Deletes a user by ID
     * 
     * @param userId - User ID to delete
     */
    deleteUser: async (userId: string): Promise<void> => {
        if (USE_LIVE_API) {
            try {
                const token = getAuthToken();
                await fetch(`${API_URL}/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (e) {
                console.warn('Delete user on API failed', e);
            }
        }

        const users = getStoredData<User[]>('users', DEFAULT_USERS).filter(u => u.id !== userId);
        setStoredData('users', users);
        api.logAction('system', 'System', 'Delete User', `Deleted user ${userId}`);
    },

    /**
     * Logs out the current user
     */
    logout: (): void => {
        const currentUser = api.getCurrentUser();
        if (currentUser) {
            api.logAction(currentUser.id, currentUser.name, 'Logout', 'تسجيل خروج');
        }
        localStorage.removeItem(STORAGE_PREFIX + 'currentUser');
    },

    /**
     * Gets the currently logged in user
     * 
     * @returns Current user or null
     */
    getCurrentUser: (): User | null => {
        return getStoredData<User | null>('currentUser', null);
    },

    /**
     * Gets the current auth token
     */
    getAuthToken: getAuthToken,

    // ========================================================================
    // Courses
    // ========================================================================

    /**
     * Gets all courses
     * 
     * @returns Array of all courses
     */
    getCourses: async (): Promise<Course[]> => {
        if (USE_LIVE_API) {
            try {
                const res = await fetch(`${API_URL}/courses`);
                if (res.ok) {
                    const data = await res.json();
                    const courses = data.map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        titleEn: c.titleEn || c.title,
                        instructor: c.instructor,
                        instructorEn: c.instructorEn || c.instructor,
                        progress: c.progress || 0,
                        category: c.category,
                        categoryEn: c.categoryEn || c.category,
                        duration: c.duration || '0m',
                        durationEn: c.durationEn || c.duration || '0m',
                        thumbnail: c.thumbnail,
                        description: c.description,
                        descriptionEn: c.descriptionEn || c.description,
                        lessonsCount: c.lessonsCount || 0,
                        studentsCount: c.studentsCount || 0,
                        status: c.status,
                        videoUrl: c.videoUrl
                    }));
                    // Cache courses locally
                    setStoredData('courses', courses);
                    return courses;
                }
            } catch (e) {
                console.warn('Live API getCourses failed, using cached data', e);
            }
        }
        return getStoredData<Course[]>('courses', DEFAULT_COURSES);
    },

    /**
     * Adds a new course
     * 
     * @param course - Course to add
     */
    addCourse: async (course: Course): Promise<void> => {
        const sanitizedCourse = sanitizeObject(course as any);

        if (USE_LIVE_API) {
            try {
                const token = getAuthToken();
                if (!token) {
                    const user = getStoredData<User | null>('currentUser', null);
                    const debugInfo = user ? `User found: ${user.name}, Token: ${user.access_token ? 'Yes' : 'Missing'}` : 'User is NULL';
                    console.error('No auth token found', debugInfo);
                    throw new Error(`Authentication required. Debug: ${debugInfo}`);
                }

                const res = await fetch(`${API_URL}/courses`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(sanitizedCourse)
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`API Error: ${res.status} ${errorText}`);
                }

                // If successful, we might want to use the returned course which has the real ID
                const savedCourse = await res.json();
                sanitizedCourse.id = savedCourse.id; // Update ID with server version

                api.logAction('system', 'System', 'Add Course', `Added course ${course.title} to API`);
            } catch (e) {
                console.error('Add course to API failed', e);
                throw e; // Propagate error so frontend knows it failed
            }
        }

        // Always update local state for immediate feedback
        const courses = getStoredData<Course[]>('courses', DEFAULT_COURSES);
        courses.push(sanitizedCourse as Course);
        setStoredData('courses', courses);
        api.logAction('system', 'System', 'Add Course', `Added course ${course.title}`);
    },

    /**
     * Updates an existing course
     * 
     * @param courseId - Course ID to update
     * @param updates - Partial course data to update
     */
    updateCourse: (courseId: string, updates: Partial<Course>): void => {
        const sanitizedUpdates = sanitizeObject(updates as any);
        // Use getStoredData directly to avoid async call
        const courses = getStoredData<Course[]>('courses', DEFAULT_COURSES);
        const index = courses.findIndex(c => c.id === courseId);
        if (index !== -1) {
            courses[index] = { ...courses[index], ...sanitizedUpdates };
            setStoredData('courses', courses);
            api.logAction('system', 'System', 'Update Course', `Updated course ${courseId}`);
        }
    },

    /**
     * Deletes a course by ID
     * 
     * @param courseId - Course ID to delete
     */
    deleteCourse: async (courseId: string): Promise<void> => {
        if (USE_LIVE_API) {
            try {
                const token = getAuthToken();
                if (!token) {
                    throw new Error('Authentication required');
                }

                const res = await fetch(`${API_URL}/courses/${courseId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || `Failed to delete course: ${res.status}`);
                }

                api.logAction('system', 'System', 'Delete Course', `Deleted course ${courseId} from API`);
            } catch (e) {
                console.error('Delete course from API failed', e);
                throw e;
            }
        }

        // Always update local state
        const courses = getStoredData<Course[]>('courses', DEFAULT_COURSES).filter(c => c.id !== courseId);
        setStoredData('courses', courses);
        api.logAction('system', 'System', 'Delete Course', `Deleted course ${courseId}`);
    },

    updateCourseProgress: (courseId: string, progress: number): void => {
        const courses = getStoredData<Course[]>('courses', DEFAULT_COURSES);
        const updated = courses.map(c =>
            c.id === courseId ? { ...c, progress: Math.min(100, Math.max(0, progress)) } : c
        );
        setStoredData('courses', updated);
    },

    /**
     * Updates episode progress for the current user
     * 
     * @param courseId - Course ID
     * @param episodeId - Episode ID
     * @param completed - Whether completed
     */
    updateEpisodeProgress: async (courseId: string, episodeId: string, completed: boolean): Promise<void> => {
        if (USE_LIVE_API) {
            try {
                const token = getAuthToken();
                await fetch(`${API_URL}/episode-progress`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ courseId, episodeId, completed })
                });
            } catch (e) {
                console.error('Update episode progress failed', e);
            }
        }

        // Update local cache if needed (omitted for brevity as primary storage is now server)
    },

    // ========================================================================
    // Library
    // ========================================================================

    /**
     * Gets all library resources
     * 
     * @returns Array of all library resources
     */
    getLibraryResources: async (): Promise<LibraryResource[]> => {
        if (USE_LIVE_API) {
            try {
                const res = await fetch(`${API_URL}/library/resources`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('Live API getLibraryResources failed', e);
            }
        }
        return getStoredData<LibraryResource[]>('libraryResources', []);
    },

    // ========================================================================
    // Community
    // ========================================================================

    /**
     * Gets all community posts
     * 
     * @returns Array of all community posts
     */
    getCommunityPosts: async (): Promise<Post[]> => {
        if (USE_LIVE_API) {
            try {
                const res = await fetch(`${API_URL}/community/posts`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('Live API getCommunityPosts failed', e);
            }
        }
        return getStoredData<Post[]>('communityPosts', []);
    },

    // ========================================================================
    // Announcements
    // ========================================================================

    /**
     * Gets all announcements
     * 
     * @returns Array of all announcements
     */
    getAnnouncements: (): Announcement[] => {
        return getStoredData<Announcement[]>('announcements', DEFAULT_ANNOUNCEMENTS);
    },

    /**
     * Adds a new announcement
     * 
     * @param announcement - Announcement to add
     */
    addAnnouncement: (announcement: Announcement): void => {
        const sanitizedAnnouncement = sanitizeObject(announcement as any);
        const list = api.getAnnouncements();
        list.push(sanitizedAnnouncement as Announcement);
        setStoredData('announcements', list);
        api.logAction('system', 'System', 'Add Announcement', `Added announcement ${announcement.title}`);
    },

    /**
     * Deletes an announcement by ID
     * 
     * @param id - Announcement ID to delete
     */
    deleteAnnouncement: (id: string): void => {
        const list = api.getAnnouncements().filter(a => a.id !== id);
        setStoredData('announcements', list);
    },

    /**
     * Updates an existing announcement
     * 
     * @param id - Announcement ID to update
     * @param updates - Partial announcement data to update
     */
    updateAnnouncement: (id: string, updates: Partial<Announcement>): void => {
        const sanitizedUpdates = sanitizeObject(updates as any);
        const list = api.getAnnouncements();
        const index = list.findIndex(a => a.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...sanitizedUpdates };
            setStoredData('announcements', list);
        }
    },

    // ========================================================================
    // Quizzes
    // ========================================================================

    /**
     * Gets all quizzes
     * 
     * @returns Array of all quizzes
     */
    getQuizzes: (): Quiz[] => {
        return getStoredData<Quiz[]>('quizzes', []);
    },

    /**
     * Adds a new quiz
     * 
     * @param quiz - Quiz to add
     */
    addQuiz: (quiz: Quiz): void => {
        const sanitizedQuiz = sanitizeObject(quiz as any);
        const list = api.getQuizzes();
        list.push(sanitizedQuiz as Quiz);
        setStoredData('quizzes', list);
        api.logAction('system', 'System', 'Add Quiz', `Created quiz ${quiz.title}`);
    },

    /**
     * Updates an existing quiz
     * 
     * @param id - Quiz ID to update
     * @param updates - Partial quiz data to update
     */
    updateQuiz: (id: string, updates: Partial<Quiz>): void => {
        const sanitizedUpdates = sanitizeObject(updates as any);
        const list = api.getQuizzes();
        const index = list.findIndex(q => q.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...sanitizedUpdates };
            setStoredData('quizzes', list);
        }
    },

    /**
     * Deletes a quiz by ID
     * 
     * @param id - Quiz ID to delete
     */
    deleteQuiz: (id: string): void => {
        const list = api.getQuizzes().filter(q => q.id !== id);
        setStoredData('quizzes', list);
    },

    /**
     * Quiz results management
     */
    quizResults: {
        /**
         * Saves a quiz result
         * 
         * @param quizId - Quiz ID
         * @param score - Score achieved
         * @param total - Total possible score
         */
        save: (quizId: string, score: number, total: number): void => {
            const results = getStoredData<QuizResult[]>('quizResults', []);
            results.push({
                quizId,
                score,
                total,
                percentage: Math.round((score / total) * 100),
                completedAt: new Date().toISOString()
            });
            setStoredData('quizResults', results);
        },

        /**
         * Gets all quiz results
         * 
         * @returns Array of quiz results
         */
        get: (): QuizResult[] => {
            return getStoredData<QuizResult[]>('quizResults', []);
        }
    },

    // ========================================================================
    // Activity Logs
    // ========================================================================

    /**
     * Gets all activity logs
     * 
     * @returns Array of activity logs
     */
    getLogs: async (): Promise<SystemActivityLog[]> => {
        // Future: Fetch from server if endpoint exists
        if (USE_LIVE_API) {
            try {
                const res = await fetch(`${API_URL}/logs`);
                if (res.ok) {
                    const logs = await res.json();
                    setStoredData('activityLogs', logs);
                    return logs;
                }
            } catch (e) {
                // Ignore, fallback to local
            }
        }
        return getStoredData<SystemActivityLog[]>('activityLogs', []);
    },

    /**
     * Logs an action to the activity log
     * 
     * @param userId - User ID performing the action
     * @param userName - User name for display
     * @param action - Action type/name
     * @param details - Additional details
     */
    /**
     * Logs an action to the activity log
     * 
     * @param userId - User ID performing the action
     * @param userName - User name for display
     * @param action - Action type/name
     * @param details - Additional details
     */
    logAction: async (userId: string, userName: string, action: string, details: string): Promise<void> => {
        // Optimistically update local logs
        const logs = await api.getLogs();
        const timestamp = new Date().toISOString();
        const logEntry: SystemActivityLog = {
            id: Date.now().toString(),
            userId,
            userName: sanitizeHTML(userName),
            action: sanitizeHTML(action),
            details: sanitizeHTML(details),
            timestamp,
            date: timestamp.split('T')[0]
        };

        logs.unshift(logEntry);

        // Keep only last MAX_LOG_ENTRIES logs
        while (logs.length > MAX_LOG_ENTRIES) {
            logs.pop();
        }
        setStoredData('activityLogs', logs);

        if (USE_LIVE_API) {
            try {
                await fetch(`${API_URL}/logs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logEntry)
                });
            } catch (e) {
                console.warn('Log action to API failed', e);
            }
        }
    },

    // ========================================================================
    // Certificates
    // ========================================================================

    /**
     * Gets all certificates
     * 
     * @returns Array of all certificates
     */
    getCertificates: (): Certificate[] => {
        return getStoredData<Certificate[]>('certificates', []);
    },

    /**
     * Issues a new certificate
     * 
     * @param cert - Certificate to issue
     */
    /**
     * Issues a new certificate
     * 
     * @param certData - Certificate data (partial)
     */
    issueCertificate: (certData: Omit<Certificate, 'id' | 'issueDate' | 'code'> & { userId?: string }): void => {
        const fullCert: Certificate = {
            id: Date.now().toString(),
            issueDate: new Date().toISOString().split('T')[0],
            code: 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            studentId: certData.studentId || certData.userId || 'unknown',
            ...certData
        };

        const list = api.getCertificates();
        list.push(fullCert);
        setStoredData('certificates', list);
        api.logAction('system', 'System', 'Issue Certificate', `Issued certificate to ${fullCert.userName || fullCert.studentName}`);
    },

    // ========================================================================
    // Backup & Restore
    // ========================================================================

    /**
     * Creates a backup of all application data
     * 
     * @returns JSON string of all stored data
     */
    createBackup: (): string => {
        const backupData: Record<string, unknown> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                try {
                    backupData[key.replace(STORAGE_PREFIX, '')] = JSON.parse(localStorage.getItem(key) || 'null');
                } catch {
                    backupData[key.replace(STORAGE_PREFIX, '')] = localStorage.getItem(key);
                }
            }
        }
        api.logAction('system', 'System', 'Create Backup', 'Created system backup');
        return JSON.stringify(backupData, null, 2);
    },

    /**
     * Restores data from a backup
     * 
     * @param jsonContent - JSON string from backup
     * @returns true if successful, false otherwise
     */
    restoreBackup: (jsonContent: string): boolean => {
        try {
            const data = JSON.parse(jsonContent);
            Object.keys(data).forEach(key => {
                setStoredData(key, data[key]);
            });
            api.logAction('system', 'System', 'Restore Backup', 'Restored system from backup');
            return true;
        } catch (e) {
            console.error('Backup restore failed', e);
            return false;
        }
    },

    // ========================================================================
    // Favorites
    // ========================================================================

    /**
     * Gets user's favorite course IDs
     * 
     * @returns Array of course IDs
     */
    getFavorites: (): string[] => {
        return getStoredData<string[]>('favorites', []);
    },

    /**
     * Toggles a course's favorite status
     * 
     * @param courseId - Course ID to toggle
     * @returns true if now favorited, false if unfavorited
     */
    toggleFavorite: (courseId: string): boolean => {
        const favorites = api.getFavorites();
        const index = favorites.indexOf(courseId);
        if (index >= 0) {
            favorites.splice(index, 1);
            setStoredData('favorites', favorites);
            return false;
        } else {
            favorites.push(courseId);
            setStoredData('favorites', favorites);
            return true;
        }
    },

    /**
     * Checks if a course is favorited
     * 
     * @param courseId - Course ID to check
     * @returns true if favorited
     */
    isFavorite: (courseId: string): boolean => {
        return api.getFavorites().includes(courseId);
    },

    // ========================================================================
    // Global Search
    // ========================================================================

    /**
     * Platform-wide search across courses, library, and community
     * 
     * @param query - Search term
     * @param category - Category to filter by (all, course, audio, document, community)
     * @returns Aggregated search results
     */
    search: async (query: string, category: string = 'all'): Promise<any[]> => {
        const sanitizedQuery = query ? query.toLowerCase() : '';
        const results: any[] = [];

        // 1. Fetch Courses
        if (category === 'all' || category === 'course' || category === 'audio') {
            try {
                const courses = await api.getCourses();
                const matchedCourses = courses.filter(c =>
                    !sanitizedQuery ||
                    c.title.toLowerCase().includes(sanitizedQuery) ||
                    (c.titleEn && c.titleEn.toLowerCase().includes(sanitizedQuery)) ||
                    c.instructor.toLowerCase().includes(sanitizedQuery) ||
                    (c.description && c.description.toLowerCase().includes(sanitizedQuery))
                );

                results.push(...matchedCourses.map(c => ({
                    id: c.id,
                    type: c.category === 'صوتيات' || c.categoryEn === 'Audio' ? 'audio' : 'course',
                    title: c.title,
                    desc: c.description || '',
                    instructor: c.instructor,
                    duration: c.duration,
                    thumbnail: c.thumbnail
                })));
            } catch (e) {
                console.warn('Search: failed to fetch courses', e);
            }
        }

        // 2. Fetch Library Resources
        if (category === 'all' || category === 'document') {
            try {
                const library = await api.getLibraryResources();
                const matchedLib = library.filter(r =>
                    !sanitizedQuery ||
                    r.title.toLowerCase().includes(sanitizedQuery) ||
                    (r.author && r.author.toLowerCase().includes(sanitizedQuery))
                );

                results.push(...matchedLib.map(r => ({
                    id: r.id,
                    type: 'document',
                    title: r.title,
                    desc: r.type.toUpperCase() + ' - ' + r.size,
                    author: r.author,
                    thumbnail: r.image
                })));
            } catch (e) {
                console.warn('Search: failed to fetch library', e);
            }
        }

        // 3. Fetch Community Posts
        if (category === 'all' || category === 'community') {
            try {
                const posts = await api.getCommunityPosts();
                const matchedPosts = posts.filter(p =>
                    !sanitizedQuery ||
                    p.content.toLowerCase().includes(sanitizedQuery) ||
                    p.author.toLowerCase().includes(sanitizedQuery) ||
                    (p.tags && p.tags.some(t => t.toLowerCase().includes(sanitizedQuery)))
                );

                results.push(...matchedPosts.map(p => ({
                    id: p.id,
                    type: 'community',
                    title: p.author,
                    desc: p.content,
                    members: p.likes, // Misusing field for demo but showing variety
                    thumbnail: p.authorAvatar
                })));
            } catch (e) {
                console.warn('Search: failed to fetch community', e);
            }
        }

        // Filter by category if not already limited by fetch logic
        if (category !== 'all') {
            return results.filter(r => r.type === category);
        }

        return results;
    }
};

// Re-export types for backward compatibility
export type { User, Course, Quiz, Question, Certificate, Announcement, SystemActivityLog as ActivityLog };

export default api;
