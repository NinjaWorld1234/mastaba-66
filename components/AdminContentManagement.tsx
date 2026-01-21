import React, { useState, useRef } from 'react';
import { Upload, FileText, Folder, Image, Video, Music, Trash2, Edit, Download, Search, Grid, List, MoreVertical, X } from 'lucide-react';

const AdminContentManagement: React.FC = () => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [files, setFiles] = useState([
        { id: 1, name: 'ملخص_التجويد.pdf', type: 'document', size: '2.4 MB', date: '2024-06-01', folder: 'مستندات' },
        { id: 2, name: 'مقدمة_الدورة.mp4', type: 'video', size: '45 MB', date: '2024-05-28', folder: 'فيديوهات' },
        { id: 3, name: 'درس_01.mp3', type: 'audio', size: '12 MB', date: '2024-05-25', folder: 'صوتيات' },
        { id: 4, name: 'غلاف_الدورة.png', type: 'image', size: '500 KB', date: '2024-05-20', folder: 'صور' },
        { id: 5, name: 'جدول_الحفظ.xlsx', type: 'document', size: '150 KB', date: '2024-05-15', folder: 'مستندات' },
        { id: 6, name: 'درس_02.mp3', type: 'audio', size: '15 MB', date: '2024-05-10', folder: 'صوتيات' },
    ]);

    const folders = [
        { name: 'مستندات', count: files.filter(f => f.folder === 'مستندات').length, icon: FileText, color: 'from-blue-500 to-cyan-600' },
        { name: 'فيديوهات', count: files.filter(f => f.folder === 'فيديوهات').length, icon: Video, color: 'from-red-500 to-pink-600' },
        { name: 'صوتيات', count: files.filter(f => f.folder === 'صوتيات').length, icon: Music, color: 'from-violet-500 to-purple-600' },
        { name: 'صور', count: files.filter(f => f.folder === 'صور').length, icon: Image, color: 'from-amber-500 to-orange-600' },
    ];

    const typeIcons: Record<string, React.ElementType> = { document: FileText, video: Video, audio: Music, image: Image };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const newFile = {
                id: Date.now(),
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' :
                        file.type.startsWith('audio/') ? 'audio' : 'document',
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                date: new Date().toISOString().split('T')[0],
                folder: 'مستندات' // Default folder
            };
            setFiles([newFile, ...files]);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
            setFiles(files.filter(f => f.id !== id));
        }
    };

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">إدارة المحتوى</h2>
                    <p className="text-gray-300">رفع وإدارة الملفات والمرفقات</p>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                    <Upload className="w-5 h-5" />
                    <span>رفع ملف</span>
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {folders.map((folder, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl cursor-pointer hover:border-emerald-500/50 transition-all">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${folder.color} flex items-center justify-center mb-3`}>
                            <folder.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold">{folder.name}</h3>
                        <p className="text-gray-400 text-sm">{folder.count} ملف</p>
                    </div>
                ))}
            </div>

            <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative w-full md:w-auto">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pr-10 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="flex bg-white/5 rounded-xl p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}><Grid className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}><List className="w-5 h-5" /></button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredFiles.map((file) => {
                        const Icon = typeIcons[file.type] || FileText;
                        return (
                            <div key={file.id} className="glass-panel p-4 rounded-2xl hover:border-emerald-500/50 transition-all group relative">
                                <div className="w-full h-24 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                                    <Icon className="w-12 h-12 text-gray-400" />
                                </div>
                                <h4 className="text-white font-medium text-sm truncate" title={file.name}>{file.name}</h4>
                                <p className="text-gray-400 text-xs">{file.size} • {file.date}</p>
                                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded-lg backdrop-blur-sm">
                                    <button className="p-1.5 rounded-lg hover:bg-white/20 text-gray-300 hover:text-white"><Download className="w-4 h-4" /></button>
                                    <button className="p-1.5 rounded-lg hover:bg-white/20 text-gray-300 hover:text-white"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(file.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="text-right py-3 px-4 text-gray-300 font-medium">الملف</th>
                                <th className="text-right py-3 px-4 text-gray-300 font-medium">الحجم</th>
                                <th className="text-right py-3 px-4 text-gray-300 font-medium">التاريخ</th>
                                <th className="text-right py-3 px-4 text-gray-300 font-medium">المجلد</th>
                                <th className="text-right py-3 px-4 text-gray-300 font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.map((file) => {
                                const Icon = typeIcons[file.type] || FileText;
                                return (
                                    <tr key={file.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4"><div className="flex items-center gap-3"><Icon className="w-5 h-5 text-gray-400" /><span className="text-white">{file.name}</span></div></td>
                                        <td className="py-3 px-4 text-gray-400">{file.size}</td>
                                        <td className="py-3 px-4 text-gray-400">{file.date}</td>
                                        <td className="py-3 px-4 text-gray-400">{file.folder}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDelete(file.id)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 mx-auto">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminContentManagement;
