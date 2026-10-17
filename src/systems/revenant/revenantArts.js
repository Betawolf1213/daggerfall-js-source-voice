// @ts-check
// RVN-ARTS (2026-10-17, the owner: "Give revenants the chance to have unique telegraphed abilities, magic abilities like
// healing or other buffs, etc (Must be balanced)") - A REVENANT'S ART_LAW. One revenant in ARTS_CHANCE is born with an art,
// drawn on its id from its family's pool (revenantFeud.js signatureFamily - a blade, a beast, a brute, or the casters and
// the rest), so it is the same on every read, every load and every client, and an older record has the one its id draws.
// Every art has two halves: what it does to the player while it hunts them, and what it does for them once it is sworn.
//
//   art      | hostile (from ART_RANK, the Enhanced AI switch on - a telegraph)    | sworn (any rank)
//   ---------+---------------------------------------------------------------------+-------------------------------------
//   Mending  | under MEND.AT of its health, once a fight: a CHANNEL - its colour's  | a hurt leaves me under SWORN_MEND.AT:
//            | disc about its own feet; any blow that lands on it breaks it;        | it heals me SHARE + PER_RANK a rank
//            | whole, it heals MEND.HEAL of its health                              | of my health, every COOLDOWN s
//   Ward     | under WARD.AT, once a fight: a channel; whole, WARD.SECONDS of       | it goes into a fight: a Shield on me,
//            | blows taken at WARD.TAKEN (never past an adaptation's floor; never   | BASE + PER_RANK a rank, every COOLDOWN
//            | its weakness)                                                       |
//   War Cry  | as it joins the fight, once: a channel; whole, it and its band strike| it goes into a fight: Fortify Strength
//            | CRY.BLOWS harder for CRY.SECONDS                                     | BASE + PER_RANK a rank, every COOLDOWN
//   Siphon   | a lane at me (the charge's shape); caught, a blast of magic at the   | its foe's health drawn (the pyre's,
//            | pyre's weight, and it drinks as much                                 | at my level) and a third to me
//   Barrage  | three discs at my feet, each re-aimed as it is cast; caught, each a  | its foe struck at x BARRAGE
//            | blast of its element                                                 |
//   Nova     | a ring about it (safe at its feet, for the one who backs off);       | every foe about it struck
//            | caught, a blast of its element                                       |
//
// THE LANGUAGE OF THE GROUND (Feud-Arc.md's): a mark at MY feet or about it says MOVE; a disc about ITS feet in its art's
// colour says it is CHANNELLING - strike it. Its marks are the brain's own shapes (ai/blowShapes.js), drawn by the ground's
// pass as any wind-up (ai/foeBlows.js liveBlows - its own key, kept fresh while its foe lives), and one wind-up near me at a
// time holds for them too: an art waits on any wind-up near me, and while one is live no foe winds another.
// A blast is a spell through the host's own door - my saving throw and resistances answer it, as the pyre's.
//
// BALANCED: a hostile channel once a fight and broken by a blow; a telegraphed art COOLDOWN apart and lighter than the
// signature's x2 (SIG.MULT); a sworn one's gifts on cooldowns, its strikes the pyre's weight at my level. Owner-side, as
// the pyre is: a peer fighting my revenant sees its marks only in my game (FEUD WIRE carries none).

import { idStream, signatureFamily, SIG, pyreElement, pyreSpell } from './revenantFeud.js';
import { makeBlow, setLiveBlow, shatterBlow, windupNear, inBlow, BLOW } from '../../ai/foeBlows.js';
import { tacticsNow } from '../../ai/tacticsClock.js';
import { tacticsSwitchOn } from '../../ai/tactics.js';
import { revenantById, revenantEvent } from './revenant.js';
import { healMine } from '../playerHeal.js';
import { ROUND_SECONDS } from '../sigil/sigilSets.js';
import { t } from '../textManager.js';   // L10N4: its words through the text core

