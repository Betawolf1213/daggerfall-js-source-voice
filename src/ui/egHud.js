// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 6, 7 and 21) and EG-FULL
// (2026-10-11, Mac: "I said I want everything" - sections 14, 15, 16, 17 and 27): AN ELITE BREACH'S TRACKER AND ITS
// PANELS -
//   THE TRACKER (a readout, no click): outside the Spire the call; inside, THE COUNT CHIP (gold above 10:00, white to
//     2:00, red below and pulsing in the last 30 s; *Held* while it holds; the last word's seal when it is nearer), the
//     circle and hall by name with its band, the objective and its progress (rifts 3 of 5, the hold's seconds, the winch,
//     the casters left), the decrees in force, my run (Reliquaries, lumen, shards, tonics, Cantrips, THE POTION LAW's
//     pip), the marks on me, the company's rows (numerals, a cracked recall, a witness's eye, home, forsaken), a
//     witness's own line;
//   THE PANEL (clicked, or answered by keys and `/breach` words): the Vestige offer (each card its name, rank and line;
//     1-6 to take), the company's word (each choice open, its options and its countdown; Y/N, 1-2), and THE RECAP at a
//     run's end (the depth, the time, why it ended, the circles' strip, the company, the Vestiges held).
//
// The models are pure (`egHudModel`, `egPanelModel`, `egRecapModel`); the drawing keeps one node each, updated, never
// rebuilt line by line beyond what changed, and hidden with the HUD.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { egHallOf, egCircleOfHall, egSlotOfHall, egPhase, egTimes, egCountText, egObjectiveOf, EG_TEXT, EG_COUNT_START_MS, EG_LAST_WORD_MS, EG_BANDS, EG_DECREES, EG_TWIST_NAMES } from '../net/egLaw.js';
import { egCountAt, egLivingCount, egMemberOf, egRunOfMember } from '../net/egLink.js';
import { egCardText, EG_VESTIGES, EG_M_BY_ID } from '../net/egVestige.js';
import { EG_CANTRIPS } from '../net/egRun.js';
import { injectEnhancedFonts } from './enhancedStyle.js';

