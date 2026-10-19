// An existing level-12+ character's first online page with the questlines: every line whose gate holds begins on the
// same tick - one letter each, all within the hour (qlLineRunner.js look: no pacing between lines).
import { makeBridge } from './harness.mjs';
const h = makeBridge({ level: 12, online: true });
h.tick(2);
console.log('steps started on the first tick:', h.st.started.filter((n, i, a) => a.indexOf(n) === i).join(' '));
h.advance(3 * 3600); h.tick(4);
console.log('letters/notes handed over within three hours:', h.st.popups.length);
