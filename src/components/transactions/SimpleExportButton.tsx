import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DownloadCloud } from 'lucide-react';
import { exportTransactionsToExcel } from '../../lib/simpleExport';

interface SimpleExportButtonProps {
  year: number;
  month: string;
}

export function SimpleExportButton({ year, month }: SimpleExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Get the Excel file blob
      const blob = await exportTransactionsToExcel(year, month);
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${year}_${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting}
      className="ml-auto"
    >
      {isExporting ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
          Exporting...
        </>
      ) : (
        <>
          <DownloadCloud className="mr-2 h-4 w-4" />
          Export Transactions
        </>
      )}
    </Button>
  );
}