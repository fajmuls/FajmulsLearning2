import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Settings, Volume2, VolumeX, Bell, BellOff, CheckCircle, 
    XCircle, Music, Moon, Sun, Sparkles, Layout, Monitor, 
    Type, Palette, Bot, Timer, Check
} from 'lucide-react';
import { AppSettings, UserProfile, AppFontSize, AppPattern, AppUiPreset } from '../types';
import { SoundManager } from '../services/soundService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdate: (s: AppSettings) => void;
    userProfile: UserProfile | null;
    onUpdateProfile: (data: { username?: string, photoURL?: string }) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate, userProfile, onUpdateProfile }) => {
    const [activeTab, setActiveTab] = useState<'display' | 'system'>('display');

    if (!isOpen) return null;

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

    const PRESET_COLORS = [
        { id: 'white', label: 'Putih', color: '#ffffff' },
        { id: 'gray', label: 'Abu', color: '#cbd5e1' },
        { id: 'mint', label: 'Mint', color: '#6ee7b7' },
        { id: 'cream', label: 'Cream', color: '#fcd34d' },
        { id: 'blue', label: 'Biru', color: '#93c5fd' },
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
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { SoundManager.play('back'); onClose(); }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                    className="settings-modal relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-full sm:max-w-[340px] max-h-[82vh] rounded-[2.5rem] shadow-2xl flex flex-col border border-slate-200/50 dark:border-slate-800/50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-5 pt-5 pb-1 flex justify-between items-center mb-3">
                        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                <Settings className="text-indigo-500" size={16} />
                            </div>
                            Pengaturan
                        </h2>
                        <button 
                            onClick={() => { SoundManager.play('back'); onClose(); }}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-5 mb-3">
                        <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
                            <button 
                                onClick={() => { SoundManager.play('tap'); setActiveTab('display'); }}
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'display' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                            >
                                <Layout size={11} /> Tampilan
                            </button>
                            <button 
                                onClick={() => { SoundManager.play('tap'); setActiveTab('system'); }}
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'system' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                            >
                                <Monitor size={11} /> Sistem
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-5 py-1 scrollbar-hide space-y-4">
                        {activeTab === 'display' ? (
                            <motion.div 
                                key="display"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 pb-4"
                            >
                                {/* Preset Themes */}
                                <section>
                                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Preset Cepat</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[
                                            { id: 'focus', label: 'Focus', icon: <Monitor size={10}/>, color: 'bg-slate-900 text-white' },
                                            { id: 'high_contrast', label: 'Contrast', icon: <Type size={10}/>, color: 'bg-white text-slate-900 border border-slate-200' },
                                            { id: 'relaxed', label: 'Relaxed', icon: <Sparkles size={10}/>, color: 'bg-rose-50 text-rose-600' }
                                        ].map((p) => (
                                            <button 
                                                key={p.id}
                                                onClick={() => handlePresetChange(p.id as any)}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${settings.uiPreset === p.id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/30'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${p.color}`}>
                                                    {p.icon}
                                                </div>
                                                <span className={`text-[7px] font-bold ${settings.uiPreset === p.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Theme Selector */}
                                <section>
                                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Tema Dasar</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[
                                            { id: 'light', icon: Sun, label: 'Light', color: 'text-amber-500' },
                                            { id: 'dark', icon: Moon, label: 'Dark', color: 'text-indigo-400' },
                                            { id: 'fajmuls', icon: Sparkles, label: 'Fajmuls', color: 'text-cyan-500' }
                                        ].map((t) => (
                                            <button 
                                                key={t.id}
                                                onClick={() => handleThemeChange(t.id as any)}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${settings.theme === t.id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/30'}`}
                                            >
                                                <t.icon size={14} className={t.color} />
                                                <span className={`text-[8px] font-bold ${settings.theme === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Background Colors */}
                                <section>
                                    <div className="flex justify-between items-center mb-1.5 px-1">
                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Warna Aksen</label>
                                        <div className="relative w-4 h-4 rounded-full overflow-hidden border border-slate-200 shadow-xs">
                                            <input 
                                                type="color" 
                                                value={settings.appBaseColor}
                                                onChange={(e) => handleColorChange(e.target.value)}
                                                className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer"
                                            />
                                            <Palette size={6} className="absolute inset-0 m-auto text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PRESET_COLORS.map((c) => (
                                            <button 
                                                key={c.id}
                                                onClick={() => handleColorChange(c.color)}
                                                className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center ${settings.appBaseColor === c.color ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-105' : 'border-slate-100 dark:border-slate-800 shadow-xs'}`}
                                                style={{ backgroundColor: c.color }}
                                            >
                                                {settings.appBaseColor === c.color && <Check size={10} className={c.id === 'white' || c.id === 'mint' || c.id === 'cream' ? 'text-slate-800' : 'text-white'} />}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Pattern Grid */}
                                <section>
                                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Pola Latar</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {PATTERN_OPTIONS.map((pat) => (
                                            <button 
                                                key={pat.id}
                                                onClick={() => handlePatternChange(pat.id as any)}
                                                className={`h-8 rounded-lg border overflow-hidden relative transition-all ${settings.appPattern === pat.id ? 'border-indigo-500 shadow-xs' : 'border-slate-100 dark:border-slate-800/50'}`}
                                                style={{ backgroundColor: settings.appBaseColor }}
                                            >
                                                <div className={`absolute inset-0 ${pat.css} opacity-20`} />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-[6px] font-black uppercase px-1 py-0.5 rounded bg-white/70 dark:bg-slate-900/70 shadow-xs">{pat.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Font Size */}
                                <section>
                                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Ukuran Teks</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg">
                                        {['xs', 'sm', 'md', 'lg', 'xl'].map((size) => (
                                            <button 
                                                key={size}
                                                onClick={() => handleFontSizeChange(size as any)}
                                                className={`flex-1 py-1 rounded-md text-[8px] font-black transition-all ${settings.fontSize === size ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400'}`}
                                            >
                                                {size.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="system"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 pb-4"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block px-1">Audio & Haptik</label>
                                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-100/50 dark:border-slate-800/50">
                                        <ToggleItem icon={<Volume2 size={12}/>} label="Suara Umum" checked={settings.soundEnabled} onChange={() => toggle('soundEnabled')} color="emerald" />
                                        <ToggleItem icon={<Sparkles size={12}/>} label="Suara Tombol" checked={settings.buttonSoundsEnabled !== false} onChange={() => toggle('buttonSoundsEnabled')} color="indigo" />
                                        <ToggleItem icon={<Music size={12}/>} label="Musik Latar" checked={settings.musicEnabled} onChange={() => toggle('musicEnabled')} color="pink" />
                                        <div className="p-3 bg-white/40 dark:bg-slate-800/40 border-t border-slate-100/50 dark:border-slate-800/50">
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Volume</span>
                                                <span className="text-[8px] font-black text-indigo-500">{Math.round(settings.volume * 100)}%</span>
                                            </div>
                                            <input type="range" min="0" max="1" step="0.1" value={settings.volume} onChange={handleVolumeChange} className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-indigo-500 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block px-1">Gameplay</label>
                                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-100/50 dark:border-slate-800/50">
                                        <ToggleItem icon={<CheckCircle size={12}/>} label="Auto-Lanjut" checked={settings.autoNextQuestion !== false} onChange={() => toggle('autoNextQuestion')} color="blue" />
                                        <ToggleItem icon={<Bot size={12}/>} label="AI Tutor" checked={settings.enableAITutor !== false} onChange={() => toggle('enableAITutor')} color="indigo" />
                                        <ToggleItem icon={<Timer size={12}/>} label="Timer Fokus" checked={settings.enableTimer !== false} onChange={() => toggle('enableTimer')} color="rose" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 pt-2">
                        <button 
                            onClick={() => { SoundManager.play('back'); onClose(); }}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            Tutup
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const ToggleItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    checked: boolean; 
    onChange: () => void;
    color: string;
}> = ({ icon, label, checked, onChange, color }) => {
    const colorClasses: any = {
        emerald: checked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400',
        indigo: checked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400',
        pink: checked ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-400',
        orange: checked ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400',
        blue: checked ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400',
        rose: checked ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400',
        amber: checked ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400',
    };

    return (
        <div 
            onClick={onChange}
            className="flex items-center justify-between p-3 px-4 hover:bg-white dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
        >
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-all group-active:scale-90 ${colorClasses[color]}`}>
                    {icon}
                </div>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200">{label}</span>
            </div>
            <div className={`w-8 h-4.5 rounded-full relative transition-all duration-300 ${checked ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <motion.div 
                    animate={{ x: checked ? 14 : 2 }}
                    className="absolute top-0.5 left-0 w-3.5 h-3.5 bg-white rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
        </div>
    );
};
