import { useState, useEffect } from 'react';
import { Quote } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { quoteService } from '../services/quoteService';

export const useQuotes = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<string | undefined>(undefined);

  const loadQuotes = async () => {
    if (!user?.id || !user?.role) {
      console.log('useQuotes: User not authenticated or missing role:', { userId: user?.id, userRole: user?.role });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('useQuotes: Loading quotes for user:', { userId: user.id, userRole: user.role, filterUserId });
      const fetchedQuotes = await quoteService.getQuotes(user.id, user.role, filterUserId);
      console.log('useQuotes: Fetched quotes:', fetchedQuotes.length, fetchedQuotes);
      setQuotes(fetchedQuotes);
    } catch (err) {
      console.error('useQuotes: Error loading quotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, filterUserId]);

  const addQuote = async (quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const quoteId = await quoteService.addQuote(user.id, quoteData);
      // Fetch the created quote to include server-generated fields like displayId
      const created = await quoteService.getQuoteById(quoteId);
      if (created) {
        setQuotes(prev => [created, ...prev]);
      }
      return quoteId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add quote';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateQuote = async (quoteId: string, quoteData: Partial<Quote>) => {
    try {
      await quoteService.updateQuote(quoteId, quoteData);
      setQuotes(prev => prev.map(quote => 
        quote.id === quoteId 
          ? { ...quote, ...quoteData, updatedAt: new Date().toISOString() }
          : quote
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update quote';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      await quoteService.deleteQuote(quoteId);
      setQuotes(prev => prev.filter(quote => quote.id !== quoteId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quote';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getQuotesByCustomer = (customerId: string) => {
    return quotes.filter(quote => quote.customerId === customerId);
  };

  return {
    quotes,
    loading,
    error,
    setFilterUserId,
    addQuote,
    updateQuote,
    deleteQuote,
    getQuotesByCustomer,
    refetch: loadQuotes,
  };
};