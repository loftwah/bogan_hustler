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
  const isDebugMode = window.location.search.includes('debug=true');
  
  // Add console logging for debugging
  useEffect(() => {
    if (isDebugMode) {
      console.log("Event state:", event);
      console.log("Minigame state:", showMinigame);
    }
  }, [event, showMinigame, isDebugMode]);

  // Add debug logging for state changes
  useEffect(() => {
    if (isDebugMode) {
      console.log("showMinigame state changed:", showMinigame);
    }
  }, [showMinigame, isDebugMode]);

  useEffect(() => {
    if (isDebugMode) {
      console.log("opponentType state changed:", opponentType);
    }
  }, [opponentType, isDebugMode]);

  useEffect(() => {
    if (event?.id.includes('police')) {
      const siren = new Audio('./siren.mp3');
      siren.volume = 0.3;
      
      // Always try to play - modern browsers allow this after any user interaction with the page
      siren.play().catch(err => {
        if (isDebugMode) console.log('Audio playback failed:', err);
      });
    }
  }, [event, isDebugMode]);

  // Auto-mark as interacted after a short delay for mobile users
  useEffect(() => {
    const markInteracted = () => {
      document.documentElement.setAttribute('data-user-interacted', 'true');
    };
    
    // Mark interacted immediately if on mobile
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      markInteracted();
    }
    
    // Also set up traditional listener
    document.addEventListener('click', markInteracted, { once: true });
    document.addEventListener('touchstart', markInteracted, { once: true });
    
    return () => {
      document.removeEventListener('click', markInteracted);
      document.removeEventListener('touchstart', markInteracted);
    };
  }, []);

  if (!event) return null;

  // Helper function to apply outcome effects
  const applyOutcome = (outcome: EventOutcome) => {
    if (!outcome) return;

    const effects = {
      cash: outcome.cash || 0,
      reputation: outcome.reputation || 0,
      policeEvasion: outcome.policeEvasion || 0,
    };

    dispatch(adjustStatsFromEvent(effects));

    if (outcome.message) {
      toast(outcome.message);
    }
  };

  // Type guard for EventOutcome
  const isEventOutcome = (outcome: EventOutcome | EventChoiceOutcome): outcome is EventOutcome => {
    return typeof outcome === 'object' &&
           'cash' in outcome &&
           !('triggerMinigame' in outcome) &&
           !('successChance' in outcome);
  };

  const handleChoice = (choice: EventChoice) => {
    const outcome = choice.outcome;
    
    if (isDebugMode) {
      console.log("Choice clicked:", choice.text);
      console.log("Outcome:", outcome);
    }

    if (isEventOutcome(outcome)) {
      applyOutcome(outcome);
      dispatch(clearEvent());
      return;
    }

    // Always trigger minigame immediately when fight button is clicked
    if ('triggerMinigame' in outcome && outcome.triggerMinigame) {
      if (isDebugMode) {
        console.log("🔥 FIGHT BUTTON CLICKED - SHOULD TRIGGER MINIGAME 🔥");
        console.log("Attempting to trigger minigame:", outcome.opponentType || 'police');
      }
      
      // Set opponent type immediately
      setOpponentType(outcome.opponentType || 'police');
      
      // Show minigame immediately without timeout
      setShowMinigame(true);
      
      // Don't clear the event yet, let the minigame completion handle it
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
    if (isDebugMode) {
      console.log("Minigame completed:", success ? "Victory" : "Defeat");
    }
    setShowMinigame(false);
    
    if (success) {
      toast("Victory! Your tactical maneuvers and quick strikes won the fight. Well done!", { icon: '🎉' });
    } else {
      toast("Defeat... The enemy was too strong this time. Regroup and try again.", { icon: '💀' });
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
      // Combine all effects into a single line where possible
      if ('successChance' in outcome && outcome.successChance) {
        const percentage = Math.round(outcome.successChance * 100);
        
        if (outcome.success && outcome.failure) {
          details.push(
            `${percentage}% chance:`,
            `✅ ${formatOutcome(outcome.success)}`,
            `❌ ${formatOutcome(outcome.failure)}`
          );
        } else {
          details.push(`${percentage}% Success Rate`);
        }
      }
      
      if ('triggerMinigame' in outcome && outcome.triggerMinigame) {
        details.push('💥 Fight to win reputation!');
      }
      
      if ('baseEffects' in outcome && outcome.baseEffects) {
        details.push(formatOutcome(outcome.baseEffects));
      }
    }

    return (
      <div className="grid gap-1">
        {details.map((detail, index) => (
          <div 
            key={index} 
            className={`${
              detail.startsWith('✅') ? 'text-green-400' :
              detail.startsWith('❌') ? 'text-red-400' :
              'text-text/70'
            }`}
          >
            {detail}
          </div>
        ))}
      </div>
    );
  };

  const formatOutcome = (outcome: EventOutcome): string => {
    const parts: string[] = [];
    
    // Combine all stats into a single line
    const stats = [];
    if (outcome.cash) stats.push(`$${outcome.cash > 0 ? '+' : ''}${outcome.cash}`);
    if (outcome.reputation) stats.push(`${outcome.reputation > 0 ? '+' : ''}${outcome.reputation}r`);
    if (outcome.policeEvasion) stats.push(`${outcome.policeEvasion > 0 ? '+' : ''}${outcome.policeEvasion}e`);
    
    if (stats.length > 0) {
      parts.push(stats.join(' '));
    }

    // Add inventory changes if any
    if (outcome.inventory?.length) {
      const changes = outcome.inventory
        .filter(item => item.quantity !== 0)
        .map(item => `${item.quantity > 0 ? '+' : ''}${item.quantity} ${item.name}`)
        .join(', ');
      if (changes) parts.push(changes);
    }

    return parts.join(' • ');
  };

  return (
    <>
      {/* Always render but show/hide based on state */}
      <div className={`fixed inset-0 bg-black/70 flex items-center justify-center z-[999] ${showMinigame ? 'block' : 'hidden'}`}>
        <CombatMinigame 
          onComplete={handleMinigameComplete} 
          opponentType={opponentType}
        />
      </div>
      
      {/* Regular event popup */}
      <div className={`fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-[100] overflow-y-auto ${showMinigame ? 'hidden' : 'block'}`}>
        <div className="bg-surface rounded-lg shadow-lg border border-border w-full max-w-md my-4 sm:my-0">
          {/* Header */}
          <div className="sticky top-0 bg-surface p-3 sm:p-4 border-b border-border z-10">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              {event.id.includes('police') ? '🚨 ' : '⚠️ '}
              Warning
            </h3>
            <p className="mt-2 text-sm sm:text-base">{event.description}</p>
          </div>

          {/* Choices */}
          <div className="p-2 sm:p-4 space-y-2">
            {event.choices.map((choice, index) => (
              <button 
                key={index}
                onClick={() => handleChoice(choice)}
                className="btn w-full bg-surface/90 hover:bg-surface text-sm relative overflow-hidden border border-border/50 hover:border-primary/50 transition-all"
                aria-label={choice.text}
              >
                <div className="flex flex-col p-2 sm:p-3">
                  {/* Choice Text */}
                  <span className="text-sm sm:text-base font-medium mb-1.5">{choice.text}</span>
                  
                  {/* Outcome Details - More Compact Layout */}
                  <div className="text-xs sm:text-sm opacity-80">
                    {renderOutcomeDetails(choice)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default EventPopup;