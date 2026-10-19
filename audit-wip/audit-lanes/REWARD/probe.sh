#!/bin/bash
# probe.sh <file> <old> <new> <test files...>: apply ONE exact-text mutant to the snapshot, run the named test files,
# restore the file with git checkout at once (even on failure), and report.
SNAP=/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit
cd "$SNAP" || exit 2
FILE="$1"; OLD="$2"; NEW="$3"; shift 3
if [ -n "$(git status --short -- "$FILE")" ]; then echo "SKIP: $FILE is dirty (another lane's probe?)"; exit 3; fi
trap 'git -C "$SNAP" checkout -- "$FILE"' EXIT
node -e '
const fs = require("fs"); const [f, o, n] = process.argv.slice(1);
const s = fs.readFileSync(f, "utf8"); const c = s.split(o).length - 1;
if (c !== 1) { console.error("mutant text occurs " + c + " times"); process.exit(4); }
fs.writeFileSync(f, s.replace(o, n));' "$FILE" "$OLD" "$NEW" || exit 4
echo "MUTANT in $FILE: '$OLD' -> '$NEW'"
for t in "$@"; do r=$(timeout 900 node --test "$t" 2>&1 | grep -E "^# (pass|fail)" | tr '\n' ' '); echo "   $r $t"; done
git -C "$SNAP" checkout -- "$FILE"; trap - EXIT
echo "   restored: $(git -C "$SNAP" status --short -- "$FILE" | wc -l) dirty"