/** The arts. */
export const ARTS = Object.freeze(['mending', 'warding', 'warcry', 'siphon', 'barrage', 'nova']);
const ART_SET = new Set(ARTS);
export const isArt = (v) => typeof v === 'string' && ART_SET.has(v);
/** How many revenants are born with an art. */
export const ARTS_CHANCE = 0.35;
/** A hunting revenant shows its art from this rank (its signature's). */
export const ART_RANK = 2;
/** Each family's pool. */
export const ART_POOL = Object.freeze({
  blade: Object.freeze(['warding', 'warcry', 'siphon', 'mending']),
  beast: Object.freeze(['warcry', 'mending', 'nova']),
  brute: Object.freeze(['warcry', 'nova', 'warding']),
  caster: Object.freeze(['mending', 'warding', 'barrage', 'siphon', 'nova']),
});
/** Its art's name, in the player's language. */
export const ART_NAMES = Object.freeze({
  get mending() { return t('rvn.art.name.mending', 'Mending'); }, get warding() { return t('rvn.art.name.warding', 'Ward'); },
  get warcry() { return t('rvn.art.name.warcry', 'War Cry'); }, get siphon() { return t('rvn.art.name.siphon', 'Siphon'); },
  get barrage() { return t('rvn.art.name.barrage', 'Barrage'); }, get nova() { return t('rvn.art.name.nova', 'Nova'); },
});
/** The three that channel (a disc about its own feet, broken by a blow), and the three that are thrown at me. */
export const ART_CHANNELS = Object.freeze(['mending', 'warding', 'warcry']);
/** Every number, hostile then sworn. The thrown three's weights are on the pyre's blast (SIG.PYRE_BASE, SIG.PYRE_PER a
 *  level) - SIG.MULT is the signature's. */
export const ART_LAW = Object.freeze({
  MEND: Object.freeze({ AT: 0.5, CHANNEL: 2.0, HEAL: 0.2 }),
  WARD: Object.freeze({ AT: 0.75, CHANNEL: 1.5, TAKEN: 0.65, SECONDS: 10 }),
  CRY: Object.freeze({ REACH: 20, CHANNEL: 1.0, BLOWS: 1.2, SECONDS: 12 }),
  SIPHON: Object.freeze({ REACH: 8.5, WINDUP: 1.3, MULT: 1.0 }),
  BARRAGE: Object.freeze({ REACH: 12, WINDUP: 1.1, STEP: 0.45, COUNT: 3, MULT: 0.6 }),
  NOVA: Object.freeze({ REACH: 3.8, WINDUP: 1.4, MULT: 1.2 }),
  COOLDOWN: Object.freeze([14, 20]),
  FIRST: Object.freeze([3, 6]),
  SWORN_MEND: Object.freeze({ AT: 0.4, SHARE: 0.12, PER_RANK: 0.02, COOLDOWN: 120 }),
  SWORN_WARD: Object.freeze({ BASE: 6, PER_RANK: 3, ROUNDS: 6, COOLDOWN: 90 }),
  SWORN_CRY: Object.freeze({ BASE: 4, PER_RANK: 2, ROUNDS: 6, COOLDOWN: 90 }),
  SWORN_STRIKE: Object.freeze({ COOLDOWN: Object.freeze([16, 22]), SIPHON: 1.0, SIPHON_HEAL: 1 / 3, BARRAGE: 1.5, NOVA: 0.8, NOVA_REACH: 5 }),
});
/** Each art's colour on the ground - never the ember or the iron red a blow wears. */
export const ART_COLORS = Object.freeze({
  mending: Object.freeze([0.3, 0.9, 0.5]), warding: Object.freeze([0.35, 0.6, 1.0]), warcry: Object.freeze([1.0, 0.82, 0.25]),
  siphon: Object.freeze([0.85, 0.15, 0.45]), barrage: Object.freeze([0.7, 0.35, 1.0]), nova: Object.freeze([0.6, 0.9, 1.0]),
});
/** The blow classes a ward takes less of (RVN2's - adaptBlowClass). */
const WARD_CLASSES = Object.freeze(['blade', 'blunt', 'axe', 'h2h', 'arrow']);

