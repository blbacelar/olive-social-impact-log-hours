"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  reload,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase/config";
import {
  getAuthErrorMessage,
  isAllowedSignInEmail,
  isOrganizationEmail,
  normalizeEmail,
} from "@/lib/auth";
import { ensureUserProfile } from "@/lib/firebase/db";
import { ADMIN_EMAILS } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [, setAuthRevision] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser?.email && !isAllowedSignInEmail(nextUser.email)) {
        await signOut(auth);
        setAuthError("Use an Olive Social Impact email address.");
        setUser(null);
      } else {
        setUser(nextUser);
      }
      setIsLoading(false);
    });
  }, []);

  const isAdmin = useMemo(
    () => ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? ""),
    [user],
  );

  async function runAuthAction(action: () => Promise<void>) {
    setIsAuthBusy(true);
    setAuthError("");
    try {
      await action();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      throw error;
    } finally {
      setIsAuthBusy(false);
    }
  }

  return {
    user,
    isAdmin,
    isLoading,
    isAuthBusy,
    authError,
    clearAuthError: () => setAuthError(""),
    signIn: (email: string, password: string) =>
      runAuthAction(async () => {
        if (!isAllowedSignInEmail(email)) {
          throw { code: "auth/domain-not-allowed" };
        }
        await signInWithEmailAndPassword(
          auth,
          normalizeEmail(email),
          password,
        );
      }),
    signUp: (name: string, email: string, password: string) =>
      runAuthAction(async () => {
        if (!isOrganizationEmail(email)) {
          throw { code: "auth/domain-not-allowed" };
        }
        if (name.trim().length < 2) {
          throw { code: "auth/name-required" };
        }
        if (password.length < 8) {
          throw { code: "auth/weak-password" };
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          normalizeEmail(email),
          password,
        );
        await updateProfile(credential.user, { displayName: name.trim() });
        await sendEmailVerification(credential.user);
      }),
    sendVerification: () =>
      runAuthAction(async () => {
        if (!auth.currentUser) throw { code: "auth/user-not-found" };
        await sendEmailVerification(auth.currentUser);
      }),
    refreshUser: () =>
      runAuthAction(async () => {
        if (!auth.currentUser) throw { code: "auth/user-not-found" };
        await reload(auth.currentUser);
        setAuthRevision((revision) => revision + 1);
      }),
    resetPassword: (email: string) =>
      runAuthAction(async () => {
        if (!isAllowedSignInEmail(email)) {
          throw { code: "auth/invalid-email" };
        }
        await sendPasswordResetEmail(auth, normalizeEmail(email));
      }),
    updateDisplayName: (displayName: string) =>
      runAuthAction(async () => {
        const currentUser = auth.currentUser;
        const normalizedName = displayName.trim();

        if (!currentUser) throw { code: "auth/user-not-found" };
        if (normalizedName.length < 2) {
          throw { code: "auth/name-required" };
        }

        await updateProfile(currentUser, { displayName: normalizedName });
        await ensureUserProfile({
          id: currentUser.uid,
          email: currentUser.email ?? "",
          displayName: normalizedName,
        });
        setAuthRevision((revision) => revision + 1);
      }),
    signOut: () => signOut(auth),
  };
}
