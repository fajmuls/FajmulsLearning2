export interface PatchNote {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  notes: string[];
}

export const APP_VERSION = "3.4.4";

export const PATCH_NOTES: PatchNote[] = [
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
