import { Search, Plane, FileText } from 'lucide-react';

const TABS = [
  { id: 'investigate', icon: Search, label: 'Investigate' },
  { id: 'airport', icon: Plane, label: 'Airport' },
  { id: 'dossier', icon: FileText, label: 'Dossier' },
];

// Mobile bottom nav button
function MobileTabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 min-h-[56px] font-bold transition-all ${
        active
          ? 'bg-yellow-400 text-red-900'
          : 'bg-red-800 text-yellow-100 hover:bg-red-700 active:bg-red-600'
      }`}
    >
      <Icon size={20} />
      <span className="text-xs">{label}</span>
    </button>
  );
}

// Desktop sidebar button
function SidebarTabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-4 text-left font-bold transition-all w-full ${
        active
          ? 'bg-yellow-400 text-red-900'
          : 'text-yellow-100 hover:bg-red-800/50'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

export function TabBar({ activeTab, setActiveTab, variant = 'auto' }) {
  // Sidebar variant - desktop only (md and up)
  if (variant === 'sidebar') {
    return (
      <div className="hidden md:flex flex-col w-60 flex-shrink-0 bg-red-900/50 border-r border-yellow-400/30">
        {TABS.map(tab => (
          <SidebarTabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </div>
    );
  }

  // Mobile variant - mobile only (< md)
  if (variant === 'mobile') {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t-2 border-yellow-400 bg-red-900">
        <div className="flex">
          {TABS.map(tab => (
            <MobileTabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>
      </div>
    );
  }

  // Auto variant (legacy) - shows both based on breakpoint
  return (
    <>
      {/* Mobile: Fixed bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t-2 border-yellow-400 bg-red-900">
        <div className="flex">
          {TABS.map(tab => (
            <MobileTabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Inline tabs (old style) */}
      <div className="hidden md:block max-w-6xl mx-auto">
        <div className="flex">
          {TABS.map(tab => (
            <MobileTabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default TabBar;
