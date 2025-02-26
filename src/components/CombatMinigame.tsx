import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faShieldHalved, faPersonRunning, faDumbbell, faDizzy, faTint, faFire, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type OpponentType = 'police' | 'gang' | 'bikie' | 'dealer';

interface Props {
  onComplete: (success: boolean) => void;
  opponentType: OpponentType;
}

interface StatusEffect {
  name: string;
  duration: number;
  effect: 'stun' | 'bleed' | 'defense' | 'rage';
}

interface SpecialMove {
  energyCost: number;
  damage: number;
  description: string;
}

interface OpponentConfig {
  title: string;
  health: number;
  damage: number;
  specialMoves: Record<string, SpecialMove>;
}

const CombatButton: React.FC<{
  moveType: string;
  move: SpecialMove;
  icon: IconDefinition;
  disabled: boolean;
  onClick: () => void;
}> = ({ moveType, move, icon, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center justify-center transition-all duration-200 p-3
      ${disabled 
        ? "btn btn-disabled opacity-50 cursor-not-allowed" 
        : "btn btn-primary relative overflow-hidden hover:scale-105 hover:shadow-md"
      }
    `}
    title={`${move.description}${disabled ? ' (Not enough energy or stunned)' : ' (Ready to use)'}`}
  >
    <FontAwesomeIcon icon={icon} className={`text-xl mb-1 ${!disabled && "animate-pulse text-accent"}`} />
    <div className="flex flex-col items-center">
      <span className="font-bold">{moveType}</span>
      <span className="text-xs">Energy: {move.energyCost} | Damage: {move.damage}</span>
    </div>
    {!disabled && (
      <span className="absolute right-2 top-1 text-xs text-accent animate-ping">
        ✓
      </span>
    )}
  </button>
);

const processStatusEffects = (
  effects: StatusEffect[],
  setEffects: React.Dispatch<React.SetStateAction<StatusEffect[]>>,
  setGameMessage: React.Dispatch<React.SetStateAction<string | null>>
) => {
  if (effects.length === 0) return;

  setEffects(prev => {
    const updated = prev
      .map(effect => ({ ...effect, duration: effect.duration - 1 }))
      .filter(effect => effect.duration > 0);
    
    // Clear status effect message if all effects are gone or if the specific effect expired
    if (updated.length === 0 || 
        (prev.some(e => e.effect === 'rage') && !updated.some(e => e.effect === 'rage')) ||
        (prev.some(e => e.effect === 'defense') && !updated.some(e => e.effect === 'defense'))) {
      setGameMessage(null);
    }
    
    return updated;
  });
};

export const CombatMinigame = ({ onComplete, opponentType }: Props) => {
  const opponentConfigs: Record<OpponentType, OpponentConfig> = {
    police: {
      title: 'Police Fight!',
      health: 100,
      damage: 20,
      specialMoves: {
        quickStrike: { energyCost: 20, damage: 15, description: "Quick jab to create distance" },
        heavyBlow: { energyCost: 35, damage: 30, description: "Powerful strike to stun" },
        defensive: { energyCost: 25, damage: 10, description: "Defensive stance" },
        adrenaline: { energyCost: 30, damage: 20, description: "Fight or flight response" }
      }
    },
    gang: {
      title: 'Gang Fight!',
      health: 80,
      damage: 25,
      specialMoves: {
        quickStrike: { energyCost: 20, damage: 20, description: "Street fighting combo" },
        heavyBlow: { energyCost: 35, damage: 35, description: "Brutal gang attack" },
        defensive: { energyCost: 25, damage: 15, description: "Block and counter" },
        adrenaline: { energyCost: 30, damage: 25, description: "Gang fury" }
      }
    },
    bikie: {
      title: 'Bikie Fight!',
      health: 120,
      damage: 30,
      specialMoves: {
        quickStrike: { energyCost: 20, damage: 25, description: "Chain swing" },
        heavyBlow: { energyCost: 35, damage: 40, description: "Crushing blow" },
        defensive: { energyCost: 25, damage: 15, description: "Intimidating stance" },
        adrenaline: { energyCost: 30, damage: 30, description: "Bikie rage" }
      }
    },
    dealer: {
      title: 'Dealer Fight!',
      health: 70,
      damage: 15,
      specialMoves: {
        quickStrike: { energyCost: 20, damage: 15, description: "Quick knife slash" },
        heavyBlow: { energyCost: 35, damage: 25, description: "Desperate attack" },
        defensive: { energyCost: 25, damage: 10, description: "Evasive maneuver" },
        adrenaline: { energyCost: 30, damage: 20, description: "Dealer's fury" }
      }
    }
  };

  const config = opponentConfigs[opponentType];
  
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(config.health);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [playerStatusEffects, setPlayerStatusEffects] = useState<StatusEffect[]>([]);
  const [opponentStatusEffects, setOpponentStatusEffects] = useState<StatusEffect[]>([]);

  // New: Helper function to map effect type to a FontAwesome icon
  const getStatusIcon = (effectType: string) => {
    switch(effectType) {
      case 'stun':
        return faDizzy;
      case 'bleed':
        return faTint;
      case 'defense':
        return faShieldAlt;
      case 'rage':
        return faFire;
      default:
        return faBolt; // fallback if effect not recognized
    }
  };

  // Process status effects and regenerate energy
  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (gameState !== 'playing') return;

      // Process status effects first
      processStatusEffects(playerStatusEffects, setPlayerStatusEffects, setGameMessage);
      processStatusEffects(opponentStatusEffects, setOpponentStatusEffects, setGameMessage);

      // Only set bleeding message if there are no other status effects being processed
      if (opponentStatusEffects.some(e => e.effect === 'bleed') && 
          !playerStatusEffects.some(e => e.effect === 'rage' || e.effect === 'defense')) {
        setOpponentHealth(prev => Math.max(0, prev - 5));
        setGameMessage('Opponent is bleeding!');
      }

      // Regenerate energy faster
      setPlayerEnergy(prev => Math.min(100, prev + 8)); // Increased from 5
    }, 1000);

    return () => clearInterval(gameLoop);
  }, [gameState, opponentStatusEffects, playerStatusEffects]);

  // Check win/loss conditions
  useEffect(() => {
    if (playerHealth <= 0) {
      setGameState('defeat');
      // Delay calling onComplete, so the defeat message remains visible for 3 seconds
      setTimeout(() => {
        onComplete(false);
      }, 3000);
    } else if (opponentHealth <= 0) {
      setGameState('victory');
      // Delay calling onComplete, so the victory message remains visible for 4 seconds
      setTimeout(() => {
        onComplete(true);
      }, 4000);
    }
  }, [playerHealth, opponentHealth, onComplete]);

  const executeMove = (moveType: string) => {
    if (playerStatusEffects.some(e => e.effect === 'stun')) {
      setGameMessage("You're stunned!");
      return;
    }
    
    const move = config.specialMoves[moveType as keyof typeof config.specialMoves];
    
    if (playerEnergy < move.energyCost) {
      setGameMessage('Not enough energy!');
      return;
    }

    setPlayerEnergy(prev => prev - move.energyCost);
    
    // Calculate damage with modifiers
    let damage = move.damage || 0;

    // Apply rage effect (increased damage)
    if (playerStatusEffects.some(e => e.effect === 'rage')) {
      damage *= 1.5;
      setGameMessage('Rage increases your damage!');
    }
    
    // Apply defense reduction
    if (opponentStatusEffects.some(e => e.effect === 'defense')) {
      damage *= 0.7; // Reduced from 0.5 to make it more player-friendly
    }

    // Apply special move effects with improved chances
    switch (moveType) {
      case 'heavyBlow':
        if (Math.random() < 0.5) { // Increased from 0.4
          setOpponentStatusEffects(prev => [...prev, { name: 'Stunned', duration: 2, effect: 'stun' }]);
          setGameMessage('Heavy blow stunned the opponent!');
        }
        break;
      case 'defensive':
        setPlayerStatusEffects(prev => [...prev, { name: 'Defensive', duration: 3, effect: 'defense' }]);
        setGameMessage('Defensive stance activated!');
        break;
      case 'adrenaline':
        setPlayerStatusEffects(prev => [...prev, { name: 'Rage', duration: 3, effect: 'rage' }]); // Increased from 2
        setGameMessage('Adrenaline rush activated!');
        break;
    }

    // Apply damage to opponent
    setOpponentHealth(prev => {
      const newHealth = Math.max(0, prev - damage);
      return newHealth;
    });

    // Opponent counter-attack with reduced chance and damage
    if (!opponentStatusEffects.some(e => e.effect === 'stun')) {
      if (Math.random() < 0.15) { // Reduced from 0.2
        setPlayerStatusEffects(prev => [...prev, { name: 'Stunned', duration: 1, effect: 'stun' }]); // Reduced from 2
        setGameMessage('You were stunned by the counter-attack!');
      }
      
      // Reduce opponent damage and increase defense effect
      const counterDamage = config.damage * (playerStatusEffects.some(e => e.effect === 'defense') ? 0.4 : 0.8); // More effective defense
      setPlayerHealth(prev => Math.max(0, prev - counterDamage));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg shadow-lg p-6 max-w-md w-full relative">
        {/* Close button */}
        {gameState !== 'playing' && (
          <button 
            onClick={() => onComplete(gameState === 'victory')}
            className="absolute top-2 right-2 text-text/60 hover:text-text transition-colors"
            aria-label="Close combat minigame"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <h3 className="text-xl font-bold mb-4">
          {gameState === 'playing' && config.title}
          {gameState === 'victory' && '🎉 Victory!'}
          {gameState === 'defeat' && '💀 Defeat!'}
        </h3>
        
        {/* Enhanced victory/defeat screen */}
        {gameState !== 'playing' ? (
          <div className="flex flex-col items-center justify-center py-6 animate-pulse">
            {gameState === 'victory' ? (
              <>
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-green-400 mb-4 text-center animate-bounce">
                  VICTORY!
                </h2>
                <p className="text-center text-lg mb-4">
                  You defeated your opponent with skill and strength!
                </p>
                <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-green-500 animate-pulse w-full" />
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-3xl font-bold text-red-400 mb-4 text-center">
                  DEFEAT
                </h2>
                <p className="text-center text-lg mb-4">
                  You were overwhelmed in battle. Better luck next time.
                </p>
                <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-red-500 animate-pulse w-full" />
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 space-y-2">
              <div className="flex justify-between">
                <span>You:</span>
                <span className="font-bold" data-testid="player-health">{playerHealth}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300" 
                  style={{ width: `${playerHealth}%` }}
                />
              </div>
              <div className="flex justify-between">
                <span>Energy:</span>
                <span className="font-bold" data-testid="player-energy">{playerEnergy}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${playerEnergy}%` }}
                />
              </div>
              <div className="flex justify-between">
                <span>Opponent:</span>
                <span className="font-bold" data-testid="opponent-health">{opponentHealth}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-300" 
                  style={{ width: `${opponentHealth}%` }}
                />
              </div>
            </div>

            {/* Status Effect Display */}
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">Your Effects:</span>
                  {playerStatusEffects.length > 0 ? playerStatusEffects.map((effect, idx) => (
                    <div key={effect.name + idx} className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getStatusIcon(effect.effect)} 
                        title={`${effect.effect} (${effect.duration})`} 
                        className={`text-lg ${effect.effect === 'stun' ? 'text-red-500' : 'text-primary'}`} 
                      />
                      <span className="text-xs ml-1">{effect.duration}</span>
                    </div>
                  )) : <span className="text-xs text-text/60">None</span>}
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">Opponent Effects:</span>
                  {opponentStatusEffects.length > 0 ? opponentStatusEffects.map((effect, idx) => (
                    <div key={effect.name + idx} className="flex items-center">
                      <FontAwesomeIcon 
                        data-testid={`opponent-status-effect-${effect.effect}`}
                        icon={getStatusIcon(effect.effect)} 
                        title={`${effect.effect} (${effect.duration})`} 
                        className={`text-lg ${effect.effect === 'stun' ? 'text-red-500' : 'text-primary'}`} 
                      />
                      <span className="text-xs ml-1">{effect.duration}</span>
                    </div>
                  )) : <span className="text-xs text-text/60">None</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CombatButton
                moveType="Quick Strike"
                move={config.specialMoves.quickStrike}
                icon={faBolt}
                disabled={playerEnergy < config.specialMoves.quickStrike.energyCost || playerStatusEffects.some(e => e.effect === 'stun')}
                onClick={() => executeMove('quickStrike')}
              />
              <CombatButton
                moveType="Heavy Blow"
                move={config.specialMoves.heavyBlow}
                icon={faDumbbell}
                disabled={playerEnergy < config.specialMoves.heavyBlow.energyCost || playerStatusEffects.some(e => e.effect === 'stun')}
                onClick={() => executeMove('heavyBlow')}
              />
              <CombatButton
                moveType="Defensive"
                move={config.specialMoves.defensive}
                icon={faShieldHalved}
                disabled={playerEnergy < config.specialMoves.defensive.energyCost || playerStatusEffects.some(e => e.effect === 'stun')}
                onClick={() => executeMove('defensive')}
              />
              <CombatButton
                moveType="Adrenaline"
                move={config.specialMoves.adrenaline}
                icon={faPersonRunning}
                disabled={playerEnergy < config.specialMoves.adrenaline.energyCost || playerStatusEffects.some(e => e.effect === 'stun')}
                onClick={() => executeMove('adrenaline')}
              />
            </div>
          </>
        )}

        {gameMessage && gameState === 'playing' && (
          <p className="mt-4 text-center font-bold text-primary">{gameMessage}</p>
        )}
      </div>
    </div>
  );
}; 