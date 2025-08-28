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
  const [pageSize] = useState<number>(25);
  const [cursor, setCursor] = useState<any | undefined>(undefined);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const loadLeads = async () => {
    if (!user?.id || !user?.role) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Choose paginated query based on role and filters
      let page;
      if (filterUserId) {
        // Filter by assigned user on the server
        page = await customerService.getLeadsPageAssignedTo(filterUserId, pageSize);
      } else if (user.role === 'admin') {
        page = await customerService.getLeadsPageAll(pageSize);
      } else if (user.companyId) {
        page = await customerService.getLeadsPageForCompany(user.companyId, pageSize);
      } else {
        // Default for non-admins: leads assigned to the user (not just created by them)
        page = await customerService.getLeadsPageAssignedTo(user.id, pageSize);
      }

      setLeads(page.items);
      setCursor(page.lastDoc);
      setHasMore(!!page.lastDoc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset pagination when user or filters change
    setLeads([]);
    setCursor(undefined);
    setHasMore(true);
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, filterUserId]);

  const loadMore = async () => {
    if (!user?.id || !user?.role || !hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      let page;
      if (filterUserId) {
        // Filter by assigned user on the server
        page = await customerService.getLeadsPageAssignedTo(filterUserId, pageSize, cursor);
      } else if (user.role === 'admin') {
        page = await customerService.getLeadsPageAll(pageSize, cursor);
      } else if (user.companyId) {
        page = await customerService.getLeadsPageForCompany(user.companyId, pageSize, cursor);
      } else {
        // Default for non-admins: leads assigned to the user (not just created by them)
        page = await customerService.getLeadsPageAssignedTo(user.id, pageSize, cursor);
      }
      setLeads(prev => [...prev, ...page.items]);
      setCursor(page.lastDoc);
      setHasMore(!!page.lastDoc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more leads');
      console.error('Error loading more leads:', err);
    } finally {
      setLoadingMore(false);
    }
  };

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
    hasMore,
    loadMore,
    loadingMore,
    addLead,
    updateLead,
    deleteLead,
    getLeadsByStatus,
    getLeadsByAgent,
    getLeadsBySource,
    refetch: loadLeads,
  };
};