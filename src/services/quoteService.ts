import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Quote } from '../types';

const COLLECTION_NAME = 'quotes';
const COUNTER_DOC = 'counters/quotes';

export const quoteService = {
  async getNextDisplayId(): Promise<string> {
    try {
      const counterRef = doc(db, COUNTER_DOC);
      
      // Try to get the current counter
      await updateDoc(counterRef, {
        value: increment(1)
      }).catch(async () => {
        // If the counter doesn't exist, create it starting at 100001
        await setDoc(counterRef, { value: 100001 });
      });
      
      const value = (await getDoc(counterRef)).data()?.value || 100001;
      return value.toString().padStart(6, '0');
    } catch (error) {
      console.error('Error generating display ID:', error);
      throw new Error('Failed to generate quote ID');
    }
  },

  async getQuoteById(quoteId: string): Promise<Quote | null> {
    try {
      const ref = doc(db, COLLECTION_NAME, quoteId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data: any = snap.data();
      return {
        id: snap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Quote;
    } catch (error) {
      console.error('Error fetching quote by id:', error);
      throw new Error('Failed to fetch quote');
    }
  },

  // Get all quotes for a user (filtered by role and optionally by specific user)
  async getQuotes(userId: string, userRole: string, filterUserId?: string): Promise<Quote[]> {
    try {
      console.log('quoteService.getQuotes called with:', { userId, userRole, filterUserId });
      
      let q;
      
      if (userRole === 'admin' || userRole === 'sales_manager') {
        // Admins and sales managers can see all quotes, or filter by specific user
        if (filterUserId) {
          console.log('Building query for admin/sales_manager with user filter:', filterUserId);
          q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', filterUserId),
            orderBy('createdAt', 'desc')
          );
        } else {
          console.log('Building query for admin/sales_manager - all quotes');
          q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc')
          );
        }
      } else {
        // Sales agents can only see their own quotes (by userId)
        console.log('Building query for sales agent - own quotes only');
        q = query(
          collection(db, COLLECTION_NAME),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }
      
      console.log('Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log('Query result:', querySnapshot.docs.length, 'documents found');
      
      const quotes = querySnapshot.docs.map(doc => {
        const { id, ...data } = doc.data(); // Exclude any id field from document data
        return {
          id: doc.id, // This is the Firestore document ID
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Quote;
      });
      
      console.log('Processed quotes:', quotes);
      return quotes;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw new Error('Failed to fetch quotes');
    }
  },

  // Get quotes for a specific customer
  async getQuotesByCustomer(userId: string, customerId: string): Promise<Quote[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, // This is the Firestore document ID
          displayId: data.displayId, // Explicitly set displayId
          customerId: data.customerId,
          projectOverview: data.projectOverview,
          timeFrame: data.timeFrame,
          scopeOfWork: data.scopeOfWork || [],
          hourlyRate: data.hourlyRate,
          totalEstimatedCost: data.totalEstimatedCost,
          status: data.status || 'draft',
          mockupUrl: data.mockupUrl,
          userId: data.userId,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Quote;
      });
    } catch (error) {
      console.error('Error fetching quotes by customer:', error);
      throw new Error('Failed to fetch quotes');
    }
  },

  // Add a new quote
  async addQuote(userId: string, quoteData: Omit<Quote, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const displayId = await this.getNextDisplayId();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...quoteData,
        userId,
        displayId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding quote:', error);
      throw new Error('Failed to add quote');
    }
  },

  // Update an existing quote
  async updateQuote(quoteId: string, quoteData: Partial<Quote>): Promise<void> {
    try {
      if (!quoteId || typeof quoteId !== 'string') {
        throw new Error(`Invalid quoteId provided to updateQuote: ${String(quoteId)}`);
      }
      const quoteRef = doc(db, COLLECTION_NAME, quoteId);
      
      // Only update specific fields, excluding system fields
      const { id, createdAt, ...updateableFields } = quoteData;
      
      await updateDoc(quoteRef, {
        ...updateableFields,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating quote:', error);
      throw new Error('Failed to update quote');
    }
  },

  // Delete a quote
  async deleteQuote(quoteId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, quoteId));
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw new Error('Failed to delete quote');
    }
  }
};