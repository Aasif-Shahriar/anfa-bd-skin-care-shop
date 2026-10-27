import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  claims: Record<string, any>;
  loading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  claims: {},
  loading: true,
  isSigningIn: false,
  authError: null,
  clearAuthError: () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateProfileData: async () => {},
  refreshAdminStatus: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [claims, setClaims] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const isSigningInRef = useRef<boolean>(false);

  const clearAuthError = () => setAuthError(null);

  // Helper to extract and verify real Firebase Custom Claim from ID Token
  const verifyTokenClaims = async (currentUser: User): Promise<boolean> => {
    try {
      // Force refresh (true) to ensure any newly assigned claims from Admin SDK are loaded
      const tokenResult = await currentUser.getIdTokenResult(true);
      const userClaims = tokenResult.claims || {};
      setClaims(userClaims);
      const hasAdminPrivilege = Boolean(userClaims.admin === true);
      setIsAdmin(hasAdminPrivilege);
      return hasAdminPrivilege;
    } catch (err) {
      console.warn('Failed to verify token custom claims:', err);
      setIsAdmin(false);
      setClaims({});
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Enforce custom claims verification
        await verifyTokenClaims(currentUser);

        // Fetch or create user profile
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            setProfile(userSnap.data() as UserProfile);
          } else {
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Valued Client',
              phone: '',
              address: '',
              city: 'Dhaka',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile, { merge: true });
            setProfile(initialProfile);
          }
        } catch (e) {
          console.warn('Profile sync:', e);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
        setClaims({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // Prevent multiple concurrent popups which trigger auth/cancelled-popup-request
    if (isSigningInRef.current) {
      return;
    }

    isSigningInRef.current = true;
    setIsSigningIn(true);

    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const errorCode = error?.code || '';
      // Gracefully handle standard popup closure or cancellation by user
      if (
        errorCode === 'auth/cancelled-popup-request' ||
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/user-cancelled'
      ) {
        console.info('Google sign-in popup closed or cancelled by user.');
        return;
      }

      if (errorCode === 'auth/unauthorized-domain') {
        const msg = "Domain unauthorized. Add 'localhost' to Authorized Domains in Firebase Console (Authentication > Settings > Authorized domains). Do not include http:// or ports.";
        console.error(
          `Firebase Auth Unauthorized Domain Error: ${msg}\nDirect Console link: https://console.firebase.google.com/project/gen-lang-client-0282419252/authentication/settings`
        );
        setAuthError(msg);
        return;
      }

      const fallbackMsg = error?.message || 'Google sign-in could not be completed.';
      console.warn('Google sign-in notice:', fallbackMsg);
      setAuthError(fallbackMsg);
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setClaims({});
    } catch (error) {
      console.warn('Sign-out notice:', error);
    }
  };

  const refreshAdminStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) {
      setIsAdmin(false);
      setClaims({});
      return false;
    }
    return verifyTokenClaims(auth.currentUser);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, data, { merge: true });
      setProfile((prev: UserProfile | null) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        claims,
        loading,
        isSigningIn,
        authError,
        clearAuthError,
        signInWithGoogle,
        signOut,
        updateProfileData,
        refreshAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
