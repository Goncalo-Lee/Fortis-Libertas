# Setup

How to run Fortis Libertas locally.

## Prerequisites

| Tool                                | Notes                                                      |
| ----------------------------------- | ---------------------------------------------------------- |
| [Bun](https://bun.sh)               | Package manager and script runner                          |
| [Node.js](https://nodejs.org) (LTS) | Next.js still runs on Node unless started with `bun --bun` |
| [Docker](https://www.docker.com/)   | Runs the local MySQL database                              |
| [Git](https://git-scm.com/)         |                                                            |

### Install Bun:

```bash
# Linux / macOS
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

Restart the terminal afterwards and check with `bun --version`.

If you see some error when you try run the `bun --version` in powershell, I recommend to run the following code, this code will reset the powershell.

```bash
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

## 1. Clone the repository

```bash
git clone https://github.com/Goncalo-Lee/Fortis-Libertas.git
cd Fortis-Libertas
```

## 2. Install dependencies

```bash
bun install
```

> This project uses **Bun**. Do not run `npm install`, it would create a
> `package-lock.json` that conflicts with `bun.lock`.

## 3. Configure environment variables

```bash
cp .env-example .env        # Windows (PowerShell): Copy-Item .env-example .env
```

Edit `.env` and fill in the values.

Set the following passwords in the .env file:
- MYSQL_ROOT_PASSWORD
- MYSQL_DATABASE
- PORT_DATABASE
- DB_MY_ADMIN_PHP_PORT
- DATABASE_URL
- BETTER_AUTH_SECRET
- BETTER_AUTH_URL
- ALLOWED_DEV_ORIGINS (optional)
- MAIL_* (SMTP server used for verification and password reset emails)
- EXCHANGE_RATE_API_URL and EXCHANGE_RATE_TIMEOUT_MS (the defaults in `.env-example` work)

## 4. Start the database

```bash
docker compose up -d
```

## 5. Create the tables and load the catalogs

```bash
bun run db:push            # creates/updates the tables from src/db/schema
bun run db:seed:catalogs   # colors, icons, currencies and languages
```

The catalogs are required: creating a dashboard picks its default colors and icons from them.

If the database already had financial records or installment plans from before the history existed, fill it once:

```bash
bun run db:backfill:transactions
```

## 6. Start the development server

```bash
bun run dev
```

The app runs at <http://localhost:3000>.

## Useful commands

| Command                   | What it does                                 |
| ------------------------- | -------------------------------------------- |
| `bun run dev`             | Development server                           |
| `bun run build`           | Production build                             |
| `bun run lint`            | ESLint                                       |
| `bunx drizzle-kit studio` | Browse the database                          |
| `bun run db:push`         | push schema changes directly to the database |
| `bun run db:migrate`      | run pending migrations                       |
| `bun run db:generate`     | generate new migrations                      |
| `bun run start`           | run production build                         |
| `bun run db:seed:catalogs` | load colors, icons, currencies and languages |
| `bun run db:backfill:transactions` | create missing history entries (one-off) |
| `bun run api:test`        | run the Bruno API tests (dev server running) |

## Troubleshooting

- **`bun` is not recognized (Windows):** close and reopen the terminal. If it
  still fails, add `%USERPROFILE%\.bun\bin` to your PATH.
- **Database connection refused:** check that the container is running
  (`docker compose ps`) and that the values in `.env` match `docker-compose.yml`.
- **`502 EXCHANGE_RATE_UNAVAILABLE`:** Frankfurter did not answer and the rate was not cached yet. Open
  `https://api.frankfurter.dev/v1/latest` in the browser; if it fails too, the provider is down, try again later.
