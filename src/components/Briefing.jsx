import { GameLayout } from './GameLayout';
import { TopPanel } from './TopPanel';
import { FileText, MapPin, Clock, Shield, Briefcase } from 'lucide-react';
import { useMemo, useState } from 'react';

// Classified stamp decoration
function ClassifiedStamp() {
  return (
    <div
      className="absolute -top-2 -right-2 transform rotate-12 z-10"
      style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}
    >
      <div className="bg-red-600 text-white px-4 py-1 font-bold text-sm border-2 border-red-800"
        style={{ fontFamily: 'monospace' }}>
        CLASSIFIED
      </div>
    </div>
  );
}

// Paper clip decoration
function PaperClip() {
  return (
    <div className="absolute -top-3 left-8 w-6 h-10 z-10">
      <div className="w-full h-full border-4 border-gray-400 rounded-full"
        style={{
          clipPath: 'polygon(0 30%, 100% 30%, 100% 100%, 0 100%)',
          boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
}

// Section with typewriter styling
function CaseSection({ icon: Icon, label, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-gray-600" />
        <span className="text-xs font-bold text-gray-500 tracking-wider">{label}</span>
      </div>
      <div className="text-gray-800 pl-6" style={{ fontFamily: 'Georgia, serif' }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Briefing - Shows case details and mission equipment at start of case
 */
export function Briefing({ currentCase, startingCity, settings, onAccept }) {
  const [isSigned, setIsSigned] = useState(false);

  if (!currentCase) return null;

  // Generate stable case number from case data
  const caseNumber = useMemo(() => {
    const hash = (currentCase.stolenItem?.name || 'case').split('').reduce(
      (acc, char) => acc + char.charCodeAt(0), 0
    );
    return 1000 + (hash % 9000);
  }, [currentCase.stolenItem?.name]);

  // Calculate deadline (current date + total hours)
  const deadline = useMemo(() => {
    const now = new Date();
    const deadlineDate = new Date(now.getTime() + settings.total_time * 60 * 60 * 1000);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[deadlineDate.getDay()];
    const hours = deadlineDate.getHours();
    const minutes = deadlineDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${dayName}, ${displayHours}:${minutes} ${ampm}`;
  }, [settings.total_time]);

  return (
    <GameLayout
      topPanel={<TopPanel location="ACME HQ" timeRemaining={settings.total_time} />}
      bottomPanel={
        <button
          onClick={onAccept}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-6 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          ACCEPT MISSION
        </button>
      }
    >
      {/* Manila folder container */}
      <div className="max-w-2xl mx-auto">
        {/* Folder tab */}
        <div className="flex justify-start ml-8">
          <div
            className="px-6 py-2 rounded-t-lg text-sm font-bold"
            style={{
              background: 'linear-gradient(180deg, #d4a574 0%, #c4956a 100%)',
              fontFamily: 'monospace'
            }}
          >
            CASE #{caseNumber}
          </div>
        </div>

        {/* Main folder body */}
        <div
          className="relative rounded-lg rounded-tl-none p-6 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #e8d5b7 0%, #d4c4a8 50%, #e0d0b5 100%)',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 8px 16px rgba(0,0,0,0.2)',
          }}
        >
          <ClassifiedStamp />
          <PaperClip />

          {/* Inner document */}
          <div
            className="bg-white p-6 shadow-md relative"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  transparent,
                  transparent 27px,
                  #e0e0e0 28px
                )
              `,
              backgroundPosition: '0 20px',
            }}
          >
            {/* Header */}
            <div className="border-b-2 border-gray-300 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-700 p-2 rounded">
                  <FileText size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                    INTERPOL CASE FILE
                  </h1>
                  <p className="text-xs text-gray-500 font-mono">REF: ACME-{caseNumber}-INT</p>
                </div>
              </div>
            </div>

            {/* Case Details */}
            <CaseSection icon={Briefcase} label="STOLEN ARTIFACT">
              <p className="text-lg font-semibold">{currentCase.stolenItem?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600 italic">Value: Priceless</p>
            </CaseSection>

            <CaseSection icon={MapPin} label="LAST KNOWN LOCATION">
              <p className="text-lg">{startingCity ? `${startingCity.name}, ${startingCity.country}` : 'Unknown'}</p>
            </CaseSection>

            <CaseSection icon={Clock} label="MISSION DEADLINE">
              <p className="text-lg">{deadline}</p>
              <p className="text-sm text-gray-600">Time allocated: {settings.total_time} hours</p>
            </CaseSection>

            {/* Intel Brief */}
            <div className="bg-gray-100 p-4 rounded mt-4 border-l-4 border-red-600">
              <p className="text-sm text-gray-700 italic leading-relaxed">
                "The infamous Shadow Syndicate has struck again. Intelligence suggests
                they're moving the stolen goods through multiple cities. Track them down
                before time runs out."
              </p>
              <p className="text-xs text-gray-500 mt-2 text-right">— Chief Inspector</p>
            </div>

            {/* Equipment Checklist */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-gray-600" />
                <span className="text-xs font-bold text-gray-500 tracking-wider">ISSUED EQUIPMENT</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-6">
                {[
                  { icon: '💨', name: 'Smoke Bomb', desc: 'Quick escapes' },
                  { icon: '👓', name: 'X-Ray Glasses', desc: 'See hidden' },
                  { icon: '📱', name: 'Shoe Phone', desc: 'Call backup' },
                  { icon: '⚡', name: 'Laser Watch', desc: 'Precision cut' },
                  { icon: '🎯', name: 'Grappling Hook', desc: 'Scale walls' },
                  { icon: '💊', name: 'Antidote Pills', desc: 'Counter poison' },
                ].map((gadget, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-base">{gadget.icon}</span>
                    <span className="text-gray-800 font-medium">{gadget.name}</span>
                    <span className="text-gray-500 text-xs">— {gadget.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-3 pl-6 font-medium">
                * Single-use items. Deploy strategically.
              </p>
            </div>

            {/* Signature line - DocuSign style */}
            <div className="mt-6 pt-4 border-t border-gray-300 flex justify-between items-end">
              <div>
                {isSigned ? (
                  <div className="relative">
                    <div
                      className="text-2xl text-blue-900 px-2"
                      style={{
                        fontFamily: 'Brush Script MT, Segoe Script, cursive',
                        transform: 'rotate(-2deg)',
                      }}
                    >
                      Detective Gumshoe
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-green-600 font-medium">Signed via DocuSign™</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSigned(true)}
                    className="group relative cursor-pointer"
                  >
                    <div className="w-40 h-10 bg-yellow-200 border-2 border-yellow-400 rounded flex items-center justify-center gap-2 transition-all group-hover:bg-yellow-300 group-hover:scale-105">
                      <span className="text-yellow-700 text-xs font-bold">SIGN HERE</span>
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-1 left-0 right-0 flex justify-center">
                      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400"></div>
                    </div>
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-2">Agent Signature</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Date Issued</p>
                <p className="text-sm font-mono text-gray-600">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
