// C4 (clean check): 0133 over a populated database - every migration before it, players in it, then 0133; and a second run.
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const dir = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/server-account/migrations/';
const all = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON');
for (const f of all.filter((f) => f < '0133')) db.exec(readFileSync(dir + f, 'utf8'));
const cols = db.prepare("SELECT name FROM pragma_table_info('players')").all().map((r) => r.name);
console.log('players before 0133:', cols.length, 'columns; ql_* present:', cols.filter((c) => c.startsWith('ql_')));
// rows as the service writes them (only the NOT NULL columns without defaults)
const need = db.prepare("SELECT name, type FROM pragma_table_info('players') WHERE (\"notnull\" = 1 AND dflt_value IS NULL) OR pk = 1").all();
console.log('players NOT NULL columns without a default:', need.map((r) => r.name).join(','));
const vals = (n) => need.map((r) => (r.name === 'id' ? 'p' + n : /INT/i.test(r.type) ? 1 : 'x' + n));
for (let i = 0; i < 1000; i++) db.prepare(`INSERT INTO players (${need.map((r) => r.name).join(',')}) VALUES (${need.map(() => '?').join(',')})`).run(...vals(i));
const t0 = performance.now();
db.exec(readFileSync(dir + '0133_questlines.sql', 'utf8'));
console.log('0133 over 1000 rows:', (performance.now() - t0).toFixed(1), 'ms; every row:', JSON.stringify(db.prepare('SELECT MIN(ql_titles) a, MAX(ql_titles) b, MIN(ql_key) c, MAX(ql_key) d, COUNT(*) n FROM players').get()));
try { db.exec(readFileSync(dir + '0133_questlines.sql', 'utf8')); console.log('a second run: applied'); } catch (e) { console.log('a second run (the d1_migrations ledger never asks one):', e.message); }
// cascade
db.prepare("INSERT INTO ql_steps (account, line, step, opened_at) VALUES ('p1', 'oldCoil', 2, 1)").run(); db.prepare("DELETE FROM players WHERE id = 'p1'").run(); console.log('a deleted account takes its steps:', db.prepare("SELECT COUNT(*) n FROM ql_steps WHERE account = 'p1'").get().n === 0);
try { db.prepare("INSERT INTO ql_steps (account, line, step, opened_at) VALUES ('nobody', 'oldCoil', 2, 1)").run(); } catch (e) { console.log('a row for no account:', e.message); }
