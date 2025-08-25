import React from 'react';
import { Plus, Users, FileText, CheckSquare } from 'lucide-react';

interface QuickActionProps {
  onAction: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionProps> = ({ onAction }) => {
  const actions = [
    {
      id: 'new-customer',
      label: 'Add Customer',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-[#4285F4] hover:bg-blue-600'
    },
    {
      id: 'new-quote',
      label: 'Generate Quote',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-[#34A853] hover:bg-green-600'
    },
    {
      id: 'new-task',
      label: 'Create Task',
      icon: <CheckSquare className="h-5 w-5" />,
      color: 'bg-[#FBBC05] hover:bg-yellow-500'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="grid gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-md transition-colors ${action.color}`}
            >
              {action.icon}
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};