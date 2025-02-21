import { useDispatch, useSelector } from "react-redux";
import { clearEvent } from "../store/eventSlice";
import { adjustStatsFromEvent } from "../store/playerSlice";
import { RootState } from "../store/store";
import { useEffect, useState } from "react";
import { PoliceFightMinigame } from './PoliceFightMinigame';
import { toast } from "react-hot-toast";
import type {
  EventOutcome,
  LocationRequirement,
} from '../store/eventSlice';

// Base outcome types

// Combine all possible outcome types into one union type
interface EventChoiceOutcome {
  baseEffects?: EventOutcome;
  catchChance?: number;
  caughtEffects?: EventOutcome;
  successChance?: number;
  success?: EventOutcome;
  failure?: EventOutcome;
  triggerMinigame?: boolean;
  requireLocation?: LocationRequirement;
}

interface EventChoice {
  text: string;
  outcome: EventChoiceOutcome | EventOutcome;
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

  // Helper function to apply outcome effects
  const applyOutcome = (outcome: EventOutcome) => {
    if (!outcome) return;

    const effects = {
      cash: outcome.cash || 0,
      reputation: outcome.reputation || 0,
      policeEvasion: 0, // Add other effects as needed
    };

    dispatch(adjustStatsFromEvent(effects));

    if (outcome.message) {
      toast(outcome.message);
    }
  };

  // Type guard for EventOutcome
  const isEventOutcome = (outcome: EventOutcome | EventChoiceOutcome): outcome is EventOutcome => {
    return !('successChance' in outcome) && 
           !('triggerMinigame' in outcome) && 
           !('baseEffects' in outcome);
  };

  const handleChoice = (choice: EventChoice) => {
    const outcome = choice.outcome;

    if (isEventOutcome(outcome)) {
      applyOutcome(outcome);
      dispatch(clearEvent());
      return;
    }

    // Handle complex EventChoiceOutcome
    if ('triggerMinigame' in outcome && outcome.triggerMinigame) {
      setShowMinigame(true);
      return;
    }

    if ('baseEffects' in outcome && outcome.baseEffects) {
      applyOutcome(outcome.baseEffects);
    }

    if ('successChance' in outcome && typeof outcome.successChance === 'number') {
      // Convert decimal to percentage for the roll
      const roll = Math.random();
      // Success if roll is BELOW the success chance (not above)
      if (roll < outcome.successChance) {
        if (outcome.success) {
          applyOutcome(outcome.success);
          toast("You got lucky!", { icon: '🍀' });
        }
      } else if (outcome.failure) {
        applyOutcome(outcome.failure);
        toast("Things didn't go as planned...", { icon: '💀' });
      }
    }

    dispatch(clearEvent());
  };

  const renderOutcomeDetails = (choice: EventChoice) => {
    const outcome = choice.outcome;
    const details: string[] = [];

    if (isEventOutcome(outcome)) {
      details.push(formatOutcome(outcome));
    } else {
      if ('baseEffects' in outcome && outcome.baseEffects) {
        details.push(`Base effects: ${formatOutcome(outcome.baseEffects)}`);
      }
      if ('successChance' in outcome && outcome.successChance) {
        // Convert decimal to percentage and format
        const percentage = Math.round(outcome.successChance * 100);
        details.push(`Success chance: ${percentage}%`);
        if (outcome.success) details.push(`Success: ${formatOutcome(outcome.success)}`);
        if (outcome.failure) details.push(`Failure: ${formatOutcome(outcome.failure)}`);
      }
      if ('triggerMinigame' in outcome && outcome.triggerMinigame) {
        details.push('Fight to win reputation!');
      }
      if ('catchChance' in outcome && outcome.catchChance) {
        details.push(`Catch chance: ${outcome.catchChance}%`);
        if (outcome.caughtEffects) details.push(`If caught: ${formatOutcome(outcome.caughtEffects)}`);
      }
    }

    return (
      <div className="text-sm text-text/70">
        {details.map((detail, index) => (
          <p key={index}>{detail}</p>
        ))}
      </div>
    );
  };

