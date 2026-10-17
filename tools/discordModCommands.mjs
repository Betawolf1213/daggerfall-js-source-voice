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

/** The command, as Discord's API takes it: /mod lookup|mute|unmute|ban|unban, each naming a player by name or account id. */
export const MOD_COMMAND = Object.freeze({
  name: 'mod',
  description: 'DFO Online moderation',
  type: 1,
  default_member_permissions: String(1 << 13),   // Manage Messages
  dm_permission: false,
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

async function main() {
  if (process.argv.includes('--print')) { console.log(JSON.stringify(MOD_COMMAND, null, 2)); return; }
  const { DISCORD_APP_ID: app, DISCORD_BOT_TOKEN: token, DISCORD_GUILD_ID: guild } = process.env;
  if (!/^\d{5,25}$/.test(app ?? '') || !/^\d{5,25}$/.test(guild ?? '') || !token) {
    console.error('Set DISCORD_APP_ID, DISCORD_GUILD_ID and DISCORD_BOT_TOKEN (see the header).');
    process.exit(2);
  }
  const res = await fetch(`https://discord.com/api/v10/applications/${app}/guilds/${guild}/commands`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bot ${token}` },
    body: JSON.stringify([MOD_COMMAND]),
  });
  const text = await res.text();
  if (!res.ok) { console.error(`Discord said ${res.status}: ${text}`); process.exit(1); }
  console.log(`/mod registered in guild ${guild}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
