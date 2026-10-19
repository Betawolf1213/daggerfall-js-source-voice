// A vite dev server over the SNAPSHOT (its own src, locales), no project config, its cache in this lane dir - so
// nothing is written to the snapshot or to the linked node_modules.
import { createServer } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/node_modules/vite/dist/node/index.js';
import { realpathSync } from 'node:fs';
export const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
export const LANE = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/UI';
export async function serve(port = 5391) {
  const server = await createServer({
    root: SNAP, configFile: false, cacheDir: `${LANE}/pw/.vite`, logLevel: 'error', clearScreen: false,
    server: { port, strictPort: true, host: '127.0.0.1', fs: { strict: true, allow: [SNAP, LANE, realpathSync(`${SNAP}/node_modules`)] } },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  await server.listen();
  return { server, base: `http://127.0.0.1:${port}`, harness: `http://127.0.0.1:${port}/@fs${LANE}/pw/harness.html` };
}
