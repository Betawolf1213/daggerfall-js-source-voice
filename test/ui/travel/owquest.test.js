// OW-QUEST (2026-10-19, the owner, of the Overworld's gaps: "1. Do it"; bible/06-Systems/Travel-View.md OW-QUEST): WHERE
// THE QUESTS POINT, ON THE OVERWORLD. The held map's own marks (ui/quest/questMarks.js questMapMarks) - every active quest
// whose place is on the player's map - stand in the Overworld's marks (scenes/travelViewMarks.js) at their pixel's middle,
// a diamond in the journal's gold (ui/travel/travelViewHud.js questGlyph), the followed quest's filled and held at the edge;
// pressed, a journey there by the roads (scenes/world.js onTravelViewMark). Run over the real marks module, the real
// tracker and the real switch; the host's press pinned where it stands.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { createTravelViewMarks, questMarkWords, QUEST_OW_TITLE_MAX } from '../../../src/scenes/travelViewMarks.js';
import { questGlyph, TV_QUEST_R } from '../../../src/ui/travel/travelViewHud.js';
import { QUEST_MARK_CSS, MARKS_PREF } from '../../../src/ui/quest/questMarks.js';
import { questTracker, _resetQuestTrackerForTests, TRACKER_PREF } from '../../../src/ui/quest/questTracker.js';
import { markShown, markGroup, TV_FILTER_GROUPS } from '../../../src/systems/travel/travelViewFilters.js';
import { setPref } from '../../../src/systems/uiPrefs.js';
import { mapPixelToWorldCoords } from '../../../src/world/streamingWorld.js';
import { hostText } from '../../hostText.mjs';

const quiet = (fn) => { const w = console.warn, i = console.info; console.warn = () => {}; console.info = () => {}; try { return fn(); } finally { console.warn = w; console.info = i; } };
const view = (id, title, town, clockSeconds = null) => ({ id, title, updatedAt: 0, clockSeconds, latest: { lines: [' An entry.'] },
  target: { find: { regionIndex: 0, regionName: 'Daggerfall', locationName: town } }, words: { where: `${town} in Daggerfall province`, town } });
const PIXELS = { Bigtown: { x: 200, y: 210 }, Smalltown: { x: 205, y: 212 } };

/** The marks module over a host with nothing else on the Overworld - its quest marks alone are the subject. */
function marksHost() {
  const kept = [];
  const host = {
    TV_PLACE_LIFT: 12, _bandChase: new Map(), _bandSpent: new Set(), _hiddenPeers: new Set(), _lodesSensed: new Set(), _peerMapPoses: new Map(),
    _townOfMapId: new Map(), _tvBountyHold: new Map(), _tvLodeHold: new Map(), _tvPartyHold: new Map(), _tvVendorHold: {}, _tvWaypointHold: new Map(),
    _veils: new Set(), _wildStrangerIds: new Set(), bandMake: () => null, bandNowMs: () => 0, bandPlace: () => ({ x: 0, z: 0 }),
    cam: { pos: [0, 0, 0] }, carriageTown: () => false, csaOn: () => false, exteriorFoes: { foes: [] }, livingHideoutsHostOf: () => ({ marks: () => [] }),
    lodeSense: () => false, lodeWords: {}, motherlodeBook: { sensedAll: () => [] }, myGuildTag: () => null, params: new URLSearchParams(),
    player: { pos: [0, 0, 0] }, playerTravelPixel: () => ({ x: 200, y: 210 }), questPixel: (f) => PIXELS[f.locationName] ?? null,
    seaRaidPeerChase: () => null, townEcon: { tipFnAt: () => null },
    state: { worldCoords: () => { const o = mapPixelToWorldCoords(200, 210); return { x: o.x + 16384, z: o.z + 16384 }; } },
    travelViewBands: () => [], travelViewCamps: () => [], travelViewDungeons: () => [], travelViewFarPlaces: () => [], travelViewPlaces: () => [],
    travelViewRaiders: () => [], travellerBook: { live: () => [] }, tvRaid: { chase: new Map(), spent: new Set() },
    tvSceneKept: (h, x, z, lift) => { kept.push([x, z, lift]); return [x, lift, z]; },
    tvTrip: {}, tvTripLive: () => false, walkMode: true, wildCampKeys: () => new Set(), wildHidesPlayer: () => false,
  };
  return { kept, ...createTravelViewMarks(host) };
}

test('OW-QUEST the words: the first quest\'s title (the followed one first) cut at a word to QUEST_OW_TITLE_MAX with how many more stand there, and under it the distance and its time left (mutants: the count dropped; the cut unmade; the time left dropped)', () => {
  assert.equal(QUEST_OW_TITLE_MAX, 40);
  assert.deepEqual(questMarkWords({ quests: [{ title: 'The First Road', left: '3 days' }] }, '4.2 km'), { label: 'The First Road', sub: '4.2 km · 3 days' });
  assert.deepEqual(questMarkWords({ quests: [{ title: 'The First Road', left: '' }, { title: 'Same Town', left: '' }] }, '4.2 km'), { label: 'The First Road (+1)', sub: '4.2 km' });
  const long = questMarkWords({ quests: [{ title: 'A Very Long Quest Title That Will Not Fit The Mark At All', left: '' }] }, '1 km');
  assert.ok(long.label.length <= QUEST_OW_TITLE_MAX, long.label);
  assert.match(long.label, /^A Very Long Quest Title That Will Not…$/, 'cut at a word, an ellipsis');
  assert.equal(questMarkWords({ label: 'Bigtown', quests: [] }, '1 km').label, 'Bigtown', 'no title: the mark\'s own label');
});

