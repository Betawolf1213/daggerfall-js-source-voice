// @ts-check
// PASSAGE (2026-10-19, the owner: "Add the ability to buy and ride a friendly boat (if one is docked) at any port. You
// can have the ability to choose where you want to sail. A new form of immersive travel") - THE VOYAGE'S HOST HALF.
// The law is systems/naval/passage.js; the ship at her berth and her boat are scenes/naval/navalHost.js's (passageShip,
// charter); the voyage itself is the Overworld's crossing (OWS2, world.js travelViewRouteTo) - this module owns the
// booking and the passage's life, and the world host constructs it once and calls it (HOST-SPLIT: fishHost.js's shape).
//
//   offer(ship)  - Activate on a berth's friendly ship (navalHost.js activate): her master's ports, nearest first with
//                  their fares (a list picker), then the question with the purse beside the fare (a Yes/No box).
//   book(ship, d) - Yes: the purse, the journey's own gate (no foe near, no wall underfoot), then her boat (charter: her
//                  hull at her berth, the voyage's record on it), the helm taken, the journey begun to the port - and
//                  only then her ship let go (charterSailed) and the fare paid. A journey refused puts everything back: her boat gone,
//                  the player where they stood, nothing paid, she still at her berth.
//   frame(dt)    - the passage's life: aboard with no journey under way (a foe stopped it, a load put me at her helm),
//                  her master sails on (PASSAGE_FIRST_S, then PASSAGE_RESUME_S; PASSAGE_RESUMES at most); off her past
//                  PASSAGE_LEAVE_M and not aboard, it is over (end).
//   end(boat)    - what was put in her hold into the pack, her boat out of the world (Come Sail Away's LayUpBoat, and
//                  her number's hold let go), her sea-fight record forgotten; she stands out to sea.
//
//   deps = {
//     naval() -> navalHost | null     csa() -> Come Sail Away's runtime | null (the mod on)
//     ports() -> [{ key, name, px, py }]     here() -> the port I stand at | null     pixel() -> my map pixel { x, y }
//     ether() -> past the Veil     place(port) -> the travel map's summary of it | null (never discovered)
//     canGo() -> a journey may set out now (says why not)     route(summary) -> a journey begun to it (says why not)
//     journeyLive() -> a journey under way     aboard(boat) -> at her helm or on her deck
//     feet() -> [x, y, z]     spawn(feet) -> the player set down there     gold() -> the purse     pay(n)
//     pack() -> the pack (live)     forgetBoat(uid) -> her sea-fight record let go     say(text)     show(window)
//   }
//
// Not a DFU member. Ledger A (PASSAGE).
import { ListPickerWindow } from '../../ui/listPicker.js';
import { YesNoBoxWindow } from '../../ui/yesNoBox.js';
import { addItem } from '../../systems/inventory.js';
import {
  passageDestinations, charterRecord, PASSAGE_TEXT, PASSAGE_LEAVE_M, PASSAGE_RESUME_S, PASSAGE_FIRST_S, PASSAGE_RESUMES,
} from '../../systems/naval/passage.js';

