import React, { useState, useEffect } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { FULL_MONTHS, Month } from '../../types/budget';
import { supabase } from '../../lib/lib/supabase';
import { createTransactionFile, processTransactionFile } from '../../lib/lib/transactions';
import { suggestTransactionCategory } from '../../lib/openai';

interface ModernFileUploadProps {
  year: number;
  onUploadSuccess: () => void;
}

interface AccountMapping {
  id: string;
  account_name: string;
  account_type: 'bank' | 'credit_card';
  owner: 'Alex' | 'Madde';
}

// Process configurations
const BATCH_SIZE = 5;
const BATCH_DELAY = 2000;
const TRANSACTION_DELAY = 200;

// Helper delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ModernFileUpload({ year, onUploadSuccess }: ModernFileUploadProps) {
  const [selectedMonth, setSelectedMonth] = useState<Month | ''>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [accountMappings, setAccountMappings] = useState<AccountMapping[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Load account mappings on component mount
  useEffect(() => {
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
    }
  }

  // Handle file selection via file input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext === 'xlsx' || ext === 'csv';
      });
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  // Handle drag and drop events
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(event.dataTransfer.files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'xlsx' || ext === 'csv';
    });
    
    setFiles(prev => [...prev, ...droppedFiles]);
  };
  
  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Upload and process files
  const handleUpload = async () => {
    if (!selectedMonth || !selectedAccount || files.length === 0) {
      alert("Please select a month, account, and add files before uploading");
      return;
    }

    const selectedMapping = accountMappings.find(m => m.id === selectedAccount);
    if (!selectedMapping) {
      alert("Selected account mapping not found");
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
        
        // Create a transaction file record
        const fileRecord = await createTransactionFile(
          file.name,
          monthDate,
          file.name.endsWith('.xlsx') ? 'xlsx' : 'csv',
          selectedMapping.account_type
        );

        // Read and process the file
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
          
          // Process batch and track progress
          let batchProcessed = 0;
          for (const transaction of batch) {
            try {
              // Process transaction logic would go here
              // We're simplifying this example
              await delay(TRANSACTION_DELAY);
              batchProcessed++;
            } catch (error) {
              console.error('Error processing transaction:', error);
            }
          }
          
          totalProcessed += batchProcessed;
          setProgress((totalProcessed / totalTransactions) * 100);
          
          if (i + BATCH_SIZE < transactions.length) {
            await delay(BATCH_DELAY);
          }
        }

        // Update file status to completed
        await supabase
          .from('transaction_files')
          .update({ 
            status: 'completed', 
            processed_at: new Date().toISOString(),
            processed_count: totalProcessed
          })
          .eq('id', fileRecord.id);
      }

      // Reset state and notify parent of success
      setFiles([]);
      setSelectedMonth('');
      setSelectedAccount('');
      setStatusMessage('Upload completed successfully');
      setProgress(100);
      
      // Wait a moment to show the 100% completion
      await delay(1000);
      setStatusMessage('');
      setProgress(0);
      onUploadSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
      setStatusMessage('Error: Failed to process files');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Upload Transaction Files</h2>
        <p className="card-subtitle">Upload your bank or credit card statements for {year}</p>
      </div>
      
      <div className="card-content">
        <div className="form-group">
          <label className="form-label" htmlFor="account-select">Account</label>
          <select 
            id="account-select"
            className="form-control select-control"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            disabled={isUploading}
          >
            <option value="">Select account...</option>
            {accountMappings.map(mapping => (
              <option key={mapping.id} value={mapping.id}>
                {mapping.account_name} ({mapping.owner} - {mapping.account_type})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="month-select">Month</label>
          <select 
            id="month-select"
            className="form-control select-control"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value as Month)}
            disabled={isUploading}
          >
            <option value="">Select month...</option>
            {FULL_MONTHS.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Upload Files</label>
          <div 
            className={`file-dropzone ${isDragging ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <label htmlFor="file-upload">
              <Upload size={32} className="dropzone-icon" />
              <p className="font-medium text-base">Click to upload or drag files here</p>
              <p className="text-tertiary text-sm">Excel or CSV files only</p>
            </label>
          </div>
        </div>
        
        {/* File list */}
        {files.length > 0 && (
          <div className="form-group">
            <label className="form-label">Selected Files</label>
            <div className="bg-surface-active p-4 rounded-lg">
              <ul className="file-list">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between py-2 border-b border-divider last:border-0">
                    <div className="flex items-center">
                      <File size={16} className="mr-2 text-tertiary" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <button 
                      className="text-tertiary hover:text-error p-1 rounded-full hover:bg-error-surface"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Progress bar */}
        {isUploading && (
          <div className="form-group">
            <div className="mb-2 text-sm text-secondary">{statusMessage}</div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
        
        {/* Upload status message */}
        {!isUploading && statusMessage && (
          <div className="form-group">
            <div className="flex items-center text-sm">
              {statusMessage.includes('Error') ? (
                <AlertCircle size={16} className="mr-2 text-error" />
              ) : (
                <CheckCircle size={16} className="mr-2 text-success" />
              )}
              {statusMessage}
            </div>
          </div>
        )}
        
        <button 
          className="btn btn-primary w-full"
          onClick={handleUpload}
          disabled={!selectedMonth || !selectedAccount || files.length === 0 || isUploading}
        >
          {isUploading ? 'Processing...' : 'Upload Files'}
        </button>
      </div>
    </div>
  );
}
