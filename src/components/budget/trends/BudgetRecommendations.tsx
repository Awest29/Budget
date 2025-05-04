import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowUp, ArrowDown, Check, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { BudgetCategory } from '@/types/budget';
import { ModernCollapsible } from '@/components/ui/ModernCollapsible';
import './spending-trends.css';

interface BudgetRecommendationsProps {
  categories: BudgetCategory[];
}

interface RecommendationItem {
  title: string;
  description: string;
  type: 'warning' | 'success' | 'info';
  priority: number; // 1-3, 1 being highest priority
}

export function BudgetRecommendations({ categories }: BudgetRecommendationsProps) {
  // Generate recommendations based on budget data
  const recommendations: RecommendationItem[] = React.useMemo(() => {
    const results: RecommendationItem[] = [];

    if (!categories || categories.length === 0) {
      return [];
    }

    // Track variable categories with high spending
    const variableCategories = categories.filter(cat => cat.type === 'variable');
    
    // Generate recommendations for categories that consistently exceed budget
    const MONTHS = ['jan', 'feb', 'mar'];
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const relevantMonths = currentMonthIndex >= 2 
      ? MONTHS.slice(0, 3) 
      : MONTHS.slice(0, currentMonthIndex + 1);
    
    if (relevantMonths.length > 0) {
      // Check for categories that exceeded budget in recent months
      const exceedingCategories = new Map<string, { count: number, name: string, average: number }>();
      
      variableCategories.forEach(category => {
        let categoryTotal = 0;
        let budgetTotal = 0;
        let monthsExceeded = 0;
        
        relevantMonths.forEach(month => {
          let monthActual = 0;
          let monthBudget = 0;
          
          category.subHeaders.forEach(sub => {
            const actual = Math.abs((sub.budgetValues?.[month] !== undefined
              ? sub.budgetValues[month]
              : sub.monthlyamounts?.[month]) || 0);
              
            const budget = Math.abs(sub.monthlyamounts?.[month] || 0);
            
            monthActual += actual;
            monthBudget += budget;
          });
          
          if (monthBudget > 0 && monthActual > monthBudget) {
            monthsExceeded++;
          }
          
          categoryTotal += monthActual;
          budgetTotal += monthBudget;
        });
        
        if (monthsExceeded >= 2 && budgetTotal > 0) {
          const percentOver = ((categoryTotal - budgetTotal) / budgetTotal) * 100;
          if (percentOver > 10) {
            exceedingCategories.set(category.id, {
              count: monthsExceeded,
              name: category.name,
              average: percentOver
            });
          }
        }
      });
      
      // Add recommendations for exceeding categories
      exceedingCategories.forEach(data => {
        results.push({
          title: `${data.name} Category`,
          description: `You've consistently exceeded your ${data.name.toLowerCase()} budget by ${data.average.toFixed(0)}% for the last ${data.count} months. Consider increasing your budget or finding ways to reduce expenses.`,
          type: 'warning',
          priority: 1
        });
      });
    }
    
    // Check for categories with no budget set
    const unbugdetedCategories = variableCategories.filter(cat => {
      const hasBudget = cat.subHeaders.some(sub => {
        return Object.values(sub.monthlyamounts || {}).some(amount => amount && amount > 0);
      });
      return !hasBudget && cat.subHeaders.length > 0;
    });
    
    if (unbugdetedCategories.length > 0) {
      results.push({
        title: 'Missing Budget Allocations',
        description: `${unbugdetedCategories.map(c => c.name).join(', ')} ${unbugdetedCategories.length === 1 ? 'has' : 'have'} no budget allocated. Consider setting budget amounts for better financial planning.`,
        type: 'info',
        priority: 2
      });
    }
    
    // Check for well managed categories
    const wellManagedCategories = variableCategories.filter(cat => {
      let categoryTotal = 0;
      let budgetTotal = 0;
      
      if (relevantMonths.length > 0) {
        relevantMonths.forEach(month => {
          cat.subHeaders.forEach(sub => {
            const actual = Math.abs((sub.budgetValues?.[month] !== undefined
              ? sub.budgetValues[month]
              : sub.monthlyamounts?.[month]) || 0);
              
            const budget = Math.abs(sub.monthlyamounts?.[month] || 0);
            
            categoryTotal += actual;
            budgetTotal += budget;
          });
        });
        
        return budgetTotal > 0 && categoryTotal <= budgetTotal && categoryTotal > 0;
      }
      
      return false;
    });
    
    // Check for categories with high spending growth
    const growingCategories = variableCategories.filter(cat => {
      if (relevantMonths.length < 2) return false;
      
      // Calculate month-over-month growth
      const monthData = relevantMonths.map(month => {
        let monthTotal = 0;
        cat.subHeaders.forEach(sub => {
          const actual = Math.abs((sub.budgetValues?.[month] !== undefined
            ? sub.budgetValues[month]
            : sub.monthlyamounts?.[month]) || 0);
          monthTotal += actual;
        });
        return monthTotal;
      });
      
      // Check if there's a consistent upward trend
      let isGrowing = true;
      for (let i = 1; i < monthData.length; i++) {
        if (monthData[i] <= monthData[i-1]) {
          isGrowing = false;
          break;
        }
      }
      
      // Calculate growth percentage
      if (isGrowing && monthData[0] > 0) {
        const growthPercent = ((monthData[monthData.length-1] - monthData[0]) / monthData[0]) * 100;
        return growthPercent > 20; // 20% growth is significant
      }
      
      return false;
    });
    
    if (growingCategories.length > 0) {
      results.push({
        title: 'Growing Expense Categories',
        description: `${growingCategories.map(c => c.name).join(', ')} ${growingCategories.length === 1 ? 'shows' : 'show'} a significant increasing trend. Keep an eye on these expenses and consider setting stricter limits.`,
        type: 'warning',
        priority: 2
      });
    }
    
    if (wellManagedCategories.length > 0) {
      results.push({
        title: 'Good Budget Adherence',
        description: `You've stayed within budget for ${wellManagedCategories.map(c => c.name).join(', ')}. Great job maintaining financial discipline!`,
        type: 'success',
        priority: 3
      });
    }
    
    // Add general recommendations
    if (results.length < 2) {
      results.push({
        title: 'Consider Establishing an Emergency Fund',
        description: 'Financial experts recommend saving 3-6 months of expenses for emergencies. Track your progress in a separate savings category.',
        type: 'info',
        priority: 3
      });
      
      results.push({
        title: 'Review Monthly Subscriptions',
        description: 'Regularly review your recurring expenses and subscriptions. Cancel those you no longer use to optimize your budget.',
        type: 'info',
        priority: 3
      });
    }
    
    // Sort by priority
    return results.sort((a, b) => a.priority - b.priority);
  }, [categories]);

  // Recommendation card component
  const RecommendationCard = ({ recommendation }: { recommendation: RecommendationItem }) => {
    const getIcon = () => {
      switch (recommendation.type) {
        case 'warning':
          return <AlertTriangle className="w-5 h-5 text-amber-500" />;
        case 'success':
          return <Check className="w-5 h-5 text-emerald-500" />;
        case 'info':
          return <TrendingUp className="w-5 h-5 text-blue-500" />;
        default:
          return null;
      }
    };

    const getCardClass = () => {
      switch (recommendation.type) {
        case 'warning':
          return 'border-amber-200 bg-amber-50';
        case 'success':
          return 'border-emerald-200 bg-emerald-50';
        case 'info':
          return 'border-blue-200 bg-blue-50';
        default:
          return '';
      }
    };

    return (
      <div className={`recommendation-card p-4 rounded-lg border mb-3 ${getCardClass()}`}>
        <div className="flex items-start">
          <div className="mr-3 mt-0.5">{getIcon()}</div>
          <div>
            <h4 className="font-semibold text-base mb-1">{recommendation.title}</h4>
            <p className="text-sm text-gray-700">{recommendation.description}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="budget-recommendations-card mb-6">
      <ModernCollapsible
        title="Budget Recommendations"
        defaultOpen={true}
      >
        <CardContent>
          <div className="recommendations-container p-4">
            {recommendations.length === 0 ? (
              <div className="text-center p-6 text-gray-500">
                <p>Continue using your budget to receive personalized recommendations</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">Based on your spending patterns, here are some personalized recommendations to help optimize your budget:</p>
                {recommendations.map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} />
                ))}
              </>
            )}
          </div>
        </CardContent>
      </ModernCollapsible>
    </Card>
  );
}

export default BudgetRecommendations;