# Documentation

Everything about **Fortis Libertas** that is not code. Start with the part that matches what you need.

| I want to... | Read |
| :--- | :--- |
| Run the project locally | [documentation/setup.md](documentation/setup.md) |
| Call the API (web frontend, Android app, Bruno) | [documentation/api.md](documentation/api.md) |
| Understand how the code is organised | [documentation/architecture.md](documentation/architecture.md) |
| Know **why** something was built the way it was | [documentation/decisions.md](documentation/decisions.md) |
| See every endpoint, field and rule | [planning/api/endpoints.md](planning/api/endpoints.md) |
| See the tables and columns | [planning/db/data-dictionary.md](planning/db/data-dictionary.md) and [planning/db/model-er.md](planning/db/model-er.md) |
| See known limitations and open items | [planning/api/README.md](planning/api/README.md) |
| See what comes next | [roadmap/README.md](roadmap/README.md) |

## Folders

```
docs/
├── documentation/   How the project IS: setup, API guide, architecture, decisions
├── planning/        How the project was DESIGNED: database, API spec, UI, UX
└── roadmap/         What is planned next
```

`planning/` is the source of truth for the API contract: when the code and `endpoints.md` disagree, one of them is a bug.
