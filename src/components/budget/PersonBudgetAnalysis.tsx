import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '../../lib/lib/supabase';
import { FULL_MONTHS, convertBudgetAmount } from '../../types/budget';
import { cn } from '@/lib/utils';
import { BudgetCharts } from './BudgetCharts';
import { getBudgetData } from '../../lib/budgetService';
// Constants
const EXCLUDED_CATEGORIES = ['Internal Transfer', 'Credit Card Payment'];

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
  budget: number; // Add budget field
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
}

interface CategoryResponse {
  id: string;
  name: string;
  type: BudgetItemType;
  budget_sub_headers: {
    id: string;
    name: string;
  }[];
}

interface PersonBudgetAnalysisProps {
  year: number;
}

interface TypeTotal {
  Alex: number;
  Madde: number;
}

interface GroupedCategories {
  [key: string]: Category[];
}
export function PersonBudgetAnalysis({ year }: PersonBudgetAnalysisProps) {
  const [selectedMonth, setSelectedMonth] = useState<typeof FULL_MONTHS[number]>(
    FULL_MONTHS[new Date().getMonth()]
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubHeaders, setExpandedSubHeaders] = useState<Set<string>>(new Set());
  // Add this line near your other useState declarations
  const [budgetData, setBudgetData] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, [selectedMonth, year]);

  async function loadData() {
    setLoading(true);
    try {
      // Use the budget service to get consistent data
      const enrichedCategories = await getBudgetData();
      
      // Filter out excluded categories
      const filteredCategories = enrichedCategories.filter(
        category => !EXCLUDED_CATEGORIES.includes(category.name)
      );
  
      // Calculate date range
      const monthIndex = FULL_MONTHS.indexOf(selectedMonth);
      const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      const lastDayDate = new Date(Date.UTC(year, monthIndex + 1, 0));
      const endDate = lastDayDate.toISOString().split('T')[0];
  
      // Fetch transactions with proper date filtering
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
              const amount = category.type === 'income' ? t.amount : convertBudgetAmount(t.amount, category.type);
              return sum + (amount || 0);
            }, 0);
        
          const Madde = subTransactions
            .filter(t => t.owner === 'Madde')
            .reduce((sum, t) => {
              const amount = category.type === 'income' ? t.amount : convertBudgetAmount(t.amount, category.type);
              return sum + (amount || 0);
            }, 0);
        
          // Get budget amount for the selected month
          const monthKey = selectedMonth.toLowerCase();
          const budget = sub.budgetValues?.[monthKey] || 0;
        
          return {
            id: sub.id,
            name: sub.name,
            Alex,
            Madde,
            budget,
            transactions: subTransactions
          };
        });
  
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

  const toggleSubHeader = (subHeaderId: string) => {
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
    return {
      Alex: typeCategories.reduce((sum, cat) => sum + cat.totalAlex, 0),
      Madde: typeCategories.reduce((sum, cat) => sum + cat.totalMadde, 0)
    };
  };

  // Calculate total spend (Fixed + Variable)
  const totalSpend = {
    Alex: categories
      .filter(cat => cat.type === 'fixed' || cat.type === 'variable')
      .reduce((sum, cat) => sum + cat.totalAlex, 0),
    Madde: categories
      .filter(cat => cat.type === 'fixed' || cat.type === 'variable')
      .reduce((sum, cat) => sum + cat.totalMadde, 0)
  };

  // Calculate grand totals
  const grandTotals = {
    Alex: categories.reduce((sum, cat) => sum + cat.totalAlex, 0),
    Madde: categories.reduce((sum, cat) => sum + cat.totalMadde, 0)
  };

  // Calculate income totals for spend percentage
  const incomeTotals = {
    Alex: categories
      .filter(cat => cat.type === 'income')
      .reduce((sum, cat) => sum + cat.totalAlex, 0),
    Madde: categories
      .filter(cat => cat.type === 'income')
      .reduce((sum, cat) => sum + cat.totalMadde, 0)
  };

  return (
<div className="min-h-screen person-analysis-page" style={{ backgroundColor: 'white' }}>      <div className="app-container">
        <div className="content-card">
          <h2 className="page-title">Person-based Analysis {year}</h2>
          
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4">Select Month</h3>
            <Select 
              value={selectedMonth} 
              onValueChange={(value: typeof FULL_MONTHS[number]) => setSelectedMonth(value)}
            >
              <SelectTrigger className="w-[200px]" style={{ backgroundColor: 'white', color: '#334155' }}>
                <SelectValue placeholder="Select month..." />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'white', color: '#334155' }}>
                {FULL_MONTHS.map((month) => (
                  <SelectItem key={month} value={month} style={{ backgroundColor: 'white', color: '#334155' }}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
  
          <div className="content-card">
            <h3 className="text-lg font-semibold mb-4">Spending Analysis by Person</h3>
            
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="space-y-1 table-container">
                {/* Header Row */}
                <div className="grid grid-cols-10 gap-4 py-2 font-medium border-b">
                  <div className="col-span-4">Category</div>
                  <div className="col-span-2 text-right">Alex</div>
                  <div className="col-span-2 text-right">Madde</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
  
                {/* Categories by Type */}
                {['income', 'fixed', 'variable'].map(type => {
                  const typeTotals = getTypeTotals(type);
                  const typeCategories = groupedCategories[type] || [];
  
                  return (
                    <div key={type} className="space-y-1">
                      {/* Type Header */}
                      <div className="grid grid-cols-10 gap-4 py-2 bg-muted/30">
                        <div className="col-span-4 font-medium">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </div>
                        <div className={cn(
                          "col-span-2 text-right font-medium",
                          typeTotals.Alex < 0 && "negative-value",
                          typeTotals.Alex > 0 && "positive-value"
                        )}>
                          {formatAmount(typeTotals.Alex)}
                        </div>
                        <div className={cn(
                          "col-span-2 text-right font-medium",
                          typeTotals.Madde < 0 && "negative-value",
                          typeTotals.Madde > 0 && "positive-value"
                        )}>
                          {formatAmount(typeTotals.Madde)}
                        </div>
                        <div className={cn(
                          "col-span-2 text-right font-medium",
                          (typeTotals.Alex + typeTotals.Madde) < 0 && "negative-value",
                          (typeTotals.Alex + typeTotals.Madde) > 0 && "positive-value"
                        )}>
                          {formatAmount(typeTotals.Alex + typeTotals.Madde)}
                        </div>
                      </div>
  
                      {/* Categories */}
                      {typeCategories.map(category => (
                        <div key={category.id} className="space-y-1">
                          <div 
                            className="grid grid-cols-10 gap-4 py-1 hover:bg-muted/50 rounded cursor-pointer pl-4"
                            onClick={() => toggleCategory(category.id)}
                          >
                            <div className="col-span-4 flex items-center gap-2">
                              {expandedCategories.has(category.id) ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                              {category.name}
                            </div>
                            <div className={cn(
                              "col-span-2 text-right",
                              category.totalAlex < 0 && "negative-value",
                              category.totalAlex > 0 && "positive-value"
                            )}>
                              {formatAmount(category.totalAlex)}
                            </div>
                            <div className={cn(
                              "col-span-2 text-right",
                              category.totalMadde < 0 && "negative-value",
                              category.totalMadde > 0 && "positive-value"
                            )}>
                              {formatAmount(category.totalMadde)}
                            </div>
                            <div className={cn(
                              "col-span-2 text-right",
                              (category.totalAlex + category.totalMadde) < 0 && "negative-value",
                              (category.totalAlex + category.totalMadde) > 0 && "positive-value"
                            )}>
                              {formatAmount(category.totalAlex + category.totalMadde)}
                            </div>
                          </div>
  
                          {/* Rest of the component remains the same */}
                          {expandedCategories.has(category.id) && category.subHeaders.map(sub => (
                            <React.Fragment key={sub.id}>
                              {/* ... Sub-headers code */}
                            </React.Fragment>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
  
                {/* Total Spend Row */}
                <div className="grid grid-cols-10 gap-4 py-2 font-medium bg-gray-50">
                  <div className="col-span-4">Total Spend</div>
                  <div className="col-span-2 text-right negative-value">
                    {formatAmount(totalSpend.Alex)}
                  </div>
                  <div className="col-span-2 text-right negative-value">
                    {formatAmount(totalSpend.Madde)}
                  </div>
                  <div className="col-span-2 text-right negative-value">
                    {formatAmount(totalSpend.Alex + totalSpend.Madde)}
                  </div>
                </div>
  
                {/* Net Total Row */}
                <div className="grid grid-cols-10 gap-4 py-2 font-medium bg-emerald-50">
                  <div className="col-span-4">Net Total</div>
                  <div className={cn(
                    "col-span-2 text-right",
                    grandTotals.Alex < 0 && "negative-value",
                    grandTotals.Alex > 0 && "positive-value"
                  )}>
                    {formatAmount(grandTotals.Alex)}
                  </div>
                  <div className={cn(
                    "col-span-2 text-right",
                    grandTotals.Madde < 0 && "negative-value",
                    grandTotals.Madde > 0 && "positive-value"
                  )}>
                    {formatAmount(grandTotals.Madde)}
                  </div>
                  <div className={cn(
                    "col-span-2 text-right",
                    (grandTotals.Alex + grandTotals.Madde) < 0 && "negative-value",
                    (grandTotals.Alex + grandTotals.Madde) > 0 && "positive-value"
                  )}>
                    {formatAmount(grandTotals.Alex + grandTotals.Madde)}
                  </div>
                </div>
  
                {/* Spend % of Income Row */}
                <div className="grid grid-cols-10 gap-4 py-2 font-medium bg-blue-50">
                  <div className="col-span-4">Spend % of Income</div>
                  <div className="col-span-2 text-right">
                    {incomeTotals.Alex !== 0 
                      ? Math.abs((totalSpend.Alex / incomeTotals.Alex) * 100).toFixed(1)
                      : "0.0"}%
                  </div>
                  <div className="col-span-2 text-right">
                    {incomeTotals.Madde !== 0 
                      ? Math.abs((totalSpend.Madde / incomeTotals.Madde) * 100).toFixed(1)
                      : "0.0"}%
                  </div>
                  <div className="col-span-2 text-right">
                    {(incomeTotals.Alex + incomeTotals.Madde) !== 0 
                      ? Math.abs(((totalSpend.Alex + totalSpend.Madde) / (incomeTotals.Alex + incomeTotals.Madde)) * 100).toFixed(1)
                      : "0.0"}%
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Charts Section */}
          <div className="content-card">
            <BudgetCharts 
              categories={categories}
              transactions={transactions}
              selectedMonth={selectedMonth}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonBudgetAnalysis;