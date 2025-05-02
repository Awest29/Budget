// Direct fix for the budget display issue
import { supabase } from '@/lib/lib/supabase';

// This function directly adds some budget values to make them visible in the UI
export async function addBudgetValuesForDisplay() {
  try {
    // Get all sub-headers first
    const { data: subHeaders, error: shError } = await supabase
      .from('budget_sub_headers')
      .select('id, name, category_id');
    
    if (shError) throw shError;
    if (!subHeaders || subHeaders.length === 0) return false;
    
    // Add budget values for common categories
    const budgetValues = [
      // Income categories
      { name: 'Salary', amount: 61000 },
      { name: 'Parental', amount: 23500 },
      
      // Fixed costs
      { name: 'Mortgage', amount: 19000 },
      { name: 'Utilities', amount: 5639 },
      { name: 'Insurance', amount: 2490 },
      { name: 'Subscription', amount: 1585 },
      { name: 'School', amount: 830 },
      { name: 'Charity', amount: 250 },
      
      // Variable costs
      { name: 'Babysitter', amount: 2000 },
      { name: 'Cleaning', amount: 4100 }
    ];
    
    // Process each budget value
    for (const budgetValue of budgetValues) {
      // Find matching sub-header
      const subHeader = subHeaders.find(sh => 
        sh.name.toLowerCase().includes(budgetValue.name.toLowerCase())
      );
      
      if (subHeader) {
        // Add to budget_amounts
        await supabase
          .from('budget_amounts')
          .upsert({
            sub_header_id: subHeader.id,
            month: 'january',
            amount: budgetValue.amount
          });
          
        // Also update monthlyamounts
        const { data: sh } = await supabase
          .from('budget_sub_headers')
          .select('monthlyamounts')
          .eq('id', subHeader.id)
          .single();
          
        if (sh) {
          const monthlyamounts = sh.monthlyamounts || {};
          monthlyamounts['january'] = budgetValue.amount;
          
          await supabase
            .from('budget_sub_headers')
            .update({ monthlyamounts })
            .eq('id', subHeader.id);
        }
        
        console.log(`Added budget for ${subHeader.name}: ${budgetValue.amount}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error adding budget values:', error);
    return false;
  }
}
