import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface CoursesGridProps {
    onPlayCourse: (course: Course) => void;
}

const CoursesGrid: React.FC<CoursesGridProps> = ({ onPlayCourse }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const data = await api.getCourses();
                if (Array.isArray(data)) {
                    setCourses(data);
                } else {
                    console.error("Invalid courses data:", data);
                    setCourses([]);
                }
            } catch (error) {
                console.error("Failed to load courses", error);
                setError('فشل تحميل الدورات. يرجى المحاولة مرة أخرى.');
            } finally {
                setIsLoading(false);
            }
        };
        loadCourses();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-400 py-10">
                {error}
            </div>
        )
    }

    return (
        <div className="animate-fade-in relative z-10 p-6 md:p-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">دوراتي</h2>
                    <p className="text-gray-200">تابع تقدمك التعليمي</p>
                </div>
            </div>

            {courses.length === 0 ? (
                <div className="text-center text-gray-400 py-10 glass-panel rounded-xl">
                    لا توجد دورات متاحة حالياً.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div
                            key={course.id}
                            onClick={() => onPlayCourse(course)}
                            className="glass-panel p-0 rounded-2xl overflow-hidden cursor-pointer group hover:border-emerald-500/50 transition-all bg-white/5 hover:bg-white/10"
                        >
                            <div className="h-48 relative">
                                <img
                                    src={course.thumbnail}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    alt={course.title}
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg">
                                        ابدأ التعلم
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-lg text-white mb-1 group-hover:text-emerald-300 transition-colors">{course.title}</h3>
                                <p className="text-sm text-gray-300 mb-4">{course.instructor}</p>
                                <div className="flex items-center justify-between text-xs text-emerald-300 font-bold bg-emerald-500/10 py-2 px-3 rounded-lg">
                                    <span>{course.duration}</span>
                                    <span>{course.category}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoursesGrid;
