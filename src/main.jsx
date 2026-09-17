import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 古いサービスワーカーのキャッシュを一掃する（新しい sw.js が activate 時に自己解除）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/aboutus-sales/sw.js').catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
