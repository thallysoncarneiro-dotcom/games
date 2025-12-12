
import React from 'react';
import { Character } from '../types';

interface PlayerProfileProps {
  character: Character;
  compact?: boolean;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ character, compact = false }) => {
  const hpPercent = (character.hp.current / character.hp.max) * 100;
  const mpPercent = (character.mp.current / character.mp.max) * 100;
  const xpPercent = (character.xp.current / character.xp.max) * 100;

  return (
    <div className={`flex items-center gap-3 bg-rpg-800 border-rpg-700 rounded-lg shadow-md ${compact ? 'p-2 border' : 'p-3 border-b md:border'}`}>
      {/* Avatar / Class Icon */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-rpg-700 border-2 border-rpg-accent flex items-center justify-center overflow-hidden">
          <span className="text-xl md:text-2xl">
             {character.class.toLowerCase().includes('mago') ? '🧙‍♂️' : 
              character.class.toLowerCase().includes('guerreiro') ? '⚔️' :
              character.class.toLowerCase().includes('arqueiro') ? '🏹' : 
              character.class.toLowerCase().includes('ladrão') ? '🗡️' : '👤'}
          </span>
        </div>
        <div className="absolute -bottom-1 -right-1 bg-rpg-900 text-white text-[10px] px-1.5 rounded-full border border-rpg-700">
           Lv{character.level}
        </div>
      </div>

      {/* Info & Bars */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white truncate leading-tight">{character.name || 'Sem Nome'}</h3>
        <p className="text-[10px] text-rpg-sub truncate mb-1">{character.race} {character.class}</p>
        
        <div className="flex flex-col gap-1 w-full max-w-[150px]">
             {/* HP Bar */}
             <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden relative" title={`HP: ${character.hp.current}/${character.hp.max}`}>
                 <div className="absolute inset-0 bg-red-600 transition-all duration-500" style={{ width: `${hpPercent}%` }}></div>
             </div>
             {/* MP Bar */}
             <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden relative" title={`MP: ${character.mp.current}/${character.mp.max}`}>
                 <div className="absolute inset-0 bg-blue-600 transition-all duration-500" style={{ width: `${mpPercent}%` }}></div>
             </div>
        </div>
      </div>
      
      {/* XP Ring (Optional visual flair) */}
      {!compact && (
          <div className="hidden md:flex flex-col items-center justify-center ml-2">
               <div className="text-[10px] text-yellow-500 font-bold">XP</div>
               <div className="w-8 h-1 bg-gray-900 rounded-full overflow-hidden">
                   <div className="h-full bg-yellow-500" style={{ width: `${xpPercent}%` }}></div>
               </div>
          </div>
      )}
    </div>
  );
};
