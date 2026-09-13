import { useState, useEffect, createContext, useContext, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { saveDeviceLog } from "./useDeviceBlock";

// Muhim: Vercel proxy orqali nisbiy manzil ishlatiladi
const API_BASE_URL = '';

interface AuthContextType {
  user: User | null;
  profile: any;
  isAdmin: boolean;
  isSubAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isSubAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<string | null>(null);
  const isSyncing = useRef(false);
  const lastSyncedToken = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const hasLoggedDeviceRef = useRef<string | null>(null);
  const isSettingSessionRef = useRef<boolean>(false);

  const syncSessionToBFF = async (session: any) => {
    if (!session?.access_token) return;
    if (lastSyncedToken.current === session.access_token) return;
    if (isSyncing.current) return;

    isSyncing.current = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE_URL}/api/auth/set-session`, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          access_token: session.access_token, 
          refresh_token: session.refresh_token 
        })
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        lastSyncedToken.current = session.access_token;
        sessionStorage.setItem('bff_synced', 'true');
      }
    } catch (err) {
      console.warn("BFF sync timeout or error:", err);
    } finally {
      isSyncing.current = false;
    }
  };

  const refreshProfileInternal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(`${API_BASE_URL}/api/auth/session`, { credentials: 'include', headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const text = await resp.text();
      const data = text ? JSON.parse(text) : {};
        const checkAdmin = (u: any, p: any, rolesArr: string[]) => {
          if (!u) return false;
          if (u.email === 'xudayberganovbackend@gmail.com') return true;
          if (p?.role === 'admin' || p?.role === 'super_admin') return true;
          return rolesArr.includes('admin') || rolesArr.includes('sub_admin');
        };

        if (data.user && data.profile) {
          setUser((prev) => (prev?.id === data.user.id ? prev : data.user));
          userRef.current = data.user.id;
          setProfile(data.profile);
          const roles = data.roles || [];
          setIsAdmin(checkAdmin(data.user, data.profile, roles));
          setIsSubAdmin(roles.includes('sub_admin'));
          return;
        }

        // Fallback: fetch profile directly from Supabase DB
        if (session?.user) {
          const authUser = session.user;
          setUser((prev) => (prev?.id === authUser.id ? prev : authUser));
          userRef.current = authUser.id;

          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .maybeSingle();

          if (profData) {
            setProfile(profData);
          } else {
            const newProf = {
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || "Foydalanuvchi",
              phone: authUser.phone || authUser.user_metadata?.phone || "",
              email: authUser.email || null,
              avatar_url: authUser.user_metadata?.avatar_url || null,
              user_id: authUser.id,
              target_subject: "SAT",
              subscription_tier: "free"
            };
            setProfile(newProf);
            (supabase.from('profiles' as any) as any).insert(newProf as any).then(({ error }: any) => {
              if (error) console.error('Auto profile insert error:', error);
            });
          }

          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUser.id);

          const roles = rolesData?.map((r: any) => r.role) || [];
          setIsAdmin(checkAdmin(authUser, profData, roles));
          setIsSubAdmin(roles.includes('sub_admin'));
        }
    } catch (err) {
      console.warn("Profile refresh timeout or error:", err);
    }
  };

  const refreshProfile = async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 1500 && profile) {
      return;
    }
    lastRefreshTimeRef.current = now;
    refreshPromiseRef.current = refreshProfileInternal().finally(() => {
      refreshPromiseRef.current = null;
    });
    return refreshPromiseRef.current;
  };

  useEffect(() => {
    let mounted = true;

    // Hard 2.5s fallback timer so loading state NEVER locks the UI
    const loadingSafetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2500);

    const initialize = async () => {
      try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`${API_BASE_URL}/api/auth/session`, { credentials: 'include', signal: controller.signal });
        clearTimeout(tId);

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        
        if (mounted && data.user && data.profile) {
          setUser(data.user);
          userRef.current = data.user.id;
          setProfile(data.profile);
          const roles = data.roles || [];
          const isAdm = data.user?.email === 'xudayberganovbackend@gmail.com' || data.profile?.role === 'admin' || data.profile?.role === 'super_admin' || roles.includes('admin') || roles.includes('sub_admin');
          setIsAdmin(isAdm);
          setIsSubAdmin(data.roles?.includes('sub_admin'));

          if (data.access_token && data.refresh_token) {
            try {
              const currentSession = await supabase.auth.getSession();
              const existing = currentSession.data.session;
              if (!existing || existing.access_token !== data.access_token) {
                isSettingSessionRef.current = true;
                await supabase.auth.setSession({
                  access_token: data.access_token,
                  refresh_token: data.refresh_token,
                });
                setTimeout(() => { isSettingSessionRef.current = false; }, 500);
              }
            } catch (_) {
              isSettingSessionRef.current = false;
            }
          }

          setLoading(false);
          clearTimeout(loadingSafetyTimer);
          return;
        }

        // Fallback to Supabase SDK
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
           await syncSessionToBFF(session);
           await refreshProfile();
        }
      } catch (err) {
        console.warn("Auth init timeout or fallback:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(loadingSafetyTimer);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Re-entrancy guard: skip duplicate handling triggered by internal setSession calls
      if (isSettingSessionRef.current) {
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session) {
        syncSessionToBFF(session);
        if (event === 'SIGNED_IN') {
          // Device log single execution guard per session
          if (hasLoggedDeviceRef.current !== session.user.id) {
            hasLoggedDeviceRef.current = session.user.id;
            saveDeviceLog(session.user.id).catch(() => {});
          }
          refreshProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        hasLoggedDeviceRef.current = null;
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsSubAdmin(false);
        userRef.current = null;
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadingSafetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    hasLoggedDeviceRef.current = null;
    lastSyncedToken.current = null;
    sessionStorage.removeItem('bff_synced');
    await supabase.auth.signOut();
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsSubAdmin(false);
    userRef.current = null;
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isSubAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
