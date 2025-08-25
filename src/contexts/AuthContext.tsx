import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { User, AuthContextType } from '../types';

// Conditional imports based on Firebase configuration
let signInWithEmailAndPassword: any;
let createUserWithEmailAndPassword: any;
let signOut: any;
let onAuthStateChanged: any;
let GoogleAuthProvider: any;
let OAuthProvider: any;
let signInWithPopup: any;
let signInWithRedirect: any;
let getRedirectResult: any;
let fetchSignInMethodsForEmail: any;
let linkWithCredential: any;
let doc: any;
let getDoc: any;
let setDoc: any;
let serverTimestamp: any;

const authModule = await import('firebase/auth');
const firestoreModule = await import('firebase/firestore');

signInWithEmailAndPassword = authModule.signInWithEmailAndPassword;
createUserWithEmailAndPassword = authModule.createUserWithEmailAndPassword;
signOut = authModule.signOut;
onAuthStateChanged = authModule.onAuthStateChanged;
GoogleAuthProvider = authModule.GoogleAuthProvider;
OAuthProvider = authModule.OAuthProvider;
signInWithPopup = authModule.signInWithPopup;
signInWithRedirect = authModule.signInWithRedirect;
getRedirectResult = authModule.getRedirectResult;
fetchSignInMethodsForEmail = authModule.fetchSignInMethodsForEmail;
linkWithCredential = authModule.linkWithCredential;

doc = firestoreModule.doc;
getDoc = firestoreModule.getDoc;
setDoc = firestoreModule.setDoc;
serverTimestamp = firestoreModule.serverTimestamp;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock user for development when Firebase is not configured
  const mockUser: User = {
    id: 'mock-user-1',
    email: 'demo@example.com',
    name: 'Demo User',
    role: 'admin',
    companyId: 'demo-company',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Use localStorage for mock authentication
  const getMockAuthState = () => {
    return localStorage.getItem('mockAuth') === 'true';
  };

  const setMockAuthState = (authenticated: boolean) => {
    if (authenticated) {
      localStorage.setItem('mockAuth', 'true');
    } else {
      localStorage.removeItem('mockAuth');
    }
  };

  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userData.name || firebaseUser.displayName || '',
          role: userData.role || 'admin',
          companyId: userData.companyId || 'default-company',
          avatar: userData.avatar || firebaseUser.photoURL || undefined,
          createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      }
      
      return null;
    } catch (error) {
      // If Firebase is configured but offline, fall back to mock user
      if (error.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('client is offline')) {
        console.warn('Firebase is offline, using mock authentication');
        return mockUser;
      }
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const createUserDocument = async (firebaseUser: FirebaseUser, additionalData: any = {}) => {
    try {
      const userData = {
        name: additionalData.name || firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        role: additionalData.role || 'admin',
        companyId: additionalData.companyId || 'default-company',
        avatar: firebaseUser.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      return {
        id: firebaseUser.uid,
        ...userData,
        avatar: firebaseUser.photoURL || undefined, // Convert back to undefined for frontend
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User;
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      try {
        setLoading(true);
        
        if (firebaseUser) {
          let userData = await fetchUserData(firebaseUser);
          
          if (!userData) {
            // Create user document if it doesn't exist
            userData = await createUserDocument(firebaseUser);
          }
          
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // If there's an error but Firebase is configured, try to use mock user as fallback
        if (error.code === 'unavailable') {
          console.warn('Firebase unavailable, falling back to mock user');
          setUser(mockUser);
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Sign in failed');
    }
  };

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Google sign in failed');
    }
  };

  const handleSignInWithMicrosoft = async () => {
    setLoading(true);
    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        tenant: 'organizations',
        prompt: 'consent'
      });

      console.log('Starting Microsoft sign-in with redirect...');
      
      // Use redirect instead of popup to avoid some auth restrictions
      await signInWithRedirect(auth, provider);
      // The page will redirect, so execution stops here
      
    } catch (error: any) {
      console.error('Microsoft sign-in error:', error);
      setLoading(false);
      
      // Handle account linking for existing accounts
      if (error.code === 'auth/account-exists-with-different-credential') {
        try {
          console.log('Account exists with different credential, attempting to link...');
          
          // Get the existing sign-in methods for this email
          const email = error.customData?.email;
          if (!email) {
            throw new Error('Unable to get email from error. Please try signing in with your original method first.');
          }

          console.log('Account with email', email, 'exists with different credential');
          
          // Get the pending credential
          const credential = OAuthProvider.credentialFromError(error);
          if (!credential) {
            throw new Error('Unable to get Microsoft credential. Please try again.');
          }

          // Get existing sign-in methods
          const methods = await fetchSignInMethodsForEmail(auth, email);
          console.log('Existing sign-in methods:', methods);

          if (methods.length === 0) {
            throw new Error('No existing sign-in methods found for this email.');
          }

          // Provide helpful message to user about linking accounts
          const methodNames = methods.map((method: string) => {
            switch (method) {
              case 'password': return 'email/password';
              case 'google.com': return 'Google';
              case 'microsoft.com': return 'Microsoft';
              default: return method;
            }
          });

          throw new Error(
            `An account with this email already exists using ${methodNames.join(' or ')} sign-in. ` +
            `Please sign in with your existing method first, then you can link your Microsoft account in Settings.`
          );

        } catch (linkError: any) {
          console.error('Account linking failed:', linkError);
          throw linkError;
        }
      }
      
      // Handle other specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please enable popups and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign-in attempt is in progress.');
      } else if (error.code === 'auth/admin-restricted-operation') {
        throw new Error('Microsoft authentication is not properly configured. Please contact your administrator.');
      }
      
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDocument(firebaseUser, { name });
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Sign up failed');
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Sign out failed');
    }
  };

  // Add this useEffect to handle redirect results
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Microsoft redirect sign-in successful:', result);
          // User is now signed in
        }
      } catch (error) {
        console.error('Microsoft redirect result error:', error);
      }
    };

    handleRedirectResult();
  }, []);

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithMicrosoft: handleSignInWithMicrosoft,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};