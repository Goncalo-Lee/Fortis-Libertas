# API Guide

How to call the Fortis Libertas API. This is the practical guide for the web frontend and the Android app;
the full contract (every field, rule and error) is in [planning/api/endpoints.md](../planning/api/endpoints.md).

## Base URLs

| Path | What |
| :--- | :--- |
| `/api/auth/*` | Authentication, handled by [Better Auth](https://www.better-auth.com) (sign-up, sign-in, sign-out, Google, 2FA, password reset). |
| `/api/v1/*` | The application API. Everything below refers to these routes. |

Locally: `http://localhost:3000`.

## Authentication

Every `/api/v1` route requires a signed-in user. Two ways to send the session:

| Client | How |
| :--- | :--- |
| Web (same origin) | The session **cookie** set by Better Auth. Nothing to do. |
| Android, Bruno, scripts | A **Bearer token**: sign in with `POST /api/auth/sign-in/email`, read the `set-auth-token` response header and send `Authorization: Bearer <token>` on every request. |

```http
POST /api/auth/sign-in/email
Content-Type: application/json

{ "email": "ana@example.com", "password": "..." }
```

Responses: `401 UNAUTHENTICATED` without a valid session, `403 ACCOUNT_SUSPENDED` for a suspended account.
A deleted account behaves like no session (`401`).

## Responses

| Case | Status | Body |
| :--- | :-: | :--- |
| One resource | `200` | `{ "data": { ... } }` |
| Created | `201` | `{ "data": { ... } }` and a `Location` header |
| List | `200` | `{ "data": [ ... ], "meta": { "page", "per_page", "total", "total_pages" } }` |
| Nothing to return | `204` | empty |
| Error | `4xx`/`5xx` | Problem Details (below) |

### Formats

- **Ids** are UUIDs (v7, time ordered), always lowercase in responses.
- **Dates with time** are ISO 8601 in UTC: `2026-10-12T18:20:00.000Z`. **Days** are `YYYY-MM-DD`.
- **Money** is a **string** with two decimals (`"1250.50"`), never a number, so no precision is lost.
  Do the maths with a decimal type (Kotlin `BigDecimal`), not `Double`.
- **Names** are `snake_case` (`payment_date`, `record_type_id`).

### Money in other currencies

Records keep their original `currency`. Endpoints that show amounts also return `converted`:
the amount in the caller's profile currency, using the rate of the payment date (`?rate=current` uses the latest rate).
`converted` is `null` when no rate is available; the request still succeeds. Rates come from Frankfurter (ECB)
and are cached in the database.

## Lists

| Parameter | Example | Notes |
| :--- | :--- | :--- |
| `page` | `?page=2` | Starts at 1. |
| `per_page` | `?per_page=50` | 1 to 100, default 25. |
| `sort` | `?sort=-payment_date` | `-` means descending. Each list documents its allowed fields. |
| Multi-value filters | `?status=paid,settled` or `?status=paid&status=settled` | Both forms work. |
| Booleans | `?unread=true` | `true` / `false` only. |

An unknown `sort`, a bad date or an unknown enum value is a `422`, never silently ignored.

## Errors

Errors follow [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) (`Content-Type: application/problem+json`):

```json
{
  "type": "https://fortis-libertas.local/error/validation-error",
  "title": "VALIDATION_ERROR",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "detail": "One or more fields are invalid.",
  "errors": [{ "pointer": "/payment_date", "message": "Invalid ISO datetime" }]
}
```

Use `code` in the client (not `title` or `detail`, which are for humans). `errors[].pointer` is a JSON Pointer to the
field, so a form can show the message next to the right input.

| Status | Codes | Meaning |
| :-: | :--- | :--- |
| 400 | `MALFORMED_REQUEST` | Body is not valid JSON, or an id in the URL is not a UUID. |
| 401 | `UNAUTHENTICATED` | No valid session. |
| 403 | `ACCOUNT_SUSPENDED`, `FORBIDDEN` | Suspended account; or a member without the required role. |
| 404 | `NOT_FOUND` | Does not exist **or** you cannot see it (see below). |
| 409 | `NAME_ALREADY_EXISTS`, `USER_NAME_TAKEN`, `ALREADY_MEMBER`, `LAST_OWNER`, `IN_USE`, `COLOR_IN_USE`, `HAS_ACTIVE_CARDS`, `MEMBER_HAS_CARDS`, `DASHBOARD_INACTIVE`, `PLAN_CANCELLED`, `CURRENT_SESSION`, `NOT_DELETED`, `RESTORE_WINDOW_EXPIRED` | The request is valid but conflicts with the current state. |
| 422 | `VALIDATION_ERROR` | A field or query parameter is invalid; see `errors`. |
| 429 | `RATE_LIMITED` | Reserved; not returned by `/api/v1` yet. |
| 500 | `INTERNAL_ERROR` | A bug. Details are only in the server log. |
| 502 | `EXCHANGE_RATE_UNAVAILABLE` | The exchange rate provider did not answer and nothing was cached. |

The meaning of each `409` code is in [endpoints.md, section 21](../planning/api/endpoints.md#21-error-catalog).

**404 instead of 403:** if you are not a member of a dashboard or bank account, or a session/notification is not
yours, the API answers `404`, not `403`. A `403` would confirm that the thing exists.

## Roles

Dashboards and bank accounts are shared. Each member has a role:

| Role | Can |
| :--- | :--- |
| `viewer` | Read. |
| `editor` | Read and create/change records and resources. |
| `owner` | Everything, including members, deletion and the activity log. |

## Endpoint map

| Area | Routes | Spec |
| :--- | :--- | :--- |
| Current user | `/me`, `/me/profile`, `/me/sessions`, `/me/accounts` | [§3](../planning/api/endpoints.md#3-current-user-me) |
| Notifications | `/me/notifications` | [§4](../planning/api/endpoints.md#4-notifications) |
| Bank accounts | `/bank-accounts`, `/bank-accounts/{id}/members`, `/bank-accounts/{id}/cards`, `/cards/{id}` | [§5–7](../planning/api/endpoints.md#5-bank-accounts) |
| Dashboards | `/dashboards`, `/dashboards/{id}/members` | [§8–9](../planning/api/endpoints.md#8-dashboards) |
| Dashboard resources | `/dashboards/{id}/record-types`, `categories`, `tags`, `payment-methods` | [§10–13](../planning/api/endpoints.md#10-record-types) |
| Money | `/dashboards/{id}/installment-plans`, `financial-records`, `balance` | [§14–15](../planning/api/endpoints.md#14-installment-plans) |
| Reports | `/dashboards/{id}/reports/summary` | [§16](../planning/api/endpoints.md#16-reports) |
| Catalogs | `/colors`, `/icons`, `/currencies`, `/languages`, `/exchange-rates` | [§17](../planning/api/endpoints.md#17-catalogs-colors-icons-currencies--languages) |
| Home screen | `/dashboards/{id}/home` | [§18](../planning/api/endpoints.md#18-home) |
| Activity logs | `/dashboards/{id}/activity-logs`, `/bank-accounts/{id}/activity-logs`, `/me/activity-logs` | [§19](../planning/api/endpoints.md#19-activity-logs) |
| History | `/dashboards/{id}/transactions` | [§20](../planning/api/endpoints.md#20-transactions-history) |

### Which endpoint for totals?

| Need | Use |
| :--- | :--- |
| Current balance | `GET /dashboards/{id}/balance` |
| Totals per record type, category, tag, payment method or month | `GET /dashboards/{id}/reports/summary` |
| Everything for the home screen at once | `GET /dashboards/{id}/home` |
| A list of what happened | `GET /dashboards/{id}/transactions` |

Do **not** sum `/transactions` to get totals: an installment plan appears there once for the plan **and** once per
installment record, so the same money would be counted twice.

## Testing with Bruno

The collection is in `api-tests/` (run it in order: later requests use ids saved by earlier ones).

```bash
bun run api:test
```

It needs the dev server running (`bun run dev`), a seeded database and `TEST_PASSWORD` in `api-tests/.env`.
`/exchange-rates` tests need internet access to Frankfurter the first time a rate is requested.
