// src/components/budget/comparison/BudgetComparisonPage.tsx

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ComparisonTable } from './ComparisonTable';
import { Month, FULL_MONTHS } from '@/types/budget';

interface BudgetComparisonPageProps {
  year: number;
}

export function BudgetComparisonPage({ year }: BudgetComparisonPageProps) {
  // Set initial month to previous month
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() - 1);
  const initialMonth = FULL_MONTHS[currentDate.getMonth()];

  const [selectedMonth, setSelectedMonth] = useState<Month>(initialMonth);
  const [isYTD, setIsYTD] = useState(false);
  const [budgetData, setBudgetData] = useState<any[]>([]);

  // Handler to receive budget data from ComparisonTable
  const handleBudgetDataUpdate = (data: any[]) => {
    setBudgetData(data);
  };

  return (
<div className="min-h-screen" style={{ background: '#334155' }}>      <div className="app-container">
        <div className="content-card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="page-title">Budget Analysis</h2>
            <div className="flex items-center space-x-4">
              <Select 
                value={selectedMonth} 
                onValueChange={(value) => setSelectedMonth(value as Month)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {FULL_MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isYTD}
                  onCheckedChange={setIsYTD}
                  id="ytd-mode"
                />
                <Label htmlFor="ytd-mode">YTD View</Label>
              </div>
            </div>
          </div>

          <div className="table-container">
            <ComparisonTable 
              month={selectedMonth}
              isYTD={isYTD}
              year={year}
              onBudgetDataUpdate={handleBudgetDataUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}