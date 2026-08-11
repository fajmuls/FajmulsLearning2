export interface PatchNote {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  notes: string[];
}

export const APP_VERSION = "1.0.1";

export const PATCH_NOTES: PatchNote[] = [
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
