// Render the branch's parameterised strings in each language through the real t() - plural forms, placeholders, the
// "Opens ..." composition (qlLines.js opensWords) and the reward line (qlJournal.js rewardWords).
import { readFileSync } from 'node:fs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const tm = await import(`${SNAP}/src/systems/textManager.js`);
const { rewardWords, floorWords, lineStateWords } = await import(`${SNAP}/src/ui/questlines/qlJournal.js`);
const { opensWords, QL_LINES } = await import(`${SNAP}/src/systems/questlines/qlLines.js`);
const LANGS = ['en', 'bg', 'cs', 'da', 'de', 'es', 'fr', 'id', 'it', 'ko', 'nb', 'pt-BR', 'ro', 'ru'];
for (const lang of LANGS) {
  if (lang !== 'en') { tm.registerLocale({ code: lang, name: lang }); tm.patchLocaleTable(lang, 'Port_Strings', tm.parseStringTableCsv(readFileSync(`${SNAP}/locales/${lang}/Port_Strings.csv`, 'utf8'))); }
  tm.setLocale(lang);
  const probe = (lvl, online, done = () => false) => ({ level: () => lvl, online: () => online, lineDone: done });
  console.log(`== ${lang}`);
  console.log('  reward t3:', rewardWords(3));
  console.log('  opens BD lvl1 offline:', opensWords(QL_LINES[0], probe(1, false)));
  console.log('  opens CH offline:', opensWords(QL_LINES[1], probe(20, false)));
  console.log('  opens CH online:', opensWords(QL_LINES[1], probe(20, true)));
  console.log('  ladderAhead:', tm.t('ql.journal.ladderAhead', '{title} (not yet)', { title: 'Journeyman' }), '| offerRow:', tm.t('ql.journal.offerRow', 'Reward: {title}', { title: 'Wild Animal' }));
  console.log('  takeTitle:', tm.t('ql.journal.takeTitle', 'x', { name: 'Keen Longsword' }));
  console.log('  lineTitle:', tm.t('ql.journal.lineTitle', 'x', { title: 'Doorwarden' }), '|', tm.t('ql.line.honourTitle', 'x', { title: 'Doorwarden' }));
  console.log('  waiting:', tm.t('ql.reward.waiting', 'x', { title: 'Wild Animal' }), '| filed:', tm.t('quest.outcome.filed', 'x', { text: 'The beast is dead.' }));
}
