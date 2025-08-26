import React, { useState } from 'react';
import { X, Save, User, Trash2 } from 'lucide-react';
import { Task } from '../../types';
import { useUsers } from '../../hooks/useUsers';
import { useCustomers } from '../../hooks/useCustomers';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerLeadPicker } from '../Shared/CustomerLeadPicker';

interface TaskFormProps {
  task?: Task;
  onSave: (task: Omit<Task, 'id' | 'dateCreated'>) => void;
  onCancel: () => void;
  onDelete?: (taskId: string) => void;
  customerId?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSave,
  onCancel,
  onDelete,
  customerId
}) => {
  const { users, getUserName } = useUsers();
  const { customers } = useCustomers();
  const { leads } = useLeads();
  const { user: currentUser } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Combine customers and leads for the picker
  const customersAndLeads = [
    ...customers,
    ...leads // leads are now just Customer objects with customerType: 'lead'
  ];
  
  // Find the customer/lead name for default title
  const selectedCustomer = customersAndLeads.find(c => c.id === customerId);
  const defaultTitle = customerId && selectedCustomer && !task 
    ? `Follow up with ${selectedCustomer.companyName}` 
    : '';
  const defaultDueDate = !task 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
    : '';
  
  const [formData, setFormData] = useState({
    customerId: task?.customerId || customerId || '',
    customerName: task?.customerName || selectedCustomer?.companyName || '',
    quoteId: task?.quoteId || '',
    title: task?.title || defaultTitle,
    description: task?.description || '',
    taskType: task?.taskType || 'other' as const,
    assignedToUserId: task?.assignedToUserId || currentUser?.id || '',
    assignedToUserName: task?.assignedToUserName || currentUser?.name || '',
    createdByUserId: task?.createdByUserId || currentUser?.id || '',
    createdByUserName: task?.createdByUserName || currentUser?.name || '',
    dateDue: task?.dateDue ? new Date(task.dateDue).toISOString().slice(0, 10) : defaultDueDate,
    status: task?.status || 'pending' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      customerId: formData.customerId,
      customerName: formData.customerName,
      quoteId: formData.quoteId,
      title: formData.title,
      description: formData.description,
      taskType: formData.taskType,
      assignedToUserId: formData.assignedToUserId,
      assignedToUserName: formData.assignedToUserName,
      createdByUserId: formData.createdByUserId,
      createdByUserName: formData.createdByUserName,
      dateDue: new Date(formData.dateDue + 'T09:00:00.000Z').toISOString(), // Set to 9 AM UTC
      status: formData.status,
      priority: 'medium' // Set default priority since it's required by the Task interface
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleUserAssignment = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    setFormData(prev => ({
      ...prev,
      assignedToUserId: userId,
      assignedToUserName: selectedUser?.name || getUserName(userId)
    }));
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
              Related Customer/Lead
            </label>
            <CustomerLeadPicker
              customers={customersAndLeads}
              value={formData.customerId}
              onChange={(customerId) => {
                const selectedCustomer = customersAndLeads.find(c => c.id === customerId);
                setFormData(prev => ({ 
                  ...prev, 
                  customerId,
                  customerName: selectedCustomer?.companyName || ''
                }));
              }}
              disabled={!!customerId}
              placeholder="Search for customer or lead..."
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Describe the task..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="taskType" className="block text-sm font-medium text-gray-700 mb-1">
                Task Type
              </label>
              <select
                id="taskType"
                name="taskType"
                value={formData.taskType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="email">Email</option>
                <option value="phone">Phone Call</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateDue" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                id="dateDue"
                name="dateDue"
                value={formData.dateDue}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignedToUserId" className="block text-sm font-medium text-gray-700 mb-1">
                Assign To *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="assignedToUserId"
                  name="assignedToUserId"
                  value={formData.assignedToUserId}
                  onChange={(e) => handleUserAssignment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                  required
                >
                  <option value="">Select user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            {/* Delete button - only show when editing existing task */}
            <div>
              {task && onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex items-center space-x-2 px-4 py-2 text-red-700 bg-red-50 rounded-md hover:bg-red-100 border border-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Task</span>
                </button>
              )}
            </div>
            
            {/* Right side buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{task ? 'Update' : 'Create'} Task</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
                {task && (
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    Task: {task.title}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};