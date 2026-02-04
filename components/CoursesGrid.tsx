import React, { useState, useEffect } from 'react';
import { Course, CourseFolder } from '../types';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { Folder, ChevronRight, Plus, X, Image as ImageIcon, LayoutGrid, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from './AuthContext';

interface CoursesGridProps {
    onPlayCourse: (course: Course) => void;
}

const CoursesGrid: React.FC<CoursesGridProps> = ({ onPlayCourse }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [folders, setFolders] = useState<CourseFolder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Add Folder Form State
    const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
    const [newFolderForm, setNewFolderForm] = useState({ name: '', thumbnail: '' });

    const loadData = async () => {
        try {
            const [coursesData, foldersData] = await Promise.all([
                api.getCourses(),
                api.getFolders()
            ]);

            if (Array.isArray(coursesData)) {
                const sorted = [...coursesData].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                setCourses(sorted);
            }
            if (Array.isArray(foldersData)) setFolders(foldersData);

        } catch (error) {
            console.error("Failed to load data", error);
            setError('فشل تحميل البيانات. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEnroll = async (courseId: string) => {
        setEnrollingId(courseId);
        try {
            await api.enroll(courseId);
            await loadData();
        } catch (err: any) {
            alert(err.message || 'فشل التسجيل في الدورة');
        } finally {
            setEnrollingId(null);
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createFolder(newFolderForm.name, newFolderForm.thumbnail);
            setIsAddFolderModalOpen(false);
            setNewFolderForm({ name: '', thumbnail: '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'فشل إنشاء المجلد');
        }
    };

    const currentFolder = folders.find(f => f.id === selectedFolderId);

    // Filter folders based on whether they have courses for the student
    // (In folder view, we show all folders that contain any courses)
    // Actually, user wants "Folders for general course names".

    const visibleFolders = selectedFolderId ? [] : folders;

    // Courses to show in current view
    const visibleCourses = selectedFolderId
        ? courses.filter(c => c.folderId === selectedFolderId)
        : [];

    const enrolledCourses = courses.filter(course => (course as any).isEnrolled);

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
        <div className="animate-fade-in relative z-10 p-6 lg:p-8 pb-24 lg:pb-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-transparent">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">دوراتي</h2>
                    {selectedFolderId ? (
                        <div className="flex items-center gap-2 text-emerald-400 font-medium">
                            <button
                                onClick={() => setSelectedFolderId(null)}
                                className="hover:text-emerald-300 flex items-center gap-1 transition-colors"
                            >
                                <ArrowRight className="w-4 h-4" />
                                العودة للمجلدات
                            </button>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                            <span>{currentFolder?.name}</span>
                        </div>
                    ) : (
                        <p className="text-gray-300">تصفح الدورات المنظمة في مجلدات تعليمية</p>
                    )}
                </div>

                {!selectedFolderId && isAdmin && (
                    <button
                        onClick={() => setIsAddFolderModalOpen(true)}
                        className="px-5 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded-xl border border-violet-500/30 flex items-center gap-2 transition-all shadow-lg shadow-violet-900/10"
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة مجلد</span>
                    </button>
                )}
            </div>

            {/* Folder Grid */}
            {!selectedFolderId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleFolders.map(folder => {
                        const folderCourses = courses.filter(c => c.folderId === folder.id);
                        const enrolledInFolder = folderCourses.filter(c => (c as any).isEnrolled);

                        return (
                            <div
                                key={folder.id}
                                onClick={() => setSelectedFolderId(folder.id)}
                                className="glass-panel p-0 rounded-2xl overflow-hidden cursor-pointer group hover:border-emerald-500/50 transition-all bg-white/5 hover:bg-black/40 border border-white/10 relative h-64 overflow-hidden"
                            >
                                <img
                                    src={folder.thumbnail}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40"
                                    alt={folder.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                <div className="absolute inset-x-0 bottom-0 p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:scale-110 transition-all duration-300">
                                            <Folder className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors drop-shadow-lg">{folder.name}</h3>
                                    </div>
                                    <div className="flex gap-4 text-xs font-semibold">
                                        <span className="text-gray-300 flex items-center gap-1.5">
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                            {folderCourses.length} دورات
                                        </span>
                                        {enrolledInFolder.length > 0 && (
                                            <span className="text-emerald-400 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                {enrolledInFolder.length} ملتحق بها
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        <ChevronRight className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Folder Card for Admins */}
                    {isAdmin && (
                        <div
                            onClick={() => setIsAddFolderModalOpen(true)}
                            className="group glass-panel h-64 rounded-2xl border-2 border-dashed border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all animate-pulse-subtle"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20 group-hover:bg-violet-600 group-hover:scale-110 transition-all duration-300">
                                <Plus className="w-8 h-8 text-violet-400 group-hover:text-white" />
                            </div>
                            <div className="text-center">
                                <span className="block text-white font-bold text-lg group-hover:text-violet-300 transition-colors">إضافة مجلد لدورة جديدة</span>
                                <span className="text-gray-500 text-xs">لتنظيم مجموعة من الدورات التعليمية</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Courses View (Inside Folder) */}
            {selectedFolderId && (
                <div className="space-y-8 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleCourses.map(course => {
                            const isEnrolled = (course as any).isEnrolled;
                            return (
                                <div
                                    key={course.id}
                                    className={`glass-panel p-0 rounded-2xl overflow-hidden transition-all duration-500 border border-white/5 ${isEnrolled ? 'border-emerald-500/30 bg-emerald-500/5' : 'hover:border-white/20'}`}
                                >
                                    <div
                                        className={`h-48 relative group ${course.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        onClick={() => {
                                            if (course.isLocked) return;
                                            if (isEnrolled) {
                                                onPlayCourse(course);
                                            } else {
                                                handleEnroll(course.id);
                                            }
                                        }}
                                    >
                                        <img
                                            src={course.thumbnail}
                                            className={`w-full h-full object-cover transition-all duration-700 ${course.isLocked ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}
                                            alt={course.title}
                                        />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />

                                        {course.isLocked ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-md border border-white/20">
                                                    <Lock className="w-6 h-6 text-white/50" />
                                                </div>
                                                <span className="bg-black/80 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400">اجتز المساق السابق للفتح</span>
                                            </div>
                                        ) : isEnrolled && (
                                            <>
                                                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                                                    ملتحق
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg">
                                                        واصل التعلم
                                                    </span>
                                                </div>
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                                                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${course.progress || 0}%` }} />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-white mb-1 leading-tight">{course.title}</h3>
                                        <p className="text-xs text-gray-400 mb-4">{course.instructor}</p>

                                        {isEnrolled ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold bg-emerald-500/10 py-1.5 px-3 rounded-md">
                                                    <span>{course.duration}</span>
                                                    <span>{course.progress || 0}% مكتمل</span>
                                                </div>
                                                <button
                                                    onClick={() => onPlayCourse(course)}
                                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                                                >
                                                    استمرار
                                                </button>
                                            </div>
                                        ) : course.isLocked ? (
                                            <button
                                                disabled
                                                className="w-full py-4 bg-white/5 text-gray-500 rounded-xl font-bold text-sm border border-white/5 cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <Lock className="w-4 h-4" />
                                                مغلق
                                            </button>
                                        ) : enrollingId === course.id ? (
                                            <button
                                                disabled
                                                className="w-full py-4 bg-white/5 text-emerald-400 rounded-xl font-bold text-sm border border-white/10 flex items-center justify-center gap-2"
                                            >
                                                جاري...
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleEnroll(course.id)}
                                                className="w-full py-4 bg-white/5 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl font-bold text-sm transition-all border border-white/10 hover:border-emerald-500 flex items-center justify-center gap-2"
                                            >
                                                تسجيل مجاني
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Folder Modal */}
            {isAddFolderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                    <div className="glass-panel w-full max-w-md border border-white/10 overflow-hidden rounded-3xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">إضافة مجلد جديد</h3>
                            <button onClick={() => setIsAddFolderModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateFolder} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-bold">اسم المجلد</label>
                                <input
                                    required
                                    value={newFolderForm.name}
                                    onChange={e => setNewFolderForm({ ...newFolderForm, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 focus:outline-none transition-all"
                                    placeholder="مثال: علوم العقيدة"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-bold">رابط صورة المجلد (اختياري)</label>
                                <div className="flex gap-3">
                                    <input
                                        value={newFolderForm.thumbnail}
                                        onChange={e => setNewFolderForm({ ...newFolderForm, thumbnail: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none text-xs"
                                        placeholder="https://images..."
                                    />
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {newFolderForm.thumbnail ? <img src={newFolderForm.thumbnail} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-gray-600" />}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 italic">سيتم استخدام صورة افتراضية في حال ترك الحقل فارغاً</p>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 transition-all"
                                >
                                    إنشاء المجلد
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddFolderModalOpen(false)}
                                    className="px-6 py-4 bg-white/5 text-gray-300 rounded-2xl hover:bg-white/10 transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursesGrid;
