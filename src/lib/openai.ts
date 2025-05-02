/// <reference types="vite/client" />

import { supabase } from '../lib/lib/supabase';
import { BudgetCategory } from '../types/budget';

interface CategorySuggestion {
  categoryId: string;
  subHeaderId: string;
  confidence: number;
}

interface FeedbackEntry {
  description: string;
  correct_category_id: string;
  correct_subheader_id: string;
}

async function getPastSuccessfulCategorizations(description: string): Promise<FeedbackEntry[]> {
  try {
    // First, try to find an exact match for this transaction
    const { data: exactMatches, error: exactError } = await supabase
      .from('ai_categorization_feedback')
      .select('description, correct_category_id, correct_subheader_id')
      .eq('was_correct', true)
      .eq('description', description)
      .limit(1);
    
    if (exactError) {
      console.error('Error fetching exact match categorizations:', exactError);
    } else if (exactMatches && exactMatches.length > 0) {
      console.log('Found exact match for transaction:', description);
      return exactMatches;
    }
    
    // If no exact match, extract potential merchant identifiers from the description
    const descriptionWords = description.toLowerCase().split(/\s+/);
    
    // Remove common non-identifying words, dates, numbers, special chars
    const keywordSet = new Set<string>();
    
    // Extract potential merchant names (first 1-3 words)
    descriptionWords.slice(0, 3).forEach(word => {
      // Remove special characters and numbers
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (cleanWord.length >= 3) { // Only add meaningful words
        keywordSet.add(cleanWord);
      }
    });
    
    // Check for known merchant patterns (e.g., "AMZN" for Amazon)
    const knownMerchants = [
      { pattern: /amzn|amazon/i, key: 'amazon' },
      { pattern: /uber/i, key: 'uber' },
      { pattern: /netflix/i, key: 'netflix' },
      { pattern: /spotify/i, key: 'spotify' },
      { pattern: /ica/i, key: 'ica' },
      { pattern: /willys/i, key: 'willys' },
      { pattern: /coop|kooperativa/i, key: 'coop' },
      { pattern: /hemköp|hemkop/i, key: 'hemkop' },
      { pattern: /rusta/i, key: 'rusta' },
      { pattern: /ikea/i, key: 'ikea' },
      { pattern: /system(et|bolaget)/i, key: 'systembolaget' }
    ];
    
    for (const merchant of knownMerchants) {
      if (merchant.pattern.test(description)) {
        keywordSet.add(merchant.key);
      }
    }
    
    const keywords = Array.from(keywordSet);
    console.log('Extracted keywords for matching:', keywords);
    
    if (keywords.length === 0) {
      return [];
    }
    
    // Find similar transactions using the keywords
    const similarEntries: FeedbackEntry[] = [];
    
    // For each keyword, find matching transactions
    for (const keyword of keywords) {
      const { data: matches, error: matchError } = await supabase
        .from('ai_categorization_feedback')
        .select('description, correct_category_id, correct_subheader_id')
        .eq('was_correct', true)
        .ilike('description', `%${keyword}%`)
        .limit(3);
      
      if (matchError) {
        console.error(`Error fetching matches for keyword ${keyword}:`, matchError);
        continue;
      }
      
      if (matches && matches.length > 0) {
        similarEntries.push(...matches);
      }
    }
    
    // Deduplicate entries based on category and subheader
    const uniqueEntries = Array.from(
      new Map(similarEntries.map(entry => [
        `${entry.correct_category_id}-${entry.correct_subheader_id}`,
        entry
      ])).values()
    );
    
    console.log(`Found ${uniqueEntries.length} similar transactions for: ${description}`);
    return uniqueEntries.slice(0, 5); // Return up to 5 unique entries
  } catch (error) {
    console.error('Error in getPastSuccessfulCategorizations:', error);
    return [];
  }
}

