// src/components/budget/CategoryDialog.tsx
import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash2 } from "lucide-react"
import type { BudgetCategory, BudgetItemType, BudgetSubHeader } from '../../types/budget'

interface CategoryDialogProps {
  type: BudgetItemType;
  onSave: (category: Omit<BudgetCategory, 'id'>) => void;
  isEditing?: boolean;
  existingCategory?: BudgetCategory;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SubHeaderFormData {
  id?: string;  // Add this line
  name: string;
  entries: never[];
  monthlyamounts: Record<string, number | null>;
}

export function CategoryDialog({ 
  type, 
  onSave, 
  isEditing = false, 
  existingCategory,
  open: controlledOpen,
  onOpenChange
}: CategoryDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [categoryName, setCategoryName] = React.useState(existingCategory?.name || '')
  const [subHeaders, setSubHeaders] = React.useState<SubHeaderFormData[]>(
    existingCategory?.subHeaders.map(sub => ({
      id: sub.id,
      name: sub.name,
      entries: [],
      monthlyamounts: sub.monthlyamounts || {}
    })) || []
  )
  
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Update state when existingCategory changes
  React.useEffect(() => {
    if (existingCategory) {
      setCategoryName(existingCategory.name);
      setSubHeaders(
        existingCategory.subHeaders.map(sub => ({
          id: sub.id,
          name: sub.name,
          entries: [],
          monthlyamounts: sub.monthlyamounts || {}
        }))
      );
    }
  }, [existingCategory]);

  const handleAddSubHeader = () => {
    setSubHeaders(current => [...current, { 
      name: '', 
      entries: [], 
      monthlyamounts: {},
      id: undefined // new sub-headers won't have an ID
    }])
  }

  const handleRemoveSubHeader = (index: number) => {
    setSubHeaders(subHeaders.filter((_, i) => i !== index))
  }

  const handleSubHeaderNameChange = (index: number, name: string) => {
    setSubHeaders(current => 
      current.map((header, i) => 
        i === index 
          ? { ...header, name } 
          : header
      )
    )
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Get existing sub-header IDs to identify deletions
    const existingSubHeaderIds = new Set(existingCategory?.subHeaders.map(sh => sh.id) || []);
    const updatedSubHeaderIds = new Set(subHeaders.filter(sh => sh.id).map(sh => sh.id));
    
    // Find deleted sub-headers (those that exist in original but not in updated)
    const deletedSubHeaderIds = Array.from(existingSubHeaderIds)
      .filter(id => !updatedSubHeaderIds.has(id));
  
    onSave({
      type,
      name: categoryName,
      monthlyamounts: {},
      subHeaders: subHeaders
        .filter(header => header.name.trim() !== '')
        .map(header => ({
          ...header,
          id: header.id || '',
          name: header.name,
          monthlyamounts: header.monthlyamounts || {},
          category_id: existingCategory?.id || '',
          entries: []
        })) as BudgetSubHeader[],
      deletedSubHeaderIds // Add this to pass deleted IDs
    })
    
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} style={{ zIndex: 9999 }} onOpenAutoFocus={(e) => {console.log('dialog opened', e);}}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] bg-white z-[9999] relative" style={{ zIndex: 9999 }}>
        <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Budget Category' : 'Add Budget Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Housing, Transportation"
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Sub-headers</Label>
            {subHeaders.map((header, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={header.name}
                  onChange={(e) => handleSubHeaderNameChange(index, e.target.value)}
                  placeholder="e.g., Fixed Costs, Variable Costs"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleRemoveSubHeader(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddSubHeader}
              className="w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Sub-header
            </Button>
          </div>

          <Button type="submit" className="w-full">Save Category</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}