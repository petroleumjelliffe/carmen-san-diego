import { Clock, Zap, AlertTriangle, Heart, X } from 'lucide-react';

function ClueButton({ spot, onInvestigate, disabled, investigated, index }) {
  return (
    <button
      onClick={() => onInvestigate(index)}
      disabled={disabled || investigated}
      className={`w-full p-4 text-left rounded-lg transition-all ${
        investigated
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
          : disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-red-900 hover:bg-red-800 text-yellow-100 cursor-pointer'
      }`}
    >
      <div className="flex justify-between items-center">
        <span>{investigated ? `✓ ${spot.name}` : spot.name}</span>
        <span className="flex items-center gap-1 text-sm">
          <Clock size={14} />
          {spot.time_cost}h
        </span>
      </div>
    </button>
  );
}

function RogueActionButton({ rogueAction, onRogueAction, disabled, used }) {
  const ROGUE_TIME_COST = 2; // Fixed 2h - fastest option

  return (
    <button
      onClick={() => onRogueAction(rogueAction)}
      disabled={disabled || used}
      className={`w-full p-4 text-left rounded-lg transition-all border-2 ${
        used
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
          : disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700'
          : 'bg-orange-900 hover:bg-orange-800 text-yellow-100 cursor-pointer border-orange-500'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-orange-400" />
          <span className="font-bold">{used ? `✓ ${rogueAction.name}` : rogueAction.name}</span>
          <span className="text-xs text-green-300">⚡ Get BOTH clues!</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            {ROGUE_TIME_COST}h
          </div>
          <div className="flex items-center gap-1 text-xs text-red-300">
            <AlertTriangle size={12} />
            +{rogueAction.notoriety_gain}
          </div>
        </div>
      </div>
    </button>
  );
}

export function InvestigateTab({
  isFinalCity,
  wrongCity,
  cityClues,
  investigatedLocations,
  timeRemaining,
  collectedClues,
  lastFoundClue,
  lastRogueAction,
  lastGoodDeedResult,
  lastSleepResult,
  rogueUsedInCity,
  currentGoodDeed,
  karma,
  onInvestigate,
  rogueActions,
  onRogueAction,
  onGoodDeedChoice,
  notoriety,
}) {
  if (!cityClues) return null;

  const ROGUE_TIME_COST = 2;

  // Pick any rogue action (just use first one for now)
  const availableRogueAction = rogueActions && rogueActions.length > 0 ? rogueActions[0] : null;

  // Check if we have any results to display
  const hasResults = lastFoundClue?.city || lastGoodDeedResult || lastSleepResult;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-yellow-400 mb-2">
        {isFinalCity && !wrongCity
          ? "FINAL DESTINATION - Issue Warrant to Capture!"
          : wrongCity
          ? "Dead End - Wrong Location"
          : "Gather Intel"}
      </h2>

      {!isFinalCity && !wrongCity && (
        <div className="text-sm text-yellow-200/70 mb-4">
          Suspect clues collected: {collectedClues.suspect.length} / 3
          {collectedClues.suspect.length < 3 && " (check the Local Informant for suspect info)"}
        </div>
      )}

      {/* Good Deed Encounter - Appears inline */}
      {currentGoodDeed && onGoodDeedChoice && (
        <div className="bg-blue-900/50 border-2 border-blue-400 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            {currentGoodDeed.isFake ? (
              <AlertTriangle size={24} className="text-red-400" />
            ) : (
              <Heart size={24} className="text-yellow-400" />
            )}
            <h3 className="text-xl font-bold text-yellow-400">
              {currentGoodDeed.isFake ? '❗ URGENT SITUATION' : '💡 GOOD DEED OPPORTUNITY'}
            </h3>
          </div>

          <div className="bg-black bg-opacity-40 p-3 rounded mb-3">
            <p className="text-yellow-100 mb-2">{currentGoodDeed.description}</p>
            {currentGoodDeed.plea && (
              <p className="text-yellow-300 italic border-l-4 border-yellow-500 pl-3">
                "{currentGoodDeed.plea}"
              </p>
            )}
          </div>

          {/* Paranoia warning */}
          {karma >= 1 && !currentGoodDeed.isFake && (
            <div className="bg-red-800/50 border border-red-400 p-2 rounded mb-3">
              <p className="text-red-200 text-sm flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>Is this one real? Or another trap? You can't tell...</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onGoodDeedChoice(true)}
              disabled={timeRemaining < (currentGoodDeed.time_cost || 3)}
              className="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all flex flex-col items-center gap-1"
            >
              <Heart size={20} />
              <span>HELP</span>
              <span className="text-xs">Costs {currentGoodDeed.time_cost || 3}h, +1 karma</span>
            </button>

            <button
              onClick={() => onGoodDeedChoice(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all flex flex-col items-center gap-1"
            >
              <X size={20} />
              <span>KEEP MOVING</span>
              <span className="text-xs">No time to spare</span>
            </button>
          </div>
        </div>
      )}

      {wrongCity && (
        <div className="bg-red-800/50 p-4 rounded-lg text-center mb-4">
          <p className="text-yellow-200/70">
            The trail seems cold here... but you can still ask around.
          </p>
        </div>
      )}

      {/* Results Area - Shows investigation results, good deed outcomes, etc. */}
      {hasResults && (
        <div className="bg-red-950/50 p-4 rounded-lg border border-yellow-400/30 mb-6">
          <h3 className="text-yellow-400 font-bold mb-3">Latest Activity:</h3>

          {/* Good Deed Result */}
          {lastGoodDeedResult && (
            <div className={`border p-3 rounded mb-3 ${
              lastGoodDeedResult.isTrap
                ? 'bg-red-900/50 border-red-400'
                : 'bg-blue-900/50 border-blue-400'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {lastGoodDeedResult.isTrap ? (
                  <AlertTriangle size={16} className="text-red-400" />
                ) : (
                  '❤️'
                )}
                <p className={`font-bold ${
                  lastGoodDeedResult.isTrap ? 'text-red-300' : 'text-blue-300'
                }`}>
                  {lastGoodDeedResult.title}
                </p>
              </div>
              <p className={`text-sm ${
                lastGoodDeedResult.isTrap ? 'text-red-200' : 'text-blue-200'
              }`}>
                {lastGoodDeedResult.message}
              </p>
            </div>
          )}

          {/* Sleep Result */}
          {lastSleepResult && (
            <div className="bg-blue-900/50 border border-blue-400 p-3 rounded mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💤</span>
                <p className="text-blue-300 font-bold">Rest Period</p>
              </div>
              <p className="text-blue-200 text-sm">{lastSleepResult.message}</p>
            </div>
          )}

          {/* Rogue Action Result */}
          {lastRogueAction && !lastGoodDeedResult && (
            <div className="bg-orange-900/50 border border-orange-500 p-3 rounded mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-orange-400" />
                <p className="text-orange-300 font-bold">{lastRogueAction.name}</p>
              </div>
              <p className="text-orange-200 text-sm italic">
                {lastRogueAction.success_text}
              </p>
              <p className="text-red-300 text-xs mt-2">
                <AlertTriangle size={12} className="inline mr-1" />
                Notoriety increased by {lastRogueAction.notoriety_gain}
              </p>
            </div>
          )}

          {/* Investigation Results */}
          {lastFoundClue?.city && (
            <>
              <p className="text-yellow-100 mb-3">
                {String.fromCodePoint(0x1F4CD)} {lastFoundClue.city}
              </p>
              {lastFoundClue.suspect && (
                <div className="bg-green-900/50 border border-green-500 p-3 rounded">
                  <p className="text-green-400 font-bold">
                    {String.fromCodePoint(0x1F50D)} SUSPECT DESCRIPTION FOUND!
                  </p>
                  <p className="text-green-300 mt-1">
                    {lastFoundClue.suspect}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Investigation Spots - Normal 3 options */}
      {cityClues.map((clue, i) => {
        const investigated = investigatedLocations.includes(clue.spot.id);

        return (
          <ClueButton
            key={clue.spot.id}
            spot={clue.spot}
            index={i}
            onInvestigate={onInvestigate}
            disabled={timeRemaining < clue.spot.time_cost}
            investigated={investigated}
          />
        );
      })}

      {/* Rogue Cop Tactic - 4th option */}
      {availableRogueAction && onRogueAction && (
        <RogueActionButton
          rogueAction={availableRogueAction}
          onRogueAction={onRogueAction}
          disabled={timeRemaining < ROGUE_TIME_COST}
          used={rogueUsedInCity}
        />
      )}
    </div>
  );
}

export default InvestigateTab;
