# Probe mutants for fixer SCRIPTS' pins: each re-introduces one old line, runs the pin, and restores (a script file whole,
# a sheet field by the reverse edit under the writers' lock - the family file is shared).
import json, subprocess, sys, os, time
ROOT = '/home/user/daggerfall-js-source'
Q = ROOT + '/src/systems/questlines/quests/'
SHEET = ROOT + '/src/systems/questlines/sheets/questlines.json'
LOCK = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-sheets.lock'
TEST = 'test/systems/questlines/ql12_lines.test.js'
def run(pattern):
    r = subprocess.run(['node', '--test', '--test-name-pattern', pattern, TEST], cwd=ROOT, capture_output=True, text=True)
    out = r.stdout
    fails = [l for l in out.splitlines() if l.startswith('# fail')]
    return fails[0] if fails else '?'
def script_mutant(name, file, old, new, pattern):
    path = Q + file
    orig = open(path, encoding='utf-8').read()
    if orig.count(old) != 1: print(name, 'NO SITE', orig.count(old)); return
    open(path, 'w', encoding='utf-8').write(orig.replace(old, new))
    try: res = run(pattern)
    finally: open(path, 'w', encoding='utf-8').write(orig)
    print(f'{name}: {res}')
def lock():
    for i in range(400):
        try: os.mkdir(LOCK); return
        except FileExistsError: time.sleep(0.05)
    raise SystemExit('lock')
def sheet_set(quest, lst, rid, field, frm, to):
    lock()
    try:
        fmt = subprocess.run(['node', '-e', f'''
const fs=require("fs");import("{ROOT}/tools/qlFormat.mjs").then(({{formatFamily}})=>{{
const d=JSON.parse(fs.readFileSync("{SHEET}","utf8"));const s=d.sheets.find(x=>x.quest==="{quest}");
const row=s["{lst}"].find(r=>r.id==="{rid}");const frm={json.dumps(frm)};const to={json.dumps(to)};
if(JSON.stringify(row["{field}"])!==JSON.stringify(frm))throw new Error("not the expected "+JSON.stringify(row["{field}"]));
row["{field}"]=to;fs.writeFileSync("{SHEET}",formatFamily(d,"sheets"));}})'''], capture_output=True, text=True)
        if fmt.returncode: raise SystemExit(fmt.stderr)
    finally: os.rmdir(LOCK)
def sheet_mutant(name, quest, lst, rid, field, cur, old, pattern):
    sheet_set(quest, lst, rid, field, cur, old)
    try: res = run(pattern)
    finally: sheet_set(quest, lst, rid, field, old, cur)
    print(f'{name}: {res}')
P4, P8, PW, P26 = 'LINES-4:', 'LINES-8, ACTS-7', 'LINES-9, -10', 'LINES-26:'
script_mutant('M1 QLCH03 keep path `ql paid`', 'QLCH03.txt', '\toutcome _keep_\n\tgive pc _gold_\n', '\toutcome _keep_\n\tql paid\n', P4)
script_mutant('M2 QLCH03 1030 without the house', 'QLCH03.txt', '''<ce>       "Mind - the Guild gives a Spire key to a house
<ce>        once, %pcf. If one of your blood has taken one
<ce>        from us before you, there is none for you now.
<ce>        Well? Keep it, or let the Order seal it?"''', '<ce>          "Well, %pcf? Keep it, or let the Order seal it?"', P4)
script_mutant('M3 QLCH03 1040 slides the key', 'QLCH03.txt', '''<ce>       The priest of the Hour says nothing at all, and
<ce>                          leaves.
<ce>
<ce>       "Kept, then,"''', '''<ce>       Ysolde slides the key across the table to you.
<ce>       The priest of the Hour says nothing at all, and
<ce>                          leaves.
<ce>
<ce>       "Kept, then,"''', P4)
script_mutant("M4 QLIW02 purse and end in the letter's tick", 'QLIW02.txt', '\tgive pc _thanks_ notify 1012\n\thave _thanks_ set _paid_\n\n_paid_ task:\n', '\tgive pc _thanks_ notify 1012\n\n_paid_ task:\n', P8)
sheet_mutant('M5 QLIW02 word bound to _heard_', 'QLIW02', 'objectives', 'word', 'done', {'task': '_paid_'}, {'task': '_heard_'}, P8)
script_mutant('M6 QLWR04 3E 406', 'QLWR04.txt', 'today, and not 3E 398.', 'reads 3E 406.', PW)
script_mutant('M7 QLWR02 eight years', 'QLWR02.txt', 'every night since the Spire fell.', 'every night for eight years.', PW)
script_mutant('M8 QLWR01 always here', 'QLWR01.txt', 'I will be here until you have."', 'I will be here. I am always here."', PW)
script_mutant('M9 QLIT01 tomorrow', 'QLIT01.txt', '''is another game. A friend of mine plays it. I
<ce>        will send you to them."''', 'is another game. Ask me about it tomorrow."', PW)
script_mutant('M10 QLIP02 the court crafter', 'QLIP02.txt', '''colleague to judge it - _crafter_, who keeps the''', '''colleague to judge it - _crafter_, the court crafter, who keeps the''', PW)
script_mutant('M11 QLBD05 keepers of the Covenant', 'QLBD05.txt', 'To the Order of the Hour. Let', 'To the Order of the Hour, keepers of the Covenant. Let', PW)
sheet_mutant('M12 QLIW02 Beat a revenant', 'QLIW02', 'objectives', 'kneel', 'text', 'See one of your revenants brought to its knees', 'Beat a revenant until it kneels', PW)
script_mutant('M13 QLBD01 150 to 250', 'QLBD01.txt', 'Item _gold_ gold range 300 to 600', 'Item _gold_ gold range 150 to 250', PW)
script_mutant('M14 QLIA01 Somebody always bleeds last', 'QLIA01.txt', '''<ce>                   Somebody always bleeds.
<ce>
<ce>              The Herald of the Arena of Daggerfall
''', '''<ce>                   Somebody always bleeds.
''', P26)
script_mutant('M15 QLHR01 of the Order of the Hour alone', 'QLHR01.txt', '<ce>                  Prior Anselm Vey of the Order of the Hour\n', '<ce>                              Prior Anselm Vey\n<ce>                          of the Order of the Hour\n', P26)
