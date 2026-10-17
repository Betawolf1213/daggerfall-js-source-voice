// @ts-check
// GROWTH1 (2026-10-17, the owner: "instead of having ascend in one place and the firmament trees in another (including
// the new naval tree), I want to give the firmament, level up page, and specializations its own tab within the pause
// menu"; asked: "Growth", the skies "drawn in the tab", the old doors moved, the classic skin let in; bible/10-UI/
// Growth.md) - THE GROWTH TAB of the pause window (ui/enhanced/enhancedMenu.js PAUSE_TABS): one rail for how a character
// grows -
//   Level            the Ascension (ui/enhanced/enhancedLevelUp.js) drawn in the pane: a level owed spent here, else
//                    the view of its stars (ASCEND-ANYTIME's) - was the Stats page's Ascend button and F5's level-up
//   Specialisations  the guide to both families' thirty paths (ui/growth/specGuide.js) - was two cards on Master Skills
//   Firmament        the online sky (ui/firmamentWindow.js) drawn in the pane - was the Stats page's Firmament button;
//                    offline, the page says what it is and why it waits
//   Captain's Stars  the captain's sky (ui/captainTreeWindow.js) drawn in the pane, where there are ships to captain -
//                    was the Holdings Captain page's "Open the stars"
//   Revenant Stars   GROWTH5 (the owner: "add a section for the upcoming revenant tree"): each sworn revenant's sky
//                    (RVN-STARS, ui/revenantStarsWindow.js) drawn in the pane, one at a time, while one is sworn - was
//                    the Holdings Companions page's Stars, which leads here now
// The rail's journal bones are the Holdings and Family tabs' (PX6). The page this visit stands on, the guide's choices
// and the face on the stage (ui/growth/growthStage.js) are this module's; the window resets them on every mount and
// drops the face when the tab or the window goes.

import { drawSpecGuide, resetSpecGuide, specGuideModel, SPEC_GUIDE_CSS } from './specGuide.js';
import { drawStage, dropStage, stageBack, stageAsks, stageLive, STAGE_CSS } from './growthStage.js';
import { firmamentBook } from '../../net/firmament/firmamentBook.js';
import { t } from '../../systems/textManager.js';
import { usesVirtueLeveling } from '../../systems/oblivionLeveling.js';   // ORL1: which bar the view of the stars reads
import { GROWTH_PAGE_SECTIONS, SPEC_LANDINGS, growthPageAt } from './growthPages.js';   // the leaf the boot doors read
import { retinue } from '../../systems/revenant/revenantCompanions.js';   // GROWTH5: the sworn revenants
import { rvnStarsOf } from '../../systems/revenant/revenantStars.js';   // GROWTH5: each one's level and points

export { GROWTH_PAGE_SECTIONS, growthPageAt };

/** The rail's words in the player's language. */
const LABEL = Object.freeze({
  level: () => t('growth.rail.level', 'Level'),
  specs: () => t('growth.rail.specs', 'Specialisations'),
  firmament: () => t('growth.rail.firmament', 'Firmament'),
  captain: () => t('growth.rail.captain', 'Captain\'s Stars'),
  revenants: () => t('growth.rail.revenants', 'Revenant Stars'),
});

let sec = 'level';
/** GROWTH5: the sworn revenant whose sky the Revenant Stars page shows (null: the first with stars to set). */
let rvn = /** @type {string|null} */ (null);
/** A new visit (the window mounted): its landing's page, the guide fresh, no face up. */
export function resetGrowthTab(at = null) {
  const fam = Object.hasOwn(SPEC_LANDINGS, at ?? '') ? SPEC_LANDINGS[at] : null;   // GROWTH4: a family's guide by name
  sec = fam ? 'specs' : GROWTH_PAGE_SECTIONS.some(([id]) => id === at) ? at : 'level';
  rvn = null;
  resetSpecGuide(fam);
  dropStage();
}
/** GROWTH5: the Revenant Stars page on sworn revenant `id` (the Companions page's Stars). */
export function setGrowthRevenant(id) { if (rvn !== id) dropStage(); rvn = id ?? null; }
/** The tab or the window left: the face goes (its pending stars with it - its own Escape asked first). */
export function releaseGrowthTab() { dropStage(); }
/** The page standing now. */
export const growthSection = () => sec;
/** Go to a page of the rail (another tab's door into it - the Master Skills page's to the guide). */
export function setGrowthSection(id) { if (GROWTH_PAGE_SECTIONS.some(([x]) => x === id)) { if (sec !== id) dropStage(); sec = id; } }
/** The window's Escape, ahead of its own back stack (growthStage.js stageBack): whether the tab took it. */
export function growthBack() { return stageBack(); }
/** GROWTH5: a press that leaves the face (another tab, the sheet's or the QuickDial's key) asks it first (stageAsks). */
export function growthAsks() { return stageAsks(); }

