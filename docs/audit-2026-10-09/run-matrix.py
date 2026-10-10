"""Reproduce the exploratory audit against the unmodified simulator."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, subprocess, re, time

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
cases = []
for character in ['scribe', 'bibliothecaire', 'griot', 'fou']:
    for meta in ['none', 'average', 'strong']:
        cases.append((0, 'null', character, meta, 'mixed'))
for build in ['mixed', 'armor', 'poison', 'bleed', 'ink', 'draw']:
    cases.append((2, 'null', 'scribe', 'strong', build))
for difficulty in [1, 3, 4, 5]:
    cases.append((difficulty, 'null', 'scribe', 'strong', 'mixed'))
for biome in ['LIBRARY','VIKING','GREEK','EGYPTIAN','LOVECRAFTIAN','AZTEC','CELTIC','RUSSIAN','AFRICAN']:
    cases.append((2, biome, 'scribe', 'strong', 'mixed'))

def run(case):
    difficulty, biome, character, meta, build = case
    name = f'd{difficulty}-{biome}-{character}-{meta}-{build}'
    args = ['node', '--import', 'tsx', 'scripts/simulate.ts', '100', str(difficulty), biome, character, meta, 'audit-20261009', f'--build={build}']
    started = time.time()
    p = subprocess.run(args, cwd=ROOT, capture_output=True, encoding='utf-8', errors='replace')
    (OUT / f'{name}.txt').write_text(p.stdout + p.stderr, encoding='utf-8')
    match = re.search(r'Taux de victoire\s*:\s*([\d.]+)%\s*\((\d+)/(\d+)\)', p.stdout)
    result = dict(name=name, difficulty=difficulty, biome=biome, character=character, meta=meta, build=build, exit=p.returncode, seconds=round(time.time()-started,2), wins=int(match[2]) if match else None, n=int(match[3]) if match else None)
    for key, label in [('turns','tours/run'),('combats','combats/run'),('deck','taille deck final'),('gold','or final')]:
        m = re.search(re.escape(label) + r'\s*:\s*([\d.]+)', p.stdout)
        result[key] = float(m[1]) if m else None
    return result

results = []
with ThreadPoolExecutor(max_workers=2) as pool:
    for future in as_completed([pool.submit(run,c) for c in cases]):
        result = future.result()
        results.append(result)
        (OUT / 'matrix.json').write_text(json.dumps(sorted(results,key=lambda x:x['name']), ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(result), flush=True)
