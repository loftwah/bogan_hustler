import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';

interface Props {
  onComplete: (success: boolean) => void;
  opponentType: 'police' | 'gang' | 'bikie' | 'dealer';
}

export const CombatMinigame = ({ onComplete, opponentType }: Props) => {
  const opponentConfigs = {
    police: {
      title: 'Police Fight!',
      health: 100,
      damage: 20,
      specialMoves: {
        quickStrike: { energyCost: 20, description: "Quick jab to create distance" },
        heavyBlow: { energyCost: 35, description: "Powerful strike to stun" },
        defensive: { energyCost: 25, description: "Defensive stance" },
        adrenaline: { energyCost: 30, description: "Fight or flight response" }
      }
    },
    gang: {
      title: 'Gang Fight!',
      health: 80,
      damage: 25,
      specialMoves: {
        quickStrike: { energyCost: 20, description: "Street fighting combo" },
        heavyBlow: { energyCost: 35, description: "Brutal gang attack" },
        defensive: { energyCost: 25, description: "Block and counter" },
        adrenaline: { energyCost: 30, description: "Gang fury" }
      }
    },
    bikie: {
      title: 'Bikie Fight!',
      health: 120,
      damage: 30,
      specialMoves: {
        quickStrike: { energyCost: 20, description: "Chain swing" },
        heavyBlow: { energyCost: 35, description: "Crushing blow" },
        defensive: { energyCost: 25, description: "Intimidating stance" },
        adrenaline: { energyCost: 30, description: "Bikie rage" }
      }
    },
    dealer: {
      title: 'Dealer Fight!',
      health: 70,
      damage: 15,
      specialMoves: {
        quickStrike: { energyCost: 20, description: "Quick knife slash" },
        heavyBlow: { energyCost: 35, description: "Desperate attack" },
        defensive: { energyCost: 25, description: "Evasive maneuver" },
        adrenaline: { energyCost: 30, description: "Dealer's fury" }
      }
    }
  };

  const config = opponentConfigs[opponentType];
  
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(config.health);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [isStunned, setIsStunned] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');

  useEffect(() => {
    if (playerHealth <= 0) {
      setGameState('defeat');
      onComplete(false);
    } else if (opponentHealth <= 0) {
      setGameState('victory');
      onComplete(true);
    }
  }, [playerHealth, opponentHealth, onComplete]);

  const executeMove = (moveType: string) => {
    if (isStunned) return;
    
    const move = config.specialMoves[moveType as keyof typeof config.specialMoves];
    if (playerEnergy < move.energyCost) return;

    setPlayerEnergy(prev => prev - move.energyCost);
    
    // Basic damage calculation
    const damage = Math.floor(Math.random() * 20) + 10;
    setOpponentHealth(prev => Math.max(0, prev - damage));

    // Opponent counter-attack
    if (Math.random() < 0.2) {
      setIsStunned(true);
      setTimeout(() => setIsStunned(false), 2000);
    }
    setPlayerHealth(prev => Math.max(0, prev - config.damage));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg shadow-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {gameState === 'playing' && config.title}
          {gameState === 'victory' && 'You Won!'}
          {gameState === 'defeat' && 'You Lost!'}
        </h3>

        <div className="mb-4 space-y-2">
          <div>You: {playerHealth}%</div>
          <div>Energy: {playerEnergy}%</div>
          <div>Opponent: {opponentHealth}%</div>
        </div>

        {gameState === 'playing' && (
          <button
            onClick={() => executeMove('quickStrike')}
            disabled={playerEnergy < config.specialMoves.quickStrike.energyCost || isStunned}
            className="btn btn-primary flex items-center justify-center"
            title={config.specialMoves.quickStrike.description}
          >
            <FontAwesomeIcon icon={faBolt} className="mr-2" />
            Quick Strike ({config.specialMoves.quickStrike.energyCost})
          </button>
        )}
      </div>
    </div>
  );
}; 