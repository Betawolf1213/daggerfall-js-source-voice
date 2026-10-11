// @ts-check
// EG-FULL (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md section 15): THE VESTIGES - what the
// Battlemages left in their Redoubts: run-only powers, three offered at every Redoubt from three families, one taken,
// ranked I -> II -> III by taking again; the Mastery Vestiges that change what a member does; the Accords two members'
// choices grant together; each family's capstone at three of its Vestiges (resonance); and THE TRUST LAW's caps -
//   a member's CLIENT-DECLARED damage factors together at most EG_BUCKET_X_MAX (1.25: the bucket grows by them),
//   the RELAY-ESTABLISHED ones at most EG_RELAY_X_MAX (1.6), and both together at most EG_BUCKET_ALL_MAX (1.6);
//   every Vestige's damage reduction together at most EG_DR_MAX (30%); the same aura from several holders the
//   strongest plus 2% each other, +6% at most.
//
// A member's Vestiges on the wire are `[id, rank]` pairs (rank 1-3); a Mastery its own id. Pure law: the tables, the
// offer's draw (the relay's rng), the factors. In the relay bundle. Not a DFU member. Ledger A (ELITE-GATES).

export const EG_V_FAMILIES = Object.freeze(['stone', 'blade', 'hunt', 'arcana', 'fellowship']);
export const EG_V_FAMILY_NAMES = Object.freeze({ stone: 'Stone', blade: 'Blade', hunt: 'Hunt', arcana: 'Arcana', fellowship: 'Fellowship' });
/** THE CAPS (section 15). */
export const EG_BUCKET_X_MAX = 1.25;
export const EG_RELAY_X_MAX = 1.6;
export const EG_BUCKET_ALL_MAX = 1.6;
export const EG_DR_MAX = 0.3;
export const EG_AURA_EXTRA = 0.02;
export const EG_AURA_EXTRA_MAX = 0.06;
/** Fade's cooldown (s), the Lean's first Redoubt, the most cards an offer holds. */
export const EG_FADE_CD_S = 8;
export const EG_OFFER_MAX = 6;
/** Three shards make a rank of a held Vestige, or a pick of two new ones. */
export const EG_SHARDS_PER = 3;

/**
 * EVERY VESTIGE: its number, family, name, its three ranks' values (`v`), what applies it (`by`: 'client' - the holder's
 * own body; 'relay' - the room, to a blow; 'word' - each client, from the room's word), its expected damage factor where
 * it is client-declared (`x` - the bucket's), and its line.
 */
