import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession, homeForRole, verifyAdminSession, OtaRole, OtaSession } from '@/lib/ota';

interface RoleGuardProps {
  allow: OtaRole[];
  children: React.ReactNode;
}

/**
 * Rol bazlı rota koruması. Oturum yoksa /giris sayfasına yönlendirir.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allow, children }) => {
  const location = useLocation();
  const [session, setSession] = useState<OtaSession | null | undefined>(undefined);

  useEffect(() => {
    verifyAdminSession().then((ok) => setSession(ok ? getSession() : null));
    const sync = () => setSession(getSession());
    window.addEventListener('uyuroom-session-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('uyuroom-session-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={`/giris?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!allow.includes(session.role)) {
    const fallback = session.role === 'reklam' ? homeForRole('reklam') : '/';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
