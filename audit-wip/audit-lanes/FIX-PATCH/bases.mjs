import { ITEM_GROUPS } from '/home/user/daggerfall-js-source/src/systems/loot/loot.js';
import { WEAPONS_ENUM, ARMOR_ENUM } from '/home/user/daggerfall-js-source/src/combat/enemyEquipment.js';
import { templateByIndex, setItemFields } from '/home/user/daggerfall-js-source/src/systems/item/itemTemplates.js';
import { wearableItem } from '/home/user/daggerfall-js-source/src/systems/equip.js';
console.log('WEAPONS', Object.entries(WEAPONS_ENUM).map(([k, v]) => `${k}=${v}:${templateByIndex(v)?.name}`).join(', '));
console.log('ARMOR', Object.entries(ARMOR_ENUM).map(([k, v]) => `${k}=${v}:${templateByIndex(v)?.name}`).join(', '));
console.log('JEWEL', ITEM_GROUPS.Jewellery.map((i) => `${i}:${templateByIndex(i)?.name}:${wearableItem(setItemFields({ group: 'Jewellery', templateIndex: i }))}`).join(', '));
