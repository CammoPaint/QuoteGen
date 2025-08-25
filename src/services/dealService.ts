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
import { Deal } from '../types';

const COLLECTION_NAME = 'deals';

export const dealService = {
  async getDeals(currentUserId: string, userRole: string, filterUserId?: string): Promise<Deal[]> {
    const constraints: any[] = [];
    if (userRole !== 'admin' && userRole !== 'sales_manager') {
      constraints.push(where('userId', '==', currentUserId));
    } else if (filterUserId) {
      constraints.push(where('userId', '==', filterUserId));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Deal));
  },

  async addDeal(deal: Omit<Deal, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), { ...deal });
    return docRef.id;
  },

  async updateDeal(dealId: string, updates: Partial<Deal>): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, dealId);
    await updateDoc(ref, { ...updates });
  },

  async deleteDeal(dealId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, dealId));
  },

  async getDealById(dealId: string): Promise<Deal | null> {
    const ref = doc(db, COLLECTION_NAME, dealId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as Deal;
  }
};


