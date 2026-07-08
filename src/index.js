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
