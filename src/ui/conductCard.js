// SAFE7 (2026-10-17, the chat safety plan, bible/11-Multiplayer/Chat-Safety-Arc.md section 8): THE CODE OF CONDUCT, AS
// A PLAYER MEETS IT - a card over the game the first time they send a chat line (and again when the code changes): the
// rules (net/safety/conduct.js), what follows a broken one, and two buttons. "I agree" keeps the agreement on the
// account (the host asks the service) and sends the line that waited; "Not now" closes the card and the line stays in
// the field, unsent. A redesigned window of the port's own, not DFU's (Port-Doctrine, Scope): its record is this page.
//
// The card takes the pointer while it stands - a press on it is the card's, never a swing - and a key typed while it
// stands is the chat field's, which keeps the line. Handed the document so the pins drive it headless.
//
// Not a DFU member: Daggerfall Unity has no chat. Ledger A row (ONLINE).
import { conductTitle, conductRules, conductConsequence, conductAgreeLabel, conductLaterLabel } from '../net/safety/conduct.js';

export const CONDUCT_STYLE_ID = 'dagger-conduct-style';
export const CONDUCT_CSS = `
.dfconduct { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 30; display: none;
  flex-direction: column; gap: 10px; width: min(460px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto;
  box-sizing: border-box; padding: 16px 18px; background: rgba(16, 18, 22, .97); border: 1px solid #6b5a3a; border-radius: 6px;
  color: #e9e4d9; font-family: inherit; box-shadow: 0 8px 28px rgba(0, 0, 0, .55); }
.dfconduct[data-up="1"] { display: flex; }
.dfconduct-title { font-size: 17px; font-weight: 600; color: #e8c46a; margin: 0; }
.dfconduct-rules { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; line-height: 1.4; }
.dfconduct-after { margin: 0; font-size: 12px; line-height: 1.4; color: #b9a99a; }
.dfconduct-row { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
.dfconduct-btn { min-height: 32px; padding: 4px 14px; border-radius: 3px; border: 1px solid #6b5a3a; background: #2b323b;
  color: #e9e4d9; font: inherit; font-size: 13px; cursor: pointer; }
.dfconduct-btn.yes { background: #6b5a3a; }
.dfconduct-btn:hover { background: #e8c46a; color: #0e1013; }
.dfconduct.touch .dfconduct-btn { min-height: 44px; padding: 8px 16px; }
`;

/**
 * @param {object} o
 * @param {() => void} o.agree  the player agreed: the host keeps it and sends the line that waited
 * @param {() => void} [o.later]  the player put it off: the line stays in the field
 * @param {boolean} [o.touch]
 * @param {Document} [o.doc]
 */
export function createConductCard({ agree, later = () => {}, touch = false, doc = document }) {
  if (doc?.getElementById && !doc.getElementById(CONDUCT_STYLE_ID)) {
    const st = doc.createElement('style');
    st.id = CONDUCT_STYLE_ID;
    st.textContent = CONDUCT_CSS;
    (doc.head ?? doc.body)?.append(st);
  }
  const el = (tag, cls, text) => { const n = doc.createElement(tag); n.className = cls; if (text != null) n.textContent = text; return n; };
  const root = el('div', `dfconduct${touch ? ' touch' : ''}`);
  root.dataset.up = '0';
  root.setAttribute('role', 'dialog');
  const title = el('h2', 'dfconduct-title');
  const rules = el('ul', 'dfconduct-rules');
  const after = el('p', 'dfconduct-after');
  const row = el('div', 'dfconduct-row');
  const no = el('button', 'dfconduct-btn'); no.type = 'button';
  const yes = el('button', 'dfconduct-btn yes'); yes.type = 'button';
  row.append(no, yes);
  root.append(title, rules, after, row);
  root.setAttribute('aria-label', conductTitle());
  doc.body?.append(root);
  const swallow = (e) => e.stopPropagation();   // a press on the card is the card's - never a swing
  for (const t of ['pointerdown', 'mousedown', 'click', 'touchstart', 'wheel', 'contextmenu']) root.addEventListener(t, swallow);
  let up = false;
  const close = () => { up = false; root.dataset.up = '0'; };
  yes.addEventListener('click', () => { if (!up) return; close(); agree(); });
  no.addEventListener('click', () => { if (!up) return; close(); later(); });
  return {
    root,
    /** Stand, in the player's language as it is now. */
    show() {
      title.textContent = conductTitle();
      rules.replaceChildren(...conductRules().map((r) => el('li', 'dfconduct-rule', r)));
      after.textContent = conductConsequence();
      yes.textContent = conductAgreeLabel();
      no.textContent = conductLaterLabel();
      up = true;
      root.dataset.up = '1';
    },
    /** Whether it stands. */
    isUp: () => up,
    close,
    destroy() { close(); root.remove?.(); },
  };
}
