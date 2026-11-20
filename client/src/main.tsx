import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/css/globals.css';
import App from './App.tsx';
import Loading from './components/shadcn-dashboard/spinner/loading';

import { ThemeProvider } from './context/shadcntheme/ThemeContext.tsx';
import { CustomizerProvider } from './context/CustomizerContext.tsx';
import './i18n';

// 一次性清理：旧版本注册过 MSW 的 mockServiceWorker，脚本文件已删除但 SW 仍驻留，
// 会持续报 "Failed to fetch @ mockServiceWorker.js"。启动时卸载它并清掉相关缓存。
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      const url = registration.active?.scriptURL ?? registration.installing?.scriptURL ?? '';
      if (url.includes('mockServiceWorker')) void registration.unregister();
    }
  });
  if ('caches' in window) {
    void caches.keys().then((keys) => {
      for (const key of keys) if (key.toLowerCase().includes('msw')) void caches.delete(key);
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="light" storageKey="theme">
    <CustomizerProvider>
      <Suspense fallback={<Loading fullScreen />}>
        <App />
      </Suspense>
    </CustomizerProvider>
  </ThemeProvider>,
);
