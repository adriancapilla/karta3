import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PrivacyScreen } from './PrivacyScreen';
import './style.css';
import './appearance.css';
import { initializeAppearance, appearanceStorageChanged } from './appearance';

initializeAppearance();
window.addEventListener('storage', appearanceStorageChanged);

let information = false;
try { information = /^\/privacidad\/?$/i.test(decodeURIComponent(window.location.pathname)); } catch { /* URL inválida no se trata como información. */ }

createRoot(document.getElementById('root')!).render(<React.StrictMode>{information ? <PrivacyScreen /> : <App />}</React.StrictMode>);
