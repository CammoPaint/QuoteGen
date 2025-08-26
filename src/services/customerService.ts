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
import { Customer } from '../types';

const COLLECTION_NAME = 'customers';

export const customerService = {
  // Get all customers for a user or company
  async getCustomers(userId: string, options?: { excludeLeads?: boolean }): Promise<Customer[]> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
      ];

      // Exclude leads at the query level when requested
      if (options?.excludeLeads) {
        // Using equality keeps indexes simple and avoids inequality ordering constraints
        constraints.push(where('customerType', '==', 'customer'));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        customerType: (doc.data() as any).customerType ?? 'customer',
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Customer[];
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
  },

  // Get all customers for a company (shows customers from all users in the company)
  async getAllCustomersForCompany(companyId: string, options?: { excludeLeads?: boolean }): Promise<Customer[]> {
    try {
      const constraints: any[] = [
        where('companyId', '==', companyId),
      ];

      if (options?.excludeLeads) {
        constraints.push(where('customerType', '==', 'customer'));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        customerType: (doc.data() as any).customerType ?? 'customer',
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Customer[];
    } catch (error) {
      console.error('Error fetching company customers:', error);
      throw new Error('Failed to fetch company customers');
    }
  },

  // Get absolutely all customers in the system (admin only)
  async getAllCustomers(options?: { excludeLeads?: boolean }): Promise<Customer[]> {
    try {
      const constraints: any[] = [];

      if (options?.excludeLeads) {
        constraints.push(where('customerType', '==', 'customer'));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        customerType: (doc.data() as any).customerType ?? 'customer',
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Customer[];
    } catch (error) {
      console.error('Error fetching all customers:', error);
      throw new Error('Failed to fetch all customers');
    }
  },

  // Get customer by ID
  async getCustomerById(customerId: string): Promise<Customer | null> {
    try {
      const customerDoc = await getDoc(doc(db, COLLECTION_NAME, customerId));
      if (!customerDoc.exists()) {
        return null;
      }
      
      const data = customerDoc.data();
      return {
        id: customerDoc.id,
        ...data,
        customerType: data.customerType ?? 'customer',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Customer;
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
      throw new Error('Failed to fetch customer');
    }
  },

  // Add a new customer
  async addCustomer(userId: string, customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, companyId?: string, userName?: string): Promise<string> {
    try {
      const docData: any = {
        ...customerData,
        userId,
        customerType: (customerData as any).customerType ?? 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Add companyId if provided
      if (companyId) {
        docData.companyId = companyId;
      }
      
      // Add userName if provided
      if (userName) {
        docData.userName = userName;
      }
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw new Error('Failed to add customer');
    }
  },

  // Update an existing customer
  async updateCustomer(customerId: string, customerData: Partial<Customer>): Promise<void> {
    try {
      const customerRef = doc(db, COLLECTION_NAME, customerId);
      await updateDoc(customerRef, {
        ...customerData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  },

  // Delete a customer
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, customerId));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  }
};