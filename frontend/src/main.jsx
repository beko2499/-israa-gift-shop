import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TonConnectUIProvider
      manifestUrl={`${window.location.origin}/israa-manifest.json`}
      language="en"
    >
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
);
