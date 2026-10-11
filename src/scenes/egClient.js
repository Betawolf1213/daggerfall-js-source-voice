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
// What EG-PLAY leaves (section 31, EG-PLAY): the arch (the call and `/breach` are the door), the witness view, the recall.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { createEgLink, egMemberOf } from '../net/egLink.js';
import { egHallOf, egCircleOfHall, egSlotOfHall, egSlotAt, egLocalX, egAtDoor, egPhase, egTimes, egCountText, EG_TEXT, EG_CAST_BACK_LOSS, EG_CAST_BACK_FLOOR } from '../net/egLaw.js';
import { readEgReceipt } from '../net/egReceipt.js';
import { dungeonToRealm } from '../net/sdBrain.js';
import { egToDungeon } from '../world/egHall.js';
import { restackWeirKeys, setWeirKeyOpener } from '../systems/weirKey.js';
import { egHudModel, drawEgHud } from '../ui/egHud.js';
import { fillVitalSigns } from '../systems/statMods.js';
import { createPortalSet } from './portalFx.js';

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
/** A second press of the way home within this long walks (ms). */
export const EG_HOME_CONFIRM_MS = 6000;
/** The end's words, by why it ended. */
export const EG_END_TEXT = Object.freeze({
  fall: EG_TEXT.fallen, home: 'You walk home. The Redoubts you took are kept.', tear: EG_TEXT.torn,
  wipe: 'The company has fallen. The breach closes.', last: "The Spire's last word: the breach closes.",
  empty: 'Nobody answered the call. The breach closes.', gone: 'Nobody stayed. The breach closes.',
  rehearsal: EG_TEXT.rehearsalDone, void: 'The breach failed to hold. Your key is returned.',
});
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
 *   hurt: (n: number) => void, store?: any, saved?: () => void, hudHidden?: () => boolean, fight?: (link: any) => any, renderer?: any, audio?: any }} deps
 */
