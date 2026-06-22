import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader2, Save, Trash2, Expand, Minimize2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import * as FirebaseService from '../services/firebase';

import { SimpleMarkdown } from './QuestionRenderer';

interface AiChatTutorProps {
    initialContext?: string;
    onClose?: () => void;
    userId?: string | null;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

let aiInstance: GoogleGenAI | null = null;
const getAiClient = (): GoogleGenAI => {
    if (!aiInstance) {
        const key = process.env.API_KEY || "AIzaSy-placeholder-for-compilation-only";
        aiInstance = new GoogleGenAI({ apiKey: key });
    }
    return aiInstance;
};

export const AiChatTutor: React.FC<AiChatTutorProps> = ({ initialContext, onClose, userId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialContext && messages.length === 0) {
            setMessages([
                { id: '1', role: 'user', text: `Tolong jelaskan tentang: ${initialContext}`, timestamp: Date.now() }
            ]);
            handleSendMessage(initialContext, true);
        } else if (messages.length === 0) {
            setMessages([
                { id: '1', role: 'model', text: "Halo! Saya AI Tutor dari Fajmuls Learning. Ada materi atau soal UTS/Tes yang ingin kamu tanyakan?", timestamp: Date.now() }
            ]);
        }
    }, [initialContext]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (text: string, isInitial: boolean = false) => {
        if (!text.trim()) return;

        const newUserMessage: Message = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
        
        if (!isInitial) {
            setMessages(prev => [...prev, newUserMessage]);
            setInput('');
        }
        
        setIsLoading(true);

        try {
            const chatHistory = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            
            // Build the prompt content
            let finalPrompt = text;
            if (isInitial) {
                finalPrompt = `Tolong jelaskan dengan gaya mengajar yang bersahabat, step-by-step, jangan menggurui, namun mudah dimengerti (gunakan trik/shortcut jika ada): ${text}`;
            }

            const result = await getAiClient().models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [
                    { role: 'user', parts: [{ text: "System prompt: Kamu adalah guru (Tutor) spesialis tes CPNS SKD, UTBK SNBT, dan Psikotes. Berikan penjelasan yang super jelas dan trik 'Cara Cepat'. PENTING: Gunakan format markdown yang rapi. Untuk matematika, ALWAYS gunakan LaTeX dengan delimiter \\( ... \\) untuk inline. Jangan gunakan block math $$ ... $$. Gunakan bahasa Indonesia yang bersahabat." }] },
                    ...chatHistory,
                    { role: 'user', parts: [{ text: finalPrompt }] }
                ],
                config: { temperature: 0.7 }
            });

            if (result.text) {
                const newModelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: result.text, timestamp: Date.now() };
                if (isInitial) {
                    setMessages([{ id: '1', role: 'user', text: `Tolong jelaskan tentang:\n${initialContext}`, timestamp: Date.now() }, newModelMessage]);
                } else {
                    setMessages(prev => [...prev, newModelMessage]);
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Maaf, terjadi kesalahan saat menghubungi server AI. Coba lagi dalam beberapa saat. (Mungkin beban wajar sistem).", timestamp: Date.now() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveHistory = async () => {
        if (!userId || userId.startsWith('guest')) {
             alert('Tolong login atau buat akun untuk menyimpan chat.');
             return;
        }
        setIsSaving(true);
        try {
            await FirebaseService.saveChatHistory(userId, {
                messages,
                topic: initialContext?.substring(0, 50) || 'General Chat'
            });
            alert('Riwayat chat berhasil disimpan ke Cloud.');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan chat.');
        }
        setIsSaving(false);
    };

    return (
        <div className={`fixed bottom-0 right-0 md:bottom-6 md:right-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-[100] transition-all duration-300 ${isExpanded ? 'w-full h-full md:w-[600px] md:h-[800px] md:rounded-2xl' : 'w-full h-[60vh] md:w-[400px] md:h-[600px] md:rounded-2xl'}`}>
            {/* Header */}
            <div className={`p-4 ${isExpanded ? 'bg-indigo-600' : 'bg-indigo-600'} text-white flex justify-between items-center ${isExpanded ? 'md:rounded-t-2xl' : 'md:rounded-t-2xl'}`}>
                <div className="flex items-center gap-2">
                    <Bot size={24} />
                    <h3 className="font-bold">AI Chat Tutor</h3>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/20 rounded transition">
                        {isExpanded ? <Minimize2 size={18}/> : <Expand size={18}/>}
                     </button>
                    {onClose && (
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded transition">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0"><Bot size={16} className="text-indigo-600"/></div>}
                        <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'}`}>
                            <div className="text-xs sm:text-sm leading-relaxed overflow-hidden">
                                <SimpleMarkdown text={msg.text} />
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0"><Bot size={16} className="text-indigo-600"/></div>
                         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Action Bar */}
            <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <button onClick={handleSaveHistory} disabled={isSaving || messages.length <= 1} className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 disabled:opacity-50">
                    {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />} Simpan Chat
                </button>
                <button onClick={() => setMessages([{ id: '1', role: 'model', text: "Chat direset. Ada yang lain?", timestamp: Date.now() }])} className="flex items-center gap-1 text-slate-500 hover:text-rose-600">
                    <Trash2 size={14} /> Reset
                </button>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                    placeholder="Tanya soal, trik, atau konsep..."
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
                />
                <button 
                    onClick={() => handleSendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