/** GROWTH5: the sworn revenants as the page reads them - `{ id, name, level, points, set, abroad }` each, in the
 *  Companions page's order (the highest rank first). Pure over the save's records. */
export function revenantGrowthModel() {
  return retinue().map((r) => ({ id: r.id, name: r.name, ...rvnStarsOf(r), abroad: r.companion?.state === 'errand' }));
}
/** The sworn revenants for `ctx` - its own (tests hand one), else the save's. */
const sworn = (ctx) => (typeof ctx?.revenants === 'function' ? ctx.revenants() : revenantGrowthModel());

/** The pages drawn for this host: the Captain's Stars where the host hands a captain's sky over (the world host, Come
 *  Sail Away on), the Revenant Stars while a revenant is sworn, every other always - a page with nothing to show says
 *  why. */
export function growthSections(ctx) {
  return GROWTH_PAGE_SECTIONS.filter(([id]) => (id !== 'captain' || typeof ctx?.captain?.stars === 'function') && (id !== 'revenants' || sworn(ctx).length > 0));
}

/** What waits on each page - the rail's mark: a level owed, the paths open, the captain's points unspent. Pure. */
export function growthDue(ctx) {
  const e = ctx?.entity;
  const due = { level: e?.readyToLevelUp ? 1 : 0, specs: 0, firmament: 0, captain: 0, revenants: 0 };
  if (e) for (const f of specGuideModel(e).families) due.specs += f.open;
  const s = ctx?.captain?.model?.()?.stars;
  if (s) due.captain = Math.max(0, (s.points ?? 0) - (s.set ?? 0));
  for (const r of sworn(ctx)) if (!r.abroad) due.revenants += Math.max(0, r.points - r.set);   // GROWTH5: abroad, its sky waits
  return due;
}

/**
 * THE TAB into `body`. `ctx` the window's: `{ el, divider, skillMeter, askCard, entity, render, hooks, captain,
 * openMaster }` - `hooks.ascendScreen()` the door's level-up screen (ui/charSheetDoor.js levelUpScreenFor), `captain`
 * the Holdings provider's (its `stars()` the captain's sky's deps, `model()` its level and points), `openMaster()` the
 * Stats tab's Master Skills page.
 */
export function drawGrowthTab(body, ctx) {
  ensureGrowthStyle();
  const { el } = ctx;
  const secs = growthSections(ctx);
  if (!secs.some(([id]) => id === sec)) sec = secs[0][0];
  const due = growthDue(ctx);
  const wrap = el('div', 'px-journal');
  const rail = el('div', 'px-qrail');
  for (const [id] of secs) {
    const b = el('button', `px-qrow${id === sec ? ' on' : ''}`);
    b.append(el('span', 'px-c', '◆'), document.createTextNode(LABEL[id]()));
    if (due[id]) b.append(el('span', 'gr-due', id === 'level' ? '!' : String(due[id])));
    b.onclick = () => { if (sec !== id && stageAsks()) return; if (sec !== id) dropStage(); sec = id; ctx.render(); };   // GROWTH5: unaccepted stars asked about once
    rail.append(b);
  }
  wrap.append(rail);
  const detail = el('div', 'px-qdetail px-sys gr-pane');
  ({ level: levelPage, specs: specsPage, firmament: firmamentPage, captain: captainPage, revenants: revenantsPage })[sec]?.(detail, ctx);
  // GROWTH3: a face on the stage takes the window's body - the rail a strip over it, the window nearly the screen's
  // (enhancedMenu.js pauseWindow's px-win-wide)
  if (stageLive()) wrap.classList.add('gr-faced');
  wrap.append(detail);
  body.append(wrap);
}

