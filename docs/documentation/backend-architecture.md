# Backend Architecture: API Route Handlers & Database Queries

This document describes the project's architectural pattern, aligned with `endpoints.md`, clearly separating the HTTP routes (**Next.js App Router**) from the data access layer (**Drizzle ORM / MySQL**), ensuring per-Dashboard isolation and compliance with the **CQS (Command Query Separation)** principle.

---

## 1. Overview of Layer Separation

```
HTTP Request
     │
     ▼
[ Route Handler ] (src/app/api/v1/...)
  ├─ Session authentication (auth.api.getSession)
  ├─ Dynamic parameter resolution (dashboard_id, id)
  ├─ Payload validation (snake_case) and undefined blocking
  └─ HTTP response code mapping (200, 201, 400, 401, 404, 500)
     │
     ▼
[ Database Queries ] (src/db/queries/...)
  ├─ Type conversion (UUID string <-> BINARY(16) via UUID_TO_BIN / BIN_TO_UUID)
  ├─ Separation of responsibilities (read.ts vs write.ts)
  ├─ Atomic transactions (db.transaction)
  └─ Restricted scope and soft delete filters (inDashboard, deletedAt IS NULL)
     │
     ▼
[ MySQL Database ]
```

---

## 2. Folder Structure: Route Handlers (`src/app/api/v1/`)

