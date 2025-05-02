import { createClient } from '@supabase/supabase-js'
import type { BudgetItemType } from '../../types/budget'

const supabaseUrl = 'https://tcpybuomcnbztrvkoraw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcHlidW9tY25ienRydmtvcmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MzIyNzksImV4cCI6MjA1MzMwODI3OX0.YUfgfAJQR1K-dF0h1lt6PvJyp7VkR_BbKJ_AS2ei-XU'

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function updateBudgetAmount(
    subHeaderId: string,
    month: string,
    amount: number | null
  ) {
    try {
      const { error } = await supabase
        .from('budget_amounts')
        .upsert({
          sub_header_id: subHeaderId,
          month: month,
          amount: amount
        }, {
          onConflict: 'sub_header_id,month'
        });
  
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating budget amount:', error);
      throw error;
    }
  }

  export async function deleteTransactionFile(fileId: string) {
    try {
      // First delete all transactions associated with this file
      await supabase
        .from('transactions')
        .delete()
        .eq('file_id', fileId);
  
      // Then delete the file record itself
      const { error } = await supabase
        .from('transaction_files')
        .delete()
        .eq('id', fileId);
  
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting transaction file:', error);
      throw error;
    }
  }

export async function fetchBudgetAmounts() {
  try {
    // First, fetch budget amounts
    const { data: amountsData, error: amountsError } = await supabase
      .from('budget_amounts')
      .select(`
        *,
        sub_header:budget_sub_headers (
          id,
          category:budget_categories (
            type
          )
        )
      `)

    if (amountsError) throw amountsError

    // Convert cost category amounts to negative
    const processedData = amountsData.map(row => ({
      ...row,
      amount: row.amount !== null && 
              row.sub_header?.category?.type !== 'income' ? 
              -Math.abs(row.amount) : row.amount
    }))

    return processedData
  } catch (error) {
    console.error('Error fetching budget amounts:', error)
    throw error
  }
}