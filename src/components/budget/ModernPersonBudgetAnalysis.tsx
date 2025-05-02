import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import '@/components/budget/budget-table.css';
import '@/components/budget/enhanced-person-analysis.css'; // New enhanced styling
import { ChevronDown, ChevronRight, Users, DollarSign, PieChart, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/lib/supabase';
import { FULL_MONTHS, convertBudgetAmount } from '@/types/budget';
import { BudgetCharts } from './BudgetCharts';
import { getBudgetData } from '@/lib/budgetService';
import { ModernCollapsible } from '../ui/ModernCollapsible';
import { addBudgetValuesForDisplay } from './force-budget-display';

// Get budget amount with proper handling of month and sign convention
const getBudgetAmount = (subHeader: any, selectedMonth: string, type: BudgetItemType, isYTD: boolean = false): number => {
  if (!subHeader.budgetValues && !subHeader.monthlyamounts) return 0;

  const monthKey = selectedMonth.toLowerCase().substring(0, 3);
  
  let amount = 0;
  
  if (isYTD) {
    // Calculate YTD budget by summing all months up to and including the selected month
    const monthIndex = FULL_MONTHS.indexOf(selectedMonth);
    
    for (let i = 0; i <= monthIndex; i++) {
      const currentMonth = FULL_MONTHS[i].toLowerCase().substring(0, 3);
      
      let monthAmount = 0;
      // Try to get from budgetValues first (newer approach)
      if (subHeader.budgetValues && subHeader.budgetValues[currentMonth] !== undefined) {
        monthAmount = subHeader.budgetValues[currentMonth];
      } 
      // Fall back to monthlyamounts (older approach)
      else if (subHeader.monthlyamounts && subHeader.monthlyamounts[currentMonth] !== undefined) {
        monthAmount = subHeader.monthlyamounts[currentMonth];
      }
      
      amount += monthAmount;
    }
  } else {
    // Get budget for a single month
    // Try to get from budgetValues first (newer approach)
    if (subHeader.budgetValues && subHeader.budgetValues[monthKey] !== undefined) {
      amount = subHeader.budgetValues[monthKey];
    } 
    // Fall back to monthlyamounts (older approach)
    else if (subHeader.monthlyamounts && subHeader.monthlyamounts[monthKey] !== undefined) {
      amount = subHeader.monthlyamounts[monthKey];
    }
  }

  // Apply sign convention based on category type
  return type !== 'income' ? -Math.abs(amount) : Math.abs(amount);
};

// Calculate deviation and determine color based on percentage
const getDeviation = (actual: number, budget: number): number => {
  return actual - budget;
};

const getDeviationColor = (amount: number, baseline: number): string => {
  if (baseline === 0) return '';
  const percentage = (amount - baseline) / Math.abs(baseline) * 100;
  
  if (percentage < -10) return "text-red-700 font-medium";
  if (percentage < -5) return "text-red-500 font-medium";
  if (percentage > 10) return "text-green-700 font-medium";
  if (percentage > 5) return "text-green-500 font-medium";
  return "text-gray-600";
};

// Constants
const EXCLUDED_CATEGORIES = ['Internal Transfer', 'Credit Card Payment'];

// Utility function to properly interpret transaction amounts
// This handles refunds correctly by preserving their offsetting behavior
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

type BudgetItemType = 'income' | 'fixed' | 'variable' | 'extraordinary';

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

interface SubHeader {
  id: string;
  name: string;
  Alex: number;
  Madde: number;
  budget: number;
  deviation?: number;
  transactions?: Transaction[];
  budgetValues?: Record<string, number>;
  monthlyamounts?: Record<string, number>;
}

interface Category {
  id: string;
  name: string;
  type: BudgetItemType;
  subHeaders: SubHeader[];
  isExpanded: boolean;
  totalAlex: number;
  totalMadde: number;
  totalBudget: number;
}

interface PersonBudgetAnalysisProps {
  year: number;
}

interface TypeTotal {
  Alex: number;
  Madde: number;
  Budget: number;
  Deviation: number;
}

interface GroupedCategories {
  [key: string]: Category[];
}

interface SummaryCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  colorClass?: string;
}

