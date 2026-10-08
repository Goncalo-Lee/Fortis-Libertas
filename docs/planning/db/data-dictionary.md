# Data Dictionary

## Table: User

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, UNIQUE |  Unique user identifier. |
| **user_name** | varchar(254) | UNIQUE | Username – must be unique. |
| **full_name** | varchar(254) | NOT NULL | User’s full name. |
| **email** | varchar(254) | UNIQUE | Email address – must be unique. |
| **email_verified_at** | datetime | NULL | Date and time of the email verification. |
| **image** | text | NULL | Path or URL of the profile picture. |
| **two_factor_enabled** | bool | NOT NULL | Indicates whether two-factor authentication is enabled. |
| **deleted_at** | datetime | NULL | Date and time of the ‘soft delete’ (if applicable). |
| **created_at** | datetime | NOT NULL | Date and time the record was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update to the record. |

### Default:

* `two_factor_enabled`: `false`;

---

## Table: Session

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique session identifier. |
| **user_id** | binary(16) | FK KEY, NOT NULL | Foreign key referencing the `id` in the `User` table. |
| **token** | varchar(255) | UNIQUE, NOT NULL | Session authentication token. |
| **ip_address** | text | NOT NULL | The client’s IP address during the session. |
| **user_agent** | text | NOT NULL | User-Agent information from the browser/device. |
| **expires_at** | datetime | NOT NULL | Session expiry date and time. |
| **created_at** | datetime | NOT NULL | Date and time the session was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update to the session. |

---

## Table: Card

| Field | Data Type | Restrictions / Keys | Comments |
| --- | --- | --- | --- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique identifier for the card. |
| **bank_id** | binary(16) | FK KEY, NOT NULL | Foreign key linking to the bank. |
| **user_id** | binary(16) | FK KEY, NOT NULL | Foreign key linking to the user. |
| **cardholder_name** | varchar(50) | NOT NULL | Name of the cardholder. |
| **type_card** | enum | NOT NULL | Type of card, with the values 'credit' or 'debit'. |
| **card_number** | char(16) | NULL | Card number. |
| **expiry_date** | date | NULL | Expiry date of the card. |
| **cvv** | char(3) | NULL | 3-digit security code. |
| **frozen_at** | datetime | NULL | Date and time when the card was frozen/blocked. |
| **deleted_at** | datetime | NULL | Date and time of logical deletion (soft delete). |
| **created_at** | datetime | NOT NULL | Date and time the record was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update. |

---

### Table: Bank_Account

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique identifier for the bank account. |
| **name** | varchar(50) | NOT NULL | Name or label of the bank account. |
| **initial_balance** | decimal(10,2) | NOT NULL | The starting balance of the account. |
| **frozen_at** | datetime | NULL | Timestamp recording when the account was temporarily frozen. |
| **deleted_at** | datetime | NULL | Timestamp used for soft-deleting the record. |
| **created_at** | datetime | NOT NULL | Date and time the record was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update to the record. |

---

### Table: Tag__Category

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **tag_id** | binary(16) | PK KEY, NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific tag. |
| **category_id** | binary(16) | PK KEY, NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific category. |
| **created_at** | datetime | NOT NULL | Date and time the record was created. |

---

### Table: Notifications

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique identifier for the notification. |
| **user_id** | binary(16) | FK KEY, NOT NULL | Relates the notification to the receiving user. |
| **type** | varchar(255) | NOT NULL | The category or type of the notification. |
| **data** | json | NOT NULL | The payload or main content of the notification. |
| **created_at** | datetime | NOT NULL | Date and time the notification was generated. |
| **read_at** | datetime | NULL | Timestamp indicating when the notification was read. |

---

### Table: Verification

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique identifier for the verification attempt. |
| **identifier** | varchar(191) | NOT NULL | The target being verified (e.g., an email address or phone number). |
| **value** | text | NOT NULL | The actual verification code or token. |
| **expires_at** | datetime | NOT NULL | Timestamp indicating when the verification code is no longer valid. |
| **created_at** | datetime | NOT NULL | Date and time the record was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update to the record. |

---