/** ITS ART_LAW, drawn on its id: one in ARTS_CHANCE, from its family's pool; else null. */
export function drawArt(id, mobileType) {
  if (typeof id !== 'string' || !id || !Number.isInteger(mobileType)) return null;
  const rolls = idStream(id, 'art');
  if (rolls() >= ARTS_CHANCE) return null;
  const pool = ART_POOL[signatureFamily(mobileType) ?? 'caster'];
  return pool[Math.min(pool.length - 1, Math.floor(rolls() * pool.length))];
}
/** A record's art - derived, never stored. */
export const artOf = (r) => drawArt(r?.id, r?.mobileType);
/** The pyre's blast at `level`, its mean, x `mult` - the weight of a thrown art. */
export const artMagnitude = (level, mult) => ((SIG.PYRE_BASE[0] + SIG.PYRE_BASE[1]) / 2 + SIG.PYRE_PER * Math.max(1, level | 0)) * mult;

/** What its art does - the page's words, by its side. */
export function artWords(r, { sworn = !!r?.sworn } = {}) {
  const art = artOf(r);
  if (!art) return null;
  const n = ART_NAMES[art];
  if (sworn) {
    const rank = Math.max(1, Math.min(5, r.rank | 0));
    switch (art) {
      case 'mending': return t('rvn.art.sworn.mending', 'Art: {n} - when you fall under {at} of your health it heals {share} of it (every {m} minutes).', { n, at: pct(ART_LAW.SWORN_MEND.AT), share: pct(ART_LAW.SWORN_MEND.SHARE + ART_LAW.SWORN_MEND.PER_RANK * rank), m: ART_LAW.SWORN_MEND.COOLDOWN / 60 });
      case 'warding': return t('rvn.art.sworn.warding', 'Art: {n} - as it goes into a fight it shields you for {points} (every {s} seconds).', { n, points: ART_LAW.SWORN_WARD.BASE + ART_LAW.SWORN_WARD.PER_RANK * rank, s: ART_LAW.SWORN_WARD.COOLDOWN });
      case 'warcry': return t('rvn.art.sworn.warcry', 'Art: {n} - as it goes into a fight your Strength rises by {points} (every {s} seconds).', { n, points: ART_LAW.SWORN_CRY.BASE + ART_LAW.SWORN_CRY.PER_RANK * rank, s: ART_LAW.SWORN_CRY.COOLDOWN });
      case 'siphon': return t('rvn.art.sworn.siphon', 'Art: {n} - now and then it draws its foe\'s life and gives you a third of it.', { n });
      case 'barrage': return t('rvn.art.sworn.barrage', 'Art: {n} - now and then it looses a barrage on its foe.', { n });
      default: return t('rvn.art.sworn.nova', 'Art: {n} - now and then it strikes every foe about it.', { n });
    }
  }
  const young = (r.rank | 0) < ART_RANK, on = tacticsSwitchOn();
  const below = young ? (on ? t('rvn.art.note.rank', ' (from Rank II)') : t('rvn.art.note.rankSwitch', ' (from Rank II, with Enhanced AI)')) : on ? '' : t('rvn.art.note.switch', ' (with Enhanced AI)');
  switch (art) {
    case 'mending': return t('rvn.art.hunt.mending', 'Art: {n} - hurt, it gathers itself to heal; strike it to break the spell{below}.', { n, below });
    case 'warding': return t('rvn.art.hunt.warding', 'Art: {n} - hurt, it gathers a ward against your blows; strike it to break the spell{below}.', { n, below });
    case 'warcry': return t('rvn.art.hunt.warcry', 'Art: {n} - it roars as the fight begins, and it and its band strike harder; strike it to cut it short{below}.', { n, below });
    case 'siphon': return t('rvn.art.hunt.siphon', 'Art: {n} - a lane at you that drinks your life; step out of it{below}.', { n, below });
    case 'barrage': return t('rvn.art.hunt.barrage', 'Art: {n} - three blasts at your feet, one after another; keep moving{below}.', { n, below });
    default: return t('rvn.art.hunt.nova', 'Art: {n} - a ring about it bursts; step away, or close in to its feet{below}.', { n, below });
  }
}
const pct = (x) => `${Math.round(x * 100)}%`;
const U = (lo, hi, rolls) => lo + rolls() * (hi - lo);

