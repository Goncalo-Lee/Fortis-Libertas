# Data Dictionary

## Table: User

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY (Primary Key), UNIQUE |  Unique user identifier. |
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
## Table: Session

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY (Primary Key), NOT NULL | Unique session identifier. |
| **user_id** | binary(16) | FK KEY (Foreign Key), NOT NULL | Foreign key referencing the `id` in the `User` table. |
| **token** | varchar(255) | UNIQUE, NOT NULL | Session authentication token. |
| **ip_address** | text | NOT NULL | The client’s IP address during the session. |
| **user_agent** | text | NOT NULL | User-Agent information from the browser/device. |
| **expires_at** | datetime | NOT NULL | Session expiry date and time. |
| **created_at** | datetime | NOT NULL | Date and time the session was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update to the session. |

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

### Detailed Explanation of Each Field

The restrictions are based on the visual formatting presented in the image of the `Card` table:

* **id**
* **Data Type:** `binary(16)`.
* **Restrictions:** It is the Primary Key (blue text) and NOT NULL (solid pink square).
* **What it does:** It is the main and exclusive identifier for the card in the database.


* **bank_id**
* **Data Type:** `binary(16)`.
* **Restrictions:** It is a Foreign Key (green text) and NOT NULL (solid pink square).
* **What it does:** Relates the card to a specific bank in another table.


* **user_id**
* **Data Type:** `binary(16)`.
* **Restrictions:** It is a Foreign Key (green text) and NOT NULL (solid pink square).
* **What it does:** Relates the card to the user it belongs to.


* **cardholder_name**
* **Data Type:** `varchar(50)`.
* **Restrictions:** NOT NULL (solid pink square).
* **What it does:** Stores the name printed on the card. Being mandatory, it cannot be empty.


* **type_card**
* **Data Type:** `enum`.
* **Restrictions:** NOT NULL (solid pink square).
* **What it does:** Defines whether the card is credit or debit. The "Enum" section in the image specifies the accepted values: `('credit', 'debit')`.


* **card_number**
* **Data Type:** `char(16)`.
* **Restrictions:** NULL (dark square with diagonal lines).
* **What it does:** Stores the 16 digits of the card. The NULL state indicates that it can be temporarily empty (for example, if the card was requested but the number hasn't been generated/assigned yet).


* **expiry_date**
* **Data Type:** `date`.
* **Restrictions:** NULL (dark square with diagonal lines).
* **What it does:** Stores the date when the card expires.


* **cvv**
* **Data Type:** `char(3)`.
* **Restrictions:** NULL (dark square with diagonal lines).
* **What it does:** The 3-digit security code.


* **frozen_at**
* **Data Type:** `datetime`.
* **Restrictions:** NULL (dark square with diagonal lines).
* **What it does:** Records the exact date and time when a card was temporarily frozen by the user or system. If empty (NULL), the card is not frozen.


* **deleted_at**
* **Data Type:** `datetime`.
* **Restrictions:** NULL (dark square with diagonal lines).
* **What it does:** Used for "Soft Deletes" (logical deletion). Marked in red, it is grouped with the other time control fields.


* **created_at**
* **Data Type:** `datetime`.
* **Restrictions:** NOT NULL (solid pink square).
* **What it does:** Records the exact moment the card was added to the database.


* **updated_at**
* **Data Type:** `datetime`.
* **Restrictions:** NOT NULL (solid pink square).
* **What it does:** Updates automatically to reflect the last change made to this card's data.
