// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 5, 6, 7, 16, 21 and 23): AN
// ELITE BREACH ON THIS SCREEN - the world host's one piece for it (scenes/world.js builds it and hands it its seams):
//   THE KEY - a Weir Key used (systems/weirKey.js): one staked at the account service (`/v1/eg/open` - idempotent on its
//     request id), its signed order handed to the hub (`eg` `open` - net/online.js sendEg), which opens the breach and
//     calls the company; `/breach rehearse` opens the day's Rehearsal (no key). Every answer that carries the account's
//     balance restacks the pack's keys to it.
//   THE CALL - the hub's word (`call`), said in chat and on the tracker (ui/egHud.js) until the breach takes no more;
//     answered with `/breach` from open ground once it opens: the member's own admission (`/v1/eg/admit`), then the step
//     under the veil into the breach's first circle (scenes/worldModes.js enterEgHall). Inside, the admission goes to the
//     room once (`in`) - a member the room already counts is never asked again.
//   THE HALLS - the breach's room's word (net/egLink.js): the pull to the next hall's plate (the action teleport's
//     way, under a veil's flash), the step through an open door (`down`, believed by the room from my pose), a new circle
//     built as the first was (out under the veil and in again), the fight (scenes/egFight.js), the void's cost.
//   ONE LIFE - a death in the breach wakes where the member answered from, its fall the room's; the end, the way home at a
//     Redoubt, and a room that closes my socket all walk me out the same way.
//   THE RECEIPTS - every `e1` the room hands me kept on the device (EG_CLAIMS_KEY) and carried to the account service
//     (`/v1/eg/claim`) until it is recorded, refused for good, or out of date.
//
//   EG-FULL (2026-10-11, Mac: "I said I want everything"): THE WITNESS VIEW (section 16.5) - a death in the Spire is a
//     fall the death save turns aside (no death screen, no respawn, no DEATH-PENALTY): the body is put away under the hall,
//     no blow reaches it, and the camera orbits a living member (Q and E to change whom); THE RECALL's word stands me
//     where it calls me at its share of my health; the room's heals (a rest, a Rally, a Mending, the fray's lash); the
//     Vestige offer and the company's word on THE PANEL (ui/egHud.js - keys 1-6, Y and N, or `/breach pick`, `/breach
//     vote`); Cantrips, the Sutler, pings, forsaking and a Surplus in `/breach` words; THE POTION LAW's count; THE RECAP.
//
//   EG-H1 (EG8d, 2026-10-12; sections 21 and 10.8): WHAT THE RELAY JUDGES, this screen's half - THE SHARED CLOCK CORRECTED
//     (net/egClock.js: the room's `clk` pinged, the median of five half round trips, again every 30 s - the breach's link,
//     its fight and every time here read it: `sharedNow`); MY BODY in my own word (`vt`, net/bossBody.js bodySayer's pace)
//     to a relay that counts it, and THE RELAY'S COUNT'S FALL OF ME (`bd`) - in the Spire a fall, never a death: the
//     witness, as the Hour's bossCountFell is its one life; RIDDEN POSES - my pose's `pl` on a moving piece (`ridePl`,
//     net/online.js `poseRide`) and a peer's drawn on its piece at my clock (`rideDraw`, net/online.js `rideAt`).
//   EG-G1 (2026-10-12, sections 27 and 25.7): THE HUD, THE BEATS AND THE FIRST BREACH - the seams that feed them: the
//     Spire's HUD by form factor and its count chip (ui/egSpireHud.js), the arrival card, the door's marker, the beats'
//     sounds and lines and the first-time lines (ui/egBeats.js), the party rows (ui/egParty.js - the party panel's
//     `setSpire`), the pad's d-pad and the touch buttons for the panel and the witness, the haptics, the danger palette
//     and reduced motion (ui/egAccess.js), and THE RECAP whole (the last five kept).
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { createEgLink, egMemberOf, egRunOfMember } from '../net/egLink.js';
import { egHallOf, egCircleOfHall, egSlotOfHall, egSlotAt, egLocalX, egAtDoor, egPhase, egTimes, egCountText, EG_TEXT, EG_CAST_BACK_LOSS, EG_CAST_BACK_FLOOR } from '../net/egLaw.js';
import { readEgReceipt } from '../net/egReceipt.js';
import { dungeonToRealm } from '../net/sdBrain.js';
import { egToDungeon } from '../world/egHall.js';
import { restackWeirKeys, setWeirKeyOpener } from '../systems/weirKey.js';
import { egHudModel, drawEgHud, egPanelModel, drawEgPanel, egRecapModel, EG_POTIONS_PER_HALL } from '../ui/egHud.js';
import { EG_CANTRIPS } from '../net/egRun.js';
import { egVOf } from '../net/egVestige.js';
import { fillVitalSigns } from '../systems/statMods.js';
import { createPortalSet } from './portalFx.js';
import { EG_ROLE } from '../net/egBodies.js';
import { EG_OBJ } from '../net/egLords.js';
import { EG_ANNALS } from '../net/egAnnals.js';
import { EG_ENGINES, EG_ENGINE_REACH_M } from '../net/egFragLaw.js';
import { egClockNew, egClockDue, egClockHeard, egClockOffset, egClockHalfRtt } from '../net/egClock.js';   // EG-H1: the shared clock, corrected
import { bodySayer } from '../net/bossBody.js';   // EG-H1: my body, in my own word
import { egRideOf, egRideAt } from '../net/egFair.js';   // EG-H1: RIDDEN POSES
import { EG_SWAP_WAIT_MS } from './egSwap.js';   // EG-H3 (EG10): how long a new circle's step waits on its build
// EG-G1: THE HUD, THE BEATS AND THE FIRST BREACH (bible/11-Multiplayer/Elite-Gates.md section 27)
import { egSpireHudModel, drawEgSpireHud, egArrivalCard, egArrivalShown, drawEgArrivalCard, egFormFactor, egGainText, egPressInForce, egChipWarnings, egDoorMarker, egPadUp, egPadAct, egPadPrompts, EG_PAD_DIRS, EG_GAIN_MS, EG_CHIP_WARNINGS } from '../ui/egSpireHud.js';
import { egBeatMemo, egBeatWatch, egBeatPlan, egFirstDue, egRehearsalDue, egFirstRead, egFirstWrite, egBuzz, egBeatUnder, egPerilsNew, egRuneChime, EG_PRES_TEXT, EG_BEAT_SOUNDS } from '../ui/egBeats.js';
import { egAbsentStep, egPartyRows, egPartyDeco, egRoadOf, EG_NUMERALS } from '../ui/egParty.js';
import { egAccessNow } from '../ui/egAccess.js';
import { egRecapKeep, egAskText } from '../ui/egHud.js';
import { EG_LORDS, EG_LAST_WORD_MS } from '../net/egLaw.js';
import { isEnhanced } from '../systems/uiSkin.js';
import { isTouchDevice } from '../ui/touchDevice.js';
import { getPref } from '../systems/uiPrefs.js';

/** Where the receipts wait on the device, how many at most, how often a kept one is asked again (ms). */
export const EG_CLAIMS_KEY = 'eg.claims';
export const EG_CLAIMS_MAX = 16;
export const EG_CLAIM_RETRY_MS = 60_000;
/** How often a step through the door is said again while I stand in it, how long the end's words stand before the walk
 *  out, how often the balance is asked while online, how often a hub that has not taken an open is asked again. */
export const EG_DOWN_EVERY_MS = 1000;
export const EG_END_WALK_MS = 4000;
export const EG_KEYS_EVERY_MS = 10 * 60_000;
export const EG_OPEN_RETRY_MS = 2500;
export const EG_OPEN_TRIES = 4;
/** EG-H1: THE RELAY'S COUNT HAS FALLEN ME (`bd`) - its words in the Spire (the gate's and the Hour's say the fight's). */
export const EG_COUNT_FELL_TEXT = 'The Spire counts you fallen.';
/** A second press of the way home within this long walks (ms). */
export const EG_HOME_CONFIRM_MS = 6000;
/** The end's words, by why it ended. */
export const EG_END_TEXT = Object.freeze({
  fall: EG_TEXT.fallen, home: 'You walk home. The Redoubts you took are kept.', tear: EG_TEXT.torn,
  wipe: 'The company has fallen. The breach closes.', last: EG_PRES_TEXT.lastWord,   // EG-G1: the beats' own words (section 27.5)
  empty: 'Nobody answered the call. The breach closes.', gone: 'Nobody stayed. The breach closes.',
  rehearsal: EG_TEXT.rehearsalDone, void: 'The breach failed to hold. Your key is returned.', forsake: 'You forsake the breach.',
  seal: 'The way down is sealed. The halls are yours.',
});
/** A gift's words (`egot`). */
/** EG-FULL LAYER THREE: the relay's object types by number (net/egLords.js EG_OBJ) - the spans read Grath's islands and
 *  the false walls by name (systems/spireKit.js spireObjs). */
