# Exact replace: python3 rep.py <file> <edits.json>  (edits: [[old, new], ...]; each old must occur exactly once)
import json, sys
path, edits = sys.argv[1], json.load(open(sys.argv[2]))
s = open(path, encoding='utf-8').read()
for old, new in edits:
    n = s.count(old)
    if n != 1: sys.exit(f'{path}: {n} matches for {old[:70]!r}')
    s = s.replace(old, new)
open(path, 'w', encoding='utf-8').write(s)
print('edited', path, len(edits))
