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

---

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

### Bank_Account

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

### Tag__Category

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **tag_id** | binary(16) | PK KEY, NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific tag. |
| **category_id** | binary(16) | PK KEY, NOT NULL, ON DELETE CASCADE | Part of the composite primary key linking to a specific category. |
| **created_at** | datetime | NOT NULL | Date and time the record was created. |

---

### Notifications

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique identifier for the notification. |
| **user_id** | binary(16) | FK KEY, NOT NULL | Relates the notification to the receiving user. |
| **type** | varchar(255) | NOT NULL | The category or type of the notification. |
| **data** | json | NOT NULL | The payload or main content of the notification. |
| **created_at** | datetime | NOT NULL | Date and time the notification was generated. |
| **read_at** | datetime | NULL | Timestamp indicating when the notification was read. |

---

### Verification

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Unique identifier for the verification attempt. |
| **identifier** | varchar(191) | NOT NULL | The target being verified (e.g., an email address or phone number). |
| **value** | text | NOT NULL | The actual verification code or token. |
| **expires_at** | datetime | NOT NULL | Timestamp indicating when the verification code is no longer valid. |
| **created_at** | datetime | NOT NULL | Date and time the record was created. |
| **updated_at** | datetime | NOT NULL | Date and time of the last update to the record. |

---

### Two_Factor

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

### Payment_Method

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | char(26) | PK KEY, NOT NULL | Identificador único do método de pagamento. |
| **card_id** | binary(16) | FK KEY, NULL | Chave estrangeira que relaciona com um cartão específico, podendo estar vazio. |
| **dashboard_id** | binary(16) | FK KEY, NOT NULL, UNIQUE | Chave estrangeira para o dashboard (possui uma restrição de unicidade em conjunto com o campo `name`). |
| **name** | varchar(50) | NOT NULL, UNIQUE | Nome do método de pagamento (único para o mesmo `dashboard_id`). |
| **description** | text | NOT NULL | Descrição detalhada do método de pagamento. |
| **deleted_at** | datetime | NULL | Data e hora para a eliminação lógica ("soft delete") do registo. |
| **created_at** | datetime | NOT NULL | Data e hora em que o registo foi criado. |
| **updated_at** | datetime | NOT NULL | Data e hora da última atualização do registo. |

---

### Bank_Account__User

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **bank_id** | binary(16) | PK KEY, NOT NULL | Parte da chave primária composta, que faz a ligação à conta bancária. |
| **user_id** | binary(16) | PK KEY, NOT NULL | Parte da chave primária composta, que faz a ligação ao utilizador. |
| **role** | enum | NOT NULL | Define o papel/nível de acesso do utilizador. Valores aceites: `'owner'`, `'editor'`, `'viewer'`. |
| **created_at** | datetime | NOT NULL | Data e hora em que a relação foi criada. |
| **updated_at** | datetime | NOT NULL | Data e hora da última atualização desta relação. |

---

### Tag__Financial_Record

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **tag_id** | binary(16) | PK KEY, NOT NULL, ON DELETE CASCADE | Chave primária composta, liga à etiqueta (tag). Será eliminada em cascata se a referência for apagada. |
| **record_id** | binary(16) | PK KEY, NOT NULL, ON DELETE CASCADE | Chave primária composta, liga ao registo financeiro. Será eliminada em cascata se a referência for apagada. |
| **created_at** | datetime | NOT NULL | Data e hora em que a associação foi criada. |

---

### Record_Type

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Identificador único do tipo de registo. |
| **dashboard_id** | binary(16) | FK KEY, NOT NULL, UNIQUE | Chave estrangeira para o dashboard associado (com restrição única com o campo `name`). |
| **name** | varchar(50) | NOT NULL, UNIQUE | Nome do tipo de registo. Valores iniciais (Seeders): `Expenses`, `Income`, `Investment`. |
| **description** | text | NULL | Descrição opcional para o tipo de registo. |
| **deleted_at** | datetime | NULL | Data e hora do 'soft delete' (se aplicável). |
| **created_at** | datetime | NOT NULL | Data e hora em que o registo foi criado. |
| **updated_at** | datetime | NOT NULL | Data e hora da última alteração do registo. |

---

### Account

| Field | Data Type | Restrictions / Keys | Comments |
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Identificador único da conta. |
| **user_id** | binary(16) | FK KEY, NOT NULL | Chave estrangeira que relaciona esta conta com o seu utilizador principal. |
| **account_id** | text | NOT NULL | Identificador da conta num fornecedor/serviço externo. |
| **provider_id** | text | NOT NULL | Identificador do provedor do serviço (ex: Google, GitHub, etc.). |
| **access_token** | text | NOT NULL | Token de acesso para a API do provedor. |
| **refresh_token** | text | NULL | Token utilizado para renovar o acesso expirado. |
| **scope** | text | NULL | Âmbito de permissões autorizadas no provedor externo. |
| **id_token** | text | NULL | Token de identidade fornecido pelo serviço externo. |
| **password** | text | NULL | Palavra-passe da conta, podendo estar vazia consoante o método de autenticação. |
| **access_token_expires_at**| datetime | NULL | Data e hora de expiração do token de acesso. |
| **refresh_token_expires_at**| datetime | NULL | Data e hora de expiração do token de renovação. |
| **created_at** | datetime | NOT NULL | Data e hora em que a conta foi registada. |
| **updated_at** | datetime | NOT NULL | Data e hora da última atualização aos dados da conta. |
