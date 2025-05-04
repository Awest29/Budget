import React from 'react';
import { BudgetCategory } from '@/types/budget';
import { useMetricCalculations } from './hooks/useMetricCalculations';
import { SpendingCard } from './components/SpendingCard';
import './MetricCards.css';

interface BudgetMetricsProps {
  categories: BudgetCategory[];
  year: number;
  selectedMonth?: string;
  isYTD?: boolean;
}

export function BudgetMetrics({
  categories,
  year,
  selectedMonth,
  isYTD = false
}: BudgetMetricsProps) {
  // Use the metrics calculation hook to get all the data
  const metrics = useMetricCalculations({
    categories,
    selectedMonth,
    isYTD
  });
  
  // If there are no categories, show placeholder
  if (categories.length === 0) {
    return (
      <div className="metrics-container">
        <p>No budget data available</p>
      </div>
    );
  }
  
  return (
    <div className="metrics-container">
      {/* Only keep the Total Spending Card */}
      <SpendingCard 
        totalSpending={metrics.totalSpending}
        previousSpending={metrics.previousSpending}
        spendingDiffPercentage={metrics.spendingDiffPercentage}
        spendingChangeIsNegative={metrics.spendingChangeIsNegative}
      />
    </div>
  );
}

export default BudgetMetrics;