import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, Award, ShieldCheck, Star } from 'lucide-react';
import { UserProfile } from '../types';

interface CertificateProps {
  userProfile?: UserProfile | null;
  testName: string;
  score: number | string;
  date: string;
  verdict?: string;
  iqScore?: number;
}

export const Certificate: React.FC<CertificateProps> = ({ userProfile, testName, score, date, verdict, iqScore }) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Sertifikat_${testName.replace(/\s+/g, '_')}_${date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh sertifikat", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full mt-6 space-y-4">
      <div 
        ref={certificateRef}
        className="relative w-full max-w-3xl bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-12 overflow-hidden border-8 border-slate-900 border-double"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-br-full" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-tl-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <Award className="w-96 h-96" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="flex items-center space-x-3 text-slate-900">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-widest uppercase">Akademi Sukses</h2>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>

          <div className="space-y-2 pt-4">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              SERTIFIKAT PENGHARGAAN
            </h1>
            <p className="text-sm sm:text-base text-slate-500 uppercase tracking-widest">Diberikan secara resmi kepada</p>
          </div>

          <div className="w-full max-w-md border-b-2 border-slate-300 pb-2 mb-2">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              {userProfile?.username || 'Peserta Ujian'}
            </h2>
          </div>

          <p className="text-slate-600 max-w-xl text-sm sm:text-base">
            Telah menyelesaikan simulasi evaluasi <strong>{testName}</strong> dengan integritas dan dedikasi penuh pada tanggal <span className="font-semibold">{date}</span>.
          </p>

          <div className="flex justify-center items-center space-x-8 pt-4">
            {iqScore ? (
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-200 min-w-[120px]">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Estimasi IQ</span>
                <span className="text-3xl font-black text-indigo-600">{iqScore}</span>
              </div>
            ) : null}
            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-200 min-w-[120px]">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Skor / Nilai</span>
              <span className="text-3xl font-black text-emerald-600">{score}</span>
            </div>
            {verdict && (
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-200 min-w-[120px]">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Predikat</span>
                <span className="text-xl font-bold text-slate-800 uppercase mt-1">{verdict}</span>
              </div>
            )}
          </div>

          <div className="w-full flex justify-between items-end mt-12 pt-8 border-t border-slate-200 text-left">
            <div>
              <p className="text-xs text-slate-500 font-mono">ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
              <p className="text-xs text-slate-500 font-mono">VERIFIED BY AI STUDIO</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-16 border-b border-slate-400 mb-2 flex items-end justify-center pb-1">
                <span className="font-['Playfair_Display'] text-2xl text-slate-800 italic">Auto-Signed</span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Sistem Evaluasi</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 group"
      >
        <Download className="w-5 h-5 mr-2 group-hover:-translate-y-1 transition-transform" />
        Unduh Sertifikat Resmi
      </button>
    </div>
  );
};
