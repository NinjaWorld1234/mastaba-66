import React, { useState, useEffect } from 'react';
import { Award, Plus, Download, Eye, Trash2, Search, Filter, Printer, Mail, Users, CheckCircle, X, Save } from 'lucide-react';
import { api } from '../services/api';
import { Certificate } from '../types';

const AdminCertificateManagement: React.FC = () => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newCert, setNewCert] = useState<{ studentName: string, courseTitle: string, grade: string }>({
        studentName: '',
        courseTitle: '',
        grade: 'Excellent'
    });

    useEffect(() => {
        loadCertificates();
    }, []);

    const loadCertificates = () => {
        setCertificates(api.getCertificates());
    };

    const handleIssueCertificate = (e: React.FormEvent) => {
        e.preventDefault();
        api.issueCertificate({
            userId: 'manual-' + Date.now(), // Mocking user linkage
            studentId: 'manual-' + Date.now(), // Satisfy required field
            userName: newCert.studentName,
            courseId: 'manual-' + Date.now(),
            courseTitle: newCert.courseTitle,
            grade: newCert.grade
        });
        setIsModalOpen(false);
        setNewCert({ studentName: '', courseTitle: '', grade: 'Excellent' });
        loadCertificates();
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = (cert: Certificate) => {
        const text = `Certificate of Completion\n\nThis is to certify that\n${cert.userName}\n\nHas successfully completed the course\n${cert.courseTitle}\n\nGrade: ${cert.grade}\nDate: ${cert.issueDate}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificate-${cert.id}.txt`; // SVG or PDF would be better but TXT is safe simple demo
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const filteredCertificates = certificates.filter(c =>
        c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'الشهادات الصادرة', value: certificates.length.toString(), icon: Award, color: 'from-emerald-500 to-teal-600' },
        { label: 'بانتظار الإصدار', value: '0', icon: CheckCircle, color: 'from-amber-500 to-orange-600' }, // Mock
        { label: 'الطلاب المؤهلين', value: '89', icon: Users, color: 'from-blue-500 to-cyan-600' }, // Mock
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">إدارة الشهادات</h2>
                    <p className="text-gray-300">إصدار وإدارة شهادات الإتمام</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /><span>إصدار شهادة</span>
                </button>
            </div>

            {/* Stats - Hide in print */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 print:hidden">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="بحث عن شهادة..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pr-10 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 flex items-center gap-2 hover:bg-white/10">
                    <Filter className="w-4 h-4" /><span>تصفية</span>
                </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden print:bg-white print:text-black">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 print:bg-gray-100 print:text-black">
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">الطالب</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">الدورة</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">التاريخ</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">التقدير</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">الحالة</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:hidden">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCertificates.map((cert) => (
                            <tr key={cert.id} className="border-b border-white/5 hover:bg-white/5 print:border-gray-200">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold print:hidden">{cert.userName.charAt(0)}</div>
                                        <span className="text-white print:text-black">{cert.userName}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-300 print:text-black">{cert.courseTitle}</td>
                                <td className="py-4 px-6 text-gray-400 print:text-black">{cert.issueDate}</td>
                                <td className="py-4 px-6 text-emerald-400 print:text-black">{cert.grade}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 print:bg-transparent print:text-black print:p-0`}>
                                        صادرة
                                    </span>
                                </td>
                                <td className="py-4 px-6 print:hidden">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => handleDownload(cert)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"><Download className="w-4 h-4" /></button>
                                        <button onClick={handlePrint} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"><Printer className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0a1815] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute left-4 top-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-white mb-6">إصدار شهادة جديدة</h3>
                            <form onSubmit={handleIssueCertificate} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">اسم الطالب</label>
                                    <input
                                        required
                                        value={newCert.studentName}
                                        onChange={e => setNewCert({ ...newCert, studentName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="اسم الطالب كاملاً"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">اسم الدورة</label>
                                    <input
                                        required
                                        value={newCert.courseTitle}
                                        onChange={e => setNewCert({ ...newCert, courseTitle: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="مثال: فقه الطهارة"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">التقدير</label>
                                    <select
                                        value={newCert.grade}
                                        onChange={e => setNewCert({ ...newCert, grade: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="ممتاز">ممتاز</option>
                                        <option value="جيد جداً">جيد جداً</option>
                                        <option value="جيد">جيد</option>
                                        <option value="مقبول">مقبول</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2 mt-4"
                                >
                                    <Award className="w-5 h-5" />
                                    <span>إصدار الشهادة</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCertificateManagement;
