import re

with open('services/geminiService.ts', 'r') as f:
    content = f.read()

# Function to inject V7 prompt instructions
def inject_v7(match):
    prefix = match.group(1)
    prompt = match.group(2)
    suffix = match.group(3)
    
    # Don't inject if it's already there
    if 'V7 - DEEP ANALYSIS' in prompt:
        return match.group(0)
        
    v7_instruction = "V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. "
    
    # If the prompt starts with backticks
    if prompt.startswith('`'):
        new_prompt = '`' + v7_instruction + prompt[1:]
    elif prompt.startswith('"'):
        new_prompt = '"' + v7_instruction + prompt[1:]
    elif prompt.startswith("'"):
        new_prompt = "'" + v7_instruction + prompt[1:]
    else:
        new_prompt = prompt
        
    return prefix + new_prompt + suffix

# We look for generateQuestions(StudyMode.SIMULATION, ..., `...`
# The prompt is the 3rd argument
pattern = re.compile(r'(generateQuestions\(\s*StudyMode\.SIMULATION\s*,\s*[^,]+,\s*)([`\'"][^`\'"]*[`\'"])(\s*,)')
content = pattern.sub(inject_v7, content)

# But prompts might have backticks and interpolation inside them.
# Let's do a simpler string replacement for common prompt markers.
replacements = [
    ('`SKD TWK - NASIONALISME', '`[V7 - DEEP ANALYSIS, NOVEL & FRESH QUESTIONS] SKD TWK - NASIONALISME'),
    ('`SKD TIU - VERBAL', '`[V7 - DEEP ANALYSIS, AVOID CLICHES, VERY HARD] SKD TIU - VERBAL'),
    ('`SKD TIU - NUMERIK', '`[V7 - ADVANCED MATH & NOVEL CONCEPTS] SKD TIU - NUMERIK'),
    ('`SKD TIU - FIGURAL', '`[V7 - UNIQUE ABSTRACT SPATIAL REASONING, EXTREMELY HARD] SKD TIU - FIGURAL'),
    ('`Tes Karakteristik Pribadi (TKP)', '`[V7 - DEEP SITUATIONAL JUDGMENT, HIGHLY NUANCED, REAL-WORLD SCENARIOS, AVOID PREDICTABLE OPTIONS] Tes Karakteristik Pribadi (TKP)'),
    ('Penalaran Umum (Penalaran Induktif)', '[V7 - DEEP ANALYSIS, FRESH SCENARIOS] Penalaran Umum (Penalaran Induktif)'),
    ('Penalaran Umum (Penalaran Deduktif)', '[V7 - DEEP ANALYSIS, FRESH SCENARIOS] Penalaran Umum (Penalaran Deduktif)'),
    ('Penalaran Umum (Penalaran Kuantitatif)', '[V7 - DEEP ANALYSIS, ADVANCED] Penalaran Umum (Penalaran Kuantitatif)'),
    ('Pengetahuan dan Pemahaman Umum', '[V7 - HIGH DIFFICULTY TEXTS] Pengetahuan dan Pemahaman Umum'),
    ('Pemahaman Bacaan dan Menulis', '[V7 - COMPLEX PASSAGES] Pemahaman Bacaan dan Menulis'),
    ('Pengetahuan Kuantitatif', '[V7 - EXTREME MATH DIFFICULTY] Pengetahuan Kuantitatif'),
    ('Literasi Bahasa Indonesia', '[V7 - ACADEMIC/SCIENTIFIC LEVEL TEXTS] Literasi Bahasa Indonesia'),
    ('Literasi Bahasa Inggris', '[V7 - TOEFL/IELTS ACADEMIC READING LEVEL] Literasi Bahasa Inggris'),
    ('Penalaran Matematika', '[V7 - NOVEL REAL WORLD MATH PROBLEMS] Penalaran Matematika'),
    ('`TPA - Verbal', '`[V7 - EXTREME VERBAL] TPA - Verbal'),
    ('`TPA - Kuantitatif', '`[V7 - EXTREME QUANTITATIVE] TPA - Kuantitatif'),
    ('`TPA - Penalaran', '`[V7 - EXTREME LOGIC] TPA - Penalaran'),
    ('`TBI - Bahasa Inggris', '`[V7 - ADVANCED ACADEMIC] TBI - Bahasa Inggris'),
    ('`PSIKOTEST KEDINASAN', '`[V7 - NOVEL PSYCHOMETRIC, UNPRECEDENTED VARIATIONS] PSIKOTEST KEDINASAN'),
    ('`TKA ${level}', '`[V7 - DEEP ANALYSIS, FRESH CONCEPTS] TKA ${level}'),
    ('SIMULATION - Tes Verbal Psikotes', '[V7 - NOVEL ANALOGIES & SILOGISM] SIMULATION - Tes Verbal Psikotes'),
    ('SIMULATION - Tes Numerik Psikotes', '[V7 - UNIQUE NUMBER PATTERNS] SIMULATION - Tes Numerik Psikotes'),
    ('SIMULATION - IQ & Spatial Logic', '[V7 - EXTREME UNSEEN 3D/SPATIAL PROBLEMS] SIMULATION - IQ & Spatial Logic'),
]

for old, new in replacements:
    content = content.replace(old, new)

# Also let's update package title generator in App.tsx or components where it's created, wait, the TO packages might be stored locally in Firebase or local storage. 
# They get a name from the UI, usually "Paket TO SKD #..." or just "Paket X".
# I'll let the user rename them or maybe just by changing the title logic slightly in App.tsx

with open('services/geminiService.ts', 'w') as f:
    f.write(content)

