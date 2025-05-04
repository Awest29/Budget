import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ComparisonTable } from './ComparisonTable';
import { Month, FULL_MONTHS } from '@/types/budget';
import { BarChart3, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ModernCollapsible } from '@/components/ui/ModernCollapsible';
import { BudgetMetrics } from '../metrics/BudgetMetrics';
import { getBudgetData } from '@/lib/budgetService';
import { BudgetCategory } from '@/types/budget';
import { SpendingTrendsChart } from '../trends/SpendingTrendsChart';
import { BudgetRecommendations } from '../trends/BudgetRecommendations';
import { useBudgetAnalysisTransactions } from '@/hooks/budget/useBudgetAnalysisTransactions';
import './budget-comparison-fix.css';
import '../trends/spending-trends.css';

interface BudgetAnalysisCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

const BudgetAnalysisCard = ({ title, value, change, changeType, icon }: BudgetAnalysisCardProps) => {
  const changeColorClass = 
    changeType === 'positive' 
      ? 'text-income' 
      : changeType === 'negative' 
        ? 'text-expense' 
        : 'text-tertiary';

  return (
    <div className="budget-analysis-card">
      <div className="card-content p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm text-tertiary mb-1">{title}</h3>
            <p className="text-2xl font-semibold card-value">{value}</p>
            <div className={`flex items-center mt-2 ${changeColorClass}`}>
              {changeType === 'positive' ? <ChevronUp size={16} /> : changeType === 'negative' ? <ChevronDown size={16} /> : null}
              <span className="text-sm">{change}</span>
            </div>
          </div>
          <div className="p-3 bg-primary-surface rounded-md text-primary">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ModernBudgetComparisonPageProps {
  year: number;
}

export function ModernBudgetComparisonPage({ year }: ModernBudgetComparisonPageProps) {
  // Set initial month to previous month
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() - 1);
  const initialMonth = FULL_MONTHS[currentDate.getMonth()];

  const [selectedMonth, setSelectedMonth] = useState<Month>(initialMonth);
  const [isYTD, setIsYTD] = useState(false);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use our new hook to fetch transaction data for the entire year
  const { transactions, loading: transactionsLoading, error: transactionsError } = useBudgetAnalysisTransactions(year);
  
  // Load budget data on component mount and when month/YTD selection changes
  useEffect(() => {
    loadCategories();
    console.log('ModernBudgetComparisonPage: Month or YTD selection changed', { selectedMonth, isYTD });
  }, [selectedMonth, isYTD]);

  async function loadCategories() {
    try {
      setLoading(true);
      
      // Load budget categories
      const enrichedCategories = await getBudgetData();
      setCategories(enrichedCategories);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Handler to receive budget data from ComparisonTable
  const handleBudgetDataUpdate = (data: any[]) => {
    // Process budget data received from ComparisonTable
    // For now, we're using our new hook for transactions
  };

  return (
    <div className="container mx-auto p-6 budget-analysis-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Budget Analysis {year}</h2>
          <p className="card-subtitle">Compare your actual spending with your budget</p>
        </div>
        
        <div className="card-content">
          {/* Controls row */}
          <div className="analysis-controls">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <Label htmlFor="month-select" className="block mb-2">Select Month</Label>
                  <Select 
                    value={selectedMonth} 
                    onValueChange={(value) => setSelectedMonth(value as Month)}
                    id="month-select"
                  >
                    <SelectTrigger className="w-48 select-trigger">
                      <SelectValue placeholder="Select month" className="select-value" />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      {FULL_MONTHS.map((month) => (
                        <SelectItem key={month} value={month} className="select-item">
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="ytd-toggle ytd-switch-container">
                  <Switch
                    checked={isYTD}
                    onCheckedChange={setIsYTD}
                    id="ytd-mode"
                    className="toggle-switch"
                  />
                  <Label htmlFor="ytd-mode" className="toggle-label">YTD View</Label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Budget Metrics Cards */}
          {loading ? (
            <div className="flex justify-center items-center h-32 mb-6">
              <p>Loading budget data...</p>
            </div>
          ) : (
            <BudgetMetrics
              categories={categories}
              year={year}
              selectedMonth={selectedMonth}
              isYTD={isYTD}
              key={`${selectedMonth}-${isYTD}`} // Force re-render when month or YTD changes
            />
          )}
          
          {/* Analysis sections */}
          <div className="space-y-6">
            <ModernCollapsible 
              title="Budget vs Actual Comparison"
              defaultOpen={true}
              className="modern-collapsible"
            >
              <div className="table-container mt-4">
                <ComparisonTable 
                  month={selectedMonth}
                  isYTD={isYTD}
                  year={year}
                  onBudgetDataUpdate={handleBudgetDataUpdate}
                />
              </div>
            </ModernCollapsible>
            
            <ModernCollapsible 
              title="Spending Trends (Actual Transactions)"
              defaultOpen={true}
              className="modern-collapsible"
              description="This chart shows your actual spending from transactions, while the budget table shows your planned budget amounts."
            >
              <div className="p-4">
                {loading || transactionsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <p>Loading spending trends...</p>
                  </div>
                ) : transactionsError ? (
                  <div className="p-4 bg-destructive-subtle text-destructive rounded">
                    <p>Error loading transaction data: {transactionsError.message}</p>
                  </div>
                ) : (
                  <SpendingTrendsChart 
                    categories={categories} 
                    year={year} 
                    selectedMonth={selectedMonth}
                    isYtdMode={isYTD}
                    transactions={transactions} // Use our transactions from the hook
                    key={`trends-${selectedMonth}-${transactions.length}`} // Force re-render when data changes
                  />
                )}
                <div className="chart-explanation-note">
                  <p>
                    <strong>Note:</strong> This chart shows actual spending from transactions, 
                    while the budget table above shows planned budget values. 
                  </p>
                  <p className="text-sm mt-2">
                    The discrepancy between chart and table values (such as Travel showing 38,235 in the chart vs. 6,237 in the table)
                    represents the difference between your planned budget and actual spending.
                  </p>
                </div>
              </div>
            </ModernCollapsible>
            
            <ModernCollapsible 
              title="Budget Recommendations"
              defaultOpen={true}
              className="modern-collapsible"
            >
              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <p>Loading recommendations...</p>
                  </div>
                ) : (
                  <BudgetRecommendations categories={categories} />
                )}
              </div>
            </ModernCollapsible>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModernBudgetComparisonPage;