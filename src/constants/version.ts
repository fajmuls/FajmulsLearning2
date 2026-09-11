export interface PatchNote {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  notes: string[];
}

export const APP_VERSION = "3.5.0";

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "3.5.0",
    date: "2026-09-11",
    type: "minor",
    notes: [
      "Code-Splitting & Lazy Loading untuk komponen utama (BattleArena, TesKecermatan, Flashcard, dll)",
      "Split-Screen & Sticky Reading Pane untuk soal bacaan panjang (Literasi UTBK, TKP/TIU wacana)",
      "Keyboard Shortcuts lengkap (1-5 / A-E, Arrow keys, N/P, R/M, Q/W, V, S) dengan label hint visual",
      "Kontrol skala font instan (A- / A / A+) langsung di header tryout & latihan",
      "Actionable Study Plan & rekomendasi topik remedial dengan akurasi rendah di layar hasil",
      "Granular Error Boundary untuk isolasi kegagalan visual figural/renderer tanpa crash",
      "Pencarian & Filter terpadu pada Riwayat Ujian (HistoryView) dan Soal Ditandai (MarkedQuestionsView)",
      "Quick Mute / Audio Toggle satu sentuhan di header SessionEngine & PomodoroTimer",
      "Offline Submission Queue dengan sinkronisasi otomatis saat koneksi pulih",
      "Backup & Restore Data Belajar lengkap (.json) di Pengaturan untuk migrasi antar-perangkat"
    ]
  },
  {
    version: "3.4.4",
    date: "2026-09-11",
    type: "patch",
    notes: [
      "Pembersihan root project: memindahkan skrip maintenance/helper sementara ke direktori dedicated /scripts",
      "Penyatuan struktur modul /utils ke /src/utils (skdGenerator, speechRecognition) dengan backward-compatibility layer",
      "Konsolidasi referensi APP_VERSION dan metadata patch notes ke dalam /constants terpusat"
    ]
  },
  {
    version: "3.4.3",
    date: "2026-09-05",
    type: "patch",
    notes: [
      "Perbaikan validasi panjang opsi skor 5 pada soal TKP untuk menghindari false-positive rejection",
      "Stabilitas background task generator batch SKD V8 (TKP-C)",
      "Peningkatan resiliensi koneksi Gemini API dengan rotasi fallback model",
      "Penguncian posisi panel navigasi nomor soal pada layar review belajar"
    ]
  },
  {
    version: "1.0.1",
    date: "2024-03-20",
    type: "patch",
    notes: [
      "Perbaikan bug pada sistem penilaian SKD",
      "Peningkatan stabilitas koneksi ke server",
      "Optimasi performa rendering pada perangkat mobile"
    ]
  },
  {
    version: "1.0.0",
    date: "2024-03-15",
    type: "major",
    notes: [
      "Peluncuran perdana aplikasi CAT CPNS & Kedinasan",
      "Sistem Simulasi SKD (TWK, TIU, TKP) dengan standar BKN",
      "Fitur Analisis Progres dan Riwayat Tryout",
      "Integrasi AI Tutor untuk pembahasan soal"
    ]
  }
];
