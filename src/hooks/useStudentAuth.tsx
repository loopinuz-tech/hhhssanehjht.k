import { useAuth } from './useAuth';

export const useStudentAuth = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  
  return {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
    displayName: profile?.display_name || user?.email?.split('@')[0] || 'O\'quvchi',
    studentId: user?.id
  };
};
