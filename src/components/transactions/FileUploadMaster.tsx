// src/components/transactions/FileUploadMaster.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from 'lucide-react';
import { createTransactionFile, processTransactionFile } from '../../lib/lib/transactions';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '../../lib/lib/supabase';
import { suggestTransactionCategory } from '../../lib/openai';
import { BudgetCategory, Month, FULL_MONTHS } from '../../types/budget';
import { Progress } from "@/components/ui/progress";

interface FileUploadMasterProps {
  year: number;
  onUploadSuccess: () => void;
}

interface AccountMapping {
  id: string;
  account_name: string;
  account_type: 'bank' | 'credit_card';
  owner: 'Alex' | 'Madde';
}

const BATCH_SIZE = 15; // Increased from 5 to process more transactions per batch
const BATCH_DELAY = 600; // Reduced from 2000ms to 600ms to decrease waiting time
const TRANSACTION_DELAY = 50; // Reduced from 200ms to 50ms for faster processing

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function processTransaction(
  transaction: any,
  categories: BudgetCategory[],
  selectedMapping: AccountMapping
): Promise<boolean> {
  let retries = 3;
  
  // Add more detailed logging at start
  console.log('Starting transaction processing:', {
    id: transaction.id,
    description: transaction.description,
    amount: transaction.amount
  });
  
  while (retries > 0) {
    try {
      // Log the transaction object to debug
      console.log('Processing transaction:', JSON.stringify(transaction, null, 2));

      const suggestion = await suggestTransactionCategory(
        transaction.description,
        transaction.amount,
        categories
      );

      console.log('Got suggestion for transaction:', {
        id: transaction.id,
        file_id: transaction.file_id,  // Make sure this exists
        description: transaction.description,
        suggestion
      });

      if (suggestion?.categoryId && suggestion?.subHeaderId) {
        const updateData = {
          owner: selectedMapping.owner,
          account_type: selectedMapping.account_type,
          category_id: suggestion.categoryId,
          sub_header_id: suggestion.subHeaderId,
          categorized_by: 'AI',
          ai_confidence: suggestion.confidence || 0.8,
          last_modified_by: selectedMapping.owner  // Add this from CSV structure
        };

        // Verify we have a valid ID before attempting update
        if (!transaction.id) {
          console.error('Transaction is missing ID:', transaction);
          return false;
        }

        console.log('Attempting to update transaction:', {
          id: transaction.id,
          updateData
        });

        const { data, error } = await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', transaction.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }

        console.log('Supabase update successful:', data);
        return true;
      } else {
        console.log('No valid suggestion received for transaction:', transaction.description);
        
        // Toast notification for missing AI suggestion
        toast({
          title: "AI Categorization Warning",
          description: `Could not categorize: ${transaction.description.substring(0, 30)}...`,
          variant: "warning",
        });
        
        return false;
      }
    } catch (error) {
      console.error(`Attempt ${4 - retries} failed for transaction:`, {
        id: transaction.id,
        description: transaction.description,
        error
      });
      retries--;
      if (retries > 0) {
        await delay(2000 * Math.pow(2, 3 - retries));
      }
    }
  }
  // Toast notification for complete failure after all retries
  toast({
    title: "AI Categorization Failed",
    description: `Failed to process transaction after multiple attempts: ${transaction.description.substring(0, 30)}...`,
    variant: "destructive",
  });
  return false;
}

