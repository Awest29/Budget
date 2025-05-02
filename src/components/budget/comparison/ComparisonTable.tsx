// src/components/budget/comparison/ComparisonTable.tsx
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Month, FULL_MONTHS } from '@/types/budget';
import { supabase } from '@/lib/lib/supabase';
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ChevronDown } from 'lucide-react';

type BudgetItemType = 'income' | 'fixed' | 'variable' | 'extraordinary';

const GROUP_CONFIG: Record<BudgetItemType, { title: string, order: number, bgColor: string }> = {
  'income': { title: 'Income', order: 1, bgColor: 'bg-blue-50/50' },
  'fixed': { title: 'Fixed Costs', order: 2, bgColor: 'bg-red-50/50' },
  'variable': { title: 'Variable Costs', order: 3, bgColor: 'bg-orange-50/50' },
  'extraordinary': { title: 'Extraordinary Items', order: 4, bgColor: 'bg-gray-50/50' }
};

// Categories to exclude from the comparison
const EXCLUDED_CATEGORIES = ['Internal Transfer', 'Credit Card Payment'];

interface ComparisonTableProps {
  month: Month;
  isYTD: boolean;
  year: number;
  onBudgetDataUpdate: (data: any[]) => void;
}

interface CategoryGroup {
  type: BudgetItemType;
  title: string;
  categories: BudgetCategory[];
}

interface BudgetSubHeader {
  id: string;
  name: string;
  monthlyamounts: Record<string, number>;
  category_id: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  type: BudgetItemType;
  sub_headers: BudgetSubHeader[];
}

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

