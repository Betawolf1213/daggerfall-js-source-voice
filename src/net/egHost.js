// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md section 12): THE LEGION - the adds an
// Elite Breach's halls throw at the company, run by the relay as the gate's Legion-Lord's host is (net/gateBrain.js
// stepHost, WB11b), on any hall's fight floor instead of the Burning Court's: risen at the spots the hall gives (a
// Rift-Yard's rifts, a Rampart's far end, about a champion or a lord), each Harrier running at the nearest living member
// on the floor and Biting, each Ward-Bearer Pulsing at whoever comes near, every walk kept to the floor
// (net/egLaw.js egKeepOnFight). The gate's own words go out (`ad`, `amv`, `aatk`, `ah`, `adie`) and every screen draws
// them with the gate's own driver (scenes/gateHost.js) about the hall's centre; each blow is judged on the struck
// member's machine (net/gateStrike.js hostVerdict - co-op's law).
//
// THE KINDS, THE BLOWS AND THE PURSE ARE THE GATE'S: HOST_KINDS, HOST_BLOWS, spendBlow and spendPurse imported, never
// copied (ONE DFU MEMBER, ONE EXPORT). What is the Spire's is where they rise, whom they run at, and the floor.
//
// Pure: a host and a beat in, frames out. Not a DFU member. Ledger A (ELITE-GATES).
import { HOST, HOST_KINDS, HOST_BLOWS, HOST_RISE_MS, HOST_GONE, HARRIER_STOP_M, HARRIER_BITE_REACH, HOST_RETARGET_MS, BEARER_PULSE_MS, BEARER_PULSE_FIRST_MS, BEARER_PULSE_STAGGER_MS, BEARER_PULSE_NEAR,
  HP_SEND_MS, MOVE_RESAY_M, MOVE_RESAY_MS, HIT_KINDS, MELEE_REACH, POSE_SLACK, hostAt, spendBlow, spendPurse } from './gateBrain.js';
import { egKeepOnFight, egOnFight } from './egLaw.js';

/** A hall's legion, fresh: the last number given, those standing, the health last said. */
export const egHostNew = () => ({ n: 0, ads: [], hSent: '', hSentAt: 0 });
/** How many stand (the cap's count). */
export const egHostCount = (H) => H.ads.length;
const r2 = (v) => Math.round(v * 100) / 100;
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

/** A wave risen: kind `k` at each spot with `m` health each, said in one word (`ad` - the gate's). */
export function egRaise(H, k, spots, m, now, out) {
  const a = [];
  for (const [x, z] of spots) {
    const i = ++H.n;
    H.ads.push({ i, k, h: m, m, x: r2(x), z: r2(z), mv: null, atk: null, tg: null, tgAt: 0, up: now + HOST_RISE_MS[k], next: k === HOST.bearer ? now + BEARER_PULSE_FIRST_MS + a.length * BEARER_PULSE_STAGGER_MS : now });
    a.push([i, r2(x), r2(z)]);
  }
  if (!a.length) return;
  out.push({ k: 'ad', w: k, m, a, at: now });
  H.hSent = [H.hSent, ...a.map(([i]) => `${i}:${Math.ceil(m)}`)].filter(Boolean).join(','); H.hSentAt = now;
}
/** Those `which` picks (every one, by default) gone in one word - `w` how (the gate's HOST_GONE). */
export function egHostGone(H, now, out, w = HOST_GONE.crumbled, which = (a) => !!a) {
  const is = [];
  H.ads = H.ads.filter((a) => (which(a) ? (is.push(a.i), false) : true));
  if (is.length) out.push({ k: 'adie', is, w, at: now });
}
/** A walk said to (gx, gz), `stop` short of it and kept to the hall's fight floor - a new word only when its goal moved
 *  past MOVE_RESAY_M or MOVE_RESAY_MS has passed (the gate's law). */
function walk(a, gx, gz, stop, now, spec, moves) {
  const K = HOST_KINDS[a.k];
  const dx = gx - a.x, dz = gz - a.z, d = Math.hypot(dx, dz), go = Math.max(0, d - stop);
  const [tx, tz] = egKeepOnFight(spec, a.x + (d > 0 ? (dx / d) * go : 0), a.z + (d > 0 ? (dz / d) * go : 0), K.r);
  const m = a.mv;
  if (m && Math.hypot(m.tx - tx, m.tz - tz) < MOVE_RESAY_M && now - m.at < MOVE_RESAY_MS) return;
  if (!m && Math.hypot(tx - a.x, tz - a.z) < 0.05) return;
  a.mv = { x: r2(a.x), z: r2(a.z), tx: r2(tx), tz: r2(tz), v: K.speed, at: now };
  a.x = a.mv.x; a.z = a.mv.z;
  moves.push([a.i, a.mv.x, a.mv.z, a.mv.tx, a.mv.tz, K.speed, now]);
}
function stop(a, now, moves) {
  if (!a.mv) return;
  a.mv = null;
  a.x = r2(a.x); a.z = r2(a.z);
  moves.push([a.i, a.x, a.z, a.x, a.z, 0, now]);
}
/** A Harrier's beat: a Bite in flight runs out; its mark - the nearest living member on the floor, kept
 *  HOST_RETARGET_MS - Bitten within reach, else run at. */
