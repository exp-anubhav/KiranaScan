import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected rendering error' };
  }

  handleRecover = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      localStorage.removeItem('kiranascan_active_merchant_id');
      sessionStorage.clear();
    } catch { /* ignore */ }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#090B0F',
          color: '#FFFFFF',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
          <div style={{
            maxWidth: '380px',
            width: '100%',
            background: '#12151C',
            borderRadius: '24px',
            padding: '28px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(200, 245, 59, 0.12)',
              border: '1px solid rgba(200, 245, 59, 0.25)',
              color: '#C8F53B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontWeight: 800,
              fontSize: '18px'
            }}>
              ⚡
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              KiranaScan Update Needed
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#94A3B8', lineHeight: 1.5 }}>
              {this.state.message}
            </p>
            <button
              onClick={this.handleRecover}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '9999px',
                border: 'none',
                background: '#C8F53B',
                color: '#111315',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              Refresh &amp; Load Latest App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register Service Worker for offline PWA support and clean up legacy caches
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
