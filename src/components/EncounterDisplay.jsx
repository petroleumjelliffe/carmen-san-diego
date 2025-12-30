import { useState, useCallback } from 'react';
import { MessageDisplay } from './MessageDisplay';

/**
 * Wrapper for MessageDisplay that handles encounter game logic
 * (gadget checking, good deed outcomes, time penalties)
 */
export function EncounterDisplay({
  type,
  encounter,
  timerDuration,
  availableGadgets,
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
        message: encounter?.timeout_text || encounter?.no_gadget_text || 'Time ran out!',
        type: 'failure',
        outcome: 'timeout',
        gadgetId: null,
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
      // Gadget encounter (henchman/assassination)
      const isCorrect = choiceId === encounter?.correct_gadget;

      if (isCorrect) {
        newResult = {
          message: encounter?.success_text || 'Perfect choice!',
          type: 'success',
          outcome: 'success',
          gadgetId: choiceId,
          timeLost: 0,
        };
      } else {
        newResult = {
          message: encounter?.failure_text || 'Wrong gadget!',
          type: 'failure',
          outcome: 'wrong_gadget',
          gadgetId: choiceId,
          timeLost: wrongPenalty,
        };
      }
    }

    setResult(newResult);
  }, [type, encounter, isFakeGoodDeed, goodDeedTimeCost, wrongPenalty]);

  // Handle continue
  const handleContinue = useCallback(() => {
    if (result && onResolve) {
      onResolve({ ...result, type });
    }
  }, [result, type, onResolve]);

  // Build choices array
  const choices = type === 'good_deed'
    ? [{ id: 'help', label: 'HELP', type: 'continue' }]
    : availableGadgets?.map(g => ({
        id: g.id,
        label: g.name,
        icon: g.icon,
        disabled: g.used,
        type: 'gadget',
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
