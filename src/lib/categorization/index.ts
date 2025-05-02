import { categorizeTranactionLocally, CategorizationResult } from './localCategorization';
import { suggestTransactionCategory } from '../openai';
import { BudgetCategory } from '../../types/budget';

/**
 * Main categorization function that tries local matching first, then falls back to API
 */
export async function categorizeTransaction(
  description: string,
  amount: number,
  categories: BudgetCategory[],
  options: { forceApi?: boolean } = {}
): Promise<CategorizationResult> {
  try {
    console.log(`Starting categorization for "${description}", forceApi=${options.forceApi || false}, categories=${categories?.length || 0}`);
    
    // Skip local matching if forceApi is true
    if (!options.forceApi) {
      // Check if we can use local patterns
      if (!description) {
        console.log('No description provided for categorization');
      } else {
        // Try local matching first
        const localResult = await categorizeTranactionLocally(description, amount);
        
        // If we found a local match, return it immediately
        if (localResult.categoryId && localResult.subHeaderId) {
          console.log(`✅ Using local match for "${description}": method=${localResult.method}`);
          return localResult;
        }
      }
    }
    
    // If no local match or forceApi is true, try API matching
    console.log(`Falling back to API for "${description}"`);
    const apiResult = await suggestTransactionCategory(description, amount, categories);
    
    if (apiResult) {
      console.log(`✅ API returned match for "${description}"`);
      return {
        categoryId: apiResult.categoryId,
        subHeaderId: apiResult.subHeaderId,
        confidence: apiResult.confidence,
        method: 'api'
      };
    }
    
    // If all else fails, return uncategorized
    return {
      categoryId: null,
      subHeaderId: null,
      confidence: 0,
      method: 'uncategorized'
    };
  } catch (error) {
    console.error('Error categorizing transaction:', error);
    return {
      categoryId: null,
      subHeaderId: null,
      confidence: 0,
      method: 'uncategorized'
    };
  }
}

// Re-export for convenience
export * from './localCategorization';
export * from './transactionPatterns';
export * from './testPatterns';