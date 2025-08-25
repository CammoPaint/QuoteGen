import React from 'react';
import { Clock, User, AlertCircle, CheckSquare } from 'lucide-react';
import { Task } from '../../types';

interface TodaysTasksProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const TodaysTasks: React.FC<TodaysTasksProps> = ({ tasks, onTaskClick }) => {
  const todaysTasks = tasks.filter(task => {
    const today = new Date().toDateString();
    const taskDate = new Date(task.dateDue).toDateString();
    return taskDate === today && task.status !== 'completed';
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
      </div>
      <div className="p-6">
        {todaysTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks for today</h3>
            <p className="mt-1 text-sm text-gray-500">All caught up! Great work.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{task.assignedToUserName}</span>
                      </div>
                      {task.customerName && (
                        <div className="flex items-center space-x-1">
                          <span>{task.customerName}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(task.dateDue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.priority === 'high' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};