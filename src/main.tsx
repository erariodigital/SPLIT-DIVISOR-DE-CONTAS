import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register PWA Service Worker for mobile installability and icon resolution
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // @ts-ignore
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    navigator.serviceWorker.register(`${cleanBase}sw.js`)
      .then((reg) => {
        console.log('PWA Service Worker registered successfully scope:', reg.scope);
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
      });
  });
}
