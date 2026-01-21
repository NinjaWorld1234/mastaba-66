import React, { useState } from 'react';
import { Award, Download, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

const StudentCertificates: React.FC = () => {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        // Simulate API call / generation delay
        setTimeout(() => {
            setIsGenerating(false);
            setIsGenerated(true);
        }, 2000);
    };

    const handleDownload = () => {
        window.print();
    };

    return (
        <div className="animate-fade-in flex flex-col items-center pt-10 relative z-10 pb-20">
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #certificate-template, #certificate-template * {
                            visibility: visible;
                        }
                        #certificate-template {
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            margin: 0;
                            padding: 20px;
                            background: white !important;
                            z-index: 9999;
                            border: 4px double #d97706 !important; /* Force border color */
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>
            <div className="text-center mb-8 no-print">
                <h2 className="text-3xl font-bold text-white mb-2">الشهادات</h2>
                <p className="text-gray-300">إدارة وعرض شهاداتك المكتسبة</p>
            </div>

            {!isGenerated ? (
                <div className="glass-panel p-10 rounded-2xl flex flex-col items-center text-center max-w-lg w-full no-print">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                        <Award className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">شهادة إتمام دورة "تفسير جزء عم"</h3>
                    <p className="text-gray-400 mb-8">
                        لقد أكملت جميع متطلبات الدورة بنجاح. يمكنك الآن إصدار شهادتك المعتمدة.
                    </p>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 transition-all font-bold flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isGenerating ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                <span>جارِ الإصدار...</span>
                            </>
                        ) : (
                            <>
                                <Award className="w-5 h-5" />
                                <span>إصدار الشهادة الآن</span>
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="animate-scale-in flex flex-col items-center w-full max-w-3xl">
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

                        <div id="certificate-template" className="border border-gray-300 p-10 flex flex-col items-center text-center relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
                            {/* Decorative Corners */}
                            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-emerald-800"></div>
                            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-emerald-800"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-emerald-800"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-emerald-800"></div>

                            <div className="w-16 h-16 mb-6 text-emerald-800">
                                <Award className="w-full h-full" />
                            </div>

                            <h2 className="text-4xl font-serif text-emerald-900 font-bold mb-2">شهادة إتمام</h2>
                            <h3 className="text-xl text-gold-600 font-medium mb-8">المصطبة العلمية</h3>

                            <p className="text-gray-600 mb-2">تشهد المنصة بأن</p>
                            <h1 className="text-3xl font-bold text-emerald-950 mb-4 underline decoration-gold-400 decoration-2 underline-offset-8">{user?.name || 'أحمد محمد'}</h1>
                            <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
                                قد أتم بنجاح دورة "تفسير جزء عم" وحقق متطلبات الاجتياز بتقدير ممتاز.
                            </p>

                            <div className="flex justify-between w-full mt-8 px-10">
                                <div className="text-center">
                                    <div className="h-10 w-32 border-b border-gray-400 mb-2 font-handwriting text-emerald-900 text-lg">Ahmed Ali</div>
                                    <p className="text-xs text-gray-500">توقيع المحاضر</p>
                                </div>
                                <div className="w-24 h-24 relative">
                                    <div className="absolute inset-0 border-2 border-gold-500 rounded-full flex items-center justify-center opacity-80 rotate-12">
                                        <div className="w-20 h-20 bg-emerald-900/90 rounded-full flex items-center justify-center text-white text-[10px] text-center leading-tight shadow-sm">
                                            المصطبة<br />العلمية<br />2024
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="h-10 w-32 border-b border-gray-400 mb-2 font-handwriting text-emerald-900 text-lg">Admin User</div>
                                    <p className="text-xs text-gray-500">مدير المنصة</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 no-print">
                        <button
                            onClick={handleDownload}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-colors font-bold flex items-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            <span>تحميل PDF</span>
                        </button>
                        <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <CheckCircle className="w-5 h-5" />
                            <span>تم الإصدار بنجاح</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCertificates;
