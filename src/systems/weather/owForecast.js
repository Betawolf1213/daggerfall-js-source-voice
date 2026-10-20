// @ts-check
// ═══════════════════════════════════════════════════════════════════
// OW-FORECAST (2026-10-19, the owner, of "a weather forecast from the air": "I like this idea, but do it right";
// bible/06-Systems/Travel-View.md OW-FORECAST): THE WEATHER AHEAD, ON THE OVERWORLD.
//
// The world's weather is a map (WEATHER3, systems/weather/weatherMap.js): systems born on the land, drifting, growing and
// dying, the weather at any place and minute a pure function of both - so it can be asked of a place and a minute that
// have not come yet, and the answer is the one the traveller will stand in when they come. TV4's rule holds here: nothing
// is invented - every word below is `weatherAt` for its own ground at the minute it names, through the ground law every
// reader of the map wears (weatherSim.js mapGround: what falls is the air's), on the shared minute online - so two players
// read the same forecast, and it comes true. Three places it is said:
//   - THE WAY AHEAD, while a journey runs: the route still to walk, sampled every ROUTE_STEP_M to ROUTE_AHEAD_M (and its
//     end), each sample asked at the minute the traveller will reach it - the distance over the pace they are making,
//     times how fast the weather's clock runs for them (both MEASURED, `paceMeter`: offline the calendar runs with the
//     journey's rate, online the shared clock does not, and the measure is right either way) - and the first change a
//     traveller meets said ("Rain ahead - 2.4 km, in about 20 min"), or the clearing of what falls now, or the same the
//     whole way ("Fair weather all the way to Daggerfall").
//   - HERE, standing: the next HERE_HOURS at the traveller's place, every HERE_STEP_MIN (forecastAt) - what falls now and
//     when it clears, or what comes and when.
//   - A PLACE'S CARD, under the pointer: its own next hours, the same law.
// The map's lane only (weatherMapOn: the enhanced skin's world weather map, forced on online). Off it the sky is DFU's
// day roll per climate, which has no tomorrow to read - and nothing is said.
//
// PURE: points, minutes and a reader in; words out. The host (scenes/overworldForecastHost.js) reads the map, the
// clock, the route and the pace.
// ═══════════════════════════════════════════════════════════════════

/** The map's words as a traveller says them. */
export const FORECAST_WORDS = Object.freeze({
  sunny: 'Clear', cloudy: 'Cloudy', overcast: 'Overcast', fog: 'Fog', rain: 'Rain', thunder: 'Thunderstorm', snow: 'Snow', sandstorm: 'Sandstorm',
});
/** What a traveller meets on the way - what falls, what blinds; the rest is the sky's look. */
export const FORECAST_NOTABLE = Object.freeze(new Set(['fog', 'rain', 'thunder', 'snow', 'sandstorm']));
/** The way ahead is asked every ROUTE_STEP_M (field metres - two map pixels), out to ROUTE_AHEAD_M (the far ring's own
 *  reach, past what the view shows) and at its end, ROUTE_SAMPLES_MAX at most: a pass costs ~3 ms. */
export const ROUTE_STEP_M = 1600;
export const ROUTE_AHEAD_M = 40000;
export const ROUTE_SAMPLES_MAX = 26;
/** Here: the next HERE_HOURS, a word every HERE_STEP_MIN. */
export const HERE_HOURS = 6;
export const HERE_STEP_MIN = 15;
/** The pace meter's memory (real seconds, an exponential mean), and the least pace that is travelling (field metres a
 *  real second): slower, the way ahead has no minutes to give, and HERE is said instead. */
export const PACE_TAU_S = 3;
export const PACE_MIN_MPS = 0.5;
/** A step faster than this (field metres a real second) is a jump - a teleport, a load - and starts the meter again. */
export const PACE_JUMP_MPS = 20000;

const say = (w) => FORECAST_WORDS[w] ?? 'Fair';
const notable = (w) => FORECAST_NOTABLE.has(w);

/** Game minutes as a traveller says them: "in 20 min" to the nearest five under the hour, "in about 3 h" past it. */
export function etaWords(min) {
  if (!(min > 0)) return 'now';
  if (min < 57.5) return `in ${Math.max(5, Math.round(min / 5) * 5)} min`;
  return `in about ${Math.round(min / 60)} h`;
}
/** Field metres as a distance: tenths of a kilometre under ten, whole ones past. */
export const kmWords = (m) => `${m < 9950 ? (m / 1000).toFixed(1) : Math.round(m / 1000)} km`;

/**
 * The places along a line of points (field metres, the traveller first) the way ahead is asked at: every `step` from
 * the traveller to `ahead` (never the traveller's own), and the line's end when it lies within `ahead` - each
 * `{ x, z, d, end }`, `d` the metres along. At most `max`.
 */
