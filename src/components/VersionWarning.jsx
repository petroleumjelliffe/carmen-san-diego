import { AlertTriangle, X } from 'lucide-react';

export function VersionWarning({ onDismiss }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md">
      <div className="bg-orange-600 text-white rounded-lg shadow-xl p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold mb-1">Save Data Updated</h3>
          <p className="text-sm text-orange-100">
            Your profile was preserved, but your in-progress case was cleared due to a game update.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-orange-200 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
