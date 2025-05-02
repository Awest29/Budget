import { Button } from "@/components/ui/button"
import { PieChart, FileText, BarChart, Users, LogOut } from 'lucide-react'
import { supabase } from '@/lib/lib/supabase'
import { useToast } from "@/hooks/use-toast"
import { ViewType } from '../../types/navigation'

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      })
    } catch (error) {
      console.error('Error logging out:', error)
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const menuItems = [
    {
      title: 'Budget 2025',
      icon: <PieChart className="w-5 h-5" />,
      view: 'budget' as ViewType
    },
    {
      title: 'Import 2025',
      icon: <FileText className="w-5 h-5" />,
      view: 'transactions-2025' as ViewType
    },
    {
      title: 'Actuals vs Budget 2025',
      icon: <BarChart className="w-5 h-5" />,
      view: 'analysis-2025' as ViewType
    },
    {
      title: 'Spender 2025',
      icon: <Users className="w-5 h-5" />,
      view: 'person-analysis-2025' as ViewType
    }
  ]

  return (
    <div className="w-64 h-screen flex-shrink-0 p-6 flex flex-col bg-gray-800">
      <div className="flex items-center mb-8">
        <PieChart className="w-6 h-6 text-blue-400 mr-2" />
        <span className="text-xl font-bold text-white">FinancePro 2025</span>
      </div>
        
      <nav className="flex flex-col gap-3 flex-grow">
        {menuItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${currentView === item.view 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700'
              }`}
          >
            {item.icon}
            <span className="font-medium">{item.title}</span>
          </button>
        ))}
      </nav>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
          text-red-400 hover:bg-gray-700 mt-4"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  )
}