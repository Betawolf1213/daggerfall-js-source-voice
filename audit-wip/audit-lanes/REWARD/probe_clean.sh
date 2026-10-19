#!/bin/bash
# probe_clean.sh <file> <old> <new> <test files...>: the same probe as probe.sh, on this lane's private, byte-identical
# export of the snapshot's HEAD (clean/) - no other lane's mutant can reach it; the file is restored from a copy after.
ROOT=/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/REWARD/clean
cd "$ROOT" || exit 2
FILE="$1"; OLD="$2"; NEW="$3"; shift 3
cp "$FILE" "$FILE.orig"
trap 'mv -f "$ROOT/$FILE.orig" "$ROOT/$FILE"' EXIT
node -e '
const fs = require("fs"); const [f, o, n] = process.argv.slice(1);
const s = fs.readFileSync(f, "utf8"); const c = s.split(o).length - 1;
if (c !== 1) { console.error("mutant text occurs " + c + " times"); process.exit(4); }
fs.writeFileSync(f, s.replace(o, n));' "$FILE" "$OLD" "$NEW" || exit 4
echo "MUTANT in $FILE: '$OLD' -> '$NEW'"
for t in "$@"; do r=$(timeout 900 node --test "$t" 2>&1 | grep -E "^# (pass|fail)" | tr '\n' ' '); echo "   $r $t"; done
