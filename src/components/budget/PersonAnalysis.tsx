// src/components/budget/PersonAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Users, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from '@/lib/lib/supabase';
import { FULL_MONTHS, convertBudgetAmount } from '@/types/budget';
import { getBudgetData } from '@/lib/budgetService';
import { ModernCollapsible } from '../ui/ModernCollapsible';
import { cn } from '@/lib/utils';
import { DirectReplacementCharts } from './DirectReplacementCharts';

// Import required CSS
import "@/components/budget/budget-table.css";
import "@/components/budget/person-analysis-fix.css";

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
  transactions?: Transaction[];
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

interface PersonAnalysisProps {
  year: number;
}

interface TypeTotal {
  Alex: number;
  Madde: number;
  Budget: number;
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

// Summary Card Component - Consistent with other parts of the app
const SummaryCard = ({ title, value, subValue, icon, colorClass = 'bg-primary-surface text-primary' }: SummaryCardProps) => (
  <Card className="summary-card">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm text-muted-foreground mb-1">{title}</h3>
          <p className="text-2xl font-semibold">{value}</p>
          {subValue && <p className="text-sm text-muted-foreground mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-md ${colorClass}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export function PersonAnalysis({ year }: PersonAnalysisProps) {
  // State management
  const [selectedMonth, setSelectedMonth] = useState<typeof FULL_MONTHS[number]>(
    FULL_MONTHS[new Date().getMonth()]
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubHeaders, setExpandedSubHeaders] = useState<Set<string>>(new Set());
  
  // Load data when month or year changes
  useEffect(() => {
    loadData();
  }, [selectedMonth, year]);

  // Data loading function
  async function loadData() {
    setLoading(true);
    try {
      // Get budget data
      const enrichedCategories = await getBudgetData();
      
      // Filter out excluded categories
      const filteredCategories = enrichedCategories.filter(
        category => !EXCLUDED_CATEGORIES.includes(category.name)
      );
  
      // Calculate date range for the selected month
      const monthIndex = FULL_MONTHS.indexOf(selectedMonth);
      const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      const lastDayDate = new Date(Date.UTC(year, monthIndex + 1, 0));
      const endDate = lastDayDate.toISOString().split('T')[0];
  
      // Fetch transactions for the date range
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
          // Find transactions for this subheader
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
        
          // Calculate Madde's spending
          const Madde = subTransactions
            .filter(t => t.owner === 'Madde')
            .reduce((sum, t) => {
              const amount = interpretTransactionAmount(t, category.type);
              return sum + (amount || 0);
            }, 0);
        
          // Get budget amount for the selected month - ensure lowercase for consistency
          const monthKey = selectedMonth.toLowerCase();
          
          // Check both direct budgetValues and monthlyamounts for backward compatibility
          let budget = 0;
          if (sub.budgetValues && sub.budgetValues[monthKey] !== undefined) {
            budget = sub.budgetValues[monthKey];
          } else if (sub.monthlyamounts && sub.monthlyamounts[monthKey] !== undefined) {
            budget = sub.monthlyamounts[monthKey];
          }
        
          return {
            id: sub.id,
            name: sub.name,
            Alex,
            Madde,
            budget,
            transactions: subTransactions
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

  // UI interaction handlers
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

  // Format utility for numbers
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Group categories by type for display
  const groupedCategories = categories.reduce((acc: GroupedCategories, category) => {
    if (!acc[category.type]) {
      acc[category.type] = [];
    }
    acc[category.type].push(category);
    return acc;
  }, {});

  // Calculate totals by type (income, fixed, variable)
  const getTypeTotals = (type: string): TypeTotal => {
    const typeCategories = groupedCategories[type] || [];
    return {
      Alex: typeCategories.reduce((sum, cat) => sum + cat.totalAlex, 0),
      Madde: typeCategories.reduce((sum, cat) => sum + cat.totalMadde, 0),
      Budget: typeCategories.reduce((sum, cat) => sum + cat.totalBudget, 0)
    };
  };

  // Calculate total spending (Fixed + Variable)
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

  // Calculate overall totals
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

  // Render transactions for a sub-header - using consistent table styling
  const renderSubHeaderTransactions = (transactions: Transaction[] = []) => {
    if (!transactions.length) return null;
    
    return (
      <div className="mt-2 pl-8">
        <table className="budget-table">
          <thead>
            <tr className="budget-table-header">
              <th>Date</th>
              <th>Description</th>
              <th>Owner</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id} className="item-row">
                <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                <td>{transaction.description}</td>
                <td>{transaction.owner}</td>
                <td className={`text-right ${transaction.amount < 0 ? 'expense-value' : 'income-value'}`}>
                  {formatAmount(Math.abs(transaction.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 person-analysis-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Person-based Analysis {year}</h2>
          <p className="card-subtitle">Compare spending and income between individuals</p>
        </div>
        
        <div className="card-content">
          {/* Month selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Select Month</label>
            <Select 
              value={selectedMonth} 
              onValueChange={(value: typeof FULL_MONTHS[number]) => setSelectedMonth(value)}
            >
              <SelectTrigger className="w-[200px] select-trigger" style={{ backgroundColor: 'white', color: '#334155' }}>
                <SelectValue placeholder="Select month..." />
              </SelectTrigger>
              <SelectContent className="select-content" style={{ backgroundColor: 'white', color: '#334155' }}>
                {FULL_MONTHS.map((month) => (
                  <SelectItem key={month} value={month} className="select-item" style={{ backgroundColor: 'white', color: '#334155' }}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Summary Cards - Using consistent Card components */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <SummaryCard
              title="Alex's Spending"
              value={formatAmount(Math.abs(totalSpend.Alex))}
              subValue={`${alexPercentage}% of total spend`}
              icon={<Users size={24} />}
            />
            <SummaryCard
              title="Madde's Spending"
              value={formatAmount(Math.abs(totalSpend.Madde))}
              subValue={`${maddePercentage}% of total spend`}
              icon={<Users size={24} />}
              colorClass="bg-secondary-surface text-secondary"
            />
            <SummaryCard
              title="Net Savings"
              value={formatAmount(grandTotals.Alex + grandTotals.Madde)}
              subValue="Combined net income"
              icon={<DollarSign size={24} />}
              colorClass={grandTotals.Alex + grandTotals.Madde >= 0 ? "bg-success-surface text-success" : "bg-error-surface text-error"}
            />
            <SummaryCard
              title="Spend % of Income"
              value={`${(incomeTotals.Alex + incomeTotals.Madde) !== 0 
                ? Math.abs(((totalSpend.Alex + totalSpend.Madde) / (incomeTotals.Alex + incomeTotals.Madde)) * 100).toFixed(1)
                : "0.0"}%`}
              subValue="Combined spending rate"
              icon={<TrendingUp size={24} />}
            />
          </div>
          
          {/* Spending Analysis Table - Using ModernCollapsible consistently */}
          <ModernCollapsible 
            title="Spending Analysis by Person"
            defaultOpen={true}
          >
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="table-container mt-4">
                <table className="budget-table">
                  <thead>
                    <tr className="budget-table-header">
                      <th className="w-1/3">Category</th>
                      <th className="w-1/6 text-right">Alex</th>
                      <th className="w-1/6 text-right">Madde</th>
                      <th className="w-1/6 text-right">Budget</th>
                      <th className="w-1/6 text-right">Total</th>
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
                          <tr className="category-row">
                            <td className="category-name">{typeLabel}</td>
                            <td className={`text-right ${type === 'income' ? 'income-value' : 'expense-value'}`}>
                              {formatAmount(Math.abs(typeTotals.Alex))}
                            </td>
                            <td className={`text-right ${type === 'income' ? 'income-value' : 'expense-value'}`}>
                              {formatAmount(Math.abs(typeTotals.Madde))}
                            </td>
                            <td className={`text-right ${type === 'income' ? 'income-value' : 'expense-value'}`}>
                              {formatAmount(Math.abs(typeTotals.Budget))}
                            </td>
                            <td className={`text-right ${type === 'income' ? 'income-value' : 'expense-value'}`}>
                              {formatAmount(Math.abs(typeTotals.Alex + typeTotals.Madde))}
                            </td>
                          </tr>
  
                          {/* Categories */}
                          {typeCategories.map(category => (
                            <tr key={`category-${category.id}`}>
                              <td className="subcategory-name">
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleCategory(category.id)}>
                                  {expandedCategories.has(category.id) ?
                                    <ChevronDown className="h-4 w-4" /> :
                                    <ChevronRight className="h-4 w-4" />
                                  }
                                  {category.name}
                                </div>
                              </td>
                              <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                {formatAmount(Math.abs(category.totalAlex))}
                              </td>
                              <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                {formatAmount(Math.abs(category.totalMadde))}
                              </td>
                              <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                {formatAmount(Math.abs(category.totalBudget))}
                              </td>
                              <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                {formatAmount(Math.abs(category.totalAlex + category.totalMadde))}
                              </td>
                            </tr>
                            {expandedCategories.has(category.id) && (
                              <tr key={`category-content-${category.id}`}>
                                <td colSpan={5} className="p-0">
                              <div className="p-0">
                                {/* Sub-headers */}
                                {category.subHeaders.map(sub => (
                                  <tr key={`sub-header-${sub.id}`}>
                                    <td className="pl-8 border-t border-divider">
                                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSubHeader(sub.id)}>
                                        {expandedSubHeaders.has(sub.id) ?
                                          <ChevronDown className="h-4 w-4" /> :
                                          <ChevronRight className="h-4 w-4" />
                                        }
                                        {sub.name}
                                      </div>
                                    </td>
                                    <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                      {formatAmount(Math.abs(sub.Alex))}
                                    </td>
                                    <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                      {formatAmount(Math.abs(sub.Madde))}
                                    </td>
                                    <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                      {formatAmount(Math.abs(sub.budget))}
                                    </td>
                                    <td className={`text-right ${category.type === 'income' ? 'income-value' : 'expense-value'}`}>
                                      {formatAmount(Math.abs(sub.Alex + sub.Madde))}
                                    </td>
                                  </tr>
                                  <tr key={`sub-content-${sub.id}`} className="collapsible-row" style={{ display: expandedSubHeaders.has(sub.id) ? 'table-row' : 'none' }}>
                                    <td colSpan={5}>
                                      {sub.transactions && sub.transactions.length > 0 && renderSubHeaderTransactions(sub.transactions)}
                                    </td>
                                  </tr>
                                ))}
                              </div>
                                </td>
                              </tr>
                            )}
                          ))}
                        </React.Fragment>
                      );
                    })}
                    
                    {/* Total Spend Row */}
                    <tr className="total-row">
                      <td className="category-name">Total Spend</td>
                      <td className="text-right expense-value">
                        {formatAmount(Math.abs(totalSpend.Alex))}
                      </td>
                      <td className="text-right expense-value">
                        {formatAmount(Math.abs(totalSpend.Madde))}
                      </td>
                      <td className="text-right expense-value">
                        {formatAmount(Math.abs(totalSpend.Budget))}
                      </td>
                      <td className="text-right expense-value">
                        {formatAmount(Math.abs(totalSpend.Alex + totalSpend.Madde))}
                      </td>
                    </tr>
  
                    {/* Net Total Row */}
                    <tr className="total-row">
                      <td className="category-name">Net Total</td>
                      <td className={`text-right ${grandTotals.Alex >= 0 ? 'income-value' : 'expense-value'}`}>
                        {formatAmount(grandTotals.Alex)}
                      </td>
                      <td className={`text-right ${grandTotals.Madde >= 0 ? 'income-value' : 'expense-value'}`}>
                        {formatAmount(grandTotals.Madde)}
                      </td>
                      <td className={`text-right ${grandTotals.Budget >= 0 ? 'income-value' : 'expense-value'}`}>
                        {formatAmount(grandTotals.Budget)}
                      </td>
                      <td className={`text-right ${(grandTotals.Alex + grandTotals.Madde) >= 0 ? 'income-value' : 'expense-value'}`}>
                        {formatAmount(grandTotals.Alex + grandTotals.Madde)}
                      </td>
                    </tr>
                    
                    {/* Spend % of Income Row */}
                    <tr className="total-row">
                      <td className="category-name">Spend % of Income</td>
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
                        {incomeTotals.Budget !== 0
                          ? Math.abs((totalSpend.Budget / incomeTotals.Budget) * 100).toFixed(1)
                          : "0.0"}%
                      </td>
                      <td className="text-right">
                        {(incomeTotals.Alex + incomeTotals.Madde) !== 0 
                          ? Math.abs(((totalSpend.Alex + totalSpend.Madde) / (incomeTotals.Alex + incomeTotals.Madde)) * 100).toFixed(1)
                          : "0.0"}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </ModernCollapsible>
          
          {/* Charts Section */}
          <ModernCollapsible 
            title="Budget Charts"
            defaultOpen={true}
            className="mt-6"
          >
            <div className="p-4" style={{ backgroundColor: 'white' }}>
              <DirectReplacementCharts 
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

export default PersonAnalysis;