import { useDispatch, useSelector } from "react-redux";
import { clearEvent } from "../store/eventSlice";
import { buyDrug, sellDrug, adjustStatsFromEvent } from "../store/playerSlice";
import { RootState } from "../store/store";
import { useEffect, useState } from "react";
import { PoliceFightMinigame } from './PoliceFightMinigame';
import { toast } from "react-hot-toast";

// Add type for choice parameter
interface EventChoice {
  text: string;
  outcome: {
    cash?: number;
    inventory?: Record<string, number>;
    reputation?: number;
    policeEvasion?: number;
    successChance?: number;
    success?: {
      cash?: number;
      inventory?: Record<string, number>;
      reputation?: number;
      policeEvasion?: number;
    };
    failure?: {
      cash?: number;
      inventory?: Record<string, number>;
      reputation?: number;
      policeEvasion?: number;
    };
  };
  triggerMinigame?: boolean;
}

const EventPopup = () => {
  const dispatch = useDispatch();
  const event = useSelector((state: RootState) => state.events.activeEvent);
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
    if ('triggerMinigame' in choice.outcome) {
      setShowMinigame(true);
      return;
    }

    // Handle probabilistic outcomes
    if ('successChance' in choice.outcome) {
      const roll = Math.random();
      const succeeded = roll < (choice.outcome.successChance || 0);
      
      const outcome = succeeded ? choice.outcome.success : choice.outcome.failure;
      
      if (outcome) {
        dispatch(adjustStatsFromEvent(outcome));
        
        if (outcome.inventory) {
          Object.entries(outcome.inventory).forEach(([drug, qty]) => {
            if (qty > 0) dispatch(buyDrug({ drug, quantity: qty, price: 0 }));
            else dispatch(sellDrug({ drug, quantity: -qty, price: 0 }));
          });
        }
      }

      // Show outcome message
      toast(succeeded ? "You got lucky!" : "Things didn't go as planned...", {
        type: succeeded ? "success" : "error"
      });
    } else {
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
              {event.choices.map((choice: EventChoice, index: number) => (
                <button 
                  key={index}
                  onClick={() => handleChoice(choice)}
                  className="btn btn-primary text-sm hover:bg-primary hover:text-white relative overflow-hidden"
                  aria-label={choice.text}
                >
                  <span>{choice.text}</span>
                  <div className="text-xs opacity-75 mt-1">
                    {choice.outcome.cash && (
                      <span className={choice.outcome.cash > 0 ? 'text-green-400' : 'text-red-400'}>
                        ${choice.outcome.cash}
                      </span>
                    )}
                    {choice.outcome.reputation && (
                      <span className={choice.outcome.reputation > 0 ? 'text-green-400' : 'text-red-400'}>
                        {' '}Rep: {choice.outcome.reputation > 0 ? '+' : ''}{choice.outcome.reputation}
                      </span>
                    )}
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