"""Corregge la pronuncia nel campo speech e cancella gli mp3 delle frasi cambiate,
cosi' la GitHub Action li rigenera. Uso: python3 fix_speech.py"""
import json, glob, os, re
RULES = [
    (re.compile(r'(?<=\w )Aziendal([ei])\b'), r'aziendal\1'),
]
changed = 0
for f in sorted(glob.glob('episodi/*/episodio-*.json')):
    m = f.split('/')[1]
    d = json.load(open(f, encoding='utf-8'))
    dirty = False
    for i, s in enumerate(d['sentences'], 1):
        targets = [s] + [p for p in s.get('parts', []) if p.get('lang', 'it') == 'it']
        before = json.dumps(s, ensure_ascii=False)
        for t in targets:
            key = 'speech' if t is s else 'text'
            for rx, rep in RULES:
                t[key] = rx.sub(rep, t[key])
        if json.dumps(s, ensure_ascii=False) != before:
            dirty = True; changed += 1
            mp3 = f"audio/{m}/episodio-{d['episode']}/frase-{i:02d}.mp3"
            if True:
                os.system("git rm -q --cached --sparse " + mp3)
    if dirty:
        json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('frasi corrette:', changed)
