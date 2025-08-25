import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, User, Building } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerLeadPickerProps {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const CustomerLeadPicker: React.FC<CustomerLeadPickerProps> = ({
  customers,
  value,
  onChange,
  disabled = false,
  placeholder = "Search for customer or lead...",
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find(c => c.id === value);

  useEffect(() => {
    const filtered = customers.filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.companyName.toLowerCase().includes(searchLower) ||
        customer.contactName?.toLowerCase().includes(searchLower) ||
        customer.contactEmail?.toLowerCase().includes(searchLower) ||
        customer.phoneNumber?.toLowerCase().includes(searchLower) ||
        customer.customerType.toLowerCase().includes(searchLower)
      );
    });
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen && searchInputRef.current) {
      // Focus search input when opening
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const getCustomerTypeIcon = (customer: Customer) => {
    return customer.customerType === 'lead' ? (
      <User className="h-4 w-4 text-orange-500" />
    ) : (
      <Building className="h-4 w-4 text-blue-500" />
    );
  };

  const getCustomerTypeLabel = (customer: Customer) => {
    return customer.customerType === 'lead' ? 'Lead' : 'Customer';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Display Field */}
      <div
        onClick={handleToggleDropdown}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4285F4] focus:border-transparent
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}
          ${compact && disabled ? 'bg-gray-50' : ''}
          transition-colors
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {selectedCustomer ? (
              <>
                {getCustomerTypeIcon(selectedCustomer)}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {selectedCustomer.companyName}
                  </div>
                  {selectedCustomer.contactName && (
                    <div className="text-xs text-gray-500 truncate">
                      {selectedCustomer.contactName} • {getCustomerTypeLabel(selectedCustomer)}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 truncate">{placeholder}</span>
              </>
            )}
          </div>
          {!disabled && (
            <ChevronDown 
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4285F4] focus:border-transparent text-sm"
                placeholder="Search customers and leads..."
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {/* Clear Selection Option */}
            <div
              onClick={() => handleSelect('')}
              className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            >
              <div className="h-4 w-4" />
              <div>
                <div className="text-sm text-gray-500">No customer selected</div>
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No customers or leads found matching "{searchTerm}"
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelect(customer.id)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 cursor-pointer
                    ${value === customer.id ? 'bg-blue-50' : ''}
                  `}
                >
                  {getCustomerTypeIcon(customer)}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {customer.companyName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {customer.contactName && `${customer.contactName} • `}
                      {customer.contactEmail && `${customer.contactEmail} • `}
                      {getCustomerTypeLabel(customer)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