test('OW-QUEST the marks: each quest place on the player\'s map a mark at its pixel\'s middle, the followed one filled and held at the edge with the distance, the rest where they lie; pressable; the card the held map\'s; none under the switch off (mutants: the pixel\'s corner; every quest held; the followed one not held; not pressable; the switch unread)', () => {
  const hadDoc = globalThis.document;
  globalThis.document ??= { createElement: () => ({}) };   // a page: marksOn's own premise
  quiet(() => { setPref(TRACKER_PREF, true); setPref(MARKS_PREF, true); });
  _resetQuestTrackerForTests();
  try {
    questTracker.hear({ quests: [view('1', 'The First Road', 'Bigtown', 90000), view('2', 'The Second Road', 'Smalltown')], events: [] });
    questTracker.toggle('2');
    const { travelViewMarks, kept } = marksHost();
    const quests = travelViewMarks().filter((m) => m.key.startsWith('quest:'));
    assert.deepEqual(quests.map((m) => [m.key, m.kind, m.edge, m.pick]), [['quest:200,210', 'quest', false, true], ['quest:205,212', 'quest tracked', true, true]]);
    const o = mapPixelToWorldCoords(205, 212);
    assert.ok(kept.some(([x, z, lift]) => x === o.x + 16384 && z === o.z + 16384 && lift === 12), 'the pixel\'s middle, a place\'s lift');
    const followed = quests.find((m) => m.kind === 'quest tracked');
    assert.equal(followed.label, 'The Second Road');
    assert.match(followed.sub, /km/, 'its distance');
    assert.equal(followed.tip.title, 'The Second Road', 'the held map\'s card');
    assert.match(quests[0].sub, /·/, 'a clock: the time left beside the distance');
    // the switch off: none
    quiet(() => setPref(MARKS_PREF, false));
    assert.equal(marksHost().travelViewMarks().filter((m) => m.key.startsWith('quest:')).length, 0, 'the quest marks\' own switch');
  } finally {
    _resetQuestTrackerForTests();
    quiet(() => setPref(MARKS_PREF, true));
    if (hadDoc === undefined) delete globalThis.document; else globalThis.document = hadDoc;
  }
});

test('OW-QUEST the look: never filtered (a quest is the point, not clutter); the held map\'s diamond in the journal\'s gold - the followed one filled, the rest hollow - on the dots\' black edge (mutants: a filter group; the fill always; the fill never)', () => {
  assert.equal(markGroup('quest'), null);
  assert.equal(markGroup('quest tracked'), null);
  const off = Object.fromEntries(TV_FILTER_GROUPS.map((g) => [g, false]));
  assert.equal(markShown({ kind: 'quest' }, off), true, 'every switch off: still shown');
  const ctx = () => { const ops = []; return { ops, fillStyle: '#111', strokeStyle: '#222', lineWidth: 1, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() { ops.push(['stroke', this.strokeStyle, this.lineWidth]); }, fill() { ops.push(['fill', this.fillStyle]); } }; };
  const a = ctx();
  questGlyph(a, 10, 10, true);
  assert.deepEqual(a.ops, [['stroke', '#000', 4], ['stroke', QUEST_MARK_CSS, 2], ['fill', QUEST_MARK_CSS]], 'followed: edged and filled');
  assert.deepEqual([a.fillStyle, a.strokeStyle, a.lineWidth], ['#111', '#222', 1], 'the brush handed back');
  const b = ctx();
  questGlyph(b, 10, 10, false);
  assert.ok(!b.ops.some((op) => op[0] === 'fill'), 'the rest: hollow');
  assert.equal(TV_QUEST_R, 7);
  const hud = readFileSync(new URL('../../../src/ui/travel/travelViewHud.js', import.meta.url), 'utf8');
  assert.match(hud, /if \(k === 'quest'\) return k;/, 'its own look');
  assert.match(hud, /\} else if \(look === 'quest'\) \{[^\n]*\n\s+questGlyph\(g, x, y, \/\\btracked\\b\/\.test\(m\.kind \?\? ''\)\);/, 'drawn as its diamond');
});

test('OW-QUEST the host: the quest marks read the host\'s own place law (questPixel, the compass\'s and the held map\'s), and a pressed diamond is a journey by the roads to its place - its summary from the pixel, wherever on the map it lies (mutants: the press unread; the pixel\'s numbers swapped)', () => {
  const w = hostText('src/scenes/world.js');
  assert.match(w, /createTravelViewMarks\(\{[^]*?playerTravelPixel, questPixel, seaRaidPeerChase,[^]*?\}\);/, 'handed the place law');
  assert.match(w, /const qp = \/\^quest:\(\\d\+\),\(\\d\+\)\$\/\.exec\(key\);[^\n]*\n\s+const plate = qp \? \{ summary: tvPlaceSummary\(Number\(qp\[1\]\), Number\(qp\[2\]\)\) \} : /, 'the press: its place by its pixel');
  assert.match(w, /if \(plate\?\.summary && travelViewCanGo\(\)\) travelViewRouteTo\(plate\.summary\);/, 'by the roads, where the view may go');
});
