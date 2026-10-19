# The "-- Symbols used in the QRC file" counts against the QRC text: python3 occurs.py [--fix] files...
import re, sys
fix = '--fix' in sys.argv
for path in [a for a in sys.argv[1:] if a != '--fix']:
    s = open(path, encoding='utf-8').read()
    qrc = s.split('-- Symbols used in the QRC file:')[0]
    qrc = qrc[qrc.index('QRC:'):]
    body = '\n'.join(l for l in qrc.split('\n') if not l.startswith('--'))
    out = []
    def sub(m):
        sym, n = m.group(2), int(m.group(3))
        if sym.startswith('%'): real = len(re.findall(re.escape(sym) + r'(?![a-z0-9])', body))
        else: real = len(re.findall(r'(?<![_=a-zA-Z0-9])' + re.escape(sym) + r'(?![a-zA-Z0-9])', body)) if not sym.startswith('__') else len(re.findall(r'(?<!_)' + re.escape(sym) + r'(?![a-zA-Z0-9])', body))
        if real != n: out.append(f'{sym} {n}->{real}')
        return f'{m.group(1)}{sym} occurs {real} time{"s" if real != 1 else ""}.' if fix else m.group(0)
    s2 = re.sub(r'^(--\s+)(\S+) occurs (\d+) times?\.', sub, s, flags=re.M)
    if out: print(path.split('/')[-1], out)
    if fix and s2 != s: open(path, 'w', encoding='utf-8').write(s2)