// ── the hostile half: the pools' frame ──────────────────────────────
/** A blow's key in the ground's registry (ai/foeBlows.js liveBlows) - its own, never the foe's brain's - kept fresh
 *  (`_tac.seen`) while its foe is stepped, so a dead foe's mark goes as a dead foe's wind-up does. */
const keyFor = (now) => ({ _tac: { seen: now } });
const yawTo = (from, to) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
/** A foe that may throw its art now: a hostile revenant of the rank, not running, kneeling, judged, roaring or scattering,
 *  nobody else's puppet, alive. */
function mayArt(f) {
  const e = f?.entity, rev = e?.revenant;
  if (!rev?.id || rev.sworn || f.dead || f.puppet || !(e.health > 0)) return false;
  if (f.fleeing || f.scattering || f.yielded || f.roaring || f.executing || f.sparing || f._knockedOut || e.team === 'PlayerAlly') return false;
  return (rev.rank | 0) >= ART_RANK;
}
/** Its art's state on the pool's record, made once a stand. */
const stateOf = (f, art) => (f._art ??= { art, used: {}, ready: null, live: null, wardUntil: 0, wardWas: null, cryUntil: 0, cryBand: [], called: false });

/**
 * THE HOSTILE ART_LAW, a frame of it (each pool's foe loop, beside the signature's - scenes/exteriorFoes.js, scenes/dungeonContext.js):
 * `ctx` - `feet` my feet in the pool's frame; `onMe()` whether its fight is with me; `strike(spell)` a spell at me through the
 * host's door (my save answers it); `say(ev)` an event said (its card, else its line); `sfx(element, at)` a cast's sound;
 * `foes()` the pool's live records (its band). Answers what happened this frame ('start', 'broken', 'landed', 'hit', 'missed')
 * or null.
 * @param {any} f @param {{ feet: number[]|null, onMe?: () => boolean, strike: (spell: any) => void, say?: (ev: any) => void, sfx?: (element: number, at: number[]) => void, foes?: () => any[], rolls?: () => number }} ctx
 */
