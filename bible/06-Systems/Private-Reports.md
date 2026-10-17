# Private reports

PRIVATE-REPORT (2026-10-17, Mac: "Can we add a private disclosure method for exploits/bugs with the client"): a player
tells the developers about an exploit, a bug or a security hole from inside the game. Only the readers that
`REPORT_READER_HANDLES` names can read it. Daggerfall Unity has no online service, so it has nothing to depart from:
the feature is the port's own, built on the SERVER-POST mailbox (`06-Systems/Accounts-And-Cloud-Saves-Arc.md`
SERVER-POST, `10-UI/UI-Arc.md` SERVER-POST).

## Why private, and why in the client

Exploits were reported in chat and on Discord, where every player could read them before they were fixed. The
exploit audit (`01-Overview/audits/Exploit-Audit-2026-10-11.md`) found dupes and gold farms after they had spread. A
report sent from the client goes to the account service and nowhere else. It reaches no chat log, no Notice Board, no
letter and no GitHub issue.

**Nothing reads the reports in an Actions log.** The repository is public, and so is every workflow run's log and
summary. The operator's workflows that read D1 (`sd-clears.yml`, `server-post.yml`'s dry run) print what they read,
so a report read that way would be published. The readers read reports in the game, through routes that need their
own session.

## The player's side

- **The door.** The mailbox window has two buttons under the post: **Report a bug or exploit** for every player, and
  **Private reports** for a reader (`ui/enhanced/enhancedPost.js`, `reportDoors`). `/report` opens the mailbox window
  on its form directly, on either skin and wherever the player stands. It is `/mail`'s own door:
  `net/chatCommands.js` `mailboxCommandOf`, `ui/pauseDoor.js`, `ui/enhanced/enhancedMenu.js` at `'report'`.
- **The form** (`ui/enhanced/enhancedReport.js`). It asks what the report is about (an exploit, a bug, or account or
  server security, each with a line of what it means), a short title, and what happens and how to make it happen
  (a counter shows the characters left). Before anything is sent, the form says what goes with the report: the
  player's username, and the build the pause window prints (`buildTag.js`, REL8), with whether this is the desktop
  app or a browser (`net/privateReport.js` `reportContext`). Nothing else is sent: no location, no user agent and no
  save.
- **The form is never rebuilt while the player types in it.** The window draws on every change of the box or the
  desk, including the heartbeat's look every three minutes. A report pane answers a draw with `update`, which touches
  only the Send button and the list under the form. The window rebuilds a pane only when its key changes
  (`reportPaneKey`).
- **A send is one report, however often it is asked.** The client mints a `rid` once per draft (`ReportDesk.send`). If
  the answer is lost, the same send is asked again and the service answers with the report it already made
  (`repeat`). If the draft changes after a failure, it is a new send (`setDraft`), never answered with the old one's
  report. The draft lives on the PostBox for the sitting, so a half-written report survives the pause face being
  rebuilt, closed or reopened.
- **The reporter's list.** The player's own reports are listed under the form, newest first, each with **Sent**,
  **Read by the developers**, or how it was closed: **Fixed**, **Won't fix** or **Duplicate**. The list holds titles and
  states only. The service never answers with the words back, or with which reader read a report.

## The readers' side

- **Who reads.** `REPORT_READER_HANDLES` in `server-account/wrangler.toml` lists them, read at every call the way
  `DEVELOPER_HANDLES` is (`server-account/src/reports.js` `isReportReader`, `titles.js` `handleList`). It ships as
  `Lattymoy` alone. Being a developer or a moderator gives no access: an exploit read by one more person is one more
  person who can use it before it is fixed. Adding a reader is a one-line, reviewed and deployed edit. An empty list is
  valid: the reports wait, unread.
- **Told when one comes.** For a reader, and only a reader, the post box answer (`/v1/post/box`, and the heartbeat's
  `post` part) carries `reports: { unread, open }` (`post.js` `postBoxOf`). Nobody else's box carries the key or
  costs a statement for it. The envelope counts unread reports with the post (`PostBox.waiting`). A rise is said on
  the world tab as a count only, never a report's words, because the world tab is read over shoulders and on streams
  (`postNoticeText`, `kind: 'reports'`).
- **The inbox.** Open reports are listed with the unopened first, then the newest; closed reports are listed with the
  last closed first. Each row shows its kind, who sent it and when. Opening a report shows its words and the build it
  came from, and stamps it read with the reader's id. It can be closed as fixed, won't fix or duplicate, and opened
  again. Closing stamps when and by whom.

## The service

