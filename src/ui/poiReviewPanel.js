// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-6 (2026-10-14) - THE APPROVER'S QUEUE AND A POI'S HISTORY, IN THE EDITOR.
//
// Mac: "I need to be able to approve changes" (bible/06-Systems/POI-Editor-Arc.md POI-6). Two dialogs over the POI
// editor's panel (ui/poiEditorPanel.js):
//
//   - APPROVALS (an approver's; the bar's button): every submission, oldest first - its name, who sent it and when,
//     whether it is new, a change or a retirement, whether it was made from a revision no longer live (approving it puts
//     back what went live since), WHAT IT CHANGES against the live one (poi/poiDiff.js, in words), and THE LAW'S REPORT
//     (its problems, its assets' once known). LOOK AT IT opens the submission in the editor and takes the eye to its
//     place; BEFORE and AFTER show the live one and the submission there in turn (poiEdit.js showAs - the screen's
//     alone). APPROVE, or SEND BACK with a word (a word is asked: the builder is told why).
//   - HISTORY (a POI's inspector): every revision, newest first - its state, author, when, the reviewer's word, which is
//     live. OPEN any as the editor's working document (its base the live revision); an approver PUTS BACK an earlier
//     approved revision as the live one (asked twice).
//
// Every word through the text core (L10N4); every name a builder typed written with `textContent`. Not a DFU member.
// Ledger A (POI).
// ═══════════════════════════════════════════════════════════════════

import { t } from '../systems/textManager.js';   // L10N4: the words through the text core
import { POI_LIMITS, poiDocProblems, poiAssetProblems } from '../poi/poiLaw.js';
import { poiDiff } from '../poi/poiDiff.js';
import { diffText, problemText, problemWhere } from '../poi/poiText.js';
import { poiQueue, poiReview, poiHistory, poiRollback } from '../poi/poiService.js';
import { agoText } from './saveTile.js';   // the port's one "how long ago"

/** A revision's state as the history says it. @param {string} state */
export const revStateText = (state) => (state === 'draft' ? t('poi.editor.state.draft', 'draft')
  : state === 'submitted' ? t('poi.editor.state.submitted', 'sent for approval')
    : state === 'approved' ? t('poi.review.approved', 'approved')
      : state === 'rejected' ? t('poi.editor.state.rejected', 'sent back')
        : String(state));

/**
 * @param {{
 *   doc?: Document, host: any, me: { handle: string | null, builder: boolean, approver: boolean },
 *   act: (fn: (io: any) => Promise<any>) => Promise<any>, say: (text: string, kind?: string) => void, refusal: (r: any) => string,
 *   edit: any, facts: { of: (sha: string) => any }, goTo: (place: any) => void, now?: () => number,
 * }} deps `goTo` takes the eye to a document's place; `facts` the panel's asset facts (the law's asset check)
 */
