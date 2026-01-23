/**
 * @fileoverview Admin Students management component
 * @module components/AdminStudents
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Users, Search, Filter, Mail, Calendar, UserCheck, UserX, GraduationCap, X, Check, LucideIcon, Edit, Eye, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { sanitizeHTML, sanitizeEmail } from '../utils/sanitize';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import EditStudentModal from './EditStudentModal';
import StudentDetailsModal from './StudentDetailsModal';

interface AdminStudentsProps {
    setActiveTab?: (tab: string) => void;
    onOpenChat?: (userId: string) => void;
}

/**
 * New student form data interface
 */
interface NewStudentForm {
    name: string;
    email: string;
    password: string;
    role: 'student';
}

/**
 * Stat item interface
 */
interface StatItem {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
}

/**
 * Stat card component
 */
const StatCard = memo<{ stat: StatItem }>(({ stat }) => (
    <article className="glass-panel p-5 rounded-2xl" aria-label={`${stat.label}: ${stat.value}`}>
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`} aria-hidden="true">
                <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
        </div>
    </article>
));
StatCard.displayName = 'StatCard';

/**
 * Student row component
 */
const StudentRow = memo<{
    student: User;
    onDelete: (id: string) => void;
    onEdit: (student: User) => void;
    onView: (id: string) => void;
    onMessage: (student: User) => void;
}>(({ student, onDelete, onEdit, onView, onMessage }) => {
    const handleDelete = useCallback(() => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
            onDelete(student.id);
        }
    }, [student.id, onDelete]);


    // Removed handleEmail as it's replaced by onMessage

    const statusLabel = useMemo(() => {
        switch (student.status) {
            case 'active': return 'نشط';
            case 'inactive': return 'غير نشط';
            default: return 'معلق';
        }
    }, [student.status]);

    const statusClass = useMemo(() => {
        switch (student.status) {
            case 'active': return 'bg-emerald-500/20 text-emerald-400';
            case 'inactive': return 'bg-red-500/20 text-red-400';
            default: return 'bg-amber-500/20 text-amber-400';
        }
    }, [student.status]);

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <img
                        src={student.avatar}
                        alt={`صورة ${student.name}`}
                        className="w-10 h-10 rounded-full bg-white/5"
                        loading="lazy"
                    />
                    <div>
                        <p className="text-white font-medium">{student.name}</p>
                        <p className="text-gray-400 text-sm">{student.email}</p>
                    </div>
                </div>
            </td>
            <td className="py-4 px-6">
                <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    <span>{student.joinDate}</span>
                </div>
            </td>
            <td className="py-4 px-6 text-white">المستوى {student.level}</td>
            <td className="py-4 px-6">
                <span className="text-emerald-400 font-bold">{student.points}</span>
            </td>
            <td className="py-4 px-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                    {statusLabel}
                </span>
            </td>
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onView(student.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-emerald-400 transition-colors"
                        title="عرض الملف"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit(student)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-blue-400 transition-colors"
                        title="تعديل"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onMessage(student)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        title="مراسلة"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-400 transition-colors"
                        title="حذف"
                    >
                        <UserX className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
});
StudentRow.displayName = 'StudentRow';

/**
 * Add student modal component
 */
const AddStudentModal = memo<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewStudentForm) => void;
}>(({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<NewStudentForm>({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) return;
        onSubmit(formData);
        setFormData({ name: '', email: '', password: '', role: 'student' });
    }, [formData, onSubmit]);

    const handleChange = useCallback((field: keyof NewStudentForm, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-[#0a1815] border border-white/10 rounded-3xl w-full max-w-lg p-6 relative animate-fade-in border-t border-emerald-500/20">
                <button
                    onClick={onClose}
                    className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors"
                    aria-label="إغلاق النافذة"
                >
                    <X className="w-6 h-6" aria-hidden="true" />
                </button>

                <h3 id="modal-title" className="text-2xl font-bold text-white mb-6 font-serif">إضافة طالب جديد</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-gray-400 text-sm mb-2">الاسم الكامل</label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="أدخل اسم الطالب"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-gray-400 text-sm mb-2">البريد الإلكتروني</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="example@domain.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-gray-400 text-sm mb-2">كلمة المرور المؤقتة</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="******"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" aria-hidden="true" />
                            <span>إضافة الطالب</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});
AddStudentModal.displayName = 'AddStudentModal';

/**
 * Admin Students component - Student management interface
 * 
 * Features:
 * - Student listing with search and filter
 * - Add new student functionality
 * - Delete student with confirmation
 * - Statistics overview
 * - Pagination support
 * - ARIA accessibility
 * 
 * @returns AdminStudents component
 */
const AdminStudents: React.FC<AdminStudentsProps> = memo(({ setActiveTab, onOpenChat }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    // Filter State
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New State for Modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // Debounce search for performance
    const debouncedSearch = useDebounce(searchTerm, 300);

    /** Load students from API */
    const loadStudents = useCallback(async () => {
        try {
            const allUsers = await api.getUsers();
            if (Array.isArray(allUsers)) {
                setStudents(allUsers.filter(u => u.role === 'student'));
            }
        } catch (error) {
            console.error("Failed to load students", error);
        }
    }, []);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    /** Filter students based on search term and filters */
    const filteredStudents = useMemo(() => {
        const term = debouncedSearch.toLowerCase();
        return students.filter(student => {
            const matchesSearch = (student as User).name.toLowerCase().includes(term) ||
                (student as User).email.toLowerCase().includes(term);

            const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [students, debouncedSearch, statusFilter]);

    /** Use pagination hook */
    const { paginatedItems, currentPage, totalPages, nextPage, prevPage } = usePagination(filteredStudents, { itemsPerPage: 10 });

    /** Handle add student */
    const handleAddStudent = useCallback(async (formData: NewStudentForm) => {
        // Sanitize inputs
        const sanitizedName = sanitizeHTML(formData.name);
        const sanitizedEmail = sanitizeEmail(formData.email);

        await api.createUser({
            name: sanitizedName,
            nameEn: sanitizedName,
            email: sanitizedEmail,
            role: 'student',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=064e3b&color=fff&size=100`,
            points: 0,
            level: 1,
            streak: 0,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active'
        });

        setIsAddModalOpen(false);
        loadStudents();
    }, [loadStudents]);

    /** Handle delete student */
    const handleDeleteStudent = useCallback(async (id: string) => {
        await api.deleteUser(id);
        loadStudents();
    }, [loadStudents]);

    /** Handle update student */
    const handleUpdateStudent = useCallback(async (id: string, updates: Partial<User>) => {
        await api.updateUser(id, updates);
        setEditModalOpen(false);
        loadStudents();
    }, [loadStudents]);

    /** Open Edit Modal */
    const openEditModal = useCallback((student: User) => {
        setSelectedStudent(student);
        setEditModalOpen(true);
    }, []);

    /** Open Details Modal */
    const openDetailsModal = useCallback((id: string) => {
        setSelectedStudentId(id);
        setDetailsModalOpen(true);
    }, []);

    /** Handle Message */
    const handleMessage = useCallback((student: User) => {
        if (onOpenChat) {
            onOpenChat(student.id);
        } else if (setActiveTab) {
            // Fallback if only setActiveTab is provided (legacy)
            setActiveTab('messages');
        } else {
            console.warn('onOpenChat not provided to AdminStudents');
        }
    }, [onOpenChat, setActiveTab]);

    const handleMessageFromDetails = useCallback((studentId: string) => {
        if (onOpenChat) {
            onOpenChat(studentId);
            setDetailsModalOpen(false);
        } else if (setActiveTab) {
            setActiveTab('messages');
            setDetailsModalOpen(false);
        }
    }, [onOpenChat, setActiveTab]);


    /** Handle email student */
    const handleEmailStudent = useCallback((email: string) => {
        window.location.href = `mailto:${email}`;
    }, []);

    /** Handle search change */
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    /** Open add modal */
    const handleOpenAddModal = useCallback(() => {
        setIsAddModalOpen(true);
    }, []);

    /** Close add modal */
    const handleCloseAddModal = useCallback(() => {
        setIsAddModalOpen(false);
    }, []);

    /** Statistics */
    const stats: StatItem[] = useMemo(() => [
        { label: 'إجمالي الطلاب', value: students.length, icon: Users, color: 'from-emerald-500 to-teal-600' },
        { label: 'الطلاب النشطين', value: students.filter(s => s.status === 'active').length, icon: UserCheck, color: 'from-blue-500 to-cyan-600' },
        { label: 'غير نشطين', value: students.filter(s => s.status === 'inactive').length, icon: UserX, color: 'from-amber-500 to-orange-600' },
        { label: 'معدل الإنجاز', value: '0%', icon: GraduationCap, color: 'from-purple-500 to-pink-600' },
    ], [students]);

    return (
        <div className="animate-fade-in space-y-6 relative" role="main" aria-label="إدارة الطلاب">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">إدارة الطلاب</h2>
                    <p className="text-gray-300">عرض وإدارة جميع الطلاب المسجلين</p>
                </div>
                <button
                    onClick={handleOpenAddModal}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    aria-label="إضافة طالب جديد"
                >
                    <Users className="w-5 h-5" aria-hidden="true" />
                    <span>+ إضافة طالب</span>
                </button>
            </header>

            {/* Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="إحصائيات الطلاب">
                {stats.map((stat, idx) => (
                    <StatCard key={idx} stat={stat} />
                ))}
            </section>

            {/* Search and Filter */}
            <section className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4" aria-label="البحث والتصفية">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="بحث عن طالب..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        aria-label="البحث عن طالب"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                        aria-label="تصفية حسب الحالة"
                    >
                        <option value="all" className="text-black">جميع الحالات</option>
                        <option value="active" className="text-black">نشط</option>
                        <option value="inactive" className="text-black">غير نشط</option>
                    </select>
                </div>
            </section>

            {/* Students Table */}
            <section className="glass-panel rounded-2xl overflow-hidden" aria-label="قائمة الطلاب">
                <table className="w-full" role="grid">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th scope="col" className="text-right py-4 px-6 text-gray-300 font-medium">الطالب</th>
                            <th scope="col" className="text-right py-4 px-6 text-gray-300 font-medium">تاريخ الانضمام</th>
                            <th scope="col" className="text-right py-4 px-6 text-gray-300 font-medium">المستوى</th>
                            <th scope="col" className="text-right py-4 px-6 text-gray-300 font-medium">النقاط</th>
                            <th scope="col" className="text-right py-4 px-6 text-gray-300 font-medium">الحالة</th>
                            <th scope="col" className="text-right py-4 px-6 text-gray-300 font-medium">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.length > 0 ? (
                            paginatedItems.map((item) => {
                                const student = item as User;
                                return (
                                    <StudentRow
                                        key={student.id}
                                        student={student}
                                        onDelete={handleDeleteStudent}
                                        onEdit={openEditModal}
                                        onView={openDetailsModal}
                                        onMessage={handleMessage}
                                    />
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-gray-400">
                                    لا يوجد طلاب مطابقين للبحث
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            {/* Pagination */}
            <nav className="flex justify-between items-center" aria-label="التنقل بين الصفحات">
                <p className="text-gray-400" aria-live="polite">عرض {filteredStudents.length} طالب</p>
                <div className="flex gap-2">
                    <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="الصفحة السابقة"
                    >
                        السابق
                    </button>
                    <span className="px-4 py-2 text-white">{currentPage} / {totalPages}</span>
                    <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="الصفحة التالية"
                    >
                        التالي
                    </button>
                </div>
            </nav>

            {/* Add Student Modal */}
            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSubmit={handleAddStudent}
            />

            {/* Edit Student Modal */}
            <EditStudentModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSubmit={handleUpdateStudent}
                student={selectedStudent}
            />

            {/* Student Details Modal */}
            <StudentDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                studentId={selectedStudentId}
                onMessage={handleMessageFromDetails}
            />
        </div>
    );
});

AdminStudents.displayName = 'AdminStudents';

export default AdminStudents;
