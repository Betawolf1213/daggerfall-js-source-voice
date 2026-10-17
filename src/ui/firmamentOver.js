// @ts-check
// FIRM1 (2026-10-13; bible/06-Systems/Firmament.md) - THE FIRMAMENT'S DOOR (named firmamentOver.js, not *Door.js: it hands no window to a host's slot - it lays the sky OVER a door's page, so CRASH2's slot contract is not its law): the Stats page's Firmament button, on either
// door that draws that page (ui/pauseDoor.js - Escape and Tab's dial; ui/charSheetDoor.js - the sheet key). ONE
// CONSTRUCTION SEAM (AUDIT 17i): both doors build the same thing, so it is built here once and each door calls it -
// ASCEND-ANYTIME's own shape: the sky swapped in OVER the page it is pressed from, the page giving the keyboard up first
// (two capture handlers would answer Escape twice), and the page put back when the sky closes. Through the ONE
// lazy-chunk door (ui/enhanced/enhancedChunk.js), so a chunk that will not load says so and the page stays up behind the notice.
//
// The button is drawn only ONLINE - where the page has a book (net/firmament/firmamentBook.js): offline there is no sky to spend.
//
// RVN-STARS (2026-10-17; bible/06-Systems/Revenants.md section 44): and A SWORN REVENANT'S STARS the same way
// (revenantStarsOver) - the Companions page's Stars, its sky (ui/revenantStarsWindow.js) over the pause window and the
// page put back on Companions when it closes. One door's shape, built once (`overPage`), for both.

import { mountEnhancedChunk } from './enhanced/enhancedChunk.js';
import { firmamentBook } from '../net/firmament/firmamentBook.js';

/**
 * A window laid over a door's page, through the lazy-chunk door: `load` its chunk, `mount(mod, host, arg, onExit)` it;
 * `alive()`, `below()`, `back()` the door's. Answers `{ open(arg), drop, up }`.
 * @param {{ alive: () => boolean, below: () => void, back: () => void, id: string, label: string, load: () => Promise<any>,
 *   mount: (mod: any, host: HTMLElement, arg: any, onExit: () => void) => { destroy?: () => void } }} o
 */
function overPage({ alive, below, back, id, label, load, mount }) {
  let host = /** @type {HTMLElement|null} */ (null);
  let view = /** @type {{ destroy?: () => void }|null} */ (null);
  function drop() {
    const v = view, h = host;
    view = null;   // the slot is emptied before the occupant is told (THE SLOT IS EMPTIED BEFORE THE OCCUPANT IS TOLD)
    host = null;
    try { v?.destroy?.(); } catch { /* already gone */ }
    h?.remove();
  }
  function open(arg) {
    if (host || !alive()) return;
    const h = document.createElement('div');
    h.id = id;
    // 14: above the page's 13, the Ascension's own depth
    h.style.cssText = 'position:fixed;inset:0;z-index:14;background:transparent;overflow:hidden';
    document.body.append(h);
    host = h;
    const gone = () => { if (host === h) drop(); else h.remove(); };
    mountEnhancedChunk({
      load,
      alive: () => alive() && host === h,
      host: h, onDismiss: gone, label,
      mount: (mod) => {
        below();
        view = mount(mod, h, arg, () => {
          if (host !== h) return;
          host = null;
          view = null;
          h.remove();
          if (alive()) back();
        });
      },
    });
  }
  return { open, drop, up: () => !!host };
}

/**
 * A door's Firmament: `alive()` whether the door is still up; `below()` takes the page down (its keyboard first);
 * `back()` puts the page back after the sky closes. Answers `{ hook, drop, up }` - `hook` the Stats page's button's
 * function (undefined offline, so no button is drawn), `drop` takes the sky down with the door.
 * @param {{ alive: () => boolean, below: () => void, back: () => void }} o
 */
export function firmamentOver({ alive, below, back }) {
  const o = overPage({
    alive, below, back, id: 'enhanced-firmament-view', label: 'firmament',
    load: () => import('./firmamentWindow.js'),
    mount: ({ mountFirmamentWindow }, h, _arg, onExit) => mountFirmamentWindow(h, { onExit }),
  });
  return {
    get hook() { return firmamentBook() ? () => o.open(null) : undefined; },
    drop: o.drop,
    up: o.up,
  };
}

/**
 * RVN-STARS: a door's sworn revenant's stars - the Companions page's Stars (`hook(id)`), the sky over the page as the
 * Firmament is; `back()` puts the page back (on Companions). Offline and online alike: its sky is the save's.
 * @param {{ alive: () => boolean, below: () => void, back: () => void }} o
 */
export function revenantStarsOver({ alive, below, back }) {
  const o = overPage({
    alive, below, back, id: 'enhanced-revenant-stars-view', label: 'revenant-stars',
    load: () => import('./revenantStarsWindow.js'),
    mount: ({ mountRevenantStarsWindow }, h, id, onExit) => mountRevenantStarsWindow(h, { id, onExit }),
  });
  return { hook: (id) => o.open(id), drop: o.drop, up: o.up };
}
