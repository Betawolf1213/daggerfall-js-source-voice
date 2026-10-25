// Stamps the current commit into src/buildTag.js at build time - the
// F8 readout's stale-cache killer. REL8: and the player's update number
// (scripts/updateNumber.mjs), null where the clone cannot know it.
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { updateNumber } from './updateNumber.mjs';
import { isMain } from '../tools/lib/isMain.mjs';
// AUDIT 68 X5-verify-deploy-tag-length-bypasses-dirty: a FIXED length. Bare
// --short lets git size the abbreviation by the clone's object count - 9
// in a full clone, 7 in CI's depth-1 checkout - so one commit had two tags,
// and verify-deploy's same-commit arm never fired.
/** src/buildTag.js's whole text - every export the game imports from it. THE ONE STAMP: a tool that builds the site
 *  as some other commit (tools/staleChunkProbe.mjs) writes the file through this, so it cannot drift from the
 *  shape the bundle imports (the probe wrote BUILD_TAG alone after REL8 added UPDATE, and its builds failed). */
export const tagSource = (sha, update) => `export const BUILD_TAG = '${sha}';\nexport const UPDATE = ${update ? `'${update}'` : 'null'};\n`;

if (isMain(import.meta.url)) {
  let sha;
  try {
    sha = execSync('git rev-parse --short=12 HEAD').toString().trim();
  } catch (e) {
    try {
      const { readFileSync } = await import('fs');
      const head = readFileSync('.git/HEAD', 'utf8').trim();
      if (head.startsWith('ref: ')) {
        const ref = head.slice(5);
        sha = readFileSync(`.git/${ref}`, 'utf8').trim().slice(0, 12);
      } else {
        sha = head.slice(0, 12);
      }
    } catch (_) {
      sha = 'unknown';
    }
  }
  writeFileSync('src/buildTag.js', tagSource(sha, updateNumber()));
}
