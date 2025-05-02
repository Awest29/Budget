// src/lib/lib/transactions.ts
import { supabase } from './supabase';
import * as XLSX from 'xlsx';

interface ProcessedTransaction {
  id?: string;
  file_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  original_category: string | null;
  category_id: string | null;
  sub_header_id: string | null;
  ai_confidence: number | null;
  last_modified_by: string | null;
  owner: string | null;
  account_type: 'bank' | 'credit_card';
}

export async function createTransactionFile(
  filename: string, 
  month: Date, 
  fileType: 'xlsx' | 'csv',
  sourceType: 'bank' | 'credit_card' = 'bank'
) {
  const { data, error } = await supabase
    .from('transaction_files')
    .insert({
      filename,
      month,
      file_type: fileType,
      source_type: sourceType,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating transaction file: ${error.message}`);
  }

  return data;
}

export async function processTransactionFile(
  fileContent: ArrayBuffer, 
  fileId: string,
  sourceType: 'bank' | 'credit_card' = 'bank',
  owner: string | null = null
) {
  try {
    console.log('1. Starting file processing with fileId:', fileId);
    
    const workbook = XLSX.read(fileContent, {
      type: 'array',
      cellDates: true,
      dateNF: 'yyyy-mm-dd',
      raw: true
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: null,
    });

    console.log('2. Processing rows:', rows.length);

    const transactions = rows.map((row: any): ProcessedTransaction => {
      console.log('3. Processing row:', row);

      // Find the date column (case-insensitive)
      const dateColumn = Object.keys(row).find(key => 
        key.toLowerCase() === 'bokföringsdatum' || 
        key.toLowerCase() === 'bokforingsdatum' ||
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('datum')
      );

      // Find the text/description column
      const textColumn = Object.keys(row).find(key =>
        key.toLowerCase() === 'text' ||
        key.toLowerCase() === 'beskrivning' ||
        key.toLowerCase().includes('description')
      );

      // Find the amount column
      const amountColumn = Object.keys(row).find(key =>
        key.toLowerCase() === 'belopp' ||
        key.toLowerCase() === 'amount' ||
        key.toLowerCase().includes('summa')
      );

      if (!dateColumn || !textColumn || !amountColumn) {
        console.error('Missing columns in row:', row);
        console.error('Available columns:', Object.keys(row));
        throw new Error('Required columns not found in file');
      }

      return {
        file_id: fileId,
        transaction_date: formatDate(row[dateColumn]),
        description: row[textColumn] || '',
        amount: parseAmount(row[amountColumn], sourceType),
        original_category: null,
        category_id: null,
        sub_header_id: null,
        ai_confidence: null,
        last_modified_by: null,
        owner: owner,
        account_type: sourceType
      };
    });

    console.log('4. Inserting transactions:', transactions.length);

    // Insert transactions in chunks and collect all inserted transactions
    const chunkSize = 50;
    let insertedTransactions: any[] = [];
    
    for (let i = 0; i < transactions.length; i += chunkSize) {
      const chunk = transactions.slice(i, i + chunkSize);
      console.log(`Processing chunk ${i/chunkSize + 1} of ${Math.ceil(transactions.length/chunkSize)}`);
      
      const { data: insertedChunk, error: insertError } = await supabase
        .from('transactions')
        .insert(chunk)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      if (insertedChunk) {
        console.log(`Successfully inserted ${insertedChunk.length} transactions`);
        insertedTransactions = [...insertedTransactions, ...insertedChunk];
      }
    }

    // Update file status with retry mechanism
    try {
      const { data: updatedFile, error: updateError } = await supabase
        .from('transaction_files')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', fileId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating file status:', updateError);
        // Try to update again after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { error: retryError } = await supabase
          .from('transaction_files')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', fileId)
          .select()
          .single();
          
        if (retryError) {
          console.error('Retry error:', retryError);
        }
      }

      console.log('Updated file:', updatedFile);
    } catch (error) {
      console.error('Error in status update:', error);
    }

    console.log('5. Successfully processed all transactions:', {
      total: insertedTransactions.length,
      firstId: insertedTransactions[0]?.id,
      lastId: insertedTransactions[insertedTransactions.length - 1]?.id
    });

    return insertedTransactions;

  } catch (error) {
    console.error('Error in processTransactionFile:', error);
    
    // Update file status to error with retry mechanism
    try {
      const { error: updateError } = await supabase
        .from('transaction_files')
        .update({
          status: 'error',
          processed_at: new Date().toISOString()
        })
        .eq('id', fileId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating file status to error:', updateError);
        // Try to update again after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { error: retryError } = await supabase
          .from('transaction_files')
          .update({
            status: 'error',
            processed_at: new Date().toISOString()
          })
          .eq('id', fileId)
          .select()
          .single();
          
        if (retryError) {
          console.error('Retry error:', retryError);
        }
      }
    } catch (error) {
      console.error('Error in error status update:', error);
    }

    throw error;
  }
}

function formatDate(date: any): string {
  if (!date) {
    throw new Error('Date is required');
  }
  
  // If it's already a Date object
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  // If it's a string
  if (typeof date === 'string') {
    date = date.trim();
    
    // Try to parse Swedish date format (dd/mm/yyyy or yyyy-mm-dd)
    let parts = date.split(/[-/]/);
    
    // If using dots as separators
    if (parts.length === 1) {
      parts = date.split('.');
    }
    
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${date}`);
    }
    
    // Ensure all parts are padded with leading zeros
    parts = parts.map(part => part.padStart(2, '0'));
    
    // If the first part is 4 digits, assume yyyy-mm-dd
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    
    // Otherwise assume dd/mm/yyyy
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  // If it's a number (Excel serial date)
  if (typeof date === 'number') {
    const excelEpoch = new Date(1900, 0, 0);
    const millisPerDay = 24 * 60 * 60 * 1000;
    const dateObj = new Date(excelEpoch.getTime() + (date * millisPerDay));
    return dateObj.toISOString().split('T')[0];
  }
  
  throw new Error(`Unsupported date format: ${date}`);
}

function parseAmount(amount: any, sourceType: 'bank' | 'credit_card' = 'bank'): number {
  let parsedAmount = 0;
  
  if (typeof amount === 'number') {
    parsedAmount = amount;
  } else if (typeof amount === 'string') {
    // Remove whitespace and convert Swedish decimal comma to point
    const cleanAmount = amount.replace(/\s/g, '').replace(',', '.');
    // Remove any currency symbols and convert to number
    parsedAmount = Number(cleanAmount.replace(/[^0-9.-]+/g, ''));
    
    if (isNaN(parsedAmount)) {
      throw new Error(`Invalid amount format: ${amount}`);
    }
  } else {
    throw new Error('Invalid amount format');
  }
  
  // For credit cards, invert the sign
  if (sourceType === 'credit_card') {
    parsedAmount = -parsedAmount;
  }
  
  return parsedAmount;
}