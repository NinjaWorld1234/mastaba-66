import React, { useState, useEffect } from 'react';
import { Award, Download, Loader, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { Certificate, Course } from '../types';
import { useToast } from './Toast';

const StudentCertificates: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [certs, allCourses] = await Promise.all([
                api.getCertificates(),
                api.getCourses()
            ]);
            setCertificates(certs);
            setCourses(allCourses);
        } catch (e) {
            console.error(e);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (courseId: string) => {
        setGeneratingId(courseId);
        try {
            const cert = await api.generateCertificate(courseId);
            setCertificates(prev => [cert, ...prev]);
            setSelectedCert(cert);
            toast.success('تم إصدار الشهادة بنجاح');
        } catch (e: any) {
            toast.error(e.message || 'فشل إصدار الشهادة');
        } finally {
            setGeneratingId(null);
        }
    };

    const handleGenerateMaster = async () => {
        setGeneratingId('MASTER');
        try {
            const cert = await api.generateMasterCertificate();
            setCertificates(prev => [cert, ...prev]);
            setSelectedCert(cert);
            toast.success('تم إصدار الشهادة الجامعية بنجاح! 🎓');
        } catch (e: any) {
            toast.error(e.message || 'فشل إصدار الشهادة الجامعية');
        } finally {
            setGeneratingId(null);
        }
    };

    const handleDownload = () => {
        window.print();
    };

    // Calculate Eligible Courses (Completed but no certificate yet)
    const eligibleCourses = courses.filter(course => {
        const hasCert = certificates.some(c => c.courseId === course.id);
        const isCompleted = course.progress === 100; // Assuming course object has user progress mapped
        return isCompleted && !hasCert;
    });

    // Check Master Eligibility
    const completedCoursesCount = courses.filter(c => c.progress === 100).length;
    const totalCourses = courses.length;
    const isMasterEligible = totalCourses > 0 && completedCoursesCount === totalCourses;
    const hasMasterCert = certificates.some(c => c.courseId === 'MASTER_CERT');

    if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin" /></div>;

    return (
        <div className="animate-fade-in flex flex-col items-center pt-10 relative z-10 pb-20 px-4">
            <style>
                {`
                    @media print {
                        body * { visibility: hidden; }
                        #certificate-template, #certificate-template * { visibility: visible; }
                        #certificate-template {
                            position: fixed; left: 0; top: 0; width: 100%; height: 100%;
                            margin: 0; padding: 20px; background: white !important;
                            z-index: 9999; border: 10px double #d97706 !important;
                            -webkit-print-color-adjust: exact; print-color-adjust: exact;
                        }
                        .no-print { display: none !important; }
                    }
                `}
            </style>

            <div className="text-center mb-8 no-print">
                <h2 className="text-3xl font-bold text-white mb-2">الشهادات</h2>
                <p className="text-gray-300 mb-4">إدارة وعرض شهاداتك المكتسبة</p>

                <button
                    onClick={() => {
                        setSelectedCert({
                            id: 'sample',
                            studentId: user?.id || 'sample-user',
                            courseId: 'sample-course',
                            userName: user?.name || 'أحمد محمد',
                            courseTitle: 'نموذج شهادة معتمدة',
                            issueDate: new Date().toISOString().split('T')[0],
                            grade: 'Excellent',
                            code: 'SAMPLE-123456'
                        });
                    }}
                    className="text-sm text-gold-400 hover:text-gold-300 underline underline-offset-4"
                >
                    عرض نموذج للشهادة
                </button>
            </div>

            {/* List of Earned Certificates */}
            {!selectedCert && (
                <div className="w-full max-w-4xl space-y-8 no-print">

                    {/* Master Certificate Section */}
                    {!hasMasterCert && (
                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-gold-500/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center">
                                        <Award className="w-8 h-8 text-gold-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">الشهادة الجامعية الشاملة</h3>
                                        <p className="text-gray-400 text-sm mt-1">
                                            تمنح عند إتمام جميع الدورات ({completedCoursesCount}/{totalCourses})
                                        </p>
                                    </div>
                                </div>

                                {isMasterEligible ? (
                                    <button
                                        onClick={handleGenerateMaster}
                                        disabled={generatingId === 'MASTER'}
                                        className="px-6 py-2 bg-gradient-to-r from-gold-600 to-amber-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-gold-900/20 transition-all flex items-center gap-2"
                                    >
                                        {generatingId === 'MASTER' ? <Loader className="animate-spin w-5 h-5" /> : <Award className="w-5 h-5" />}
                                        <span>إصدار الشهادة</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-500 bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                                        <Lock className="w-4 h-4" />
                                        <span>غير متاح بعد</span>
                                    </div>
                                )}
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-4 w-full bg-black/30 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gold-500 transition-all duration-1000"
                                    style={{ width: `${(completedCoursesCount / totalCourses) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Eligible for Generation */}
                    {eligibleCourses.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                دورات مكتملة (جاهزة للإصدار)
                            </h3>
                            <div className="grid gap-4">
                                {eligibleCourses.map(course => (
                                    <div key={course.id} className="glass-panel p-4 flex items-center justify-between">
                                        <span className="text-white font-medium">{course.title}</span>
                                        <button
                                            onClick={() => handleGenerate(course.id)}
                                            disabled={generatingId === course.id}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                        >
                                            {generatingId === course.id ? <Loader className="animate-spin w-4 h-4" /> : 'إصدار'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Your Certificates */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold text-lg">شهاداتي ({certificates.length})</h3>
                        {certificates.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">لا توجد شهادات حتى الآن</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {certificates.map(cert => (
                                    <div
                                        key={cert.id}
                                        onClick={() => setSelectedCert(cert)}
                                        className={`glass-panel p-5 cursor-pointer hover:border-emerald-500/50 transition-all group ${cert.courseId === 'MASTER_CERT' ? 'border-gold-500/30 bg-gold-900/10' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cert.courseId === 'MASTER_CERT' ? 'bg-gold-500/20' : 'bg-emerald-500/20'}`}>
                                                <Award className={`w-6 h-6 ${cert.courseId === 'MASTER_CERT' ? 'text-gold-400' : 'text-emerald-400'}`} />
                                            </div>
                                            <div>
                                                <h4 className={`font-bold ${cert.courseId === 'MASTER_CERT' ? 'text-gold-200' : 'text-white'}`}>{cert.courseTitle}</h4>
                                                <p className="text-xs text-gray-400 mt-1">تاريخ الإصدار: {cert.issueDate}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Certificate View / Template */}
            {selectedCert && (
                <div className="animate-scale-in flex flex-col items-center w-full max-w-3xl">
                    <button
                        onClick={() => setSelectedCert(null)}
                        className="mb-4 text-gray-400 hover:text-white flex items-center gap-2 no-print self-start"
                    >
                        &larr; العودة للشهادات
                    </button>

                    <div className="glass-panel p-1 border-4 border-double border-gold-600/30 rounded-lg w-full bg-[#fffcf2] mb-8 relative group">
                        {/* Download Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 rounded-lg no-print">
                            <button
                                onClick={handleDownload}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all"
                            >
                                <Download className="w-5 h-5" />
                                <span>تحميل PDF</span>
                            </button>
                        </div>

                        <div id="certificate-template" className={`border border-gray-300 p-10 flex flex-col items-center text-center relative overflow-hidden bg-white min-h-[600px] justify-center ${selectedCert.courseId === 'MASTER_CERT' ? 'bg-amber-50/50' : ''}`}>
                            {/* Decorative Corners */}
                            <div className="absolute top-0 left-0 w-24 h-24 border-t-8 border-l-8 border-emerald-900 opacity-80"></div>
                            <div className="absolute top-0 right-0 w-24 h-24 border-t-8 border-r-8 border-emerald-900 opacity-80"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-8 border-l-8 border-emerald-900 opacity-80"></div>
                            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-8 border-r-8 border-emerald-900 opacity-80"></div>

                            <div className="w-20 h-20 mb-6 text-emerald-800">
                                <Award className="w-full h-full" />
                            </div>

                            <h2 className="text-5xl font-serif text-emerald-950 font-bold mb-4 tracking-wide">
                                {selectedCert.courseId === 'MASTER_CERT' ? 'الشهادة الجامعية' : 'شهادة إتمام'}
                            </h2>
                            <h3 className="text-xl text-gold-600 font-medium mb-12">المصطبة العلمية</h3>

                            <p className="text-gray-600 mb-4 text-lg">تشهد إدارة المنصة بأن</p>
                            <h1 className="text-4xl font-bold text-emerald-950 mb-6 underline decoration-gold-400 decoration-2 underline-offset-8 px-8 py-2">
                                {selectedCert.userName}
                            </h1>
                            <p className="text-gray-700 mb-12 max-w-lg leading-loose text-lg">
                                {selectedCert.courseId === 'MASTER_CERT' ? (
                                    <>
                                        قد أتم بنجاح <span className="font-bold text-emerald-900">كافة الدورات التأسيسية</span> المقررة في المنهج العلمي وحاز على تقدير
                                    </>
                                ) : (
                                    <>
                                        قد أتم بنجاح دورة <span className="font-bold text-emerald-900">"{selectedCert.courseTitle}"</span> وحقق متطلبات الاجتياز بتقدير
                                    </>
                                )}
                                <br />
                                <span className="font-bold text-gold-600 text-xl mt-2 inline-block">{selectedCert.grade === 'Distinction' ? 'امتياز مع مرتبة الشرف' : 'ممتاز'}</span>
                            </p>

                            <div className="flex justify-between w-full mt-auto px-16 items-end pb-10">
                                <div className="text-center">
                                    <div className="h-10 w-40 border-b-2 border-emerald-900/30 mb-2 font-handwriting text-emerald-900 text-2xl" dir="ltr">Ahmed Ali</div>
                                    <p className="text-sm text-gray-500 font-bold">المشرف العام</p>
                                </div>

                                <div className="w-32 h-32 relative mx-8">
                                    <div className="absolute inset-0 border-4 border-gold-500 rounded-full flex items-center justify-center opacity-80 rotate-12 bg-white shadow-xl">
                                        <div className="w-28 h-28 bg-emerald-900 rounded-full flex flex-col items-center justify-center text-white text-center leading-tight shadow-inner border-2 border-white/20">
                                            <span className="text-[10px] opacity-70 mb-1">المصطبة العلمية</span>
                                            <span className="text-lg font-bold">معتمد</span>
                                            <span className="text-xs mt-1 font-mono">{selectedCert.issueDate.split('-')[0]}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="h-10 w-40 border-b-2 border-emerald-900/30 mb-2 font-handwriting text-emerald-900 text-xl font-bold">System Admin</div>
                                    <p className="text-sm text-gray-500 font-bold">إدارة المنصة</p>
                                </div>
                            </div>

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-mono tracking-widest">
                                ID: {selectedCert.code}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default StudentCertificates;
