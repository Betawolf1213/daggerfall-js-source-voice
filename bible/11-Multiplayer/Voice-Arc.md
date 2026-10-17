# VOICE - proximity and party voice chat

The record of the voice arc: players heard by the players near them (proximity) and by their party wherever it
stands (party), over a media server of our own. Built by Betawolf1213 (VOICE1 and VOICE2, 2026-10-09 to 10-13 - pull
request #871; VOICE-RELAY-DOOR, 2026-10-16 - #967), taken over and brought onto main at world213 (2026-10-17).

Daggerfall has no voice; DFU has none either. Nothing here departs from a DFU member - it is the online game's own.

**Not the first voice.** An earlier VOICE1 - proximity voice over peer-to-peer WebRTC (STUN only, the relay's `rtc`
frame, world125; PR #427) - was merged and then reverted whole on Mac's word, 2026-09-28: "Do not merge voice chat.
Please revert voice chat but keep other changes" (`06-Systems/Online-Arc.md`, VOICE1 reverted). This arc is another
design (a media server of our own, the relay asked only to vouch), and it shares that one's name by coincidence alone.
Whether voice merges at all is Mac's call, as it was then.

## 1. Status

- **Built and pinned:** the client's law (`src/net/voice/`), the voice service (`server-voice/`), the self-hosted media
  stack (`deploy/voice/`) and the relay's two doors (section 6).
- **Not wired:** no host mounts voice yet - `scenes/world.js` never calls `initVoiceNet`/`frameVoiceNet`. A player sees
  nothing of this arc until that slice lands (section 5 says what it must not reopen). THE FOUR HOSTS RULE binds it: the slice names
  all four hosts, and the wiring goes into a module the host wires (`Host-Split.md`), never into `bootWorld`.
- **Not deployed:** neither Worker is deployed and `VOICE_RELAY_SECRET` is set nowhere. Validated live once, by its
  author (2026-10-13): two browsers joined one proximity room through the podman stack and exchanged real WebRTC
  audio (`RTCPeerConnection.getStats()` showing inbound RTP). Not yet: two real browsers through the relay's presence
  door, a sixteen-player room, a multi-isolate Worker (section 4).

## 2. The three pieces

```
  game client  --HTTPS (JSON)-->  voice service  --HTTPS (Twirp admin)-->  LiveKit (the SFU)
  src/net/voice/  <--credential--  server-voice/                             its own process
        |                               |  presence, party-of (secret-gated)
        |                               v
        |                            the relay (server/, voiceDoor.js)
        +-------------- WebSocket + WebRTC audio, wss://voice.example.com ------------+
```

1. **LiveKit** - a compiled Go server, the SFU: it receives every speaker's audio over WebRTC and forwards it to
   whoever is allowed to hear. The one piece that needs a real host with UDP open; it cannot run on Cloudflare.
2. **`server-voice/`** - the third Worker, beside the relay and the account service: it never touches audio, it
   checks who a player is and where they stand and hands back a short-lived LiveKit credential. The only holder of
   the media server's secret - a different trust from the relay's (whose deploy drops every player) and the account
   service's (the one private key), so a Worker of its own (`server-voice/wrangler.toml`). The same `handle` runs
   under node (`server-voice/src/node.js`) for a fully self-hosted stack.
3. **`src/net/voice/`** - the client: it asks the service over HTTPS, then opens WebRTC straight to LiveKit. No module
   but `voiceTransport.js` knows the LiveKit SDK, which loads lazily on the first connect (`import('livekit-client')`,
   a dev dependency Vite bundles into its own chunk), so a player who never turns voice on never fetches it.

## 3. The media server

`deploy/voice/compose.yaml` stands LiveKit (`livekit.yaml`: `auto_create: false`, 16 participants a room) and the
voice service on one host.

1. **A real key pair.** `docker run --rm livekit/livekit-server generate-keys`; the printed pair into
   `livekit.yaml`'s `keys:` and into `deploy/voice/voice.env` (from `voice.env.example`, gitignored) as
   `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`. The `devkey` pair is for a local stack alone.
2. **Start it.** `cd deploy/voice && podman compose -f compose.yaml --env-file voice.env up -d` (or docker): `livekit`
   on 7880 (signalling), 7881/tcp and 50000-50100/udp (media), and `voice` on 7890, pointed at `livekit:7880` for its
   admin calls. `curl http://localhost:7890/health` answers the service.
3. **Local only: `rtc.node_ip: 127.0.0.1`.** Under a container on the browser's own machine LiveKit otherwise
   advertises its container-internal address as its ICE candidate: signalling connects and media never does
   ("could not establish pc connection"). A real deployment removes it and sets `use_external_ip: true`.
4. **Going public.** A domain with a reverse proxy terminating TLS in front of 7880 (the client opens `wss://` alone -
   `voiceUrlOk`); UDP 50000-50100 and TCP 7881 forwarded straight to the container (the audio path, which no proxy
   carries); a TURN relay for players on restrictive networks. A small VPS is the realistic minimum.

## 4. The voice service

`POST /v1/voice/token { token, room, ly?, channel, party? }` and `POST /v1/voice/place { token, room, ly?, near }`
(`src/net/voice/voiceWire.js`, the one home of both ends' shapes):

- **Who:** the relay's own identity token (`accountClient.js`'s minter) - its verified subject is the voice identity,
  and a body's `playerId` is never read (`roomAuthorizer.js`). A muted account (`mu`) may listen, not publish. A
  credential never outlives the identity token it was minted from.
- **Where:** a proximity ask is admitted only on the relay's word that the subject is hello'd into the room - and the
  layer - it names (section 6); a party ask only on the hub's word that it sits in the party. No relay configured
  (`RELAY_URL`, `VOICE_RELAY_SECRET`) refuses both: fail closed. The relay's answer is kept 5 s per account, room and
  layer (`/place` arrives up to `VOICE_PLACE_HZ_MAX` a second).
- **The room:** never the client's string - `voiceRoomName` derives the SFU room from the channel, the game's key and
  its layer (`vx_<key>[_l<ly>]`, `vp_<party>`), and `roomSharder.js` splits a crowded one into shards of
  `VOICE_ROOM_MAX` (16), first come, sticky per identity.
- **Who hears whom:** `proximityPolicy.js` - a publisher is heard only by the listeners who named it back within the
  stale window (mutual), so a lie about position can only widen one's own hearing, never another's; the publisher's
  own permission list is the law, and the service's unsubscribes on the SFU are a second hand.
- **Rates:** `VOICE_MINT_PER_MIN` mints a minute and `VOICE_PLACE_HZ_MAX` place frames a second an identity; the node
  door refuses a body past `VOICE_BODY_MAX_BYTES` before reading it.
- **Known limit - one isolate.** The policy and the sharder are memory, per isolate (no Durable Object). A Worker
  deploy that spreads players over isolates splits their words: it fails closed (fewer heard, never more), but at
  any real scale voice would go quiet. The node service beside the SFU is one process and has no such limit; a
  Worker deploy past a handful of players needs the policy in a Durable Object first.

## 5. The client and its seams

`VoiceClient` (`voiceClient.js`) is a null object while voice is off - nothing fetched, no SDK, no microphone - and
catches every failure into its state: a voice outage never stops the game. Its retries wait a jittered, doubling
time (`net/backoff.js jittered`), so a relay deploy or an SFU outage does not have every client ask again at once.
The microphone is asked for only after the player's opt-in; a refused one leaves a listener's session.

`voiceNet.js` (the session's one `VoiceClient`) is the seam the wiring slice mounts. VOICE2 built two more - the HUD's
indicator (`ui/voiceHud.js`) and the settings' Voice rows (`ui/voiceSettings.js`) - and they wait for that slice:
AUDIT UI 2 (`test/ui/enhanced/enhancedPause.test.js`) holds every `src/ui` module reachable from a host, its staging
exemption gone on purpose (PX24: a window built, pinned and opened by nothing), so they come back with their mount -
`git checkout c6fa40ec4 -- src/ui/voiceHud.js src/ui/voiceSettings.js`, then `node tools/moveModule.mjs --fixup` for
the client's paths (`src/voice/` is `src/net/voice/` now), and their words through `t()` (L10N4). What the slice must
not reopen (VOICE2's notes):

- `VoiceState.onChange` is ONE slot, not a list: a second consumer chains it (save the old, call it first) and
  restores it on teardown; past two or three consumers it becomes a listener set in `voiceState.js`.
- `voiceHud.js`'s `update(state)` is pull: the HUD's frame calls it, or the indicator freezes at `off`.
- `initVoiceNet` twice is a no-op that ignores the second options: `destroyVoiceNet` first when the audio context is
  rebuilt.
- `frameVoiceNet` swallows every error into the console (a voice bug never stops the loop) - a wrong `peers` shape
  shows only as a repeating console error, so read the console the first time it is wired.
- `frameVoiceNet` takes the room's `layer` too (online.js's `layer`, said in the room's welcome) - section 6.
- `voiceSettingsRows()` hands back new rows and listeners on each call: its mount replaces `.list`'s children
  wholesale, or rows and listeners pile up across the settings pane's re-renders.

## 6. The relay's doors (VOICE-RELAY-DOOR)

Before these doors a proximity ask's `room` was trusted on the client's word: two strangers naming the same key heard
each other wherever they stood. And the party check called `RELAY_URL/party/<acct>`, which the relay never routed,
so party voice checked nothing. `server/src/voiceDoor.js` answers both (world213):

- **The secret.** `POST /internal/voice/presence` and `/internal/voice/party-of` are the public Worker's, called by
  another Worker over the internet, so each is gated by the Worker SECRET `VOICE_RELAY_SECRET` (`npx wrangler secret
  put VOICE_RELAY_SECRET`, the same value as the service's) in header `x-voice-relay-secret`, compared in constant
  time; unset, missing or wrong all answer 403. A secret is not the bundle's bytes: rotating it moves no
  `RELAY_VERSION` and drops nobody.
- **Presence.** The room's key is the relay's own shape (`voiceRoomKeyOk`: a `kind:` key `roomOf` routes -
  `world:<x>,<y>` the open world's, which the first wire's guessed pattern refused). A crowded place overflows into
  layers (wire.js SCALE5d, `key#n`), each its own object and its own crowd, so the ask names the layer its welcome
  said (`ly`, 0 to `LAYERS_MAX - 1`) and the door asks THAT object - the place's own asked of a layer-1 player would
  answer "not here" in exactly the crowded towns voice is for. A layer is asked only of a room that layers; a gate's
  court answers for its copies itself, holding their sockets (`_courtHello`). The object's own half,
  `Room._voicePresenceInternal`, reads its verified-subject index (`_bySub`), never a body.
- **Party-of.** Always the hub's bus (`SOCIAL_ROOM` - its shards hold sockets, the bus the parties), read as every hub
  reading is (`Room._voicePartyOfInternal` -> `_myParty`: a lapsed seat walked out first, a stale pointer cleared).
- **Never an exception.** A room reset or slow is the service's refusal (`here: false`, `party: null`), never an
  error out of the Worker (DO-ASK's law).
- Pinned by `test/server/voicedoor.test.js` through real Rooms and real hellos, each pin killed by its mutant.

## 7. Open

- The wiring slice (section 1), with the HUD's and the settings' mounts.
- Deploy: the voice Worker or the node service with the stack, `VOICE_RELAY_SECRET` on both sides, the relay at
  world213.
- A Durable Object for the policy before a multi-isolate Worker deploy (section 4).
- Spatial shards: a crowded voice room splits by arrival, so two players side by side can land in different shards
  (`roomSharder.js`'s own note); a layer already splits the game's crowd the same way the voice rooms do.
