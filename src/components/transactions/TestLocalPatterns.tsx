import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { findMatchingPattern, LOCAL_TRANSACTION_PATTERNS } from '../../lib/categorization/transactionPatterns';
import { categorizeTranactionLocally } from '../../lib/categorization/localCategorization';
import { categorizeTransaction } from '../../lib/categorization';

interface TestLocalPatternsProps {
  categories: any[];
}

export function TestLocalPatterns({ categories }: TestLocalPatternsProps) {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testTransactions = [
    { description: "ICA KVANTUM FARSTA", amount: 245.50 },
    { description: "NETFLIX.COM", amount: 119.00 },
    { description: "WILLYS SUPERMARKET", amount: 156.75 },
    { description: "COOP FORUM", amount: 183.25 },
    { description: "SPOTIFY PREMIUM", amount: 119.00 },
    { description: "HEMKÖP", amount: 95.50 }
  ];

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    console.log("================ PATTERN TEST ================");
    console.log(`Testing ${testTransactions.length} transactions against ${LOCAL_TRANSACTION_PATTERNS.length} patterns`);
    
    const results = [];
    
    for (const tx of testTransactions) {
      // First test direct pattern matching
      const match = findMatchingPattern(tx.description);
      console.log(`\nTesting "${tx.description}":`);
      
      if (match) {
        console.log(`✓ Pattern match found: "${match.pattern}"`);
      } else {
        console.log(`✗ No pattern match found`);
      }
      
      // Then test the local categorization function
      const localResult = await categorizeTranactionLocally(tx.description, tx.amount);
      console.log(`Local result: method=${localResult.method}, categoryId=${localResult.categoryId?.substring(0, 8) || 'null'}`);
      
      // Finally test the full categorization
      const fullResult = await categorizeTransaction(tx.description, tx.amount, categories);
      console.log(`Full result: method=${fullResult.method}, categoryId=${fullResult.categoryId?.substring(0, 8) || 'null'}`);
      
      results.push({
        description: tx.description,
        amount: tx.amount,
        patternMatch: match ? match.pattern : 'None',
        localMethod: localResult.method,
        fullMethod: fullResult.method,
        categoryId: fullResult.categoryId?.substring(0, 8) || 'None',
        subHeaderId: fullResult.subHeaderId?.substring(0, 8) || 'None',
      });
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="border rounded-md p-4 my-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium">Test Local Pattern Matching</h3>
          <p className="text-xs text-gray-500">
            Run tests to check if local patterns are working
          </p>
        </div>
        <Button
          size="sm"
          onClick={runTests}
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Run Test'}
        </Button>
      </div>
      
      {testResults.length > 0 && (
        <div className="mt-4 overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left text-xs">Description</th>
                <th className="border px-4 py-2 text-left text-xs">Pattern Match</th>
                <th className="border px-4 py-2 text-left text-xs">Local Result</th>
                <th className="border px-4 py-2 text-left text-xs">Full Result</th>
                <th className="border px-4 py-2 text-left text-xs">CategoryId</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((result, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-4 py-2 text-xs">{result.description}</td>
                  <td className="border px-4 py-2 text-xs">
                    {result.patternMatch === 'None' ? (
                      <span className="text-red-500">No Match</span>
                    ) : (
                      <span className="text-green-500">{result.patternMatch}</span>
                    )}
                  </td>
                  <td className="border px-4 py-2 text-xs">
                    {result.localMethod === 'local_pattern' ? (
                      <span className="text-green-500">{result.localMethod}</span>
                    ) : (
                      <span className="text-red-500">{result.localMethod}</span>
                    )}
                  </td>
                  <td className="border px-4 py-2 text-xs">
                    {result.fullMethod === 'local_pattern' ? (
                      <span className="text-green-500">{result.fullMethod}</span>
                    ) : (
                      <span className="text-blue-500">{result.fullMethod}</span>
                    )}
                  </td>
                  <td className="border px-4 py-2 text-xs font-mono">
                    {result.categoryId}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}