export function ComparisonTable({ month, isYTD, year, onBudgetDataUpdate }: ComparisonTableProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      if (!month || !year) {
        console.log('Missing required props:', { month, year });
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch categories and their sub-headers
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('budget_categories')
          .select(`
            id,
            name,
            type,
            sub_headers:budget_sub_headers(
              id,
              name,
              monthlyamounts,
              category_id
            )
          `);

        if (categoriesError) throw categoriesError;

        // Fetch transactions for the selected period
        const monthIndex = FULL_MONTHS.indexOf(month);
        const monthStr = String(monthIndex + 1).padStart(2, '0');
        const startDate = isYTD ? `${year}-01-01` : `${year}-${monthStr}-01`;

        // Calculate end date using UTC date to ensure we get the last day of month
        const lastDayDate = new Date(Date.UTC(year, monthIndex + 1, 0));
        const endDate = lastDayDate.toISOString().slice(0, 10);

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

        // Filter out excluded categories
        const filteredCategories = (categoriesData || []).filter(
          category => !EXCLUDED_CATEGORIES.includes(category.name)
        );
        
        setCategories(filteredCategories);
        setTransactions(transactionsData || []);
        const budgetSummary = filteredCategories.map(category => {
          const totals = calculateCategoryTotals(category);
          return {
            name: category.name,
            type: category.type,
            budget: totals.budget,
            actual: totals.actual,
            deviation: totals.deviation
          };
        });
        onBudgetDataUpdate(budgetSummary);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
        
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [month, isYTD, year]);

  const getBudgetAmount = (subHeader: BudgetSubHeader): number => {
    if (!subHeader.monthlyamounts) return 0;

    const monthKey = month.toLowerCase().substring(0, 3);
    
    let amount;
    if (isYTD) {
      const monthIndex = FULL_MONTHS.indexOf(month);
      amount = FULL_MONTHS
        .slice(0, monthIndex + 1)
        .reduce((sum, m) => {
          const key = m.toLowerCase().substring(0, 3);
          return sum + (subHeader.monthlyamounts[key] || 0);
        }, 0);
    } else {
      amount = subHeader.monthlyamounts[monthKey] || 0;
    }

    // Find the category type for this sub-header
    const category = categories.find(cat => 
      cat.sub_headers.some(sh => sh.id === subHeader.id)
    );

    // Convert to negative if it's a cost category
    return category?.type !== 'income' ? -Math.abs(amount) : amount;
  };

  const getActualAmount = (subHeaderId: string): number => {
    const relevantTransactions = transactions.filter(t => t.sub_header_id === subHeaderId);
    const total = relevantTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return total;
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

  const calculateCategoryTotals = (category: BudgetCategory) => {
    return category.sub_headers.reduce(
      (totals, subHeader) => {
        const budget = getBudgetAmount(subHeader);
        const actual = getActualAmount(subHeader.id);
        return {
          budget: totals.budget + budget,
          actual: totals.actual + actual,
          deviation: totals.deviation + (actual - budget)
        };
      },
      { budget: 0, actual: 0, deviation: 0 }
    );
  };

  const calculateNetTotals = () => {
    const incomeTotals = categories
      .filter(cat => cat.type === 'income')
      .reduce((totals, category) => {
        const categoryTotals = calculateCategoryTotals(category);
        return {
          actual: totals.actual + categoryTotals.actual,
          budget: totals.budget + categoryTotals.budget
        };
      }, { actual: 0, budget: 0 });

    const fixedTotals = categories
      .filter(cat => cat.type === 'fixed')
      .reduce((totals, category) => {
        const categoryTotals = calculateCategoryTotals(category);
        return {
          actual: totals.actual + categoryTotals.actual,
          budget: totals.budget + categoryTotals.budget
        };
      }, { actual: 0, budget: 0 });

    const variableTotals = categories
      .filter(cat => cat.type === 'variable')
      .reduce((totals, category) => {
        const categoryTotals = calculateCategoryTotals(category);
        return {
          actual: totals.actual + categoryTotals.actual,
          budget: totals.budget + categoryTotals.budget
        };
      }, { actual: 0, budget: 0 });

    const netActual = incomeTotals.actual + fixedTotals.actual + variableTotals.actual;
    const netBudget = incomeTotals.budget + fixedTotals.budget + variableTotals.budget;
    const netDeviation = netActual - netBudget;
    const netPercentage = netBudget !== 0 ? (netDeviation / Math.abs(netBudget)) * 100 : 0;

    return {
      net: {
        actual: netActual,
        budget: netBudget,
        deviation: netDeviation,
        percentage: netPercentage
      }
    };
  };

  const groupCategories = (categories: BudgetCategory[]): CategoryGroup[] => {
    const grouped = categories.reduce((acc, category) => {
      const group = acc.find(g => g.type === category.type);
      if (group) {
        group.categories.push(category);
      } else {
        acc.push({
          type: category.type,
          title: GROUP_CONFIG[category.type]?.title || category.type,
          categories: [category]
        });
      }
      return acc;
    }, [] as CategoryGroup[]);

    return grouped.sort((a, b) => 
      (GROUP_CONFIG[a.type]?.order || 99) - (GROUP_CONFIG[b.type]?.order || 99)
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  const netTotals = calculateNetTotals();

  return (
    <Table className="budget-comparison-table">
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-[300px]">Category</TableHead>
          <TableHead className="text-right">Actual</TableHead>
          <TableHead className="text-right">Budget</TableHead>
          <TableHead className="text-right">Deviation</TableHead>
          <TableHead className="text-right">%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupCategories(categories).map(group => {
          const groupTotals = group.categories.reduce(
            (totals, category) => {
              const categoryTotals = calculateCategoryTotals(category);
              return {
                actual: totals.actual + categoryTotals.actual,
                budget: totals.budget + categoryTotals.budget,
                deviation: totals.deviation + categoryTotals.deviation
              };
            },
            { actual: 0, budget: 0, deviation: 0 }
          );

          const percentage = groupTotals.budget !== 0 
            ? (groupTotals.deviation / groupTotals.budget) * 100 
            : 0;

          return (
            <React.Fragment key={group.type}>
              {/* Group Header */}
              <TableRow 
                className={cn(
                  "cursor-pointer hover:brightness-95 font-bold group-header",
                  GROUP_CONFIG[group.type]?.bgColor
                )}
                data-type={group.type}
                onClick={() => {
                  setExpandedGroups(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(group.type)) {
                      newSet.delete(group.type);
                    } else {
                      newSet.add(group.type);
                    }
                    return newSet;
                  });
                }}
              >
                <TableCell>
                  <div className="flex items-center">
                    {expandedGroups.has(group.type) ? (
                      <ChevronDown className="h-4 w-4 mr-2" style={{ color: '#000000' }} />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" style={{ color: '#000000' }} />
                    )}
                    {group.title}
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {groupTotals.actual.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {groupTotals.budget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-bold",
                  getDeviationColor(groupTotals.actual, groupTotals.budget)
                )}>
                  {groupTotals.deviation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-bold",
                  getDeviationColor(groupTotals.actual, groupTotals.budget)
                )}>
                  {percentage.toFixed(1)}%
                </TableCell>
              </TableRow>

              {/* Categories */}
              {expandedGroups.has(group.type) && group.categories.map(category => {
                const totals = calculateCategoryTotals(category);
                const categoryPercentage = totals.budget !== 0 
                  ? (totals.deviation / totals.budget) * 100 
                  : 0;
                  
                return (
                  <React.Fragment key={category.id}>
                    <TableRow 
                      className="hover:bg-muted/20 cursor-pointer category-row"
                      data-type={category.type}
                      onClick={() => {
                        setExpandedCategories(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(category.id)) {
                            newSet.delete(category.id);
                          } else {
                            newSet.add(category.id);
                          }
                          return newSet;
                        });
                      }}
                    >
                      <TableCell className="pl-8">
                        <div className="flex items-center">
                        {expandedCategories.has(category.id) ? (
                            <ChevronDown className="h-4 w-4 mr-2" style={{ color: '#000000' }} />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-2" style={{ color: '#000000' }} />
                          )}
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {totals.actual.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right">
                        {totals.budget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right",
                        getDeviationColor(totals.actual, totals.budget)
                      )}>
                        {totals.deviation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right",
                        getDeviationColor(totals.actual, totals.budget)
                      )}>
                        {categoryPercentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>

                    {/* Sub-headers */}
                    {expandedCategories.has(category.id) && category.sub_headers?.map(subHeader => {
                      const budget = getBudgetAmount(subHeader);
                      const actual = getActualAmount(subHeader.id);
                      const deviation = actual - budget;
                      const percentage = budget !== 0 ? (deviation / budget) * 100 : 0;
                      const subHeaderTransactions = transactions.filter(t => t.sub_header_id === subHeader.id);

                      return (
                        <React.Fragment key={subHeader.id}>
                          <TableRow 
                            className="bg-muted/5 hover:bg-muted/10 cursor-pointer subcategory-row"
                            data-type={category.type}
                            onClick={() => {
                              setExpandedTransactions(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(subHeader.id)) {
                                  newSet.delete(subHeader.id);
                                } else {
                                  newSet.add(subHeader.id);
                                }
                                return newSet;
                              });
                            }}
                          >
                            <TableCell className="pl-16">
                              <div className="flex items-center">
                                {expandedTransactions.has(subHeader.id) ? (
                                  <ChevronDown className="h-4 w-4 mr-2" style={{ color: '#000000' }} />
                                ) : (
                                  <ChevronRight className="h-4 w-4 mr-2" style={{ color: '#000000' }} />
                                )}
                                {subHeader.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                            <span className={actual < 0 ? "negative-value" : "positive-value"}>
                                {actual.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                            <TableCell className="text-right">
                            <span className={budget < 0 ? "negative-value" : "positive-value"}>
                                {budget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                            <TableCell className={cn(
                              "text-right",
                              getDeviationColor(actual, budget)
                            )}>
                              {deviation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right",
                              getDeviationColor(actual, budget)
                            )}>
                              {percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>

                          {/* Transactions */}
                          {expandedTransactions.has(subHeader.id) && subHeaderTransactions.map(transaction => (
                            <TableRow key={transaction.id} className="hover:bg-muted/5">
                              <TableCell className="pl-24 py-1">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(transaction.transaction_date).toLocaleDateString()}
                                  </span>
                                  <span>{transaction.description}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-1">
                                <div className="flex items-center justify-end gap-4">
                                  <span className="text-sm text-muted-foreground">
                                    {transaction.owner}
                                  </span>
                                  <span>{transaction.amount.toLocaleString('en-US', { 
                                    maximumFractionDigits: 0,
                                    minimumFractionDigits: 0
                                  })}</span>
                                </div>
                              </TableCell>
                              <TableCell />
                              <TableCell />
                              <TableCell />
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Net Total Row */}
        <TableRow className="net-income-row font-bold text-lg border-t-2">
          <TableCell>Net Total</TableCell>
          <TableCell className="text-right">
            {netTotals.net.actual.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </TableCell>
          <TableCell className="text-right">
            {netTotals.net.budget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </TableCell>
          <TableCell className="text-right">
            {netTotals.net.deviation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </TableCell>
          <TableCell className="text-right">
            {netTotals.net.percentage.toFixed(1)}%
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}