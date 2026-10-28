import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Önceden oluşturulmuş (prerender) blog sayfaları saf statik HTML olarak sunulur.
if (
  document.querySelector('meta[name="prerender-static-page"]')?.getAttribute('content') !== 'blog'
) {
  createRoot(document.getElementById('root')!).render(<App />);
}
