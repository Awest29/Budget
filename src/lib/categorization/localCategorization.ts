import { findMatchingPattern, LOCAL_TRANSACTION_PATTERNS } from './transactionPatterns';
import { supabase } from '../lib/supabase';

/**
 * Result of a categorization attempt
 */
export interface CategorizationResult {
  categoryId: string | null;
  subHeaderId: string | null;
  confidence: number;
  method: 'local_pattern' | 'api' | 'uncategorized';
}

/**
 * Attempt to categorize a transaction using local patterns
 */
export async function categorizeTranactionLocally(
  description: string,
  amount: number
): Promise<CategorizationResult> {
  try {
    // Log pattern count to ensure we have patterns loaded
    console.log(`[LOCAL CATEGORIZATION] Patterns loaded: ${LOCAL_TRANSACTION_PATTERNS.length}`);
    console.log(`[LOCAL CATEGORIZATION] Checking description: "${description}"`);
    
    // Try to find a matching pattern
    const match = findMatchingPattern(description);
    
    if (match) {
      console.log(`✅ Local match found for "${description}": ${match.pattern}`);
      
      return {
        categoryId: match.categoryId,
        subHeaderId: match.subHeaderId,
        confidence: 0.9, // High confidence for local matches
        method: 'local_pattern'
      };
    }
    
    // No local match found
    return {
      categoryId: null,
      subHeaderId: null,
      confidence: 0,
      method: 'uncategorized'
    };
  } catch (error) {
    console.error('Error in local categorization:', error);
    return {
      categoryId: null,
      subHeaderId: null,
      confidence: 0,
      method: 'uncategorized'
    };
  }
}

/**
 * Apply local categorization to a batch of transactions
 * and update them in the database
 */
export async function applyLocalCategorizationToBatch(
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    category_id: string | null;
    sub_header_id: string | null;
  }>
): Promise<{ categorized: number, skipped: number }> {
  const result = { categorized: 0, skipped: 0 };
  
  // Filter to only transactions without categories
  const uncategorizedTransactions = transactions.filter(
    t => !t.category_id || !t.sub_header_id
  );
  
  // Skip if all transactions are already categorized
  if (uncategorizedTransactions.length === 0) {
    return { categorized: 0, skipped: transactions.length };
  }
  
  // Process each transaction
  for (const transaction of uncategorizedTransactions) {
    // Try local categorization
    const categorization = await categorizeTranactionLocally(
      transaction.description,
      transaction.amount
    );
    
    // Skip if no match found
    if (categorization.method === 'uncategorized') {
      result.skipped++;
      continue;
    }
    
    // Update the transaction with the local match
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          category_id: categorization.categoryId,
          sub_header_id: categorization.subHeaderId,
          categorized_by: 'AI', // Using AI label even though it's local
          ai_confidence: categorization.confidence,
          last_modified_by: 'local_pattern'
        })
        .eq('id', transaction.id);
      
      if (error) {
        console.error('Error updating transaction:', error);
        result.skipped++;
      } else {
        result.categorized++;
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      result.skipped++;
    }
  }
  
  return result;
}