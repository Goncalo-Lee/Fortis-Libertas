# API Integration

This document explains how the frontend of **Fortis Libertas** communicates with the backend services.

## Architecture Overview

The application follows a hybrid model using Next.js App Router:

1.  **Server-Side Data Fetching**: Used for initial page loads and SEO-sensitive data via Server Components.
2.  **Client-Side Data Fetching**: Used for interactive features, real-time updates, and user-specific data after the initial load.
3.  **Server Actions**: Used for form submissions and data mutations.

## Backend Connection

### Base URL and Client
The frontend communicates primarily with the internal API routes located in `src/app/api/v1`. 
- **Client-side**: Uses standard `fetch` or `authClient` for authenticated requests.
- **Server-side**: Directly calls internal logic or services when possible, or uses `fetch` to internal API routes with appropriate headers.

### API Client Utilities
Located in `src/lib/api/`, these utilities provide:
- **Request Context**: Management of headers and request metadata.
- **Error Handling**: Standardized parsing of API errors (`src/lib/api/errors.ts`).
- **Response Schemas**: Zod-validated response types to ensure type safety between the frontend and backend.

## Authentication and Security

Authentication is managed by **Better Auth**.

### Authenticated Requests
When making requests to protected routes:
- **Client-side**: The browser automatically includes session cookies. The `authClient` helper (from `src/lib/auth-client.ts`) should be used for auth-related operations (sign in, sign up, 2FA).
- **Server-side**: Use `auth.handler` or `auth.getSession` to verify the user's session within Server Components or API routes.

### CSRF Protection
Next.js and Better Auth provide built-in protection against CSRF. Ensure that all mutations are performed via `POST`, `PUT`, `PATCH`, or `DELETE` methods.

## Data Validation

We use **Zod** for end-to-end type safety:
1.  **Shared Schemas**: Validation schemas are often shared between the frontend (for form validation) and the backend (for request body validation), located in `src/utils/validation/`.
2.  **API Responses**: Responses from the backend are validated using schemas in `src/lib/api/schemas/` to ensure the frontend always receives the expected data structure.

## Typical Flow

1.  **User Action**: User submits a form (e.g., `sign-in-form.tsx`).
2.  **Frontend Validation**: `react-hook-form` validates the input using a Zod schema.
3.  **Request**: If valid, the component calls a Server Action or an API endpoint.
4.  **Backend Processing**: The API route validates the session and the request body.
5.  **Response**: The backend returns a standardized JSON response.
6.  **UI Update**: The frontend handles the success/error response and updates the UI accordingly (e.g., redirecting to dashboard or showing a toast).
