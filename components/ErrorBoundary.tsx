import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
    fallbackMessage?: string;
    onReset?: () => void;
    compact?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.compact) {
                return (
                    <div className="p-3 my-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="shrink-0 text-rose-500" />
                            <span>{this.props.fallbackMessage || 'Komponen visual gagal dimuat.'}</span>
                        </div>
                        <button 
                            onClick={this.handleReset}
                            className="px-2 py-1 bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 dark:hover:bg-rose-800 rounded text-rose-700 dark:text-rose-200 font-bold text-[10px] flex items-center gap-1 transition"
                        >
                            <RefreshCw size={10} /> Muat Ulang
                        </button>
                    </div>
                );
            }

            return (
                <div className="p-6 my-4 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm text-center max-w-lg mx-auto">
                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/50 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-600 dark:text-rose-400">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1">
                        {this.props.fallbackTitle || 'Terjadi Kendala pada Komponen'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        {this.props.fallbackMessage || 'Komponen ini mengalami kesalahan sementara. Anda dapat mencoba memuat ulang komponen ini tanpa kehilangan progres sesi Anda.'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto shadow-sm"
                    >
                        <RefreshCw size={12} /> Coba Muat Ulang
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
