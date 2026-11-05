# Decisions

Why some things are built the way they are. Each entry: the problem, what was decided, and what it costs.
Newest last. When a decision changes, add a new entry that replaces the old one instead of editing history.

---

## D-01 · Routes call queries, never the database

**Problem.** The same numbers (balance, totals) are shown by several endpoints. If each endpoint had its own SQL,
a fix in one would not reach the others, and two screens could show different values for the same thing.

**Decision.** All SQL lives in `src/db/queries/<resource>`. Routes only parse, authorise, call queries and serialise.
`/home` reuses `getDashboardBalance` and `getSummaryReport` instead of its own queries.

**Cost.** One more file to open when following a request.

## D-02 · Everything a change causes is written in the same transaction

**Problem.** A change also writes a history snapshot, an activity log entry and sometimes a notification.
Written separately, a failure halfway would leave e.g. a "you were added to X" notification for a membership that
was never saved.

**Decision.** These writes take the `tx` of the change and run inside its `db.transaction`. Updates that used to run
without a transaction (`updateFinancialRecord`, `updateInstallmentPlan`, card and bank account updates) now use one.

**Cost.** Slightly longer transactions. Exception: Better Auth events (D-04).

## D-03 · Who made the request comes from a request context, not from parameters

**Problem.** The activity log needs the user, IP and user agent, but about 30 write queries only receive the data they
change. Adding an `actorId` to all of them and to every route would be a large, error-prone change.

**Decision.** `withErrors` opens an `AsyncLocalStorage` context per request with the IP and user agent;
`requireSession` stores the user in it; `logActivity` reads it (`lib/api/request-context.ts`).
Next.js uses the same mechanism for `headers()` and `cookies()`.

**Cost.** The dependency is implicit. `logActivity` throws if no user is known, so a write called outside an
authenticated request (a script, a seed) fails loudly instead of logging nobody.

## D-04 · Better Auth events are logged right after, not in the same transaction

**Problem.** Sign-in, sign-out, password and 2FA changes happen inside Better Auth, which does not share its transaction.

**Decision.** `databaseHooks` (`session.create/delete`, `account.update`, `user.update`) call `lib/auth-activity.ts`,
which uses the endpoint `path` to know which event it was. A failure to log is written to the console and ignored.

**Cost.** In a rare failure, one account event can be missing from the log. Losing a log line is better than failing a
sign-in that already happened.

## D-05 · History: one entry per source, refreshed by a "sync" that copies the final state

**Problem.** `Transaction` keeps one row per financial record / installment plan, including deleted ones. Copying only
the fields sent in each request breaks as soon as someone adds a field, or when a rule changes the request
(attaching a record to a plan replaces its `record_type_id`).

**Decision.** `syncFinancialRecordTransaction` / `syncInstallmentPlanTransaction` read the source row **after** the
change, inside the transaction, and upsert it (`ON DUPLICATE KEY UPDATE` on `source_type + source_id`).
Create, update and soft delete all call the same function. Rows saved before this existed are filled with
`bun run db:backfill:transactions`.

**Cost.** One extra `SELECT` per write. A plan appears once as a plan and once per installment record, so the history
must not be summed for totals (use `/balance` or `/reports/summary`).

## D-06 · The activity log stores names, never values

**Problem.** The log is visible to dashboard and bank account owners; it must not leak secrets or card data.

**Decision.** `metadata` holds the entity name on create and only the **names** of changed fields on update
(`{ "fields": ["cvv"] }`), in API snake_case. Card entries keep only the card type and owner.
Queries select only the columns they need, so secrets (password hash, tokens, card number) never reach the API layer.

**Cost.** The log says *what* changed, not *from what to what*.

## D-07 · Device data (IP, user agent) only for its owner

**Problem.** The IP gives an approximate location. A dashboard owner needs to know who changed something, not where
that person was (GDPR data minimisation).

**Decision.** `ip_address` and `user_agent` are stored on every entry but only returned by `GET /me/activity-logs`, so a
user can spot a sign-in they do not recognise.

**Cost.** An organisation that needs device data for audits would need a separate admin feature.

## D-08 · 404, not 403, for things you cannot see

**Problem.** A `403` for another user's dashboard, session or notification confirms that it exists.

**Decision.** Non-members and non-owners of a session/notification get `404`. Queries filter by the caller
(`WHERE user_id = ?`) so another user's id simply matches nothing. `403` is only for members without enough role.

**Cost.** Harder to debug "why 404?" — check membership first.

## D-09 · Idempotent writes log only real changes

**Problem.** Deleting or freezing twice (double tap, retried request) returns success both times; logging both would
show an action that happened once as if it happened twice.

**Decision.** The log entry is written only when the `UPDATE` changed a row (`affectedRows > 0`), or when the state
really changes (freeze/unfreeze, membership role).

## D-10 · Reports group per day before converting

**Problem.** Totals can mix currencies, and each day has its own exchange rate. With `group_by=tag` a record with two
tags is in two groups.

**Decision.** The database sums per (group, currency, day); each sum is converted with the rate of its day and added in
TypeScript with decimal strings. The report `total` is computed from the records, not by adding the groups.

## D-11 · Swapping the reserved colors uses a temporary color and locks both rows

**Problem.** `UNIQUE (dashboard_id, color_id)` rejects a direct swap of the colors of `Income` and `Expenses`
(README, Open Item 11). Two concurrent swaps could also deadlock.

**Decision.** In one transaction: lock both rows (`SELECT ... FOR UPDATE`), move the partner to a free color, give the
current type the partner's color, give the partner the old color.

## D-12 · Exchange rates: cache first, generous timeout, `502` only when nothing is known

**Problem.** Frankfurter is an external free service; it can be slow or down (seen as a Cloudflare `522`).

**Decision.** Rates are cached in `Exchange_Rate`; a stale cached rate is used if the provider fails. The timeout is
`EXCHANGE_RATE_TIMEOUT_MS` (default 10 s). `GET /exchange-rates` returns `502 EXCHANGE_RATE_UNAVAILABLE` only when the
provider fails and nothing is cached; endpoints that convert amounts return `converted: null` instead.

**Cost.** The first request for a new date depends on the provider being up.

## D-13 · Ids are UUID v7, stored as `BINARY(16)`

**Problem.** Every table needs an id format, and each common option has a weakness:

| Format | Weakness |
| :--- | :--- |
| Auto-increment number | Guessable (`/dashboards/42` → try `/43`) and reveals how many rows exist; only the database can create it, so the id is unknown until after the insert. |
| UUID v4 (fully random) | Not guessable, but random order scatters inserts across the primary-key index, which gets slower as tables grow. |
| UUID v7 | Time first, then random: not guessable **and** roughly in creation order. |

**Decision.** `generateId()` (`src/db/types.ts`) creates UUID v7 ids in the application (`Bun.randomUUIDv7()` or the
`uuid` package). The first 48 bits are the creation time in milliseconds, the rest is random. They are stored as
`BINARY(16)` (16 bytes instead of 36 characters) and shown as lowercase text in the API.

Because they are time ordered, `ORDER BY created_at, id` is stable even for rows created in the same millisecond, which
the paginated lists rely on.

**Same-millisecond ids.** Within one process the `uuid` package does not draw new random bits for an id in the same
millisecond: it increments a counter, so the ids stay unique and in order. Across processes, a collision needs the
~74 random bits to match as well (about 1 in 10²²). If it ever happened, the primary key rejects the insert, so no
row can be overwritten. No extra check before inserting is needed.

**Cost.** The creation time of a row can be read from its id. Ids are longer to type when testing by hand.
