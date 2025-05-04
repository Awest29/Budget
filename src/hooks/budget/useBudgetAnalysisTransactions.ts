import { useState, useEffect } from 'react';
import { supabase } from '@/lib/lib/supabase';
import type { Transaction } from '@/types/transactions';

/**
 * Hook to fetch transaction data for the Budget Analysis section
 * Returns all transactions for the specified year to ensure data from January up to the selected month
 */
export function useBudgetAnalysisTransactions(year: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        
        // Get all transactions for the year
        // This ensures we have data from January up to any selected month
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate);
        
        if (error) throw error;
        
        console.log(`Loaded ${data?.length || 0} transactions for budget analysis`);
        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching budget analysis transactions:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactions();
  }, [year]);
  
  return { transactions, loading, error };
}