export function revenantArtFrame(f, ctx) {
  const now = tacticsNow();
  const e = f?.entity, rev = e?.revenant;
  const s = f?._art ?? null;
  if (s) stepTimers(f, s, now);
  if (!mayArt(f) || !tacticsSwitchOn() || !ctx?.feet) { if (s?.live) endLive(s, now, true); return null; }
  const art = drawArt(rev.id, f.mobileType ?? e.mobileType);
  if (!art) return null;
  const st = stateOf(f, art);
  const rolls = ctx.rolls ?? Math.random;
  const feet = ctx.feet, at = f.ai?.feet;
  if (!at) return null;
  if (st.live) return liveStep(f, st, now, ctx, feet);
  const engaged = !!f.ai?.detected && !!f.ai?.inSight && (ctx.onMe?.() ?? true);
  if (!engaged) return null;
  if (st.ready == null) st.ready = now + U(ART_LAW.FIRST[0], ART_LAW.FIRST[1], rolls);
  if (windupNear(feet, now)) return null;   // one wind-up near me at a time - its own brain's too
  const d = flat(at, feet), hp = e.health / Math.max(1, e.maxHealth || 1);
  const yaw = yawTo(at, feet);
  if (art === 'mending' && !st.used.mending && hp < ART_LAW.MEND.AT) return channel(f, st, now, ART_LAW.MEND.CHANNEL, ctx);
  if (art === 'warding' && !st.used.warding && hp < ART_LAW.WARD.AT) return channel(f, st, now, ART_LAW.WARD.CHANNEL, ctx);
  if (art === 'warcry' && !st.used.warcry && d <= ART_LAW.CRY.REACH) return channel(f, st, now, ART_LAW.CRY.CHANNEL, ctx);
  if (now < st.ready) return null;
  if (art === 'siphon' && d <= ART_LAW.SIPHON.REACH) return thrown(f, st, now, [{ kind: 'charge', origin: at, yaw, windup: ART_LAW.SIPHON.WINDUP, at: now }], ctx);
  if (art === 'nova' && d <= ART_LAW.NOVA.REACH + 1) return thrown(f, st, now, [{ kind: 'ring', origin: at, yaw, windup: ART_LAW.NOVA.WINDUP, at: now }], ctx);
  if (art === 'barrage' && d <= ART_LAW.BARRAGE.REACH) {
    const marks = [];
    for (let i = 0; i < ART_LAW.BARRAGE.COUNT; i++) marks.push({ kind: 'pyre', aimed: true, windup: ART_LAW.BARRAGE.WINDUP, at: now + i * ART_LAW.BARRAGE.STEP });
    return thrown(f, st, now, marks, ctx);
  }
  return null;
}
/** A channel begun: its colour's disc about its own feet, for `seconds`; any blow that lands breaks it. */
function channel(f, st, now, seconds, ctx) {
  const b = makeBlow('pyre', f.ai.feet, f.ai.yaw ?? 0, now, ART_COLORS[st.art], 'poise', seconds);
  /** @type {any} */ (b).ahead = 0;
  /** @type {any} */ (b).art = st.art;
  const key = keyFor(now);
  setLiveBlow(key, b);
  st.live = { channel: true, hp: f.entity.health, land: b.land, marks: [{ key, blow: b, landed: false, at: now }] };
  st.used[st.art] = true;
  call(f, st, ctx, 'start');
  ctx.sfx?.(4, f.ai.feet);
  return 'start';
}
/** A thrown art begun: its marks, each made at its own `at` (a barrage's later ones re-aimed at my feet then). */
function thrown(f, st, now, marks, ctx) {
  st.live = { channel: false, marks: marks.map((m) => ({ ...m, key: null, blow: null, landed: false })) };
  st.ready = now + U(ART_LAW.COOLDOWN[0], ART_LAW.COOLDOWN[1], ctx.rolls ?? Math.random);
  liveStep(f, st, now, ctx, ctx.feet);
  call(f, st, ctx, 'start');
  ctx.sfx?.(element(f, st.art), f.ai.feet);
  return 'start';
}
/** The element a thrown art blasts in: a siphon's magic, the rest its kind's (the pyre's). */
const element = (f, art) => (art === 'siphon' ? 4 : pyreElement(f.mobileType ?? f.entity?.mobileType));
/** Its art called out - the first one a stand (its card); a broken channel each time. */
function call(f, st, ctx, what) {
  const r = revenantById(f.entity?.revenant?.id);
  if (!r || !ctx.say) return;
  const n = ART_NAMES[st.art];
  if (what === 'start') {
    if (st.called) return;
    st.called = true;
    const body = ART_CHANNELS.includes(st.art) ? t('rvn.art.call.channel', 'Strike it to break the spell!') : st.art === 'siphon' ? t('rvn.art.call.siphon', 'Step out of its line!') : st.art === 'nova' ? t('rvn.art.call.nova', 'Step away from it!') : t('rvn.art.call.barrage', 'Keep moving!');
    ctx.say(revenantEvent('art', r, { body, line: t('rvn.art.call.line', '{given} calls on its {n}! {body}', { given: r.given, n, body }) }));
  } else if (what === 'broken') ctx.say(revenantEvent('art', r, { body: t('rvn.art.broken.body', 'Its {n} is broken.', { n }), line: t('rvn.art.broken.line', '{given}\'s {n} is broken!', { given: r.given, n }) }));
}
/** A live art's frame: its marks kept fresh, made and landed; a channel broken by a blow. */
function liveStep(f, st, now, ctx, feet) {
  const L = st.live;
  let out = null;
  for (const m of L.marks) {
    if (!m.blow && now >= m.at) {
      const origin = f.ai.feet, yaw = yawTo(origin, feet);
      const b = makeBlow(m.kind, origin, yaw, now, ART_COLORS[st.art], 'poise', m.windup);
      if (m.aimed) /** @type {any} */ (b).ahead = Math.min(BLOW.pyre.range, flat(origin, feet));
      /** @type {any} */ (b).art = st.art;
      m.blow = b; m.key = keyFor(now);
      setLiveBlow(m.key, b);
    }
    if (m.key) m.key._tac.seen = now;
  }
  if (L.channel) {
    if (f.entity.health < L.hp - 1e-6) {   // struck: broken - its disc shatters
      for (const m of L.marks) if (m.key) shatterBlow(m.key, now);
      st.live = null;
      call(f, st, ctx, 'broken');
      return 'broken';
    }
    const m = L.marks[0];
    if (!m.landed && now >= m.blow.land) { m.landed = true; resolveChannel(f, st, now, ctx); out = 'landed'; }
  } else {
    for (const m of L.marks) {
      if (!m.blow || m.landed || now < m.blow.land) continue;
      m.landed = true;
      const hit = inBlow(m.blow, feet[0], feet[2]);
      out = hit ? 'hit' : (out ?? 'missed');
      if (hit) landOnMe(f, st, ctx);
    }
  }
  if (L.marks.every((m) => m.landed) && L.marks.every((m) => now >= m.blow.land + 0.3)) endLive(st, now, false);
  return out;
}
/** A thrown art's blast on me: through the host's door (my save answers it); a siphon drinks what it drew. */
function landOnMe(f, st, ctx) {
  const e = f.entity, lvl = e.level ?? 1;
  const mult = st.art === 'siphon' ? ART_LAW.SIPHON.MULT : st.art === 'barrage' ? ART_LAW.BARRAGE.MULT : ART_LAW.NOVA.MULT;
  ctx.strike(pyreSpell(ART_NAMES[st.art], element(f, st.art), /** @type {any} */ (mult)));   // pyreSpell's `mult` reads as the signature's literal
  if (st.art === 'siphon') e.health = Math.min(e.maxHealth || e.health, e.health + Math.round(artMagnitude(lvl, ART_LAW.SIPHON.MULT)));
}
/** A channel whole: its heal, its ward or its cry. */
function resolveChannel(f, st, now, ctx) {
  const e = f.entity, rev = e.revenant;
  if (st.art === 'mending') e.health = Math.min(e.maxHealth || e.health, e.health + Math.round((e.maxHealth || 0) * ART_LAW.MEND.HEAL));
  else if (st.art === 'warding' && rev?.edge && !st.wardWas) {
    st.wardWas = rev.edge;
    rev.edge = wardEdge(rev.edge);
    st.wardUntil = now + ART_LAW.WARD.SECONDS;
  } else if (st.art === 'warcry' && st.cryUntil === 0) {
    st.cryBand = [f, ...(ctx.foes?.() ?? []).filter((x) => x !== f && !x.dead && x.retinueOf === rev?.id && x.entity)];
    for (const x of st.cryBand) x.entity.damageScale = (Number.isFinite(x.entity.damageScale) && x.entity.damageScale > 0 ? x.entity.damageScale : 1) * ART_LAW.CRY.BLOWS;
    st.cryUntil = now + ART_LAW.CRY.SECONDS;
  }
}
/** Its ward's edge: every blow class at WARD.TAKEN or its adaptation's own less - never its weakness. */
export function wardEdge(edge) {
  /** @type {Record<string, number>} */
  const taken = { ...(edge?.taken ?? {}) };
  for (const cls of WARD_CLASSES) if (cls !== edge?.weak) taken[cls] = Math.min(taken[cls] ?? 1, ART_LAW.WARD.TAKEN);
  return Object.freeze({ ...(edge ?? {}), taken: Object.freeze(taken) });
}
/** Its ward and its cry run out. */
function stepTimers(f, s, now) {
  const rev = f?.entity?.revenant;
  if (s.wardWas && (now >= s.wardUntil || !rev)) { if (rev) rev.edge = s.wardWas; s.wardWas = null; }
  if (s.cryUntil > 0 && now >= s.cryUntil) {
    for (const x of s.cryBand) if (x.entity && Number.isFinite(x.entity.damageScale)) x.entity.damageScale /= ART_LAW.CRY.BLOWS;
    s.cryBand = []; s.cryUntil = -1;   // spent: once a fight
  }
}
/** A live art ended - its marks out of the registry (`cut`: a foe that may throw nothing now - its marks go at once). */
function endLive(st, now, cut) {
  if (!st.live) return;
  for (const m of st.live.marks) if (m.key) { if (cut && m.blow && now < m.blow.land) shatterBlow(m.key, now); else setLiveBlow(m.key, null); }
  st.live = null;
}

