"""Identical seeds and combat policy for before/after; isolated output labels."""
import concurrent.futures
import json
import pathlib
import subprocess
import sys
import time

stage = sys.argv[1]
if stage not in ('before', 'calibrated-before', 'after', 'confirmation', 'no-armor'):
    raise ValueError('before, after or confirmation required')
root = pathlib.Path('docs/rooms-balance-2026-10-10')
paths = {'scribe': ['ink', 'upgrade', 'exhaust'], 'bibliothecaire': ['draw', 'archive', 'armor'],
         'griot': ['poison', 'bleed', 'rhythm'], 'fou': ['ink', 'debt', 'strength', 'discard']}
cases = [(c, 'average' if d < 2 else 'strong', d, b) for c, builds in paths.items() for d in (0, 1, 2, 3, 5) for b in builds]
cases += [(c, 'none', 0, 'mixed') for c in paths]
sample_size = 30
seed = 'advanced-balance-20261010'
if stage == 'confirmation':
    cases = [(c, 'strong', 4, b) for c, builds in paths.items() for b in builds]
    seed += '-independent'
if stage == 'no-armor':
    cases = [(c, 'average' if d < 2 else 'strong', d, b) for c, builds in paths.items() for d in (0, 1, 2) for b in builds if b != 'armor']
    seed += '-no-armor-independent'
started = time.time()
def run(case):
    character, meta, difficulty, build = case
    stem = f'{stage}-{character}-{meta}-d{difficulty}-{build}'
    result_path = root / f'{stem}.json'
    if result_path.exists():
        data = json.loads(result_path.read_text(encoding='utf-8'))
        return dict(character=character, meta=meta, difficulty=difficulty, build=build, n=sample_size, wins=data.get('wins'), errors=data.get('errors'), exitCode=0)
    proc = subprocess.run(['node', '--import', 'tsx', 'scripts/simulate.ts', str(sample_size), str(difficulty),
        'null', character, meta, seed, '--build=' + build, '--json=' + str(result_path)] + (['--no-armor-payoffs'] if stage == 'no-armor' else []), capture_output=True)
    (root / f'{stem}.log').write_bytes(proc.stdout + proc.stderr)
    data = json.loads(result_path.read_text(encoding='utf-8')) if result_path.exists() else {}
    row = dict(character=character, meta=meta, difficulty=difficulty, build=build, n=sample_size,
               wins=data.get('wins'), errors=data.get('errors'), exitCode=proc.returncode)
    print(json.dumps(row), flush=True)
    return row
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    rows = list(pool.map(run, cases))
(root / f'matrix-{stage}.json').write_text(json.dumps(dict(seconds=time.time()-started, rows=rows), indent=2), encoding='utf-8')
if any(row['exitCode'] or row['errors'] for row in rows):
    sys.exit(1)
