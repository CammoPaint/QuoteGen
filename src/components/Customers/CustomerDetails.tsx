import React, { useState, useEffect } from 'react';
import { CustomerLeadDetails } from '../Shared/CustomerLeadDetails';
import { TaskForm } from '../Tasks/TaskForm';
import { Customer, Quote, Task } from '../../types';
import { useCustomers } from '../../hooks/useCustomers';
import { useQuotes } from '../../hooks/useQuotes';
import { useTasks } from '../../hooks/useTasks';

interface CustomerDetailsProps {
  customerId: string;
  onBack: () => void;
  onAddQuote?: () => void;
  onQuoteClick?: (quote: Quote) => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customerId,
  onBack,
  onAddQuote,
  onQuoteClick
}) => {
  const { customers, updateCustomer } = useCustomers();
  const { quotes } = useQuotes();
  const { tasks, addTask, updateTask, deleteTask: deleteTaskById } = useTasks();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [relatedQuotes, setRelatedQuotes] = useState<Quote[]>([]);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    // Find the customer by ID
    const foundCustomer = customers.find(c => c.id === customerId);
    if (foundCustomer) {
      setCustomer(foundCustomer);
    }
  }, [customerId, customers]);

  useEffect(() => {
    // Filter quotes related to this customer
    const customerQuotes = quotes.filter(quote => 
      quote.customerId === customerId
    );
    setRelatedQuotes(customerQuotes);
  }, [customerId, quotes]);

  useEffect(() => {
    // Filter tasks related to this customer
    const customerTasks = tasks.filter(task => 
      task.customerId === customerId
    );
    setRelatedTasks(customerTasks);
  }, [customerId, tasks]);

  const handleSave = async (formData: any) => {
    if (!customer) return;

    try {
      const updatedCustomer: Customer = {
        ...customer,
        companyName: formData.companyName,
        contactName: formData.contactName,
        emailAddress: formData.emailAddress,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        notes: formData.notes,
        industry: formData.industry,
        updatedAt: new Date().toISOString()
      };

      await updateCustomer(customer.id, updatedCustomer);
      setCustomer(updatedCustomer);
    } catch (error) {
      console.error('Failed to update customer:', error);
      // You might want to show an error toast here
    }
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'dateCreated'>) => {
    if (!customer) return;

    try {
      if (selectedTask) {
        // Update existing task
        const updatedTaskData: Partial<Task> = {
          customerId: customer.id,
          customerName: customer.companyName,
          quoteId: taskData.quoteId,
          title: taskData.title,
          description: taskData.description,
          taskType: taskData.taskType,
          assignedToUserId: taskData.assignedToUserId,
          assignedToUserName: taskData.assignedToUserName,
          createdByUserId: taskData.createdByUserId,
          createdByUserName: taskData.createdByUserName,
          dateDue: taskData.dateDue,
          status: taskData.status,
          priority: taskData.priority
        };
        await updateTask(selectedTask.id, updatedTaskData);
      } else {
        // Create new task
        const newTask: Omit<Task, 'id' | 'dateCreated'> = {
          customerId: customer.id,
          customerName: customer.companyName,
          quoteId: taskData.quoteId,
          title: taskData.title,
          description: taskData.description,
          taskType: taskData.taskType,
          assignedToUserId: taskData.assignedToUserId,
          assignedToUserName: taskData.assignedToUserName,
          createdByUserId: taskData.createdByUserId,
          createdByUserName: taskData.createdByUserName,
          dateDue: taskData.dateDue,
          status: taskData.status,
          priority: taskData.priority
        };
        await addTask(newTask);
      }
      setShowTaskModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskById(taskId);
      setShowTaskModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4285F4]"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <CustomerLeadDetails
        record={customer}
        recordType="customer"
        onBack={onBack}
        onSave={handleSave}
        quotes={relatedQuotes}
        tasks={relatedTasks}
        onAddQuote={onAddQuote}
        onAddTask={handleAddTask}
        onQuoteClick={onQuoteClick}
        onTaskClick={handleTaskClick}
      />

      {/* TaskForm Modal */}
      {showTaskModal && customer && (
        <TaskForm
          task={selectedTask || undefined}
          onSave={handleSaveTask}
          onCancel={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onDelete={selectedTask ? handleDeleteTask : undefined}
          customerId={customer.id}
        />
      )}
    </div>
  );
};
