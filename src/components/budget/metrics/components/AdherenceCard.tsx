import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';

interface AdherenceCardProps {
  budgetAdherence: number;
  previousAdherence: number;
  adherenceDiff: number;
  adherenceChangeIsPositive: boolean;
  debugInfo?: {
    totalBudgeted: number;
    totalDeviation: number;
  };
}

export function AdherenceCard({
  budgetAdherence,
  previousAdherence,
  adherenceDiff,
  adherenceChangeIsPositive,
  debugInfo
}: AdherenceCardProps) {
  return (
    <Card className="metric-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Budget Adherence</CardTitle>
        <div className="metric-icon-container">
          <TrendingUp className="metric-icon" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="metric-value">{budgetAdherence}%</div>
        <div className="metric-change">
          {adherenceDiff === 0 ? (
            <div className="text-muted-foreground">
              <span>No change</span>
            </div>
          ) : adherenceChangeIsPositive ? (
            <div className="metric-change-positive">
              <span>↑ {Math.abs(adherenceDiff)}% improvement</span>
            </div>
          ) : (
            <div className="metric-change-negative">
              <span>↓ {Math.abs(adherenceDiff)}% decline</span>
            </div>
          )}
        </div>
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="metric-debug-info">
            Debug: adhere={budgetAdherence}%, prev={previousAdherence}%, diff={adherenceDiff}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdherenceCard;