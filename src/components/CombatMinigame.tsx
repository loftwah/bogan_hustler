import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faShieldHalved, faPersonRunning, faDumbbell } from '@fortawesome/free-solid-svg-icons';

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

export const CombatMinigame = ({ onComplete, opponentType }: Props) => {
  const opponentConfigs = {
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

  // Process status effects and regenerate energy
  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (gameState !== 'playing') return;

      // Process status effects
      setPlayerStatusEffects(prev => {
        const updated = prev
          .map(effect => ({ ...effect, duration: effect.duration - 1 }))
          .filter(effect => effect.duration > 0);
        
        // Clear status effect message if all effects are gone
        if (prev.length > 0 && updated.length === 0) {
          setGameMessage(null);
        }
        
        return updated;
      });

      setOpponentStatusEffects(prev => {
        const updated = prev
          .map(effect => ({ ...effect, duration: effect.duration - 1 }))
          .filter(effect => effect.duration > 0);
        
        // Clear status effect message if all effects are gone
        if (prev.length > 0 && updated.length === 0) {
          setGameMessage(null);
        }
        
        return updated;
      });

      // Apply damage from effects
      if (opponentStatusEffects.some(e => e.effect === 'bleed')) {
        setOpponentHealth(prev => Math.max(0, prev - 5));
        setGameMessage('Opponent is bleeding!');
      }

      // Regenerate energy
      setPlayerEnergy(prev => Math.min(100, prev + 5));
    }, 1000);

    return () => clearInterval(gameLoop);
  }, [gameState, opponentStatusEffects]);

  // Check win/loss conditions
  useEffect(() => {
    if (playerHealth <= 0) {
      setGameState('defeat');
      setGameMessage('You were defeated!');
      onComplete(false);
    } else if (opponentHealth <= 0) {
      setGameState('victory');
      setGameMessage('Victory!');
      onComplete(true);
    }
  }, [playerHealth, opponentHealth, onComplete]);

  const executeMove = (moveType: string) => {
    if (playerStatusEffects.some(e => e.effect === 'stun')) {
      setGameMessage("You're stunned!");
      return;
    }
    
    const move = config.specialMoves[moveType as keyof typeof config.specialMoves];
    console.log('Move selected:', moveType, move); // Debug log

    if (playerEnergy < move.energyCost) {
      setGameMessage('Not enough energy!');
      return;
    }

    setPlayerEnergy(prev => prev - move.energyCost);
    
    // Calculate damage with modifiers
    let damage = move.damage || 0; // Add default value to prevent NaN
    console.log('Initial damage:', damage); // Debug log

    if (playerStatusEffects.some(e => e.effect === 'rage')) {
      damage *= 1.5;
    }
    if (opponentStatusEffects.some(e => e.effect === 'defense')) {
      damage *= 0.5;
    }
    console.log('Modified damage:', damage); // Debug log

    // Apply special move effects
    switch (moveType) {
      case 'heavyBlow':
        if (Math.random() < 0.4) {
          setOpponentStatusEffects(prev => [...prev, { name: 'Stunned', duration: 2, effect: 'stun' }]);
          setGameMessage('Heavy blow stunned the opponent!');
        }
        break;
      case 'defensive':
        setPlayerStatusEffects(prev => [...prev, { name: 'Defensive', duration: 3, effect: 'defense' }]);
        setGameMessage('Defensive stance activated!');
        break;
      case 'adrenaline':
        setPlayerStatusEffects(prev => [...prev, { name: 'Rage', duration: 2, effect: 'rage' }]);
        setGameMessage('Adrenaline rush activated!');
        break;
    }

    console.log('Current opponent health:', opponentHealth); // Debug log
    setOpponentHealth(prev => {
      const newHealth = Math.max(0, prev - damage);
      console.log('New opponent health:', newHealth);
      return newHealth;
    });

    // Opponent counter-attack
    if (!opponentStatusEffects.some(e => e.effect === 'stun')) {
      if (Math.random() < 0.2) {
        setPlayerStatusEffects(prev => [...prev, { name: 'Stunned', duration: 2, effect: 'stun' }]);
        setGameMessage('You were stunned by the counter-attack!');
      }
      const counterDamage = config.damage * (playerStatusEffects.some(e => e.effect === 'defense') ? 0.5 : 1);
      setPlayerHealth(prev => Math.max(0, prev - counterDamage));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg shadow-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {gameState === 'playing' && config.title}
          {gameState === 'victory' && '🎉 Victory!'}
          {gameState === 'defeat' && '💀 Defeat!'}
        </h3>

        <div className="mb-4 space-y-2">
          <div className="flex justify-between">
            <span>You:</span>
            <span className="font-bold" data-testid="player-health">{playerHealth}%</span>
          </div>
          <div className="flex justify-between">
            <span>Energy:</span>
            <span className="font-bold" data-testid="player-energy">{playerEnergy}%</span>
          </div>
          <div className="flex justify-between">
            <span>Opponent:</span>
            <span className="font-bold" data-testid="opponent-health">{opponentHealth}%</span>
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => executeMove('quickStrike')}
              disabled={playerEnergy < config.specialMoves.quickStrike.energyCost || playerStatusEffects.some(e => e.effect === 'stun')}
              className="btn btn-primary flex items-center justify-center"
              title={config.specialMoves.quickStrike.description}
            >
              <FontAwesomeIcon icon={faBolt} className="mr-2" />
              Quick Strike ({config.specialMoves.quickStrike.energyCost})
            </button>

            <button
              onClick={() => executeMove('heavyBlow')}
              disabled={playerEnergy < config.specialMoves.heavyBlow.energyCost || playerStatusEffects.some(e => e.effect === 'stun')}
              className="btn btn-primary flex items-center justify-center"
              title={config.specialMoves.heavyBlow.description}
            >
              <FontAwesomeIcon icon={faDumbbell} className="mr-2" />
              Heavy Blow ({config.specialMoves.heavyBlow.energyCost})
            </button>

            <button
              onClick={() => executeMove('defensive')}
              disabled={playerEnergy < config.specialMoves.defensive.energyCost || playerStatusEffects.some(e => e.effect === 'stun')}
              className="btn btn-primary flex items-center justify-center"
              title={config.specialMoves.defensive.description}
            >
              <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
              Defensive ({config.specialMoves.defensive.energyCost})
            </button>

            <button
              onClick={() => executeMove('adrenaline')}
              disabled={playerEnergy < config.specialMoves.adrenaline.energyCost || playerStatusEffects.some(e => e.effect === 'stun')}
              className="btn btn-primary flex items-center justify-center"
              title={config.specialMoves.adrenaline.description}
            >
              <FontAwesomeIcon icon={faPersonRunning} className="mr-2" />
              Adrenaline ({config.specialMoves.adrenaline.energyCost})
            </button>
          </div>
        )}

        {gameMessage && (
          <p className="mt-4 text-center font-bold text-primary">{gameMessage}</p>
        )}

        {gameState !== 'playing' && (
          <p className="mt-4 text-center">
            {gameState === 'victory' ? 'You won the fight!' : 'Better luck next time!'}
          </p>
        )}
      </div>
    </div>
  );
}; 