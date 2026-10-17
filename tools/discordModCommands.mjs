// SAFE8 (2026-10-17, the chat safety plan, bible/11-Multiplayer/Chat-Safety-Arc.md section 9): THE /mod COMMAND,
// REGISTERED WITH DISCORD - once, by hand, when the moderators' queue is set up (and again only if the command changes).
// The account service answers it (server-account/src/discord.js onCommand); Discord has to be told it exists.
//
//   DISCORD_APP_ID=<application id> DISCORD_BOT_TOKEN=<bot token> DISCORD_GUILD_ID=<server id> node tools/discordModCommands.mjs
//   ... --print   the command's JSON alone, nothing sent
//
// A GUILD COMMAND, not a global one: it appears in the project's own Discord server at once and nowhere else, and it is
// hidden from everyone but those holding Manage Messages (`default_member_permissions`) - a door's look, never its lock:
// whether a press does anything is the game's question (DISCORD_MODERATORS, MODERATOR_HANDLES).
// The token is read from the environment and never printed.
//
// DISCORD-SETUP (2026-10-17, Mac: "Can you set the discord end up for me"): THE WHOLE DISCORD END, FROM THE TOKEN ALONE -
// what the deploy runs (account-deploy.yml, "Point Discord at the service"), so the bot's token never leaves the
// repository's secrets and no id is typed twice:
//
//   DISCORD_BOT_TOKEN=... DISCORD_MOD_CHANNEL=<channel id> DISCORD_PUBLIC_KEY=<hex> DISCORD_INTERACTIONS_URL=<url> \
//     node tools/discordModCommands.mjs --setup
//
// The application's id and public key are Discord's answer to its own bot (GET /applications/@me), the server is the
// moderators' channel's (GET /channels/<id>), the Interactions Endpoint URL is set only when it differs (PATCH
// /applications/@me - Discord signs a PING to it and keeps the URL only if the service answers), and /mod is written
// over whatever was registered (PUT, idempotent). A public key in wrangler.toml that is not the application's is said
// before Discord is asked anything of it: every press would be refused as a bad signature, and Discord's own refusal
// of the URL would not say why.
import { isMain } from './lib/isMain.mjs';
import { DISCORD_USER_AGENT } from '../server-account/src/discord.js';

/** The command, as Discord's API takes it: /mod lookup|mute|unmute|ban|unban, each naming a player by name or account id. */
export const MOD_COMMAND = Object.freeze({
  name: 'mod',
  description: 'DFO Online moderation',
  type: 1,
  default_member_permissions: String(1 << 13),   // Manage Messages
  contexts: [0],   // AUDIT SAFE DISCORD-13: the server alone (GUILD) - `dm_permission` is deprecated for `contexts`
  options: [
    { type: 1, name: 'lookup', description: 'An account\'s standing: mutes, bans, strikes and the next step', options: [{ type: 3, name: 'player', description: 'Name or account id', required: true }] },
    { type: 1, name: 'mute', description: 'Mute a player (the next step on the ladder unless minutes are given)', options: [
      { type: 3, name: 'player', description: 'Name or account id', required: true },
      { type: 4, name: 'minutes', description: 'Minutes, 1 to 10080', required: false, min_value: 1, max_value: 10080 },
      { type: 3, name: 'reason', description: 'Why - kept in the record', required: false, max_length: 200 },
    ] },
    { type: 1, name: 'unmute', description: 'Lift a mute', options: [{ type: 3, name: 'player', description: 'Name or account id', required: true }] },
    { type: 1, name: 'ban', description: 'Ban a player (30 days unless days are given; 0 for good)', options: [
      { type: 3, name: 'player', description: 'Name or account id', required: true },
      { type: 4, name: 'days', description: 'Days, 1 to 365, or 0 for good', required: false, min_value: 0, max_value: 365 },
      { type: 3, name: 'reason', description: 'Why - the banned player is shown it', required: false, max_length: 200 },
    ] },
    { type: 1, name: 'unban', description: 'Lift a ban', options: [{ type: 3, name: 'player', description: 'Name or account id', required: true }] },
  ],
});

const DISCORD_API = 'https://discord.com/api/v10';
/** Discord's PING can reach an instance of the Worker the deploy has not yet replaced (the password-route check's lesson,
 *  account-deploy.yml): the URL is offered this many times, SETUP_RETRY_MS apart, before its refusal is believed. */
export const SETUP_TRIES = 4;
export const SETUP_RETRY_MS = 10_000;
const SNOWFLAKE_RE = /^\d{5,25}$/;

