import { useEffect, useState } from 'react';
import { Deal } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dealService } from '../services/dealService';

export const useDeals = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<string | undefined>(undefined);

  const loadDeals = async () => {
    if (!user?.id || !user?.role) return;
    setLoading(true);
    setError(null);
    try {
      const fetched = await dealService.getDeals(user.id, user.role, filterUserId);
      setDeals(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, filterUserId]);

  const addDeal = async (deal: Omit<Deal, 'id'>) => {
    const id = await dealService.addDeal(deal);
    setDeals(prev => [{ ...deal, id }, ...prev]);
    return id;
  };

  const updateDeal = async (dealId: string, updates: Partial<Deal>) => {
    await dealService.updateDeal(dealId, updates);
    setDeals(prev => prev.map(d => (d.id === dealId ? { ...d, ...updates } : d)));
  };

  const deleteDeal = async (dealId: string) => {
    await dealService.deleteDeal(dealId);
    setDeals(prev => prev.filter(d => d.id !== dealId));
  };

  return {
    deals,
    loading,
    error,
    setFilterUserId,
    addDeal,
    updateDeal,
    deleteDeal,
    refetch: loadDeals,
  };
};