/** @type {ReadonlyArray<{ id: number, key: string, fam: string, name: string, v: number[], by: string, x?: number[], line: (v: any) => string }>} */
export const EG_VESTIGES = Object.freeze([
  // STONE
  Object.freeze({ id: 0, key: 'stoneskin', fam: 'stone', name: 'Stoneskin', v: [0.10, 0.18, 0.25], by: 'client', line: (v) => `+${pc(v)} maximum health.` }),
  Object.freeze({ id: 1, key: 'ironfooting', fam: 'stone', name: 'Iron Footing', v: [0.35, 0.65, 1.0], by: 'client', line: (v) => `Pushes against you ${pc(v)} weaker.` }),
  Object.freeze({ id: 2, key: 'secondwind', fam: 'stone', name: 'Second Wind', v: [0.15, 0.25, 0.35], by: 'client', line: (v) => `Once a hall, falling under 30% heals ${pc(v)}.` }),
  Object.freeze({ id: 3, key: 'bastion', fam: 'stone', name: 'Bastion', v: [0.04, 0.08, 0.12], by: 'word', aura: 6, line: (v) => `Allies within 6 m take ${pc(v)} less from blows.` }),
  Object.freeze({ id: 4, key: 'oath', fam: 'stone', name: "Challenger's Oath", v: [1.5, 2, 2.5], by: 'relay', line: (v) => `Your threat x${v}; lords' blows on you weaker.` }),
  // BLADE
  Object.freeze({ id: 5, key: 'searing', fam: 'blade', name: 'Searing Edge', v: [3, 6, 9], x: [1.04, 1.07, 1.10], by: 'client', line: (v) => `Melee blows +${v} fire.` }),
  Object.freeze({ id: 6, key: 'momentum', fam: 'blade', name: 'Momentum', v: [3, 4, 5], x: [1.05, 1.07, 1.09], by: 'client', line: (v) => `Blows on one target +4% each, to ${v} stacks.` }),
  Object.freeze({ id: 7, key: 'sweeping', fam: 'blade', name: 'Sweeping Arc', v: [0.20, 0.35, 0.50], by: 'relay', line: (v) => `Melee blows splash ${pc(v)} to adds within 3 m.` }),
  Object.freeze({ id: 8, key: 'bloodied', fam: 'blade', name: 'Bloodied Fury', v: [0.10, 0.18, 0.25], x: [1.03, 1.05, 1.07], by: 'client', line: (v) => `Under half health, +${pc(v)} damage.` }),
  Object.freeze({ id: 9, key: 'culling', fam: 'blade', name: 'Culling Edge', v: [0.30, 0.45, 0.60], by: 'relay', line: (v) => `+${pc(v)} on adds under a quarter health.` }),
  // HUNT
  Object.freeze({ id: 10, key: 'longsight', fam: 'hunt', name: 'Long Sight', v: [0.08, 0.14, 0.20], by: 'relay', line: (v) => `Arrows and spells from beyond 12 m +${pc(v)}.` }),
  Object.freeze({ id: 11, key: 'featherstep', fam: 'hunt', name: 'Featherstep', v: [0.2, 0.35, 0.5], by: 'client', line: (v) => `Your crumbles wait +${v} s; cast-backs cost less.` }),
  Object.freeze({ id: 12, key: 'fade', fam: 'hunt', name: 'Fade', v: [1.5, 2.5, 3.5], by: 'relay', line: (v) => `After you strike, adds lose you for ${v} s.` }),
  Object.freeze({ id: 13, key: 'huntersmark', fam: 'hunt', name: "Hunter's Mark", v: [0.05, 0.08, 0.12], by: 'relay', line: (v) => `Your first arrow marks a foe: the company deals +${pc(v)} to it.` }),
  Object.freeze({ id: 14, key: 'fleetfoot', fam: 'hunt', name: 'Fleetfoot', v: [0.04, 0.07, 0.10], by: 'client', line: (v) => `Run speed +${pc(v)}.` }),
  // ARCANA
  Object.freeze({ id: 15, key: 'focus', fam: 'arcana', name: "Battlemage's Focus", v: [0.10, 0.18, 0.25], by: 'client', line: (v) => `Spell cost -${pc(v)}.` }),
  Object.freeze({ id: 16, key: 'overcharge', fam: 'arcana', name: 'Overcharge', v: [0.08, 0.14, 0.20], x: [1.08, 1.14, 1.20], by: 'client', line: (v) => `Spell blows +${pc(v)}.` }),
  Object.freeze({ id: 17, key: 'spellbane', fam: 'arcana', name: 'Spellbane', v: [10, 18, 25], by: 'client', line: (v) => `Every resistance +${v}.` }),
  Object.freeze({ id: 18, key: 'shieldweaver', fam: 'arcana', name: 'Shieldweaver', v: [0.20, 0.35, 0.50], by: 'client', line: (v) => `Your Shield spell soaks +${pc(v)}.` }),
  Object.freeze({ id: 19, key: 'echo', fam: 'arcana', name: 'Arcane Echo', v: [0.10, 0.16, 0.22], x: [1.05, 1.08, 1.11], by: 'client', line: (v) => `A damage spell repeats at half, ${pc(v)} of casts.` }),
  // FELLOWSHIP
  Object.freeze({ id: 20, key: 'rally', fam: 'fellowship', name: 'Rally', v: [0.08, 0.14, 0.20], by: 'word', line: (v) => `When a hall's door opens, the company heals ${pc(v)}.` }),
  Object.freeze({ id: 21, key: 'standard', fam: 'fellowship', name: "Spire's Standard", v: [0.04, 0.07, 0.10], by: 'relay', aura: 10, line: (v) => `Allies within 10 m +${pc(v)} damage.` }),
  Object.freeze({ id: 22, key: 'watchfire', fam: 'fellowship', name: 'Watchfire', v: [0.15, 0.25, 0.35], by: 'relay', line: (v) => `Blows aimed near you are told ${v} s early to the company.` }),
  Object.freeze({ id: 23, key: 'fallensdue', fam: 'fellowship', name: "Fallen's Due", v: [0.10, 0.15, 0.20], by: 'relay', line: (v) => `When an ally falls, the living deal +${pc(v)} for the hall.` }),
  Object.freeze({ id: 24, key: 'steadfast', fam: 'fellowship', name: 'Steadfast Line', v: [0.05, 0.10, 0.15], by: 'client', line: (v) => `With three allies within 8 m, you take ${pc(v)} less.` }),
  Object.freeze({ id: 25, key: 'mender', fam: 'fellowship', name: "Mender's Grace", v: [0.15, 0.25, 0.35], by: 'word', line: (v) => `Heals you cast on allies +${pc(v)}.` }),
  Object.freeze({ id: 26, key: 'lifeline', fam: 'fellowship', name: 'Lifeline', v: [0.20, 0.30, 0.40], by: 'word', line: (v) => `A heal on an ally under 30% gives them ${pc(v)} less from blows for 3 s.` }),
]);
function pc(v) { return `${Math.round(v * 100)}%`; }
export const EG_V_BY_KEY = Object.freeze(Object.fromEntries(EG_VESTIGES.map((v) => [v.key, v])));
/** THE MASTERIES: one held at a time (a new one replaces it), offered as a fourth card at Redoubt 3 and every Valkynaz
 *  Redoubt. Numbered from 100. */
