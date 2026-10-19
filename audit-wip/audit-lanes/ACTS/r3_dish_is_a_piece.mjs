// ACTS lane repro 3: `piece-crafted` ("a piece made at a crafting station") is heard for a DISH cooked at any fire -
// Cooking's recipes are crafts (recipeLaw.js COOKING_RECIPES, kind 'dish'; the fire page's finishFor calls p.craft ->
// world.js craft -> profBook.craft -> craftOne), and craftOne excludes only a brew. A potion is "no piece"; a stew is one.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { createProfBook, PROF_KEPT_KEY } = await import(`${SNAP}/src/net/profBook.js`);
const { setActSink } = await import(`${SNAP}/src/systems/questlines/qlActs.js`);
const { recipeById } = await import(`${SNAP}/src/net/recipeLaw.js`);

const heard = [];
setActSink((kind) => { heard.push(kind); return 1; });
const mem = new Map();
const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
// a dish and a brew, each asked and its answer not yet heard (kept), answered on the next settle
const door = { account: () => 'acct', craft: async () => ({ ok: true, data: {} }), brew: async () => ({ ok: true, data: {} }) };
console.log('stew:north is', JSON.stringify({ profession: recipeById('stew:north').profession, kind: recipeById('stew:north').kind, name: recipeById('stew:north').name }));
for (const w of [{ rid: 'c1', recipe: 'stew:north', character: 'char' }, { rid: 'c2', brew: true, recipe: 'Cure Disease', keys: [], character: 'char' }]) {
  heard.length = 0;
  mem.set(PROF_KEPT_KEY, JSON.stringify({ 'acct|char': { crafts: [w] } }));
  const book = createProfBook({ door, storage, character: () => 'char', sleep: async () => {} });
  await book.settle(() => {}, () => {});
  console.log(`${w.brew ? 'a potion brewed' : 'a stew cooked'} -> acts heard:`, JSON.stringify(heard));
}
