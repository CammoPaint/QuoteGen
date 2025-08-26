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
      
      // Admin users can see all customers in the system
      if (user.role === 'admin') {
        fetchedCustomers = await customerService.getAllCustomers({ excludeLeads: true });
      }
      // Users with companyId can see all customers in their company
      else if (user.companyId && user.companyId !== 'default-company') {
        fetchedCustomers = await customerService.getAllCustomersForCompany(user.companyId, { excludeLeads: true });
      }
      // For all other users, show all customers (since customers should be visible to everyone)
      else {
        fetchedCustomers = await customerService.getAllCustomers({ excludeLeads: true });
      }
      
      setCustomers(fetchedCustomers);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      
      // Fallback: try to get at least some customers
      try {
        const fallbackCustomers = await customerService.getCustomers(user.id, { excludeLeads: true });
        setCustomers(fallbackCustomers);
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