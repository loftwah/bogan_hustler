import { useDispatch, useSelector } from "react-redux";
import { clearEvent } from "../store/eventSlice";
import { adjustStatsFromEvent } from "../store/playerSlice";
import { RootState } from "../store/store";
import { useEffect, useState } from "react";
import { CombatMinigame } from './CombatMinigame';
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
  opponentType?: 'police' | 'gang' | 'bikie' | 'dealer';
}

interface EventChoice {
  text: string;
  outcome: EventChoiceOutcome | EventOutcome;
}

const EventPopup = () => {
  const dispatch = useDispatch();
  const event = useSelector((state: RootState) => state.events.activeEvent);
  const [showMinigame, setShowMinigame] = useState(false);
  const [opponentType, setOpponentType] = useState<'police' | 'gang' | 'bikie' | 'dealer'>('police');

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
      setOpponentType(outcome.opponentType || 'police');
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

  const handleMinigameComplete = (success: boolean) => {
    setShowMinigame(false);
    if (success) {
      toast("You won the fight!", { icon: '🎉' });
    } else {
      toast("You lost the fight...", { icon: '💀' });
    }
    
    // Clear the event after minigame completion
    dispatch(clearEvent());
    
    // Set last event time after minigame completion
    localStorage.setItem('lastEventTime', Date.now().toString());
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
        const percentage = Math.round(outcome.successChance * 100);
        details.push(`Success chance: ${percentage}%`);
        if (outcome.success) details.push(
          `✅ Success:\n${formatOutcome(outcome.success)}`
        );
        if (outcome.failure) details.push(
          `❌ Failure:\n${formatOutcome(outcome.failure)}`
        );
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
      <div className="text-sm space-y-2">
        {details.map((detail, index) => (
          <div 
            key={index} 
            className={`p-2 rounded ${
              detail.startsWith('✅') ? 'bg-green-950/30 text-green-400' :
              detail.startsWith('❌') ? 'bg-red-950/30 text-red-400' :
              'text-text/70'
            }`}
          >
            {detail}
          </div>
        ))}
      </div>
    );
  };

  const formatOutcome = (outcome: EventOutcome, prefix?: string): string => {
    const parts: string[] = [];
    
    if (outcome.inventory?.length) {
      outcome.inventory.forEach(item => {
        if (item.quantity > 0) {
          // Context-aware success narratives
          if (outcome.cash && outcome.cash < 0) {
            // Paid protection/territory fee scenarios
            switch(item.name) {
              case "Ice":
                parts.push(`The bikies appreciated the respect. Their cook hooked you up with ${item.quantity} ${item.name} as a gesture 🤝`);
                break;
              case "Pingas":
                parts.push(`After sorting the payment, the crew invited you to their party. Left with ${item.quantity} ${item.name} 🎪`);
                break;
              default:
                parts.push(`They respected the business move. Threw in ${item.quantity} ${item.name} to sweeten the deal 💼`);
            }
          } else {
            // Regular success scenarios
            switch(item.name) {
              case "Ice":
                parts.push(`Connected with some bikies at the pub. Solid deal for ${item.quantity} ${item.name} 🍺`);
                break;
              case "Pingas":
                parts.push(`Met a proper old-school raver. Scored ${item.quantity} ${item.name} 🎪`);
                break;
              case "Weed":
                parts.push(`Picked up ${item.quantity} ${item.name} from some hippies living in a Kombi van in Nimbin. Sweet deal 🚐`);
                break;
              case "Cocaine":
                parts.push(`Grabbed ${item.quantity} ${item.name} from a high-roller at the Star Casino. Premium stuff 🎰`);
                break;
              case "Acid":
                parts.push(`Scored ${item.quantity} ${item.name} from some proper psychonauts at a rainbow gathering 🌈`);
                break;
              default:
                parts.push(`Scored ${item.quantity} ${item.name} from a sketchy meetup behind the servo 🤝`);
            }
          }
        } else {
          // Failure narratives - context aware
          const lostAmount = Math.abs(item.quantity);
          if (outcome.cash && outcome.cash < 0) {
            // Protection/territory payment gone wrong
            switch(item.name) {
              case "Ice":
                parts.push(`They took your payment AND ${lostAmount} ${item.name}. Rough business 💀`);
                break;
              default:
                parts.push(`Lost ${lostAmount} ${item.name} on top of the payment. These guys are sharks 🦈`);
            }
          } else {
            // Regular failure scenarios
            switch(item.name) {
              case "Ice":
                parts.push(`${lostAmount} ${item.name} went down the drain during the raid. Barely escaped 🚔`);
                break;
              case "Pingas":
                parts.push(`Dropped ${lostAmount} ${item.name} jumping fences at Bondi when the dogs showed up. At least you didn't get caught 🏃‍♂️`);
                break;
              case "Weed":
                parts.push(`The cops found ${lostAmount} ${item.name} hidden in your Commodore's wheel well. Should've used the boot 🚗`);
                break;
              case "Cocaine":
                parts.push(`Lost ${lostAmount} ${item.name} when your boat got searched coming back from The Cross. Expensive night 🚤`);
                break;
              case "Acid":
                parts.push(`${lostAmount} ${item.name} got ruined in the rain during a police chase through Fitzroy Gardens 🌧️`);
                break;
              default:
                parts.push(`${lostAmount} ${item.name} got pinched in a raid. Time to find a new spot 🚨`);
            }
          }
        }
      });
    }

    if (outcome.cash) {
      if (outcome.cash > 0) {
        // Context-aware cash gains
        const narratives = outcome.reputation && outcome.reputation > 0 ? [
          `Made a solid ${outcome.cash} and earned some respect from the local crew 💰`,
          `Cleared ${outcome.cash} and got noticed by the right people 🤝`,
          `The boss was impressed. Pocketed ${outcome.cash} for being professional 💼`
        ] : [
          `Pocketed ${outcome.cash} from a smooth deal 💰`,
          `Made $${outcome.cash} selling to private school kids in their dad's Merc 🚙`,
          `Scored $${outcome.cash} from some loaded tourists at Schoolies 🎉`,
          `Found $${outcome.cash} stashed in an old Winnie Blue pack. Someone's having a bad day 🎰`,
          `Cleaned up $${outcome.cash} running deliveries for the local crew 🏍️`,
          `Made $${outcome.cash} selling to ravers at a warehouse party 🎪`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
      } else {
        // Context-aware cash losses
        const amount = Math.abs(outcome.cash);
        const narratives = outcome.reputation && outcome.reputation > 0 ? [
          `Paid ${amount} for protection. Money well spent 🤝`,
          `Invested ${amount} in some good will. Smart move 💼`,
          `Territory payment of ${amount}. Part of doing business 💰`
        ] : [
          `Lost ${amount} in a deal gone wrong 💀`,
          `Lost $${amount} when some Rebels MC boys taxed your operation. Better pay up next time 🏍️`,
          `Dropped $${amount} swimming through the Yarra to dodge the cops. At least you're alive 🏊‍♂️`,
          `Got rolled for $${amount} by some junkies outside the commission flats. Amateur move 🏢`,
          `Blew $${amount} bribing your way out of a cell. Cheaper than court 🚔`,
          `Lost $${amount} when your runner got nicked. Should've vetted them better 👮`,
          `Had to pay $${amount} to keep someone's mouth shut. Trust no one 🤐`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
      }
    }

    if (outcome.reputation) {
      if (outcome.reputation > 0) {
        // Success narratives - gaining reputation
        const narratives = [
          `Word's getting around you're a fair dinkum dealer. Even the old heads are showing respect (+${outcome.reputation} rep) 🌟`,
          `The streets are talking about how you looked after your crew during that raid (+${outcome.reputation} rep) 🤝`,
          `Your name's gold after you helped that bikie's cousin out of a tight spot (+${outcome.reputation} rep) 💪`,
          `The local crews are impressed by your professional operation (+${outcome.reputation} rep) 🎯`,
          `People noticed you kept your mouth shut when the heat came down (+${outcome.reputation} rep) 🤐`,
          `Your reputation's solid after standing your ground against those wannabe gangsters (+${outcome.reputation} rep) 👊`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
      } else {
        // Failure narratives - losing reputation
        const narratives = [
          `People reckon you're a dog after that incident with the cops (${outcome.reputation} rep) 🐕`,
          `Word got out about you selling dodgy gear to schoolkids (${outcome.reputation} rep) 🚫`,
          `The streets are saying you ratted on your connect to save yourself (${outcome.reputation} rep) 🐀`,
          `Lost face when you ran from those westies instead of standing your ground (${outcome.reputation} rep) 🏃`,
          `Nobody trusts you after you ripped off those bikers (${outcome.reputation} rep) ⛔`,
          `Your name's mud after leaving your crew to take the fall (${outcome.reputation} rep) 💀`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
      }
    }

    if (outcome.policeEvasion) {
      if (outcome.policeEvasion > 0) {
        // Success narratives - gaining evasion
        const narratives = [
          `Found some new backstreets to dodge the cops (+${outcome.policeEvasion} evasion) 🏃‍♂️`,
          `Got some intel on police patrol patterns (+${outcome.policeEvasion} evasion) 🗺️`,
          `That close call taught you some new escape routes (+${outcome.policeEvasion} evasion) 🚗`,
          `Made friends with a dodgy security guard (+${outcome.policeEvasion} evasion) 🔐`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
      } else {
        // Failure narratives - losing evasion
        const narratives = [
          `The cops are onto your usual escape routes (${outcome.policeEvasion} evasion) 👮‍♂️`,
          `Your favorite hiding spots got compromised (${outcome.policeEvasion} evasion) 🚨`,
          `Lost your connect at the local cop shop (${outcome.policeEvasion} evasion) 📱`,
          `The new sergeant knows all your tricks (${outcome.policeEvasion} evasion) 🕵️‍♂️`
        ];
        parts.push(narratives[Math.floor(Math.random() * narratives.length)]);
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
        <CombatMinigame 
          onComplete={handleMinigameComplete} 
          opponentType={opponentType}
        />
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