/** @param {any} deps */
export function createPassageHost(deps) {
  const csa = () => deps.csa?.() ?? null;
  /** The voyage's own clock: how long aboard with no journey under way, the master's tries, and what was last said. */
  let idle = 0, resumes = 0, first = true, said = null;
  /** The boat my passage rides (one at a time), or null. */
  const charterBoat = () => csa()?.AllBoats?.find((b) => b?.charter) ?? null;
  const gold = () => Math.max(0, Math.floor(Number(deps.gold?.() ?? 0) || 0));

  /** Her master's ports. Answers whether the list went up. */
  function offer(ship) {
    if (!csa()) { deps.say(PASSAGE_TEXT.noSail); return false; }
    if (charterBoat()) { deps.say(PASSAGE_TEXT.booking); return false; }
    if (deps.ether?.()) { deps.say(PASSAGE_TEXT.ether); return false; }
    const list = passageDestinations(deps.ports?.() ?? [], deps.pixel(), { hereKey: deps.here?.()?.key ?? null, known: (p) => !!deps.place(p) });
    if (!list.length) { deps.say(PASSAGE_TEXT.none); return false; }
    deps.show(new ListPickerWindow({ items: list.map(PASSAGE_TEXT.row), onPick: (i) => { if (list[i]) ask(ship, list[i]); } }));
    return true;
  }
  /** The question: the port, the fare and the purse - nothing paid until Yes. */
  function ask(ship, d) {
    deps.show(new YesNoBoxWindow({ rows: PASSAGE_TEXT.ask(ship.name, d.port.name, d.fare, gold()), onYes: () => book(ship, d) }));
  }
  /** Yes: the passage made, all of it or none of it. Answers whether she sails. */
  function book(ship, d) {
    const r = csa(), n = deps.naval?.();
    if (!r || !n) { deps.say(PASSAGE_TEXT.noSail); return false; }
    if (charterBoat()) { deps.say(PASSAGE_TEXT.booking); return false; }
    if (gold() < d.fare) { deps.say(PASSAGE_TEXT.poor(d.fare)); return false; }
    const summary = deps.place(d.port);
    if (!summary || !deps.canGo()) return false;   // the journey's own gate says why
    const record = charterRecord({ to: { name: d.port.name, px: d.port.px, py: d.port.py }, ship: ship.name, captain: ship.captain, fare: d.fare });
    const stood = [...deps.feet()];
    const boat = n.charter(ship.id, record);
    if (!boat) { deps.say(PASSAGE_TEXT.gone); return false; }
    let helm = false, sails = false;
    try {
      r.StartSailing(boat);
      helm = r.isSailing() && r.state?.CurrentBoat === boat;
      sails = helm && deps.route(summary);   // the route says why it will not go
    } catch (err) { console.warn('[passage] her voyage would not begin', err); }
    if (!sails) {   // refused: everything back as it was - her boat gone, the player where they stood, she at her berth
      try { if (r.isSailing()) r.StopSailing(); } catch (err) { console.warn('[passage] her helm would not be left', err); }
      deps.spawn(stood);
      remove(boat);
      if (!helm) deps.say(PASSAGE_TEXT.failed);
      return false;
    }
    n.charterSailed(ship.id);   // under way: her ship let go, her boat in her place
    deps.pay(d.fare);
    idle = 0; resumes = 0; first = false; said = null;
    deps.say(PASSAGE_TEXT.booked(ship.name, ship.captain, d.fare, d.port.name));
    return true;
  }
  /** Her boat out of the world: her hold (anything put in it) into the pack, Come Sail Away's laying up and her
   *  number's hold let go, her sea-fight record forgotten. False while she cannot go yet (at my helm, a player aboard). */
  function remove(boat) {
    const r = csa();
    if (!r || !boat) return false;
    const held = boat.Cargo?.Items ?? [];
    const goods = held.length > 0;
    if (goods) { const pack = deps.pack(); for (const it of held.splice(0)) addItem(pack, it); }
    if (!r.LayUpBoat(boat)) return false;
    r.forgetHold?.(boat.uid);
    deps.forgetBoat?.(boat.uid);
    if (goods) deps.say(PASSAGE_TEXT.goods);
    return true;
  }
  /** The passage over: she stands out to sea. */
  function end(boat) {
    const name = boat.charter?.ship ?? null;
    if (!remove(boat)) return false;
    idle = 0; resumes = 0; first = true; said = null;
    deps.say(PASSAGE_TEXT.ended(name));
    return true;
  }
  /** The passage's life, each frame (`paused`: nothing moves). */
  function frame(dt, paused = false) {
    const r = csa();
    const boat = r ? charterBoat() : null;
    if (!boat || paused) return;
    const rec = charterRecord(boat.charter);
    if (!rec) { end(boat); return; }   // a record that reads as nothing is no voyage
    boat.packable = false;   // never packed (a load stands her hull's own word again) - so the crossing plans no second launch
    if (!deps.aboard(boat)) {
      const f = deps.feet(), p = boat.GameObject?.position;
      if (!p || !f || Math.hypot(p[0] - f[0], p[2] - f[2]) > PASSAGE_LEAVE_M) end(boat);
      return;
    }
    if (deps.journeyLive()) { idle = 0; return; }
    idle += Math.max(0, dt);
    if (idle < (first ? PASSAGE_FIRST_S : PASSAGE_RESUME_S)) return;
    idle = 0;
    if (resumes >= PASSAGE_RESUMES) { if (said !== 'stood') { said = 'stood'; deps.say(PASSAGE_TEXT.stood(rec.to.name)); } return; }
    if (!r.isSailing() || r.state?.CurrentBoat !== boat) { if (said !== 'helm') { said = 'helm'; deps.say(PASSAGE_TEXT.helm(rec.to.name)); } return; }
    first = false;
    resumes++;
    const summary = deps.place({ name: rec.to.name, px: rec.to.px, py: rec.to.py });
    if (summary && deps.canGo()) deps.route(summary);
  }
  return { offer, book, frame, end, charterBoat };
}
