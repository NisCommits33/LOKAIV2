/**
 * auth-provider.tsx — Global Authentication Context
 *
 * Provides authentication state (Supabase user, DB profile, session) to the
 * entire component tree. Handles Google OAuth sign-in, sign-out, session
 * initialization, and real-time auth state change subscriptions.
 *
 * Usage: Wrap the app with <AuthProvider> and consume via useAuth() hook.
 *
 * @module components/providers/auth-provider
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { User } from "@/types/database";

/** Shape of the authentication context exposed to consumers */
interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  dbUser: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  /** Fetches the user's profile from the public.users table */
  const fetchDbUser = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      return data as User;
    },
    [supabase]
  );

  /** Refreshes the DB profile from the current Supabase session */
  const refreshUser = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (currentSession?.user) {
      const profile = await fetchDbUser(currentSession.user.id);
      setDbUser(profile);
    }
  }, [supabase, fetchDbUser]);

  // Initialize auth state on mount and subscribe to auth changes
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        setSession(initialSession);
        setSupabaseUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const profile = await fetchDbUser(initialSession.user.id);
          setDbUser(profile);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for sign-in/sign-out events from Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setSupabaseUser(newSession?.user ?? null);

      if (event === "SIGNED_IN" && newSession?.user) {
        const profile = await fetchDbUser(newSession.user.id);
        setDbUser(profile);
      } else if (event === "SIGNED_OUT") {
        setDbUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchDbUser]);

  /** Initiates Google OAuth flow with redirect to /auth/callback */
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };

  /** Signs out the user and clears all local auth state */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setDbUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        supabaseUser,
        dbUser,
        session,
        isLoading,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context.
 * Must be used within an <AuthProvider> component tree.
 *
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
