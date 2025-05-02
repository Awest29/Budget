import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BudgetCategory } from '../../types/budget'

interface EditCategoryDialogProps {
  category: BudgetCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onRenameSubHeader: (categoryId: string, subHeaderId: string, newName: string) => void;
}

export function EditCategoryDialog({ 
  category, 
  open, 
  onOpenChange,
  onRenameCategory,
  onRenameSubHeader 
}: EditCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState(category.name)
  const [subHeaderNames, setSubHeaderNames] = useState(
    category.subHeaders.map(sub => ({ id: sub.id, name: sub.name }))
  )
  
  // Reset state when category changes
  useEffect(() => {
    setCategoryName(category.name);
    setSubHeaderNames(category.subHeaders.map(sub => ({ id: sub.id, name: sub.name })));
  }, [category])

  const handleSave = () => {
    onRenameCategory(category.id, categoryName)
    subHeaderNames.forEach(sub => {
      onRenameSubHeader(category.id, sub.id, sub.name)
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} forceMount={true}>
      <DialogContent className="sm:max-w-[425px] bg-white z-50">  {/* Added bg-white and z-50 */}
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Sub-headers</Label>
            {subHeaderNames.map((sub, index) => (
              <Input
                key={sub.id}
                value={sub.name}
                onChange={(e) => {
                  const newSubHeaders = [...subHeaderNames]
                  newSubHeaders[index] = { ...sub, name: e.target.value }
                  setSubHeaderNames(newSubHeaders)
                }}
              />
            ))}
          </div>
          <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}