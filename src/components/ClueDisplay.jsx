import { useState, useEffect, useMemo, useRef } from 'react';

// Profession emojis (base without skin tone)
const PROFESSION_EMOJIS = [
  '👨‍⚕️', // health worker
  '👨‍🎓', // student
  '👨‍🏫', // teacher
  '👨‍⚖️', // judge
  '👨‍🌾', // farmer
  '👨‍🍳', // cook
  '👨‍🔧', // mechanic
  '👨‍🏭', // factory worker
  '👨‍💼', // office worker
  '👨‍🔬', // scientist
  '👨‍💻', // technologist
  '👨‍🎤', // singer
  '👨‍🎨', // artist
  '👨‍✈️', // pilot
  '👨‍🚀', // astronaut
  '👨‍🚒', // firefighter
  '👮‍♂️', // police officer
  '🕵️‍♂️', // detective
  '💂‍♂️', // guard
  '👷‍♂️', // construction worker
  '👩‍⚕️', // health worker (female)
  '👩‍🎓', // student (female)
  '👩‍🏫', // teacher (female)
  '👩‍⚖️', // judge (female)
  '👩‍🌾', // farmer (female)
  '👩‍🍳', // cook (female)
  '👩‍🔧', // mechanic (female)
  '👩‍🏭', // factory worker (female)
  '👩‍💼', // office worker (female)
  '👩‍🔬', // scientist (female)
  '👩‍💻', // technologist (female)
  '👩‍🎤', // singer (female)
  '👩‍🎨', // artist (female)
  '👩‍✈️', // pilot (female)
  '👩‍🚀', // astronaut (female)
  '👩‍🚒', // firefighter (female)
  '👮‍♀️', // police officer (female)
  '🕵️‍♀️', // detective (female)
  '💂‍♀️', // guard (female)
  '👷‍♀️', // construction worker (female)
];

/**
 * Simple string hash function
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Skin tone modifiers
const SKIN_TONES = [
  '\u{1F3FB}', // Light skin tone
  '\u{1F3FC}', // Medium-light skin tone
  '\u{1F3FD}', // Medium skin tone
  '\u{1F3FE}', // Medium-dark skin tone
  '\u{1F3FF}', // Dark skin tone
];

/**
 * Get a deterministic profession emoji based on text with random skin tone
 * Same text will always return the same emoji, but with a random skin tone
 */
function getProfessionEmojiForText(text) {
  const hash = hashString(text);
  const professionIndex = hash % PROFESSION_EMOJIS.length;
  const baseEmoji = PROFESSION_EMOJIS[professionIndex];

  // Randomly select a skin tone
  const skinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];

  // Apply skin tone to the emoji
  // For emojis with gender markers, we need to insert the skin tone after the base emoji
  // Most profession emojis are compound: base + skin tone + ZWJ + profession/gender
  return baseEmoji.replace(/(\u{1F468}|\u{1F469})/u, `$1${skinTone}`);
}

/**
 * Display a clue with a person emoji and word-by-word streaming text
 * @param {string} text - The main clue text to stream
 * @param {string} descriptiveText - Optional descriptive text shown above the person/statement
 * @param {string} type - Type of clue ('investigation' or 'rogue')
 */
export function ClueDisplay({ text, descriptiveText, type = 'investigation' }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);
  const currentIndexRef = useRef(0);

  // Memoize emoji based on text - deterministic
  const personEmoji = useMemo(() => {
    return text ? getProfessionEmojiForText(text) : '';
  }, [text]);

  // Stream text word by word
  useEffect(() => {
    if (!text) return;

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset state
    setDisplayedText('');
    setIsComplete(false);
    currentIndexRef.current = 0;

    // Clean the text
    const cleanedText = text
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
        setIsComplete(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 150); // 150ms per word

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text]);

  if (!text) return null;

  const borderColor = type === 'rogue' ? 'border-orange-500' : 'border-yellow-500';

  return (
    <div className="space-y-2">
      {/* Optional descriptive text above */}
      {descriptiveText && (
        <div className="text-yellow-200/70 text-sm px-2">
          {descriptiveText}
        </div>
      )}

      {/* Main clue display */}
      <div className={`flex items-start gap-4 p-6 bg-gray-900/95 backdrop-blur-sm rounded-lg border-l-4 ${borderColor}`}>
        {/* Person emoji - large and prominent */}
        <div className="flex-shrink-0 text-7xl leading-none select-none">
          {personEmoji}
        </div>

        {/* Clue text with streaming effect */}
        <div className="flex-1 pt-2">
          <p className="text-yellow-100 text-lg italic leading-relaxed">
            "{displayedText}
            {!isComplete && <span className="animate-pulse">|</span>}
            "
          </p>
        </div>
      </div>
    </div>
  );
}

export default ClueDisplay;
