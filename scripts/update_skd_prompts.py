import re

with open('services/geminiService.ts', 'r') as f:
    content = f.read()

# Update TWK Prompts
twk_prompt_1 = """`[V7 - HOTS IMPLEMENTATION, MINIMIZE HAFALAN] Tes Wawasan Kebangsaan (TWK). UNIQUE SEED: ${randomSeed}. 
GENERATE EXACTLY 15 QUESTIONS WITH THIS DISTRIBUTION:
- 6 questions about "Nasionalisme" (Focus on daily life/office implementation, not historical dates)
- 6 questions about "Integritas" (Focus on anti-corruption scenarios and ethical dilemmas)
- 3 questions about "Bela Negara" (Focus on modern context defense and societal contributions)
CRITICAL: For each question, set the metadata.subtest field to EXACTLY one of these strings matching its topic: "TWK - Nasionalisme", "TWK - Integritas", or "TWK - Bela Negara". Use long, descriptive scenarios.`"""

twk_prompt_2 = """`[V7 - HOTS IMPLEMENTATION, MINIMIZE HAFALAN] Tes Wawasan Kebangsaan (TWK). UNIQUE SEED: ${randomSeed}. 
GENERATE EXACTLY 15 QUESTIONS WITH THIS DISTRIBUTION:
- 3 questions about "Bela Negara" (Focus on modern context defense and societal contributions)
- 6 questions about "Pilar Negara" (Focus on practical implementation of Pancasila & UUD 1945 in real-world cases, NOT pure memorization of articles)
- 6 questions about "Bahasa Indonesia" (Focus on reading comprehension, ide pokok, kalimat efektif, using long paragraphs)
CRITICAL: For each question, set the metadata.subtest field to EXACTLY one of these strings matching its topic: "TWK - Bela Negara", "TWK - Pilar Negara", or "TWK - Bahasa Indonesia". Use long, descriptive scenarios.`"""

# Replace TWK prompts
content = re.sub(r'`Tes Wawasan Kebangsaan \(TWK\)\. UNIQUE SEED: \$\{randomSeed\}\. \nGENERATE EXACTLY 15 QUESTIONS WITH THIS DISTRIBUTION:\n- 6 questions about "Nasionalisme"\n- 6 questions about "Integritas"\n- 3 questions about "Bela Negara"\nCRITICAL: For each question, set the metadata\.subtest field to EXACTLY one of these strings matching its topic: "TWK - Nasionalisme", "TWK - Integritas", or "TWK - Bela Negara"\. MUST BE HIGHLY UNIQUE AND NOT REPEAT COMMON PATTERNS\.`', twk_prompt_1, content)

content = re.sub(r'`Tes Wawasan Kebangsaan \(TWK\)\. UNIQUE SEED: \$\{randomSeed\}\. \nGENERATE EXACTLY 15 QUESTIONS WITH THIS DISTRIBUTION:\n- 3 questions about "Bela Negara"\n- 6 questions about "Pilar Negara"\n- 6 questions about "Bahasa Indonesia"\nCRITICAL: For each question, set the metadata\.subtest field to EXACTLY one of these strings matching its topic: "TWK - Bela Negara", "TWK - Pilar Negara", or "TWK - Bahasa Indonesia"\. MUST BE HIGHLY UNIQUE AND NOT REPEAT COMMON PATTERNS\.`', twk_prompt_2, content)

# Update TIU Prompts
tiu_verbal_prompt = """`[V7 - DEEP ANALYSIS, AVOID CLICHES, VERY HARD] SKD TIU - VERBAL. UNIQUE SEED: ${randomSeed}.
GENERATE EXACTLY 10 QUESTIONS WITH THIS DISTRIBUTION:
- 3 questions about "Analogi" (Word relationships)
- 3 questions about "Silogisme" (Logical deductions)
- 4 questions about "Analitis" (Complex analytical reasoning scenarios)
CRITICAL: For each question, set the metadata.subtest field to EXACTLY one of these strings: "TIU - Analogi", "TIU - Silogisme", or "TIU - Analitis".`"""

