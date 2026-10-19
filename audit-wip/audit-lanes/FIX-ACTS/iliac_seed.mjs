const R = '/home/user/daggerfall-js-source';
const { IliacTableSession, ILIAC_REVEAL_MS } = await import(`${R}/src/systems/iliac/iliacTableSession.js`);
const { patronDeck, patronPlays, seededUnit } = await import(`${R}/src/systems/iliac/iliacPatrons.js`);
const { STARTER_DECK } = await import(`${R}/src/net/iliac/iliacCards.js`);
const { ILIAC_TURNS } = await import(`${R}/src/net/iliac/iliacHand.js`);
const src32 = (seed) => { const u = seededUnit(seed); return () => Math.floor(u() * 4294967296); };
for (let seed = 1; seed < 40; seed++) {
  const s = new IliacTableSession({ player: { id: 'you', name: 'Ves', deck: STARTER_DECK.slice() }, patron: { id: 'regular:1', name: 'Bors', temper: 'loose', grade: 0, deck: patronDeck(4, 'loose', 0) }, rand32: src32(seed), now: 0 });
  const u = seededUnit(seed + 100);
  for (let t = 1; t <= ILIAC_TURNS && !s.over; t++) { const at = s.thinkAt; s.tick(at); s.playerCommit(patronPlays(s.state, 0, 'tight', 2, u), at); s.tick(at + ILIAC_REVEAL_MS); }
  console.log(seed, s.over);
}
