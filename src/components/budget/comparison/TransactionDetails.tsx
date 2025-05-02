import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
}

interface TransactionDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  subHeaderName: string;
  total: number;
}

export function TransactionDetails({ 
  isOpen, 
  onClose, 
  transactions, 
  subHeaderName,
  total
}: TransactionDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Transactions for {subHeaderName} (Total: {total.toLocaleString('en-US', { 
              style: 'currency', 
              currency: 'SEK',
              maximumFractionDigits: 0 
            })})
          </DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
                  transaction.amount < 0 ? "text-red-600 text-right" : "text-green-600 text-right"
                }>
                  {transaction.amount.toLocaleString('en-US', { 
                    style: 'currency', 
                    currency: 'SEK',
                    maximumFractionDigits: 0 
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}