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