function harrier(a, now, here, spec, moves, blows) {
  if (a.atk) { if (now < a.atk.until) return; a.atk = null; }
  let mark = a.tg ? here.find((b) => b.sub === a.tg) ?? null : null;
  if (!mark || now - a.tgAt >= HOST_RETARGET_MS) {
    mark = null;
    for (const b of here) if (!mark || dist(b.x, b.z, a.x, a.z) < dist(mark.x, mark.z, a.x, a.z)) mark = b;
    a.tg = mark?.sub ?? null; a.tgAt = now;
  }
  if (!mark) { stop(a, now, moves); return; }
  if (dist(a.x, a.z, mark.x, mark.z) <= HARRIER_BITE_REACH) {
    stop(a, now, moves);
    const B = HOST_BLOWS[HOST.harrier];
    a.atk = { at: now + B.windup, x: a.x, z: a.z, until: now + B.windup + B.active + B.recover };
    blows.push([a.i, a.atk.at, a.x, a.z]);
    return;
  }
  walk(a, mark.x, mark.z, HARRIER_STOP_M, now, spec, moves);
}
/** A Ward-Bearer's beat: a Pulse in flight runs out; the next due with a member near is begun (it stands its ground). */
function bearer(a, now, here, blows) {
  if (a.atk) { if (now < a.atk.until) return; a.atk = null; }
  if (now < a.next || !here.some((b) => dist(b.x, b.z, a.x, a.z) <= BEARER_PULSE_NEAR)) return;
  const B = HOST_BLOWS[HOST.bearer];
  a.atk = { at: now + B.windup, x: a.x, z: a.z, until: now + B.windup + B.active + B.recover };
  a.next = now + BEARER_PULSE_MS;
  blows.push([a.i, a.atk.at, a.x, a.z]);
}
const healthKey = (H) => H.ads.map((a) => `${a.i}:${Math.ceil(a.h)}`).join(',');

/**
 * THE LEGION'S BEAT on hall `spec`'s fight floor: each one standing carried to `now`, each risen one at its mark (a
 * Harrier) or its Pulse (a Ward-Bearer; a Sapper walks nowhere here), the beat's walks and blows one word each (`amv`,
 * `aatk`), the health as it falls (`ah`). `here` the living members ON THE FLOOR, the hall's own frame (`{sub, x, z}`).
 */
export function egHostStep(H, spec, now, here, out) {
  for (const a of H.ads) if (a.mv) { const [x, z] = hostAt(a, now); a.x = x; a.z = z; }
  const moves = [], blows = [];
  for (const a of [...H.ads]) {
    if (now < (a.up ?? 0)) continue;   // still rising out of the fire
    if (a.k === HOST.harrier) harrier(a, now, here, spec, moves, blows);
    else if (a.k === HOST.bearer) bearer(a, now, here, blows);
  }
  if (moves.length) out.push({ k: 'amv', m: moves });
  if (blows.length) out.push({ k: 'aatk', a: blows });
  if (now - (H.hSentAt ?? 0) >= HP_SEND_MS) {
    const key = healthKey(H);
    if (key !== H.hSent) { H.hSent = key; H.hSentAt = now; if (H.ads.length) out.push({ k: 'ah', h: H.ads.map((a) => [a.i, Math.ceil(a.h)]) }); }
  }
}

/**
 * A BLOW ON ONE OF THE LEGION from member purse `p` (the gate's player record: its level, its blow rate and bucket),
 * standing at `pose` (the hall's frame), of kind `r`, claiming `d` on body `i`: the hand and the purse the gate's, a
 * melee blow within MELEE_REACH of the body, from the fight floor. Answers the frames to fan - its fall (`adie`, by the
 * striker's name) - and what landed (`got`).
 */
export function egHostHit(H, spec, p, name, i, d, r, pose, now, seq = null) {
  const out = [];
  const a = Number.isSafeInteger(i) ? H.ads.find((o) => o.i === i) ?? null : null;
  if (!p || !a || !(a.h > 0) || !Number.isFinite(d) || !(d > 0)) return { out, got: 0 };
  if (!spendBlow(p, now, seq, `a${i}`)) return { out, got: 0 };
  if (!pose || !Number.isFinite(pose.x) || !Number.isFinite(pose.z) || !egOnFight(spec, pose.x, pose.z, POSE_SLACK + 6)) return { out, got: 0 };
  const [ax, az] = hostAt(a, now);
  if (r === HIT_KINDS.Melee && dist(pose.x, pose.z, ax, az) - HOST_KINDS[a.k].r > MELEE_REACH + POSE_SLACK) return { out, got: 0 };
  const got = spendPurse(p, d, a.h, now);
  a.h -= got;
  if (a.h > 1e-6) return { out, got };
  H.ads = H.ads.filter((o) => o !== a);
  out.push({ k: 'adie', is: [a.i], w: HOST_GONE.slain, n: name, at: now });
  return { out, got };
}
