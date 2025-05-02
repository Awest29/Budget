import React, { useState, useEffect } from 'react';
import { BudgetCategory } from '../../types/budget';
import { ChevronRight, ChevronDown, Edit, Trash, PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/lib/supabase';
import { getBudgetData, updateBudgetAmount } from '@/lib/budgetService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// All CSS styling is now in a single file loaded in index.html

interface ModernBudgetSummaryProps {
  categories: BudgetCategory[];
  year: number;
}

// Define a custom type for expandable states
interface ExpandState {
  [key: string]: boolean;
}

interface EditState {
  categoryId: string | null;
  subHeaderId: string | null;
  monthIndex: number | null;
  value: string;
}

// Standard 3-letter month abbreviations
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ModernBudgetSummary({ categories: initialCategories, year }: ModernBudgetSummaryProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories);
  
  // State to track which categories and subcategories are expanded
  const [expandedCategories, setExpandedCategories] = useState<ExpandState>({
    income: false,
    fixed: true, // Start with fixed costs expanded
    variable: false,
    extraordinary: false,
  });
  
  // State to track which specific categories are expanded
  const [expandedSubcategories, setExpandedSubcategories] = useState<ExpandState>({});
  
  // State to track editing
  const [editingCell, setEditingCell] = useState<EditState>({
    categoryId: null,
    subHeaderId: null,
    monthIndex: null,
    value: '',
  });
  
  // State for adding new categories and subcategories
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<string>('income');
  const [newSubHeaderName, setNewSubHeaderName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingSubHeader, setAddingSubHeader] = useState<string | null>(null);
  
  // State for editing categories
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingSubHeaderName, setEditingSubHeaderName] = useState('');
  const [editingSubHeaderId, setEditingSubHeaderId] = useState<string | null>(null);

  // Update local categories when props change
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Add a useEffect to ensure the custom styles are injected into the document
  // Function to directly open edit dialog for a category or subheader
  const openEditDialog = (categoryId: string, subHeaderId?: string) => {
    console.log('Direct edit function called:', { categoryId, subHeaderId });
    
    const categoryToEdit = categories.find(cat => cat.id === categoryId);
    if (!categoryToEdit) return;
    
    setEditingCategory(categoryToEdit);
    setEditingCategoryName(categoryToEdit.name);
    
    if (subHeaderId) {
      const subHeader = categoryToEdit.subHeaders.find(sub => sub.id === subHeaderId);
      if (subHeader) {
        setEditingSubHeaderId(subHeaderId);
        setEditingSubHeaderName(subHeader.name);
      }
    } else {
      setEditingSubHeaderId(null);
      setEditingSubHeaderName('');
    }
    
    setEditDialogOpen(true);
  };

  // Enhanced direct click handler for edit icons
  const handleEditIconClick = (e: React.MouseEvent, categoryId: string, subHeaderId?: string) => {
    // Stop event from bubbling up to parent elements
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Edit icon clicked directly with direct handler', { categoryId, subHeaderId });
    openEditDialog(categoryId, subHeaderId);
    
    // Return false to prevent any other handlers from executing
    return false;
  };

  // No need for inline styles anymore - all styling is in the single CSS file

  // Group categories by type
  const categoriesByType = categories.reduce((acc, category) => {
    if (!acc[category.type]) {
      acc[category.type] = [];
    }
    acc[category.type].push(category);
    return acc;
  }, {} as Record<string, BudgetCategory[]>);

  // Calculate monthly totals for each category type
  const monthlySummaries = MONTHS.map(month => {
    const monthLower = month.toLowerCase();
    
    // For each month, calculate the total for each type
    const typeTotals = {
      income: 0,
      fixed: 0,
      variable: 0,
      extraordinary: 0,
    };
    
    // Calculate totals for each type
    Object.entries(categoriesByType).forEach(([type, cats]) => {
      cats.forEach(category => {
        category.subHeaders.forEach(subHeader => {
          const amount = (subHeader.budgetValues?.[monthLower] !== undefined
            ? subHeader.budgetValues[monthLower]
            : subHeader.monthlyamounts?.[monthLower]) || 0;
          
          typeTotals[type as keyof typeof typeTotals] += amount;
        });
      });
    });
    
    // Calculate net income (income - expenses)
    const netIncome = typeTotals.income + typeTotals.fixed + typeTotals.variable + typeTotals.extraordinary;
    
    return {
      month,
      income: typeTotals.income,
      fixed: typeTotals.fixed,
      variable: typeTotals.variable,
      extraordinary: typeTotals.extraordinary,
      netIncome,
    };
  });

  // Calculate yearly totals
  const yearlyTotals = monthlySummaries.reduce((acc, month) => {
    acc.income += month.income;
    acc.fixed += month.fixed;
    acc.variable += month.variable;
    acc.extraordinary += month.extraordinary;
    acc.netIncome += month.netIncome;
    return acc;
  }, { income: 0, fixed: 0, variable: 0, extraordinary: 0, netIncome: 0 });

  // Format a number as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  // Format with appropriate sign and formatting
  const formatAmount = (value: number, type: 'income' | 'expense') => {
    if (type === 'income') {
      return formatCurrency(value);
    } else {
      return `-${formatCurrency(Math.abs(value))}`;
    }
  };

  // Toggle category expansion
  const toggleCategoryExpand = (type: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Toggle subcategory expansion
  const toggleSubcategoryExpand = (categoryId: string) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Calculate category total for a specific month
  const getCategoryTotal = (category: BudgetCategory, month: string) => {
    const monthLower = month.toLowerCase();
    
    return category.subHeaders.reduce((total, subHeader) => {
      const amount = (subHeader.budgetValues?.[monthLower] !== undefined
        ? subHeader.budgetValues[monthLower]
        : subHeader.monthlyamounts?.[monthLower]) || 0;
      
      return total + amount;
    }, 0);
  };

  // Get yearly total for a category
  const getCategoryYearlyTotal = (category: BudgetCategory) => {
    return MONTHS.reduce((total, month) => total + getCategoryTotal(category, month), 0);
  };

  // Get subheader value for a specific month
  const getSubheaderValue = (subHeader: any, month: string) => {
    const monthLower = month.toLowerCase();
    
    return (subHeader.budgetValues?.[monthLower] !== undefined
      ? subHeader.budgetValues[monthLower]
      : subHeader.monthlyamounts?.[monthLower]) || 0;
  };

  // Get yearly total for a subheader
  const getSubheaderYearlyTotal = (subHeader: any) => {
    return MONTHS.reduce((total, month) => {
      return total + getSubheaderValue(subHeader, month);
    }, 0);
  };

  // Handle starting to edit a cell
  const startEdit = (categoryId: string | null, subHeaderId: string | null, monthIndex: number) => {
    let initialValue = '';
    
    if (subHeaderId) {
      // Editing a subheader value
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        const subHeader = category.subHeaders.find(sub => sub.id === subHeaderId);
        if (subHeader) {
          const month = MONTHS[monthIndex].toLowerCase();
          const value = (subHeader.budgetValues?.[month] !== undefined
            ? subHeader.budgetValues[month]
            : subHeader.monthlyamounts?.[month]) || 0;
          initialValue = value.toString();
        }
      }
    }
    
    setEditingCell({
      categoryId,
      subHeaderId,
      monthIndex,
      value: initialValue
    });
  };

  // Handle edit input change
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingCell(prev => ({
      ...prev,
      value: e.target.value
    }));
  };

  // Handle saving an edit
  const saveEdit = async () => {
    const { categoryId, subHeaderId, monthIndex, value } = editingCell;
    if (subHeaderId && monthIndex !== null) {
      const month = MONTHS[monthIndex].toLowerCase();
      const numValue = value === '' ? null : parseFloat(value);
      
      try {
        await updateBudgetAmount(subHeaderId, month, numValue);
        
        // Update local state
        setCategories(prevCategories => {
          return prevCategories.map(category => {
            if (category.id === categoryId) {
              return {
                ...category,
                subHeaders: category.subHeaders.map(subHeader => {
                  if (subHeader.id === subHeaderId) {
                    const updatedBudgetValues = { 
                      ...(subHeader.budgetValues || {}),
                      [month]: numValue
                    };
                    return {
                      ...subHeader,
                      budgetValues: updatedBudgetValues
                    };
                  }
                  return subHeader;
                })
              };
            }
            return category;
          });
        });
      } catch (error) {
        console.error('Error updating budget amount:', error);
      }
    }
    
    // Reset editing state
    setEditingCell({
      categoryId: null,
      subHeaderId: null,
      monthIndex: null,
      value: ''
    });
  };

  // Handle cancel edit
  const cancelEdit = () => {
    setEditingCell({
      categoryId: null,
      subHeaderId: null,
      monthIndex: null,
      value: ''
    });
  };

  // Handle key press in edit input
  const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Add a new category
  const addCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        const { data: newCategory, error } = await supabase
          .from('budget_categories')
          .insert([{
            name: newCategoryName.trim(),
            type: newCategoryType,
            monthlyamounts: {}
          }])
          .select('*')
          .single();
          
        if (error) throw error;
        
        // Add to local state (simplified, would need to reload from server in real app)
        const updatedCategories = await getBudgetData();
        setCategories(updatedCategories);
        
        // Reset form
        setNewCategoryName('');
        setAddingCategory(false);
        
        // Expand the category type
        setExpandedCategories(prev => ({
          ...prev,
          [newCategoryType]: true
        }));
      } catch (error) {
        console.error('Error adding category:', error);
      }
    }
  };

  // Add a new subcategory/subheader
  const addSubHeader = async (categoryId: string) => {
    if (newSubHeaderName.trim()) {
      try {
        const { data: newSubHeader, error } = await supabase
          .from('budget_sub_headers')
          .insert({
            name: newSubHeaderName.trim(),
            category_id: categoryId,
            monthlyamounts: {},
            created_at: new Date().toISOString()
          })
          .select('*')
          .single();
        
        if (error) throw error;
        
        // Update local state (simplified)
        const updatedCategories = await getBudgetData();
        setCategories(updatedCategories);
        
        // Reset form
        setNewSubHeaderName('');
        setAddingSubHeader(null);
        
        // Expand the category
        setExpandedSubcategories(prev => ({
          ...prev,
          [categoryId]: true
        }));
      } catch (error) {
        console.error('Error adding sub-header:', error);
      }
    }
  };

  // Delete a category
  const deleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    try {
      // First delete all sub-headers
      await supabase
        .from('budget_sub_headers')
        .delete()
        .eq('category_id', categoryId);
        
      // Then delete the category
      await supabase
        .from('budget_categories')
        .delete()
        .eq('id', categoryId);
        
      // Update local state
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Delete a subheader
  const deleteSubHeader = async (categoryId: string, subHeaderId: string) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }
    
    try {
      await supabase
        .from('budget_sub_headers')
        .delete()
        .eq('id', subHeaderId);
        
      // Update local state
      setCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subHeaders: cat.subHeaders.filter(sub => sub.id !== subHeaderId)
          };
        }
        return cat;
      }));
    } catch (error) {
      console.error('Error deleting sub-header:', error);
    }
  };
  
  // Function to reload categories data
  async function loadCategories() {
    try {
      const enrichedCategories = await getBudgetData();
      setCategories(enrichedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }
  
  // Rename category
  const renameCategory = async (categoryId: string, newName: string) => {
    try {
      await supabase
        .from('budget_categories')
        .update({ name: newName })
        .eq('id', categoryId);
        
      // Update local state
      setCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            name: newName
          };
        }
        return cat;
      }));
    } catch (error) {
      console.error('Error renaming category:', error);
    }
  };
  
  // Rename subheader
  const renameSubHeader = async (categoryId: string, subHeaderId: string, newName: string) => {
    try {
      await supabase
        .from('budget_sub_headers')
        .update({ name: newName })
        .eq('id', subHeaderId);
        
      // Update local state
      setCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subHeaders: cat.subHeaders.map(sub => {
              if (sub.id === subHeaderId) {
                return {
                  ...sub,
                  name: newName
                };
              }
              return sub;
            })
          };
        }
        return cat;
      }));
    } catch (error) {
      console.error('Error renaming sub-header:', error);
    }
  };

  return (
    <div className="budget-summary-card">
      <div className="card-header">
        <h2 className="card-title">Budget Summary {year}</h2>
        <p className="card-subtitle">Overview of your budget across all categories</p>
      </div>
      
      <div className="card-content" style={{ padding: '0.5rem' }}>
        <div 
          className="table-container" 
        >
          <table className="budget-table budget-summary-table">
            <thead>
              <tr className="category-type-row">
                <th>Category Type</th>
                {MONTHS.map(month => (
                  <th key={month} className="budget-cell-month">{month}</th>
                ))}
                <th className="budget-cell-month total-cell">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Income row with expandability */}
              <tr 
                className={`category-row income-row has-border ${expandedCategories.income ? 'expanded' : ''}`}
                onClick={() => toggleCategoryExpand('income')}
              >
                <td className="category-name">
                  {expandedCategories.income ? 
                    <ChevronDown size={18} className="chevron-icon" /> : 
                    <ChevronRight size={18} className="chevron-icon" />
                  }
                  Income
                </td>
                {monthlySummaries.map(summary => (
                  <td key={summary.month} className="budget-cell-month income-value">
                    {formatCurrency(summary.income)}
                  </td>
                ))}
                <td className="budget-cell-month income-value total-cell">
                  {formatCurrency(yearlyTotals.income)}
                </td>
              </tr>
              
              {/* Income subcategories when expanded */}
              {expandedCategories.income && categoriesByType.income && categoriesByType.income.map(category => (
                <React.Fragment key={category.id}>
                  {/* Category row */}
                  <tr 
                    className={`subcategory-row ${expandedSubcategories[category.id] ? 'expanded' : ''}`}
                    data-category-id={category.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubcategoryExpand(category.id);
                    }}
                  >
                    <td className="category-name" style={{ paddingLeft: '2rem' }}>
                      {expandedSubcategories[category.id] ? 
                        <ChevronDown size={16} className="chevron-icon" /> : 
                        <ChevronRight size={16} className="chevron-icon" />
                      }
                      {category.name}
                      <div className="cell-actions">
                        <Edit 
                          size={16} 
                          className="action-icon" 
                          style={{ 
                            cursor: 'pointer', 
                            zIndex: 999,
                            position: 'relative',
                            pointerEvents: 'auto'
                          }}
                          data-action="edit"
                          onClick={(e) => handleEditIconClick(e, category.id)}
                        />
                        <Trash 
                          size={16} 
                          className="delete-icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(category.id);
                          }}
                        />
                      </div>
                    </td>
                    {MONTHS.map(month => (
                      <td key={month} className="budget-cell-month income-value">
                        {formatCurrency(getCategoryTotal(category, month))}
                      </td>
                    ))}
                    <td className="budget-cell-month income-value total-cell">
                      {formatCurrency(getCategoryYearlyTotal(category))}
                    </td>
                  </tr>
                  
                  {/* Individual items when subcategory is expanded */}
                  {expandedSubcategories[category.id] && category.subHeaders.map(subHeader => (
                    <tr 
                    key={subHeader.id} 
                    className="item-row"
                    data-category-id={category.id}
                    data-sub-header-id={subHeader.id}
                  >
                      <td style={{ paddingLeft: '3rem' }}>
                        {subHeader.name}
                        <div className="cell-actions">
                          <Edit 
                          size={16} 
                          className="action-icon" 
                          style={{ 
                            cursor: 'pointer', 
                            zIndex: 999,
                            position: 'relative',
                            pointerEvents: 'auto'
                          }}
                          data-action="edit"
                          onClick={(e) => handleEditIconClick(e, category.id, subHeader.id)}
                          />
                          <Trash 
                            size={16} 
                            className="delete-icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSubHeader(category.id, subHeader.id);
                            }}
                          />
                        </div>
                      </td>
                      {MONTHS.map((month, index) => (
                        <td 
                          key={month} 
                          className="budget-cell-month income-value editable-cell"
                          onClick={() => startEdit(category.id, subHeader.id, index)}
                        >
                          {editingCell.subHeaderId === subHeader.id && editingCell.monthIndex === index ? (
                            <input
                              type="number"
                              className="edit-input"
                              value={editingCell.value}
                              onChange={handleEditChange}
                              onBlur={saveEdit}
                              onKeyDown={handleEditKeyPress}
                              autoFocus
                            />
                          ) : (
                            formatCurrency(getSubheaderValue(subHeader, month))
                          )}
                        </td>
                      ))}
                      <td className="budget-cell-month income-value total-cell">
                        {formatCurrency(getSubheaderYearlyTotal(subHeader))}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Add new subheader form */}
                  {expandedSubcategories[category.id] && (
                    <tr className="item-row">
                      <td colSpan={14} style={{ paddingLeft: '3rem' }}>
                        {addingSubHeader === category.id ? (
                          <div className="add-form">
                            <input
                              type="text"
                              className="add-input"
                              value={newSubHeaderName}
                              onChange={(e) => setNewSubHeaderName(e.target.value)}
                              placeholder="New item name"
                              autoFocus
                            />
                            <button className="add-btn" onClick={() => addSubHeader(category.id)}>Add</button>
                            <button className="cancel-btn" onClick={() => setAddingSubHeader(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button 
                            className="add-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddingSubHeader(category.id);
                            }}
                          >
                            + Add Item
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {/* Fixed Costs row with expandability */}
              <tr 
                className={`category-row fixed-costs-row ${expandedCategories.fixed ? 'expanded' : ''}`}
                onClick={() => toggleCategoryExpand('fixed')}
              >
                <td className="category-name">
                  {expandedCategories.fixed ? 
                    <ChevronDown size={18} className="chevron-icon" /> : 
                    <ChevronRight size={18} className="chevron-icon" />
                  }
                  Fixed Costs
                </td>
                {monthlySummaries.map(summary => (
                  <td key={summary.month} className="budget-cell-month expense-value">
                    {formatAmount(summary.fixed, 'expense')}
                  </td>
                ))}
                <td className="budget-cell-month expense-value total-cell">
                  {formatAmount(yearlyTotals.fixed, 'expense')}
                </td>
              </tr>
              
              {/* Fixed costs subcategories when expanded */}
              {expandedCategories.fixed && categoriesByType.fixed && categoriesByType.fixed.map(category => (
                <React.Fragment key={category.id}>
                  {/* Category row */}
                  <tr 
                    className={`subcategory-row ${expandedSubcategories[category.id] ? 'expanded' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubcategoryExpand(category.id);
                    }}
                  >
                    <td className="category-name" style={{ paddingLeft: '2rem' }}>
                      {expandedSubcategories[category.id] ? 
                        <ChevronDown size={16} className="chevron-icon" /> : 
                        <ChevronRight size={16} className="chevron-icon" />
                      }
                      {category.name}
                      <div className="cell-actions">
                        <Edit 
                          size={16} 
                          className="action-icon"
                          style={{ 
                            cursor: 'pointer', 
                            zIndex: 999,
                            position: 'relative',
                            pointerEvents: 'auto'
                          }}
                          data-action="edit"
                          onClick={(e) => handleEditIconClick(e, category.id)}
                        />
                        <Trash 
                          size={16} 
                          className="delete-icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(category.id);
                          }}
                        />
                      </div>
                    </td>
                    {MONTHS.map(month => (
                      <td key={month} className="budget-cell-month expense-value">
                        {formatAmount(getCategoryTotal(category, month), 'expense')}
                      </td>
                    ))}
                    <td className="budget-cell-month expense-value total-cell">
                      {formatAmount(getCategoryYearlyTotal(category), 'expense')}
                    </td>
                  </tr>
                  
                  {/* Individual items when subcategory is expanded */}
                  {expandedSubcategories[category.id] && category.subHeaders.map(subHeader => (
                    <tr key={subHeader.id} className="item-row">
                      <td style={{ paddingLeft: '3rem' }}>
                        {subHeader.name}
                        <div className="cell-actions">
                          <Edit 
                            size={16} 
                            className="action-icon" 
                            style={{ 
                              cursor: 'pointer', 
                              zIndex: 999,
                              position: 'relative',
                              pointerEvents: 'auto'
                            }}
                            data-action="edit"
                            onClick={(e) => handleEditIconClick(e, category.id, subHeader.id)}
                          />
                          <Trash 
                            size={16} 
                            className="delete-icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSubHeader(category.id, subHeader.id);
                            }}
                          />
                        </div>
                      </td>
                      {MONTHS.map((month, index) => (
                        <td 
                          key={month} 
                          className="budget-cell-month expense-value editable-cell"
                          onClick={() => startEdit(category.id, subHeader.id, index)}
                        >
                          {editingCell.subHeaderId === subHeader.id && editingCell.monthIndex === index ? (
                            <input
                              type="number"
                              className="edit-input"
                              value={editingCell.value}
                              onChange={handleEditChange}
                              onBlur={saveEdit}
                              onKeyDown={handleEditKeyPress}
                              autoFocus
                            />
                          ) : (
                            formatAmount(getSubheaderValue(subHeader, month), 'expense')
                          )}
                        </td>
                      ))}
                      <td className="budget-cell-month expense-value total-cell">
                        {formatAmount(getSubheaderYearlyTotal(subHeader), 'expense')}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Add new subheader form */}
                  {expandedSubcategories[category.id] && (
                    <tr className="item-row">
                      <td colSpan={14} style={{ paddingLeft: '3rem' }}>
                        {addingSubHeader === category.id ? (
                          <div className="add-form">
                            <input
                              type="text"
                              className="add-input"
                              value={newSubHeaderName}
                              onChange={(e) => setNewSubHeaderName(e.target.value)}
                              placeholder="New item name"
                              autoFocus
                            />
                            <button className="add-btn" onClick={() => addSubHeader(category.id)}>Add</button>
                            <button className="cancel-btn" onClick={() => setAddingSubHeader(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button 
                            className="add-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddingSubHeader(category.id);
                            }}
                          >
                            + Add Item
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {/* Variable Costs row with expandability */}
              <tr 
                className={`category-row variable-costs-row ${expandedCategories.variable ? 'expanded' : ''}`}
                onClick={() => toggleCategoryExpand('variable')}
              >
                <td className="category-name">
                  {expandedCategories.variable ? 
                    <ChevronDown size={18} className="chevron-icon" /> : 
                    <ChevronRight size={18} className="chevron-icon" />
                  }
                  Variable Costs
                </td>
                {monthlySummaries.map(summary => (
                  <td key={summary.month} className="budget-cell-month expense-value">
                    {formatAmount(summary.variable, 'expense')}
                  </td>
                ))}
                <td className="budget-cell-month expense-value total-cell">
                  {formatAmount(yearlyTotals.variable, 'expense')}
                </td>
              </tr>
              
              {/* Variable costs subcategories when expanded */}
              {expandedCategories.variable && categoriesByType.variable && categoriesByType.variable.map(category => (
                <React.Fragment key={category.id}>
                  {/* Category row */}
                  <tr 
                    className={`subcategory-row ${expandedSubcategories[category.id] ? 'expanded' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubcategoryExpand(category.id);
                    }}
                  >
                    <td className="category-name" style={{ paddingLeft: '2rem' }}>
                      {expandedSubcategories[category.id] ? 
                        <ChevronDown size={16} className="chevron-icon" /> : 
                        <ChevronRight size={16} className="chevron-icon" />
                      }
                      {category.name}
                      <div className="cell-actions">
                        <Edit 
                          size={16} 
                          className="action-icon" 
                          style={{ 
                            cursor: 'pointer', 
                            zIndex: 999,
                            position: 'relative',
                            pointerEvents: 'auto'
                          }}
                          data-action="edit"
                          onClick={(e) => handleEditIconClick(e, category.id)}
                        />
                        <Trash 
                          size={16} 
                          className="delete-icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(category.id);
                          }}
                        />
                      </div>
                    </td>
                    {MONTHS.map(month => (
                      <td key={month} className="budget-cell-month expense-value">
                        {formatAmount(getCategoryTotal(category, month), 'expense')}
                      </td>
                    ))}
                    <td className="budget-cell-month expense-value total-cell">
                      {formatAmount(getCategoryYearlyTotal(category), 'expense')}
                    </td>
                  </tr>
                  
                  {/* Individual items when subcategory is expanded */}
                  {expandedSubcategories[category.id] && category.subHeaders.map(subHeader => (
                    <tr key={subHeader.id} className="item-row">
                      <td style={{ paddingLeft: '3rem' }}>
                        {subHeader.name}
                        <div className="cell-actions">
                          <Edit 
                            size={16} 
                            className="action-icon" 
                            style={{ 
                              cursor: 'pointer', 
                              zIndex: 999,
                              position: 'relative',
                              pointerEvents: 'auto'
                            }}
                            data-action="edit"
                            onClick={(e) => handleEditIconClick(e, category.id, subHeader.id)}
                          />
                          <Trash 
                            size={16} 
                            className="delete-icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSubHeader(category.id, subHeader.id);
                            }}
                          />
                        </div>
                      </td>
                      {MONTHS.map((month, index) => (
                        <td 
                          key={month} 
                          className="budget-cell-month expense-value editable-cell"
                          onClick={() => startEdit(category.id, subHeader.id, index)}
                        >
                          {editingCell.subHeaderId === subHeader.id && editingCell.monthIndex === index ? (
                            <input
                              type="number"
                              className="edit-input"
                              value={editingCell.value}
                              onChange={handleEditChange}
                              onBlur={saveEdit}
                              onKeyDown={handleEditKeyPress}
                              autoFocus
                            />
                          ) : (
                            formatAmount(getSubheaderValue(subHeader, month), 'expense')
                          )}
                        </td>
                      ))}
                      <td className="budget-cell-month expense-value total-cell">
                        {formatAmount(getSubheaderYearlyTotal(subHeader), 'expense')}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Add new subheader form */}
                  {expandedSubcategories[category.id] && (
                    <tr className="item-row">
                      <td colSpan={14} style={{ paddingLeft: '3rem' }}>
                        {addingSubHeader === category.id ? (
                          <div className="add-form">
                            <input
                              type="text"
                              className="add-input"
                              value={newSubHeaderName}
                              onChange={(e) => setNewSubHeaderName(e.target.value)}
                              placeholder="New item name"
                              autoFocus
                            />
                            <button className="add-btn" onClick={() => addSubHeader(category.id)}>Add</button>
                            <button className="cancel-btn" onClick={() => setAddingSubHeader(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button 
                            className="add-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddingSubHeader(category.id);
                            }}
                          >
                            + Add Item
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {/* Extraordinary Costs row with expandability */}
              <tr 
                className={`category-row extraordinary-costs-row ${expandedCategories.extraordinary ? 'expanded' : ''}`}
                onClick={() => toggleCategoryExpand('extraordinary')}
              >
                <td className="category-name">
                  {expandedCategories.extraordinary ? 
                    <ChevronDown size={18} className="chevron-icon" /> : 
                    <ChevronRight size={18} className="chevron-icon" />
                  }
                  Extraordinary Costs
                </td>
                {monthlySummaries.map(summary => (
                  <td key={summary.month} className="budget-cell-month expense-value">
                    {formatAmount(summary.extraordinary, 'expense')}
                  </td>
                ))}
                <td className="budget-cell-month expense-value total-cell">
                  {formatAmount(yearlyTotals.extraordinary, 'expense')}
                </td>
              </tr>
              
              {/* Extraordinary costs subcategories when expanded */}
              {expandedCategories.extraordinary && categoriesByType.extraordinary && categoriesByType.extraordinary.map(category => (
                <React.Fragment key={category.id}>
                  {/* Category row */}
                  <tr 
                    className={`subcategory-row ${expandedSubcategories[category.id] ? 'expanded' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubcategoryExpand(category.id);
                    }}
                  >
                    <td className="category-name" style={{ paddingLeft: '2rem' }}>
                      {expandedSubcategories[category.id] ? 
                        <ChevronDown size={16} className="chevron-icon" /> : 
                        <ChevronRight size={16} className="chevron-icon" />
                      }
                      {category.name}
                      <div className="cell-actions">
                          <Edit 
                            size={16} 
                            className="action-icon" 
                            style={{ 
                              cursor: 'pointer', 
                              zIndex: 999,
                              position: 'relative',
                              pointerEvents: 'auto'
                            }}
                            data-action="edit"
                            onClick={(e) => handleEditIconClick(e, category.id)}
                          />
                        <Trash 
                          size={16} 
                          className="delete-icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(category.id);
                          }}
                        />
                      </div>
                    </td>
                    {MONTHS.map(month => (
                      <td key={month} className="budget-cell-month expense-value">
                        {formatAmount(getCategoryTotal(category, month), 'expense')}
                      </td>
                    ))}
                    <td className="budget-cell-month expense-value total-cell">
                      {formatAmount(getCategoryYearlyTotal(category), 'expense')}
                    </td>
                  </tr>
                  
                  {/* Individual items when subcategory is expanded */}
                  {expandedSubcategories[category.id] && category.subHeaders.map(subHeader => (
                    <tr key={subHeader.id} className="item-row">
                      <td style={{ paddingLeft: '3rem' }}>
                        {subHeader.name}
                        <div className="cell-actions">
                          <Edit 
                            size={16} 
                            className="action-icon" 
                            style={{ 
                              cursor: 'pointer', 
                              zIndex: 999,
                              position: 'relative',
                              pointerEvents: 'auto'
                            }}
                            data-action="edit"
                            onClick={(e) => handleEditIconClick(e, category.id, subHeader.id)}
                          />
                          <Trash 
                            size={16} 
                            className="delete-icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSubHeader(category.id, subHeader.id);
                            }}
                          />
                        </div>
                      </td>
                      {MONTHS.map((month, index) => (
                        <td 
                          key={month} 
                          className="budget-cell-month expense-value editable-cell"
                          onClick={() => startEdit(category.id, subHeader.id, index)}
                        >
                          {editingCell.subHeaderId === subHeader.id && editingCell.monthIndex === index ? (
                            <input
                              type="number"
                              className="edit-input"
                              value={editingCell.value}
                              onChange={handleEditChange}
                              onBlur={saveEdit}
                              onKeyDown={handleEditKeyPress}
                              autoFocus
                            />
                          ) : (
                            formatAmount(getSubheaderValue(subHeader, month), 'expense')
                          )}
                        </td>
                      ))}
                      <td className="budget-cell-month expense-value total-cell">
                        {formatAmount(getSubheaderYearlyTotal(subHeader), 'expense')}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Add new subheader form */}
                  {expandedSubcategories[category.id] && (
                    <tr className="item-row">
                      <td colSpan={14} style={{ paddingLeft: '3rem' }}>
                        {addingSubHeader === category.id ? (
                          <div className="add-form">
                            <input
                              type="text"
                              className="add-input"
                              value={newSubHeaderName}
                              onChange={(e) => setNewSubHeaderName(e.target.value)}
                              placeholder="New item name"
                              autoFocus
                            />
                            <button className="add-btn" onClick={() => addSubHeader(category.id)}>Add</button>
                            <button className="cancel-btn" onClick={() => setAddingSubHeader(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button 
                            className="add-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddingSubHeader(category.id);
                            }}
                          >
                            + Add Item
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {/* Net Income row */}
              <tr className="total-row net-income-row">
                <td>Net Income</td>
                {monthlySummaries.map(summary => (
                  <td 
                    key={summary.month} 
                    className={`budget-cell-month ${summary.netIncome >= 0 ? 'income-value' : 'expense-value'}`}
                  >
                    {summary.netIncome >= 0 
                      ? formatCurrency(summary.netIncome)
                      : `-${formatCurrency(Math.abs(summary.netIncome))}`}
                  </td>
                ))}
                <td 
                  className={`budget-cell-month total-cell ${yearlyTotals.netIncome >= 0 ? 'income-value' : 'expense-value'}`}
                >
                  {yearlyTotals.netIncome >= 0 
                    ? formatCurrency(yearlyTotals.netIncome)
                    : `-${formatCurrency(Math.abs(yearlyTotals.netIncome))}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Add new category form */}
        <div style={{ marginTop: '20px' }}>
          {addingCategory ? (
            <div className="add-form" style={{ maxWidth: '500px' }}>
              <input
                type="text"
                className="add-input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                style={{ flex: '1' }}
                autoFocus
              />
              <select 
                className="add-select" 
                value={newCategoryType}
                onChange={(e) => setNewCategoryType(e.target.value)}
              >
                <option value="income">Income</option>
                <option value="fixed">Fixed Cost</option>
                <option value="variable">Variable Cost</option>
                <option value="extraordinary">Extraordinary Cost</option>
              </select>
              <button className="add-btn" onClick={addCategory}>Add Category</button>
              <button className="cancel-btn" onClick={() => setAddingCategory(false)}>Cancel</button>
            </div>
          ) : (
            <button 
              className="add-category-btn" 
              onClick={() => setAddingCategory(true)}
            >
              <PlusCircle size={16} />
              Add New Category
            </button>
          )}
        </div>
      </div>

      {/* Simplified Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dialog-edit-content" style={{ position: 'fixed', zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingCategory && (
              <div className="space-y-2">
                <Label htmlFor="categoryName">Name</Label>
                <Input 
                  id="categoryName" 
                  value={editingCategoryName || (editingCategory ? editingCategory.name : '')} 
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                />

                {editingSubHeaderId && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="subheaderName">Item Name</Label>
                    <Input 
                      id="subheaderName" 
                      value={editingSubHeaderName} 
                      onChange={(e) => setEditingSubHeaderName(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditDialogOpen(false);
                      setEditingCategory(null);
                      setEditingSubHeaderId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (editingCategory) {
                        if (editingSubHeaderId) {
                          // Update subheader
                          if (editingSubHeaderName) {
                            await renameSubHeader(
                              editingCategory.id,
                              editingSubHeaderId,
                              editingSubHeaderName
                            );
                          }
                        } else if (editingCategoryName && editingCategoryName !== editingCategory.name) {
                          // Update category
                          await renameCategory(editingCategory.id, editingCategoryName);
                        }
                        setEditDialogOpen(false);
                        setEditingCategory(null);
                        setEditingSubHeaderId(null);
                        setEditingCategoryName('');
                        setEditingSubHeaderName('');
                        // Reload categories to reflect changes
                        loadCategories();
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