/** The stage's words. */
const stageWords = () => ({
  full: t('growth.stage.full', 'Full screen'), leave: t('growth.stage.leave', 'Leave full screen'),
  loading: t('growth.stage.loading', 'Loading...'), failed: t('growth.stage.failed', 'This page could not be loaded. Close the menu and try again.'),
  open: t('growth.stage.open', 'Open'),
});

// ── Level ───────────────────────────────────────────────────────────

function levelPage(detail, ctx) {
  const { el, divider, entity, hooks } = ctx;
  // a level owed is spent through the door's own rollout (ui/charSheetDoor.js levelUpScreenFor); a door that hands none
  // (or nothing owed) draws the view of the stars - the lazy chunk's own (levelUp/levelUpView.js viewOnlyScreen)
  const open = typeof hooks?.ascendScreen === 'function' ? hooks.ascendScreen : null;
  const owed = !!entity?.readyToLevelUp && !!open;
  if (!entity) { dropStage(); detail.append(divider(t('growth.level.title', 'Level')), el('p', 'px-note', t('growth.level.none', 'Your level isn\'t available here.'))); return; }
  drawStage(detail, `level:${owed ? 'owed' : 'view'}:${entity.level ?? 0}`, (host) => import('../enhanced/enhancedLevelUp.js').then(({ mountEnhancedLevelUp, viewOnlyScreen }) =>
    mountEnhancedLevelUp(host, { screen: (owed && open()) || viewOnlyScreen(entity, usesVirtueLeveling(entity)), entity, embed: true, onExit: () => { dropStage(); ctx.render(); } })), {
    el, ...stageWords(),
    lead: owed ? t('growth.level.owed', 'You have a level up waiting. Spend your points, then press Ascend. You can leave and come back - your points will wait.')
      : t('growth.level.view', 'Your attributes, skills and progress to the next level. When you level up, you spend your points here.'),
  });
}

// ── Specialisations ─────────────────────────────────────────────────

function specsPage(detail, ctx) {
  dropStage();
  drawSpecGuide(detail, ctx.render, { el: ctx.el, divider: ctx.divider, skillMeter: ctx.skillMeter, askCard: ctx.askCard, entity: ctx.entity, openMaster: ctx.openMaster });
}

// ── Firmament ───────────────────────────────────────────────────────

function firmamentPage(detail, ctx) {
  const { el, divider } = ctx;
  if (!firmamentBook()) {
    dropStage();
    detail.append(divider(t('growth.firm.title', 'Firmament')), el('p', 'gr-lead', t('growth.firm.offline', 'The Firmament is a tree of passive bonuses for online play. Choose a birthsign, then spend the stars you earn from Renown. It is only available online.')));
    return;
  }
  drawStage(detail, 'firmament', (host) => import('../firmamentWindow.js').then(({ mountFirmamentWindow }) =>
    mountFirmamentWindow(host, { embed: true })), { el, ...stageWords(), lead: t('growth.firm.lead', 'Passive bonuses for online play, bought with the stars you earn. Press Accept to keep your changes.') });
}

// ── Captain's Stars ─────────────────────────────────────────────────

function captainPage(detail, ctx) {
  const { el, divider, captain } = ctx;
  const deps = captain?.stars?.() ?? null;
  if (!deps?.ledger) { dropStage(); detail.append(divider(t('growth.captain.title', 'Captain\'s Stars')), el('p', 'px-note', t('growth.captain.none', 'Your captain\'s stars aren\'t available here.'))); return; }
  drawStage(detail, 'captain', (host) => import('../captainTreeWindow.js').then(({ mountCaptainTreeWindow }) =>
    mountCaptainTreeWindow(host, { ledger: deps.ledger, changed: deps.changed, embed: true })), {
    el, ...stageWords(),
    lead: t('growth.captain.lead', 'Master stars improve sailing, cargo and trade. Commander stars improve guns, boarding and ramming.'),
  });
}

// ── Revenant Stars (GROWTH5) ────────────────────────────────────────

