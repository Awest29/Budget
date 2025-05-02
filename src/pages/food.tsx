import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  store?: string;
}

interface StoreAnalysis {
  total: number;
  count: number;
  transactions: Transaction[];
}

export default function FoodPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storeAnalysis, setStoreAnalysis] = useState<Record<string, StoreAnalysis>>({});
  const [activeTab, setActiveTab] = useState('transactions');
  
  const stores = [
    'ICA SUPERMARKET DRAGONE',
    'ICA KVANTUM TABY',
    // Add more stores as needed
  ];

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions');
        const data = await response.json();
        
        // Filter only food transactions
        const foodTransactions = data.filter((transaction: Transaction) => 
          transaction.description.toUpperCase().includes('ICA')
        );
        
        // Group by store if store is assigned
        const storeGroups: Record<string, StoreAnalysis> = {};
        foodTransactions.forEach((transaction: Transaction) => {
          const store = transaction.store || 'Unassigned';
          if (!storeGroups[store]) {
            storeGroups[store] = {
              total: 0,
              count: 0,
              transactions: []
            };
          }
          storeGroups[store].total += transaction.amount;
          storeGroups[store].count += 1;
          storeGroups[store].transactions.push(transaction);
        });
        
        setTransactions(foodTransactions);
        setStoreAnalysis(storeGroups);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };
    
    fetchTransactions();
  }, []);

  const handleStoreAssignment = async (transactionId: string, store: string) => {
    try {
      await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ store }),
      });
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId ? { ...t, store } : t
        )
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Food Expenses Analysis</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Food Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Store</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={transaction.store || ''}
                          onValueChange={(value) => handleStoreAssignment(transaction.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Assign store..." />
                          </SelectTrigger>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store} value={store}>
                                {store}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Store Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(storeAnalysis).map(([store, data]) => (
                  <div key={store} className="border p-4 rounded">
                    <h3 className="font-semibold">{store}</h3>
                    <p>Total Spent: ${data.total.toFixed(2)}</p>
                    <p>Number of Transactions: {data.count}</p>
                    <p>Average Transaction: ${(data.total / data.count).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}