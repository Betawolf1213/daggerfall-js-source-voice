// The five questline titles (ui/playerBadge.js): each in TITLE_TEXT, TITLE_RGBA, the claim law's QL_TITLES and the
// relay's TITLES; and the comment's claim "each more than 40 from every title's" colour, measured.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const badge = await import(`${SNAP}/src/ui/playerBadge.js`);
const claims = await import(`${SNAP}/src/net/questlineClaims.js`);
const ident = await import(`${SNAP}/src/net/identityToken.js`);
const FIVE = ['doorwarden', 'covenbane', 'weirwalker', 'hourwitness', 'satakalwitness'];
console.log('QL_TITLES:', JSON.stringify(claims.QL_TITLES ?? Object.values(claims.QL_SERVICE_LINES ?? {}).map((l) => l.title)));
const T = ident.TITLES ?? ident.TITLE_KEYS ?? null;
for (const k of FIVE) console.log(k, '| text:', badge.TITLE_TEXT[k], '| rgba:', JSON.stringify(badge.TITLE_RGBA[k]), '| relay knows:', T ? (Array.isArray(T) ? T.includes(k) : k in T) : '?', '| gradient:', !!badge.TITLE_GRADIENTS?.[k]);
const rgb = (a) => a.slice(0, 3).map((v) => Math.round(v * 255));
const d = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
for (const k of FIVE) {
  const me = rgb(badge.TITLE_RGBA[k]);
  let near = null;
  for (const [o, c] of Object.entries(badge.TITLE_RGBA)) { if (o === k || !Array.isArray(c)) continue; const dist = d(me, rgb(c)); if (!near || dist < near[1]) near = [o, dist]; }
  console.log(`${k} #${me.map((v) => v.toString(16).padStart(2, '0')).join('')} nearest: ${near[0]} at ${near[1].toFixed(1)}${near[1] <= 40 ? '   <= 40!' : ''}`);
}
