import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';
import { BudgetCategory } from '@/types/budget';

interface AlertsCardProps {
  alertCategories: BudgetCategory[];
  debugInfo?: {
    alertCategoryBreakdown: {
      categoryName: string;
      deviationPercent: number;
      isOverBudget: boolean;
    }[];
  };
}

export function AlertsCard({
  alertCategories,
  debugInfo
}: AlertsCardProps) {
  return (
    <Card className="metric-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Alert Categories</CardTitle>
        <div className="metric-icon-container">
          <AlertTriangle className="metric-icon" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="metric-value">{alertCategories.length} Categories</div>
        <div className="metric-change">
          {alertCategories.length > 0 ? (
            <div className="metric-change-negative">
              <span>↓ Significant budget deviation</span>
            </div>
          ) : (
            <div className="metric-change-positive">
              <span>All categories on budget</span>
            </div>
          )}
        </div>
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="metric-debug-info">
            Debug: alerts={alertCategories.length}, 
            names=[{alertCategories.slice(0, 2).map(c => c.name).join(', ')}
            {alertCategories.length > 2 ? '...' : ''}]
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertsCard;