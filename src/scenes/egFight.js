// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 8, 12, 13 and 25): AN ELITE
// BREACH'S FIGHTS ON THIS SCREEN - the hall's fight as the relay says it (net/egLink.js - the gate's own state, its frame
// the hall's own): the champion or the lord where it stands, its body (the Warden's sprite at its own size), its blow's
// telegraph and the verdict on MY OWN FEET at its landing (co-op's law - net/gateStrike.js strikeVerdict), its bar; the
// legion through the gate's own driver about the hall's centre (scenes/gateHost.js); a Rift-Yard's rifts as the
// Reckoning's crystals (render/courtCrystals.js), struck as they are; a Rampart's vents, told 1.0 s and erupting on the
// relay's clock from the hall's wake (net/egLaw.js egVentAt), judged on my feet. Nothing is sent but my blows (`hit` on
// the foe, `ahit` on one of the legion, `xhit` on a rift - the relay's caps decide what lands).
//
// THE GATE'S PIECES, READ UNCHANGED: every shape, verdict, pose and bar is the gate's (world/gateBoss.js,
// render/gateTelegraph.js, ui/gateBossBar.js); what is the Spire's is the hall it stands in, the vents and the rifts' words.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { HIT_KINDS, BASE_PROFILE, CRYSTAL_R, CRYSTAL_H, ATTACK_BY_ID } from '../net/gateBrain.js';
import { strikeVerdict, blowOf, strikeDamage, savedShare } from '../net/gateStrike.js';
import { bossAct, bossFrame, bossPlace, bossHop, bossStandIn, crystalStandIn, crystalColor, gateHitFlash, BOSS_LOOKS, bossCue, BOSS_CUES } from '../world/gateBoss.js';
import { GateTelegraphRenderer, telegraphShape, TELEGRAPH_KIND, TELEGRAPH_STYLE, TELEGRAPH_EDGE, TELEGRAPH_POOL } from '../render/gateTelegraph.js';
import { CourtCrystalRenderer } from '../render/courtCrystals.js';
import { bossBarModel, drawGateBossBar } from '../ui/gateBossBar.js';
import { titleCardModel, drawGateTitleCard, TITLE_HOLD_MS } from '../ui/gateTitleCard.js';
import { setBatchHitFlash } from '../systems/hitFlash.js';
import { ENEMY_BASICS } from '../characters/enemyBasics.js';
import { mobileBillboardSize } from '../world/rmbFlats.js';
import { createGateHost } from './gateHost.js';
import { egHallOf, egVentAt, egInVent, EG_VENT_PCT, EG_VENT_WARN_MS, EG_VENT_FIRE_MS } from '../net/egLaw.js';
import { egHallCentre } from '../world/egHall.js';
import { EG_FOE_NAMES } from '../net/egBrain.js';

/** The champion's body: the Warden's look at 2.5 scale (section 8.5 - Ruhn's 3 is his own). */
export const EG_FOE_LOOK = Object.freeze({ mobile: BOSS_LOOKS.ruhn.mobile, scale: 2.5 });
/** The vents' colour, and the lane's danger style. */
const VENT_COLOR = Object.freeze([1.0, 0.42, 0.1]);
const RIFT_LIGHT_RANGE = 7;
/** The foe's card and its title (its epithet) - the champion's, the Court's. */
const FOE_CARD = Object.freeze({ champion: { name: EG_FOE_NAMES.champion, title: 'The Proving Walk' }, lord: { name: EG_FOE_NAMES.lord, title: 'The Court of the Galleries' } });

/** A shape slot of the telegraph pass's own shape (render/gateTelegraph.js), refilled. */
const slot = () => ({ kind: 0, origin: [0, 0], yaw: 0, r: 0, halfArc: 0, body: 0, end: [0, 0], halfW: 0, r0: 0, r1: 0, points: [], n: 0,
  t: 0, flash: 0, alpha: 0, color: VENT_COLOR, edge: TELEGRAPH_EDGE, court: 0, style: TELEGRAPH_STYLE.fire ?? 0, since: 0, span: 1, after: -1, runS: 0, pool: TELEGRAPH_POOL.blow });

