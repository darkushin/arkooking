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
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setUser({ ...session.user, role: (profileData as any).role as UserRole });
        } else {
          // Fallback or handle error if profile not found
          setUser({ ...session.user, role: 'Viewer' });
          console.error('Profile not found:', profileError?.message);
        }
      } else {
        setUser(null);
      }
      setSession(session);
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'SIGNED_IN') {
          getSessionAndProfile();
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
