import { useDispatch, useSelector } from "react-redux";
import { clearEvent } from "../store/eventSlice";
import { buyDrug, sellDrug, adjustCashFromEvent } from "../store/playerSlice";
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

  const handleChoice = (outcome: {
    cash?: number;
    inventory?: Record<string, number>;
    reputation?: number;
    policeEvasion?: number;
  }) => {
    if (outcome.cash) {
      dispatch(adjustCashFromEvent(outcome.cash));
    }
    if (outcome.inventory) {
      Object.entries(outcome.inventory).forEach(([drug, qty]) => {
        if (qty > 0) dispatch(buyDrug({ drug, quantity: qty, price: 0 }));
        else dispatch(sellDrug({ drug, quantity: -qty, price: 0 }));
      });
    }
    // Handle reputation and police evasion in the next update
    dispatch(clearEvent());
  };

  return (
    <div className="fixed inset-0 bg-surface rounded-lg shadow-lg border border-border p-4">
      <h3 className="text-xl font-bold">Warning</h3>
      <p>{event.description}</p>
      <div className="grid gap-2 mt-4">
        {event.choices.map((choice: EventChoice, index: number) => (
          <button 
            key={index}
            onClick={() => handleChoice(choice.outcome)}
            className="btn btn-primary text-sm hover:bg-primary hover:text-white"
            aria-label={choice.text}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventPopup; 