// DISCORD-SETUP (2026-10-17, Mac: "Can you set the discord end up for me"; bible/11-Multiplayer/Chat-Safety-Arc.md
// section 9): THE DISCORD END FROM THE TOKEN ALONE - tools/discordModCommands.mjs --setup reads the application's id and
// public key from Discord, the server from the moderators' channel, points the Interactions Endpoint URL at the service
// only when it differs (offered again while an old instance answers the PING), registers /mod, and says which step
// Discord refused - never the token.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { discordSetup, MOD_COMMAND, SETUP_TRIES } from '../../tools/discordModCommands.mjs';

const TOKEN = 'bot-token-never-said';
const KEY = 'ab'.repeat(32);
const DOOR = 'https://accounts.example.workers.dev/v1/discord/interactions';
const APP = '111111111111111111', GUILD = '222222222222222222', CHANNEL = '333333333333333333';

/** A Discord that answers each path as told, and keeps every call. */
const fakeDiscord = ({ app = { id: APP, verify_key: KEY, interactions_endpoint_url: null }, channel = { id: CHANNEL, guild_id: GUILD }, patch = [200], put = 200, chanStatus = 200 } = {}) => {
  const calls = [];
  const patches = [...patch];
  const answer = (status, json) => ({ ok: status >= 200 && status < 300, status, text: async () => (json === undefined ? '' : JSON.stringify(json)) });
  const fetchFn = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body });
    const path = url.replace('https://discord.com/api/v10', '');
    if (path === '/applications/@me' && init.method === 'GET') return answer(200, app);
    if (path === `/channels/${CHANNEL}`) return chanStatus === 200 ? answer(200, channel) : answer(chanStatus, { message: 'Missing Access', code: 50001 });
    if (path === '/applications/@me' && init.method === 'PATCH') {
      const s = patches.length > 1 ? patches.shift() : patches[0];
      return s === 200 ? answer(200, { ...app, interactions_endpoint_url: JSON.parse(init.body).interactions_endpoint_url }) : answer(s, { message: 'interactions_endpoint_url: The specified interactions endpoint url could not be verified.' });
    }
    if (path === `/applications/${APP}/guilds/${GUILD}/commands` && init.method === 'PUT') return answer(put, put === 200 ? JSON.parse(init.body) : { message: 'Missing Access' });
    return answer(404, { message: 'Unknown' });
  };
  return { fetchFn, calls };
};
const args = (d, over = {}) => ({ token: TOKEN, channel: CHANNEL, publicKey: KEY, url: DOOR, fetchFn: d.fetchFn, wait: async () => {}, ...over });