function revenantsPage(detail, ctx) {
  const { el, divider } = ctx;
  const list = sworn(ctx);
  if (!list.length) { dropStage(); detail.append(divider(t('growth.rvn.title', 'Revenant Stars')), el('p', 'px-note', t('growth.rvn.none', 'No revenant is sworn to you.'))); return; }
  const pick = list.find((r) => r.id === rvn) ?? list.find((r) => !r.abroad && r.points > r.set) ?? list[0];
  rvn = pick.id;
  // one sworn revenant at a time: a press picks whose sky stands on the stage
  const row = el('div', 'gr-rvnpick');
  row.setAttribute('role', 'tablist');
  for (const r of list) {
    const b = el('button', 'gr-rvn');
    if (r.id === pick.id) b.classList.add('on');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', r.id === pick.id ? 'true' : 'false');
    const left = Math.max(0, r.points - r.set);
    b.append(el('span', 'gr-rvnname', r.name), el('span', 'gr-rvnsub', r.abroad ? t('growth.rvn.abroad', 'Level {level} · away', { level: r.level })
      : left ? t('growth.rvn.left', 'Level {level} · {n} to set', { level: r.level, n: left }) : t('growth.rvn.level', 'Level {level}', { level: r.level })));
    b.onclick = () => { if (rvn !== r.id) { if (stageAsks()) return; dropStage(); rvn = r.id; } ctx.render(); };
    row.append(b);
  }
  detail.append(row);
  drawStage(detail, `rvn:${pick.id}`, (host) => import('../revenantStarsWindow.js').then(({ mountRevenantStarsWindow }) =>
    mountRevenantStarsWindow(host, { id: pick.id, embed: true })), {
    el, ...stageWords(),
    lead: pick.abroad ? t('growth.rvn.leadAway', '{name} is away on a mission. You can change its stars when it returns.', { name: pick.name })
      : t('growth.rvn.lead', 'Each sworn revenant has its own stars. It gets one point per level after the first, and one per rank past the first.'),
  });
}

// ── the dress ───────────────────────────────────────────────────────

const GROWTH_STYLE_ID = 'growth-tab-style';
const GROWTH_CSS = `
.px-sys .gr-rvnpick { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px; }
.px-sys .gr-rvn { font: inherit; display: flex; flex-direction: column; align-items: flex-start; gap: 1px; min-height: 40px; padding: 4px 12px;
  text-align: left; color: #cfc7b1; background: rgba(20,18,14,0.6); border: 2px solid rgba(125,116,96,0.55); cursor: pointer; }
.px-sys .gr-rvn.on { color: #f3cf86; border-color: #c9a45a; background: rgba(60,48,26,0.55); }
.px-sys .gr-rvn .gr-rvnname { font-size: 15px; }
.px-sys .gr-rvn .gr-rvnsub { font-size: 12px; color: #9c937d; }
.px-qrow .gr-due { margin-left: auto; min-width: 18px; padding: 0 5px; line-height: 18px; font-size: 12px; text-align: center; color: #10120f; background: #e0c36a; }
/* GROWTH3: a face on the stage - the window nearly the screen's, the rail a strip over the face, the face the rest */
.px-win.px-win-wide { width: min(1440px, 98vw); height: min(940px, calc(100dvh - 56px)); }
.px-win-wide .px-body { padding: 8px 12px 10px; overflow: hidden; display: flex; flex-direction: column; }
.px-journal.gr-faced { flex-direction: column; flex: 1; min-height: 0; }
.gr-faced > .px-qrail { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 0 4px; border-right: 0; border-bottom: 2px solid rgba(125,116,96,0.45); padding: 0 0 4px; max-height: none; overflow: visible; }
.gr-faced > .px-qrail .px-qrow { width: auto; min-height: 38px; padding: 4px 10px; font-size: 15px; }
.gr-faced > .px-qdetail { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 6px 0 0; }
.gr-faced > .px-qdetail .gr-stage { flex: 1; height: auto; min-height: 240px; }
@media (max-width: 480px) { .gr-faced > .px-qrail .px-qrow { font-size: 13px; padding: 4px 8px; min-height: 36px; } }   /* wrapped, never scrolled: the lit page stays in sight */
${SPEC_GUIDE_CSS}
${STAGE_CSS}
`;
/** The tab's own dress, once a document. */
export function ensureGrowthStyle(doc = typeof document === 'undefined' ? null : document) {
  if (!doc?.getElementById || doc.getElementById(GROWTH_STYLE_ID)) return;
  const st = doc.createElement('style');
  st.id = GROWTH_STYLE_ID;
  st.textContent = GROWTH_CSS;
  (doc.head ?? doc.body)?.append(st);
}
/** Is a face up full screen (the window's Escape asks the tab first)? */
export const growthFull = () => !!stageLive()?.full;
