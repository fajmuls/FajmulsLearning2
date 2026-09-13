export interface PatchNote {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  notes: string[];
}

export const APP_VERSION = "3.9.5";

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "3.9.5",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Perampingan Kartu Riwayat: Rincian kelemahan per subtes/materi kini dipindahkan ke dalam halaman Review agar tampilan riwayat lebih bersih.",
      "Grup Analisis Peta Kekurangan: Sistem kini mengelompokkan materi secara otomatis (Integritas, Bela Negara, Numerik, dll) di Peta Kelemahan Akumulatif.",
      "Statistik Waktu Belajar Per Kategori: Menambahkan rincian waktu belajar (SKD, UTBK, dll) di dalam profil statistik.",
      "Smart SVG Sizing: Ukuran gambar vektor (SVG) pada soal TIU dan UTBK kini responsif terhadap ukuran teks pengguna, mencegah ukuran gambar raksasa.",
      "Fitur Lanjutkan (Pause & Resume): Pembuatan soal SKD AI kini tangguh terhadap limit kuota dan dapat dijeda lalu dilanjutkan.",
      "TIU Figural V8.1: Peningkatan dramatis kualitas visual SVG Figural Matriks Sembilan Kotak (3x3)."
    ]
  },
  {
    version: "3.8.0",
    date: "2026-09-11",
    type: "minor",
    notes: [
      "Statistik Belajar Komprehensif Akun: Analisis mendalam per paket TO, per subtes (TWK, TIU, TKP, UTBK, TPA, TBI), akurasi %, skor tertinggi/terendah/rata-rata, durasi belajar, dan riwayat per-soal di tiap paket",
      "Peringkat Materi Dikuasai vs Lemah: Urutan topik dari yang paling dikuasai (≥80%) hingga kritis (<55%) lengkap dengan rekomendasi taktis belajar",
      "Diagnosis Karakteristik & Perilaku Soal: Deteksi soal overthinking, keraguan pengerjaan (doubtful), tebakan cepat, dan akurasi berdasarkan tingkat kesulitan soal (Easy, Medium, Hard, HOTS)",
      "Profil Akun Detail & Target Belajar: Form edit profil lengkap mencakup Username, Target Instansi (Kemenkeu, STAN, dll), Target Skor, Jalur Ujian Utama, Asal Sekolah/Kampus, Kota/Domisili, Bio, dan 8 Preset Avatar Karakter",
      "Akses Mudah Langsung dari Header & Pengaturan: Buka profil lengkap dan analisis belajar langsung dari avatar dropdown atau kartu akun di Pengaturan"
    ]
  },
  {
    version: "3.7.0",
    date: "2026-09-11",
    type: "minor",
    notes: [
      "Analisis Detail Kekurangan Subtes & Materi: Rincian jumlah benar/salah (misal 5/6 soal benar) pada tiap topik SKD (Integritas, Bela Negara, Silogisme, dll) langsung di kartu riwayat",
      "Moving Average Score Trend: Visualisasi grafik tren nilai rata-rata bergerak (MA-5 & MA-10) dengan indikator kenaikan/penurunan skor",
      "Peta Kelemahan Akumulatif: Diagnosis materi kritis yang paling sering salah dari seluruh riwayat tryout beserta rekomendasi belajar terarah",
      "Web Notification API: Pengingat waktu belajar harian terjadwal via notifikasi browser untuk menjaga streak belajar",
      "PWA Install Prompt Banner: Banner A2HS (Add to Home Screen) berdesain rapi dan panduan instalasi untuk iOS/Android",
      "Revamp Pengaturan & Akun: Tampilan pengaturan yang bersih, profil akun, dan navigasi yang responsif"
    ]
  },
  {
    version: "3.6.0",
    date: "2026-09-11",
    type: "minor",
    notes: [
      "Revamp Pengaturan & Akun: Tampilan konsisten, kartu profil pengguna, dan performa super ringan tanpa frame drop",
      "Relokasi Kontrol ke Navigasi: Tombol Font Scale, Mute Audio, dan Split Screen dipindahkan ke panel navigasi dengan hint shortcut",
      "Peningkatan Kontras Pola Latar: Motif Grid, Dots, Waves, Aurora, dan Fajmuls kini terlihat jelas dan dinamis",
      "Fix Navigasi Cepat: Penghapusan blocking transisi agar nomor dan isi soal selalu sinkron 100%",
      "Fix Toggle Pilihan Jawaban: Jawaban dapat dibatalkan (deselect) langsung dengan menekan tombol opsi yang sama"
    ]
  },
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
