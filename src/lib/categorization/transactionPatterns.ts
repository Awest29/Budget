/**
 * Local transaction pattern matching configuration file
 * 
 * This file contains patterns used to match transactions locally without using the API.
 * To add new patterns:
 * 1. Add a new object to the LOCAL_TRANSACTION_PATTERNS array
 * 2. Include the pattern (text to match in the transaction description)
 * 3. Include the category and subHeader IDs
 * 4. Optionally add matchType ('exact', 'contains', 'startsWith')
 */

export interface TransactionPattern {
  pattern: string;
  categoryId: string;
  subHeaderId: string;
  matchType?: 'exact' | 'contains' | 'startsWith';
  description?: string; // For documentation purposes
}

/**
 * Local transaction patterns for automatic categorization
 */
export const LOCAL_TRANSACTION_PATTERNS: TransactionPattern[] = [
  // Groceries / Food category
  { 
    pattern: "ICA", 
    categoryId: "3c95f47c-c8b5-4b9f-b6a2-c1a2986730a8", 
    subHeaderId: "0a4d5764-cf77-44cd-b957-8a88645cbcd3",
    matchType: "contains",
    description: "ICA Supermarkets"
  },
  { 
    pattern: "WILLYS", 
    categoryId: "3c95f47c-c8b5-4b9f-b6a2-c1a2986730a8", 
    subHeaderId: "0a4d5764-cf77-44cd-b957-8a88645cbcd3",
    matchType: "contains",
    description: "Willys Supermarkets"
  },
  { 
    pattern: "COOP", 
    categoryId: "3c95f47c-c8b5-4b9f-b6a2-c1a2986730a8", 
    subHeaderId: "0a4d5764-cf77-44cd-b957-8a88645cbcd3",
    matchType: "contains",
    description: "Coop Supermarkets"
  },
  { 
    pattern: "HEMKOP", 
    categoryId: "3c95f47c-c8b5-4b9f-b6a2-c1a2986730a8", 
    subHeaderId: "0a4d5764-cf77-44cd-b957-8a88645cbcd3",
    matchType: "contains",
    description: "Hemköp Supermarkets"
  },
  
  // Restaurants
  { 
    pattern: "MCDONALDS", 
    categoryId: "3c95f47c-c8b5-4b9f-b6a2-c1a2986730a8", 
    subHeaderId: "8be37132-22c5-4c7a-9055-0b873f43d7fd",
    matchType: "contains",
    description: "McDonald's Restaurants"
  },
  { 
    pattern: "LAUMI", 
    categoryId: "3c95f47c-c8b5-4b9f-b6a2-c1a2986730a8", 
    subHeaderId: "8be37132-22c5-4c7a-9055-0b873f43d7fd",
    matchType: "contains",
    description: "Laumi Asiati restaurant/takeout"
  },
  
  // Streaming / Subscriptions
  { 
    pattern: "NETFLIX", 
    categoryId: "29e91958-ecf4-4fd9-9761-2c6194939482", 
    subHeaderId: "ba7d780f-6597-4b11-9903-efb104b4a42a",
    matchType: "contains",
    description: "Netflix subscription"
  },
  { 
    pattern: "SPOTIFY", 
    categoryId: "29e91958-ecf4-4fd9-9761-2c6194939482", 
    subHeaderId: "de91040a-11a0-48c9-a499-17006f8d81ea",
    matchType: "contains",
    description: "Spotify subscription"
  },
  { 
    pattern: "HBO", 
    categoryId: "29e91958-ecf4-4fd9-9761-2c6194939482", 
    subHeaderId: "a7a77bf6-5963-4445-a3f3-525e4476437d",
    matchType: "contains",
    description: "HBO Max subscription"
  },
  { 
    pattern: "HELP MAX", 
    categoryId: "29e91958-ecf4-4fd9-9761-2c6194939482", 
    subHeaderId: "a7a77bf6-5963-4445-a3f3-525e4476437d",
    matchType: "contains",
    description: "HBO Max streaming service"
  },
  { 
    pattern: "AMNESTY", 
    categoryId: "29e91958-ecf4-4fd9-9761-2c6194939482", 
    subHeaderId: "a7a77bf6-5963-4445-a3f3-525e4476437d",
    matchType: "contains",
    description: "Amnesty International subscription/donation"
  },
  { 
    pattern: "ENKLA VARDAG", 
    categoryId: "29e91958-ecf4-4fd9-9761-2c6194939482", 
    subHeaderId: "a7a77bf6-5963-4445-a3f3-525e4476437d",
    matchType: "contains",
    description: "Banking service subscription"
  },
  
  // Shopping
  { 
    pattern: "AMAZON", 
    categoryId: "7436949c-258d-4bfd-b162-f61ca311b45b", 
    subHeaderId: "34379df6-283c-4db2-85c0-a96ee43b82cb",
    matchType: "contains",
    description: "Amazon purchases"
  },
  { 
    pattern: "AMZN", 
    categoryId: "7436949c-258d-4bfd-b162-f61ca311b45b", 
    subHeaderId: "34379df6-283c-4db2-85c0-a96ee43b82cb",
    matchType: "contains",
    description: "Amazon purchases (abbreviated)"
  },
  
  // Transportation
  { 
    pattern: "UBER", 
    categoryId: "addd7041-6d2b-4883-89f4-4de5b5069fb0", 
    subHeaderId: "2b4887ee-f711-4564-8206-a59cb9b6b16a",
    matchType: "contains",
    description: "Uber rides"
  },
  { 
    pattern: "BOLT", 
    categoryId: "addd7041-6d2b-4883-89f4-4de5b5069fb0", 
    subHeaderId: "2b4887ee-f711-4564-8206-a59cb9b6b16a",
    matchType: "contains",
    description: "Bolt ride service"
  },
  { 
    pattern: "STORSTOCK", 
    categoryId: "addd7041-6d2b-4883-89f4-4de5b5069fb0", 
    subHeaderId: "2b4887ee-f711-4564-8206-a59cb9b6b16a",
    matchType: "contains",
    description: "Stockholm public transportation"
  },
  
  // Utilities
  { 
    pattern: "ELLEVIO", 
    categoryId: "addd7041-6d2b-4883-89f4-4de5b5069fb0", 
    subHeaderId: "2b4887ee-f711-4564-8206-a59cb9b6b16a",
    matchType: "contains",
    description: "Electricity provider"
  },
  { 
    pattern: "TIBBER", 
    categoryId: "addd7041-6d2b-4883-89f4-4de5b5069fb0", 
    subHeaderId: "2b4887ee-f711-4564-8206-a59cb9b6b16a",
    matchType: "contains",
    description: "Electricity provider"
  },
  
  // Credit Card Payments
  { 
    pattern: "AMERICAN EXPRESS", 
    categoryId: "00565ee9-9b8c-49f9-b9c3-f69954815895", 
    subHeaderId: "8b947d6d-2ce8-42b3-9a2f-7bdf254b62c2",
    matchType: "contains",
    description: "Credit card payment"
  },
  
  // Medical and Pharmacy
  { 
    pattern: "K*APOTE", 
    categoryId: "00565ee9-9b8c-49f9-b9c3-f69954815895", 
    subHeaderId: "8b947d6d-2ce8-42b3-9a2f-7bdf254b62c2",
    matchType: "contains",
    description: "Pharmacy purchases"
  },
  
  // Bank Transfers and Investments
  { 
    pattern: "NORDNET", 
    categoryId: "00565ee9-9b8c-49f9-b9c3-f69954815895", 
    subHeaderId: "8b947d6d-2ce8-42b3-9a2f-7bdf254b62c2",
    matchType: "contains",
    description: "Investment platform transfers"
  },
  
  // Specific accounts with exact matching
  { 
    pattern: "92525288637", 
    categoryId: "00565ee9-9b8c-49f9-b9c3-f69954815895", 
    subHeaderId: "8b947d6d-2ce8-42b3-9a2f-7bdf254b62c2",
    matchType: "exact",
    description: "SBAB mortgage payment"
  },
  { 
    pattern: "57241880706", 
    categoryId: "00565ee9-9b8c-49f9-b9c3-f69954815895", 
    subHeaderId: "8b947d6d-2ce8-42b3-9a2f-7bdf254b62c2",
    matchType: "exact",
    description: "Bank transfer"
  },
  { 
    pattern: "46769373883", 
    categoryId: "00565ee9-9b8c-49f9-b9c3-f69954815895", 
    subHeaderId: "8b947d6d-2ce8-42b3-9a2f-7bdf254b62c2",
    matchType: "exact",
    description: "Doctor/medical services payment"
  }
];

