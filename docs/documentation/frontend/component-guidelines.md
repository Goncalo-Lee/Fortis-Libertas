# Component Guidelines

The UI of **Fortis Libertas** is built with a focus on consistency, accessibility, and reusability. We follow the "Shadcn/UI" philosophy: high-quality primitives that we own and can customize.

## UI Primitives (`src/components/ui/`)

These are the building blocks of the application. They are mostly based on **Radix UI** primitives, styled with **Tailwind CSS**.

- **Consistency**: Always use these primitives (e.g., `Button`, `Input`, `Card`) instead of raw HTML elements to maintain visual consistency.
- **Customization**: If a primitive needs a new variant, add it using `class-variance-authority` (cva) within the component file.

## Design Patterns

### 1. Data Tables
The `data-table.tsx` component is a powerful, reusable wrapper around TanStack Table.
- **Location**: `src/components/data-table.tsx`
- **Features**: Supports sorting, filtering, selection, and pagination.
- **Usage**: Use it for all list-level data displays (e.g., transaction history, user management).

### 2. Forms
Forms are built using the `src/components/ui/form.tsx` wrapper, which integrates `react-hook-form` with our UI components.
- Always use the `<FormField>` pattern for automatic error message handling and accessibility.
- Keep form components focused: a form should handle data entry, while its container handles the submission logic (or Server Action).

### 3. Layouts
Common layout elements are located in `src/components/layout/` and `src/components/nav/`.
- **Sidebar**: Mobile-responsive sidebars (`user-sidebar.tsx`, `admin-sidebar.tsx`).
- **SiteHeader**: Shared top navigation.

### 4. Icons
- We primarily use **Lucide React** for UI icons.
- **Material Symbols** are used for specific financial or specialized metaphors where Lucide is insufficient.

## Styling with Tailwind 4.0

- **Utility First**: Avoid writing custom CSS in `globals.css` unless defining new theme variables.
- **Responsive Design**: Use mobile-first modifiers (`md:`, `lg:`, etc.).
- **Dark Mode**: Use the `dark:` modifier or rely on CSS variables defined in `globals.css` (e.g., `bg-background`, `text-foreground`).

## Accessibility (A11y)

- **Semantic HTML**: Use `<main>`, `<nav>`, `<section>`, etc.
- **ARIA**: Radix UI handles most ARIA attributes automatically. Ensure `aria-label` is provided for icon-only buttons.
- **Focus States**: Never remove default focus rings unless replacing them with a custom, high-contrast alternative.

## Code Style

- **Folder Structure**: Feature-specific components should live in a folder named after the feature (e.g., `src/components/Charts/`).
- **Naming**: Use `PascalCase` for component files and functions.
- **Props**: Always define a `Props` interface or type for your components. Use `React.ComponentProps` when extending base HTML elements.
