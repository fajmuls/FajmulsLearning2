import React, { useState } from 'react';
import { ArrowLeft, Activity, Info, Tag, Layers, GitCommit, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as FirebaseService from '../services/firebase';

interface AdminDashboardProps {
  onBack: () => void;
}

export const PATCH_NOTES = [
  {
    version: "v3.3.0",
    date: "2026-08-14",
    type: "Feature & Security",
    description: "Multi-Account Manager & SKD Analytics Cleanup",
    details: [
      "Multi-Account Support: Pengguna kini dapat menyimpan beberapa akun dan berpindah antar akun dengan cepat dari layar login.",
      "Account Manager: Fitur untuk menghapus akun yang tersimpan dari daftar login.",
      "SKD Analytics Deduplication: Perbaikan pada algoritma ringkasan riwayat belajar yang mencegah redundansi data SKD.",
      "Refined Categorization: Logika pengelompokan sub-materi SKD (TWK, TIU, TKP) kini lebih presisi dan mutually exclusive.",
      "UI Security: Pembersihan state logout yang lebih aman untuk mencegah kebocoran data antar akun."
    ]
  },
  {
    version: "v3.2.0",
    date: "2026-08-14",
    type: "Feature & AI Upgrade",
    description: "Elite SKD Question Engine & Originality Guard",
    details: [
      "Elite Kedinasan Standard: Peningkatan standar kesulitan soal (TWK, TIU, TKP) agar setara dengan tes asli kedinasan (STAN/STIS/IPDN).",
      "Anti-Repetition Logic: AI kini dipaksa untuk menciptakan skenario baru dan unik, menghindari pola-pola 'Bank Soal' yang membosankan dan repetitif.",
      "Figural Precision V17: Perbaikan pada logika pola gambar (TIU) agar lebih presisi, simetris, dan tidak acak-acakan (Messy-free SVG).",
      "Matrix Variety Upgrade: Meningkatkan jumlah dan variasi soal Matriks 9 Kotak dengan logika geometris 2D yang lebih kompleks.",
      "TKP Grey-Area Dilemmas: Skenario TKP kini lebih fokus pada dilema birokrasi modern dan transformasi digital, menghindari skenario klise.",
      "LaTeX Math Standardization: Memastikan seluruh simbol matematika menggunakan rendering LaTeX yang sempurna dan profesional."
    ]
  },
  {
    version: "v3.1.0",
    date: "2026-08-11",
    type: "Feature & Optimization",
    description: "Benchmark Dashboard Refactor & Icon Consistency",
    details: [
      "Data-Driven Dashboard: Rekonstruksi dashboard Human Benchmark menggunakan model data-driven untuk performa rendering yang lebih cepat dan stabil.",
      "Fixed Missing Icons: Memperbaiki bug di mana ikon game tidak muncul pada beberapa perangkat atau kondisi tertentu.",
      "Icon Standardization: Menstandarisasi ukuran (32px) dan warna ikon di seluruh kartu game untuk konsistensi visual maksimal.",
      "Performance Optimization: Memindahkan komponen GameCard ke level modul untuk mencegah re-creation komponen yang tidak perlu saat render.",
      "Improved Color Logic: Sinkronisasi logika warna antara dashboard, riwayat aktivitas, dan leaderboard.",
      "Refined Activity Feed: Memperkecil ukuran ikon pada tabel riwayat agar lebih pas di layar handphone."
    ]
  },
  {
    version: "v3.0.0",
    date: "2026-08-11",
    type: "Major Update",
    description: "Mobile UI Overhaul & UX Consolidation",
    details: [
      "Human Benchmark Mobile Optimization: Menyesuaikan seluruh mini-game agar proporsional di layar handphone (Font diperkecil, padding rapat, ikon minimalis).",
      "Help Button Consolidation: Memindahkan tombol Clue, Eliminasi, dan Reset (Hapus Jawaban) ke header atas (Mobile & Desktop) untuk menghindari redundansi.",
      "Icon Restoration: Mengembalikan ikon yang hilang (Zap, Target, FileText, dll.) pada menu utama Human Benchmark.",
      "Option Shuffling: Implementasi pengacakan opsi (A, B, C, D, E) pada setiap pengerjaan paket soal untuk integritas latihan.",
      "UI Box Refinement: Mempercantik kotak soal dengan layout yang lebih bersih dan modern.",
      "Bug Fix: Memperbaiki clipping elemen pada game Sequence Memory dan Aim Trainer di layar kecil."
    ]
  },
  {
    version: "v2.9.0",
    date: "2026-08-11",
    type: "Major Update",
    description: "Expanded Article Test Modes & UI Consistency",
    details: [
      "Article Test Categories: Menambahkan pilihan mode 'Keseluruhan' dan 'Khusus TWK' pada Tes Pasal.",
      "TWK Focus Mode: Menambahkan 30 soal khusus tema TWK (Bela Negara, Integritas, dll.) untuk persiapan SKD.",
      "Consistency Update: Mengganti ikon eliminasi menjadi 'Eraser' di seluruh aplikasi untuk konsistensi visual.",
      "Firebase Integration: Optimalisasi fetching data berdasarkan kategori soal.",
      "Bug Fix: Memperbaiki error visual pada indikator bantuan di top bar."
    ]
  },
  {
    version: "v2.8.0",
    date: "2026-08-11",
    type: "Major Update",
    description: "New Game Mode: Article Test (Tes Pasal Hukum)",
    details: [
      "Article Test (Tes Pasal): Menambahkan kategori baru di Human Benchmark untuk menguji pemahaman pasal-pasal UUD 1945 dan peraturan hukum lainnya.",
      "Interactive Learning: Setiap soal pasal kini dilengkapi dengan penjelasan detail dan referensi pasal yang tepat.",
      "Session Engine Optimization: Memindahkan tombol 'Clue' dan 'Eliminasi' ke top bar untuk pengalaman pengerjaan yang lebih bersih di desktop.",
      "Confirmation Dialogs: Menambahkan konfirmasi sebelum menggunakan bantuan (Clue/Eliminasi) untuk mencegah penggunaan yang tidak disengaja.",
      "Visual Refinement: Optimalisasi ikon dan layout kartu pada Human Benchmark Dashboard."
    ]
  },
  {
    version: "v2.7.0",
    date: "2026-08-11",
    type: "Major Update",
    description: "Enhanced Analytics Precision & SKD Refinement",
    details: [
      "Refined SKD Categorization: Memprioritaskan deteksi sub-materi (TWK, TIU, TKP) agar tidak tercampur dalam kategori 'Full', memberikan visibilitas progres yang lebih akurat.",
      "Granular Test History: Memastikan riwayat Tes Benchmark, Tes Kecermatan, dan Buta Warna dicatat secara terpisah sesuai dengan nama paket/sub-tes yang dikerjakan.",
      "Fixed Buta Warna Naming: Menstandarisasi penulisan 'Buta Warna' pada seluruh komponen riwayat untuk estetika dan profesionalisme.",
      "Interactive Sub-Materi Tabs: Penyesuaian layout tab pada riwayat belajar untuk navigasi yang lebih intuitif antara Analisis dan Daftar Riwayat.",
      "Performance Optimizations: Peningkatan kecepatan pemrosesan data riwayat untuk user dengan jumlah sesi yang besar (>500 sesi)."
    ]
  },
  {
    version: "v2.6.0",
    date: "2026-08-11",
    type: "Major Update",
    description: "Granular Performance Tracking & SKD Structure",
    details: [
      "SKD Categorization: Implementasi 5 sub-kategori utama (CPNS Full, TWK, TIU, TKP, Kedinasan) untuk pelacakan progres yang lebih akurat.",
      "Drill-down Special Tests: Pemisahan detail riwayat untuk Tes Benchmark, Tes Kecermatan, dan Buta Warna berdasarkan nama paket spesifik.",
      "Empty State Placeholders: Menampilkan struktur kategori SKD secara lengkap meskipun belum ada riwayat pengerjaan.",
      "Visual Consistency: Standardisasi ikon materi dan perbaikan penulisan 'Buta Warna' untuk pengalaman visual yang lebih profesional.",
      "Mobile Layout Fix: Optimalisasi kontainer materi untuk mencegah teks terpotong pada layar kecil."
    ]
  },
  {
    version: "v2.5.0",
    date: "2026-08-11",
    type: "Major Update",
    description: "Icon-Based Analytics & Enhanced Grouping",
    details: [
      "Icon-Based Analytics: Mengganti label teks pada ringkasan paket dengan ikon deskriptif untuk keterbacaan yang lebih cepat.",
      "Granular Categorization: Implementasi pemisahan kategori yang lebih detail untuk Tes Benchmark, Tes Kecermatan, dan Buta Warna.",
      "SKD Full Grouping: Pengelompokan cerdas untuk Try Out SKD Kedinasan (TO 11, 12, 13) ke dalam satu kategori induk 'TO SKD Kedinasan Full'.",
      "Typo Fix: Memperbaiki kesalahan penulisan 'Buta WRNA' menjadi 'Buta Warna' pada seluruh modul riwayat dan analisis.",
      "UI Refinement: Penyesuaian kontainer materi untuk memastikan teks tidak terpotong atau keluar kotak pada perangkat mobile."
    ]
  },
  {
    version: "v2.4.0",
    date: "2026-08-11",
    type: "Major Update",
    description: "Tabbed Analytics & Hierarchical Summary",
    details: [
      "Tabbed Navigation: Memisahkan 'Ringkasan & Analisis' dengan 'Ruangan Soal' untuk pengalaman navigasi yang lebih terfokus.",
      "Hierarchical Summary: Menampilkan ringkasan progres secara bertingkat (Kategori > Materi > Attempt) untuk drill-down performa yang mendalam.",
      "Performance Layers: Rekonstruksi layout analisis menjadi 4 layer fungsional: Konsistensi, Statistik Utama, Ringkasan Paket, dan Visualisasi Grafik.",
      "Title Sanitization: Secara otomatis menghapus label 'Attempt ke-X' pada judul riwayat untuk menjaga kebersihan visual.",
      "Interactive Drill-down: Sub-kategori dalam ringkasan kini dapat diklik untuk melihat detail skor setiap percobaan secara instan."
    ]
  },
  {
    version: "v2.3.0",
    date: "2026-08-11",
    type: "Major Update",
    description: "Visualisasi Konsistensi (Heatmap) & Redesain Riwayat Belajar",
    details: [
      "Learning Heatmap: Menambahkan kalender kontribusi belajar ala GitHub untuk melacak konsistensi harian.",
      "Ringkasan per Paket: Fitur summary baru yang mengelompokkan riwayat berdasarkan paket soal, menampilkan jumlah attempt, skor rata-rata, dan skor puncak.",
      "Redesain Detail Riwayat: Layout riwayat belajar kini lebih terstruktur dengan sistem 'Layer' (Layer 1: Performa Utama, Layer 2: Detail Jawaban, Layer 3: Fitur Bantuan).",
      "Statistik Persentase: Menambahkan perhitungan persentase akurasi (Benar/Salah) pada setiap item riwayat.",
      "Revisi Penamaan: Menghapus label 'Attempt ke-X' pada judul riwayat untuk menjaga kebersihan visual dan integritas nama paket soal.",
      "Puncak Performa: Menambahkan indikator 'Puncak' (Peak performance) pada setiap sesi belajar untuk motivasi maksimal."
    ]
  },
  {
    version: "v2.2.0",
    date: "2026-08-11",
    type: "Major Feature",
    description: "Sistem Bantuan (Clues) & Peningkatan Analisis Percobaan",
    details: [
      "Fitur Clue (Hint): Setiap soal kini dilengkapi dengan 'Clue' yang dapat dibuka jika pengguna merasa kesulitan. AI akan memberikan petunjuk tanpa membocorkan jawaban.",
      "Fitur Eliminasi Opsi: Pengguna dapat mengeliminasi satu pilihan jawaban yang salah untuk mempersempit kemungkinan jawaban.",
      "Attempt Tracking: Riwayat pengerjaan kini secara otomatis melacak dan menampilkan nomor percobaan (Attempt ke-1, 2, dst) untuk setiap paket soal yang sama.",
      "Statistik Penggunaan Alat Bantu: Menambahkan pelacakan penggunaan Clue dan Eliminasi pada setiap soal di ringkasan hasil akhir.",
      "Gemini System V7: Peningkatan logika AI untuk menghasilkan soal yang lebih menantang (Anti-Leak) dan penyertaan hint kontekstual yang cerdas."
    ]
  },
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [genCategory, setGenCategory] = useState<'GENERAL' | 'TWK'>('GENERAL');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus(null);
    try {
      const prompt = `Generate 20 high-quality multiple choice questions specifically for ${genCategory === 'TWK' ? 'TWK (Tes Wawasan Kebangsaan) level SKD' : 'Indonesian laws and articles (Pasal-Pasal UUD 1945, KUHP, etc.)'} for a legal education app.
      
      Requirements:
      1. Language: Indonesian.
      2. Format: JSON array of objects.
      3. Each object structure:
      {
          "id": "${genCategory.toLowerCase()}_pasal_gen_${Date.now()}_index",
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
          "correctAnswer": "The correct option text",
          "article": "The article reference",
          "explanation": "Detailed explanation"
      }
      4. Return ONLY the JSON array.`;

      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const jsonMatch = data.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Format AI tidak valid (JSON tidak ditemukan)");

      const questions = JSON.parse(jsonMatch[0]);
      const questionsWithIds = questions.map((q: any, i: number) => ({
        ...q,
        id: q.id || `${genCategory.toLowerCase()}_pasal_gen_${Date.now()}_${i}`
      }));

      await FirebaseService.saveArticleQuestions(questionsWithIds, genCategory);
      setStatus({ type: 'success', message: `Berhasil menambahkan ${questionsWithIds.length} soal ${genCategory} baru!` });
    } catch (e: any) {
      console.error(e);
      setStatus({ type: 'error', message: e.message || "Gagal menghasilkan soal." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('PERINGATAN: Ini akan menghapus SEMUA soal pasal dari database. Lanjutkan?')) return;
    try {
      // Note: We'd need a clearArticleQuestions in FirebaseService
      // For now we'll just alert that it's coming soon or implement it
      alert('Fitur hapus massal sedang dikembangkan. Silakan hapus via console Firebase untuk saat ini.');
    } catch (e) {
      console.error(e);
    }
  };

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
              <FileText className="text-orange-500" /> Manajemen Tes Pasal (Hukum)
            </h2>

            {status && (
              <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 animate-fade-in ${status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800'}`}>
                {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                <span className="text-sm font-bold">{status.message}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Generate Questions</h3>
                <div className="flex gap-2 mb-4">
                  {(['GENERAL', 'TWK'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setGenCategory(cat)}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${genCategory === cat ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'}`}
                    >
                      {cat === 'GENERAL' ? 'Umum' : 'TWK'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Gunakan AI untuk membuat 20 soal {genCategory === 'TWK' ? 'khusus TWK' : 'pasal umum'} baru.</p>
                <button 
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Sedang Proses...</> : `Generate 20 Soal ${genCategory === 'TWK' ? 'TWK' : 'Umum'}`}
                </button>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Reset Database</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Hapus semua data soal pasal yang ada saat ini dari database.</p>
                <button 
                  onClick={handleReset}
                  className="w-full py-2.5 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold text-sm transition-all"
                >
                  Kosongkan Data
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            
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
            
            <div className="mt-12 pt-12 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Info className="text-blue-500" /> Saran Update Paling Berguna & Rencana Perbaikan
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Layers size={16} /> UI/UX & QoL Improvements
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span><strong>Profile Customization:</strong> Menambahkan fitur upload foto profil kustom dan pemilihan avatar unik untuk setiap akun yang tersimpan.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span><strong>Session Resume:</strong> Fitur untuk melanjutkan pengerjaan paket soal yang terputus (saved session) secara otomatis saat login kembali.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span><strong>Interactive Graph:</strong> Visualisasi radar chart untuk melihat keseimbangan skor TWK, TIU, dan TKP secara lebih intuitif.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-800">
                  <h3 className="font-bold text-rose-800 dark:text-rose-300 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <AlertCircle size={16} /> Info Perbaikan Bug & Stabilitas
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>Deduplication Fix:</strong> Kami mengidentifikasi adanya data ganda pada riwayat SKD yang kini telah diperbaiki di v3.3.0.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>SVG Rendering:</strong> Terus memantau rendering pola gambar agar tidak terjadi distorsi pada layar dengan resolusi non-standar.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>Sync Consistency:</strong> Memperbaiki delay sinkronisasi antara skor lokal dan cloud leaderboard saat berganti akun dengan cepat.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};