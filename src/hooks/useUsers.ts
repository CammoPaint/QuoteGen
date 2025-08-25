import { useState, useEffect } from 'react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

export const useUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!currentUser) {
      console.warn('No current user, skipping user load');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading users for current user:', {
        userId: currentUser.id,
        companyId: currentUser.companyId,
        role: currentUser.role
      });

      let fetchedUsers: User[] = [];

      if (currentUser.companyId) {
        // Fetch users by company ID to ensure data isolation
        fetchedUsers = await userService.getUsersByCompany(currentUser.companyId);
      } else {
        console.warn('Current user has no companyId, fetching all users');
        fetchedUsers = await userService.getAllUsers();
      }

      // If no users found but we have a current user, include the current user as a fallback
      if (fetchedUsers.length === 0 && currentUser) {
        console.log('No users found in Firestore, using current user as fallback');
        const fallbackUser: User = {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          companyId: currentUser.companyId,
          avatar: currentUser.avatar,
          createdAt: currentUser.createdAt,
          updatedAt: currentUser.updatedAt
        };
        fetchedUsers = [fallbackUser];
      }

      setUsers(fetchedUsers);
      console.log(`Successfully loaded ${fetchedUsers.length} users`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      console.error('Error loading users:', err);
      
      // As a last resort, if we can't fetch users but have a current user, use them
      if (currentUser) {
        console.log('Using current user as fallback due to error');
        const fallbackUser: User = {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          companyId: currentUser.companyId,
          avatar: currentUser.avatar,
          createdAt: currentUser.createdAt,
          updatedAt: currentUser.updatedAt
        };
        setUsers([fallbackUser]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser?.companyId]);

  // Get available users based on current user's role
  const getAvailableUsers = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin' || currentUser.role === 'sales_manager') {
      return users;
    }
    // Non-admin users can only see themselves
    return users.filter(u => u.id === currentUser.id);
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getUserName = (userId: string) => {
    const user = getUserById(userId);
    return user ? user.name : 'Unknown User';
  };

  return {
    users,
    loading,
    error,
    loadUsers,
    getAvailableUsers,
    getUserById,
    getUserName
  };
};
