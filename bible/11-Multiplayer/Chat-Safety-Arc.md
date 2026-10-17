# CHAT SAFETY - blocks, witnessed reports, bans, a reviewer and the moderators' queue

Opened 2026-10-17. A Patreon supporter wrote in the community's channel that they had stopped using the world chat:
homophobic "jokes" about pride flags, asexual players called "attention sluts", aggression that slid past a moderation
team of three. Mac: *"This absolutely hurts my soul. We need to find ways to combat this without the need of ingame
moderation, although we do need a report function. Any good ideas? Maybe integrating an AI moderator?"* A plan was laid
out - block, a report the relay witnesses, a moderators' queue in Discord with a record and a ban, an AI reviewer that
sorts and never bans, a written code of conduct, a new voice's pace - and Mac answered: *"Lets do every single thing
here. I want a full fledged future proof system."*

Not a DFU member: Daggerfall Unity has no chat. Ledger A, CHAT SAFETY.

The slices, one arc and one deploy of each end:

| Slice | What | Where |
|---|---|---|
| SAFE1 | A player's block list | `server-account/src/safety.js`, `src/scenes/chatSafetyHost.js`, `src/net/chat.js`, `src/net/social.js` |
| SAFE2 | The line's witness: the relay stamps every chat line | `src/net/safety/chatStamp.js`, `server/src/index.js` |
| SAFE3 | A report, its case, and the automatic mute | `src/net/safety/safetyLaw.js`, `server-account/src/safety.js`, `src/ui/chatPanel.js` |
| SAFE4 | The record, the ladder, the ban - and the service's door to the relay | `server-account/src/sanctions.js`, `src/net/identityToken.js`, `server/src/index.js` |
| SAFE5 | The reviewer: the relay's feed and an AI model's verdicts | `src/net/safety/chatFeed.js`, `server-account/src/modAi.js`, `server-account/src/safetyClock.js` |
| SAFE6 | A new voice's pace | `src/net/wire.js`, `server/src/index.js` |
| SAFE7 | The code of conduct | `src/net/safety/conduct.js`, `src/ui/conductCard.js`, `privacy/index.html`, `terms/index.html` |
| SAFE8 | The moderators' queue in Discord | `server-account/src/discord.js`, `tools/discordModCommands.mjs` |

The relay is `world214`, the account service `acct150`, migration `0125_chat_safety.sql`.

## 1. Why - what a word list cannot do

TEXT-F1 (2026-10-07, `06-Systems/Online-Arc.md`) stars the words a list names, inside `sanitizeChat`, at both ends. The
lines that drove this arc had no listed word in them, or kept their meaning with one starred: "attention *****" about
asexual players reads exactly as it was meant. Intent is not a spelling. The arc keeps TEXT-F1's mask as the first wall
and adds four more, each answering a different failure:

1. **The player's own wall** (SAFE1): whoever is being harassed can make it stop for themselves, now, with no moderator.
2. **Evidence** (SAFE2, SAFE3): a report a moderator can trust, because the relay - not the reporter - says what was said.
3. **Moderators who need not be in the game** (SAFE8), working from **a record that is never cleared** (SAFE4).
4. **A reviewer that reads intent** (SAFE5) - which sorts the queue and, only when told to, mutes for half an hour.

And two cheap levers beside them: **a written code** every player agrees to before their first line (SAFE7), so the line
is never unwritten, and **a new voice's pace** in public channels (SAFE6), so a throwaway account cannot flood them.

## 2. SAFE1 - the block list

An account's own list of accounts it no longer hears: `blocks` (migration 0125), at most `BLOCKS_MAX` (200), read and
written through `POST /v1/safety/blocks | block | unblock`. Kept by the service so it follows the player to every device;
applied by the client, because the relay fans a line to everyone and what one hearer hides is that hearer's business.

- **The log never keeps a blocked line** (`ChatLog.hears`, set by the host from the list): no tab, no peek, no overhead
  bubble, no search shows it. A block also takes back the lines already heard (`ChatLog.forgetSpeaker`).
- **The social picture drops a blocked account's friend request, party invite and notes** (`SocialState.hears`).
- **The blocked account is never told.** A sender learns nothing from being blocked - the safest answer for the person
  who blocked them.
