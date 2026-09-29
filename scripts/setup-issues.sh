#!/usr/bin/env bash
set -euo pipefail

# 1. Create Milestones
gh api repos/:owner/:repo/milestones -f title="v0.1.0" -f description="Login and register working with the database" || true
gh api repos/:owner/:repo/milestones -f title="Backlog" -f description="Future roadmap ideas without a specific release target" || true

# 2. Create Common Labels
gh label create "database" --color "0E8A16" --description "Database schema, migrations, and ORM" --force
gh label create "infrastructure" --color "5319E7" --description "Docker, CI/CD, and dev tooling" --force
gh label create "auth" --color "D93F0B" --description "Authentication and authorization" --force
gh label create "security" --color "B60205" --description "Security safeguards and session control" --force
gh label create "routing" --color "FBCA04" --description "Page navigation and middleware guards" --force
gh label create "backend" --color "1D76DB" --description "Server-side logic and API" --force
gh label create "frontend" --color "C5DEF5" --description "UI and client-side code" --force
gh label create "enhancement" --color "A2EEEF" --description "New feature or request" --force

# 3. Create v0.1.0 Issues
gh issue create \
  --title "[Infrastructure] Set up local database environment with Docker Compose" \
  --body "Set up a containerized database instance for local development.

- [ ] Add docker-compose.yml for local database service
- [ ] Configure environment variables via .env.example
- [ ] Ensure volume persistence and healthcheck" \
  --milestone "v0.1.0" \
  --label "infrastructure,backend"

gh issue create \
  --title "[Database] Define users table schema and migrations with Drizzle ORM" \
  --body "Implement the user model schema and migration flow using Drizzle ORM.

- [ ] Define user schema (id, email, password_hash, created_at, updated_at)
- [ ] Add unique constraint on email
- [ ] Generate and apply initial migration" \
  --milestone "v0.1.0" \
  --label "database,backend"

gh issue create \
  --title "[Auth/Backend] Implement password hashing and session management" \
  --body "Build the underlying authentication logic for secure password verification and session state.

- [ ] Implement password hashing (Argon2id or bcrypt)
- [ ] Set up secure cookie/token session handling
- [ ] Add sign-in and sign-up action handlers" \
  --milestone "v0.1.0" \
  --label "auth,backend,security"

gh issue create \
  --title "[UI/Auth] Build Sign-Up page and registration form" \
  --body "Create the user registration interface and connect it to the registration handler.

- [ ] Email and password input form
- [ ] Client/server-side validation and error state UI
- [ ] Wire to register endpoint" \
  --milestone "v0.1.0" \
  --label "auth,frontend"

gh issue create \
  --title "[UI/Auth] Build Sign-In page and authentication form" \
  --body "Create the user login interface and connect it to authentication credentials verification.

- [ ] Sign-in form with email and password fields
- [ ] Invalid credential error states
- [ ] Wire to login action" \
  --milestone "v0.1.0" \
  --label "auth,frontend"

gh issue create \
  --title "[Navigation] Redirect authenticated users to dashboard after login" \
  --body "Ensure successful login automatically routes users to their dashboard.

- [ ] Route to /dashboard upon successful authentication
- [ ] Preserve attempted target redirect URL when redirected to login" \
  --milestone "v0.1.0" \
  --label "routing,frontend"

gh issue create \
  --title "[Security] Implement route protection for dashboard routes" \
  --body "Restrict access to authenticated users only for dashboard routes and pages.

- [ ] Add middleware/guard restricting unauthenticated access to /dashboard
- [ ] Redirect unauthorized requests to /sign-in
- [ ] Prevent authenticated users from visiting /sign-in or /sign-up" \
  --milestone "v0.1.0" \
  --label "routing,security"

# 4. Create Backlog Issues
gh issue create \
  --title "[Auth] Implement Google OAuth 2.0 login" \
  --body "Allow users to authenticate using their Google accounts.

- [ ] Configure OAuth client and callback routes
- [ ] Link existing user by verified email
- [ ] Add 'Continue with Google' UI button" \
  --milestone "Backlog" \
  --label "auth,enhancement"

gh issue create \
  --title "[Auth] Implement password recovery flow" \
  --body "Enable users to request a password reset via email.

- [ ] Reset password request form
- [ ] Secure token generation and email dispatch
- [ ] Token verification and new password submission page" \
  --milestone "Backlog" \
  --label "auth,security"

gh issue create \
  --title "[Security] Implement Two-Factor Authentication (2FA)" \
  --body "Add TOTP-based multi-factor authentication for enhanced account security.

- [ ] TOTP QR enrollment
- [ ] Second-factor challenge during sign-in
- [ ] Recovery code generation" \
  --milestone "Backlog" \
  --label "security,enhancement"

gh issue create \
  --title "[Feature] Build initial dashboard views and content" \
  --body "Design and implement core layout and widgets for the authenticated dashboard.

- [ ] Dashboard shell (header, sidebar, user settings dropdown)
- [ ] Initial overview widgets and metrics" \
  --milestone "Backlog" \
  --label "frontend,enhancement"

echo "All issues created successfully!"
