/**
 * Test utility for checking if local patterns match transaction descriptions
 */

import { findMatchingPattern, LOCAL_TRANSACTION_PATTERNS } from './transactionPatterns';

/**
 * Test if local patterns match a set of transaction descriptions
 * This can be used in the browser console to test your patterns
 * @example
 * // Call from browser console
 * import { testLocalPatterns } from '/src/lib/categorization/testPatterns.ts';
 * testLocalPatterns(["ICA KVANTUM", "SPOTIFY PREMIUM", "NETFLIX.COM"]);
 */
export function testLocalPatterns(descriptions: string[]): void {
  console.log("========= TESTING LOCAL PATTERNS =========");
  console.log(`Testing ${descriptions.length} descriptions against ${LOCAL_TRANSACTION_PATTERNS.length} patterns`);
  
  const results = {
    matched: 0,
    unmatched: 0,
    details: [] as any[]
  };
  
  descriptions.forEach(desc => {
    const match = findMatchingPattern(desc);
    
    if (match) {
      results.matched++;
      results.details.push({
        description: desc,
        pattern: match.pattern,
        category: match.description || 'Unknown',
        result: 'match'
      });
    } else {
      results.unmatched++;
      results.details.push({
        description: desc,
        result: 'no match'
      });
    }
  });
  
  console.table(results.details);
  console.log(`Results: ${results.matched} matched, ${results.unmatched} unmatched`);
  console.log("=========================================");
  
  return;
}

/**
 * Test a single transaction description against local patterns
 * @example
 * // Call from browser console
 * import { testSinglePattern } from '/src/lib/categorization/testPatterns.ts';
 * testSinglePattern("ICA KVANTUM FARSTA");
 */
export function testSinglePattern(description: string): void {
  console.log(`Testing: "${description}"`);
  
  const match = findMatchingPattern(description);
  
  if (match) {
    console.log(`✅ MATCH FOUND: "${match.pattern}"`);
    console.log(`Category: ${match.description || 'Unknown'}`);
    console.log(`CategoryId: ${match.categoryId}`);
    console.log(`SubHeaderId: ${match.subHeaderId}`);
  } else {
    console.log("❌ NO MATCH FOUND");
    
    // Try to see which patterns were checked
    const normalizedDesc = description.toUpperCase().trim();
    
    LOCAL_TRANSACTION_PATTERNS.forEach(pattern => {
      const patternText = pattern.pattern.toUpperCase();
      
      console.log(`- Testing "${patternText}" (${pattern.matchType || 'contains'}):`);
      
      if (pattern.matchType === 'exact') {
        console.log(`  - Exact match? ${normalizedDesc === patternText}`);
      } else if (pattern.matchType === 'startsWith') {
        console.log(`  - Starts with? ${normalizedDesc.startsWith(patternText)}`);
      } else {
        console.log(`  - Contains? ${normalizedDesc.includes(patternText)}`);
      }
    });
  }
}

// Export the patterns for direct access in the console
export { LOCAL_TRANSACTION_PATTERNS };