  const formatOutcome = (outcome: EventOutcome, prefix?: string): string => {
    const parts: string[] = [];
    
    // Add narrative elements based on outcome type
    if (outcome.inventory?.length) {
      outcome.inventory.forEach(item => {
        if (item.quantity > 0) {
          switch(item.name) {
            case "Ice":
              parts.push(`Scored ${item.quantity} ${item.name} after a wild night at the pub 🍺`);
              break;
            case "Pingas":
              parts.push(`Got ${item.quantity} ${item.name} from a mate's bush doof connection 🎪`);
              break;
            case "Weed":
              parts.push(`Picked up ${item.quantity} ${item.name} from some hippies in Nimbin 🌿`);
              break;
            case "Cocaine":
              parts.push(`Grabbed ${item.quantity} ${item.name} off some suit in Kings Cross 🏢`);
              break;
            default:
              parts.push(`Scored ${item.quantity} ${item.name} from a dodgy meetup 🤝`);
          }
        } else {
          // Lost inventory narratives
          const lostAmount = Math.abs(item.quantity);
          switch(item.name) {
            case "Ice":
              parts.push(`Lost ${lostAmount} ${item.name} in a raid at your mate's place 🚔`);
              break;
            case "Pingas":
              parts.push(`${lostAmount} ${item.name} got soaked in a beach chase 🏊‍♂️`);
              break;
            case "Weed":
              parts.push(`The cops found ${lostAmount} ${item.name} in your Commodore 🚗`);
              break;
            default:
              parts.push(`${lostAmount} ${item.name} got pinched in a bust 🚨`);
          }
        }
      });
    }

    if (outcome.cash) {
      if (outcome.cash > 0) {
        const narratives = [
          `Pocketed $${outcome.cash} from a lucky night 💰`,
          `Made $${outcome.cash} from a solid deal 🤝`,
          `Scored $${outcome.cash} from some rich tourists 🎲`,
          `Found $${outcome.cash} in an old Winnie Blue pack 🎰`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
      } else {
        const narratives = [
          `Lost $${Math.abs(outcome.cash)} to some bikies 🏍️`,
          `Dropped $${Math.abs(outcome.cash)} running from the cops 🏃‍♂️`,
          `Got rolled for $${Math.abs(outcome.cash)} outside the pub 🍺`,
          `Blew $${Math.abs(outcome.cash)} on a bad bet 🎲`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
      }
    }

    if (outcome.reputation) {
      if (outcome.reputation > 0) {
        const narratives = [
          `Word's getting around you're a fair dinkum dealer (+${outcome.reputation} rep) 🌟`,
          `The streets are talking about your loyalty (+${outcome.reputation} rep) 🤝`,
          `Your name carries more weight now (+${outcome.reputation} rep) 💪`,
          `The local crews respect your hustle (+${outcome.reputation} rep) 🎯`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
      } else {
        const narratives = [
          `People reckon you're a bit of a dog (${outcome.reputation} rep) 🐕`,
          `Your reputation took a hit in the scene (${outcome.reputation} rep) 👎`,
          `Word got out about your loose lips (${outcome.reputation} rep) 🤐`,
          `The streets are saying you can't be trusted (${outcome.reputation} rep) 🚫`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
      }
    }

    if (outcome.policeEvasion) {
      if (outcome.policeEvasion > 0) {
        parts.push(`You've learned some new tricks to dodge the cops (+${outcome.policeEvasion} evasion) 🏃‍♂️`);
      } else {
        parts.push(`The cops are onto your usual moves (${outcome.policeEvasion} evasion) 👮‍♂️`);
      }
    }
    
    let result = parts.join('\n');
    if (prefix) {
      result = `${prefix}:\n${result}`;
    }
    return result;
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