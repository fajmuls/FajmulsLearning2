const fs = require('fs');
let code = fs.readFileSync('src/constants/version.ts', 'utf-8');

const newVersion = `export const APP_VERSION = "3.9.5";

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
    version: "3.8.0",`;

code = code.replace(`export const APP_VERSION = "3.8.0";\n\nexport const PATCH_NOTES: PatchNote[] = [\n  {\n    version: "3.8.0",`, newVersion);

fs.writeFileSync('src/constants/version.ts', code);
