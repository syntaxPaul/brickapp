import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { configureHttp } from './lib/http';
import { registerServiceWorker } from './lib/registerServiceWorker';

// Install auth headers, silent retry and outage handling on the global axios
// instance before any component can fire a request.
configureHttp();

// No session? The login screen is what renders next - start fetching it now
// rather than waiting for React to reach the lazy boundary.
if (!localStorage.getItem('token')) {
  import('./pages/Login').catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registered after render so it never competes with first paint.
registerServiceWorker();
