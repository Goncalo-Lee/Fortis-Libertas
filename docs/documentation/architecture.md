# Architecture

How the code is organised and what happens during a request. For **why** it is this way, see
[decisions.md](decisions.md).

## Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js (App Router), TypeScript, runs on Node.js (`runtime = "nodejs"` in every API route) |
| Database | MySQL (Docker), Drizzle ORM, UUID v7 ids stored as `BINARY(16)` |
| Authentication | Better Auth (email + password, Google, 2FA, bearer tokens) |
| Validation | Zod |
| Exchange rates | Frankfurter (ECB reference rates), cached in `Exchange_Rate` |
| API tests | Bruno (`api-tests/`) |
| Package manager | Bun |

## Folders

```
src/
├── app/
│   ├── api/auth/[...all]/     Better Auth handler
│   ├── api/v1/                One route.ts per endpoint (thin: parse, authorise, call a query, serialise)
│   └── (pages)                Web frontend
├── db/
│   ├── schema/                Drizzle tables (one file per table)
│   ├── queries/<resource>/    All database access: read.ts, write.ts, type.ts, index.ts
│   └── data/                  Seeds and one-off scripts (bun run db:seed:catalogs, db:backfill:transactions...)
├── lib/
│   ├── api/                   Shared API code: errors, guards, Zod schemas, serializers, pagination
│   ├── exchange/              Exchange rate client, cache and decimal helpers
│   ├── auth.ts                Better Auth configuration
│   └── auth-activity.ts       Better Auth hooks that write account events to the activity log
└── proxy.ts                   Protects the web PAGES (/dashboard, /admin); it skips /api
```

Rule of thumb: **routes never talk to the database directly**. A route calls functions from `db/queries`, so the same
query serves every endpoint that needs it (`/home` reuses the queries of `/balance` and `/reports/summary`).

## A request, step by step

```
Client
  │  GET /api/v1/dashboards/{id}/financial-records?status=paid
  ▼
route.ts ── withErrors(...)                          lib/api/errors.ts
  │   └─ runWithRequestContext                       lib/api/request-context.ts  (IP, user agent)
  ├─ parseUuid(id)                    400            lib/api/ids.ts
  ├─ requireDashboardRole(..., role)  401/403/404    lib/api/access.ts
  │     └─ requireSession → setRequestUser           lib/api/auth.ts
  ├─ Zod schema .parse(query/body)    422            lib/api/schemas/*
  ├─ db/queries/<resource>                           read or write, inside a transaction when writing
  ├─ serializer (camelCase → snake_case, Date → ISO) lib/api/serializers/*
  └─ ok / created / paginated / noContent            lib/api/responses.ts
```

Any error thrown at any step becomes a Problem Details response in `withErrors`:
`ApiError` keeps its status and code, `ZodError` becomes `422` with field pointers, anything else is a `500`
(logged to the server console, never shown to the client).

## Writes: one transaction per change

A write that changes data also writes everything that describes the change, **in the same database transaction**:

```
db.transaction(async (tx) => {
  UPDATE financial_record ...                 the change itself
  syncFinancialRecordTransaction(tx, id)      history snapshot  (db/queries/transactions)
  logDashboardActivity(tx, ...)               activity log      (db/queries/activity-logs)
  createNotification(tx, ...)                 notification      (db/queries/notifications), when relevant
})
```

If any step fails, all of them roll back, so the history, the log and the notifications never describe something
that did not happen. The one exception is Better Auth (see decisions D-04).

## Cross-cutting pieces

| Piece | Where | What it does |
| :--- | :--- | :--- |
| Request context | `lib/api/request-context.ts` | Per-request "box" (AsyncLocalStorage) with the user, IP and user agent, read by the activity log. |
| Guards | `lib/api/access.ts` | `requireSession`, `requireDashboardRole`, `requireBankAccountRole`, `requireCardAccess`. |
| Memberships | `db/queries/memberships` | One implementation for dashboard and bank account members (add, change role, remove, last-owner rule). |
| History | `db/queries/transactions` | One row per financial record / installment plan, kept in sync by `sync*Transaction`. |
| Activity log | `db/queries/activity-logs`, `lib/auth-activity.ts` | Who did what, in a dashboard, a bank account or the user's own account. |
| Notifications | `db/queries/notifications` | Created by the server (e.g. `dashboard.member_added`); read and managed under `/me/notifications`. |
| Exchange rates | `lib/exchange` | `createConverter` memoises rates per request; `loadRate` reads the cache, then Frankfurter, then a stale cached rate. |

## Configuration

| Variable | Used by |
| :--- | :--- |
| `DATABASE_URL` | Drizzle |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Better Auth |
| `MAIL_*` | Emails (verification, password reset) |
| `EXCHANGE_RATE_API_URL` | Frankfurter base URL (default `https://api.frankfurter.dev/v1`) |
| `EXCHANGE_RATE_TIMEOUT_MS` | How long to wait for Frankfurter (default `10000`) |

See [setup.md](setup.md) for the full list and how to run everything.
