import { useState, useCallback } from 'react';
import { MessageDisplay } from './MessageDisplay';

/**
 * Wrapper for MessageDisplay that handles encounter game logic
 * (trivia checking, good deed outcomes, time penalties)
 */
export function EncounterDisplay({
  type,
  encounter,
  timerDuration,
  triviaQuestion,
  countries,
  karma,
  timeRemaining,
  onResolve,
}) {
  const [result, setResult] = useState(null);

  const isFakeGoodDeed = type === 'good_deed' && encounter?.isFake;
  const wrongPenalty = encounter?.time_penalty_wrong || 4;
  const noPenalty = encounter?.time_penalty_none || (type === 'assassination' ? 8 : 6);
  const goodDeedTimeCost = encounter?.time_cost || 3;

  // Handle timeout
  const handleTimeout = useCallback(() => {
    let newResult;
    if (type === 'good_deed') {
      newResult = {
        message: "You didn't have time to help.",
        type: 'neutral',
        outcome: 'skipped',
        helped: false,
        timeLost: 0,
      };
    } else {
      newResult = {
        message: encounter?.timeout_text || 'Time ran out! They escaped!',
        type: 'failure',
        outcome: 'timeout',
        timeLost: noPenalty,
      };
    }
    setResult(newResult);
  }, [type, encounter, noPenalty]);

  // Handle choice
  const handleChoice = useCallback((choiceId) => {
    let newResult;

    if (type === 'good_deed') {
      // Good deed choice
      if (choiceId === 'help') {
        if (isFakeGoodDeed) {
          // Trap!
          newResult = {
            message: encounter?.setup_reveal || "It was a trap!",
            type: 'failure',
            outcome: 'trap',
            helped: true,
            timeLost: 8,
            isTrap: true,
            injuryChance: encounter?.injury_chance || 0.75,
          };
        } else {
          // Real good deed
          newResult = {
            message: encounter?.gratitude || "Thank you for helping!",
            type: 'success',
            outcome: 'helped',
            helped: true,
            timeLost: goodDeedTimeCost,
            karmaGain: 1,
            npcName: encounter?.npc_name,
          };
        }
      } else {
        // Declined
        newResult = {
          message: "You kept moving. The mission comes first.",
          type: 'neutral',
          outcome: 'skipped',
          helped: false,
          timeLost: 0,
        };
      }
    } else {
      // Trivia encounter (henchman/assassination)
      console.log('Trivia Answer Check:', {
        choiceId,
        correctCountryId: triviaQuestion?.correctCountryId,
        isMatch: choiceId === triviaQuestion?.correctCountryId,
        stimulus: triviaQuestion?.stimulus,
        correctCountry: triviaQuestion?.correctCountry?.name,
        allOptions: triviaQuestion?.mappedOptions?.map(c => ({ id: c.id, name: c.name }))
      });

      const isCorrect = choiceId === triviaQuestion?.correctCountryId;

      if (isCorrect) {
        newResult = {
          message: encounter?.success_text || "Correct! You identified the country and thwarted their plan!",
          type: 'success',
          outcome: 'success',
          timeLost: 0,
        };
      } else {
        const correctCountry = countries?.find(c => c.id === triviaQuestion?.correctCountryId);
        newResult = {
          message: encounter?.failure_text || `Wrong! The answer was ${correctCountry?.name} ${correctCountry?.flag}. They escaped!`,
          type: 'failure',
          outcome: 'wrong_answer',
          timeLost: wrongPenalty,
        };
      }
    }

    setResult(newResult);
  }, [type, triviaQuestion, countries, encounter, isFakeGoodDeed, goodDeedTimeCost, wrongPenalty]);

  // Handle continue
  const handleContinue = useCallback(() => {
    if (result && onResolve) {
      onResolve({ ...result, type });
    }
  }, [result, type, onResolve]);

  // Build choices array
  const choices = type === 'good_deed'
    ? [{ id: 'help', label: 'HELP', type: 'continue' }]
    : triviaQuestion?.mappedOptions?.map(country => ({
        id: country.id,
        label: country.name,
        icon: country.flag,
        disabled: false,
        type: 'trivia',
      })) || [];

  return (
    <MessageDisplay
      type={
        type === 'henchman' ? 'encounter_henchman' :
        type === 'assassination' ? 'encounter_assassination' :
        type === 'good_deed' ? 'encounter_good_deed' :
        'witness'
      }
      quote={encounter?.description || encounter?.plea || ''}
      triviaStimulus={triviaQuestion ? {
        value: triviaQuestion.stimulus,
        subtext: triviaQuestion.stimulusSubtext,
        flavorText: triviaQuestion.flavorText,
        icon: triviaQuestion.contextIcon,
      } : null}
      timerDuration={timerDuration}
      onTimeout={handleTimeout}
      choices={choices}
      onChoice={handleChoice}
      warningText={type === 'good_deed' && karma >= 1 && !isFakeGoodDeed ? 'Could be a trap...' : undefined}
      result={result}
      onContinue={handleContinue}
    />
  );
}

export default EncounterDisplay;
