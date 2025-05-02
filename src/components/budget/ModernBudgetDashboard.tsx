// src/components/budget/ModernBudgetDashboard.tsx
import React, { useState, useEffect } from 'react';
import { ModernBudgetSummary } from './ModernBudgetSummary';
import type { BudgetCategory } from '@/types/budget';
import { getBudgetData } from '@/lib/budgetService';

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
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading budget data...</p>
        </div>
      ) : (
        <ModernBudgetSummary categories={categories} year={year} />
      )}
    </div>
  );
}

export default ModernBudgetDashboard;