/** Under this, THE COUNT burns red; under this it pulses; above this it is gold (ms). */
export const EG_HUD_LOW_MS = 2 * 60_000;
export const EG_HUD_PULSE_MS = 30_000;
export const EG_HUD_GOLD_MS = 10 * 60_000;
/** A mark's words on a member (net/egBodies.js egMarksOut). */
export const EG_MARK_NAMES = Object.freeze(['The Scent', 'Soul-mark', 'Fire-touched', 'Frost-touched', 'Chained', 'Caged', 'Challenged', 'Hunted', 'Bound']);
/** THE POTION LAW (section 17.4): restoring potions a hall. */
export const EG_POTIONS_PER_HALL = 2;
export const EG_HUD_STYLE_ID = 'dagger-eg-hud-style';
export const EG_HUD_CSS = `
.eg-hud { position: fixed; right: 16px; top: 24%; width: min(320px, 72vw); box-sizing: border-box; pointer-events: none; z-index: 30;
  padding: 10px 14px 11px; border: 1px solid rgba(214,170,92,0.55); border-radius: 3px;
  background: linear-gradient(180deg, rgba(18,12,10,0.82), rgba(10,7,6,0.72)); box-shadow: 0 0 18px rgba(0,0,0,0.65);
  font: 600 calc(14px * var(--hud-scale, 1)) 'Cormorant', Georgia, serif; color: #f1dcc2; text-shadow: 0 0 3px #000; }
.eg-hud-kicker { font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase; color: #d6aa5c; }
.eg-hud-title { font-size: 18px; line-height: 1.15; margin-top: 2px; color: #ffe9cf; }
.eg-hud-count { font: 700 26px 'Cormorant', Georgia, serif; font-variant-numeric: tabular-nums; letter-spacing: 0.06em; margin-top: 4px; color: #ffffff; }
.eg-hud-count.gold { color: #e8c473; }
.eg-hud-count.held { color: #e8c473; }
.eg-hud-count.low { color: #ff6a4a; text-shadow: 0 0 4px #000, 0 0 12px rgba(255,60,30,0.6); }
.eg-hud-count.pulse { color: #ff4a2a; animation: eg-pulse 1s ease-in-out infinite; }
@keyframes eg-pulse { 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) { .eg-hud-count.pulse { animation: none; } }
.eg-hud-count:empty { display: none; }
.eg-hud-line { font-size: 15px; line-height: 1.25; margin-top: 5px; }
.eg-hud-sub, .eg-hud-run, .eg-hud-dec, .eg-hud-mark { font-size: 13px; line-height: 1.25; margin-top: 3px; color: #cdb79e; }
.eg-hud-mark { color: #ff8a6a; }
.eg-hud-sub:empty, .eg-hud-company:empty, .eg-hud-run:empty, .eg-hud-dec:empty, .eg-hud-mark:empty { display: none; }
.eg-hud-company { font-size: 12px; letter-spacing: 0.06em; margin-top: 7px; color: #b9a084; white-space: pre-line; }
.eg-panel { position: fixed; left: 50%; top: 18%; transform: translateX(-50%); width: min(620px, 92vw); box-sizing: border-box; z-index: 32; pointer-events: auto;
  padding: 14px 16px; border: 1px solid rgba(214,170,92,0.7); border-radius: 4px; background: rgba(14,10,8,0.92); box-shadow: 0 0 28px rgba(0,0,0,0.8);
  font: 600 15px 'Cormorant', Georgia, serif; color: #f1dcc2; }
.eg-panel h3 { margin: 0 0 6px; font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase; color: #d6aa5c; font-weight: 700; }
.eg-panel .eg-cards { display: flex; flex-wrap: wrap; gap: 8px; }
.eg-panel button { flex: 1 1 170px; text-align: left; cursor: pointer; padding: 8px 10px; border: 1px solid rgba(214,170,92,0.45); border-radius: 3px;
  background: rgba(40,28,20,0.85); color: #f1dcc2; font: inherit; }
.eg-panel button:hover, .eg-panel button:focus { border-color: #e8c473; background: rgba(70,50,30,0.95); outline: none; }
.eg-panel button b { display: block; color: #ffe9cf; }
.eg-panel button small { display: block; color: #cdb79e; font-size: 13px; margin-top: 2px; }
.eg-panel .eg-ask { margin-top: 10px; }
.eg-panel .eg-note { margin-top: 8px; font-size: 13px; color: #b9a084; }
@media (max-width: 640px) { .eg-hud { top: 16%; right: 8px; padding: 7px 10px 8px; } .eg-hud-title { font-size: 15px; } .eg-hud-count { font-size: 21px; } .eg-hud-line { font-size: 13px; } .eg-panel { top: 8%; } }
`;