/**
 * Search the patterns list for a match on a transaction description
 * @param description The transaction description to match
 * @returns The matching pattern or null if no match found
 */
export function findMatchingPattern(description: string): TransactionPattern | null {
  if (!description) return null;
  
  console.log(`[PATTERN MATCHER] Looking for patterns in: "${description}"`);
  const normalizedDesc = description.toUpperCase().trim();
  
  for (const pattern of LOCAL_TRANSACTION_PATTERNS) {
    const patternText = pattern.pattern.toUpperCase();
    
    // Check for match based on the matchType
    if (pattern.matchType === 'exact' && normalizedDesc === patternText) {
      console.log(`[PATTERN MATCHER] ✅ Exact match found: "${patternText}"`);
      return pattern;
    } else if (pattern.matchType === 'startsWith' && normalizedDesc.startsWith(patternText)) {
      console.log(`[PATTERN MATCHER] ✅ StartsWith match found: "${patternText}"`);
      return pattern;
    } else if (!pattern.matchType || pattern.matchType === 'contains') {
      // Default to 'contains' if no matchType specified
      if (normalizedDesc.includes(patternText)) {
        console.log(`[PATTERN MATCHER] ✅ Contains match found: "${patternText}" in "${normalizedDesc}"`);
        return pattern;
      }
    }
  }
  
  console.log(`[PATTERN MATCHER] ❌ No pattern match found for "${description}"`);
  return null;
}