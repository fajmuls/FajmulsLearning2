
import { Question } from '../types';

// Helper: Pseudo-random generator based on seed to ensure same package ID always produces same questions
const pseudoRandom = (seed: number) => {
    let value = seed;
    return () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
};

const shuffle = (array: any[], seedFn: () => number) => {
    return array.sort(() => seedFn() - 0.5);
};

const getRandomItem = (array: any[], seedFn: () => number) => {
    return array[Math.floor(seedFn() * array.length)];
};

// --- V4 VISUAL ASSETS (ASCII ART / UNICODE) ---
const SYMBOLS = {
    shapes: ['■', '□', '▲', '△', '●', '○', '◆', '◇', '★', '☆'],
    arrows: ['➔', '↘', '↙', '↖', '↗', '↻', '↺'],
    matrix: ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'],
    math: ['√', '²', '³', '½', '⅓', '¾', '≠', '≤', '≥']
};

// --- DATA BANKS (COMPLEX) ---

const TWK_TEMPLATES = [
    { 
        t: "Nasionalisme", 
        q: "Negara X adalah sebuah negara yang baru saja merdeka dan sedang berusaha membangun rasa nasionalisme di kalangan warganya. Proses ini dilakukan melalui implementasi berbagai program pemerintah dan penyebaran nilai-nilai patriotisme dalam pendidikan. Namun, beberapa tantangan tampaknya menjadi penghambat dalam upaya tersebut. Antara lain: (1) Banyak warga Negara X yang memilih untuk bekerja di negara lain dan mengadopsi gaya hidup serta budaya negara tersebut. (2) Sebagian masyarakat Negara X lebih tertarik pada barang-barang impor dibandingkan produk lokal. (3) Penyiaran dan media di Negara X banyak didominasi oleh konten dari luar negeri. Berdasarkan kasus di atas, mana faktor yang paling mungkin menjadi penghambat utama dalam membangun semangat nasionalisme di Negara X?", 
        a: ["Globalisasi", "Kesenjangan sosial", "Pendidikan yang kurang efektif", "Sumber daya manusia yang kurang", "Kurangnya dukungan dari pemerintah"],
        expl: "Globalisasi membawa masuk budaya, produk, dan media asing yang dapat mengikis identitas nasional jika tidak diimbangi dengan filter budaya yang kuat."
    },
    { 
        t: "Sejarah", 
        q: "Pada masa penjajahan, beberapa pemuda Indonesia seperti Ernest Douwes Dekker, Soewardi Soerjaningrat dan Tjipto Mangunkusumo mendirikan organisasi yang bernama Indische Party. Organisasi ini dikenal sebagai organisasi pertama yang mencetuskan konsep merdeka, yaitu bebas dari penjajahan Belanda dan menjadi fondasi penting dalam paham nasionalisme Indonesia. Peran Indische Party dan konsep merdeka memiliki pengaruh yang signifikan dalam sejarah kemerdekaan Indonesia. Bagaimanakah dampak konsep merdeka dan paham nasionalisme yang ditetapkan oleh Indische Party dalam perjuangan bangsa Indonesia hingga hari ini?", 
        a: ["Mendorong terbentuknya kesadaran kolektif untuk merdeka", "Menginspirasi pembuatan Pancasila sebagai dasar negara", "Mendorong pertumbuhan partai-partai politik di Indonesia", "Mendorong penggunaan Bahasa Indonesia sebagai bahasa resmi", "Menstimulasi pembentukan lembaga-lembaga pemerintahan"],
        expl: "Konsep 'Indische' (Hindia) menyatukan berbagai suku bangsa menjadi satu identitas nasional (Indonesia) untuk melawan penjajah."
    },
    { 
        t: "Integritas", 
        q: "Seorang ASN di bagian pengadaan barang dan jasa didekati oleh vendor yang menawarkan 'fee' sebesar 10% dari nilai proyek jika perusahaannya dimenangkan. Vendor tersebut menjamin bahwa kualitas barang tetap sesuai spesifikasi. ASN tersebut sedang membutuhkan biaya besar untuk pengobatan orang tuanya. Sikap yang paling mencerminkan integritas tinggi adalah...", 
        a: ["Menolak tegas tawaran tersebut dan melaporkan upaya penyuapan kepada unit kepatuhan internal", "Menolak tawaran tersebut secara halus tanpa melaporkan agar tidak memperpanjang masalah", "Menerima tawaran tersebut namun menyumbangkan seluruh uangnya untuk panti asuhan", "Melaporkan vendor tersebut tetapi meminta jaminan perlindungan saksi terlebih dahulu", "Meminta saran atasan apakah boleh menerima dana tersebut untuk alasan kemanusiaan"],
        expl: "Integritas menuntut penolakan tegas terhadap gratifikasi/suap dan keberanian untuk melaporkan pelanggaran (Whistleblowing)."
    },
    {
        t: "Bela Negara",
        q: "Nama Pandawara Group seringkali menjadi perbincangan dan trending topik di sosial media berkat aksi-aksi heroiknya dalam membersihkan sampah. Beranggotakan lima orang pemuda, tak jarang Pandawara Group mengajak masyarakat dan netizen untuk turut serta turun ke lapangan membersihkan sampah. Aksi kelompok pemuda ini mencerminkan salah satu nilai bela negara, yaitu ….",
        a: ["kemampuan awal bela negara", "cinta tanah air", "kesadaran berbangsa dan bernegara", "rela berkorban", "setia pada Pancasila"],
        expl: "Aksi nyata menjaga lingkungan fisik negara merupakan wujud Kemampuan Awal Bela Negara (Kesiapan Fisik/Mental) dan Cinta Tanah Air."
    },
    {
        t: "Pilar Negara",
        q: "Desa yang dipimpin oleh Pak Dimas terancam banjir akibat musim penghujan yang akan segera tiba. Untuk mengatasi masalah ini, Pak Dimas mengusulkan pembangunan tanggul baru atau memperkuat drainase. Melalui pemungutan suara yang diadakan di desa tersebut, mayoritas warga memilih bangun tanggul baru. Perilaku Pak Dimas dan seluruh warga desa merupakan cerminan dari ….",
        a: ["Pancasila sila ke-4", "Pancasila sila ke-2", "Pancasila sila ke-3", "Pancasila sila ke-5", "UUD 1945 Pasal 28"],
        expl: "Pengambilan keputusan melalui musyawarah atau pemungutan suara (demokrasi) adalah pengamalan Sila ke-4."
    }
];

