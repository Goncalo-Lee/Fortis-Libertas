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

Edit `.env` and fill in the values. <!-- TODO: list the variables (DATABASE_URL, ...) -->

## 4. Start the database

```bash
docker compose up -d
```

<!-- TODO: service name, port and credentials from docker-compose.yml -->

## 6. Start the development server

```bash
bun run dev
```

The app runs at <http://localhost:3000>.

## Useful commands

| Command                   | What it does        |
| ------------------------- | ------------------- |
| `bun run dev`             | Development server  |
| `bun run build`           | Production build    |
| `bun run lint`            | ESLint              |
| `bunx drizzle-kit studio` | Browse the database |

<!-- TODO: check these against the "scripts" in package.json -->

## Troubleshooting

- **`bun` is not recognized (Windows):** close and reopen the terminal. If it
  still fails, add `%USERPROFILE%\.bun\bin` to your PATH.
- **Database connection refused:** check that the container is running
  (`docker compose ps`) and that the values in `.env` match `docker-compose.yml`.
