import { useState, useEffect, useCallback } from 'react';
import { Invitation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { invitationService } from '../services/invitationService';
import { inviteUser as inviteUserService, resendInvitation as resendInvitationService } from '../services/aiService';

export const useInvitations = () => {
  const { user: currentUser } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let fetchedInvitations: Invitation[] = [];

      if (currentUser.role === 'admin' || currentUser.role === 'sales_manager') {
        // Admins and sales managers can see invitations for their company
        if (currentUser.companyId) {
          fetchedInvitations = await invitationService.getInvitationsByCompany(currentUser.companyId);
        } else {
          fetchedInvitations = await invitationService.getAllInvitations();
        }
      } else {
        // Regular users cannot see invitations
        fetchedInvitations = [];
      }

      setInvitations(fetchedInvitations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invitations';
      setError(errorMessage);
      console.error('Error loading invitations:', err);
      
      // Set empty array on error to prevent showing stale data
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // Cancel an invitation
  const cancelInvitation = async (invitationId: string): Promise<void> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'sales_manager')) {
      throw new Error('Permission denied: Only admins can cancel invitations');
    }

    try {
      await invitationService.cancelInvitation(invitationId);
      
      // Remove from local state immediately for better UX
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation';
      console.error('Error cancelling invitation:', err);
      throw new Error(errorMessage);
    }
  };

  // Get invitation by token (for acceptance flow)
  const getInvitationByToken = useCallback(async (token: string): Promise<Invitation | null> => {
    try {
      const invitation = await invitationService.getInvitationByToken(token);
      
      if (invitation) {
        // Check if invitation is still valid
        if (!invitationService.isInvitationValid(invitation)) {
          return null;
        }
      }
      
      return invitation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invitation';
      console.error('Error fetching invitation by token:', err);
      throw new Error(errorMessage);
    }
  }, []);

  // Update invitation status (e.g., when accepted)
  const updateInvitationStatus = async (invitationId: string, status: Invitation['status']): Promise<void> => {
    try {
      await invitationService.updateInvitationStatus(invitationId, status);
      
      // Update local state
      setInvitations(prev => prev.map(inv => 
        inv.id === invitationId ? { ...inv, status } : inv
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invitation status';
      console.error('Error updating invitation status:', err);
      throw new Error(errorMessage);
    }
  };

  // Get only pending invitations
  const getPendingInvitations = () => {
    return invitations.filter(inv => 
      inv.status === 'pending' && invitationService.isInvitationValid(inv)
    );
  };

  // Get invitations by status
  const getInvitationsByStatus = (status: Invitation['status']) => {
    return invitations.filter(inv => inv.status === status);
  };

  // Check if user can manage invitations
  const canManageInvitations = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'sales_manager';
  };

  // Refresh invitations (useful after creating new ones)
  const refreshInvitations = async () => {
    await loadInvitations();
  };

  // Create a new invitation by calling the Firebase function
  const createInvitation = async (email: string, role: 'admin' | 'standard'): Promise<string> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'sales_manager')) {
      throw new Error('Permission denied: Only admins can create invitations');
    }

    if (!currentUser.companyId) {
      throw new Error('Current user has no company ID');
    }

    try {
      // Get the current user's ID token for authentication
      const { auth } = await import('../services/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        throw new Error('No authentication token available');
      }

      // Use the aiService to create invitation
      const result = await inviteUserService({
        email,
        role,
        companyId: currentUser.companyId
      }, idToken);
      
      // Refresh invitations list to show the new invitation
      await loadInvitations();
      
      return result.invitationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invitation';
      console.error('Error creating invitation:', err);
      throw new Error(errorMessage);
    }
  };

  // Mark expired invitations
  const markExpiredInvitations = async (): Promise<number> => {
    if (!canManageInvitations()) {
      throw new Error('Permission denied: Only admins can mark expired invitations');
    }

    try {
      const expiredCount = await invitationService.markExpiredInvitations();
      // Refresh the list to show updated statuses
      await loadInvitations();
      return expiredCount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark expired invitations';
      console.error('Error marking expired invitations:', err);
      throw new Error(errorMessage);
    }
  };

  // Resend invitation email
  const resendInvitation = async (invitationId: string): Promise<void> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'sales_manager')) {
      throw new Error('Permission denied: Only admins can resend invitations');
    }

    try {
      // Find the invitation to resend
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Check if invitation is still valid to resend
      if (invitation.status !== 'pending') {
        throw new Error('Can only resend pending invitations');
      }

      // Get the current user's ID token for authentication
      const { auth } = await import('../services/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        throw new Error('No authentication token available');
      }

      // Use the aiService to resend invitation
      await resendInvitationService(
        invitation.email,
        invitation.role,
        invitation.companyId,
        idToken
      );

      // No need to refresh the list since we're just resending the email, not creating a new invitation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation';
      console.error('Error resending invitation:', err);
      throw new Error(errorMessage);
    }
  };

  return {
    invitations,
    loading,
    error,
    loadInvitations,
    cancelInvitation,
    getInvitationByToken,
    updateInvitationStatus,
    getPendingInvitations,
    getInvitationsByStatus,
    canManageInvitations,
    refreshInvitations,
    createInvitation,
    markExpiredInvitations,
    resendInvitation
  };
};