- `/block <name>`, `/unblock <name>`, `/blocked`, and **Block** on a line's own menu (a speaker's name pressed in the
  chat). A name is resolved as MOD1 resolves one - the players this page holds, then the lines it heard - and two
  accounts of one name is a refusal, never a guess.

**A departure from Community-Arc.** `06-Systems/Community-Arc.md` decided "No block list: a moderator's mute and the
per-reader rate are the walls" for the pages (SOC-PAGE). That held while three moderators could read everything. The
community outgrew it; the pages' own rate stands, and the block list now stands beside it.

## 3. SAFE2 - the line's witness

A report is only as good as its evidence, and a player's own chat log is that player's word: a client can write any
line into its log and "report" it. So the relay - the one party that saw the line, because it relayed it - signs every
chat line it fans out, with the key it already signs its receipts with (`GATE_SIGNING_KEY`, WB3's):

    sg = base64url(Ed25519("c1\n" + JSON.stringify([tab, sub, name, at, text])))

`tab` is the chat tab the line is heard on (`stampTabOf`: World, Region, Lang, Trade, LFG, Party, Guild, or a place's
Local), `sub` the speaker's verified account, `at` the relay's clock. The frame already carries every field but the tab,
so a stamp costs the 86 characters of its signature. The account service checks each stamp with `GATE_PUBLIC_KEY`
(`verifyStamp`) before it keeps a word.

- **The words are the starred ones.** The relay signs what it relayed, which is what everyone read.
- **A reporter may leave lines out; they cannot put words in anyone's mouth.** One line the relay did not relay - other
  words, another speaker, another tab, another moment - refuses the whole report (`report-unwitnessed`).
- **A stamp is never a token, an order or a receipt:** its signed bytes begin `c1\n`, which none of theirs do.
- **Unsigned is a real answer**, as a receipt's: a relay with no key relays its lines unstamped, and they cannot be
  reported. Rolls are not stamped.

## 4. SAFE3 - a report and its case

`POST /v1/safety/report { target, reason, note?, lines }` - the account, a reason (`REPORT_REASONS`: harassment, hate,
sexual, threat, spam, other), an optional note, and 1 to `REPORT_LINES_MAX` (16) stamped lines no older than a day, at
least one the reported account's own (`reportShape`, both ends' law). The client picks the lines (`ChatLog.reportLines`):
a line's own **Report** carries that line and the stamped lines before it on its tab; `/report <name> [reason]` carries
everything that account said that this page heard, the account's own lines first past the bound.

Reports about one account gather into **one open case** (`mod_cases`, a unique index on the open ones): its lines kept
once (`mod_case_lines`, at most `CASE_LINES_MAX`), its reporters once each (`mod_reports`). A case is what a moderator
acts on, and what the reviewer reads.