// ── the sworn half ──────────────────────────────────────────────────
/** A sworn one's art's own clock and fight, by its id. */
const _sworn = new Map();
const swornState = (id) => { let s = _sworn.get(id); if (!s) { s = { ready: 0, fighting: false, mendReady: 0 }; _sworn.set(id, s); } return s; };
/** A Shield (Alteration's, 35/255: its magnitude the pool) for `rounds` magic rounds - one more, as Eventide's. */
export const shieldBundle = (points, rounds) => ({
  name: ART_NAMES.warding, rangeType: 0, element: 4, icon: 0,
  effects: [{ type: 35, subType: 255, durationBase: rounds + 1, durationMod: 0, durationPerLevel: 1, chanceBase: 0, chanceMod: 0, chancePerLevel: 1,
    magnitudeBaseLow: points, magnitudeBaseHigh: points, magnitudeLevelBase: 0, magnitudeLevelHigh: 0, magnitudePerLevel: 1 }],
});
/** Fortify Strength (9/0) by `points` for `rounds` magic rounds - one more. */
export const mightBundle = (points, rounds) => ({
  name: ART_NAMES.warcry, rangeType: 0, element: 4, icon: 0,
  effects: [{ type: 9, subType: 0, durationBase: rounds + 1, durationMod: 0, durationPerLevel: 1, chanceBase: 0, chanceMod: 0, chancePerLevel: 1,
    magnitudeBaseLow: points, magnitudeBaseHigh: points, magnitudeLevelBase: 0, magnitudeLevelHigh: 0, magnitudePerLevel: 1 }],
});
/** A round's worth of seconds - the rounds a sworn gift lasts are ROUND_SECONDS each (the card's 30 s). */
export const SWORN_GIFT_SECONDS = ART_LAW.SWORN_WARD.ROUNDS * ROUND_SECONDS;

