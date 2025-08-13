import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

if (import.meta.env.DEV) {
  window.addEventListener('error', (e) => {
    console.error('Global error:', (e as ErrorEvent).error || (e as ErrorEvent).message || e);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', (e as PromiseRejectionEvent).reason);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
