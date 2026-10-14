// PARTY-LOOT's END-TO-END PROBE'S EDITS STAND IN THE TREE (test/perfon4_probes.test.js's law for the online probe's):
// tools/partyLootProbe.mjs plays the report in two browsers through two probe-only seams beside `__takeLoot` - what a
// body holds (`__bodyLoot`) and who holds the seat (`__seat`) - and a probe is not in the suite, so a change that moved
// the needle would be found by the next person to run it, minutes in. The needle is held to src/scenes/worldModes.js
// here, once, and the edit read off the source as the probe's own plugin serves it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { editsPlugin } from '../tools/frameProbe.mjs';
import { PARTY_LOOT_PROBE_EDITS } from '../tools/partyLootProbe.mjs';

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('PARTY-LOOT probe: its needle stands once in the file it names, and its plugin serves the two seams beside the loot door', () => {
  assert.deepEqual(PARTY_LOOT_PROBE_EDITS.map((r) => r.file), ['src/scenes/worldModes.js']);
  const code = src('src/scenes/worldModes.js');
  for (const [needle] of PARTY_LOOT_PROBE_EDITS[0].edits) assert.equal(code.split(needle).length - 1, 1, `the needle stands once - ${needle.slice(0, 70)}`);
  const served = editsPlugin('party-loot-probe', PARTY_LOOT_PROBE_EDITS).transform(code, '/repo/src/scenes/worldModes.js?v=1');
  assert.match(served, /window\.__takeLoot = \(k\) => \(dungeonCtx \? dungeonCtx\.takeLoot\(k\) : null\);\n\s*window\.__bodyLoot = \(i\) => \{ const f = dungeonCtx\?\.foes\?\.\[i\]; return f\?\.dead && f\.corpse \?/, 'what a body holds, read off the dungeon\'s own foe');
  assert.match(served, /window\.__seat = \(\) => \(dungeonCtx \? JSON\.stringify\(\{ authority: !!dungeonCtx\.isAuthority\?\.\(\), location: dungeonCtx\.locationKey\?\.\(\) \?\? null \}\) : null\);/, 'who holds the seat, by the context\'s own word');
  const dc = src('src/scenes/dungeonContext.js');
  assert.match(dc, /\n    isAuthority: \(\) => _authority,\n/, 'the seat\'s word the seam reads is the context\'s own api');
  assert.match(dc, /\n    locationKey: \(\) => _locationKey,\n/, 'and the room\'s');
});

test('PARTY-LOOT probe: the pack it opens and clicks is where the probe looks - the enhanced pack\'s host by its id, and each row by the item and side it carries (a loot-side click takes)', () => {
  assert.match(src('src/ui/inventoryDoor.js'), /\n  host\.id = 'enhanced-inventory';\n/, 'the pack the probe waits on and waits away');
  const inv = src('src/ui/enhancedInventory.js');
  assert.match(inv, /\n  row\._padItem = item; row\._padFrom = from;/, 'the row the probe clicks, by its side');
  assert.match(inv, /if \(from === 'remote' && remote\.kind !== 'reward'\) \{ take\(item\); return; \}/, 'and a loot row\'s click takes (IG7)');
  const probe = src('tools/partyLootProbe.mjs');
  assert.match(probe, /document\.getElementById\('enhanced-inventory'\)/, 'the probe reads that id');
  assert.match(probe, /e\._padFrom === 'remote'/, 'and that side');
});
