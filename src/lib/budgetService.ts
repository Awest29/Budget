// src/lib/budgetService.ts
import { supabase } from './lib/supabase';
import type { BudgetCategory, BudgetItemType } from '../types/budget';

// Debug tool to directly add a budget value for testing
export async function addTestBudgetValue() {
  try {
    // Find the Salary sub-header
    const { data: salarySubHeaders } = await supabase
      .from('budget_sub_headers')
      .select('*')
      .ilike('name', '%salary%')
      .limit(1);
      
    if (!salarySubHeaders || salarySubHeaders.length === 0) {
      console.error('Could not find salary sub-header');
      return false;
    }
    
    const salarySubHeader = salarySubHeaders[0];
    console.log(`Found salary sub-header: ${salarySubHeader.id} - ${salarySubHeader.name}`);
    
    // Add a direct budget value to the database tables
    const amount = 61000; // A positive value for income
    
    // 1. Add to budget_amounts table
    await supabase
      .from('budget_amounts')
      .upsert({
        sub_header_id: salarySubHeader.id,
        month: 'january',
        amount
      });
    
    // 2. Add to monthlyamounts in the sub_header
    const monthlyamounts = salarySubHeader.monthlyamounts || {};
    monthlyamounts['january'] = amount;
    
    await supabase
      .from('budget_sub_headers')
      .update({ monthlyamounts })
      .eq('id', salarySubHeader.id);
    
    console.log('Test budget value added successfully');
    return true;
  } catch (error) {
    console.error('Error adding test budget value:', error);
    return false;
  }
}

// Helper function to create a sample budget value for testing
export async function createSampleBudgetForJanuary(): Promise<boolean> {
  try {
    console.log('Creating sample budget for January...');
    
    // First get a sub-header to use
    const { data: subHeaders, error: shError } = await supabase
      .from('budget_sub_headers')
      .select('id, name, category_id, category:budget_categories(type)');
    
    if (shError) throw shError;
    if (!subHeaders || subHeaders.length === 0) {
      console.error('No sub-headers found');
      return false;
    }
    
    // Find a salary sub-header if possible
    const salarySubHeader = subHeaders.find(sh => 
      sh.name.toLowerCase().includes('salary') || 
      sh.name.toLowerCase().includes('lön')
    );
    
    const subHeader = salarySubHeader || subHeaders[0];
    console.log(`Using sub-header: ${subHeader.name} (${subHeader.id})`);
    
    // Create a budget value for January
    const budgetValue = subHeader.category?.type === 'income' ? 61000 : 19000;
    
    // Update using our regular function
    const result = await updateBudgetAmount(subHeader.id, 'January', budgetValue);
    
    console.log(`Sample budget created: ${result.success}`);
    return result.success;
  } catch (error) {
    console.error('Error creating sample budget:', error);
    return false;
  }
}

// Add interfaces for better type checking
interface BudgetAmount {
  sub_header_id: string;
  month: string;
  amount: number | null;
  sub_header?: {
    id: string;
    category?: {
      type: BudgetItemType;
    };
  };
}

interface ProcessedAmounts {
  [subHeaderId: string]: {
    [month: string]: number | null;
  };
}

