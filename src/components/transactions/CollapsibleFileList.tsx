// src/components/transactions/CollapsibleFileList.tsx
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, FileSpreadsheet } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from '../../lib/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

interface TransactionFile {
  id: string;
  filename: string;
  month: string;
  file_type: string;
  source_type: 'bank' | 'credit_card';
  uploaded_at: string;
  processed_at: string | null;
  status: string;
}

interface CollapsibleFileListProps {
  refreshTrigger: number;
}

export function CollapsibleFileList({ refreshTrigger }: CollapsibleFileListProps) {
  const [files, setFiles] = useState<TransactionFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load files
  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('transaction_files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  // Delete file and its transactions
  const handleDelete = async (fileId: string) => {
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

      // Update the UI
      setFiles(files.filter(file => file.id !== fileId));
      
      toast({
        title: "Success",
        description: "File and related transactions deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  // Create a custom title with the file count
  const customTitle = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center">
        <FileSpreadsheet className="h-5 w-5 mr-2" />
        <span>Uploaded Files</span>
      </div>
      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
        {files.length} files
      </span>
    </div>
  );

  return (
    <CollapsibleCard 
      title={customTitle}
      defaultCollapsed={true}
    >
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No files uploaded yet
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.filename}</TableCell>
                  <TableCell>
                    {new Date(file.month).toLocaleString('default', { 
                      month: 'long',
                      year: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell className="capitalize">{file.source_type}</TableCell>
                  <TableCell>
                    {new Date(file.uploaded_at).toLocaleString('default', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      file.status === 'completed' ? 'bg-green-100 text-green-800' :
                      file.status === 'error' ? 'bg-red-100 text-red-800' :
                      file.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {file.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete the file and all associated transactions. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(file.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </CollapsibleCard>
  );
}