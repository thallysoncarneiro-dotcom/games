import React, { useEffect, useState } from 'react';
import { CombatState, Combatant, Character } from '../types';

interface CombatInterfaceProps {
  combatState: CombatState;
  character: Character; // To update player HP
  onCombatUpdate: (newState: CombatState) => void;
  onEndCombat: () => void;
  onLogAction: (text: string) => void; // To send to Chat/AI
}

export const CombatInterface: React.FC<CombatInterfaceProps> = ({ 
  combatState, 
  character,
  onCombatUpdate, 
  onEndCombat,
  onLogAction 
}) => {
  const [currentActor, setCurrentActor] = useState<Combatant | null>(null);

  useEffect(() => {
    if (combatState.participants.length > 0) {
      setCurrentActor(combatState.participants[combatState.turnIndex]);
    }
  }, [combatState.turnIndex, combatState.participants]);

  // AI Turn Logic
  useEffect(() => {
    if (currentActor && currentActor.type === 'monster') {
      const timer = setTimeout(() => {
        monsterTurn();
      }, 1500); // Delay for dramatic effect
      return () => clearTimeout(timer);
    }
  }, [currentActor]);

  const monsterTurn = () => {
    // Simple AI: Attacks the player
    const target = combatState.participants.find(p => p.type === 'player');
    if (!target || !currentActor) return;

    // Roll to hit (d20 + ~3 modifier assumption for MVP)
    const roll = Math.floor(Math.random() * 20) + 1;
    const hit = roll + 3 >= target.ac;
    
    let damage = 0;
    let logMsg = '';

    if (hit) {
      damage = Math.floor(Math.random() * 6) + 2; // d6+2
      logMsg = `👹 ${currentActor.name} atacou ${target.name} (Rolou ${roll}+3 vs CA ${target.ac}) e acertou causando ${damage} de dano!`;
    } else {
      logMsg = `👹 ${currentActor.name} atacou ${target.name} (Rolou ${roll}+3) mas errou!`;
    }

    applyDamage(target.id, damage, logMsg);
  };

  const playerAttack = () => {
    if (!currentActor) return;
    const target = combatState.participants.find(p => p.type === 'monster'); // Auto-target first monster for MVP
    if (!target) return;

    // Calculate modifier based on Character Stats (Str usually)
    const strMod = Math.floor((character.stats.str - 10) / 2);
    const roll = Math.floor(Math.random() * 20) + 1;
    const totalHit = roll + strMod;
    
    let damage = 0;
    let logMsg = '';

    if (totalHit >= target.ac) {
      // Parse damage from weapon or default to 1d4 (unarmed)
      const weaponDmg = character.equipment.weapon?.damage || '1d4';
      // Simple parse: assume "1dX" format
      const dieSides = parseInt(weaponDmg.split('d')[1]);
      const dmgRoll = Math.floor(Math.random() * dieSides) + 1;
      
      damage = dmgRoll + strMod;
      logMsg = `⚔️ Você atacou ${target.name} com ${character.equipment.weapon?.name || 'punhos'} (Rolou ${roll}+${strMod} = ${totalHit}) e CAUSOU ${damage} de dano!`;
    } else {
      logMsg = `⚔️ Você atacou ${target.name} (Rolou ${roll}+${strMod} = ${totalHit}) mas a armadura dele protegeu!`;
    }

    applyDamage(target.id, damage, logMsg);
  };

  const applyDamage = (targetId: string, amount: number, logMessage: string) => {
    const updatedParticipants = combatState.participants.map(p => {
      if (p.id === targetId) {
        return { ...p, hp: { ...p.hp, current: Math.max(0, p.hp.current - amount) } };
      }
      return p;
    });

    onLogAction(logMessage);

    // Check deaths
    const stillAlive = updatedParticipants.filter(p => p.hp.current > 0);
    const playerAlive = stillAlive.some(p => p.type === 'player');
    const monstersAlive = stillAlive.some(p => p.type === 'monster');

    if (!playerAlive) {
      onLogAction("💀 Você caiu em combate...");
      onEndCombat(); // Or game over state
      return;
    }

    if (!monstersAlive) {
      onLogAction("🏆 Vitória! Todos os inimigos foram derrotados.");
      onEndCombat();
      return;
    }

    // Next Turn
    const nextIndex = (combatState.turnIndex + 1) % combatState.participants.length;
    const nextRound = nextIndex === 0 ? combatState.round + 1 : combatState.round;

    onCombatUpdate({
      ...combatState,
      participants: updatedParticipants,
      turnIndex: nextIndex,
      round: nextRound,
      log: [...combatState.log, logMessage].slice(-5) // Keep last 5 logs
    });
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/90 flex flex-col p-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-red-900 pb-2 mb-4">
        <h2 className="text-2xl font-fantasy text-red-500 tracking-widest animate-pulse">COMBATE - Rodada {combatState.round}</h2>
        <button onClick={onEndCombat} className="text-xs text-gray-500 hover:text-white">Fugir</button>
      </div>

      {/* Battlefield */}
      <div className="flex-1 flex flex-col justify-center gap-6 max-w-3xl mx-auto w-full">
        {combatState.participants.map((p, idx) => {
          const isActive = idx === combatState.turnIndex;
          const isPlayer = p.type === 'player';
          const hpPercent = (p.hp.current / p.maxHp) * 100;

          return (
            <div 
              key={p.id} 
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-500
                ${isActive ? 'border-yellow-500 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-gray-800 opacity-80'}
                ${isPlayer ? 'bg-blue-900/40 ml-10' : 'bg-red-900/40 mr-10 text-right'}
              `}
            >
              <div className={`flex items-center gap-4 ${!isPlayer ? 'flex-row-reverse' : ''}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${isPlayer ? 'bg-blue-600' : 'bg-red-600'}`}>
                   {isPlayer ? '🧙‍♂️' : '👹'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-bold text-lg">{p.name}</span>
                    <span className="font-mono text-sm">{p.hp.current}/{p.maxHp} HP</span>
                  </div>
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${isPlayer ? 'bg-blue-500' : 'bg-red-500'}`} 
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {isActive && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  TURNO ATUAL
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Combat Log */}
      <div className="h-24 overflow-y-auto bg-black/50 p-2 rounded border border-gray-800 mb-4 font-mono text-xs text-gray-400">
        {combatState.log.map((entry, i) => (
          <div key={i} className="mb-1">{entry}</div>
        ))}
      </div>

      {/* Player Actions Controls */}
      {currentActor?.type === 'player' ? (
        <div className="grid grid-cols-3 gap-4 h-20">
          <button 
            onClick={playerAttack}
            className="bg-red-700 hover:bg-red-600 border border-red-500 text-white font-bold rounded text-xl flex flex-col items-center justify-center shadow-lg active:scale-95"
          >
            <span>⚔️ ATACAR</span>
            <span className="text-xs font-normal opacity-75">{character.equipment.weapon?.damage || '1d4'} + {Math.floor((character.stats.str - 10) / 2)}</span>
          </button>
          <button 
             onClick={() => applyDamage(currentActor.id, -5, "Você bebeu uma poção e recuperou 5 HP.")}
             className="bg-blue-700 hover:bg-blue-600 border border-blue-500 text-white font-bold rounded text-xl shadow-lg active:scale-95"
          >
            🧪 ITEM
          </button>
           <button 
             onClick={() => applyDamage(currentActor.id, 0, "Você assumiu postura defensiva.")}
             className="bg-gray-700 hover:bg-gray-600 border border-gray-500 text-white font-bold rounded text-xl shadow-lg active:scale-95"
          >
            🛡️ DEFESA
          </button>
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center text-gray-500 italic animate-pulse">
          Aguardando ação do inimigo...
        </div>
      )}
    </div>
  );
};