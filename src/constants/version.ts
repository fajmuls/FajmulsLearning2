export interface PatchNote {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  notes: string[];
}

export const APP_VERSION = "4.5.7";

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "4.5.7",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Pembaruan Komprehensif Generator Soal SKD CAT BKN Terkini: Mengadaptasi kurikulum dan standar logika tes SKD terbaru untuk TWK, TIU, dan TKP yang berfokus pada daya nalar tajam peserta.",
      "TIU — Analogi Objek Nyata & Kehidupan Sehari-hari: Mengganti kosa kata kamus ilmiah asing dengan analogi benda konkret, pakaian/alat pelindung tubuh, instrumen kerja, fenomena alam, atau kegiatan sehari-hari yang memicu logika relasi fungsional dan sebab-akibat.",
      "TIU — 10 Ragam Soal Baru: Mendukung soal persamaan kalimat, perbandingan senilai vs berbalik nilai, soal cerita/silogisme/aritmatika dengan tabel Markdown (| ... |), kecukupan informasi (Data Sufficiency), deret angka tabel matriks, suku kata/pola angka, logika posisi, premis panjang, dan soal cerita ketelitian informasi.",
      "TWK — Pasal UUD 1945 & Butir Pancasila Riil: Mengintegrasikan pasal-pasal konstitusi nyata (HAM 28A-J, Bela Negara 27(3) vs Hankam 30(1-2), Lembaga MA/KY/MK 24A-C, DPR vs DPD, BPK, Amandemen 37) dengan opsi pengecoh pasal/ayat serumpun yang sangat mirip dan menjebak, serta pembedaan butir Pancasila yang tajam.",
      "TWK — 6 Materi Pokok Kebangsaan: Penerapan nilai Pancasila sehari-hari, Nasionalisme, Toleransi antar suku/agama/budaya, Studi kasus nilai kebangsaan/integritas aparatur, Sejarah kemerdekaan, dan Teladan nilai tokoh pejuang bangsa.",
      "TKP — Opsi Serba Positif & Perbedaan Tipis 5 vs 4: Seluruh 5 pilihan jawaban (A-E) bernilai positif dan profesional tanpa opsi negatif/malas/pasif. Skor 5 unggul pada inisiatif sistemik dan skala prioritas taktis dibanding skor 4 yang prosedural, dengan panjang opsi tetap seimbang.",
      "TKP — 4 Klaster Isu Terkini: Permasalahan yang sedang terjadi (digitalisasi birokrasi, AI, hoax medsos, WFA), Sikap profesional (integritas, anti-gratifikasi halus), Pengambilan keputusan (prioritas mendesak, manajemen risiko), dan Cara menghadapi kondisi darurat/komplain publik."
    ]
  },
  {
    version: "4.5.6",
    date: new Date().toISOString().split('T')[0],
    type: "patch",
    notes: [
      "Standardisasi Pintasan Keyboard Satu Tombol: Seluruh pintasan diselaraskan menjadi satu tombol saja dan konsisten antara Sesi Ujian (SessionEngine) dan Riwayat Belajar (ReviewView).",
      "Penyeragaman Bintang (B) & Zoom Font (Q/W): Menyatukan tombol Soal Terbaik menjadi satu tombol 'B' (meniadakan bentrok S) dan zoom font menjadi satu tombol murni 'Q' (perkecil) dan 'W' (perbesar) tanpa tanda plus/minus.",
      "Reposisi Tombol Bintang ke Navigasi Box: Tombol bintang (Tandai Soal Terbaik) kini diletakkan rapi dan elegan tepat di sebelah kanan tulisan 'Navigasi' di dalam box navigasi.",
      "Pembersihan Bar Bawah Pengerjaan Soal: Menghilangkan kontrol font dan label pintasan keyboard di bawah soal agar tampilan pengerjaan jauh lebih bersih, fokus, dan bebas distraksi.",
      "Perluasan Area Box Soal (Laptop-Friendly): Memperlebar kontainer soal menjadi max-w-5xl/6xl dengan tinggi scroll fleksibel sehingga memanfaatkan ruang kosong di laptop secara optimal tanpa mengorbankan kenyamanan mobile."
    ]
  },
  {
    version: "4.5.5",
    date: new Date().toISOString().split('T')[0],
    type: "patch",
    notes: [
      "Engine Soal SKD V8.1 (TIU & TWK Fresh Patterns): Merombak menyeluruh generator AI untuk meniadakan template soal berulang yang sekadar mengganti angka atau nama tokoh.",
      "Mekanisme Anti-Obvious Pilihan Ganda TWK: Kelima pilihan jawaban (A, B, C, D, E) kini diwajibkan bernada positif, terhormat, dan plausible. Pengecoh dibangun dari jebakan konseptual riil (butir Sila lain, wewenang lembaga lain, atau 5 nilai Bela Negara), menghapus opsi klise negatif sehingga peserta wajib menganalisis wacana.",
      "Keseimbangan Panjang Opsi TWK: Menerapkan batasan ketat selisih panjang kalimat antaropsi (maksimal 2-4 kata) dan melarang jawaban benar menjadi opsi yang paling panjang atau paling bertele-tele.",
      "Variasi Pola Multi-Step TIU: Menyuntikkan ragam arketipe segar untuk Numerik (deret 3 larik bersilang, aljabar simetris, domain perbandingan kuantitatif dinamis P < Q / P > Q, proyek multi-tahap) dan Verbal (analogi kosa kata KBBI tinggi, silogisme 3-4 premis dengan kontraposisi, analitis posisi spasial/meja bundar).",
      "Validasi & AI Critic Otomatis: Validator deterministik dan AI Critic kini memfilter secara tegas opsi TWK yang terlalu mencolok (obvious) dan deret angka TIU yang terlalu sederhana."
    ]
  },
  {
    version: "4.5.4",
    date: new Date().toISOString().split('T')[0],
    type: "patch",
    notes: [
      "Penandaan Soal Terbaik (Bintang ⭐) saat Mengerjakan Soal: Sekarang Anda dapat menandai soal terbaik/favorit langsung di tengah sesi ujian (SessionEngine), tanpa harus menunggu masuk ke Riwayat Belajar.",
      "Tombol Bintang di Navigasi Box & Floating Bar: Tombol bintang terintegrasi rapi di navigasi box bersama tombol aksi lainnya (Tandai, Clue, Eliminasi, Hapus, TTS) serta di control bar bawah dekat tombol Ragu-ragu.",
      "Indikator Visual Bintang pada Grid Nomor Soal: Setiap nomor soal yang ditandai sebagai Soal Terbaik menampilkan badge bintang (⭐) kecil di sudut kiri atas kotak nomor navigasi.",
      "Shortcut Keyboard Identik (B / S): Shortcut keyboard disamakan persis dengan Riwayat Belajar (tombol B atau S) untuk menandai atau melepas tanda Soal Terbaik secara instan, lengkap dengan perintah suara ('soal terbaik' / 'bintang').",
      "Sinkronisasi Otomatis & Persisten: Soal yang ditandai langsung tersimpan ke penyimpanan lokal dan otomatis muncul sebagai Soal Terbaik saat membuka halaman Riwayat Belajar & Pembahasan."
    ]
  },
  {
    version: "4.5.3",
    date: new Date().toISOString().split('T')[0],
    type: "patch",
    notes: [
      "Perbaikan Pengelompokan Subtes SKD (Spesial TIU/TWK/TKP): Memperbaiki filter dan identifikasi subtes agar tidak lagi hanya bergantung pada ID string melainkan juga memvalidasi judul paket, mencegah soal subtes (seperti Spesial TIU) tersasar masuk ke halaman Simulasi SKD Full.",
      "Perbaikan Resiliensi Fitur Lanjutkan (Resume Task): Menjamin paket hasil lanjutan generate AI mempertahankan ID subtes resmi yang valid (contoh: gen-skd-kedinasan-tiu-*) bukan ID task sementara, sehingga paket otomatis masuk ke modul subtes yang tepat.",
      "Otomatisasi Navigasi & Auto-Heal: Saat membuat paket subtes (TIU/TWK/TKP), tampilan filter subtes otomatis diarahkan ke modul yang relevan. Paket yang sebelumnya tersasar telah dipindahkan dan dinormalisasi ke modul Spesial TIU."
    ]
  },
  {
    version: "4.5.2",
    date: new Date().toISOString().split('T')[0],
    type: "patch",
    notes: [
      "Perbaikan Menyeluruh Render LaTeX: Mengatasi bug formula matematika mentah seperti \\frac{1}{3} yang sebelumnya gagal di-render di Riwayat Belajar dan berbagai halaman soal. Regex parser kini memprioritaskan pemindaian formula lengkap dengan kurung kurawal berlapis.",
      "Pembersihan & Penyeimbangan KaTeX Otomatis: Menambahkan normalisasi kurung kurawal tak seimbang ({ ... }), perbaikan simbol persentase tak ter-escape (%), pembersihan backslash ganda dari JSON, dan penggantian \\degree ke ^{\\circ}.",
      "Fallback Render Cerdas: Jika terdapat sintaks formula yang tidak valid dari hasil generate AI, sistem secara otomatis merender bentuk matematis bersih yang mudah dibaca (misal: a/b, √(x), ×, ≤, ±) sehingga tidak pernah lagi menampilkan kode LaTeX mentah yang membingungkan.",
      "Standardisasi Parser Global: Menyatukan komponen SimpleMarkdown di seluruh aplikasi (ReviewView, SessionEngine, BattleArena, dan App) ke satu mesin terpusat yang tangguh dan teruji."
    ]
  },
  {
    version: "4.5.1",
    date: new Date().toISOString().split('T')[0],
    type: "patch",
    notes: [
      "Navigasi Keyboard Presisi: Tombol panah atas/bawah (↑/↓) dikhususkan untuk scrolling konten halaman secara mulus dan bebas lag, sedangkan perpindahan antar soal difokuskan pada panah kiri/kanan (←/→).",
      "Standardisasi Shortcut Ukuran Font (Q/W): Menyelaraskan shortcut keyboard pengatur ukuran font di Riwayat Belajar agar sama persis dengan Session Engine, yaitu tombol 'Q' untuk memperkecil dan 'W' untuk memperbesar font.",
      "Optimasi Performa Super Responsif: Merombak render daftar soal di Riwayat Belajar menggunakan komponen QuestionReviewCard ter-memoize (React.memo) dengan callback stabil sehingga perpindahan soal menjadi instan dan mulus tanpa delay."
    ]
  },
  {
    version: "4.5.0",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Background UI Riwayat & Review Adaptif Sesuai Tema: Tampilan riwayat belajar kini tidak lagi serba putih yang nyaru dengan kartu soal, melainkan otomatis mengikuti tema pengguna (Fajmuls Soft Mesh Gradient, Dark Slate, atau High-Contrast Neutral).",
      "Auto-Render LaTeX untuk Soal Berisi Angka: Seluruh notasi numerik, pecahan, pangkat unicode, mata uang, dan ekspresi aljabar pada soal dan opsi jawaban otomatis di-render rapi dan presisi menggunakan LaTeX/KaTeX.",
      "Navigasi Tombol Panah di Mode List & Focus: Kemudahan berpindah soal menggunakan panah keyboard (←/→ atau ↑/↓ atau j/k) secara mulus di Mode List maupun Mode Focus dilengkapi bilah navigasi melayang.",
      "Kontrol Ukuran Font Soal & Shortcut Cepat: Fitur perbesar dan perkecil ukuran teks soal dan pembahasan secara instan melalui tombol A-/A/A+ serta shortcut keyboard (+, -, dan 0).",
      "Gradasi Poin TKP Murni Merah Tua ke Hijau Banget: Box navigasi soal TKP kini sepenuhnya mengikuti gradasi 1 (Merah Tua), 2 (Oranye), 3 (Kuning-Oranye), 4 (Hijau Muda), hingga 5 (Hijau Banget) tanpa warna biru."
    ]
  },
  {
    version: "4.4.0",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Gradasi Warna Poin TKP di Box Navigasi Soal: Box nomor navigasi soal (pada sidebar Mode List maupun palette Mode Focus) kini secara visual mengikuti gradasi murni nilai TKP dari Merah Tua (Poin 1) hingga Hijau Banget (Poin 5) tanpa warna biru.",
      "Indikator Poin & Tooltip Real-time: Setiap kotak soal TKP menampilkan subskrip poin perolehan (1p-5p) serta tooltip deskriptif untuk evaluasi cepat.",
      "Legenda Navigasi Khusus TKP: Keterangan visual skala 5 tingkat poin TKP dan status benar/salah untuk soal TWK & TIU yang lebih rapi dan intuitif."
    ]
  },
  {
    version: "4.3.0",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Analisis Pola Jawaban TKP per Aspek: Metrik rata-rata perolehan poin TKP per aspek (Pelayanan Publik, Jejaring Kerja, Sosial Budaya, TIK, Profesionalisme, Anti Radikalisme) untuk mengevaluasi pemahaman nilai 1-5 secara komprehensif.",
      "Deteksi & Peringatan Aspek Kritis (Poin 1-3): Sorotan otomatis untuk aspek TKP yang paling sering mendapatkan poin 1–3 lengkap dengan pesan diagnosis dan tips pola pikir standar kedinasan.",
      "Filter Cepat Soal Poin Rendah TKP: Tombol filter instan 'Poin 1-3 TKP' dan filter per-aspek untuk langsung membedah dan mempelajari butir-butir soal yang perlu perbaikan nilai.",
      "Visual Bar Gradasi Bobot TKP: Tampilan bar visual indikator rata-rata poin dengan gradasi warna dari Merah hingga Hijau Unggul serta rincian sebaran poin 5, 4, 3, 2, dan 1."
    ]
  },
  {
    version: "4.2.0",
    date: new Date().toISOString().split('T')[0],
    type: "minor",
    notes: [
      "Pengaturan Ukuran Font Dinamis (A- / A / A+): Kendali ukuran font fleksibel (XS hingga XL) di mode Review Belajar untuk kenyamanan membaca soal panjang dan pembahasan di semua perangkat.",
      "Dukungan Shortcut Keyboard Lengkap: Navigasi cepat tombol panah (←/→), perbesar/perkecil font (+/-), tandai paham (P/U), tandai soal terbaik (B/S), mode uji mandiri (T/M), ganti mode belajar (V/L), dan salin soal (C) dengan modal panduan visual (?)",
      "Visualisasi Khusus TKP Gradasi Warna Poin 1-5: Tampilan opsi soal TKP kini menonjolkan bobot nilai 1 hingga 5 dengan gradasi warna dari Merah (1 Poin) ke Hijau Unggul (5 Poin) lengkap dengan bar progres dan identifikasi jawaban pengguna.",
      "Peningkatan Responsivitas Navigasi & Matrix Soal: Navigasi cepat antar butir soal dengan indikator status nilai TKP dan pemahaman yang lebih informatif."
    ]
  },
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
