// src/components/transactions/TransactionsPage.tsx
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploadMaster } from './FileUploadMaster';
import { TransactionList } from './TransactionList';
import { FileList } from './FileList';
import { CollapsibleAccountManagement } from './CollapsibleAccountManagement';
import { CollapsibleFileList } from './CollapsibleFileList';
import './transactions.css';

interface TransactionsPageProps {
  year: number;
}

// Type definitions
type Month = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 
             'July' | 'August' | 'September' | 'October' | 'November' | 'December';
type AccountType = 'bank' | 'credit_card' | 'all';
type Owner = 'Alex' | 'Madde' | 'all';

const MONTHS: Month[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function TransactionsPage({ year }: TransactionsPageProps) {
  // Get current month for default selection
  const currentDate = new Date();
  const defaultMonth = MONTHS[currentDate.getMonth()];

  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<Month>(defaultMonth);
  const [selectedType, setSelectedType] = useState<AccountType>('all');
  const [selectedOwner, setSelectedOwner] = useState<Owner>('all');
  
  // Add refresh trigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger refresh
  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
<div className="min-h-screen bg-slate-800">
      <div className="transactions-container">
        <div>
          <h2 className="transactions-title">Transaction Management {year}</h2>
          
          <div className="filter-bar">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Month Selection */}
              <Select 
                value={selectedMonth} 
                onValueChange={(value: Month) => setSelectedMonth(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
  
              {/* Account Type Selection */}
              <Select 
                value={selectedType} 
                onValueChange={(value: AccountType) => setSelectedType(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
  
              {/* Owner Selection */}
              <Select 
                value={selectedOwner} 
                onValueChange={(value: Owner) => setSelectedOwner(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  <SelectItem value="Alex">Alex</SelectItem>
                  <SelectItem value="Madde">Madde</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
  
          {/* File Upload Section - First */}
          <div className="mb-6">
            <FileUploadMaster 
              year={year} 
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
  
          {/* Transactions Section - Second */}
          <div className="mb-6">
            <TransactionList
              year={year}
              month={selectedMonth}
              accountType={selectedType}
              owner={selectedOwner}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Account Management - Third (Collapsible) */}
          <div className="mb-6">
            <CollapsibleAccountManagement />
          </div>
  
          {/* File List Section - Fourth (Collapsible) */}
          <div className="mb-6">
            <CollapsibleFileList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
}