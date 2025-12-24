import { AlertTriangle } from 'lucide-react';

export function Cutscene({ text, onDismiss }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl text-center">
        <div className="text-6xl mb-6">
          <AlertTriangle className="inline text-red-500" size={80} />
        </div>
        <h2 className="text-3xl font-bold text-red-500 mb-6">ASSASSINATION ATTEMPT!</h2>
        <p className="text-xl text-gray-200 mb-8 leading-relaxed">{text}</p>
        <p className="text-yellow-400 mb-8">You're on the right track - the syndicate wants you stopped!</p>
        <button
          onClick={onDismiss}
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-xl px-8 py-3 rounded-lg transition-all"
        >
          CONTINUE INVESTIGATION
        </button>
      </div>
    </div>
  );
}

export default Cutscene;
