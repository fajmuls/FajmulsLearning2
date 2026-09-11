import re

with open('services/geminiService.ts', 'r') as f:
    content = f.read()

# Fix the function parameters
content = content.replace("`, 12, [], stream, undefined, 'HOTS');", "`, 10, [], stream, undefined, 'HOTS');")
content = content.replace("`, 8, [], stream, undefined, 'HOTS');", "`, 10, [], stream, undefined, 'HOTS');")

# Fix exactDistributions TIU
old_tiu_dist = """            TIU: {
                "TIU - Analogi Kata": 2,
                "TIU - Analogi Kalimat": 2,
                "TIU - Hitungan": 4,
                "TIU - Perbandingan Kuantitatif": 3,
                "TIU - Soal Cerita": 4,
                "TIU - Deret Angka": 4,
                "TIU - Silogisme": 5,
                "TIU - Analitis": 3,
                "TIU - Analogi Gambar": 2,
                "TIU - Serial Gambar": 2,
                "TIU - Pola 9 Kotak Gambar": 1,
                "TIU - Ketidaksamaan Gambar": 3
            },"""

new_tiu_dist = """            TIU: {
                "TIU - Analogi": 3,
                "TIU - Hitungan": 4,
                "TIU - Perbandingan Kuantitatif": 3,
                "TIU - Soal Cerita": 4,
                "TIU - Deret Angka": 4,
                "TIU - Silogisme": 3,
                "TIU - Analitis": 4,
                "TIU - Analogi Gambar": 3,
                "TIU - Serial Gambar": 4,
                "TIU - Ketidaksamaan Gambar": 3
            },"""

content = content.replace(old_tiu_dist, new_tiu_dist)

with open('services/geminiService.ts', 'w') as f:
    f.write(content)
