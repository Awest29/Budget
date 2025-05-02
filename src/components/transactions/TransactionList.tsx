// src/components/transactions/TransactionList.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '../../lib/lib/supabase';
import { Badge } from "@/components/ui/badge";
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
  confidence_score: number | null;
  owner: 'Alex' | 'Madde' | null;
  account_type: 'bank' | 'credit_card' | null;
}

interface TransactionListProps {
  year: number;
  month: string;
  accountType: 'bank' | 'credit_card' | 'all';
  owner: 'Alex' | 'Madde' | 'all';
  refreshTrigger: number;
}

export function TransactionList({ year, month, accountType, owner, refreshTrigger }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [year, month, accountType, owner, refreshTrigger]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const inputDate = `${month} 1, ${year}`;
      const parsedDate = new Date(Date.parse(inputDate));
      const monthIndex = parsedDate.getMonth();

      // Format start date
      const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      
      // Calculate and format end date without timezone issues
      const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
      const endDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`;

      // Debug logging for date calculations
      console.log('Date Debug:', {
        input: inputDate,
        parsedDate: parsedDate.toString(),
        monthIndex,
        startDate,
        lastDayOfMonth: lastDayOfMonth.toString(),
        endDate,
        rawLastDay: lastDayOfMonth.getDate()
      });

      // Debug test dates
      console.log('Test Dates:', {
        'Month Start': new Date(year, monthIndex, 1).toString(),
        'Month End': lastDayOfMonth.toString(),
        'Constructed End Date': endDate
      });

      // Final query parameter check
      console.log('Final Query Parameters:', {
        startDate,
        endDate,
        lastDayOfMonth: lastDayOfMonth.getDate(),
        constructedEndDate: endDate,
        fullEndDate: lastDayOfMonth.toISOString()
      });

      let query = supabase
        .from('transactions')
        .select()
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      // Apply owner filter if specified
      if (owner !== 'all') {
        query = query.eq('owner', owner);
      }

      // Apply account type filter if specified
      if (accountType !== 'all') {
        query = query.eq('account_type', accountType);
      }

      // Order by date descending
      query = query.order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Debug logging for query results
      console.log('Query Results:', {
        transactionCount: data?.length,
        dates: data?.map(t => t.transaction_date).sort(),
        filterCriteria: { owner, accountType }
      });

      // Remove duplicates based on date, description, and amount
      const uniqueTransactions = data?.reduce<Transaction[]>((acc, current) => {
        const key = `${current.transaction_date}-${current.description}-${current.amount}`;
        if (!acc.some(item => 
          `${item.transaction_date}-${item.description}-${item.amount}` === key
        )) {
          acc.push(current);
        }
        return acc;
      }, []) || [];

      // Debug logging for final results
      console.log('Final Results:', {
        uniqueCount: uniqueTransactions.length,
        uniqueDates: uniqueTransactions.map(t => t.transaction_date).sort()
      });

      setTransactions(uniqueTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }

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

  async function updateTransactionCategory(
    transaction: Transaction,
    categoryId: string, 
    subHeaderId: string | null = null
  ) {
    try {
      // Store the original values for feedback
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

      // Update transaction in database
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
        console.error('Error updating transaction:', error);
        // Revert local state if backend update fails
        setTransactions(current =>
          current.map(t =>
            t.id === transaction.id
              ? { ...transaction }
              : t
          )
        );
        return;
      }

      // Always store categorization data for learning
      await storeCategorizationFeedback(
        transaction.description,
        transaction.amount,
        categoryId,
        subHeaderId || '',
        true // Always mark as correct when user sets it manually
      );
      
      // If this was previously AI-categorized, also store whether the AI was correct
      if (wasAICategorized) {
        // Store feedback in ai_categorization_feedback table
        const { error: feedbackError } = await supabase
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

        if (feedbackError) {
          console.error('Error storing AI feedback:', feedbackError);
        }
      }
      
      // Find similar transactions for potential batch categorization
      await findSimilarTransactions(transaction.description, categoryId, subHeaderId);
      
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
  
  // Helper function to find similar transactions
  async function findSimilarTransactions(description: string, categoryId: string, subHeaderId: string | null) {
    try {
      // Extract key parts of the description for matching
      const words = description.toLowerCase().split(/\s+/);
      if (words.length === 0) return;
      
      // Use first word (typically merchant name) as the base for matching
      const baseWord = words[0];
      if (baseWord.length < 3) return; // Skip very short words
      
      // Find transactions with similar descriptions that aren't categorized the same way
      const similarTransactions = transactions.filter(t => 
        t.description.toLowerCase().includes(baseWord) && 
        t.description !== description && // Compare with description text
        (!t.category_id || t.category_id !== categoryId || t.sub_header_id !== subHeaderId)
      );
      
      if (similarTransactions.length > 0) {
        console.log(`Found ${similarTransactions.length} similar transactions that could use the same category`);
        // In a future enhancement, we could offer to batch update these
      }
    } catch (error) {
      console.error('Error finding similar transactions:', error);
    }
  }

  return (
    <div className="transaction-list-container">
      <div className="transaction-list-header">
        <h3 className="transaction-list-title">Transactions ({transactions.length})</h3>
      </div>
      
      {loading ? (
        <div className="text-center py-4">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-text">No transactions found for this month</div>
        </div>
      ) : (
        <Table className="transaction-table">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub-header</TableHead>
              <TableHead>Original Category</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Categorized By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className={
                  !isNaN(Number(transaction.amount)) && Number(transaction.amount) < 0 
                    ? 'negative-value' 
                    : 'positive-value'
                }>
                  {Number(transaction.amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </TableCell>
                <TableCell>
                  <Select
                    value={transaction.category_id || ''}
                    onValueChange={(categoryId) => {
                      updateTransactionCategory(transaction, categoryId, null);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue>
                        {categories.find(c => c.id === transaction.category_id)?.name || 'Select category'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell 
                  className={
                    transaction.category_id && !transaction.sub_header_id 
                      ? "bg-red-100" 
                      : ""
                  }
                >
                  <Select
                    value={transaction.sub_header_id || ''}
                    onValueChange={(subHeaderId) => {
                      if (transaction.category_id) {
                        updateTransactionCategory(transaction, transaction.category_id, subHeaderId);
                      }
                    }}
                    disabled={!transaction.category_id}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue>
                        {categories
                          .find(c => c.id === transaction.category_id)
                          ?.sub_headers.find(s => s.id === transaction.sub_header_id)
                          ?.name || 'Select sub-header'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .find(c => c.id === transaction.category_id)
                        ?.sub_headers.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{transaction.original_category || '-'}</TableCell>
                <TableCell>{transaction.owner || '-'}</TableCell>
                <TableCell className="capitalize">{transaction.account_type || '-'}</TableCell>
                <TableCell>
                  <Badge variant={transaction.categorized_by === 'AI' ? 'secondary' : 'outline'}>
                    {transaction.categorized_by}
                    {transaction.categorized_by === 'AI' && transaction.confidence_score && 
                      ` (${Math.round(transaction.confidence_score * 100)}%)`}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}