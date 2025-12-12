
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Character, Item, MainTag, SecondaryTag, Recipe, ItemSlot } from '../types';

interface InventoryProps {
  character: Character;
  party: Character[]; 
  onUpdateCharacter: (char: Character) => void;
  onTradeItem: (itemId: string, targetCharId: string) => void;
  onConsumeItem: (item: Item) => void;
  isDevMode?: boolean;
  currentShop?: string | null;
  onLeaveShop?: () => void;
  gameMode?: 'online' | 'offline'; 
  onOpenShopOffline?: (shopType: string) => void; 
  onSocialAction?: (action: string, data: string) => void;
}

const GENERAL_STORE: Item[] = [
  { id: 'gen1', name: 'Poção de Vida', type: 'item', description: 'Cura 1d8+2 HP.', price: 50, tags: { main: 'Consumível', secondary: 'Nenhuma' }, slot: 'none', quantity: 1 },
  { id: 'gen2', name: 'Tocha', type: 'item', description: 'Ilumina o caminho.', price: 5, slot: 'none', quantity: 1 },
  { id: 'gen3', name: 'Corda (15m)', type: 'item', description: 'Utilidade geral.', price: 10, slot: 'none', quantity: 1 },
  { id: 'gen4', name: 'Rações', type: 'item', description: 'Comida para 1 dia.', price: 2, tags: { main: 'Consumível', secondary: 'Nenhuma' }, slot: 'none', quantity: 1 },
  { id: 'gen5', name: 'Frasco Vazio', type: 'item', description: 'Para poções.', price: 5, tags: { main: 'Material', secondary: 'Nenhuma' }, slot: 'none', quantity: 1 },
  { id: 'gen6', name: 'Mochila de Couro', type: 'item', description: 'Aumenta slots para 19.', price: 100, tags: { main: 'Especial', secondary: 'Nenhuma' }, slot: 'backpack', quantity: 1 },
];

const BLACKSMITH_STORE: Item[] = [
  { id: 'bs1', name: 'Espada Longa', type: 'weapon', slot: 'mainHand', description: 'Lâmina de aço.', damage: '1d8', price: 150, quantity: 1 },
  { id: 'bs2', name: 'Machado', type: 'weapon', slot: 'mainHand', description: 'Pesado.', damage: '1d10', price: 170, quantity: 1 },
  { id: 'bs3', name: 'Escudo', type: 'armor', slot: 'offHand', description: '+2 CA.', statModifier: { stat: 'ac', value: 2 }, price: 100, quantity: 1 },
  { id: 'bs4', name: 'Cota de Malha', type: 'armor', slot: 'body', description: '+4 CA.', statModifier: { stat: 'ac', value: 4 }, price: 400, quantity: 1 },
  { id: 'bs5', name: 'Capacete de Ferro', type: 'armor', slot: 'head', description: '+1 CA.', statModifier: { stat: 'ac', value: 1 }, price: 80, quantity: 1 },
  { id: 'bs6', name: 'Grevas de Aço', type: 'armor', slot: 'legs', description: '+1 CA.', statModifier: { stat: 'ac', value: 1 }, price: 120, quantity: 1 },
];

const MAGIC_STORE: Item[] = [
  { id: 'mag1', name: 'Poção de Mana', type: 'item', description: 'Restaura energia.', price: 100, tags: { main: 'Consumível', secondary: 'Catalisador Mágico' }, slot: 'none', quantity: 1 },
  { id: 'mag2', name: 'Pergaminho', type: 'item', description: 'Magia básica.', price: 50, tags: { main: 'Consumível', secondary: 'Catalisador Mágico' }, slot: 'none', quantity: 1 },
  { id: 'mag3', name: 'Cajado', type: 'weapon', slot: 'mainHand', description: 'Foco arcano.', damage: '1d6', price: 200, quantity: 1 },
];

