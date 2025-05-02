// src/types/budget.ts

export type BudgetItemType = 'income' | 'fixed' | 'variable' | 'extraordinary';

export type Month = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 
             'July' | 'August' | 'September' | 'October' | 'November' | 'December';

export const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

export const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const;

export const MONTH_OPTIONS = ["Full Year", ...FULL_MONTHS] as const;

export type MonthOption = (typeof MONTH_OPTIONS)[number];

// Utility functions for budget amount conversions
export const isCostType = (type: BudgetItemType): boolean => {
  return type === 'fixed' || type === 'variable' || type === 'extraordinary';
};

export const convertBudgetAmount = (amount: number | null, type: BudgetItemType): number => {
  if (amount === null) return 0;
  return isCostType(type) ? -Math.abs(amount) : Math.abs(amount);
};

export const convertMonthlyAmounts = (
  amounts: Record<string, number | null> | undefined,
  type: BudgetItemType
): Record<string, number> => {
  const result: Record<string, number> = {};
  
  if (!amounts) {
    return SHORT_MONTHS.reduce((acc, month) => {
      acc[month.toLowerCase()] = 0;
      return acc;
    }, {} as Record<string, number>);
  }

  for (const [month, amount] of Object.entries(amounts)) {
    result[month.toLowerCase()] = convertBudgetAmount(amount, type);
  }
  return result;
};

export interface BudgetEntry {
  id: string;
  name: string;
  monthlyamounts: Record<string, number | null>;
  transactionMatchers?: string[];
}

// Add this to your existing BudgetSubHeader interface
export interface BudgetSubHeader {
  id: string;
  name: string;
  category_id: string;
  monthlyamounts: Record<string, number | null>;
  budgetValues?: Record<string, number | null>; // New field for budget values
}

export interface BudgetCategory {
  id: string;
  type: BudgetItemType;
  name: string;
  monthlyamounts: Record<string, number | null>;
  subHeaders: BudgetSubHeader[];
  deletedSubHeaderIds?: string[];
}

export type DatabaseBudgetSubHeader = BudgetSubHeader;