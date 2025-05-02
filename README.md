# FinancePro - Personal Finance Management Application

FinancePro is a comprehensive personal finance management application designed to help users track their budget, manage transactions, and analyze spending patterns. Built with modern web technologies, it provides an intuitive interface for financial planning and analysis.

## Features

### User Authentication
- Secure login system powered by Supabase
- User-specific data isolation
- Password reset functionality

### Budget Management
- Create and manage budget categories (income, fixed expenses, variable expenses)
- Set monthly budget amounts for each category and subcategory
- Visualize budget allocation with interactive charts
- Consolidated budget view for yearly planning

### Transaction Management
- Import transactions from bank and credit card statements (XLSX, CSV)
- Automatic transaction categorization
- Manual transaction categorization and editing
- Transaction filtering and searching

### Budget Analysis
- Compare actual spending to budgeted amounts
- Visualize budget vs. actual with charts and tables
- Identify overspending categories
- Track spending trends over time

### Person-Specific Analysis
- Assign transactions to specific individuals
- Track individual spending patterns
- Compare spending between individuals

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom theming
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Hooks for local state
- **Authentication & Database**: Supabase
- **Data Visualization**: Recharts
- **File Processing**: XLSX for spreadsheet manipulation

## Project Structure

```
budget-app/
├── public/                # Static assets
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── budget/        # Budget-related components
│   │   │   ├── comparison/  # Budget comparison components
│   │   │   └── ...
│   │   ├── layout/        # Layout components
│   │   ├── transactions/  # Transaction-related components
│   │   └── ui/            # UI components (buttons, inputs, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and services
│   │   └── lib/           # Core library functions
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   ├── index.css          # Global CSS and Tailwind imports
│   ├── design-system.css  # Design system variables and base styling
│   ├── theme.css          # Theme-specific styling (UI component overrides)
│   └── light-theme-fixed.css # Light theme implementation
├── .env                   # Environment variables (add to .gitignore)
├── .gitignore             # Git ignore file
├── index.html             # HTML entry point
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
├── postcss.config.cjs     # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── vite.config.ts         # Vite configuration
```

## Architecture Overview

FinancePro follows a modern component-based architecture:

### Core Components

- **App.tsx**: Central application component that handles:
  - Authentication state via Supabase
  - Main navigation routing between views
  - Global layout structure

- **ModernAuth.tsx**: Authentication component for user login
  - Handles Supabase authentication
  - Provides form validation and error handling
  - Styled with the application design system

- **Layout Components**:
  - **ModernSidebar.tsx**: Navigation sidebar with view selection and logout functionality
  - **layout.css**: Layout-specific styling for the application structure

### Feature Modules

- **Budget Module** (`/components/budget/`):
  - **ModernBudgetDashboard.tsx**: Main budget view
  - **ModernBudgetSummary.tsx**: Summary of budget categories and amounts
  - **ModernPersonBudgetAnalysis.tsx**: Person-specific budget analysis
  - **ModernBudgetComparisonPage.tsx**: Comparison between budget and actual spending

- **Transactions Module** (`/components/transactions/`):
  - **ModernTransactionsPage.tsx**: Transaction list and management
  - **ModernFileUpload.tsx**: File upload component for importing transactions
  - **ModernTransactionList.tsx**: Displays and filters transactions
  - **ModernAccountManagement.tsx**: Account management functionality
  - **ModernFileList.tsx**: Lists uploaded transaction files

### UI Components

The application uses a combination of custom UI components and Radix UI primitives:

- **UI Components** (`/components/ui/`):
  - Form controls (buttons, inputs, selects)
  - Layout components (cards, containers)
  - Feedback components (toasts, alerts)
  - Data display components (tables, charts)

### Styling System

The application uses a layered styling approach:

1. **Base Layer** (`index.css`): 
   - Tailwind CSS utilities
   - Basic global styles

2. **Design System** (`design-system.css`):
   - CSS variables for colors, spacing, typography
   - Base component styling

3. **Theme Layer** (`light-theme-fixed.css`):
   - Theme-specific overrides
   - Component-specific styling for light mode

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for database and authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/budget-app.git
   cd budget-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser to see the application.

## Database Setup

FinancePro requires the following tables in your Supabase database:

- `budget_categories`: Stores budget categories (income, fixed expenses, etc.)
- `budget_sub_headers`: Stores subcategories within each budget category
- `budget_amounts`: Stores monthly budget amounts for each subcategory
- `transaction_files`: Tracks uploaded transaction files
- `transactions`: Stores individual transactions imported from files

## Development Workflow

### Running in Development Mode

```bash
npm run dev
```

This starts the Vite development server with hot module replacement (HMR) for instant feedback during development.

### Building for Production

```bash
npm run build
```

This creates a production-ready build in the `dist/` directory.

### Code Linting

```bash
npm run lint
```

Runs ESLint to check for code quality issues.

### Previewing Production Build

```bash
npm run preview
```

Serves the production build locally for testing.

## UI Design System

The application uses a consistent design system defined in `design-system.css`:

- **Colors**: A palette of primary, secondary, and semantic colors
- **Typography**: Font families, sizes, and line heights
- **Spacing**: Consistent spacing scale
- **Shadows**: Elevation levels for components
- **Borders**: Border radii and colors
- **Transitions**: Animation timing and easing functions

## Authentication Flow

1. **Initial Load**: App checks for existing session with Supabase
2. **No Session**: Redirects to ModernAuth component
3. **Login**: User enters credentials, ModernAuth handles authentication with Supabase
4. **Success**: Session established, user redirected to main application
5. **Session Management**: App subscribes to auth state changes
6. **Logout**: User can log out via the Sidebar component

## Data Flow

1. **Budget Data**:
   - Retrieved from Supabase on application load
   - Displayed in budget components
   - Updates stored immediately when changes are made

2. **Transaction Data**:
   - Imported from CSV/XLSX files
   - Processed and categorized
   - Stored in Supabase
   - Retrieved and displayed in transaction components

3. **Analysis Data**:
   - Combines budget and transaction data
   - Processed for comparison and visualization
   - Displayed in analysis components

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Recharts](https://recharts.org/)
- [XLSX](https://sheetjs.com/)