- **Table.** `private_reports`, migration 0126 (`server-account/migrations/0126_private_reports.sql`). One report per
  send per account (`UNIQUE (from_id, rid)`). An account that is deleted takes its reports with it (`CASCADE`), as it
  takes its letters. The table's CHECKs hold the law's bounds, so a row the client could not read is never written.
- **Routes.** Five POSTs, each needing a session, with every id in the body: `/v1/report/send`, `/v1/report/mine`,
  `/v1/report/inbox`, `/v1/report/read`, `/v1/report/close` (`index.js`, `service.js` `ROUTES`). A guest is refused
  with `report-needs-account` (403). A guest's row is a device, and nobody could follow up a report filed under it once
  storage is cleared. Every refusal word has a sentence (`net/accountClient.js` `REFUSALS`).
- **Bounds** (`src/net/reportLaw.js`, which both ends read). A title is 3 to 80 characters and the words are 10 to
  3,000, cleaned on both ends: control characters out, Windows line ends made one. An account may send
  `REPORT_SEND_MAX` (5) an hour (`report-rate`, 429), and may hold `REPORT_OPEN_MAX` (20) open
  (`report-full`, 409). The open bound is the insert's own `WHERE`, so two racing sends cannot both pass it, and a
  closed report makes room. A send asked again under its `rid` is answered before the hour's bound is counted. The
  send reads its body to `REPORT_BODY_BYTES` (24 KiB), not the service's 4 KiB (`service.js` `MAX_BODY_BYTES`):
  3,000 characters of any script past ASCII are past 4 KiB as UTF-8.
- **Context** is kept in its shape and nothing else (`reportContextOf`): an update number, a build hash, and
  `desktop` or `browser`. Anything else a client sends beside the words is dropped, never stored.
- **Version.** `ACCOUNT_VERSION` acct152. It deploys with migration 0126 through `account-deploy.yml` on the merge to
  main. The site's form against a service not yet deployed is answered `not-found`, and the form says the service's
  sentence for a failure. Nothing is lost, because the draft stays in the form.

## The four hosts

`/report` is read where `/mail` is. `scenes/world.js` (the streaming host's chat) asks `mailboxCommandOf`; that line
was rewritten in place, and `bootWorld` did not grow (`test/scenes/hostceiling.test.js`). `scenes/worldModes.js`
(interiors) and `scenes/dungeonContext.js` (dungeons) open their own pause at the name they are handed
(`openPauseAt`, unchanged). `scenes/exterior.js` (the fixed-city bench) runs no online lane, so it has no mailbox and
no report form, as it has no `/mail`.

## Privacy

The Privacy Policy (`privacy/index.html`, PRIVACY_VERSION 2026-09-28) already covers what a report is: it lists
"Support requests and communications with project staff" and "Error, crash, and diagnostic information" among what is
collected, and "Detect cheating, exploits, abuse" among its uses. No new version, and no account asked to tick again.
Reports are kept: the service deletes no account today, and a player's row removed by hand (a deletion request) takes
its reports with it (`CASCADE`).

## Translations

Every sentence the form, the inbox, the notice, `/help` and the refusals say goes through `t()` (L10N4's ratchet).
The 67 new keys are drafted in-session for the thirteen whole languages (`tools/l10nInSession.mjs`). The twelve still
drafting owe them with the rest of their catalog.

## SECURITY.md

`SECURITY.md` at the root is the public policy that GitHub shows on the Security tab. It names both channels: `/report`
in the game, and GitHub's private vulnerability reporting for holes in the code or the servers that need no game
account. It also says what to include, what counts, how to act in good faith under the Terms, and what happens next.
GitHub's **Report a vulnerability** button exists only once private vulnerability reporting is switched on in the
repository's settings (Settings, Code security). That switch is Mac's to flip and is not in this tree.

## Tests

- `test/server/private_reports_service.test.js`: the table and the doors, a send (its cleaning, its `rid`, its own body
  bound), the two bounds, the reporter's list, the readers alone, the reader's count on the box and the heartbeat.
- `test/net/private_reports_client.test.js`: the desk over the real service (a lost answer asked again, a changed
  draft), the reader's box and its notice, the form and the inbox in the mailbox window on a fake DOM, and the doors.
- `tools/mutants/privatereport.json`: 29 mutants, all dead. Two SERVER-POST records were re-aimed at the lines this
  slice moved (`serverpost.json`: the envelope's count, the classic skin's door), and both are dead.

## Open

- A reader cannot write back to a reporter. A reply would be a piece of the server's post, which only the operator's
  workflow writes today, so that is a later slice.
- Whether any developer besides Mac should read reports is a line in `wrangler.toml`.