const ms = (v) => egCountText(Math.max(0, v));
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const FAMILY = Object.freeze({ blows: 'blows', legion: 'legion', ground: 'ground', covenant: 'Covenant', lord: 'lord' });
/** The objective's progress, from the fight's (net/egBodies.js `pg`). */
export function egProgressText(spec, pg) {
  if (!pg) return '';
  if (Array.isArray(pg.rifts)) return `Rifts ${pg.rifts[1] - pg.rifts[0]} of ${pg.rifts[1]} closed`;
  if (pg.obj === 'wellspring') return pg.anchors > 0 ? `Anchors standing: ${pg.anchors}` : 'The Wellspring is open to blows';
  if (pg.obj === 'holdfast') return `Hold ${ms(75_000 - (pg.hold ?? 0))} - the relic ${pg.relic ?? 100}%`;
  if (pg.obj === 'winch') return `The winch ${Math.round(((pg.winch ?? 0) / 60_000) * 100)}%`;
  if (pg.obj === 'gauntlet') return `Casters left: ${pg.left ?? 0}`;
  if (pg.obj === 'engine') return `Hold the engine ${ms(45_000 - (pg.hold ?? 0))}`;
  if (pg.obj === 'orrery' && Array.isArray(pg.st)) return `Stones true: ${pg.lit ?? 0} of 6 - fray ${pg.f ?? 0}`;
  if (pg.obj === 'quiet') return `The door opens in ${ms(pg.quiet ?? 0)}`;
  return '';
}
/** A stage's words, by the hall's kind where it matters. */
function stageLines(E, spec, now) {
  const left = E.su > 0 ? E.su - now : 0;
  switch (E.sg) {
    case 'wait': return { line: EG_TEXT.sealed(ms(left)), sub: 'Gather your company.' };
    case 'arrive': return { line: 'Gather on the arrival plate.', sub: left > 0 ? `The hall wakes in ${ms(left)}.` : '' };
    case 'trial': {
      const obj = egObjectiveOf(spec), prog = egProgressText(spec, E.fight?.pg);
      const lordAsleep = spec?.kind === 'court' && !(E.fight?.bodies ?? []).some((b) => b.role === 0 && b.ph);
      return { line: obj, sub: prog || (spec?.kind === 'court' && lordAsleep && !(E.fight?.says ?? []).some((s) => s.w === 'wake') ? 'Step into the ring to wake its lord.' : spec?.twist ? EG_TWIST_NAMES[spec.twist] : '') };
    }
    case 'closing': return { line: `${EG_TEXT.door} Step through the door.`, sub: left > 0 ? `${EG_TEXT.pulled.replace('.', '')} in ${ms(left)}.` : '' };
    case 'rest': return { line: `${EG_TEXT.redoubt(E.rd)} - ${EG_TEXT.rest}`, sub: left > 0 ? `${EG_TEXT.descend.replace('.', '')} in ${ms(left)} - or take the way home.` : '' };
    case 'end': return { line: EG_TEXT.ended, sub: '' };
    default: return { line: '', sub: '' };
  }
}
/** The company's rows (section 27.4): each member's numeral and name, a cracked recall, a witness's eye, home, forsaken. */
export function egCompanyRows(E) {
  return E.co.map((c) => {
    const [, name, n, alive, home, , wit, forsaken, , recall] = c;
    const state = forsaken ? ' (forsaken)' : home ? ' - home' : wit ? ' - watching' : !alive ? ' - fallen' : '';
    const crack = alive && !home && recall === 0 ? ' *' : '';
    return `${ROMAN[n] ?? n} ${name}${crack}${state}`;
  }).join('\n');
}

/**
 * What the tracker says now, or null. Pure.
 * @param {any} E net/egLink.js's state @param {string|null} me @param {number} now
 * @param {{ inSpire?: boolean, witness?: boolean, potions?: number }} where
 */
