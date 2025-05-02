// src/components/budget/comparison/ModernBudgetComparisonPage.tsx

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ComparisonTable } from './ComparisonTable';
import { Month, FULL_MONTHS } from '@/types/budget';
import { BarChart3, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ModernCollapsible } from '@/components/ui/ModernCollapsible';
import './budget-comparison-fix.css';

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
  const [budgetData, setBudgetData] = useState<any[]>([]);
  
  // Mock data for the cards - in a real app, this would come from the budget data
  const summaryCards = [
    {
      title: "Total Spending",
      value: "$4,289",
      change: "12% from last month",
      changeType: 'negative' as const,
      icon: <BarChart3 size={24} />
    },
    {
      title: "Budget Adherence",
      value: "94%",
      change: "2% improvement",
      changeType: 'positive' as const,
      icon: <TrendingUp size={24} />
    },
    {
      title: "Alert Categories",
      value: "2 Categories",
      change: "Over budget",
      changeType: 'negative' as const,
      icon: <AlertTriangle size={24} />
    }
  ];

  // Handler to receive budget data from ComparisonTable
  const handleBudgetDataUpdate = (data: any[]) => {
    setBudgetData(data);
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
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {summaryCards.map((card, index) => (
              <BudgetAnalysisCard 
                key={index}
                title={card.title}
                value={card.value}
                change={card.change}
                changeType={card.changeType}
                icon={card.icon}
              />
            ))}
          </div>
          
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
              title="Spending Trends"
              defaultOpen={false}
              className="modern-collapsible"
            >
              <div className="p-4">
                <p className="text-tertiary mb-4">
                  Spending trend analysis will be shown here, comparing your monthly spending patterns across different categories.
                </p>
                <div className="bg-surface-hover h-64 rounded-lg flex items-center justify-center">
                  <p className="text-tertiary">Chart placeholder - will display trend data</p>
                </div>
              </div>
            </ModernCollapsible>
            
            <ModernCollapsible 
              title="Budget Recommendations"
              defaultOpen={false}
              className="modern-collapsible"
            >
              <div className="p-4">
                <div className="space-y-4">
                  <div className="p-4 bg-warning-surface rounded-lg">
                    <h4 className="font-medium text-warning mb-2">Dining Out Category</h4>
                    <p className="text-sm">You've consistently exceeded your dining out budget by 20% for the last 3 months. Consider increasing your budget or finding ways to reduce expenses.</p>
                  </div>
                  
                  <div className="p-4 bg-success-surface rounded-lg">
                    <h4 className="font-medium text-success mb-2">Transportation Category</h4>
                    <p className="text-sm">You're consistently under budget in transportation. You might be able to reallocate some of this budget to other categories.</p>
                  </div>
                </div>
              </div>
            </ModernCollapsible>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModernBudgetComparisonPage;