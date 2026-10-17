// @ts-check
// THE FLEET PAGE (HOLDINGS, 2026-10-03 - bible/03-World/Holdings.md; Mac: "Ships show their values, current health, and
// option to repair if theres crew (even if youre away) etc"). On the pause menu's Holdings rail (ui/enhanced/enhancedMenu.js
// pauseHoldings): every ship the player holds, a card each -
//  - her name (her captain's, else her hull's), her hull and rig, her worth, the bank's claim on her while it stands;
//  - where she is: at the player's helm, lying near, afloat how far and which way, laid up at a port, in the pack;
//  - her hull, her canvas and her crew against their whole, a wreck, a fire, her carpenter's stores;
//  - her refits, and the acts: SUMMON (brought round to a port's quay), SEND AWAY (she sails for a port and is laid
//    up), REPAIR (her hands, wherever she lies - with stores aboard), SHIPWRIGHT (the yard's window, at a port), REFIT
//    (her four lines, timber, iron and pitch and gold - none while her loan stands), RENAME (the name every other
//    player reads over her) and COLOURS (SHIP-COLOURS: the flag she flies - its shape, its field and division, its
//    border, its device and that device's colour, or her captain's guild's arms - bible/03-World/Naval-Refit.md).
// Each act's word is said under her card. The model and the acts are the host's (scenes/fleetHost.js), through the
// Holdings provider (ui/holdingsPages.js setHoldingsProvider); dressed by the kit's roles as the Stable's cards are.

import { holdingsProvider, ensureHoldingsStyle, holdingArt, holdingMeter, farWords } from './holdingsPages.js';
import { SHIP_NAME_MAX, UPGRADE_LINES } from '../systems/fleet.js';
import { CREW_ROLES, veteranOf, postsOf, postWords } from '../systems/naval/shipCrew.js';   // CAPT-CREW: a hand's rank, his post's worth
import { HERALDRY_COLOURS, HERALDRY_DEVICES, HERALDRY_DIVISIONS, HERALDRY_DIVISION_NAMES, heraldryDeviceName, heraldryOf } from '../net/heraldryLaw.js';   // SHIP-COLOURS
import { FLAG_SHAPES, FLAG_DEFAULT, fitFlag, flownFlag } from '../systems/naval/shipFlag.js';   // SHIP-COLOURS: her flag's law
import { flagSvg } from './flagArt.js';   // SHIP-COLOURS: and its picture
import { t } from '../systems/textManager.js';   // SHIP-COLOURS: the designer's words in the player's language

export const FLEET_PAGE_SECTIONS = Object.freeze([Object.freeze(['fleet', 'Fleet'])]);
/** Come Sail Away's two items' pictures: a deed's (209/5) for a ship whose title is held, her parts' (212/11) packed. */
export const DEED_ART = Object.freeze({ archive: 209, record: 5 });
export const PARTS_ART = Object.freeze({ archive: 212, record: 11 });
const NUMERALS = Object.freeze(['-', 'I', 'II', 'III']);
/** The page stands while the host gives the fleet (Come Sail Away running in the world host). */
export const fleetPageShown = () => !!holdingsProvider()?.fleet;

const fleet = () => holdingsProvider()?.fleet ?? null;
let _said = null;   // { uid, ok, text } - the last act's word, under its card
let _open = null;   // { uid, panel: 'refit'|'rename'|'crew' } - the one panel open
let _draft = '';
let _flag = null;   // SHIP-COLOURS: the colours panel's design, while it is open

/** Where she is, as a chip's word and a line. Pure. */
/** QUAYS: a port's quay in words - "Wayrest's quay", or "a quay" for one with no name. */
const quayWords = (port) => (port ? `${port}'s quay` : 'a quay');
export function whereWords(s) {
  switch (s.where) {
    case 'sailing': return { state: 'At your helm', tone: '', line: 'You stand at her helm.' };
    // QUAYS: made fast at a port's quay - where she is shown, her own place; afar, the last the Fleet heard of her
    case 'here': return s.docked != null ? { state: 'Made fast', tone: '', line: `Made fast at ${quayWords(s.docked)}, ${farWords(s.metres)}.` } : { state: 'Afloat', tone: '', line: `Lying ${farWords(s.metres)}.` };
    case 'away':
      if (s.docked != null) return { state: 'Made fast', tone: 'is-away', line: `Made fast at ${quayWords(s.docked)}${s.metres == null ? '' : `, ${farWords(s.metres)}${s.way ? ` to the ${s.way}` : ''}`}.` };
      return { state: 'Afloat', tone: 'is-away', line: s.metres == null ? 'Afloat far from here.' : `Afloat ${farWords(s.metres)}${s.way ? ` to the ${s.way}` : ''}.` };
    case 'laidup': return { state: 'Laid up', tone: 'is-away', line: s.port ? `Laid up at ${s.port} - she is brought round to any port you call her at.` : 'Laid up - she is brought round to any port you call her at.' };
    case 'packed': return { state: 'Packed', tone: 'is-away', line: 'Her parts are in your pack - use them to launch her.' };
    default: return { state: 'Lost', tone: 'is-lost', line: '' };
  }
}
const goldWords = (n) => `${Math.round(n).toLocaleString('en-US')} gold`;
/** Her refits as a line ("Hold II - Rigging I"), or null with none. */
export function refitLine(upgrades) {
  const parts = UPGRADE_LINES.filter((l) => (upgrades?.[l.id] | 0) > 0).map((l) => `${l.label} ${NUMERALS[upgrades[l.id]] ?? upgrades[l.id]}`);
  return parts.length ? parts.join(' · ') : null;
}

function button(el, label, why, onClick, cls = 'act') {
  const b = el('button', cls, label);
  if (why) { b.title = why; b.setAttribute('aria-disabled', 'true'); }
  b.onclick = onClick;
  return b;
}

function refitPanel(el, s, rerender, act) {
  const o = fleet()?.offer?.(s.uid);
  const box = el('div', 'hld-text');
  if (!o) return box;
  if (o.why) box.append(el('span', 'hld-why', o.why));
  // what the player holds of each material the next refits ask (the pack and her hold), and where the short ones are found
  const kinds = new Map();
  for (const r of o.rows) for (const m of r.next?.mats ?? []) if (!kinds.has(m.kind)) kinds.set(m.kind, m);
  if (kinds.size) {
    box.append(el('span', 'hld-sub', `You hold ${[...kinds.values()].map((m) => `${m.have} ${m.label}`).join(', ')} (your pack and her hold), and ${goldWords(o.gold)}.`));
    for (const m of kinds.values()) if (m.have < Math.min(...o.rows.flatMap((r) => (r.next?.mats ?? []).filter((x) => x.kind === m.kind).map((x) => x.n)))) box.append(el('span', 'hld-why', `${m.label}: ${m.hint}.`));
  }
  for (const r of o.rows) {
    const t = el('div', 'hld-refit');
    const head = el('div', 'hld-head');
    head.append(el('span', 'hld-name', r.tier ? `${r.label} ${NUMERALS[r.tier]}` : r.label), el('span', 'hld-state', r.tier >= r.max ? 'Done' : `${r.tier} of ${r.max}`));
    t.append(head, el('span', 'hld-sub', `${r.what}: +${Math.round(r.per * 100)}% a refit${r.tier ? ` (+${Math.round(r.per * r.tier * 100)}% now)` : ''}.`));
    if (r.next) {
      t.append(el('span', 'hld-sub', `Next: ${goldWords(r.next.gold)}, ${r.next.mats.map((m) => `${m.n} ${m.label}`).join(', ')}.`));
      const acts = el('div', 'hld-acts');
      acts.append(button(el, 'Refit', o.why ?? (r.afford ? null : 'You lack what the shipwright asks'), () => act('refit', r.id), 'act primary'));
      t.append(acts);
    }
    box.append(t);
  }
  return box;
}

/** CAPT-CREW: a hand's line under his name - his rank of service, what he has stood, and what his post is worth to her while
 *  he is its best holder ("Veteran - 9 fights won, 2 boardings - the guns reload 10% quicker"). Pure. */
