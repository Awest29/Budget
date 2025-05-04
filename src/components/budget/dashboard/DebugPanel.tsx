import React from 'react';

interface DebugPanelProps {
  state: {
    selectedMonth: string;
    isYTD: boolean;
    categoriesCount: number;
    budgetAdherence?: number;
    alertCategories?: number;
    alertCategoryNames?: string[];
  };
}

// A small helper component to display debug information in development
export function DebugPanel({ state }: DebugPanelProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded-tl-lg opacity-75 z-50">
      <h3 className="font-bold mb-1">Debug Info</h3>
      <div className="space-y-1">
        <div><span className="font-medium">Month:</span> {state.selectedMonth}</div>
        <div><span className="font-medium">YTD:</span> {state.isYTD ? 'Yes' : 'No'}</div>
        <div><span className="font-medium">Categories:</span> {state.categoriesCount}</div>
      </div>
    </div>
  );
}

export default DebugPanel;