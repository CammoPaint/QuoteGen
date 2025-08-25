import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '../types';

const COLLECTION_NAME = 'tasks';

export const taskService = {
  // Get all tasks for a user
  async getTasks(userId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('dateDue', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateCreated: doc.data().dateCreated?.toDate?.()?.toISOString() || new Date().toISOString(),
        dateDue: doc.data().dateDue?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Task[];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw new Error('Failed to fetch tasks');
    }
  },

  // Get tasks for a specific customer
  async getTasksByCustomer(userId: string, customerId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('customerId', '==', customerId),
        orderBy('dateDue', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateCreated: doc.data().dateCreated?.toDate?.()?.toISOString() || new Date().toISOString(),
        dateDue: doc.data().dateDue?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Task[];
    } catch (error) {
      console.error('Error fetching tasks by customer:', error);
      throw new Error('Failed to fetch tasks');
    }
  },

  // Get tasks by status
  async getTasksByStatus(userId: string, status: Task['status']): Promise<Task[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('dateDue', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateCreated: doc.data().dateCreated?.toDate?.()?.toISOString() || new Date().toISOString(),
        dateDue: doc.data().dateDue?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Task[];
    } catch (error) {
      console.error('Error fetching tasks by status:', error);
      throw new Error('Failed to fetch tasks');
    }
  },

  // Add a new task
  async addTask(userId: string, taskData: Omit<Task, 'id' | 'dateCreated'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...taskData,
        userId,
        dateCreated: serverTimestamp(),
        dateDue: new Date(taskData.dateDue),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding task:', error);
      throw new Error('Failed to add task');
    }
  },

  // Update an existing task
  async updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(db, COLLECTION_NAME, taskId);
      const updateData: any = { ...taskData };
      
      // Convert date strings to Date objects for Firestore
      if (taskData.dateDue) {
        updateData.dateDue = new Date(taskData.dateDue);
      }
      
      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  },

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }
};