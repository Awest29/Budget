// src/App.tsx
import { useState, useEffect } from 'react';
import { ModernBudgetDashboard } from './components/budget/ModernBudgetDashboard.tsx';
import { ModernTransactionsPage } from './components/transactions/ModernTransactionsPage.tsx';
import { ModernPersonBudgetAnalysis } from './components/budget/ModernPersonBudgetAnalysis.tsx';
import { ModernBudgetComparisonPage } from './components/budget/comparison/ModernBudgetComparisonPage.tsx';
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from './components/layout/ModernSidebar';
import { supabase } from './lib/lib/supabase';
import ModernAuth from './components/ModernAuth.tsx';
import { User } from '@supabase/supabase-js';
import './components/layout/layout.css';

type ViewType = 'budget' | 'transactions-2025' | 'analysis-2025' | 'person-analysis-2025';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('budget');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return <ModernAuth />;
  }

  return (
    <div className="app-layout">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="app-main">
        {currentView === 'budget' ? (
          <ModernBudgetDashboard year={2025} />
        ) : currentView === 'transactions-2025' ? (
          <ModernTransactionsPage year={2025} />
        ) : currentView === 'analysis-2025' ? (
          <ModernBudgetComparisonPage year={2025} />
        ) : currentView === 'person-analysis-2025' ? (
          <ModernPersonBudgetAnalysis year={2025} />
        ) : (
          <ModernBudgetDashboard year={2025} />
        )}
      </main>
      
      <Toaster />
    </div>
  );
}