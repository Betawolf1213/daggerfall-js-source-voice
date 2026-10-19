// C5 (clean check): TITLES before and after - only the five appended; every one has a word and a colour; the bit of each.
import { execFileSync } from 'node:child_process';
const SNAP = process.argv[2];
const grab = (src) => JSON.parse(/export const TITLES = Object\.freeze\((\[[^\]]*\])\)/.exec(src)[1].replace(/'/g, '"'));
const before = grab(execFileSync('git', ['-C', SNAP, 'show', 'origin/main:src/net/identityToken.js'], { encoding: 'utf8' }));
const { TITLES } = await import(`${SNAP}/src/net/identityToken.js`);
const { QL_TITLES, qlTitleBit } = await import(`${SNAP}/src/net/questlineClaims.js`);
const { TITLE_TEXT, TITLE_RGBA } = await import(`${SNAP}/src/ui/playerBadge.js`);
console.log('prefix unchanged:', JSON.stringify(TITLES.slice(0, before.length)) === JSON.stringify(before), '| appended:', JSON.stringify(TITLES.slice(before.length)));
console.log('= QL_TITLES:', JSON.stringify(TITLES.slice(before.length)) === JSON.stringify([...QL_TITLES]));
console.log('bits:', JSON.stringify(QL_TITLES.map((t) => [t, qlTitleBit(t), TITLE_TEXT[t], !!TITLE_RGBA[t]])));
