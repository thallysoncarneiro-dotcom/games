
import React, { useEffect, useState } from 'react';
import { CombatState, Combatant, Character } from '../types';

interface CombatInterfaceProps {
  combatState: CombatState;
  character: Character; 
  onCombatUpdate: (newState: CombatState) => void;
  onEndCombat: () => void;
  onVictory: (monsterId: string) => void; 
  onLogAction: (text: string) => void;
}

export const CombatInterface: React.FC<CombatInterfaceProps> = ({ 
  combatState, 
  character,
  onCombatUpdate, 
  onEndCombat,
  onVictory,
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
        // Prevent action if combat ended in the meantime
        if (combatState.isActive) {
             monsterTurn();
        }
      }, 1500); 
      return () => clearTimeout(timer);
    }
  }, [currentActor, combatState.isActive]);

  const parseDamage = (damageString: string): number => {
    try {
        let count = 1;
        let sides = 6;
        const normalized = damageString.toLowerCase().trim();

        if (normalized.includes('d')) {
            const parts = normalized.split('d');
            // Handle cases like "1d6" or "2d8" or weird "1dd6d" from old data
            if (parts.length >= 2) {
                 const part1 = parts[0].replace(/[^0-9]/g, '');
                 const part2 = parts[1].replace(/[^0-9]/g, '');
                 
                 count = parseInt(part1) || 1;
                 sides = parseInt(part2) || 6;
            }
        } else {
             return parseInt(normalized) || 1;
        }

        let total = 0;
        for(let i=0; i< count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total;
    } catch (e) {
        return 1;
    }
  };

  const monsterTurn = () => {
    const target = combatState.participants.find(p => p.type === 'player');
    if (!target || !currentActor) return;

    const roll = Math.floor(Math.random() * 20) + 1;
    const hit = roll + 3 >= target.ac;
    
    let damage = 0;
    let logMsg = '';

    if (hit) {
      const baseDmg = Math.floor(Math.random() * 6) + 2; 
      const estimatedLevel = Math.floor(currentActor.maxHp / 10);
      const levelBonus = Math.floor(estimatedLevel / 10) * 2;

      damage = baseDmg + levelBonus;
      logMsg = `👹 ${currentActor.name} acertou ${target.name} causando ${damage} de dano!`;
    } else {
      logMsg = `👹 ${currentActor.name} errou o ataque em ${target.name}.`;
    }

    applyDamage(target.id, damage, logMsg);
  };

  const playerAttack = (isHeavy: boolean) => {
    if (!currentActor) return;
    const target = combatState.participants.find(p => p.type === 'monster'); 
    if (!target) return;

    const forMod = Math.floor((character.stats.for - 10) / 2);
    const agiMod = Math.floor((character.stats.agi - 10) / 2);

    const roll = Math.floor(Math.random() * 20) + 1;
    const totalHit = roll + agiMod;
    
    let damage = 0;
    let logMsg = '';

    if (totalHit >= target.ac) {
      const weaponDmg = character.equipment.mainHand?.damage || '1d4'; 
      let dmgValue = parseDamage(weaponDmg);
      
      if (isHeavy) dmgValue = Math.floor(dmgValue * 1.5);
      
      damage = Math.max(1, dmgValue + forMod);
      
      // Milk Buff: +10% Damage
      const hasMilkBuff = character.conditions.includes('Vigor Lácteo');
      if (hasMilkBuff) {
          damage = Math.floor(damage * 1.1);
      }
      
      logMsg = `⚔️ ${isHeavy ? 'ATAQUE PESADO' : 'Ataque'} em ${target.name} (Rolou ${totalHit}) -> DANO: ${damage}! ${hasMilkBuff ? '(+10% Vigor)' : ''}`;
    } else {
      logMsg = `⚔️ ${isHeavy ? 'Ataque Pesado' : 'Ataque'} errou ${target.name} (Rolou ${totalHit}).`;
    }

    applyDamage(target.id, damage, logMsg);
  };

  const applyDamage = (targetId: string, amount: number, logMessage: string) => {
    if (!combatState.isActive) return;

    const updatedParticipants = combatState.participants.map(p => {
      if (p.id === targetId) {
        return { ...p, hp: { ...p.hp, current: Math.max(0, p.hp.current - amount) } };
      }
      return p;
    });

    onLogAction(logMessage);

    const stillAlive = updatedParticipants.filter(p => p.hp.current > 0);
    const playerAlive = stillAlive.some(p => p.type === 'player');
    const monstersAlive = stillAlive.some(p => p.type === 'monster');

    if (!playerAlive) {
      onEndCombat(); 
      return;
    }

    if (!monstersAlive) {
      const monsterCombatant = combatState.participants.find(p => p.type === 'monster');
      if (monsterCombatant) {
          onVictory(monsterCombatant.id); 
      } else {
          onEndCombat();
      }
      return;
    }

    const nextIndex = (combatState.turnIndex + 1) % combatState.participants.length;
    const nextRound = nextIndex === 0 ? combatState.round + 1 : combatState.round;

    onCombatUpdate({
      ...combatState,
      participants: updatedParticipants,
      turnIndex: nextIndex,
      round: nextRound,
      log: [...combatState.log, logMessage].slice(-5) 
    });
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/90 flex flex-col p-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-red-900 pb-2 mb-4 shrink-0">
        <h2 className="text-xl md:text-2xl font-fantasy text-red-500 tracking-widest animate-pulse">COMBATE - Rodada {combatState.round}</h2>
        <button onClick={onEndCombat} className="text-xs text-gray-500 hover:text-white p-2">Fugir</button>
      </div>

      <div className="flex-1 flex flex-col gap-4 max-w-3xl mx-auto w-full overflow-y-auto pb-4">
        {combatState.participants.map((p, idx) => {
          const isActive = idx === combatState.turnIndex;
          const isPlayer = p.type === 'player';
          const hpPercent = (p.hp.current / p.maxHp) * 100;

          return (
            <div 
              key={p.id} 
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-500 shrink-0
                ${isActive ? 'border-yellow-500 scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-gray-800 opacity-80'}
                ${isPlayer ? 'bg-blue-900/40' : 'bg-red-900/40 text-right'}
              `}
            >
              <div className={`flex items-center gap-4 ${!isPlayer ? 'flex-row-reverse' : ''}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${isPlayer ? 'bg-blue-600' : 'bg-red-600'}`}>
                   {isPlayer ? '🧙‍♂️' : '👹'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-bold text-lg truncate">{p.name}</span>
                    <span className="font-mono text-sm whitespace-nowrap">{p.hp.current}/{p.maxHp} HP</span>
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
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  TURNO ATUAL
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-24 overflow-y-auto bg-black/50 p-2 rounded border border-gray-800 mb-4 font-mono text-xs text-gray-400 shrink-0">
        {combatState.log.map((entry, i) => (
          <div key={i} className="mb-1">{entry}</div>
        ))}
      </div>

      {currentActor?.type === 'player' ? (
        <div className="grid grid-cols-2 gap-4 h-28 shrink-0 pb-4">
          <button 
            onClick={() => playerAttack(false)}
            className="bg-red-700 hover:bg-red-600 border border-red-500 text-white font-bold rounded-lg flex flex-col items-center justify-center shadow-lg active:scale-95 touch-manipulation"
          >
            <span className="text-lg">⚔️ NORMAL</span>
            <span className="text-xs font-normal opacity-75">Dano Base ({character.equipment.mainHand?.damage || '1d4'})</span>
          </button>
          <button 
            onClick={() => playerAttack(true)}
            className="bg-orange-700 hover:bg-orange-600 border border-orange-500 text-white font-bold rounded-lg flex flex-col items-center justify-center shadow-lg active:scale-95 touch-manipulation"
          >
            <span className="text-lg">💥 PESADO</span>
            <span className="text-xs font-normal opacity-75">1.5x Dano</span>
          </button>
        </div>
      ) : (
        <div className="h-28 flex items-center justify-center text-gray-500 italic animate-pulse shrink-0 pb-4">
          Aguardando ação do inimigo...
        </div>
      )}
    </div>
  );
};