export async function getBudgetData(): Promise<BudgetCategory[]> {
  // Get categories
  const { data: categories, error: categoriesError } = await supabase
    .from('budget_categories')
    .select('*');
  
  if (categoriesError) throw categoriesError;

  // Get sub-headers
  const { data: subHeaders, error: subHeadersError } = await supabase
    .from('budget_sub_headers')
    .select('*');
  
  if (subHeadersError) throw subHeadersError;

  // Get budget amounts - THIS IS THE SINGLE SOURCE OF TRUTH
  const { data: budgetAmounts, error: budgetError } = await supabase
    .from('budget_amounts')
    .select(`
      *,
      sub_header:budget_sub_headers (
        id,
        category:budget_categories (
          type
        )
      )
    `);

  if (budgetError) throw budgetError;
  
  // Also check if there are any budget values in monthlyamounts field
  const { data: subHeadersWithBudget, error: subHeadersWithBudgetError } = await supabase
    .from('budget_sub_headers')
    .select('id, name, monthlyamounts');
    
  if (subHeadersWithBudgetError) throw subHeadersWithBudgetError;

  // Process the budget amounts from the budget_amounts table
  const processedAmounts = (budgetAmounts || []).reduce<ProcessedAmounts>((acc, row: BudgetAmount) => {
    const categoryType = row.sub_header?.category?.type;
    
    // IMPORTANT: This is a critical fix - we need to handle the sign of budget values correctly
    // For income categories, we want positive budget values
    // For expense categories (fixed, variable, extraordinary), we want negative budget values
    const amount = row.amount;
    
    if (!acc[row.sub_header_id]) {
      acc[row.sub_header_id] = {};
    }
    
    // Ensure month is consistently lowercase
    const monthKey = row.month.toLowerCase();
    acc[row.sub_header_id][monthKey] = amount;
    return acc;
  }, {});
  
  // Also process monthlyamounts from sub_headers
  const processedMonthlyAmounts = (subHeadersWithBudget || []).reduce<ProcessedAmounts>((acc, subHeader) => {
    if (subHeader.monthlyamounts && Object.keys(subHeader.monthlyamounts).length > 0) {
      acc[subHeader.id] = {};
      
      // Convert all keys to lowercase for consistency and keep original value signs
      Object.entries(subHeader.monthlyamounts).forEach(([month, amount]) => {
        const monthKey = month.toLowerCase();
        // We don't adjust the sign here - use the value as-is
        acc[subHeader.id][monthKey] = amount;
      });
    }
    return acc;
  }, {});
  
  // Merge the two sources with budget_amounts taking precedence
  const mergedBudgetAmounts: ProcessedAmounts = {};
  
  // First add all monthly amounts
  Object.entries(processedMonthlyAmounts).forEach(([subHeaderId, months]) => {
    mergedBudgetAmounts[subHeaderId] = { ...months };
  });
  
  // Then override with budget_amounts values
  Object.entries(processedAmounts).forEach(([subHeaderId, months]) => {
    if (!mergedBudgetAmounts[subHeaderId]) {
      mergedBudgetAmounts[subHeaderId] = {};
    }
    
    Object.entries(months).forEach(([month, amount]) => {
      mergedBudgetAmounts[subHeaderId][month] = amount;
    });
  });

  // Combine everything into categories with their subheaders and budget amounts
  const enrichedCategories = categories.map(category => {
    const categorySubHeaders = subHeaders
      .filter(sh => sh.category_id === category.id)
      .map(sh => ({
        ...sh,
        budgetValues: mergedBudgetAmounts[sh.id] || {}
      }));
    
    return {
      ...category,
      subHeaders: categorySubHeaders
    };
  });

  return enrichedCategories;
}

// Update an existing budget value
export async function updateBudgetAmount(
    subHeaderId: string, 
    month: string, 
    amount: number | null
  ): Promise<{ success: boolean }> {
    // Get the sub-header to apply proper sign convention
    const { data: subHeader } = await supabase
      .from('budget_sub_headers')
      .select(`
        id,
        monthlyamounts,
        category:budget_categories (
          type
        )
      `)
      .eq('id', subHeaderId)
      .single();
  
    const categoryType = subHeader?.category?.type;
    
    // Apply sign convention - IMPORTANT: This is where budget values get their sign
    const signedAmount = categoryType !== 'income' ? 
      (amount !== null ? -Math.abs(amount) : null) : 
      (amount !== null ? Math.abs(amount) : null); // Force positive for income
  
    // Update the budget_amounts table - IMPORTANT: Always normalize month to lowercase
    const normalizedMonth = month.toLowerCase();
    const { error: amountError } = await supabase
      .from('budget_amounts')
      .upsert({
        sub_header_id: subHeaderId,
        month: normalizedMonth, // Always use lowercase for consistency
        amount: signedAmount
      }, {
        onConflict: 'sub_header_id,month'
      });
  
    if (amountError) throw amountError;
  
    // IMPORTANT: Also update the monthlyamounts field to maintain backward compatibility
    const monthlyamounts = subHeader?.monthlyamounts || {};
    const monthKey = month.toLowerCase(); // Also normalize for monthlyamounts
    monthlyamounts[monthKey] = signedAmount;

    const { error: subHeaderError } = await supabase
      .from('budget_sub_headers')
      .update({ monthlyamounts })
      .eq('id', subHeaderId);
  
    if (subHeaderError) throw subHeaderError;
    
    return { success: true };
  }