/**
 * @param {{ renderer?: any, gl?: any, getTexture?: any, uploadRecordFrame?: any, audio?: any, link: any, now: () => number,
 *   cam?: () => number[]|null, feet?: () => number[]|null, player?: () => any, save?: (e: any, el: string) => number,
 *   strike?: (dmg: number, o: { fire?: boolean, el?: string|null, name?: string }) => void, say?: (t: string) => void,
 *   hudHidden?: () => boolean, sendHit?: (f: any) => boolean, sendAHit?: (f: any) => boolean, sendXHit?: (f: any) => boolean }} deps
 */
export function createEgFight({ renderer = null, gl = null, getTexture = null, uploadRecordFrame = null, audio = null, link, now, cam = () => null, feet = () => null, player = () => null,
  save = () => 100, strike = () => {}, say = () => {}, hudHidden = () => false, sendHit = () => false, sendAHit = () => false, sendXHit = () => false }) {
  const P = BASE_PROFILE;
  let hall = 0, spec = null, centre = null, host = null, floor = null;
  let body = null, loading = null, batch = null, batchShown = false, hurtAt = -Infinity, standIn = null, prevT = -Infinity;
  let judgedI = -1, cuedI = -1, landedI = -1, beat = null, wokeSeen = -1, fellSeen = -1;
  let blowSeq = 0;
  const blowMet = new Set();
  /** AUDIT WB11 W3's law: a blow is one sequence over every body it meets in a frame. */
  function blowQ(who) {
    if (!blowMet.size || blowMet.has(who)) { blowSeq++; blowMet.clear(); }
    blowMet.add(who);
    return blowSeq;
  }
  let pass = null, passTried = false, crystalPass = null, crystalTried = false;
  /** the rifts: the draw slots and the targets my blows meet; the vents' shapes and the eruptions judged */
  const _crystals = [], _riftTargets = [], _riftIns = [], _riftLights = [], _shapes = [], _batches = [], _lights = [], _ventSlots = [];
  const ventJudged = new Map();
  let shape = null, riftFlash = [];

  const play3 = (cue, at) => { if (!cue || !audio || !at) return; try { if (cue.id != null) audio.play3dId?.(cue.id, at, cue.volume, { maxDistance: cue.reach, distanceModel: 'linear', pitch: cue.pitch }); else audio.play3d?.(cue.clip, at, cue.volume, { maxDistance: cue.reach, distanceModel: 'linear', pitch: cue.pitch }); } catch { /* a sound is never the fight */ } };
  const toDungeon = (x, y, z) => [centre[0] + x, centre[1] + y, centre[2] + z];

  /** A new hall: its frame, its floor for the telegraph pass, the legion's driver about its centre. */
  function reset(E) {
    host?.leave();
    hall = E.h; spec = egHallOf(E.seed, E.h); centre = egHallCentre(spec);
    floor = spec.fight ? { r: spec.fight.r + 3, courts: [[spec.fight.x, spec.fight.z]] } : { r: 10, courts: [[0, 0]] };
    host = createGateHost({ renderer, getTexture, uploadRecordFrame, audio, cam, feet, player, say, centre,
      land: (blow) => landShare(blow.pct, blow.base, blow.el, blow.name), send: (h) => sendAHit(h), blowQ: (who) => blowQ(who) });
    judgedI = -1; cuedI = -1; landedI = -1; beat = null; wokeSeen = -1; fellSeen = -1; ventJudged.clear(); riftFlash = []; standIn = null; prevT = -Infinity;
    if (batch) { renderer?.destroyBillboardBatch?.(batch); batch = null; }
  }
  /** A blow on me landed - its share of my health and its base, through my saving throw against its element. */
  function landShare(pct, base, el, name) {
    const e = player();
    if (!e || !(e.health > 0)) return;
    const raw = strikeDamage(pct, e.maxHealth, base), dmg = el ? savedShare(raw, save(e, el)) : raw;
    if (dmg > 0) strike(dmg, { fire: el === 'fire', el, name });
  }
  function loadBody() {
    if (body || loading || !getTexture || !uploadRecordFrame || !renderer?.createBillboardBatch) return;
    const archive = ENEMY_BASICS[EG_FOE_LOOK.mobile]?.maleTexture;
    if (!archive) return;
    loading = Promise.resolve().then(() => getTexture(archive)).then((tex) => { body = tex ? { tex, archive } : { failed: true }; }, () => { body = { failed: true }; });
  }
  /** The foe's body where the relay says it stands, at the frame its act shows to my eye. */
  function drawBody(s, t) {
    loadBody();
    const act = bossAct(s, t, hurtAt);
    if (!body?.tex || act.act === 'gone') { batchShown = false; return; }
    const [x, z] = bossPlace(s, t), at = toDungeon(x, bossHop(s, t) - (act.sink ?? 0), z), eye = cam() ?? at;
    const fr = bossFrame(act, s.yaw, at, eye, (rec) => body.tex.getFrameCount?.(rec) ?? 1);
    const rkey = `${fr.record}#${fr.frame}`;
    if (!renderer.textures?.has?.(`${body.archive}_${rkey}`)) uploadRecordFrame(body.archive, fr.record, fr.frame);
    const sz = mobileBillboardSize(body.tex, fr.record), w = sz.w * EG_FOE_LOOK.scale, h = sz.h * EG_FOE_LOOK.scale;
    if (!batch) { batch = renderer.createBillboardBatch(body.archive, rkey, { w, h }, [[0, 0, 0]]); batch.origin = [0, 0, 0]; }
    batchShown = true;
    setBatchHitFlash(batch, s.fell ? 0 : gateHitFlash(hurtAt, -Infinity, t));
    batch.record = rkey; batch.size = { w: fr.flip ? -w : w, h };
    if (batch.bounds) batch.bounds[3] = Math.hypot(w, h) * 0.5;
    batch.origin[0] = at[0]; batch.origin[1] = at[1]; batch.origin[2] = at[2];
  }
  /** The foe's blow: cued at its word and its landing, judged on my feet at its landing (the gate's verdict). */
  function judge(s, t) {
    const atk = s.atk, f = feet(), e = player();
    if (atk && atk.i !== cuedI) { cuedI = atk.i; const A = ATTACK_BY_ID[atk.a]; if (A && t < atk.at) play3(bossCue('windup', A, P), toDungeon(atk.x, 2, atk.z)); }
    if (atk && atk.i !== landedI && t >= atk.at) { landedI = atk.i; play3(BOSS_CUES.quake, toDungeon(atk.x, 1, atk.z)); }
    if (!atk || atk.i === judgedI || !f || !e || !(e.health > 0)) return;
    const v = strikeVerdict(atk, f[0] - centre[0], f[2] - centre[2], t, prevT, P);
    if (v === 'wait') return;
    judgedI = atk.i;
    if (v === 'hit') { const b = blowOf(atk, P); if (b) landShare(b.pct, b.base, b.saved ? b.el : null, b.name); }
  }
  /** A Rift-Yard's rifts: the Reckoning's crystals' slots - standing, cracking, flashing as I strike, flying apart once
   *  broken - and the targets my blows meet. */
  function rifts(s, t) {
    _crystals.length = 0; _riftTargets.length = 0; _riftLights.length = 0;
    const X = s.cx;
    if (!X || !X.c?.length) return;
    const color = crystalColor(P);
    X.c.forEach((q, k) => {
      const broke = X.broke?.find((e) => e.c === k) ?? null, standing = q[2] > 0;
      const at = toDungeon(q[0], 0, q[1]);
      const d = (_crystals[k] ??= { at: null, yaw: 0, seed: 0, grow: 1, broke: -1, hp: 1, flash: 0, color, beam: null });
      d.at = at; d.seed = ((k * 7919) % 997) / 997; d.yaw = d.seed * Math.PI * 2; d.grow = 1;
      d.broke = standing ? -1 : broke ? Math.max(0, (t - broke.at) / 1000) : Infinity;
      d.hp = X.m > 0 ? Math.max(0, q[2] / X.m) : 0; d.flash = Math.max(0, 1 - (t - (riftFlash[k] ?? -Infinity)) / 180); d.color = color;
      if (d.broke === Infinity) return;
      _crystals.push(d);
      if (!standing) return;
      _riftTargets.push({ c: k, feet: at, height: CRYSTAL_H, radius: CRYSTAL_R, entity: (_riftIns[k] ??= crystalStandIn(EG_FOE_LOOK, k)) });
      const L = (_riftLights[k] ??= { x: 0, y: 0, z: 0, range: RIFT_LIGHT_RANGE, color: [0, 0, 0] }), kk = 0.9 + 0.3 * Math.sin(t / 240 + d.seed * 6);
      L.x = at[0]; L.y = at[1] + 2; L.z = at[2]; L.color[0] = color[0] * kk; L.color[1] = color[1] * kk; L.color[2] = color[2] * kk;
    });
  }
  /** A Rampart's vents (section 8.3): each lane told EG_VENT_WARN_MS before it erupts, erupting EG_VENT_FIRE_MS, on the
   *  relay's clock from the hall's wake; an eruption judged on my feet once. */
  function vents(E, t) {
    _ventSlots.length = 0;
    if (!spec?.vents?.length || E.sg !== 'trial' || !(E.hw > 0)) return;
    const f = feet(), e = player();
    for (let i = 0; i < spec.vents.length; i++) {
      const v = spec.vents[i], st = egVentAt(v, E.hw, t);
      if (st.st === 'quiet') continue;
      const sh = (_shapes[i] ??= slot());
      sh.kind = TELEGRAPH_KIND.lane; sh.origin[0] = v.x - v.halfW; sh.origin[1] = v.z; sh.end[0] = v.x + v.halfW; sh.end[1] = v.z; sh.halfW = v.d / 2; sh.r = 0;
      sh.t = st.st === 'warn' ? st.k : 1; sh.flash = st.st === 'fire' ? 1 : 0; sh.alpha = 1; sh.since = st.st === 'warn' ? (st.k * EG_VENT_WARN_MS) / 1000 : EG_VENT_WARN_MS / 1000;
      sh.span = EG_VENT_WARN_MS / 1000; sh.after = st.st === 'fire' ? (st.k * EG_VENT_FIRE_MS) / 1000 : -1;
      _ventSlots.push(sh);
      if (st.st === 'fire' && ventJudged.get(i) !== st.at) {
        ventJudged.set(i, st.at);
        play3(BOSS_CUES.quake, toDungeon(v.x, 1, v.z));
        if (f && e && e.health > 0 && egInVent(v, f[0] - centre[0], f[2] - centre[2])) landShare(EG_VENT_PCT, 0, 'fire', 'Fire Vent');
      }
    }
  }

  return {
    /** One frame of the hall's fight. */
    frame() {
      blowMet.clear();
      const E = link.state(), t = now();
      if (!E.b || !(E.h > 0) || E.end) { if (hall) this.leave(); return; }
      if (E.h !== hall) reset(E);
      const s = E.fight.day === E.h ? E.fight : null;
      _batches.length = 0; _lights.length = 0;
      const foe = !!s && s.max > 0;
      if (foe) {
        const kind = spec.kind === 'court' ? 'lord' : 'champion';
        if (s.atk && !s.fell) judge(s, t);
        drawBody(s, t);
        if (batch && batchShown) _batches.push(batch);
        shape = s.fell ? null : telegraphShape(s.atk, 1, t, P);
        if (wokeSeen !== E.h && s.hp > 0 && (spec.kind !== 'court' || s.atk || s.move)) { wokeSeen = E.h; beat = { kind: 'wake', at: t, until: t + TITLE_HOLD_MS, kicker: FOE_CARD[kind].title, main: FOE_CARD[kind].name, sub: '' }; play3(BOSS_CUES.roar, toDungeon(s.x, 3, s.z)); }
        if (s.fell && fellSeen !== E.h) { fellSeen = E.h; beat = { kind: 'fall', at: t, until: t + TITLE_HOLD_MS, kicker: FOE_CARD[kind].name, main: 'FELLED', sub: '' }; }
        drawGateBossBar(s.fell ? null : bossBarModel(s, t, FOE_CARD[kind]), { hidden: hudHidden() });
      } else { shape = null; drawGateBossBar(null); }
      drawGateTitleCard(titleCardModel(beat, t), { hidden: hudHidden() });
      host.frame(s ?? { day: null }, t, P, foe ? (spec.kind === 'court' ? EG_FOE_NAMES.lord : EG_FOE_NAMES.champion) : 'the Spire');
      for (const b of host.batches()) _batches.push(b);
      if (s) rifts(s, t); else { _crystals.length = 0; _riftTargets.length = 0; _riftLights.length = 0; }
      vents(E, t);
      for (const l of host.lights()) _lights.push(l);
      for (const l of _riftLights) if (l) _lights.push(l);
      prevT = t;
    },
    /** The foe as a body my blows meet, or null. */
    target() {
      const E = link.state(), s = E.fight, t = now();
      if (!spec || s.day !== E.h || !(s.max > 0) || s.fell || E.sg !== 'trial' || bossAct(s, t).act === 'gone') return null;
      standIn ??= bossStandIn(EG_FOE_LOOK, spec.kind === 'court' ? EG_FOE_NAMES.lord : EG_FOE_NAMES.champion);
      const [x, z] = bossPlace(s, t);
      return { feet: toDungeon(x, 0, z), yaw: s.yaw, height: P.bossH * (EG_FOE_LOOK.scale / 3), radius: P.bossR, warded: false, entity: standIn, mobile: EG_FOE_LOOK.mobile };
    },
    /** A blow of mine met the foe: out as the wire's `hit`; it flinches. */
    hit({ d, r }) {
      const E = link.state(), s = E.fight;
      if (!spec || s.day !== E.h || s.fell || !(s.max > 0) || !Object.values(HIT_KINDS).includes(r)) return false;
      const dmg = Math.round(d);
      if (!(dmg >= 1)) return false;
      hurtAt = now();
      return !!sendHit({ q: blowQ('b'), d: dmg, r });
    },
    /** The legion as bodies my blows meet, and a blow of mine on one of them. */
    hostTargets: () => host?.targets() ?? [],
    hostHit: (h) => !!host && host.hit(h, now()),
    /** The rifts as bodies my blows meet, and a blow of mine on one. */
    riftTargets: () => _riftTargets,
    riftHit({ c, d, r } = /** @type {any} */ ({})) {
      const dmg = Math.round(d);
      if (!Number.isInteger(c) || !(dmg >= 1) || !Object.values(HIT_KINDS).includes(r) || !_riftTargets.some((q) => q.c === c)) return false;
      riftFlash[c] = now();
      return !!sendXHit({ c, q: blowQ(`x${c}`), d: dmg, r });
    },
    batches: () => _batches,
    lights: () => _lights,
    /** The telegraphs and the rifts, in the host's world pass. Answers whether anything drew. */
    drawPass(proj, view, eye, seconds, fog = null) {
      if (!centre) return false;
      let drew = false;
      if (_crystals.length) {
        if (!crystalTried && gl) { crystalTried = true; try { crystalPass = new CourtCrystalRenderer(gl); } catch (e) { console.warn('[eg] the rifts would not build', e?.message ?? e); crystalPass = null; } }
        if (crystalPass) { crystalPass.draw(_crystals, proj, view, eye, seconds, fog); drew = drew || crystalPass.drawn > 0; }
      }
      if (!passTried && gl) { passTried = true; try { pass = new GateTelegraphRenderer(gl); } catch (e) { console.warn('[eg] the telegraphs would not build', e?.message ?? e); pass = null; } }
      if (!pass) return drew;
      if (shape) { pass.draw(shape, proj, view, eye, seconds, fog, centre, null, floor); drew = true; }
      for (const hs of host?.shapes() ?? []) { pass.draw(hs, proj, view, eye, seconds, fog, centre, null, floor); drew = true; }
      for (const vs of _ventSlots) { pass.draw(vs, proj, view, eye, seconds, fog, centre, null, floor); drew = true; }
      return drew;
    },
    /** What the driver holds (tests, stats). */
    state: () => ({ hall, judgedI, rifts: _crystals.length, riftTargets: _riftTargets.length, vents: _ventSlots.length, host: host?.state() ?? null, shape: !!shape }),
    /** Out of the breach: everything put away. */
    leave() {
      host?.leave(); host = null;
      if (batch) { renderer?.destroyBillboardBatch?.(batch); batch = null; }
      drawGateBossBar(null); drawGateTitleCard(null);
      hall = 0; spec = null; centre = null; shape = null; beat = null;
      _crystals.length = 0; _riftTargets.length = 0; _shapes.length = 0; _ventSlots.length = 0; _batches.length = 0; _lights.length = 0;
    },
  };
}
