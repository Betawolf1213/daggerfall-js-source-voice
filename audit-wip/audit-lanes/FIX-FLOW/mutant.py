# usage: python3 mutant.py NAME FILE TESTFILE  (OLD and NEW read from env MUT_OLD / MUT_NEW)
import os, sys, subprocess, shutil
name, f, test = sys.argv[1], sys.argv[2], sys.argv[3]
old, new = os.environ['MUT_OLD'], os.environ['MUT_NEW']
root = '/home/user/daggerfall-js-source'
path = os.path.join(root, f)
src = open(path).read()
if src.count(old) != 1:
    print(f'[{name}] MUTANT NOT APPLIED: old text found {src.count(old)} times'); sys.exit(2)
bak = path + '.mutbak'
shutil.copyfile(path, bak)
try:
    open(path, 'w').write(src.replace(old, new))
    r = subprocess.run(['node', '--test', test], cwd=root, capture_output=True, text=True, timeout=900)
    out = r.stdout
    fails = [l for l in out.splitlines() if l.startswith('not ok')]
    import re
    p = re.search(r'^# pass (\d+)', out, re.M); fl = re.search(r'^# fail (\d+)', out, re.M)
    print(f"[{name}] {'KILLED' if r.returncode else 'SURVIVED'} pass={p.group(1) if p else '?'} fail={fl.group(1) if fl else '?'}")
    for l in fails: print('   ', l[:200])
finally:
    shutil.copyfile(bak, path); os.remove(bak)
    assert open(path).read() == src
