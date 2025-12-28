/**
 * GameLayout - Mobile-first 3-panel layout
 * Top: Location + Time (sticky)
 * Main: Scrollable content
 * Bottom: Navigation buttons (sticky)
 */
export function GameLayout({ children, topPanel, bottomPanel, className = '' }) {
  return (
    <div className="h-screen bg-gradient-to-b from-red-900 to-red-950 flex flex-col overflow-hidden">
      {/* Top Panel - Sticky */}
      {topPanel && (
        <div className="flex-shrink-0 bg-black bg-opacity-40 border-b-2 border-yellow-500 px-4 py-3">
          {topPanel}
        </div>
      )}

      {/* Main Content Area - Scrollable grid for bottom-aligned children */}
      <div className={`flex-1 overflow-y-auto p-4 grid ${className}`} style={{ gridTemplateRows: '1fr', alignItems: 'end' }}>
        {children}
      </div>

      {/* Bottom Navigation - Sticky */}
      {bottomPanel && (
        <div className="flex-shrink-0 bg-black bg-opacity-40 border-t-2 border-yellow-500 p-4">
          {bottomPanel}
        </div>
      )}
    </div>
  );
}
