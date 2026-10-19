# REWARD-5: add `base` to every `named` in questlines.json - textual, one exact `"named":{...}` at a time, verified by a
# JSON parse that nothing but the bases moved. Re-reads the file at the moment it writes.
import json, sys, copy
P = '/home/user/daggerfall-js-source/src/systems/questlines/sheets/questlines.json'
BASES = {
  ("QLBD05", "guild"): "Staff", ("QLBD05", "order"): "Ring", ("QLBD05", "broker"): "Left Pauldron",
  ("QLCH03", "seal"): "Ring", ("QLHR02", "daggerfall"): "Amulet", ("QLHR02", "sentinel"): "Saber",
  ("QLHR02", "wayrest"): "Kite Shield", ("QLHR02", "orsinium"): "War Axe", ("QLHR02", "underking"): "Cuirass",
  ("QLHR02", "blades"): "Katana", ("QLIA02", "named"): "Bracelet", ("QLIF02", "done"): "Amulet",
  ("QLIG02", "done"): "Cuirass", ("QLIP03", "done"): "Ring", ("QLIR02", "done"): "Gauntlets",
  ("QLIS03", "struck"): "Cuirass", ("QLIT02", "done"): "Mark", ("QLIW02", "done"): "Mace",
  ("QLOC03", "offering"): "Cloth Amulet", ("QLOC03", "scale"): "Round Shield", ("QLWR04", "truth"): "Helm",
  ("QLWR04", "mercy"): "Longsword",
}
src = open(P, encoding='utf-8').read()
before = json.loads(src)
want = copy.deepcopy(before)
seen = set()
for s in want['sheets']:
  for o in s.get('outcomes', []):
    if 'named' in o:
      k = (s['quest'], o['id'])
      if k not in BASES: sys.exit(f'no base chosen for {k}')
      seen.add(k)
      if o['named'].get('base') == BASES[k]: continue
      if 'base' in o['named']: sys.exit(f'{k} already names another base: {o["named"]["base"]}')
      old = json.dumps(o['named'], ensure_ascii=False, separators=(',', ':'))
      new = json.dumps({**o['named'], 'base': BASES[k]}, ensure_ascii=False, separators=(',', ':'))
      if src.count(old) != 1: sys.exit(f'{k}: the text {old} stands {src.count(old)} times')
      src = src.replace(old, new)
      o['named']['base'] = BASES[k]
if seen != set(BASES): sys.exit(f'bases for no named piece: {set(BASES) - seen}')
after = json.loads(src)
if after != want: sys.exit('the edit moved something besides the bases')
open(P, 'w', encoding='utf-8').write(src)
print(f'{len(seen)} named pieces, each with its base')
