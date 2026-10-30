# Data Dictionary

## Index

1. [User](#table-user)
2. [Session](#table-session)
3. [Card](#table-card)
4. [Bank_Account](#table-bank_account)
5. [Tag__Category](#table-tag__category)
6. [Notifications](#table-notifications)
7. [Verification](#table-verification)
8. [Two_Factor](#table-two_factor)
9. [Payment_Method](#table-payment_method)
10. [Bank_Account__User](#table-bank_account__user)
11. [Tag__Financial_Record](#table-tag__financial_record)
12. [Record_Type](#table-record_type)
13. [Account](#table-account)
14. [Category](#table-category)
15. [Tag](#table-tag)
16. [Profile](#table-profile)
17. [Dashboard](#table-dashboard)
18. [User__Dashboard](#table-user__dashboard)
19. [Financial_Record](#table-financial_record)
20. [Installment_Plan](#table-installment_plan)
21. [Color](#table-color)
22. [Icon](#table-icon)
23. [Transaction](#table-transaction)
24. [Activity_Log](#table-activity_log)
25. [Language](#table-language)
26. [Currency](#table-currency)
27. [Exchange_Rate](#table-exchange_rate)
28. [Tag__Installment_Plan](#table-tag__installment_plan)
29. [Record_Type__Category](#table-record_type__category)

---

## Table: User

Stores registered users of the platform, including authentication credentials, profile information, two-factor authentication settings, and lifecycle timestamps.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **user_id** | binary(16) | PK KEY (Primary Key), UNIQUE | Unique user identifier. |
| **user_name** | varchar(254) | UNIQUE | Username – must be unique. |
| **full_name** | varchar(254) | NOT NULL | User’s full name. |
| **email** | varchar(254) | UNIQUE | Email address – must be unique. |
| **email_verified_at** | datetime | NULL | Date and time of the email verification. |
| **image** | text | NULL | Path or URL of the profile picture. |
| **two_factor_enabled** | bool | NOT NULL | Indicates whether two-factor authentication is enabled. |
| **suspended_at** | datetime | NULL | Timestamp for suspended the user |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Defaults:**

- `two_factor_enabled`: `false`

**Indexes:**

- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_user_user_name (user_name)`
- `UNIQUE INDEX idx_user_email (email)`

---

## Table: Session

Manages active authentication sessions, linking authenticated tokens to specific users, client IP addresses, and user-agent details.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **session_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique session identifier. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `User` table. |
| **token** | varchar(255) | UNIQUE, NOT NULL | Session authentication token. |
| **ip_address** | text | NOT NULL | The client’s IP address during the session. |
| **user_agent** | text | NOT NULL | User-Agent information from the browser/device. |
| **expires_at** | datetime | NOT NULL | Session expiry date and time. |
| **created_at** | datetime | NOT NULL | Timestamp when the session was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the session was last updated. |

**Indexes:**

- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_session_token (token)`
- `INDEX idx_session_user_id (user_id)`
- `INDEX idx_session_expires_at (expires_at)`

---

## Table: Card

Stores payment cards (credit and debit) associated with bank accounts and users, supporting freeze status, expiration date, CVV, and soft deletion.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **card_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the card. |
| **bank_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key linking to the bank account. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key linking to the user. |
| **cardholder_name** | varchar(50) | NOT NULL | Name of the cardholder. |
| **type_card** | enum | NOT NULL | Type of card ('credit' or 'debit'). |
| **card_number** | char(16) | NULL | Card number. |
| **expiry_date** | date | NULL | Expiry date of the card. |
| **cvv** | char(3) | NULL | 3-digit security code. |
| **frozen_at** | datetime | NULL | Timestamp when the card was frozen/blocked. |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Enum Values for `type_card`:**

- `'credit'`
- `'debit'`

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX idx_card_bank_id (bank_id)`
- `INDEX idx_card_user_id (user_id)`

---

## Table: Bank_Account

Represents financial bank accounts, tracking account labels, opening balance, freeze status, and soft deletion.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **bank_account_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the bank account. |
| **name** | varchar(50) | NOT NULL | Name or label of the bank account. |
| **initial_balance** | decimal(10,2) | NOT NULL | The starting balance of the account. |
| **frozen_at** | datetime | NULL | Timestamp recording when the account was temporarily frozen. |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Indexes:**

- `PRIMARY KEY (id)`

---

## Table: Tag__Category

Junction table establishing a many-to-many relationship between tags and categories with cascading deletions.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **tag_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific tag. |
| **category_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific category. |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |

**Composite Primary Key:**

- The combination of `(tag_id, category_id)` forms the primary key, ensuring each tag-category pair is unique.

**Cascade Delete:**

- `ON DELETE CASCADE` is configured on both `tag_id` and `category_id`, meaning if a referenced tag or category is deleted, the association will also be automatically deleted.

**Indexes:**

- `PRIMARY KEY (tag_id, category_id)`
- `INDEX idx_tag_category_category_id (category_id)`

---

## Table: Notifications

Stores transactional and system notifications delivered to users, including notification type, structured JSON payload, and read status.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **notification_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the notification. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Relates the notification to the receiving user in the `User` table. |
| **type** | varchar(255) | NOT NULL | The category or type of the notification. |
| **data** | json | NOT NULL | The payload or main content of the notification. |
| **created_at** | datetime | NOT NULL | Timestamp when the notification was generated. |
| **read_at** | datetime | NULL | Timestamp indicating when the notification was read. |

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX idx_notifications_user_id (user_id)`
- `INDEX idx_notifications_read_at (read_at)`

---

## Table: Verification

Stores short-lived tokens and security verification codes (e.g., email confirmation, phone verification) along with expiry timestamps.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **verification_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the verification attempt. |
| **identifier** | varchar(191) | NOT NULL | The target being verified (e.g., an email address or phone number). |
| **value** | text | NOT NULL | The actual verification code or token. |
| **expires_at** | datetime | NOT NULL | Timestamp indicating when the verification code is no longer valid. |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX idx_verification_identifier (identifier)`
- `INDEX idx_verification_expires_at (expires_at)`

---

## Table: Two_Factor

Manages two-factor authentication (2FA) configurations, including cryptographic secret keys, emergency backup codes, and lockout security policies.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **tow_factor_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the 2FA configuration. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Relates the two-factor settings to a specific user in the `User` table. |
| **secret** | text | NOT NULL | The cryptographic secret used to generate authenticator codes. |
| **backup_codes** | text | NOT NULL | Stored emergency recovery codes. |
| **verified** | bool | NOT NULL | Indicates whether the user has successfully completed the initial 2FA setup. |
| **failed_verification_count** | int | NOT NULL | Counter tracking consecutive incorrect code attempts. |
| **locked_until** | datetime | NULL | Timestamp indicating a temporary lockout period after too many failed attempts. |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Defaults:**

- `verified`: `false`
- `failed_verification_count`: `0`

**Indexes:**

- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_two_factor_user_id (user_id)`

---

## Table: Payment_Method

Defines payment methods available within a dashboard (e.g., cash, bank transfer, card), with an optional reference to a payment card.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **payment_method_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the payment method. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL| Foreign key referencing the `User` table. |
| **card_id** | binary(16) | FK KEY (Foreign Key), NULL | Foreign key referencing a card in the `Card` table (optional). |
| **dashboard_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Dashboard` table. |
| **name** | varchar(50) | NOT NULL | Payment method name. |
| **description** | text | NOT NULL | Detailed description of the payment method. |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Unique Constraint:**

- A composite unique constraint exists on the combination of `(dashboard_id, user_id ,name)`, meaning payment method names must be unique within each dashboard and user.

**Indexes:**

- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_payment_method_dashboard_name (dashboard_id, name)`
- `INDEX idx_payment_method_dashboard_id (dashboard_id)`
- `INDEX idx_payment_method_card_id (card_id)`

---

## Table: Bank_Account__User

Junction table managing multi-user access permissions and roles ('owner', 'editor', 'viewer') for bank accounts.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **bank_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL | Part of the composite primary key, linking to the bank account. |
| **user_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL | Part of the composite primary key, linking to the user. |
| **role** | enum | NOT NULL | User's role/access level. Accepted values: `'owner'`, `'editor'`, `'viewer'`. |
| **created_at** | datetime | NOT NULL | Timestamp when the association was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the association was last updated. |

**Enum Values for `role`:**

- `'owner'`
- `'editor'`
- `'viewer'`

**Composite Primary Key:**

- The combination of `(bank_id, user_id)` forms the primary key, ensuring each user-bank account pair is unique.

**Indexes:**

- `PRIMARY KEY (bank_id, user_id)`
- `INDEX idx_bank_account_user_user_id (user_id)`

---

## Table: Tag__Financial_Record

Junction table connecting tags to financial records for transaction categorization and searching, supporting cascading deletions.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **tag_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL, ON DELETE CASCADE | Part of the composite primary key, linking to the tag. |
| **record_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL, ON DELETE CASCADE | Part of the composite primary key, linking to the financial record. |
| **created_at** | datetime | NOT NULL | Timestamp when the association was created. |

**Composite Primary Key:**

- The combination of `(tag_id, record_id)` forms the primary key, ensuring each tag-record pair is unique.

**Cascade Delete:**

- `ON DELETE CASCADE` is configured on both `tag_id` and `record_id`, meaning if a referenced tag or financial record is deleted, the association will also be automatically deleted.

**Indexes:**

- `PRIMARY KEY (tag_id, record_id)`
- `INDEX idx_tag_financial_record_record_id (record_id)`

---

## Table: Record_Type

Classifies financial transactions into broad movement types (Expenses, Income, Investment) scoped per dashboard.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **record_type_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the record type. |
| **dashboard_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the associated dashboard. |
| **name** | varchar(50) | NOT NULL | Name of the record type. |
| **description** | text | NULL | Optional description of the record type. |
| **color_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Color` table. Exclusive to this record type within the dashboard. |
| **icon_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Icon` table. |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Unique Constraint:**

- A composite unique constraint exists on the combination of `(dashboard_id, name)`, meaning record type names must be unique within each dashboard.
- A composite unique constraint exists on the combination of `(dashboard_id, color_id)`, meaning a color can be used by only one record type per dashboard. The index includes soft-deleted rows.
- Colors with `Color.is_reserved = true` can only be held by the seeded `Income` and `Expenses` record types.

**Seeder:**

- `name`: `Expenses`, `Income`, `Investment`
- `Income` and `Expenses` receive the two reserved colors; `Investment` receives a free, non-reserved color. Each one receives a default icon.

**Indexes:**

- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_record_type_dashboard_name (dashboard_id, name)`
- `UNIQUE INDEX idx_record_type_dashboard_color (dashboard_id, color_id)`
- `INDEX idx_record_type_dashboard_id (dashboard_id)`
- `INDEX idx_record_type_icon_id (icon_id)`

---

## Table: Account

Stores linked external authentication providers (e.g., Google, GitHub) and credentials associated with user accounts.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **account_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique account identifier. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key linking this account to its user in the `User` table. |
| **account_identifier_id** | text | NOT NULL | Account identifier with an external supplier or service. |
| **provider_id** | text | NOT NULL | Service provider identifier (e.g., Google, GitHub). |
| **access_token** | text | NOT NULL | Access token for the provider's API. |
| **refresh_token** | text | NULL | Token used to renew expired access. |
| **scope** | text | NULL | Scope of permissions authorized by the external provider. |
| **id_token** | text | NULL | Identity token provided by the external service. |
| **password** | text | NULL | Account password (may be left blank depending on authentication method). |
| **access_token_expires_at** | datetime | NULL | Expiry date and time of the access token. |
| **refresh_token_expires_at** | datetime | NULL | Expiry date and time of the renewal token. |
| **created_at** | datetime | NOT NULL | Timestamp when the account was registered. |
| **updated_at** | datetime | NOT NULL | Timestamp when the account details were last updated. |

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX idx_account_user_id (user_id)`

---

## Table: Category

Represents user-defined categories within a dashboard for organizing and grouping financial transactions.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **category_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the category. |
| **dashboard_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the dashboard this category belongs to. |
| **name** | varchar(50) | NOT NULL | Name of the category. |
| **description** | text | NULL | Optional description of the category. |
| **color_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Color` table. Exclusive to this category within the dashboard. |
| **icon_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Icon` table. |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the category was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the category was last updated. |

**Unique Constraint:**

- A composite unique constraint exists on the combination of `(dashboard_id, name)`, meaning category names must be unique within each dashboard.
- A composite unique constraint exists on the combination of `(dashboard_id, color_id)`, meaning a color can be used by only one category per dashboard. The index includes soft-deleted rows, and reserved colors (`Color.is_reserved`) cannot be used by categories.
- A category can be linked to several record types through `Record_Type__Category`. A category without any link cannot be used in a record or in an installment plan.

**Indexes:**

- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_category_dashboard_name (dashboard_id, name)`
- `UNIQUE INDEX idx_category_dashboard_color (dashboard_id, color_id)`
- `INDEX idx_category_dashboard_id (dashboard_id)`
- `INDEX idx_category_icon_id (icon_id)`

---

## Table: Tag

Represents flexible labels within a dashboard used to categorize, filter, and cross-reference financial records and categories.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **tag_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the tag. |
| **dashboard_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the dashboard this tag belongs to. |
| **name** | varchar(50) | NOT NULL | Name of the tag. |
| **description** | text | NULL | Optional description of the tag. |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the tag was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the tag was last updated. |

**Unique Constraint:**

- A composite unique constraint exists on the combination of `(dashboard_id, name)`, ensuring tag names are unique within each dashboard.

**Indexes:**

- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_tag_dashboard_name (dashboard_id, name)`
- `INDEX idx_tag_dashboard_id (dashboard_id)`

---

## Table: Profile

Stores extended user profile attributes including birth date, phone number, and localization preferences (currency and language).

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **user_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL | Primary key and foreign key referencing the `User` table. |
| **birth_date** | date | NULL | User's birth date. |
| **phone** | varchar(20) | NULL | User's phone number. |
| **phone_verified_at** | datetime | NULL | Timestamp when the phone number was verified. |
| **currency_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Currency` table (preferred currency, default: EUR). |
| **language_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Language` table (preferred language, default: pt-PT). |
| **created_at** | datetime | NOT NULL | Timestamp when the profile was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the profile was last updated. |

**Defaults:**

- `currency_id`: the `EUR` row of `Currency`
- `language_id`: the `pt-PT` row of `Language`

**Cascade Delete:**

- `ON DELETE CASCADE` is configured for `user_id`, meaning if a user is deleted, their associated profile will also be automatically deleted.

**Indexes:**

- `PRIMARY KEY (user_id)`
- `INDEX idx_profile_currency_id (currency_id)`
- `INDEX idx_profile_language_id (language_id)`

---

## Table: Dashboard

Represents a financial workspace or dashboard context, acting as the container for financial records, categories, tags, and member access.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **dashboard_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the dashboard. |
| **name** | varchar(50) | NOT NULL | Name of the dashboard. |
| **is_active** | bool | NOT NULL | Indicates whether the dashboard is currently active. |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the dashboard was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the dashboard was last updated. |

**Defaults:**

- `is_active`: `true`

**Indexes:**

- `PRIMARY KEY (id)`

---

## Table: User__Dashboard

Junction table associating users with dashboards and specifying their role and permissions ('owner', 'editor', 'viewer').

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **dashboard_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Dashboard` table. |
| **user_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `User` table. |
| **role** | enum | NOT NULL | User's role in the dashboard ('owner', 'editor', 'viewer'). |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the association was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the association was last updated. |

**Enum Values for `role`:**

- `'owner'`
- `'editor'`
- `'viewer'`

**Composite Primary Key:**

- The combination of `(dashboard_id, user_id)` forms the primary key, ensuring each user-dashboard pair is unique.

**Indexes:**

- `PRIMARY KEY (dashboard_id, user_id)`
- `INDEX idx_user_dashboard_user_id (user_id)`

---

## Table: Financial_Record

Stores individual financial transactions (income, expenses, investments) within a dashboard, linking to a category, payment method, author, and optional installment plan.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **financial_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the financial record. |
| **dashboard_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Dashboard` table. |
| **register_by_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `User` table (who registered the record). |
| **record_type_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Record_Type` table. |
| **category_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Category` table. |
| **payment_method_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Payment_Method` table. |
| **installment_plan_id** | binary(16) | FK KEY (Foreign Key), NULL | Foreign key referencing the `Installment_Plan` table (optional, nullable). |
| **name** | varchar(50) | NOT NULL | Name/title of the financial record. |
| **description** | text | NULL | Detailed description of the transaction. |
| **price** | decimal(10,2) | NOT NULL | Monetary amount (10 digits total, 2 decimal places). |
| **currency_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Currency` table. Original currency of `price`, as entered by the user. |
| **payment_date** | datetime | NOT NULL | Date and time when payment was made or due. |
| **status** | enum | NOT NULL | Current status of the record. |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Integrity (application):**

- The pair `(record_type_id, category_id)` must exist in `Record_Type__Category`; otherwise the write is rejected. There is no composite foreign key because soft-deleted records would block unlinking a category from a record type.

**Enum Values for `status`:**

- `'active'`
- `'settled'`
- `'cancelled'`
- `'pending'`
- `'paid'`
- `'late'`

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX idx_financial_record_dashboard_id (dashboard_id)`
- `INDEX idx_financial_record_register_by_id (register_by_id)`
- `INDEX idx_financial_record_record_type_id (record_type_id)`
- `INDEX idx_financial_record_category_id (category_id)`
- `INDEX idx_financial_record_payment_method_id (payment_method_id)`
- `INDEX idx_financial_record_installment_plan_id (installment_plan_id)`
- `INDEX idx_financial_record_payment_date (payment_date)`
- `INDEX idx_financial_record_status (status)`
- `INDEX idx_financial_record_currency_id (currency_id)`

---

## Table: Installment_Plan

Manages multi-installment payment plans and financing schedules, tracking total installments, amounts, and plan completion status.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **installment_plan_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the installment plan. |
| **dashboard_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Dashboard` table. |
| **name** | varchar(50) | NOT NULL | Name/title of the installment plan. |
| **description** | text | NULL | Optional description of the installment plan. |
| **category_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Category` table. Inherited by the records of the plan. |
| **record_type_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Record_Type` table. Always the dashboard's `Expenses` type; set by the server. |
| **currency_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Currency` table. Currency of `total_amount`. |
| **register_by_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `User` table (who created the plan). |
| **total_amount** | decimal(10,2) | NOT NULL | Total monetary amount of the plan (10 digits, 2 decimals). |
| **total_installments** | int | NOT NULL | Number of installments in the plan. |
| **due_date** | date | NOT NULL | Final due date for the entire plan. |
| **status** | enum | NOT NULL | Current status of the plan (default: 'pending'). |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the plan was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the plan was last updated. |

**Notes:**

- `record_type_id` always points to the `Expenses` record type of the dashboard and cannot be chosen by the client.
- `category_id` must be linked to the `Expenses` record type in `Record_Type__Category`.
- The financial records generated for the plan inherit its record type, category and tags (`Tag__Installment_Plan`).

**Enum Values for `status`:**

- `'cancelled'`
- `'pending'`
- `'paid'`
- `'late'`

**Defaults:**

- `status`: `'pending'`

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX idx_installment_plan_dashboard_id (dashboard_id)`
- `INDEX idx_installment_plan_register_by_id (register_by_id)`
- `INDEX idx_installment_plan_due_date (due_date)`
- `INDEX idx_installment_plan_status (status)`
- `INDEX idx_installment_plan_category_id (category_id)`
- `INDEX idx_installment_plan_record_type_id (record_type_id)`
- `INDEX idx_installment_plan_currency_id (currency_id)`

---

## Table: Color

Global catalog of colors used to identify record types and categories. Created and seeded when the database is created; it is not scoped to a dashboard and is read-only through the API.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **color_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the color. |
| **name** | varchar(50) | UNIQUE, NOT NULL | Display name of the color (e.g., Green). |
| **code_color** | char(7) | UNIQUE, NOT NULL | Hexadecimal color in `#RRGGBB` format. Used as-is by Android and web. |
| **is_reserved** | bool | NOT NULL | Reserved colors belong to the seeded `Income` and `Expenses` record types only. |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Defaults:**

- `is_reserved`: `false`

**Seeder:**

- The palette is inserted when the database is created. Exactly two colors have `is_reserved = true` (one for `Income`, one for `Expenses`).
- The palette must be larger than the number of categories a dashboard is expected to hold, because each category uses a color exclusively (see `Category`).

**Indexes:**

- `PRIMARY KEY (color_id)`
- `UNIQUE INDEX idx_color_name (name)`
- `UNIQUE INDEX idx_color_code_color (code_color)`

---

## Table: Icon

Global catalog of icons used to identify record types and categories. Created and seeded when the database is created; read-only through the API.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **icon_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the icon. |
| **name** | varchar(50) | UNIQUE, NOT NULL | Display name of the icon (e.g., Shopping cart). |
| **code_icon** | varchar(50) | UNIQUE, NOT NULL | Name of the icon in Material Symbols, in `snake_case` (e.g., `shopping_cart`). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Notes:**

- `code_icon` is a name, not an image. The web client renders it with the Material Symbols font. The Android client resolves it through a static name-to-icon map, since Compose has no lookup by name at runtime.

**Indexes:**

- `PRIMARY KEY (icon_id)`
- `UNIQUE INDEX idx_icon_name (name)`
- `UNIQUE INDEX idx_icon_code_icon (code_icon)`

---

## Table: Transaction

Financial history of the whole dashboard. Each row is a snapshot of a movement that happened in a source row (a financial record, an installment plan, and in the future savings, debts or goals), so the history survives edits and deletions of the source. It is not an audit trail: who did what is in `Activity_Log`.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **transaction_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the transaction. |
| **dashboard_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Dashboard` table. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `User` table (who registered the movement). |
| **record_type_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Record_Type` table. |
| **source_type** | varchar(50) | NOT NULL | Kind of the source row (e.g., `financial_record`, `installment_plan`). Validated by the application, so new sources need no migration. |
| **source_id** | binary(16) | NOT NULL | Identifier of the source row. No foreign key: the database cannot validate it. |
| **name** | varchar(50) | NOT NULL | Snapshot of the source's name. |
| **amount** | decimal(10,2) | NOT NULL | Snapshot of the amount, in the original currency. |
| **currency_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Currency` table. |
| **occurred_at** | datetime | NOT NULL | When the movement happened or is due. |
| **deleted_at** | datetime | NULL | Set when the source is soft-deleted. The entry is kept and the frontend filters it. |
| **created_at** | datetime | NOT NULL | Timestamp when the entry was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the entry was last updated. |

**Referential Rules:**

- `dashboard_id` → `Dashboard`: `ON DELETE CASCADE`.
- `user_id` → `User`: `ON DELETE RESTRICT`.
- `record_type_id` → `Record_Type`: `ON DELETE RESTRICT`.
- `currency_id` → `Currency`: `ON DELETE RESTRICT`.

**Integrity (application):**

- Every write to a source row also writes its `Transaction` in the same database transaction. Editing the source refreshes the snapshot, and soft-deleting it sets `deleted_at`.
- There is at most one entry per source row.

**Indexes:**

- `PRIMARY KEY (transaction_id)`
- `UNIQUE INDEX idx_transaction_source (source_type, source_id)`
- `INDEX idx_transaction_dashboard_occurred (dashboard_id, occurred_at)`
- `INDEX idx_transaction_record_type_id (record_type_id)`
- `INDEX idx_transaction_user_id (user_id)`

---

## Table: Activity_Log

Append-only audit trail of who did what in the system: account events (sign-in, password change), dashboard events and bank account events. Rows are written by the server only and are never updated or deleted.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **activity_log_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the log entry. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | The user who performed the action. |
| **scope** | enum | NOT NULL | Where the action happened ('account', 'dashboard', 'bank_account'). |
| **dashboard_id** | binary(16) | FK KEY (Foreign Key), NULL | Set when `scope = 'dashboard'`. |
| **bank_account_id** | binary(16) | FK KEY (Foreign Key), NULL | Set when `scope = 'bank_account'`. |
| **entity_type** | varchar(50) | NOT NULL | Type of the affected resource (e.g., `financial_record`, `member`, `session`). |
| **entity_id** | binary(16) | NULL | Identifier of the affected resource, when there is one. |
| **action** | varchar(50) | NOT NULL | What happened (e.g., `created`, `updated`, `deleted`, `restored`, `member_added`, `sign_in`). |
| **metadata** | json | NULL | Names of the changed fields and other context. Never secrets, tokens or card data. |
| **ip_address** | varchar(45) | NULL | Client IP address. Only returned to the user who performed the action. |
| **user_agent** | text | NULL | Client User-Agent. Only returned to the user who performed the action. |
| **created_at** | datetime | NOT NULL | Timestamp when the action happened. |

**Enum Values for `scope`:**

- `'account'`
- `'dashboard'`
- `'bank_account'`

**Constraints:**

- `scope = 'dashboard'` requires `dashboard_id` and no `bank_account_id`; `scope = 'bank_account'` requires `bank_account_id` and no `dashboard_id`; `scope = 'account'` has neither.

**Referential Rules:**

- `user_id` → `User`: `ON DELETE RESTRICT`.
- `dashboard_id` → `Dashboard`: `ON DELETE CASCADE`.
- `bank_account_id` → `Bank_Account`: `ON DELETE CASCADE`.

**Indexes:**

- `PRIMARY KEY (activity_log_id)`
- `INDEX idx_activity_log_dashboard_created (dashboard_id, created_at)`
- `INDEX idx_activity_log_bank_account_created (bank_account_id, created_at)`
- `INDEX idx_activity_log_user_created (user_id, created_at)`

---

## Table: Language

Global catalog of the languages supported by the application. Seeded when the database is created; read-only through the API.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **language_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the language. |
| **code** | varchar(10) | UNIQUE, NOT NULL | BCP 47 tag (e.g., `en`, `pt-PT`). |
| **name** | varchar(50) | NOT NULL | Display name (e.g., English, Português). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Seeder:**

- `en` (English) and `pt-PT` (Português). `pt-PT` is the default of `Profile.language_id`.

**Indexes:**

- `PRIMARY KEY (language_id)`
- `UNIQUE INDEX idx_language_code (code)`

---

## Table: Currency

Global catalog of the supported currencies. Seeded when the database is created; read-only through the API.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **currency_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the currency. |
| **code** | char(3) | UNIQUE, NOT NULL | ISO 4217 code (e.g., `EUR`). |
| **name** | varchar(50) | NOT NULL | Display name (e.g., Euro). |
| **symbol** | varchar(5) | NOT NULL | Display symbol (e.g., `€`). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Seeder:**

- `EUR` (Euro, `€`), `USD` (US Dollar, `$`), `GBP` (Pound Sterling, `£`), `BRL` (Brazilian Real, `R$`). `EUR` is the default of `Profile.currency_id`.

**Indexes:**

- `PRIMARY KEY (currency_id)`
- `UNIQUE INDEX idx_currency_code (code)`

---

## Table: Exchange_Rate

Cache of the exchange rates obtained from the external provider (Frankfurter, ECB reference rates). It avoids repeated requests and keeps conversions working when the provider is unavailable.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **rate_date** | date | PK KEY (Primary Key), NOT NULL | Date the rate refers to. |
| **base_currency_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Currency` table (currency being converted). |
| **quote_currency_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Currency` table (currency converted to). |
| **rate** | decimal(18,8) | NOT NULL | Units of the quote currency per one unit of the base currency. |
| **source** | varchar(50) | NOT NULL | Provider of the rate (default: `frankfurter`). |
| **created_at** | datetime | NOT NULL | Timestamp when the rate was cached. |

**Composite Primary Key:**

- The combination of `(rate_date, base_currency_id, quote_currency_id)` forms the primary key.

**Notes:**

- The provider publishes rates on working days only; for other dates the rate of the previous working day is stored under the requested date.
- Today's rate is not final and must be refreshed, not trusted forever; only rates of past dates are definitive.
- `base_currency_id` must differ from `quote_currency_id`.

**Indexes:**

- `PRIMARY KEY (rate_date, base_currency_id, quote_currency_id)`
- `INDEX idx_exchange_rate_quote_currency_id (quote_currency_id)`

---

## Table: Tag__Installment_Plan

Junction table establishing a many-to-many relationship between tags and installment plans with cascading deletions. The financial records generated for a plan inherit its tags.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **tag_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific tag. |
| **installment_plan_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific installment plan. |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |

**Composite Primary Key:**

- The combination of `(tag_id, installment_plan_id)` forms the primary key, ensuring each tag-plan pair is unique.

**Indexes:**

- `PRIMARY KEY (tag_id, installment_plan_id)`
- `INDEX idx_tag_installment_plan_plan_id (installment_plan_id)`

---

## Table: Record_Type__Category

Junction table establishing a many-to-many relationship between record types and categories. It defines which categories can be used with each record type, so a category such as "Other" can serve several types.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **record_type_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific record type. |
| **category_id** | binary(16) | PK KEY (Primary Key), FK KEY (Foreign Key), NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific category. |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |

**Composite Primary Key:**

- The combination of `(record_type_id, category_id)` forms the primary key, ensuring each record type-category pair is unique.

**Cascade Delete:**

- `ON DELETE CASCADE` is configured on both `record_type_id` and `category_id`, meaning if a referenced record type or category is deleted, the association will also be automatically deleted.

**Integrity (application):**

- Both rows must belong to the same dashboard.
- A link cannot be removed while a non-deleted `Financial_Record` or `Installment_Plan` uses that pair (`409 IN_USE`).

**Indexes:**

- `PRIMARY KEY (record_type_id, category_id)`
- `INDEX idx_record_type_category_category_id (category_id)`
