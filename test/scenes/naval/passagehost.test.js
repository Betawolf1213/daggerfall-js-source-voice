// PASSAGE (2026-10-19; bible/03-World/Passage.md) - THE VOYAGE'S HOST HALF (scenes/naval/passageHost.js), over stand-in
// doors: the booking (her master's ports, the question, all of it or none of it) and the passage's life (sailed on when
// a voyage stops, over when I step off her - her hold ashore, her boat gone, her record forgotten).

import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPassageHost } from '../../../src/scenes/naval/passageHost.js';
import { ListPickerWindow } from '../../../src/ui/listPicker.js';
import { YesNoBoxWindow } from '../../../src/ui/yesNoBox.js';
import { PASSAGE_TEXT, PASSAGE_LEAVE_M, PASSAGE_FIRST_S, PASSAGE_RESUME_S, PASSAGE_RESUMES, passageFare } from '../../../src/systems/naval/passage.js';

const read = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
const PORTS = [
  { key: '100,100', name: 'Daggerfall', px: 100, py: 100 },
  { key: '130,100', name: 'Sentinel', px: 130, py: 100 },
  { key: '100,60', name: 'Wayrest', px: 100, py: 60 },
];
const SHIP = { id: 'local:3', name: 'The Fair Silk', captain: 'Ana Rhea', hull: 2, faction: 'merchant' };

/** A world of stand-ins: Come Sail Away's runtime (its boats, its helm, its laying up), the sea's charter, the journey,
 *  the purse and the pack. `o` changes a door. */
function world(o = {}) {
  const log = { say: [], shown: [], spawned: [], paid: [], forgot: [], routed: [], sailed: [], laid: [] };
  const w = { gold: o.gold ?? 200, feet: [0, 0, 0], live: false, onDeck: false, pack: [], log };
  const rt = {
    AllBoats: [], state: { CurrentBoat: null }, sailing: false,
    isSailing() { return this.sailing; },
    StartSailing(b) { if (o.helmThrows) throw new Error('no helm'); this.sailing = true; this.state.CurrentBoat = b; w.feet = [...b.GameObject.position]; },
    StopSailing() { this.sailing = false; this.state.CurrentBoat = null; },
    LayUpBoat(b) { if (b === this.state.CurrentBoat) return false; log.laid.push(b.uid); this.AllBoats.splice(this.AllBoats.indexOf(b), 1); return true; },
    forgetHold(uid) { log.forgot.push(['hold', uid]); return true; },
  };
  w.rt = rt;
  const naval = {
    charter(id, record) {
      if (o.gone) return null;
      const boat = { uid: 9001, charter: record, GameObject: { position: [50, 0, 0] }, Cargo: { Items: [] } };
      rt.AllBoats.push(boat);
      return boat;
    },
    charterSailed(id) { log.sailed.push(id); return true; },
  };
  w.host = createPassageHost({
    naval: () => naval, csa: () => (o.csaOff ? null : rt),
    ports: () => o.ports ?? PORTS, here: () => PORTS[0], pixel: () => ({ x: 100, y: 100 }), ether: () => !!o.ether,
    place: (p) => (p.name === 'Wayrest' && !o.knowsWayrest ? null : { name: p.name, pixel: { x: p.px, y: p.py } }),
    canGo: () => (o.canGo ?? true), route: (s) => { log.routed.push(s.name); if (o.route === false) return false; w.live = true; return true; },
    journeyLive: () => w.live, aboard: (b) => rt.state.CurrentBoat === b || w.onDeck,
    feet: () => w.feet, spawn: (f) => { log.spawned.push([...f]); w.feet = [...f]; },
    gold: () => w.gold, pay: (n) => { log.paid.push(n); w.gold -= n; }, pack: () => w.pack, forgetBoat: (uid) => log.forgot.push(['boat', uid]),
    say: (t) => log.say.push(t), show: (win) => log.shown.push(win),
  });
  return w;
}
/** Her master's list up, a row picked, and the question answered. */
function bookTo(w, name, yes = true) {
  assert.equal(w.host.offer(SHIP), true, 'the list goes up');
  const list = w.log.shown.at(-1);
  assert.ok(list instanceof ListPickerWindow);
  const i = list.items.findIndex((r) => r.startsWith(name));
  assert.ok(i >= 0, `${name} listed`);
  list._pick(i);
  const box = w.log.shown.at(-1);
  assert.ok(box instanceof YesNoBoxWindow, 'then the question');
  box.answer(yes);
  return box;
}

