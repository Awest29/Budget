import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from 'lucide-react';

interface SpendingCardProps {
  totalSpending: number;
  previousSpending: number;
  spendingDiffPercentage: number;
  spendingChangeIsNegative: boolean;
}

export function SpendingCard({
  totalSpending,
  previousSpending,
  spendingDiffPercentage,
  spendingChangeIsNegative
}: SpendingCardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="metric-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
        <div className="metric-icon-container">
          <BarChart className="metric-icon" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="metric-value">{formatCurrency(totalSpending)}</div>
        <div className="metric-change">
          <div className={spendingChangeIsNegative 
            ? "metric-change-negative" 
            : spendingDiffPercentage < 0 
              ? "metric-change-positive" 
              : "text-muted-foreground"
          }>
            {spendingDiffPercentage !== 0 ? (
              <span>
                {spendingChangeIsNegative ? '↑' : '↓'} {Math.abs(spendingDiffPercentage)}% from last month
              </span>
            ) : (
              <span>0% from last month</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SpendingCard;