export function samplesAlong(points, step = ROUTE_STEP_M, ahead = ROUTE_AHEAD_M, max = ROUTE_SAMPLES_MAX) {
  const out = [];
  if (!points || points.length < 2) return out;
  let walked = 0, next = step;
  for (let i = 1; i < points.length && out.length < max; i++) {
    const [ax, az] = points[i - 1], [bx, bz] = points[i];
    const len = Math.hypot(bx - ax, bz - az);
    while (next <= walked + len && next <= ahead && out.length < max) {
      const t = len > 0 ? (next - walked) / len : 1;
      out.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, d: next, end: false });
      next += step;
    }
    walked += len;
    if (walked > ahead) return out;
  }
  const [ex, ez] = points[points.length - 1];
  if (walked <= ahead && out.length < max) out.push({ x: ex, z: ez, d: walked, end: true });
  return out;
}

/**
 * THE WAY AHEAD: each sample asked at the minute the traveller reaches it (`minuteAt(d)` - absolute), against what falls
 * where they stand now (`nowWord`). The first change that matters - something met (`ahead`), or what falls now giving
 * out (`clearing`) - else the same the whole way read (`steady`: what falls now, or fair; `all` when the way's end was
 * among the samples). `wordAt(x, z, minute)` the map's word there and then.
 * @returns {{ kind: 'ahead'|'clearing'|'steady', word: string, d: number, min: number, all: boolean }}
 */
export function routeForecast(samples, { nowWord, now, minuteAt, wordAt }) {
  let last = null;
  for (const s of samples) {
    const at = minuteAt(s.d);
    const w = wordAt(s.x, s.z, at);
    last = { s, w, at };
    if (w !== nowWord && (notable(w) || notable(nowWord))) return { kind: notable(w) ? 'ahead' : 'clearing', word: notable(w) ? w : nowWord, d: s.d, min: at - now, all: false };
  }
  return { kind: 'steady', word: nowWord, d: last?.s.d ?? 0, min: 0, all: !!last?.s.end };
}

/** The way ahead in words. `dest` the journey's end's name (a place's), or null. */
export function routeLine(f, dest = null) {
  if (f.kind === 'ahead') return `${say(f.word)} ahead - ${kmWords(f.d)}, ${etaWords(f.min)}`;
  if (f.kind === 'clearing') return `${say(f.word)} clears ${kmWords(f.d)} ahead`;
  const to = dest ? ` to ${dest}` : '';
  if (notable(f.word)) return f.all ? `${say(f.word)} all the way${to}` : `${say(f.word)} for the next ${kmWords(f.d)}`;
  return f.all ? `Fair weather all the way${to}` : 'Fair weather ahead';
}

/** HERE in words, from forecastAt's answer ({ at, now, steps, next }): what falls now and when it clears, what comes and
 *  when, or fair for the hours read. */
export function hereLine(fc, hours = HERE_HOURS) {
  if (!fc?.now) return '';
  const nowWord = fc.now.word;
  if (notable(nowWord)) {
    const clear = fc.steps.find((s) => s.word !== nowWord);
    return clear ? `${say(nowWord)} - ${notable(clear.word) ? `${say(clear.word).toLowerCase()} ${etaWords(clear.at - fc.at)}` : `clearing ${etaWords(clear.at - fc.at)}`}` : `${say(nowWord)} for the next ${hours} h`;
  }
  const comes = fc.steps.find((s) => notable(s.word));
  return comes ? `${say(comes.word)} ${etaWords(comes.at - fc.at)}` : `Fair for the next ${hours} h`;
}

/**
 * THE PACE, MEASURED: field metres the traveller covers a real second, and game minutes the weather's clock runs a real
 * second - exponential means over PACE_TAU_S. `step(realS, x, z, minute)` each frame; a jump (PACE_JUMP_MPS) starts it
 * again. `minutesFor(d)` the game minutes `d` metres ahead take at that pace, or null while not travelling.
 */
export function paceMeter(tau = PACE_TAU_S) {
  let last = null, v = 0, r = 0, warm = 0;
  return {
    step(t, x, z, minute) {
      if (last && t > last.t) {
        const dt = t - last.t;
        const sp = Math.hypot(x - last.x, z - last.z) / dt;
        if (sp > PACE_JUMP_MPS || minute < last.m) { v = 0; r = 0; warm = 0; }
        else {
          const k = warm > 0 ? 1 - Math.exp(-dt / tau) : 1;   // the first measure taken whole - a mean from nothing reads every pace slow
          v += (sp - v) * k;
          r += ((minute - last.m) / dt - r) * k;
          warm += dt;
        }
      }
      last = { t, x, z, m: minute };
    },
    get v() { return v; },
    get r() { return r; },
    minutesFor(d) { return warm >= tau / 2 && v >= PACE_MIN_MPS ? (d / v) * r : null; },
    reset() { last = null; v = 0; r = 0; warm = 0; },
  };
}