test('PASSAGE host: her master\'s ports - every port I know but this one, nearest first with its fare; the question names the fare beside the purse; Yes makes the passage - her boat, the helm, the voyage begun, then her ship let go and the fare paid (mutants: paid before the voyage began; her ship never let go; the unknown port listed)', () => {
  const w = world();
  w.host.offer(SHIP);
  const list = w.log.shown[0];
  assert.deepEqual(list.items, [`Sentinel - east, ${passageFare({ x: 100, y: 100 }, { x: 130, y: 100 })} gold`], 'never Daggerfall (I stand at it), never Wayrest (never discovered)');
  list._pick(0);
  const box = w.log.shown[1];
  assert.deepEqual(box.rows, PASSAGE_TEXT.ask(SHIP.name, 'Sentinel', 50, 200));
  assert.deepEqual(w.log.paid, [], 'nothing paid until Yes');
  box.answer(true);
  const boat = w.rt.AllBoats[0];
  assert.ok(boat, 'her boat stands');
  assert.deepEqual(boat.charter, { to: { name: 'Sentinel', px: 130, py: 100 }, ship: SHIP.name, captain: SHIP.captain, fare: 50 }, 'the voyage written on her');
  assert.equal(w.rt.state.CurrentBoat, boat, 'at her helm');
  assert.deepEqual(w.log.routed, ['Sentinel'], 'the voyage begun');
  assert.deepEqual(w.log.sailed, [SHIP.id], 'her ship let go');
  assert.deepEqual(w.log.paid, [50]);
  assert.equal(w.log.say.at(-1), PASSAGE_TEXT.booked(SHIP.name, SHIP.captain, 50, 'Sentinel'));
  assert.equal(w.host.charterBoat(), boat);
  assert.equal(w.host.offer(SHIP), false, 'one passage at a time');
  assert.equal(w.log.say.at(-1), PASSAGE_TEXT.booking);
});

test('PASSAGE host: ALL OF IT OR NONE OF IT - a voyage refused (the route will not go, a foe near, the helm will not take) puts everything back: her boat gone, the player where they stood, nothing paid, her ship at her berth; a purse short and her ship gone ask nothing (mutants: the refusal leaves her boat; the fare taken on a refusal; the player left at her helm)', () => {
  for (const o of [{ route: false }, { canGo: false }, { helmThrows: true }]) {
    const w = world({ ...o, knowsWayrest: true });
    w.feet = [3, 1, 4];
    const warn = console.warn; console.warn = () => {};
    try { bookTo(w, 'Wayrest'); } finally { console.warn = warn; }
    assert.deepEqual(w.rt.AllBoats, [], `${JSON.stringify(o)}: no boat left`);
    assert.deepEqual(w.log.paid, [], 'nothing paid');
    assert.deepEqual(w.log.sailed, [], 'her ship at her berth');
    assert.equal(w.rt.isSailing(), false, 'no helm held');
    assert.deepEqual(w.feet, [3, 1, 4], 'set back where I stood');
    if (o.helmThrows) assert.equal(w.log.say.at(-1), PASSAGE_TEXT.failed);
  }
  const poor = world({ gold: 49 });
  bookTo(poor, 'Sentinel');
  assert.equal(poor.log.say.at(-1), PASSAGE_TEXT.poor(50));
  assert.deepEqual([poor.rt.AllBoats.length, poor.log.paid.length], [0, 0]);
  const gone = world({ gone: true });
  bookTo(gone, 'Sentinel');
  assert.equal(gone.log.say.at(-1), PASSAGE_TEXT.gone);
  assert.deepEqual(gone.log.paid, []);
});