export function handService(h, holds = false) {
  const v = veteranOf(h);
  const deeds = [h.fights ? `${h.fights} fight${h.fights === 1 ? '' : 's'} won` : '', h.boardings ? `${h.boardings} boarding${h.boardings === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ');
  const worth = holds ? postWords(h.role, v.tier) : '';
  return [v.label, deeds, worth].filter(Boolean).join(' - ');
}

/** HOLDINGS: her named hands, each with his post - a list of CREW_ROLES (and a Bard's calling, his) to give him another.
 *  Each keeps his post's place on her deck (crewLife.js ROLE_POSTS); her Lookout her bow; one First Mate, who answers. */
function crewPanel(el, s, act) {
  const box = el('div', 'hld-text');
  if (!s.hands?.length) { box.append(el('span', 'hld-sub', 'She has no hands aboard - hire them at a shipwright.')); return box; }
  box.append(el('span', 'hld-sub', 'Each keeps his post on her deck: her First Mate by the helm, her Bosun at the mainmast, her Carpenter by the hatch, her Cook at the galley, her Gunners at the guns, her Lookout at the bow. With no Lookout named, a hand with no post keeps the bow, else a Gunner. A post is worth more in a seasoned hand - fights and boardings make him Seasoned, a Veteran, an Old Salt. A small crew is dealt the first posts - a Bosun, a Gunner, a Carpenter - so name her Lookout and her Cook here.'));   // AUDIT CAPTAIN'S SEA C7
  const posts = postsOf(s.hands, new Set(s.hands.filter((h) => h.ashore).map((h) => h.name)));   // CAPT-CREW: each post's best holder aboard - the hand whose worth she sails on (AUDIT CAPTAIN'S SEA C2: none ashore with me)
  for (const h of s.hands) {
    const row = el('div', 'hld-refit hld-hand');
    const head = el('div', 'hld-head');
    head.append(el('span', 'hld-name', h.name), el('span', 'hld-state', h.role));
    row.append(head);
    row.append(el('span', 'hld-sub', `${handService(h, posts[h.role]?.name === h.name)}${h.ashore ? ' - ashore with you' : ''}`));
    const pick = /** @type {HTMLSelectElement} */ (el('select', 'hld-field hld-select'));
    pick.setAttribute('aria-label', `${h.name}'s post`);
    for (const role of [...CREW_ROLES.filter((r) => !(h.bard && r === 'Lookout')), ...(h.bard ? ['Bard'] : [])]) {   // AUDIT HOLDINGS C3: a Bard keeps no lookout
      const o = /** @type {HTMLOptionElement} */ (el('option', null, role));
      o.value = role;
      if (role === h.role) o.selected = true;
      pick.append(o);
    }
    pick.value = h.role;
    pick.onchange = () => act('role', { name: h.name, role: pick.value });
    row.append(pick);
    box.append(row);
  }
  return box;
}

function renamePanel(el, s, rerender, act) {
  const box = el('div', 'hld-text');
  const field = /** @type {HTMLInputElement} */ (el('input', 'hld-field'));
  field.type = 'text';
  field.maxLength = SHIP_NAME_MAX;
  field.value = _draft;
  field.placeholder = s.hullName;
  field.setAttribute('aria-label', 'Her name');
  field.oninput = () => { _draft = field.value; };
  const save = () => { _open = null; act('rename', _draft); };
  field.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } };
  const acts = el('div', 'hld-acts');
  const ok = el('button', 'act primary', 'Name her');
  ok.onclick = save;
  const no = el('button', 'act', 'Keep');
  no.onclick = () => { _open = null; rerender(); };
  acts.append(ok, no);
  box.append(el('span', 'hld-sub', 'Every player who sees her reads this name over her. Leave it empty for her hull\'s.'), field, acts);
  return box;
}

