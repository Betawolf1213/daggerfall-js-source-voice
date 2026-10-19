#!/bin/bash
# Probe mutants, applied to head/ (= git archive of the snapshot's HEAD fe033c256 - the shared worktree was being edited by
# other lanes' probes), each followed by the questlines tests and restored at once.
LANE=$(cd "$(dirname "$0")" && pwd); H=$LANE/head; cd $H
TESTS="test/systems/questlines/ql11_acts.test.js test/systems/questlines/ql12_ladders.test.js test/systems/questlines/ql12_lines.test.js test/systems/questlines/ql1_layer.test.js test/systems/questlines/ql1_sheets.test.js test/systems/questlines/ql4_actions.test.js test/systems/questlines/ql4_branches.test.js test/ui/questlines/ql2_journal.test.js test/systems/racialquests.test.js"
probe() {   # file, old, new, label
  cp "$1" "$1.bak"
  python3 - "$1" "$2" "$3" <<'PY'
import sys; p, old, new = sys.argv[1:]; s = open(p).read(); assert s.count(old) == 1, old; open(p, 'w').write(s.replace(old, new))
PY
  r=$(timeout 900 node --test $TESTS 2>&1 | grep -E "^# (pass|fail)" | tr '\n' ' ')
  mv "$1.bak" "$1"
  echo "$4: $r"
}
probe src/systems/questlines/qlLaw.js "    if (o?.failure && quest.questSuccess && isCatchAll(o)) o = fallbackOutcome(quest, sheet) ?? o;" "" "M1 observe's catch-all yield deleted"
probe src/systems/quest/machine.js "    if (ended && !quest.questComplete && !quest.questTombstoned) quest.hooks?.questEnding?.(quest);" "" "M2 tombstoneQuest's ended settle deleted"
probe src/systems/questlines/qlLayer.js "    if (resource?.itemName === 'letter') return;" "" "M3 reward's letter rule deleted"
probe src/systems/questlines/qlLayer.js "      if (!isStamped(quest) || quest.ql.moved) return null;" "      if (!isStamped(quest)) return null;" "M4 ending's moved guard deleted"
probe src/systems/questlines/qlLayer.js "if (sheet && dfItem && !quest.ql.paid) scaleGold" "if (sheet && dfItem) scaleGold" "M5 reward's paid guard on the gold deleted"
probe src/systems/questlines/qlLayer.js "quest.questTombstoned || quest.shelvedAt != null) continue;" "quest.questTombstoned) continue;" "M6 (control) act's shelved skip deleted"