/**
 * A SWORN ONE'S ART_LAW, a frame of it on its body (`rec` - the companion layer's; systems/revenant/revenantCompanions.js
 * swornFightStep, every frame): as it goes into a fight, its Ward or its War Cry on me; in a fight, its Siphon, Barrage or
 * Nova on its foe - through the scene's door (systems/playerDoor.js: my harm, a foe MY harm may reach). Mending answers a
 * hurt (swornMendStep). Answers what it did, or null.
 * @param {any} rec @param {any} r @param {any} door @param {{ rolls?: () => number, say?: (line: string) => void }} [o]
 */
export function swornArtStep(rec, r, door, { rolls = Math.random, say = null } = {}) {
  const art = artOf(r);
  if (!art || !r?.sworn || !door || !rec?.entity || rec.dead || rec._knockedOut || !(rec.entity.health > 0)) return null;
  const now = tacticsNow(), s = swornState(r.id);
  const t = rec.ai?.target;
  const tgt = t?.entity && !t.dead && t.entity.health > 0 ? t : null;
  const began = !!tgt && !s.fighting;
  s.fighting = !!tgt;
  const rank = Math.max(1, Math.min(5, r.rank | 0));
  if (art === 'warding' || art === 'warcry') {
    if (!began || now < s.ready) return null;
    const W = art === 'warding' ? ART_LAW.SWORN_WARD : ART_LAW.SWORN_CRY;
    const points = W.BASE + W.PER_RANK * rank;
    door.castOnPlayer?.(art === 'warding' ? shieldBundle(points, W.ROUNDS) : mightBundle(points, W.ROUNDS));
    s.ready = now + W.COOLDOWN;
    say?.(art === 'warding' ? t('rvn.art.sworn.wards', '{given} wards you.', { given: r.given }) : t('rvn.art.sworn.roars', '{given} roars - your arm grows stronger.', { given: r.given }));
    return art;
  }
  if (art === 'mending' || !tgt) return null;
  if (began && s.ready < now) s.ready = now + U(ART_LAW.FIRST[0], ART_LAW.FIRST[1], rolls);
  if (now < s.ready) return null;
  const mine = new Set(door.foes?.() ?? []);
  const lvl = door.player?.()?.level ?? 1, S = ART_LAW.SWORN_STRIKE;
  if (art === 'nova') {
    const at = rec.ai?.feet;
    const near = at ? [...mine].filter((x) => x?.ai?.feet && flat(x.ai.feet, at) <= S.NOVA_REACH) : [];
    if (!near.length) return null;
    for (const x of near) door.hurtFoe?.(x, Math.round(artMagnitude(lvl, S.NOVA)));
  } else {
    if (!mine.has(tgt)) return null;   // a foe MY harm may not reach (the town's defenders) - its art waits
    const n = Math.round(artMagnitude(lvl, art === 'siphon' ? S.SIPHON : S.BARRAGE));
    door.hurtFoe?.(tgt, n);
    if (art === 'siphon') { const me = door.player?.(); if (me) healMine(me, n * S.SIPHON_HEAL); }
  }
  s.ready = now + U(S.COOLDOWN[0], S.COOLDOWN[1], rolls);
  return art;
}
/**
 * A SWORN ONE'S MENDING: a hurt that leaves me (`entity`, alive) under SWORN_MEND.AT of my health - the first sworn one at
 * my side whose art is Mending, whose body stands here (`standing(id)`) and whose own clock allows, heals me. `sworn` the
 * sworn at my side. Answers the record that mended, or null.
 */
export function swornMendStep(entity, after, sworn, standing, { say = null } = {}) {
  if (!entity?.isPlayer || entity.peer || !(after > 0) || after >= (entity.maxHealth || 1) * ART_LAW.SWORN_MEND.AT) return null;
  const now = tacticsNow();
  for (const r of sworn ?? []) {
    if (artOf(r) !== 'mending' || !standing?.(r.id)) continue;
    const s = swornState(r.id);
    if (now < s.mendReady) continue;
    const rank = Math.max(1, Math.min(5, r.rank | 0));
    healMine(entity, (entity.maxHealth || 0) * (ART_LAW.SWORN_MEND.SHARE + ART_LAW.SWORN_MEND.PER_RANK * rank));
    s.mendReady = now + ART_LAW.SWORN_MEND.COOLDOWN;
    say?.(t('rvn.art.sworn.mends', '{given} mends your wounds.', { given: r.given }));
    return r;
  }
  return null;
}
/** A sworn one's art clock forgotten (a load, a release) - or every one's. */
export function forgetSwornArt(id = null) { if (id == null) _sworn.clear(); else _sworn.delete(id); }
/** Tests only. */
export function _resetArtsForTests() { _sworn.clear(); }