const TIU_VERBAL_TEMPLATES = [
    {
        type: "Analogi",
        q: "API : … = … : TERBASAHI",
        a: "PANAS – CAIRAN", // Wrong
        correct: "TERBAKAR – AIR",
        opts: ["PANAS – CAIRAN", "BERBAHAYA – GENANGAN", "DIHINDARI – DIDEKATI", "GAS – CAIR"],
        expl: "Hubungan Sebab-Akibat: API menyebabkan TERBAKAR, AIR menyebabkan TERBASAHI."
    },
    {
        type: "Analogi 3 Variabel",
        q: "KULKAS : SATU PINTU : DUA PINTU = …",
        a: "RODA : BULAT : KOTAK",
        correct: "MESIN CUCI : BUKAAN ATAS : BUKAAN DEPAN",
        opts: ["APEL : SATU KERANJANG : DUA KERANJANG", "ES KRIM : DINGIN : PANAS", "RODA : BULAT : KOTAK", "KASUR : RANJANG : ALAS TIDUR"],
        expl: "Hubungan Klasifikasi Tipe: Kulkas ada tipe 1 pintu dan 2 pintu. Mesin cuci ada tipe bukaan atas dan depan."
    },
    {
        type: "Silogisme",
        q: "Perhatikan pernyataan berikut!\nPremis 1: Setiap manusia di dunia pernah mengalami gigi rontok.\nPremis 2: Beberapa manusia di dunia adalah orang yang sangat tampan.\nJadi, …",
        correct: "Beberapa manusia yang sangat tampan pernah mengalami rontok gigi",
        opts: ["Beberapa manusia yang sangat tampan tidak pernah mengalami rontok gigi", "Semua manusia yang sangat tampan tidak pernah mengalami rontok gigi", "Semua manusia yang sangat tampan pernah mengalami rontok gigi", "Semua manusia yang pernah mengalami rontok gigi adalah manusia yang sangat tampan"],
        expl: "Karena 'Setiap' (Semua) manusia mengalami rontok gigi, maka himpunan bagian 'Manusia Tampan' juga pasti mengalaminya."
    },
    {
        type: "Analitis",
        q: "Dalam sebuah perlombaan lari:\n1. Dani mencapai garis finis segera setelah Anton.\n2. Budi menyelesaikan perlombaan di antara Anton dan Raka.\n3. Raka sendiri mencapai garis finis setelah Fikri yang merupakan juara lomba lari tersebut.\nUrutan masuk finis kelima pelari tersebut adalah ….",
        correct: "Fikri – Raka – Budi – Anton – Dani",
        opts: ["Budi – Anton – Fikri – Raka – Dani", "Fikri – Budi – Dani – Raka – Anton", "Fikri – Dani – Raka – Budi – Anton", "Raka – Budi – Fikri – Dani – Anton"],
        expl: "Juara=Fikri. Raka setelah Fikri (F-R). Budi antara Anton & Raka (R-B-A atau A-B-R). Dani segera setelah Anton (A-D). Gabungan: F - R - B - A - D."
    }
];

const TIU_NUMERIC_TEMPLATES = [
    {
        type: "Aljabar Kompleks",
        q: "Jika x = 2024² - 2023 × 2025 dan y = (0.5 × 16) - (2³ ÷ 4), maka nilai x + y adalah...",
        correct: "7",
        opts: ["1", "5", "7", "2024", "4049"],
        expl: "x = a² - (a-1)(a+1) = a² - (a²-1) = 1. y = 8 - 2 = 6. Jadi x+y = 1+6=7."
    },
    {
        type: "Akar Bertingkat",
        q: "Nilai dari √(20 + √(20 + √(20 + ...))) adalah...",
        correct: "5",
        opts: ["4", "4.5", "5", "5.5", "20"],
        expl: "Misal x = √(20+x) => x² = 20+x => x²-x-20=0 => (x-5)(x+4)=0. x positif, maka x=5."
    },
    {
        type: "Pertidaksamaan Logika",
        q: "Jika -4 ≤ a ≤ 2 dan -3 ≤ b ≤ 5, manakah pernyataan yang PASTI benar mengenai nilai ab?",
        correct: "-20 ≤ ab ≤ 10",
        opts: ["-12 ≤ ab ≤ 10", "-20 ≤ ab ≤ 10", "-20 ≤ ab ≤ 12", "ab ≤ 10", "-12 ≤ ab ≤ 12"],
        expl: "Nilai minimum ab didapat dari (-4) * (5) = -20. Nilai maksimum didapat dari (-4) * (-3) = 12 atau (2) * (5) = 10. Jadi -20 ≤ ab ≤ 10." // Wait, -4 * -3 is 12. So -20 to 12.
    },
    {
        type: "Deret Kompleks",
        q: "2, 3, 5, 8, 13, 21, 34, ...",
        correct: "55",
        opts: ["45", "48", "55", "63", "89"],
        expl: "Deret Fibonacci: Suku n = Suku n-1 + Suku n-2. 21 + 34 = 55."
    },
    {
        type: "Statistika & Peluang",
        q: "Dalam sebuah kotak terdapat 5 bola merah, 3 bola kuning, dan 2 bola hijau. Jika diambil 3 bola sekaligus secara acak, berapakah peluang terambilnya minimal 1 bola hijau?",
        correct: "8/15",
        opts: ["1/3", "2/5", "7/15", "8/15", "3/4"],
        expl: "P(Min 1 Hijau) = 1 - P(Gak ada Hijau). P(Gak ada) = C(8,3)/C(10,3) = (56)/(120) = 7/15. Peluang = 1 - 7/15 = 8/15."
    }
];

