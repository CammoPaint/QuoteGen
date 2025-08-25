import { useState, useEffect } from 'react';
import { Customer } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { customerService } from '../services/customerService';

export const useCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let fetchedCustomers: Customer[];
      
      console.log('Loading customers for user:', { 
        userId: user.id, 
        userRole: user.role, 
        companyId: user.companyId 
      });
      
      // Admin users can see all customers in the system
      if (user.role === 'admin') {
        console.log('Admin user - fetching all customers');
        fetchedCustomers = await customerService.getAllCustomers();
      }
      // Users with companyId can see all customers in their company
      else if (user.companyId && user.companyId !== 'default-company') {
        console.log('Company user - fetching customers for company:', user.companyId);
        fetchedCustomers = await customerService.getAllCustomersForCompany(user.companyId);
      }
      // For all other users, show all customers (since customers should be visible to everyone)
      else {
        console.log('Standard user - fetching all customers (customers are shared)');
        fetchedCustomers = await customerService.getAllCustomers();
      }
      
      console.log('Fetched customers before filtering:', fetchedCustomers.length);
      
      // Debug: Log the first few customers to see their structure
      if (fetchedCustomers.length > 0) {
        console.log('Sample customers:', fetchedCustomers.slice(0, 3).map(c => ({
          id: c.id,
          companyName: c.companyName,
          customerType: (c as any).customerType,
          userId: (c as any).userId,
          companyId: (c as any).companyId
        })));
      }
      
      // Keep only non-leads. If the field is missing, treat as a regular customer for backward compatibility
      const onlyCustomers = fetchedCustomers.filter(c => {
        const isLead = (c as any).customerType === 'lead';
        if (isLead) {
          console.log('Filtering out lead:', c.companyName, c.id);
        }
        return !isLead;
      });
      
      console.log('Customers after filtering out leads:', onlyCustomers.length);
      setCustomers(onlyCustomers);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      
      // Fallback: try to get at least some customers
      try {
        console.log('Attempting fallback to get user-specific customers');
        const fallbackCustomers = await customerService.getCustomers(user.id);
        const fallbackOnlyCustomers = fallbackCustomers.filter(c => (c as any).customerType !== 'lead');
        console.log('Fallback customers loaded:', fallbackOnlyCustomers.length);
        setCustomers(fallbackOnlyCustomers);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [user?.id, user?.role, user?.companyId]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const customerId = await customerService.addCustomer(user.id, customerData, user.companyId, user.name);
      const newCustomer: Customer = {
        id: customerId,
        ...customerData,
        customerType: (customerData as any).customerType ?? 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCustomers(prev => [newCustomer, ...prev]);
      return customerId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
    try {
      await customerService.updateCustomer(customerId, customerData);
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, ...customerData, updatedAt: new Date().toISOString() }
          : customer
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      await customerService.deleteCustomer(customerId);
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: loadCustomers,
  };
};