import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState, useEffect } from 'react';

function PwaUpdatePrompt() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
      if (r) setRegistration(r);
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

  // Aggressive Update Check Logic
  useEffect(() => {
    if (!registration) return;

    const updateSW = () => {
      console.log('Checking for PWA updates...');
      registration.update().catch(err => console.error('Failed to update SW:', err));
    };

    // Check every 60 mins (to be safe, user requested aggressive but 15m might be too much for server/logging, sticking to reasonable interval or user's 15m? User approved 15m. Let's do 15m.)
    // Wait, user text said "15 mins". I will use 15 mins.
    const interval = setInterval(updateSW, 15 * 60 * 1000);

    // Check when app comes back to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateSW();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [registration]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (offlineReady || needRefresh) {
    return (
      <div className="fixed right-4 bottom-4 z-50 p-4 rounded-lg shadow-lg bg-white border border-gray-200">
        <div className="mb-2 font-semibold">
          {offlineReady ? '應用程式已可離線使用' : '有可用的新內容'}
        </div>
        {needRefresh && (
          <button onClick={() => updateServiceWorker(true)} className="px-4 py-2 text-sm font-bold text-white bg-pink-500 rounded-md hover:bg-pink-600">
            更新
          </button>
        )}
        <button onClick={close} className="px-4 py-2 text-sm font-medium text-gray-700 ml-2">關閉</button>
      </div>
    );
  }

  return null;
}

export default PwaUpdatePrompt;