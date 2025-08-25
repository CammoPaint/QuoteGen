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
import { Invitation } from '../types';

const COLLECTION_NAME = 'invitations';

export const invitationService = {
  // Get all invitations for a company
  async getInvitationsByCompany(companyId: string): Promise<Invitation[]> {
    try {

      
      if (!companyId) {
        console.warn('No companyId provided for invitation fetch');
        return [];
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const invitations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const invitation = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          expiresAt: data.expiresAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Invitation;
        
        return invitation;
      });

      return invitations;
    } catch (error) {
      console.error('Error fetching invitations by company:', error, {
        companyId,
        errorCode: (error as any)?.code,
        errorMessage: (error as any)?.message
      });
      
      // Provide specific error messages
      if ((error as any)?.code === 'permission-denied') {
        throw new Error('Permission denied: Unable to access invitations. Please check your role permissions.');
      } else if ((error as any)?.code === 'unavailable') {
        throw new Error('Firestore is currently unavailable. Please try again later.');
      } else {
        throw new Error(`Failed to fetch invitations: ${(error as any)?.message || 'Unknown error'}`);
      }
    }
  },

  // Get all invitations (admin access)
  async getAllInvitations(): Promise<Invitation[]> {
    try {

      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);

      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Invitation[];
    } catch (error) {
      console.error('Error fetching all invitations:', error);
      throw new Error('Failed to fetch invitations');
    }
  },

  // Get invitation by token
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, token);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const invitation = {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: docSnap.data().expiresAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Invitation;

      return invitation;
    } catch (error) {
      console.error('Error fetching invitation by token:', error);
      throw new Error('Failed to fetch invitation');
    }
  },

  // Create a new invitation (typically done by cloud function, but can be done directly)
  async createInvitation(invitationData: Omit<Invitation, 'id' | 'createdAt'>): Promise<string> {
    try {

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...invitationData,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw new Error('Failed to create invitation');
    }
  },

  // Create invitation with auto-generated token (for frontend use)
  async createInvitationWithToken(
    email: string, 
    role: 'admin' | 'standard', 
    invitedBy: string, 
    invitedByName: string, 
    companyId: string
  ): Promise<string> {
    try {

      
      // Generate a unique token
      const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitationData = {
        email,
        role,
        status: 'pending' as const,
        invitedBy,
        invitedByName,
        companyId,
        token,
        expiresAt: expiresAt.toISOString(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...invitationData,
        createdAt: serverTimestamp(),
      });
      

      return docRef.id;
    } catch (error) {
      console.error('Error creating invitation with token:', error);
      
      // Provide specific error messages
      if ((error as any)?.code === 'permission-denied') {
        throw new Error('Permission denied: Unable to create invitation. Please check your role permissions.');
      } else if ((error as any)?.code === 'unavailable') {
        throw new Error('Firestore is currently unavailable. Please try again later.');
      } else {
        throw new Error(`Failed to create invitation: ${(error as any)?.message || 'Unknown error'}`);
      }
    }
  },

  // Update invitation status (e.g., when accepted)
  async updateInvitationStatus(invitationId: string, status: Invitation['status']): Promise<void> {
    try {

      const docRef = doc(db, COLLECTION_NAME, invitationId);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
      });

    } catch (error) {
      console.error('Error updating invitation status:', error);
      throw new Error('Failed to update invitation status');
    }
  },

  // Cancel/delete an invitation
  async cancelInvitation(invitationId: string): Promise<void> {
    try {

      const docRef = doc(db, COLLECTION_NAME, invitationId);
      await deleteDoc(docRef);

    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw new Error('Failed to cancel invitation');
    }
  },

  // Get pending invitations for a company
  async getPendingInvitations(companyId: string): Promise<Invitation[]> {
    try {

      
      if (!companyId) {
        return [];
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);

      
      const invitations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Invitation[];

      // Filter out expired invitations
      const now = new Date();
      const validInvitations = invitations.filter(inv => {
        const expiresAt = new Date(inv.expiresAt);
        return expiresAt > now;
      });


      return validInvitations;
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw new Error('Failed to fetch pending invitations');
    }
  },

  // Check if invitation is valid (not expired, still pending)
  isInvitationValid(invitation: Invitation): boolean {
    // First check if it's pending
    if (invitation.status !== 'pending') {
      return false;
    }
    
    // Then check expiration - but be more forgiving with date parsing
    // try {
    //   const now = new Date();
    //   const expiresAt = new Date(invitation.expiresAt);
      
    //   // If date parsing failed, assume it's valid (rather than invalid)
    //   if (isNaN(expiresAt.getTime())) {
    //     console.warn('Could not parse expiration date for invitation:', invitation.id, invitation.expiresAt, '- assuming valid');
    //     return true;
    //   }
      
    //   return expiresAt > now;
    // } catch (error) {
    //   console.warn('Error checking invitation expiration:', error, '- assuming valid');
    //   return true;
    // }

    return true;
  },

  // Mark expired invitations (utility function)
  async markExpiredInvitations(): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const now = new Date();
      let expiredCount = 0;

      const updatePromises = querySnapshot.docs.map(async (docSnapshot) => {
        const invitation = docSnapshot.data() as Invitation;
        const expiresAt = new Date(invitation.expiresAt);
        
        if (expiresAt <= now) {
          await updateDoc(docSnapshot.ref, {
            status: 'expired',
            updatedAt: serverTimestamp(),
          });
          expiredCount++;
        }
      });

      await Promise.all(updatePromises);

      return expiredCount;
    } catch (error) {
      console.error('Error marking expired invitations:', error);
      throw new Error('Failed to mark expired invitations');
    }
  }
};
