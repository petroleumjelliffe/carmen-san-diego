import { useRegisterSW } from 'virtual:pwa-register/react';
import { X, RefreshCw } from 'lucide-react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
        <RefreshCw size={20} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold mb-1">Update Available</h3>
          <p className="text-sm text-blue-100 mb-3">
            A new version is available. Reload to update.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 bg-white text-blue-600 rounded font-semibold text-sm hover:bg-blue-50"
            >
              Reload Now
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-3 py-1.5 bg-blue-700 text-white rounded text-sm hover:bg-blue-800"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-blue-200 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