const TKP_SCENARIOS = [
    {
        topic: "Teknologi Informasi",
        q: "Anda mendapatkan sebuah berita hoaks tentang kebijakan baru mengenai instansi yang Anda pimpin. Informasi hoaks ini beredar luas di media sosial dan membuat kebingungan bawahan Anda. Mengingat situasi tersebut, apa langkah yang akan Anda ambil?",
        opts: [
            { txt: "Segera melakukan klarifikasi resmi melalui saluran komunikasi internal dan menekankan kepada bawahan mengenai pentingnya digital literacy dan cara mendeteksi hoaks.", pts: 5 },
            { txt: "Setelah melakukan klarifikasi resmi, Anda berinisiatif untuk membuat sistem atau prosedur tetap lainnya yang dapat mempercepat proses klarifikasi berita di masa mendatang.", pts: 4 },
            { txt: "Anda mengumpulkan informasi valid untuk membantu berita hoaks tersebut dan meneruskannya kepada seluruh anggota instansi.", pts: 3 },
            { txt: "Melaporkan berita hoaks tersebut kepada pimpinan tertinggi dan menunggu instruksi selanjutnya.", pts: 2 },
            { txt: "Membantah berita hoaks tersebut secara individual kepada rekan-rekan kerja Anda tanpa melakukan klarifikasi resmi.", pts: 1 }
        ]
    },
    {
        topic: "Profesionalisme",
        q: "Anda adalah seorang pegawai di sebuah dinas yang sedang menangani beberapa proyek penting. Dalam satu hari, Anda dihadapkan pada empat tugas mendesak: (1) mengirim laporan penting ke atasan; (2) mengikuti rapat mendadak dengan klien utama; (3) menyiapkan presentasi untuk acara besar; dan (4) menanggapi keluhan dari masyarakat. Semua tugas memiliki tenggat waktu yang sama. Apa yang sebaiknya Anda lakukan terlebih dahulu?",
        opts: [
            { txt: "Menanggapi keluhan masyarakat karena sebagai pegawai negeri, Anda harus fokus pada pelayanan publik.", pts: 5 },
            { txt: "Mengikuti rapat mendadak dengan klien utama karena hasil rapat ini berpengaruh langsung pada kelangsungan proyek besar.", pts: 4 },
            { txt: "Mengirim laporan ke atasan karena atasan adalah prioritas utama dalam organisasi.", pts: 3 },
            { txt: "Menyiapkan presentasi untuk acara besar karena acara tersebut dihadiri oleh banyak pejabat penting.", pts: 2 },
            { txt: "Menghubungi atasan untuk meminta panduan terkait tugas mana yang harus diprioritaskan.", pts: 1 }
        ]
    },
    {
        topic: "Sosial Budaya",
        q: "Anda bertugas di daerah dengan beragam latar belakang etnis dan agama. Terdapat konflik antara dua kelompok masyarakat yang melaksanakan perayaan budaya yang berbeda pada waktu yang sama. Anda sebagai ASN diharapkan untuk memfasilitasi dialog antara kedua kelompok. Apa yang akan Anda lakukan?",
        opts: [
            { txt: "Menyusun rencana acara yang melibatkan kedua kelompok untuk merayakan bersama.", pts: 5 },
            { txt: "Mencoba mendamaikan dengan mendengarkan keluhan masing-masing.", pts: 4 },
            { txt: "Mengusulkan salah satu kelompok untuk mengubah tanggal perayaan agar tidak bentrok.", pts: 3 },
            { txt: "Memanggil pihak atasan untuk menangani masalah ini agar tidak membebani Anda.", pts: 2 },
            { txt: "Mengabaikan konflik tersebut karena merasa bukan urusan Anda.", pts: 1 }
        ]
    }
];

