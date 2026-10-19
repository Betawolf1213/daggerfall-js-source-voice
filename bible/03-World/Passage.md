# Passage under sail (PASSAGE)

THE PORT'S OWN (2026-10-19). The owner: *"Add the ability to buy and ride a friendly boat (if one is docked) at any
port. You can have the ability to choose where you want to sail. A new form of immersive travel."*

Daggerfall's ship passage is a fast travel: the travel map's "By ship", a fare, the days counted down, and the player
set down at the far port (DaggerfallTravelPopUp, priced by TravelTimeCalculator.CalculateTripCost; the port's
`ui/travel/travelPopUp.js` and the Overworld's SHIP-SAIL offer, `06-Systems/Travel-View.md`). Immersive Travel's ship
captain is the same jump from a docks-only map, and no block the mod ships stands one (`06-Systems/Immersive-Travel.md`).
The port already had every other piece: friendly ships moored at every port's quays (SHIP-LIFE, `navalHost.js`
harbourFrame), Come Sail Away boats a journey can sail (OWS2, `06-Systems/Travel-View.md` "OWS2 - the crossing"), and
the Overworld that carries a journey across the map at its own pace. Nothing let a player pay one of those ships and
ride her. PASSAGE is that link: **the voyage is sailed, never jumped.**

## The ship

A harbour's OWN ship (`navalHost.js` passageShip): one of the merchantmen and crown's ships the port stands at its
berths each day, lying moored there - never a packet on her lane (she keeps her timetable), a prize, a ship fading out
of the sea or one already under way. She must be friendly (`stanceOf`: a lawful master, and no crown's hunt on me - a
captain the navy is chasing finds no navy ship to carry them), and of a hull that crosses a sea (`passage.js`
PASSAGE_HULLS: the Large Boat, the Small Ship, the Carrack - never the Rowboat, whose lone rower tires a kilometre out,
and the galley never moors). On foot within boarding reach of her side (FOOT_BOARD_M) with the look on her, she says
so once ("The Fair Silk lies at her berth - Activate to book passage.") and Activate is hers - after my own ship's
gangway, which stays the first press at a quay.

No ship moored, no passage: the ask's own "if one is docked".

## The booking

Activate asks her master's ports (`passageHost.js` offer) - a list picker of every port the player knows
(`passage.js` passageDestinations: the travel map's own law, a place never discovered has no name to sail for), never
the port they stand at, nearest first and then by name, each with the wind it lies on and its fare
("Sentinel - east, 50 gold"). A port picked asks once more, the fare beside the purse, and says the rule
("Her master sails you there. Step off her and the passage ends."). Nothing is paid until she sails.

THE FARE (`passage.js` passageFare) is Daggerfall's ship - CalculateTripCost's travelShip arm, 25 gold for every 24
ocean pixels and 25 more (`travel.js` calculateTripCost, the one copy) - with every pixel of the voyage counted as sea,
the longest axis as Daggerfall's travel walk counts it. The departure, named: DFU pays the ship only for the ocean its
straight line crosses (a voyage round a headland pays little), and this passage sails the whole way. No inn is paid: a
passenger sleeps aboard.

Yes (`passageHost.js` book) makes the passage ALL OF IT OR NONE OF IT: the purse, the journey's own gate
(`travelViewCanGo` - no foe near, no wall underfoot, not another's passenger), then her boat (`navalHost.js` charter:
Come Sail Away's boat of HER hull placed at HER berth as she lies, from a deed minted for the voyage and never put in the
pack or the Fleet's book; the voyage's record written on it), her helm taken, and the journey begun to the port
(`travelViewRouteTo`). Only then is she let go from the sea (`navalHost.js` charterSailed - her boat stands in her
place, and she is not stood at her berth again today) and the fare paid. A journey refused puts everything back: her
boat gone, the player where they stood, nothing paid, she still at her berth.

## The voyage

The voyage is the Overworld's crossing (OWS2), unchanged: the journey's hand on her helm - the rudder, the sails, her
crew's oars - and Come Sail Away's own sailing moves her. On the enhanced interface the Overworld is raised over it as
over every journey; under First Person Travel it is sailed from her helm. Her hands are aboard (a fresh crew state,
every hand), so a raider met on the way is met as any ship of mine meets one. Time passes as the journey's does.

A voyage stopped with the player still aboard - a foe near, a raider's chase, a load that put them back at her helm -
is SAILED ON by her master (`passageHost.js` frame): after PASSAGE_FIRST_S the first time, then each PASSAGE_RESUME_S,
PASSAGE_RESUMES times a voyage at most, and then he says he will sail no further from there ("Take her helm, or step
ashore") - the helm is the player's then. On her deck away from the helm he asks for it ("her master steers from
there").

THE ARRIVAL is OWS2's landfall: she runs in on her oars, the helm is left, the player is set on the first dry ground
by her bow, and the land legs are walked on into the port. OWS2's "left moored" is not said of her - she is not mine to
leave.

A new journey begun from her helm (a place picked on the Overworld while aboard) is sailed by her too: her master sails
where the passenger asks, the fare paid stands, and the passage still ends where they step off her.

## The end

Step off her and the passage is over (`passageHost.js` end): past PASSAGE_LEAVE_M of her and not aboard - ashore at the
far port, over the side, through a door, by a jump. What was put in her hold comes into the pack ("What you put in her
hold is carried off her."), her boat is laid up out of the world and her number's hold and sea-fight record forgotten,
and she stands out to sea. While another player stands aboard her, she waits for them.

## What she is not

She is her master's ship, never the player's:

- Never the Fleet's (`fleetHost.js` placed): no ledger record, so the shipmaster neither lists nor buys her
  (`03-World/Shipyards.md`).
- Never packed into parts (`comeSailAway.js` PackBoat refuses her, and her boat never packs - `navalHost.js` charter,
  and the passage's frame after a load - so the crossing never plans a second launch of her).
- Never boarded by another journey as "mine moored within reach" (`world.js` tvSeaMeans) - only her booking boards her.
- Saved with her voyage (`comeSailAway.js` getSaveData's `Charter`, read back by its restore), so a load mid-voyage
  finds her at her helm and her master sails on; a record that reads as nothing (`passage.js` charterRecord) ends the
  passage at once.

Online: a harbour ship another player stands is taken over at the booking, as a boarding takes her; her boat is a boat
of mine on the wire, so another player may ride her as a passenger (CSA-K).

## The words

Every word the passage says is the text core's (`t('passage.*')`, L10N4 - the eight winds of a port's row too),
drafted in-session for the thirteen whole languages (`locales/README.md`).

## The four hosts

`scenes/world.js` wires it (the passage host built once beside the shipyard's, its frame at the head of the sea's frame
whatever the sea fight's switch says, the sea's door to it). `scenes/exterior.js`, the fixed-city bench, stands no
harbour ships - no passage there. `scenes/worldModes.js` (interiors) and `scenes/dungeonContext.js` stand no sea.

## Pins

`test/systems/naval/passage.test.js` (the law), `test/scenes/naval/passagehost.test.js` (the booking, the voyage's
life, the end, the wiring), `test/scenes/naval/passagesea.test.js` (the ship at her berth, her boat, her letting go -
the real naval host and pool), `test/systems/comeSailAway/passage_csa.test.js` (the save and the pack, the real
runtime); `tools/mutants/passage.json` (44, all dead).

Not a DFU member. Ledger A (PASSAGE).
