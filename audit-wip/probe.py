import subprocess, sys, json
probes = json.load(open(sys.argv[1]))
tests = sys.argv[2:]
for p in probes:
    f = p['file']; s = open(f).read()
    if s.count(p['old']) != 1: print('SITE?', p['name'], s.count(p['old'])); continue
    open(f, 'w').write(s.replace(p['old'], p['new']))
    try:
        r = subprocess.run(['node', '--test', *tests], capture_output=True, text=True, timeout=900)
        fail = [l for l in r.stdout.splitlines() if l.startswith('# fail')]
        print(('DIED   ' if fail and fail[0] != '# fail 0' else 'SURVIVED'), p['name'], fail)
    finally:
        open(f, 'w').write(s)
