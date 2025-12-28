import { Search, Plane, FileText } from 'lucide-react';

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 min-h-[56px] font-bold transition-all ${
        active
          ? 'bg-yellow-400 text-red-900 sm:border-b-4 sm:border-yellow-600'
          : 'bg-red-800 text-yellow-100 hover:bg-red-700 active:bg-red-600'
      }`}
    >
      <Icon size={20} />
      <span className="text-xs sm:text-base">{label}</span>
    </button>
  );
}

export function TabBar({ activeTab, setActiveTab }) {
  return (
    <>
      {/* Mobile: Fixed bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t-2 border-yellow-400 bg-red-900">
        <div className="flex">
          <TabButton
            active={activeTab === 'investigate'}
            onClick={() => setActiveTab('investigate')}
            icon={Search}
            label="Investigate"
          />
          <TabButton
            active={activeTab === 'airport'}
            onClick={() => setActiveTab('airport')}
            icon={Plane}
            label="Airport"
          />
          <TabButton
            active={activeTab === 'dossier'}
            onClick={() => setActiveTab('dossier')}
            icon={FileText}
            label="Dossier"
          />
        </div>
      </div>

      {/* Desktop: Inline tabs */}
      <div className="hidden sm:block max-w-4xl mx-auto">
        <div className="flex">
          <TabButton
            active={activeTab === 'investigate'}
            onClick={() => setActiveTab('investigate')}
            icon={Search}
            label="Investigate"
          />
          <TabButton
            active={activeTab === 'airport'}
            onClick={() => setActiveTab('airport')}
            icon={Plane}
            label="Airport"
          />
          <TabButton
            active={activeTab === 'dossier'}
            onClick={() => setActiveTab('dossier')}
            icon={FileText}
            label="Dossier"
          />
        </div>
      </div>
    </>
  );
}

export default TabBar;