// ── SHIP-COLOURS: THE COLOURS PANEL ─────────────────────────────────────────────────────────────────────────────────
const SHAPE_WORDS = Object.freeze({
  flag: () => t('naval.flag.shape.flag', 'Flag'), swallowtail: () => t('naval.flag.shape.swallowtail', 'Swallowtail'),
  pennant: () => t('naval.flag.shape.pennant', 'Pennant'), burgee: () => t('naval.flag.shape.burgee', 'Burgee'),
});
const colourName = (k) => HERALDRY_COLOURS.find((c) => c.key === k)?.name ?? '';
/** A row of the heraldry's sixteen colours (and None where `none`), the one chosen ringed and named - UI-CALM's selector. */
function flagSwatches(el, word, current, choose, { none = false, not = [] } = {}) {
  const row = el('div', 'hld-pick');
  row.append(el('span', 'hld-picklabel', word));
  const set = el('div', 'hld-swatches');
  set.setAttribute('role', 'radiogroup');
  set.setAttribute('aria-label', word);
  const swatch = (key, hex, name) => {
    const b = el('button', `hld-swatch${key === current ? ' on' : ''}${key == null ? ' hld-swatch-none' : ''}`);
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', key === current ? 'true' : 'false');
    b.setAttribute('aria-label', name);
    b.title = name;
    if (hex && b.style) b.style.setProperty?.('--sw', hex);
    b.onclick = () => choose(key);
    set.append(b);
  };
  if (none) swatch(null, null, t('naval.flag.none.colour', 'None'));
  for (const c of HERALDRY_COLOURS) if (!not.includes(c.key)) swatch(c.key, c.hex, c.name);
  row.append(set, el('span', 'hld-pickname', current == null ? t('naval.flag.none.colour', 'None') : colourName(current)));
  return row;
}
/** A stepper over `list` (‹ the one chosen ›) - a shape, a division, a device. */
function flagStepper(el, word, list, current, nameOf, choose) {
  const row = el('div', 'hld-pick');
  row.append(el('span', 'hld-picklabel', word));
  const i = Math.max(0, list.indexOf(current)), n = list.length;
  const step = (d, glyph, aria) => {
    const b = el('button', 'hld-step', glyph);
    b.setAttribute('aria-label', aria);
    b.onclick = () => choose(list[((i + d) % n + n) % n]);
    return b;
  };
  row.append(step(-1, '\u2039', `${word}: ${t('naval.flag.previous', 'previous')}`), el('span', 'hld-pickname hld-stepname', nameOf(current)), step(1, '\u203a', `${word}: ${t('naval.flag.next', 'next')}`));
  return row;
}
/**
 * HER COLOURS: the flag she will fly, drawn as it flies (ui/flagArt.js), and its choices - each change made a flag at once
 * (systems/naval/shipFlag.js fitFlag: a choice that clashes with one made before it put right). FLY MY GUILD'S ARMS while
 * the guild has arms (`arms`): the flag flies them in its shape, its own colours set aside. Hoist, strike or close.
 */
