import React from 'react';
import { Clock, User, FileText, CheckSquare } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'customer' | 'quote' | 'task';
  title: string;
  description: string;
  time: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'customer',
    title: 'New customer added',
    description: 'StartupXYZ joined as a new customer',
    time: '2 hours ago'
  },
  {
    id: '2',
    type: 'quote',
    title: 'Quote approved',
    description: 'AI Chatbot Platform quote approved by Tech Innovations Inc',
    time: '4 hours ago'
  },
  {
    id: '3',
    type: 'task',
    title: 'Task completed',
    description: 'Initial consultation call with Creative Design Studio',
    time: '6 hours ago'
  },
  {
    id: '4',
    type: 'quote',
    title: 'Quote generated',
    description: 'New quote created for e-commerce platform project',
    time: '1 day ago'
  }
];

const getIcon = (type: string) => {
  switch (type) {
    case 'customer':
      return <User className="h-4 w-4 text-brand" />;
    case 'quote':
      return <FileText className="h-4 w-4 text-[#34A853]" />;
    case 'task':
      return <CheckSquare className="h-4 w-4 text-[#FBBC05]" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

export const RecentActivity: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 p-2 bg-gray-50 rounded-full">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};