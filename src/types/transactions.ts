// src/types/transactions.ts

export interface TransactionFile {
    id: string;
    filename: string;
    month: string;  // ISO date string
    file_type: 'xlsx' | 'csv';
    uploaded_at: string;
    processed_at: string | null;
    status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface Transaction {
    id: string;
    file_id: string;
    transaction_date: string;  // ISO date string
    description: string;
    amount: number;
    category_id: string | null;
    sub_header_id: string | null;
    ai_confidence: number | null;
    original_category: string | null;
    created_at: string;
    updated_at: string;
    last_modified_by: string;
    categorized_by: 'AI' | 'user';
}