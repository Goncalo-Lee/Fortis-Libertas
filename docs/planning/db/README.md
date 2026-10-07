# Database Planning

This directory contains the database design, architecture planning, and documentation for **Fortis Libertas**. It serves as the single source of truth for planning schema changes, visualizing entity relationships, and detailing data dictionaries prior to and alongside implementation in [`src/db/`](../../../src/db).

---

## Directory Overview

```text
docs/planning/db/
|-- README.md               # Directory overview, guide, and workflow conventions (this file)
|-- data-dictionary.md      # Field-level dictionary (types, constraints, nullability, descriptions)
|-- model-er.md             # Entity-Relationship (ER) model and schema architecture
\-- excalidraw-db/          # Visual ER diagrams versioned across design iterations
    |-- Fortis Libertas - DataBase-SQL.V.00.01.00.excalidraw
    |-- ...
    \-- Fortis Libertas - DataBase-SQL.V.00.08.00.excalidraw
```

---

## Contents & Documents

| Document / Folder | Purpose |
| ----------------- | ------- |
| **[`data-dictionary.md`](./data-dictionary.md)** | Comprehensive data dictionary specifying table names, columns, data types, keys, default values, nullability, and field purposes. |
| **[`model-er.md`](./model-er.md)** | Conceptual and logical Entity-Relationship (ER) models explaining entities, relationships (1:1, 1:N, N:M), foreign keys, and constraints. |
| **[`excalidraw-db/`](./excalidraw-db/)** | Visual whiteboard diagrams built with [Excalidraw](https://excalidraw.com/). Tracks the iterative evolution of the database schema across versions (`V.00.01.00` to current). |

---

## Technology Stack & Implementation Mapping

The planned database structure directly maps to the runtime stack located in [`src/db/`](../../../src/db):

- **Database Engine:** MySQL 8.x (orchestrated via [Docker Compose](../../../docker-compose.yml))
- **ORM & Migrations:** [Drizzle ORM](https://orm.drizzle.team) with `mysql2` and `drizzle-kit`
- **Authentication Schemas:** [Better Auth](https://www.better-auth.com/) (`user`, `session`, `account`, `verification`, `twoFactor`)
- **Code Structure:**
  - Schemas & Relations: [`src/db/schema/`](../../../src/db/schema)
  - Migrations: [`src/db/migrations/`](../../../src/db/migrations)
  - Seed Scripts: [`src/db/seed/`](../../../src/db/seed)
  - Queries & Helpers: [`src/db/queries/`](../../../src/db/queries)

---

## Workflow & Guidelines

When modifying or introducing database entities:

1. **Plan & Iterate Visually:**
   - Open or duplicate the latest diagram in [`excalidraw-db/`](./excalidraw-db/).
   - Increment the diagram version (e.g. `V.00.08.00` &rarr; `V.00.08.0x or V.00.09.00`) when making structural updates.
2. **Update Planning Documentation:**
   - Document new entities and relationships in [`model-er.md`](./model-er.md).
   - Add column specifications and constraints to [`data-dictionary.md`](./data-dictionary.md).
3. **Implement in Drizzle:**
   - Define schema changes in [`src/db/schema/`](../../../src/db/schema).
   - Generate and apply migrations using the repository scripts.

---

## Database Management Commands

The following commands (run with [Bun](https://bun.sh)) are used for database operations:

| Command | Description |
| ------- | ----------- |
| `docker compose up -d` | Start the local MySQL database and phpMyAdmin containers |
| `bun run db:push` | Push schema changes directly to the database (prototyping) |
| `bun run db:generate` | Generate SQL migration files based on schema changes |
| `bun run db:migrate` | Execute pending migrations against the database |
| `bun run db:studio` | Launch Drizzle Studio to inspect and manage data via the browser |
| `bun run db:seed` | Seed the database with initial/mock development data |
