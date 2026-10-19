const R = '/home/user/daggerfall-js-source';
const { setActSink } = await import(`${R}/src/systems/questlines/qlActs.js`);
const { CardTableSession } = await import(`${R}/src/systems/card/cardTableSession.js`);
const heard = [];
setActSink((k, n) => { heard.push([k, n]); return 1; });
const seeded = (seed = 99) => { let x = seed >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; return x >>>= 0; }; };
const s = new CardTableSession({ player: { id: 'you', name: 'You', stack: 300 }, patrons: [{ id: 'patron:0', name: 'Ana', temper: 'loose', stack: 300 }, { id: 'patron:1', name: 'Bors', temper: 'tight', stack: 300 }], stakes: { sb: 5, bb: 10 }, rand32: seeded(7), now: 0 });
let won = 0, lost = 0;
for (let now = 0; now < 2_000_000 && !s.over && s.handNo <= 12; now += 100) {
  s.tick(now);
  const l = s.legal();
  if (l) s.playerAct(l.check ? { type: 'check' } : l.call <= 20 ? { type: 'call' } : { type: 'fold' }, now);
  for (const e of s.drain()) if (e.t === 'showdown') { const k = e.seats.indexOf(s.playerSeat); if (k >= 0 && e.result.pots[0]?.winners.includes(k)) won++; else lost++; }
}
console.log('won', won, 'lost', lost, 'heard', heard.length, 'hands', s.handNo, s.over);
