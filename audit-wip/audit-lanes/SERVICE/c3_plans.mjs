// C3 (clean check): every witness, the title's and the key's statements - their query plans over the migrated schema.
import { d1 } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/test/accountDb.mjs';
import { QL_WITNESS_SQL } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/server-account/src/questlines.js';
const db = d1()._raw;
const plan = (sql) => db.prepare('EXPLAIN QUERY PLAN ' + sql).all().map((r) => r.detail).join(' | ');
for (const [k, w] of Object.entries(QL_WITNESS_SQL)) console.log(k.padEnd(10), plan(`UPDATE ql_steps SET done_at = ?4 WHERE account = ?1 AND line = ?2 AND step = ?3 AND done_at IS NULL AND (${w})`));
console.log('title     ', plan(`UPDATE players SET ql_titles = ql_titles | ?2 WHERE id = ?1 AND (ql_titles & ?2) = 0 AND (SELECT COUNT(*) FROM ql_steps WHERE account = ?1 AND line = ?3 AND step IN (SELECT value FROM json_each(?4)) AND done_at IS NOT NULL) = ?5`));
console.log('key       ', plan(`UPDATE players SET eg_keys = eg_keys + 1, ql_key = 1 WHERE id = ?1 AND ql_key = 0 AND EXISTS (SELECT 1 FROM ql_steps WHERE account = ?1 AND line = ?2 AND step = ?3 AND done_at IS NOT NULL AND choice = ?4) AND EXISTS (SELECT 1 FROM ql_steps a WHERE a.account = ?1 AND a.line = ?5 AND a.step = ?6 AND a.done_at IS NOT NULL) RETURNING eg_keys`));
