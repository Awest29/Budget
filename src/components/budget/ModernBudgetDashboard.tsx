// src/components/budget/ModernBudgetDashboard.tsx
import React, { useState, useEffect } from 'react';
import { ModernBudgetSummary } from './ModernBudgetSummary';
import type { BudgetCategory } from '@/types/budget';
import { getBudgetData } from '@/lib/budgetService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed BudgetMetricCards import as these should only appear in Budget Analysis
import './dashboard/dashboard-cards.css';

interface ModernBudgetDashboardProps {
  year: number;
}

export function ModernBudgetDashboard({ year }: ModernBudgetDashboardProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const enrichedCategories = await getBudgetData();
      setCategories(enrichedCategories);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <p>Loading budget data...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Budget Metric Cards removed - should only appear in Budget Analysis */}
          
          {/* Budget Summary Table */}
          <Card className="budget-summary-card">
            <CardHeader>
              <CardTitle>Budget Dashboard {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <ModernBudgetSummary categories={categories} year={year} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default ModernBudgetDashboard;