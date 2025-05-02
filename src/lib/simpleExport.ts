import * as XLSX from 'xlsx';
import { supabase } from './lib/supabase';

/**
 * Simple function to export transactions to Excel
 */
export async function exportTransactionsToExcel(year: number, month: string): Promise<Blob> {
  try {
    // Format the date range for the selected month
    const dateObj = new Date(`${month} 1, ${year}`);
    const monthIndex = dateObj.getMonth();
    
    // Format start and end dates (YYYY-MM-DD)
    const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const endDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    // Fetch transactions for the selected month
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        transaction_date,
        description,
        amount,
        category_id,
        sub_header_id,
        budget_categories(name),
        budget_sub_headers(name),
        owner,
        account_type
      `)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
    
    // Transform data for Excel
    const excelData = data.map(t => ({
      Transaction_Date: formatDate(t.transaction_date),
      Description: t.description,
      Amount: t.amount,
      Category: t.budget_categories?.name || '',
      SubCategory: t.budget_sub_headers?.name || '',
      Category_ID: t.category_id || '',
      SubCategory_ID: t.sub_header_id || '',
      Owner: t.owner || '',
      Account_Type: t.account_type || ''
    }));
    
    // Create workbook and add data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 12 },  // Transaction_Date
      { wch: 50 },  // Description
      { wch: 10 },  // Amount
      { wch: 20 },  // Category
      { wch: 20 },  // SubCategory
      { wch: 36 },  // Category_ID
      { wch: 36 },  // SubCategory_ID
      { wch: 10 },  // Owner
      { wch: 15 }   // Account_Type
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    // Write to buffer and convert to blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
    return blob;
  } catch (error) {
    console.error('Error exporting transactions:', error);
    throw error;
  }
}

/**
 * Format date to a standard format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}