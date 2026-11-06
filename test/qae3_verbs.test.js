// test/qae3_verbs.test.js — the remaining sixteen QAE verbs (QAE3).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WithinUnits, EquippedWithItem, CurrentMapPixel, CurrentInBlockPixel,
  GuildRankAtLeast, EnemyHealthLowerHigher, KilledEnemiesOfClass, MagicEfectKeyIsOn,
  CurrentStateIs, PlayerLegalReputeIs, PlayerFactionReputeIs, PlayerCurrentRegionIs,
  InfectPlayerWith, UpdateQuestItemMaterial, UpdateQuestItemAddEnchantment,
  UpdateQuestItemApplyMagicTemplate,
} from '../src/systems/quest/questActionsExtension.js';

const q = (hooks) => ({ hooks });
const parse = (Cls, src, hooks = {}) => {
  const a = Cls.prototype.createNew.call(Object.create(Cls.prototype), src, q(hooks));
  return a;
};

// ── WithinUnits ────────────────────────────────────────────────────────────
test('WithinUnits parses and triggers inside distance', () => {
  const a = parse(WithinUnits, 'player within 10 units of foe _aFoe_', {
    playerPosition: () => [0, 0, 0],
    resourcePosition: () => [3, 0, 4],
  });
  assert.equal(a.distance, 10);
  assert.equal(a.sym, '_aFoe_');
  assert.equal(a.checkTrigger(), true); // dist 5 <= 10
});

test('WithinUnits false beyond distance', () => {
  const a = parse(WithinUnits, 'player within 2 units of foe _aFoe_', {
    playerPosition: () => [0, 0, 0],
    resourcePosition: () => [30, 0, 40],
  });
  assert.equal(a.checkTrigger(), false);
});

test('WithinUnits inert with no hooks', () => {
  const a = parse(WithinUnits, 'player within 5 units of foe _aFoe_');
  assert.equal(a.checkTrigger(), false);
});

// ── EquippedWithItem ───────────────────────────────────────────────────────
test('EquippedWithItem parses class/subclass', () => {
  const a = parse(EquippedWithItem, 'player equipped with item class 1 subclass 5', {
    equippedItems: () => [{ group: 'Weapons', templateIndex: 5 }],
  });
  assert.equal(a.itemClass, 1);
  assert.equal(a.itemSubClass, 5);
});

test('EquippedWithItem false when nothing equipped', () => {
  const a = parse(EquippedWithItem, 'player equipped with item class 1 subclass 5', {
    equippedItems: () => [],
  });
  assert.equal(a.checkTrigger(), false);
});

// ── CurrentMapPixel ────────────────────────────────────────────────────────
test('CurrentMapPixel exact match', () => {
  const a = parse(CurrentMapPixel, 'player currentmappixel x 100 y 200', {
    worldMapPixel: () => ({ x: 100, y: 200 }),
  });
  assert.equal(a.checkTrigger(), true);
});

test('CurrentMapPixel delta allows nearby', () => {
  const a = parse(CurrentMapPixel, 'player currentmappixel x 100 y 200 delta 5', {
    worldMapPixel: () => ({ x: 103, y: 198 }),
  });
  assert.equal(a.checkTrigger(), true);
});

test('CurrentMapPixel false outside delta', () => {
  const a = parse(CurrentMapPixel, 'player currentmappixel x 100 y 200 delta 5', {
    worldMapPixel: () => ({ x: 120, y: 200 }),
  });
  assert.equal(a.checkTrigger(), false);
});

// ── CurrentInBlockPixel ────────────────────────────────────────────────────
test('CurrentInBlockPixel within delta', () => {
  const a = parse(CurrentInBlockPixel, 'player inblock position x 64 y 64 delta 10', {
    inBlockPosition: () => ({ x: 70, y: 60 }),
  });
  assert.equal(a.checkTrigger(), true);
});

