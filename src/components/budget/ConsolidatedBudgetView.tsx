import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  SHORT_MONTHS, 
  BudgetCategory, 
  BudgetItemType
} from '../../types/budget';
import { updateBudgetAmount, getBudgetData } from '../../lib/budgetService';

const BUDGET_TYPE_ORDER: BudgetItemType[] = ['income', 'fixed', 'variable', 'extraordinary'];
const TYPE_LABELS: Record<BudgetItemType, string> = {
  income: 'Income',
  fixed: 'Fixed Costs',
  variable: 'Variable Costs',
  extraordinary: 'Extraordinary Costs'
};

interface MonthlyTotal {
  [key: string]: number;
}

interface TypeSummary {
  total: number;
  monthly: MonthlyTotal;
  categories: Array<{
    id: string;
    name: string;
    total: number;
    monthly: MonthlyTotal;
    subHeaders: Array<{
      id: string;
      name: string;
      total: number;
      monthly: MonthlyTotal;
      rawValues?: Record<string, number | null>;
    }>;
  }>;
}

interface BudgetTotals {
  [key: string]: TypeSummary;
}

export function ConsolidatedBudgetView({ categories: initialCategories }: { categories: BudgetCategory[] }) {
  const [expandedTypes, setExpandedTypes] = React.useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{id: string, month: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<{id: string, month: string, status: 'saving' | 'success' | 'error'} | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories);

  // Function implementations... (toggleType, toggleCategory, startEdit, saveEdit, etc.)
  // These remain the same from your original file

  const toggleType = (type: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleCategory = (categoryId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  // Function to handle starting edit mode
  const startEdit = (subHeaderId: string, month: string, currentValue: number) => {
    setEditing({ id: subHeaderId, month });
    setEditValue(currentValue.toString());
  };

  // Function to handle saving edited values
  const saveEdit = async () => {
    if (!editing) return;
    
    try {
      setSaveStatus({...editing, status: 'saving'});
      const value = editValue === '' ? null : parseFloat(editValue);
      await updateBudgetAmount(editing.id, editing.month, value);
      
      // Show success indicator
      setSaveStatus({...editing, status: 'success'});
      
      // Immediately update local state to reflect the change
      setCategories(prevCategories => {
        return prevCategories.map(category => ({
          ...category,
          subHeaders: category.subHeaders.map(subHeader => {
            if (subHeader.id === editing.id) {
              // Create a new budgetValues object if it doesn't exist
              const budgetValues = subHeader.budgetValues || {};
              // Update the specific month value
              const updatedBudgetValues = {
                ...budgetValues,
                [editing.month.toLowerCase()]: value
              };
              // Return updated subHeader with new budgetValues
              return {
                ...subHeader,
                budgetValues: updatedBudgetValues
              };
            }
            return subHeader;
          })
        }));
      });
      
      // Clear success status after delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 1500);
    } catch (error) {
      console.error('Error updating budget value:', error);
      setSaveStatus({...editing, status: 'error'});
      setTimeout(() => {
        setSaveStatus(null);
      }, 1500);
    } finally {
      setEditing(null);
      setEditValue('');
    }
  };

  // Handle cancel edit
  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission behavior
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Also fetch fresh data periodically or after updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const freshData = await getBudgetData();
        setCategories(freshData);
      } catch (error) {
        console.error('Error fetching updated budget data:', error);
      }
    };
    
    // Fetch fresh data after edit is complete
    if (saveStatus?.status === 'success') {
      // Small delay to allow database update to complete
      const timer = setTimeout(() => {
        fetchData();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Effect to update categories when initialCategories changes
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const calculateTotals = React.useCallback(() => {
    const totals: BudgetTotals = {};

    // Initialize structure
    BUDGET_TYPE_ORDER.forEach(type => {
      totals[type] = {
        total: 0,
        monthly: SHORT_MONTHS.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: 0
        }), {}),
        categories: []
      };
    });

    // Process categories
    categories.forEach(category => {
      const type = category.type;
      const categoryTotal = {
        id: category.id,
        name: category.name,
        total: 0,
        monthly: {} as MonthlyTotal,
        subHeaders: []
      };

      // Initialize category monthly totals
      SHORT_MONTHS.forEach(month => {
        categoryTotal.monthly[month.toLowerCase()] = 0;
      });

      // Process sub-headers
      category.subHeaders.forEach(subHeader => {
        const subHeaderTotal = {
          id: subHeader.id,
          name: subHeader.name,
          total: 0,
          monthly: {} as MonthlyTotal,
          rawValues: {} as Record<string, number | null>
        };

        // Process each month
        SHORT_MONTHS.forEach(month => {
          const normalizedMonth = month.toLowerCase();
          
          // Check budgetValues first, then fall back to monthlyamounts
          const amount = (
            subHeader.budgetValues?.[normalizedMonth] !== undefined
              ? subHeader.budgetValues[normalizedMonth]
              : subHeader.monthlyamounts?.[normalizedMonth]
          ) || 0;
          
          // Store original value
          subHeaderTotal.rawValues[normalizedMonth] = amount;
          
          // Store in sub-header total
          subHeaderTotal.monthly[normalizedMonth] = amount;
          subHeaderTotal.total += amount;

          // Add to category totals
          categoryTotal.monthly[normalizedMonth] += amount;
          categoryTotal.total += amount;

          // Add to type totals
          totals[type].monthly[normalizedMonth] += amount;
          totals[type].total += amount;
        });

        categoryTotal.subHeaders.push(subHeaderTotal);
      });

      totals[type].categories.push(categoryTotal);
    });

    return totals;
  }, [categories]);

  const totals = calculateTotals();



  return (
    <div>

      {/* Budget table */}
      <Table className="budget-table">
        <TableHeader>
          <TableRow>
            <TableHead>Category Type</TableHead>
            {SHORT_MONTHS.map(month => (
              <TableHead key={month}>{month}</TableHead>
            ))}
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Rest of the table code unchanged */}
          {BUDGET_TYPE_ORDER.map(type => (
            <React.Fragment key={type}>
              <TableRow 
                className="category-row" 
                onClick={() => toggleType(type)}
              >
                <TableCell>
                  <div className="flex items-center">
                    <span className={`chevron-icon ${expandedTypes.has(type) ? 'chevron-down' : ''}`}>▶</span>
                    <span>{TYPE_LABELS[type]}</span>
                  </div>
                </TableCell>
                {SHORT_MONTHS.map(month => {
                  const value = totals[type].monthly[month.toLowerCase()] || 0;
                  const isNegative = type !== 'income' && value !== 0;
                  return (
                    <TableCell key={month} className={isNegative ? 'negative-value' : ''}>
                      {(isNegative ? '-' : '') + Math.abs(value).toLocaleString('en-US', {
                        maximumFractionDigits: 0
                      })}
                    </TableCell>
                  );
                })}
                <TableCell className={type !== 'income' ? 'negative-value' : ''}>
                  {(type !== 'income' ? '-' : '') + Math.abs(totals[type].total).toLocaleString('en-US', {
                    maximumFractionDigits: 0
                  })}
                </TableCell>
              </TableRow>
    
              {/* The rest of your categories and subheaders rendering logic... */}
              {expandedTypes.has(type) && totals[type].categories.map(category => (
                <React.Fragment key={category.id}>
                  <TableRow 
                    className="bg-blue-50/70 border-t border-blue-100 cursor-pointer hover:bg-blue-50/90"
                    onClick={(e) => toggleCategory(category.id, e)}
                  >
                    <TableCell className="pl-8">
                      <div className="flex items-center space-x-2">
                        <span className={`chevron-icon ${expandedCategories.has(category.id) ? 'chevron-down' : ''}`}>▶</span>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    {SHORT_MONTHS.map(month => {
                      const value = category.monthly[month.toLowerCase()] || 0;
                      const isNegative = type !== 'income' && value !== 0;
                      return (
                        <TableCell key={month} className={isNegative ? 'negative-value' : ''}>
                          {(isNegative ? '-' : '') + Math.abs(value).toLocaleString('en-US', {
                            maximumFractionDigits: 0
                          })}
                        </TableCell>
                      );
                    })}
                    <TableCell className={type !== 'income' ? 'negative-value' : ''}>
                      {(type !== 'income' ? '-' : '') + Math.abs(category.total).toLocaleString('en-US', {
                        maximumFractionDigits: 0
                      })}
                    </TableCell>
                  </TableRow>
    
                  {expandedCategories.has(category.id) && category.subHeaders.map(subHeader => (
                    <TableRow key={subHeader.id} className="bg-gray-50/50 hover:bg-blue-50/30">
                      <TableCell className="pl-12 text-sm">
                        {subHeader.name}
                      </TableCell>
                      {SHORT_MONTHS.map(month => {
                        const normalizedMonth = month.toLowerCase();
                        const value = subHeader.monthly[normalizedMonth] || 0;
                        const isEditing = editing?.id === subHeader.id && editing?.month === normalizedMonth;
                        const isSaving = saveStatus?.id === subHeader.id && saveStatus?.month === normalizedMonth;
                        const isNegative = type !== 'income' && value !== 0;
                        
                        return (
                          <TableCell 
                            key={month} 
                            className={`p-0 ${isSaving && saveStatus?.status === 'success' ? 'bg-green-100' : isSaving && saveStatus?.status === 'error' ? 'bg-red-100' : ''}`}
                          >
                            {isEditing ? (
                              <Input
                                type="text"
                                value={editValue}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^[0-9]*$/.test(value)) {
                                    setEditValue(value);
                                  }
                                }}
                                onBlur={saveEdit}
                                onKeyDown={handleKeyPress}
                                className="h-8 w-full !appearance-none"
                                autoFocus
                                style={{ 
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'textfield'
                                }}
                              />
                            ) : (
                              <div 
                                className={`p-2 w-full h-full cursor-pointer text-right hover:bg-blue-50/50 ${isNegative ? 'negative-value' : ''}`}
                                onClick={() => startEdit(subHeader.id, normalizedMonth, Math.abs(value))}
                              >
                                {(isNegative ? '-' : '') + Math.abs(value).toLocaleString('en-US', {
                                  maximumFractionDigits: 0
                                })}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className={type !== 'income' ? 'negative-value' : ''}>
                        {(type !== 'income' ? '-' : '') + Math.abs(subHeader.total).toLocaleString('en-US', {
                          maximumFractionDigits: 0
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
    
          {/* Net Income row */}
          <TableRow className="net-income-row">
            <TableCell>Net Income</TableCell>
            {SHORT_MONTHS.map(month => {
              const normalizedMonth = month.toLowerCase();
              const income = totals['income'].monthly[normalizedMonth] || 0;
              const expenses = BUDGET_TYPE_ORDER
                .filter(type => type !== 'income')
                .reduce((sum, type) => sum + (totals[type].monthly[normalizedMonth] || 0), 0);
              const netValue = income + expenses;
              return (
                <TableCell key={month} className={netValue >= 0 ? 'positive-value' : 'negative-value'}>
                  {netValue.toLocaleString('en-US', {
                    maximumFractionDigits: 0
                  })}
                </TableCell>
              );
            })}
            <TableCell className={
              (totals['income'].total + 
              BUDGET_TYPE_ORDER
                .filter(type => type !== 'income')
                .reduce((sum, type) => sum + totals[type].total, 0)) >= 0 
                  ? 'positive-value' 
                  : 'negative-value'
            }>
              {(
                totals['income'].total + 
                BUDGET_TYPE_ORDER
                  .filter(type => type !== 'income')
                  .reduce((sum, type) => sum + totals[type].total, 0)
              ).toLocaleString('en-US', {
                maximumFractionDigits: 0
              })}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}