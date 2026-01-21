import React, { useRef, useState } from 'react';
import { Database, HardDrive, Cloud, Download, Upload, RefreshCw, Clock, CheckCircle, AlertTriangle, Settings, Save } from 'lucide-react';
import { api } from '../services/api';

const AdminBackupSettings: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [backups, setBackups] = useState([
        { id: 1, name: 'نسخة احتياطية كاملة', date: new Date().toLocaleDateString('en-CA') + ' 10:30', size: '2.4 MB', status: 'success', type: 'full' },
        { id: 2, name: 'نسخة تلقائية', date: new Date(Date.now() - 86400000).toLocaleDateString('en-CA') + ' 03:00', size: '1.8 MB', status: 'success', type: 'auto' },
    ]);

    const handleCreateBackup = () => {
        const backupData = api.createBackup();
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mastaba-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Mock adding to list
        const newBackup = {
            id: Date.now(),
            name: 'نسخة يدوية جديدة',
            date: new Date().toLocaleString('en-CA'),
            size: (blob.size / 1024).toFixed(2) + ' KB',
            status: 'success',
            type: 'manual'
        };
        setBackups([newBackup, ...backups]);
    };

    const handleRestoreClick = () => {
        if (confirm('تحذير: استعادة النسخة الاحتياطية ستقوم باستبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                try {
                    api.restoreBackup(content);
                    alert('تم استعادة النسخة الاحتياطية بنجاح! سيتم إعادة تحميل الصفحة.');
                    window.location.reload();
                } catch (error) {
                    alert('فشل استعادة النسخة الاحتياطية: ملف غير صالح');
                    console.error(error);
                }
            }
        };
        reader.readAsText(file);
    };

    const stats = [
        { label: 'آخر نسخة', value: backups[0]?.date || 'N/A', icon: Clock, color: 'from-emerald-500 to-teal-600' },
        { label: 'حجم التخزين', value: '15.6 MB', icon: HardDrive, color: 'from-blue-500 to-cyan-600' },
        { label: 'النسخ المحفوظة', value: backups.length.toString(), icon: Database, color: 'from-violet-500 to-purple-600' },
        { label: 'التخزين السحابي', value: 'محلي', icon: Cloud, color: 'from-amber-500 to-orange-600' },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">النسخ الاحتياطي</h2>
                    <p className="text-gray-300">إدارة النسخ الاحتياطية والاستعادة</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={handleRestoreClick}
                        className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 flex items-center gap-2"
                    >
                        <Upload className="w-5 h-5" /><span>استعادة</span>
                    </button>
                    <button
                        onClick={handleCreateBackup}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" /><span>نسخ الآن</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{stat.value}</p>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" /> إعدادات النسخ التلقائي
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div>
                                <p className="text-white font-medium">النسخ التلقائي</p>
                                <p className="text-gray-400 text-sm">نسخ احتياطي يومي الساعة 3 صباحاً</p>
                            </div>
                            <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div>
                                <p className="text-white font-medium">التخزين السحابي</p>
                                <p className="text-gray-400 text-sm">رفع تلقائي إلى السحابة</p>
                            </div>
                            <div className="w-12 h-6 bg-gray-600 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div>
                                <p className="text-white font-medium">الاحتفاظ بالنسخ</p>
                                <p className="text-gray-400 text-sm">حذف النسخ الأقدم من 30 يوم</p>
                            </div>
                            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                                <option>30 يوم</option>
                                <option>60 يوم</option>
                                <option>90 يوم</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5" /> النسخ الأخيرة
                    </h3>
                    <div className="space-y-3">
                        {backups.map((backup) => (
                            <div key={backup.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${backup.status === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                    {backup.status === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm">{backup.name}</p>
                                    <p className="text-gray-400 text-xs">{backup.date} • {backup.size}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"><Download className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBackupSettings;