const OBJ_NAME = Object.freeze(Object.fromEntries(Object.entries(EG_OBJ).map(([k, v]) => [v, k])));
export const EG_GOT_TEXT = Object.freeze({ shard: 'You take a Vestige shard.', tonic: 'You take a Spire Tonic.', cant: 'You take a Cantrip.', lumen: 'You take 10 lumen.', rel: 'A Reliquary is sealed for you.', longstep: 'Long Step: your crumbles wait half a second more this span.' });
/** A hall's glyph on THE RECAP's strip. */
const KIND_GLYPH = Object.freeze({ yard: 'Y', span: 'S', proving: 'P', rampart: 'R', court: 'C', athenaeum: 'A', deepway: 'D', brink: 'B', scriptorium: 's' });
/** A push's pace (the Steps' breath's, sdSteps.js SD_GUST_SPEED), the longest frame it is carried for (s), the most one
 *  push carries (m); a ring's rim kept this far in or out (m). */
export const EG_PUSH_MPS = 3;
export const EG_PUSH_DT_MAX = 0.1;
export const EG_PUSH_MAX_M = 8;
export const EG_RING_PAD = 0.3;
/** EG-E: a Redoubt's spoils leave the Court's heart this high over its floor, and rest this far inside its ring (m). */
export const EG_BEACON_SPEW_UP = 2.2;
export const EG_BEACON_RIM_M = 1.5;
/** The witness's camera: behind and over the watched member (m). */
export const EG_WITNESS_BACK = 4;
export const EG_WITNESS_UP = 1.5;
/** The account service's refusals in the Spire's words (net/accountClient.js REFUSALS holds the rest). */
const REFUSED = Object.freeze({
  short: EG_TEXT.noKeys, guest: EG_TEXT.guest, 'no-session': EG_TEXT.guest, live: EG_TEXT.held, offline: EG_TEXT.shut, server: EG_TEXT.shut,
  'no-signing-key': EG_TEXT.shut, unproven: "Close a Dagon's Breach first - the Spire opens to those who have.",
  rehearsed: 'You have rehearsed the Spire today. A Weir Key opens it again.', spent: 'That breach is spent.', breach: 'That breach is not one the Spire knows.',
});
export const egRefusalText = (error) => REFUSED[error] ?? EG_TEXT.shut;

/**
 * Whether a kept receipt is done with (recorded, already counted, refused for good) - false keeps it for the next try.
 * Pure.
 * @param {{ ok: boolean, data?: any, error?: string }} a
 */
export function egClaimDone(a) {
  if (a?.ok) return true;
  return a?.error === 'receipt' || a?.error === 'not-yours';
}

/** A request id the service takes (server-account/src/eg.js EG_RQ_RE). */
function requestId() {
  const b = new Uint8Array(12);
  try { globalThis.crypto.getRandomValues(b); } catch { for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256); }
  return [...b].map((v) => v.toString(36).padStart(2, '0')).join('').slice(0, 24);
}

/**
 * @param {{ modes: () => any, online: () => any, hub: () => any, account: any, now: () => number, entity: any, player: any, cam: any,
 *   say: (text: string) => void, mid?: (text: string) => void, veil?: () => any, site: () => any, wire: () => any, landAt: (l: any) => boolean,
 *   hurt: (n: number) => void, store?: any, saved?: () => void, hudHidden?: () => boolean, fight?: (link: any) => any, renderer?: any, audio?: any,
 *   peers?: () => { sub: string, pos: number[] }[], heal?: ((p: number, why: string) => void) | null,
 *   paid?: ((c: any, data: any) => void) | null, win?: any, redoubt?: ((rd: number) => void) | null, board?: (() => any) | null }} deps
 */
