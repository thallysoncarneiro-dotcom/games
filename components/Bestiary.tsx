import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Monster } from '../types';

interface BestiaryProps {
  monsters: Monster[];
  onAddMonster: (monster: Monster) => void;
  onStartCombat: (monster: Monster) => void;
}

const DEFAULT_MONSTERS: Monster[] = [
  {
    id: 'goblin-1',
    name: 'Goblin Espião',
    hp: { current: 7, max: 7 },
    ac: 15,
    stats: { str: 8, dex: 14 },
    attacks: [{ name: 'Adaga Enferrujada', damage: '1d4+2' }],
    description: 'Pequeno, verde e malicioso.'
  },
  {
    id: 'orc-1',
    name: 'Orc Guerreiro',
    hp: { current: 15, max: 15 },
    ac: 13,
    stats: { str: 16, dex: 12 },
    attacks: [{ name: 'Machado Grande', damage: '1d12+3' }],
    description: 'Brutal e agressivo.'
  }
];

export const Bestiary: React.FC<BestiaryProps> = ({ monsters, onAddMonster, onStartCombat }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newMonster, setNewMonster] = useState<Partial<Monster>>({
    name: '',
    hp: { current: 10, max: 10 },
    ac: 10,
    stats: { str: 10, dex: 10 },
    attacks: [{ name: 'Ataque Básico', damage: '1d6' }],
    description: ''
  });

  const handleCreate = () => {
    if (!newMonster.name) return;
    const monster: Monster = {
      id: uuidv4(),
      name: newMonster.name,
      hp: { current: newMonster.hp?.max || 10, max: newMonster.hp?.max || 10 },
      ac: newMonster.ac || 10,
      stats: newMonster.stats || { str: 10, dex: 10 },
      attacks: newMonster.attacks || [],
      description: newMonster.description || ''
    };
    onAddMonster(monster);
    setIsCreating(false);
    setNewMonster({ name: '', hp: { current: 10, max: 10 }, ac: 10, stats: { str: 10, dex: 10 }, attacks: [{ name: 'Ataque', damage: '1d6' }], description: '' });
  };

  return (
    <div className="flex flex-col h-full bg-rpg-800 text-white p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-fantasy text-rpg-accent">Bestiário</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="text-xs bg-rpg-700 hover:bg-rpg-600 px-3 py-1 rounded"
        >
          {isCreating ? 'Cancelar' : '+ Novo Monstro'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-rpg-900 p-4 rounded border border-rpg-700 mb-6 space-y-3">
          <input 
            className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm"
            placeholder="Nome do Monstro"
            value={newMonster.name}
            onChange={e => setNewMonster({...newMonster, name: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="number"
              className="bg-rpg-800 border border-rpg-700 rounded p-2 text-sm"
              placeholder="HP Máximo"
              onChange={e => setNewMonster({...newMonster, hp: { current: parseInt(e.target.value), max: parseInt(e.target.value) }})}
            />
            <input 
              type="number"
              className="bg-rpg-800 border border-rpg-700 rounded p-2 text-sm"
              placeholder="CA (Defesa)"
              onChange={e => setNewMonster({...newMonster, ac: parseInt(e.target.value)})}
            />
          </div>
          <textarea 
             className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm"
             placeholder="Descrição"
             value={newMonster.description}
             onChange={e => setNewMonster({...newMonster, description: e.target.value})}
          />
          <button 
            onClick={handleCreate}
            className="w-full bg-rpg-accent hover:bg-orange-600 py-2 rounded font-bold"
          >
            Salvar no Bestiário
          </button>
        </div>
      )}

      <div className="space-y-4">
        {[...DEFAULT_MONSTERS, ...monsters].map(monster => (
          <div key={monster.id} className="bg-rpg-900 border border-rpg-700 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg text-white">{monster.name}</h3>
                <p className="text-xs text-rpg-sub italic">{monster.description}</p>
              </div>
              <div className="text-right text-xs text-rpg-sub">
                <div>HP: {monster.hp.max}</div>
                <div>CA: {monster.ac}</div>
              </div>
            </div>
            
            <div className="mt-3 flex justify-end">
              <button 
                onClick={() => onStartCombat(monster)}
                className="bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800 text-sm px-4 py-2 rounded flex items-center gap-2"
              >
                <span className="text-lg">⚔️</span> Combater
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};