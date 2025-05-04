/**
 * Transaction type definitions for the budget app
 */

export interface Transaction {
  id: string;
  file_id: string;
  transaction_date: string;  // ISO date string
  description: string;
  amount: number;
  category_id: string | null;
  sub_header_id: string | null;
  account_type: 'bank' | 'credit_card';
  owner: string | null;
  original_category?: string | null;
  ai_confidence?: number | null;
  last_modified_by?: string | null;
  categorized_by?: 'AI' | 'user' | null;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionStats {
  total: number;
  count: number;
  avgPerTransaction: number;
}

export interface TransactionSummary {
  byCategory: Record<string, TransactionStats>;
  bySubHeader: Record<string, TransactionStats>;
  overall: TransactionStats;
}

/**
 * Helper function to calculate the date range for a specific month and year
 * @param month Month index (0-11)
 * @param year Year
 * @returns Object with startDate and endDate as ISO date strings
 */
export function getMonthDateRange(month: number, year: number) {
  // Calculate the first day of the month
  const startDate = new Date(Date.UTC(year, month, 1));
  
  // Calculate the last day of the month
  const endDate = new Date(Date.UTC(year, month + 1, 0));
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}
