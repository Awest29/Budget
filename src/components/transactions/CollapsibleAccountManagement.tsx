// src/components/transactions/CollapsibleAccountManagement.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

interface AccountMapping {
  id: string;
  account_name: string;
  account_type: 'bank' | 'credit_card';
  owner: 'Alex' | 'Madde';
}

export function CollapsibleAccountManagement() {
  const [accounts, setAccounts] = useState<AccountMapping[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Partial<AccountMapping>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from('account_mappings')
      .select('*')
      .order('account_name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
      return;
    }

    setAccounts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAccount.account_name || !currentAccount.account_type || !currentAccount.owner) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentAccount.id) {
        // Update existing account
        const { error } = await supabase
          .from('account_mappings')
          .update({
            account_name: currentAccount.account_name,
            account_type: currentAccount.account_type,
            owner: currentAccount.owner
          })
          .eq('id', currentAccount.id);

        if (error) throw error;
        toast({ title: "Success", description: "Account updated successfully" });
      } else {
        // Create new account
        const { error } = await supabase
          .from('account_mappings')
          .insert([{
            account_name: currentAccount.account_name,
            account_type: currentAccount.account_type,
            owner: currentAccount.owner
          }]);

        if (error) throw error;
        toast({ title: "Success", description: "Account created successfully" });
      }

      setIsEditing(false);
      setCurrentAccount({});
      loadAccounts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save account",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('account_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "Account deleted successfully" });
    loadAccounts();
  };

  // Custom title with Add Account button
  const customTitle = (
    <div className="flex justify-between items-center w-full">
      <span>Account Management</span>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              setCurrentAccount({});
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Account
          </Button>
        </DialogTrigger>
      </Dialog>
    </div>
  );

  return (
    <CollapsibleCard 
      title={customTitle}
      defaultCollapsed={true}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell>{account.account_name}</TableCell>
              <TableCell className="capitalize">{account.account_type}</TableCell>
              <TableCell>{account.owner}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentAccount(account);
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit/Add Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {currentAccount.id ? 'Edit Account' : 'Add New Account'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Name</label>
              <Input
                value={currentAccount.account_name || ''}
                onChange={(e) => setCurrentAccount(prev => ({
                  ...prev,
                  account_name: e.target.value
                }))}
                placeholder="Enter account name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Account Type</label>
              <Select
                value={currentAccount.account_type}
                onValueChange={(value: 'bank' | 'credit_card') => 
                  setCurrentAccount(prev => ({
                    ...prev,
                    account_type: value
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Owner</label>
              <Select
                value={currentAccount.owner}
                onValueChange={(value: 'Alex' | 'Madde') => 
                  setCurrentAccount(prev => ({
                    ...prev,
                    owner: value
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Alex">Alex</SelectItem>
                  <SelectItem value="Madde">Madde</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              {currentAccount.id ? 'Update Account' : 'Add Account'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </CollapsibleCard>
  );
}