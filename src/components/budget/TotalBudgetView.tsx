// src/components/budget/TotalBudgetView.tsx
import React from 'react';  // Add this import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { BudgetCategory } from '../../types/budget'
import { SHORT_MONTHS } from '../../types/budget'

interface TotalBudgetViewProps {
  categories: BudgetCategory[];
}

export function TotalBudgetView({ categories }: TotalBudgetViewProps) {
  const calculateTotal = (amounts: Record<string, number | null> | undefined): number => {
    if (!amounts) return 0;
    return Object.values(amounts)
      .filter((value): value is number => value !== null)
      .reduce((sum, value) => sum + value, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Category</TableHead>
              {SHORT_MONTHS.map(month => (
                <TableHead key={month}>{month}</TableHead>
              ))}
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(category => (
              <React.Fragment key={category.id}>
                <TableRow>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  {SHORT_MONTHS.map(month => (
                    <TableCell key={month}>
                      {(category.monthlyamounts?.[month.toLowerCase()] ?? 0).toLocaleString('en-US', {
                        maximumFractionDigits: 0
                      })}
                    </TableCell>
                  ))}
                  <TableCell className="font-medium">
                    {calculateTotal(category.monthlyamounts).toLocaleString('en-US', {
                      maximumFractionDigits: 0
                    })}
                  </TableCell>
                </TableRow>
                {category.subHeaders.map(subHeader => (
                  <TableRow key={subHeader.id} className="bg-muted/50">
                    <TableCell className="pl-8 font-medium">{subHeader.name}</TableCell>
                    {SHORT_MONTHS.map(month => (
                      <TableCell key={month}>
                        {(subHeader.monthlyamounts?.[month.toLowerCase()] ?? 0).toLocaleString('en-US', {
                          maximumFractionDigits: 0
                        })}
                      </TableCell>
                    ))}
                    <TableCell className="font-medium pl-8">
                      {calculateTotal(subHeader.monthlyamounts).toLocaleString('en-US', {
                        maximumFractionDigits: 0
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}