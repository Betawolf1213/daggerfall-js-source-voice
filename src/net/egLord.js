// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 8.5, 8.6 and 13): THE
// CHAMPION'S KIT - one foe the relay runs in a hall: the Proving Walk's Kynreeve, and the Court's lord until the Galleries'
// lords are built (EG13). Its shapes are the Warden's own Cleave, Ground Slam and Charge (net/gateBrain.js ATTACKS -
// section 8.5), said in the gate's own words (`mv`, `atk`, `hp`, `fell`), so every screen telegraphs, judges and draws
// them with the gate's own pieces (render/gateTelegraph.js, net/gateStrike.js strikeVerdict, world/gateBoss.js) about the
// hall's centre. Its health is its seconds of the company's reference damage (net/gateBrain.js dpsRef - the gate's
// measure), its blows' hand and purse the gate's (spendBlow, spendPurse).
//
// What EG-PLAY leaves: the Kynreeve's Shield-Wall and the other ranks' signatures, the lords' own kits (Grath, the Last
// Spellmaster, the Last Armsmaster, the Valkynaz - EG13), THE WIND-UP FLOOR's lengthening and THE WIDTH RULE's wider
// Charge (the Warden's shapes are kept exactly, so the gate's verdicts read them unchanged).
//
// Pure: a foe and a beat in, frames out. Not a DFU member. Ledger A (ELITE-GATES).
import { ATTACKS, BOSS_R, BOSS_SPEED, MOVE_RESAY_M, MOVE_RESAY_MS, HIT_KINDS, MELEE_REACH, POSE_SLACK, HP_SEND_MS, REPEAT_MAX, atkFrame, spendBlow, spendPurse } from './gateBrain.js';
import { egKeepOnFight, egOnFight } from './egLaw.js';

/** The champion's and the Court lord's health: seconds of the company's reference damage (section 8.5's PROVE_HP_S, and
 *  the Court's), before the depth. */
export const EG_PROVE_HP_S = 40;
export const EG_COURT_HP_S = 150;
/** Its breath after a blow's recovery before it chooses again, and its first after it wakes (ms). */
export const EG_LORD_BREATH_MS = 700;
export const EG_LORD_WAKE_MS = 2500;
/** The kit: the attacks it chooses among (the Warden's phase-one three). */
export const EG_LORD_KIT = Object.freeze([ATTACKS.cleave, ATTACKS.slam, ATTACKS.charge]);
const r2 = (v) => Math.round(v * 100) / 100;
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

/**
 * A foe stood at (x, z) in its hall, facing the arrival (-z), with `hp` health: `kind` 'champion' or 'lord', `name` its
 * card's. Asleep (`up` false) until the hall wakes it (egLordWake).
 */
export function egLordNew(kind, name, x, z, hp, now) {
  const h = Math.max(1, Math.round(hp));
  return { kind, name, pos: [r2(x), r2(z)], yaw: Math.PI, move: null, atk: null, seq: 0, hp: h, max: h, up: false, nextAt: Infinity, lastA: -1, runA: 0,
    threat: {}, fell: null, lastHpSent: h, lastHpAt: 0, at: now };
}
/** The foe woken at `now`: it chooses its first blow EG_LORD_WAKE_MS later. */
export function egLordWake(L, now) { if (L.up || L.fell) return; L.up = true; L.nextAt = now + EG_LORD_WAKE_MS; }
/** Where its walk has taken it by `now`, kept to the floor. */
function carry(L, spec, now) {
  const m = L.move;
  if (!m) return;
  const len = dist(m.x, m.z, m.tx, m.tz);
  const along = len < 1e-6 ? 0 : Math.min(len, (Math.max(0, now - m.at) / 1000) * m.v);
  L.pos = egKeepOnFight(spec, len < 1e-6 ? m.tx : m.x + ((m.tx - m.x) / len) * along, len < 1e-6 ? m.tz : m.z + ((m.tz - m.z) / len) * along, BOSS_R);
}
function walkAt(L, spec, target, now, out) {
  const dx = target.x - L.pos[0], dz = target.z - L.pos[1], d = Math.hypot(dx, dz), go = Math.max(0, d - (BOSS_R + 1));
  const [tx, tz] = egKeepOnFight(spec, L.pos[0] + (d > 0 ? (dx / d) * go : 0), L.pos[1] + (d > 0 ? (dz / d) * go : 0), BOSS_R);
  const m = L.move;
  if (m && dist(m.tx, m.tz, tx, tz) < MOVE_RESAY_M && now - m.at < MOVE_RESAY_MS) return;
  L.move = { x: r2(L.pos[0]), z: r2(L.pos[1]), tx: r2(tx), tz: r2(tz), v: BOSS_SPEED, at: now };
  if (d > 0) L.yaw = Math.atan2(dx, dz);
  out.push({ k: 'mv', ...L.move });
}
function standStill(L, now, out) {
  if (!L.move) return;
  L.move = null;
  out.push({ k: 'mv', x: r2(L.pos[0]), z: r2(L.pos[1]), tx: r2(L.pos[0]), tz: r2(L.pos[1]), v: 0, at: now });
}
/** Whom it goes at: the living member it owes the most threat, else the nearest. */
function pick(L, here) {
  let best = null, t = 0;
  for (const b of here) { const v = L.threat[b.sub] ?? 0; if (v > t) { t = v; best = b; } }
  if (best) return best;
  for (const b of here) if (!best || dist(b.x, b.z, L.pos[0], L.pos[1]) < dist(best.x, best.z, L.pos[0], L.pos[1])) best = b;
  return best;
}
/** The blows it may begin at a target `gap` metres past its body with `near` members inside its slam - the last one it
 *  used left out when another is open, never a REPEAT_MAX+1th time running. */
