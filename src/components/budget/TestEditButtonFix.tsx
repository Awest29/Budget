import React, { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle, Dialog } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import './css-fix/edit-button-fix.css';

export const TestEditButtonFix = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState('');

  const openEditDialog = (item: string) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test Edit Button Functionality</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="border p-4 rounded">
          <div className="flex items-center justify-between">
            <span>Utilities</span>
            <div className="cell-actions">
              <Edit
                size={16}
                className="action-icon"
                style={{ cursor: 'pointer', zIndex: 999 }}
                data-action="edit"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Edit button clicked!');
                  openEditDialog('Utilities');
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="border p-4 rounded">
          <div className="flex items-center justify-between">
            <span>Water</span>
            <div className="cell-actions">
              <Edit
                size={16}
                className="action-icon"
                style={{ cursor: 'pointer', zIndex: 999 }}
                data-action="edit"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Edit button clicked!');
                  openEditDialog('Water');
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <Dialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        style={{ position: 'fixed', zIndex: 9999 }}
      >
        <DialogContent className="bg-white dialog-edit-content" style={{ zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle>Editing: {editingItem}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>This dialog confirms the edit button is working correctly.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestEditButtonFix;