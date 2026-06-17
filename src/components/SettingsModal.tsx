
import React from 'react';
import { Settings, Volume2, VolumeX, Bell, BellOff, CheckCircle, XCircle, Music, Moon, Sun, Sparkles, Layout, Monitor, Type, Palette, Bot, Timer } from 'lucide-react';
import { AppSettings, UserProfile, AppFontSize, AppPattern } from '../types';
import { SoundManager } from '../services/soundService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdate: (s: AppSettings) => void;
    userProfile: UserProfile | null;
    onUpdateProfile: (data: { username?: string, photoURL?: string }) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate, userProfile }) => {
    if (!isOpen) return null;

    const toggle = (key: keyof AppSettings) => {
        SoundManager.play('tap');
        onUpdate({ ...settings, [key]: !settings[key] });
    };

    const handleThemeChange = (theme: 'light' | 'dark' | 'fajmuls') => {
        SoundManager.play('click');
        // If selecting Fajmuls theme, suggest a nice gradient background if not set
        let newPattern = settings.appPattern;
        if (theme === 'fajmuls' && newPattern === 'none') {
            newPattern = 'fajmuls';
        }
        onUpdate({ ...settings, theme: theme, darkMode: theme === 'dark', appPattern: newPattern }); 
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
        onUpdate({ ...settings, fontSize: size });
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...settings, volume: parseFloat(e.target.value) });
    };

    const PRESET_COLORS = [
        { id: 'white', label: 'Putih', color: '#ffffff' },
        { id: 'gray', label: 'Abu-abu', color: '#cbd5e1' }, // Fixed darker gray
        { id: 'mint', label: 'Mint', color: '#6ee7b7' }, // Fixed mint
        { id: 'cream', label: 'Cream', color: '#fcd34d' }, // Stronger cream/amber
        { id: 'blue', label: 'Biru', color: '#93c5fd' }, // Stronger blue
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

    return (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full sm:max-w-sm max-sm:rounded-t-[2rem] sm:rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-hide relative transition-all duration-300 transform">
                
                {/* Drag indicator for bottom drawer on mobile */}
                <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden"></div>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-3 sm:mb-4 sticky top-0 bg-white dark:bg-slate-800 z-10 py-1 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings size={18} className="text-slate-400"/> Pengaturan
                    </h2>
                    <button onClick={() => { SoundManager.play('back'); onClose(); }}><XCircle size={20} className="text-slate-400 hover:text-rose-500"/></button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {/* User Info (Read Only) */}
                    {userProfile && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border border-indigo-100 dark:border-indigo-800 flex items-center gap-3 sm:gap-4">
                             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold text-base sm:text-lg overflow-hidden">
                                {userProfile.photoURL ? (
                                    <img src={userProfile.photoURL} alt="Prof" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                                ) : (
                                    userProfile.username?.[0]?.toUpperCase()
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">{userProfile.username}</div>
                                <div className="text-xxs sm:text-xs text-slate-500">
                                    {userProfile.isGuest ? 'Mode Tamu' : 'Akun Terhubung'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAMPILAN SECTION */}
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Tampilan</h3>
                        
                        {/* Theme Selector */}
                        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm">
                                <Layout size={14} /> Tema Aplikasi
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                <button onClick={() => handleThemeChange('light')} className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all ${settings.theme === 'light' ? 'bg-white border-indigo-500 text-indigo-600 shadow-md' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-white'}`}><Sun size={18} className="mb-0.5"/><span className="text-xxs sm:text-xs font-bold">Light</span></button>
                                <button onClick={() => handleThemeChange('dark')} className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all ${settings.theme === 'dark' ? 'bg-slate-900 border-indigo-500 text-indigo-400 shadow-md' : 'bg-slate-100 dark:bg-slate-600 border-transparent text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-500'}`}><Moon size={18} className="mb-0.5"/><span className="text-xxs sm:text-xs font-bold">Dark</span></button>
                                <button onClick={() => handleThemeChange('fajmuls')} className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all relative overflow-hidden ${settings.theme === 'fajmuls' ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-indigo-500 text-indigo-600 shadow-md' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-white'}`}><div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-0"></div><Sparkles size={18} className="mb-0.5 relative z-10"/><span className="text-xxs sm:text-xs font-bold relative z-10">Fajmuls</span></button>
                            </div>
                        </div>

                        {/* Background Customization (Split: Color + Pattern) */}
                        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm">
                                <Monitor size={14} /> Background
                            </div>
                            
                            {/* 1. Warna Dasar (Solid Colors) */}
                            <div className="mb-3">
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Warna Dasar (Solid)</span>
                                <div className="flex flex-wrap gap-2.5 sm:gap-3">
                                    {PRESET_COLORS.map((c) => (
                                        <button 
                                            key={c.id}
                                            onClick={() => handleColorChange(c.color)}
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${settings.appBaseColor === c.color ? 'border-indigo-600 scale-110 ring-2 ring-indigo-200' : 'border-slate-300 dark:border-slate-600'}`}
                                            style={{ backgroundColor: c.color }}
                                            title={c.label}
                                        />
                                    ))}
                                    {/* Custom Color Picker */}
                                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform shadow-sm group">
                                        <input 
                                            type="color" 
                                            value={settings.appBaseColor}
                                            onChange={(e) => handleColorChange(e.target.value)}
                                            className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <Palette size={12} className="text-slate-500 bg-white/50 rounded-full p-0.5"/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Pola / Pattern (Overlay) */}
                            <div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Pola / Pattern Overlay</span>
                                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                    {PATTERN_OPTIONS.map((pat) => (
                                        <button 
                                            key={pat.id} 
                                            onClick={() => handlePatternChange(pat.id as AppPattern)}
                                            className={`relative overflow-hidden rounded-lg border-2 transition-all h-9 sm:h-12 flex items-center justify-center group ${settings.appPattern === pat.id ? 'border-indigo-600' : 'border-slate-200 dark:border-slate-600 hover:border-slate-400'}`}
                                            style={{ backgroundColor: settings.appBaseColor }}
                                        >
                                            {/* Preview Container */}
                                            <div className={`absolute inset-0 w-full h-full ${pat.css} opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                                            
                                            {/* Label Backdrop */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 dark:bg-black/60 backdrop-blur-sm shadow-sm ${settings.appPattern === pat.id ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {pat.label}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Font Size Selector */}
                        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm">
                                <Type size={14} /> Ukuran Font Soal
                            </div>
                            <div className="flex bg-slate-200 dark:bg-slate-600 rounded-lg p-0.5">
                                {[
                                    { id: 'xs', label: 'XS' },
                                    { id: 'sm', label: 'S' },
                                    { id: 'md', label: 'M' },
                                    { id: 'lg', label: 'L' },
                                    { id: 'xl', label: 'XL' }
                                ].map((size) => (
                                    <button 
                                        key={size.id}
                                        onClick={() => handleFontSizeChange(size.id as AppFontSize)}
                                        className={`flex-1 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all ${settings.fontSize === size.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'}`}
                                    >
                                        {size.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SUARA & LAINNYA */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Suara & Sistem</h3>

                        {/* SFX Toggle */}
                        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${settings.soundEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {settings.soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Efek Suara</span>
                            </div>
                            <input type="checkbox" className="w-4 h-4 sm:w-5 sm:h-5 accent-indigo-600" checked={settings.soundEnabled} onChange={() => toggle('soundEnabled')}/>
                        </div>

                        {/* Music Toggle */}
                        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${settings.musicEnabled ? 'bg-pink-100 text-pink-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {settings.musicEnabled ? <Music size={16}/> : <Music size={16} className="opacity-50"/>}
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Musik Latar</span>
                            </div>
                            <input type="checkbox" className="w-4 h-4 sm:w-5 sm:h-5 accent-indigo-600" checked={settings.musicEnabled} onChange={() => toggle('musicEnabled')}/>
                        </div>

                        {/* Vibration Toggle */}
                        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${settings.vibrationEnabled !== false ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <Bell size={16}/>
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Getaran (Haptic)</span>
                            </div>
                            <input type="checkbox" className="w-4 h-4 sm:w-5 sm:h-5 accent-indigo-600" checked={settings.vibrationEnabled !== false} onChange={() => toggle('vibrationEnabled')}/>
                        </div>

                        {/* Volume Slider */}
                        <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex justify-between mb-2">
                                <span className="text-xxs sm:text-xs font-bold text-slate-500 uppercase">Volume</span>
                                <span className="text-xxs sm:text-xs font-bold text-indigo-600">{Math.round(settings.volume * 100)}%</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.1" value={settings.volume} onChange={handleVolumeChange} className="w-full h-1.5 sm:h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-600 accent-indigo-600" />
                        </div>

                        {/* Notifications */}
                        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${settings.funnyNotifications ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {settings.funnyNotifications ? <Bell size={16}/> : <BellOff size={16}/>}
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Notifikasi Lucu</span>
                            </div>
                            <input type="checkbox" className="w-4 h-4 sm:w-5 sm:h-5 accent-indigo-600" checked={settings.funnyNotifications} onChange={() => toggle('funnyNotifications')}/>
                        </div>

                        {/* Auto-Next Feature */}
                        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${settings.autoNextQuestion !== false ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <CheckCircle size={16}/>
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Otomatis Lanjut Soal</span>
                            </div>
                            <input type="checkbox" className="w-4 h-4 sm:w-5 sm:h-5 accent-indigo-600" checked={settings.autoNextQuestion !== false} onChange={() => toggle('autoNextQuestion')}/>
                        </div>

                        {/* AI Tutor Toggle */}
                        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${settings.enableAITutor !== false ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <Bot size={16}/>
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">AI Tutor Badge</span>
                            </div>
                            <input type="checkbox" className="w-4 h-4 sm:w-5 sm:h-5 accent-indigo-600" checked={settings.enableAITutor !== false} onChange={() => toggle('enableAITutor')}/>
                        </div>

                        {/* Pomodoro Timer Toggle */}
                        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${settings.enableTimer !== false ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <Timer size={16}/>
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Mode Timer (Fokus)</span>
                            </div>
                            <input type="checkbox" className="w-4 h-4 sm:w-5 sm:h-5 accent-indigo-600" checked={settings.enableTimer !== false} onChange={() => toggle('enableTimer')}/>
                        </div>

                        {/* Confirm Actions */}
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${settings.confirmActions ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <CheckCircle size={18}/>
                                </div>
                                <span className="font-bold text-sm text-slate-800 dark:text-white">Konfirmasi Aksi</span>
                            </div>
                            <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={settings.confirmActions} onChange={() => toggle('confirmActions')}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
