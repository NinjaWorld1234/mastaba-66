import React, { useState, useEffect } from 'react';
import { X, Mail, BookOpen, Award, Activity, Calendar, MapPin, Phone } from 'lucide-react';
import { User, Course, Certificate } from '../types';
import { api } from '../services/api';

interface StudentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string | null;
    onMessage: (studentId: string) => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ isOpen, onClose, studentId, onMessage }) => {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && studentId) {
            loadDetails();
        }
    }, [isOpen, studentId]);

    const loadDetails = async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const data = await api.getUserDetails(studentId);
            setDetails(data);
        } catch (error) {
            console.error('Failed to load details', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !studentId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="glass-panel w-full max-w-4xl p-0 relative animate-fade-in rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
                    <div className="flex items-center gap-4">
                        {details?.user?.avatar && (
                            <img
                                src={details.user.avatar}
                                alt={details.user.name}
                                className="w-16 h-16 rounded-2xl border-2 border-emerald-500/50"
                            />
                        )}
                        <div>
                            <h3 className="text-2xl font-bold text-white">{details?.user?.name}</h3>
                            <p className="text-gray-400">{details?.user?.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${details?.user?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {details?.user?.status === 'active' ? 'نشط' : 'غير نشط'}
                                </span>
                                <span className="bg-white/5 px-2 py-0.5 rounded-full text-xs text-gray-300">
                                    المستوى {details?.user?.level}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onMessage(studentId)}
                            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
                            title="إرسال رسالة"
                        >
                            <Mail className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-400">جاري التحميل...</div>
                ) : (
                    <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">

                        {/* Personal Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-xs">الموقع</span>
                                </div>
                                <p className="text-white">{details?.user?.country || 'غير محدد'}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-xs">واتساب</span>
                                </div>
                                <p className="text-white" dir="ltr">{details?.user?.whatsapp || '-'}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs">تاريخ الانضمام</span>
                                </div>
                                <p className="text-white">{details?.user?.joinDate}</p>
                            </div>
                        </div>

                        {/* Enrollments */}
                        <div>
                            <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                <BookOpen className="w-5 h-5 text-emerald-400" />
                                الدورات المسجلة
                            </h4>
                            <div className="space-y-3">
                                {details?.enrollments?.length > 0 ? (
                                    details.enrollments.map((course: any, idx: number) => (
                                        <div key={idx} className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">{course.courseTitle}</p>
                                                <p className="text-xs text-gray-400">آخر دخول: {new Date(course.lastAccess).toLocaleDateString('ar-EG')}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${course.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-emerald-400">{course.progress}%</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">لا توجد دورات مسجلة</p>
                                )}
                            </div>
                        </div>

                        {/* Certificates */}
                        <div>
                            <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                <Award className="w-5 h-5 text-amber-400" />
                                الشهادات
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {details?.certificates?.length > 0 ? (
                                    details.certificates.map((cert: Certificate) => (
                                        <div key={cert.id} className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                                                <Award className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-amber-100 font-bold line-clamp-1">{cert.courseTitle}</p>
                                                <p className="text-amber-500/60 text-xs">{cert.issueDate}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="col-span-2 text-gray-500 text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">لا توجد شهادات مكتسبة</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDetailsModal;
