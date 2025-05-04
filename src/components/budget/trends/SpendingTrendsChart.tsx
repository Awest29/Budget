/**
 * Spending Trends Chart Component
 * 
 * This component visualizes actual spending data over time using a stacked area chart,
 * organizing expenses into two tiers of categories:
 * 
 * 1. Primary Categories: Fixed Costs, Variable Costs, Extraordinary, Income
 * 2. Secondary Categories: Logical groupings within each primary category (e.g., Mortgage, Utilities)
 * 
 * Key behaviors:
 * - Shows monthly values (NOT cumulative) - each month shows its own discrete amount
 * - Displays months from January up to the selected month
 * - Uses actual transaction data, not budget values
 * - Allows filtering by expense category type (fixed, variable, extraordinary, income)
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BudgetCategory } from '@/types/budget';
import type { BudgetItemType } from '@/types/budget';
import { FULL_MONTHS } from '@/types/budget';
import { Check } from 'lucide-react';
import './spending-trends.css';

// Transaction interface
interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  category_id: string | null;
  sub_header_id: string | null;
  account_type: string;
  owner: string;
}

// Utility function to properly interpret transaction amounts for each category type
function interpretTransactionAmount(transaction: Transaction, categoryType: BudgetItemType): number {
  // For income categories, maintain original sign (positive = income)
  if (categoryType === 'income') {
    return transaction.amount;
  }
  
  // For expense categories (fixed, variable, extraordinary)
  // We want expenses to be negative and refunds to be positive
  
  // Credit card transactions: expenses are already negative, refunds are positive
  if (transaction.account_type === 'credit_card') {
    // If transaction amount is negative, it's an expense - keep it negative
    // If transaction amount is positive, it's a refund - keep it positive to offset expenses
    return transaction.amount;
  }
  
  // Bank account transactions: expenses are negative, refunds are positive
  // For consistency with our sign convention, we keep the original sign
  return transaction.amount;
}

// Helper function to get transactions for a specific category and subcategory
function getTransactionsForSubHeader(
  transactions: Transaction[], 
  categoryId: string, 
  subHeaderId: string, 
  month: string,
  monthIndex: number,
  year: number
): Transaction[] {
  // Calculate date range for the specified month
  const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const endDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  return transactions.filter(t => 
    t.category_id === categoryId && 
    t.sub_header_id === subHeaderId &&
    t.transaction_date >= startDate &&
    t.transaction_date <= endDate
  );
}

// Constants
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EXCLUDED_CATEGORIES = ['Internal Transfer', 'Credit Card Payment', 'Transfer'];
const COLORS = {
  fixed: '#4285F4',    // Google Blue
  variable: '#34A853', // Google Green
  extraordinary: '#FBBC05', // Google Yellow
  income: '#EA4335',   // Google Red
  total: '#5F6368',    // Google Grey
};

// Color palettes for subcategories
const SUBCATEGORY_COLORS = [
  '#4285F4', // Blue
  '#34A853', // Green
  '#FBBC05', // Yellow
  '#EA4335', // Red
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FF9800', // Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63', // Pink
  '#3F51B5', // Indigo
  '#009688', // Teal
  '#CDDC39', // Lime
  '#FF5722', // Deep Orange
  '#8BC34A', // Light Green
  '#2196F3', // Light Blue
  '#FFC107', // Amber
  '#03A9F4', // Light Blue
  '#673AB7', // Deep Purple
  '#4CAF50'  // Green
];

// Types
interface SpendingTrendsChartProps {
  categories: BudgetCategory[];
  year: number;
  selectedMonth?: string;
  isYtdMode?: boolean; 
  transactions?: Transaction[];
}

type CategoryKey = 'fixed' | 'variable' | 'extraordinary' | 'income';

// Interface for monthly category data
interface CategoryData {
  month: string;
  [key: string]: number | string;
  total?: number;
}

// Helper to get category color based on index
const getCategoryColor = (categoryType: string, categoryName: string, index: number) => {
  // Use specific colors for primary categories
  if (COLORS[categoryType as CategoryKey]) {
    if (categoryName.startsWith('Other')) {
      // Use a lighter shade for "Other" categories
      return `${COLORS[categoryType as CategoryKey]}90`; // 90 is hex for 56% opacity
    }
    
    // For non-"Other" categories, use the specific subcategory color
    return SUBCATEGORY_COLORS[index % SUBCATEGORY_COLORS.length];
  }
  
  // Fallback color
  return SUBCATEGORY_COLORS[index % SUBCATEGORY_COLORS.length];
};

// Store of prepared data by category type
interface CategoryDataStore {
  [key: string]: CategoryData[];
}

// Enhanced tooltip component with subcategory breakdown
const CustomTooltip = ({ active, payload, label, activeCategory, categories, transactions, year, showDetailedDebug }: any) => {
  if (active && payload && payload.length) {
    // If an active category is provided, find it in the payload
    let hoveredItem = null;
    
    if (activeCategory) {
      hoveredItem = payload.find(item => item.dataKey === activeCategory);
    }
    
    // Fallback: if no active category found or provided, use the first non-zero value
    if (!hoveredItem) {
      const nonZeroItems = payload.filter(item => Math.abs(item.value) > 0);
      hoveredItem = nonZeroItems.length > 0 ? nonZeroItems[0] : payload[0];
    }
    
    // Find the category and get subcategory breakdown
    const category = categories.find((c: any) => c.name.trim() === hoveredItem.name);
    
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <div className="tooltip-value">
          <div 
            className="tooltip-color" 
            style={{ backgroundColor: hoveredItem.color }}
          ></div>
          <span style={{ fontWeight: 600 }}>{hoveredItem.name}: </span>
          <span style={{ marginLeft: '4px' }}>
            {hoveredItem.value < 0 ? '-' : ''}{Math.abs(hoveredItem.value).toLocaleString('sv-SE', {
              style: 'decimal',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </span>
        </div>
        
        {/* Subcategory breakdown - only shown when showDetailedDebug is true */}
        {category && showDetailedDebug && (
          <div className="tooltip-subcategories">
            <div className="tooltip-divider"></div>
            <p className="tooltip-subtitle">Subcategory breakdown:</p>
            {category.subHeaders.map((subHeader: any) => {
              // Get month index for the current label
              const monthIndex = MONTH_NAMES.findIndex(m => m === label);
              if (monthIndex === -1) return null;
              
              // Get transactions for this subheader in this month
              const subTransactions = getTransactionsForSubHeader(
                transactions,
                category.id,
                subHeader.id,
                MONTHS[monthIndex],
                monthIndex,
                year
              );
              
              // Calculate amount
              let amount = 0;
              if (subTransactions.length > 0) {
                amount = subTransactions.reduce((sum, t) => {
                  const transactionAmount = interpretTransactionAmount(t, category.type);
                  return sum + (transactionAmount || 0); // Preserve sign for net spending
                }, 0);
              }
              
              // Only show subcategories with transactions
              if (amount === 0) return null;
              
              return (
                <div key={subHeader.id} className="tooltip-subcategory">
                  <span className="tooltip-subcategory-name">{subHeader.name}:</span>
                  <span className="tooltip-subcategory-value">
                    {amount < 0 ? '-' : ''}{Math.abs(amount).toLocaleString('sv-SE', {
                      style: 'decimal',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
              );
            })}
            <div className="tooltip-divider"></div>
            <div className="tooltip-budget">
              <span className="tooltip-budget-label">Budget amount:</span>
              <span className="tooltip-budget-value">
                {category.subHeaders.reduce((sum: number, sh: any) => {
                  const monthLower = label.toLowerCase();
                  const budgetValue = sh.budgetValues?.[monthLower] !== undefined 
                    ? sh.budgetValues[monthLower] 
                    : sh.monthlyamounts?.[monthLower];
                  return sum + (budgetValue || 0); // Show budget with sign
                }, 0) < 0 ? '-' : ''}
                {Math.abs(category.subHeaders.reduce((sum: number, sh: any) => {
                  const monthLower = label.toLowerCase();
                  const budgetValue = sh.budgetValues?.[monthLower] !== undefined 
                    ? sh.budgetValues[monthLower] 
                    : sh.monthlyamounts?.[monthLower];
                  return sum + (budgetValue || 0); 
                }, 0)).toLocaleString('sv-SE', {
                  style: 'decimal',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function SpendingTrendsChart({ 
  categories, 
  year, 
  selectedMonth,
  isYtdMode = false,
  transactions = []
}: SpendingTrendsChartProps) {
  console.log('SpendingTrendsChart render with month:', selectedMonth);
  console.log(`Processing ${transactions.length} transactions for chart`);
  
  // State for active category filter
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('fixed');
  // State to track active tooltip category
  const [activeTooltipCategory, setActiveTooltipCategory] = useState<string | null>(null);
  // State to toggle detailed debugging
  const [showDetailedDebug, setShowDetailedDebug] = useState<boolean>(true);

  // Debug function to log subcategory breakdown for a specific category
  const logCategoryBreakdown = useCallback((categoryName: string, monthName: string) => {
    // Find the category
    const category = categories.find(c => c.name.trim() === categoryName);
    if (!category) {
      console.log(`Category ${categoryName} not found in categories`);
      return;
    }
    
    // Find the month index
    const monthIndex = MONTH_NAMES.findIndex(m => m === monthName);
    if (monthIndex === -1) {
      console.log(`Month ${monthName} not found`);
      return;
    }
    
    console.log(`===== CATEGORY BREAKDOWN: ${categoryName} (${category.type}) for ${monthName} =====`);
    console.log(`Category ID: ${category.id}`);
    
    // For each subheader, find transactions and calculate total
    category.subHeaders.forEach(subHeader => {
      const subTransactions = getTransactionsForSubHeader(
        transactions,
        category.id,
        subHeader.id,
        MONTHS[monthIndex],
        monthIndex,
        year
      );
      
      // Calculate amount from transactions
      let subTotal = 0;
      if (subTransactions.length > 0) {
        subTotal = subTransactions.reduce((sum, t) => {
          const transactionAmount = interpretTransactionAmount(t, category.type);
          return sum + (transactionAmount || 0); // Preserve sign for better debugging
        }, 0);
      }
      
      console.log(`  - ${subHeader.name} (ID: ${subHeader.id}): ${subTotal} (${subTransactions.length} transactions)`);
      
      // Log individual transactions for detailed inspection if there are any
      if (subTransactions.length > 0) {
        console.log(`    Transactions:`);
        subTransactions.forEach(tx => {
          console.log(`      Date: ${tx.transaction_date}, Amount: ${tx.amount}, Description: ${tx.description}`);
        });
      }
    });
    
    console.log(`============================================`);
  }, [categories, transactions, year]);

  // Get the months to display based on selected month
  const getMonthsToDisplay = useCallback(() => {
    if (!selectedMonth) {
      console.log('No month selected, using current month');
      const currentDate = new Date();
      const currentMonthIndex = currentDate.getMonth();
      return Array.from(
        { length: currentMonthIndex + 1 },
        (_, i) => ({
          monthIndex: i,
          month: MONTHS[i],
          displayName: MONTH_NAMES[i]
        })
      );
    }
    
    // First try to find month index by full name (case insensitive)
    const monthIndex = FULL_MONTHS.findIndex(
      m => m.toLowerCase() === selectedMonth.toLowerCase()
    );
    
    let selectedMonthIndex = 0;
    
    if (monthIndex >= 0) {
      console.log(`Found month index for ${selectedMonth}: ${monthIndex}`);
      selectedMonthIndex = monthIndex;
    } else {
      // Try with first 3 chars
      const shortMonthIndex = MONTHS.findIndex(
        m => m.toLowerCase() === selectedMonth.substring(0, 3).toLowerCase()
      );
      
      if (shortMonthIndex >= 0) {
        console.log(`Found short month index for ${selectedMonth}: ${shortMonthIndex}`);
        selectedMonthIndex = shortMonthIndex;
      } else {
        console.log(`Could not find month index for ${selectedMonth}, using January`);
        selectedMonthIndex = 0;
      }
    }
    
    // Always show Jan to selected month
    return Array.from(
      { length: selectedMonthIndex + 1 },
      (_, i) => ({
        monthIndex: i,
        month: MONTHS[i],
        displayName: MONTH_NAMES[i]
      })
    );
  }, [selectedMonth]);
  
  // Get chart title based on selected month
  const getChartTitle = useCallback(() => {
    const displayMonth = selectedMonth || FULL_MONTHS[new Date().getMonth()];
    return `Monthly ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Expenses (Jan-${displayMonth} ${year})`;
  }, [selectedMonth, year, selectedCategory]);
  
  // Process transaction data by category and month
  const categoryDataStore = useMemo<CategoryDataStore>(() => {
    const store: CategoryDataStore = {
      fixed: [],
      variable: [],
      extraordinary: [],
      income: []
    };
    
    console.log('Creating category data store');
    
    // Get the months we need to display
    const monthsToDisplay = getMonthsToDisplay();
    console.log('Months to display:', monthsToDisplay.map(m => m.displayName));
    
    // Process each category type
    (Object.keys(store) as CategoryKey[]).forEach(categoryType => {
      // Get categories of this type
      const categoriesOfType = categories.filter(c => c.type === categoryType);
      console.log(`Processing ${categoryType} categories:`, categoriesOfType.length);
      
      // Skip if no categories of this type
      if (categoriesOfType.length === 0) return;
      
      // Get all unique category names to use as columns in our data
      const categoryNames = categoriesOfType.map(c => c.name.trim())
        .filter(name => name && !EXCLUDED_CATEGORIES.includes(name));
      
      console.log(`Category names for ${categoryType}:`, categoryNames);
      
      // Initialize data for each month
      const monthlyData: CategoryData[] = monthsToDisplay.map(({ displayName }) => {
        const dataPoint: CategoryData = { month: displayName };
        
        // Initialize all categories with 0
        categoryNames.forEach(name => {
          dataPoint[name] = 0;
        });
        
        // Initialize total
        dataPoint.total = 0;
        
        return dataPoint;
      });
      
      // Process transactions for each month
      monthsToDisplay.forEach((displayMonth, dataIndex) => {
        const { month, monthIndex, displayName } = displayMonth;
        let monthTotal = 0;
        
        // Process each category
        categoriesOfType.forEach(category => {
          const categoryName = category.name.trim();
          
          // Skip excluded categories
          if (EXCLUDED_CATEGORIES.includes(categoryName)) return;
          
          // Get all transactions for this category in this month
          let categoryTotal = 0;
          
          // Process each subheader
          category.subHeaders.forEach(subHeader => {
            // Get transactions for this subheader in this month
            const subTransactions = getTransactionsForSubHeader(
              transactions,
              category.id,
              subHeader.id,
              month,
              monthIndex,
              year
            );
            
            if (subHeader.name === 'Travel' && displayName === 'Mar') {
              console.log(`Found ${subTransactions.length} transactions for Travel in March`, subTransactions);
            }
            
            // Calculate amount from transactions
            if (subTransactions.length > 0) {
              // Sum all transactions preserving sign convention
              // We no longer use Math.abs() to match the table's net spending calculation
              // This means expenses will show as negative values, refunds as positive
              const amount = subTransactions.reduce((sum, t) => {
                const transactionAmount = interpretTransactionAmount(t, category.type);
                return sum + (transactionAmount || 0); // Preserve signs to show net spending
              }, 0);
              
              if (subHeader.name === 'Travel' && displayName === 'Mar') {
                console.log(`Travel transactions in March total (with signs preserved): ${amount}`);
              }
              
              // Add to category total
              categoryTotal += amount;
            }
          });
          
          // Add to monthly data
          if (monthlyData[dataIndex][categoryName] !== undefined) {
            monthlyData[dataIndex][categoryName] = categoryTotal;
            
            // Update total for the month
            monthTotal += categoryTotal;
          }
        });
        
        // Set total for this month
        monthlyData[dataIndex].total = monthTotal;
        
        console.log(`${categoryType} total for ${displayName}: ${monthTotal}`);
      });
      
      // Store in the data store
      store[categoryType] = monthlyData;
    });
    
    return store;
  }, [categories, transactions, year, getMonthsToDisplay]);
  
  // Get category names for the current selected category type
  const categoryNames = useMemo(() => {
    // Get all unique category names for the selected category type
    const cats = categories
      .filter(c => c.type === selectedCategory)
      .map(c => c.name.trim())
      .filter(name => name && !EXCLUDED_CATEGORIES.includes(name));
    
    return cats;
  }, [categories, selectedCategory]);
  
  // Get chart data for the selected category
  const chartData = useMemo(() => {
    return categoryDataStore[selectedCategory] || [];
  }, [categoryDataStore, selectedCategory]);

  // Get descriptor text based on selected category
  const getCategoryDescription = (category: CategoryKey): string => {
    switch(category) {
      case 'fixed':
        return "Fixed expenses (shown as negative values) tend to remain consistent month to month, such as rent, loan payments, and subscriptions.";
      case 'variable':
        return "Variable expenses (shown as negative values) fluctuate based on your spending habits, including dining out, shopping, and entertainment.";
      case 'extraordinary':
        return "Extraordinary expenses (shown as negative values) are occasional or unexpected costs that fall outside your regular budget categories.";
      case 'income':
        return "Income (shown as positive values) represents money coming in from various sources like salary, dividends, or other revenue streams.";
      default:
        return "";
    }
  };

  // Add debug output for transactions
  useEffect(() => {
    if (transactions.length > 0) {
      // Get all distinct category_id and sub_header_id combinations
      const categorySubHeaderPairs = new Set<string>();
      transactions.forEach(t => {
        if (t.category_id && t.sub_header_id) {
          categorySubHeaderPairs.add(`${t.category_id}:${t.sub_header_id}`);
        }
      });
      
      console.log(`Transaction data has ${categorySubHeaderPairs.size} unique category/subheader combinations`);
      
      // Log breakdown of all categories in February
      const categoriesToDebug = ['Food', 'Retail', 'Travel', 'Wine', 'Medical'];
      categoriesToDebug.forEach(catName => {
        // Find the category
        const category = categories.find(c => c.name.trim() === catName);
        if (!category) return;
        
        console.log(`===== CATEGORY BREAKDOWN: ${catName} (${category.type}) for Feb =====`);
        console.log(`Category ID: ${category.id}`);
        
        // For each subheader, find transactions and calculate total
        let categoryTotal = 0;
        category.subHeaders.forEach(subHeader => {
          const subTransactions = getTransactionsForSubHeader(
            transactions,
            category.id,
            subHeader.id,
            'feb',
            1, // February index
            year
          );
          
          // Calculate amount from transactions
          let subTotal = 0;
          if (subTransactions.length > 0) {
            subTotal = subTransactions.reduce((sum, t) => {
              const transactionAmount = interpretTransactionAmount(t, category.type);
              return sum + (transactionAmount || 0); // Preserve sign for debugging
            }, 0);
            categoryTotal += subTotal;
          }
          
          console.log(`  - ${subHeader.name} (ID: ${subHeader.id}): ${subTotal} (${subTransactions.length} transactions)`);
          
          // Log first few transactions for detailed inspection if there are any
          if (subTransactions.length > 0) {
            const samplesToShow = Math.min(3, subTransactions.length);
            console.log(`    Sample transactions (showing ${samplesToShow} of ${subTransactions.length}):`);
            subTransactions.slice(0, samplesToShow).forEach(tx => {
              console.log(`      Date: ${tx.transaction_date}, Amount: ${tx.amount}, Description: ${tx.description}`);
            });
          }
        });
        
        // Compare with budget value
        const februaryBudget = category.subHeaders.reduce((sum, sh) => {
          const budgetValue = sh.budgetValues?.feb !== undefined ? sh.budgetValues.feb : sh.monthlyamounts?.feb;
          return sum + (budgetValue || 0);
        }, 0);
        
        console.log(`  ** TOTAL Transactions (with signs preserved): ${categoryTotal}`);
        console.log(`  ** BUDGET Amount: ${februaryBudget}`);
        console.log(`  ** DIFFERENCE: ${categoryTotal - (februaryBudget || 0)}`);
        console.log(`============================================`);
      });
    }
  }, [transactions, categories, year]);

  return (
    <div className="spending-trends-chart">
      {/* Chart Filters */}
      <div className="chart-filters">
        {/* Category buttons */}
        <div className="category-filters">
          {(['fixed', 'variable', 'extraordinary', 'income'] as CategoryKey[]).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-btn ${selectedCategory === category ? 'selected' : ''}`}
              style={{
                backgroundColor: selectedCategory === category ? COLORS[category] : '#f0f0f0',
                color: selectedCategory === category ? 'white' : '#333',
                borderColor: COLORS[category]
              }}
            >
              <div className="btn-content">
                <div 
                  className="category-indicator"
                  style={{ backgroundColor: COLORS[category] }}
                ></div>
                <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                {selectedCategory === category && <Check size={14} className="check-icon" />}
              </div>
            </button>
          ))}
        </div>
        
        {/* Debug toggle button */}
        <div className="debug-toggle">
          <button 
            className={`debug-btn ${showDetailedDebug ? 'active' : ''}`}
            onClick={() => setShowDetailedDebug(!showDetailedDebug)}
            title="Toggle detailed subcategory breakdown in tooltips"
          >
            {showDetailedDebug ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        {transactions.length === 0 ? (
          <div className="no-data-message">
            <p>No transaction data available for {selectedCategory} expenses.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload transactions in the Transactions tab to see spending trends.
            </p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#333', fontSize: 12 }}
                tickLine={{ stroke: '#e0e0e0' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fill: '#333', fontSize: 12 }}
                tickLine={{ stroke: '#e0e0e0' }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => {
                  // Format with sign
                  const isNegative = value < 0;
                  const formattedValue = Math.abs(value).toLocaleString('sv-SE', {
                    style: 'decimal',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  });
                  return isNegative ? `-${formattedValue}` : formattedValue;
                }}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    activeCategory={activeTooltipCategory} 
                    categories={categories} 
                    transactions={transactions} 
                    year={year}
                    showDetailedDebug={showDetailedDebug}
                  />
                } 
                isAnimationActive={true}
                cursor={{ stroke: '#f0f0f0', strokeWidth: 2, strokeDasharray: '3 3' }}
                wrapperStyle={{ zIndex: 1000 }}
                position={{ y: 0 }}
              />
              <Legend />
              
              {/* Stack all categories - using Bar instead of Area for better handling of negative values */}
              {categoryNames.map((catName, index) => (
                <Bar
                  key={catName}
                  dataKey={catName}
                  name={catName}
                  stackId="1"
                  fill={getCategoryColor(selectedCategory, catName, index)}
                  stroke={getCategoryColor(selectedCategory, catName, index)}
                  fillOpacity={0.8}
                  onMouseEnter={() => setActiveTooltipCategory(catName)}
                  onMouseLeave={() => setActiveTooltipCategory(null)}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-message">
            <p>No data available for {selectedCategory} expenses</p>
          </div>
        )}
      </div>

      {/* Insights and interpretation */}
      <div className="chart-insights">
        <h4>{getChartTitle()}</h4>
        <p>
          This chart shows your <strong>monthly net spending</strong> (actual expenses minus refunds) by category.
          The chart displays data from January through the selected month, using the same calculation method as the Budget vs Actual table.
          {getCategoryDescription(selectedCategory)}
        </p>
        <p><strong>Important:</strong> Each month shows its own discrete net spending value (not cumulative). Negative values indicate expenses, while positive values represent income.</p>
        <ul>
          <li>The height of each colored section represents net spending in that category for that month</li>
          <li>The total height shows your total {selectedCategory} net impact for each individual month</li>
          <li>Hover over the chart to see detailed breakdowns for each month</li>
          <li>Click a different category button above to switch views</li>
        </ul>
        <div className="chart-explanation-note">
          <p>
            <strong>Note:</strong> This chart now shows net spending impact (expenses minus refunds),
            matching the calculation method used in the Budget vs Actual table above.
            Negative values represent expenses, while positive values represent income or refunds.
          </p>
        </div>

        {transactions.length === 0 && (
          <div className="chart-explanation-note">
            <p>
              <strong>Note:</strong> No transaction data is available. The budget table above shows planned budget values, 
              while this chart is designed to show actual spending from transactions.
            </p>
            <p className="text-sm mt-2">
              Upload transactions in the Transactions tab to see your actual spending patterns visualized here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpendingTrendsChart;