import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Zap, Skull, Heart, AlertTriangle, Clock } from 'lucide-react';
import { useEncounterTimer } from '../hooks/useEncounterTimer';

// Profession emojis (base without skin tone)
const PROFESSION_EMOJIS = [
  '👨‍⚕️', '👨‍🎓', '👨‍🏫', '👨‍⚖️', '👨‍🌾', '👨‍🍳', '👨‍🔧', '👨‍🏭',
  '👨‍💼', '👨‍🔬', '👨‍💻', '👨‍🎤', '👨‍🎨', '👨‍✈️', '👨‍🚀', '👨‍🚒',
  '👮‍♂️', '🕵️‍♂️', '💂‍♂️', '👷‍♂️',
  '👩‍⚕️', '👩‍🎓', '👩‍🏫', '👩‍⚖️', '👩‍🌾', '👩‍🍳', '👩‍🔧', '👩‍🏭',
  '👩‍💼', '👩‍🔬', '👩‍💻', '👩‍🎤', '👩‍🎨', '👩‍✈️', '👩‍🚀', '👩‍🚒',
  '👮‍♀️', '🕵️‍♀️', '💂‍♀️', '👷‍♀️',
];

const SKIN_TONES = [
  '\u{1F3FB}', '\u{1F3FC}', '\u{1F3FD}', '\u{1F3FE}', '\u{1F3FF}',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getProfessionEmojiForText(text) {
  const hash = hashString(text);
  const professionIndex = hash % PROFESSION_EMOJIS.length;
  const baseEmoji = PROFESSION_EMOJIS[professionIndex];

  const skinToneIndex = Math.floor(hash / PROFESSION_EMOJIS.length) % SKIN_TONES.length;
  const skinTone = SKIN_TONES[skinToneIndex];

  return baseEmoji.replace(/(\u{1F468}|\u{1F469})/u, `$1${skinTone}`);
}

/**
 * Unified message display component for all message types:
 * - Witness clues (simple streaming quote)
 * - Henchman encounters (interactive with timer)
 * - Assassination encounters (interactive with timer)
 * - Good deed encounters (interactive with timer)
 * - Rogue actions (result display)
 * - Apprehension (special event)
 */
export function MessageDisplay({
  // Message type
  type,

  // Witness/person display
  personEmoji,
  quote,

  // Optional descriptive text (shown above witness section)
  descriptiveText,

  // Optional header (encounters/events only)
  headerTitle,
  headerIcon,

  // Optional setup (encounters only)
  setupText,

  // Optional timer (interactive encounters only)
  timerDuration,
  onTimeout,

  // Optional choices (interactive encounters only)
  choices = [],
  onChoice,

  // Optional warning
  warningText,

  // Result handling (encounters only)
  result,

  // Continue handler
  onContinue,

  // Behavioral flags
  autoStream = true,
}) {
  // Phase is determined by result presence for encounters
  // Witnesses are always in 'complete' phase
  const phase = type === 'witness' ? 'complete' : (result ? 'resolved' : 'active');

  // Streaming text state
  const [displayedText, setDisplayedText] = useState('');
  const [isStreamComplete, setIsStreamComplete] = useState(false);
  const intervalRef = useRef(null);
  const currentIndexRef = useRef(0);

  // Generate person emoji if not provided
  const finalPersonEmoji = useMemo(() => {
    return personEmoji || (quote ? getProfessionEmojiForText(quote) : '');
  }, [personEmoji, quote]);

  // Handle timeout for encounters
  const handleTimeout = useCallback(() => {
    if (phase !== 'active' || !onTimeout) return;
    onTimeout();
  }, [phase, onTimeout]);

  // Timer hook for encounters
  const { timeLeft, hasTimedOut, timerPercent, urgencyLevel } = useEncounterTimer(
    timerDuration || 0,
    handleTimeout,
    phase === 'active' && !!timerDuration
  );

  // Streaming text effect
  useEffect(() => {
    if (!quote || !autoStream) {
      setDisplayedText(quote || '');
      setIsStreamComplete(true);
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset state
    setDisplayedText('');
    setIsStreamComplete(false);
    currentIndexRef.current = 0;

    // Clean the text
    const cleanedText = quote
      .trim()
      .replace(/\bundefined\b/gi, '')
      .replace(/\bnull\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedText) return;

    const words = cleanedText.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return;

    intervalRef.current = setInterval(() => {
      const currentIndex = currentIndexRef.current;

      if (currentIndex < words.length) {
        const wordToAdd = words[currentIndex];
        if (wordToAdd !== undefined && wordToAdd !== null) {
          setDisplayedText(prev => prev + (prev ? ' ' : '') + wordToAdd);
        }
        currentIndexRef.current++;
      } else {
        setIsStreamComplete(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 150);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [quote, autoStream]);

  // Handle choice selection
  const handleChoiceClick = useCallback((choiceId) => {
    if (phase !== 'active' || hasTimedOut) return;
    if (onChoice) {
      onChoice(choiceId);
    }
  }, [phase, hasTimedOut, onChoice]);

  // Get header styling
  const headerConfig = getHeaderConfig(type, headerTitle, headerIcon);

  // Render simple witness clue (optionally with header for special events)
  if (type === 'witness') {
    return (
      <div className="space-y-2">
        {/* Optional header for special events like apprehension */}
        {headerConfig && (
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 border-l-4 border-yellow-500">
            <HeaderSection
              icon={headerConfig.icon}
              title={headerConfig.title}
              titleColor={headerConfig.titleColor}
            />
          </div>
        )}

        {/* Optional descriptive text above - shown as separate card */}
        {descriptiveText && (
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 border-l-4 border-yellow-500">
            <p className="text-yellow-100 text-lg leading-relaxed">
              {descriptiveText}
            </p>
          </div>
        )}
        <WitnessSection
          emoji={descriptiveText ? null : finalPersonEmoji}
          displayedText={displayedText}
          isComplete={isStreamComplete}
          borderColor="border-yellow-500"
          showQuotes={!descriptiveText}
        />

        {/* Optional continue button for special events */}
        {onContinue && (
          <div className="px-2">
            <button
              onClick={onContinue}
              className="w-full font-bold py-3 rounded transition-colors bg-gray-700 hover:bg-gray-600 text-white"
            >
              CONTINUE
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render encounter/event in active phase
  if (phase === 'active') {
    return (
      <div className={`space-y-2 ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`}>
        {/* Header Section */}
        {headerConfig && (
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 border-l-4 border-yellow-500">
            <HeaderSection
              icon={headerConfig.icon}
              title={headerConfig.title}
              titleColor={headerConfig.titleColor}
            />
          </div>
        )}

        {/* Timer Section */}
        {timerDuration && (
          <div className="px-2">
            <TimerSection
              timerPercent={timerPercent}
              urgencyLevel={urgencyLevel}
            />
          </div>
        )}

        {/* Setup Section */}
        {setupText && (
          <div className="text-yellow-200/70 text-sm px-2">
            {setupText}
          </div>
        )}

        {/* Warning */}
        {warningText && (
          <div className="bg-red-900/50 border-l-4 border-red-500 p-3 rounded-lg">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={14} />
              {warningText}
            </p>
          </div>
        )}

        {/* NOOOO animation for assassination */}
        {type === 'encounter_assassination' && timeLeft < 3 && (
          <div className="text-center">
            <p className="text-red-300 text-2xl font-bold animate-pulse">
              {timeLeft < 1 ? 'NOOOOOO!' : 'N...'}
            </p>
          </div>
        )}

        {/* Witness Section */}
        <WitnessSection
          emoji={type === 'encounter_henchman' || type === 'encounter_assassination' ? null : finalPersonEmoji}
          displayedText={displayedText}
          isComplete={isStreamComplete}
          borderColor="border-yellow-500"
          showQuotes={type !== 'encounter_henchman' && type !== 'encounter_assassination'}
        />

        {/* Choice Section */}
        {choices.length > 0 && (
          <div className="px-2">
            <ChoiceSection
              choices={choices}
              onChoice={handleChoiceClick}
              hasTimedOut={hasTimedOut}
              type={type}
            />
          </div>
        )}
      </div>
    );
  }

  // Render resolved phase with result
  if (phase === 'resolved' && result) {
    const resultBorderColor = result.type === 'success' ? 'border-green-500'
      : result.type === 'failure' ? 'border-red-500'
      : 'border-yellow-500';

    return (
      <div className="space-y-2">
        {/* Keep same header */}
        {headerConfig && (
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 border-l-4 border-yellow-500">
            <HeaderSection
              icon={headerConfig.icon}
              title={headerConfig.title}
              titleColor={headerConfig.titleColor}
            />
          </div>
        )}

        {/* Result in quote style - same as witness */}
        <div className={`flex items-start gap-4 p-6 bg-gray-900/95 backdrop-blur-sm rounded-lg border-l-4 ${resultBorderColor}`}>
          <div className="flex-shrink-0 text-7xl leading-none select-none">
            {finalPersonEmoji}
          </div>
          <div className="flex-1 pt-2">
            <p className="text-yellow-100 text-lg italic leading-relaxed">
              "{result.message}"
            </p>
          </div>
        </div>

        {/* Continue button */}
        <div className="px-2">
          <button
            onClick={onContinue}
            className="w-full font-bold py-3 rounded transition-colors bg-gray-700 hover:bg-gray-600 text-white"
          >
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Header Section Component
function HeaderSection({ icon, title, titleColor }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h3 className={`text-lg font-bold ${titleColor}`}>{title}</h3>
    </div>
  );
}

// Timer Section Component (fuse animation)
function TimerSection({ timerPercent, urgencyLevel }) {
  const timerColors = {
    critical: 'bg-red-500',
    warning: 'bg-orange-500',
    normal: 'bg-green-500',
  };

  return (
    <div className="relative h-1.5 bg-gray-700 rounded-full mb-4 overflow-hidden">
      <div
        className={`absolute right-0 h-full transition-all duration-100 ${timerColors[urgencyLevel]}`}
        style={{ width: `${timerPercent}%` }}
      />
      {/* Burning ember effect */}
      <div
        className="absolute h-full w-2 bg-yellow-300 blur-sm transition-all duration-100"
        style={{ left: `${100 - timerPercent}%` }}
      />
    </div>
  );
}

// Witness Section Component
function WitnessSection({ emoji, displayedText, isComplete, borderColor, showQuotes = true }) {
  return (
    <div className={`flex items-start gap-4 p-6 bg-gray-900/95 backdrop-blur-sm rounded-lg border-l-4 ${borderColor}`}>
      {/* Person emoji - large and prominent (optional) */}
      {emoji && (
        <div className="flex-shrink-0 text-7xl leading-none select-none">
          {emoji}
        </div>
      )}

      {/* Quote text with streaming effect */}
      <div className={`flex-1 ${emoji ? 'pt-2' : ''}`}>
        <p className="text-yellow-100 text-lg italic leading-relaxed">
          {showQuotes && '"'}
          {displayedText}
          {!isComplete && <span className="animate-pulse">|</span>}
          {showQuotes && '"'}
        </p>
      </div>
    </div>
  );
}

// Choice Section Component
function ChoiceSection({ choices, onChoice, hasTimedOut, type }) {
  // Good deed has single help button
  if (type === 'encounter_good_deed') {
    const choice = choices[0];
    return (
      <button
        onClick={() => onChoice(choice.id)}
        disabled={choice.disabled || hasTimedOut}
        className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
          choice.disabled || hasTimedOut
            ? 'bg-gray-700 cursor-not-allowed'
            : 'bg-green-700 hover:bg-green-600'
        }`}
      >
        <Heart size={20} />
        <span>{choice.label}</span>
      </button>
    );
  }

  // Gadget encounters have grid of choices
  return (
    <div className="grid grid-cols-3 gap-2">
      {choices.map((choice) => (
        <button
          key={choice.id}
          onClick={() => onChoice(choice.id)}
          disabled={choice.disabled || hasTimedOut}
          className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
            choice.disabled
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : hasTimedOut
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer'
          }`}
        >
          {choice.icon && <span className="text-2xl">{choice.icon}</span>}
          <span className="text-xs font-bold">{choice.label}</span>
          {choice.disabled && <span className="text-xs">Used</span>}
        </button>
      ))}
    </div>
  );
}

// Helper to get header configuration by type
function getHeaderConfig(type, customTitle, customIcon) {
  // Allow witness type to have custom header (for apprehension, etc.)
  if (type === 'witness' && !customTitle) return null;

  if (type === 'encounter_assassination') {
    return {
      icon: customIcon || <Skull size={24} className="text-red-500" />,
      title: customTitle || 'ASSASSINATION ATTEMPT',
      titleColor: 'text-red-400',
    };
  }

  if (type === 'encounter_henchman') {
    return {
      icon: customIcon || <Zap size={24} className="text-orange-400" />,
      title: customTitle || 'HENCHMAN ENCOUNTER',
      titleColor: 'text-orange-400',
    };
  }

  if (type === 'encounter_good_deed') {
    return {
      icon: customIcon || <Heart size={24} className="text-yellow-400" />,
      title: customTitle || 'SOMEONE NEEDS HELP',
      titleColor: 'text-yellow-400',
    };
  }

  if (type === 'rogue_action') {
    return {
      icon: customIcon || <span className="text-2xl">🎭</span>,
      title: customTitle || 'ROGUE ACTION',
      titleColor: 'text-purple-400',
    };
  }

  if (type === 'apprehension') {
    return {
      icon: customIcon || <span className="text-2xl">🚔</span>,
      title: customTitle || 'SUSPECT APPREHENDED',
      titleColor: 'text-blue-400',
    };
  }

  // Custom header
  if (customTitle) {
    return {
      icon: customIcon || null,
      title: customTitle,
      titleColor: 'text-yellow-400',
    };
  }

  return null;
}

export default MessageDisplay;
