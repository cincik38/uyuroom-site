import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Tek bir bileşen hatasının tüm sayfayı beyaz bırakmasını engeller;
 * kullanıcıya anlaşılır bir hata ekranı ve yeniden deneme seçeneği sunar.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Uygulama hatası:', error, info.componentStack);
  }

  handleReload = (): void => {
    this.setState({ error: null });
    window.location.reload();
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">Bir sorun oluştu</h1>
          <p className="mt-3 text-sm text-slate-600">
            Sayfa görüntülenirken beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenileyin.
          </p>
          <p className="mt-3 text-xs text-slate-400 break-words">{error.message}</p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 min-h-[44px] w-full rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Sayfayı Yenile
          </button>
          <a
            href="/"
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