export async function suggestTransactionCategory(
  description: string,
  amount: number,
  categories: BudgetCategory[]
): Promise<CategorySuggestion | null> {
  try {
    // Try to get API key from both potential environment variable locations
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    console.log('API Key available:', !!apiKey); // Debug output to confirm key exists
    
    if (!apiKey) {
      console.error('OpenAI API key not found - check .env file for VITE_OPENAI_API_KEY');
      return null;
    }
    
    // Get past successful categorizations
    const pastCategorizations = await getPastSuccessfulCategorizations(description);
    
    // Check for exact match first
    const exactMatch = pastCategorizations.find(p => 
      p.description.toLowerCase() === description.toLowerCase()
    );
    
    if (exactMatch) {
      console.log('Found exact match for categorization:', exactMatch);
      return {
        categoryId: exactMatch.correct_category_id,
        subHeaderId: exactMatch.correct_subheader_id,
        confidence: 1.0
      };
    }
    
    // If no exact match, check for pattern matches
    try {
      // Extract key words from description for pattern matching
      const words = description.toLowerCase().split(/\s+/);
      if (words.length > 0) {
        // Use first word as pattern base
        const pattern = words[0];
        
        // Find matching patterns
        const { data: patternMatches, error: patternError } = await supabase
          .from('transaction_patterns')
          .select('*')
          .ilike('pattern', `%${pattern}%`)
          .order('frequency_count', { ascending: false })
          .limit(3);
        
        if (patternError) {
          console.error('Error fetching pattern matches:', patternError);
        } else if (patternMatches && patternMatches.length > 0) {
          // Use the most frequent pattern match
          const bestMatch = patternMatches[0];
          console.log('Found pattern match for transaction:', {
            description,
            pattern: bestMatch.pattern,
            frequency: bestMatch.frequency_count
          });
          
          // Calculate confidence based on frequency count
          const confidence = Math.min(0.95, 0.75 + (bestMatch.frequency_count * 0.05));
          
          return {
            categoryId: bestMatch.correct_category_id,
            subHeaderId: bestMatch.correct_subheader_id,
            confidence
          };
        }
      }
    } catch (patternError) {
      console.error('Error in pattern matching:', patternError);
      // Continue with OpenAI if pattern matching fails
    }

    const prompt = `Categorize this transaction description: "${description}" (Amount: ${amount})

CRITICAL: You MUST use the exact UUIDs provided below. Never use friendly names.

Transaction type mapping (COPY THESE EXACTLY):

1. For ICA, SUPERMARKET, grocery stores:
   {"categoryId": "3c95f47c-c8b5-4b9f-b6a2-c1a2986730a8", "subHeaderId": "0a4d5764-cf77-44cd-b957-8a88645cbcd3"}

2. For Amazon transactions:
   {"categoryId": "7436949c-258d-4bfd-b162-f61ca311b45b", "subHeaderId": "34379df6-283c-4db2-85c0-a96ee43b82cb"}

3. For restaurants and takeout:
   {"categoryId": "3c95f47c-c8b5-4b9f-b6a2-c1a2986730a8", "subHeaderId": "8be37132-22c5-4c7a-9055-0b873f43d7fd"}

4. For Systembolaget:
   {"categoryId": "addd7041-6d2b-4883-89f4-4de5b5069fb0", "subHeaderId": "2b4887ee-f711-4564-8206-a59cb9b6b16a"}

5. For bank transfers/payments:
   {"categoryId": "00565ee9-9b8c-49f9-b9c3-f69954815895", "subHeaderId": "8b947d6d-2ce8-42b3-9a2f-7bdf254b62c2"}

6. For streaming/subscription services:
   a. Disney+: {"categoryId": "29e91958-ecf4-4fd9-9761-2c6194939482", "subHeaderId": "a7a77bf6-5963-4445-a3f3-525e4476437d"}
   b. Netflix: {"categoryId": "29e91958-ecf4-4fd9-9761-2c6194939482", "subHeaderId": "ba7d780f-6597-4b11-9903-efb104b4a42a"}
   c. Spotify: {"categoryId": "29e91958-ecf4-4fd9-9761-2c6194939482", "subHeaderId": "de91040a-11a0-48c9-a499-17006f8d81ea"}

ALL Available Categories (USE EXACT IDs):
${categories.map(cat => `${cat.name}:
  ID: "${cat.id}"
  SubHeaders:${cat.subHeaders.map(sub => `
    - "${sub.id}" for ${sub.name}`).join('')}`).join('\n\n')}

${pastCategorizations.length > 0 ? `
Recently categorized similar transactions:
${pastCategorizations.map(p => `"${p.description}" = {"categoryId": "${p.correct_category_id}", "subHeaderId": "${p.correct_subheader_id}"}`).join('\n')}
` : ''}

YOU MUST RESPOND WITH EXACT JSON USING UUIDS: {"categoryId": "xxx", "subHeaderId": "yyy"}`;

    console.log('Sending prompt to OpenAI');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries([...response.headers]));
      throw new Error(`OpenAI API call failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data.choices[0].message.content);
    
    const suggestion = JSON.parse(data.choices[0].message.content);
    console.log('Parsed suggestion:', suggestion);

    // Validate that the IDs exist in our categories
    const validCategory = categories.find(c => c.id === suggestion.categoryId);
    const validSubHeader = validCategory?.subHeaders.find(s => s.id === suggestion.subHeaderId);

    if (!validCategory || !validSubHeader) {
      console.error('Invalid category or subheader ID returned by AI');
      console.error('Suggestion was:', suggestion);
      console.error('Valid category found:', validCategory ? 'Yes' : 'No');
      if (validCategory) {
        console.error('Available subheaders:', validCategory.subHeaders);
      }
      return null;
    }

    return {
      ...suggestion,
      confidence: 0.8
    };

  } catch (error) {
    console.error('Error in suggestTransactionCategory:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

export async function storeCategorizationFeedback(
  description: string,
  amount: number,
  categoryId: string,
  subHeaderId: string,
  wasCorrect: boolean
): Promise<void> {
  try {
    // Extract merchant pattern for improved categorization
    const normalizedDescription = description.trim();
    
    // Store standard entry
    const { error } = await supabase
      .from('ai_categorization_feedback')
      .upsert({
        description: normalizedDescription,
        amount,
        correct_category_id: categoryId,
        correct_subheader_id: subHeaderId,
        was_correct: wasCorrect,
        created_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        confidence_score: wasCorrect ? 1.0 : 0.0,
        frequency_count: 1
      }, {
        onConflict: 'description'
      });

    if (error) {
      console.error('Error storing feedback:', error);
      throw error;
    }
    
    // If this is a correct categorization, also store a generalized pattern
    if (wasCorrect) {
      // Extract recurring transaction pattern (removing dates, amounts, order numbers)
      const words = normalizedDescription.split(/\s+/);
      let pattern = '';
      
      // For most transactions, the first 1-2 words are the most identifying part
      if (words.length > 0) {
        // Use the first word (usually the merchant name) as the pattern base
        pattern = words[0];
        
        // If the first word is very short, also include the second word
        if (pattern.length < 4 && words.length > 1) {
          pattern += ' ' + words[1];
        }
        
        // Store pattern-based entry with incrementing counter
        try {
          // First check if pattern already exists
          const { data: existingPattern } = await supabase
            .from('transaction_patterns')
            .select('frequency_count, id')
            .eq('pattern', pattern)
            .eq('correct_category_id', categoryId)
            .eq('correct_subheader_id', subHeaderId)
            .single();
          
          if (existingPattern) {
            // Update existing pattern with incremented counter
            await supabase
              .from('transaction_patterns')
              .update({
                frequency_count: existingPattern.frequency_count + 1,
                last_updated_at: new Date().toISOString()
              })
              .eq('id', existingPattern.id);
          } else {
            // Create new pattern entry
            await supabase
              .from('transaction_patterns')
              .insert({
                pattern,
                correct_category_id: categoryId,
                correct_subheader_id: subHeaderId,
                frequency_count: 1,
                created_at: new Date().toISOString(),
                last_updated_at: new Date().toISOString()
              });
          }
        } catch (patternError) {
          console.error('Error storing transaction pattern:', patternError);
        }
      }
    }

    console.log('Successfully stored categorization feedback');
  } catch (error) {
    console.error('Failed to store categorization feedback:', error);
  }
}