export function egLordCan(gap, near, lastA, run) {
  const out = EG_LORD_KIT.filter((A) => gap <= A.range && (A.minGap <= 0 || gap >= A.minGap) && !(A === ATTACKS.slam && near < 1));
  const fresh = out.filter((A) => A.id !== lastA);
  return fresh.length ? fresh : run >= REPEAT_MAX ? [] : out;
}

/**
 * ONE BEAT of the foe on hall `spec`'s floor: a blow in flight runs out (a Charge carries it to its lane's end); its next
 * chosen at its breath's end - at the member it owes most, by weight (net/gateBrain.js chooseAttack's law) - or a walk
 * at them; its health said as it falls (`hp`). `here` the living members on the floor, the hall's own frame.
 * @param {any} L @param {any} spec @param {number} now @param {{sub: string, x: number, z: number}[]} here
 * @param {() => number} rng @param {any[]} out
 */
export function egLordStep(L, spec, now, here, rng, out) {
  if (L.fell || !L.up) return;
  if (Math.round(L.hp) !== L.lastHpSent && now - L.lastHpAt >= HP_SEND_MS) { L.lastHpSent = Math.round(L.hp); L.lastHpAt = now; out.push({ k: 'hp', h: L.lastHpSent, m: L.max }); }
  if (L.atk) {
    if (now < L.atk.until) return;
    if (L.atk.a === ATTACKS.charge.id && L.atk.tg[0]) L.pos = [L.atk.tg[0][0], L.atk.tg[0][1]];
    L.atk = null;
    L.nextAt = now + EG_LORD_BREATH_MS;
  }
  carry(L, spec, now);
  const target = pick(L, here);
  if (!target) { standStill(L, now, out); return; }
  if (now < L.nextAt) { if (dist(target.x, target.z, L.pos[0], L.pos[1]) > BOSS_R + 4) walkAt(L, spec, target, now, out); return; }
  const gap = dist(target.x, target.z, L.pos[0], L.pos[1]) - BOSS_R;
  const near = here.filter((b) => dist(b.x, b.z, L.pos[0], L.pos[1]) <= ATTACKS.slam.r).length;
  const can = egLordCan(gap, near, L.lastA, L.runA);
  if (!can.length) { walkAt(L, spec, target, now, out); return; }
  let x = rng() * can.reduce((s, A) => s + A.w, 0), A = can[can.length - 1];
  for (const c of can) { x -= c.w; if (x < 0) { A = c; break; } }
  L.move = null;
  L.yaw = Math.atan2(target.x - L.pos[0], target.z - L.pos[1]);
  const tg = A === ATTACKS.charge ? [egKeepOnFight(spec, L.pos[0] + Math.sin(L.yaw) * A.len, L.pos[1] + Math.cos(L.yaw) * A.len, BOSS_R).map(r2)] : [];
  const at = now + A.windup;
  L.atk = { i: ++L.seq, a: A.id, at, x: r2(L.pos[0]), z: r2(L.pos[1]), yw: r2(L.yaw), tg, until: at + A.active + A.recover };
  L.runA = A.id === L.lastA ? L.runA + 1 : 1;
  L.lastA = A.id;
  out.push({ k: 'atk', ...atkFrame(L.atk) });
}

/**
 * A BLOW ON THE FOE from member purse `p` standing at `pose` (the hall's frame): the gate's hand and purse, a melee blow
 * within MELEE_REACH of its body, from the fight floor; its threat on the striker. Answers the frames (its health, and
 * its fall - `fell`, by its best three, the gate's word) and what landed.
 */
export function egLordHit(L, spec, p, sub, d, r, pose, now, seq = null, top = () => []) {
  const out = [];
  if (!p || L.fell || !L.up || !Number.isFinite(d) || !(d > 0)) return { out, got: 0 };
  if (!spendBlow(p, now, seq, 'lord')) return { out, got: 0 };
  if (!pose || !Number.isFinite(pose.x) || !Number.isFinite(pose.z) || !egOnFight(spec, pose.x, pose.z, POSE_SLACK + 6)) return { out, got: 0 };
  if (r === HIT_KINDS.Melee && dist(pose.x, pose.z, L.pos[0], L.pos[1]) - BOSS_R > MELEE_REACH + POSE_SLACK) return { out, got: 0 };
  const got = spendPurse(p, d, L.hp, now);
  L.hp -= got;
  L.threat[sub] = (L.threat[sub] ?? 0) + got;
  if (L.hp > 1e-6) {
    if (now - L.lastHpAt >= HP_SEND_MS) { L.lastHpSent = Math.round(L.hp); L.lastHpAt = now; out.push({ k: 'hp', h: L.lastHpSent, m: L.max }); }
    return { out, got };
  }
  L.hp = 0;
  L.fell = { at: now, top: top(), n: Object.keys(L.threat).length };
  L.atk = null; L.move = null;
  out.push({ k: 'hp', h: 0, m: L.max }, { k: 'fell', at: now, top: L.fell.top, n: L.fell.n });
  return { out, got };
}
