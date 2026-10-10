from pathlib import Path
import subprocess, json, re
root=Path.cwd(); out=root/'docs/audit-2026-10-09'
cases=[('null','scribe','none',0),('null','scribe','strong',2),('null','fou','strong',0),('LIBRARY','scribe','strong',2),('GREEK','scribe','strong',2),('RUSSIAN','scribe','strong',2)]
results=[]
for biome,char,meta,diff in cases:
 p=subprocess.run(['node','--import','tsx','scripts/simulate.ts','100',str(diff),biome,char,meta,'audit-20261009','--verbose'],capture_output=True,encoding='utf-8',cwd=root)
 name=f'diagnostic-d{diff}-{biome}-{char}-{meta}'
 (out/(name+'.txt')).write_text(p.stdout+p.stderr,encoding='utf-8')
 losses=[x for x in p.stdout.splitlines() if '[DÉFAITE]' in x]
 timeouts=[x for x in losses if 'turns:60' in x]
 results.append(dict(name=name,losses=len(losses),timeouts=len(timeouts),timeoutEnemies=[re.search(r'\[([^\]]+)\]',x)[1] for x in timeouts]))
 (out/'diagnostic.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
 print(name,len(losses),len(timeouts),flush=True)
