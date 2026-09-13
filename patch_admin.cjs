const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf-8');

const newVersion = `export const PATCH_NOTES = [
  {
    version: "v3.9.5",
    date: new Date().toISOString().split('T')[0],
    type: "Feature Polish & Bug Fix",
    description: "Analisis Riwayat Rinci & Optimalisasi Ukuran SVG",
    details: [
      "Perampingan Kartu Riwayat: Kartu riwayat belajar dikembalikan ke desain simpel (compact), rincian kelemahan per subtes/materi kini dipindahkan ke dalam halaman Review saat kartu diklik.",
      "Grup Analisis Peta Kekurangan: Mengatasi bug analisis kelemahan yang sebelumnya muncul 'per soal'. Kini sistem cerdas mengelompokkan materi secara otomatis (Integritas, Bela Negara, Numerik, Figural, Pelayanan Publik, dll) untuk diagnosis yang lebih akurat.",
      "Statistik Waktu Belajar Per Kategori: Menambahkan rincian waktu belajar (SKD, UTBK, dll) di dalam profil statistik.",
      "Smart SVG Sizing: Ukuran gambar vektor (SVG) pada soal TIU dan UTBK kini responsif terhadap ukuran teks pengguna (menggunakan ukuran relatif 'em'), mencegah ukuran gambar yang terlalu raksasa di layar desktop/tablet."
    ]
  },
  {
    version: "v3.9.0",`;

code = code.replace("export const PATCH_NOTES = [\n  {\n    version: \"v3.9.0\",", newVersion);

fs.writeFileSync('components/AdminDashboard.tsx', code);