const SummaryCard = ({ title, value, subValue, icon, colorClass = 'bg-primary-surface text-primary' }: SummaryCardProps) => (
  <div className="summary-card">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="card-title">{title}</h3>
        <p className="card-value">{value}</p>
        {subValue && <p className="card-subvalue">{subValue}</p>}
      </div>
      <div className={`icon-container ${colorClass}`}>
        {icon}
      </div>
    </div>
  </div>
);

export function ModernPersonBudgetAnalysis({ year }: PersonBudgetAnalysisProps) {
  const [selectedMonth, setSelectedMonth] = useState<typeof FULL_MONTHS[number]>(
    FULL_MONTHS[new Date().getMonth()]
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubHeaders, setExpandedSubHeaders] = useState<Set<string>>(new Set());
  const [isYTD, setIsYTD] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedMonth, year, isYTD]);
  
  // Use our force-budget-display function to make budget values show up
  useEffect(() => {
    if (selectedMonth.toLowerCase() === 'january') {
      console.log('Running budget fix...');
      addBudgetValuesForDisplay().then(success => {
        if (success) {
          console.log('Successfully added budget values, reloading data...');
          loadData();
        }
      }).catch(error => console.error('Error adding budget values:', error));
    }
  }, [selectedMonth]);

  async function loadData() {
    setLoading(true);
    try {
      // Use the budget service to get consistent data
      const enrichedCategories = await getBudgetData();
      
      // Filter out excluded categories
      const filteredCategories = enrichedCategories.filter(
        category => !EXCLUDED_CATEGORIES.includes(category.name)
      );
  
      // Calculate date range based on month and YTD selection
      const monthIndex = FULL_MONTHS.indexOf(selectedMonth);
      const startDate = isYTD 
        ? `${year}-01-01` // January 1st for YTD
        : `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`; // First day of selected month
      const lastDayDate = new Date(Date.UTC(year, monthIndex + 1, 0));
      const endDate = lastDayDate.toISOString().split('T')[0]; // Last day of selected month
  
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_date,
          description,
          amount,
          category_id,
          sub_header_id,
          account_type,
          owner
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);
  
      if (transactionsError) throw transactionsError;
  
      setTransactions(transactionsData || []);
  
      // Process categories with budget data and transactions
      const processedCategories = filteredCategories.map((category) => {
        const subHeaders = category.subHeaders.map(sub => {
          const subTransactions = transactionsData?.filter(t => 
            t.sub_header_id === sub.id && t.category_id === category.id
          ) || [];
        
          // Calculate actuals with proper sign convention
          const Alex = subTransactions
            .filter(t => t.owner === 'Alex')
            .reduce((sum, t) => {
              const amount = interpretTransactionAmount(t, category.type);
              return sum + (amount || 0);
            }, 0);
        
          const Madde = subTransactions
            .filter(t => t.owner === 'Madde')
            .reduce((sum, t) => {
              const amount = interpretTransactionAmount(t, category.type);
              return sum + (amount || 0);
            }, 0);
        
          // Get budget amount with proper sign convention and YTD handling
          const budget = getBudgetAmount(sub, selectedMonth, category.type, isYTD);
          
          // Calculate deviation
          const deviation = getDeviation(Alex + Madde, budget);
        
          return {
            id: sub.id,
            name: sub.name,
            Alex,
            Madde,
            budget,
            deviation,
            transactions: subTransactions,
            budgetValues: sub.budgetValues,
            monthlyamounts: sub.monthlyamounts
          };
        });
  
        // Calculate totals for this category
        const totalAlex = subHeaders.reduce((sum, sub) => sum + sub.Alex, 0);
        const totalMadde = subHeaders.reduce((sum, sub) => sum + sub.Madde, 0);
        const totalBudget = subHeaders.reduce((sum, sub) => sum + sub.budget, 0);
  
        return {
          id: category.id,
          name: category.name,
          type: category.type,
          subHeaders,
          isExpanded: false,
          totalAlex,
          totalMadde,
          totalBudget
        };
      });
  
      setCategories(processedCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleSubHeader = (subHeaderId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setExpandedSubHeaders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subHeaderId)) {
        newSet.delete(subHeaderId);
      } else {
        newSet.add(subHeaderId);
      }
      return newSet;
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Group categories by type
  const groupedCategories = categories.reduce((acc: GroupedCategories, category) => {
    if (!acc[category.type]) {
      acc[category.type] = [];
    }
    acc[category.type].push(category);
    return acc;
  }, {});

  // Calculate type totals
  const getTypeTotals = (type: string): TypeTotal => {
    const typeCategories = groupedCategories[type] || [];
    const Alex = typeCategories.reduce((sum, cat) => sum + cat.totalAlex, 0);
    const Madde = typeCategories.reduce((sum, cat) => sum + cat.totalMadde, 0);
    const Budget = typeCategories.reduce((sum, cat) => sum + cat.totalBudget, 0);
    const Deviation = getDeviation(Alex + Madde, Budget);
    
    return {
      Alex,
      Madde,
      Budget,
      Deviation
    };
  };

  // Calculate total spend (Fixed + Variable)
  const totalSpend = {
    Alex: categories
      .filter(cat => cat.type === 'fixed' || cat.type === 'variable')
      .reduce((sum, cat) => sum + cat.totalAlex, 0),
    Madde: categories
      .filter(cat => cat.type === 'fixed' || cat.type === 'variable')
      .reduce((sum, cat) => sum + cat.totalMadde, 0),
    Budget: categories
      .filter(cat => cat.type === 'fixed' || cat.type === 'variable')
      .reduce((sum, cat) => sum + cat.totalBudget, 0)
  };

  // Calculate grand totals
  const grandTotals = {
    Alex: categories.reduce((sum, cat) => sum + cat.totalAlex, 0),
    Madde: categories.reduce((sum, cat) => sum + cat.totalMadde, 0),
    Budget: categories.reduce((sum, cat) => sum + cat.totalBudget, 0)
  };

  // Calculate income totals for spend percentage
  const incomeTotals = {
    Alex: categories
      .filter(cat => cat.type === 'income')
      .reduce((sum, cat) => sum + cat.totalAlex, 0),
    Madde: categories
      .filter(cat => cat.type === 'income')
      .reduce((sum, cat) => sum + cat.totalMadde, 0),
    Budget: categories
      .filter(cat => cat.type === 'income')
      .reduce((sum, cat) => sum + cat.totalBudget, 0)
  };

  // Calculate personal share of spending
  const alexPercentage = totalSpend.Alex + totalSpend.Madde !== 0 
    ? (totalSpend.Alex / (totalSpend.Alex + totalSpend.Madde) * 100).toFixed(1)
    : "0";
    
  const maddePercentage = totalSpend.Alex + totalSpend.Madde !== 0 
    ? (totalSpend.Madde / (totalSpend.Alex + totalSpend.Madde) * 100).toFixed(1)
    : "0";

  return (
    <div className="container mx-auto p-6 person-analysis-container">
      <div className="person-analysis-card">
        <div className="card-header">
          <h2 className="card-title">Person-based Analysis {year}</h2>
          <p className="card-subtitle">Compare spending and income between individuals</p>
        </div>
        
        <div className="card-content">
          {/* Month selector */}
          <div className="month-selector-controls">
            <div className="month-selector">
              <Select 
                value={selectedMonth} 
                onValueChange={(value: typeof FULL_MONTHS[number]) => setSelectedMonth(value)}
              >
                <SelectTrigger className="select-trigger" style={{ backgroundColor: 'white', color: '#0f172a' }}>
                  <SelectValue placeholder="Select month..." />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'white', borderColor: '#e2e8f0' }}>
                  {FULL_MONTHS.map((month) => (
                    <SelectItem key={month} value={month} style={{ backgroundColor: 'white', color: '#0f172a' }}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="ytd-toggle flex items-center space-x-2 ml-4">
              <label className="switch">
                <input type="checkbox" checked={isYTD} onChange={(e) => setIsYTD(e.target.checked)} />
                <span className="slider round"></span>
              </label>
              <span>YTD View</span>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="summary-card-grid">
            <SummaryCard
              title="Alex's Spending"
              value={formatAmount(Math.abs(totalSpend.Alex))}
              subValue={`${alexPercentage}% of total spend`}
              icon={<Users size={20} />}
            />
            <SummaryCard
              title="Madde's Spending"
              value={formatAmount(Math.abs(totalSpend.Madde))}
              subValue={`${maddePercentage}% of total spend`}
              icon={<Users size={20} />}
              colorClass="bg-secondary-surface text-secondary"
            />
            <SummaryCard
              title="Net Savings"
              value={formatAmount(grandTotals.Alex + grandTotals.Madde)}
              subValue="Combined net income"
              icon={<DollarSign size={20} />}
              colorClass={grandTotals.Alex + grandTotals.Madde >= 0 ? "bg-success-surface text-success" : "bg-error-surface text-error"}
            />
            <SummaryCard
              title="Spend % of Income"
              value={`${(incomeTotals.Alex + incomeTotals.Madde) !== 0 
                ? Math.abs(((totalSpend.Alex + totalSpend.Madde) / (incomeTotals.Alex + incomeTotals.Madde)) * 100).toFixed(1)
                : "0.0"}%`}
              subValue="Combined spending rate"
              icon={<TrendingUp size={20} />}
            />
          </div>
          
          {/* Spending Analysis Table */}
          <div className="spending-analysis-section">
            <ModernCollapsible 
              title="Spending Analysis by Person"
              defaultOpen={true}
              className="light-background"
            >
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="spinner"></div>
                </div>
              ) : (
                <div className="mt-4">
                  <table className="person-analysis-table">
                    <thead>
                      <tr>
                        <th style={{ width: '35%' }}>CATEGORY</th>
                        <th className="text-right" style={{ width: '13%' }}>ALEX</th>
                        <th className="text-right" style={{ width: '13%' }}>MADDE</th>
                        <th className="text-right" style={{ width: '13%', fontWeight: 'bold' }}>BUDGET</th>
                        <th className="text-right" style={{ width: '13%' }}>TOTAL</th>
                        <th className="text-right" style={{ width: '13%' }}>DEVIATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Categories by Type */}
                      {['income', 'fixed', 'variable'].map(type => {
                        const typeTotals = getTypeTotals(type);
                        const typeCategories = groupedCategories[type] || [];
                        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
                        
                        return (
                          <React.Fragment key={type}>
                            {/* Type Header Row */}
                            <tr className="major-category-row" style={{ backgroundColor: '#dde5f0' }}>
                              <td>{typeLabel}</td>
                              <td className={`text-right ${type === 'income' ? 'income-value' : 'expense-value'}`}>
                                {formatAmount(Math.abs(typeTotals.Alex))}
                              </td>
                              <td className={`text-right ${type === 'income' ? 'income-value' : 'expense-value'}`}>
                                {formatAmount(Math.abs(typeTotals.Madde))}
                              </td>
                              <td className="text-right">
                                {formatAmount(Math.abs(typeTotals.Budget))}
                              </td>
                              <td className={`text-right ${type === 'income' ? 'income-value' : 'expense-value'}`}>
                                {formatAmount(Math.abs(typeTotals.Alex + typeTotals.Madde))}
                              </td>
                              <td className={cn("text-right", getDeviationColor(typeTotals.Alex + typeTotals.Madde, typeTotals.Budget))}>
                                {formatAmount(typeTotals.Deviation)}
                              </td>
                            </tr>
            
                            {/* Categories */}
                            {typeCategories.map(category => (
                              <React.Fragment key={category.id}>
                                {/* Category Row */}
                                <tr className="category-row">
                                  <td>
                                    <div className="flex items-center cursor-pointer" onClick={() => toggleCategory(category.id)}>
                                      <span className="chevron-container">
                                        {expandedCategories.has(category.id) ? 
                                          <ChevronDown className="chevron-icon" /> : 
                                          <ChevronRight className="chevron-icon" />
                                        }
                                      </span>
                                      {category.name}
                                    </div>
                                  </td>
                                  <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                    {formatAmount(Math.abs(category.totalAlex))}
                                  </td>
                                  <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                    {formatAmount(Math.abs(category.totalMadde))}
                                  </td>
                                  <td className="text-right">
                                    {formatAmount(Math.abs(category.totalBudget))}
                                  </td>
                                  <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                    {formatAmount(Math.abs(category.totalAlex + category.totalMadde))}
                                  </td>
                                  <td className={cn("text-right", getDeviationColor(category.totalAlex + category.totalMadde, category.totalBudget))}>
                                    {formatAmount(getDeviation(category.totalAlex + category.totalMadde, category.totalBudget))}
                                  </td>
                                </tr>
                                
                                {/* Sub-headers - Only visible when category is expanded */}
                                {expandedCategories.has(category.id) && (
                                  <>
                                    {category.subHeaders.map(sub => (
                                      <React.Fragment key={sub.id}>
                                        {/* Sub-header Row */}
                                        <tr className="subcategory-row">
                                          <td>
                                            <div className="flex items-center cursor-pointer" onClick={(e) => toggleSubHeader(sub.id, e)}>
                                              <span className="chevron-container">
                                                {expandedSubHeaders.has(sub.id) ? 
                                                  <ChevronDown className="chevron-icon" /> : 
                                                  <ChevronRight className="chevron-icon" />
                                                }
                                              </span>
                                              {sub.name}
                                            </div>
                                          </td>
                                          <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                            {formatAmount(Math.abs(sub.Alex))}
                                          </td>
                                          <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                            {formatAmount(Math.abs(sub.Madde))}
                                          </td>
                                          <td className="text-right">
                                            {formatAmount(Math.abs(sub.budget))}
                                          </td>
                                          <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                            {formatAmount(Math.abs(sub.Alex + sub.Madde))}
                                          </td>
                                          <td className={cn("text-right", getDeviationColor(sub.Alex + sub.Madde, sub.budget))}>
                                            {formatAmount(sub.deviation || 0)}
                                          </td>
                                        </tr>
                                        
                                        {/* Transactions - Only visible when sub-header is expanded */}
                                        {expandedSubHeaders.has(sub.id) && sub.transactions && sub.transactions.length > 0 && (
                                          sub.transactions.map(transaction => (
                                            <tr key={transaction.id} className="transaction-row">
                                              <td>
                                                <div className="flex items-center gap-3">
                                                  <span className="text-muted-foreground text-sm text-black">
                                                    {new Date(transaction.transaction_date).toLocaleDateString()}
                                                  </span>
                                                  <span>{transaction.description}</span>
                                                </div>
                                              </td>
                                              <td className="text-right">
                                                {transaction.owner === 'Alex' && (
                                                  <span className={transaction.amount < 0 ? 'expense-value' : 'income-value'}>
                                                    {formatAmount(Math.abs(transaction.amount))}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="text-right">
                                                {transaction.owner === 'Madde' && (
                                                  <span className={transaction.amount < 0 ? 'expense-value' : 'income-value'}>
                                                    {formatAmount(Math.abs(transaction.amount))}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="text-right"></td>
                                              <td className="text-right"></td>
                                              <td className="text-right"></td>
                                            </tr>
                                          ))
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </>
                                )}
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Total Spend Row */}
                      <tr className="total-row">
                        <td>Total Spend</td>
                        <td className="text-right expense-value">
                          {formatAmount(Math.abs(totalSpend.Alex))}
                        </td>
                        <td className="text-right expense-value">
                          {formatAmount(Math.abs(totalSpend.Madde))}
                        </td>
                        <td className="text-right">
                          {formatAmount(Math.abs(totalSpend.Budget))}
                        </td>
                        <td className="text-right expense-value">
                          {formatAmount(Math.abs(totalSpend.Alex + totalSpend.Madde))}
                        </td>
                        <td className={cn("text-right", getDeviationColor(totalSpend.Alex + totalSpend.Madde, totalSpend.Budget))}>
                          {formatAmount(getDeviation(totalSpend.Alex + totalSpend.Madde, totalSpend.Budget))}
                        </td>
                      </tr>
            
                      {/* Net Total Row */}
                      <tr className="net-total-row">
                        <td>Net Total</td>
                        <td className={`text-right ${grandTotals.Alex >= 0 ? 'income-value' : 'expense-value'}`}>
                          {formatAmount(grandTotals.Alex)}
                        </td>
                        <td className={`text-right ${grandTotals.Madde >= 0 ? 'income-value' : 'expense-value'}`}>
                          {formatAmount(grandTotals.Madde)}
                        </td>
                        <td className="text-right">
                          {formatAmount(Math.abs(grandTotals.Budget))}
                        </td>
                        <td className={`text-right ${(grandTotals.Alex + grandTotals.Madde) >= 0 ? 'income-value' : 'expense-value'}`}>
                          {formatAmount(grandTotals.Alex + grandTotals.Madde)}
                        </td>
                        <td className={cn("text-right", getDeviationColor(grandTotals.Alex + grandTotals.Madde, grandTotals.Budget))}>
                          {formatAmount(getDeviation(grandTotals.Alex + grandTotals.Madde, grandTotals.Budget))}
                        </td>
                      </tr>

                      {/* Spend % of Income Row */}
                      <tr className="percentage-row">
                        <td>Spend % of Income</td>
                        <td className="text-right">
                          {incomeTotals.Alex !== 0 
                            ? Math.abs((totalSpend.Alex / incomeTotals.Alex) * 100).toFixed(1)
                            : "0.0"}%
                        </td>
                        <td className="text-right">
                          {incomeTotals.Madde !== 0 
                            ? Math.abs((totalSpend.Madde / incomeTotals.Madde) * 100).toFixed(1)
                            : "0.0"}%
                        </td>
                        <td className="text-right">
                          {Math.abs(grandTotals.Budget) !== 0 
                            ? Math.abs((totalSpend.Budget / grandTotals.Budget) * 100).toFixed(1)
                            : "0.0"}%
                        </td>
                        <td className="text-right">
                          {(incomeTotals.Alex + incomeTotals.Madde) !== 0 
                            ? Math.abs(((totalSpend.Alex + totalSpend.Madde) / (incomeTotals.Alex + incomeTotals.Madde)) * 100).toFixed(1)
                            : "0.0"}%
                        </td>
                        <td className="text-right"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </ModernCollapsible>
          </div>
          
          {/* Charts Section */}
          <ModernCollapsible 
            title="Budget Charts"
            defaultOpen={true}
            className="mt-6"
          >
            <div className="p-4">
              <BudgetCharts 
                categories={categories}
                transactions={transactions}
                selectedMonth={selectedMonth}
              />
            </div>
          </ModernCollapsible>
        </div>
      </div>
    </div>
  );
}

export default ModernPersonBudgetAnalysis;