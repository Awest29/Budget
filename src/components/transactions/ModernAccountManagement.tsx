import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { ModernCollapsible } from '../ui/ModernCollapsible';
import { supabase } from '../../lib/lib/supabase';

interface AccountMapping {
  id: string;
  account_name: string;
  account_type: 'bank' | 'credit_card';
  owner: 'Alex' | 'Madde';
}

export function ModernAccountManagement() {
  const [accounts, setAccounts] = useState<AccountMapping[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AccountMapping>>({});

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Load accounts from the database
  async function loadAccounts() {
    try {
      const { data, error } = await supabase
        .from('account_mappings')
        .select('*')
        .order('account_name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Start adding a new account
  const handleAddNew = () => {
    setFormData({});
    setIsAdding(true);
    setIsEditing(null);
  };

  // Start editing an existing account
  const handleEdit = (account: AccountMapping) => {
    setFormData(account);
    setIsEditing(account.id);
    setIsAdding(false);
  };

  // Cancel adding/editing
  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData({});
  };

  // Save account (create or update)
  const handleSave = async () => {
    try {
      // Validate form data
      if (!formData.account_name || !formData.account_type || !formData.owner) {
        alert('Please fill out all fields');
        return;
      }

      if (isEditing) {
        // Update existing account
        const { error } = await supabase
          .from('account_mappings')
          .update({
            account_name: formData.account_name,
            account_type: formData.account_type as 'bank' | 'credit_card',
            owner: formData.owner as 'Alex' | 'Madde'
          })
          .eq('id', isEditing);

        if (error) throw error;
      } else if (isAdding) {
        // Create new account
        const { error } = await supabase
          .from('account_mappings')
          .insert([{
            account_name: formData.account_name,
            account_type: formData.account_type as 'bank' | 'credit_card',
            owner: formData.owner as 'Alex' | 'Madde'
          }]);

        if (error) throw error;
      }

      // Reset form and reload accounts
      setIsAdding(false);
      setIsEditing(null);
      setFormData({});
      await loadAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Failed to save account. Please try again.');
    }
  };

  // Delete an account
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('account_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  // Create an action button for the collapsible header
  const actionButton = (
    <button 
      className="btn btn-primary btn-sm"
      onClick={(e) => {
        e.stopPropagation();
        handleAddNew();
      }}
    >
      <Plus size={16} className="mr-1" />
      Add Account
    </button>
  );

  // Create a badge showing the number of accounts
  const accountsBadge = (
    <span className="badge badge-outline">{accounts.length} accounts</span>
  );

  // Render the form for adding/editing an account
  const renderForm = () => (
    <div className="space-y-4 p-4 bg-surface-active rounded-lg mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">
          {isEditing ? 'Edit Account' : 'Add New Account'}
        </h3>
        <button
          className="btn btn-icon btn-sm"
          onClick={handleCancel}
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="account_name">Account Name</label>
        <input
          type="text"
          id="account_name"
          name="account_name"
          className="form-control"
          value={formData.account_name || ''}
          onChange={handleInputChange}
          placeholder="Enter account name"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="account_type">Account Type</label>
        <select
          id="account_type"
          name="account_type"
          className="form-control select-control"
          value={formData.account_type || ''}
          onChange={handleInputChange}
        >
          <option value="">Select account type</option>
          <option value="bank">Bank Account</option>
          <option value="credit_card">Credit Card</option>
        </select>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="owner">Owner</label>
        <select
          id="owner"
          name="owner"
          className="form-control select-control"
          value={formData.owner || ''}
          onChange={handleInputChange}
        >
          <option value="">Select owner</option>
          <option value="Alex">Alex</option>
          <option value="Madde">Madde</option>
        </select>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          className="btn btn-outline"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
        >
          <Check size={16} className="mr-1" />
          Save
        </button>
      </div>
    </div>
  );

  return (
    <ModernCollapsible
      title="Account Management"
      actionButton={actionButton}
      badge={accountsBadge}
      defaultExpanded={false}
    >
      {isAdding || isEditing ? (
        renderForm()
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Type</th>
                <th>Owner</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-tertiary">
                    No accounts found. Click "Add Account" to create one.
                  </td>
                </tr>
              ) : (
                accounts.map(account => (
                  <tr key={account.id}>
                    <td>{account.account_name}</td>
                    <td className="capitalize">{account.account_type}</td>
                    <td>{account.owner}</td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="btn btn-icon btn-sm btn-outline"
                          onClick={() => handleEdit(account)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn btn-icon btn-sm btn-outline text-error"
                          onClick={() => handleDelete(account.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </ModernCollapsible>
  );
}
