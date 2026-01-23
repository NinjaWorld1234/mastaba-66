import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Loader, RefreshCw, Check, CheckCheck, Menu, X, Search } from 'lucide-react';
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
    const [running, setRunning] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadData();
        // Simple polling for new messages every 10s
        const interval = setInterval(refreshMessages, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedUser]);

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
                setSelectedUser({ id: 'SUPPORT', name: 'الدعم الفني', role: 'admin' } as any);
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
            // Silent fail on polling
        }
    };

    const sendMessage = async () => {
        if (!chatInput.trim() || (!selectedUser && isAdmin)) return;

        setSending(true);
        try {
            const receiverId = isAdmin ? selectedUser!.id : 'SUPPORT';
            const newMsg = await api.sendMessage(receiverId, chatInput);
            setMessages(prev => [...prev, newMsg]);
            setChatInput('');
            scrollToBottom();
        } catch (e) {
            toast.error('فشل إرسال الرسالة');
        } finally {
            setSending(false);
        }
    };

    // Group messages by conversation
    const getConversationMessages = () => {
        if (!isAdmin) return messages;
        if (!selectedUser) return [];
        return messages.filter(m =>
            (m.senderId === user?.id && m.receiverId === selectedUser.id) ||
            (m.receiverId === user?.id && m.senderId === selectedUser.id)
        );
    };

    // Filter and Sort Students
    const sortedStudents = React.useMemo(() => {
        let filtered = students;

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = students.filter(s => s.name.toLowerCase().includes(query) || s.email?.toLowerCase().includes(query));
        }

        // Sort: Unread > Recent > Name
        return filtered.sort((a, b) => {
            // 1. Unread Messages (High priority)
            const unreadA = messages.filter(m => m.senderId === a.id && !m.read).length;
            const unreadB = messages.filter(m => m.senderId === b.id && !m.read).length;
            if (unreadA !== unreadB) return unreadB - unreadA;

            // 2. Most Recent Message (Newest first)
            const msgsA = messages.filter(m => m.senderId === a.id || m.receiverId === a.id);
            const msgsB = messages.filter(m => m.senderId === b.id || m.receiverId === b.id);
            const lastTimeA = msgsA.length > 0 ? new Date(msgsA[msgsA.length - 1].timestamp).getTime() : 0;
            const lastTimeB = msgsB.length > 0 ? new Date(msgsB[msgsB.length - 1].timestamp).getTime() : 0;

            return lastTimeB - lastTimeA;
        });
    }, [students, messages, searchQuery]);

    if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-white" /></div>;

    return (
        <div className="flex h-[calc(100vh-100px)] glass-panel overflow-hidden rounded-2xl border border-white/10 relative">

            {/* Sidebar (Students List) - Only for Admin */}
            {isAdmin && (
                <div className={`
            absolute md:relative z-20 w-full md:w-80 h-full bg-black/95 md:bg-transparent transition-transform duration-300 border-l border-white/5 flex flex-col
            ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
                    <div className="p-4 border-b border-white/5 bg-white/5 space-y-3">
                        <div className="flex justify-between items-center bg-transparent">
                            <h3 className="font-bold text-white">المحادثات</h3>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400"><X /></button>
                        </div>
                        {/* Search Bar */}
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
                                // Check for unread
                                const unreadCount = messages.filter(m => m.senderId === student.id && !m.read).length;
                                const lastMsg = messages.filter(m => m.senderId === student.id || m.receiverId === student.id).pop();

                                return (
                                    <button
                                        key={student.id}
                                        onClick={async () => {
                                            setSelectedUser(student);
                                            setIsMobileMenuOpen(false);
                                            // Mark all messages from this student as read
                                            if (unreadCount > 0) {
                                                try {
                                                    await api.markConversationAsRead(student.id);
                                                    // Refresh messages to reflect read status instantly?
                                                    // Actually we can just update local state if we want, or poll.
                                                    // Let's rely on poll/sending update, or refresh manually.
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
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-bounce">
                                                    {unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 text-right min-w-0">
                                            <h4 className={`text-sm font-bold truncate ${selectedUser?.id === student.id ? 'text-white' : 'text-gray-300'}`}>
                                                {student.name}
                                            </h4>
                                            {lastMsg && (
                                                <p className="text-[10px] text-gray-500 truncate mt-1">
                                                    {lastMsg.senderId === user?.id ? 'أنت: ' : ''}{lastMsg.content}
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

                {/* Simple Header */}
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
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[10px] text-emerald-400">نشط الآن</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <h3 className="font-bold text-gray-400">اختر محادثة للبدء</h3>
                        )}
                    </div>

                    <button onClick={refreshMessages} className="p-2 text-gray-400 hover:text-white transition-colors" title="تحديث">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-gradient-to-b from-transparent to-black/20">
                    {(!selectedUser && isAdmin) ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <UserIcon className="w-8 h-8" />
                            </div>
                            <p>اختر طالباً من القائمة لبدء المحادثة</p>
                        </div>
                    ) : getConversationMessages().length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                            <p>لا توجد رسائل سابقة. ابدأ المحادثة الآن!</p>
                        </div>
                    ) : (
                        getConversationMessages().map((msg, idx) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                 max-w-[75%] p-4 rounded-2xl relative group transition-all
                                 ${isMe ? 'bg-violet-600 text-white rounded-tl-sm' : 'bg-white/10 text-gray-200 rounded-tr-sm'}
                             `}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-violet-200' : 'text-gray-500'}`}>
                                            <span>{new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                            {isMe && (
                                                msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {(selectedUser || !isAdmin) && (
                    <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="اكتب رسالتك هنا..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-all font-sans"
                                disabled={sending}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!chatInput.trim() || sending}
                                className="p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-violet-600/20"
                            >
                                {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagingSystem;
