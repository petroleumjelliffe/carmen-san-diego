import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show prompt after 30 seconds or first case completion
      setTimeout(() => setShowPrompt(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Re-show after 7 days
    setTimeout(() => setShowPrompt(true), 7 * 24 * 60 * 60 * 1000);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md">
      <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-lg shadow-xl p-4 flex items-center gap-3 border border-yellow-500">
        <Download size={24} className="text-yellow-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold mb-1">Install Carmen San Diego</p>
          <p className="text-sm text-gray-300">
            Install this app for quick access and offline play
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-yellow-500 text-gray-900 rounded font-bold text-sm hover:bg-yellow-400"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
