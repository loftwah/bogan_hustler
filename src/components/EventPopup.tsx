import { useDispatch, useSelector } from "react-redux";
import { clearEvent } from "../store/eventSlice";
import { buyDrug, sellDrug, adjustCashFromEvent, adjustStatsFromEvent } from "../store/playerSlice";
import { RootState } from "../store/store";
import { useEffect } from "react";

// Add type for choice parameter
interface EventChoice {
  text: string;
  outcome: {
    cash?: number;
    inventory?: Record<string, number>;
    reputation?: number;
    policeEvasion?: number;
  };
}

const EventPopup = () => {
  const dispatch = useDispatch();
  const event = useSelector((state: RootState) => state.events.activeEvent);

  useEffect(() => {
    // Play siren for police-related events
    if (event?.id.includes('police')) {
      const siren = new Audio('./siren.mp3');
      siren.volume = 0.3;
      siren.play().catch(err => console.log('Audio playback failed:', err));
    }
  }, [event]);

  if (!event) return null;

  const handleChoice = (outcome: EventChoice['outcome']) => {
    // Handle all stats in one dispatch
    dispatch(adjustStatsFromEvent({
      cash: outcome.cash,
      reputation: outcome.reputation,
      policeEvasion: outcome.policeEvasion
    }));

    if (outcome.inventory) {
      Object.entries(outcome.inventory).forEach(([drug, qty]) => {
        if (qty > 0) dispatch(buyDrug({ drug, quantity: qty, price: 0 }));
        else dispatch(sellDrug({ drug, quantity: -qty, price: 0 }));
      });
    }
    
    dispatch(clearEvent());
  };

  return (
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
              onClick={() => handleChoice(choice.outcome)}
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
  );
};

export default EventPopup; 