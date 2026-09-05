import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BlockedDeviceScreen from "@/components/BlockedDeviceScreen";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] animate-pulse">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (profile?.is_blocked) return <BlockedDeviceScreen />;

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default RequireAuth;
