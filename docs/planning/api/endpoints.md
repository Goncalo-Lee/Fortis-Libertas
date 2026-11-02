# API Endpoints

Endpoint-level specification for the **Fortis Libertas** REST API (Next.js Route Handlers, Drizzle ORM, TypeScript). Field names, types, and constraints are derived from [`../db/data-dictionary.md`](../db/data-dictionary.md); relationships and referential rules from [`../db/model-er.md`](../db/model-er.md). Architecture and design rationale are in [`README.md`](./README.md).

## Index

1. [Conventions](#1-conventions)
2. [Authentication (Better Auth)](#2-authentication-better-auth)
3. [Current User (`/me`)](#3-current-user-me)
4. [Notifications](#4-notifications)
5. [Bank Accounts](#5-bank-accounts)
6. [Bank Account Members](#6-bank-account-members)
7. [Cards](#7-cards)
8. [Dashboards](#8-dashboards)
9. [Dashboard Members](#9-dashboard-members)
10. [Record Types](#10-record-types)
11. [Categories](#11-categories)
12. [Tags](#12-tags)
13. [Payment Methods](#13-payment-methods)
14. [Installment Plans](#14-installment-plans)
15. [Financial Records](#15-financial-records)
16. [Reports](#16-reports)
17. [Catalogs (Colors, Icons, Currencies & Languages)](#17-catalogs-colors-icons-currencies--languages)
18. [Home](#18-home)
19. [Activity Logs](#19-activity-logs)
20. [Transactions (History)](#20-transactions-history)
21. [Error Catalog](#21-error-catalog)

---

## 1. Conventions

### 1.1 Request & Response

| Item | Value |
| :--- | :--- |
| **Base URL** | `/api/v1` (authentication: `/api/auth`) |
| **Content type** | `application/json; charset=utf-8` for request and response bodies |
| **Path parameters** | `snake_case`, always UUID strings (e.g. `{dashboard_id}`) |
| **Unknown body keys** | Rejected with `422 VALIDATION_ERROR` |
| **Read-only fields** | `*_id` primary keys, `register_by_id`, `created_at`, `updated_at`, `deleted_at`. Sending them is a validation error. |

**Single resource**

```json
{ "data": { "category_id": "0199c3a2-...", "name": "Groceries" } }
```

**Collection**

```json
{
  "data": [ { "category_id": "0199c3a2-...", "name": "Groceries" } ],
  "meta": { "page": 1, "per_page": 25, "total": 1, "total_pages": 1 }
}
```

**Created**: `201 Created` with a `Location` header pointing to the new resource and the resource in `data`.
**Deleted / no content**: `204 No Content`, empty body.

### 1.2 Authentication

| Client | Credential |
| :--- | :--- |
| Web | Better Auth session cookie |
| Mobile | `Authorization: Bearer <session_token>` |

Every `/api/v1/*` endpoint requires authentication. See [Error Catalog](#21-error-catalog) for `401` / `403` behavior.

### 1.3 Roles (Minimum Role Column)

Used in every endpoint table as **Min. Role**.

| Value | Meaning |
| :--- | :--- |
| `session` | Any authenticated user. The resource is scoped to the caller (`/me/*`) or created by the caller. |
| `viewer` / `editor` / `owner` | Minimum membership role in the relevant scope. Roles are hierarchical: `owner` > `editor` > `viewer`. |

The scope is the **dashboard** (`User__Dashboard`) for `/dashboards/{dashboard_id}/**` and the **bank account** (`Bank_Account__User`) for `/bank-accounts/**` and `/cards/**`. Non-members receive `404 NOT_FOUND`.

### 1.4 Pagination, Sorting & Filtering

| Parameter | Type | Default | Notes |
| :--- | :--- | :--- | :--- |
| `page` | integer ≥ 1 | `1` | |
| `per_page` | integer 1–100 | `25` | |
| `sort` | string | resource-specific | Comma-separated fields; prefix `-` for descending (e.g. `sort=-payment_date,name`). Only fields listed per endpoint are accepted. |
| `q` | string (≤ 100) | none | Case-insensitive substring search on the fields listed per endpoint. |
| `include` | string | none | Comma-separated relations to embed (listed per endpoint). |

Filter parameters are listed per endpoint. Multi-value filters accept comma-separated values (`status=pending,late`). Invalid filter values return `422 VALIDATION_ERROR`.

### 1.5 Soft Delete

| Rule | Behavior |
| :--- | :--- |
| `DELETE` on a table with `deleted_at` | Sets `deleted_at = NOW()`; returns `204`. |
| Reads | Rows with `deleted_at IS NOT NULL` are never returned. Their IDs return `404`. |
| Junction tables without `deleted_at` (`Bank_Account__User`, `Tag__Category`, `Tag__Financial_Record`) and `Session`, `Notifications` | Physically deleted. |
| `RESTRICT` relations (see `model-er.md`) | Emulated: deleting a still-referenced row returns `409 IN_USE`. |
| `SET NULL` relations | Applied explicitly in the same transaction as the delete (where stated). |
| Unique names | Unique indexes include soft-deleted rows, so reusing a deleted name returns `409 NAME_ALREADY_EXISTS` (see README, Open Item 4). |
| Restore | Dashboards only: `POST /dashboards/{dashboard_id}/restore` (`owner`). Allowed within 30 days of `deleted_at`; afterwards it returns `409 RESTORE_WINDOW_EXPIRED`. Other resources cannot be restored in v1. |

> The 30-day window applies to every dashboard in v1. A longer window for business use is a possible extension and would require a dashboard type, which the schema does not have yet.

### 1.6 Inactive & Frozen States

| State | Effect |
| :--- | :--- |
| `Dashboard.is_active = false` | Reads are allowed. Any `POST` / `PATCH` / `DELETE` on child resources returns `409 DASHBOARD_INACTIVE`. Only `PATCH /dashboards/{dashboard_id}` (to reactivate) and `DELETE` remain allowed. |
| `frozen_at IS NOT NULL` (`Bank_Account`, `Card`) | Informational flag exposed as `frozen_at`; toggled via the `freeze` / `unfreeze` actions. |

### 1.7 Field Notation

Request tables use: **Required** = `Yes` / `No` / `Cond.` (conditional, see notes). Types follow the [data type mapping](./README.md#data-type-mapping).

### 1.8 Currency Conversion

- Amounts (`price`, `total_amount`, `amount`) are stored and returned in the **original currency** the user spent (`currency`, a code from the `Currency` catalog).
- Every response that carries an amount also includes `converted`: `{ "amount": decimal string, "currency": string, "rate": decimal string, "rate_date": date }`, expressed in the **caller's profile currency**. It is `null` when the original currency already equals the profile currency, or when no exchange rate is available (the request never fails because of it).
- Clients show `converted` first and the original amount after it, in a muted style.
- `rate` query parameter (on endpoints that return amounts): `payment_date` (default) converts with the rate of the payment date; `current` uses the latest rate.
- Rates come from an external provider (Frankfurter, ECB reference rates) and are cached in `Exchange_Rate`. Rates of past dates are definitive; today's rate is refreshed.

---

## 2. Authentication (Better Auth)

Served by the catch-all handler `src/app/api/auth/[...all]/route.ts`. These endpoints are owned by Better Auth and are summarized here for completeness only. The installed Better Auth version is the authoritative reference for exact paths and payloads.

| Method | Path | Capability | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/sign-up/email` | Register with email and password (creates `User`, `Account`, and, via hook, `Profile`) | Public |
| `POST` | `/api/auth/sign-in/email` | Sign in with email and password | Public |
| `POST` | `/api/auth/sign-in/social` | Start social login (e.g. Google) | Public |
| `POST` | `/api/auth/sign-out` | Invalidate the current session | Session |
| `GET` | `/api/auth/get-session` | Return the current session and user | Session |
| `POST` | `/api/auth/send-verification-email` | Send an email verification message | Session |
| `GET` | `/api/auth/verify-email` | Confirm an email token (sets `User.email_verified_at`) | Public (token) |
| `POST` | `/api/auth/request-password-reset` | Request a password reset email | Public |
| `POST` | `/api/auth/reset-password` | Set a new password using a reset token | Public (token) |
| `POST` | `/api/auth/change-password` | Change the password of the signed-in user | Session |
| `POST` | `/api/auth/two-factor/enable` | Start 2FA setup (creates `Two_Factor`) | Session |
| `POST` | `/api/auth/two-factor/verify-totp` | Complete setup / verify a TOTP code | Session |
| `POST` | `/api/auth/two-factor/generate-backup-codes` | Regenerate emergency codes | Session |
| `POST` | `/api/auth/two-factor/verify-backup-code` | Authenticate with a backup code | Pending 2FA |
| `POST` | `/api/auth/two-factor/disable` | Disable 2FA | Session |

**Mobile:** with the `bearer` plugin enabled, the session token is returned in the `set-auth-token` response header on sign-in and must be sent as `Authorization: Bearer <token>`.

---

## 3. Current User (`/me`)

Operations on the authenticated user's own data: `User`, `Profile`, `Session`, and `Account`.

### 3.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/me` | Get the current user (with `profile`) | `session` | `200` | `401` |
| `PATCH` | `/me` | Update `user_name`, `full_name`, `image` | `session` | `200` | `401`, `409`, `422` |
| `DELETE` | `/me` | Soft-delete the account and revoke all sessions | `session` | `204` | `401`, `409` |
| `GET` | `/me/profile` | Get the profile | `session` | `200` | `401` |
| `PATCH` | `/me/profile` | Update the profile | `session` | `200` | `401`, `422` |
| `GET` | `/me/sessions` | List active sessions | `session` | `200` | `401` |
| `DELETE` | `/me/sessions/{session_id}` | Revoke one session | `session` | `204` | `401`, `404` |
| `DELETE` | `/me/sessions` | Revoke all sessions **except** the current one | `session` | `204` | `401` |
| `GET` | `/me/accounts` | List linked sign-in providers (metadata only) | `session` | `200` | `401` |

### 3.2 User Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | uuid | |
| `user_name` | string \| null | Unique. |
| `full_name` | string | |
| `email` | string | Unique. Changed through Better Auth, not `PATCH /me`. |
| `email_verified_at` | datetime \| null | Read-only. |
| `image` | string \| null | Path or URL. |
| `two_factor_enabled` | boolean | Read-only. Managed by the two-factor flow. |
| `suspended_at` | datetime \| null | Read-only. |
| `created_at` | datetime | |
| `updated_at` | datetime | |
| `profile` | object | Embedded [Profile](#33-profile-representation) on `GET /me`. |

`deleted_at` is never returned.

### 3.3 Profile Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `birth_date` | date \| null | |
| `phone` | string \| null | |
| `phone_verified_at` | datetime \| null | Read-only. |
| `currency` | string | Code from the `Currency` catalog (`EUR`, `USD`, `GBP`, `BRL`). |
| `language` | string | Code from the `Language` catalog (`en`, `pt-PT`). |
| `primary_bank_account_id` | uuid \| null | Bank account shown first on the home screen. `null` when unset, when the account was deleted or when the user left it. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 3.4 `PATCH /me` Request

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `user_name` | string \| null | No | 3–254 chars, `[A-Za-z0-9._-]` | Unique (`idx_user_user_name`). |
| `full_name` | string | No | 1–254 chars | |
| `image` | string \| null | No | URL or path | |

### 3.5 `PATCH /me/profile` Request

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `birth_date` | date \| null | No | Not in the future | |
| `phone` | string \| null | No | ≤ 20 chars, E.164 recommended | Changing it resets `phone_verified_at` to `null`. |
| `currency` | string | No | Code in the `Currency` catalog | Default `EUR`. `422` if unknown. |
| `language` | string | No | Code in the `Language` catalog | Default `pt-PT`. `422` if unknown. |
| `primary_bank_account_id` | uuid \| null | No | Bank account the caller belongs to | `422` (`/primary_bank_account_id`) if not a member or deleted. `null` clears it. Per user: other members keep their own choice. |

### 3.6 Session Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `session_id` | uuid | |
| `ip_address` | string | |
| `user_agent` | string | |
| `expires_at` | datetime | |
| `created_at` | datetime | |
| `updated_at` | datetime | |
| `is_current` | boolean | Derived: `true` for the session making the request. |

`token` is never returned. Revoking the current session through `DELETE /me/sessions/{session_id}` is rejected with `409 CURRENT_SESSION`; use `POST /api/auth/sign-out` instead.

### 3.7 Linked Account Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `account_id` | uuid | |
| `provider_id` | string | e.g. `google`, `credential`. |
| `scope` | string \| null | |
| `access_token_expires_at` | datetime \| null | |
| `refresh_token_expires_at` | datetime \| null | |
| `created_at` | datetime | |
| `updated_at` | datetime | |

`access_token`, `refresh_token`, `id_token`, and `password` are never returned. Linking and unlinking providers is performed through Better Auth.

### 3.8 Business Rules

- `DELETE /me` returns `409 LAST_OWNER` if the user is the only `owner` of a dashboard that still has other active members. Transfer ownership first (see [9.3](#93-business-rules)).
- `DELETE /me` sets `User.deleted_at` and physically removes all `Session` rows for the user.

---

## 4. Notifications

Notifications are created server-side only. There is no public `POST`.

### 4.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/me/notifications` | List own notifications | `session` | `200` | `401`, `422` |
| `GET` | `/me/notifications/unread-count` | Count unread notifications | `session` | `200` | `401` |
| `PATCH` | `/me/notifications/{notification_id}` | Mark as read or unread | `session` | `200` | `401`, `404`, `422` |
| `POST` | `/me/notifications/read-all` | Mark all unread notifications as read | `session` | `200` | `401` |
| `DELETE` | `/me/notifications/{notification_id}` | Delete a notification (physical) | `session` | `204` | `401`, `404` |

### 4.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `notification_id` | uuid | |
| `type` | string | ≤ 255 chars. |
| `data` | object | Free-form JSON payload. |
| `created_at` | datetime | |
| `read_at` | datetime \| null | |

### 4.3 Query Parameters (`GET /me/notifications`)

| Parameter | Type | Notes |
| :--- | :--- | :--- |
| `unread` | boolean | `true` → `read_at IS NULL`. |
| `type` | string | Exact match. |
| `sort` | string | `created_at` (default `-created_at`). |
| `page`, `per_page` | integer | See [1.4](#14-pagination-sorting--filtering). |

### 4.4 Requests & Responses

`PATCH /me/notifications/{notification_id}`

| Field | Type | Required | Notes |
| :--- | :--- | :-: | :--- |
| `read` | boolean | Yes | `true` sets `read_at = NOW()` (if null); `false` sets `read_at = NULL`. |

`GET /me/notifications/unread-count` → `{ "data": { "unread": 3 } }`
`POST /me/notifications/read-all` → `{ "data": { "updated": 3 } }`

---

## 5. Bank Accounts

Bank accounts are independent of dashboards and shared between users through `Bank_Account__User`. Scope: **bank account**.

### 5.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/bank-accounts` | List bank accounts the caller belongs to | `session` | `200` | `401`, `422` |
| `POST` | `/bank-accounts` | Create a bank account (caller becomes `owner`) | `session` | `201` | `401`, `422` |
| `GET` | `/bank-accounts/{bank_account_id}` | Get a bank account | `viewer` | `200` | `401`, `404` |
| `PATCH` | `/bank-accounts/{bank_account_id}` | Update name or initial balance | `editor` | `200` | `401`, `404`, `422` |
| `DELETE` | `/bank-accounts/{bank_account_id}` | Soft-delete a bank account | `owner` | `204` | `401`, `404`, `409` |
| `POST` | `/bank-accounts/{bank_account_id}/freeze` | Set `frozen_at = NOW()` | `owner` | `200` | `401`, `404` |
| `POST` | `/bank-accounts/{bank_account_id}/unfreeze` | Set `frozen_at = NULL` | `owner` | `200` | `401`, `404` |

### 5.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `bank_account_id` | uuid | |
| `name` | string | ≤ 50 chars. |
| `initial_balance` | decimal string | `decimal(10,2)`, in the account currency. |
| `currency` | string | Currency code of the account (`EUR`, `USD`, `GBP`, `BRL`). |
| `balance` | decimal string | Derived, in the account currency. See [5.5](#55-business-rules). |
| `frozen_at` | datetime \| null | |
| `role` | enum | Derived: the caller's role (`owner`, `editor`, `viewer`). |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 5.3 Request Fields (`POST`, `PATCH`)

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `name` | string | `POST`: Yes | 1–50 chars | |
| `initial_balance` | decimal string | `POST`: Yes | `^-?\d{1,8}(\.\d{1,2})?$` | Stored as `decimal(10,2)`. |
| `currency` | string | No | Supported currency code | `POST` only; defaults to the caller's profile currency. It cannot be changed afterwards (`422` if sent on `PATCH`). |

### 5.4 Query Parameters (`GET /bank-accounts`)

| Parameter | Type | Notes |
| :--- | :--- | :--- |
| `frozen` | boolean | `true` → `frozen_at IS NOT NULL`. |
| `role` | enum | Filter by the caller's role. |
| `q` | string | Matches `name`. |
| `sort` | string | `name`, `created_at` (default `name`). |

### 5.5 Business Rules

- `POST` inserts `Bank_Account` and `Bank_Account__User (role = 'owner')` in one transaction.
- `DELETE` returns `409 HAS_ACTIVE_CARDS` while any non-deleted `Card` references the account (mirrors `RESTRICT` on `Card.bank_id`). Membership rows are kept (soft-deleted memberships stay as they are), but a deleted account is no longer found.
- `balance` is `initial_balance` plus the effect of the non-deleted financial records with status `paid` or `settled` whose payment method points to a card of this account, from any dashboard. `Record_Type.kind` decides the sign (`income` adds, `expense` subtracts, `neutral` is ignored) and each amount is converted to the account currency (see 1.8). Records of a soft-deleted dashboard keep counting; records paid without a card affect no account.
- `freeze` / `unfreeze` are idempotent and return the updated resource.

---

## 6. Bank Account Members

Manages `Bank_Account__User`. Scope: **bank account**.

### 6.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/bank-accounts/{bank_account_id}/members` | List members | `viewer` | `200` | `401`, `404` |
| `POST` | `/bank-accounts/{bank_account_id}/members` | Add a member | `owner` | `201` | `401`, `404`, `409`, `422` |
| `PATCH` | `/bank-accounts/{bank_account_id}/members/{user_id}` | Change a member's role | `owner` | `200` | `401`, `404`, `409`, `422` |
| `DELETE` | `/bank-accounts/{bank_account_id}/members/{user_id}` | Remove a member (or leave, if `user_id` is the caller) | `owner` / self | `204` | `401`, `404`, `409` |

### 6.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | uuid | |
| `user_name` | string \| null | From `User`. |
| `full_name` | string | From `User`. |
| `image` | string \| null | From `User`. |
| `role` | enum | `owner`, `editor`, `viewer`. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 6.3 Request Fields

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `user_id` | uuid | `POST`: Cond. | Existing, non-deleted user | Provide exactly one of `user_id`, `email` or `user_name`. |
| `email` | string | `POST`: Cond. | Valid email of an existing user | |
| `user_name` | string | `POST`: Cond. | 3–254 chars, existing unique user name | |
| `role` | enum | Yes | `owner`, `editor`, `viewer` | |

### 6.4 Business Rules

- The account must always keep at least one `owner`. Demoting or removing the last owner returns `409 LAST_OWNER`.
- Adding an existing member returns `409 ALREADY_MEMBER`.
- Removing a member is a soft delete (`deleted_at`). Membership checks ignore removed rows, and `POST` for a user whose membership was removed **reactivates** that row (clears `deleted_at`, applies the new `role`) because `(bank_id, user_id)` is the primary key.
- Removing a member who still owns non-deleted cards on this account returns `409 MEMBER_HAS_CARDS` (mirrors `RESTRICT` on `Card.user_id`).
- Any member may remove themselves (subject to the rules above).

---

## 7. Cards

Cards belong to a bank account (`bank_id`) and a user (`user_id`). Scope: **bank account**.

### 7.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/cards` | List cards owned by the caller (across bank accounts) | `session` | `200` | `401`, `422` |
| `GET` | `/bank-accounts/{bank_account_id}/cards` | List cards of a bank account | `viewer` | `200` | `401`, `404` |
| `POST` | `/bank-accounts/{bank_account_id}/cards` | Create a card | `editor` | `201` | `401`, `403`, `404`, `422` |
| `GET` | `/cards/{card_id}` | Get a card | `viewer` on its bank account | `200` | `401`, `404` |
| `PATCH` | `/cards/{card_id}` | Update a card | card owner or bank account `owner` | `200` | `401`, `404`, `422` |
| `DELETE` | `/cards/{card_id}` | Soft-delete a card | card owner or bank account `owner` | `204` | `401`, `404` |
| `POST` | `/cards/{card_id}/freeze` | Set `frozen_at = NOW()` | card owner or bank account `owner` | `200` | `401`, `404` |
| `POST` | `/cards/{card_id}/unfreeze` | Set `frozen_at = NULL` | card owner or bank account `owner` | `200` | `401`, `404` |

### 7.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `card_id` | uuid | |
| `bank_id` | uuid | Parent bank account. |
| `user_id` | uuid | Card owner. |
| `cardholder_name` | string | ≤ 50 chars. |
| `type_card` | enum | `credit`, `debit`. |
| `card_number_last4` | string \| null | Derived from `card_number`. The full number is never returned. |
| `expiry_date` | date \| null | |
| `frozen_at` | datetime \| null | |
| `created_at` | datetime | |
| `updated_at` | datetime | |

`card_number` and `cvv` are **write-only**. See README, Open Item 6.

### 7.3 Request Fields (`POST`, `PATCH`)

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `cardholder_name` | string | `POST`: Yes | 1–50 chars | |
| `type_card` | enum | `POST`: Yes | `credit`, `debit` | |
| `card_number` | string \| null | No | `^\d{16}$`, Luhn-valid | Write-only. |
| `expiry_date` | date \| null | No | Valid date | |
| `cvv` | string \| null | No | `^\d{3}$` | Write-only. Never returned or logged. |
| `user_id` | uuid | No | Must be a member of the bank account | `POST` only. Defaults to the caller. |

### 7.4 Query Parameters (`GET /cards`, `GET /bank-accounts/{id}/cards`)

| Parameter | Type | Notes |
| :--- | :--- | :--- |
| `bank_id` | uuid | `GET /cards` only. |
| `type_card` | enum | |
| `frozen` | boolean | |
| `sort` | string | `cardholder_name`, `created_at` (default `-created_at`). |

### 7.5 Business Rules

- `DELETE` also sets `card_id = NULL` on every `Payment_Method` that references the card, in the same transaction (mirrors `SET NULL`).
- `PATCH` cannot change `bank_id` or `user_id`. To move a card, delete and recreate it.
- `POST` has no `409`: a frozen bank account still accepts cards (`frozen_at` is informational, see [1.6](#16-inactive--frozen-states)). `user_id` must be an active member of the bank account (`422` on `/user_id`).

---

## 8. Dashboards

A dashboard is the multi-tenant workspace that contains record types, categories, tags, payment methods, installment plans, and financial records. Scope: **dashboard**.

### 8.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboards` | List dashboards the caller belongs to | `session` | `200` | `401`, `422` |
| `POST` | `/dashboards` | Create a dashboard (caller becomes `owner`) | `session` | `201` | `401`, `422` |
| `GET` | `/dashboards/{dashboard_id}` | Get a dashboard | `viewer` | `200` | `401`, `404` |
| `PATCH` | `/dashboards/{dashboard_id}` | Rename, activate, or deactivate | `owner` | `200` | `401`, `404`, `422` |
| `DELETE` | `/dashboards/{dashboard_id}` | Soft-delete a dashboard | `owner` | `204` | `401`, `404` |
| `POST` | `/dashboards/{dashboard_id}/restore` | Restore a soft-deleted dashboard | `owner` | `200` | `401`, `404`, `409` |

### 8.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `dashboard_id` | uuid | |
| `name` | string | ≤ 50 chars. |
| `is_active` | boolean | Default `true`. |
| `role` | enum | Derived: the caller's role. |
| `member_count` | integer | Derived: active members. `GET /dashboards/{dashboard_id}` only. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 8.3 Request Fields (`POST`, `PATCH`)

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `name` | string | `POST`: Yes | 1–50 chars | |
| `is_active` | boolean | No | | Default `true`. |

### 8.4 Query Parameters (`GET /dashboards`)

| Parameter | Type | Notes |
| :--- | :--- | :--- |
| `is_active` | boolean | |
| `role` | enum | Filter by the caller's role. |
| `q` | string | Matches `name`. |
| `sort` | string | `name`, `created_at` (default `name`). |
| `deleted` | boolean | `true` → only soft-deleted dashboards where the caller is `owner` (candidates for restore). |

### 8.5 Business Rules

- `POST` runs in one transaction: insert `Dashboard`, insert `User__Dashboard (role = 'owner')`, and seed three `Record_Type` rows: `Expenses`, `Income`, `Investment`.
- `DELETE` soft-deletes only the dashboard row. Child rows remain but become unreachable because every child route verifies the parent.
- Membership checks ignore `User__Dashboard` rows with `deleted_at` set.
- `POST .../restore` clears `deleted_at` on the dashboard. It returns `409 NOT_DELETED` if the dashboard is not deleted and `409 RESTORE_WINDOW_EXPIRED` if more than 30 days have passed since `deleted_at`. Non-members and non-owners receive `404`.
- `GET /dashboards?deleted=true` lists only dashboards the caller owns that are currently soft-deleted.

---

## 9. Dashboard Members

Manages `User__Dashboard`. Scope: **dashboard**.

### 9.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboards/{dashboard_id}/members` | List members | `viewer` | `200` | `401`, `404` |
| `POST` | `/dashboards/{dashboard_id}/members` | Add a member | `owner` | `201` | `401`, `404`, `409`, `422` |
| `PATCH` | `/dashboards/{dashboard_id}/members/{user_id}` | Change a member's role | `owner` | `200` | `401`, `404`, `409`, `422` |
| `DELETE` | `/dashboards/{dashboard_id}/members/{user_id}` | Remove a member (or leave, if `user_id` is the caller) | `owner` / self | `204` | `401`, `404`, `409` |

### 9.2 Representation and Request Fields

The representation and request fields are identical to [Bank Account Members](#62-representation) (`user_id`, `user_name`, `full_name`, `image`, `role`, `created_at`, `updated_at`; request: `user_id` or `email` or `user_name`, plus `role`).

### 9.3 Business Rules

- The dashboard must always keep at least one active `owner`. Demoting or removing the last owner returns `409 LAST_OWNER`.
- `DELETE` is a soft delete (`User__Dashboard.deleted_at`). Records registered by the removed user remain (mirrors `RESTRICT` on `Financial_Record.register_by_id`).
- `POST` for a user whose membership was soft-deleted **reactivates** that row (clears `deleted_at`, applies the new `role`) because `(dashboard_id, user_id)` is the primary key.
- `POST` for an active member returns `409 ALREADY_MEMBER`.
- Ownership transfer is performed by promoting another member to `owner` and then demoting or removing the former owner.

---

## 10. Record Types

Classifies movements (default seeds: `Expenses`, `Income`, `Investment`). Scope: **dashboard**. Base path: `/dashboards/{dashboard_id}/record-types`.

### 10.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/record-types` | List record types | `viewer` | `200` | `401`, `404` |
| `POST` | `/record-types` | Create a record type | `owner` | `201` | `401`, `404`, `409`, `422` |
| `GET` | `/record-types/{record_type_id}` | Get a record type | `viewer` | `200` | `401`, `404` |
| `PATCH` | `/record-types/{record_type_id}` | Update a record type | `owner` | `200` | `401`, `404`, `409`, `422` |
| `DELETE` | `/record-types/{record_type_id}` | Soft-delete a record type | `owner` | `204` | `401`, `404`, `409` |

All paths are relative to `/dashboards/{dashboard_id}`.

### 10.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `record_type_id` | uuid | |
| `dashboard_id` | uuid | |
| `name` | string | ≤ 50 chars. Unique per dashboard. |
| `description` | string \| null | |
| `color_id` | uuid | FK to `Color`. Unique per dashboard among record types. |
| `color` | object | `{ color_id, name, code_color }`. Read-only. |
| `icon_id` | uuid | FK to `Icon`. |
| `icon` | object | `{ icon_id, name, code_icon }`. Read-only. |
| `kind` | enum | `income`, `expense` or `neutral`: what records of this type do to a balance. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 10.3 Request Fields (`POST`, `PATCH`)

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `name` | string | `POST`: Yes | 1–50 chars | `409 NAME_ALREADY_EXISTS` on `(dashboard_id, name)` conflict. |
| `description` | string \| null | No | | |
| `color_id` | uuid | `POST`: Yes | Existing, non-reserved color | `409 COLOR_IN_USE` if another record type of the dashboard already uses it; `422` if the color is reserved. |
| `icon_id` | uuid | `POST`: Yes | Existing icon | |
| `kind` | enum | No | `income`, `expense`, `neutral` | `POST` only; defaults to `neutral`. It cannot be changed afterwards (`422` if sent on `PATCH`), so past balances stay valid. |

### 10.4 Business Rules

- `DELETE` returns `409 IN_USE` while any non-deleted `Financial_Record` or `Installment_Plan` references the record type (mirrors `RESTRICT`). Its `Record_Type__Category` rows are removed physically.
- The categories available for a record type are managed from the category side (see [Categories](#11-categories)). `GET /categories?record_type_id=` lists them.
- A color is exclusive to one record type per dashboard (`UNIQUE (dashboard_id, color_id)`). Soft-deleted record types keep holding their color.
- Two colors are reserved (`Color.is_reserved`) for the seeded `Income` and `Expenses` record types. They cannot be assigned to any other record type or to a category, and the colors of `Income` and `Expenses` can only be changed to one of the reserved colors.
- Creating a dashboard seeds `Income` (`income`) and `Expenses` (`expense`) with the reserved colors and `Investment` (`neutral`) with a free non-reserved color, each with a default icon.
- List query: `q` (matches `name`), `sort` = `name` (default), `created_at`.

---

## 11. Categories

Groups financial records within a dashboard and can be linked to tags. Scope: **dashboard**. Base path: `/dashboards/{dashboard_id}/categories`.

### 11.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/categories` | List categories | `viewer` | `200` | `401`, `404`, `422` |
| `POST` | `/categories` | Create a category | `editor` | `201` | `401`, `404`, `409`, `422` |
| `GET` | `/categories/{category_id}` | Get a category | `viewer` | `200` | `401`, `404` |
| `PATCH` | `/categories/{category_id}` | Update a category | `editor` | `200` | `401`, `404`, `409`, `422` |
| `DELETE` | `/categories/{category_id}` | Soft-delete a category | `editor` | `204` | `401`, `404`, `409` |
| `GET` | `/categories/{category_id}/tags` | List tags linked to the category | `viewer` | `200` | `401`, `404` |
| `PUT` | `/categories/{category_id}/tags` | Replace the full set of linked tags | `editor` | `200` | `401`, `404`, `422` |
| `POST` | `/categories/{category_id}/tags/{tag_id}` | Link one tag (idempotent) | `editor` | `204` | `401`, `404` |
| `DELETE` | `/categories/{category_id}/tags/{tag_id}` | Unlink one tag | `editor` | `204` | `401`, `404` |
| `GET` | `/categories/{category_id}/record-types` | List record types the category is linked to | `viewer` | `200` | `401`, `404` |
| `PUT` | `/categories/{category_id}/record-types` | Replace the full set of record types | `editor` | `200` | `401`, `404`, `409`, `422` |
| `POST` | `/categories/{category_id}/record-types/{record_type_id}` | Link one record type (idempotent) | `editor` | `204` | `401`, `404` |
| `DELETE` | `/categories/{category_id}/record-types/{record_type_id}` | Unlink one record type | `editor` | `204` | `401`, `404`, `409`, `422` |

All paths are relative to `/dashboards/{dashboard_id}`.

### 11.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `category_id` | uuid | |
| `dashboard_id` | uuid | |
| `name` | string | ≤ 50 chars. Unique per dashboard. |
| `description` | string \| null | |
| `color_id` | uuid | FK to `Color`. Unique per dashboard among categories. |
| `color` | object | `{ color_id, name, code_color }`. Read-only. |
| `icon_id` | uuid | FK to `Icon`. |
| `icon` | object | `{ icon_id, name, code_icon }`. Read-only. |
| `tags` | array of [Tag](#122-representation) | Only with `include=tags`. |
| `record_types` | array | `{ record_type_id, name, color, icon }`. Always included. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 11.3 Request Fields

`POST`, `PATCH` `/categories`

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `name` | string | `POST`: Yes | 1–50 chars | |
| `description` | string \| null | No | | |
| `record_type_ids` | uuid[] | `POST`: Yes | 1–50 items, distinct, same dashboard | Record types the category can be used with. Creates `Record_Type__Category` rows. On `PATCH` use the `/record-types` endpoints. |
| `color_id` | uuid | `POST`: Yes | Existing, non-reserved color | `409 COLOR_IN_USE` if another category of the dashboard already uses it; `422` if the color is reserved. |
| `icon_id` | uuid | `POST`: Yes | Existing icon | |
| `tag_ids` | uuid[] | No | ≤ 50 items, tags of the same dashboard | `POST` only. Creates `Tag__Category` rows. |

`PUT /categories/{category_id}/record-types`

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `record_type_ids` | uuid[] | Yes | 1–50 items, distinct, same dashboard | A category must stay linked to at least one record type (`422` otherwise). |

`PUT /categories/{category_id}/tags`

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `tag_ids` | uuid[] | Yes | ≤ 50 items, distinct, same dashboard | Empty array removes all links. |

### 11.4 Business Rules

- List query: `q` (matches `name`), `tag_id` (categories linked to that tag), `record_type_id` (categories usable with that record type), `include=tags`, `sort` = `name` (default), `created_at`.
- `DELETE` returns `409 IN_USE` while any non-deleted `Financial_Record` or `Installment_Plan` references the category (mirrors `RESTRICT`). Its `Tag__Category` and `Record_Type__Category` rows are removed physically.
- Tag links are junction rows: `PUT` computes the difference and inserts/deletes in one transaction.
- Record type links work the same way. A link cannot be removed (`409 IN_USE`) while a non-deleted `Financial_Record` or `Installment_Plan` uses that `(record_type_id, category_id)` pair, and a category cannot be left without any record type.
- Record types of other dashboards, or soft-deleted ones, are rejected with `422`.
- A color is exclusive to one category per dashboard (`UNIQUE (dashboard_id, color_id)`), independently of the record types. Soft-deleted categories keep holding their color, so the palette size caps the number of categories per dashboard (see `README.md`, Open Item 10).

---

## 12. Tags

Flexible labels for categories and financial records. Scope: **dashboard**. Base path: `/dashboards/{dashboard_id}/tags`.

### 12.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/tags` | List tags | `viewer` | `200` | `401`, `404`, `422` |
| `POST` | `/tags` | Create a tag | `editor` | `201` | `401`, `404`, `409`, `422` |
| `GET` | `/tags/{tag_id}` | Get a tag | `viewer` | `200` | `401`, `404` |
| `PATCH` | `/tags/{tag_id}` | Update a tag | `editor` | `200` | `401`, `404`, `409`, `422` |
| `DELETE` | `/tags/{tag_id}` | Soft-delete a tag | `editor` | `204` | `401`, `404` |

All paths are relative to `/dashboards/{dashboard_id}`.

### 12.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `tag_id` | uuid | |
| `dashboard_id` | uuid | |
| `name` | string | ≤ 50 chars. Unique per dashboard. |
| `description` | string \| null | |
| `categories` | array of [Category](#112-representation) | Only with `include=categories`. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 12.3 Request Fields (`POST`, `PATCH`)

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `name` | string | `POST`: Yes | 1–50 chars | |
| `description` | string \| null | No | | |

### 12.4 Business Rules

- List query: `q` (matches `name`), `category_id`, `include=categories`, `sort` = `name` (default), `created_at`.
- `DELETE` removes the tag's `Tag__Category` and `Tag__Financial_Record` rows physically (mirrors `CASCADE`); financial records themselves are untouched.

---

## 13. Payment Methods

Payment instruments available in a dashboard (cash, transfer, card, ...), optionally linked to a card. Scope: **dashboard**. Base path: `/dashboards/{dashboard_id}/payment-methods`.

### 13.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/payment-methods` | List payment methods | `viewer` | `200` | `401`, `404`, `422` |
| `POST` | `/payment-methods` | Create a payment method | `editor` | `201` | `401`, `404`, `409`, `422` |
| `GET` | `/payment-methods/{payment_method_id}` | Get a payment method | `viewer` | `200` | `401`, `404` |
| `PATCH` | `/payment-methods/{payment_method_id}` | Update a payment method | `editor` (creator) or `owner` | `200` | `401`, `403`, `404`, `409`, `422` |
| `DELETE` | `/payment-methods/{payment_method_id}` | Soft-delete a payment method | `editor` (creator) or `owner` | `204` | `401`, `403`, `404`, `409` |

All paths are relative to `/dashboards/{dashboard_id}`.

### 13.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `payment_method_id` | uuid | |
| `dashboard_id` | uuid | |
| `user_id` | uuid | Creator of the payment method. |
| `card_id` | uuid \| null | Linked card. Card details are only available to users with access to the card (see [7](#7-cards)). |
| `name` | string | ≤ 50 chars. |
| `description` | string | Stored as `NOT NULL`; empty string when not provided. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 13.3 Request Fields (`POST`, `PATCH`)

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `name` | string | `POST`: Yes | 1–50 chars | `409 NAME_ALREADY_EXISTS` on the unique constraint (README, Open Item 3). |
| `description` | string | No | | Defaults to `""`. |
| `card_id` | uuid \| null | No | Non-deleted card owned by the payment method's creator | `null` for non-card methods (e.g. cash). `422` on `/card_id` otherwise. When an owner edits another member's method, the card must belong to that creator. |

### 13.4 Business Rules

- `user_id` is set from the session on `POST` and cannot be changed (unknown keys are rejected).
- Names are unique per dashboard (`idx_payment_method_dashboard_name`), including soft-deleted rows.
- `403 FORBIDDEN` is returned to an `editor` who tries to modify a payment method created by someone else.
- `DELETE` returns `409 IN_USE` while any non-deleted `Financial_Record` references it (mirrors `RESTRICT`).
- List query: `q` (matches `name`), `mine` (boolean, `user_id` = caller), `card_id`, `sort` = `name` (default), `created_at`.

---

## 14. Installment Plans

Multi-installment financing plans that can group several financial records. Scope: **dashboard**. Base path: `/dashboards/{dashboard_id}/installment-plans`.

### 14.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/installment-plans` | List plans | `viewer` | `200` | `401`, `404`, `422` |
| `POST` | `/installment-plans` | Create a plan | `editor` | `201` | `401`, `404`, `422` |
| `GET` | `/installment-plans/{installment_plan_id}` | Get a plan (with progress) | `viewer` | `200` | `401`, `404` |
| `PATCH` | `/installment-plans/{installment_plan_id}` | Update a plan | `editor` | `200` | `401`, `404`, `422` |
| `DELETE` | `/installment-plans/{installment_plan_id}` | Soft-delete a plan | `editor` | `204` | `401`, `404`, `409` |
| `GET` | `/installment-plans/{installment_plan_id}/financial-records` | List records of the plan | `viewer` | `200` | `401`, `404` |
| `PUT` | `/installment-plans/{installment_plan_id}/tags` | Replace the full set of tags | `editor` | `200` | `401`, `404`, `422` |

All paths are relative to `/dashboards/{dashboard_id}`.

### 14.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `installment_plan_id` | uuid | |
| `dashboard_id` | uuid | |
| `register_by_id` | uuid | Creator. Read-only. |
| `name` | string | ≤ 50 chars. |
| `description` | string \| null | |
| `category_id` | uuid | Inherited by the records of the plan. |
| `record_type_id` | uuid | Always the dashboard's `Expenses` type. Set by the server; read-only. |
| `currency` | string | Code from the `Currency` catalog. |
| `tags` | array | `{ tag_id, name }`. |
| `total_amount` | decimal string | `decimal(10,2)`, in `currency`. |
| `converted` | object \| null | See [1.8](#18-currency-conversion). Applies to `total_amount`. |
| `total_installments` | integer | |
| `due_date` | date | Final due date of the whole plan. |
| `status` | enum | `cancelled`, `pending`, `paid`, `late`. |
| `records_count` | integer | Derived: linked non-deleted records. Detail endpoint only. |
| `records_total` | decimal string | Derived: sum of linked records' `price`. Detail endpoint only. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 14.3 Request Fields (`POST`, `PATCH`)

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `name` | string | `POST`: Yes | 1–50 chars | |
| `description` | string \| null | No | | |
| `category_id` | uuid | `POST`: Yes | Same dashboard, non-deleted | Must be linked to the `Expenses` record type (`422` otherwise). |
| `currency` | string | No | Code in the `Currency` catalog | Defaults to the caller's `Profile.currency`. |
| `tag_ids` | uuid[] | No | ≤ 50 items, distinct, same dashboard | `POST` only; on `PATCH` use `PUT .../tags`. |
| `total_amount` | decimal string | `POST`: Yes | `> 0`, `^\d{1,8}(\.\d{1,2})?$` | |
| `total_installments` | integer | `POST`: Yes | ≥ 1 | |
| `due_date` | date | `POST`: Yes | `YYYY-MM-DD` | |
| `status` | enum | No | `cancelled`, `pending`, `paid`, `late` | Default `pending`. |

### 14.4 Business Rules

- List query: `status` (multi-value), `due_from`, `due_to` (dates), `sort` = `due_date` (default), `total_amount`, `created_at`. (Consider adding `q` to match `name` and `description` here as well).
- `PATCH` rejects `total_installments` lower than the number of linked non-deleted records (`422 VALIDATION_ERROR`).
- `record_type_id` is not accepted in the body (unknown key, `422`): the server sets it to the dashboard's `Expenses` type. The records created for the plan inherit its record type, category and tags.
- The `Expenses` record type is the dashboard's non-deleted `expense` type that uses a reserved color, so renaming it does not matter. `422` on `/category_id` if the category is not linked to it.
- Names are not unique: two plans can share a name (`POST` has no `409`).
- `GET` filters: `status` accepts repeated (`?status=pending&status=late`) or comma-separated values.
- Changing `category_id` or `currency` on a plan does not rewrite the records already linked to it.
- `DELETE` returns `409 IN_USE` while records are linked. Use `DELETE ...?detach_records=true` to set `installment_plan_id = NULL` on those records (mirrors `SET NULL`) and soft-delete the plan in one transaction. Detaching is explicit because it changes financial history.

---

## 15. Financial Records

The central transactional resource: income, expenses, and investments. Scope: **dashboard**. Base path: `/dashboards/{dashboard_id}/financial-records`.

### 15.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/financial-records` | List and filter records | `viewer` | `200` | `401`, `404`, `422` |
| `POST` | `/financial-records` | Create a record | `editor` | `201` | `401`, `404`, `409`, `422` |
| `GET` | `/financial-records/{financial_record_id}` | Get a record | `viewer` | `200` | `401`, `404` |
| `PATCH` | `/financial-records/{financial_record_id}` | Update a record | `editor` | `200` | `401`, `404`, `409`, `422` |
| `DELETE` | `/financial-records/{financial_record_id}` | Soft-delete a record | `editor` | `204` | `401`, `404`, `409` |
| `PUT` | `/financial-records/{financial_record_id}/tags` | Replace the full set of tags | `editor` | `200` | `401`, `404`, `422` |
| `POST` | `/financial-records/{financial_record_id}/tags/{tag_id}` | Add one tag (idempotent) | `editor` | `204` | `401`, `404` |
| `DELETE` | `/financial-records/{financial_record_id}/tags/{tag_id}` | Remove one tag | `editor` | `204` | `401`, `404` |

All paths are relative to `/dashboards/{dashboard_id}`.

### 15.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `financial_record_id` | uuid | |
| `dashboard_id` | uuid | |
| `register_by_id` | uuid | Author. Set from the session; immutable. |
| `record_type_id` | uuid | |
| `category_id` | uuid | |
| `payment_method_id` | uuid | |
| `installment_plan_id` | uuid \| null | |
| `name` | string | ≤ 50 chars. |
| `description` | string \| null | |
| `price` | decimal string | `decimal(10,2)`. Always positive; the sign of the movement comes from the record type. |
| `currency` | string | Original currency of `price`. Code from the `Currency` catalog. |
| `converted` | object \| null | `price` in the caller's profile currency. See [1.8](#18-currency-conversion). |
| `payment_date` | datetime | Date the payment was made or is due. |
| `status` | enum | `active`, `settled`, `cancelled`, `pending`, `paid`, `late`. |
| `tags` | array of Tag | Always included as `{ tag_id, name }`. Full tag objects are not embedded. |
| `record_type`, `category`, `payment_method`, `installment_plan` | object | Only with `include=...` (summary objects with ID and `name`). |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 15.3 Request Fields (`POST`, `PATCH`)

| Field | Type | Required | Constraints | Notes |
| :--- | :--- | :-: | :--- | :--- |
| `record_type_id` | uuid | `POST`: Yes | Same dashboard, non-deleted | |
| `category_id` | uuid | `POST`: Yes | Same dashboard, non-deleted | Must be linked to `record_type_id` (`422` otherwise). On `PATCH`, the resulting pair must still be valid. |
| `payment_method_id` | uuid | `POST`: Yes | Same dashboard, non-deleted | |
| `installment_plan_id` | uuid \| null | No | Same dashboard, non-deleted | `null` for one-off transactions. |
| `name` | string | `POST`: Yes | 1–50 chars | |
| `description` | string \| null | No | | |
| `price` | decimal string | `POST`: Yes | `> 0`, `^\d{1,8}(\.\d{1,2})?$` | |
| `currency` | string | No | Code in the `Currency` catalog | Defaults to the caller's `Profile.currency`. `422` if unknown. |
| `payment_date` | datetime | `POST`: Yes | ISO 8601 | |
| `status` | enum | `POST`: Yes | See representation | No database default (README, Open Item 7). |
| `tag_ids` | uuid[] | No | ≤ 50 items, distinct, same dashboard | `POST` only; on `PATCH` use the `/tags` endpoints. |

### 15.4 Query Parameters (`GET /financial-records`)

| Parameter | Type | Notes |
| :--- | :--- | :--- |
| `record_type_id` | uuid (multi) | |
| `category_id` | uuid (multi) | |
| `payment_method_id` | uuid (multi) | |
| `installment_plan_id` | uuid | Use `none` for records without a plan. |
| `register_by_id` | uuid | |
| `tag_id` | uuid (multi) | Combined with `tag_match`. |
| `tag_match` | `any` \| `all` | Default `any`. |
| `status` | enum (multi) | e.g. `status=pending,late`. |
| `currency` | string | |
| `payment_date_from`, `payment_date_to` | datetime | Inclusive range on `payment_date`. |
| `min_price`, `max_price` | decimal string | Inclusive range on `price`. |
| `q` | string | Matches `name` and `description`. |
| `include` | string | `record_type`, `category`, `payment_method`, `installment_plan`. |
| `sort` | string | `payment_date` (default `-payment_date`), `price`, `name`, `created_at`. |

### 15.5 Example

`POST /api/v1/dashboards/0199c3a2-7b1e-7d4a-9f3e-2a6b8c1d4e5f/financial-records`

```json
{
  "record_type_id": "0199c3a2-8001-7a10-8c11-1f2e3d4c5b6a",
  "category_id": "0199c3a2-8002-7a10-8c11-1f2e3d4c5b6b",
  "payment_method_id": "0199c3a2-8003-7a10-8c11-1f2e3d4c5b6c",
  "installment_plan_id": null,
  "name": "Weekly groceries",
  "description": "Supermarket run",
  "price": "64.35",
  "currency": "EUR",
  "payment_date": "2026-10-12T18:20:00.000Z",
  "status": "paid",
  "tag_ids": ["0199c3a2-8004-7a10-8c11-1f2e3d4c5b6d"]
}
```

`201 Created`

```json
{
  "data": {
    "financial_record_id": "0199c3a2-9000-7a10-8c11-1f2e3d4c5b6e",
    "dashboard_id": "0199c3a2-7b1e-7d4a-9f3e-2a6b8c1d4e5f",
    "register_by_id": "0199c3a2-1000-7a10-8c11-1f2e3d4c5b60",
    "record_type_id": "0199c3a2-8001-7a10-8c11-1f2e3d4c5b6a",
    "category_id": "0199c3a2-8002-7a10-8c11-1f2e3d4c5b6b",
    "payment_method_id": "0199c3a2-8003-7a10-8c11-1f2e3d4c5b6c",
    "installment_plan_id": null,
    "name": "Weekly groceries",
    "description": "Supermarket run",
    "price": "64.35",
    "currency": "EUR",
    "payment_date": "2026-10-12T18:20:00.000Z",
    "status": "paid",
    "tags": [{ "tag_id": "0199c3a2-8004-7a10-8c11-1f2e3d4c5b6d", "name": "Essential" }],
    "created_at": "2026-10-13T09:30:00.000Z",
    "updated_at": "2026-10-13T09:30:00.000Z"
  }
}
```

### 15.6 Business Rules

- `register_by_id` is taken from the session on `POST` and is immutable.
- `record_type_id`, `category_id`, `payment_method_id`, `installment_plan_id`, and every `tag_ids` entry must belong to the dashboard in the route, otherwise `422 VALIDATION_ERROR` (`errors[].pointer` identifies the field).
- `POST` and `PATCH` run in a transaction together with the `Tag__Financial_Record` writes.
- Linking to an installment plan whose `status` is `cancelled` returns `409 PLAN_CANCELLED`.
- `DELETE` soft-deletes the record; its `Tag__Financial_Record` rows are removed physically.
- Moving a record to another dashboard is not supported.

---

## 16. Reports

Read-only aggregations computed from `Financial_Record`. They have no table of their own.

### 16.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboards/{dashboard_id}/reports/summary` | Totals grouped by a dimension over a period | `viewer` | `200` | `401`, `404`, `422` |

### 16.2 Query Parameters

| Parameter | Type | Required | Notes |
| :--- | :--- | :-: | :--- |
| `payment_date_from` | datetime | Yes | Inclusive. |
| `payment_date_to` | datetime | Yes | Inclusive. Maximum range: 366 days. |
| `group_by` | enum | No | `record_type` (default), `category`, `tag`, `payment_method`, `month`. |
| `currency` | string | No | Currency of the result. Records in other currencies are converted (see [1.8](#18-currency-conversion)). Defaults to the caller's `Profile.currency`. |
| `rate` | enum | No | `payment_date` (default) or `current`. |
| `status` | enum (multi) | No | Defaults to all statuses except `cancelled`. |

### 16.3 Response

| Field | Type | Notes |
| :--- | :--- | :--- |
| `period` | object | `{ "from": datetime, "to": datetime }`. |
| `currency` | string | |
| `groups` | array | One item per group. |
| `groups[].key` | string | ID of the group, or `YYYY-MM` for `month`. |
| `groups[].label` | string | Display name. |
| `groups[].total` | decimal string | Sum of `price`. |
| `groups[].count` | integer | Number of records. |
| `total` | decimal string | Sum across all groups. |

> With `group_by=tag`, a record with several tags is counted in each tag group, so group totals can exceed `total`.

---

## 17. Catalogs (Colors, Icons, Currencies & Languages)

Global read-only catalogs, seeded when the database is created. Colors identify record types and categories; icons are Material Symbols names that each client (Android, web) renders on its own; currencies and languages are the values accepted by the profile and by amounts. Scope: **session** (any authenticated user). Base paths: `/colors`, `/icons`, `/currencies`, `/languages`, `/exchange-rates`.

### 17.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/colors` | List colors | `session` | `200` | `401`, `404`, `422` |
| `GET` | `/icons` | List icons | `session` | `200` | `401`, `422` |
| `GET` | `/currencies` | List currencies | `session` | `200` | `401` |
| `GET` | `/languages` | List languages | `session` | `200` | `401` |
| `GET` | `/exchange-rates` | Get the rate between two currencies | `session` | `200` | `401`, `422`, `502` |

### 17.2 Representation

Color

| Field | Type | Notes |
| :--- | :--- | :--- |
| `color_id` | uuid | |
| `name` | string | |
| `code_color` | string | Hex color, `#RRGGBB`. |
| `is_reserved` | boolean | `true` for the two colors reserved for `Income` and `Expenses`. |
| `in_use` | boolean | Only with `dashboard_id` and `scope`. |

Icon

| Field | Type | Notes |
| :--- | :--- | :--- |
| `icon_id` | uuid | |
| `name` | string | |
| `code_icon` | string | Material Symbols name, `snake_case` (e.g., `shopping_cart`). |

Currency

| Field | Type | Notes |
| :--- | :--- | :--- |
| `currency_id` | uuid | |
| `code` | string | ISO 4217 (`EUR`, `USD`, `GBP`, `BRL`). This is the value used in requests. |
| `name` | string | |
| `symbol` | string | |

Language

| Field | Type | Notes |
| :--- | :--- | :--- |
| `language_id` | uuid | |
| `code` | string | BCP 47 (`en`, `pt-PT`). This is the value used in requests. |
| `name` | string | |

Exchange rate (`GET /exchange-rates?base=USD&quote=EUR&date=2026-10-30`)

| Field | Type | Notes |
| :--- | :--- | :--- |
| `base` | string | Query, required. Currency code. |
| `quote` | string | Query, required. Currency code, different from `base`. |
| `date` | date | Query, optional. Defaults to today; cannot be in the future. |
| `rate` | decimal string | Response. Units of `quote` per one `base`. |
| `rate_date` | date | Response. Date of the rate actually used. |

`502 EXCHANGE_RATE_UNAVAILABLE` if the rate is not cached and the provider cannot be reached. This is the only endpoint that fails for this reason.

### 17.3 Query Parameters

| Parameter | Applies to | Notes |
| :--- | :--- | :--- |
| `q` | both | Matches `name`. |
| `is_reserved` | colors | `true` or `false`. |
| `dashboard_id` + `scope` | colors | `scope` = `record_type` or `category`. Adds `in_use`: `true` when that dashboard already has a record type (or category) holding the color. The caller must be a member of the dashboard (`404` otherwise); both parameters are required together (`422`). |
| `sort` | both | `name` (default). |

Both lists are paginated like every other list; use `per_page=100` to load a catalog in one request.

---

## 18. Home

Aggregated read model for the app's home screen. It has no table of its own and reuses the data of other resources. Scope: **dashboard**.

### 18.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboards/{dashboard_id}/home` | Home screen summary | `viewer` | `200` | `401`, `404`, `422` |

### 18.2 Query Parameters

| Parameter | Type | Required | Notes |
| :--- | :--- | :-: | :--- |
| `month` | string | No | `YYYY-MM`. Defaults to the current month. |
| `currency` | string | No | Defaults to the caller's `Profile.currency`. |

### 18.3 Response

| Field | Type | Notes |
| :--- | :--- | :--- |
| `dashboard` | object | `{ dashboard_id, name, is_active }`. |
| `period` | object | `{ "from": datetime, "to": datetime }` for the selected month. |
| `currency` | string | Currency in which `balance` and `totals` are expressed. Records are converted. |
| `balance` | decimal string | Same value as `GET /dashboards/{dashboard_id}/balance`. |
| `totals` | array | One item per record type: `{ record_type_id, name, color, icon, total, count }`. Excludes `cancelled` records. |
| `recent_records` | array | The 5 most recent [Financial Records](#152-representation) by `payment_date`. |
| `upcoming_installments` | array | [Installment Plans](#142-representation) with status `pending` or `late` and `due_date` in the next 30 days. |
| `unread_notifications` | integer | Unread notifications of the caller. |

> The contents above are a proposal. Adjust the fields to match the home screen of the Android app before implementing.

---

## 19. Activity Logs

Read-only audit trail of who did what. Entries are written by the server in the same transaction as the change and cannot be created, edited or deleted through the API.

### 19.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboards/{dashboard_id}/activity-logs` | Events of a dashboard | `owner` | `200` | `401`, `404`, `422` |
| `GET` | `/bank-accounts/{bank_account_id}/activity-logs` | Events of a bank account | `owner` | `200` | `401`, `404`, `422` |
| `GET` | `/me/activity-logs` | Account events of the caller (sign-in, password, 2FA) | `session` | `200` | `401`, `422` |

### 19.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `activity_log_id` | uuid | |
| `user` | object | `{ user_id, user_name, full_name, image }` of who performed the action. |
| `scope` | enum | `account`, `dashboard`, `bank_account`. |
| `dashboard_id` | uuid \| null | |
| `bank_account_id` | uuid \| null | |
| `entity_type` | string | E.g., `financial_record`, `category`, `member`, `session`. |
| `entity_id` | uuid \| null | |
| `action` | string | E.g., `created`, `updated`, `deleted`, `restored`, `member_added`, `sign_in`. |
| `metadata` | object \| null | Names of the changed fields and context. Never secrets or card data. |
| `ip_address` | string \| null | Only in `GET /me/activity-logs`. |
| `user_agent` | string \| null | Only in `GET /me/activity-logs`. |
| `created_at` | datetime | |

### 19.3 Query Parameters

| Parameter | Type | Notes |
| :--- | :--- | :--- |
| `action` | string (multi) | |
| `entity_type` | string | |
| `user_id` | uuid | Not available on `/me/activity-logs`. |
| `created_from`, `created_to` | datetime | Inclusive. |
| `sort` | enum | `-created_at` (default), `created_at`. |

### 19.4 Business Rules

- Dashboard and bank account logs are visible only to the `owner`. Non-members receive `404`.
- Logged events: create, update, delete and restore of dashboards and of their resources; member changes; bank account and card changes (including freeze and unfreeze); and, at account level, sign-in, sign-out, password change, 2FA changes and profile updates.
- `ip_address` and `user_agent` are returned only to the user who performed the action.
- Log entries survive the soft delete of the resource they describe.

---

## 20. Transactions (History)

Financial history of the whole dashboard: movements of financial records, installment plans and, in the future, savings, debts and goals. It is a read-only model written by the server. Who did what is in [Activity Logs](#19-activity-logs). Scope: **dashboard**.

### 20.1 Endpoints

| Method | Path | Description | Min. Role | Success | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboards/{dashboard_id}/transactions` | List the history of the dashboard | `viewer` | `200` | `401`, `404`, `422` |

### 20.2 Representation

| Field | Type | Notes |
| :--- | :--- | :--- |
| `transaction_id` | uuid | |
| `dashboard_id` | uuid | |
| `user` | object | `{ user_id, user_name, full_name, image }` of who registered the movement. |
| `record_type` | object | `{ record_type_id, name, color, icon }`. |
| `source_type` | string | `financial_record` or `installment_plan` (more in the future). |
| `source_id` | uuid | Identifier of the source row. |
| `name` | string | Snapshot of the source's name. |
| `amount` | decimal string | Original currency. |
| `currency` | string | Code from the `Currency` catalog. |
| `converted` | object \| null | See [1.8](#18-currency-conversion). |
| `occurred_at` | datetime | |
| `deleted_at` | datetime \| null | Set when the source was soft-deleted. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 20.3 Query Parameters

| Parameter | Type | Notes |
| :--- | :--- | :--- |
| `source_type` | string (multi) | |
| `record_type_id` | uuid | |
| `user_id` | uuid | |
| `occurred_from`, `occurred_to` | datetime | Inclusive. |
| `deleted` | boolean | `true` → only entries whose source was deleted; `false` → only the others. Omitted → all entries (the frontend can filter on `deleted_at`). |
| `rate` | enum | `payment_date` (default) or `current`. |
| `sort` | enum | `-occurred_at` (default), `occurred_at`. |

### 20.4 Business Rules

- There are no write endpoints. Every create, update and soft delete of a source row also writes its entry in the same database transaction: an update refreshes the snapshot, a soft delete sets `deleted_at`.
- `source_id` has no foreign key, so entries never block the deletion of their source, and the history keeps the entries of deleted sources.
- Entries are removed only when the dashboard is purged.

---

## 21. Error Catalog

Errors use `application/problem+json` ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)).

```json
{
  "type": "https://fortis-libertas.local/errors/validation-error",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "detail": "One or more fields are invalid.",
  "errors": [
    { "pointer": "/price", "message": "Must be a decimal with at most 2 fraction digits." }
  ]
}
```

| Field | Notes |
| :--- | :--- |
| `type`, `title`, `status`, `detail` | Standard RFC 9457 members. |
| `code` | Stable, machine-readable identifier (table below). Clients must branch on `code`, not `detail`. |
| `errors` | Present on `422`; one item per invalid field with a JSON Pointer to the request body or `parameter` for query strings. |

| HTTP | `code` | When |
| :-: | :--- | :--- |
| `400` | `MALFORMED_REQUEST` | Invalid JSON, wrong content type, or a path parameter that is not a UUID. |
| `401` | `UNAUTHENTICATED` | Missing, invalid, or expired session or bearer token. |
| `403` | `ACCOUNT_SUSPENDED` | `User.suspended_at` is set. |
| `403` | `FORBIDDEN` | Caller is a member but lacks the required role or creator permission. |
| `404` | `NOT_FOUND` | Resource does not exist, is soft-deleted, or the caller is not a member of its scope. |
| `409` | `NAME_ALREADY_EXISTS` | Unique `(dashboard_id, name)` (or equivalent) violated, including against soft-deleted rows. |
| `409` | `USER_NAME_TAKEN` | `User.user_name` already in use. |
| `409` | `ALREADY_MEMBER` | The user already has an active membership. |
| `409` | `LAST_OWNER` | The operation would leave a dashboard or bank account without an `owner`. |
| `409` | `IN_USE` | The row is still referenced (emulated `RESTRICT`). |
| `409` | `HAS_ACTIVE_CARDS` | Bank account still has non-deleted cards. |
| `409` | `MEMBER_HAS_CARDS` | Member still owns non-deleted cards on the bank account. |
| `409` | `DASHBOARD_INACTIVE` | Write attempted on a dashboard with `is_active = false`. |
| `409` | `PLAN_CANCELLED` | Record linked to a cancelled installment plan. |
| `409` | `CURRENT_SESSION` | Attempt to revoke the current session through `/me/sessions/{session_id}`. |
| `409` | `NOT_DELETED` | Restore requested for a resource that is not deleted. |
| `409` | `RESTORE_WINDOW_EXPIRED` | The 30-day restore window has passed. |
| `409` | `COLOR_IN_USE` | The color is already used by another record type (or category) of the dashboard. |
| `422` | `VALIDATION_ERROR` | Body or query validation failed, unknown keys, or cross-dashboard foreign keys. |
| `429` | `RATE_LIMITED` | Too many requests; includes `Retry-After`. |
| `500` | `INTERNAL_ERROR` | Unexpected error. The response never contains stack traces or SQL. |
| `502` | `EXCHANGE_RATE_UNAVAILABLE` | `GET /exchange-rates` only: the rate is not cached and the provider is unreachable. |

### Permission Summary

| Resource | `viewer` | `editor` | `owner` |
| :--- | :--- | :--- | :--- |
| Dashboard | read | read | update, delete |
| Dashboard members | read | read | add, change role, remove |
| Record types | read | read | create, update, delete |
| Categories, tags, tag links | read | create, update, delete | all |
| Payment methods | read | create; update/delete own | update/delete any |
| Installment plans | read | create, update, delete | all |
| Financial records and record tags | read | create, update, delete | all |
| Reports | read | read | read |
| Colors, icons, currencies, languages, exchange rates | read | read | read |
| Home | read | read | read |
| Activity logs (dashboard, bank account) | – | – | read |
| Transactions (history) | read | read | read |
| Bank account | read | update name / initial balance | delete, freeze, unfreeze |
| Bank account members | read | read | add, change role, remove |
| Cards | read | create | all (plus card owner: update, delete, freeze) |
