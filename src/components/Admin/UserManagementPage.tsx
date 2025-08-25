import React, { useState } from 'react';
import { Plus, Trash2, Mail, Shield, User as UserIcon, AlertCircle, Send } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { useInvitations } from '../../hooks/useInvitations';

interface UserManagementPageProps {
  onClose?: () => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ onClose: _ }) => {
  const { user: currentUser } = useAuth();
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { 
    loading: invitationsLoading, 
    error: invitationsError, 
    cancelInvitation: cancelInvitationService,
    getPendingInvitations,
    canManageInvitations,
    createInvitation,
    resendInvitation
  } = useInvitations();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showResendConfirm, setShowResendConfirm] = useState(false);
  const [resendInvitationData, setResendInvitationData] = useState<{id: string, email: string} | null>(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [deleteUserData, setDeleteUserData] = useState<{id: string, name: string} | null>(null);
  const [showDeleteInvitationConfirm, setShowDeleteInvitationConfirm] = useState(false);
  const [deleteInvitationData, setDeleteInvitationData] = useState<{id: string, email: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'standard'>('standard');

  // Get pending invitations for display
  const pendingInvitations = getPendingInvitations();

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create the invitation in Firestore
      console.log('Creating invitation for:', inviteEmail, 'with role:', inviteRole);
      const invitationId = await createInvitation(inviteEmail, inviteRole);
      
      console.log('Invitation created successfully with ID:', invitationId);
      setSuccess(`Invitation sent to ${inviteEmail} and saved to database`);
      setInviteEmail('');
      setInviteRole('standard');
      setShowInviteForm(false);

    } catch (err) {
      console.error('Error creating invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = (userId: string, userName: string) => {
    setDeleteUserData({ id: userId, name: userName });
    setShowDeleteUserConfirm(true);
  };

  const confirmRemoveUser = async () => {
    if (!deleteUserData) return;

    setLoading(true);
    setError('');
    setShowDeleteUserConfirm(false);
    
    try {
      // TODO: In a real app, this would call the Firebase function to remove user
      // For now, just simulate the action
      console.log('Removing user:', deleteUserData.id);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // TODO: The user list will be automatically updated when the useUsers hook reloads
      setSuccess(`User ${deleteUserData.name} removed successfully`);
    } catch (err) {
      setError('Failed to remove user. Please try again.');
    } finally {
      setLoading(false);
      setDeleteUserData(null);
    }
  };

  const cancelRemoveUser = () => {
    setShowDeleteUserConfirm(false);
    setDeleteUserData(null);
  };

  const handleCancelInvitation = (invitationId: string, email: string) => {
    setDeleteInvitationData({ id: invitationId, email });
    setShowDeleteInvitationConfirm(true);
  };

  const confirmCancelInvitation = async () => {
    if (!deleteInvitationData) return;

    setLoading(true);
    setError('');
    setShowDeleteInvitationConfirm(false);
    
    try {
      await cancelInvitationService(deleteInvitationData.id);
      setSuccess(`Invitation to ${deleteInvitationData.email} cancelled successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    } finally {
      setLoading(false);
      setDeleteInvitationData(null);
    }
  };

  const cancelDeleteInvitation = () => {
    setShowDeleteInvitationConfirm(false);
    setDeleteInvitationData(null);
  };

  const handleResendInvitation = (invitationId: string, email: string) => {
    setResendInvitationData({ id: invitationId, email });
    setShowResendConfirm(true);
  };

  const confirmResendInvitation = async () => {
    if (!resendInvitationData) return;

    setLoading(true);
    setError('');
    setShowResendConfirm(false);
    
    try {
      await resendInvitation(resendInvitationData.id);
      setSuccess(`Invitation resent to ${resendInvitationData.email} successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invitation');
    } finally {
      setLoading(false);
      setResendInvitationData(null);
    }
  };

  const cancelResendInvitation = () => {
    setShowResendConfirm(false);
    setResendInvitationData(null);
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your team members and their roles</p>
            </div>
            <button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center space-x-2 bg-[#4285F4] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Invite User</span>
            </button>
          </div>

          {(error || usersError || invitationsError) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error || usersError || invitationsError}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
              {success}
            </div>
          )}
        </div>

        {/* Active Users */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Users</h3>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4285F4]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role}
                  </span>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleRemoveUser(user.id, user.name)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Remove user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {canManageInvitations() && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Invitations</h3>
            {invitationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4285F4]"></div>
              </div>
            ) : pendingInvitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{invitation.email}</h4>
                      <p className="text-sm text-gray-600">
                        Invited by {invitation.invitedByName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(invitation.role)}`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {invitation.role}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                      {invitation.status}
                    </span>
                    <button
                      onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                      disabled={loading}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                      title="Resend invitation email"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Cancel invitation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      {showDeleteUserConfirm && deleteUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Remove User</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to remove:
                  </p>
                  <p className="font-medium text-gray-900">{deleteUserData.name}</p>
                </div>
              </div>
              <p className="text-xs text-red-600 mb-6 font-medium">
                ⚠️ This action cannot be undone. The user will lose access to the system.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelRemoveUser}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveUser}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Remove User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invitation Confirmation Modal */}
      {showDeleteInvitationConfirm && deleteInvitationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Invitation</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to cancel the invitation to:
                  </p>
                  <p className="font-medium text-gray-900">{deleteInvitationData.email}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                This will prevent the user from joining the team using this invitation link.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelDeleteInvitation}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Keep Invitation
                </button>
                <button
                  type="button"
                  onClick={confirmCancelInvitation}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Cancel Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resend Invitation Confirmation Modal */}
      {showResendConfirm && resendInvitationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Resend Invitation</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Send className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to resend the invitation to:
                  </p>
                  <p className="font-medium text-gray-900">{resendInvitationData.email}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                This will send a new invitation email with a fresh invitation link.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelResendInvitation}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmResendInvitation}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Resend Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Invite New User</h3>
            </div>
            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                  placeholder="user@company.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'standard')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                >
                  <option value="standard">Standard User</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Admins can manage users and access all features. Standard users have limited access.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail('');
                    setInviteRole('standard');
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};