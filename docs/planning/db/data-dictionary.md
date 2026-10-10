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
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

**Unique Constraint:**

- A composite unique constraint exists on the combination of `(dashboard_id, name)`, meaning record type names must be unique within each dashboard.

**Seeder:**

- `name`: `Expenses`, `Income`, `Investment`

**Indexes:**

- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_record_type_dashboard_name (dashboard_id, name)`
- `INDEX idx_record_type_dashboard_id (dashboard_id)`

---

## Table: Account

Stores linked external authentication providers (e.g., Google, GitHub) and credentials associated with user accounts.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **account_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique account identifier. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key linking this account to its user in the `User` table. |
| **account_id** | text | NOT NULL | Account identifier with an external supplier or service. |
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
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the category was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the category was last updated. |

**Unique Constraint:**

- A composite unique constraint exists on the combination of `(dashboard_id, name)`, meaning category names must be unique within each dashboard.

**Indexes:**

- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_category_dashboard_name (dashboard_id, name)`
- `INDEX idx_category_dashboard_id (dashboard_id)`

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
| **currency** | char(3) | NOT NULL | Preferred currency (default: EUR). |
| **language** | varchar(254) | NOT NULL | Preferred language (default: pt-PT). |
| **created_at** | datetime | NOT NULL | Timestamp when the profile was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the profile was last updated. |

**Defaults:**

- `currency`: `EUR`
- `language`: `pt-PT`

**Cascade Delete:**

- `ON DELETE CASCADE` is configured for `user_id`, meaning if a user is deleted, their associated profile will also be automatically deleted.

**Indexes:**

- `PRIMARY KEY (user_id)`

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
| **currency** | varchar(3) | NOT NULL | Currency code (e.g., USD, EUR). |
| **payment_date** | datetime | NOT NULL | Date and time when payment was made or due. |
| **status** | enum | NOT NULL | Current status of the record. |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the record was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the record was last updated. |

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

---

## Table: Installment_Plan

Manages multi-installment payment plans and financing schedules, tracking total installments, amounts, and plan completion status.

| Field | Data Type | Constraints / Keys | Notes |
| :--- | :--- | :--- | :--- |
| **installment_plan_id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique identifier for the installment plan. |
| **dashboard_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `Dashboard` table. |
| **register_by_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `User` table (who created the plan). |
| **total_amount** | decimal(10,2) | NOT NULL | Total monetary amount of the plan (10 digits, 2 decimals). |
| **total_installments** | int | NOT NULL | Number of installments in the plan. |
| **due_date** | datetime | NOT NULL | Final due date for the entire plan. |
| **status** | enum | NOT NULL | Current status of the plan (default: 'pending'). |
| **deleted_at** | datetime | NULL | Timestamp for soft deletion (if applicable). |
| **created_at** | datetime | NOT NULL | Timestamp when the plan was created. |
| **updated_at** | datetime | NOT NULL | Timestamp when the plan was last updated. |

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