export const EG_MASTERIES = Object.freeze([
  Object.freeze({ id: 100, key: 'immovable', fam: 'stone', name: 'Immovable', line: 'Stand still 1 s on a fight floor: blows on you deal 25% less and pushes nothing, until you move.' }),
  Object.freeze({ id: 101, key: 'counterstroke', fam: 'blade', name: 'Counterstroke', line: "A melee blow on a lord within 0.6 s after one of its blows lands near you deals x1.4." }),
  Object.freeze({ id: 102, key: 'spotter', fam: 'hunt', name: 'Spotter', line: 'Your arrows wake Lurkers at any range; a woken or struck foe is marked +10% for 8 s.' }),
  Object.freeze({ id: 103, key: 'spillover', fam: 'arcana', name: 'Spillover', line: "A spell's overkill on an add carries to the nearest add within 6 m." }),
  Object.freeze({ id: 104, key: 'spirebridge', fam: 'fellowship', name: 'Spirebridge', line: 'Once a span, a gold bridge over the next gap for the company, for 6 s.' }),
]);
export const EG_M_BY_ID = Object.freeze(Object.fromEntries(EG_MASTERIES.map((m) => [m.id, m])));
/** THE ACCORDS: two members within 10 m holding a named pair from two families. */
export const EG_ACCORDS = Object.freeze([
  Object.freeze({ key: 'hammer', name: 'Hammer and Anvil', a: 'oath', b: 'huntersmark', line: "A foe the mark's holder marked takes +8% from the oath's holder." }),
  Object.freeze({ key: 'hymn', name: 'Shield-Hymn', a: 'bastion', b: 'rally', line: "Rally's heal also gives 4 s of Bastion's protection." }),
  Object.freeze({ key: 'ambush', name: 'Ambush', a: 'fade', b: 'standard', line: 'The first blow after a Fade, near the Standard, deals +15%.' }),
  Object.freeze({ key: 'kindled', name: 'Kindled Steel', a: 'searing', b: 'overcharge', line: "The Edge holder's melee fire splashes 2 m." }),
  Object.freeze({ key: 'farwatch', name: 'Far Watch', a: 'longsight', b: 'watchfire', line: "Watchfire's lead grows for blows aimed at the Long Sight holder." }),
  Object.freeze({ key: 'livingwall', name: 'Living Wall', a: 'stoneskin', b: 'mender', line: 'Heals on the Stoneskin holder +10%.' }),
  Object.freeze({ key: 'noquarter', name: 'No Quarter', a: 'culling', b: 'fallensdue', line: "While Fallen's Due burns, Culling Edge reaches adds under a third of their health." }),
  Object.freeze({ key: 'warchorus', name: 'War-Chorus', a: 'echo', b: 'standard', line: 'Near the Standard, an Echo repeats at full.' }),
]);
/** RESONANCE: three different Vestiges of one family grant its capstone, for the breach. */
export const EG_CAPSTONES = Object.freeze({
  stone: Object.freeze({ name: 'Rooted', line: 'Immune to push, and your threat doubles.' }),
  blade: Object.freeze({ name: 'Bladestorm', line: 'Every fifth melee blow strikes every foe within 3 m.' }),
  hunt: Object.freeze({ name: 'Deadeye', line: 'An arrow from beyond 12 m pierces the add behind its target.' }),
  arcana: Object.freeze({ name: 'Spellweave', line: 'Every fourth damage spell costs nothing.' }),
  fellowship: Object.freeze({ name: 'Rallying Cry', line: "Rally's heal and every Second Wind refresh when a hall's door opens." }),
});

