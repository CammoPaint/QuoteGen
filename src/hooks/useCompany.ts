import { useState, useEffect } from 'react';
import { Company } from '../types';
import { companyService } from '../services/companyService';
import { useAuth } from '../contexts/AuthContext';

const defaultCompany: Company = {
  id: 'default',
  name: 'Your Company Name',
  address: '123 Business Street, City, State 12345',
  phone: '+1 (555) 123-4567',
  email: 'info@yourcompany.com',
  website: 'www.yourcompany.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const useCompany = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company>(defaultCompany);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a fixed company ID for single-company setup
  const companyId = user?.companyId || 'default-company';

  const loadCompany = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedCompany = await companyService.getCompany(companyId);
      if (fetchedCompany) {
        setCompany(fetchedCompany);
      } else {
        // Create default company if none exists
        await companyService.saveCompany(companyId, defaultCompany);
        setCompany({ ...defaultCompany, id: companyId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company');
      console.error('Error loading company:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
  }, [user?.id, companyId]);

  const updateCompany = async (updatedCompany: Partial<Company>) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await companyService.updateCompany(companyId, updatedCompany);
      const newCompany = {
        ...company,
        ...updatedCompany,
        updatedAt: new Date().toISOString()
      };
      setCompany(newCompany);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update company';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    company,
    loading,
    error,
    updateCompany,
    refetch: loadCompany,
  };
};