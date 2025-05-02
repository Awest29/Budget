// src/components/BudgetDashboard.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload, Activity, TrendingUp, ArrowUpRight } from "lucide-react"
import type { BudgetItemType, BudgetCategory, DatabaseBudgetSubHeader } from '../types/budget'
import { SHORT_MONTHS, MONTH_OPTIONS, FULL_MONTHS, MonthOption } from '../types/budget'
import { CategoryDialog } from './budget/CategoryDialog'
import { supabase } from '../lib/lib/supabase'
import { YearlyBudgetView } from './budget/YearlyBudgetView'
import { Table, TableBody, TableHead, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { ConsolidatedBudgetView } from './budget/ConsolidatedBudgetView'
import { TransactionsPage } from './transactions/TransactionsPage'
import { getBudgetData, updateBudgetAmount } from '../lib/budgetService';


const BUDGET_TYPES: { label: string; value: BudgetItemType }[] = [
  { label: "Income", value: "income" },
  { label: "Fixed Costs", value: "fixed" },
  { label: "Variable Costs", value: "variable" },
  { label: "Extraordinary Costs", value: "extraordinary" }
];

interface BudgetDashboardProps {
  year: number;
}

export function BudgetDashboard({ year }: BudgetDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<MonthOption>("January")
  const [selectedType, setSelectedType] = useState<BudgetItemType>("income")
  const [categories, setCategories] = useState<BudgetCategory[]>([])

  async function loadCategories() {
    try {
      const enrichedCategories = await getBudgetData();
      setCategories(enrichedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }
  useEffect(() => {
    loadCategories();
  }, [selectedType]);

  const handleAddSubHeader = async (categoryId: string, name: string) => {
    try {
      const { data: newSubHeader, error } = await supabase
        .from('budget_sub_headers')
        .insert({
          name: name,
          category_id: categoryId,
          monthlyamounts: {},
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();
  
      if (error) throw error;
      
      await loadCategories();
    } catch (error) {
    }
  };

  const handleRenameCategory = async (categoryId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('budget_categories')
        .update({ name: newName })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.map(category => 
        category.id === categoryId ? { ...category, name: newName } : category
      ));
    } catch (error) {
    }
  }

  const handleRenameSubHeader = async (categoryId: string, subHeaderId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('budget_sub_headers')
        .update({ name: newName })
        .eq('id', subHeaderId);

      if (error) throw error;

      setCategories(prev => prev.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            subHeaders: category.subHeaders.map(subHeader =>
              subHeader.id === subHeaderId ? { ...subHeader, name: newName } : subHeader
            )
          }
        }
        return category
      }));
    } catch (error) {
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await supabase
        .from('budget_sub_headers')
        .delete()
        .eq('category_id', categoryId);

      await supabase
        .from('budget_categories')
        .delete()
        .eq('id', categoryId);

      setCategories(prev => prev.filter(category => category.id !== categoryId));
    } catch (error) {
    }
  };

  const handleDeleteSubHeader = async (categoryId: string, subHeaderId: string) => {
    try {
      await supabase
        .from('budget_sub_headers')
        .delete()
        .eq('id', subHeaderId);

      setCategories(prev => prev.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            subHeaders: category.subHeaders.filter(subHeader => subHeader.id !== subHeaderId)
          };
        }
        return category;
      }));
    } catch (error) {
    }
  };

  const handleSaveCategory = async (categoryInput: Omit<BudgetCategory, 'id'>) => {
    try {
      const { data: newCategory, error: categoryError } = await supabase
        .from('budget_categories')
        .insert([{
          name: categoryInput.name,
          type: categoryInput.type,
          monthlyamounts: {}
        }])
        .select('*')
        .single();

      if (categoryError) throw categoryError;
      if (!newCategory) throw new Error('No category data returned');

      for (const sub of categoryInput.subHeaders) {
        const { error: subHeaderError } = await supabase
          .from('budget_sub_headers')
          .insert([{
            name: sub.name,
            category_id: newCategory.id,
            monthlyamounts: {}
          }]);

        if (subHeaderError) {
        }
      }

      await loadCategories();
    } catch (error) {
    }
  };

  const handleUpdateAmount = async (entryId: string, month: string, amount: number | null) => {
    try {
      await updateBudgetAmount(entryId, month, amount);
      await loadCategories(); // Reload all data to ensure consistency
    } catch (error) {
      console.error('Error updating amount:', error);
    }
  };

  const getCurrentCategories = () => {
    const filteredCategories = categories.filter(cat => cat.type === selectedType);
    return filteredCategories;
  }

  const calculateCategoryTotal = (category: BudgetCategory, month: string) => {
    const normalizedMonth = month.toLowerCase();
    
    const total = category.subHeaders.reduce((acc, subHeader) => {
      // Use budgetValues if available, fall back to monthlyamounts
      const monthAmount = 
        (subHeader.budgetValues?.[normalizedMonth] !== undefined
          ? subHeader.budgetValues[normalizedMonth]
          : subHeader.monthlyamounts?.[normalizedMonth]) || 0;
      
      acc += monthAmount;
      return acc;
    }, 0);
  
    return total;
  };
  
  const calculateTypeTotal = (month: string) => {
    // This correctly sums up all category totals
    return getCurrentCategories().reduce((total, category) => {
      return total + calculateCategoryTotal(category, month);
    }, 0);
  };

  const renderTableContent = () => {
    // If no categories, show empty state
    if (getCurrentCategories().length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={13} className="text-center py-8">
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
              <PlusCircle className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No categories added</h3>
              <p className="text-sm text-muted-foreground">
                Add your first {selectedType} category to start budgeting.
              </p>
            </div>
          </TableCell>
        </TableRow>
      );
    }
  
    // Get months to display
    const months = selectedMonth === "Full Year" 
      ? SHORT_MONTHS 
      : [SHORT_MONTHS[FULL_MONTHS.indexOf(selectedMonth)]];
  
    // Return table content
    return (
      <>
        {/* Income Total row */}
        <TableRow className="bg-muted font-bold">
          <TableCell>
            {BUDGET_TYPES.find(t => t.value === selectedType)?.label || selectedType} Total
          </TableCell>
          {months.map(month => (
            <TableCell key={month} className="text-right px-4">
              {calculateTypeTotal(month).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </TableCell>
          ))}
        </TableRow>
  
        {/* Categories and their sub-headers */}
        {getCurrentCategories().map(category => (
          <React.Fragment key={category.id}>
            {/* Individual sub-headers */}
            <YearlyBudgetView
              category={category}
              selectedMonth={selectedMonth}
              onUpdateAmount={handleUpdateAmount}
              onRenameCategory={handleRenameCategory}
              onRenameSubHeader={handleRenameSubHeader}
              onDeleteCategory={handleDeleteCategory}
              onDeleteSubHeader={handleDeleteSubHeader}
              onAddSubHeader={handleAddSubHeader}
              isTypeTotal={false}
            />
          </React.Fragment>
        ))}
      </>
    );
  };


  return (
<div className="min-h-screen" style={{ background: '#334155' }}><div className="budget-card">
        <div className="budget-header">
          <h2 className="budget-title">Budget Summary</h2>
          <p className="budget-subtitle">Overview of your budget across all categories</p>
        </div>
        
        <div className="table-container">
          <ConsolidatedBudgetView categories={categories} />
        </div>
      </div>
    </div>
  );
}

export default BudgetDashboard;