# FinancePro - Personal Finance Management Application

FinancePro is a comprehensive personal finance management application designed to help users track their budget, manage transactions, and analyze spending patterns. Built with modern web technologies, it provides an intuitive interface for financial planning and analysis.

![FinancePro](https://via.placeholder.com/800x400?text=FinancePro+Screenshot)

## Features

### User Authentication
- Secure login system powered by Supabase
- User-specific data isolation
- Password reset functionality

### Budget Management
- Create and manage budget categories (income, fixed expenses, variable expenses, extraordinary expenses)
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

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: React Hooks
- **Authentication & Database**: Supabase
- **Data Visualization**: Recharts
- **File Processing**: XLSX

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

A SQL script for setting up these tables is available in the `database` directory.

## Usage Guide

### Setting Up Your Budget

1. Log in to the application
2. Navigate to the "Budget 2025" section
3. Create categories and subcategories for your budget
4. Set monthly budget amounts for each subcategory

### Importing Transactions

1. Navigate to the "Import 2025" section
2. Upload your bank or credit card statement (XLSX or CSV format)
3. Review imported transactions
4. Categorize transactions manually or use the automatic categorization

### Analyzing Your Budget

1. Navigate to the "Actuals vs Budget 2025" section to compare your actual spending with your budget
2. Use the "Spender 2025" section to analyze individual spending patterns

## Development

### Project Structure

```
budget-app/
├── public/              # Static assets
├── src/                 # Source code
│   ├── components/      # React components
│   │   ├── budget/      # Budget-related components
│   │   ├── layout/      # Layout components
│   │   ├── transactions/# Transaction-related components
│   │   └── ui/          # UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and services
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── .gitignore           # Git ignore file
├── index.html           # HTML entry point
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
# or
yarn preview
```

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
# Budget