export function createEgClient({ modes, online, hub, account, now, entity, player, cam, say, mid = () => {}, veil = () => null, site, wire, landAt, hurt,
  store = null, saved = () => {}, hudHidden = () => false, fight: makeFight = () => null, renderer = null, audio = null }) {
  const link = createEgLink({ now, say, onReceipt: (r) => claimAdd(r), onRefused: (w) => refused(w) });
  let fight = null;
  /** an open in flight: its request id, the service's order, whether the hub took it */
  let opening = null;
  /** my admission to the breach I answered: `{ b, z }`; the welcome it went to the room under */
  let admit = null, inFor = -1;
  let answering = false, swapping = false, leaving = false;
  let downAt = -Infinity, downH = 0, placedH = 0, endSeen = null, endAt = 0, homeAskAt = -Infinity;
  let keysAt = -Infinity, claimAt = -Infinity, rdSeen = 0, callSaid = '';
  let door = null, doorH = 0, portal = null;
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
      const went = await modes()?.stepThroughFire?.(() => modes()?.enterEgHall?.({ b: c.b, seed: c.seed, c: 1, site: site() }), 'hourIn');
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
  /** Stood on hall `h`'s arrival plate, facing down its course. */
  function placeOn(h, E) {
    const spec = egHallOf(E.seed, h);
    if (!spec.arrive) return false;
    const at = egToDungeon(spec, spec.arrive.x, spec.arrive.y + 0.1, spec.arrive.z);
    veil()?.flash?.('hourIn');
    return !!modes()?.egPlace?.(at, 0);
  }
  /** The Redoubt's way home: its door at the Court's heart (an exit door - the dungeon's own press and name). */
  function standDoor(E) {
    if (door && doorH === E.h) return;
    const spec = egHallOf(E.seed, E.h), f = spec.fight ?? spec.end ?? spec.arrive;
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
    veil()?.flash?.('hourHome');
    if (text) say(text);
    if (!modes()?.egLeave?.()) leaving = false;
  }
  /** A new circle: out under the veil and into the next, built as the first was. */
  async function swapTo(E, c) {
    if (swapping || answering) return;
    swapping = true;
    try {
      const back = modes()?.egHallReturn?.() ?? null;
      placedH = 0; downH = 0; dropDoor();
      await modes()?.stepThroughFire?.(async () => {
        modes()?.forceExitToExterior?.();
        if (back) landAt(back);
        return modes()?.enterEgHall?.({ b: E.b, seed: E.seed, c, site: site() });
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
    if (mine && !mine.alive && !leaving && entity.health > 0 && !M?.deathUp?.()) { walkOut(EG_TEXT.fallen); return; }
    if (mine && mine.home) { walkOut(null); return; }
    if (E.end) {
      if (endSeen !== E.end) { endSeen = E.end; endAt = t; mid(EG_END_TEXT[E.end] ?? EG_TEXT.ended); }
      if (t - endAt >= EG_END_WALK_MS) walkOut(null);
      return;
    }
    if (!(E.h > 0)) return;
    const c = egCircleOfHall(E.h);
    if (c !== M.egHallCircle?.()) { if (E.sg === 'arrive') swapTo(E, c); return; }
    const at = standing();
    if (!at) return;
    const spec = egHallOf(E.seed, E.h);
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
    if (E.sg === 'rest') { if (rdSeen !== E.h) { rdSeen = E.h; fillVitalSigns(entity); mid(`${EG_TEXT.redoubt(E.rd)}. ${EG_TEXT.rest}`); say(`${EG_TEXT.redoubt(E.rd)} taken. The way home stands at the Court's heart; the stair down opens when the rest ends.`); } standDoor(E); }
    else if (door) dropDoor();
  }

  return {
    link,
    /** A word of the hub or my breach's room (net/online.js onEg). */
    word(w, room) {
      if (!w) return;
      link.word(w);
      if (w.k === 'call') {
        if (opening && w.os === me()) opening = null;
        const key = `${w.b}`;
        if (callSaid !== key && w.co.some((r) => r[0] === me())) {
          callSaid = key;
          say(w.os === me() ? `Your ${w.rh ? 'Rehearsal' : 'Elite Breach'} rises. It opens in ${egCountText(egTimes({ openedAt: w.op }).openAt - now())} - type /breach then to step through.` : `${EG_TEXT.call(w.o || 'Your company')} It opens in ${egCountText(egTimes({ openedAt: w.op }).openAt - now())} - type /breach then to step through.`);
        }
      }
      if (w.k === 'fall' && w.s !== me()) say(EG_TEXT.falls(w.n || 'A companion'));
      if (w.k === 'rd') say(`${EG_TEXT.redoubt(w.w)}: the count gains fifteen minutes.`);
      void room;
    },
    /** `/breach` (answer the call; `rehearse` - the day's Rehearsal; `home` - the way home at a Redoubt). */
    command(arg = '') {
      const a = String(arg).trim().toLowerCase();
      if (a === 'rehearse' || a === 'rehearsal') { const no = openRefusal(); if (no) { say(no); return; } open(true); say(EG_TEXT.opening); return; }
      if (a === 'home') { this.wayHome(); return; }
      if (inSpire()) { say('You are in the breach. At a Redoubt, /breach home takes the way home.'); return; }
      answer();
    },
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
      if (inSpire()) {
        spireFrame(E, t);
        fight ??= makeFight(link);
        fight?.frame();
      } else {
        if (fight) { fight.leave(); }
        if (leaving || (E.end && E.b)) { leaving = false; link.forget(); }
        if (door || portal) dropDoor();
      }
      drawEgHud(egHudModel(link.state(), me(), t, { inSpire: inSpire() }), { hidden: hudHidden() });
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
      say(EG_TEXT.castBack);
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
    /** Online gone: every piece put away (the call kept - it is the hub's). */
    away() { fight?.leave(); dropDoor(); drawEgHud(null); },
    /** Registered as the key's opener (systems/weirKey.js). */
    claimKeys() { setWeirKeyOpener(() => useKey()); },
    restack,
  };
}
