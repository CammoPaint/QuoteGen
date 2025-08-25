import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Commission } from '../types';

const COLLECTION_NAME = 'commissions';

export const commissionService = {
  // Get all commissions for a user (filtered by role)
  async getCommissions(userId: string, userRole: string): Promise<Commission[]> {
    try {
      let q;
      
      if (userRole === 'admin' || userRole === 'sales_manager') {
        // Admins and sales managers can see all commissions
        q = query(
          collection(db, COLLECTION_NAME),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Sales agents can only see their own commissions
        q = query(
          collection(db, COLLECTION_NAME),
          where('agentId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const { id, ...data } = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          paidAt: data.paidAt?.toDate?.()?.toISOString() || undefined,
        } as Commission;
      });
    } catch (error) {
      console.error('Error fetching commissions:', error);
      throw new Error('Failed to fetch commissions');
    }
  },

  // Get commissions by month
  async getCommissionsByMonth(month: string, userId: string, userRole: string): Promise<Commission[]> {
    try {
      let q;
      
      if (userRole === 'admin' || userRole === 'sales_manager') {
        q = query(
          collection(db, COLLECTION_NAME),
          where('month', '==', month),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, COLLECTION_NAME),
          where('agentId', '==', userId),
          where('month', '==', month),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const { id, ...data } = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          paidAt: data.paidAt?.toDate?.()?.toISOString() || undefined,
        } as Commission;
      });
    } catch (error) {
      console.error('Error fetching commissions by month:', error);
      throw new Error('Failed to fetch commissions');
    }
  },

  // Get pending commissions
  async getPendingCommissions(userId: string, userRole: string): Promise<Commission[]> {
    try {
      let q;
      
      if (userRole === 'admin' || userRole === 'sales_manager') {
        q = query(
          collection(db, COLLECTION_NAME),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, COLLECTION_NAME),
          where('agentId', '==', userId),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const { id, ...data } = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          paidAt: data.paidAt?.toDate?.()?.toISOString() || undefined,
        } as Commission;
      });
    } catch (error) {
      console.error('Error fetching pending commissions:', error);
      throw new Error('Failed to fetch pending commissions');
    }
  },

  // Add a new commission
  async addCommission(commissionData: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...commissionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding commission:', error);
      throw new Error('Failed to add commission');
    }
  },

  // Update an existing commission
  async updateCommission(commissionId: string, commissionData: Partial<Commission>): Promise<void> {
    try {
      const commissionRef = doc(db, COLLECTION_NAME, commissionId);
      
      // Only update specific fields, excluding system fields
      const { id, createdAt, ...updateableFields } = commissionData;
      
      await updateDoc(commissionRef, {
        ...updateableFields,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating commission:', error);
      throw new Error('Failed to update commission');
    }
  },

  // Mark commission as paid
  async markCommissionAsPaid(commissionId: string): Promise<void> {
    try {
      const commissionRef = doc(db, COLLECTION_NAME, commissionId);
      
      await updateDoc(commissionRef, {
        status: 'paid',
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      throw new Error('Failed to mark commission as paid');
    }
  },

  // Calculate commission for a deal
  calculateCommission(dealValue: number, commissionType: 'one_time' | 'recurring'): number {
    if (commissionType === 'one_time') {
      return 500; // Fixed $500 commission for one-time deals
    } else {
      return dealValue * 0.10; // 10% for recurring deals
    }
  },

  // Get commission by ID
  async getCommissionById(commissionId: string): Promise<Commission | null> {
    try {
      const commissionDoc = await getDoc(doc(db, COLLECTION_NAME, commissionId));
      if (!commissionDoc.exists()) {
        return null;
      }
      
      const data = commissionDoc.data();
      return {
        id: commissionDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        paidAt: data.paidAt?.toDate?.()?.toISOString() || undefined,
      } as Commission;
    } catch (error) {
      console.error('Error fetching commission:', error);
      throw new Error('Failed to fetch commission');
    }
  }
}; 