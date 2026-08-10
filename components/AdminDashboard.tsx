import React from 'react';
import { ArrowLeft, Activity, Info, Tag, Layers, GitCommit, FileText } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

const PATCH_NOTES = [
  {
    version: "v2.1.4",
    date: "2026-08-10",
    type: "Feature & Optimization",
    description: "Optimalisasi Penyimpanan Massal & Peningkatan Riwayat Belajar",
    details: [
      "Optimasi Database: Memperkenalkan pemrosesan batching (berkelompok) saat admin menyimpan soal ke Bank Soal (menggunakan `writeBatch` Firestore), mencegah overload saat menyimpan >100 soal sekaligus.",
      "Filter Paket Soal: Merapikan UI pemilihan paket soal SKD menjadi sistem dropdown yang lebih bersih untuk Jenis (TWK, TIU, TKP) dan Status (Belum/Sudah Dikerjakan).",
      "Detail Riwayat Percobaan: Pengguna kini bisa melihat riwayat percobaan per paket soal secara detail dengan skor dan waktunya (dropdown pada tombol Kerjakan Ulang).",
      "Penyempurnaan Riwayat Belajar: Menambahkan ringkasan total soal dijawab dan benar/salah secara global di menu Riwayat. Menambahkan filter detail untuk riwayat SKD (TWK/TIU/TKP saja) dan rentang waktu (Hari ini, 7 Hari, 30 Hari)."
    ]
  },
  {
    version: "v2.1.3",
    date: "2026-08-10",
    type: "Feature & Bug Fixes",
    description: "Perbaikan Shuffle, Filter Status, Pencegahan Penggabungan Ganda & Tools Admin",
    details: [
      "Bug Fix: Fitur Urutan Acak (Shuffle) kini benar-benar mengacak soal secara acak saat tombol ditekan.",
      "Filter Status: Menambahkan filter untuk melihat 'Semua Paket', 'Belum Dikerjakan', dan 'Sudah Dikerjakan' di layar pemilihan paket.",
      "Pencegahan Duplikasi Gabungan: Paket Subtes yang sudah pernah digunakan dalam sebuah paket 'Gabungan' tidak dapat digabung lagi dan akan ditandai dengan label 'SUDAH DIGABUNG'.",
      "Admin Tools: Menambahkan tombol 'Simpan Semua ke Bank Soal' pada menu admin saat sedang mengerjakan soal, melengkapi fitur 'Jawab Semua Benar'."
    ]
  },
  {
    version: "v2.1.2",
    date: "2026-08-10",
    type: "Feature",
    description: "Konfigurasi Urutan Soal Sebelum Mulai",
    details: [
      "Opsi Urutan Soal: Kini Anda dapat memilih antara 'Urutan Normal' atau 'Urutan Acak' sesaat sebelum memulai sesi pengerjaan paket soal.",
      "Kontrol Manual: Menghapus sistem pengacakan otomatis pada pengerjaan ulang (Attempts > 0) dan memberikan kontrol penuh kepada pengguna.",
      "Kunci Urutan: Setelah sesi dimulai, urutan soal tidak dapat diubah lagi untuk menjaga konsistensi pengerjaan."
    ]
  },
  {
    version: "v2.1.1",
    date: "2026-08-10",
    type: "Patch",
    description: "Perbaikan Navigasi & Auto-Shuffle",
    details: [
      "Restorasi Navigasi SKD: Mengembalikan tab navigasi Simulasi Full dan Latihan Subtes untuk mempermudah pemisahan jenis paket.",
      "Auto-Shuffle Cerdas: Fitur acak urutan soal kini bekerja otomatis. Paket yang sudah pernah dikerjakan (Attempts > 0) akan otomatis teracak saat dikerjakan ulang, sedangkan paket baru tetap mengikuti urutan asli.",
      "Penyederhanaan UI: Menghapus opsi acak manual untuk pengalaman pengguna yang lebih bersih dan efisien."
    ]
  },
  {
    version: "v2.1.0",
    date: "2026-08-10",
    type: "Feature",
    description: "Peningkatan Sistem Admin & Gabungan Paket",
    details: [
      "Sistem Admin Baru: Admin sekarang dapat mengacak urutan soal secara permanen dan menyimpan perubahan (Resave) atau menyimpannya sebagai paket baru (Copy).",
      "Validasi Gabungan Paket: Pengetatan aturan penggabungan paket SKD (Max 1 TWK, 1 TIU, 1 TKP) dan pencegahan penggabungan paket yang sudah digabung.",
      "Filter Satu Lapis: Penyederhanaan filter subtes pada menu pemilihan paket soal menjadi satu baris navigasi yang lebih intuitif.",
      "Penomoran TO Gabungan: Sistem penomoran otomatis yang lebih rapi untuk paket-paket gabungan (Contoh: TO SKD Kedinasan Gabungan 1).",
      "Perbaikan UI Badge: Perbaikan layout indikator 'AI' dan 'MIX' agar tidak saling tumpang tindih."
    ]
  },
  {
    version: "v2.0.0",
    date: "2026-08-09",
    type: "Major",
    description: "Fitur Penggabungan Paket & Shuffle Soal",
    details: [
      "Fitur penggabungan subtes: Pengguna dapat memilih beberapa paket subtes (misal: TWK, TIU, TKP) dan menggabungkannya menjadi satu paket SKD utuh.",
      "Fitur Shuffle (Acak Soal): Pengguna sekarang dapat mengacak urutan soal kapan saja saat mengerjakan tes.",
      "Perbaikan Filter Subtes: Tombol filter TWK, TIU, TKP pada mode subtes sekarang berfungsi penuh.",
      "Peningkatan UI/UX: Desain kartu paket soal diperbarui menjadi lebih bersih, elegan, dan interaktif dengan tambahan ikon SVG khusus."
    ]
  },
  {
    version: "v1.3.0",
    date: "2026-08-06",
    type: "Feature",
    description: "Update besar untuk sistem Bank Soal",
    details: [
      "Bank Soal sekarang terintegrasi langsung dengan Firebase Firestore (Cloud Database), tidak lagi menggunakan Local Storage.",
      "Semua pengguna dan agen AI dapat membaca Bank Soal secara real-time.",
      "Admin dapat menyimpan dan menghapus soal dari Bank Soal langsung saat Review Test dengan indikator Icon dinamis.",
      "Struktur Bank Soal diperbarui untuk lebih detail dengan pemisahan per topik dan subtes secara spesifik."
    ]
  },
  {
    version: "v1.2.3",
    date: "2026-08-01",
    type: "Patch",
    description: "Perbaikan bug dan penyesuaian UI",
    details: [
      "Perbaikan tampilan di mode mobile.",
      "Optimasi render question."
    ]
  }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-10 shrink-0">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                  <Activity className="text-white" size={20} />
                </div>
                Admin Dashboard & Version
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Tag size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="font-black text-blue-700 dark:text-blue-300 text-sm">{PATCH_NOTES[0].version}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-[800px] mx-auto space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="text-purple-500" /> Patch Notes & Updates
            </h2>
            
            <div className="space-y-8">
              {PATCH_NOTES.map((note, index) => (
                <div key={note.version} className="relative pl-6 sm:pl-8">
                  <div className={`absolute left-0 top-1 bottom-0 w-px ${index === PATCH_NOTES.length - 1 ? 'bg-transparent' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  <div className="absolute left-[-5px] top-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-slate-900"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-lg text-slate-900 dark:text-white">{note.version}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${note.type === 'Feature' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {note.type}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{note.date}</span>
                  </div>
                  
                  <p className="text-slate-700 dark:text-slate-300 font-medium mb-4">{note.description}</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <ul className="space-y-3">
                      {note.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <GitCommit className="shrink-0 mt-0.5 text-slate-300 dark:text-slate-600" size={16} />
                          <span className="leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};