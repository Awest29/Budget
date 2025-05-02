import React from 'react';
import { BarChart, DollarSign, FileText, PieChart, Upload, LogOut, Clock } from 'lucide-react';
import { supabase } from '@/lib/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type ViewType = 'budget' | 'transactions-2025' | 'analysis-2025' | 'person-analysis-2025';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };
  const menuItems = [
    { id: 'budget', label: 'Budget 2025', icon: <BarChart size={20} /> },
    { id: 'transactions-2025', label: 'Transactions', icon: <DollarSign size={20} /> },
    { id: 'analysis-2025', label: 'Budget Analysis', icon: <PieChart size={20} /> },
    { id: 'person-analysis-2025', label: 'Personal Analysis', icon: <FileText size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Clock className="logo-icon" />
          <h1 className="logo-text">FinancePro</h1>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.id} className="sidebar-menu-item">
              <button
                className={`sidebar-menu-button ${currentView === item.id ? 'active' : ''}`}
                onClick={() => onViewChange(item.id as ViewType)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <button className="sidebar-footer-button" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
