import React from 'react';
import './spending-trends.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SpendingTrendsChart } from './SpendingTrendsChart';
import { BudgetCategory } from '@/types/budget';
import { ModernCollapsible } from '@/components/ui/ModernCollapsible';

interface SpendingTrendsContainerProps {
  categories: BudgetCategory[];
  year: number;
  selectedMonth?: string;
  isYtdMode?: boolean;
}

export function SpendingTrendsContainer({ categories, year, selectedMonth, isYtdMode }: SpendingTrendsContainerProps) {
  return (
    <Card className="spending-trends-card mb-6">
      <ModernCollapsible
        title="Spending Trends"
        defaultOpen={true}
      >
        <CardContent>
          <div className="spending-trend-content p-4">
            {categories.length === 0 ? (
              <div className="no-data-message p-6 text-center">
                <p>Spending trend analysis will be shown here, comparing your monthly spending patterns across different categories.</p>
              </div>
            ) : (
              <SpendingTrendsChart 
                categories={categories} 
                year={year} 
                selectedMonth={selectedMonth}
                isYtdMode={isYtdMode} // Note: Chart now always shows YTD data regardless of this prop
              />
            )}
          </div>
        </CardContent>
      </ModernCollapsible>
    </Card>
  );
}

export default SpendingTrendsContainer;