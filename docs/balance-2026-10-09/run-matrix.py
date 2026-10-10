"""Same policy, seeds and configurations on both sides of the balance patch."""
import concurrent.futures
import json
import pathlib
import subprocess
import sys
import time

stage = sys.argv[1]
if stage not in ("before", "after", "stress"):
    raise ValueError("stage must be before, after or stress")
root = pathlib.Path("docs/balance-2026-10-09")
paths = {
    "scribe": ["mixed", "ink", "upgrade", "exhaust"],
    "bibliothecaire": ["mixed", "draw", "archive", "armor"],
    "griot": ["mixed", "poison", "bleed", "rhythm"],
    "fou": ["mixed", "ink", "debt", "strength", "discard"],
}
cases = [(c, "average", d, b) for c, builds in paths.items() for d in (0, 1) for b in builds]
cases += [(c, "none", 0, "mixed") for c in paths]
sample_size = 40
seed = "build-balance-20261009"
if stage == "stress":
    stress_paths = {"scribe": ["ink", "upgrade"], "bibliothecaire": ["draw", "armor"], "griot": ["poison", "bleed"], "fou": ["ink", "debt"]}
    cases = [(c, "strong", d, b) for c, builds in stress_paths.items() for d in (2, 3, 4, 5) for b in builds]
    sample_size = 30
    seed += "-stress"
started = time.time()

def run(case):
    character, meta, difficulty, build = case
    stem = f"{stage}-{character}-{meta}-d{difficulty}-{build}"
    result_path = root / f"{stem}.json"
    proc = subprocess.run([
        "node", "--import", "tsx", "scripts/simulate.ts", str(sample_size), str(difficulty),
        "null", character, meta, seed, "--build=" + build,
        "--json=" + str(result_path),
    ], capture_output=True)
    (root / f"{stem}.txt").write_bytes(proc.stdout + proc.stderr)
    data = json.loads(result_path.read_text(encoding="utf-8")) if result_path.exists() else {}
    row = dict(character=character, meta=meta, difficulty=difficulty, build=build,
               n=sample_size, wins=data.get("wins"), errors=data.get("errors"), exitCode=proc.returncode)
    print(json.dumps(row), flush=True)
    return row

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    rows = list(pool.map(run, cases))
(root / f"matrix-{stage}.json").write_text(json.dumps(dict(seconds=time.time()-started, rows=rows), indent=2), encoding="utf-8")
if any(row["exitCode"] != 0 for row in rows):
    sys.exit(1)