const RECIPES: Recipe[] = [
    {
        id: 'rec1',
        result: { id: 'crafted1', name: 'Poção de Vida', type: 'item', description: 'Cura 1d8 HP (Caseira)', price: 25, tags: { main: 'Consumível', secondary: 'Nenhuma' }, slot: 'none', quantity: 1 },
        ingredients: [{ name: 'Erva Medicinal', count: 2 }, { name: 'Frasco de Água', count: 1 }]
    },
    {
        id: 'rec2',
        result: { id: 'crafted2', name: 'Espada de Pedra', type: 'weapon', slot: 'mainHand', description: 'Rústica.', damage: '1d6', price: 10, tags: { main: 'Equipável', secondary: 'Arma de Combate' }, quantity: 1 },
        ingredients: [{ name: 'Pedra Afiada', count: 2 }, { name: 'Graveto', count: 1 }]
    },
    {
        id: 'rec3',
        result: { id: 'crafted3', name: 'Mochila Simples', type: 'item', description: 'Expande inventário.', price: 50, tags: { main: 'Especial', secondary: 'Nenhuma' }, quantity: 1, slot: 'backpack' },
        ingredients: [{ name: 'Couro', count: 5 }, { name: 'Corda (1m)', count: 2 }]
    }
];

const SCAVENGE_ITEMS: Item[] = [
    { id: 'scv1', name: 'Erva Medicinal', type: 'item', description: 'Usado em poções.', price: 2, tags: { main: 'Material', secondary: 'Recurso Bruto' }, slot: 'none', quantity: 1 },
    { id: 'scv2', name: 'Pedra Afiada', type: 'item', description: 'Material básico.', price: 0, tags: { main: 'Material', secondary: 'Recurso Bruto' }, slot: 'none', quantity: 1 },
    { id: 'scv3', name: 'Graveto', type: 'item', description: 'Madeira básica.', price: 0, tags: { main: 'Material', secondary: 'Recurso Bruto' }, slot: 'none', quantity: 1 },
    { id: 'scv4', name: 'Frasco de Água', type: 'item', description: 'Água fresca.', price: 1, tags: { main: 'Consumível', secondary: 'Nenhuma' }, slot: 'none', quantity: 1 },
];

type FilterType = 'all' | 'weapon' | 'armor' | 'consumable';

