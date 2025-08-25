import React from 'react';
import { 
  Home, 
  Users, 
  FileText, 
  CheckSquare, 
  BarChart3,
  Settings,
  Target,
  TrendingUp,
  DollarSign,
  MapPin
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: Home },
  { id: 'tasks', name: 'Tasks', icon: CheckSquare },
  { id: 'leads', name: 'Leads', icon: Target },
  { id: 'lead-search', name: 'Lead Search', icon: MapPin },
  { id: 'pipeline', name: 'Pipeline', icon: TrendingUp },  
  { id: 'customers', name: 'Customers', icon: Users },
  { id: 'quotes', name: 'Quotes', icon: FileText },
  // { id: 'commissions', name: 'Commissions', icon: DollarSign },
  // { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'users', name: 'Team Members', icon: Users },
  { id: 'settings', name: 'Settings', icon: Settings },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userRole }) => {
  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.filter(item => {
            // Hide admin-only features for non-admin users
            if (item.id === 'users' && userRole !== 'admin') return false;
            return true;
          }).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#4285F4] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};