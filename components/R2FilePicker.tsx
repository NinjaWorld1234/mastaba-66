import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Video, Music, Loader2, CheckCircle2, FileVideo, Clock, HardDrive, RefreshCw, Folder, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface R2File {
    id: string;
    name: string;
    fullName: string;
    size: number;
    lastModified: string;
    url: string;
}

interface R2Folder {
    name: string;
    path: string;
}

interface R2FilePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    onSelectMultiple?: (urls: string[]) => void;
    multiSelect?: boolean;
}

const R2FilePicker: React.FC<R2FilePickerProps> = ({ isOpen, onClose, onSelect, onSelectMultiple, multiSelect = false }) => {
    const { t } = useLanguage();
    const [files, setFiles] = useState<R2File[]>([]);
    const [folders, setFolders] = useState<R2Folder[]>([]);
    const [currentPrefix, setCurrentPrefix] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

    const fetchFiles = useCallback(async (prefix: string = currentPrefix) => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('mastaba_currentUser')
                ? JSON.parse(localStorage.getItem('mastaba_currentUser')!).access_token
                : null;

            const url = `/api/r2/files?prefix=${encodeURIComponent(prefix)}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                let errorMessage = 'Failed to fetch files';
                try {
                    const data = JSON.parse(text);
                    errorMessage = data.error || data.details || errorMessage;
                } catch (e) {
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setFiles(data.files || []);
            setFolders(data.folders || []);
            setCurrentPrefix(data.prefix || '');
        } catch (err: any) {
            console.error('Error fetching R2 files:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentPrefix]);

    useEffect(() => {
        if (isOpen) {
            fetchFiles('');
        }
    }, [isOpen]);

    const handleFolderClick = (path: string) => {
        fetchFiles(path);
    };

    const handleGoUp = () => {
        if (!currentPrefix) return;
        const parts = currentPrefix.split('/').filter(Boolean);
        parts.pop();
        const newPrefix = parts.length > 0 ? parts.join('/') + '/' : '';
        fetchFiles(newPrefix);
    };

    const handleSelectFolderItems = () => {
        const folderUrls = filteredFiles.map(f => f.url);
        if (selectedUrls.size === folderUrls.length) {
            // Unselect all in view
            setSelectedUrls(new Set());
        } else {
            // Select all in view
            setSelectedUrls(new Set([...Array.from(selectedUrls), ...folderUrls]));
        }
    };

    const filteredFiles = useMemo(() => {
        return files.filter(file =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [files, searchTerm]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <Video className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">متصفح ملفات R2</h3>
                            <p className="text-xs text-gray-400">تصفح المجلدات واختر المحتوى</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow-inner"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Breadcrumbs / Navigation */}
                <div className="px-6 py-3 bg-white/[0.01] border-b border-white/5 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <button
                        onClick={() => fetchFiles('')}
                        className={`text-sm ${!currentPrefix ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-white'}`}
                    >
                        الرئيسية
                    </button>
                    {currentPrefix.split('/').filter(Boolean).map((part, i, arr) => (
                        <React.Fragment key={i}>
                            <ChevronLeft className="w-4 h-4 text-gray-600 rtl:rotate-0 rotate-180" />
                            <button
                                onClick={() => fetchFiles(arr.slice(0, i + 1).join('/') + '/')}
                                className={`text-sm ${(i === arr.length - 1) ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-white'}`}
                            >
                                {part}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Sub-Header: Search & Action Buttons */}
                <div className="p-4 bg-white/[0.01] border-b border-white/5 flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="ابحث في هذا المجلد..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-11 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        {currentPrefix && (
                            <button
                                onClick={handleGoUp}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                title="المجلد السابق"
                            >
                                <ChevronRight className="w-5 h-5 rtl:rotate-0 rotate-180" />
                            </button>
                        )}
                        <button
                            onClick={() => fetchFiles()}
                            disabled={isLoading}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                            title="تحديث"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>

                        {multiSelect && files.length > 0 && (
                            <button
                                onClick={handleSelectFolderItems}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all text-sm font-bold flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{selectedUrls.size === files.length ? 'إلغاء تحديد الكل' : 'تحديد كل المجلد'}</span>
                            </button>
                        )}

                        {multiSelect && selectedUrls.size > 0 && (
                            <button
                                onClick={() => {
                                    onSelectMultiple?.(Array.from(selectedUrls));
                                    onClose();
                                }}
                                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
                            >
                                <span>إضافة {selectedUrls.size} محاضرة</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[400px]">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                            <p className="animate-pulse">جاري جلب الملفات...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                                <X className="w-8 h-8 text-red-500" />
                            </div>
                            <h4 className="text-lg font-bold text-white">خطأ في الاتصال بالسيرفر</h4>
                            <p className="text-gray-400 max-w-md">{error}</p>
                            <button onClick={() => fetchFiles()} className="mt-4 px-6 py-2 rounded-xl bg-violet-600 text-white">تحديث</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {/* Folders */}
                            {folders.map((folder, idx) => (
                                <div
                                    key={`folder-${idx}`}
                                    onClick={() => handleFolderClick(folder.path)}
                                    className="group glass-panel p-4 rounded-2xl transition-all cursor-pointer flex gap-4 border border-white/5 hover:border-violet-500/50 bg-white/[0.02]"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                                        <Folder className="w-7 h-7 text-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center">
                                        <h4 className="font-bold text-white truncate text-sm" title={folder.name}>
                                            {folder.name.split('/').filter(Boolean).pop()}
                                        </h4>
                                    </div>
                                    <div className="flex items-center text-gray-400 group-hover:text-white transition-colors">
                                        <ChevronLeft className="w-5 h-5 rtl:rotate-0 rotate-180" />
                                    </div>
                                </div>
                            ))}

                            {/* Files */}
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => {
                                        if (multiSelect) {
                                            setSelectedUrls(prev => {
                                                const next = new Set(prev);
                                                if (next.has(file.url)) next.delete(file.url);
                                                else next.add(file.url);
                                                return new Set(next);
                                            });
                                        } else {
                                            onSelect(file.url);
                                            onClose();
                                        }
                                    }}
                                    className={`group glass-panel p-4 rounded-2xl transition-all cursor-pointer flex gap-4 overflow-hidden relative border bg-white/[0.02] ${selectedUrls.has(file.url) ? 'border-violet-500 bg-violet-500/5' : 'border-white/5 hover:border-violet-500/50'}`}
                                >
                                    <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors">
                                        {file.fullName.toLowerCase().endsWith('.mp3') || file.fullName.toLowerCase().endsWith('.wav') ? (
                                            <Music className="w-7 h-7 text-violet-400" />
                                        ) : (
                                            <FileVideo className="w-7 h-7 text-violet-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-1">
                                        <h4 className="font-bold text-white truncate text-sm mb-1" title={file.name}>
                                            {file.name}
                                        </h4>
                                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatSize(file.size)}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(file.lastModified)}</span>
                                        </div>
                                    </div>
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-opacity ${selectedUrls.has(file.url) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <CheckCircle2 className={`w-6 h-6 ${selectedUrls.has(file.url) ? 'text-violet-500' : 'text-emerald-500'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 text-center bg-black/40">
                    <p className="text-[10px] text-gray-500">
                        {currentPrefix ? `المجلد الحالي: ${currentPrefix}` : 'تصفح الملفات المرفوعة على R2'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default R2FilePicker;
