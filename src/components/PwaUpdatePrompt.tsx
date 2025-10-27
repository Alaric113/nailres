import { useRegisterSW } from 'virtual:pwa-register/react';

function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

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