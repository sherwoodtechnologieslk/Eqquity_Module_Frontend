import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/theme.css';
import './styles/theme-shell.css';
import './styles/theme-screens.css';
import App from './App';
import './styles/theme-dark-deep.css';
import reportWebVitals from './reportWebVitals';
import { initThemeFromStorage, ThemeProvider } from './context/ThemeContext';

initThemeFromStorage();

// Accept one-time auth handoff when Client Portal opens on the alternate
// localhost/127.0.0.1 host (used to bypass the installed PWA window).
(function consumeClientPortalHandoff() {
  try {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get('cpHandoff');
    if (!encoded) return;
    const data = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    if (data?.token) localStorage.setItem('token', data.token);
    if (data?.user) localStorage.setItem('user', data.user);
    if (data?.authSession) localStorage.setItem('authSession', data.authSession);
    url.searchParams.delete('cpHandoff');
    window.history.replaceState({}, '', url.toString());
  } catch {
    /* ignore bad handoff */
  }
})();

// Clear any leftover CRA / PWA service workers so the app stays in a normal
// browser tab instead of an installed “Create React App Sample” window.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
  if (window.caches && caches.keys) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
