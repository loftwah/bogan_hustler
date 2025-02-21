import { useDispatch, useSelector } from "react-redux";
import { clearEvent } from "../store/eventSlice";
import { buyDrug, sellDrug, adjustStatsFromEvent } from "../store/playerSlice";
import { RootState } from "../store/store";
import { useEffect, useState } from "react";
import { PoliceFightMinigame } from './PoliceFightMinigame';
import { toast } from "react-hot-toast";

// Add type for choice parameter
interface EventOutcome {
  cash?: number;
  inventory?: Record<string, number>;
  reputation?: number;
  policeEvasion?: number;
}

// Add the LocationRequirement interface
interface LocationRequirement {
  blacklist: string[];
  failureMessage: string;
}

// Update the EventChoice interface
interface EventChoice {
  text: string;
  outcome: {
    successChance?: number;
    success?: EventOutcome;
    failure?: EventOutcome;
  } | EventOutcome | {
    triggerMinigame: true;
    requireLocation?: LocationRequirement;
  };
}

const EventPopup = () => {
  const dispatch = useDispatch();
  const event = useSelector((state: RootState) => state.events.activeEvent);
  const currentLocation = useSelector((state: RootState) => state.player.location);
  const [showMinigame, setShowMinigame] = useState(false);

  useEffect(() => {
    if (event?.id.includes('police')) {
      const siren = new Audio('./siren.mp3');
      siren.volume = 0.3;
      
      if (document.documentElement.hasAttribute('data-user-interacted')) {
        siren.play().catch(err => console.log('Audio playback failed:', err));
      }
    }
  }, [event]);

  useEffect(() => {
    const markInteracted = () => {
      document.documentElement.setAttribute('data-user-interacted', 'true');
      document.removeEventListener('click', markInteracted);
    };
    document.addEventListener('click', markInteracted);
    return () => document.removeEventListener('click', markInteracted);
  }, []);

  if (!event) return null;

  const handleChoice = (choice: EventChoice) => {
    // Check location restrictions for fight option
    if ('triggerMinigame' in choice.outcome) {
      if (choice.outcome.requireLocation) {
        const { blacklist, failureMessage } = choice.outcome.requireLocation;
        if (blacklist.includes(currentLocation)) {
          toast(failureMessage, {
            icon: "⚠️",
            duration: 3000
          });
          return;
        }
      }
      setShowMinigame(true);
      return;
    }

    // Handle probabilistic outcomes
    if ('successChance' in choice.outcome && choice.outcome.success && choice.outcome.failure) {
      const roll = Math.random();
      const succeeded = roll < (choice.outcome.successChance || 0);
      
      const outcome = succeeded ? choice.outcome.success : choice.outcome.failure;
      
      dispatch(adjustStatsFromEvent(outcome));
      
      if (outcome.inventory) {
        Object.entries(outcome.inventory).forEach(([drug, qty]) => {
          if (qty > 0) dispatch(buyDrug({ drug, quantity: qty, price: 0 }));
          else dispatch(sellDrug({ drug, quantity: -qty, price: 0 }));
        });
      }

      // Show outcome message
      toast(succeeded ? "You got lucky!" : "Things didn't go as planned...", {
        icon: succeeded ? "✅" : "❌"
      });
    } else if ('cash' in choice.outcome || 'inventory' in choice.outcome || 'reputation' in choice.outcome || 'policeEvasion' in choice.outcome) {
      // Handle direct outcomes
      dispatch(adjustStatsFromEvent(choice.outcome));
      
      if (choice.outcome.inventory) {
        Object.entries(choice.outcome.inventory).forEach(([drug, qty]) => {
          if (qty > 0) dispatch(buyDrug({ drug, quantity: qty, price: 0 }));
          else dispatch(sellDrug({ drug, quantity: -qty, price: 0 }));
        });
      }
    }
    
    dispatch(clearEvent());
  };

  const renderOutcomeDetails = (choice: EventChoice) => {
    // Handle minigame outcome
    if ('triggerMinigame' in choice.outcome) {
      return (
        <div className="text-sm text-yellow-400/90">
          Fight for max reputation!
        </div>
      );
    }

    // Handle probabilistic outcome
    if ('successChance' in choice.outcome) {
      const { success, failure } = choice.outcome;
      if (!success || !failure) return null;
      
      return (
        <div className="space-y-1.5">
          <div className="flex gap-3 items-center justify-center text-sm">
            <span className="text-emerald-400 font-medium">
              {Math.round((choice.outcome.successChance || 0) * 100)}% Success
            </span>
            {success.cash && success.cash !== 0 && (
              <span className={success.cash > 0 ? 'text-emerald-400' : 'text-red-400'}>
                ${Math.abs(success.cash)}
              </span>
            )}
            {success.reputation && success.reputation !== 0 && (
              <span className={success.reputation > 0 ? 'text-emerald-400' : 'text-red-400'}>
                Rep {success.reputation > 0 ? '+' : ''}{success.reputation}
              </span>
            )}
          </div>
          <div className="text-red-400/90 text-xs flex gap-2 justify-center">
            <span>Failure:</span>
            {failure.cash && failure.cash !== 0 && 
              <span>${Math.abs(failure.cash)}</span>
            }
            {failure.reputation && failure.reputation !== 0 && 
              <span>Rep {failure.reputation}</span>
            }
            {failure.inventory && Object.keys(failure.inventory).length > 0 && (
              <span>Lose drugs</span>
            )}
          </div>
        </div>
      );
    }

    // Handle direct outcome
    const outcome = choice.outcome as EventOutcome;
    return (
      <div className="flex gap-3 justify-center text-sm">
        {outcome.cash && outcome.cash !== 0 && (
          <span className={outcome.cash > 0 ? 'text-emerald-400' : 'text-red-400'}>
            ${Math.abs(outcome.cash)}
          </span>
        )}
        {outcome.reputation && outcome.reputation !== 0 && (
          <span className={outcome.reputation > 0 ? 'text-emerald-400' : 'text-red-400'}>
            Rep {outcome.reputation > 0 ? '+' : ''}{outcome.reputation}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {showMinigame ? (
        <PoliceFightMinigame onComplete={() => setShowMinigame(false)} />
      ) : (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg shadow-lg border border-border p-4 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {event.id.includes('police') ? '🚨 ' : '⚠️ '}
              Warning
            </h3>
            <p className="mb-4">{event.description}</p>
            <div className="grid gap-2">
              {event.choices.map((choice, index) => (
                <button 
                  key={index}
                  onClick={() => handleChoice(choice)}
                  className="btn bg-surface/90 hover:bg-surface text-sm p-4 relative overflow-hidden border border-border/50 hover:border-primary/50 transition-all"
                  aria-label={choice.text}
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-medium">{choice.text}</span>
                    {renderOutcomeDetails(choice)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventPopup; 