### Table: Two_Factor

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique identifier for the 2FA configuration. |
| **user_id** | binary(16) | FK KEY, NOT NULL | Relates the two-factor settings to a specific user. |
| **secret** | text | NOT NULL | The cryptographic secret used to generate authenticator codes. |
| **backup_codes** | text | NOT NULL | Stored emergency recovery codes. |
| **verified** | bool | NOT NULL, Default: false | Indicates whether the user has successfully completed the initial 2FA setup. |
| **failed_verification_count** | int | NOT NULL | A counter tracking consecutive incorrect code attempts. |
| **locked_until** | datetime | NULL | Timestamp indicating a temporary lockout period after too many failed attempts. |
| **created_at** | datetime | NOT NULL | Date and time the record was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update to the record. |

---

### Table: Payment_Method

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | char(26) | PK KEY, NOT NULL | Unique identifier for the payment method. |
| **card_id** | binary(16) | FK KEY, NULL | A foreign key that references a specific card; it may be empty. |
| **dashboard_id** | binary(16) | FK KEY, NOT NULL, UNIQUE | Foreign key for the dashboard (has a unique constraint in conjunction with the `name` field). |
| **name** | varchar(50) | NOT NULL, UNIQUE | Payment method name (unique for the same `dashboard_id`). |
| **description** | text | NOT NULL | Payment method name (unique for the same `dashboard_id`). |
| **deleted_at** | datetime | NULL | Date and time for the logical deletion (‘soft delete’) of the record. |
| **created_at** | datetime | NOT NULL | Data e hora em que o registo foi criado. |
| **updated_at** | datetime | NOT NULL | Data e hora da última atualização do registo. |

---

### Table: Bank_Account__User

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **bank_id** | binary(16) | PK KEY, NOT NULL | Part of the composite primary key, which links to the bank account. |
| **user_id** | binary(16) | PK KEY, NOT NULL | Part of the composite primary key, which links to the user. |
| **role** | enum | NOT NULL | Sets the user’s role/access level. Accepted values: `“owner”`, `“editor”`, `“viewer”`. |
| **created_at** | datetime | NOT NULL | The date and time when the list was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update to this list. |

---

### Table: Tag__Financial_Record

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **tag_id** | binary(16) | PK KEY, NOT NULL, ON DELETE CASCADE | Composite primary key, linked to the tag. It will be deleted in a cascade if the reference is deleted. |
| **record_id** | binary(16) | PK KEY, NOT NULL, ON DELETE CASCADE | Composite primary key, linked to the financial record. It will be deleted in a cascading manner if the reference is deleted. |
| **created_at** | datetime | NOT NULL | The date and time the association was established. |

---

### Table: Record_Type

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique identifier for the record type. |
| **dashboard_id** | binary(16) | FK KEY, NOT NULL, UNIQUE | Foreign key for the associated dashboard (with a one-to-one relationship with the `name` field). |
| **name** | varchar(50) | NOT NULL, UNIQUE | Name of the record type. |
| **description** | text | NULL | Date and time of the ‘soft delete’ (if applicable). |
| **deleted_at** | datetime | NULL | Data e hora do 'soft delete' (se aplicável). |
| **created_at** | datetime | NOT NULL | The date and time the record was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last change to the record. |

### Seeder:

* `name`: `Expenses`, `Income`, `Investment`;

---

### Table: Account

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique account identifier. |
| **user_id** | binary(16) | FK KEY, NOT NULL | Foreign key that links this account to its primary user. |
| **account_id** | text | NOT NULL | Account identifier with an external supplier or service  |
| **provider_id** | text | NOT NULL | Service provider identifier (e.g. Google, GitHub, etc.). |
| **access_token** | text | NOT NULL | Access token for the provider’s API. |
| **refresh_token** | text | NULL | A token used to renew expired access. |
| **scope** | text | NULL | Scope of permissions authorised by the external provider. |
| **id_token** | text | NULL | Identity token provided by the external service. |
| **password** | text | NULL | Account password; this may be left blank depending on the authentication method. |
| **access_token_expires_at**| datetime | NULL | Expiry date and time of the access token. |
| **refresh_token_expires_at**| datetime | NULL | Expiry date and time of the renewal token. |
| **created_at** | datetime | NOT NULL | The date and time the account was registered. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update to the account details. |

---
