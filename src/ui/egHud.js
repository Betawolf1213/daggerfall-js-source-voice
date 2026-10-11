// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 6, 7 and 21): AN ELITE BREACH'S
// TRACKER - one panel at the screen's right that says where the breach stands: outside it, the call (who opened it, when
// it opens, how long it takes members, how to answer); inside it, THE COUNT (red under five minutes, gold while it
// holds), the circle and the hall with its name, what the hall asks of the company now (its stage's words and the time
// it gives), and how many of the company still stand.
//
// A READOUT, NOT A WINDOW (the gate banner's law, ui/gateBanner.js): no click, no overlay stack, one node made on the
// first word and UPDATED, NOT REBUILT - each line written only when it changes - hidden (never removed) when there is
// nothing to show, and hidden with the HUD.
//
// `egHudModel` is pure - the breach's state (net/egLink.js), my account, the relay's clock and where I stand in, what the
// panel says out; the pins read it.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { egHallOf, egCircleOfHall, egSlotOfHall, egPhase, egTimes, egCountText, EG_TEXT, EG_COUNT_START_MS } from '../net/egLaw.js';
import { egCountAt, egLivingCount } from '../net/egLink.js';
import { injectEnhancedFonts } from './enhancedStyle.js';

/** Under this, THE COUNT burns red (ms). */
export const EG_HUD_LOW_MS = 5 * 60_000;
export const EG_HUD_STYLE_ID = 'dagger-eg-hud-style';
export const EG_HUD_CSS = `
.eg-hud { position: fixed; right: 16px; top: 30%; width: min(300px, 70vw); box-sizing: border-box; pointer-events: none; z-index: 30;
  padding: 10px 14px 11px; border: 1px solid rgba(214,170,92,0.55); border-radius: 3px;
  background: linear-gradient(180deg, rgba(18,12,10,0.82), rgba(10,7,6,0.72)); box-shadow: 0 0 18px rgba(0,0,0,0.65);
  font: 600 14px 'Cormorant', Georgia, serif; color: #f1dcc2; text-shadow: 0 0 3px #000; }
.eg-hud-kicker { font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase; color: #d6aa5c; }
.eg-hud-title { font-size: 18px; line-height: 1.15; margin-top: 2px; color: #ffe9cf; }
.eg-hud-count { font: 700 26px 'Cormorant', Georgia, serif; letter-spacing: 0.06em; margin-top: 4px; color: #ffe9cf; }
.eg-hud-count.held { color: #e8c473; }
.eg-hud-count.low { color: #ff6a4a; text-shadow: 0 0 4px #000, 0 0 12px rgba(255,60,30,0.6); }
.eg-hud-count:empty { display: none; }
.eg-hud-line { font-size: 15px; line-height: 1.25; margin-top: 5px; }
.eg-hud-sub { font-size: 13px; line-height: 1.25; margin-top: 3px; color: #cdb79e; }
.eg-hud-sub:empty, .eg-hud-company:empty { display: none; }
.eg-hud-company { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 7px; color: #b9a084; }
@media (max-width: 640px) { .eg-hud { top: 22%; right: 8px; padding: 7px 10px 8px; } .eg-hud-title { font-size: 15px; } .eg-hud-count { font-size: 21px; } .eg-hud-line { font-size: 13px; } }
`;

const ms = (v) => egCountText(Math.max(0, v));
/** A stage's words, by the hall's kind where it matters. */
function stageLines(E, spec, now) {
  const left = E.su > 0 ? E.su - now : 0;
  switch (E.sg) {
    case 'wait': return { line: EG_TEXT.sealed(ms(left)), sub: 'Gather your company.' };
    case 'arrive': return { line: 'Gather on the arrival plate.', sub: left > 0 ? `The hall wakes in ${ms(left)}.` : '' };
    case 'trial': return { line: spec?.objective ?? '', sub: spec?.kind === 'court' && !(E.fight?.hp > 0 && (E.fight?.atk || E.fight?.move)) ? 'Step into the ring to wake its lord.' : '' };
    case 'closing': return { line: `${EG_TEXT.door} Step through the door.`, sub: left > 0 ? `${EG_TEXT.pulled.replace('.', '')} in ${ms(left)}.` : '' };
    case 'rest': return { line: `${EG_TEXT.redoubt(E.rd)} - ${EG_TEXT.rest}`, sub: left > 0 ? `${EG_TEXT.descend.replace('.', '')} in ${ms(left)} - or take the way home.` : '' };
    case 'end': return { line: EG_TEXT.ended, sub: '' };
    default: return { line: '', sub: '' };
  }
}

/**
 * What the tracker says now, or null. `inSpire` whether a circle of this breach stands under me. Pure.
 * @param {any} E net/egLink.js's state @param {string|null} me @param {number} now @param {{ inSpire?: boolean }} where
 */
export function egHudModel(E, me, now, { inSpire = false } = {}) {
  if (!E) return null;
  if (inSpire && E.b) {
    const spec = E.h > 0 ? egHallOf(E.seed, E.h) : null;
    const left = E.wk > 0 ? egCountAt(E, now) : EG_COUNT_START_MS;
    const { line, sub } = stageLines(E, spec, now);
    const n = E.co.length, standing = egLivingCount(E);
    return {
      kicker: E.rh ? `${EG_TEXT.name} - Rehearsal` : EG_TEXT.name,
      title: spec ? `Circle ${egCircleOfHall(E.h)} - Hall ${egSlotOfHall(E.h)}: ${spec.name}` : 'The Battlespire',
      count: E.sg === 'end' ? '' : ms(left), countCls: E.sg === 'end' ? '' : E.ca > 0 ? (left < EG_HUD_LOW_MS ? 'low' : '') : 'held',
      line, sub, company: n > 1 ? `${standing} of ${n} standing` : '',
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
    company: c.co.length > 1 ? `Company of ${c.co.length}` : '',
  };
}

let root = null, parts = null;
const SHOWN = () => ({ vis: '', kicker: null, title: null, count: null, countCls: null, line: null, sub: null, company: null });
let shown = SHOWN();

function build(doc) {
  if (doc.getElementById && !doc.getElementById(EG_HUD_STYLE_ID)) {
    const st = doc.createElement('style');
    st.id = EG_HUD_STYLE_ID;
    st.textContent = EG_HUD_CSS;
    (doc.head ?? doc.body)?.append(st);
    if (doc.head) injectEnhancedFonts(doc);
  }
  const part = (cls) => { const n = doc.createElement('div'); n.className = cls; return n; };
  root = part('eg-hud');
  root.setAttribute?.('aria-live', 'polite');
  parts = { kicker: part('eg-hud-kicker'), title: part('eg-hud-title'), count: part('eg-hud-count'), line: part('eg-hud-line'), sub: part('eg-hud-sub'), company: part('eg-hud-company') };
  root.append(parts.kicker, parts.title, parts.count, parts.line, parts.sub, parts.company);
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
  for (const k of ['kicker', 'title', 'count', 'line', 'sub', 'company']) if (model[k] !== shown[k]) { shown[k] = model[k]; parts[k].textContent = model[k]; }
  if (model.countCls !== shown.countCls) { shown.countCls = model.countCls; parts.count.className = `eg-hud-count${model.countCls ? ` ${model.countCls}` : ''}`; }
}

/** The page is going (a test's reset): the node leaves with it. */
export function destroyEgHud() {
  root?.remove?.();
  root = null; parts = null;
  shown = SHOWN();
}