tiu_figural_prompt = """`[V7 - UNIQUE ABSTRACT SPATIAL REASONING, EXTREMELY HARD] SKD TIU - FIGURAL. EXTREME DIFFICULTY. YOU MUST OUTPUT <svg> FOR ALL QUESTIONS, AND <svg> FOR EACH OPTION. NO TEXT OPTIONS. UNIQUE SEED: ${randomSeed}.
GENERATE EXACTLY 10 QUESTIONS WITH THIS DISTRIBUTION:
- 3 questions about "Analogi Gambar"
- 4 questions about "Serial Gambar"
- 3 questions about "Ketidaksamaan Gambar"
CRITICAL: 
1. For each question, set the metadata.subtest field to EXACTLY one of these strings: "TIU - Analogi Gambar", "TIU - Serial Gambar", or "TIU - Ketidaksamaan Gambar".`"""

# Replace TIU prompts
content = re.sub(r'`\[V7 - DEEP ANALYSIS, AVOID CLICHES, VERY HARD\] SKD TIU - VERBAL\. UNIQUE SEED: \$\{randomSeed\}\.\nGENERATE EXACTLY 12 QUESTIONS WITH THIS DISTRIBUTION:\n- 2 questions about "Analogi Kata"\n- 2 questions about "Analogi Kalimat"\n- 5 questions about "Silogisme"\n- 3 questions about "Analitis"\nCRITICAL: For each question, set the metadata\.subtest field to EXACTLY one of these strings: "TIU - Analogi Kata", "TIU - Analogi Kalimat", "TIU - Silogisme", or "TIU - Analitis"\.`', tiu_verbal_prompt, content)
# Also change the 12 to 10 in the function call
content = re.sub(r'\}, 12, \[\], stream, undefined, \'HOTS\'\);', '}, 10, [], stream, undefined, \'HOTS\');', content)

content = re.sub(r'`\[V7 - UNIQUE ABSTRACT SPATIAL REASONING, EXTREMELY HARD\] SKD TIU - FIGURAL\. EXTREME DIFFICULTY\. YOU MUST OUTPUT <svg> FOR ALL QUESTIONS, AND <svg> FOR EACH OPTION\. NO TEXT OPTIONS\. UNIQUE SEED: \$\{randomSeed\}\.\nGENERATE EXACTLY 8 QUESTIONS WITH THIS DISTRIBUTION:\n- 1 questions about "Analogi Gambar"\n- 2 questions about "Serial Gambar"\n- 2 question about "Pola 9 Kotak Gambar" \(Matriks 3x3\)\n- 3 questions about "Ketidaksamaan Gambar"\nCRITICAL: \n1\. For each question, set the metadata\.subtest field to EXACTLY one of these strings: "TIU - Analogi Gambar", "TIU - Serial Gambar", "TIU - Pola 9 Kotak Gambar", or "TIU - Ketidaksamaan Gambar"\.\n2\. MATRIX 3X3: Ensure the matrix follows complex 2D geometric logic \(Rows & Columns dependency\)\.`', tiu_figural_prompt, content)
# Change the 8 to 10 in the function call
content = re.sub(r'\}, 8, \[\], stream, undefined, \'HOTS\'\);', '}, 10, [], stream, undefined, \'HOTS\');', content)


# Update TKP p3
# Replace "- 2 questions about "TIK"\n- 6 questions about "Profesionalisme"" with "- 1 question about "TIK"\n- 7 questions about "Profesionalisme""
content = content.replace('- 2 questions about "TIK"\n- 6 questions about "Profesionalisme"', '- 1 question about "TIK"\n- 7 questions about "Profesionalisme"')

with open('services/geminiService.ts', 'w') as f:
    f.write(content)

