/**
 * Course Service
 */
import type { Course } from '../../types';
import { getAuthToken } from './auth';

export const coursesApi = {
    getCourses: async (): Promise<Course[]> => {
        const token = getAuthToken();
        const response = await fetch('/api/courses', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) return [];
        return await response.json();
    },

    updateCourseProgress: async (courseId: string, progress: number): Promise<void> => {
        const token = getAuthToken();
        await fetch('/api/episode-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseId, episodeId: 'FULL_COURSE', completed: progress === 100 })
        });
    },

    updateEpisodeProgress: async (courseId: string, episodeId: string, completed: boolean): Promise<void> => {
        const token = getAuthToken();
        await fetch('/api/episode-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseId, episodeId, completed })
        });
    },

    addCourse: async (course: Course): Promise<Course> => {
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to add course');
        }
        return await response.json();
    },

    updateCourse: async (id: string, updates: Partial<Course>): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`/api/courses/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update course');
    },

    deleteCourse: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`/api/courses/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete course');
    }
};
