import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallBanner: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);

    useEffect(() => {
        // Check if already installed / standalone
        const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        setIsStandalone(isAppStandalone);

        if (isAppStandalone) return;

        // Check if user previously dismissed today
        const dismissedTimestamp = localStorage.getItem('fajmuls_pwa_banner_dismissed');
        if (dismissedTimestamp) {
            const diffHours = (Date.now() - parseInt(dismissedTimestamp, 10)) / (1000 * 60 * 60);
            if (diffHours < 24) {
                setIsDismissed(true);
            }
        }

        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsDismissed(true);
            }
            setDeferredPrompt(null);
        } else if (isIOS) {
            setShowIosGuide(true);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('fajmuls_pwa_banner_dismissed', Date.now().toString());
    };

    // Don't show if standalone or dismissed or (not iOS and no prompt available)
    if (isStandalone || isDismissed) return null;
    if (!deferredPrompt && !isIOS) return null;

    return (
        <>
            <div 
                id="pwa-install-banner"
                className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/60 p-3 sm:p-4 animate-slide-up flex items-center gap-3 backdrop-blur-md bg-white/95 dark:bg-slate-800/95"
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                    <Smartphone size={20} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">Pasang Aplikasi Fajmuls</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                            <Sparkles size={8} /> PWA
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Akses lebih cepat & offline di layar utama HP Anda.
                    </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        id="btn-pwa-install"
                        onClick={handleInstallClick}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
                    >
                        <Download size={13} />
                        <span>Pasang</span>
                    </button>
                    <button
                        id="btn-pwa-dismiss"
                        onClick={handleDismiss}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="Tutup banner"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* iOS Installation Guide Modal */}
            {showIosGuide && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                <Smartphone size={16} className="text-indigo-600" />
                                Cara Pasang di iPhone / iPad
                            </h4>
                            <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-4 list-decimal pl-4">
                            <li>Buka browser Safari di perangkat iOS Anda.</li>
                            <li>Ketuk tombol <strong className="text-indigo-600 dark:text-indigo-400">Bagikan (Share icon)</strong> di bagian bawah layar.</li>
                            <li>Gulir ke bawah dan pilih <strong className="text-indigo-600 dark:text-indigo-400">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
                            <li>Ketuk <strong className="text-indigo-600 dark:text-indigo-400">Tambah</strong> di pojok kanan atas.</li>
                        </ol>
                        <button
                            onClick={() => setShowIosGuide(false)}
                            className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