/** DISCORD-SETUP: the application pointed at `url` and /mod registered in the server `channel` is in. Answers
 *  `{ app, guild, pointed }` (`pointed`: the URL was changed, not already right), or throws an Error saying which step
 *  Discord refused and its words - never the token. */
export async function discordSetup({ token, channel, publicKey, url, fetchFn = (u, i) => globalThis.fetch(u, i), wait = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  if (!token) throw new Error('no bot token');
  if (!SNOWFLAKE_RE.test(channel ?? '')) throw new Error(`DISCORD_MOD_CHANNEL is not a channel id: "${channel ?? ''}"`);
  if (!/^[0-9a-f]{64}$/i.test(publicKey ?? '')) throw new Error('DISCORD_PUBLIC_KEY is not a 64-character hex key');
  if (!/^https:\/\/[^\s/]+\/v1\/discord\/interactions$/.test(url ?? '')) throw new Error(`not the service's interactions door: "${url ?? ''}"`);
  const call = async (what, path, method = 'GET', body) => {
    const res = await fetchFn(`${DISCORD_API}${path}`, {
      method,
      headers: { 'content-type': 'application/json', authorization: `Bot ${token}`, 'user-agent': DISCORD_USER_AGENT },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await res.text();
    if (!res.ok) return { error: `${what}: Discord said ${res.status}: ${text.slice(0, 300)}` };
    return { json: text ? JSON.parse(text) : null };
  };
  const got = (r) => { if (r.error) throw new Error(r.error); return r.json; };
  const app = got(await call('reading the application', '/applications/@me'));
  if (!SNOWFLAKE_RE.test(app?.id ?? '')) throw new Error('reading the application: Discord named no application id');
  if (String(app.verify_key ?? '').toLowerCase() !== publicKey.toLowerCase()) {
    throw new Error(`DISCORD_PUBLIC_KEY is not this application's public key - set it to ${app.verify_key} in server-account/wrangler.toml`);
  }
  const chan = got(await call('reading the moderators\' channel (is the bot in the server, with View Channel there?)', `/channels/${channel}`));
  if (!SNOWFLAKE_RE.test(chan?.guild_id ?? '')) throw new Error('the moderators\' channel is in no server - DISCORD_MOD_CHANNEL must name a server\'s channel');
  let pointed = false;
  if (app.interactions_endpoint_url !== url) {
    for (let n = 1; ; n++) {
      const r = await call('setting the Interactions Endpoint URL', '/applications/@me', 'PATCH', { interactions_endpoint_url: url });
      if (!r.error) break;
      if (n >= SETUP_TRIES) throw new Error(r.error);
      await wait(SETUP_RETRY_MS);
    }
    pointed = true;
  }
  got(await call('registering /mod', `/applications/${app.id}/guilds/${chan.guild_id}/commands`, 'PUT', [MOD_COMMAND]));
  return { app: app.id, guild: chan.guild_id, pointed };
}

async function main() {
  if (process.argv.includes('--print')) { console.log(JSON.stringify(MOD_COMMAND, null, 2)); return; }
  if (process.argv.includes('--setup')) {
    const { DISCORD_BOT_TOKEN: token, DISCORD_MOD_CHANNEL: channel, DISCORD_PUBLIC_KEY: publicKey, DISCORD_INTERACTIONS_URL: url } = process.env;
    try {
      const done = await discordSetup({ token, channel, publicKey, url });
      console.log(`- the Interactions Endpoint URL: \`${url}\` (${done.pointed ? 'set now' : 'already set'})`);
      console.log(`- /mod: registered in server ${done.guild} for application ${done.app}`);
    } catch (e) {
      console.error(String(e?.message ?? e));
      process.exit(1);
    }
    return;
  }
  const { DISCORD_APP_ID: app, DISCORD_BOT_TOKEN: token, DISCORD_GUILD_ID: guild } = process.env;
  if (!/^\d{5,25}$/.test(app ?? '') || !/^\d{5,25}$/.test(guild ?? '') || !token) {
    console.error('Set DISCORD_APP_ID, DISCORD_GUILD_ID and DISCORD_BOT_TOKEN (see the header).');
    process.exit(2);
  }
  const res = await fetch(`https://discord.com/api/v10/applications/${app}/guilds/${guild}/commands`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bot ${token}`, 'user-agent': DISCORD_USER_AGENT },   // AUDIT SAFE DISCORD-10
    body: JSON.stringify([MOD_COMMAND]),
  });
  const text = await res.text();
  if (!res.ok) { console.error(`Discord said ${res.status}: ${text}`); process.exit(1); }
  console.log(`/mod registered in guild ${guild}.`);
}

if (isMain(import.meta.url)) await main();
