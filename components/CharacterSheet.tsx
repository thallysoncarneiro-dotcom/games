import React, { useMemo } from 'react';
import { Character } from '../types';

interface CharacterSheetProps {
  character: Character;
  onChange?: (char: Character) => void;
  readOnly?: boolean;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, onChange, readOnly = false }) => {
  
  const handleChange = (field: keyof Character, value: any) => {
    if (onChange) {
      onChange({ ...character, [field]: value });
    }
  };

  const handleStatChange = (stat: keyof Character['stats'], value: string) => {
    if (onChange) {
      onChange({
        ...character,
        stats: { ...character.stats, [stat]: parseInt(value) || 10 }
      });
    }
  };

  // Calculate final stats including equipment modifiers
  const finalStats = useMemo(() => {
    const stats = { ...character.stats };
    // Add logic here if weapons/armor modify base stats (e.g. gloves of strength)
    // For now we just use base stats for the grid, but display AC separately
    return stats;
  }, [character]);

  const armorClass = useMemo(() => {
    const base = 10;
    const dexMod = Math.floor((character.stats.dex - 10) / 2);
    const armorBonus = character.equipment.armor?.statModifier?.value || 0;
    // If wearing armor, calculation might differ (e.g. light vs heavy), simplified here:
    // Assuming simple D&D: Base (10) + Dex + Armor Item AC Value? 
    // Usually armor REPLACES base calculation. 
    // Let's do: If Armor.value > 0, AC = Armor.Value + (Min(Dex, MaxDex)). 
    // Simplified: If armor equipped, use its AC + Dex (capped at 2 for medium?). 
    // Even simpler for MVP: Base 10 + Dex + Armor Bonus.
    
    // Better logic: If Armor has explicit AC value (e.g. 16), use that. If it's a +1 bonus, add it.
    // Our item data structure implies 'value' is the AC provided.
    if (character.equipment.armor && character.equipment.armor.statModifier?.stat === 'ac') {
        return character.equipment.armor.statModifier.value; 
    }
    return base + dexMod;
  }, [character]);

  const StatBlock = ({ label, value, statKey }: { label: string, value: number, statKey: keyof Character['stats'] }) => (
    <div className="bg-rpg-900 p-2 rounded border border-rpg-700 flex flex-col items-center">
      <label className="text-xs text-rpg-sub uppercase font-bold mb-1">{label}</label>
      {readOnly ? (
        <span className="text-xl font-bold text-rpg-accent">{value}</span>
      ) : (
        <input
          type="number"
          className="w-12 text-center bg-rpg-800 border border-rpg-700 rounded text-white font-bold focus:border-rpg-accent focus:outline-none"
          value={value}
          onChange={(e) => handleStatChange(statKey, e.target.value)}
        />
      )}
      <span className="text-xs text-gray-500 mt-1">
        {Math.floor((value - 10) / 2) >= 0 ? '+' : ''}{Math.floor((value - 10) / 2)}
      </span>
    </div>
  );

  return (
    <div className="bg-rpg-800 p-6 rounded-lg shadow-lg border border-rpg-700 h-full overflow-y-auto">
      <h2 className="text-2xl font-fantasy text-rpg-accent mb-6 border-b border-rpg-700 pb-2">
        {readOnly ? character.name : 'Criar Personagem'}
      </h2>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs text-rpg-sub uppercase mb-1">Nome</label>
          {readOnly ? (
             <p className="text-lg text-white">{character.name}</p>
          ) : (
            <input
              type="text"
              className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white focus:border-rpg-accent focus:outline-none"
              value={character.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Aragorn"
            />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-rpg-sub uppercase mb-1">Raça</label>
               {readOnly ? (
                 <p className="text-white">{character.race}</p>
               ) : (
                 <input
                    type="text"
                    className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white focus:border-rpg-accent focus:outline-none"
                    value={character.race}
                    onChange={(e) => handleChange('race', e.target.value)}
                    placeholder="Ex: Humano"
                  />
               )}
            </div>
            <div>
              <label className="block text-xs text-rpg-sub uppercase mb-1">Classe</label>
              {readOnly ? (
                 <p className="text-white">{character.class}</p>
               ) : (
                  <input
                    type="text"
                    className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white focus:border-rpg-accent focus:outline-none"
                    value={character.class}
                    onChange={(e) => handleChange('class', e.target.value)}
                    placeholder="Ex: Guerreiro"
                  />
               )}
            </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-rpg-sub uppercase mb-3">Atributos</h3>
        <div className="grid grid-cols-3 gap-3">
          <StatBlock label="FOR" value={finalStats.str} statKey="str" />
          <StatBlock label="DES" value={finalStats.dex} statKey="dex" />
          <StatBlock label="CON" value={finalStats.con} statKey="con" />
          <StatBlock label="INT" value={finalStats.int} statKey="int" />
          <StatBlock label="SAB" value={finalStats.wis} statKey="wis" />
          <StatBlock label="CAR" value={finalStats.cha} statKey="cha" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
         <div className="p-2 bg-rpg-900 rounded border border-rpg-700 text-center">
            <span className="block text-xs text-rpg-sub uppercase font-bold">Classe de Armadura</span>
            <span className="text-2xl text-blue-400 font-bold">🛡️ {armorClass}</span>
         </div>
         <div className="p-2 bg-rpg-900 rounded border border-rpg-700 text-center">
            <span className="block text-xs text-rpg-sub uppercase font-bold">Iniciativa</span>
            <span className="text-2xl text-yellow-400 font-bold">⚡ {Math.floor((finalStats.dex - 10) / 2) >= 0 ? '+' : ''}{Math.floor((finalStats.dex - 10) / 2)}</span>
         </div>
      </div>

      {readOnly && (
        <div className="p-4 bg-rpg-900 rounded border border-rpg-700">
          <div className="flex justify-between items-center">
            <span className="text-rpg-sub font-bold">HP (Vida)</span>
            <span className="text-xl text-green-400 font-bold">{character.hp.current} / {character.hp.max}</span>
          </div>
          <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
            <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(0, Math.min(100, (character.hp.current / character.hp.max) * 100))}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};