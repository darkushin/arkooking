import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'Viewer' | 'Editor' | 'Admin' | 'Guest';

export interface Profile extends User {
  role: UserRole;
}

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isGuest: false,
  signOut: async () => {},
  enterGuestMode: () => {},
  exitGuestMode: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        // Unblock the UI right away with a default role; getSession reads from
        // local storage, so this renders without waiting on any network call.
        // The profile query below only upgrades the role once it arrives.
        setUser({ ...session.user, role: 'Viewer' });
        setLoading(false);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setUser({ ...session.user, role: (profileData as any).role as UserRole });
        } else {
          console.error('Profile not found:', profileError?.message);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'SIGNED_IN') {
          // Defer: awaiting Supabase calls inside onAuthStateChange deadlocks the auth lock
          setTimeout(() => getSessionAndProfile(), 0);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsGuest(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  const enterGuestMode = () => {
    setIsGuest(true);
    setUser({ id: 'guest', role: 'Guest' } as Profile);
  };
  
  const exitGuestMode = () => {
    setIsGuest(false);
    setUser(null);
  }

  const value = {
    user,
    session,
    loading,
    isGuest,
    signOut,
    enterGuestMode,
    exitGuestMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