// ── GuildRankAtLeast ───────────────────────────────────────────────────────
test('GuildRankAtLeast true at rank', () => {
  const a = parse(GuildRankAtLeast, 'player guild rank in FightersGuild at least 3', {
    guildRank: () => ({ rank: 4, power: 70, isNonMember: false }),
  });
  assert.equal(a.checkTrigger(), true);
});

test('GuildRankAtLeast false below rank', () => {
  const a = parse(GuildRankAtLeast, 'player guild rank in FightersGuild at least 5', {
    guildRank: () => ({ rank: 2, power: 70, isNonMember: false }),
  });
  assert.equal(a.checkTrigger(), false);
});

test('GuildRankAtLeast false for non-member', () => {
  const a = parse(GuildRankAtLeast, 'player guild rank in FightersGuild at least 1', {
    guildRank: () => ({ rank: 9, power: 70, isNonMember: true }),
  });
  assert.equal(a.checkTrigger(), false);
});

// ── EnemyHealthLowerHigher ─────────────────────────────────────────────────
test('EnemyHealthLowerHigher below high', () => {
  const a = parse(EnemyHealthLowerHigher, 'enemy _aFoe_ health is lower than 50%', {
    foeInstance: () => ({ health: 30, maxHealth: 100, alive: true }),
  });
  assert.equal(a.checkTrigger(), true);
});

test('EnemyHealthLowerHigher band', () => {
  const a = parse(EnemyHealthLowerHigher, 'enemy _aFoe_ health is lower than 50% and higher than 20%', {
    foeInstance: () => ({ health: 30, maxHealth: 100, alive: true }),
  });
  assert.equal(a.checkTrigger(), true);
});

test('EnemyHealthLowerHigher false when dead', () => {
  const a = parse(EnemyHealthLowerHigher, 'enemy _aFoe_ health is lower than 50%', {
    foeInstance: () => ({ health: 0, maxHealth: 100, alive: false }),
  });
  assert.equal(a.checkTrigger(), false);
});

// ── KilledEnemiesOfClass ───────────────────────────────────────────────────
test('KilledEnemiesOfClass at amount', () => {
  const a = parse(KilledEnemiesOfClass, 'player slain 3 enemies of class Giant_rat', {
    killCount: () => 3,
  });
  assert.equal(a.checkTrigger(), true);
});

test('KilledEnemiesOfClass passes place', () => {
  let gotPlace;
  const a = parse(KilledEnemiesOfClass, 'player slain 1 enemies of class Giant_rat at cellar', {
    killCount: (_foe, place) => { gotPlace = place; return 1; },
  });
  a.checkTrigger();
  assert.equal(gotPlace, 'cellar');
});

// ── MagicEfectKeyIsOn ──────────────────────────────────────────────────────
test('MagicEfectKeyIsOn player', () => {
  const a = parse(MagicEfectKeyIsOn, 'magic-effect key Fireball is on player', {
    activeEffectKeys: (t) => (t === 'player' ? new Set(['Fireball']) : new Set()),
  });
  assert.equal(a.onPlayer, true);
  assert.equal(a.checkTrigger(), true);
});

test('MagicEfectKeyIsOn foe', () => {
  const a = parse(MagicEfectKeyIsOn, 'magic-effect key Poison is on foe _aFoe_', {
    activeEffectKeys: (t) => (t === '_aFoe_' ? new Set(['Poison']) : new Set()),
  });
  assert.equal(a.onPlayer, false);
  assert.equal(a.checkTrigger(), true);
});

// ── CurrentStateIs ─────────────────────────────────────────────────────────
test('CurrentStateIs maps named flag', () => {
  const a = parse(CurrentStateIs, 'player current-state is resting', {
    playerState: (f) => f === 'resting',
  });
  assert.equal(a.flag, 'resting');
  assert.equal(a.checkTrigger(), true);
});

test('CurrentStateIs rejects unknown flag', () => {
  const a = parse(CurrentStateIs, 'player current-state is flying');
  assert.equal(a, null);
});

test('CurrentStateIs multi-word flag', () => {
  const a = parse(CurrentStateIs, 'player current-state is god mode', {
    playerState: (f) => f === 'godMode',
  });
  assert.equal(a.flag, 'godMode');
});