export function egHudModel(E, me, now, { inSpire = false, witness = false, potions = EG_POTIONS_PER_HALL } = {}) {
  if (!E) return null;
  if (inSpire && E.b) {
    const spec = E.h > 0 ? egHallOf(E.seed, E.h, E.geo ?? 0) : null;
    const left = E.wk > 0 ? egCountAt(E, now) : EG_COUNT_START_MS;
    const lastWord = E.op + EG_LAST_WORD_MS - now;
    const { line, sub } = stageLines(E, spec, now);
    const n = E.co.length, standing = egLivingCount(E);
    const held = !(E.ca > 0);
    const seal = lastWord < left;
    const shown = seal ? lastWord : left;
    const countCls = E.sg === 'end' ? '' : held ? 'held' : shown < EG_HUD_PULSE_MS ? 'pulse' : shown < EG_HUD_LOW_MS ? 'low' : shown > EG_HUD_GOLD_MS ? 'gold' : '';
    const run = me ? egRunOfMember(E, me) : null;
    const cants = (run?.cant ?? []).map((c) => EG_CANTRIPS[c]?.name).filter(Boolean);
    const runLine = run ? [`Reliquaries ${run.rel}`, `lumen ${run.lumen}`, run.shards ? `shards ${run.shards}` : '', run.tonics ? `tonics ${run.tonics}` : '', `potions ${potions}/${EG_POTIONS_PER_HALL}`, cants.length ? `Cantrips: ${cants.join(', ')}` : ''].filter(Boolean).join(' - ') : '';
    const dec = (E.dc ?? []).map(([id, rank]) => `${EG_DECREES[id]?.name ?? ''}${rank >= 2 ? ' II' : ''}`).filter(Boolean);
    const marks = (E.fight?.mk ?? []).filter((m) => m[0] === me && m[2] > now).map((m) => `${EG_MARK_NAMES[m[1]] ?? ''} ${Math.ceil((m[2] - now) / 1000)}s`);
    const mine = me ? egMemberOf(E, me) : null;
    const memento = me ? (E.mm ?? []).find((q) => q[0] === me) : null;
    const witLine = witness || (mine && mine.wit) ? (mine && mine.recall ? (memento ? `Your Memento lies in Hall ${memento[1]}. You will be called back at Redoubt ${egCircleOfHall(E.h)}.` : `You will be called back at Redoubt ${egCircleOfHall(E.h)}.`) : `${EG_TEXT.fallen} /breach forsake leaves for good.`) : '';
    return {
      kicker: `${E.rh ? `${EG_TEXT.name} - Rehearsal` : EG_TEXT.name}${spec ? ` - ${EG_BANDS[spec.band]?.name ?? ''}` : ''}`,
      title: spec ? `Circle ${egCircleOfHall(E.h)} - Hall ${egSlotOfHall(E.h)}: ${spec.name}` : 'The Battlespire',
      count: E.sg === 'end' ? '' : `${held ? 'Held ' : ''}${seal ? 'Last word ' : ''}${ms(shown)}`, countCls,
      line: witLine || line, sub: witLine ? '' : sub, company: n > 1 ? `${standing} of ${n} standing\n${egCompanyRows(E)}` : '',
      run: runLine, dec: dec.length ? `Decrees: ${dec.join(', ')}` : '', mark: marks.join(' - '),
    };
  }
  const c = E.call;
  if (!c || !me || !c.co.some((r) => r[0] === me)) return null;
  const phase = egPhase({ openedAt: c.op }, now), T = egTimes({ openedAt: c.op });
  if (phase === 'ended' || phase === 'deep' || phase === 'torn') return null;
  const mine = c.os === me;
  return {
    kicker: c.rh ? `${EG_TEXT.name} - Rehearsal` : EG_TEXT.name,
    title: mine ? 'Your breach is opening' : EG_TEXT.call(c.o || 'Your company'),
    count: '', countCls: '',
    line: phase === 'open' ? EG_TEXT.answer(ms(T.admitUntil - now)) : EG_TEXT.sealed(ms(T.openAt - now)),
    sub: phase === 'open' ? 'Type /breach in chat to step through.' : 'Gather your company. Type /breach once it opens.',
    company: c.co.length > 1 ? `Company of ${c.co.length}` : '', run: '', dec: '', mark: '',
  };
}

/** A choice's words (the company's word - section 16.4). */
export function egAskText(q, o) {
  if (q.startsWith('dec:')) { const fam = q.slice(4); return { title: `The next circle's ${FAMILY[fam] ?? fam} decree`, opts: o.map((id) => `${EG_DECREES[id]?.name ?? '?'} - ${EG_DECREES[id]?.line ?? ''}`) }; }
  if (q === 'bargain') return { title: "Dagon's Bargain: one more decree for this circle, a Reliquary to each who says yes", opts: ['No', 'Yes'] };
  if (q === 'respite') return { title: 'Take a respite? Two minutes from the budget, the count held', opts: ['No', 'Yes'] };
  if (q === 'ready') return { title: 'Ready to descend?', opts: ['Not yet', 'Ready'] };
  return { title: q, opts: o.map(String) };
}
/**
 * THE PANEL's model, or null: my Vestige offer (each card's name, rank and line; how many I may take), the company's
 * word open (each choice, its options, its time left, my answer), a Surplus to spend. Pure.
 */
