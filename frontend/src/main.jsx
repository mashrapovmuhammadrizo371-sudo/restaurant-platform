import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import globalStyles from './styles/global.css?inline';
import { AuthProvider } from './context/AuthContext.jsx';
import { CustomerAuthProvider } from './context/CustomerAuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';

// Inject the global stylesheet directly into the app bundle.
// This keeps the UI styled even when a static-host CSS asset is stale or fails to load.
if (typeof document !== 'undefined' && !document.getElementById('restaurant-global-styles')) {
  const style = document.createElement('style');
  style.id = 'restaurant-global-styles';
  style.textContent = globalStyles;
  document.head.appendChild(style);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CustomerAuthProvider>
          <LanguageProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </LanguageProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
