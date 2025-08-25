import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Company } from '../types';

const COLLECTION_NAME = 'companies';

export const companyService = {
  // Get company by ID
  async getCompany(companyId: string): Promise<Company | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, companyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Company;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw new Error('Failed to fetch company');
    }
  },

  // Create or update company
  async saveCompany(companyId: string, companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const companyRef = doc(db, COLLECTION_NAME, companyId);
      const existingDoc = await getDoc(companyRef);
      
      if (existingDoc.exists()) {
        // Update existing company
        await updateDoc(companyRef, {
          ...companyData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new company
        await setDoc(companyRef, {
          ...companyData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error saving company:', error);
      throw new Error('Failed to save company');
    }
  },

  // Update company
  async updateCompany(companyId: string, companyData: Partial<Company>): Promise<void> {
    try {
      const companyRef = doc(db, COLLECTION_NAME, companyId);
      await updateDoc(companyRef, {
        ...companyData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating company:', error);
      throw new Error('Failed to update company');
    }
  }
};