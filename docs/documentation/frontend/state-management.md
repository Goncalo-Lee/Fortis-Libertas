# State Management

**Fortis Libertas** uses a multi-layered approach to state management, choosing the most appropriate tool for each use case to balance performance and complexity.

## 1. Server-Side State (Primary)

Whenever possible, we treat the server (and the database) as the single source of truth.
- **Data Fetching**: Next.js Server Components fetch data directly from the database or API.
- **Revalidation**: We use `revalidatePath` and `revalidateTag` in Server Actions to trigger updates to the cached data.

## 2. URL-based State (Navigation & Filters)

For many "global" states like search queries, active tabs, and filters, we use the URL.
- **Benefits**: Deep linking, shareable state, and browser history support.
- **Implementation**: We use `useSearchParams`, `usePathname`, and `useRouter` from `next/navigation`.

## 3. UI State (React Context)

For state that needs to be accessed by many components but doesn't belong in the URL (e.g., sidebar collapse state, theme, current user session), we use React Context.

- **Theme**: Managed by `next-themes` (see `src/components/theme-provider.tsx`).
- **Auth Session**: Managed by Better Auth's `useSession` hook/provider.
- **Custom Contexts**: Located in `src/hooks/` or `src/lib/context/` for specific features.

## 4. Local Component State (React Hooks)

Standard React hooks (`useState`, `useReducer`, `useMemo`) are used for transient state that only affects a single component or its immediate children.
- **Examples**: Form input values, modal open/close states, hover states.

## 5. Form State

Managed exclusively by **React Hook Form**.
- Integration with Zod for validation.
- Centralized error handling.
- Performance optimized to prevent unnecessary re-renders of the entire page during typing.

## Guidelines

- **Prefer Server State**: If it comes from the DB, keep it on the server.
- **Prefer URL State**: If a user would expect to stay on the same "view" after a page refresh, put it in the URL.
- **Avoid Over-fetching**: Only lift state up when absolutely necessary.
- **Keep it Simple**: Don't reach for a global state management library (like Redux or Zustand) unless the complexity of React Context becomes unmanageable.