function coloursPanel(el, s, rerender, act, arms) {
  const box = el('div', 'hld-text hld-colours');
  const d = fitFlag(_flag ?? s.colours ?? FLAG_DEFAULT);
  const set = (k, v) => { _flag = { ...d, [k]: v }; rerender(); };   // made a flag as it is drawn (`d`)
  const pic = el('div', 'hld-flag');
  pic.setAttribute('aria-label', t('naval.flag.preview', 'Her flag, as she will fly it'));
  pic.innerHTML = flagSvg(flownFlag(d, arms), { width: 150 });
  box.append(pic);
  const armed = !!heraldryOf(arms);
  box.append(flagStepper(el, t('naval.flag.shape', 'Shape'), FLAG_SHAPES, d.shape, (k) => SHAPE_WORDS[k](), (v) => set('shape', v)));
  const guild = el('div', 'hld-acts');
  guild.append(button(el, d.guild && armed ? t('naval.flag.guildOn', 'Flying your guild\'s arms') : t('naval.flag.guildOff', 'Fly my guild\'s arms'),
    armed ? null : t('naval.flag.noArms', 'Your guild has no arms to fly - or you are of no guild.'), () => { if (armed) set('guild', !d.guild); }, d.guild && armed ? 'act primary' : 'act'));
  box.append(guild);
  if (d.guild && armed) box.append(el('span', 'hld-sub', t('naval.flag.guildNote', 'She flies your guild\'s arms in this shape, and follows them when they change.')));
  else {
    box.append(flagSwatches(el, t('naval.flag.field', 'Field'), d.field, (v) => set('field', v)));
    box.append(flagStepper(el, t('naval.flag.division', 'Division'), HERALDRY_DIVISIONS, d.division, (k) => HERALDRY_DIVISION_NAMES[k] ?? k, (v) => set('division', v)));
    if (d.division !== 'plain') box.append(flagSwatches(el, t('naval.flag.field2', 'Second colour'), d.field2, (v) => set('field2', v), { not: [d.field] }));
    box.append(flagSwatches(el, t('naval.flag.border', 'Border'), d.border, (v) => set('border', v), { none: true, not: [d.field] }));
    box.append(flagStepper(el, t('naval.flag.device', 'Device'), [null, ...HERALDRY_DEVICES], d.device, (k) => (k ? heraldryDeviceName(k) : t('naval.flag.none.device', 'None')), (v) => set('device', v)));
    if (d.device) box.append(flagSwatches(el, t('naval.flag.charge', 'Device colour'), d.charge, (v) => set('charge', v), { not: [d.field, d.field2].filter(Boolean) }));
  }
  const acts = el('div', 'hld-acts');
  acts.append(button(el, t('naval.flag.hoist', 'Hoist her colours'), null, () => { _open = null; _flag = null; act('colours', d); }, 'act primary'));
  if (s.colours) acts.append(button(el, t('naval.flag.strike', 'Strike her flag'), null, () => { _open = null; _flag = null; act('colours', null); }));
  acts.append(button(el, t('naval.flag.close', 'Close'), null, () => { _open = null; _flag = null; rerender(); }));
  box.append(acts);
  return box;
}

