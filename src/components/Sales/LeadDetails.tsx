import React, { useState, useEffect } from 'react';
import { CustomerLeadDetails } from '../Shared/CustomerLeadDetails';
import { TaskForm } from '../Tasks/TaskForm';
import { Customer, Quote, Task } from '../../types';
import { useLeads } from '../../hooks/useLeads';
import { useQuotes } from '../../hooks/useQuotes';
import { useTasks } from '../../hooks/useTasks';
import { Trash2 } from 'lucide-react';

interface LeadDetailsProps {
  leadId: string;
  onBack: () => void;
  onAddQuote?: () => void;
}

export const LeadDetails: React.FC<LeadDetailsProps> = ({
  leadId,
  onBack,
  onAddQuote
}) => {
  const { leads, updateLead, deleteLead } = useLeads();
  const { quotes } = useQuotes();
  const { tasks, addTask, updateTask, deleteTask: deleteTaskById } = useTasks();
  const [lead, setLead] = useState<Customer | null>(null);
  const [relatedQuotes, setRelatedQuotes] = useState<Quote[]>([]);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    // Find the lead by ID
    const foundLead = leads.find(l => l.id === leadId);
    if (foundLead) {
      setLead(foundLead);
    }
  }, [leadId, leads]);

  useEffect(() => {
    // Filter quotes related to this lead
    const leadQuotes = quotes.filter(quote => 
      quote.customerId === leadId
    );
    setRelatedQuotes(leadQuotes);
  }, [leadId, quotes]);

  useEffect(() => {
    // Filter tasks related to this lead
    const leadTasks = tasks.filter(task => 
      task.customerId === leadId
    );
    setRelatedTasks(leadTasks);
  }, [leadId, tasks]);

  const handleSave = async (formData: any) => {
    if (!lead) return;

    try {
      const updatedLead: Customer = {
        ...lead,
        companyName: formData.companyName,
        contactName: formData.contactName,
        emailAddress: formData.emailAddress,
        phoneNumber: formData.phoneNumber,
        contactEmail: formData.emailAddress,
        contactPhone: formData.phoneNumber,
        industry: formData.industry,
        source: formData.source,
        status: formData.status,
        notes: formData.notes,
        updatedAt: new Date().toISOString()
      };

      await updateLead(lead.id, updatedLead);
      setLead(updatedLead);
    } catch (error) {
      console.error('Failed to update lead:', error);
      // You might want to show an error toast here
    }
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowTaskForm(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'dateCreated'>) => {
    if (!lead) return;

    try {
      if (selectedTask) {
        // Update existing task
        const updatedTaskData: Partial<Task> = {
          customerId: lead.id,
          customerName: lead.companyName,
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
          customerId: lead.id, // Use customerId instead of leadId
          customerName: lead.companyName,
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
      setShowTaskForm(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskById(taskId);
      setShowTaskForm(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!lead) return;

    setIsDeleting(true);
    try {
      await deleteLead(lead.id);
      // Navigate back after successful deletion
      onBack();
    } catch (error) {
      console.error('Error deleting lead:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <CustomerLeadDetails
        record={lead!}
        recordType="lead"
        onBack={onBack}
        onSave={handleSave}
        quotes={relatedQuotes}
        tasks={relatedTasks}
        onAddQuote={onAddQuote}
        onAddTask={handleAddTask}
        onDelete={handleDeleteClick}
        onTaskClick={handleTaskClick}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && lead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Delete Lead</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">
                  Are you sure you want to delete this lead? This action cannot be undone.
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-900">{lead.companyName}</p>
                  <p className="text-sm text-gray-500">{lead.contactName} • {lead.contactEmail}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Lead'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TaskForm Modal */}
      {showTaskForm && lead && (
        <TaskForm
          task={selectedTask || undefined}
          onSave={handleSaveTask}
          onCancel={() => {
            setShowTaskForm(false);
            setSelectedTask(null);
          }}
          onDelete={selectedTask ? handleDeleteTask : undefined}
          customerId={lead.id}
        />
      )}
    </div>
  );
};
