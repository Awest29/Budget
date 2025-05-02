import React, { useState } from 'react';
import { EnhancedFileUploadMaster } from './EnhancedFileUploadMaster';
import { ModernTransactionList } from './ModernTransactionList';
import { ModernAccountManagement } from './ModernAccountManagement';
import { ModernFileList } from './ModernFileList';
import { Filter } from 'lucide-react';

// Type definitions
type Month = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 
             'July' | 'August' | 'September' | 'October' | 'November' | 'December';
type AccountType = 'bank' | 'credit_card' | 'all';
type Owner = 'Alex' | 'Madde' | 'all';

const MONTHS: Month[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface ModernTransactionsPageProps {
  year: number;
}

export function ModernTransactionsPage({ year }: ModernTransactionsPageProps) {
  // Get current month for default selection
  const currentDate = new Date();
  const defaultMonth = MONTHS[currentDate.getMonth()];

  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<Month>(defaultMonth);
  const [selectedType, setSelectedType] = useState<AccountType>('all');
  const [selectedOwner, setSelectedOwner] = useState<Owner>('all');
  
  // State for refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger refresh after upload
  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1>Transaction Management {year}</h1>
        <p className="text-secondary mt-1">Manage and categorize your financial transactions</p>
      </header>
      
      {/* Filters */}
      <div className="card shadow-sm">
        <div className="card-content">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-tertiary" />
              <span className="text-sm font-medium text-secondary">Filters:</span>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap md:flex-nowrap gap-4">
                {/* Month Selection */}
                <div className="w-full md:w-1/3">
                  <label className="form-label text-xs">Month</label>
                  <div className="relative">
                    <select
                      className="form-control select-control"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value as Month)}
                    >
                      {MONTHS.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Account Type Selection */}
                <div className="w-full md:w-1/3">
                  <label className="form-label text-xs">Account Type</label>
                  <select
                    className="form-control select-control"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as AccountType)}
                  >
                    <option value="all">All Accounts</option>
                    <option value="bank">Bank Account</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
                
                {/* Owner Selection */}
                <div className="w-full md:w-1/3">
                  <label className="form-label text-xs">Owner</label>
                  <select
                    className="form-control select-control"
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value as Owner)}
                  >
                    <option value="all">All Owners</option>
                    <option value="Alex">Alex</option>
                    <option value="Madde">Madde</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* File Upload Section - First */}
      <EnhancedFileUploadMaster 
        year={year} 
        onUploadSuccess={handleUploadSuccess}
      />
      
      {/* Transactions List - Second */}
      <ModernTransactionList
        year={year}
        month={selectedMonth}
        accountType={selectedType}
        owner={selectedOwner}
        refreshTrigger={refreshTrigger}
      />
      
      {/* Account Management - Third (Collapsible) */}
      <ModernAccountManagement />
      
      {/* File List - Fourth (Collapsible) */}
      <ModernFileList refreshTrigger={refreshTrigger} />
    </div>
  );
}
