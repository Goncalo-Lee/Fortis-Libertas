# UI Planning

This directory documentation the User Interface design and component architecture of **Fortis Libertas**.

## Contents

- **[Design System](./design-system.md)**: Specifications for colors, typography, spacing, and core visual elements.
- **Component Library**: Overview of the reusable components built with Tailwind CSS and inspired by shadcn/ui.

## UI Stack

- **Framework**: Next.js 16.+ (App Router)
- **Styling**: Tailwind CSS 4.+
- **Icons**: Lucide React & Material Symbols
- **Components**: Radix UI primitives (via shadcn/ui patterns)
- **Forms**: React Hook Form with Zod validation
- **Theming**: Next Themes (Light/Dark mode support)

## Design Principles

1. **Clarity**: Financial data should be easy to read and understand.
2. **Consistency**: Use the design system tokens for all components.
3. **Accessibility**: Follow WCAG guidelines, ensuring proper contrast and keyboard navigation.
4. **Responsiveness**: Mobile-first approach, ensuring the dashboard works across all device sizes.
