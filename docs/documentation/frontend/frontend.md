# Frontend Documentation

This document provides a technical overview of the frontend architecture, technologies, and patterns used in **Fortis Libertas**.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [API Integration](./api-integration.md)
4. [State Management](./state-management.md)
5. [Component Guidelines](./component-guidelines.md)
6. [Core Concepts](#core-concepts)
7. [Development Patterns](#development-patterns)

## Technology Stack

The frontend is built on a modern, type-safe stack designed for performance and developer experience.

- **Framework**: [Next.js: 16.+](https://nextjs.org/) (using App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4.+](https://tailwindcss.com/)
- **Component Library**: [Radix UI](https://www.radix-ui.com/) primitives styled with Tailwind (following the [shadcn/ui](https://ui.shadcn.com/) pattern)
- **Icons**: [Lucide React](https://lucide.dev/) and [Material Symbols](https://fonts.google.com/icons)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod: 4.6.+](https://zod.dev/)
- **Authentication**: [Better Auth: 1.7.+](https://www.better-auth.com/) (Client-side hooks and components)
- **State Management**: React Context for global UI state; URL-based state for filters and navigation.
- **Data Fetching**: Next.js Server Components for initial load; Client-side fetching via standard `fetch` or specialized hooks for mutations.

## Project Structure

The frontend code is primarily located in the `src/` directory, following Next.js conventions:

```text
src/
├── app/                # Next.js App Router (Pages, Layouts, APIs)
│   ├── (auth)/         # Authentication routes (sign-in, sign-up, etc.)
│   ├── dashboard/      # Main application dashboard
│   ├── documents/      # Document management views
│   ├── admin/          # Administration panels
│   └── globals.css     # Global Tailwind styles
├── components/         # Reusable React components
│   ├── ui/             # Low-level UI primitives (Button, Input, Card, etc.)
│   ├── forms/          # Form-specific components and wrappers
│   ├── layout/         # Shared layout components (Navbar, Sidebar)
│   └── ...             # Feature-specific components
├── lib/                # Shared utilities and core logic
│   ├── api/            # API client and request helpers
│   ├── auth/           # Better Auth configuration and hooks
│   └── utils.ts        # Common helper functions (cn, formatting)
├── hooks/              # Custom React hooks
└── utils/              # Validation schemas and helper functions
```

## Core Concepts

### 1. App Router & Server Components
We leverage Next.js Server Components (RSC) by default to reduce the JavaScript bundle sent to the client. Interactive elements are isolated into Client Components (marked with `"use client"`).

### 2. Design System & Theming
Styling is managed through Tailwind CSS. The design system uses CSS variables for colors (defined in `globals.css`) to support seamless Light and Dark mode switching via `next-themes`.

### 3. Forms and Validation
All forms use `react-hook-form` integrated with `zod` for schema-based validation. Schemas are shared between frontend and backend where possible (located in `src/utils/validation`).

### 4. Authentication Flow
Authentication is handled by **Better Auth**. 
- Protected routes are managed via `proxy.ts`.
- The client-side uses the `useSession` hook to access the current user's state.

### 5. Responsive Design
The application follows a mobile-first approach. Tailwind's responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`) are used to ensure the dashboard and financial tables are usable on all screen sizes.

## Development Patterns

- **Component Colocation**: Keep components close to where they are used. If a component is used in multiple pages, move it to `src/components`.
- **Type Safety**: Avoid using `any`. Define interfaces/types for all component props and API responses.
- **Accessibility**: Use Radix UI primitives to ensure ARIA compliance. Always provide labels for icons and form inputs.
