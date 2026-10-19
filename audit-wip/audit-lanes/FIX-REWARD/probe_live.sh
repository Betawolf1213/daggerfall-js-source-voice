#!/bin/bash
# probe_live.sh <file> <old> <new> <test files...>: ONE exact-text mutant in the LIVE tree (a file this fixer owns),
# the named test files run, the file restored from its copy at once (even on failure).
ROOT=/home/user/daggerfall-js-source
cd "$ROOT" || exit 2
FILE="$1"; OLD="$2"; NEW="$3"; shift 3
BK=/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/FIX-REWARD/probe.bak
cp "$FILE" "$BK"
trap 'cp -f "$BK" "$ROOT/$FILE"' EXIT
node -e '
const fs = require("fs"); const [f, o, n] = process.argv.slice(1);
const s = fs.readFileSync(f, "utf8"); const c = s.split(o).length - 1;
if (c !== 1) { console.error("mutant text occurs " + c + " times"); process.exit(4); }
fs.writeFileSync(f, s.replace(o, n));' "$FILE" "$OLD" "$NEW" || exit 4
echo "MUTANT in $FILE: '$OLD' -> '$NEW'"
for t in "$@"; do out=$(timeout 900 node --test "$t" 2>&1); r=$(echo "$out" | grep -E "^# (pass|fail)" | tr '\n' ' '); echo "   $r $t"; echo "$out" | grep -E "^not ok" | head -8 | sed 's/^/      /'; done
cp -f "$BK" "$ROOT/$FILE"; trap - EXIT
cmp -s "$BK" "$ROOT/$FILE" && echo "   restored"
