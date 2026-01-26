import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Loader, RefreshCw, Check, CheckCheck, Menu, X, Search, Mic, Paperclip, File as FileIcon, Image as ImageIcon, Trash2, StopCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { Message, User } from '../types';
import { useToast } from './Toast';

interface MessagingSystemProps {
    initialSelectedUserId?: string | null;
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ initialSelectedUserId }) => {
    const { user } = useAuth();
    const toast = useToast();

    const [messages, setMessages] = useState<Message[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    // Attachment State
    const [attachment, setAttachment] = useState<File | null>(null);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadData();
        const interval = setInterval(refreshMessages, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedUser, attachment, isRecording]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                const [msgs, stus] = await Promise.all([
                    api.getMessages(),
                    api.getStudents()
                ]);
                setMessages(msgs);
                setStudents(stus);

                if (initialSelectedUserId) {
                    const target = stus.find(s => s.id === initialSelectedUserId);
                    if (target) setSelectedUser(target);
                }
            } else {
                const msgs = await api.getMessages();
                setMessages(msgs);
                // Student chats with "Support" (Admin)
                setSelectedUser({ id: '2', name: 'الدعم الفني', role: 'admin' } as any);
            }
        } catch (e) {
            console.error(e);
            toast.error('فشل تحميل الرسائل');
        } finally {
            setLoading(false);
        }
    };

    const refreshMessages = async () => {
        try {
            const msgs = await api.getMessages();
            setMessages(msgs);
        } catch (e) {
            // Silent fail
        }
    };

    // --- Voice Recording Logic ---

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], "voice-note.webm", { type: 'audio/webm' });

                setAttachment(file);
                const url = URL.createObjectURL(blob);
                setAudioPreviewUrl(url); // For playback before sending

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            // Start Timer
            timerIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (e) {
            console.error(e);
            toast.error('لا يمكن الوصول للميكروفون');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        stopRecording();
        setAttachment(null);
        setAudioPreviewUrl(null);
        setRecordingDuration(0);
    };

    // Format seconds to MM:SS
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- File Handling ---

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];

            // Limit to 5MB (5 * 1024 * 1024 bytes)
            const MAX_SIZE = 5 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                setLocalError(`نعتذر منك، لا يمكننا إرسال ملفات أكبر من 5 ميجابايت. حجم ملفك الحالي هو ${(file.size / (1024 * 1024)).toFixed(2)} ميجابايت.`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            setLocalError(null);
            setAttachment(file);
            setAudioPreviewUrl(null); // Clear any voice note preview
        }
    };

    const handleRemoveAttachment = () => {
        setAttachment(null);
        setAudioPreviewUrl(null);
        setLocalError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Sending Logic ---

    const sendMessage = async () => {
        if ((!chatInput.trim() && !attachment) || (!selectedUser && isAdmin)) return;

        setSending(true);
        try {
            const receiverId = isAdmin ? selectedUser!.id : '2';
            let attachmentUrl = undefined;
            let attachmentType = undefined;

            if (attachment) {
                // Determine Type
                attachmentType = attachment.type.startsWith('image/') ? 'image' :
                    attachment.type.startsWith('audio/') ? 'audio' : 'file';

                console.log('Sending file to proxy upload (Base64):', attachment.name);

                // Radical Fix: Convert to Base64 
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(attachment);
                });

                const res = await fetch('/api/social/upload-proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user?.access_token || localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        fileName: attachment.name,
                        fileType: attachment.type,
                        base64Data: base64Data
                    })
                });

                if (!res.ok) throw new Error('فشل رفع الملف عبر الخادم');
                const { publicUrl } = await res.json();

                attachmentUrl = publicUrl;
                console.log('Proxy upload (Base64) successful. URL:', publicUrl);
            }

            // 3. Send Message to Backend (Original message API)
            const newMsg = await api.sendMessage(receiverId, chatInput, attachmentUrl, attachmentType, attachment?.name);
            setMessages(prev => [...prev, newMsg]);

            // Reset State
            setChatInput('');
            handleRemoveAttachment();
            scrollToBottom();

        } catch (e) {
            console.error(e);
            toast.error('فشل إرسال الرسالة');
        } finally {
            setSending(false);
        }
    };

    // --- Rendering Helpers ---

    const renderAttachment = (msg: Message) => {
        if (!msg.attachmentUrl) return null;

        // Use the stored attachmentName, or fallback to a cleaner split if it's missing (for old messages)
        // Improved logic to strip EVERYTHING after '?' and everything before 'uploads/' 
        let fileName = msg.attachmentName;
        if (!fileName) {
            try {
                const urlObj = new URL(msg.attachmentUrl);
                const pathParts = urlObj.pathname.split('/');
                const rawName = pathParts[pathParts.length - 1];
                // Strip the timestamp prefix (e.g., 123456789-)
                fileName = rawName.split('-').slice(1).join('-') || rawName;
            } catch (e) {
                fileName = 'ملف مرفق';
            }
        }

        if (msg.attachmentType === 'image') {
            return (
                <div className="mt-3 group relative">
                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-white/10 hover:border-violet-500/50 transition-all shadow-lg">
                        <img src={msg.attachmentUrl} alt="attachment" className="w-full max-w-[300px] object-contain group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {fileName}
                        </div>
                    </a>
                </div>
            );
        }

        if (msg.attachmentType === 'audio') {
            return (
                <div className="mt-3 bg-white/5 rounded-xl border border-white/10 p-3 space-y-2 max-w-[280px]">
                    <div className="flex items-center gap-2 text-[10px] text-violet-300 font-bold mb-1">
                        <Mic className="w-3 h-3" />
                        <span>تسجيل صوتي</span>
                    </div>
                    <audio controls src={msg.attachmentUrl} className="w-full h-10 custom-audio-mini" />
                </div>
            );
        }

        // Generic File Card (Matching User Screenshot Layout)
        return (
            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 mt-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group overflow-hidden min-w-[240px]">

                {/* Left: Paperclip */}
                <Paperclip className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors shrink-0" />

                {/* Center: Text Details */}
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                    <div className="text-sm font-bold text-white truncate w-full" dir="ltr">{fileName}</div>
                    <div className="text-[10px] text-white/60 mt-1 flex items-center gap-1">
                        <span>ملف</span>
                        <span className="uppercase">{(msg.attachmentUrl.split('?')[0].split('.').pop() || 'PDF')}</span>
                    </div>
                </div>

                {/* Right: File Icon square */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors shrink-0">
                    <FileIcon className="w-6 h-6 text-white/80" />
                </div>
            </a>
        );
    };

    // --- Helper Functions for Sorting ---
    const getConversationMessages = () => {
        if (!isAdmin) return messages;
        if (!selectedUser) return [];
        return messages.filter(m =>
            (m.senderId === user?.id && m.receiverId === selectedUser.id) ||
            (m.receiverId === user?.id && m.senderId === selectedUser.id)
        );
    };

    const sortedStudents = React.useMemo(() => {
        let filtered = students;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = students.filter(s => s.name.toLowerCase().includes(query) || s.email?.toLowerCase().includes(query));
        }
        return filtered.sort((a, b) => {
            const unreadA = messages.filter(m => m.senderId === a.id && !m.read).length;
            const unreadB = messages.filter(m => m.senderId === b.id && !m.read).length;
            if (unreadA !== unreadB) return unreadB - unreadA;
            const msgsA = messages.filter(m => m.senderId === a.id || m.receiverId === a.id);
            const msgsB = messages.filter(m => m.senderId === b.id || m.receiverId === b.id);
            const lastTimeA = msgsA.length > 0 ? new Date(msgsA[msgsA.length - 1].timestamp).getTime() : 0;
            const lastTimeB = msgsB.length > 0 ? new Date(msgsB[msgsB.length - 1].timestamp).getTime() : 0;
            return lastTimeB - lastTimeA;
        });
    }, [students, messages, searchQuery]);

    useEffect(() => {
        if (isAdmin && !selectedUser && sortedStudents.length > 0 && !isMobileMenuOpen && !loading) {
            const firstUnread = sortedStudents.find(s => messages.some(m => m.senderId === s.id && !m.read));
            if (firstUnread) setSelectedUser(firstUnread);
            else setSelectedUser(sortedStudents[0]);
        }
    }, [isAdmin, sortedStudents, loading]);


    if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-white" /></div>;

    return (
        <div className="flex h-full glass-panel overflow-hidden rounded-2xl border border-white/10 relative">

            {/* Sidebar (Students) */}
            {isAdmin && (
                <div className={`
                    absolute md:relative z-20 w-full md:w-80 h-full bg-black/95 md:bg-transparent transition-transform duration-300 border-l border-white/5 flex flex-col
                    ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>
                    <div className="p-4 border-b border-white/5 bg-white/5 space-y-3">
                        <div className="flex justify-between items-center bg-transparent">
                            <h3 className="font-bold text-white">المحادثات</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                                    {sortedStudents.reduce((acc, s) => acc + messages.filter(m => m.senderId === s.id && !m.read).length, 0)} غير مقروء
                                </span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400"><X /></button>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="بحث عن طالب..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 pr-8"
                            />
                            <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-500" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {sortedStudents.length === 0 ? (
                            <p className="text-gray-500 text-center py-4 text-sm">لا يوجد طلاب</p>
                        ) : (
                            sortedStudents.map(student => {
                                const unreadCount = messages.filter(m => m.senderId === student.id && !m.read).length;
                                const lastMsg = messages.filter(m => m.senderId === student.id || m.receiverId === student.id).pop();
                                return (
                                    <button
                                        key={student.id}
                                        onClick={async () => {
                                            setSelectedUser(student);
                                            setIsMobileMenuOpen(false);
                                            if (unreadCount > 0) {
                                                try {
                                                    await api.markConversationAsRead(student.id);
                                                    refreshMessages();
                                                } catch (e) {
                                                    console.error("Failed to mark read", e);
                                                }
                                            }
                                        }}
                                        className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedUser?.id === student.id ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="relative">
                                            {student.avatar ? (
                                                <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                    <UserIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            {unreadCount > 0 && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse shadow-lg shadow-red-500/40">
                                                    {unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 text-right min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h4 className={`text-sm font-bold truncate ${selectedUser?.id === student.id ? 'text-white' : 'text-gray-300'}`}>
                                                    {student.name}
                                                </h4>
                                                {lastMsg && <span className="text-[9px] text-gray-600">{new Date(lastMsg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </div>
                                            {lastMsg && (
                                                <p className={`text-[10px] truncate mt-1 flex items-center gap-1 ${unreadCount > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                                                    {lastMsg.senderId === user?.id ? 'أنت: ' : ''}
                                                    {lastMsg.attachmentType === 'audio' ? '🎤 تسجيل صوتي' :
                                                        lastMsg.attachmentType === 'image' ? '📷 صورة' :
                                                            lastMsg.attachmentType ? '📎 ملف' :
                                                                lastMsg.content}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-black/20 relative">

                {/* Header */}
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg bg-white/5 text-gray-300">
                                <Menu className="w-5 h-5" />
                            </button>
                        )}
                        {selectedUser ? (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                                    {selectedUser.avatar ? (
                                        <img src={selectedUser.avatar} className="w-full h-full rounded-full object-cover" />
                                    ) : (isAdmin ? <UserIcon className="w-5 h-5 text-violet-300" /> : <div className="text-xl">🎓</div>)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{selectedUser.name}</h3>
                                    <span className="text-[10px] text-emerald-400">نشط الآن</span>
                                </div>
                            </div>
                        ) : (
                            <h3 className="font-bold text-gray-400">اختر محادثة</h3>
                        )}
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-gradient-to-b from-transparent to-black/20">
                    {getConversationMessages().map((msg, idx) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-4 rounded-2xl relative group ${isMe ? 'bg-violet-600 text-white rounded-tl-sm' : 'bg-white/10 text-gray-200 rounded-tr-sm'}`}>
                                    {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                    {renderAttachment(msg)}
                                    <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-violet-200' : 'text-gray-500'}`}>
                                        <span>{new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isMe && (msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {(selectedUser || !isAdmin) && (
                    <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-sm relative">

                        {/* 0. Local Error Message (Inline) */}
                        {localError && (
                            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="p-1 bg-red-500/20 rounded-full">!</span>
                                <span>{localError}</span>
                                <button onClick={() => setLocalError(null)} className="mr-auto opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                            </div>
                        )}

                        {/* 1. Recording Mode UI */}
                        {isRecording ? (
                            <div className="flex items-center gap-4 bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-pulse">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                <span className="text-red-400 font-mono font-bold text-lg">{formatDuration(recordingDuration)}</span>
                                <span className="text-sm text-gray-400">جاري التسجيل...</span>
                                <div className="flex-1"></div>
                                <button onClick={cancelRecording} className="p-2 text-gray-400 hover:text-white transition-colors" title="إلغاء">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button onClick={stopRecording} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20" title="إيقاف">
                                    <StopCircle className="w-6 h-6 fill-current" />
                                </button>
                            </div>
                        ) : attachment ? (
                            // 2. Attachment Preview Mode (File or Finished Recording)
                            <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 p-3 bg-violet-600/10 rounded-xl border border-violet-500/30 w-full shadow-lg backdrop-blur-md">
                                    {attachment.type.startsWith('image/') ? (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow-sm">
                                            <img src={URL.createObjectURL(attachment)} alt="preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="p-2.5 bg-violet-500/20 rounded-lg">
                                            {attachment.type.startsWith('audio/') ? <Mic className="w-5 h-5 text-violet-400" /> :
                                                <FileIcon className="w-5 h-5 text-blue-400" />}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-0.5">معاينة الملف</div>
                                        <div className="text-sm text-white font-medium truncate" dir="ltr">{attachment.name}</div>
                                        <div className="text-[10px] text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</div>
                                    </div>

                                    {/* Audio Preview Player */}
                                    {audioPreviewUrl && (
                                        <audio controls src={audioPreviewUrl} className="h-8 w-32 md:w-48 ml-2 custom-audio-mini" />
                                    )}

                                    <button onClick={handleRemoveAttachment} className="p-2 transition-colors text-gray-400 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-lg" title="إزالة">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {/* 3. Regular Input Mode (Not recording) */}
                        {!isRecording && (
                            <div className="flex items-center gap-3">
                                {/* Tools */}
                                <div className="flex gap-1">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors tooltip"
                                        title="إرفاق ملف"
                                        disabled={!!attachment} // Disable if already has attachment
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={startRecording}
                                        className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                                        title="تسجيل صوتي"
                                        disabled={!!attachment} // Disable if already has attachment
                                    >
                                        <Mic className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Text Input */}
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder={attachment ? "أضف تعليقاً..." : "اكتب رسالتك هنا..."}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-all font-sans"
                                    disabled={sending}
                                />

                                {/* Send Button */}
                                <button
                                    onClick={sendMessage}
                                    disabled={(!chatInput.trim() && !attachment) || sending}
                                    className="p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2"
                                >
                                    {sending ? <Loader className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <span className="hidden md:inline font-bold text-sm">إرسال</span>
                                            <Send className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagingSystem;