// --- V5 FIGURAL ASSETS (SVG 기반) ---
const FIGURAL_SVG_TEMPLATES = [
    {
        type: "Jaring-jaring Kubus (Cube Folding)",
        content: `Perhatikan jaring-jaring kubus berikut! Jika jaring-jaring ini dirakit menjadi sebuah kubus, manakah kubus yang terbentuk dengan benar?
        
\`\`\`xml
<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Cube Net Logic -->
  <rect x="40" y="0" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
  <text x="60" y="25" text-anchor="middle" font-size="20" fill="currentColor">●</text>
  
  <rect x="0" y="40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
  <text x="20" y="65" text-anchor="middle" font-size="20" fill="currentColor">■</text>
  
  <rect x="40" y="40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
  <text x="60" y="65" text-anchor="middle" font-size="20" fill="currentColor">★</text>
  
  <rect x="80" y="40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
  <text x="100" y="65" text-anchor="middle" font-size="20" fill="currentColor">▲</text>
  
  <rect x="120" y="40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
  <text x="140" y="65" text-anchor="middle" font-size="20" fill="currentColor">◆</text>
  
  <rect x="40" y="80" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
  <text x="60" y="105" text-anchor="middle" font-size="20" fill="currentColor">✚</text>
</svg>
\`\`\`
`,
        correct: "Kubus dengan sisi depan ★, sisi atas ●, dan sisi kanan ▲",
        opts: [
            "Kubus dengan sisi depan ★, sisi atas ●, dan sisi kanan ▲",
            "Kubus dengan sisi depan ★, sisi atas ●, dan sisi kanan ■",
            "Kubus dengan sisi depan ■, sisi atas ●, dan sisi kanan ◆",
            "Kubus dengan sisi depan ★, sisi atas ✚, dan sisi kanan ■",
            "Kubus dengan sisi depan ✚, sisi atas ●, dan sisi kanan ◆"
        ],
        expl: "Pada jaring-jaring tersebut, ● berdekatan dengan ★ (bawah) dan ★ berdekatan dengan ▲ (kanan). Maka kemungkinan kubus yang benar adalah Front: ★, Top: ●, Right: ▲."
    },
    {
        type: "Rotasi 3D",
        content: `Melihat gambar di bawah ini, jika gambar tersebut diputar 90 derajat searah jarum jam secara diagonal terhadap sumbu Y, manakah posisi akhir yang benar?

\`\`\`xml
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="none" stroke="currentColor" stroke-width="2" />
  <path d="M20,20 L50,0 L110,0 L80,20" fill="none" stroke="currentColor" stroke-width="2" />
  <path d="M80,20 L110,0 L110,60 L80,80" fill="none" stroke="currentColor" stroke-width="2" />
  <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" stroke-width="2" />
  <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" stroke-width="1" stroke-dasharray="2" />
</svg>
\`\`\`
`,
        correct: "Gambar diputar ke arah horizontal sisi kanan",
        opts: [
            "Gambar diputar ke arah horizontal sisi kanan",
            "Gambar tetap di posisi semula",
            "Gambar menjadi terbalik secara vertikal",
            "Gambar menghilang sebagian",
            "Gambar membesar dua kali lipat"
        ],
        expl: "Rotasi 90 derajat searah jarum jam pada sumbu vertikal (Y) akan menggeser orientasi sisi depan ke arah samping (kanan)."
    }
];

// --- V6 PROCEDURAL FIGURAL GENERATOR ---

// Helper for dynamic SVG symbols
const getDynamicSymbol = (r: () => number) => {
    const symbols = [
        '<circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="2" />',
        '<rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" stroke-width="2" />',
        '<path d="M50,20 L80,80 L20,80 Z" fill="none" stroke="currentColor" stroke-width="2" />',
        '<path d="M25,25 L75,75 M75,25 L25,75" stroke="currentColor" stroke-width="2" />',
        '<rect x="35" y="35" width="30" height="30" fill="currentColor" />',
        '<path d="M50,25 L75,50 L50,75 L25,50 Z" fill="none" stroke="currentColor" stroke-width="2" />'
    ];
    return getRandomItem(symbols, r);
};