/** A member's rank in a Vestige (0 none). */
export const egRankOf = (vs, key) => { const V = EG_V_BY_KEY[key]; if (!V) return 0; const p = (vs ?? []).find((x) => x[0] === V.id); return p ? p[1] : 0; };
/** A member's value of a Vestige at its rank (0 none). */
export const egVOf = (vs, key) => { const r = egRankOf(vs, key); return r ? EG_V_BY_KEY[key].v[r - 1] : 0; };
/** The families resonating for a member (three different Vestiges of one family). */
export function egResonance(vs) {
  const by = {};
  for (const [id] of vs ?? []) { const V = EG_VESTIGES[id]; if (V) by[V.fam] = (by[V.fam] ?? 0) + 1; }
  return EG_V_FAMILIES.filter((f) => (by[f] ?? 0) >= 3);
}
/** A member's client-declared damage factor (the bucket's - THE TRUST LAW: at most EG_BUCKET_X_MAX). */
export function egDeclaredX(vs) {
  let x = 1;
  for (const [id, r] of vs ?? []) { const V = EG_VESTIGES[id]; if (V?.x) x *= V.x[r - 1]; }
  return Math.min(EG_BUCKET_X_MAX, x);
}
/** The relay-established factor for a blow, capped (EG_RELAY_X_MAX) and, with the declared one, capped together
 *  (EG_BUCKET_ALL_MAX). */
export const egCapX = (relayX, declaredX) => Math.min(EG_RELAY_X_MAX, relayX, EG_BUCKET_ALL_MAX / Math.max(1, declaredX));
/** Accords a pair of members hold (by their Vestiges). */
export function egAccordsOf(vsA, vsB) {
  const has = (vs, k) => egRankOf(vs, k) > 0;
  return EG_ACCORDS.filter((A) => (has(vsA, A.a) && has(vsB, A.b)) || (has(vsA, A.b) && has(vsB, A.a)));
}

/**
 * THE OFFER at a Redoubt for one member: three Vestiges from three different families (one held at III never shown),
 * at the first Redoubt one of them from the family of their most-used blow kind (THE LEAN: melee Blade, an arrow Hunt, a
 * spell Arcana); a Mastery as a fourth card at Redoubt 3 and every Valkynaz Redoubt; a bequest's card; at most
 * EG_OFFER_MAX. `extra` cards from a Surplus or shards. Under The Hollow Offer, two cards, one a Mastery.
 * @param {() => number} rng @param {{ vs: number[][], mast?: number, lean?: number|null, w: number, valk?: boolean, bequest?: number|null, extra?: number, hollow?: boolean }} o
 * @returns {number[]} the cards (Vestige ids, Mastery ids from 100)
 */
export function egOfferOf(rng, { vs = [], mast = -1, lean = null, w = 1, valk = false, bequest = null, extra = 0, hollow = false }) {
  const maxed = new Set((vs ?? []).filter((p) => p[1] >= 3).map((p) => p[0]));
  const fams = [...EG_V_FAMILIES].sort(() => rng() - 0.5);
  const leanFam = w === 1 && lean != null ? (lean === 0 ? 'blade' : lean === 1 ? 'hunt' : 'arcana') : null;
  if (leanFam) { fams.splice(fams.indexOf(leanFam), 1); fams.unshift(leanFam); }
  const cards = [];
  const n = (hollow ? 1 : 3) + Math.max(0, extra);
  for (const f of fams) {
    if (cards.length >= n) break;
    const pool = EG_VESTIGES.filter((V) => V.fam === f && !maxed.has(V.id) && !cards.includes(V.id));
    if (pool.length) cards.push(pool[Math.floor(rng() * pool.length)].id);
  }
  if (hollow || w === 3 || valk) { const pool = EG_MASTERIES.filter((M) => M.id !== mast); if (pool.length) cards.push(pool[Math.floor(rng() * pool.length)].id); }
  if (bequest != null && !cards.includes(bequest) && !maxed.has(bequest)) cards.push(bequest);
  return cards.slice(0, EG_OFFER_MAX);
}
/** A card taken: a Vestige ranked (or new at I), a Mastery set (replacing any). Answers the member's new `{ vs, mast }`. */
export function egTake(vs, mast, card) {
  if (card >= 100) return { vs: vs ?? [], mast: EG_M_BY_ID[card] ? card : mast };
  const V = EG_VESTIGES[card];
  if (!V) return { vs: vs ?? [], mast };
  const had = (vs ?? []).find((p) => p[0] === card);
  const next = had ? (vs ?? []).map((p) => (p[0] === card ? [p[0], Math.min(3, p[1] + 1)] : p)) : [...(vs ?? []), [card, 1]];
  return { vs: next, mast };
}
/** A card's name and line at the rank it would give. */
export function egCardText(card, vs = []) {
  if (card >= 100) { const M = EG_M_BY_ID[card]; return M ? { name: `${M.name} (Mastery)`, line: M.line, fam: M.fam } : { name: '', line: '', fam: '' }; }
  const V = EG_VESTIGES[card];
  if (!V) return { name: '', line: '', fam: '' };
  const r = Math.min(3, egRankOf(vs, V.key) + 1);
  return { name: `${V.name} ${['I', 'II', 'III'][r - 1]}`, line: V.line(V.v[r - 1]), fam: V.fam };
}
