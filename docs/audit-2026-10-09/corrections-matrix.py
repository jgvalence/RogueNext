import subprocess,json,re,pathlib,concurrent.futures,time
root=pathlib.Path('docs/audit-2026-10-09'); started=time.time()
cases=[(c,m,d,b) for c in ['scribe','bibliothecaire','griot','fou'] for m in ['none','average'] for d in [0,1] for b in ['mixed','ink' if c in ['scribe','bibliothecaire','fou'] else 'poison']]
def run(case):
 c,m,d,b=case
 proc=subprocess.run(['node','--import','tsx','scripts/simulate.ts','30',str(d),'null',c,m,'audit-corrections-20261009','--build='+b],stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 out=proc.stdout.decode('utf-8',errors='replace');path=root/f'corrected-{c}-{m}-d{d}-{b}.txt';path.write_text(out,encoding='utf-8')
 match=re.search(r'victoire\s*:\s*([\d.]+)%',out)
 return dict(character=c,meta=m,difficulty=d,build=b,n=30,winRate=float(match.group(1)) if match else None,exitCode=proc.returncode)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 results=list(pool.map(run,cases))
(root/'corrections-matrix.json').write_text(json.dumps({'seed':'audit-corrections-20261009','seconds':time.time()-started,'results':results},indent=2),encoding='utf-8')
print(json.dumps(results))
