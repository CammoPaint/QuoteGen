import { useState, useEffect } from 'react';
import { Commission } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { commissionService } from '../services/commissionService';

export const useCommissions = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCommissions = async () => {
    if (!user?.id || !user?.role) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedCommissions = await commissionService.getCommissions(user.id, user.role);
      setCommissions(fetchedCommissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commissions');
      console.error('Error loading commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommissions();
  }, [user?.id, user?.role]);

  const addCommission = async (commissionData: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const commissionId = await commissionService.addCommission(commissionData);
      const newCommission: Commission = {
        id: commissionId,
        ...commissionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCommissions(prev => [newCommission, ...prev]);
      return commissionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add commission';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateCommission = async (commissionId: string, commissionData: Partial<Commission>) => {
    try {
      await commissionService.updateCommission(commissionId, commissionData);
      setCommissions(prev => prev.map(commission => 
        commission.id === commissionId 
          ? { ...commission, ...commissionData, updatedAt: new Date().toISOString() }
          : commission
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update commission';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const markCommissionAsPaid = async (commissionId: string) => {
    try {
      await commissionService.markCommissionAsPaid(commissionId);
      setCommissions(prev => prev.map(commission => 
        commission.id === commissionId 
          ? { 
              ...commission, 
              status: 'paid', 
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : commission
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark commission as paid';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getCommissionsByMonth = async (month: string) => {
    if (!user?.id || !user?.role) return [];
    
    try {
      return await commissionService.getCommissionsByMonth(month, user.id, user.role);
    } catch (err) {
      console.error('Error fetching commissions by month:', err);
      return [];
    }
  };

  const getPendingCommissions = async () => {
    if (!user?.id || !user?.role) return [];
    
    try {
      return await commissionService.getPendingCommissions(user.id, user.role);
    } catch (err) {
      console.error('Error fetching pending commissions:', err);
      return [];
    }
  };

  const getCommissionsByStatus = (status: string) => {
    return commissions.filter(commission => commission.status === status);
  };

  const getCommissionsByType = (commissionType: string) => {
    return commissions.filter(commission => commission.commissionType === commissionType);
  };

  const calculateTotalCommissions = () => {
    return commissions.reduce((total, commission) => total + commission.commissionAmount, 0);
  };

  const calculatePendingCommissions = () => {
    return commissions
      .filter(commission => commission.status === 'pending')
      .reduce((total, commission) => total + commission.commissionAmount, 0);
  };

  const calculatePaidCommissions = () => {
    return commissions
      .filter(commission => commission.status === 'paid')
      .reduce((total, commission) => total + commission.commissionAmount, 0);
  };

  return {
    commissions,
    loading,
    error,
    addCommission,
    updateCommission,
    markCommissionAsPaid,
    getCommissionsByMonth,
    getPendingCommissions,
    getCommissionsByStatus,
    getCommissionsByType,
    calculateTotalCommissions,
    calculatePendingCommissions,
    calculatePaidCommissions,
    refetch: loadCommissions,
  };
}; 