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
| :--- | :--- | :--- | :--- |
| **id** | binary(16) | PK KEY, NOT NULL | Identificador único do cartão. |
| **bank_id** | binary(16) | FK KEY, NOT NULL | Chave estrangeira que liga ao banco. |
| **user_id** | binary(16) | FK KEY, NOT NULL | Chave estrangeira que liga ao utilizador. |
| **cardholder_name** | varchar(50) | NOT NULL | Nome do titular do cartão. |
| **type_card** | enum | NOT NULL | Tipo de cartão, com os valores 'credit' ou 'debit'. |
| **card_number** | char(16) | NULL | Número do cartão. |
| **expiry_date** | date | NULL | Data de validade do cartão. |
| **cvv** | char(3) | NULL | Código de segurança de 3 dígitos. |
| **frozen_at** | datetime | NULL | Data e hora em que o cartão foi congelado/bloqueado. |
| **deleted_at** | datetime | NULL | Data e hora de eliminação lógica (soft delete). |
| **created_at** | datetime | NOT NULL | Data e hora de criação do registo. |
| **updated_at** | datetime | NOT NULL | Data e hora da última atualização. |

### Explicação Detalhada de Cada Campo (Field)

As restrições baseiam-se na formatação visual apresentada na imagem da tabela `Card`:

*   **id**
    *   **Data Type:** `binary(16)`.
    *   **Restrições:** É a Chave Primária (texto a azul) e NOT NULL (quadrado rosa sólido).
    *   **O que faz:** É o identificador principal e exclusivo do cartão na base de dados.
*   **bank_id**
    *   **Data Type:** `binary(16)`.
    *   **Restrições:** É uma Chave Estrangeira (texto a verde) e NOT NULL (quadrado rosa sólido).
    *   **O que faz:** Relaciona o cartão com um banco específico noutra tabela.
*   **user_id**
    *   **Data Type:** `binary(16)`.
    *   **Restrições:** É uma Chave Estrangeira (texto a verde) e NOT NULL (quadrado rosa sólido).
    *   **O que faz:** Relaciona o cartão com o utilizador a quem ele pertence.
*   **cardholder_name**
    *   **Data Type:** `varchar(50)`.
    *   **Restrições:** NOT NULL (quadrado rosa sólido).
    *   **O que faz:** Guarda o nome impresso no cartão. Sendo obrigatório, não pode ficar vazio.
*   **type_card**
    *   **Data Type:** `enum`.
    *   **Restrições:** NOT NULL (quadrado rosa sólido).
    *   **O que faz:** Define se o cartão é de crédito ou débito. A secção "Enum" na imagem especifica os valores aceites: `('credit', 'debit')`.
*   **card_number**
    *   **Data Type:** `char(16)`.
    *   **Restrições:** NULL (quadrado escuro com linhas diagonais).
    *   **O que faz:** Guarda os 16 dígitos do cartão. O estado NULL indica que pode estar temporariamente vazio (por exemplo, se o cartão foi solicitado mas o número ainda não foi gerado/atribuído).
*   **expiry_date**
    *   **Data Type:** `date`.
    *   **Restrições:** NULL (quadrado escuro com linhas diagonais).
    *   **O que faz:** Guarda a data em que o cartão expira.
*   **cvv**
    *   **Data Type:** `char(3)`.
    *   **Restrições:** NULL (quadrado escuro com linhas diagonais).
    *   **O que faz:** O código de segurança de 3 dígitos.
*   **frozen_at**
    *   **Data Type:** `datetime`.
    *   **Restrições:** NULL (quadrado escuro com linhas diagonais).
    *   **O que faz:** Regista a data e hora exatas em que um cartão foi temporariamente congelado pelo utilizador ou sistema. Se estiver vazio (NULL), o cartão não está congelado.
*   **deleted_at**
    *   **Data Type:** `datetime`.
    *   **Restrições:** NULL (quadrado escuro com linhas diagonais).
    *   **O que faz:** Usado para "Soft Deletes" (eliminação lógica). Assinalado a vermelho, agrupa-se com os outros campos de controlo de tempo.
*   **created_at**
    *   **Data Type:** `datetime`.
    *   **Restrições:** NOT NULL (quadrado rosa sólido).
    *   **O que faz:** Regista o momento em que o cartão foi adicionado à base de dados.
*   **updated_at**
    *   **Data Type:** `datetime`.
    *   **Restrições:** NOT NULL (quadrado rosa sólido).
    *   **O que faz:** Atualiza-se automaticamente para refletir a última alteração feita aos dados deste cartão.
>>>>>>> 2ed1724fe186152cb1781ea2fe91619450f9b793
