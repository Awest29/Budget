// src/components/layout/ModernAppLayout.tsx
import React, { ReactNode } from 'react';
import { Sidebar } from './ModernSidebar';
import { Toaster } from "@/components/ui/toaster";
import './layout.css';

type ViewType = 'budget' | 'transactions-2025' | 'analysis-2025' | 'person-analysis-2025';

interface ModernAppLayoutProps {
  children: ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ModernAppLayout({ 
  children, 
  currentView, 
  onViewChange 
}: ModernAppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar currentView={currentView} onViewChange={onViewChange} />
      
      <main className="app-main">
        {children}
      </main>
      
      <Toaster />
    </div>
  );
}

export default ModernAppLayout;