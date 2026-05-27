
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove o page-loader após o React pintar o primeiro frame
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    document.getElementById('page-loader')?.remove();
  })
);
