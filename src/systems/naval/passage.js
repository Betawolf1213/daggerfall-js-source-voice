// @ts-check
// PASSAGE (2026-10-19, the owner: "Add the ability to buy and ride a friendly boat (if one is docked) at any port. You
// can have the ability to choose where you want to sail. A new form of immersive travel") - PASSAGE UNDER SAIL, its
// law. Design: bible/03-World/Passage.md.
//
// A port's own friendly ships lie at its quays (scenes/naval/navalHost.js harbourFrame: a harbour's merchantmen and its
// crown's ships, moored at their berths). Walk up to one and Activate: her master names the ports he will sail for -
// every port the player knows, nearest first, each with its fare - and a port chosen and paid for, the voyage is SAILED,
// never jumped: the ship booked becomes the boat the player rides (navalHost.js charter - Come Sail Away's boat of her
// own hull at her own berth, her hands aboard), and the Overworld's crossing sails her there (OWS2, world.js
// travelViewRouteTo: the journey's hand on her helm, the land legs walked on from the landfall). Step off her - ashore at
// the far port, over the side, a door, a jump - and the passage is over: she stands out to sea, and what was put in her
// hold comes ashore (scenes/naval/passageHost.js).
//
// PURE: the ports, the pixels and the purse in; the voyages, the fares and the words out.
//
// Not a DFU member: Daggerfall's ship passage is a fast travel (DaggerfallTravelPopUp's "By ship"), priced by
// TravelTimeCalculator.CalculateTripCost - and this passage is priced by it too (passageFare). Ledger A (PASSAGE).
import { HULL } from './navalShips.js';
import { calculateTripCost } from '../travel/travel.js';

/** The hulls a passenger is carried in: a sail to cross a sea (OWS2's law, world.js tvSeaCrosses) - never the Rowboat,
 *  whose lone rower tires a kilometre out; never the Large Galley, which never moors (shipLife.js BERTH_HULLS). */
export const PASSAGE_HULLS = Object.freeze([HULL.LargeBoat, HULL.SmallShip, HULL.Carrack]);
/** Off her this far (m), and not aboard: the passage is over. Past a gangway's reach - a step onto the quay to look
 *  back at her is not leaving her. */
export const PASSAGE_LEAVE_M = 20;
/** Aboard her with no voyage under way (a fight stopped it, a load put me back at her helm): her master sails on after
 *  this long (s) - the first time after PASSAGE_FIRST_S - at most PASSAGE_RESUMES times a voyage. */
export const PASSAGE_RESUME_S = 20;
export const PASSAGE_FIRST_S = 2;
export const PASSAGE_RESUMES = 3;

/** A voyage's length in map pixels: the longest axis, as Daggerfall's own travel walk counts its steps
 *  (travel.js calculateTravelTime's walkTravelPath). */
export const passagePixels = (from, to) => Math.max(Math.abs((to.x | 0) - (from.x | 0)), Math.abs((to.y | 0) - (from.y | 0)));

/** THE FARE: Daggerfall's ship (CalculateTripCost's travelShip arm, travel.js calculateTripCost: 25 gold for every 24
 *  ocean pixels and 25 more), with every pixel of the voyage counted as sea - she sails the whole way, where the map's
 *  passage pays for the ocean its straight line crosses. No inn is paid: a passenger sleeps aboard. */
export const passageFare = (from, to) => calculateTripCost(0, Math.max(1, passagePixels(from, to)), { travelShip: true }).totalCost;

const WINDS = Object.freeze(['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']);
/** Which way a port lies, in the eight winds: map pixels (y runs south). '' for the same pixel. */
export function bearingWord(from, to) {
  const dx = (to.x | 0) - (from.x | 0), dn = (from.y | 0) - (to.y | 0);
  if (!dx && !dn) return '';
  const a = Math.atan2(dx, dn);   // 0 north, east a quarter turn on
  return WINDS[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
}

/**
 * THE PORTS HER MASTER SAILS FOR, from `here` (the player's map pixel): every port of `ports` ({ key, name, px, py }) the
 * player knows (`known(port)` - the travel map's own law: a place never discovered has no name to sail for), never the
 * port I stand at (`hereKey`), nearest first and then by name - each `{ port, fare, bearing, pixels }`.
 * @param {readonly any[]} ports
 * @param {{ x: number, y: number }} here
 * @param {{ hereKey?: string | null, known?: (port: any) => boolean }} [opts]
 */
export function passageDestinations(ports, here, { hereKey = null, known = () => true } = {}) {
  const out = [];
  for (const port of ports ?? []) {
    if (!port?.name || port.key === hereKey || !known(port)) continue;
    const to = { x: port.px, y: port.py };
    out.push({ port, fare: passageFare(here, to), bearing: bearingWord(here, to), pixels: passagePixels(here, to) });
  }
  return out.sort((a, b) => a.pixels - b.pixels || a.port.name.localeCompare(b.port.name));
}

/** The voyage's record, written on the boat she becomes (and saved with her - comeSailAway.js getSaveData's
 *  `Charter`): where she sails (`to`, a port's name and pixel), her name, her master, the fare paid. Null for anything
 *  else - a record a save hands back is read through this. */
export function charterRecord(x) {
  const to = x?.to;
  if (!to || typeof to.name !== 'string' || !to.name || !Number.isFinite(to.px) || !Number.isFinite(to.py)) return null;
  return {
    to: { name: to.name, px: to.px | 0, py: to.py | 0 },
    ship: typeof x.ship === 'string' ? x.ship : null,
    captain: typeof x.captain === 'string' ? x.captain : null,
    fare: Math.max(0, Math.floor(Number(x.fare) || 0)),
  };
}

const ship = (name) => name ?? 'The ship';
/** The words. */
export const PASSAGE_TEXT = Object.freeze({
  /** The look comes onto her at her berth. */
  hint: (name) => `${ship(name)} lies at her berth - Activate to book passage.`,
  /** A row of her master's list. */
  row: (d) => `${d.port.name} - ${d.bearing ? `${d.bearing}, ` : ''}${d.fare} gold`,
  /** The question, before a coin is paid. */
  ask: (name, dest, fare, gold) => [`Book passage on ${ship(name)} to ${dest}?`, `The fare is ${fare} gold. You have ${gold}.`, 'Her master sails you there. Step off her and the passage ends.'],
  booked: (name, captain, fare, dest) => `${captain ? `Captain ${captain}` : 'Her master'} takes your ${fare} gold. ${ship(name)} sails for ${dest}.`,
  poor: (fare) => `You cannot afford the fare of ${fare} gold.`,
  none: 'Her master knows of no port you have heard of to sail for.',
  noSail: 'No ship can carry you while Come Sail Away is off.',
  booking: 'You have a passage booked already.',
  ether: 'Her master sails these isles alone - the Bay\'s ports are beyond the Veil.',
  gone: 'She has cast off.',
  failed: 'Her master cannot make ready to sail.',
  helm: (dest) => `Go to her helm to sail on for ${dest} - her master steers from there.`,
  stood: (dest) => `Her master will sail no further toward ${dest} from here. Take her helm, or step ashore.`,
  goods: 'What you put in her hold is carried off her.',
  ended: (name) => `${ship(name)} stands out to sea.`,
});
/** The look's word on her (navalHost.js passageHint). */
export const passageHintText = (name) => PASSAGE_TEXT.hint(name);
