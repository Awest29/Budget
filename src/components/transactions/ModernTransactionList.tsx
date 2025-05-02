import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText, Search, Filter } from 'lucide-react';
import './styles/enhanced-transactions.css'; // Import the enhanced styles
import './styles/transaction-alternating-rows.css'; // Import alternating row styles
import './styles/form-controls.css'; // Import form control styles
import './styles/card-headings.css'; // Import card heading styles
import './styles/black-text-override.css'; // Import black text override
import './styles/hover-override.css'; // Import hover override
import { supabase } from '../../lib/lib/supabase';
import { storeCategorizationFeedback } from '../../lib/openai';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'fixed' | 'variable' | 'extraordinary';
  sub_headers: {
    id: string;
    name: string;
  }[];
}

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  category_id: string | null;
  sub_header_id: string | null;
  original_category: string | null;
  categorized_by: 'AI' | 'user';
  ai_confidence: number | null;
  owner: 'Alex' | 'Madde' | null;
  account_type: 'bank' | 'credit_card' | null;
}

interface ModernTransactionListProps {
  year: number;
  month: string;
  accountType: 'bank' | 'credit_card' | 'all';
  owner: 'Alex' | 'Madde' | 'all';
  refreshTrigger: number;
}

export function ModernTransactionList({ 
  year, 
  month, 
  accountType, 
  owner, 
  refreshTrigger 
}: ModernTransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  // Load data when props change
  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [year, month, accountType, owner, refreshTrigger]);

  // Filter transactions when search query changes
  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery]);

  // Calculate total amount when filtered transactions change
  useEffect(() => {
    calculateTotal();
  }, [filteredTransactions]);

  // Load transactions from the database
  async function loadTransactions() {
    setLoading(true);
    try {
      // Create the date range for the selected month
      const dateObj = new Date(`${month} 1, ${year}`);
      const monthIndex = dateObj.getMonth();
      
      // Format start and end dates (YYYY-MM-DD)
      const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      const endDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // Build query
      let query = supabase
        .from('transactions')
        .select()
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      // Apply filters
      if (owner !== 'all') {
        query = query.eq('owner', owner);
      }

      if (accountType !== 'all') {
        query = query.eq('account_type', accountType);
      }

      // Execute query with ordering
      const { data, error } = await query
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      // Process data and update state
      const uniqueTransactions = removeDuplicates(data || []);
      setTransactions(uniqueTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load categories from the database
  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .select(`
          id,
          name,
          type,
          sub_headers:budget_sub_headers(id, name)
        `);
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  // Remove duplicate transactions
  function removeDuplicates(data: Transaction[]): Transaction[] {
    return data.reduce<Transaction[]>((acc, current) => {
      const key = `${current.transaction_date}-${current.description}-${current.amount}`;
      if (!acc.some(item => 
        `${item.transaction_date}-${item.description}-${item.amount}` === key
      )) {
        acc.push(current);
      }
      return acc;
    }, []);
  }

  // Filter transactions based on search query
  function filterTransactions() {
    if (!searchQuery.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = transactions.filter(transaction => 
      transaction.description.toLowerCase().includes(query) ||
      (transaction.amount.toString().includes(query))
    );

    setFilteredTransactions(filtered);
  }

  // Calculate total amount for all filtered transactions
  function calculateTotal() {
    const total = filteredTransactions.reduce((sum, transaction) => 
      sum + transaction.amount, 0);
    setTotalAmount(total);
  }

  // Format date as YYYY-MM-DD
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format currency as Swedish Krona (SEK)
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sv-SE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  }

  // Update transaction category
  async function updateTransactionCategory(
    transaction: Transaction,
    categoryId: string,
    subHeaderId: string | null = null
  ) {
    try {
      // Store original values for feedback
      const originalCategoryId = transaction.category_id;
      const originalSubHeaderId = transaction.sub_header_id;
      const wasAICategorized = transaction.categorized_by === 'AI';

      // Update local state first for immediate feedback
      setTransactions(current =>
        current.map(t =>
          t.id === transaction.id
            ? { 
                ...t, 
                category_id: categoryId, 
                sub_header_id: subHeaderId,
                categorized_by: 'user'
              }
            : t
        )
      );

      // Update in database
      const { error } = await supabase
        .from('transactions')
        .update({ 
          category_id: categoryId,
          sub_header_id: subHeaderId,
          last_modified_by: 'user',
          categorized_by: 'user'
        })
        .eq('id', transaction.id);

      if (error) {
        throw error;
      }

      // Store feedback for AI learning
      await storeCategorizationFeedback(
        transaction.description,
        transaction.amount,
        categoryId,
        subHeaderId || '',
        true // Marked as correct since user set it
      );

      // If AI previously categorized this, provide feedback
      if (wasAICategorized) {
        await supabase
          .from('ai_categorization_feedback')
          .upsert({
            description: transaction.description,
            amount: transaction.amount,
            suggested_category_id: originalCategoryId,
            suggested_subheader_id: originalSubHeaderId,
            correct_category_id: categoryId,
            correct_subheader_id: subHeaderId,
            was_correct: categoryId === originalCategoryId && 
                        subHeaderId === originalSubHeaderId,
            feedback_source: 'user_correction',
            feedback_date: new Date().toISOString()
          }, {
            onConflict: 'description'
          });
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      
      // Revert local state if update fails
      setTransactions(current =>
        current.map(t =>
          t.id === transaction.id
            ? { ...transaction }
            : t
        )
      );
    }
  }

  return (
    <div className="card">
      <div className="card-header" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="card-title">Transactions</h2>
            <p className="card-subtitle">
              {month} {year} • {filteredTransactions.length} transactions
            </p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={16} />
            <input
              type="text"
              placeholder="Search transactions..."
              className="form-control pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: "white",
                color: "#000000",
                borderColor: "#e2e8f0",
                borderRadius: "8px",
                padding: "0.65rem 1rem 0.65rem 2.5rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="card-content p-0">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-tertiary">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No transactions found</h4>
            <p className="empty-state-message">
              {searchQuery 
                ? "No transactions match your search criteria" 
                : `No transactions recorded for ${month} ${year}`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="table-container rounded-none border-0">
              <table>
                <thead>
                  <tr>
                    <th className="py-3">Date</th>
                    <th className="py-3">Description</th>
                    <th className="text-right py-3">Amount</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Sub-Category</th>
                    <th className="py-3">Owner</th>
                    <th className="py-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.transaction_date)}</td>
                      <td className="max-w-[300px] truncate">{transaction.description}</td>
                      <td className={`text-right ${transaction.amount < 0 ? 'expense-value' : 'income-value'}`}>
                        {transaction.amount < 0 ? '-' : ''}{formatCurrency(transaction.amount)} kr
                      </td>
                      <td>
                        <select
                          className="form-control py-1 text-sm"
                          value={transaction.category_id || ''}
                          onChange={(e) => updateTransactionCategory(transaction, e.target.value)}
                        >
                          <option value="">Select category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-control py-1 text-sm"
                          value={transaction.sub_header_id || ''}
                          onChange={(e) => {
                            if (transaction.category_id) {
                              updateTransactionCategory(transaction, transaction.category_id, e.target.value);
                            }
                          }}
                          disabled={!transaction.category_id}
                        >
                          <option value="">Select sub-category</option>
                          {categories
                            .find(c => c.id === transaction.category_id)
                            ?.sub_headers.map(sub => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))
                          }
                        </select>
                      </td>
                      <td>
                        {transaction.owner || '-'}
                      </td>
                      <td>
                        <span className={`badge ${transaction.categorized_by === 'AI' ? 'badge-secondary' : 'badge-outline'}`}>
                          {transaction.categorized_by}
                          {transaction.categorized_by === 'AI' && transaction.ai_confidence && 
                            ` (${Math.round(transaction.ai_confidence * 100)}%)`
                          }
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan={2} className="text-right font-semibold">Total:</td>
                    <td className={`text-right font-semibold ${totalAmount < 0 ? 'expense-value' : 'income-value'}`}>
                      {totalAmount < 0 ? '-' : ''}{formatCurrency(totalAmount)} kr
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
