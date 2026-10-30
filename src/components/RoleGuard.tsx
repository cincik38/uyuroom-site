import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { homeForRole, verifyAdminSession, OtaRole, OtaSession } from '@/lib/ota';

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
    verifyAdminSession().then((verified) => setSession(verified));
    // Başka sekmede çıkış yapılırsa bu sekme de sunucudan yeniden doğrular
    const recheck = () => {
      verifyAdminSession().then((verified) => setSession(verified));
    };
    window.addEventListener('storage', recheck);
    return () => window.removeEventListener('storage', recheck);
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