test('PASSAGE host: no list where none can sail - Come Sail Away off, past the Veil, no port known (mutants: a list with the mod off)', () => {
  const off = world({ csaOff: true });
  assert.equal(off.host.offer(SHIP), false);
  assert.deepEqual([off.log.shown.length, off.log.say.at(-1)], [0, PASSAGE_TEXT.noSail]);
  const veil = world({ ether: true });
  assert.equal(veil.host.offer(SHIP), false);
  assert.equal(veil.log.say.at(-1), PASSAGE_TEXT.ether);
  const lone = world({ ports: [PORTS[0], PORTS[2]] });
  assert.equal(lone.host.offer(SHIP), false, 'only the port I stand at, and one never discovered');
  assert.deepEqual([lone.log.shown.length, lone.log.say.at(-1)], [0, PASSAGE_TEXT.none]);
});

test('PASSAGE host: THE PASSAGE\'S LIFE - aboard with no voyage under way, her master sails on (first after PASSAGE_FIRST_S, then each PASSAGE_RESUME_S, PASSAGE_RESUMES times at most, then says he will sail no further); on her deck away from the helm, the helm is asked for; paused, nothing moves (mutants: never resumed; resumed past the cap; resumed off the helm)', () => {
  const w = world();
  bookTo(w, 'Sentinel');
  w.live = false;   // a foe stopped the voyage
  w.host.frame(PASSAGE_RESUME_S - 0.5);
  assert.deepEqual(w.log.routed, ['Sentinel'], 'not yet');
  w.host.frame(100, true);
  assert.deepEqual(w.log.routed, ['Sentinel'], 'paused: nothing');
  w.host.frame(1);
  assert.deepEqual(w.log.routed, ['Sentinel', 'Sentinel'], 'sails on');
  for (let i = 1; i < PASSAGE_RESUMES; i++) { w.live = false; w.host.frame(PASSAGE_RESUME_S); }
  assert.equal(w.log.routed.length, 1 + PASSAGE_RESUMES);
  w.live = false;
  w.host.frame(PASSAGE_RESUME_S);
  w.host.frame(PASSAGE_RESUME_S);
  assert.equal(w.log.routed.length, 1 + PASSAGE_RESUMES, 'no further');
  assert.equal(w.log.say.filter((t) => t === PASSAGE_TEXT.stood('Sentinel')).length, 1, 'said once');
  // a load put me on her deck, off the helm: a fresh host's first try waits PASSAGE_FIRST_S, and asks for the helm
  const v = world();
  bookTo(v, 'Sentinel');
  const boat = v.rt.AllBoats[0];
  const loaded = world();
  loaded.rt.AllBoats.push(boat);
  boat.packable = true;   // her hull's own word, as a load stands her
  loaded.onDeck = true;
  loaded.feet = [50, 0, 0];
  loaded.host.frame(PASSAGE_FIRST_S + 0.1);
  assert.equal(boat.packable, false, 'never packed, after a load too');
  assert.deepEqual(loaded.log.routed, [], 'never routed off the helm');
  assert.equal(loaded.log.say.at(-1), PASSAGE_TEXT.helm('Sentinel'));
  loaded.rt.StartSailing(boat);
  loaded.host.frame(PASSAGE_RESUME_S);
  assert.deepEqual(loaded.log.routed, ['Sentinel'], 'at her helm: she sails on');
});

