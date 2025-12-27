/**
 * GameLayout - Mobile-first 3-panel layout
 * Top: Location + Time
 * Main: Scrollable content
 * Bottom: Navigation buttons
 */
export function GameLayout({ children, topPanel, bottomPanel, className = '' }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 flex flex-col">
      {/* Top Panel - Fixed */}
      {topPanel && (
        <div className="bg-black bg-opacity-40 border-b-2 border-yellow-500 px-4 py-3">
          {topPanel}
        </div>
      )}

      {/* Main Content Area - Scrollable */}
      <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
        {children}
      </div>

      {/* Bottom Navigation - Fixed */}
      {bottomPanel && (
        <div className="bg-black bg-opacity-40 border-t-2 border-yellow-500 p-4">
          {bottomPanel}
        </div>
      )}
    </div>
  );
}
