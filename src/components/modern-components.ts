// src/components/modern-components.ts
// This file exports all modernized components for easier imports

// Budget Components
export { ModernBudgetDashboard } from './budget/ModernBudgetDashboard.tsx';
export { ModernBudgetComparisonPage } from './budget/comparison/ModernBudgetComparisonPage.tsx';
export { ModernPersonBudgetAnalysis } from './budget/ModernPersonBudgetAnalysis.tsx';
export { ModernBudgetSummary } from './budget/ModernBudgetSummary.tsx';

// Transaction Components
export { ModernTransactionsPage } from './transactions/ModernTransactionsPage.tsx';
export { ModernFileUpload } from './transactions/ModernFileUpload.tsx';
export { ModernTransactionList } from './transactions/ModernTransactionList.tsx';
export { ModernAccountManagement } from './transactions/ModernAccountManagement.tsx';
export { ModernFileList } from './transactions/ModernFileList.tsx';

// Layout Components
export { default as ModernAppLayout } from './layout/ModernAppLayout.tsx';
export { Sidebar as ModernSidebar } from './layout/ModernSidebar.tsx';

// UI Components
export { default as ModernCollapsible } from './ui/ModernCollapsible.tsx';

// Auth Component
export { default as ModernAuth } from './ModernAuth.tsx';