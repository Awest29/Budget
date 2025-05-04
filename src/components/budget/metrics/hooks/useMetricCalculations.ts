import { useMemo } from 'react';
import { BudgetCategory } from '@/types/budget';
import { FULL_MONTHS } from '@/types/budget';

// Simple 3-letter month abbreviations for data lookup
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export interface MetricResults {
  // Total Spending
  totalSpending: number;
  previousSpending: number;
  spendingDiffPercentage: number;
  spendingChangeIsNegative: boolean;
  
  // Budget Adherence
  budgetAdherence: number;
  previousAdherence: number;
  adherenceDiff: number;
  adherenceChangeIsPositive: boolean;
  
  // Alert Categories
  alertCategories: BudgetCategory[];
  
  // Debug Info
  debugInfo: {
    totalBudgeted: number;
    totalActual: number;
    totalDeviation: number;
    previousBudgeted: number;
    previousActual: number;
    previousDeviation: number;
    alertCategoryBreakdown: {
      categoryName: string;
      deviationPercent: number;
      isOverBudget: boolean;
    }[];
  };
}

interface UseMetricCalculationsOptions {
  categories: BudgetCategory[];
  selectedMonth?: string;
  isYTD?: boolean;
}

export function useMetricCalculations({
  categories,
  selectedMonth,
  isYTD = false,
}: UseMetricCalculationsOptions): MetricResults {
  
  return useMemo(() => {
    // Determine which month to use (selected month or current month as fallback)
    const currentDate = new Date();
    const systemMonthIndex = currentDate.getMonth();
    const selectedMonthIndex = selectedMonth 
      ? FULL_MONTHS.findIndex(m => m.toLowerCase() === selectedMonth.toLowerCase())
      : systemMonthIndex;
    const monthIndex = selectedMonthIndex >= 0 ? selectedMonthIndex : systemMonthIndex;
    
    // Get the current and previous month abbreviations for data lookups
    const currentMonth = MONTHS[monthIndex];
    const previousMonth = monthIndex > 0 ? MONTHS[monthIndex - 1] : MONTHS[11];
    
    // Initialize tracking variables
    let totalSpending = 0;
    let previousSpending = 0;
    let totalBudgeted = 0;
    let totalActual = 0;
    let totalDeviation = 0;
    let previousBudgeted = 0;
    let previousActual = 0;
    let previousDeviation = 0;
    
    // Track categories with significant deviation
    const alertCategoriesMap = new Map<string, BudgetCategory>();
    const alertCategoryBreakdown: { 
      categoryName: string; 
      deviationPercent: number;
      isOverBudget: boolean;
    }[] = [];
    
    // Process each category
    categories.forEach(category => {
      // Skip income categories - only include expenses
      if (category.type !== 'income') {
        let categoryHasSignificantDeviation = false;
        
        // Process each subheader within the category
        category.subHeaders.forEach(subHeader => {
          // ----- CURRENT PERIOD CALCULATIONS -----
          let subHeaderBudgeted = 0;
          let subHeaderActual = 0;
          
          if (isYTD) {
            // YTD mode: sum up to current month
            for (let i = 0; i <= monthIndex; i++) {
              const month = MONTHS[i];
              
              // Get budgeted amount (from monthlyamounts)
              const budgeted = Math.abs(subHeader.monthlyamounts?.[month] || 0);
              subHeaderBudgeted += budgeted;
              
              // Get actual amount (from budgetValues, or fallback to monthlyamounts)
              const actual = Math.abs((subHeader.budgetValues?.[month] !== undefined
                ? subHeader.budgetValues[month]
                : subHeader.monthlyamounts?.[month]) || 0);
              subHeaderActual += actual;
            }
          } else {
            // Single month mode
            subHeaderBudgeted = Math.abs(subHeader.monthlyamounts?.[currentMonth] || 0);
            subHeaderActual = Math.abs((subHeader.budgetValues?.[currentMonth] !== undefined
              ? subHeader.budgetValues[currentMonth]
              : subHeader.monthlyamounts?.[currentMonth]) || 0);
          }
          
          // Add to total spending and total actual for this period
          totalSpending += subHeaderActual;
          totalActual += subHeaderActual;
          
          // Add to total budgeted if there's a budget set
          if (subHeaderBudgeted > 0) {
            totalBudgeted += subHeaderBudgeted;
            
            // Calculate deviation (absolute difference from budget)
            const deviation = Math.abs(subHeaderActual - subHeaderBudgeted);
            totalDeviation += deviation;
            
            // Check if this subheader has significant deviation (>10%)
            const deviationPercent = (deviation / subHeaderBudgeted) * 100;
            if (deviationPercent > 10) {
              categoryHasSignificantDeviation = true;
              
              // Add to breakdown if this is the first instance for this category
              if (!alertCategoriesMap.has(category.id)) {
                alertCategoryBreakdown.push({
                  categoryName: category.name,
                  deviationPercent: parseFloat(deviationPercent.toFixed(1)),
                  isOverBudget: subHeaderActual > subHeaderBudgeted
                });
              }
            }
          }
          
          // ----- PREVIOUS PERIOD CALCULATIONS -----
          let prevSubHeaderBudgeted = 0;
          let prevSubHeaderActual = 0;
          
          if (isYTD && monthIndex > 0) {
            // Previous YTD: sum up to previous month
            for (let i = 0; i < monthIndex; i++) {
              const month = MONTHS[i];
              
              // Get budgeted amount (from monthlyamounts)
              const budgeted = Math.abs(subHeader.monthlyamounts?.[month] || 0);
              prevSubHeaderBudgeted += budgeted;
              
              // Get actual amount (from budgetValues, or fallback to monthlyamounts)
              const actual = Math.abs((subHeader.budgetValues?.[month] !== undefined
                ? subHeader.budgetValues[month]
                : subHeader.monthlyamounts?.[month]) || 0);
              prevSubHeaderActual += actual;
            }
          } else {
            // Previous month
            prevSubHeaderBudgeted = Math.abs(subHeader.monthlyamounts?.[previousMonth] || 0);
            prevSubHeaderActual = Math.abs((subHeader.budgetValues?.[previousMonth] !== undefined
              ? subHeader.budgetValues[previousMonth]
              : subHeader.monthlyamounts?.[previousMonth]) || 0);
          }
          
          // Add to previous period totals
          previousSpending += prevSubHeaderActual;
          previousActual += prevSubHeaderActual;
          
          // Add to previous period budgeted if there's a budget set
          if (prevSubHeaderBudgeted > 0) {
            previousBudgeted += prevSubHeaderBudgeted;
            
            // Calculate previous period deviation
            const prevDeviation = Math.abs(prevSubHeaderActual - prevSubHeaderBudgeted);
            previousDeviation += prevDeviation;
          }
        });
        
        // If any subheader in this category had a significant deviation, add to alerts
        if (categoryHasSignificantDeviation) {
          alertCategoriesMap.set(category.id, category);
        }
      }
    });
    
    // Extract alert categories as array
    const alertCategories = Array.from(alertCategoriesMap.values());
    
    // Calculate spending difference percentage
    const spendingDiff = totalSpending - previousSpending;
    const spendingDiffPercentage = previousSpending > 0
      ? Math.round((spendingDiff / previousSpending) * 100)
      : 0;
    
    // For spending, an increase is considered negative (costs going up)
    const spendingChangeIsNegative = spendingDiffPercentage > 0;
    
    // Calculate budget adherence percentage
    // Formula: 100 - (totalDeviation / totalBudgeted * 100)
    // 100% means perfect adherence (no deviation)
    const budgetAdherence = totalBudgeted > 0
      ? Math.round(Math.max(0, 100 - ((totalDeviation / totalBudgeted) * 100)))
      : 100;
    
    // Calculate previous period adherence
    const previousAdherence = previousBudgeted > 0
      ? Math.round(Math.max(0, 100 - ((previousDeviation / previousBudgeted) * 100)))
      : 100;
    
    // Calculate adherence difference
    const adherenceDiff = budgetAdherence - previousAdherence;
    
    // For adherence, an increase is positive (sticking closer to budget)
    const adherenceChangeIsPositive = adherenceDiff > 0;
    
    // Return all calculated metrics
    return {
      // Total Spending
      totalSpending,
      previousSpending,
      spendingDiffPercentage,
      spendingChangeIsNegative,
      
      // Budget Adherence
      budgetAdherence,
      previousAdherence,
      adherenceDiff,
      adherenceChangeIsPositive,
      
      // Alert Categories
      alertCategories,
      
      // Debug Info
      debugInfo: {
        totalBudgeted,
        totalActual,
        totalDeviation,
        previousBudgeted,
        previousActual,
        previousDeviation,
        alertCategoryBreakdown
      }
    };
  }, [categories, selectedMonth, isYTD]);
}

export default useMetricCalculations;