export interface PatchNote {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  notes: string[];
}

export const APP_VERSION = "4.1.0";

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "4.1.0",
    date: new Date().toISOString().split('T')[0],
    type: "major",
    notes: [
      "Revamp Total Fitur Mempelajari & Riwayat Belajar: Desain antarmuka baru yang selaras dengan TO Selection Screen dan Settings Modal dengan Hero Card ringkas, visual modern rounded-3xl, dan palet warna berdaya kontras tinggi.",
      "Tandai Soal Terbaik (⭐) & Tandai Sudah Paham (✅): Pengguna kini dapat menandai soal-soal favorit/terbaik serta mencatat status pemahaman per-soal dengan indikator visual langsung.",
      "Catatan Belajar Pribadi (📝 Personal Notes): Tambahkan catatan dan rumus pengingat mandiri di setiap butir soal yang tersimpan secara lokal dan persisten.",
      "Mode Belajar Multi-Gaya (List View vs Focus Flashcard): Beralih antara tampilan daftar lengkap atau mode fokus satu per satu untuk pendalaman materi tanpa distraksi.",
      "Fitur Uji Mandiri (Sembunyikan Kunci/Jawaban): Mode latihan ulang interaktif di mana kunci dan pembahasan dapat disembunyikan untuk menguji pemahaman secara mandiri.",
      "Filter & Pencarian Soal Lanjutan: Filter soal berdasarkan status (Salah, Ragu-ragu, Soal Terbaik ⭐, Sudah Paham ✅, Belum Paham) dan cari berdasarkan kata kunci/topik.",
      "Integrasi AI Tutor & Trik Kilat: Akses cepat tombol 'Tanya AI Guru' dan 'Minta Rumus Cepat AI' langsung dari lembar pembahasan soal."
    ]
  },
  {
    version: "4.0.0",
    date: new Date().toISOString().split('T')[0],
    type: "major",
    notes: [
      "Revamp Tampilan TO Selection Screen: Desain ulang total antarmuka pemilihan paket soal (TO) dengan gaya modern yang selaras dengan Settings Modal, tipografi tajam, kartu paket interaktif, dan animasi transisi halus.",
      "Fitur Paket TO Terbaik (Best Package): Pengguna kini dapat menandai paket soal favorit/terbaik dengan lencana emas dan filter khusus untuk memudahkan akses latihan prioritas.",
      "Integrasi Statistik & Quick Search: Tampilan statistik skor tertinggi, rata-rata, percobaan pengerjaan, dan pencarian instan judul paket yang lebih terorganisir.",
      "Peningkatan Responsivitas & Dark Mode: Seluruh dialog modal, filter, dan kartu paket dioptimalkan untuk berbagai ukuran layar dengan kontras tinggi."
    ]
  },
  {
    version: "3.9.9",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Sistem Anti-Repetisi & Difficulty Distribution (SKD V8.5): AI kini menggunakan matriks pola (pattern matrix) unik per soal untuk mencegah studi kasus berulang dalam satu paket ujian.",
      "Distribusi Tingkat Kesulitan Dinamis: Tidak semua soal dipukul rata Level 10. Sistem kini menargetkan 20% Level 8 (2 tahap logika), 50% Level 9 (konflik prioritas/trade-off), dan 30% Level 10 (semua opsi 100% plausible).",
      "Plausible Distractor (A-E): Mewajibkan seluruh opsi dari A hingga E terdengar profesional, logis, dan bisa dibela, merombak total kebiasaan AI membuat gradasi jawaban 'A. Tidak peduli - E. Sangat peduli'.",
      "Second-Pass Evaluator Internal: Penerapan self-correction pada generator, menolak secara paksa soal dengan pola redundan atau perbedaan kualitas opsi (option length) yang jomplang."
    ]
  },
  {
    version: "3.9.8",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Peningkatan Logika TKP (SKD V8.4): Merombak sistem AI Generator untuk soal Tes Karakteristik Pribadi (TKP) dengan menargetkan kesulitan tinggi 8-10/10.",
      "Karakteristik TKP HOTS: Kesulitan TKP kini berasal dari 'Grey Area' profesionalisme (5 opsi yang sama-sama baik dan logis), bukan sekadar dari teks kasus yang panjang.",
      "Konflik Ganda & Solusi Taktis: Skenario kini memuat konflik multi-dimensi (aturan vs publik vs resource, efisiensi vs keamanan siber) dengan jawaban poin 5 yang inovatif tanpa terdengar 'terlalu sempurna/klise'.",
      "Keseimbangan Teks Jawaban (Anti-Obvious): Menghilangkan pola di mana jawaban bernilai 5 adalah jawaban terpanjang. Semua opsi A-E kini memiliki panjang kalimat dan format tindakan yang setara."
    ]
  },
  {
    version: "3.9.7",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Peningkatan Logika TIU (SKD V8.3): Merombak ulang sistem AI Generator untuk soal Tes Intelegensia Umum (TIU) dengan target kesulitan 8-10/10 (Elite HOTS).",
      "Karakteristik Soal TIU HOTS: Soal kini menuntut minimal dua tahap penalaran logika (multi-step reasoning). Kesulitan murni didasarkan pada logika rumit, bukan penggunaan angka raksasa atau perhitungan yang absurd.",
      "Keseimbangan & Distraktor Logis: Opsi pengecoh (distraktor) dirancang sedemikian rupa sehingga mewakili hasil dari kesalahan satu tahap logika, bukan sekadar angka acak.",
      "Pembahasan Runtut Total: Penjelasan soal (explanation) TIU kini membedah penyelesaian secara terstruktur (step-by-step), sekaligus menjelaskan di mana letak jebakan pada distraktor yang salah."
    ]
  },
  {
    version: "3.9.6",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Peningkatan Logika TWK (SKD V8.2): Merombak ulang sistem AI Generator untuk soal Tes Wawasan Kebangsaan (TWK) dengan target kesulitan 8-10/10 (Elite HOTS).",
      "Karakteristik Soal TWK HOTS: Soal kini menuntut minimal satu tahap penalaran logika (seperti dilema kebijakan, checks and balances, dan prioritas konstitusi) dibanding sekadar hafalan teori mentah.",
      "Keseimbangan Opsi & Distraktor Realistis: Panjang kalimat semua opsi (A-E) lebih setara, dan distraktor dirancang merepresentasikan kesalahan logika riil, bukan kesalahan yang absurd.",
      "Pembahasan Opsi Total: Penjelasan soal (explanation) kini tidak hanya menjawab kenapa poin benar, melainkan wajib membedah mengapa setiap distraktor lain kurang tepat/salah."
    ]
  },
  {
    version: "3.9.5",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Perampingan Kartu Riwayat: Rincian kelemahan per subtes/materi kini dipindahkan ke dalam halaman Review agar tampilan riwayat lebih bersih.",
      "Grup Analisis Peta Kekurangan: Sistem kini mengelompokkan materi secara otomatis (Integritas, Bela Negara, Numerik, dll) di Peta Kelemahan Akumulatif.",
      "Statistik Waktu Belajar Per Kategori: Menambahkan rincian waktu belajar (SKD, UTBK, dll) di dalam profil statistik.",
      "Smart SVG Sizing: Ukuran gambar vektor (SVG) pada soal TIU dan UTBK kini responsif terhadap ukuran teks pengguna, mencegah ukuran gambar raksasa.",
      "Split Screen Toggle untuk Soal Gambar: Mode Split Screen pada soal Figural / Matrix kini menghormati pengaturan toggle, mencegah gambar mengecil atau scroll horizontal tak perlu.",
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
