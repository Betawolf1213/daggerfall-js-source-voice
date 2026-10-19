# Exact replace from Python: from ed import rep; rep(path, [(old, new), ...]) - re-reads the file right before it writes.
def rep(path, edits):
    s = open(path, encoding='utf-8').read()
    for old, new in edits:
        n = s.count(old)
        if n != 1: raise SystemExit(f'{path}: {n} matches for {old[:80]!r}')
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8').write(s)
    print('edited', path.split('/')[-1], len(edits))
