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
    const getBase = () => {
      if (window.location.pathname.includes('/SPLIT-DIVISOR-DE-CONTAS/')) {
        return '/SPLIT-DIVISOR-DE-CONTAS/';
      }
      return '/';
    };
    const cleanBase = getBase();
    navigator.serviceWorker.register(`${cleanBase}sw.js`)
      .then((reg) => {
        console.log('PWA Service Worker registered successfully scope:', reg.scope);
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
      });
  });
}
