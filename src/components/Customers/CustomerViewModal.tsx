import React from 'react';
import { X, Phone, Mail, MapPin, User, Building, Calendar, Eye, TrendingUp, Target } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerViewModalProps {
  customer: Customer;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}

export const CustomerViewModal: React.FC<CustomerViewModalProps> = ({
  customer,
  onClose,
  onEdit
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCustomerTypeColor = (type: string) => {
    return type === 'lead' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Dialog Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
              <p className="text-sm text-gray-500">{customer.companyName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Dialog Content */}
        <div className="p-6 space-y-6">
          {/* Customer Type and Basic Info */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Customer Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(customer.customerType)}`}>
                  {customer.customerType === 'lead' ? 'Lead' : 'Customer'}
                </span>
              </div>
              {customer.displayId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="mt-1 text-sm text-gray-900">#{customer.displayId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Company Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <p className="mt-1 text-sm text-gray-900">{customer.companyName || 'Not specified'}</p>
              </div>
              {customer.industry && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <p className="mt-1 text-sm text-gray-900">{customer.industry}</p>
                </div>
              )}
              {customer.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="mt-1 flex items-center">
                    <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                    <p className="text-sm text-gray-900">{customer.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                <p className="mt-1 text-sm text-gray-900">{customer.contactName || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1 flex items-center">
                  <Mail className="h-3 w-3 mr-1 text-gray-400" />
                  <a 
                    href={`mailto:${customer.emailAddress}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {customer.emailAddress || 'Not provided'}
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="mt-1 flex items-center">
                  <Phone className="h-3 w-3 mr-1 text-gray-400" />
                  <a 
                    href={`tel:${customer.phoneNumber}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {customer.phoneNumber || 'Not provided'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Lead-specific fields */}
          {customer.customerType === 'lead' && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Lead Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.source && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {customer.source.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {customer.status && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {customer.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {customer.assignedToUserName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.assignedToUserName}</p>
                  </div>
                )}
              </div>
              
              {/* Pipeline Information */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Deal Pipeline
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">
                      This lead is tracked through the sales pipeline
                    </p>
                    <Target className="h-4 w-4 text-gray-400" />
                  </div>
                  {/* TODO: Add actual pipeline data when available */}
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Active in Pipeline
                    </span>
                    <span className="text-xs text-gray-500">
                      Current Stage: {customer.status ? customer.status.replace(/_/g, ' ').replace(/\b\w/g, (ch: string) => ch.toUpperCase()) : 'New'}
                    </span>
                  </div>
                  <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-200">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> Quotes are generated when leads become customers. Track this lead's progress through the pipeline to conversion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Management Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Management Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created Date</label>
                <div className="mt-1 flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-sm text-gray-900">{formatDate(customer.createdAt)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <div className="mt-1 flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-sm text-gray-900">{formatDate(customer.updatedAt)}</span>
                </div>
              </div>
              {customer.createdByUserName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <p className="mt-1 text-sm text-gray-900">{customer.createdByUserName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Notes</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {customer.attachments && customer.attachments.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Attachments</h4>
              <div className="space-y-2">
                {customer.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">{attachment.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {customer.customerType === 'lead' && customer.displayId ? `Lead #${customer.displayId}` : 'Customer'} • Created {formatDate(customer.createdAt)}
              {customer.assignedToUserName && ` by ${customer.assignedToUserName}`}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => onEdit(customer)}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Edit {customer.customerType === 'lead' ? 'Lead' : 'Customer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
