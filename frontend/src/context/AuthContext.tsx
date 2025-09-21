import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseConfig } from "../firebase";

let firebaseApp: FirebaseApp | null = null;

function ensureFirebase() {
  if (!firebaseApp) firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  return { app: firebaseApp, auth };
}

export type AuthUser = { uid: string; email?: string | null; displayName?: string | null } | null;

type AuthContextType = {
  user: AuthUser;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string, phone?: string, dob?: string) => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  signInWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);

  useEffect(() => {
    const { auth } = ensureFirebase();
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) setUser({ uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName });
      else setUser(null);
    });
  }, []);

  const signInWithGoogle = async () => {
    const { auth } = ensureFirebase();
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { auth } = ensureFirebase();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (name: string, email: string, password: string, phone?: string, dob?: string) => {
    const { app, auth } = ensureFirebase();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    try {
      const db = getFirestore(app);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        displayName: name || null,
        email: email || null,
        phone: phone || null,
        dob: dob || null,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch {
      // ignore
    }
  };

  const logOut = async () => {
    const { auth } = ensureFirebase();
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, loginWithEmail, registerWithEmail, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};
