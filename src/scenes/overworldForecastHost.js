// OW-FORECAST (2026-10-19, the owner: "I like this idea, but do it right"; bible/06-Systems/Travel-View.md OW-FORECAST):
// THE OVERWORLD'S FORECAST - the streaming host's half of systems/weather/owForecast.js. It reads the world weather map
// (weatherMap.js weatherAt / forecastAt, through the host's own ground law) at the host's weather minute (the one the
// sky is sampled at - sampleWeatherField's), the traveller's place, the route still to walk and the pace being made, and
// keeps its answers: the line is worked out again every FORECAST_EVERY_MS of real time (a pass reads ~26 places, ~3 ms),
// and a place's card once a HERE_STEP_MIN of the weather's clock. Off the map's lane (weatherMapOn) it says nothing.
// The streaming host constructs it (scenes/world.js) - the one host with the Overworld; scenes/exterior.js,
// scenes/worldModes.js and scenes/dungeonContext.js raise no Overworld.
import { weatherAt, forecastAt } from '../systems/weather/weatherMap.js';
import { weatherMapOn } from '../systems/weather/weatherSim.js';
import { fieldFromNative } from '../systems/weather/weatherField.js';
import { samplesAlong, routeForecast, routeLine, hereLine, paceMeter, HERE_HOURS, HERE_STEP_MIN } from '../systems/weather/owForecast.js';

/** How often the line is worked out again, real milliseconds. */
export const FORECAST_EVERY_MS = 2000;
/** How many places' cards are kept at once. */
export const FORECAST_CARDS_MAX = 64;

/**
 * THE WAY STILL TO WALK, as natives ([x, z], the traveller first) - a town's streets still ahead (OW-TOWN-WALK), a
 * rejoin, then each leg's point from the one being walked (the Overworld's own drawn points, `tvTrip.natives`, one a leg)
 * - and its end's name; null with no journey of the view's running.
 */
export function wayAhead(me, trip, route) {
  const n = trip?.natives ?? [];
  if (!route || n.length < 2) return null;
  const street = (route.street?.pts ?? []).map((q) => [q.x, q.z]);
  return { points: [[me.x, me.z], ...street, ...(route.join ? [[route.join.x, route.join.z]] : []), ...n.slice(Math.min(n.length - 1, (route.i ?? 0) + 1))], dest: trip.plan?.summary?.name ?? null };
}

/**
 * @param {{ climateAt: (px: number, py: number) => number, ground: any, minuteNow: () => number,   // the weather's clock, game minutes, unfloored here: () => ({ x: number, z: number }),
 *   tvTrip: any, tvTripLive: () => boolean, route: () => any }} host - `here` the traveller's natives; `tvTrip` the view's
 *   journey (its drawn points and its place), live while `tvTripLive`; `route` Travel Options' own (its leg, its streets, its rejoin)
 */
export function createOverworldForecast(host) {
  const { climateAt, ground, minuteNow, here, tvTrip, tvTripLive, route } = host;
  const way = () => (tvTripLive() ? wayAhead(here(), tvTrip, route()) : null);
  const pace = paceMeter();
  const cards = new Map();
  let kept = { at: -Infinity, line: '' };
  // the words read at the whole minute the sky is sampled at (sampleWeatherField's floor); the pace on the clock unfloored
  const wordAt = (x, z, minute) => weatherAt(x, z, Math.floor(minute), climateAt, { ground }).word;
  /** The traveller's own next hours. */
  const hereNow = (n, minute) => { const [x, z] = fieldFromNative(n.x, n.z); return hereLine(forecastAt(x, z, Math.floor(minute), climateAt, { hours: HERE_HOURS, step: HERE_STEP_MIN, ground })); };
  return {
    /** The Overworld's forecast line, asked every frame of the view (`nowMs` real) - the pace measured each frame, the
     *  words worked out again every FORECAST_EVERY_MS. */
    line(nowMs) {
      if (!weatherMapOn()) { pace.reset(); kept = { at: -Infinity, line: '' }; return ''; }
      const n = here(), minute = minuteNow();
      const [fx, fz] = fieldFromNative(n.x, n.z);
      pace.step(nowMs / 1000, fx, fz, minute);
      if (nowMs - kept.at < FORECAST_EVERY_MS) return kept.line;
      const w = way();
      let line = '';
      if (w && w.points.length >= 2) {
        const points = w.points.map(([x, z]) => fieldFromNative(x, z));
        const samples = samplesAlong(points);
        const per = pace.minutesFor(1000);
        if (samples.length && per != null) {
          line = routeLine(routeForecast(samples, { nowWord: wordAt(fx, fz, minute), now: minute, minuteAt: (d) => minute + (per * d) / 1000, wordAt }), w.dest);
        }
      }
      if (!line) line = hereNow(n, minute);
      kept = { at: nowMs, line };
      return line;
    },
    /** A place's own next hours, for its card (`n` its natives) - kept a HERE_STEP_MIN of the weather's clock. */
    placeLine(n) {
      if (!weatherMapOn()) return '';
      const minute = Math.floor(minuteNow()), bucket = Math.floor(minute / HERE_STEP_MIN);
      const key = `${Math.round(n.x)},${Math.round(n.z)}`;
      const c = cards.get(key);
      if (c && c.bucket === bucket) return c.line;
      const line = hereNow(n, minute);
      if (cards.size >= FORECAST_CARDS_MAX) cards.delete(cards.keys().next().value);
      cards.set(key, { bucket, line });
      return line;
    },
  };
}