Routes are divided into two main scopes: **Global** (aggregated data from the user's profile) and **Dashboard-Scoped** (resources isolated per workspace).

```text
src/app/api/v1/
│
├── me/                                         # Global scope: Authenticated user profile
│   ├── route.ts                                # GET (base data), PATCH (user update)
│   └── profile/
│       └── route.ts                            # PATCH (preferences, phone, currency, language)
│
├── bank-accounts/                              # Global scope: Main bank accounts
│   ├── route.ts                                # GET (list), POST (create)
│   └── [account_id]/
│       └── route.ts                            # GET, PATCH, DELETE
│
├── cards/                                      # Global scope: Credit/debit cards
│   ├── route.ts                                # GET (list), POST (create)
│   └── [card_id]/
│       └── route.ts                            # GET, PATCH, DELETE
│
└── dashboards/                                 # Scoped: Strictly isolated resources
    └── [dashboard_id]/
        │
        ├── categories/                         # Financial categories
        │   ├── route.ts                        # GET (list active), POST (create new)
        │   └── [category_id]/
        │       └── route.ts                    # GET, PATCH, DELETE (soft-delete)
        │
        ├── payment-methods/                    # Payment methods (Accounts, Cards, Cash)
        │   ├── route.ts                        # GET (list), POST (create)
        │   └── [payment_method_id]/
        │       └── route.ts                    # GET, PATCH, DELETE
        │
        ├── record-types/                       # Record types ("INCOME", "EXPENSE")
        │   ├── route.ts                        # GET (list), POST (auto-provisioning / creation)
        │   └── [record_type_id]/
        │       └── route.ts                    # GET, PATCH, DELETE
        │
        ├── tags/                               # Cross-cutting micro-segmentation
        │   ├── route.ts                        # GET (list), POST (create)
        │   └── [tag_id]/
        │       └── route.ts                    # GET, PATCH, DELETE
        │
        ├── installment-plans/                  # Installment plans and savings goals
        │   ├── route.ts                        # GET (list), POST (create goal/plan)
        │   └── [plan_id]/
        │       └── route.ts                    # GET, PATCH (status/completion), DELETE
        │
        └── financial-records/                  # Main financial transactions
            ├── route.ts                        # GET (paginated/sorted), POST (strict validation)
            ├── [id]/
            │   └── route.ts                    # GET (details + joins), PATCH, DELETE
            └── [id]/tags/
                ├── route.ts                    # PUT (atomic tag replacement)
                └── [tag_id]/
                    └── route.ts                # POST (link tag), DELETE (unlink tag)
```

---

## 3. Folder Structure: Queries (`src/db/queries/`)

Each system domain has a dedicated directory with command segregation (CQS):

```text
src/db/queries/
│
├── utils.ts                                    # Shared scope and SQL conversion helpers
│
├── categories/                                 # Categories domain
│   ├── read.ts                                 # getCategoriesByDashboardId, getCategoryById
│   ├── write.ts                                # createCategory, updateCategory, softDeleteCategory
│   └── type.ts                                 # TypeScript interfaces for inputs
│
├── payment-methods/                            # Payment Methods domain
│   ├── read.ts                                 # getPaymentMethodsByDashboardId, getPaymentMethodById
│   ├── write.ts                                # createPaymentMethod, updatePaymentMethod, softDelete
│   └── type.ts
│
├── record-types/                               # Record Types domain
│   ├── read.ts                                 # getRecordTypesByDashboardId, getRecordTypeByName
│   ├── write.ts                                # createRecordType, ensureDefaultRecordTypes
│   └── type.ts
│
├── tags/                                       # Tags domain
│   ├── read.ts                                 # getTagsByDashboardId, getTagsByRecordId
│   ├── write.ts                                # createTag, updateTag, softDeleteTag
│   └── type.ts
│
├── installment-plans/                          # Plans and Goals domain
│   ├── read.ts                                 # getInstallmentPlansByDashboardId, getInstallmentPlanById
│   ├── write.ts                                # createInstallmentPlan, updateStatus, softDeletePlan
│   └── type.ts
│
└── financial-records/                          # Financial Records domain
    ├── read.ts                                 # getFinancialRecord, getFinancialRecordsByDashboardId
    ├── write.ts                                # createFinancialRecord, updateFinancialRecord, softDelete
    └── type.ts                                 # CreateFinancialRecordInput, UpdateFinancialRecordInput
```

---

## 4. Rules and Best Practices

### 4.1. Query Layer (`write.ts` / `read.ts`)
1. **Mandatory Binary Conversion:** MySQL stores identifiers as `BINARY(16)`. In SQL template literals, always use ``sql`UUID_TO_BIN(${id})` ``.
2. **Preventing Null Parameters in Native Functions:** Never pass `undefined` variables to `UUID_TO_BIN()`, as MySQL raises the error `ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT`.
3. **Soft Deletes:** No main entity is removed via a direct `DELETE`. Queries in `read.ts` always use `isNull(table.deletedAt)`.
4. **Atomic Transactions:** Writes involving more than one table (e.g., `financial_record` and `tag_financial_record`) must run inside `await db.transaction(async (tx) => { ... })`.

### 4.2. Route Layer (`route.ts`)
1. **Naming Contract:** The API receives and returns properties in `snake_case` (e.g., `record_type_id`, `payment_date`), converting to `camelCase` when calling the Drizzle queries.
2. **Early Validation:** If required keys are missing from the payload, respond with `400 Bad Request` and a descriptive detail, preventing internal execution failures (`500`).
3. **Response Pattern:**
   - Single-item success: `{ data: { ... } }` (`200` or `201`)
   - List success: `{ data: [ ... ], meta: { ... } }`
   - Errors: `{ code: "ERROR_CODE", message: "..." }`

---

## 5. Complete Execution Flow (Example: Financial Record)

```
1. Frontend (FinancialContext)
   └─ Fires POST /api/v1/dashboards/:id/financial-records
      Payload: { name, price, record_type_id, category_id, payment_method_id, ... }

2. Route Handler (src/app/api/v1/dashboards/[dashboard_id]/financial-records/route.ts)
   ├─ Validates the session via auth.api.getSession()
   ├─ Checks for the presence of required IDs
   └─ Invokes createFinancialRecord(dashboardId, userId, inputData)

3. Query Layer (src/db/queries/financial-records/write.ts)
   ├─ Generates the binary UUID with generateId()
   ├─ Executes tx.insert(financialRecord) and tx.insert(tagFinancialRecord)
   └─ Returns the hydrated record via getFinancialRecord(dashboardId, id)

4. HTTP Response
   └─ Status 201 Created with Location header and body { data: createdRecord }
```
