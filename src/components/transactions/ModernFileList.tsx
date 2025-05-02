import React, { useState, useEffect } from 'react';
import { File, FileSpreadsheet, Trash2, AlertCircle, CheckCircle, ClockIcon } from 'lucide-react';
import { ModernCollapsible } from '../ui/ModernCollapsible';
import { supabase } from '../../lib/lib/supabase';

interface TransactionFile {
  id: string;
  filename: string;
  month: string;
  file_type: string;
  source_type: 'bank' | 'credit_card';
  uploaded_at: string;
  processed_at: string | null;
  status: string;
  processed_count?: number;
}

interface ModernFileListProps {
  refreshTrigger: number;
}

export function ModernFileList({ refreshTrigger }: ModernFileListProps) {
  const [files, setFiles] = useState<TransactionFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Load files when refresh trigger changes
  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  // Load files from the database
  async function loadFiles() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transaction_files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Format date as "Month Day, Year, Time"
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format month as "Month Year"
  function formatMonth(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  }

  // Delete a file and its associated transactions
  async function handleDelete(fileId: string) {
    if (!confirm('Are you sure you want to delete this file and its transactions?')) {
      return;
    }

    setIsDeleting(fileId);
    
    try {
      // First delete all transactions associated with this file
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('file_id', fileId);

      if (transactionError) throw transactionError;

      // Then delete the file record
      const { error: fileError } = await supabase
        .from('transaction_files')
        .delete()
        .eq('id', fileId);

      if (fileError) throw fileError;

      // Update the UI by filtering out the deleted file
      setFiles(files.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'completed') {
      return (
        <span className="badge badge-success">
          <CheckCircle size={14} className="mr-1" />
          Completed
        </span>
      );
    } else if (status === 'error') {
      return (
        <span className="badge badge-error">
          <AlertCircle size={14} className="mr-1" />
          Error
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="badge badge-warning">
          <ClockIcon size={14} className="mr-1" />
          Pending
        </span>
      );
    } else {
      return (
        <span className="badge badge-outline">
          {status}
        </span>
      );
    }
  };

  // Create a badge showing the number of files
  const filesBadge = (
    <span className="badge badge-outline">{files.length} files</span>
  );

  // File icon based on file type
  const FileIcon = ({ fileType }: { fileType: string }) => {
    if (fileType === 'xlsx') {
      return <FileSpreadsheet size={16} className="text-primary" />;
    } else if (fileType === 'csv') {
      return <File size={16} className="text-secondary" />;
    } else {
      return <File size={16} className="text-tertiary" />;
    }
  };

  return (
    <ModernCollapsible
      title="Uploaded Files"
      badge={filesBadge}
      defaultExpanded={false}
    >
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="empty-state py-8">
          <FileSpreadsheet size={36} className="empty-state-icon" />
          <p className="empty-state-message">No files have been uploaded yet</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Month</th>
                <th>Type</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="flex items-center gap-2">
                    <FileIcon fileType={file.file_type} />
                    <span className="font-medium">{file.filename}</span>
                  </td>
                  <td>{formatMonth(file.month)}</td>
                  <td className="capitalize">{file.source_type}</td>
                  <td>{formatDate(file.uploaded_at)}</td>
                  <td>
                    <StatusBadge status={file.status} />
                    {file.processed_count !== undefined && file.status === 'completed' && (
                      <span className="text-xs text-tertiary ml-2">
                        ({file.processed_count} transactions)
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      className="btn btn-icon btn-sm btn-outline text-error"
                      onClick={() => handleDelete(file.id)}
                      disabled={isDeleting === file.id}
                    >
                      {isDeleting === file.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-error"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModernCollapsible>
  );
}
