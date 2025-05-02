import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface BudgetSummary {
  categoryId: string;
  name: string;
  budget: number;
  actual: number;
  deviation: number;
  percentage: number;
}

interface BudgetAnalysisProps {
  month: string;
  year: number;
  budgetData: {
    actual: number;
    budget: number;
    deviation: number;
    name: string;
    type: string;
  }[];
}

export function BudgetAnalysis({ month, year, budgetData }: BudgetAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateAnalysis = async () => {
      setIsLoading(true);
      try {
        console.log('Budget data received:', budgetData);
        // Format the data for OpenAI
        const significantVariations = budgetData
          .filter(item => Math.abs((item.deviation / item.budget) * 100) > 5)
          .map(item => ({
            name: item.name,
            type: item.type,
            budget: item.budget,
            actual: item.actual,
            deviation: item.deviation,
            percentage: ((item.deviation / item.budget) * 100).toFixed(1)
          }));
          console.log('Significant variations:', significantVariations);
          console.log('OpenAI Key:', import.meta.env.VITE_OPENAI_API_KEY ? 'Present' : 'Missing');
        const prompt = `Please analyze this budget data for ${month} ${year} and provide a concise summary with recommendations:

Key variations from budget:
${significantVariations.map(item => 
  `${item.name} (${item.type}): Budget ${item.budget}, Actual ${item.actual}, Deviation ${item.deviation} (${item.percentage}%)`
).join('\n')}

Please provide:
1. A brief overall assessment
2. Highlight significant overspending areas
3. Note positive areas where we saved money
4. Specific, actionable recommendations for optimization
5. Any concerning trends that need attention

Keep the tone professional but friendly. Focus on practical insights and actionable advice.`;

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('OpenAI API key not found');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{
              role: 'user',
              content: prompt
            }],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate analysis');
        }

        const data = await response.json();
        setAnalysis(data.choices[0].message.content);
      } catch (error) {
        console.error('Error generating analysis:', error);
        setAnalysis('Unable to generate analysis at this time. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (budgetData.length > 0) {
      generateAnalysis();
    }
  }, [month, year, budgetData]);

  // If loading
if (isLoading) {
  return (
    <div className="content-card">
      <h2 className="page-title">Monthly Budget Analysis</h2>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

// When data is loaded
return (
  <div className="content-card">
    <div className="flex items-center gap-2 mb-4">
      <AlertCircle className="h-5 w-5" />
      <h2 className="page-title">AI Budget Analysis - {month} {year}</h2>
    </div>
    
    <div className="prose max-w-none">
      {analysis.split('\n').map((paragraph, index) => (
        <p key={index} className="mb-4">
          {paragraph}
        </p>
      ))}
    </div>
  </div>
);
}