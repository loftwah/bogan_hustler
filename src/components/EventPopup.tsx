import { useDispatch, useSelector } from "react-redux";
import { clearEvent } from "../store/eventSlice";
import { buyDrug, sellDrug } from "../store/playerSlice";
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
      const siren = new Audio('/siren.mp3');
      siren.volume = 0.3; // Reduce volume to 30%
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
      dispatch(buyDrug({ drug: "Event", quantity: 0, price: -outcome.cash }));
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
    <div className="event-popup">
      <h3>Warning</h3>
      <p>{event.description}</p>
      <div className="event-choices">
        {event.choices.map((choice: EventChoice, index: number) => (
          <button 
            key={index} 
            onClick={() => handleChoice(choice.outcome)}
            className="choice-button"
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventPopup; 