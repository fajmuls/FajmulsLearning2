export interface VocabQuestion {
    word: string;
    type: 'SYNONYM' | 'ANTONYM';
    language: 'ID' | 'EN';
    correct: string;
    options: string[];
    meaning?: string;
}

export const ID_QUESTIONS: Omit<VocabQuestion, 'language'>[] = [
    { word: "Abolisi", type: "SYNONYM", correct: "Penghapusan", options: ["Penghapusan", "Penahanan", "Penyelidikan", "Pemberatan", "Pengaturan"], meaning: "Abolisi berarti penghapusan atau pembatalan, sering digunakan dalam konteks hukum (misal: abolisi hukuman mati)." },
    { word: "Sumbang", type: "ANTONYM", correct: "Selaras", options: ["Selaras", "Membantu", "Jahat", "Lurus", "Palsu"], meaning: "Sumbang berarti tidak selaras, janggal, atau melanggar adat. Antonimnya adalah selaras." },
    { word: "Senjang", type: "ANTONYM", correct: "Simetris", options: ["Simetris", "Proporsional", "Sama", "Identik", "Lunak"], meaning: "Senjang berarti tidak seimbang, asimetris, atau berlainan. Antonimnya adalah simetris/seimbang." },
    { word: "Evokasi", type: "SYNONYM", correct: "Penggugah rasa", options: ["Penggugah rasa", "Penilaian", "Penyatuan", "Perubahan", "Penyelamatan"], meaning: "Evokasi memiliki arti (kemampuan) membangkitkan atau menggugah ingatan dan rasa." },
    { word: "Konkret", type: "ANTONYM", correct: "Abstrak", options: ["Abstrak", "Nyata", "Asli", "Pasti", "Terlihat"], meaning: "Konkret berarti nyata dan dapat ditangkap pancaindra. Antonimnya abstrak (tidak berwujud)." },
    { word: "Nahas", type: "SYNONYM", correct: "Sial", options: ["Sial", "Baik", "Indah", "Nasib", "Keras"], meaning: "Nahas berarti celaka, sial, malang, atau hari yang tidak baik." },
    { word: "Epilog", type: "ANTONYM", correct: "Prolog", options: ["Prolog", "Akhir", "Monolog", "Katalog", "Dialog"], meaning: "Epilog adalah bagian penutup karya sastra. Antonimnya adalah prolog (pembukaan)." },
    { word: "Afeksi", type: "SYNONYM", correct: "Kasih Sayang", options: ["Kasih Sayang", "Kebencian", "Kekerasan", "Infeksi", "Dampak"], meaning: "Afeksi berarti rasa kasih sayang atau perasaan saling menyukai." },
    { word: "Prolog", type: "SYNONYM", correct: "Pembukaan", options: ["Pembukaan", "Penutup", "Isi", "Dialog", "Drama"], meaning: "Prolog adalah narasi atau adegan pendahuluan pembuka sebuah lakon." },
    { word: "Adhesi", type: "ANTONYM", correct: "Kohesi", options: ["Kohesi", "Pemisahan", "Gaya", "Sentrifugal", "Tarik"], meaning: "Adhesi adalah gaya tarik menarik antar molekul benda yang tidak sejenis. Antonimnya kohesi (sejenis)." },
    { word: "Baku", type: "SYNONYM", correct: "Standar", options: ["Standar", "Keras", "Utama", "Pokok", "Bebas"], meaning: "Baku memiliki arti patokan, tolok ukur, atau standar." },
    { word: "Kolektif", type: "ANTONYM", correct: "Individual", options: ["Individual", "Bersama", "Banyak", "Gabungan", "Pisah"], meaning: "Kolektif berarti secara bersama-sama/gabungan. Antonimnya individual (sendiri-sendiri)." },
    { word: "Mortalitas", type: "SYNONYM", correct: "Kematian", options: ["Kematian", "Kehidupan", "Kelahiran", "Moril", "Nasib"], meaning: "Mortalitas adalah angka pengukuran jumlah kematian. Sinonimnya kematian." },
    { word: "Skeptis", type: "SYNONYM", correct: "Ragu-ragu", options: ["Ragu-ragu", "Yakin", "Menolak", "Kasar", "Tegas"], meaning: "Skeptis berarti bersikap kurang percaya atau ragu-ragu terhadap keberhasilan sesuatu." },
    { word: "Sporadis", type: "ANTONYM", correct: "Sering", options: ["Sering", "Jarang", "Tetap", "Pasti", "Teratur"], meaning: "Sporadis berarti jarang-jarang, tidak merata, atau kadang-kadang. Antonimnya adalah sering/teratur." },
    { word: "Afirmasi", type: "SYNONYM", correct: "Penegasan", options: ["Penegasan", "Bantahan", "Hambatan", "Bentukan", "Gaya"], meaning: "Afirmasi berarti penetapan positif atau penegasan." },
    { word: "Dinamis", type: "ANTONYM", correct: "Statis", options: ["Statis", "Aktif", "Lentur", "Malas", "Bergerak"], meaning: "Dinamis artinya penuh pergerakan. Antonimnya adalah statis (tidak bergerak/diam)." },
    { word: "Ekletik", type: "SYNONYM", correct: "Memilih sesuatu yang terbaik", options: ["Memilih sesuatu yang terbaik", "Sembarangan", "Klasik", "Berlebihan", "Aneh"], meaning: "Eklektik berarti memilih yang terbaik dari berbagai sumber (menggabungkan yang baik)." },
    { word: "Prominen", type: "SYNONYM", correct: "Terkemuka", options: ["Terkemuka", "Biasa", "Rendahan", "Terbelakang", "Asing"], meaning: "Prominen berarti sangat menonjol atau terkemuka." },
    { word: "Kolega", type: "SYNONYM", correct: "Teman sejawat", options: ["Teman sejawat", "Kawan main", "Musuh", "Pesaing", "Atasan"], meaning: "Kolega berarti teman sejawat atau rekan kerja dalam suatu instansi." },
    { word: "Apriori", type: "ANTONYM", correct: "Aposteriori", options: ["Aposteriori", "Deduksi", "Kesimpulan", "Asumsi", "Sebelumnya"], meaning: "Apriori adalah menganggap sesuatu sebelum melihat. Aposteriori adalah berdasarkan pengamatan." },
    { word: "Defleksi", type: "SYNONYM", correct: "Penyimpangan", options: ["Penyimpangan", "Penyatuan", "Pemantulan", "Pergerakan", "Gaya"], meaning: "Defleksi berarti penyimpangan misalnya pada arah kompas atau cahaya." },
    { word: "Tentatif", type: "ANTONYM", correct: "Pasti", options: ["Pasti", "Sementara", "Uji coba", "Dinamis", "Berubah"], meaning: "Tentatif artinya belum pasti / masih sementara. Antonimnya adalah pasti / absolut (definite)." },
    { word: "Degradasi", type: "SYNONYM", correct: "Kemerosotan", options: ["Kemerosotan", "Peningkatan", "Perubahan", "Kehancuran", "Pendakian"], meaning: "Degradasi berarti kemerosotan, kemunduran, atau penurunan derajat." },
    { word: "Apatis", type: "SYNONYM", correct: "Acuh tak acuh", options: ["Acuh tak acuh", "Peduli", "Semangat", "Cemburu", "Ramah"], meaning: "Apatis artinya sikap tidak peduli atau acuh tak acuh terhadap keadaan sekeliling." },
    { word: "Otomatisasi", type: "ANTONYM", correct: "Manual", options: ["Manual", "Mekanis", "Dinamis", "Pneumatik", "Cepat"], meaning: "Otomatisasi berarti menggunakan mesin otonom. Antonimnya manual (tenaga manusia)." },
    { word: "Kontradiksi", type: "SYNONYM", correct: "Pertentangan", options: ["Pertentangan", "Persamaan", "Kesepakatan", "Gabungan", "Penyatuan"], meaning: "Kontradiksi artinya pertentangan antara dua hal yang berlawanan." },
    { word: "Ekspektasi", type: "SYNONYM", correct: "Harapan", options: ["Harapan", "Kenyataan", "Pencapaian", "Kemauan", "Niat"], meaning: "Ekspektasi berarti harapan atau keyakinan tentang sesuatu yang akan terjadi." },
    { word: "Sintesis", type: "ANTONYM", correct: "Analisis", options: ["Analisis", "Pembuatan", "Gabungan", "Pecahan", "Evaluasi"], meaning: "Sintesis adalah penggabungan (pemaduan). Antonimnya adalah analisis (penguraian)." },
    { word: "Progresif", type: "ANTONYM", correct: "Regresif", options: ["Regresif", "Maju", "Agresif", "Positif", "Hebat"], meaning: "Progresif berarti mengarah pada kemajuan. Antonimnya regresif (kemunduran)." }
];