export function createEgClient({ modes, online, hub, account, now: hostNow, entity, player, cam, say, mid = () => {}, veil = () => null, site, wire, landAt, hurt,
  store = null, saved = () => {}, hudHidden = () => false, fight: makeFight = () => null, renderer = null, audio = null, peers = () => [], heal = null, paid = null, win = globalThis.window, redoubt = null, board = null }) {
  // EG-H1: THE SHARED CLOCK, CORRECTED (section 10.8; net/egClock.js) - the host's clock until the room has answered a ping,
  // then this machine's wall clock plus the median offset; the breach's link, its fight and every time here read it
  const clock = egClockNew();
  const now = () => { const off = egClockOffset(clock); return off == null ? hostNow() : Date.now() + off; };
  const sayBody = bodySayer((v) => !!online()?.sendEg?.('vt', { v }));
  const link = createEgLink({ now, say, onReceipt: (r) => claimAdd(r), onRefused: (w) => refused(w) });
  let fight = null;
  /** an open in flight: its request id, the service's order, whether the hub took it */
  let opening = null;
  /** my admission to the breach I answered: `{ b, z }`; the welcome it went to the room under */
  let admit = null, inFor = -1;
  let answering = false, swapping = false, leaving = false;
  /** EG-H3 (EG10): when the step into a new circle began waiting on its build still in flight (0: not waiting) */
  let swapWaitAt = 0;
  let downAt = -Infinity, downH = 0, placedH = 0, endSeen = null, endAt = 0, homeAskAt = -Infinity;
  let keysAt = -Infinity, claimAt = -Infinity, rdSeen = 0, callSaid = '';
  let door = null, doorH = 0, portal = null;
  /** THE WITNESS VIEW: my fall's place, whom I watch; THE POTION LAW's count this hall; THE RECAP's log; my answers to
   *  the company's word; a recap standing; a forsake asked once. */
  let witness = null, potions = EG_POTIONS_PER_HALL, potionHall = '', recap = null, recapUntil = 0, forsakeAskAt = -Infinity, logH = 0;
  /** EG-FULL LAYER THREE: the pages of the Annals this breach has given me (the account keeps them - EG-E) */
  const annals = new Set();
  const log = [];
  const voted = {};
  const me = () => account?.me?.() ?? null;
  /** the way home's portal (scenes/portalFx.js - the Portal Stone's own) */
  let portalSet = null;
  const portals = () => (portalSet ??= renderer?.createBillboardBatch ? createPortalSet({ renderer, audio }) : null);
  const inSpire = () => modes()?.egHallBreach?.() != null;

  // ── the keys ────────────────────────────────────────────────────────────────────────────────────────
  /** The pack's keys set to the account's balance (a face, never the count). */
  function restack(n) {
    if (!Number.isSafeInteger(n) || n < 0 || !entity?.items) return;
    if (restackWeirKeys(entity.items, n)) saved();
  }
  async function askKeys() {
    keysAt = Date.now();
    if (!me() || account?.guest?.()) return;
    const a = await account.keys();
    if (a?.ok) restack(a.data?.keys);
  }
  /** Why the key will not turn here, or null. */
  function openRefusal() {
    const M = modes();
    if (!online()) return EG_TEXT.cold;
    if (!me() || account?.guest?.()) return EG_TEXT.guest;
    if (inSpire()) return EG_TEXT.held;
    if ((M?.mode ?? 'exterior') !== 'exterior') return EG_TEXT.sky;
    if (opening) return EG_TEXT.opening;
    const E = link.state();
    if (E.call && egPhase({ openedAt: E.call.op }, now()) !== 'ended' && E.call.co.some((r) => r[0] === me())) return EG_TEXT.held;
    if (!hub()?.egOk) return EG_TEXT.shut;
    return null;
  }
  /** THE OPEN: a key staked (or the Rehearsal taken) and its order handed to the hub. */
  async function open(rh) {
    const rq = requestId();
    opening = { rq, rh, z: null, site: null, tries: 0, sentAt: -Infinity };
    const a = await account.open(rq, rh);
    if (!a?.ok) { opening = null; say(egRefusalText(a?.error)); return false; }
    restack(a.data?.keys);
    opening.z = a.data?.order ?? null; opening.b = a.data?.b ?? null;
    opening.site = wire();
    if (!opening.z || !opening.site) { opening = null; say(EG_TEXT.shut); return false; }
    sendOpen();
    return true;
  }
  function sendOpen() {
    if (!opening?.z || opening.tries >= EG_OPEN_TRIES) return;
    if (Date.now() - opening.sentAt < EG_OPEN_RETRY_MS) return;
    if (hub()?.sendEg?.('open', { z: opening.z, site: opening.site })) { opening.tries++; opening.sentAt = Date.now(); }
  }
  /** The key's use (systems/weirKey.js's opener): the line it shows; the open started. A call standing for me is
   *  answered instead. */
  function useKey() {
    const E = link.state();
    if (E.call && E.call.co.some((r) => r[0] === me()) && egPhase({ openedAt: E.call.op }, now()) === 'open' && !inSpire()) { answer(); return EG_TEXT.opens; }
    const no = openRefusal();
    if (no) return no;
    open(false);
    return EG_TEXT.opening;
  }

  // ── the call and the answer ───────────────────────────────────────────────────────────────────────────
  /** THE ANSWER: my admission, and the step under the veil into the first circle. */
  async function answer() {
    const E = link.state(), c = E.call, M = modes(), t = now();
    if (!c) { say('No breach calls you. A Weir Key opens one; /breach rehearse opens the day\'s Rehearsal.'); return false; }
    if (!c.co.some((r) => r[0] === me())) { say(EG_TEXT.outside(c.o)); return false; }
    if (inSpire()) return false;
    const phase = egPhase({ openedAt: c.op }, t), T = egTimes({ openedAt: c.op });
    if (phase === 'rising' || phase === 'sealed') { say(EG_TEXT.sealed(egCountText(T.openAt - t))); return false; }
    if (phase !== 'open') { say(EG_TEXT.late(c.o)); return false; }
    if ((M?.mode ?? 'exterior') !== 'exterior') { say(EG_TEXT.indoors); return false; }
    if (answering || M?.stepping) return false;
    answering = true;
    try {
      if (admit?.b !== c.b) {
        const a = await account.admit(c.b);
        if (!a?.ok) { say(egRefusalText(a?.error)); return false; }
        admit = { b: c.b, z: a.data?.order ?? null };
        inFor = -1;
      }
      if (!admit.z) { say(EG_TEXT.shut); return false; }
      placedH = 0; downH = 0; endSeen = null; rdSeen = 0; leaving = false;
      const went = await modes()?.stepThroughFire?.(() => modes()?.enterEgHall?.({ b: c.b, seed: c.seed, c: 1, geo: E.geo ?? 0, site: site() }), 'hourIn');
      if (!went) say(EG_TEXT.shut);
      return !!went;
    } finally { answering = false; }
  }
  /** A refusal the hub or the room said. */
  function refused(w) {
    if (opening && !inSpire() && w === 'the breach is closed' && opening.tries < EG_OPEN_TRIES) { opening.sentAt = Date.now() - EG_OPEN_RETRY_MS + 1000; return; }
    if (w === 'the order is spent' || w === 'the order is not yours') admit = admit ? { ...admit, z: null } : null;
  }

  // ── the receipts ──────────────────────────────────────────────────────────────────────────────────────
  const kept = () => { try { const v = JSON.parse(store?.getItem?.(EG_CLAIMS_KEY) ?? '[]'); return Array.isArray(v) ? v.filter((r) => typeof r === 'string') : []; } catch { return []; } };
  const keep = (list) => { try { store?.setItem?.(EG_CLAIMS_KEY, JSON.stringify(list.slice(-EG_CLAIMS_MAX))); } catch { /* the session's alone */ } };
  let memo = [];
  function claimAdd(r) {
    const list = store ? kept() : memo;
    if (!list.includes(r)) list.push(r);
    if (store) keep(list); else memo = list.slice(-EG_CLAIMS_MAX);
    flush();
  }
  let flushing = false;
  async function flush() {
    if (flushing || !me() || account?.guest?.()) return;
    flushing = true;
    claimAt = Date.now();
    try {
      const nowS = Math.floor(now() / 1000);
      for (const r of store ? kept() : [...memo]) {
        const c = readEgReceipt(r);
        const drop = () => { if (store) keep(kept().filter((x) => x !== r)); else memo = memo.filter((x) => x !== r); };
        if (!c || !(c.e > nowS)) { drop(); continue; }
        if (c.s !== me()) continue;
        const a = await account.claim(r);
        if (a?.ok && Number.isSafeInteger(a.data?.keys)) restack(a.data.keys);
        if (a?.ok && a.data?.recorded && a.data.q === 'w') say(`Redoubt ${a.data.w} is yours.`);
        // EG-E (section 19): WHAT IT PAID - the service's word on a Redoubt's receipt (the week's pay, the pity's passes,
        // the Marks, the deed, the embers), and the spoils it rolls; a re-claim answers the same (`again`), a guest's its
        // gold alone. Never for a Rehearsal (the service pays none).
        if (a?.ok && c.q === 'w' && c.rh !== 1 && (a.data?.recorded || a.data?.again || a.data?.why === 'guest')) paid?.(c, a.data);
        if (egClaimDone(a)) drop();
      }
    } finally { flushing = false; }
  }

  // ── the halls ─────────────────────────────────────────────────────────────────────────────────────────
  /** Where my feet stand in the circle: the hall slot, and the hall frame's x and z (null outside every hall). */
  function standing() {
    const p = player?.pos;
    if (!p) return null;
    const [sx, , z] = dungeonToRealm(p[0], p[1], p[2]);
    return { slot: egSlotAt(sx), sx, z };
  }
  /** Stood on hall `h`'s arrival plate, facing down its course - under the veil's flash, unless a closed veil is over the
   *  step already (`flash` false - EG-H3's swap). */
  function placeOn(h, E, flash = true) {
    const spec = egHallOf(E.seed, h, E.geo ?? 0);
    if (!spec.arrive) return false;
    const at = egToDungeon(spec, spec.arrive.x, spec.arrive.y + 0.1, spec.arrive.z);
    if (flash) veil()?.flash?.('hourIn');
    return !!modes()?.egPlace?.(at, 0);
  }
  /** The Redoubt's way home: its door at the Court's heart (an exit door - the dungeon's own press and name). */
  function standDoor(E) {
    if (door && doorH === E.h) return;
    const spec = egHallOf(E.seed, E.h, E.geo ?? 0), f = spec.fight ?? spec.end ?? spec.arrive;
    if (!f) return;
    const [x, y, z] = egToDungeon(spec, f.x, f.y ?? 0, f.z);
    door = { matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1], centre: { x: 0, y: 1.6, z: 0 }, size: { x: 3.2, y: 3.2, z: 3.2 }, normal: { x: 0, y: 0, z: -1 } };
    doorH = E.h;
    modes()?.dungeonCtx?.exitDoors?.push?.(door);
    try { portal = portals()?.open?.([x, y, z], { fixed: true, holdMs: 120_000 }) ?? null; } catch { portal = null; }
  }
  function dropDoor() {
    if (door) { const list = modes()?.dungeonCtx?.exitDoors; const i = list?.indexOf?.(door) ?? -1; if (i >= 0) list.splice(i, 1); }
    if (portal) { try { portals()?.remove?.(portal); } catch { /* gone */ } }
    door = null; doorH = 0; portal = null;
  }
  /** Out of the breach the dungeon's own way: to where I answered from, under the veil's flash. */
  function walkOut(text) {
    if (leaving) return;
    leaving = true;
    dropDoor();
    swapWaitAt = 0; modes()?.egSwapDrop?.();   // EG-H3: the swap's build forgotten with the breach
    veil()?.flash?.('hourHome');
    if (text) say(text);
    if (!modes()?.egLeave?.()) leaving = false;
  }
  /** A new circle. EG-H3 (EG10's THE SWAP): stood in place under the veil from the level its rest built (the mode
   *  machine's egSwapCircle - no exterior, no landing), waiting at most EG_SWAP_WAIT_MS on a build still in flight; a
   *  build not ready by then, or none offered, and it is the old step: out under the veil and into the next, built as
   *  the first was. */
  async function swapTo(E, c) {
    if (swapping || answering) return;
    const r = { b: E.b, seed: E.seed, c, geo: E.geo ?? 0 };
    const built = modes()?.egPrebuild?.(r) ?? null;
    if (built === 'building') { if (!swapWaitAt) swapWaitAt = now(); if (now() - swapWaitAt < EG_SWAP_WAIT_MS) return; }
    swapWaitAt = 0;
    swapping = true;
    try {
      const back = modes()?.egHallReturn?.() ?? null;
      placedH = 0; downH = 0; dropDoor();
      await modes()?.stepThroughFire?.(async () => {
        if (built === 'ready' && modes()?.egSwapCircle?.(r)) { if (!witness && placeOn(E.h, E, false)) placedH = E.h; return true; }   // EG-H3: THE SWAP - the built level stood in place, my feet on its first plate (a witness's body stays held)
        modes()?.forceExitToExterior?.();
        if (back) landAt(back);
        return modes()?.enterEgHall?.({ b: E.b, seed: E.seed, c, geo: E.geo ?? 0, site: site() });
      }, 'hourIn');
    } finally { swapping = false; }
  }
  /** One frame in the Spire. */
  function spireFrame(E, t) {
    const M = modes(), o = online();
    if (o?.terminal) { if (!leaving && entity.health > 0 && !M?.deathUp?.()) walkOut(typeof o.error === 'string' && /breach|order|fallen|home|company/i.test(o.error) ? `${o.error.charAt(0).toUpperCase()}${o.error.slice(1).replace(/\.$/, '')}.` : EG_TEXT.shut); return; }
    if (!E.b || E.b !== M?.egHallBreach?.()) return;
    // my admission, once: a member the room already counts is never asked again
    const mine = egMemberOf(E, me());
    if (mine && !mine.in && admit?.b === E.b && admit.z && o?.welcomes !== inFor && o?.sendEg?.('in', { z: admit.z, lv: Math.max(1, entity.level | 0) })) inFor = o.welcomes;
    if (mine && mine.forsaken) { if (!leaving) { witness = null; walkOut(EG_END_TEXT.forsake); } return; }
    if (mine && !mine.alive && !witness && !leaving) enterWitness(t, false);
    if (mine && mine.home) { witness = null; if (!leaving && endSeen !== 'home') { endSeen = 'home'; recap = egRecapModel(E, me(), log, t, { whyText: EG_END_TEXT.home, why: 'home' }); recapUntil = Date.now() + 30_000; recapOpened(); } walkOut(null); return; }   // EG-G1: a member who walks home reads the recap too (section 27.6)
    if (E.end) {
      if (endSeen !== E.end) { endSeen = E.end; endAt = t; mid(EG_END_TEXT[E.end] ?? EG_TEXT.ended); recap = egRecapModel(E, me(), log, t, { whyText: EG_END_TEXT[E.end] ?? '' }); recapUntil = Date.now() + 30_000; recapOpened(); }
      if (t - endAt >= EG_END_WALK_MS) { if (witness) { witness = null; entity.health = Math.max(1, entity.health); } walkOut(null); }
      return;
    }
    if (!(E.h > 0)) return;
    // THE RECAP's log: each hall the company stood in, its glyph and its falls
    if (E.h !== logH) { logH = E.h; const sp = egHallOf(E.seed, E.h, E.geo ?? 0); log.push({ h: E.h, glyph: KIND_GLYPH[sp.kind] ?? '?', lord: sp.lord, lordName: sp.kind === 'court' ? EG_LORDS[sp.lord]?.name ?? '' : '', fall: false }); if (log.length > 200) log.shift(); }
    // THE POTION LAW: two restoring potions a hall, refilled at each wake and at the rest
    if ((E.sg === 'trial' || E.sg === 'rest') && potionHall !== `${E.h}:${E.sg === 'rest' ? 'r' : 't'}`) { potionHall = `${E.h}:${E.sg === 'rest' ? 'r' : 't'}`; potions = EG_POTIONS_PER_HALL; }
    const c = egCircleOfHall(E.h);
    if (E.sg === 'rest' && c === M.egHallCircle?.()) M.egPrebuild?.({ b: E.b, seed: E.seed, c: c + 1, geo: E.geo ?? 0 });   // EG-H3 (EG10): THE SWAP'S BUILD - the next circle's level made while the Court rests
    if (c !== M.egHallCircle?.()) { if (E.sg === 'arrive') swapTo(E, c); return; }
    if (witness) { witnessFrame(E); return; }
    const at = standing();
    if (!at) return;
    const spec = egHallOf(E.seed, E.h, E.geo ?? 0);
    // THE PULL: the hall the company stands in is not the one my feet are in - to its plate
    if ((E.sg === 'arrive' || E.sg === 'trial') && placedH !== E.h && at.slot !== egSlotOfHall(E.h)) { if (placeOn(E.h, E)) { placedH = E.h; say(EG_TEXT.pulled); } }
    else if (at.slot === egSlotOfHall(E.h)) placedH = E.h;
    // THE DOOR: the closing's step through it, said while I stand in it
    if (E.sg === 'closing' && at.slot === egSlotOfHall(E.h) && downH !== E.h && egAtDoor(spec, egLocalX(spec, at.sx), at.z, 1) && t - downAt >= EG_DOWN_EVERY_MS) {
      downAt = t;
      if (o?.sendEg?.('down', { h: E.h })) mid('You wait at the door for your company.');
    }
    if (E.sg !== 'closing') downAt = -Infinity;
    // THE REDOUBT: the company healed once, the way home stood at the Court's heart through the rest
    if (E.sg === 'rest') { if (rdSeen !== E.h) { rdSeen = E.h; redoubt?.(E.rd); say(`${EG_TEXT.redoubt(E.rd)} taken. Choose a Vestige; the way home stands at the Court's heart; the stair down opens when the rest ends.`); } standDoor(E); }
    else if (door) dropDoor();
  }

  // ── the witness (section 16.5) ──────────────────────────────────────────────────────────────────────────
  /** THE FALL: the body put away under the hall (no blow reaches it, the void never casts it back), the room told, the
   *  camera handed to a living member. */
  function enterWitness(t, said) {
    const E = link.state();
    if (witness || !inSpire()) return;
    witness = { at: t, idx: 0, watched: null, hold: null };
    const mine = egMemberOf(E, me());
    if (mine?.alive && !said) online()?.sendEg?.('fell');
    entity.health = Math.max(1, entity.maxHealth ?? 1);
    const spec = E.h > 0 ? egHallOf(E.seed, E.h, E.geo ?? 0) : null;
    if (spec?.arrive) { const p = egToDungeon(spec, spec.arrive.x, spec.arrive.y - 60, spec.arrive.z); witness.hold = p; }
    mid(`FALLEN. ${mine?.recall ? 'The next Redoubt can call you back.' : 'The Spire will not take you back.'}`);
    for (const h of log.slice(-1)) h.fall = true;
  }
  /** EG-H1 - THE RELAY'S COUNT HAS FALLEN ME (`bd`, net/bossBody.js - enforced in the Spire, section 21): in the Spire a fall,
   *  never a death - the witness begins (the room made it the breach's fall: its `fall` word follows, so nothing is said back),
   *  as the Hour's bossCountFell is its one life. Heard outside the Spire, nothing. */
  function countFell() {
    if (!inSpire() || witness) return;
    mid(EG_COUNT_FELL_TEXT);
    enterWitness(now(), true);
  }
  /** EG-H1 - RIDDEN POSES (section 10.8): my pose's `pl` while my feet stand on a moving piece of the hall I am in (net/egFair.js
   *  egRideOf, at the shared clock), else null - net/online.js sendPose lays it on the pose (`poseRide`). */
  function ridePl() {
    const E = link.state();
    if (!inSpire() || witness || !(E.h > 0) || !player?.pos) return null;
    const at = standing();
    if (!at || at.slot !== egSlotOfHall(E.h)) return null;
    const spec = egHallOf(E.seed, E.h, E.geo ?? 0), y = dungeonToRealm(player.pos[0], player.pos[1], player.pos[2])[1];
    return egRideOf(spec, egLocalX(spec, at.sx), y, at.z, now() / 1000);
  }
  /** EG-H1 - A PEER'S RIDDEN POSE drawn on its piece at MY shared clock plus its offset (net/online.js `rideAt`, on the peer's
   *  drawn place, moved in place) - a rider never floats beside a swinging platform. A peer in another hall is left alone. */
  function rideDraw(q) {
    const E = link.state();
    if (!inSpire() || !(E.h > 0) || !Array.isArray(q?.pl)) return;
    const spec = egHallOf(E.seed, E.h, E.geo ?? 0);
    if (egSlotAt(dungeonToRealm(q.x, q.y ?? 0, q.z)[0]) !== egSlotOfHall(E.h)) return;
    const r = egRideAt(spec, q.pl, now() / 1000);
    if (!r) return;
    const [x, y, z] = egToDungeon(spec, r[0], r[1], r[2]);
    q.x = x; q.y = y; q.z = z;
  }
  /** A witness's frame: the body held where it is put away; whom it watches kept to a living member. */
  function witnessFrame(E) {
    if (witness.hold && player?.pos) { player.pos[0] = witness.hold[0]; player.pos[1] = witness.hold[1]; player.pos[2] = witness.hold[2]; player.velY = 0; player._airVelX = 0; player._airVelZ = 0; player.falling = false; player.fallStart = player.pos[1]; }
    const living = E.co.filter((c) => c[0] !== me() && c[3] === 1 && c[4] === 0 && c[5] === 1);
    if (!living.length) { witness.watched = null; return; }
    if (!living.some((c) => c[0] === witness.watched)) witness.watched = living[witness.idx % living.length][0];
  }
  /** THE RECALL's word for me: stood where it calls me, at its share of my health. */
  function riseAt(w) {
    const E = link.state();
    witness = null;
    const spec = egHallOf(E.seed, w.h, E.geo ?? 0);
    const at = egToDungeon(spec, w.x, 0.2, w.z);
    modes()?.egPlace?.(at, 0);
    entity.health = Math.max(1, Math.round((entity.maxHealth ?? 1) * w.p));
    mid(w.p >= 1 ? 'The Redoubt calls you back.' : 'A Memento calls you back.');
  }
  /** The room's heal (a rest, a Rally, a Mending, the Scriptorium; the fray's lash negative): its share of my health, and
   *  at a rest my magicka and fatigue too. A lash is a setback through the hurt door, never a death. */
  function applyHeal(p, why) {
    if (witness || !(entity.health > 0) || !inSpire()) return;
    if (why === 'rest' && p >= 1) { fillVitalSigns(entity); return; }
    if (heal) { heal(p, why); return; }
    const max = entity.maxHealth ?? 0;
    if (p < 0) { const cut = Math.min(Math.round(-p * max), entity.health - 1); if (cut > 0) hurt(cut); return; }
    entity.health = Math.max(1, Math.min(max, Math.round(entity.health + p * max)));
  }

  // ── THE PUSH, THE CAGE AND THE RING (section 9.3: "applied by the struck client as the Steps' gust is") ────────────
  /** a push owed: its unit way in the hall's frame (the dungeon's axes - world/egHall.js egToDungeon) and metres left */
  let pushX = 0, pushZ = 0, pushLeft = 0, pushAt = 0;
  /** Iron Footing's share off a push (net/egVestige.js - by: 'client'). */
  const footing = () => egVOf(egRunOfMember(link.state(), me()).vs, 'ironfooting');
  /** A push of `m` metres along (dx, dz), carried out at the Steps' breath's speed by the collider's own move (scenes/
   *  sdSteps.js's - no edge stops it: near one it is a cast-back). */
  function pushBy(dx, dz, m) {
    if (witness || !inSpire() || !(m > 0) || !Number.isFinite(dx) || !Number.isFinite(dz)) return;
    const L = Math.hypot(dx, dz);
    if (!(L > 1e-6)) return;
    const take = Math.max(0, 1 - footing());
    pushX = dx / L; pushZ = dz / L; pushLeft = Math.min(EG_PUSH_MAX_M, m * take); pushAt = now();
  }
  function pushStep() {
    if (!(pushLeft > 0) || !player?.collider?.move || !player.pos) { pushLeft = 0; return; }
    const t = now(), dt = Math.min(EG_PUSH_DT_MAX, Math.max(0, (t - pushAt) / 1000));
    pushAt = t;
    const step = Math.min(pushLeft, EG_PUSH_MPS * dt);
    if (!(step > 0)) return;
    player.collider.move(player.pos, pushX * step, 0, pushZ * step, player.height, !!player.grounded && !player.jumping);
    pushLeft -= step;
  }
  /** A cage holds me (the motor's own settle - no move, no fall, for `ms`). */
  function holdFor(ms) {
    if (witness || !inSpire() || !player) return;
    player.freezeMotor = Math.max(player.freezeMotor || 0, Math.min(1, ms / 1000));
  }
  /** A challenge's ring (the hall's frame): the challenged kept inside its rim, everyone else kept out of it. */
  function ringKeep(x, z, r, inside) {
    if (witness || !inSpire() || !player?.pos) return;
    const E = link.state(), at = standing();
    if (!at || !(E.h > 0) || !(r > 0)) return;
    const spec = egHallOf(E.seed, E.h, E.geo ?? 0), lx = egLocalX(spec, at.sx), d = Math.hypot(lx - x, at.z - z);
    const rim = inside ? r - EG_RING_PAD : r + EG_RING_PAD;
    if (inside ? d <= rim : d >= rim) return;
    const ux = d > 1e-6 ? (lx - x) / d : 1, uz = d > 1e-6 ? (at.z - z) / d : 0;
    const q = egToDungeon(spec, x + ux * rim, 0, z + uz * rim);
    player.pos[0] = q[0]; player.pos[2] = q[2]; player._airVelX = 0; player._airVelZ = 0;
  }

  // ── EG-G1: THE HUD, THE BEATS AND THE FIRST BREACH (section 27) ────────────────────────────────────────────
  /** the beats' watch, the device's first-time bits, the warnings said this breach, who is unseen, the perils and the
   *  Beat already pulsed, a gain in flight, a teaching line, the live line, the arrival card, the pad's choice, the
   *  folded decrees, the recap's Reliquaries opened so far */
  const pres = { memo: egBeatMemo(), bits: -1, said: new Set(), b: null, absent: new Map(), perils: new Set(), perilH: 0, beatCycle: -1,
    gain: null, first: '', firstAt: 0, live: '', card: null, cardH: 0, cardAt: 0, cardFirst: true, prevSp: -1, focus: 0, foldOpen: false, rel: 0, relAt: 0, touch: /** @type {boolean|null} */ (null) };
  /** How long a teaching line stands under the objective (ms). */
  const FIRST_SHOW_MS = 9000;
  const playSound = (S) => { if (!S?.rec && S?.rec !== 0) return; try { audio?.playOneShot?.(S.rec, S.vol, S.pitch); } catch { /* a sound is never the breach */ } };
  /** One beat (section 27.5): its sound, its line on the screen and in the chat where nobody says it already. */
  function beatNow(k, w = {}) {
    const plan = egBeatPlan(k, w);
    playSound(plan.sound);
    if (plan.screen) mid(plan.screen);
    if (plan.chat) say(plan.chat);
    const words = plan.screen ?? plan.chat;
    if (words) pres.live = words;
    return plan;
  }
  /** THE FIRST BREACH: each line due, once a device - in the chat and under the objective. */
  function teach(keys) {
    if (!keys.length) return;
    if (pres.bits < 0) pres.bits = egFirstRead(store);
    const { due, bits } = egFirstDue(pres.bits, keys);
    if (!due.length) return;
    pres.bits = bits; egFirstWrite(store, bits);
    for (const line of due) say(line);
    pres.first = due.at(-1); pres.firstAt = now(); pres.live = pres.first;
  }
  function castBackBeat(cost) {
    if (cost) beatNow('castBack'); else playSound(EG_BEAT_SOUNDS.rewind);
    teach(['void']);
  }
  /** The recap's Reliquaries open one each 400 ms, each with the Rare chime (section 27.6); the run kept. */
  function recapOpened() { pres.rel = 0; pres.relAt = Date.now(); egRecapKeep(store, recap); }
  /** My feet in the hall's frame, or null. */
  function feetInHall(E) {
    const at = standing();
    if (!at || !(E.h > 0) || at.slot !== egSlotOfHall(E.h)) return null;
    const spec = egHallOf(E.seed, E.h, E.geo ?? 0), y = dungeonToRealm(...player.pos)[1];
    return { spec, x: egLocalX(spec, at.sx), y, z: at.z };
  }
  /** The choices the pad moves among: the offer's cards, else the newest open choice's options. */
  function choices(E) {
    if (E.offer?.v?.length) return { kind: 'offer', n: E.offer.v.length, ask: null };
    const open = (E.as ?? []).filter((q) => q[2] > now());
    const a = open.at(-1);
    return a ? { kind: 'ask', n: egAskText(a[0], a[1]).opts.length, ask: a } : { kind: null, n: 0, ask: null };
  }
  const padCtx = () => { const E = link.state(); return { recap: !!recap, panel: inSpire() && !E.end && choices(E).n > 0, witness: inSpire() && !!witness }; };
  const hudScaleNow = () => { try { return /** @type {any} */ (globalThis.document?.querySelector?.('.hud'))?.style?.getPropertyValue?.('--hud-scale') || ''; } catch { return ''; } };
  const rgbCss = (c) => `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`;
  /** One frame of the Spire's presentation (after the halls' and the fight's). */
  function presFrame(E, t) {
    if (pres.b !== E.b) { pres.b = E.b; pres.said = new Set(); pres.cardFirst = true; pres.cardH = 0; pres.prevSp = -1; pres.absent = new Map(); }
    // THE BEATS and the first-time lines they bring due
    const { beats, firsts, runes } = egBeatWatch(pres.memo, E, me());
    for (const pt of runes) { playSound(egRuneChime(pt)); pres.live = `Rune ${EG_NUMERALS[pt] ?? pt}`; }   // THE EXAMINATION HEARD (section 25.7)
    for (const b of beats) {
      beatNow(b.k, b);
      if (b.k === 'redoubt' && E.redoubt) { const text = egGainText(E.redoubt, { press: egPressInForce(E), leftAfter: E.redoubt.cl ?? 0, lastWordLeft: E.op + EG_LAST_WORD_MS - (E.redoubt.at ?? t) }); if (text) pres.gain = { text, at: t }; }
      if (b.k === 'goldRun') pres.gain = { text: EG_PRES_TEXT.gain('1:00', ''), at: t };
    }
    teach(firsts);
    if (pres.prevSp >= 0 && (E.sp ?? 0) > pres.prevSp) pres.gain = { text: EG_PRES_TEXT.surplus, blue: true, at: t };
    pres.prevSp = E.sp ?? 0;
    // THE REHEARSAL's teaching, once a device
    if (E.rh && E.wk > 0 && E.sg === 'trial') {
      if (pres.bits < 0) pres.bits = egFirstRead(store);
      const r = egRehearsalDue(pres.bits);
      if (r.line) { pres.bits = r.bits; egFirstWrite(store, r.bits); say(r.line); pres.first = r.line; pres.firstAt = t; }
    }
    // THE COUNT CHIP's warnings, each once a count
    for (const k of egChipWarnings(pres.said, E, t)) {
      const W = EG_CHIP_WARNINGS[k];
      if (W.toll) playSound(EG_BEAT_SOUNDS.toll);
      if (W.words) { const line = W.words(); mid(line); say(line); pres.live = line; }
    }
    // THE ARRIVAL CARD
    if (E.h > 0 && E.h !== pres.cardH && (E.sg === 'arrive' || E.sg === 'trial')) { pres.cardH = E.h; pres.cardAt = t; pres.card = egArrivalCard(E, { first: pres.cardFirst }); pres.cardFirst = false; if (pres.card) pres.live = `${pres.card.main}. ${pres.card.sub}`; }
    const acc = egAccessNow(win);
    drawEgArrivalCard(egArrivalShown(pres.card, pres.cardAt, t), { hidden: hudHidden(), still: acc.still });
    // THE PARTY ROWS' absent ring: who of the company this screen holds no pose of
    pres.absent = egAbsentStep(pres.absent, E, me(), new Set(peers().map((q) => q.sub)), t);
    // THE TOUCH OF IT: the Beat underfoot in its last 0.4 s, a blow newly aimed at my feet
    const F = feetInHall(E);
    const buzzOn = !!getPref('touchHaptics');
    if (pres.perilH !== E.h) { pres.perilH = E.h; pres.perils.clear(); }
    if (F && !witness) {
      const cyc = egBeatUnder(F.spec, F.x, F.y, F.z, t / 1000);
      if (cyc >= 0 && cyc !== pres.beatCycle) { pres.beatCycle = cyc; egBuzz('beat', { on: buzzOn }); }
      if (E.fight?.h === E.h && egPerilsNew(E.fight.blows, F.x, F.z, pres.perils, t).length) egBuzz('peril', { on: buzzOn });
    }
    // THE DOOR's marker, while the way down stands open
    const door = F && E.sg === 'closing' && F.spec.end && !witness ? egDoorMarker({ x: F.x, z: F.z }, F.spec.end, cam?.yaw ?? 0) : null;
    // THE HUD
    const ff = egFormFactor({ w: win?.innerWidth ?? 1280, h: win?.innerHeight ?? 720 });
    const P = choices(E);
    pres.focus = P.n > 0 ? Math.min(pres.focus, P.n - 1) : 0;
    const model = egSpireHudModel(E, me(), t, { ff, witness: !!witness, potions, gain: pres.gain && t - pres.gain.at < EG_GAIN_MS ? pres.gain : null,
      first: pres.first && t - pres.firstAt < FIRST_SHOW_MS ? pres.first : '', door, live: pres.live, touch: pres.touch ??= isTouchDevice(win), foldOpen: pres.foldOpen });
    drawEgSpireHud(model, { hidden: hudHidden(), skin: isEnhanced() ? 'enhanced' : 'classic', still: acc.still, danger: rgbCss(acc.palette.danger), scale: hudScaleNow(),
      onTouch: (id) => touchAct(id), onFold: () => { pres.foldOpen = !pres.foldOpen; } });
  }
  /** Out of the halls: the HUD and the card put away. */
  function presAway() { drawEgSpireHud(null); drawEgArrivalCard(null); }
  /** A d-pad press while it is the Spire's (the pad's own codes on the classic skin, the prompt bar's gestures on Plus). */
  function padGesture(dir, kind) {
    const ctx = padCtx(), act = egPadAct(dir, kind, ctx);
    if (!act) return false;
    const E = link.state(), o = online();
    if (act.k === 'close') { recap = null; drawEgPanel(null); return true; }
    if (act.k === 'watch') { if (witness) { witness.idx += act.d; if (witness.idx < 0) witness.idx += 8; witness.watched = null; } return true; }
    if (act.k === 'forsake') { api.command('forsake'); return true; }
    const P = choices(E);
    if (act.k === 'focus' && P.n > 0) { pres.focus = (pres.focus + act.d + P.n) % P.n; return true; }
    if (act.k === 'take' && P.kind === 'offer') { const card = E.offer.v[pres.focus]; if (card != null) o?.sendEg?.('pick', { v: card }); return true; }
    if (act.k === 'take' && P.ask) { voted[P.ask[0]] = pres.focus; o?.sendEg?.('vote', { q: P.ask[0], y: pres.focus }); return true; }
    if (act.k === 'no') return api.vote('no');
    return false;
  }
  /** A touch button (section 27.8): the witness's eye, forsaking, the way home. */
  function touchAct(id) {
    if (id === 'prev' || id === 'next') { if (witness) { witness.idx += id === 'next' ? 1 : -1; if (witness.idx < 0) witness.idx += 8; witness.watched = null; } return true; }
    if (id === 'forsake') { api.command('forsake'); return true; }
    if (id === 'home') return api.wayHome();
    return false;
  }

  const api = {
    link,
    /** A word of the hub or my breach's room (net/online.js onEg). */
    word(w, room) {
      if (!w) return;
      if (w.k === 'clk') { egClockHeard(clock, w.c, w.now, Date.now()); return; }   // EG-H1: a sample of the shared clock
      if (w.k === 'bd') { countFell(); return; }   // EG-H1: the relay's count's fall of me - the Spire's one life
      link.word(w);
      if (w.k === 'call') {
        if (opening && w.os === me()) opening = null;
        const key = `${w.b}`;
        if (callSaid !== key && w.co.some((r) => r[0] === me())) {
          callSaid = key;
          say(w.os === me() ? `Your ${w.rh ? 'Rehearsal' : 'Elite Breach'} rises. It opens in ${egCountText(egTimes({ openedAt: w.op }).openAt - now())} - type /breach then to step through.` : `${EG_TEXT.call(w.o || 'Your company')} It opens in ${egCountText(egTimes({ openedAt: w.op }).openAt - now())} - type /breach then to step through.`);
        }
      }
      if (w.k === 'fall' && w.s !== me()) say(`${EG_TEXT.falls(w.n || 'A companion')}${w.fin ? ' The Spire will not take them back.' : ''}`);
      if (w.k === 'fall' && w.s === me() && !witness) enterWitness(now(), true);
      if (w.k === 'rise' && w.s === me()) riseAt(w);
      if (w.k === 'eheal') applyHeal(w.p, w.why);
      if (w.k === 'egot' && w.w === 'page' && EG_ANNALS[w.p]) { annals.add(w.p); say(`A page of the Annals of 3E 398 - ${EG_ANNALS[w.p][0]}: ${EG_ANNALS[w.p][1]}`); }
      else if (w.k === 'egot' && EG_GOT_TEXT[w.w]) say(EG_GOT_TEXT[w.w]);
      if (w.k === 'rd') say(w.cov ? `${EG_TEXT.redoubt(w.w)}: the Covenant has spoken - this Redoubt is the last.` : `${EG_TEXT.redoubt(w.w)}: the count gains ${egCountText(Math.max(0, w.g ?? 0))}.`);
      void room;
    },
    /** `/breach` (answer the call; `rehearse` - the day's Rehearsal; `home` - the way home at a Redoubt). */
    command(arg = '') {
      const parts = String(arg).trim().toLowerCase().split(/\s+/).filter(Boolean), a = parts[0] ?? '', b = parts[1] ?? '';
      if (a === 'rehearse' || a === 'rehearsal') { const no = openRefusal(); if (no) { say(no); return; } open(true); say(EG_TEXT.opening); return; }
      if (a === 'home') { this.wayHome(); return; }
      if (a === 'board' || a === 'boards') { if (!board?.()) say('The boards cannot be read just now.'); return; }   // EG-E2: the three boards (ui/egBoardWindow.js)
      const o = online(), E = link.state();
      if (inSpire()) {
        if (a === 'pick') { const n = Number(b) | 0, card = E.offer?.v?.[n - 1]; if (card == null) say('No Vestige waits for that number.'); else o?.sendEg?.('pick', { v: card }); return; }
        if (a === 'vote') { this.vote(b); return; }
        if (a === 'cant' || a === 'cantrip') { const run = egRunOfMember(E, me()), n = (Number(b) | 0) - 1; if (n < 0 || n >= run.cant.length) say(run.cant.length ? `Your Cantrips: ${run.cant.map((c, j) => `${j + 1}. ${EG_CANTRIPS[c]?.name}`).join(', ')}.` : 'You hold no Cantrip.'); else o?.sendEg?.('cant', { i: n }); return; }
        if (a === 'buy') { const i = { cant: 0, cantrip: 0, tonic: 1, shard: 2 }[b]; if (i == null) say('The Sutler sells a Cantrip (20 lumen), a Spire Tonic (15) or a Vestige shard (30): /breach buy cant|tonic|shard.'); else o?.sendEg?.('buy', { i }); return; }
        if (a === 'surplus') { o?.sendEg?.('surplus', { use: b === 'reroll' ? 1 : 0 }); return; }
        if (a === 'ping') { const at = standing(); if (at) { const spec = egHallOf(E.seed, E.h, E.geo ?? 0); o?.sendEg?.(witness ? 'ping' : 'lping', { x: Math.round(egLocalX(spec, at.sx) * 100) / 100, z: Math.round(at.z * 100) / 100, w: { danger: 1, mine: 2, cache: 2 }[b] ?? 0 }); } return; }
        if (a === 'watch') { if (witness) { witness.idx++; witness.watched = null; } return; }
        if (a === 'forsake') {
          if (!witness) { say('Only the fallen may forsake the breach.'); return; }
          if (Date.now() - forsakeAskAt > EG_HOME_CONFIRM_MS) { forsakeAskAt = Date.now(); mid('Forsake the breach? Your recall is lost. /breach forsake again to go.'); return; }
          forsakeAskAt = -Infinity; o?.sendEg?.('forsake'); return;
        }
        if (a === 'use' || a === 'engine') { this.useEngine(); return; }
        if (a === 'annals') { const n = (Number(b) | 0) - 1, have = [...annals].sort((x, y) => x - y); if (!have.length) say('No page of the Annals is yours yet. Look behind the halls\' false walls.'); else if (n >= 0 && have[n] != null) say(`${EG_ANNALS[have[n]][0]}: ${EG_ANNALS[have[n]][1]}`); else say(`Your pages of the Annals: ${have.map((p, j) => `${j + 1}. ${EG_ANNALS[p][0]}`).join(', ')}. /breach annals N to read one.`); return; }
        if (a === 'bequest') { const run = egRunOfMember(E, me()), n = (Number(b) | 0) - 1, v = run.vs[n]?.[0]; if (!witness || v == null) say('A fallen member names one of their Vestiges: /breach bequest N.'); else o?.sendEg?.('bequest', { v }); return; }
        say('In the breach: /breach pick N, vote yes|no|N, cant N, buy cant|tonic|shard, use, annals, ping, watch, forsake, home.');
        return;
      }
      answer();
    },
    /** The company's word answered (`y` yes/no or an option's number): the newest choice open, or the one named. */
    vote(y) {
      const E = link.state(), o = online(), open = (E.as ?? []).filter((q) => q[2] > now());
      if (!open.length) { say('No choice is open.'); return false; }
      const yn = y === 'yes' || y === 'y' ? 1 : y === 'no' || y === 'n' ? 0 : null;
      const n = Number(y) | 0;
      const ask = yn != null ? [...open].reverse().find((q) => !q[0].startsWith('dec:')) ?? open[open.length - 1] : open.find((q) => q[0].startsWith('dec:') && voted[q[0]] == null) ?? open[open.length - 1];
      const val = yn != null ? yn : Math.max(0, n - 1);
      voted[ask[0]] = val;
      return !!o?.sendEg?.('vote', { q: ask[0], y: val });
    },
    /** A key while the Spire's panel stands (1-6 a card or an option, Y/N a yes-or-no choice, Enter closes the recap) or
     *  while I watch (Q and E change whom). Answers whether it took the key. */
    key(e) {
      if (!inSpire() && !recap) return false;
      const code = e?.code ?? '';
      if (recap && (code === 'Enter' || code === 'Escape' || EG_PAD_DIRS[code] === 'up')) { recap = null; drawEgPanel(null); return true; }
      if (!inSpire()) return false;
      const E = link.state(), o = online(), m = /^Digit([1-6])$/.exec(code);
      if (witness && (code === 'KeyQ' || code === 'KeyE')) { witness.idx += code === 'KeyE' ? 1 : -1; if (witness.idx < 0) witness.idx += 8; witness.watched = null; return true; }
      const dir = EG_PAD_DIRS[code];   // EG-G1 (section 27.8): the pad's d-pad, its own codes (the classic skin's pad)
      if (dir && egPadUp(padCtx())) return padGesture(dir, dir === 'down' && witness ? 'hold' : 'tap');
      if (m && E.offer?.v?.length) { const card = E.offer.v[Number(m[1]) - 1]; if (card != null) { o?.sendEg?.('pick', { v: card }); return true; } }
      const open = (E.as ?? []).filter((q) => q[2] > now());
      if (open.length && (code === 'KeyY' || code === 'KeyN')) return this.vote(code === 'KeyY' ? 'yes' : 'no');
      if (open.length && m) return this.vote(m[1]);
      return false;
    },
    /** THE DEATH SAVE (characters/playerEntity.js registerPlayerDeathSave): a blow that would kill me in the Spire is a
     *  fall instead - the witness begins. */
    fallSave() { if (!inSpire() || witness) return false; enterWitness(now(), false); return true; },
    /** A witness takes no blow (the damage door's mod). */
    witnessing: () => !!witness,
    /** The witness's eye: behind and over the member watched (the camera's override). Answers whether it took the eye. */
    witnessEye(c, yaw = 0) {
      if (!witness?.watched) return false;
      const p = peers().find((q) => q.sub === witness.watched);
      if (!p?.pos) return false;
      c.pos = [p.pos[0] - Math.sin(yaw) * EG_WITNESS_BACK, p.pos[1] + EG_WITNESS_UP + 1.6, p.pos[2] - Math.cos(yaw) * EG_WITNESS_BACK];
      return true;
    },
    /** THE POTION LAW: may I drink a restoring potion now (two a hall), and one drunk. */
    potionAllowed: () => !inSpire() || potions > 0,
    potionUsed() { if (inSpire()) potions = Math.max(0, potions - 1); },
    push: (dx, dz, m) => pushBy(dx, dz, m),
    /** Iron Footing's share off a push (the spans' Gust and Pendulum read it - systems/spireKit.js spireFooting). */
    footing: () => (inSpire() ? footing() : 0),
    hold: (ms) => holdFor(ms),
    ring: (x, z, r, inside) => ringKeep(x, z, r, inside),
    useKey,
    /** One frame (the online frame, every mode). */
    frame() {
      const t = now(), E = link.state();
      if (Date.now() - keysAt >= EG_KEYS_EVERY_MS) askKeys();
      if (Date.now() - claimAt >= EG_CLAIM_RETRY_MS) flush();
      if (opening?.z) sendOpen();
      if (opening && opening.tries >= EG_OPEN_TRIES && Date.now() - opening.sentAt > EG_OPEN_RETRY_MS * 2) { opening = null; say(EG_TEXT.shut); }
      if (E.call && !inSpire() && egPhase({ openedAt: E.call.op }, t) === 'ended' && !E.wk) link.forget();
      portalSet?.tick(cam?.pos ?? null);
      // EG-H1: the shared clock's ping while the breach's room holds me; my body's word while I stand alive in it; the ride's
      // two hooks on the presence link (net/online.js `poseRide`, `rideAt`)
      const o = online();
      if (o) { o.poseRide = inSpire() ? ridePl : null; o.rideAt = inSpire() ? rideDraw : null; }
      if (inSpire()) {
        const c = egClockDue(clock, Date.now());
        if (c != null && !o?.sendEg?.('clk', { c, h: egClockHalfRtt(clock) })) clock.sent.delete(c);
        if (!witness && entity.health > 0 && entity.maxHealth > 0 && egMemberOf(E, me())?.in) sayBody(entity.health / entity.maxHealth, Date.now());
      }
      if (inSpire()) {
        spireFrame(E, t);
        pushStep();
        fight ??= makeFight(link);
        fight?.frame();
        presFrame(link.state(), t);   // EG-G1
      } else {
        presAway();   // EG-G1
        if (fight) { fight.leave(); }
        if (leaving || (E.end && E.b)) { leaving = false; link.forget(); }
        if (door || portal) dropDoor();
      }
      drawEgHud(inSpire() ? null : egHudModel(link.state(), me(), t, { inSpire: false, witness: !!witness, potions }), { hidden: hudHidden() });   // EG-G1: inside, the Spire's HUD
      if (recap && Date.now() > recapUntil) recap = null;
      if (recap && pres.rel < (recap.opened ?? 0) && Date.now() - pres.relAt >= 400) { pres.rel++; pres.relAt = Date.now(); playSound(EG_BEAT_SOUNDS.rare); }   // EG-G1: one each 400 ms, the Rare chime
      const panelModel = inSpire() ? egPanelModel(link.state(), me(), t, voted) : null;
      drawEgPanel(panelModel, { hidden: hudHidden() && !recap, recap, focus: pres.focus, relShown: pres.rel, words: EG_PRES_TEXT, onPick: (card) => online()?.sendEg?.('pick', { v: card }), onVote: (q, y) => { voted[q] = y; online()?.sendEg?.('vote', { q, y }); }, onSurplus: (use) => online()?.sendEg?.('surplus', { use }) });
    },
    /** The hall's fight driver (the dungeon host's seams), or null outside the Spire. */
    fight: () => (inSpire() ? fight : null),
    lights: () => (inSpire() ? fight?.lights() ?? [] : []),
    batches: () => (inSpire() ? [...(fight?.batches() ?? []), ...(portalSet?.batches() ?? [])] : []),
    drawPass: (proj, view, eye, seconds, fog) => (inSpire() ? !!fight?.drawPass(proj, view, eye, seconds, fog) : false),
    /** THE VOID'S COST (section 8): a tenth of my health, never below a quarter of it. */
    castBack() {
      const max = entity.maxHealth ?? 0, cut = Math.min(EG_CAST_BACK_LOSS * max, Math.max(0, entity.health - EG_CAST_BACK_FLOOR * max));
      if (cut > 0) hurt(Math.round(cut));
      castBackBeat(cut > 0);   // EG-G1: -10% on the screen, the Steps' rewind, and the first time its line
    },
    /** THE WAY HOME (a Redoubt's rest): pressed once, asked; pressed again, walked. */
    wayHome() {
      const E = link.state(), o = online();
      if (!inSpire() || E.sg !== 'rest') { say('The way home opens at a Redoubt.'); return false; }
      if (Date.now() - homeAskAt > EG_HOME_CONFIRM_MS) { homeAskAt = Date.now(); mid(`${EG_TEXT.walkHome} Press again to go.`); return false; }
      homeAskAt = -Infinity;
      return !!o?.sendEg?.('home');
    },
    /** Whether a Rampart's portcullis in hall `h` stands open (its door open, or the company past it). */
    gateOpen(h) {
      const E = link.state();
      return E.h > h || (E.h === h && (E.sg === 'closing' || E.sg === 'rest' || E.sg === 'end'));
    },
    /** A death in the Spire is one (the respawn's branch): read before the respawn leaves. */
    diedHere: () => inSpire(),
    /** The breach as held (tests). */
    state: () => link.state(),
    /** EG-E2/section 25.4, THE QUIET COMPANY: during a trial in the Spire the cosmetic auras draw at nothing (the host's
     *  aura gather asks it) - every light on the floor is the fight's. */
    quiet: () => inSpire() && link.state()?.sg === 'trial',
    /** EG-E: where a Redoubt's spoils leave from - the Court's heart of hall `h`, over its floor, and the floor they are
     *  kept to (world/gateSpew.js keepLaunch's `{ centre, r, floorY }`) - while I stand in that hall; null anywhere else
     *  (the spoils go straight into the pack). */
    beaconAt(h) {
      const E = link.state(), at = inSpire() ? standing() : null;
      if (!E?.seed || !at || at.slot !== egSlotOfHall(h)) return null;
      const spec = egHallOf(E.seed, h, E.geo ?? 0), r = spec.ring, f = spec.fight ?? spec.end;
      if (!r || !f) return null;
      const floor = egToDungeon(spec, r.x, f.y ?? 0, r.z);
      return { at: [floor[0], floor[1] + EG_BEACON_SPEW_UP, floor[2]], keep: { centre: floor, r: Math.max(2, r.r - EG_BEACON_RIM_M), floorY: floor[1] } };
    },
    /** EG-FULL LAYER THREE: the hall's errand objects as the relay keeps them (systems/spireKit.js spireObjs - the spans
     *  stand Grath's islands and the false walls by them). */
    objs() {
      const E = link.state(), F = E.fight;
      if (!inSpire() || !F || F.h !== E.h) return { h: E.h | 0, objs: [] };
      return { h: E.h | 0, objs: F.bodies.filter((b) => b.role === EG_ROLE.obj).map((b) => ({ t: OBJ_NAME[b.k] ?? '', i: b.i, x: b.x, z: b.z, st: b.st ?? 0, stAt: b.stAt ?? 0, pt: b.pt ?? 0 })) };
    },
    /** A press on a span's own target (systems/spireKit.js spireAct): an Orrery stone's handle (`pz` - a turn forward or
     *  back) or an engine (`use`), in the hall I stand in. */
    act(key) {
      const E = link.state(), o = online();
      if (!inSpire()) return false;
      const st = /^egstone:(\d+):(\d):([fb])$/.exec(key ?? '');
      if (st) { if (Number(st[1]) !== E.h || E.sg !== 'trial') { say('The Orrery is still.'); return true; } return !!o?.sendEg?.('pz', { i: Number(st[2]), a: st[3] === 'f' ? 1 : -1 }); }
      const en = /^egengine:(\d+):(\d+)$/.exec(key ?? '');
      if (en) { if (Number(en[1]) !== E.h || E.sg !== 'trial') { say('The engine is cold.'); return true; } const ok = !!o?.sendEg?.('use', { i: Number(en[2]) }); if (ok) mid('You work the engine.'); return ok; }
      return false;
    },
    /** `/breach use`: the engine within reach, worked. */
    useEngine() {
      const E = link.state(), at = standing();
      if (!inSpire() || !at) return false;
      const spec = egHallOf(E.seed, E.h, E.geo ?? 0), x = egLocalX(spec, at.sx);
      const e = (spec.engines ?? []).find((q) => Math.hypot(q.x - x, q.z - at.z) <= EG_ENGINE_REACH_M + 0.5);
      if (!e) { say((spec.engines ?? []).length ? `Stand at ${EG_ENGINES[spec.engines[0].kind].name} to work it.` : 'No engine stands in this hall.'); return false; }
      return this.act(`egengine:${E.h}:${e.i}`);
    },
    /** The pages of the Annals this breach has given me (their numbers). */
    annals: () => [...annals].sort((a, b) => a - b),
    /** Online gone: every piece put away (the call kept - it is the hub's). */
    away() { fight?.leave(); dropDoor(); drawEgHud(null); drawEgPanel(null); presAway(); witness = null; const o = online(); if (o) { o.poseRide = null; o.rideAt = null; } },
    /** EG-H1: the breach's shared clock (relay ms) and its offset to this machine's wall clock (null before the room has
     *  answered a ping) - the host's spans and its fight read it (scenes/world.js's `egNow`, the spans' anchored clock). */
    sharedNow: () => now(),
    clockOffset: () => egClockOffset(clock),
    /** EG-H1: my ride's `pl` now (tests; net/online.js reads it through `poseRide`). */
    ridePl: () => ridePl(),
    /** Registered as the key's opener (systems/weirKey.js). */
    claimKeys() { setWeirKeyOpener(() => useKey()); },
    restack,
    // EG-G1 (section 27): the seams the host reads
    /** The party rows in the party panel's terms (ui/egParty.js egPartyDeco), or null outside a breach. */
    partyRows() {
      if (!inSpire()) return null;
      const E = link.state(), t = now(), roads = new Map();
      const spec = E.h > 0 ? egHallOf(E.seed, E.h, E.geo ?? 0) : null;
      if (spec?.fork) {
        for (const q of peers()) { const [sx, y, z] = dungeonToRealm(q.pos[0], q.pos[1] - 1.6, q.pos[2]); roads.set(q.sub, egRoadOf(spec, egLocalX(spec, sx), y, z)); }
        const F = feetInHall(E);
        if (F) roads.set(me(), egRoadOf(spec, F.x, F.y, F.z));
      }
      return egPartyDeco(egPartyRows(E, t, { absent: pres.absent, roads }));
    },
    /** Whether the pad's d-pad is the Spire's now (the recap, the panel, the witness's eye). */
    padUp: () => egPadUp(padCtx()),
    /** A d-pad gesture while it is the Spire's (`dir` up | down | left | right, `kind` tap | hold | release). */
    padGesture: (dir, kind) => padGesture(dir, kind),
    /** The prompt bar's rows while the d-pad is the Spire's. */
    padPrompts: () => egPadPrompts(padCtx()),
    /** A touch button's press. */
    touchAct: (id) => touchAct(id),
    /** A beat said from outside the breach's words (a Weir Key found - section 27.5). */
    beat: (k) => beatNow(k),
  };
  return api;
}