// ── PlayerLegalReputeIs ────────────────────────────────────────────────────
test('PlayerLegalReputeIs lower', () => {
  const a = parse(PlayerLegalReputeIs, 'player legal-repute is lower than 10', {
    legalRepute: () => 5,
  });
  assert.equal(a.checkTrigger(), true);
});

test('PlayerLegalReputeIs higher false', () => {
  const a = parse(PlayerLegalReputeIs, 'player legal-repute is higher than 10', {
    legalRepute: () => 5,
  });
  assert.equal(a.checkTrigger(), false);
});

// ── PlayerFactionReputeIs ──────────────────────────────────────────────────
test('PlayerFactionReputeIs with npc', () => {
  const a = parse(PlayerFactionReputeIs, 'player faction-repute with SomeNpc is higher than 20', {
    factionRepute: () => 30,
  });
  assert.equal(a.checkTrigger(), true);
});

test('PlayerFactionReputeIs with-faction-id', () => {
  const a = parse(PlayerFactionReputeIs, 'player faction-repute with-faction-id 42 is lower than 5', {
    factionRepute: () => 2,
  });
  assert.equal(a.checkTrigger(), true);
});

// ── PlayerCurrentRegionIs ──────────────────────────────────────────────────
test('PlayerCurrentRegionIs matches', () => {
  const a = parse(PlayerCurrentRegionIs, 'player current-region-index is 17', {
    currentRegionIndex: () => 17,
  });
  assert.equal(a.checkTrigger(), true);
});

test('PlayerCurrentRegionIs mismatch', () => {
  const a = parse(PlayerCurrentRegionIs, 'player current-region-index is 17', {
    currentRegionIndex: () => 20,
  });
  assert.equal(a.checkTrigger(), false);
});

// ── InfectPlayerWith ───────────────────────────────────────────────────────
test('InfectPlayerWith calls hook and completes', () => {
  let kind;
  const a = parse(InfectPlayerWith, 'infect player as vampire', {
    infectPlayer: (k) => { kind = k; },
  });
  a.update();
  assert.equal(kind, 'vampire');
});

// ── UpdateQuestItemMaterial ────────────────────────────────────────────────
test('UpdateQuestItemMaterial sets material', () => {
  const item = {};
  const a = parse(UpdateQuestItemMaterial, 'update-quest-item _anItem_ set-material Ebony', {
    questItemInstance: () => item,
  });
  a.update();
  assert.equal(item.material, 'Ebony');
});

// ── UpdateQuestItemAddEnchantment ──────────────────────────────────────────
test('UpdateQuestItemAddEnchantment appends', () => {
  const item = {};
  const a = parse(UpdateQuestItemAddEnchantment, 'update-quest-item _anItem_ add-enchantment type Fire spell 7', {
    questItemInstance: () => item,
  });
  a.update();
  assert.equal(item.enchantments.length, 1);
  assert.equal(item.enchantments[0].type, 'Fire');
  assert.equal(item.enchantments[0].spellId, 7);
});

test('UpdateQuestItemAddEnchantment caps at ten', () => {
  const item = { enchantments: Array.from({ length: 10 }, () => ({})) };
  const a = parse(UpdateQuestItemAddEnchantment, 'update-quest-item _anItem_ add-enchantment type Fire', {
    questItemInstance: () => item,
  });
  a.update();
  assert.equal(item.enchantments.length, 10);
});

// ── UpdateQuestItemApplyMagicTemplate ──────────────────────────────────────
test('UpdateQuestItemApplyMagicTemplate overwrites enchantments', () => {
  const item = { enchantments: [{ type: 'Old' }] };
  const a = parse(UpdateQuestItemApplyMagicTemplate, 'update-quest-item _anItem_ apply-magic-template T3', {
    questItemInstance: () => item,
  });
  a.update();
  assert.equal(item.magicTemplate, 'T3');
  assert.equal(item.enchantments.length, 0);
});
