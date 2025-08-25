import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

const COLLECTION_NAME = 'users';

export const userService = {
  // Get all users (admin/manager access)
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('Fetching all users from Firestore...');
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} users`);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  },

  // Get users by company ID
  async getUsersByCompany(companyId: string): Promise<User[]> {
    try {
      console.log(`Fetching users for company: ${companyId}`);
      
      if (!companyId) {
        console.warn('No companyId provided, falling back to all users');
        return this.getAllUsers();
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('companyId', '==', companyId),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} users for company ${companyId}`);
      
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as User[];

      // If no users found for this company, but we have a current user, include them
      if (users.length === 0) {
        console.warn(`No users found for company ${companyId}, this might be the first user`);
      }

      return users;
    } catch (error) {
      console.error('Error fetching users by company:', error, {
        companyId,
        errorCode: (error as any)?.code,
        errorMessage: (error as any)?.message
      });
      
      // Try to provide more specific error messages
      if ((error as any)?.code === 'permission-denied') {
        throw new Error('Permission denied: Unable to access users. Please check your role permissions.');
      } else if ((error as any)?.code === 'unavailable') {
        throw new Error('Firestore is currently unavailable. Please try again later.');
      } else {
        throw new Error(`Failed to fetch users by company: ${(error as any)?.message || 'Unknown error'}`);
      }
    }
  },

  // Get a single user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as User;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user');
    }
  }
};