**The automatic mute, and why it is hard to reach.** `REPORT_AUTO_MUTE` (3) reporters who **count** within an hour mute
the account for the ladder's first rung - half an hour - once a case, by `auto:reports`, and never a moderator. A reporter
counts when the Notice Board's law says they would (AUDIT 28 N3): a registered account, not muted, no sprout (older than
`SPROUT_S`, fourteen days). Five guests made a minute ago cannot mute anybody; three regulars who saw the same line can,
for half an hour, and a moderator reads why on the case. The mute's order goes back to the reporter's client, which
carries it to every room it holds (MOD1's carrier), and to the relay's door (section 5).

Reports are rate-bounded (`REPORT_RATE_MAX` an hour). A muted player may still report.

## 5. SAFE4 - the record, the ladder and the ban

**The record.** MOD1 wrote who muted a player beside the mute, and cleared it with the mute, so a player muted every week
for a month looked like a first offender to the next moderator. Now every mute, unmute, ban, unban and dismissal is a
row in `mod_actions` that nothing clears: who acted (a moderator's account - from the game or from Discord - or the
automatic `auto:reports` / `auto:review`), on whom, until when, why, and the case it answered. MOD1's `/mute` writes it
too.

**The ladder.** A strike is a mute or a ban in the last ninety days (`STRIKE_WINDOW_S`). The next strike earns, by
`LADDER_MIN`: half an hour, then a day, then a week - and past the ladder (`LADDER_BAN_AT`) the suggestion is a ban.
A moderator may always choose otherwise; the automatic mutes only ever take the first rung. `/strikes <name>` (and
Discord's `/mod lookup`) says the strikes, the next rung, what stands now and the last acts.

**The ban.** MOD1 bounded a mute at a week: "Longer is a ban, which is a different decision and not one Mac has asked
for." He has now. A ban is `players.banned_until` (1 to `BAN_DAYS_MAX` days, or `BAN_FOREVER`) and the reason the player
is shown. The service answers a banned account `{ error: 'banned', until, reason }` on **every door but signing out**, so
it mints no token and opens no room. `/ban <name> [days|perm]` and `/unban <name>` in the game, the buttons and `/mod`
in Discord. A moderator is never banned, nor muted, by anyone (MOD1's `protected`).

**The ban order.** `{o:'ban', s, bn, i, e}` (`mintBanOrder`) - its own kind among `ORDER_KINDS`, its field `bn` and no
other kind's (never `bu`, which the home order holds). A room that checks one silences the account's sockets there and
tells them `banned`; the client says so and leaves every room. A ban lifted (`bn` 0) lifts the silence.

**The service's door to the relay.** MOD1's orders are carried by the moderator's own client. A mute or ban from Discord,
or an automatic one, has none - so the service posts its signed order to the relay's `SAFE_LAW_PATH` (`RELAY_LAW_URL`).
The Worker checks the signature with the key every room checks a token with **before the hub is woken** (a stranger's
post costs one verify and wakes nothing), and the hub applies it to its sockets and **hands the order to its target's own
hub sockets** (`law`), whose client carries it to every room it holds. Never the truth - the row is - only how a room
already open hears it now; a push that fails lands on the target's next connection, as MOD1's always did.

**What a modified client keeps.** A client that refuses to carry its own order keeps talking in the rooms the order did
not reach - its region, language, Trade or LFG channel - until its next connection, whose token carries the mute (a ban:
whose token is refused). The hub, and every room a moderator's or a reporter's client holds, hears it at once. MOD1 had
the same gap; this arc narrows it. Closing it whole is a relay that re-asks a fresh token of an open socket - a slice of
its own (section 11).

## 6. SAFE5 - the reviewer

**Why a model.** The lines this arc answers to carry their meaning past any list. A language model reading the code's own
rules reads intent - including "it's just a joke" - and says why in a sentence a moderator can act on.

**What it reads.** Two things, and nothing else:

1. **A reported case's lines** (focus: the reported account), when the case opens or grows.
2. **The public channels' feed** - World, Region, a language, Trade and LFG; never a party's, a guild's or a place's talk.
   The relay keeps a copy of each public line it relays (`_feedLine`), never awaited by the line, and posts a batch of
   them (`FEED_BATCH` lines, or `FEED_WAIT_MS` after the first) to `MOD_FEED_URL`, signed with its receipt key
   (`sealFeed`). The service checks the signature and keeps the batch once (`mod_feed`) while the reviewer is on; off, it
   drops it unread. **This is the relay's first door to the service** (identityToken.js: "The relay never reads D1, never
   talks to the account service"): one way, off until its URL is set, never in a line's path, the public tabs alone,
   signed.

**When it reads.** On the service's minute clock (`safetyClock.js`, cron's `safety` job) - never in a request:
`FEED_READS_MAX` batches and `TRIAGE_MAX` cases a minute, within `MOD_AI_DAILY_MAX` calls a UTC day (`mod_ai_days`).
A speaker the feed's reviewer finds breaking the code at severity 2 or worse gets a case of the reviewer's own, with the
flagged line and the three before it.

**The call.** The Messages API over fetch - not the SDK, because the account Worker deploys from the tree without an
install step (`npx wrangler`, `account-deploy.yml`). The current Haiku (`MOD_AI_MODEL_DEFAULT`, `claude-haiku-5-5`) unless
`MOD_AI_MODEL` names another - fast and cheap enough to read every public line. The brief (`reviewerPrompt`) is the code
of conduct's own rules, the categories, the severity scale and what is allowed (trash talk about the game, swearing at no
one, roleplay violence against monsters, a reclaimed word about one's own identity); it is the same every call, so it is
cached. Effort low. The answer is held to a JSON schema (`VERDICT_SCHEMA`): for each line that breaks the code, its
category, severity 1-3, confidence and a sentence.

**What it may not do:**

- **It never bans.** With `MOD_AI` "on", a verdict of severity 3, in harassment, hate, sexual or threat, at confidence
  0.9 or more (`flagActs`), mutes for half an hour by `auto:review` - once a case, never a moderator, the order pushed to
  the relay's door. Spam and a leak of someone's details are a moderator's to weigh.
- **With "shadow" it acts on nothing.** Its verdict is said beside every case in Discord, marked as a shadow's. Shipped
  "shadow": Mac's own law from INT5, "Measure 7 days, then enforce" - read what it says for a fortnight, then turn it on.
- **It reads data, never orders.** A player will type "ignore your instructions". The lines go in as JSON inside one
  tag, the brief says they are data, and the answer is a schema. A reviewer talked out of a verdict acts on nothing,
  which is where the game was before it.
- **It is told as little as it needs.** Speakers are P1, P2 - never an account id or a name.
- **It is never in the line's path**, and a reviewer that is down, out of its day's calls or refusing costs nothing but
  its verdicts: its work waits for the next minute, and a case waits on it at most `REVIEW_WAIT_S` before its card goes
  out without one.

## 7. SAFE6 - a new voice's pace

A socket whose verified token wears the sprout - a guest, or an account younger than `SPROUT_S` - says one line in a
public channel every `NEW_VOICE_GAP_MS` (four seconds), measured on its own meter at the relay (`_newVoiceSpends`). A line
too soon is refused to its speaker alone with how long to wait (`{t:'slowed', ms}`), never fanned and never struck. An
ordinary conversation's pace, and a throwaway account's flood slowed to it. Party, guild and a place's talk are never
slowed. The client says so once in a while, not on every press.

## 8. SAFE7 - the code of conduct

Six rules (`conductRules`, in the player's language): respect - no harassment, bullying or threats anywhere; **no hate -
never attack anyone for their race, ethnicity, nationality, religion, sex, gender identity, sexual orientation (asexuality
included), disability or age, not even as a joke**; no sexual remarks aimed at players and nothing sexual involving
minors; nobody's personal information; no spam, scams or pretending to be staff; trash talk about the game is fine,
attacking people is not. Then what follows a broken rule, and who reads a report.

The rule against hate names the joke because the joke is the form it takes in a game's chat, and a rule that left it
unsaid would be argued around in the first hour. It names asexuality because that is who was being called names.

**One text for both.** The reviewer's brief is built from these same lines in English, so a player is never held to a
rule they were not shown.

**Agreed before the first line.** The token's mint says whether the account has agreed to the code as it stands
(`conduct`); the first line a player sends while it says no stands a card over the game (`ui/conductCard.js`) and the
line stays in the field. **I agree** keeps it on the account (`players.conduct_v`, `POST /v1/safety/conduct`, the
version shown - `conduct-stale` for an older one); **Not now** closes the card. `/rules` shows it again. The version is a
date (`CONDUCT_VERSION`), as the Terms' are; a new one asks every player again. An older service that says nothing is
heard as yes - a client never stops chat over a field its service does not send.

**The Terms and the Privacy Policy** moved with it, both to 2026-10-17: the Terms' conduct section names hate by what it
attacks and makes the code part of the Terms; the Policy says the stamped messages and reports, the automated review by
a third-party AI provider (pseudonymous, the public channels and reported lines alone, never a ban), the block list and
the record, and how long each is kept. A new version refuses an older build's sign-up (`terms-stale`, TERMS1's law) for
the minutes between the two deploys - the price of never recording an agreement to words nobody showed the player.

## 9. SAFE8 - the moderators' queue in Discord

A moderator need not be in the game. Every case is a **card** in a private Discord channel: the lines (the reported
account's marked `>`), the reports and their reasons, the reviewer's verdict (a shadow's says so), the account's strikes
and the next rung, and what was done automatically - with buttons: **Mute 30 min, Mute 1 day, Mute 7 days, Ban 30 days,
Dismiss**. A press acts, records the act against the case, pushes the order to the relay's door, resolves the case, and
redraws the card in place without its buttons. `/mod lookup | mute | unmute | ban | unban <player>` does the same by name
or account id.

**Who may act is the game's question.** `DISCORD_MODERATORS` pairs a Discord user's id with a game handle; a press is that
account's act and only while it holds `MODERATOR_HANDLES` or `DEVELOPER_HANDLES`. Taking a handle off the list takes the
buttons with it; a Discord role grants nothing; the record names the moderator's own account, "(Discord)".

**Every interaction is signed** by the Discord application's Ed25519 key; the service checks the signature over the exact
bytes, and a timestamp more than five minutes old, before reading a byte (`discordSigned`). The bot pings nobody and a
player's words are drawn in a code block, so no line is markdown.

**The setup**, once (Mac):

1. In the Discord Developer Portal, make an application with a bot. Invite the bot to the server with the permissions
   to send messages and use application commands in the private moderators' channel.
2. Put the bot's token in the repository's secrets as `DISCORD_BOT_TOKEN`, and an Anthropic API key as
   `ANTHROPIC_API_KEY` (the reviewer). The account deploy puts both on the Worker (`account-deploy.yml`, "Put the chat
   safety's secrets") and names, in its summary, the Interactions Endpoint URL to give the application.
3. In `server-account/wrangler.toml`: `DISCORD_MOD_CHANNEL` (the channel's id), `DISCORD_PUBLIC_KEY` (the application's
   public key) and `DISCORD_MODERATORS` (`<discord id>:<handle>` for each moderator).
4. Set the application's Interactions Endpoint URL to `<account service>/v1/discord/interactions` - Discord sends a signed
   ping, which the service answers.
5. Register `/mod` once: `DISCORD_APP_ID=... DISCORD_BOT_TOKEN=... DISCORD_GUILD_ID=... node tools/discordModCommands.mjs`.

With none of it set, the cases still gather, the reviewer still reads (with its key), and the game's `/mute`, `/ban` and
`/strikes` still answer - the queue is simply not posted.

## 10. Retention

The relay's feed batches are kept for a day (`FEED_KEEP_S`). A case's lines go ninety days after the case is resolved
(`RESOLVED_LINES_KEEP_S`); a case left open ninety days closes as expired (`CASE_OPEN_MAX_S`); the reviewer's daily counts
a month. The case itself and the record of acts are kept for enforcement. Everything is the hour's sweep's
(`safetySweep`). An account that is deleted takes its blocks, its cases, their lines and reports, and the record of acts
on it (CASCADE) - no route deletes an account today.

## 11. Open, on purpose

- **Ban evasion.** A banned player can make a new guest. A guest's reports never count, and a new voice is slowed - but
  stopping a returning player is a device or network question, not a chat one, and is a slice of its own if it is needed.
- **A socket kept open past its order** (section 5): a relay that re-asks a fresh token of an open socket every few
  minutes would close the last gap. Its cost is a token mint a socket a few minutes, which SCALE4's storm law prices.
- **A word TEXT-F1 stars that a community uses about itself.** The list stars `dyke`, which queer players use of
  themselves; the reviewer is told reclaimed words about one's own identity are allowed, the mask is not. Unstarring a
  slur is a policy call, Mac's.
- **Guild invites from a blocked account** come through the guild book (`/v1/guilds/invites`), which names the inviter by
  name, not by account; filtering them needs the service to name the account.

## 12. Files and pins

- The law: `src/net/safety/chatStamp.js`, `src/net/safety/chatFeed.js`, `src/net/safety/safetyLaw.js`,
  `src/net/safety/conduct.js`; the ban order in `src/net/identityToken.js`; the frames and `NEW_VOICE_GAP_MS` in
  `src/net/wire.js`.
- The relay: `server/src/index.js` - `_newVoiceSpends`, `_stamped`, `_feedLine`, `_feedFlush`, `_banFrame`,
  `_lawInternal`, `_takeOrder`, and the Worker's `lawDoor`.
- The service: `server-account/src/safety.js`, `server-account/src/sanctions.js`, `server-account/src/modAi.js`,
  `server-account/src/discord.js`, `server-account/src/safetyClock.js`, migration `0125_chat_safety.sql`.
- The client: `src/scenes/chatSafetyHost.js` (what `bootWorld` wires), `src/ui/conductCard.js`, the line menu in
  `src/ui/chatPanel.js`, `src/net/chat.js`, `src/net/social.js`, `src/net/online.js`, `src/net/accountClient.js`.
- The pins: `test/net/safety/safe_law.test.js`, `test/net/safety/safe_relay.test.js`,
  `test/net/safety/safe_client.test.js`, `test/server/safe_service.test.js`, `test/server/safe_review.test.js`, and the
  mutants in `tools/mutants/safe.json`.
