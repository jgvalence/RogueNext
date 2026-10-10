import concurrent.futures
import json
from pathlib import Path
import subprocess
import sys

stage = sys.argv[1]
root = Path(__file__).parent
paths = {'scribe':['ink','upgrade','exhaust'], 'bibliothecaire':['draw','archive','armor'], 'griot':['poison','bleed','rhythm'], 'fou':['ink','debt','strength','discard']}
if stage in ['03-before','03-calibrated','03-after']:
    n = 20
    cases = [(c,b,d,'strong',False) for c, bs in paths.items() for d in [3,4,5] for b in bs]
    seed = 'final-pass-high'
elif stage == '04-final':
    n = 30
    cases = [(c,b,d,'average' if d<2 else 'strong',False) for c,bs in paths.items() for d in range(6) for b in bs]
    cases += [(c,'mixed',0,'none',False) for c in paths]
    seed = 'final-pass-validation-independent'
elif stage == '04-strict':
    n = 30
    cases = [(c,b,d,'average' if d<2 else 'strong',True) for c,bs in paths.items() for d in [0,1,2] for b in bs if b!='armor']
    seed = 'final-pass-strict-independent'
else:
    raise ValueError(stage)

def run(case):
    c,b,d,m,strict=case
    name=f'{stage}-{c}-{b}-d{d}-{m}'
    path=root/(name+'.json')
    if not path.exists():
        command=['node','--import','tsx','scripts/simulate.ts',str(n),str(d),'null',c,m,seed,'--build='+b,'--json='+str(path)]
        if strict:command+=['--no-armor-payoffs']
        p=subprocess.run(command,capture_output=True)
        (root/(name+'.log')).write_bytes(p.stdout+p.stderr)
        if p.returncode:raise RuntimeError(name)
    data=json.loads(path.read_text(encoding='utf-8'))
    assert data['config']['numRuns']==n and data['config']['seed']==seed and not data['errors']
    result=dict(character=c,build=b,difficulty=d,meta=m,n=n,wins=data['wins'],file=path.name)
    print(json.dumps(result),flush=True)
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    rows=list(pool.map(run,cases))
(root/('matrix-'+stage+'.json')).write_text(json.dumps(rows,indent=2),encoding='utf-8')
