const R = '/home/user/daggerfall-js-source';
const { setActSink } = await import(`${R}/src/systems/questlines/qlActs.js`);
const { openGambitTableGame } = await import(`${R}/src/scenes/gambitTableGame.js`);
const { newGambitTable, gambitSit, gambitReady, gambitTick, gambitForfeit, GAMBIT_FIRST_MS } = await import(`${R}/src/net/gambit/gambitTable.js`);
const { autoFill, KG_POINT_BUDGET } = await import(`${R}/src/net/kingsGambit.js`);
const { GAMBIT_RESULT_MS } = await import(`${R}/src/systems/gambit/gambitTableSession.js`);
const { CARD_TABLE_W, CARD_TABLE_D } = await import(`${R}/src/world/card/cardTableProp.js`);
const { xorshift } = await import(`${R}/tools/kgMeasure.mjs`);
const { fakeDoc } = await import(`${R}/test/decorFakes.mjs`);
const heard = [];
setActSink((k, n) => { heard.push([k, n]); return 1; });
const FRAME = { centre: [0, 0.8, 0], axisYaw: Math.PI / 2, halfLong: CARD_TABLE_W / 2, halfShort: CARD_TABLE_D / 2 };
const CHAIRS = [[0, 0, -0.9], [0.9, 0, 0], [0, 0, 0.9], [-0.9, 0, 0]];
const t = newGambitTable({ chairs: 4 }), rand32 = xorshift(3);
const frames = [];
const keep = (m) => { for (const x of m) frames.push({ t: 'gambit', table: 0, now: 0, ...x.frame }); return m; };
keep(gambitSit(t, { id: 'a', name: 'Ana', chair: 0, crown: 0, now: 0 }));
keep(gambitSit(t, { id: 'b', name: 'Bors', chair: 2, crown: 2, now: 0 }));
keep(gambitReady(t, { id: 'a', army: autoFill([], KG_POINT_BUDGET, xorshift(3)), now: 0 }));
keep(gambitReady(t, { id: 'b', army: autoFill([], KG_POINT_BUDGET, xorshift(4)), now: 0 }));
keep(gambitTick(t, GAMBIT_FIRST_MS, rand32));
const page = (id, chair) => {
  let local = 0;
  const renderer = { createMesh: (m) => ({ m }), drawMesh() {}, destroyMesh() {}, uploadTexture() {}, releaseTexture() {} };
  const g = openGambitTableGame({
    doc: fakeDoc(), renderer, entity: { name: id, items: [], goldPieces: 100 }, say: () => {}, holdCursor: () => () => true, relock() {},
    rand32: xorshift(9), now: () => local, day: () => 100, key: 'town:7:0', friendly: true, regulars: [{ name: 'Cael', seed: 3, chair: 3 }],
    frame: FRAME, mySeatFeet: CHAIRS[chair], touch: () => false, onHoldem() {}, onIliac() {}, onStand() {},
    online: { send: () => true, myId: () => id, now: () => GAMBIT_FIRST_MS + 1000, table: 0, chairs: 4, chair, chairFeet: (k) => CHAIRS[k], welcomes: () => 1 },
  });
  return { g, step: (ms) => { local += ms; g.frame(local); } };
};
const P = { a: page('a', 0), b: page('b', 2), c: page('c', 3) };
for (const p of Object.values(P)) for (const f of frames) p.g.relay(f);
console.log('phases', Object.values(P).map((p) => p.g.g.phase), 'watcher', P.c.g.g.watcher);
const fin = keep(gambitForfeit(t, { id: 'b', gameNo: t.gameNo, now: GAMBIT_FIRST_MS + 5000 }));
for (const [id, p] of Object.entries(P)) { for (const x of fin) p.g.relay({ t: 'gambit', table: 0, now: 0, ...x.frame }); p.step(10); p.step(GAMBIT_RESULT_MS); console.log(id, p.g.g.phase, JSON.stringify(heard)); heard.length = 0; }
