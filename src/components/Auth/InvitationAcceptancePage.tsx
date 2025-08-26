import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Invitation } from '../../types';
import { useInvitations } from '../../hooks/useInvitations';
import { acceptInvitation } from '../../services/aiService';

interface InvitationAcceptancePageProps {
  token: string;
  onAcceptComplete: () => void;
}

export const InvitationAcceptancePage: React.FC<InvitationAcceptancePageProps> = ({
  token,
  onAcceptComplete
}) => {
  const { getInvitationByToken } = useInvitations();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const verifyInvitation = useCallback(async () => {
    try {
      const fetchedInvitation = await getInvitationByToken(token);

      if (!fetchedInvitation) {
        setError('Invalid or expired invitation link.');
        return;
      }

      // Check if invitation is expired
      const expiresAt = new Date(fetchedInvitation.expiresAt);
      if (expiresAt < new Date()) {
        setError('This invitation has expired. Please contact your administrator for a new invitation.');
        return;
      }

      // Check if invitation is already accepted
      if (fetchedInvitation.status === 'accepted') {
        setError('This invitation has already been accepted.');
        return;
      }

      if (fetchedInvitation.status !== 'pending') {
        setError('This invitation is no longer valid.');
        return;
      }

      setInvitation(fetchedInvitation);
    } catch (err) {
      console.error('Error verifying invitation:', err);
      setError(err instanceof Error ? err.message : 'Invalid or expired invitation link.');
    } finally {
      setLoading(false);
    }
  }, [token, getInvitationByToken]);

  useEffect(() => {
    verifyInvitation();
  }, [verifyInvitation]);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!name.trim()) {
      setError('Full name is required');
      return;
    }

    setSubmitting(true);

    try {
      // Call the Firebase function to create user account and accept invitation
      await acceptInvitation({
        token,
        name: name.trim(),
        password
      });

      setSuccess(true);
      
      // Redirect to main app after a short delay
      setTimeout(() => {
        onAcceptComplete();
      }, 2000);

    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Invitation</h2>
          <p className="text-gray-600">Please wait while we verify your invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-brand text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Insytify CRM!</h2>
          <p className="text-gray-600 mb-4">
            Your account has been created successfully. You'll be redirected to the dashboard shortly.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Accept Invitation</h2>
          <p className="text-gray-600 mt-2">
            You've been invited to join Insytify CRM. 
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Invited by {invitation?.invitedByName}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleAcceptInvitation} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={invitation?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Account...
              </div>
            ) : (
              'Accept Invitation & Create Account'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          By accepting this invitation, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};