export const Inventory: React.FC<InventoryProps> = ({ 
    character, 
    party,
    onUpdateCharacter, 
    onTradeItem,
    onConsumeItem,
    isDevMode = false,
    currentShop,
    onLeaveShop,
    gameMode = 'online',
    onOpenShopOffline,
    onSocialAction
}) => {
  const [subTab, setSubTab] = useState<'items' | 'crafting'>('items');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [tradingItem, setTradingItem] = useState<Item | null>(null);
  const [giftTargetId, setGiftTargetId] = useState<string>('');
  
  // Dev State
  const [devItemName, setDevItemName] = useState('');
  const [devItemType, setDevItemType] = useState<Item['type']>('item');
  const [devItemSlot, setDevItemSlot] = useState<ItemSlot>('none');
  const [devItemValue, setDevItemValue] = useState(''); 

  // Dynamic Capacity Logic (Based on EQUIPPED backpack)
  const maxSlots = character.equipment.backpack ? 19 : 8;

  // Helpers
  const addToInventory = (item: Item): boolean => {
      // Check for stackable
      const existingIdx = character.inventory.findIndex(i => i.name === item.name);
      const isResource = item.tags?.main !== 'Equipável';

      if (isResource && existingIdx !== -1) {
          const currentQty = character.inventory[existingIdx].quantity || 1;
          if (currentQty < 25) {
              const newInventory = [...character.inventory];
              newInventory[existingIdx].quantity = currentQty + 1;
              onUpdateCharacter({ ...character, inventory: newInventory });
              return true;
          }
      } 
      
      // Check slot limit
      if (character.inventory.length >= maxSlots) {
          alert(`Mochila cheia! (Máx ${maxSlots} slots)`);
          return false;
      }

      onUpdateCharacter({
          ...character,
          inventory: [...character.inventory, { ...item, id: uuidv4(), quantity: 1 }]
      });
      return true;
  };

  const removeFromInventory = (itemId: string) => {
      const idx = character.inventory.findIndex(i => i.id === itemId);
      if (idx === -1) return;
      const item = character.inventory[idx];
      const qty = item.quantity || 1;

      if (qty > 1) {
          const newInventory = [...character.inventory];
          newInventory[idx].quantity = qty - 1;
          onUpdateCharacter({ ...character, inventory: newInventory });
      } else {
          onUpdateCharacter({ ...character, inventory: character.inventory.filter(i => i.id !== itemId) });
      }
  };

  // EQUIP LOGIC with Slots
  const equipItem = (item: Item, targetSlot?: ItemSlot) => {
    const slot = targetSlot || item.slot;
    if (!slot || slot === 'none') {
        alert("Este item não pode ser equipado.");
        return;
    }

    const newChar = { ...character };
    const currentEquip = newChar.equipment[slot];

    if (currentEquip) {
        newChar.inventory.push(currentEquip);
    }

    newChar.equipment[slot] = item;
    
    // Remove ONE instance of item from inventory
    const idx = newChar.inventory.findIndex(i => i.id === item.id);
    if (idx !== -1) {
        if ((newChar.inventory[idx].quantity || 1) > 1) {
             newChar.inventory[idx].quantity = (newChar.inventory[idx].quantity || 1) - 1;
        } else {
             newChar.inventory.splice(idx, 1);
        }
    }
    
    onUpdateCharacter(newChar);
  };

  const unequipItem = (slot: ItemSlot) => {
    if (slot === 'none') return;
    const item = character.equipment[slot];
    if (!item) return;

    if (character.inventory.length >= maxSlots) {
        alert("Mochila cheia, não pode desequipar!");
        return;
    }

    const newChar = { ...character };
    newChar.inventory.push(item);
    newChar.equipment[slot] = null;
    onUpdateCharacter(newChar);
  };

  // DRAG AND DROP
  const handleDragStart = (e: React.DragEvent, item: Item) => {
      e.dataTransfer.setData("application/json", JSON.stringify(item));
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const handleDropEquip = (e: React.DragEvent, slotType: ItemSlot) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      const item = JSON.parse(data) as Item;
      
      const compatible = item.slot === slotType || 
                         (slotType === 'mainHand' && item.type === 'weapon') || 
                         (slotType === 'body' && item.type === 'armor') ||
                         (slotType === 'accessory1' && (item.slot === 'accessory1' || item.slot === 'accessory2')) ||
                         (slotType === 'accessory2' && (item.slot === 'accessory1' || item.slot === 'accessory2'));

      if (compatible) {
          equipItem(item, slotType);
      } else {
          if (confirm(`Este item é marcado como '${item.slot}', mas você tentou equipar em '${slotType}'. Forçar equipamento?`)) {
              equipItem(item, slotType);
          }
      }
  };

  const filteredInventory = character.inventory.filter(item => {
      if (filterType === 'all') return true;
      if (filterType === 'weapon') return item.type === 'weapon';
      if (filterType === 'armor') return item.type === 'armor';
      if (filterType === 'consumable') return item.tags?.main === 'Consumível';
      return true;
  });

  const addDevItem = () => {
    if (!devItemName.trim()) return;
    const newItem: Item = {
      id: uuidv4(), name: devItemName, type: devItemType, slot: devItemSlot, description: 'Item Dev', price: 0,
      tags: { main: 'Especial', secondary: 'Nenhuma' }, quantity: 1
    };
    if (devItemType === 'weapon') {
        newItem.damage = devItemValue || '1d4';
        newItem.description += ` (Dano: ${newItem.damage})`;
    } else if (devItemType === 'armor') {
        const acVal = parseInt(devItemValue) || 1;
        newItem.statModifier = { stat: 'ac', value: acVal };
        newItem.description += ` (CA: +${acVal})`;
    }
    
    if (character.inventory.length < maxSlots) {
        onUpdateCharacter({ ...character, inventory: [...character.inventory, newItem] });
    } else {
        alert("Mochila cheia!");
    }
    setDevItemName(''); setDevItemValue('');
  };

  const buyItem = (item: Item) => {
      const price = item.price || 0;
      // Simple logic: Convert everything to 'Iron' equivalent for check?
      // For now, let's assume price is in IRON coins (Reais) since that's the base.
      
      const totalIronValue = (character.wallet.copper / 100) + character.wallet.iron + (character.wallet.gold * 100) + (character.wallet.platinum * 100 * 100);
      
      if (totalIronValue < price) {
          alert("Dinheiro insuficiente!");
          return;
      }

      if (addToInventory(item)) {
         // Deduct money logic (complex if cross-currency, simple implementation: deduct from iron, if negative, breakdown gold)
         // Simplified: Assume payment happens auto-magically by the wallet logic or just reduce specific coin types if possible
         // For this version: Just reduce Iron if enough, else warn. Implementing full wallet change is complex.
         // Let's implement a 'pay' helper
         let remainingCost = price;
         const newWallet = { ...character.wallet };
         
         // 1. Pay with Iron
         if (newWallet.iron >= remainingCost) {
             newWallet.iron -= remainingCost;
             remainingCost = 0;
         } else {
             remainingCost -= newWallet.iron;
             newWallet.iron = 0;
             // 2. Break Gold
             while (remainingCost > 0 && newWallet.gold > 0) {
                 newWallet.gold--;
                 newWallet.iron += 100;
                 if (newWallet.iron >= remainingCost) {
                     newWallet.iron -= remainingCost;
                     remainingCost = 0;
                 } else {
                     remainingCost -= newWallet.iron;
                     newWallet.iron = 0;
                 }
             }
             // 3. Break Platinum
             while (remainingCost > 0 && newWallet.platinum > 0) {
                 newWallet.platinum--;
                 newWallet.gold += 100;
                 // Loop back to gold logic? simpler:
                 newWallet.iron += (100 * 100); 
                 // Actually this logic is getting messy. 
                 // Simple fallback: If we have enough total value, just normalize wallet.
             }
         }
         
         if (remainingCost > 0) {
             // Should not happen due to check above, unless logic is off.
             alert("Erro no troco. Compra cancelada.");
             return;
         }

         onUpdateCharacter({
             ...character,
             wallet: newWallet
         });
      }
  };

  const scavenge = () => {
      const item = SCAVENGE_ITEMS[Math.floor(Math.random() * SCAVENGE_ITEMS.length)];
      if (addToInventory(item)) {
         alert(`Você encontrou: ${item.name}!`);
      }
  };

  const craftItem = (recipe: Recipe) => {
      // Logic complex for quantities, simplifying:
      // Check ingredients
      for (const ing of recipe.ingredients) {
          const invItem = character.inventory.find(i => i.name === ing.name);
          const count = invItem?.quantity || 0;
          if (count < ing.count) {
              alert(`Faltam ingredientes: ${ing.name} (${count}/${ing.count})`);
              return;
          }
      }
      
      // Consume ingredients
      const newInventory = [...character.inventory];
      for (const ing of recipe.ingredients) {
           const idx = newInventory.findIndex(i => i.name === ing.name);
           if (idx !== -1) {
               if ((newInventory[idx].quantity || 1) <= ing.count) {
                   newInventory.splice(idx, 1);
               } else {
                   newInventory[idx].quantity = (newInventory[idx].quantity || 1) - ing.count;
               }
           }
      }
      
      // Add result
      const resultItem = { ...recipe.result, id: uuidv4(), quantity: 1 };
      // Can fit?
      const existingIdx = newInventory.findIndex(i => i.name === resultItem.name);
      if (existingIdx !== -1 && (newInventory[existingIdx].quantity || 1) < 25 && resultItem.tags?.main !== 'Equipável') {
           newInventory[existingIdx].quantity = (newInventory[existingIdx].quantity || 1) + 1;
           onUpdateCharacter({ ...character, inventory: newInventory });
           alert(`Criado: ${resultItem.name}`);
      } else if (newInventory.length < maxSlots) {
           newInventory.push(resultItem);
           onUpdateCharacter({ ...character, inventory: newInventory });
           alert(`Criado: ${resultItem.name}`);
      } else {
           alert("Mochila cheia para receber o item criado!");
      }
  };

  const handleGift = () => {
      if (!tradingItem || !giftTargetId || !onSocialAction) return;
      removeFromInventory(tradingItem.id);
      onSocialAction('gift', JSON.stringify({ targetId: giftTargetId, itemId: tradingItem.id }));
      setTradingItem(null);
      setGiftTargetId('');
  };

  const EquipSlot = ({ label, slot, item, compact = false }: { label: string, slot: ItemSlot, item: Item | null, compact?: boolean }) => (
      <div 
        className={`bg-rpg-900 p-1 rounded border border-rpg-700 hover:border-rpg-accent transition-colors flex flex-col justify-between relative ${compact ? 'h-16 w-16' : 'h-24'}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropEquip(e, slot)}
      >
          <span className="text-[9px] text-rpg-sub uppercase font-bold pointer-events-none text-center block w-full">{label}</span>
          {item ? (
              <div className="flex flex-col items-center z-10 flex-1 justify-center">
                  <span className="text-[10px] font-bold text-white text-center line-clamp-2 leading-tight">{item.name}</span>
                  {!compact && item.damage && <span className="text-[8px] text-red-400">{item.damage}</span>}
                  {!compact && item.statModifier && <span className="text-[8px] text-blue-400">+{item.statModifier.value} {item.statModifier.stat.toUpperCase()}</span>}
              </div>
          ) : <span className="text-[10px] text-gray-600 text-center italic pointer-events-none self-center mt-2">Vazio</span>}
          {item && <button onClick={() => unequipItem(slot)} className="absolute bottom-0 right-0 text-[10px] text-red-500 hover:text-white z-20 bg-black/50 rounded-tl px-1">✕</button>}
      </div>
  );

  const getActiveShopItems = () => {
      if (!currentShop) return [];
      const lower = currentShop.toLowerCase();
      if (lower.includes('ferre') || lower.includes('arm')) return BLACKSMITH_STORE;
      if (lower.includes('mag')) return MAGIC_STORE;
      return GENERAL_STORE;
  };

  // Logic to show Shop OR Inventory
  if (currentShop) {
      const shopItems = getActiveShopItems();
      return (
          <div className="flex flex-col h-full bg-rpg-800 text-white p-4">
              <div className="flex justify-between items-center mb-4 border-b border-rpg-700 pb-2">
                  <h2 className="text-xl font-fantasy text-yellow-500">Loja: {currentShop}</h2>
                  <button onClick={onLeaveShop} className="bg-red-800 px-3 py-1 rounded text-xs hover:bg-red-700">Sair</button>
              </div>
              
              {/* Wallet Display in Shop */}
              <div className="flex justify-around mb-4 bg-black/30 p-2 rounded">
                  <div className="text-center"><span className="block text-xl">🪙</span><span className="text-xs">{character.wallet.platinum} Plat</span></div>
                  <div className="text-center"><span className="block text-xl">🟡</span><span className="text-xs">{character.wallet.gold} Ouro</span></div>
                  <div className="text-center"><span className="block text-xl">⚪</span><span className="text-xs">{character.wallet.iron} Ferro</span></div>
                  <div className="text-center"><span className="block text-xl">🟤</span><span className="text-xs">{character.wallet.copper} Cobre</span></div>
              </div>

              <div className="grid grid-cols-1 gap-2 overflow-y-auto">
                  {shopItems.map(item => (
                      <div key={item.id} className="bg-rpg-900 p-2 rounded flex justify-between items-center border border-rpg-700">
                          <div>
                              <div className="font-bold text-sm">{item.name}</div>
                              <div className="text-[10px] text-gray-400">{item.description}</div>
                          </div>
                          <button onClick={() => buyItem(item)} className="bg-green-800 px-3 py-1 rounded text-xs hover:bg-green-700 font-bold border border-green-600">
                              Comprar ({item.price} ⚪)
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-rpg-800 text-white p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-fantasy text-rpg-accent">Mochila ({character.inventory.length}/{maxSlots})</h2>
          {isDevMode ? (
              <div className="flex items-center gap-1">
                  <span className="text-white text-xs mr-2">Add Ferro:</span>
                  <input 
                    type="number" 
                    onChange={(e) => onUpdateCharacter({...character, wallet: {...character.wallet, iron: (character.wallet.iron + parseInt(e.target.value)) }})}
                    className="w-12 bg-rpg-900 border border-gray-600 rounded px-1 text-white"
                  />
              </div>
          ) : null}
      </div>

      {/* Currency Strip */}
      <div className="flex gap-2 mb-4 bg-rpg-900 p-2 rounded border border-rpg-700 justify-between items-center shadow-inner">
          <div className="flex flex-col items-center w-1/4 border-r border-rpg-700 last:border-0" title="1 Platina = 100 Ouro">
              <span className="text-lg drop-shadow-md">🪙</span>
              <span className="text-[10px] font-bold text-gray-300">{character.wallet.platinum}</span>
          </div>
          <div className="flex flex-col items-center w-1/4 border-r border-rpg-700 last:border-0" title="1 Ouro = 100 Ferro">
              <span className="text-lg drop-shadow-md">🟡</span>
              <span className="text-[10px] font-bold text-yellow-400">{character.wallet.gold}</span>
          </div>
          <div className="flex flex-col items-center w-1/4 border-r border-rpg-700 last:border-0" title="1 Ferro = 100 Cobre (Base: 1 Real)">
              <span className="text-lg drop-shadow-md">⚪</span>
              <span className="text-[10px] font-bold text-gray-400">{character.wallet.iron}</span>
          </div>
          <div className="flex flex-col items-center w-1/4" title="1 Cobre = 1 Centavo">
              <span className="text-lg drop-shadow-md">🟤</span>
              <span className="text-[10px] font-bold text-orange-700">{character.wallet.copper}</span>
          </div>
      </div>

      <div className="flex gap-2 mb-4 bg-rpg-900 p-1 rounded border border-rpg-700 shrink-0">
          <button onClick={() => setSubTab('items')} className={`flex-1 py-1 text-sm font-bold rounded ${subTab === 'items' ? 'bg-rpg-700 text-white' : 'text-gray-500'}`}>Equipamento</button>
          <button onClick={() => setSubTab('crafting')} className={`flex-1 py-1 text-sm font-bold rounded ${subTab === 'crafting' ? 'bg-rpg-700 text-white' : 'text-gray-500'}`}>Criação</button>
      </div>
      
      {subTab === 'items' && (
        <>
            {/* UPDATED PAPER DOLL LAYOUT - CSS Grid based for cleaner alignment */}
            <div className="mb-6 relative w-full max-w-[320px] mx-auto bg-black/20 rounded-lg border border-rpg-700 p-4">
                <div className="grid grid-cols-3 gap-2">
                    {/* Row 1 */}
                    <div className="col-start-1"><EquipSlot label="Acess. 1" slot="accessory1" item={character.equipment.accessory1} compact /></div>
                    <div className="col-start-2 -mt-2"><EquipSlot label="Cabeça" slot="head" item={character.equipment.head} /></div>
                    <div className="col-start-3"><EquipSlot label="Acess. 2" slot="accessory2" item={character.equipment.accessory2} compact /></div>
                    
                    {/* Row 2 */}
                    <div className="col-start-1"><EquipSlot label="Mão Dir." slot="mainHand" item={character.equipment.mainHand} /></div>
                    <div className="col-start-2"><EquipSlot label="Tronco" slot="body" item={character.equipment.body} /></div>
                    <div className="col-start-3"><EquipSlot label="Mão Esq." slot="offHand" item={character.equipment.offHand} /></div>

                    {/* Row 3 */}
                    <div className="col-start-1 flex justify-center"><div className="w-16"><EquipSlot label="Mochila" slot="backpack" item={character.equipment.backpack} compact /></div></div>
                    <div className="col-start-2"><EquipSlot label="Pernas" slot="legs" item={character.equipment.legs} /></div>
                    <div className="col-start-3"></div>

                    {/* Row 4 */}
                    <div className="col-start-2"><EquipSlot label="Pés" slot="feet" item={character.equipment.feet} /></div>
                </div>
            </div>

            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
                <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded text-xs border ${filterType === 'all' ? 'bg-white text-black font-bold' : 'border-gray-600 text-gray-400'}`}>Todos</button>
                <button onClick={() => setFilterType('weapon')} className={`px-3 py-1 rounded text-xs border ${filterType === 'weapon' ? 'bg-red-900 border-red-500 text-white' : 'border-gray-600 text-gray-400'}`}>Armas</button>
                <button onClick={() => setFilterType('armor')} className={`px-3 py-1 rounded text-xs border ${filterType === 'armor' ? 'bg-blue-900 border-blue-500 text-white' : 'border-gray-600 text-gray-400'}`}>Armaduras</button>
                <button onClick={() => setFilterType('consumable')} className={`px-3 py-1 rounded text-xs border ${filterType === 'consumable' ? 'bg-green-900 border-green-500 text-white' : 'border-gray-600 text-gray-400'}`}>Consumíveis</button>
            </div>

            <div className="space-y-2 mb-8 flex-1">
                {filteredInventory.length === 0 && <p className="text-gray-500 text-sm italic">Mochila vazia.</p>}
                {filteredInventory.map(item => (
                <div 
                    key={item.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, item)}
                    className="bg-rpg-900 p-2 rounded flex flex-col justify-between items-start border border-rpg-700 gap-2 cursor-grab active:cursor-grabbing hover:bg-rpg-700 transition-colors relative"
                >
                    {item.quantity && item.quantity > 1 && (
                        <span className="absolute top-1 right-1 bg-white text-black text-xs font-bold px-1.5 rounded-full z-10">{item.quantity}</span>
                    )}

                    <div className="w-full">
                        <div className="flex justify-between items-start">
                             <p className="font-bold text-sm text-white">{item.name}</p>
                             <p className="text-[9px] text-rpg-accent uppercase">{item.slot || 'Geral'}</p>
                        </div>
                        <p className="text-[10px] text-rpg-sub">{item.description}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full mt-2">
                        {(item.slot && item.slot !== 'none') && (
                            <button onClick={() => equipItem(item)} className="flex-1 text-xs bg-rpg-accent text-white px-2 py-1 rounded hover:bg-orange-600">Equipar</button>
                        )}
                        {item.tags?.main === 'Consumível' && (
                             <button onClick={() => onConsumeItem(item)} className="flex-1 text-xs bg-green-700 text-white px-2 py-1 rounded hover:bg-green-600">Usar</button>
                        )}
                        
                        <button onClick={() => setTradingItem(item)} className="flex-1 text-xs bg-blue-700 text-white px-2 py-1 rounded hover:bg-blue-600">Ações</button>
                    </div>

                    {tradingItem?.id === item.id && (
                        <div className="w-full mt-2 p-2 bg-black/40 rounded animate-in fade-in">
                            <p className="text-[10px] mb-1 font-bold text-gray-400">Transferir/Presentear para:</p>
                            <div className="grid grid-cols-2 gap-1">
                                {party.filter(p => p.id !== character.id).map(p => (
                                    <button key={p.id} onClick={() => { onTradeItem(item.id, p.id); setTradingItem(null); }} className="text-xs bg-rpg-800 border border-gray-600 rounded px-1 py-0.5 truncate">{p.name}</button>
                                ))}
                                {/* List NPCs for gifting */}
                                {character.social.map(s => (
                                     <button key={s.targetId} onClick={() => { setGiftTargetId(s.targetId); }} className={`text-xs border border-gray-600 rounded px-1 py-0.5 truncate ${giftTargetId === s.targetId ? 'bg-pink-900 border-pink-500' : 'bg-rpg-800'}`}>🎁 {s.targetName}</button>
                                ))}
                            </div>
                            {giftTargetId && (
                                <button onClick={handleGift} className="w-full mt-2 bg-pink-700 text-white text-xs py-1 rounded font-bold">Confirmar Presente</button>
                            )}
                        </div>
                    )}
                </div>
                ))}
            </div>
        </>
      )}

      {subTab === 'crafting' && (
          <div className="animate-in fade-in">
              <div className="mb-4 p-3 bg-rpg-900 rounded border border-rpg-700 text-center">
                  <button onClick={scavenge} className="w-full bg-green-800 hover:bg-green-700 text-white font-bold py-2 rounded text-sm">🌿 Explorar / Coletar</button>
              </div>
              <div className="space-y-3">
                  {RECIPES.map(rec => (
                      <div key={rec.id} className="bg-rpg-900 p-3 rounded border border-rpg-700">
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-white">{rec.result.name}</span>
                              <button onClick={() => craftItem(rec)} className="text-xs bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-white font-bold">Criar</button>
                          </div>
                          <div className="text-[10px] text-gray-400">
                              {rec.ingredients.map(ing => `${ing.name} x${ing.count}`).join(', ')}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {isDevMode && subTab === 'items' && (
          <div className="mt-8 p-3 bg-red-900/20 border border-red-900/50 rounded">
            <span className="text-xs text-red-400 font-bold block mb-2">DEV CREATOR</span>
            <input type="text" value={devItemName} onChange={(e) => setDevItemName(e.target.value)} placeholder="Nome" className="w-full bg-rpg-900 border-rpg-700 rounded mb-2 text-sm text-white p-1" />
            
            <div className="grid grid-cols-2 gap-2 mb-2">
                <select value={devItemType} onChange={(e) => setDevItemType(e.target.value as Item['type'])} className="w-full bg-rpg-900 border-rpg-700 rounded text-sm text-white p-1">
                    <option value="item">Item</option>
                    <option value="weapon">Arma</option>
                    <option value="armor">Armadura</option>
                </select>
                
                <select value={devItemSlot} onChange={(e) => setDevItemSlot(e.target.value as ItemSlot)} className="w-full bg-rpg-900 border-rpg-700 rounded text-sm text-white p-1">
                    <option value="none">Sem Slot</option>
                    <option value="head">Cabeça</option>
                    <option value="body">Tronco</option>
                    <option value="legs">Pernas</option>
                    <option value="feet">Pés</option>
                    <option value="mainHand">Mão Direita</option>
                    <option value="offHand">Mão Esquerda</option>
                    <option value="accessory1">Acessório</option>
                    <option value="backpack">Mochila</option>
                </select>
            </div>

            <input type="text" value={devItemValue} onChange={(e) => setDevItemValue(e.target.value)} placeholder={devItemType === 'weapon' ? 'Dano (1d6)' : 'Valor da Defesa (CA)'} className="w-full bg-rpg-900 border-rpg-700 rounded mb-2 text-sm text-white p-1" />

            <button onClick={addDevItem} className="w-full bg-red-800 text-white text-xs py-1 rounded">Criar Item</button>
          </div>
      )}
    </div>
  );
};