export function egPanelModel(E, me, now, voted = {}) {
  if (!E?.b || E.end) return null;
  const run = me ? egRunOfMember(E, me) : null;
  const offer = E.offer?.v?.length ? { cards: E.offer.v.map((c, j) => ({ key: j + 1, card: c, ...egCardText(c, run?.vs ?? []) })), n: E.offer.n, surplus: E.sp ?? 0 } : null;
  const asks = (E.as ?? []).filter((a) => a[2] > now).map(([q, o, until]) => ({ q, ...egAskText(q, o), left: until - now, mine: voted[q] ?? null, tally: E.tally?.[q] ?? [] }));
  if (!offer && !asks.length) return null;
  return { offer, asks };
}
/** THE RECAP (section 27.6): the depth, the time from the first wake, why it ended, the circles' strip, the company,
 *  my Vestiges. `log` the client's own record of the halls it saw. Pure. */
export function egRecapModel(E, me, log, now) {
  if (!E?.b) return null;
  const run = me ? egRunOfMember(E, me) : null;
  const t = E.wk ? Math.max(0, now - E.wk) : 0;
  const circles = [];
  for (const h of log ?? []) { const c = egCircleOfHall(h.h); (circles[c - 1] ??= []).push(h); }
  return {
    title: `Hall ${E.h} - Redoubt ${E.rd} - ${E.h > 0 ? EG_BANDS[egHallOf(E.seed, E.h, E.geo ?? 0).band]?.name : ''}`,
    time: ms(t), why: E.end ?? '',
    circles: circles.filter(Boolean).map((hs, j) => `Circle ${j + 1}: ${hs.map((h) => h.glyph).join(' ')}${hs.some((h) => h.fall) ? ' (a fall)' : ''}`),
    company: egCompanyRows(E),
    vestiges: (run?.vs ?? []).map(([id, r]) => `${EG_VESTIGES[id]?.name ?? ''} ${ROMAN[r]}`).concat(run && run.mast >= 100 ? [`${EG_M_BY_ID[run.mast]?.name ?? ''} (Mastery)`] : []),
    reliquaries: run?.rel ?? 0,
  };
}

// ── the drawing ─────────────────────────────────────────────────────────────────────────────────────────────
let root = null, parts = null, panel = null, panelKey = '';
const SHOWN = () => ({ vis: '', kicker: null, title: null, count: null, countCls: null, line: null, sub: null, company: null, run: null, dec: null, mark: null });
let shown = SHOWN();
const KEYS = ['kicker', 'title', 'count', 'line', 'sub', 'run', 'dec', 'mark', 'company'];

function ensureStyle(doc) {
  if (doc.getElementById && !doc.getElementById(EG_HUD_STYLE_ID)) {
    const st = doc.createElement('style');
    st.id = EG_HUD_STYLE_ID;
    st.textContent = EG_HUD_CSS;
    (doc.head ?? doc.body)?.append(st);
    if (doc.head) injectEnhancedFonts(doc);
  }
}
function build(doc) {
  ensureStyle(doc);
  const part = (cls) => { const n = doc.createElement('div'); n.className = cls; return n; };
  root = part('eg-hud');
  root.setAttribute?.('aria-live', 'polite');
  parts = Object.fromEntries(KEYS.map((k) => [k, part(`eg-hud-${k}`)]));
  root.append(...KEYS.map((k) => parts[k]));
  (doc.body ?? doc.documentElement)?.append(root);
}

/** Draw the tracker for a model (null hides it); `hidden` the HUD's own hide. */
export function drawEgHud(model, { hidden = false, doc = globalThis.document } = {}) {
  const want = !hidden && !!model;
  if (!root) {
    if (!want || !doc?.createElement) return;
    build(doc);
  }
  const vis = want ? 'on' : 'off';
  if (vis !== shown.vis) { shown.vis = vis; root.style.display = want ? '' : 'none'; }
  if (!want || !model) return;
  for (const k of KEYS) { const v = model[k] ?? ''; if (v !== shown[k]) { shown[k] = v; parts[k].textContent = v; } }
  if (model.countCls !== shown.countCls) { shown.countCls = model.countCls; parts.count.className = `eg-hud-count${model.countCls ? ` ${model.countCls}` : ''}`; }
}
/**
 * Draw THE PANEL for a model (null takes it down): its buttons call `onPick(card)`, `onVote(q, y)`, `onSurplus(use)`;
 * rebuilt only when what it shows changes (its key).
 * @param {any} model
 * @param {{ hidden?: boolean, doc?: any, onPick?: (card: number) => void, onVote?: (q: string, y: number) => void, onSurplus?: (use: number) => void, recap?: any }} [o]
 */
