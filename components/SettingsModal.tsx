import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings, Volume2, VolumeX, Bell, BellOff, CheckCircle, 
    XCircle, Music, Moon, Sun, Sparkles, Layout, Monitor, 
    Type, Palette, Bot, Timer, Check, Database, Download, Upload, 
    ShieldCheck, User, Clock, Flame, ChevronRight, FileText
} from 'lucide-react';
import { AppSettings, UserProfile, AppFontSize, AppPattern, AppUiPreset } from '../types';
import { SoundManager } from '../services/soundService';
import { APP_VERSION, PATCH_NOTES } from '../src/constants/version';
import { NotificationService, NotificationSettings } from '../services/notificationService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdate: (s: AppSettings) => void;
    userProfile: UserProfile | null;
    onUpdateProfile: (data: { username?: string, photoURL?: string }) => Promise<void>;
    onOpenAdminDashboard?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    settings, 
    onUpdate, 
    userProfile, 
    onOpenAdminDashboard 
}) => {
    const [activeTab, setActiveTab] = useState<'display' | 'system' | 'notes'>('display');
    const [backupStatus, setBackupStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const backupFileInputRef = useRef<HTMLInputElement>(null);

    // Notification State
    const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => NotificationService.getSettings());
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => NotificationService.getPermission());
    const [notifTestSuccess, setNotifTestSuccess] = useState<boolean | null>(null);

    useEffect(() => {
        if (isOpen) {
            setNotifPermission(NotificationService.getPermission());
            setNotifSettings(NotificationService.getSettings());
        }
    }, [isOpen]);

    const handleToggleNotification = async () => {
        SoundManager.play('click');
        if (!NotificationService.isSupported()) {
            alert("Browser Anda belum mendukung Web Notification API.");
            return;
        }

        if (!notifSettings.enabled) {
            let perm = NotificationService.getPermission();
            if (perm !== 'granted') {
                const granted = await NotificationService.requestPermission();
                setNotifPermission(NotificationService.getPermission());
                if (!granted) {
                    alert("Izin notifikasi browser belum diberikan. Silakan aktifkan izin notifikasi di setelan browser Anda.");
                    return;
                }
            }
            const updated: NotificationSettings = { ...notifSettings, enabled: true };
            setNotifSettings(updated);
            NotificationService.saveSettings(updated);
        } else {
            const updated: NotificationSettings = { ...notifSettings, enabled: false };
            setNotifSettings(updated);
            NotificationService.saveSettings(updated);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const updated: NotificationSettings = { ...notifSettings, reminderTime: e.target.value };
        setNotifSettings(updated);
        NotificationService.saveSettings(updated);
    };

    const handleTestNotification = () => {
        SoundManager.play('click');
        const success = NotificationService.sendTestNotification();
        setNotifTestSuccess(success);
        setTimeout(() => setNotifTestSuccess(null), 3000);
    };

    const handleExportFullBackup = () => {
        SoundManager.play('click');
        try {
            const guestHistory = localStorage.getItem('fajmuls_guest_history');
            const markedQuestions = localStorage.getItem('fajmuls_marked_questions');
            const gamification = localStorage.getItem('fajmuls_guest_gamification');
            const bankSoal = localStorage.getItem('fajmuls_saved_bank_soal');
            const appSettings = localStorage.getItem('fajmuls_app_settings');

            const backupPayload = {
                app: "Fajmuls Learning",
                version: APP_VERSION,
                exportedAt: new Date().toISOString(),
                user: userProfile?.username || "Fadmus",
                data: {
                    history: guestHistory ? JSON.parse(guestHistory) : [],
                    markedQuestions: markedQuestions ? JSON.parse(markedQuestions) : [],
                    gamification: gamification ? JSON.parse(gamification) : null,
                    bankSoal: bankSoal ? JSON.parse(bankSoal) : [],
                    settings: appSettings ? JSON.parse(appSettings) : settings
                }
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            const dateStr = new Date().toISOString().split('T')[0];
            downloadAnchor.setAttribute("download", `fajmuls_backup_${dateStr}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            setBackupStatus({ message: 'Backup data berhasil diunduh!', type: 'success' });
            setTimeout(() => setBackupStatus(null), 4000);
        } catch (e) {
            console.error('Export failed', e);
            setBackupStatus({ message: 'Gagal mengekspor data backup.', type: 'error' });
            setTimeout(() => setBackupStatus(null), 4000);
        }
    };

    const handleImportFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        SoundManager.play('click');
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                if (!parsed.data) {
                    throw new Error("Format file backup tidak valid.");
                }

                if (parsed.data.history) {
                    localStorage.setItem('fajmuls_guest_history', JSON.stringify(parsed.data.history));
                }
                if (parsed.data.markedQuestions) {
                    localStorage.setItem('fajmuls_marked_questions', JSON.stringify(parsed.data.markedQuestions));
                }
                if (parsed.data.gamification) {
                    localStorage.setItem('fajmuls_guest_gamification', JSON.stringify(parsed.data.gamification));
                }
                if (parsed.data.bankSoal) {
                    localStorage.setItem('fajmuls_saved_bank_soal', JSON.stringify(parsed.data.bankSoal));
                }
                if (parsed.data.settings) {
                    localStorage.setItem('fajmuls_app_settings', JSON.stringify(parsed.data.settings));
                    onUpdate(parsed.data.settings);
                }

                window.dispatchEvent(new CustomEvent('appDataRestored', { detail: parsed.data }));
                setBackupStatus({ message: 'Data backup berhasil dipulihkan!', type: 'success' });
                setTimeout(() => setBackupStatus(null), 4000);
            } catch (err: any) {
                console.error('Import failed', err);
                setBackupStatus({ message: err?.message || 'Gagal memulihkan file backup.', type: 'error' });
                setTimeout(() => setBackupStatus(null), 4000);
            }
        };
        reader.readAsText(file);
        if (backupFileInputRef.current) {
            backupFileInputRef.current.value = '';
        }
    };

    const toggle = (key: keyof AppSettings) => {
        SoundManager.play('tap');
        onUpdate({ ...settings, [key]: !settings[key] });
    };

    const handleThemeChange = (theme: 'light' | 'dark' | 'fajmuls') => {
        SoundManager.play('click');
        let newPattern = settings.appPattern;
        if (theme === 'fajmuls' && newPattern === 'none') {
            newPattern = 'fajmuls';
        }
        onUpdate({ ...settings, theme, darkMode: theme === 'dark', appPattern: newPattern }); 
    };

    const handleColorChange = (color: string) => {
        SoundManager.play('tap');
        onUpdate({ ...settings, appBaseColor: color });
    };

    const handlePatternChange = (pattern: AppPattern) => {
        SoundManager.play('click');
        onUpdate({ ...settings, appPattern: pattern });
    };

    const handleFontSizeChange = (size: AppFontSize) => {
        SoundManager.play('tap');
        onUpdate({ ...settings, fontSize: size, uiPreset: 'default' });
    };

    const handlePresetChange = (preset: AppUiPreset) => {
        SoundManager.play('click');
        let newSettings = { ...settings, uiPreset: preset };
        
        switch(preset) {
            case 'focus':
                newSettings = { 
                    ...newSettings, 
                    fontSize: 'sm', 
                    theme: 'dark', 
                    darkMode: true,
                    appPattern: 'none',
                    appBaseColor: '#0f172a'
                };
                break;
            case 'high_contrast':
                newSettings = { 
                    ...newSettings, 
                    fontSize: 'md', 
                    theme: 'light', 
                    darkMode: false,
                    appPattern: 'grid',
                    appBaseColor: '#ffffff'
                };
                break;
            case 'relaxed':
                newSettings = { 
                    ...newSettings, 
                    fontSize: 'lg', 
                    theme: 'light', 
                    darkMode: false,
                    appPattern: 'aurora',
                    appBaseColor: '#fdf4ff'
                };
                break;
            default:
                break;
        }
        onUpdate(newSettings);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...settings, volume: parseFloat(e.target.value) });
    };

    const handleTtsVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...settings, ttsVolume: parseFloat(e.target.value) });
    };

    const PRESET_COLORS = [
        { id: 'white', label: 'Putih', color: '#ffffff' },
        { id: 'gray', label: 'Slate', color: '#cbd5e1' },
        { id: 'mint', label: 'Mint', color: '#6ee7b7' },
        { id: 'cream', label: 'Cream', color: '#fcd34d' },
        { id: 'blue', label: 'Sky', color: '#93c5fd' },
        { id: 'dark', label: 'Dark', color: '#0f172a' },
    ];

    const PATTERN_OPTIONS = [
        { id: 'none', label: 'Polos', css: '' },
        { id: 'grid', label: 'Grid', css: 'bg-pattern-grid' },
        { id: 'dots', label: 'Dots', css: 'bg-pattern-dots' },
        { id: 'waves', label: 'Waves', css: 'bg-pattern-waves' },
        { id: 'aurora', label: 'Aurora', css: 'bg-pattern-aurora' },
        { id: 'fajmuls', label: 'Fajmuls', css: 'bg-pattern-fajmuls' },
    ];

    if (!isOpen) return null;

    const usernameDisplay = userProfile?.username || "Fadmus";
    const userInitial = usernameDisplay.charAt(0).toUpperCase();

    return (
        <div id="settings-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            {/* Modal Container */}
            <div 
                id="settings-modal-content"
                className="relative bg-white dark:bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100"
            >
                {/* Header with User Account Preview */}
                <div className="p-4 sm:p-5 pb-3 border-b border-slate-150 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/60">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
                                <Settings size={18} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    Pengaturan
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Kelola preferensi akun & tampilan aplikasi
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { SoundManager.play('back'); onClose(); }}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Tutup"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>

                    {/* Account Card (Fadmus / User) */}
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-500/20">
                                {userInitial}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{usernameDisplay}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                                        Akun Aktif
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <ShieldCheck size={12} className="text-emerald-500" />
                                    Tersinkronisasi & Siap Ujian
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded-lg">
                                v{APP_VERSION}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 sm:px-5 pt-3 pb-1 shrink-0">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                        <button 
                            onClick={() => { SoundManager.play('tap'); setActiveTab('display'); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'display' 
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <Layout size={14} /> Tampilan
                        </button>
                        <button 
                            onClick={() => { SoundManager.play('tap'); setActiveTab('system'); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'system' 
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <Monitor size={14} /> Sistem & Notifikasi
                        </button>
                        <button 
                            onClick={() => { SoundManager.play('tap'); setActiveTab('notes'); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'notes' 
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <FileText size={14} /> Versi
                        </button>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-4">
                    {activeTab === 'display' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Preset Cepat */}
                            <section>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                                    Preset Desain Cepat
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'focus', label: 'Fokus Malam', icon: <Monitor size={14}/>, desc: 'Dark & Polos' },
                                        { id: 'high_contrast', label: 'Kontras Tinggi', icon: <Type size={14}/>, desc: 'Grid & Tajam' },
                                        { id: 'relaxed', label: 'Relaksasi', icon: <Sparkles size={14}/>, desc: 'Aurora & Font Besar' }
                                    ].map((p) => (
                                        <button 
                                            key={p.id}
                                            onClick={() => handlePresetChange(p.id as any)}
                                            className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                                                settings.uiPreset === p.id 
                                                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-900/30 ring-2 ring-indigo-500/20' 
                                                    : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
                                                {p.icon}
                                                <span className="text-xs font-bold text-slate-800 dark:text-white">{p.label}</span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{p.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Tema Dasar */}
                            <section>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                                    Mode Tema Aplikasi
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'light', icon: Sun, label: 'Terang (Light)', color: 'text-amber-500' },
                                        { id: 'dark', icon: Moon, label: 'Gelap (Dark)', color: 'text-indigo-400' },
                                        { id: 'fajmuls', icon: Sparkles, label: 'Fajmuls Vibrant', color: 'text-cyan-500' }
                                    ].map((t) => (
                                        <button 
                                            key={t.id}
                                            onClick={() => handleThemeChange(t.id as any)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                                                settings.theme === t.id 
                                                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-900/30 ring-2 ring-indigo-500/20' 
                                                    : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <t.icon size={18} className={t.color} />
                                            <span className="text-xs font-bold text-slate-800 dark:text-white">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Warna Latar & Aksen */}
                            <section>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Warna Dasar Latar
                                    </label>
                                    <div className="relative flex items-center gap-1 text-xs text-slate-500">
                                        <span>Pilih Kustom:</span>
                                        <input 
                                            type="color" 
                                            value={settings.appBaseColor}
                                            onChange={(e) => handleColorChange(e.target.value)}
                                            className="w-6 h-6 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600"
                                            title="Pilih warna custom"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map((c) => (
                                        <button 
                                            key={c.id}
                                            onClick={() => handleColorChange(c.color)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                                                settings.appBaseColor === c.color 
                                                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 font-bold' 
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: c.color }} />
                                            <span className="text-xs">{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Pola Latar (Pattern) */}
                            <section>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                                    Pola Latar (Motif Terlihat Jelas)
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {PATTERN_OPTIONS.map((pat) => (
                                        <button 
                                            key={pat.id}
                                            onClick={() => handlePatternChange(pat.id as any)}
                                            className={`h-12 rounded-xl border overflow-hidden relative transition-all flex items-center justify-center ${
                                                settings.appPattern === pat.id 
                                                    ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                                                    : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                            style={{ backgroundColor: settings.appBaseColor }}
                                        >
                                            <div className={`absolute inset-0 ${pat.css}`} />
                                            <span className="relative z-10 text-xs font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 shadow-xs text-slate-800 dark:text-slate-200">
                                                {pat.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Ukuran Teks */}
                            <section>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                                    Ukuran Font Teks Soal & Materi
                                </label>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                                    {['xs', 'sm', 'md', 'lg', 'xl'].map((size) => (
                                        <button 
                                            key={size}
                                            onClick={() => handleFontSizeChange(size as any)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                settings.fontSize === size 
                                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                        >
                                            {size.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Push Notification Section */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Pengingat Belajar Harian (Web Notification)
                                </label>
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-2 rounded-xl ${notifSettings.enabled ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                {notifSettings.enabled ? <Bell size={18} /> : <BellOff size={18} />}
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-slate-800 dark:text-white block">
                                                    Notifikasi Pengingat Belajar
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    Kirim notifikasi harian untuk menjaga streak belajar
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleToggleNotification}
                                            className={`w-11 h-6 rounded-full transition-colors relative ${notifSettings.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifSettings.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {notifSettings.enabled && (
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Waktu Pengingat:</span>
                                                <input 
                                                    type="time" 
                                                    value={notifSettings.reminderTime} 
                                                    onChange={handleTimeChange}
                                                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-mono font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                                />
                                            </div>

                                            <button
                                                onClick={handleTestNotification}
                                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition"
                                            >
                                                Tes Notifikasi
                                            </button>
                                        </div>
                                    )}

                                    {notifTestSuccess !== null && (
                                        <div className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${notifTestSuccess ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'}`}>
                                            {notifTestSuccess ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                                            {notifTestSuccess ? 'Notifikasi berhasil dikirim!' : 'Gagal mengirim notifikasi. Periksa izin browser Anda.'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Audio & Haptik */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Audio & Efek Suara
                                </label>
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <FastToggleItem icon={<Volume2 size={16}/>} label="Suara Umum" checked={settings.soundEnabled} onChange={() => toggle('soundEnabled')} />
                                    <FastToggleItem icon={<Sparkles size={16}/>} label="Suara Tombol & Klik" checked={settings.buttonSoundsEnabled !== false} onChange={() => toggle('buttonSoundsEnabled')} />
                                    <FastToggleItem icon={<Music size={16}/>} label="Musik Latar Belajar" checked={settings.musicEnabled} onChange={() => toggle('musicEnabled')} />
                                    
                                    <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Volume Efek Suara</span>
                                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{Math.round(settings.volume * 100)}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.1" 
                                            value={settings.volume} 
                                            onChange={handleVolumeChange} 
                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-indigo-600 cursor-pointer" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Gameplay & Simulasi */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Fitur Belajar & AI Tutor
                                </label>
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <FastToggleItem icon={<CheckCircle size={16}/>} label="Auto-Lanjut Soal Berikutnya" checked={settings.autoNextQuestion !== false} onChange={() => toggle('autoNextQuestion')} />
                                    <FastToggleItem icon={<Bot size={16}/>} label="AI Tutor (Tanya Pembahasan Soal)" checked={settings.enableAITutor !== false} onChange={() => toggle('enableAITutor')} />
                                    <FastToggleItem icon={<Volume2 size={16}/>} label="Auto-Baca Soal (TTS Suara)" checked={settings.autoReadQuestion === true} onChange={() => toggle('autoReadQuestion')} />
                                    <FastToggleItem icon={<Timer size={16}/>} label="Timer & Pacing Simulasi" checked={settings.enableTimer !== false} onChange={() => toggle('enableTimer')} />
                                </div>
                            </div>

                            {/* Backup & Restore Data */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Cadangan & Pemulihan (.JSON)
                                </label>
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-3">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Simpan seluruh riwayat tryout, bank soal, dan pengaturan Anda ke file JSON offline.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={handleExportFullBackup}
                                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                                        >
                                            <Download size={14} /> Unduh Backup
                                        </button>
                                        <button
                                            onClick={() => backupFileInputRef.current?.click()}
                                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                                        >
                                            <Upload size={14} /> Pulihkan Data
                                        </button>
                                        <input 
                                            ref={backupFileInputRef} 
                                            type="file" 
                                            accept=".json" 
                                            className="hidden" 
                                            onChange={handleImportFullBackup} 
                                        />
                                    </div>
                                    {backupStatus && (
                                        <div className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${backupStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'}`}>
                                            <ShieldCheck size={14} className="shrink-0" />
                                            <span>{backupStatus.message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Admin Link if present */}
                            {onOpenAdminDashboard && (
                                <div>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onOpenAdminDashboard();
                                        }}
                                        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-2xl border border-slate-200 dark:border-slate-700 transition"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                                                <Database size={16}/>
                                            </div>
                                            <span className="text-xs font-bold text-slate-800 dark:text-white">Buka Admin Dashboard</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-400" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Versi Terpasang</span>
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs">v{APP_VERSION}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    Aplikasi diperbarui secara berkala untuk meningkatkan akurasi soal, stabilitas ujian, dan performa simulasi CAT.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Catatan Rilis (Changelog)
                                </label>
                                {PATCH_NOTES.slice(0, 3).map((patch) => (
                                    <div key={patch.version} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-slate-800 dark:text-white">Versi {patch.version}</span>
                                            <span className="text-[11px] text-slate-400 font-mono">{patch.date}</span>
                                        </div>
                                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                                            {patch.notes.map((note, idx) => (
                                                <li key={idx} className="leading-snug">{note}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                        Fajmuls Learning • v{APP_VERSION}
                    </span>
                    <button 
                        onClick={() => { SoundManager.play('back'); onClose(); }}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    );
};

// Fast Hardware-Accelerated Toggle Item without heavy Framer Motion overhead
const FastToggleItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    checked: boolean; 
    onChange: () => void;
}> = ({ icon, label, checked, onChange }) => {
    return (
        <div 
            onClick={onChange}
            className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-750/70 transition-colors cursor-pointer border-b last:border-b-0 border-slate-100 dark:border-slate-700/60"
        >
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl transition-colors ${checked ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    {icon}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
            </div>
            <button
                type="button"
                className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                tabIndex={-1}
            >
                <span 
                    className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${checked ? 'translate-x-4.5' : 'translate-x-0'}`} 
                />
            </button>
        </div>
    );
};
