import { useState, useEffect } from 'react';
import { Customer } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { customerService } from '../services/customerService';

export const useLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<string | undefined>(undefined);

  const loadLeads = async () => {
    if (!user?.id || !user?.role) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all customers and filter for leads
      let fetchedCustomers: Customer[];
      
      if (user.role === 'admin') {
        fetchedCustomers = await customerService.getAllCustomers();
      } else if (user.companyId) {
        fetchedCustomers = await customerService.getAllCustomersForCompany(user.companyId);
      } else {
        fetchedCustomers = await customerService.getCustomers(user.id);
      }
      
      // Filter to only leads
      let leadsOnly = fetchedCustomers.filter(c => c.customerType === 'lead');
      
      // Apply user filter if specified
      if (filterUserId) {
        leadsOnly = leadsOnly.filter(lead => 
          lead.assignedToUserId === filterUserId || 
          lead.createdByUserId === filterUserId
        );
      }
      
      setLeads(leadsOnly);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, filterUserId]);

  const addLead = async (leadData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      // Ensure it's marked as a lead
      const leadDataWithType = { ...leadData, customerType: 'lead' as const };
      const leadId = await customerService.addCustomer(user.id, leadDataWithType, user.companyId, user.name);
      // Fetch the full lead to capture generated fields like displayId
      const created = await customerService.getCustomerById(leadId);
      if (created) {
        setLeads(prev => [created, ...prev]);
      }
      return leadId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add lead';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateLead = async (leadId: string, leadData: Partial<Customer>) => {
    try {
      await customerService.updateCustomer(leadId, leadData);
      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, ...leadData, updatedAt: new Date().toISOString() }
          : lead
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lead';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      await customerService.deleteCustomer(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete lead';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const getLeadsByAgent = (agentId: string) => {
    return leads.filter(lead => 
      lead.assignedToUserId === agentId || 
      lead.createdByUserId === agentId ||
      (lead as any).userId === agentId || 
      (lead as any).assignedToId === agentId
    );
  };

  const getLeadsBySource = (source: string) => {
    return leads.filter(lead => lead.source === source);
  };

  return {
    leads,
    loading,
    error,
    setFilterUserId,
    addLead,
    updateLead,
    deleteLead,
    getLeadsByStatus,
    getLeadsByAgent,
    getLeadsBySource,
    refetch: loadLeads,
  };
}; 