const generateDynamicMatrixSVG = (seed: number, r: () => number) => {
    const symbols = [
        (rot: number, scale: number) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${rot} 50 50) ${scale < 1 ? 'scale('+scale+') translate('+(50/scale-50)+' '+(50/scale-50)+')' : ''}"><path d="M50,20 L80,80 L20,80 Z" fill="${scale < 0.8 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="50" r="10" fill="currentColor"/></g></svg>`,
        (rot: number, scale: number) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${rot} 50 50)"><path d="M20,50 L80,50 M50,20 L50,80" stroke="currentColor" stroke-width="4"/><rect x="${scale < 1 ? 30 : 40}" y="${scale < 1 ? 30 : 40}" width="${scale < 1 ? 40 : 20}" height="${scale < 1 ? 40 : 20}" fill="none" stroke="currentColor" stroke-width="2"/></g></svg>`,
        (rot: number, scale: number) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${rot} 50 50)"><rect x="25" y="25" width="50" height="50" fill="${rot > 90 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="3"/><path d="M25,25 L75,75 M75,25 L25,75" stroke="currentColor" stroke-width="${scale < 1 ? 1 : 4}"/></g></svg>`,
    ];
    const symbolIndex = Math.floor(r() * symbols.length);
    const draw = symbols[symbolIndex % symbols.length];
    
    // Complex pattern: Rotation + Scaling/Fill Toggle
    const matrix: any[][] = [];
    for(let row=0; row<3; row++) {
        const rowData: any[] = [];
        for(let col=0; col<3; col++) {
            if (row === 2 && col === 2) {
                rowData.push('?');
            } else {
                const rot = (row * 90 + col * 45) % 360;
                const scale = 1 - (row + col) * 0.1;
                rowData.push(draw(rot, scale));
            }
        }
        matrix.push(rowData);
    }
    
    const finalRot = (2 * 90 + 2 * 45) % 360;
    const finalScale = 1 - (2 + 2) * 0.1;
    const correctSvg = draw(finalRot, finalScale);
    
    return {
        type: "Matriks Gambar Lanjut",
        content: `Tentukan gambar yang tepat untuk mengisi tanda tanya (?) pada matriks berikut. Perhatikan pola rotasi dan perubahan detail internal secara simultan!\n\n:::MATRIX:::\n${JSON.stringify(matrix)}\n:::`,
        correct: correctSvg,
        opts: [
            correctSvg,
            draw((finalRot + 90) % 360, finalScale),
            draw(finalRot, 1.0),
            draw((finalRot + 180) % 360, finalScale - 0.2),
            `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20" fill="currentColor"/></svg>`
        ],
        expl: `Pola melibatkan rotasi bertahap (90° per baris, 45° per kolom) serta pengecilan skala/detail secara linear dari kiri atas ke kanan bawah.`
    };
};
const generateDynamicCubeNetSVG = (seed: number, r: () => number) => {
    const symbols = ['●', '■', '▲', '★', '◆', '✚', '✿', '❖', '❄', '✪'];
    const netSymbols = shuffle([...symbols], r);
    
    const svg = `<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <!-- Jaring-jaring -->
      <rect x="40" y="0" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
      <text x="60" y="27" text-anchor="middle" font-size="20" fill="currentColor">${netSymbols[0]}</text>
      <rect x="0" y="40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
      <text x="20" y="67" text-anchor="middle" font-size="20" fill="currentColor">${netSymbols[1]}</text>
      <rect x="40" y="40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
      <text x="60" y="67" text-anchor="middle" font-size="20" fill="currentColor">${netSymbols[2]}</text>
      <rect x="80" y="40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
      <text x="100" y="67" text-anchor="middle" font-size="20" fill="currentColor">${netSymbols[3]}</text>
      <rect x="120" y="40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
      <text x="140" y="67" text-anchor="middle" font-size="20" fill="currentColor">${netSymbols[4]}</text>
      <rect x="40" y="80" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" />
      <text x="60" y="107" text-anchor="middle" font-size="20" fill="currentColor">${netSymbols[5]}</text>
    </svg>`;
    
    const correctAns = `Kubus dengan sisi depan ${netSymbols[2]}, sisi atas ${netSymbols[0]}, dan sisi kanan ${netSymbols[3]}`;
    
    return {
        type: "Jaring-jaring Kubus Dinamis",
        content: `Perhatikan jaring-jaring kubus berikut! Jika dirakit, manakah kubus yang terbentuk dengan benar?\n\n\`\`\`xml\n${svg}\n\`\`\``,
        correct: correctAns,
        opts: [
            correctAns,
            `Kubus dengan sisi depan ${netSymbols[2]}, sisi atas ${netSymbols[0]}, dan sisi kanan ${netSymbols[1]}`,
            `Kubus dengan sisi depan ${netSymbols[1]}, sisi atas ${netSymbols[0]}, dan sisi kanan ${netSymbols[4]}`,
            `Kubus dengan sisi depan ${netSymbols[5]}, sisi atas ${netSymbols[2]}, dan sisi kanan ${netSymbols[1]}`,
            `Kubus dengan sisi depan ${netSymbols[3]}, sisi atas ${netSymbols[5]}, dan sisi kanan ${netSymbols[4]}`
        ],
        expl: "Pada jaring-jaring ini, sisi yang saling berhadapan adalah (top-bottom) dan (left-right). Sisi yang berdekatan dapat membentuk sudut kubus jika dirakit dengan benar."
    };
};

const generateDynamicSeriesSVG = (seed: number, r: () => number) => {
    const symbolIndex = Math.floor(r() * 4);
    const symbols = [
        (pos: number) => `<circle cx="${50 + pos * 10}" cy="50" r="${15 + pos * 5}" fill="${pos % 2 === 0 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" />`,
        (pos: number) => `<rect x="${25 + pos * 10}" y="25" width="50" height="50" fill="none" stroke="currentColor" stroke-width="2" transform="rotate(${pos * 45} 50 50)"/><circle cx="${50 + pos * 10}" cy="50" r="10" fill="currentColor"/>`,
        (pos: number) => `<path d="M50,${20 + pos * 10} L${80 - pos * 10},80 L${20 + pos * 10},80 Z" fill="${pos === 3 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" />`,
        (pos: number) => `<polygon points="${50 + pos*5},${20 + pos*5} ${80 + pos*10},${70 + pos*5} ${20 + pos*5},${70 + pos*10}" fill="none" stroke="currentColor" stroke-width="${2 + pos}" transform="rotate(${pos * 90} 50 50)"/>`
    ];
    const draw = symbols[symbolIndex];
    
    let svgContent = "";
    for(let i=0; i<4; i++) {
        svgContent += `<g transform="translate(${i * 110 + 10} 10)">
            <rect x="0" y="0" width="100" height="100" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4" />
            <g transform="translate(0 0)">${draw(i)}</g>
        </g>`;
        if (i < 3) svgContent += `<line x1="${(i+1)*110 - 5}" y1="60" x2="${(i+1)*110 + 5}" y2="60" stroke="currentColor" stroke-width="2" />`;
    }
    
    let svg = `<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">${svgContent}
        <g transform="translate(450 10)">
            <rect x="0" y="0" width="40" height="100" fill="none" opacity="0.1" stroke="currentColor"/>
            <text x="20" y="65" text-anchor="middle" font-size="40" font-weight="bold" fill="currentColor">?</text>
        </g>
    </svg>`;
    
    const correctSvg = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><g transform="translate(10 10)">${draw(4)}</g></svg>`;
    const generateOpt = (i: number) => `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><g transform="translate(10 10)">${draw(i)}</g></svg>`;

    return {
        type: "Serial Gambar SVG (Dinamis)",
        content: `Perhatikan pola serial gambar berikut. Manakah kelanjutan yang paling logis untuk mengisi tanda tanya (?)\n\n\`\`\`xml\n${svg}\n\`\`\``,
        correct: correctSvg,
        opts: [
            correctSvg,
            generateOpt(0),
            generateOpt(Math.floor(r() * 3)),
            `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="20" width="80" height="80" fill="currentColor"/></svg>`,
            `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><text x="60" y="70" text-anchor="middle" font-size="40">∅</text></svg>`
        ],
        expl: "Pola serial ini melibatkan perubahan properti objek (ukuran, rotasi, atau ketebalan) secara bertahap dan konsisten."
    };
};

