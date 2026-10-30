import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';
import { getSession, homeForRole, loginWithCredentials } from '@/lib/ota';
import { toast } from 'sonner';

interface OtaLoginProps {
  /** admin: /yonetim süper admin girişi, partner: /tesis extranet girişi */
  mode?: 'admin' | 'partner';
}

/** Süper admin (/yonetim) ve tesis partneri (/tesis) giriş ekranı. */
export const OtaLogin: React.FC<OtaLoginProps> = ({ mode = 'admin' }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getSession();
    if (session) {
      navigate(homeForRole(session.role), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('E-posta ve şifre zorunludur.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await loginWithCredentials(email, password);
    setLoading(false);

    if (!result.ok || !result.session) {
      setError(result.error || 'Giriş başarısız.');
      return;
    }

    toast.success('Giriş başarılı. Hoş geldiniz!');
    const home = homeForRole(result.session.role);
    const target = next.startsWith('/yonetim') && (result.session.role !== 'reklam' || (next.startsWith('/yonetim/takip') || next.startsWith('/yonetim/reklam'))) ? next : home;
    navigate(target, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Siteye dön
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <BrandLogo size={64} tagline="Yönetim Girişi" className="justify-center" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl backdrop-blur"
          >
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-black text-white">
                Yönetim Paneli Girişi
              </h1>
              <p className="text-xs text-slate-400">
                Yönetici hesabınızla giriş yapın.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                E-posta
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta"
                  autoComplete="username"
                  className="w-full h-12 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-12 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-300 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-base"
            >
              {loading ? (
                'Giriş yapılıyor...'
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" /> Giriş Yap
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-start gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Bu alan yalnızca otel yönetimi içindir. Odalar, fiyatlar, takvim ve rezervasyonlar buradan yönetilir.
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtaLogin;