export function drawEgPanel(model, { hidden = false, doc = globalThis.document, onPick = () => {}, onVote = () => {}, onSurplus = () => {}, recap = null } = {}) {
  const want = !hidden && (!!model || !!recap);
  if (!want) { if (panel) { panel.remove?.(); panel = null; panelKey = ''; } return; }
  if (!doc?.createElement) return;
  const key = JSON.stringify([model, recap ? recap.title + recap.why : '']).replace(/"left":\d+/g, '');
  const leftOf = (q) => model?.asks?.find((a) => a.q === q)?.left ?? 0;
  if (panel && key === panelKey) { for (const el of panel.querySelectorAll?.('[data-left]') ?? []) el.textContent = `${Math.ceil(leftOf(el.getAttribute('data-left')) / 1000)}s`; return; }
  ensureStyle(doc);
  panel?.remove?.();
  panel = doc.createElement('div');
  panel.className = 'eg-panel';
  panelKey = key;
  const h = (text) => { const e = doc.createElement('h3'); e.textContent = text; return e; };
  if (recap) {
    panel.append(h('The breach is over'));
    for (const line of [recap.title, `Time: ${recap.time} - ${recap.why}`, `Reliquaries opened: ${recap.why === 'home' || recap.why === 'last' ? recap.reliquaries : 0}`, ...recap.circles, recap.company, recap.vestiges.length ? `Vestiges: ${recap.vestiges.join(', ')}` : '']) {
      if (!line) continue;
      const p = doc.createElement('div'); p.className = 'eg-note'; p.style.whiteSpace = 'pre-line'; p.textContent = line; panel.append(p);
    }
  }
  if (model?.offer) {
    panel.append(h(`A Vestige${model.offer.n > 1 ? ` - take ${model.offer.n}` : ''} (keys 1-${model.offer.cards.length})`));
    const row = doc.createElement('div'); row.className = 'eg-cards';
    for (const c of model.offer.cards) {
      const b = doc.createElement('button');
      const t = doc.createElement('b'); t.textContent = `${c.key}. ${c.name}`;
      const s = doc.createElement('small'); s.textContent = c.line;
      b.append(t, s);
      b.addEventListener?.('click', () => onPick(c.card));
      row.append(b);
    }
    panel.append(row);
    if (model.offer.surplus > 0) {
      const sr = doc.createElement('div'); sr.className = 'eg-cards eg-ask';
      for (const [use, label] of /** @type {[number, string][]} */ ([[0, `Spend a Surplus: a fourth card (${model.offer.surplus})`], [1, 'Spend a Surplus: reroll']])) { const b = doc.createElement('button'); b.textContent = label; b.addEventListener?.('click', () => onSurplus(use)); sr.append(b); }
      panel.append(sr);
    }
  }
  for (const a of model?.asks ?? []) {
    const box = doc.createElement('div'); box.className = 'eg-ask';
    const t = h(a.title); const left = doc.createElement('span'); left.setAttribute('data-left', a.q); left.textContent = `${Math.ceil(a.left / 1000)}s`; t.append(' - ', left);
    box.append(t);
    const row = doc.createElement('div'); row.className = 'eg-cards';
    a.opts.forEach((label, y) => { const b = doc.createElement('button'); b.textContent = `${a.mine === y ? '> ' : ''}${label}`; b.addEventListener?.('click', () => onVote(a.q, y)); row.append(b); });
    box.append(row);
    panel.append(box);
  }
  const note = doc.createElement('div'); note.className = 'eg-note'; note.textContent = recap ? 'Press Enter to close.' : 'Y/N answers a yes-or-no choice; /breach pick, /breach vote work in chat.';
  panel.append(note);
  (doc.body ?? doc.documentElement)?.append(panel);
}

/** The page is going (a test's reset): the nodes leave with it. */
export function destroyEgHud() {
  root?.remove?.(); panel?.remove?.();
  root = null; parts = null; panel = null; panelKey = '';
  shown = SHOWN();
}
