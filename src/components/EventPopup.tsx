import { useDispatch, useSelector } from "react-redux";
import { clearEvent } from "../store/eventSlice";
import { buyDrug, sellDrug } from "../store/playerSlice";
import { RootState } from "../store/store";

const EventPopup = () => {
  const dispatch = useDispatch();
  const event = useSelector((state: RootState) => state.events.activeEvent);

  if (!event) return null;

  const handleChoice = (outcome: {
    cash?: number;
    inventory?: Record<string, number>;
    reputation?: number;
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
    // Reputation will be handled in the next update
    dispatch(clearEvent());
  };

  return (
    <div className="event-popup">
      <h3>Oi, Mate! Event!</h3>
      <p>{event.description}</p>
      <div className="event-choices">
        {event.choices.map((choice, index) => (
          <button key={index} onClick={() => handleChoice(choice.outcome)}>
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventPopup; 