test('PASSAGE host: STEP OFF HER AND THE PASSAGE ENDS - past PASSAGE_LEAVE_M and not aboard, what was put in her hold comes into the pack, her boat is laid up and her hold and record forgotten, and she stands out to sea; within reach, or at her helm, she waits; a record that reads as nothing ends at once (mutants: never ended; her hold lost; ended on the quay beside her)', () => {
  const w = world();
  bookTo(w, 'Sentinel');
  const boat = w.rt.AllBoats[0];
  const stored = { name: 'Silk', templateIndex: 1 };
  boat.Cargo.Items.push(stored);
  w.rt.StopSailing();   // the landfall: off her helm, ashore beside her
  w.live = false;
  w.feet = [50 + PASSAGE_LEAVE_M - 1, 0, 0];
  w.host.frame(1);
  assert.ok(w.rt.AllBoats.includes(boat), 'a step from her: she waits');
  w.feet = [50 + PASSAGE_LEAVE_M + 1, 0, 0];
  w.host.frame(1);
  assert.deepEqual(w.rt.AllBoats, [], 'her boat gone');
  assert.deepEqual(w.log.laid, [9001]);
  assert.ok(w.pack.includes(stored), 'her hold ashore');
  assert.deepEqual(w.log.forgot, [['hold', 9001], ['boat', 9001]]);
  assert.ok(w.log.say.includes(PASSAGE_TEXT.goods));
  assert.equal(w.log.say.at(-1), PASSAGE_TEXT.ended(SHIP.name));
  assert.equal(w.host.charterBoat(), null);
  const bad = world();
  bad.rt.AllBoats.push({ uid: 7, charter: { to: {} }, GameObject: { position: [0, 0, 0] }, Cargo: { Items: [] } });
  bad.host.frame(1);
  assert.deepEqual(bad.rt.AllBoats, [], 'no voyage in it: over');
});

test('PASSAGE host wiring: the world host builds it once and calls it - the berth\'s ship\'s Activate, its frame whatever the sea fight\'s switch, the Overworld\'s crossing as the voyage; a booked ship is never boarded as mine moored, never said left moored, never packed, never the Fleet\'s, and saved with her voyage (mutants: each door unwired)', () => {
  const world = read('src/scenes/world.js');
  assert.match(world, /^import \{ createPassageHost \} from '\.\/naval\/passageHost\.js';/m);
  assert.match(world, /\n {4}passage: \(ship\) => passage\?\.offer\(ship\),/, 'the sea\'s door to it');
  assert.match(world, /const passage = createPassageHost\(\{[^]*?canGo: \(\) => travelViewCanGo\(\), route: \(s\) => travelViewRouteTo\(s\),/, 'the Overworld\'s journey is the voyage');
  assert.match(world, /\n {4}passage\.frame\(dt, gamePaused\(\) \|\| _loading\);[^\n]*\n {4}const on = navalOn\(\);/, 'its frame, before the switch returns');
  assert.match(world, /if \(!b\.GameObject\?\.activeSelf \|\| b\.inside \|\| b\.charter \|\| !tvSeaCrosses\(tvSeaRig\(b\)\)\) continue;/, 'never boarded as mine moored');
  assert.match(world, /if \(!boat\.charter\) tvSay\(TRAVEL_VIEW_TEXT\.leftMoored\);/, 'never said left moored');
  const csa = read('src/systems/comeSailAway/comeSailAway.js');
  assert.match(csa, /\.\.\.\(b\.charter \? \{ Charter: JSON\.parse\(JSON\.stringify\(b\.charter\)\) \} : \{\}\),/, 'saved with her');
  assert.match(csa, /if \(placedBoat\.Charter && typeof placedBoat\.Charter === 'object'\) boat\.charter = placedBoat\.Charter;/, 'and read back');
  assert.match(csa, /function PackBoat\(boat, item = false, lost = false\) \{\n {4}if \(item && boat\?\.charter\) return false;/, 'never parts in my pack');
  assert.match(read('src/scenes/fleetHost.js'), /const placed = \(\) => \(csa\(\)\?\.AllBoats \?\? \[\]\)\.filter\(\(b\) => b\?\.uid && !b\.charter\);/, 'never the Fleet\'s');
});