export function createPoiReview({ doc = document, host, me, act, say, refusal, edit, facts, goTo, now = () => Date.now() / 1000 }) {
  const el = (tag, cls = '', text = null) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const btn = (text, onClick, cls = 'dfpoi-btn') => { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation?.(); onClick(); }); return b; };
  const swallow = (e) => e.stopPropagation?.();
  const box = () => { const d = el('div', 'dfpoi-dialog dfpoi-shelf'); for (const ty of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'wheel', 'contextmenu', 'touchstart']) d.addEventListener(ty, swallow); return d; };

  /** @type {any} */
  let dialog = null;
  let queue = null;
  let looking = null;        // the submission being looked at: `{ id, rev, before, after }`
  let showing = 'after';
  let history = null;        // `{ id, h }`
  let puttingBack = null;    // the revision whose putting back asks again
  const notes = new Map();   // a submission's word, kept while the queue is drawn again

  function close() {
    dialog?.remove?.(); dialog = null;
    if (looking) { edit.showAs(looking.id, undefined); looking = null; showing = 'after'; }
    history = null; puttingBack = null;
  }

  // ── APPROVALS ───────────────────────────────────────────────────
  async function openQueue() {
    close();
    dialog = box();
    dialog.dataset.kind = 'queue';
    host.append(dialog);
    drawQueue();
    await refreshQueue();
  }
  async function refreshQueue() {
    const r = await act((i) => poiQueue(i));
    if (!r) return;
    if (!r.ok) { say(refusal(r), 'bad'); return; }
    queue = r.data.queue ?? [];
    drawQueue();
  }
  /** The law's report on a submission: its own problems, then its assets' once every one is known. */
  function lawOf(d) {
    const own = poiDocProblems(d);
    const shas = [];
    for (const part of d.parts ?? []) { shas.push(part.mesh); for (const m of part.materials ?? []) { if (m.texture) shas.push(m.texture); if (m.emissive) shas.push(m.emissive); } }
    const known = shas.every((s) => facts.of(s) !== undefined);
    return { list: known ? [...own, ...poiAssetProblems(d, (s) => facts.of(s))] : own, checking: !known };
  }
  function drawQueue() {
    if (!dialog || dialog.dataset.kind !== 'queue') return;
    const rows = [el('div', 'dfpoi-h', t('poi.review.title', 'Approvals')), el('div', 'dfpoi-sub', t('poi.review.hint', 'Look at each in the world, then approve it or send it back with a word.'))];
    const top = el('div', 'dfpoi-row');
    top.append(btn(t('poi.editor.refresh', 'Refresh the list'), () => refreshQueue()), btn(t('poi.review.close', 'Close'), () => close()));
    rows.push(top);
    if (!queue) rows.push(el('div', 'dfpoi-sub', t('poi.library.loading', 'Asking the store...')));
    else if (!queue.length) rows.push(el('div', 'dfpoi-ok', t('poi.review.none', 'Nothing waits for approval.')));
    else for (const item of queue) rows.push(queueRow(item));
    dialog.replaceChildren(...rows);
  }
  function queueRow(item) {
    const r = el('div', 'dfpoi-review');
    const name = item.doc?.name ?? item.liveDoc?.name ?? item.id;
    const kind = item.kind === 'retire' ? t('poi.review.kindRetire', 'take out of the world') : item.liveDoc ? t('poi.review.kindChange', 'a change') : t('poi.review.kindNew', 'new');
    r.append(el('div', 'dfpoi-shelf-name', name), el('div', 'dfpoi-shelf-meta', t('poi.review.sent', '{kind} · by {author} · sent {ago}', { kind, author: item.author, ago: agoText(item.submittedAt, now()) })));
    if (item.stale) r.append(el('div', 'dfpoi-warn', t('poi.review.stale', 'Made from an older live revision: approving it puts back over what went live since.')));
    // what it changes
    const changes = poiDiff(item.liveDoc, item.kind === 'retire' ? null : item.doc);
    const list = el('div', 'dfpoi-sub');
    for (const c of changes) list.append(el('div', '', diffText(c)));
    if (!changes.length) list.append(el('div', '', t('poi.review.noChange', 'Nothing differs from the live one.')));
    r.append(el('div', 'dfpoi-h', t('poi.review.changes', 'What it changes')), list);
    // the law's report
    if (item.doc) {
      const { list: ps, checking } = lawOf(item.doc);
      r.append(el('div', 'dfpoi-h', t('poi.review.law', 'The law')));
      if (!ps.length) r.append(el('div', checking ? 'dfpoi-sub' : 'dfpoi-ok', checking ? t('poi.editor.checking', 'Checking its models and pictures...') : t('poi.review.lawOk', 'Nothing wrong.')));
      for (const p of ps.slice(0, 12)) { const where = problemWhere(p.path, item.doc); r.append(el('div', 'dfpoi-problem', where ? `${where}: ${problemText(p)}` : problemText(p))); }
    }
    // looking, then the word
    const acts = el('div', 'dfpoi-row');
    const mine = looking?.id === item.id && looking.rev === item.rev;
    acts.append(btn(t('poi.review.look', 'Look at it'), () => look(item)));
    if (mine) {
      const toggle = btn(showing === 'after' ? t('poi.review.showBefore', 'Show the live one') : t('poi.review.showAfter', 'Show the submission'), () => flip());
      acts.append(toggle, el('span', 'dfpoi-chip', showing === 'after' ? t('poi.review.showingAfter', 'showing: the submission') : t('poi.review.showingBefore', 'showing: the live one')));
    }
    const note = el('textarea');
    note.maxLength = POI_LIMITS.note; note.placeholder = t('poi.review.notePlaceholder', 'A word for the builder (needed to send it back)');
    note.value = notes.get(`${item.id}:${item.rev}`) ?? '';
    note.addEventListener('input', () => notes.set(`${item.id}:${item.rev}`, note.value));
    const decide = el('div', 'dfpoi-row');
    decide.append(btn(t('poi.review.approve', 'Approve'), () => decideOn(item, 'approve', note.value)), btn(t('poi.review.reject', 'Send back'), () => decideOn(item, 'reject', note.value)));
    r.append(acts, note, decide);
    return r;
  }
  /** Look at a submission: it opens in the editor (unless changes of the builder's own to it are open) and the eye goes there. */
  function look(item) {
    const id = item.id;
    if (looking && looking.id !== id) edit.showAs(looking.id, undefined);
    if (item.kind !== 'retire') {
      if (edit.has(id) && edit.dirty(id)) { say(t('poi.review.openDirty', 'You have this POI open with changes: save or close it first.'), 'bad'); return; }
      if (edit.has(id)) edit.close(id);
      edit.open(id, { doc: structuredClone(item.doc), base: item.liveRev ?? null, rev: item.rev, state: 'submitted' });
      edit.select({ id, part: null });
    }
    looking = { id, rev: item.rev, before: item.liveDoc, after: item.kind === 'retire' ? null : item.doc };
    showing = 'after';
    edit.showAs(id, looking.after ? undefined : null);
    goTo((looking.after ?? looking.before).place);
    drawQueue();
  }
  /** Before and after, in turn, where it stands: the live one (none for a new POI) or the submission (none for a retirement). */
  function flip() {
    if (!looking) return;
    showing = showing === 'after' ? 'before' : 'after';
    const d = showing === 'after' ? looking.after : looking.before;
    edit.showAs(looking.id, d ? (showing === 'after' ? undefined : d) : null);
    drawQueue();
  }
  async function decideOn(item, verdict, note) {
    const word = note.trim();
    if (verdict === 'reject' && !word) { say(t('poi.review.needWord', 'Say why it goes back - the builder reads it.'), 'bad'); return; }
    const r = await act((i) => poiReview(i, item.id, item.rev, verdict, word || null));
    if (!r) return;
    if (!r.ok) { say(refusal(r), 'bad'); return; }
    const name = item.doc?.name ?? item.liveDoc?.name ?? item.id;
    say(verdict === 'approve' ? t('poi.review.approvedName', 'Approved: {name}. It stands in the world.', { name }) : t('poi.review.rejectedName', 'Sent back: {name}.', { name }));
    notes.delete(`${item.id}:${item.rev}`);
    if (looking?.id === item.id) {
      edit.showAs(item.id, undefined);
      // the submission looked at, unchanged, closes - what the world stands now is the store's
      if (edit.has(item.id) && !edit.dirty(item.id) && edit.entryOf(item.id)?.state === 'submitted') edit.close(item.id);
      looking = null; showing = 'after';
    }
    await refreshQueue();
  }

  // ── HISTORY ─────────────────────────────────────────────────────
  async function openHistory(id) {
    close();
    dialog = box();
    dialog.dataset.kind = 'history';
    host.append(dialog);
    history = { id, h: null };
    drawHistory();
    const r = await act((i) => poiHistory(i, id));
    if (!r) return;
    if (!r.ok) { say(refusal(r), 'bad'); return; }
    if (history?.id === id) { history.h = r.data; drawHistory(); }
  }
  function drawHistory() {
    if (!dialog || dialog.dataset.kind !== 'history' || !history) return;
    const h = history.h;
    const named = h?.revs?.slice().reverse().find((x) => x.doc)?.doc?.name ?? history.id;
    const rows = [el('div', 'dfpoi-h', t('poi.review.historyTitle', 'History: {name}', { name: named })), btn(t('poi.review.close', 'Close'), () => close())];
    if (!h) rows.push(el('div', 'dfpoi-sub', t('poi.library.loading', 'Asking the store...')));
    else for (const rev of [...h.revs].reverse()) rows.push(historyRow(h, rev));
    dialog.replaceChildren(...rows);
  }
  function historyRow(h, rev) {
    const r = el('div', 'dfpoi-review');
    const live = rev.rev === h.liveRev;
    const what = rev.kind === 'retire' ? t('poi.review.kindRetire', 'take out of the world') : rev.doc?.name ?? '';
    r.append(el('div', 'dfpoi-shelf-name', t('poi.review.rev', 'Revision {rev}: {what}', { rev: rev.rev, what })));
    r.append(el('div', 'dfpoi-shelf-meta', t('poi.review.revMeta', '{state} · by {author} · {ago}', { state: revStateText(rev.state), author: rev.author, ago: agoText(rev.at, now()) })));
    if (live) r.append(el('div', 'dfpoi-ok', t('poi.review.live', 'In the world now.')));
    if (rev.reviewer) r.append(el('div', 'dfpoi-sub', rev.note ? t('poi.review.word', '{reviewer}: {note}', { reviewer: rev.reviewer, note: rev.note }) : t('poi.review.decidedBy', 'Decided by {reviewer}.', { reviewer: rev.reviewer })));
    const acts = el('div', 'dfpoi-row');
    if (rev.doc) acts.append(btn(t('poi.review.openRev', 'Open this one'), () => openRevision(h, rev)));
    if (me.approver && rev.state === 'approved' && !live) {
      acts.append(btn(puttingBack === rev.rev ? t('poi.review.putBackSure', 'Put it back in the world?') : t('poi.review.putBack', 'Put this one back'), () => putBack(h, rev)));
    }
    r.append(acts);
    return r;
  }
  /** A past revision as the working document: its base the live one, saved as the builder's own draft. */
  function openRevision(h, rev) {
    if (edit.has(h.id) && edit.dirty(h.id)) { say(t('poi.review.openDirty', 'You have this POI open with changes: save or close it first.'), 'bad'); return; }
    if (edit.has(h.id)) edit.close(h.id);
    // saved as the live one is (none: never approved), so a revision that is not the live one opens as a change to save
    const live = h.revs.find((x) => x.rev === h.liveRev)?.doc ?? null;
    edit.open(h.id, { doc: structuredClone(rev.doc), saved: live, base: h.liveRev ?? null, rev: null, state: h.liveRev ? 'live' : 'draft' });
    edit.select({ id: h.id, part: null });
    close();
    goTo(rev.doc.place);
    say(t('poi.review.opened', 'Opened revision {rev}. Save it as a draft to send it again.', { rev: rev.rev }));
  }
  async function putBack(h, rev) {
    if (puttingBack !== rev.rev) { puttingBack = rev.rev; drawHistory(); return; }
    puttingBack = null;
    const r = await act((i) => poiRollback(i, h.id, rev.rev));
    if (!r) return;
    if (!r.ok) { say(refusal(r), 'bad'); return; }
    say(t('poi.review.putBackDone', 'Revision {rev} stands in the world again.', { rev: rev.rev }));
    await openHistory(h.id);
  }

  /** An asset's facts learnt: the queue's law reports drawn again - unless a word is being typed there (it is drawn at the
   *  next act, the word kept). */
  function learned() {
    if (dialog?.dataset.kind !== 'queue') return;
    const a = doc.activeElement;
    if (a && a !== doc.body && dialog.contains?.(a)) return;
    drawQueue();
  }

  return {
    openQueue: () => openQueue(),
    learned,
    openHistory: (id) => openHistory(id),
    close,
    dialog: () => dialog,
    queue: () => queue,
    looking: () => looking,
  };
}