export const EN_QUESTIONS: Omit<VocabQuestion, 'language'>[] = [
    { word: "Abundant", type: "SYNONYM", correct: "Plentiful", options: ["Plentiful", "Scarce", "Rare", "Enough", "Empty"], meaning: "Abundant means occurring in large amounts or plentiful." },
    { word: "Benevolent", type: "ANTONYM", correct: "Malevolent", options: ["Malevolent", "Kind", "Generous", "Cruel", "Happy"], meaning: "Benevolent means well meaning and kindly. The antonym is malevolent (showing ill will)." },
    { word: "Candid", type: "SYNONYM", correct: "Frank", options: ["Frank", "Deceitful", "Hidden", "Secret", "Reserved"], meaning: "Candid means truthful and straightforward; frank." },
    { word: "Diligent", type: "ANTONYM", correct: "Lazy", options: ["Lazy", "Hardworking", "Careful", "Quick", "Smart"], meaning: "Diligent means showing care in one's duties. Lazy is the direct antonym." },
    { word: "Eloquent", type: "SYNONYM", correct: "Articulate", options: ["Articulate", "Silent", "Confused", "Stuttering", "Dumb"], meaning: "Eloquent means fluent or persuasive in speaking or writing (articulate)." },
    { word: "Frugal", type: "ANTONYM", correct: "Extravagant", options: ["Extravagant", "Thrifty", "Poor", "Cheap", "Careful"], meaning: "Frugal means economical or thrifty. Antonym is extravagant (spending recklessly)." },
    { word: "Garrulous", type: "SYNONYM", correct: "Talkative", options: ["Talkative", "Quiet", "Silent", "Reserved", "Shy"], meaning: "Garrulous means excessively talkative, especially on trivial matters." },
    { word: "Ephemeral", type: "SYNONYM", correct: "Transient", options: ["Transient", "Permanent", "Eternal", "Briefly", "Heavy"], meaning: "Ephemeral means lasting for a very short time; transient or fleeting." },
    { word: "Sycophant", type: "SYNONYM", correct: "Flatterer", options: ["Flatterer", "Leader", "Enemy", "Friend", "Idol"], meaning: "Sycophant defines a person who acts obsequiously toward someone important in order to gain advantage (brown-noser or flatterer)." },
    { word: "Alleviate", type: "SYNONYM", correct: "Relieve", options: ["Relieve", "Worsen", "Cause", "Improve", "Hurt"], meaning: "Alleviate means to make (suffering, deficiency, or a problem) less severe. Relieve is a synonym." },
    { word: "Equivocal", type: "ANTONYM", correct: "Clear", options: ["Clear", "Ambiguous", "Doubtful", "Mysterious", "Loud"], meaning: "Equivocal means open to more than one interpretation (ambiguous). Antonym is clear/unequivocal." },
    { word: "Lucid", type: "SYNONYM", correct: "Clear", options: ["Clear", "Confused", "Dark", "Crazy", "Complex"], meaning: "Lucid means expressed clearly; easy to understand, or showing ability to think clearly." },
    { word: "Meticulous", type: "SYNONYM", correct: "Careful", options: ["Careful", "Sloppy", "Fast", "Angry", "Tidy"], meaning: "Meticulous means showing great attention to detail; very careful and precise." },
    { word: "Opulent", type: "ANTONYM", correct: "Poor", options: ["Poor", "Wealthy", "Luxurious", "Big", "Loud"], meaning: "Opulent means ostentatiously rich and luxurious or lavish. Antonym is poor/destitute." },
    { word: "Placate", type: "SYNONYM", correct: "Pacify", options: ["Pacify", "Irritate", "Feed", "Place", "Reject"], meaning: "Placate means make someone less angry or hostile. Synonym is to pacify or appease." },
    { word: "Pragmatic", type: "SYNONYM", correct: "Practical", options: ["Practical", "Theoretical", "Idealistic", "Smart", "Boring"], meaning: "Pragmatic means dealing with things sensibly and realistically (practical)." },
    { word: "Pugnacious", type: "ANTONYM", correct: "Peaceful", options: ["Peaceful", "Aggressive", "Ugly", "Strong", "Weak"], meaning: "Pugnacious means eager or quick to argue, quarrel, or fight. Antonym is peaceful." },
    { word: "Reticent", type: "SYNONYM", correct: "Reserved", options: ["Reserved", "Outgoing", "Loud", "Friendly", "Shy"], meaning: "Reticent means not revealing one's thoughts or feelings readily (reserved/introverted)." },
    { word: "Tenuous", type: "ANTONYM", correct: "Strong", options: ["Strong", "Weak", "Flimsy", "Long", "Thick"], meaning: "Tenuous means very weak or slight. Antonym is strong, substantial." },
    { word: "Zealous", type: "SYNONYM", correct: "Passionate", options: ["Passionate", "Apathetic", "Jealous", "Angry", "Calm"], meaning: "Zealous means showing great energy or enthusiasm in pursuit of a cause or an objective." },
    { word: "Ameliorate", type: "SYNONYM", correct: "Improve", options: ["Improve", "Destroy", "Start", "Combine", "End"], meaning: "Ameliorate means to make something bad or unsatisfactory better or improve." },
    { word: "Capricious", type: "ANTONYM", correct: "Stable", options: ["Stable", "Fickle", "Fast", "Funny", "Crazy"], meaning: "Capricious describes sudden and unaccountable changes of mood or behavior. Antonym is stable/consistent." },
    { word: "Didactic", type: "SYNONYM", correct: "Educational", options: ["Educational", "Confusing", "Entertaining", "Fast", "Dictatorial"], meaning: "Didactic means intended to teach, particularly in having moral instruction as an ulterior motive." },
    { word: "Enigma", type: "SYNONYM", correct: "Mystery", options: ["Mystery", "Answer", "Machine", "Animal", "Idea"], meaning: "An enigma is a person or thing that is mysterious, puzzling, or difficult to understand." },
    { word: "Fastidious", type: "ANTONYM", correct: "Careless", options: ["Careless", "Clean", "Quick", "Slow", "Picky"], meaning: "Fastidious means very attentive to and concerned about accuracy and detail. Antonym is careless." },
    { word: "Innocuous", type: "SYNONYM", correct: "Harmless", options: ["Harmless", "Dangerous", "Boring", "Important", "Viral"], meaning: "Innocuous means not harmful or offensive." },
    { word: "Lethargic", type: "SYNONYM", correct: "Sluggish", options: ["Sluggish", "Energetic", "Sick", "Light", "Heavy"], meaning: "Lethargic means affected by lethargy; sluggish and apathetic." },
    { word: "Prolific", type: "ANTONYM", correct: "Barren", options: ["Barren", "Productive", "Famous", "Rich", "Poor"], meaning: "Prolific means producing much fruit or foliage or many works. Antonym is barren or unproductive." },
    { word: "Superfluous", type: "SYNONYM", correct: "Extra", options: ["Extra", "Important", "High", "Low", "Perfect"], meaning: "Superfluous means unnecessary, especially through being more than enough." },
    { word: "Vacillate", type: "ANTONYM", correct: "Decide", options: ["Decide", "Waver", "Move", "Stay", "Think"], meaning: "Vacillate means to alternate or waver between different opinions or actions; be indecisive." }
];

export const generateVocabQuestions = async (lang: 'ID'|'EN'): Promise<VocabQuestion[]> => {
    // Return hardcoded list directly.
    let baseList = lang === 'ID' ? ID_QUESTIONS : EN_QUESTIONS;
    
    // Sort array randomly for every session.
    let shuffled = [...baseList].sort(() => 0.5 - Math.random());
    
    // Ensure all options are randomly shuffled as well
    const questions = shuffled.map(q => {
        const newOptions = [...q.options].sort(() => 0.5 - Math.random());
        return {
            ...q,
            options: newOptions,
            language: lang
        };
    });

    return questions;
}
