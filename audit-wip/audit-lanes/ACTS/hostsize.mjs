import { readFileSync } from 'node:fs';
import { parseModule, findHostFunction, logicalLines } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/tools/hostScope.mjs';
const rows = [['src/scenes/world.js','bootWorld'],['src/scenes/worldModes.js','createWorldModes'],['src/scenes/dungeonContext.js','buildDungeonContext'],['src/scenes/exterior.js','bootExterior'],['src/scenes/naval/navalHost.js','createNavalHost'],['src/systems/comeSailAway/comeSailAway.js','createComeSailAwayRuntime'],['src/scenes/eliteGates/egClient.js','createEgClient']];
for (const [f, fn] of rows) {
  const m = (root) => logicalLines(findHostFunction(parseModule(readFileSync(root + '/' + f, 'utf8')), fn).fn);
  const b = m('/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/ACTS/base'), h = m('/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit');
  console.log(fn.padEnd(28), 'base', b, 'head', h, 'delta', h - b);
}
