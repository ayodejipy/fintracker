# Personal Finance Dashboard

A comprehensive personal finance management application built with Nuxt.js 3, TypeScript, and Tailwind CSS v4.

## Features

-   Dashboard with financial overview
-   Transaction management with Nigerian expense categories
-   Budget tracking and monitoring
-   Financial goal setting and progress tracking
-   Multi-account support
-   Nigerian Naira (NGN) currency support with proper formatting
-   Real-time data visualization with charts
-   Responsive design optimized for mobile and desktop

## Tech Stack

-   **Framework**: Nuxt.js 3 with TypeScript
-   **Styling**: Tailwind CSS v4 (via Vite plugin)
-   **State Management**: Pinia
-   **UI Components**: Nuxt UI (Reka UI + Tailwind CSS)
-   **Charts**: Chart.js with Vue-ChartJS
-   **Form Validation**: VeeValidate with Zod schemas
-   **Database**: Prisma ORM (ready for setup)
-   **Testing**: Vitest (unit), Playwright (E2E)
-   **Development**: ESLint, TypeScript strict mode

## Project Structure

```
personal-finance-dashboard/
├── app/                     # Application source code
│   ├── assets/
│   │   └── css/            # Tailwind CSS and global styles
│   ├── composables/        # Reusable composition functions
│   │   └── useApi.ts       # API interaction composable
│   ├── stores/             # Pinia stores for state management
│   │   └── auth.ts         # Authentication store
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Core types and interfaces
│   ├── utils/              # Utility functions
│   │   ├── date.ts         # Date and currency formatting
│   │   └── categories.ts   # Nigerian expense categories
│   ├── features/           # Feature-based organization
│   │   ├── auth/           # Authentication features
│   │   ├── dashboard/      # Dashboard components
│   │   ├── transactions/   # Transaction management
│   │   ├── budgets/        # Budget tracking
│   │   ├── goals/          # Financial goals
│   │   └── loans/          # Loan management
│   ├── components/         # Reusable Vue components
│   │   ├── ui/             # Base UI components
│   │   ├── charts/         # Chart components
│   │   └── layout/         # Layout components
│   └── middleware/         # Route middleware
├── components/             # Global components (auto-imported)
├── layouts/                # Nuxt.js layouts
├── pages/                  # Nuxt.js pages (auto-routing)
├── server/
│   └── api/               # Nitro API routes
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── tests/                 # Test files and setup
└── tailwind.config.ts     # Tailwind CSS v4 configuration
```

## Nigerian Finance Features

This application is specifically designed for Nigerian users with:

-   **Nigerian Naira (₦) Support**: Proper currency formatting and display
-   **Local Expense Categories**: Pre-configured categories relevant to Nigerian spending patterns:
    -   Loan Repayment
    -   Home Allowance
    -   Rent
    -   Transport
    -   Food & Groceries
    -   Data & Airtime
    -   Miscellaneous
    -   Savings
-   **Cultural Context**: UI and UX designed with Nigerian financial habits in mind

## Getting Started

### Prerequisites

-   Node.js 18+
-   npm (comes with Node.js)

### Installation

1. **Clone and install dependencies:**

```bash
cd personal-finance-dashboard
npm install
```

2. **Set up the database (when ready):**

```bash
npm run db:generate
npm run db:push
```

3. **Start the development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

-   `npm run dev` - Start development server with hot reload
-   `npm run build` - Build for production
-   `npm run preview` - Preview production build locally
-   `npm run test` - Run unit tests with Vitest
-   `npm run test:watch` - Run tests in watch mode
-   `npm run test:coverage` - Run tests with coverage report
-   `npm run test:e2e` - Run end-to-end tests with Playwright
-   `npm run test:e2e:ui` - Run E2E tests with UI
-   `npm run lint` - Run ESLint
-   `npm run lint:fix` - Fix ESLint issues automatically
-   `npm run db:generate` - Generate Prisma client
-   `npm run db:push` - Push schema changes to database
-   `npm run db:migrate` - Run database migrations
-   `npm run db:studio` - Open Prisma Studio

## Development Guidelines

### Code Organization

-   **Feature-Based Structure**: Code is organized by feature in the `app/features/` directory
-   **Component Hierarchy**:
    -   `app/components/` - Feature-specific components
    -   `components/` - Global, auto-imported components
-   **Business Logic**: Composables in `app/composables/` for reusable logic
-   **State Management**: Pinia stores in `app/stores/` for global state
-   **Type Safety**: All TypeScript definitions in `app/types/`

### Naming Conventions

-   **Files & Directories**: kebab-case (`user-profile.vue`, `expense-categories.ts`)
-   **Vue Components**: PascalCase (`UserProfile.vue`, `ExpenseChart.vue`)
-   **Composables**: camelCase with `use` prefix (`useApi`, `useAuth`)
-   **Stores**: camelCase with descriptive names (`authStore`, `transactionStore`)
-   **Types & Interfaces**: PascalCase (`User`, `Transaction`, `ApiResponse`)

### Styling Guidelines

-   **Tailwind CSS v4**: Use utility-first approach with Tailwind classes
-   **Custom Components**: Define reusable styles in `app/assets/css/main.css`
-   **Design System**: Follow the color palette and spacing defined in `tailwind.config.ts`
-   **Responsive Design**: Mobile-first approach with responsive utilities
-   **Nigerian Context**: Use appropriate colors and cultural design elements

### TypeScript Best Practices

-   **Strict Mode**: Project uses TypeScript strict mode for better type safety
-   **Type Definitions**: All interfaces and types are centralized in `app/types/`
-   **API Types**: Strongly typed API responses and request payloads
-   **Component Props**: Use proper TypeScript interfaces for component props

## Architecture Decisions

### Tailwind CSS v4

-   Uses the new Vite plugin architecture for better performance
-   Simplified configuration with `@import "tailwindcss"`
-   Custom design tokens defined in TypeScript config

### Nuxt.js 3 Features

-   **Auto-imports**: Components, composables, and utilities are auto-imported
-   **File-based routing**: Pages are automatically generated from the `pages/` directory
-   **Server-side rendering**: Full SSR support for better SEO and performance
-   **API routes**: Built-in API layer with Nitro

### State Management Strategy

-   **Pinia**: Modern Vue state management with TypeScript support
-   **Composables**: Business logic encapsulated in reusable composables
-   **Local State**: Component-level state for UI-specific data

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow the coding guidelines** outlined above
4. **Write tests** for new functionality
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Quality

-   All code must pass ESLint checks
-   Unit tests required for new features
-   TypeScript strict mode compliance
-   Follow the established project structure

## License

This project is for personal use and learning purposes.
