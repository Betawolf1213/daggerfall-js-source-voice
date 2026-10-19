// UI REPRO: A QUESTLINE'S STATE WORDS (qlLineRunner.js rows -> qlJournal.js qlLineDetail / lineStateWords) in the four
// cases the runner keeps apart and the page does not: (a) a step that FAILED (the runner offers it again a day later -
// RETRY_GAP_S), (b) the hour between two steps (STEP_GAP_S), (c) an online line begun and now offline, (d) a step whose
// quest the player ABANDONED (QUEST-SHELF: set aside, neither complete nor tombstoned). The real runner, the real ended().
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { createLineRunner } = await import(`${SNAP}/src/systems/questlines/qlLineRunner.js`);
const { lineStateWords, qlLineDetail } = await import(`${SNAP}/src/ui/questlines/qlJournal.js`);
const { fakePage } = await import(`${SNAP}/test/hudPage.mjs`);
const say = (row) => `state "${lineStateWords(row.state)}" | opens ${JSON.stringify(row.opens)} | steps ${row.steps.map((s) => `${s.title}=${s.state}`).join(', ')}`;
const page = (row) => qlLineDetail(fakePage(), row).textContent.replace(/A questline is a story[^.]*\.[^.]*\./, '').replace(/\s+/g, ' ').slice(0, 220);
// (a) introRoad's first step ends BADLY
{
  const quests = new Map();
  const runner = createLineRunner({ machine: { quests, questsToInvoke: [] }, ctx: { level: () => 9, online: () => false, nowSeconds: () => 100 } });
  runner.restore({ introRoad: { step: 0, done: false, wait: 0, outcomes: {} } });
  runner.ended({ questName: 'QLIR01', questSuccess: false }, { id: 'failed', failure: true });
  const row = runner.rows().find((r) => r.id === 'introRoad');
  console.log('(a) step FAILED, offered again in a day:', say(row), '\n    page:', page(row));
}
// (b) introRoad's first step ends WELL: the hour before the next
{
  const runner = createLineRunner({ machine: { quests: new Map(), questsToInvoke: [] }, ctx: { level: () => 9, online: () => false, nowSeconds: () => 100, outcomeText: () => 'You hauled the load.' } });
  runner.restore({ introRoad: { step: 0, done: false, wait: 0, outcomes: {} } });
  runner.ended({ questName: 'QLIR01', questSuccess: true }, { id: 'done', failure: false });
  const row = runner.rows().find((r) => r.id === 'introRoad');
  console.log('(b) between steps (next not yet given):', say(row));
}
// (c) the Burning Doors begun online, the page now offline
{
  const runner = createLineRunner({ machine: { quests: new Map(), questsToInvoke: [] }, ctx: { level: () => 20, online: () => false, nowSeconds: () => 100 } });
  runner.restore({ burningDoors: { step: 2, done: false, wait: 0, outcomes: { 0: { id: 'done' }, 1: { id: 'sealed' } } } });
  const row = runner.rows().find((r) => r.id === 'burningDoors');
  console.log('(c) begun online, now offline:', say(row));
}
// (d) the step's quest ABANDONED (set aside: shelvedAt set, not complete, not tombstoned)
{
  const quests = new Map([[5, { questName: 'QLIR01', questComplete: false, questTombstoned: false, shelvedAt: 12345 }]]);
  const runner = createLineRunner({ machine: { quests, questsToInvoke: [] }, ctx: { level: () => 9, online: () => false, nowSeconds: () => 100 } });
  runner.restore({ introRoad: { step: 0, done: false, wait: 0, outcomes: {} } });
  const row = runner.rows().find((r) => r.id === 'introRoad');
  console.log('(d) the step\'s quest abandoned:', say(row));
}
