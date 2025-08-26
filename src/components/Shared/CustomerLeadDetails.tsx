import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Phone, Mail, User, Building, Calendar, Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { Customer, Quote, Task } from '../../types';
import { useUsers } from '../../hooks/useUsers';

interface CustomerLeadDetailsProps {
  record: Customer;
  recordType: 'customer' | 'lead';
  onBack: () => void;
  onSave: (data: any) => void;
  quotes?: Quote[];
  tasks?: Task[];
  onAddQuote?: () => void;
  onAddTask?: () => void;
  onDelete?: () => void;
  onQuoteClick?: (quote: Quote) => void;
  onTaskClick?: (task: Task) => void;
}

export const CustomerLeadDetails: React.FC<CustomerLeadDetailsProps> = ({
  record,
  recordType,
  onBack,
  onSave,
  quotes = [],
  tasks = [],
  onAddQuote,
  onAddTask,
  onDelete,
  onQuoteClick,
  onTaskClick
}) => {
  const { users } = useUsers();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({
    companyName: '',
    contactName: '',
    address: '',
    phoneNumber: '',
    emailAddress: '',
    notes: '',
    industry: '',
    source: 'website',
    status: 'new',
    website: '',
    assignedToUserId: '',
    assignedToUserName: '',
  });

  useEffect(() => {
    // Initialize form data based on record type
    setFormData({
      companyName: record.companyName || '',
      contactName: record.contactName || '',
      address: (record as any).address || '',
      phoneNumber: record.phoneNumber || record.contactPhone || '',
      emailAddress: record.emailAddress || record.contactEmail || '',
      notes: record.notes || '',
      // Lead-specific fields
      industry: (record as any).industry || '',
      source: (record as any).source || 'website',
      status: (record as any).status || 'new',
      website: (record as any).website || '',
      // Assignment fields
      assignedToUserId: (record as any).assignedToUserId || '',
      assignedToUserName: (record as any).assignedToUserName || '',
    });
  }, [record]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      companyName: record.companyName || '',
      contactName: record.contactName || '',
      address: (record as any).address || '',
      phoneNumber: record.phoneNumber || record.contactPhone || '',
      emailAddress: record.emailAddress || record.contactEmail || '',
      notes: record.notes || '',
      industry: (record as any).industry || '',
      source: (record as any).source || 'website',
      status: (record as any).status || 'new',
      value: (record as any).value || 0,
      nextFollowUp: (record as any).nextFollowUp || '',
      website: (record as any).website || '',
      assignedToUserId: (record as any).assignedToUserId || '',
      assignedToUserName: (record as any).assignedToUserName || '',
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'other': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{record?.companyName}</h1>
                <p className="text-sm text-gray-600">
                  {record?.contactName}
                </p>
              </div>
            </div>            

            <div className="flex items-center space-x-3">
              {onDelete && recordType === 'lead' && !isEditing &&(
                <button
                  onClick={onDelete}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Lead
                </button>
              )}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit {recordType === 'lead' ? 'Lead' : 'Customer'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name {recordType === 'customer' ? '*' : ''}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                      required={recordType === 'customer'}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{record.companyName || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    recordType === 'lead' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {recordType === 'lead' ? 'Lead' : 'Customer'}
                  </span>
                </div>
                {/* {recordType === 'lead' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{(record as any).industry || 'Not specified'}</p>
                    )}
                  </div>
                )} */}
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="https://"
                    />
                  </div>
                )}
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <a 
                      href={formData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {formData.website}
                    </a>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  {isEditing ? (
                    <select
                      name="assignedToUserId"
                      value={formData.assignedToUserId}
                      onChange={(e) => {
                        const selectedUserId = e.target.value;
                        const selectedUser = users.find(user => user.id === selectedUserId);
                        const selectedUserName = selectedUser ? selectedUser.name : '';
                        
                        setFormData((prev: any) => ({
                          ...prev,
                          assignedToUserId: selectedUserId === 'unassigned' ? '' : selectedUserId,
                          assignedToUserName: selectedUserName
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                    >
                      <option value="unassigned">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">
                        {formData.assignedToUserName || 'Unassigned'}
                      </span>
                    </div>
                  )}
                </div>                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{formData.address || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name {recordType === 'customer' ? '*' : ''}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                      required={recordType === 'customer'}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{record.contactName || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="emailAddress"
                      value={formData.emailAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="flex items-center">
                      <a 
                        href={`mailto:${formData.emailAddress}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {formData.emailAddress || 'Not provided'}
                      </a>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number {recordType === 'lead' ? '*' : ''}
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                      required={recordType === 'lead'}
                    />
                  ) : (
                    <div className="flex items-center">
                      <a 
                        href={`tel:${formData.phoneNumber}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {formData.phoneNumber || 'Not provided'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead-specific Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Lead Source
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="e.g. Technology, Healthcare, Manufacturing"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{formData.industry || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  {isEditing ? (
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                    >
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="cold_outreach">Cold Outreach</option>
                      <option value="social_media">Social Media</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900 capitalize">
                      {formData.source ? formData.source.replace(/_/g, ' ') : 'No Source'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Notes
              </h2>
              {isEditing ? (
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder={`Add notes about this ${recordType}...`}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  {record.notes ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.notes}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No notes added yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Task History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Task History</h3>
                {onAddTask && (
                  <button
                    onClick={onAddTask}
                    className="flex items-center text-sm text-brand hover:text-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </button>
                )}
              </div>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`border border-gray-200 rounded-lg p-3 transition-colors ${
                        onTaskClick ? 'hover:bg-gray-50 cursor-pointer hover:border-gray-300' : ''
                      }`}
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getTaskTypeIcon(task.taskType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{task.assignedToUserName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">{formatDate(task.dateCreated)}</p>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No tasks yet.</p>
              )}
            </div>
            {/* Quotes - Only show for customers */}
            {recordType === 'customer' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quotes</h3>
                  {onAddQuote && (
                    <button
                      onClick={onAddQuote}
                      className="flex items-center text-sm text-brand hover:text-blue-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Quote
                    </button>
                  )}
                </div>
                {quotes.length > 0 ? (
                  <div className="space-y-3">
                    {quotes.map((quote) => (
                      <div 
                        key={quote.id} 
                        className={`border border-gray-200 rounded-lg p-3 ${
                          onQuoteClick ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors' : ''
                        }`}
                        onClick={() => onQuoteClick?.(quote)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">#{quote.displayId}</span>
                          <span className="text-sm text-gray-500">{formatDate(quote.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{formatCurrency(quote.totalEstimatedCost)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No quotes yet.</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