test('DISCORD-SETUP: from the token alone - the application read, the server read off the moderators\' channel, the URL set, /mod written over (PUT) in that server; every call the bot\'s', async () => {
  const d = fakeDiscord();
  const done = await discordSetup(args(d));
  assert.deepEqual(done, { app: APP, guild: GUILD, pointed: true });
  assert.deepEqual(d.calls.map((c) => `${c.method} ${c.url.replace('https://discord.com/api/v10', '')}`),
    ['GET /applications/@me', `GET /channels/${CHANNEL}`, 'PATCH /applications/@me', `PUT /applications/${APP}/guilds/${GUILD}/commands`]);
  assert.deepEqual(JSON.parse(d.calls[2].body), { interactions_endpoint_url: DOOR }, 'the PATCH carries the URL and nothing else');
  assert.deepEqual(JSON.parse(d.calls[3].body), [MOD_COMMAND], 'the one command, as registered by hand');
  for (const c of d.calls) {
    assert.equal(c.headers.authorization, `Bot ${TOKEN}`);
    assert.match(c.headers['user-agent'], /^DiscordBot \(/, 'Discord\'s required User-Agent');
  }
});

test('DISCORD-SETUP: a URL already right is left alone - no PATCH, so no PING a deploy did not need; /mod is still written', async () => {
  const d = fakeDiscord({ app: { id: APP, verify_key: KEY, interactions_endpoint_url: DOOR } });
  const done = await discordSetup(args(d));
  assert.equal(done.pointed, false);
  assert.equal(d.calls.some((c) => c.method === 'PATCH'), false);
  assert.equal(d.calls.at(-1).method, 'PUT');
});

test('DISCORD-SETUP: a public key that is not the application\'s is said, with the right one, before Discord is asked to change anything', async () => {
  const d = fakeDiscord({ app: { id: APP, verify_key: 'cd'.repeat(32), interactions_endpoint_url: null } });
  await assert.rejects(discordSetup(args(d)), (e) => /DISCORD_PUBLIC_KEY is not this application's public key/.test(e.message) && e.message.includes('cd'.repeat(32)));
  assert.deepEqual(d.calls.map((c) => c.method), ['GET'], 'nothing changed, nothing registered');
});

test('DISCORD-SETUP: the PING meeting an old instance is offered again - a refusal believed only after SETUP_TRIES, with Discord\'s words and never the token', async () => {
  const late = fakeDiscord({ patch: [400, 400, 200] });
  const waits = [];
  const done = await discordSetup(args(late, { wait: async (ms) => { waits.push(ms); } }));
  assert.equal(done.pointed, true);
  assert.equal(late.calls.filter((c) => c.method === 'PATCH').length, 3);
  assert.equal(waits.length, 2, 'a wait between offers, none after the one that took');

  const never = fakeDiscord({ patch: [400] });
  await assert.rejects(discordSetup(args(never)), (e) => /setting the Interactions Endpoint URL: Discord said 400: .*could not be verified/.test(e.message) && !e.message.includes(TOKEN));
  assert.equal(never.calls.filter((c) => c.method === 'PATCH').length, SETUP_TRIES);
  assert.equal(never.calls.some((c) => c.method === 'PUT'), false, '/mod is not registered against an application Discord will not reach');
});

test('DISCORD-SETUP: a channel the bot cannot see names the likely cause; a refused /mod is said; bad inputs are refused before any call', async () => {
  const blind = fakeDiscord({ chanStatus: 403 });
  await assert.rejects(discordSetup(args(blind)), /reading the moderators' channel \(is the bot in the server, with View Channel there\?\): Discord said 403/);
  assert.equal(blind.calls.some((c) => c.method !== 'GET'), false);

  const dm = fakeDiscord({ channel: { id: CHANNEL } });
  await assert.rejects(discordSetup(args(dm)), /in no server/);

  const refused = fakeDiscord({ put: 403 });
  await assert.rejects(discordSetup(args(refused)), /registering \/mod: Discord said 403/);

  for (const [over, why] of [[{ token: '' }, /no bot token/], [{ channel: 'general' }, /not a channel id/], [{ publicKey: 'xyz' }, /64-character hex/], [{ url: 'http://x.dev/v1/discord/interactions' }, /interactions door/], [{ url: 'https://x.dev/v1/health' }, /interactions door/]]) {
    const d = fakeDiscord();
    await assert.rejects(discordSetup(args(d, over)), why);
    assert.equal(d.calls.length, 0, 'nothing sent');
  }
});

test('DISCORD-SETUP: the deploy runs it LAST, the token an env var from the repository\'s secrets and never a word of the command, the door read off the deploy, and nothing asked of Discord when the token, channel or key is not set', () => {
  const wf = readFileSync(new URL('../../.github/workflows/account-deploy.yml', import.meta.url), 'utf8');
  const steps = wf.split(/\n      - name: /).slice(1);
  const step = steps.at(-1);
  assert.match(step, /^Point Discord at the service, where the repository has the bot's token\n/, 'the last step - a refusal hides no check above it');
  const run = step.slice(step.indexOf('run: |'));
  assert.match(step, /env:\n\s+DISCORD_BOT_TOKEN: \$\{\{ secrets\.DISCORD_BOT_TOKEN \}\}\n/);
  assert.doesNotMatch(run, /secrets\.|DISCORD_BOT_TOKEN="|echo[^\n]*\$\{?DISCORD_BOT_TOKEN/, 'the token is never in the command line, never echoed');
  assert.match(run, /DISCORD_INTERACTIONS_URL="\$\{\{ steps\.deploy\.outputs\.base \}\}\/v1\/discord\/interactions" node tools\/discordModCommands\.mjs --setup/);
  assert.match(run, /grep -oP '\^DISCORD_MOD_CHANNEL[^']*' "\$toml"/, 'the channel read from the config that ships it');
  assert.match(run, /grep -oP '\^DISCORD_PUBLIC_KEY[^']*' "\$toml"/, 'and the key');
  assert.match(run, /if \[ -z "\$\{DISCORD_BOT_TOKEN\}" \] \|\| \[ -z "\$channel" \] \|\| \[ -z "\$key" \]; then[\s\S]*?exit 0\n\s+fi/, 'unset is said and skipped');
  assert.match(run, /::error::Discord was not pointed at the service[^\n]*\n\s+exit 1/, 'a refusal turns the deploy red');
});
