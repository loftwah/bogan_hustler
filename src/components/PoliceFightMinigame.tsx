import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';

interface Props {
  onComplete: (success: boolean) => void;
}

interface StatusEffect {
  name: string;
  duration: number;
  effect: 'stun' | 'bleed' | 'defense' | 'rage';
}

const specialMoves = {
  quickStrike: { energyCost: 20, description: "Fast attack with moderate damage" },
  heavyBlow: { energyCost: 35, description: "Slow but powerful attack" },
  defensive: { energyCost: 25, description: "Increase defense temporarily" },
  adrenaline: { energyCost: 30, description: "Boost damage output" }
};

export const PoliceFightMinigame = ({ onComplete }: Props) => {
  const [playerHealth, setPlayerHealth] = useState(100);
  const [copHealth, setCopHealth] = useState(100);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [playerStatusEffects, setPlayerStatusEffects] = useState<StatusEffect[]>([]);
  const [copStatusEffects, setCopStatusEffects] = useState<StatusEffect[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');

  const gameOver = gameState !== 'playing';

  useEffect(() => {
    // Process status effects each turn
    const interval = setInterval(() => {
      setPlayerStatusEffects(prev => prev.map(effect => ({
        ...effect,
        duration: effect.duration - 1
      })).filter(effect => effect.duration > 0));

      setCopStatusEffects(prev => prev.map(effect => ({
        ...effect,
        duration: effect.duration - 1
      })).filter(effect => effect.duration > 0));

      // Apply bleeding damage here directly instead of separate function
      if (copStatusEffects.some(e => e.effect === 'bleed')) {
        setCopHealth(prev => Math.max(0, prev - 5));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [copStatusEffects]);

  useEffect(() => {
    // Regenerate energy over time
    const energyRegen = setInterval(() => {
      if (!gameOver) {
        setPlayerEnergy(prev => Math.min(100, prev + 5));
      }
    }, 1000);

    return () => clearInterval(energyRegen);
  }, [gameOver]);

  const isStunned = (effects: StatusEffect[]) => 
    effects.some(effect => effect.effect === 'stun');

  const calculateDamage = (baseDamage: number, attacker: 'player' | 'cop') => {
    const effects = attacker === 'player' ? playerStatusEffects : copStatusEffects;
    const defenderEffects = attacker === 'player' ? copStatusEffects : playerStatusEffects;
    
    let damage = baseDamage;

    // Apply rage buff
    if (effects.some(e => e.effect === 'rage')) {
      damage *= 1.5;
    }

    // Apply defense reduction
    if (defenderEffects.some(e => e.effect === 'defense')) {
      damage *= 0.5;
    }

    return Math.round(damage);
  };

  const executeMove = (moveName: keyof typeof specialMoves) => {
    const move = specialMoves[moveName];
    if (playerEnergy < move.energyCost) {
      setGameMessage("Not enough energy!");
      return;
    }

    setPlayerEnergy(prev => prev - move.energyCost);

    // Handle the move effects
    switch (moveName) {
      case 'quickStrike': {
        const damage = calculateDamage(25, 'player');
        setCopHealth(prev => Math.max(0, prev - damage));
        break;
      }
      case 'heavyBlow': {
        const damage = calculateDamage(40, 'player');
        setCopHealth(prev => Math.max(0, prev - damage));
        setCopStatusEffects(prev => [...prev, { name: 'Bleeding', duration: 3, effect: 'bleed' }]);
        break;
      }
      case 'defensive':
        setPlayerStatusEffects(prev => [...prev, { name: 'Defensive', duration: 2, effect: 'defense' }]);
        setGameMessage("Defense up!");
        break;
      case 'adrenaline':
        setPlayerStatusEffects(prev => [...prev, { name: 'Rage', duration: 3, effect: 'rage' }]);
        setGameMessage("Damage boosted!");
        break;
    }

    // Cop's counter-attack
    const copDamage = calculateDamage(20, 'cop');
    setPlayerHealth(prev => Math.max(0, prev - copDamage));

    // Check win/loss conditions
    if (copHealth <= 0) {
      onComplete(true);
    } else if (playerHealth <= 0) {
      onComplete(false);
    }
  };

  useEffect(() => {
    if (playerHealth <= 0) {
      setGameState('defeat');
      onComplete(false);
    } else if (copHealth <= 0) {
      setGameState('victory');
      onComplete(true);
    }
  }, [playerHealth, copHealth, onComplete]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg shadow-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {gameState === 'playing' && 'Police Fight!'}
          {gameState === 'victory' && 'You Won!'}
          {gameState === 'defeat' && 'You Lost!'}
        </h3>

        {/* Status Effects Display */}
        <div className="flex justify-between mb-4 text-sm">
          <div>
            {playerStatusEffects.map((effect, i) => (
              <span key={i} className="mr-2 px-2 py-1 bg-primary/20 rounded">
                {effect.name} ({effect.duration})
              </span>
            ))}
          </div>
          <div>
            {copStatusEffects.map((effect, i) => (
              <span key={i} className="mr-2 px-2 py-1 bg-red-500/20 rounded">
                {effect.name} ({effect.duration})
              </span>
            ))}
          </div>
        </div>

        {/* Health Bars */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="text-sm mb-1">You: {playerHealth}% | Energy: {playerEnergy}%</div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${playerHealth}%` }}
              />
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${playerEnergy}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-sm mb-1">Cop: {copHealth}%</div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${copHealth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Special Moves */}
        {!gameOver && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => executeMove('quickStrike')}
              disabled={playerEnergy < specialMoves.quickStrike.energyCost || isStunned(playerStatusEffects)}
              className="btn btn-primary flex items-center justify-center"
              title={specialMoves.quickStrike.description}
            >
              <FontAwesomeIcon icon={faBolt} className="mr-2" />
              Quick Strike ({specialMoves.quickStrike.energyCost})
            </button>
            <button
              onClick={() => executeMove('heavyBlow')}
              disabled={playerEnergy < specialMoves.heavyBlow.energyCost || isStunned(playerStatusEffects)}
              className="btn btn-primary flex items-center justify-center"
              title={specialMoves.heavyBlow.description}
            >
              <FontAwesomeIcon icon={faBolt} className="mr-2" />
              Heavy Blow ({specialMoves.heavyBlow.energyCost})
            </button>
            <button
              onClick={() => executeMove('defensive')}
              disabled={playerEnergy < specialMoves.defensive.energyCost || isStunned(playerStatusEffects)}
              className="btn btn-primary flex items-center justify-center"
              title={specialMoves.defensive.description}
            >
              <FontAwesomeIcon icon={faBolt} className="mr-2" />
              Defensive ({specialMoves.defensive.energyCost})
            </button>
            <button
              onClick={() => executeMove('adrenaline')}
              disabled={playerEnergy < specialMoves.adrenaline.energyCost || isStunned(playerStatusEffects)}
              className="btn btn-primary flex items-center justify-center"
              title={specialMoves.adrenaline.description}
            >
              <FontAwesomeIcon icon={faBolt} className="mr-2" />
              Adrenaline ({specialMoves.adrenaline.energyCost})
            </button>
          </div>
        )}

        {gameMessage && (
          <p className="mt-4 text-center font-bold">{gameMessage}</p>
        )}
      </div>
    </div>
  );
}; 