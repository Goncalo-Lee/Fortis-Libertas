# Sitemap

Hierarchical structure of the **Fortis Libertas** web application.

## Public Pages
- **Home (`/`)**: Landing page, product overview.
- **Authentication**:
  - Sign In (`/sign-in`)
  - Sign Up (`/sign-up`)
  - Forgot Password (`/forgot-password`)
  - Reset Password (`/reset-password`)
  - Confirm Email (`/confirm-email`)
  - Two-Factor Auth (`/two-factor`)

## Authenticated Pages (Protected by `proxy.ts`)

- **User Dashboard (`/dashboard`)**:
  - Personal Finance Overview
  - Financial Records (List/Search)
  - Categories & Tags Management
  - Installment Plans

- **Documents (`/documents`)**:
  - Document storage and management.

- **Account Settings (`/session` & `/profile`)**:
  - Profile management (name, image, preferences).
  - Security settings (password change, 2FA).
  - Active sessions management.

- **Admin (`/admin`)**:
  - System-wide settings and monitoring (Internal only).

## API Routes (`/api/v1`)
- Scoped by resource: `/api/v1/dashboards`, `/api/v1/bank-accounts`, etc.
- Auth endpoints: `/api/auth/*`.