const generateDoubleTransformFigural = (seed: number, r: () => number) => {
    const shapes = ['●', '■', '▲', '★', '◆'];
    const s1 = getRandomItem(shapes, r);
    const transforms = [
        { name: "Rotasi 90° + Ubah Warna Jelas/Gelap", res: "● (Hitam/Putih Berlawanan)" },
        { name: "Mirroring + Ukuran Berkurang", res: "Objek Terbalik & Kecil" },
        { name: "Duplikasi + Pergeseran Diagonal", res: "Dua Objek Bertumpuk" },
        { name: "Rotasi 180° + Arsir Internal", res: "Objek Terbalik dengan Garis-garis" }
    ];
    const t = getRandomItem(transforms, r);
    
    return {
        type: "Transformasi Ganda (Analogi)",
        content: `Jika objek [ ${s1} ] mengalami [ ${t.name} ], manakah hasil yang paling tepat sesuai dengan logika pola tersebut?`,
        correct: t.res,
        opts: [t.res, "Hanya rotasi saja", "Hanya perubahan warna saja", "Objek menghilang", "Objek menjadi tiga buah"],
        expl: "Perhatikan bahwa ada dua perubahan sekaligus yang terjadi pada objek awal (Transformasi Ganda)."
    };
};

const generateOddOneOutSVG = (seed: number, r: () => number) => {
    const symbolIndex = Math.floor(r() * 3);
    const symbols = [
        (rot: number, isOdd: boolean) => `<g transform="rotate(${rot} 50 50)"><rect x="30" y="30" width="40" height="40" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="${isOdd ? 80 : 20}" r="5" fill="currentColor"/></g>`,
        (rot: number, isOdd: boolean) => `<g transform="rotate(${rot} 50 50)"><polygon points="50,20 80,80 20,80" fill="none" stroke="currentColor" stroke-width="3"/><line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" stroke-width="${isOdd ? 2 : 5}"/></g>`,
        (rot: number, isOdd: boolean) => `<g transform="rotate(${rot} 50 50)"><circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="3"/><line x1="20" y1="50" x2="${isOdd ? 80 : 50}" y2="50" stroke="currentColor" stroke-width="3"/></g>`
    ];
    const draw = symbols[symbolIndex];
    
    // Create 5 options, 4 are same but rotated, 1 is odd
    const optionsArray = [];
    const oddIndex = Math.floor(r() * 5);
    
    for (let i = 0; i < 5; i++) {
        const rot = (Math.floor(r() * 4) * 90);
        const isOdd = i === oddIndex;
        // Output clean SVG wrapped
        const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${draw(rot, isOdd)}</svg>`;
        optionsArray.push(svg);
    }
    
    const correctSvg = optionsArray[oddIndex];
    
    return {
        type: "Ketidaksamaan Gambar",
        content: `Carilah gambar yang **berbeda** letak/polanya di antara kelompok gambar berikut:\n\nTipe Ketidaksamaan (Pilih gambar yang tidak sesuai pola orientasi/elemen).`,
        correct: correctSvg,
        opts: optionsArray,
        expl: "Empat gambar merupakan objek yang sama namun direfleksikan atau dirotasi. Gambar yang berbeda memiliki susunan elemen internal yang diubah orientasinya secara berlawanan."
    };
};

const generateProceduralFigural = (seed: number, index: number): { content: string, correct: string, opts: string[], expl: string, type: string } => {
    const r = pseudoRandom(seed);
    
    let mode;
    // Force SVG mode for items 20 to 28
    if (index >= 20 && index <= 28) {
        const pureVisualModes = [1, 3, 4, 7];
        mode = getRandomItem(pureVisualModes, r);
    } else {
        mode = Math.floor(r() * 8); // Expanded variety
    }

    if (mode === 0) {
        // Rotation & Mirroring
        const baseShape = getRandomItem(['▲', '◀', '▶', '▼', '◆', '⬟', '⬢', '⭘'], r);
        const rotationSteps = ['90° CW', '180°', '270° CW', 'Horizontal Flip'];
        const step = getRandomItem(rotationSteps, r);
        
        return {
            type: "Rotasi & Pencerminan",
            content: `Jika objek [ ${baseShape} ] mengalami transformasi [ ${step} ], manakah hasil yang benar?`,
            correct: `Hasil transformasi ${step}`,
            opts: [
                `Hasil transformasi ${step}`,
                "Objek tetap sama",
                "Objek membesar 2x",
                "Objek berubah warna",
                "Objek menghilang"
            ],
            expl: `Transformasi ${step} mengubah orientasi dasar objek [ ${baseShape} ] secara spesifik.`
        };
    } else if (mode === 1) {
        // Dynamic Matrix SVG
        return generateDynamicMatrixSVG(seed, r);
    } else if (mode === 2) {
        // Double Transform
        return generateDoubleTransformFigural(seed, r);
    } else if (mode === 3) {
        // Cube Net
        return generateDynamicCubeNetSVG(seed, r);
    } else if (mode === 4) {
        // Series SVG
        return generateDynamicSeriesSVG(seed, r);
    } else if (mode === 5) {
        // Dynamic Logic (Analogi)
        const s1 = getRandomItem(['(A)', '(B)', '(C)'], r);
        const s2 = getRandomItem(['(X)', '(Y)', '(Z)'], r);
        return {
            type: "Analogi Gambar (Dinamis)",
            content: `Jika [ ${s1} ] menjadi [ ${s2} ], maka [ (M) ] akan menjadi ...? (Gunakan logika perbandingan yang sama)`,
            correct: "(N)",
            opts: ["(N)", "(O)", "(P)", "(Q)", "(R)"],
            expl: "Analogi gambar memerlukan pencarian hubungan transformasi yang konsisten antara pasangan pertama untuk diterapkan pada pasangan kedua."
        };
    } else if (mode === 6) {
        // Logical Addition / Subtraction of Shapes
        const shape1 = '●';
        const shape2 = '■';
        const combined = '◙';
        return {
            type: "Analogi Kombinasi",
            content: `Jika [ ${shape1} ] + [ ${shape2} ] = [ ${combined} ], maka [ ▲ ] + [ ▼ ] = ...?`,
            correct: "⧓",
            opts: ["⧓", "⧔", "⧕", "⧖", "⧗"],
            expl: "Penggabungan dua segitiga berlawanan arah membentuk jam pasir (⧓)."
        };
    } else if (mode === 7) {
        return generateOddOneOutSVG(seed, r);
    } else {
        // Complex Series
        return {
            type: "Serial Kompleks",
            content: "Pola: [ ● ] ➔ [ ●● ] ➔ [ ●●● ] ➔ [ ●●●● ] ➔ ...?",
            correct: "[ ●●●●● ]",
            opts: ["[ ●●●●● ]", "[ ●●●●●● ]", "[ ○○○○○ ]", "[ ■■■■■ ]", "[ ★★★★★ ]"],
            expl: "Penambahan satu objek setiap langkah secara konsekutif."
        };
    }
};

const COMPLEX_SYLLOGISMS = [
    {
        q: "Premis 1: Semua mahasiswa tingkat akhir adalah teladan.\nPremis 2: Sebagian mahasiswa tingkat akhir bukan aktivis.\nPremis 3: Tidak ada aktivis yang tidak kompeten.\nKesimpulan yang tepat adalah ...",
        correct: "Sebagian teladan adalah kompeten",
        opts: [
            "Sebagian teladan adalah kompeten",
            "Semua teladan adalah aktivis",
            "Tidak ada teladan yang kompeten",
            "Sebagian aktivis bukan mahasiswa tingkat akhir",
            "Semua mahasiswa tingkat akhir adalah aktivis"
        ],
        expl: "Analisis: M (Mhs Akhir) ⊂ T (Teladan). Ada M yang b-A (bukan Aktivis). A ⊂ K (Kompeten). Karena ada M yang Aktivis, dan M adalah Teladan, maka ada Teladan yang Kompeten."
    },
    {
        q: "Premis 1: Semua peneliti adalah pencari kebenaran.\nPremis 2: Sebagian pencari kebenaran bukan skeptis.\nPremis 3: Tidak ada pencari kebenaran yang malas.\nKesimpulan yang tepat adalah ...",
        correct: "Sebagian peneliti bukan skeptis",
        opts: [
            "Sebagian peneliti bukan skeptis",
            "Semua skeptis adalah peneliti",
            "Tidak ada peneliti yang rajin",
            "Semua pencari kebenaran adalah peneliti",
            "Sebagian peneliti adalah pemalas"
        ],
        expl: "Berdasarkan hubungan himpunan, peneliti adalah bagian dari pencari kebenaran. Jika sebagian pencari kebenaran bukan skeptis, bisa disimpulkan ada peneliti yang tidak skeptis."
    }
];

const NUMERIC_COMPARISON_TEMPLATES = [
    {
        q: "Jika x = 12,5% dari 80 dan y = √64 - (2^3), maka perbandingan X dan Y adalah...",
        correct: "x > y",
        opts: ["x > y", "x < y", "x = y", "2x = y", "Hubungan tidak dapat ditentukan"],
        expl: "x = 0.125 * 80 = 10. y = 8 - 8 = 0. Jadi 10 > 0."
    },
    {
        q: "Sebuah dadu dilempar satu kali. Jika X adalah peluang munculnya mata dadu prima, dan Y adalah peluang munculnya mata dadu genap. Manakah hubungan yang benar?",
        correct: "x = y",
        opts: ["x = y", "x > y", "x < y", "2x = y", "x + y = 2"],
        expl: "P(Prima) = {2,3,5} = 3/6 = 0.5. P(Genap) = {2,4,6} = 3/6 = 0.5. Maka x = y."
    }
];

export const generateSKDPackage = (packageId: number, stream: 'CPNS' | 'KEDINASAN'): Question[] => {
    const questions: Question[] = [];
    const rand = pseudoRandom(packageId * 9999); 

    // ==========================================
    // 1. TWK GENERATION (30 Soal)
    // ==========================================
    for (let i = 0; i < 30; i++) {
        const template = TWK_TEMPLATES[(i + packageId) % TWK_TEMPLATES.length];
        
        // Add variation to UUD questions to make them specific
        let content = template.q;
        let correctAnswer = template.a[0]; // First option is correct in template
        let options = [...template.a];

        if (template.t === "UUD 1945" && i % 2 === 0) {
             content = "Bunyi Pasal 30 ayat (4) UUD 1945 berkaitan dengan peran Kepolisian Negara Republik Indonesia sebagai...";
             correctAnswer = "Alat negara yang menjaga keamanan dan ketertiban masyarakat";
             options = [correctAnswer, "Alat pertahanan negara", "Penjaga kedaulatan wilayah", "Komponen cadangan pertahanan", "Pengatur kebijakan kriminal"];
        }

        questions.push({
            id: `p${packageId}-twk-${i}`,
            type: 'multiple_choice',
            content: content,
            options: shuffle(options, rand),
            correctAnswer: correctAnswer,
            explanation: template.expl || `Jawaban: ${correctAnswer}.`,
            metadata: { difficulty: 'Hard', idealTimeSeconds: 50, topic: 'TWK', subtest: `TWK - ${template.t}` }
        });
    }

    // ==========================================
    // 2. TIU GENERATION (35 Soal)
    // ==========================================
    for (let i = 0; i < 35; i++) {
        let content, correct, options, subtest, expl;

        if (i < 10) {
            // TIU NUMERIK (Hard + Perbandingan)
            subtest = "TIU - Numerik";
            
            if (i % 3 === 0) {
                // Perbandingan Kuantitatif (X vs Y)
                const template = NUMERIC_COMPARISON_TEMPLATES[(i + packageId) % NUMERIC_COMPARISON_TEMPLATES.length];
                content = template.q;
                correct = template.correct;
                options = shuffle([...template.opts], rand);
                expl = template.expl;
                subtest = "TIU - Perbandingan Kuantitatif";
            } else {
                const template = TIU_NUMERIC_TEMPLATES[(i + packageId) % TIU_NUMERIC_TEMPLATES.length];
                // Add algorithmic variation for "Hitung Cepat"
                if (i % 4 === 1) {
                const a = Math.floor(rand() * 5) + 2;
                const b = Math.floor(rand() * 5) + 2;
                content = `Nilai dari (${a} + √${b})/(${a} - √${b}) + (${a} - √${b})/(${a} + √${b}) adalah...`;
                // Formula: 2(a^2 + b) / (a^2 - b)
                const num = 2 * (a*a + b);
                const den = a*a - b;
                const res = num / den;
                
                if (Number.isInteger(res)) {
                    correct = res.toString();
                    options = shuffle([correct, (res + 2).toString(), (res - 2).toString(), (res * 2).toString(), "0"], rand);
                    expl = `Gunakan rumus cepat: (x+y)/(x-y) + (x-y)/(x+y) = 2(x²+y²)/(x²-y²). Disini x=${a}, y=√${b}.`;
                } else {
                    // Fallback to template if not integer
                    content = template.q;
                    correct = template.correct;
                    options = shuffle(template.opts, rand);
                    expl = template.expl;
                }
            } else {
                content = template.q;
                correct = template.correct;
                options = shuffle(template.opts, rand);
                expl = template.expl;
            }
        }
    } else if (i < 20) {
            // TIU VERBAL (Hard + Silogisme Kompleks)
            subtest = "TIU - Verbal";
            
            if (i % 4 === 0) {
                const template = COMPLEX_SYLLOGISMS[(i + packageId) % COMPLEX_SYLLOGISMS.length];
                content = template.q;
                correct = template.correct;
                options = shuffle([...template.opts], rand);
                expl = template.expl;
                subtest = "TIU - Silogisme Kompleks";
            } else {
                const template = TIU_VERBAL_TEMPLATES[(i + packageId) % TIU_VERBAL_TEMPLATES.length];
                content = template.q;
                correct = template.correct;
                options = shuffle(template.opts, rand);
                expl = template.expl;
            }

        } else {
            // TIU FIGURAL (Dynamic Procedural)
            const proc = generateProceduralFigural(i + packageId + 100, i);
            content = proc.content;
            correct = proc.correct;
            options = shuffle([...proc.opts], rand);
            expl = proc.expl;
            subtest = `TIU - Figural (${proc.type})`;
        }

        questions.push({
            id: `p${packageId}-tiu-${i}`,
            type: 'multiple_choice',
            content,
            options: options,
            correctAnswer: correct,
            explanation: expl,
            metadata: { difficulty: 'Hard', idealTimeSeconds: 60, topic: 'TIU', subtest }
        });
    }

    // ==========================================
    // 3. TKP GENERATION (45 Soal)
    // ==========================================
    for (let i = 0; i < 45; i++) {
        const template = TKP_SCENARIOS[(i + packageId) % TKP_SCENARIOS.length];
        
        // Shuffle options but keep track of points
        const shuffledOpts = shuffle([...template.opts], rand);

        questions.push({
            id: `p${packageId}-tkp-${i}`,
            type: 'multiple_choice',
            content: template.q,
            options: shuffledOpts.map((o: any) => o.txt),
            correctAnswer: template.opts.find((o: any) => o.pts === 5)?.txt || "",
            tkpPoints: shuffledOpts.map((o: any) => ({ option: o.txt, points: o.pts })),
            explanation: `Topik: ${template.topic}. Jawaban terbaik (5 poin) menunjukkan tindakan paling proaktif dan solutif.`,
            metadata: { difficulty: 'Medium', idealTimeSeconds: 45, topic: 'TKP', subtest: `TKP - ${template.topic}` }
        });
    }

    return questions;
};
