#!/bin/bash
# probe.sh <file> <old> <new> : apply a one-line probe mutant to the snapshot, run the two act test files, restore.
SNAP=/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit
f="$1"; old="$2"; new="$3"
cd "$SNAP" || exit 1
python3 - "$f" "$old" "$new" <<'PY'
import sys
p, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p).read()
n = s.count(old)
if n != 1: print(f"MUTANT NOT APPLIED: {n} matches"); sys.exit(2)
open(p, 'w').write(s.replace(old, new))
print("mutant applied to", p)
PY
rc=$?
if [ $rc -eq 0 ]; then
  for t in test/systems/questlines/ql11_acts.test.js test/systems/questlines/ql12_lines.test.js; do
    out=$(node --test "$t" 2>&1 | grep -E "^# (pass|fail)")
    echo "  $t: $(echo $out | tr '\n' ' ')"
  done
fi
git checkout -- "$f"
git status --short "$f"
