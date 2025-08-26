import React, { useState } from 'react';
import { Search, Plus, Phone, Mail, MapPin, Eye } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerListProps {
  customers: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  onCustomerDetails: (customer: Customer) => void;
  onAddCustomer: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onCustomerSelect,
  onCustomerDetails,
  onAddCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter customers by search term - this component only shows customers (not leads)
  // Leads are handled separately in the Sales/LeadManagement component with proper access control
  const filteredCustomers = customers.filter(customer =>
    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
            <p className="text-sm text-gray-600 mt-1">All customers from your team (leads are managed separately)</p>
          </div>
          <button
            onClick={onAddCustomer}
            className="flex items-center space-x-2 bg-brand text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        </div>
        
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>
      </div>

      <div className="p-6">
        {filteredCustomers.length === 0 ? (
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              {searchTerm ? 'No customers found matching your search.' : 'No customers yet.'}
            </div>
            {!searchTerm && (
              <button
                onClick={onAddCustomer}
                className="text-brand hover:text-blue-600 font-medium"
              >
                Add your first customer
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-gray-300 transition bg-white cursor-pointer"
                onClick={() => onCustomerDetails(customer)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{customer.companyName}</h3>
                    <p className="text-sm text-gray-600 mt-1 truncate">{customer.contactName}</p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCustomerSelect(customer);
                      }}
                      className="p-1 text-gray-400 hover:text-brand transition-colors"
                      title="Quick view"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center text-sm text-gray-500 truncate">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{customer.phoneNumber || '-'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 truncate">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{customer.emailAddress || '-'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 truncate">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{customer.address || '-'}</span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  <div>Added {new Date(customer.createdAt).toLocaleDateString()}</div>
                  {customer.createdByUserName && (
                    <div className="mt-1">by {customer.createdByUserName}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};