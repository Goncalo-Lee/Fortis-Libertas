# Design System

The visual language of Fortis Libertas.

## Colors

### Core Palette
- **Primary**: The main brand color, used for primary actions and highlights.
- **Secondary**: Used for less prominent UI elements.
- **Accent**: Used for specialized highlights and call-to-outs.

### Semantic Colors
- **Success**: Green (e.g., Income)
- **Destructive**: Red (e.g., Expenses, Delete actions)
- **Warning**: Amber/Yellow (e.g., Pending, Late payments)
- **Info**: Blue (e.g., Investments, Neutral movements)

### Neutral Palette
- Used for backgrounds, borders, and text. Supports both light and dark modes via Tailwind's `dark:` modifier.

## Typography

- **Primary Font**: Inter (or system sans-serif stack).
- **Monospace**: For financial figures and IDs.

### Hierarchy
- **Heading 1**: Large, bold titles.
- **Heading 2**: Section headers.
- **Body**: Standard text for descriptions and data.
- **Small/Muted**: Secondary info, timestamps.

## Spacing & Layout

We follow a 4px (0.25rem) grid system.

- **Container**: Max-width for desktop views (usually `max-w-7xl`).
- **Gutter**: `px-4` on mobile, `px-6` on tablet/desktop.
- **Card Padding**: `p-4` or `p-6`.

## Components

Core components are located in `src/components/ui`. They are built using `class-variance-authority` (CVA) for styling variants.

- **Buttons**: Primary, Secondary, Outline, Ghost, Destructive.
- **Inputs**: Standard text inputs, Selects, Checkboxes, Switches.
- **Cards**: The primary container for dashboard widgets.
- **Modals/Dialogs**: For creating/editing records.
