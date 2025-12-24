import { Search, Plane, FileText } from 'lucide-react';

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 font-bold transition-all ${
        active
          ? 'bg-yellow-400 text-red-900 border-b-4 border-yellow-600'
          : 'bg-red-800 text-yellow-100 hover:bg-red-700'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );
}

export function TabBar({ activeTab, setActiveTab }) {
  return (
    <div className="max-w-4xl mx-auto">
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
  );
}

export default TabBar;