async function processBatch(
  transactions: any[],
  categories: BudgetCategory[],
  selectedMapping: AccountMapping
): Promise<number> {
  let successCount = 0;
  
  // Process transactions sequentially within the batch
  for (const transaction of transactions) {
    try {
      const success = await processTransaction(transaction, categories, selectedMapping);
      if (success) successCount++;
      // Small delay between transactions
      await delay(TRANSACTION_DELAY);
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  }
  
  return successCount;
}

export function FileUploadMaster({ year, onUploadSuccess }: FileUploadMasterProps) {
  const [selectedMonth, setSelectedMonth] = useState<Month | ''>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [accountMappings, setAccountMappings] = useState<AccountMapping[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
    loadAccountMappings();
  }, []);

  async function loadAccountMappings() {
    try {
      const { data, error } = await supabase
        .from('account_mappings')
        .select('*')
        .order('account_name');

      if (error) throw error;
      setAccountMappings(data || []);
    } catch (error) {
      console.error('Error loading account mappings:', error);
      toast({
        title: "Error",
        description: "Failed to load account mappings",
        variant: "destructive",
      });
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

      const transformedData: BudgetCategory[] = (data || []).map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type,
        monthlyamounts: {},
        subHeaders: category.sub_headers.map(sub => ({
          id: sub.id,
          name: sub.name,
          monthlyamounts: {},
          category_id: category.id,
          entries: []
        })),
        deletedSubHeaderIds: []
      }));

      setCategories(transformedData);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext === 'xlsx' || ext === 'csv';
      });
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleUpload = async () => {
    if (!selectedMonth || !selectedAccount || files.length === 0) {
      toast({
        title: "Warning",
        description: "Please select a month, account, and add files before uploading",
        variant: "destructive",
      });
      return;
    }

    const selectedMapping = accountMappings.find(m => m.id === selectedAccount);
    if (!selectedMapping) {
      toast({
        title: "Error",
        description: "Selected account mapping not found",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    let totalProcessed = 0;
    let totalTransactions = 0;

    try {
      for (const file of files) {
        setStatusMessage(`Processing file: ${file.name}`);
        const monthDate = new Date(year, FULL_MONTHS.indexOf(selectedMonth as Month), 1);
        
        const fileRecord = await createTransactionFile(
          file.name,
          monthDate,
          file.name.endsWith('.xlsx') ? 'xlsx' : 'csv',
          selectedMapping.account_type
        );

        const fileContent = await file.arrayBuffer();
        const transactions = await processTransactionFile(
          fileContent, 
          fileRecord.id,
          selectedMapping.account_type,
          selectedMapping.owner
        );
        
        if (!transactions) continue;
        
        totalTransactions += transactions.length;
        
        // Process transactions in batches
        for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
          const batch = transactions.slice(i, i + BATCH_SIZE);
          setStatusMessage(`Processing transactions ${i + 1} to ${Math.min(i + BATCH_SIZE, transactions.length)} of ${transactions.length}`);
          
          const successCount = await processBatch(batch, categories, selectedMapping);
          totalProcessed += successCount;
          setProgress((totalProcessed / totalTransactions) * 100);
          
          if (i + BATCH_SIZE < transactions.length) {
            await delay(BATCH_DELAY);
          }
        }

        await supabase
          .from('transaction_files')
          .update({ 
            status: 'completed', 
            processed_at: new Date().toISOString(),
            processed_count: totalProcessed
          })
          .eq('id', fileRecord.id);
      }

      toast({
        title: "Success",
        description: `Processed ${totalProcessed} of ${totalTransactions} transactions successfully`,
      });

      setFiles([]);
      setSelectedMonth('');
      setSelectedAccount('');
      setStatusMessage('');
      setProgress(0);
      onUploadSuccess();

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Error",
        description: "Failed to process files. Some transactions may need manual categorization.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Transaction Files - {year}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select 
            value={selectedAccount} 
            onValueChange={setSelectedAccount}
            disabled={isUploading}
          >
             <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent>
              {accountMappings.map(mapping => (
                <SelectItem key={mapping.id} value={mapping.id}>
                  {mapping.account_name} ({mapping.owner} - {mapping.account_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Month</label>
          <Select 
            value={selectedMonth} 
            onValueChange={(value: Month) => setSelectedMonth(value)}
            disabled={isUploading}
          >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose month..." />
              </SelectTrigger>
              <SelectContent>
              {FULL_MONTHS.map((month: Month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Transaction Files</label>
          <div className="file-upload-area cursor-pointer">
            <input
              type="file"
              multiple
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="mx-auto h-12 w-12 text-blue-400" />
              <p className="mt-2 text-sm text-secondary">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted">
                Excel or CSV files only
              </p>
            </label>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Selected Files</label>
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li key={index} className="text-sm">
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">{statusMessage}</div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!selectedMonth || !selectedAccount || files.length === 0 || isUploading}
          className="w-full"
        >
          {isUploading ? 'Processing...' : 'Upload Files'}
        </Button>
      </CardContent>
    </Card>
  );
}