function shipCard(el, s, { rerender, meter, door, arms = null }) {
  const item = el('div', 'hld-row');
  item.append(holdingArt(el, s.where === 'packed' ? PARTS_ART : DEED_ART, '⚓', rerender));
  const text = el('div', 'hld-text');
  const head = el('div', 'hld-head');
  const w = whereWords(s);
  head.append(el('span', 'hld-name', s.label), el('span', `hld-state${w.tone ? ` ${w.tone}` : ''}`, w.state));
  text.append(head);
  text.append(el('span', 'hld-sub', [s.name ? `${s.hullName}` : null, `worth ${goldWords(s.value)}`, s.loan ? `the bank is owed ${goldWords(s.loan.owed)}` : null].filter(Boolean).join(' · ')));
  if (w.line) text.append(el('span', 'hld-sub', w.line));
  const st = s.status;
  if (st) {
    text.append(holdingMeter(el, meter, 'Hull', st.hull, st.maxHull, st.hull < st.maxHull * 0.35 ? 'blood' : 'verdigris'));
    if (st.maxSail > 0) text.append(holdingMeter(el, meter, 'Canvas', st.sail, st.maxSail, 'thin'));
    if (s.crewed) text.append(holdingMeter(el, meter, 'Crew', st.crew, st.maxCrew, 'thin'));
    const notes = [st.wrecked ? 'Crippled' : null, st.fire ? 'On fire' : null, s.crewed || st.stores ? `${st.stores} carpenter's store${st.stores === 1 ? '' : 's'} aboard` : null].filter(Boolean);
    if (notes.length) text.append(el('span', st.wrecked || st.fire ? 'hld-why' : 'hld-sub', notes.join(' · ')));
  }
  const refits = refitLine(s.upgrades);
  if (refits) text.append(el('span', 'hld-sub', `Refits: ${refits}`));
  if (_said?.uid === s.uid) text.append(el('span', _said.ok ? 'hld-said' : 'hld-why', _said.text));
  const act = (verb, arg) => {
    const r = fleet()?.act?.(s.uid, verb, arg) ?? { ok: false, text: 'Not here.' };
    _said = { uid: s.uid, ok: r.ok, text: r.text };
    if (r.ok && typeof r.door === 'function') { door?.(r.door); return; }
    rerender();
  };
  const acts = el('div', 'hld-acts');
  const c = s.can ?? {};
  if (s.where === 'laidup' || s.where === 'away') acts.append(button(el, 'Summon', c.summon, () => act('summon'), 'act primary'));
  if (s.where === 'here' || s.where === 'away') acts.append(button(el, 'Send away', c.away, () => act('away')));
  if (s.crewed && s.where !== 'packed') acts.append(button(el, 'Repair', c.repair, () => act('repair')));
  if (s.where !== 'packed' && s.where !== 'away') acts.append(button(el, 'Shipwright', c.yard, () => act('yard')));
  if (s.hold) acts.append(button(el, 'Hold', null, () => act('hold')));   // CARGO-ANYWHERE: her hold, wherever she lies
  acts.append(button(el, _open?.uid === s.uid && _open.panel === 'refit' ? 'Close refits' : 'Refit', null, () => { _open = _open?.uid === s.uid && _open.panel === 'refit' ? null : { uid: s.uid, panel: 'refit' }; rerender(); }));
  acts.append(button(el, 'Rename', null, () => { _open = { uid: s.uid, panel: 'rename' }; _draft = s.name ?? ''; _said = null; rerender(); }));
  if (s.crewed && s.where !== 'packed') acts.append(button(el, _open?.uid === s.uid && _open.panel === 'crew' ? 'Close crew' : 'Crew', null, () => { _open = _open?.uid === s.uid && _open.panel === 'crew' ? null : { uid: s.uid, panel: 'crew' }; rerender(); }));
  // SHIP-COLOURS: her flag - every hull with a masthead
  if (s.flag) acts.append(button(el, t('naval.flag.open', 'Colours'), null, () => { const open = _open?.uid === s.uid && _open.panel === 'colours'; _open = open ? null : { uid: s.uid, panel: 'colours' }; _flag = open ? null : s.colours ?? null; _said = null; rerender(); }));
  text.append(acts);
  if (_open?.uid === s.uid) text.append(_open.panel === 'refit' ? refitPanel(el, s, rerender, act) : _open.panel === 'crew' ? crewPanel(el, s, act) : _open.panel === 'colours' ? coloursPanel(el, s, rerender, act, arms) : renamePanel(el, s, rerender, act));
  item.append(text);
  return item;
}

/**
 * THE PAGE: `detail` the rail's detail pane; `kit` the menu's makers ({ el, divider, meter }) and its `door(fn)` - a
 * window opened over the world as the pause goes down (the yard's, the water's placing click).
 */
export function drawFleetPage(detail, rerender, { el, divider, meter = null, door = null } = /** @type {any} */ ({})) {
  ensureHoldingsStyle();
  const m = fleet()?.model?.() ?? { ships: [], gold: 0, atPort: false };
  detail.append(divider(`Fleet (${m.ships.length})`));
  if (!m.ships.length) {
    detail.append(el('p', 'px-note', 'You hold no ship. A port\'s shipyard sells them - a ship\'s title comes here, and she lies laid up where you bought her - and a ship taken by boarding can be claimed as yours.'));   // AUDIT SHIPYARDS L7-1: no general store sells one
    return;
  }
  const list = el('div', 'hld-list');
  for (const s of m.ships) list.append(shipCard(el, s, { rerender, meter, door, arms: m.guildArms ?? null }));
  detail.append(list);
  detail.append(el('p', 'hld-foot', m.atPort
    ? 'You are at a port: a ship summoned is brought round to its quay, and its shipwright repairs and refits.'
    : 'Summon a ship and refit her at a port. Her hands mend her wherever she lies, with carpenter\'s stores aboard.'));
}

/** A visit's words forgotten (an act's answer, an open panel) - the pause menu's every mount. */
export function resetFleetPage() { _said = null; _open = null; _draft = ''; _flag = null; }
