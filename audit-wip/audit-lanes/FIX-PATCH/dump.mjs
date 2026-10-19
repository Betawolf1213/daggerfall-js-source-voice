import { QL_PATCH_FAMILIES } from '/home/user/daggerfall-js-source/src/systems/questlines/qlPatches.js';
for (const fam of QL_PATCH_FAMILIES) for (const [q, list] of Object.entries(fam.patches)) {
  console.log(`\n######## ${fam.family} ${q}`);
  list.forEach((p, i) => console.log(`--- [${i}] count ${p.count}\n<<< OLD\n${p.old}\n>>> NEW\n${p.new}`));
}
