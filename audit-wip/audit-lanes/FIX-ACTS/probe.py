# FIX-ACTS probe runner: sync the mirror from the live tree, then for each mutant apply its replacements to the MIRROR's
# copy, run the test file there, restore the copy from the live file. The live tree is never touched.
import subprocess, sys, shutil, os, re
LIVE = '/home/user/daggerfall-js-source'
F = os.path.dirname(os.path.abspath(__file__))
MIR = os.path.join(F, 'mirror')
sys.path.insert(0, F)
from mutants import M
only = sys.argv[1:]
TESTS = ['test/systems/questlines/ql11_acts.test.js']
for d in ('src', 'test'):
    shutil.rmtree(os.path.join(MIR, d), ignore_errors=True)
    subprocess.run(['cp', '-a', os.path.join(LIVE, d), os.path.join(MIR, d)], check=True)
def run():
    out = []
    for t in TESTS:
        r = subprocess.run(['node', '--test', t], cwd=MIR, capture_output=True, text=True, timeout=600)
        p = re.search(r'^# pass (\d+)', r.stdout, re.M); f = re.search(r'^# fail (\d+)', r.stdout, re.M)
        fails = re.findall(r'^not ok \d+ - (.{0,90})', r.stdout, re.M)
        out.append((t, p and p.group(1), f and f.group(1), fails))
    return out
base = run()
print('BASELINE (unmutated mirror):', [(t.split('/')[-1], p, f) for t, p, f, _ in base])
for mid, path, reps in M:
    if only and not any(mid.startswith(o) for o in only): continue
    target = os.path.join(MIR, path)
    s = open(target).read()
    ok = True
    for old, new in reps:
        n = s.count(old)
        if n != 1: print(f'{mid}: MUTANT NOT APPLIED ({n} matches for {old[:60]!r})'); ok = False; break
        s = s.replace(old, new)
    if not ok: continue
    open(target, 'w').write(s)
    try:
        res = run()
    finally:
        shutil.copyfile(os.path.join(LIVE, path), target)
    killed = any(f and f != '0' for _, _, f, _ in res)
    print(f"{'KILLED' if killed else 'SURVIVED'}  {mid}  " + '; '.join(f"{t.split('/')[-1]}: pass {p} fail {f}" for t, p, f, _ in res))
    for _, _, _, fails in res:
        for x in fails: print('      not ok -', x)
