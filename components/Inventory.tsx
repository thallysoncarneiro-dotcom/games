import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Character, Item } from '../types';

interface InventoryProps {
  character: Character;
  onUpdateCharacter: (char: Character) => void;
}

const STARTING_ITEMS: Item[] = [
  { id: '1', name: 'Espada Longa', type: 'weapon', description: 'Uma lâmina afiada.', damage: '1d8', statModifier: { stat: 'str', value: 0 } },
  { id: '2', name: 'Adaga', type: 'weapon', description: 'Pequena e rápida.', damage: '1d4', statModifier: { stat: 'dex', value: 0 } },
  { id: '3', name: 'Couro Batido', type: 'armor', description: 'Proteção leve.', statModifier: { stat: 'ac', value: 12 } },
  { id: '4', name: 'Cota de Malha', type: 'armor', description: 'Proteção pesada.', statModifier: { stat: 'ac', value: 16 } },
  { id: '5', name: 'Poção de Vida', type: 'item', description: 'Cura 2d4+2 HP.', statModifier: { stat: 'con', value: 0 } },
];

export const Inventory: React.FC<InventoryProps> = ({ character, onUpdateCharacter }) => {
  const [newItemName, setNewItemName] = useState('');

  const equipItem = (item: Item) => {
    const newChar = { ...character };
    
    // Unequip current if exists
    if (item.type === 'weapon') {
      if (newChar.equipment.weapon) {
        newChar.inventory.push(newChar.equipment.weapon);
      }
      newChar.equipment.weapon = item;
    } else if (item.type === 'armor') {
      if (newChar.equipment.armor) {
        newChar.inventory.push(newChar.equipment.armor);
      }
      newChar.equipment.armor = item;
    }

    // Remove from inventory
    newChar.inventory = newChar.inventory.filter(i => i.id !== item.id);
    onUpdateCharacter(newChar);
  };

  const unequipItem = (slot: 'weapon' | 'armor') => {
    const item = character.equipment[slot];
    if (!item) return;

    const newChar = { ...character };
    newChar.inventory.push(item);
    newChar.equipment[slot] = null;
    onUpdateCharacter(newChar);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const item: Item = {
      id: uuidv4(),
      name: newItemName,
      type: 'item',
      description: 'Item genérico',
    };
    onUpdateCharacter({
      ...character,
      inventory: [...character.inventory, item]
    });
    setNewItemName('');
  };

  const addStartingItem = (item: Item) => {
     onUpdateCharacter({
      ...character,
      inventory: [...character.inventory, { ...item, id: uuidv4() }]
    });
  }

  return (
    <div className="flex flex-col h-full bg-rpg-800 text-white p-4 overflow-y-auto">
      <h2 className="text-xl font-fantasy text-rpg-accent mb-4">Equipamento</h2>
      
      {/* Equipped Slots */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-rpg-900 p-3 rounded border border-rpg-700">
          <label className="text-xs text-rpg-sub uppercase block mb-2">Arma Principal</label>
          {character.equipment.weapon ? (
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">{character.equipment.weapon.name}</span>
              <button 
                onClick={() => unequipItem('weapon')}
                className="text-xs text-red-400 hover:text-red-300"
              >
                X
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-500 italic">Vazio</span>
          )}
        </div>
        <div className="bg-rpg-900 p-3 rounded border border-rpg-700">
          <label className="text-xs text-rpg-sub uppercase block mb-2">Armadura</label>
          {character.equipment.armor ? (
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">{character.equipment.armor.name}</span>
              <button 
                onClick={() => unequipItem('armor')}
                className="text-xs text-red-400 hover:text-red-300"
              >
                X
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-500 italic">Vazio</span>
          )}
        </div>
      </div>

      <h2 className="text-xl font-fantasy text-rpg-accent mb-2">Mochila ({character.inventory.length}/20)</h2>
      
      {/* Add Custom Item */}
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Nome do item..."
          className="flex-1 bg-rpg-900 border border-rpg-700 rounded px-2 text-sm"
        />
        <button onClick={addItem} className="bg-rpg-700 px-3 py-1 rounded text-sm hover:bg-rpg-600">+</button>
      </div>

      {/* Inventory List */}
      <div className="space-y-2 mb-6">
        {character.inventory.length === 0 && <p className="text-gray-500 text-sm italic">Mochila vazia.</p>}
        {character.inventory.map(item => (
          <div key={item.id} className="bg-rpg-900 p-2 rounded flex justify-between items-center border border-rpg-700">
            <div>
              <p className="font-bold text-sm">{item.name}</p>
              <p className="text-xs text-rpg-sub">{item.type} | {item.description}</p>
            </div>
            {(item.type === 'weapon' || item.type === 'armor') && (
              <button 
                onClick={() => equipItem(item)}
                className="text-xs bg-rpg-accent text-white px-2 py-1 rounded hover:bg-orange-600"
              >
                Equipar
              </button>
            )}
          </div>
        ))}
      </div>

      <h3 className="text-sm font-bold text-rpg-sub uppercase mb-2">Itens Padrão (Debug)</h3>
      <div className="grid grid-cols-2 gap-2">
         {STARTING_ITEMS.map(item => (
           <button 
            key={item.id} 
            onClick={() => addStartingItem(item)}
            className="text-xs bg-rpg-700 p-1 rounded hover:bg-rpg-600 text-left"
           >
             + {item.name}
           </button>
         ))}
      </div>
    </div>
  );
};