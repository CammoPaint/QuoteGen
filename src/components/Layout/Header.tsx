import React from 'react';
import { User, Settings, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-[#4285F4]">Insytify CRM</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#4285F4] flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
              
              <button
                onClick={signOut}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};