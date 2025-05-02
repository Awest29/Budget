// src/components/budget/YearlyBudgetView.tsx
import React, { useState } from 'react'
import { TableCell, TableRow } from "@/components/ui/table"
import type { BudgetCategory, MonthOption } from '../../types/budget'
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { SHORT_MONTHS, FULL_MONTHS } from '../../types/budget'
import { updateBudgetAmount } from '../../lib/lib/supabase'
import { CategoryDialog } from './CategoryDialog'

interface YearlyBudgetViewProps {
  category: BudgetCategory;
  onUpdateAmount: (entryId: string, month: string, amount: number | null) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onRenameSubHeader: (categoryId: string, subHeaderId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteSubHeader: (categoryId: string, subHeaderId: string) => void;
  onAddSubHeader: (categoryId: string, name: string) => void;
  selectedMonth: MonthOption;
  isTypeTotal?: boolean;
}

export function YearlyBudgetView({
  category,
  onUpdateAmount,
  onRenameCategory,
  onRenameSubHeader,
  onDeleteCategory,
  onDeleteSubHeader,
  onAddSubHeader,
  selectedMonth,
  isTypeTotal = false
}: YearlyBudgetViewProps) {
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const displayMonths = React.useMemo(() => {
    if (selectedMonth === "Full Year") {
      return SHORT_MONTHS;
    }
    const monthIndex = FULL_MONTHS.indexOf(selectedMonth);
    return monthIndex !== -1 ? [SHORT_MONTHS[monthIndex]] : [];
  }, [selectedMonth]);

  const getMonthTotal = (month: string): number => {
    const monthLower = month.toLowerCase();
    let total = 0;
  
    // Calculate total based on all subheaders
    if (category.subHeaders) {
      category.subHeaders.forEach(subHeader => {
        const amount = subHeader.monthlyamounts?.[monthLower];
        if (typeof amount === 'number') {
          total += amount;
        }
      });
    }
  
    return total;
  };

  console.log('Rendering category:', {
    name: category.name,
    isTypeTotal,
    subHeaders: category.subHeaders.map(sh => ({
      name: sh.name,
      amounts: sh.monthlyamounts
    }))
  });

  return (
    <>
    
    <TableRow
  onMouseEnter={() => setHoveredRow(category.id)}
  onMouseLeave={() => setHoveredRow(null)}
  className={isTypeTotal ? "bg-muted font-bold" : "bg-slate-50"}
>
<TableCell className="font-medium relative min-w-[200px]">
  <div className="flex items-center justify-between">
    <span>{category.name}</span>
    <div className={`ml-2 flex items-center space-x-1 ${!isTypeTotal && hoveredRow === category.id ? "visible" : "invisible"}`}>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditDialogOpen(true)}
        className="h-6 w-6 p-0"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDeleteCategory(category.id)}
        className="h-6 w-6 p-0 text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  </div>
</TableCell>
        {displayMonths.map(month => (
          <TableCell key={month} className="relative px-0">
            <div className="flex items-center justify-end px-4">
              <span className="text-right">
                {getMonthTotal(month).toLocaleString('en-US', {
                  maximumFractionDigits: 0
                })}
              </span>
            </div>
          </TableCell>
        ))}
      </TableRow>

      {!isTypeTotal && category.subHeaders?.map(subHeader => (
        <TableRow 
          key={subHeader.id}
          className="bg-slate-100/50"
        >
          <TableCell className="pl-8">
            <div className="flex items-center space-x-2">
              <span>{subHeader.name}</span>
            </div>
          </TableCell>
          {displayMonths.map(month => (
  <TableCell key={month} className="relative px-0 min-w-[120px]">
    <div className="flex items-center justify-end px-4">
      <input
                  type="text"
                  className="w-full bg-transparent border-none focus:ring-1 text-right"
                  value={
                    typeof subHeader.monthlyamounts?.[month.toLowerCase()] === 'number'
                      ? Math.abs(subHeader.monthlyamounts[month.toLowerCase()]!).toLocaleString('en-US', {
                          maximumFractionDigits: 0
                        })
                      : ''
                  }
                  onFocus={(e) => {
                    const raw = subHeader.monthlyamounts?.[month.toLowerCase()];
                    e.target.value = raw ? Math.abs(raw).toString() : '';
                  }}
                  onBlur={async (e) => {
                    const raw = e.target.value.replace(/,/g, '');
                    try {
                      if (raw) {
                        const value = parseInt(raw);
                        const adjustedValue = category.type === 'income' ? value : -Math.abs(value);
                        await updateBudgetAmount(
                          subHeader.id,
                          month.toLowerCase(),
                          adjustedValue
                        );
                        onUpdateAmount(
                          subHeader.id,
                          month.toLowerCase(),
                          adjustedValue
                        );
                      } else {
                        await updateBudgetAmount(
                          subHeader.id,
                          month.toLowerCase(),
                          null
                        );
                        onUpdateAmount(
                          subHeader.id,
                          month.toLowerCase(),
                          null
                        );
                      }
                    } catch (error) {
                    }
                  }}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    if (raw) {
                      const value = parseInt(raw);
                      const adjustedValue = category.type === 'income' ? value : -Math.abs(value);
                      onUpdateAmount(
                        subHeader.id,
                        month.toLowerCase(),
                        adjustedValue
                      );
                    }
                  }}
                />
              </div>
            </TableCell>
          ))}
        </TableRow>
      ))}

      {!isTypeTotal && (
        <CategoryDialog 
          type={category.type}
          onSave={async (updatedCategory) => {
            try {
              if (updatedCategory.name !== category.name) {
                await onRenameCategory(category.id, updatedCategory.name);
              }
              
              if (updatedCategory.deletedSubHeaderIds) {
                for (const subHeaderId of updatedCategory.deletedSubHeaderIds) {
                  await onDeleteSubHeader(category.id, subHeaderId);
                }
              }
              
              for (const subHeader of updatedCategory.subHeaders) {
                if (subHeader.id) {
                  const existing = category.subHeaders.find(sh => sh.id === subHeader.id);
                  if (existing && existing.name !== subHeader.name) {
                    await onRenameSubHeader(category.id, subHeader.id, subHeader.name);
                  }
                } else {
                  await onAddSubHeader(category.id, subHeader.name);
                }
              }
            } catch (error) {
            } finally {
              setIsEditDialogOpen(false);
            }
          }}
          isEditing={true}
          existingCategory={category}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}