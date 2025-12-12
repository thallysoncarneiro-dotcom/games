
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Character, GameState, Message, DiceRollResult, Monster, CombatState, Combatant, Item, World, SocialBond, Quest, ItemSlot, ActiveEffect, GameNotification } from './types';
import { startNewGame, sendMessageToDM, generateOfflineResponse } from './services/geminiService';
import { CharacterSheet } from './components/CharacterSheet';
import { ChatInterface } from './components/ChatInterface';
import { DiceRoller } from './components/DiceRoller';
import { Inventory } from './components/Inventory';
import { Bestiary } from './components/Bestiary';
import { CombatInterface } from './components/CombatInterface';
import { Social } from './components/Social';
import { PlayerProfile } from './components/PlayerProfile';
import { GameTable } from './components/GameTable';

type Tab = 'sheet' | 'inventory' | 'table' | 'social' | 'bestiary';

const createNewCharacter = (index: number): Character => ({
  id: uuidv4(),
  name: '',
  race: 'Humano', 
  origin: 'Forasteiro',
  gender: 'Masculino',
  class: '', 
  level: 1,
  age: 18, 
  likes: '',
  dislikes: '',
  xp: { current: 0, max: 100 }, 
  evoPoints: { current: 10, total: 10 },
  classPoints: 0, 
  skills: [],
  stats: { for: 10, def: 10, vit: 10, agi: 10, int: 10 },
  hp: { current: 60, max: 60 },
  mp: { current: 60, max: 60 },
  wallet: { copper: 0, iron: 10, gold: 0, platinum: 0 }, 
  conditions: [],
  activeEffects: [], 
  equipment: { 
      head: null, 
      body: null, 
      legs: null, 
      feet: null, 
      mainHand: null, 
      offHand: null,
      accessory1: null,
      accessory2: null,
      backpack: null
  },
  inventory: [], 
  social: [],
  notifications: []
});

const parseSeed = (seed: string): string => {
    const cleanSeed = seed.replace(/[^0-9]/g, '');
    const counts: Record<string, number> = {};
    for (const char of cleanSeed) {
        counts[char] = (counts[char] || 0) + 1;
    }
    const intensity = (n: string) => {
        const c = counts[n] || 0;
        if (c === 0) return 'Inexistente';
        if (c <= 2) return 'Baixo/Escasso';
        if (c <= 4) return 'Moderado';
        return 'Extremo/Abundante';
    };
    const sizeCount = Math.min(3, counts['9'] || 0);
    const worldSize = sizeCount === 0 ? 20000 : sizeCount * 60000;

    return `
        Tamanho do Mundo: ${worldSize.toLocaleString()} km².
        Relevo Baixo: ${intensity('1')}.
        Recursos Naturais: ${intensity('2')}.
        Nível de Magia: ${intensity('3')}.
        Quantidade de Água: ${intensity('4')}.
        Relevo Alto: ${intensity('5')}.
        Diversidade de Biomas: ${intensity('6')}.
        Cadeias Montanhosas: ${intensity('7')}.
        Profundidade dos Mares: ${intensity('8')}.
    `;
};

const getMaxInventorySize = (character: Character) => {
    return character.equipment.backpack ? 19 : 8;
};

const guessItemProperties = (name: string): Partial<Item> => {
    const lower = name.toLowerCase();
    if (lower.includes('espada') || lower.includes('machado') || lower.includes('faca') || lower.includes('adaga') || lower.includes('martelo') || lower.includes('lança') || lower.includes('lâmina')) {
        return { type: 'weapon', slot: 'mainHand', tags: { main: 'Equipável', secondary: 'Arma de Combate' }, damage: '1d6' };
    }
    if (lower.includes('arco') || lower.includes('besta')) {
        return { type: 'weapon', slot: 'mainHand', tags: { main: 'Equipável', secondary: 'Arma de Combate' }, damage: '1d8' };
    }
    if (lower.includes('escudo')) {
        return { type: 'armor', slot: 'offHand', tags: { main: 'Equipável', secondary: 'Proteção Leve' }, statModifier: { stat: 'ac', value: 2 } };
    }
    if (lower.includes('capacete') || lower.includes('elmo') || lower.includes('coroa')) {
        return { type: 'armor', slot: 'head', tags: { main: 'Equipável', secondary: 'Proteção Leve' }, statModifier: { stat: 'ac', value: 1 } };
    }
    if (lower.includes('peitoral') || lower.includes('armadura') || lower.includes('túnica') || lower.includes('manto') || lower.includes('camisa') || lower.includes('veste')) {
        return { type: 'armor', slot: 'body', tags: { main: 'Equipável', secondary: 'Proteção Leve' }, statModifier: { stat: 'ac', value: 2 } };
    }
    if (lower.includes('calça') || lower.includes('grevas')) {
        return { type: 'armor', slot: 'legs', tags: { main: 'Equipável', secondary: 'Proteção Leve' }, statModifier: { stat: 'ac', value: 1 } };
    }
    if (lower.includes('bota') || lower.includes('sapatos')) {
        return { type: 'armor', slot: 'feet', tags: { main: 'Equipável', secondary: 'Proteção Leve' }, statModifier: { stat: 'ac', value: 0 } };
    }
    if (lower.includes('anel') || lower.includes('colar') || lower.includes('amuleto') || lower.includes('brinco')) {
        return { type: 'item', slot: 'accessory1', tags: { main: 'Equipável', secondary: 'Acessório Técnico' } };
    }
    if (lower.includes('mochila') || lower.includes('bolsa')) {
        return { type: 'item', slot: 'backpack', tags: { main: 'Especial', secondary: 'Nenhuma' } };
    }
    if (lower.includes('poção') || lower.includes('frasco') || lower.includes('comida') || lower.includes('leite')) {
        return { type: 'item', slot: 'none', tags: { main: 'Consumível', secondary: 'Nenhuma' } };
    }
    return { type: 'item', slot: 'none', tags: { main: 'Material', secondary: 'Nenhuma' } };
};

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.WORLD_SELECT);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);
  const [editingWorld, setEditingWorld] = useState<World | null>(null);

  const [party, setParty] = useState<Character[]>([createNewCharacter(0)]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [gameMode, setGameMode] = useState<'online' | 'offline'>('online');
  
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('sheet');
  const [currentShop, setCurrentShop] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  
  const [isDevMode, setIsDevMode] = useState(false);
  const [isNsfwMode, setIsNsfwMode] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devCodeInput, setDevCodeInput] = useState('');

  const [newWorldName, setNewWorldName] = useState('');
  const [newWorldEra, setNewWorldEra] = useState('');
  const [newWorldMode, setNewWorldMode] = useState<'online' | 'offline'>('online');
  const [newWorldSeed, setNewWorldSeed] = useState('');
  const [newWorldPlot, setNewWorldPlot] = useState('');

  const [combatState, setCombatState] = useState<CombatState>({
    isActive: false, round: 0, turnIndex: 0, participants: [], log: []
  });

  const activeCharacter = party[activeCharIndex] || party[0];

  const addMoney = (char: Character, type: 'copper'|'iron'|'gold'|'platinum', amount: number): Character => {
      const newWallet = { ...char.wallet };
      newWallet[type] += amount;

      // Conversion Logic (100 -> 1 next tier)
      const MAX = 9999;

      if (newWallet.copper >= 100) {
          const upgrade = Math.floor(newWallet.copper / 100);
          newWallet.copper %= 100;
          newWallet.iron += upgrade;
      }
      if (newWallet.iron >= 100) {
          const upgrade = Math.floor(newWallet.iron / 100);
          newWallet.iron %= 100;
          newWallet.gold += upgrade;
      }
      if (newWallet.gold >= 100) {
          const upgrade = Math.floor(newWallet.gold / 100);
          newWallet.gold %= 100;
          newWallet.platinum += upgrade;
      }

      // Enforce Limits
      if (newWallet.copper > MAX) newWallet.copper = MAX;
      if (newWallet.iron > MAX) newWallet.iron = MAX;
      if (newWallet.gold > MAX) newWallet.gold = MAX;
      if (newWallet.platinum > MAX) newWallet.platinum = MAX;

      return { ...char, wallet: newWallet };
  };

  useEffect(() => {
      const savedWorlds = localStorage.getItem('itan_rpg_worlds');
      if (savedWorlds) {
          try {
              setWorlds(JSON.parse(savedWorlds));
          } catch (e) { console.error(e); }
      }
  }, []);

  useEffect(() => {
      if (currentWorldId && gameState !== GameState.WORLD_SELECT) {
          saveCurrentWorld();
      }
  }, [party, messages, monsters, quests, gameState]); 

  const saveCurrentWorld = () => {
      if (!currentWorldId) return;
      const updatedWorlds = worlds.map(w => {
          if (w.id === currentWorldId) {
              return { ...w, party, messages, monsters, quests, lastPlayed: new Date().toISOString() };
          }
          return w;
      });
      setWorlds(updatedWorlds);
      localStorage.setItem('itan_rpg_worlds', JSON.stringify(updatedWorlds));
  };

  const loadWorld = (world: World) => {
      setCurrentWorldId(world.id);
      
      const migratedParty = world.party.map(p => {
          const pAny = p as any;
          // Migration for wallet
          const wallet = p.wallet || { copper: 0, iron: (pAny.gold || 0), gold: 0, platinum: 0 };
          const inventory = p.inventory.map(i => ({...i, quantity: i.quantity || 1}));
          
          let migratedChar = {
              ...p,
              inventory,
              wallet,
              notifications: p.notifications || [],
              classPoints: p.classPoints || 0,
              skills: p.skills || [],
              conditions: p.conditions || [],
              activeEffects: p.activeEffects || [],
              origin: p.origin || 'Forasteiro',
              likes: p.likes || '',
              dislikes: p.dislikes || '',
          };

          // Equip structure migration
          if (!migratedChar.equipment.head && (migratedChar.equipment as any).armor) {
               migratedChar.equipment = {
                  head: null, body: (migratedChar.equipment as any).armor || null, legs: null, feet: null,
                  mainHand: (migratedChar.equipment as any).weapon || null, offHand: null,
                  accessory1: null, accessory2: null, backpack: null
               };
          } else {
               migratedChar.equipment = {
                  ...migratedChar.equipment,
                  accessory1: migratedChar.equipment.accessory1 || null,
                  accessory2: migratedChar.equipment.accessory2 || null,
                  backpack: migratedChar.equipment.backpack || null
               };
          }
          return migratedChar;
      });

      setParty(migratedParty.length > 0 ? migratedParty : [createNewCharacter(0)]);
      setMessages(world.messages);
      setMonsters(world.monsters);
      setQuests(world.quests || []);
      setGameMode(world.mode);
      setActiveCharIndex(0);
      
      const isNew = world.party[0].name === '';
      setGameState(isNew ? GameState.SETUP : GameState.PLAYING);
      
      if (!isNew && world.mode === 'online') {
          startNewGame(world.party, world.worldDetails, world.initialPlot);
      }
  };

  const updateActiveCharacter = (updatedChar: Character) => {
    const newParty = [...party];
    if (updatedChar.level > party[activeCharIndex].level) {
        if (updatedChar.level % 25 === 0) {
            updatedChar.classPoints += 1;
            setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `🌟 ${updatedChar.name} ganhou 1 Ponto de Classe!`, timestamp: new Date() }]);
        }
    }
    newParty[activeCharIndex] = updatedChar;
    setParty(newParty);
  };

  const addPartyMember = (newChar: Character) => {
    if (party.length >= 4) { alert("Máximo de 4."); return; }
    setParty([...party, newChar]);
  };

  const applyEffect = (char: Character, effectName: string, duration: number, description: string, intensityOverride?: number) => {
      const existingIdx = char.activeEffects?.findIndex(e => e.name === effectName);
      const newEffects = char.activeEffects ? [...char.activeEffects] : [];
      
      if (existingIdx !== undefined && existingIdx !== -1) {
          const currentIntensity = newEffects[existingIdx].intensity;
          const newIntensity = intensityOverride !== undefined ? intensityOverride : currentIntensity + 1;
          
          newEffects[existingIdx] = {
              ...newEffects[existingIdx],
              intensity: newIntensity,
              duration: duration
          };
      } else {
          newEffects.push({
              id: uuidv4(),
              name: effectName,
              duration: duration,
              intensity: intensityOverride !== undefined ? intensityOverride : 1,
              description: description
          });
      }
      return { ...char, activeEffects: newEffects };
  };

  const checkRaceValidity = (char: Character): boolean => {
      const cleanRace = char.race.trim().toLowerCase();
      if (cleanRace === 'humano') return true; 
      const exists = monsters.some(m => m.name.toLowerCase() === cleanRace);
      if (!exists) { alert(`Sua espécie '${char.race}' não existe no Bestiário.`); return false; }
      return true;
  };

  const handleTradeItem = (itemId: string, targetCharId: string) => {
      const giver = party[activeCharIndex];
      const receiverIndex = party.findIndex(p => p.id === targetCharId);
      if (receiverIndex === -1) return;
      const itemToTrade = giver.inventory.find(i => i.id === itemId);
      if (!itemToTrade) return;

      const newParty = [...party];
      newParty[activeCharIndex] = { ...giver, inventory: giver.inventory.filter(i => i.id !== itemId) };
      newParty[receiverIndex] = { ...newParty[receiverIndex], inventory: [...newParty[receiverIndex].inventory, itemToTrade] };
      setParty(newParty);
      setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `🔄 ${giver.name} deu ${itemToTrade.name} para ${newParty[receiverIndex].name}.`, timestamp: new Date() }]);
  };

  const handleConsumeItem = (item: Item) => {
      let char = party[activeCharIndex];
      const itemName = item.name.toLowerCase();
      let effectMsg = "";
      let keepItem = false;

      if (itemName.includes("livro") || itemName.includes("mapa")) {
          keepItem = true;
          effectMsg = `📖 Você lê ${item.name}.`;
      } else if (itemName.includes("poção") || itemName.includes("vida")) {
          const heal = Math.floor(Math.random() * 8) + 2;
          char.hp.current = Math.min(char.hp.max, char.hp.current + heal);
          effectMsg = `🧪 Bebeu ${item.name}: +${heal} HP.`;
      } else if (itemName.includes("leite")) {
          char = applyEffect(char, 'Vigor Lácteo', 20, 'Vigor restaurado e corpo fortalecido.');
          effectMsg = `🥛 Bebeu ${item.name}. Vigor Lácteo ativo por 20 turnos!`;
      } else {
          effectMsg = `❓ Usou ${item.name}, nada aconteceu.`;
      }

      const newParty = [...party];
      if (!keepItem) {
          const invIndex = char.inventory.findIndex(i => i.id === item.id);
          if (invIndex !== -1 && (char.inventory[invIndex].quantity || 1) > 1) {
             char.inventory[invIndex].quantity = (char.inventory[invIndex].quantity || 1) - 1;
          } else {
             char.inventory = char.inventory.filter(i => i.id !== item.id);
          }
      }
      
      newParty[activeCharIndex] = { ...char };
      setParty(newParty);
      setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: effectMsg, timestamp: new Date() }]);
  };

  const handleProposalResponse = (notificationId: string, accepted: boolean) => {
      const char = party[activeCharIndex];
      const notif = char.notifications.find(n => n.id === notificationId);
      if (!notif) return;

      if (accepted) {
          const targetIndex = party.findIndex(p => p.id === notif.fromId);
          if (targetIndex !== -1) {
              const target = party[targetIndex];
              const relationType = notif.subtype === 'dating' ? 'Namorado(a)' : 'Esposo(a)';
              
              // Update Active Char
              const newChar = { ...char };
              const myBond = newChar.social.find(s => s.targetId === notif.fromId);
              if (myBond) {
                  myBond.relation = relationType;
              } else {
                  newChar.social.push({ 
                      targetId: notif.fromId, targetName: target.name, targetGender: target.gender, 
                      affinity: 50, relation: relationType 
                  });
              }
              newChar.partnerId = notif.fromId;
              newChar.notifications = newChar.notifications.filter(n => n.id !== notificationId);

              // Update Target Char
              const newTarget = { ...target };
              const theirBond = newTarget.social.find(s => s.targetId === char.id);
              if (theirBond) {
                  theirBond.relation = relationType;
              } else {
                  newTarget.social.push({
                      targetId: char.id, targetName: char.name, targetGender: char.gender,
                      affinity: 50, relation: relationType
                  });
              }
              newTarget.partnerId = char.id;

              const newParty = [...party];
              newParty[activeCharIndex] = newChar;
              newParty[targetIndex] = newTarget;
              setParty(newParty);
              setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `❤️ ${char.name} aceitou o pedido de ${notif.fromName}!`, timestamp: new Date() }]);
          }
      } else {
          // Just remove notification
          const newChar = { ...char, notifications: char.notifications.filter(n => n.id !== notificationId) };
          updateActiveCharacter(newChar);
          setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `💔 ${char.name} recusou o pedido.`, timestamp: new Date() }]);
      }
  };

  const handleSocialAction = (action: string, data: string) => {
      let newParty = [...party];
      const meIndex = activeCharIndex;
      let me = newParty[meIndex];
      
      const ensureBond = (targetId: string) => {
        let bond = me.social.find(s => s.targetId === targetId);
        if (!bond) {
            const targetMember = party.find(p => p.id === targetId);
            bond = { targetId, targetName: targetMember ? targetMember.name : 'Desconhecido', targetGender: targetMember ? targetMember.gender : 'Desconhecido', affinity: 0, relation: 'Neutro' };
            me.social.push(bond);
        }
        return bond;
      };

      if (action === 'fazer') {
         const targetId = data;
         const bond = ensureBond(targetId);
         setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `💞 ${me.name} e ${bond.targetName} passaram um tempo íntimo juntos...`, timestamp: new Date() }]);
         
         const processPregnancy = (femaleChar: Character): Character => {
             let char = { ...femaleChar };
             const roll = Math.random();
             const isPregnant = char.conditions.some(c => c.includes('Grávida'));
             if (isPregnant) {
                 char = applyEffect(char, 'Bem Estar na Gravidez', 15, 'Sentindo-se radiante e saudável.');
                 char = applyEffect(char, 'Feliz', 10, 'Extremamente feliz!', 10); 
                 if (roll < 0.15 && !char.conditions.includes('Grávida (Gêmeos)')) char.conditions.push('Grávida (Gêmeos)');
             } else {
                 char = applyEffect(char, 'Feliz', 10, 'Sentindo-se amada.');
                 if (roll > 0.4) { char.conditions.push('Grávida[-30% de velocidade]'); char.conditions.push('Esperando um filho'); }
             }
             return char;
         };
         if (me.gender === 'Feminino') me = processPregnancy(me); else me = applyEffect(me, 'Feliz', 10, 'Sentindo-se amado e confiante.');
         const partnerIndex = newParty.findIndex(p => p.id === targetId);
         if (partnerIndex !== -1) {
             let partner = newParty[partnerIndex];
             if (partner.gender === 'Feminino') partner = processPregnancy(partner); else partner = applyEffect(partner, 'Feliz', 10, 'Sentindo-se amado.');
             newParty[partnerIndex] = partner;
         }
      } 
      else if (action === 'date') {
          const targetIndex = newParty.findIndex(p => p.id === data);
          if (targetIndex !== -1) {
              const target = newParty[targetIndex];
              const notification: GameNotification = { id: uuidv4(), type: 'proposal', subtype: 'dating', fromId: me.id, fromName: me.name, text: `${me.name} quer namorar com você.` };
              target.notifications = [...(target.notifications||[]), notification];
              newParty[targetIndex] = target;
              setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `💌 ${me.name} enviou um pedido de namoro para ${target.name}.`, timestamp: new Date() }]);
          } else {
              const bond = ensureBond(data);
              bond.relation = 'Namorado(a)';
              me.partnerId = data; 
              setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `❤️ ${me.name} agora namora ${bond.targetName}!`, timestamp: new Date() }]);
          }
      }
      else if (action === 'marry') {
          const targetIndex = newParty.findIndex(p => p.id === data);
          if (targetIndex !== -1) {
              const target = newParty[targetIndex];
              const notification: GameNotification = { id: uuidv4(), type: 'proposal', subtype: 'marriage', fromId: me.id, fromName: me.name, text: `${me.name} pediu sua mão em casamento.` };
              target.notifications = [...(target.notifications||[]), notification];
              newParty[targetIndex] = target;
              setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `💍 ${me.name} pediu ${target.name} em casamento!`, timestamp: new Date() }]);
          } else {
              const bond = ensureBond(data);
              bond.relation = 'Esposo(a)';
              me.partnerId = data;
              setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `💍 Casamento realizado entre ${me.name} e ${bond.targetName}!`, timestamp: new Date() }]);
          }
      }
      else if (action === 'drink_milk_self') {
          if (!isNsfwMode) return;
          me = applyEffect(me, 'Vigor Lácteo', 20, 'Vigor restaurado e corpo fortalecido.');
          me = applyEffect(me, 'Feliz', 10, 'Satisfeita.');
          setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `🥛 ${me.name} bebeu seu próprio leite diretamente. Vigor Lácteo ativado!`, timestamp: new Date() }]);
      }
      else if (action === 'milk_spouse' || action === 'milk_self') {
          if (!isNsfwMode) return;
          const isSelf = action === 'milk_self';
          const targetId = isSelf ? me.id : data;
          const targetName = isSelf ? me.name : ensureBond(targetId).targetName;
          const flaskIdx = me.inventory.findIndex(i => i.name.trim().toLowerCase() === 'frasco vazio' || i.name.trim().toLowerCase().includes('recipiente'));
          if (flaskIdx === -1) { alert("Você precisa de um 'Frasco Vazio' ou recipiente para coletar o leite."); return; }
          const newInv = [...me.inventory];
          if ((newInv[flaskIdx].quantity || 1) > 1) { newInv[flaskIdx].quantity! -= 1; } else { newInv.splice(flaskIdx, 1); }
          const milkItem: Item = { id: uuidv4(), name: `Leite de ${targetName}`, type: 'item', description: 'Nutritivo.', price: 15, quantity: 1, tags: { main: 'Consumível', secondary: 'Nenhuma' } };
          const limit = getMaxInventorySize(me);
          if (newInv.length < limit) newInv.push(milkItem); else alert("Mochila cheia, leite derramado após coleta.");
          me.inventory = newInv;
          if (isSelf) { me = applyEffect(me, 'Feliz', 10, 'Alívio.'); } else { const spouseIdx = newParty.findIndex(p => p.id === targetId); if (spouseIdx !== -1) { newParty[spouseIdx] = applyEffect(newParty[spouseIdx], 'Feliz', 10, 'Cuidada.'); } }
          setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `🍼 Leite coletado de ${targetName} (1 Frasco usado).`, timestamp: new Date() }]);
      }
      else if (action === 'add_bond') {
          const newBond: SocialBond = JSON.parse(data);
          me.social.push(newBond);
          setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `📝 Novo contato: ${newBond.targetName}`, timestamp: new Date() }]);
      }
      else if (action === 'adjust_affinity') {
          const payload = JSON.parse(data);
          const bond = ensureBond(payload.id);
          bond.affinity = Math.max(-50, Math.min(50, bond.affinity + payload.val));
      }
      else if (action === 'gift') {
           const payload = JSON.parse(data);
           const bond = ensureBond(payload.targetId);
           bond.affinity = Math.max(-50, Math.min(50, bond.affinity + 5));
           setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `🎁 Presente dado a ${bond.targetName}.`, timestamp: new Date() }]);
      }

      newParty[meIndex] = me;
      setParty(newParty);
  };
  
  const handleCreateWorld = () => {
    const newWorld: World = {
        id: uuidv4(),
        name: newWorldName || 'Novo Mundo',
        era: newWorldEra || 'Medieval',
        mode: newWorldMode,
        createdAt: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        party: [createNewCharacter(0)],
        messages: [{ id: uuidv4(), role: 'system', text: 'Mundo criado.', timestamp: new Date() }],
        monsters: [],
        quests: [],
        seed: newWorldSeed || '12345',
        worldDetails: parseSeed(newWorldSeed || '12345'),
        initialPlot: newWorldPlot
    };
    const updatedWorlds = [...worlds, newWorld];
    setWorlds(updatedWorlds);
    localStorage.setItem('itan_rpg_worlds', JSON.stringify(updatedWorlds));
    loadWorld(newWorld);
    setGameState(GameState.SETUP);
  };

  const handleUpdateWorld = () => {
      if (!editingWorld) return;
      const updatedList = worlds.map(w => w.id === editingWorld.id ? editingWorld : w);
      setWorlds(updatedList);
      localStorage.setItem('itan_rpg_worlds', JSON.stringify(updatedList));
      setEditingWorld(null);
  };

  const startGame = () => {
    if (!currentWorldId) return;
    setGameState(GameState.PLAYING);
    if (gameMode === 'online') {
        startNewGame(party, worlds.find(w => w.id === currentWorldId)?.worldDetails, worlds.find(w => w.id === currentWorldId)?.initialPlot);
    }
  };

  const handleDevAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (devCodeInput === 'c4m8' || devCodeInput === 'itan') {
        setIsDevMode(true);
        setShowDevModal(false);
    } else if (devCodeInput === 'c5m9b') {
        setIsNsfwMode(true);
        setIsDevMode(true);
        setShowDevModal(false);
        alert("Modo Extra Ativado.");
    } else {
        alert("Código incorreto");
    }
    setDevCodeInput('');
  };

  const toggleDevMode = () => {
    if (isDevMode) {
        setIsDevMode(false);
        setIsNsfwMode(false);
    }
    else setShowDevModal(true);
  };

  const DevModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-rpg-800 p-6 rounded-lg border border-rpg-accent shadow-2xl w-[90%] max-w-sm relative top-[-10%] md:top-0">
         <h3 className="text-xl text-rpg-accent font-bold mb-4">Acesso Desenvolvedor</h3>
         <form onSubmit={handleDevAuthSubmit}>
             <input type="password" value={devCodeInput} onChange={(e) => setDevCodeInput(e.target.value)} className="w-full bg-rpg-900 border border-rpg-700 p-3 mb-4 text-white rounded focus:border-rpg-accent outline-none" placeholder="Código" autoFocus />
             <div className="flex gap-2">
                 <button type="button" onClick={() => setShowDevModal(false)} className="flex-1 bg-gray-700 text-white py-3 rounded font-bold">Cancelar</button>
                 <button type="submit" className="flex-1 bg-rpg-accent text-white py-3 rounded font-bold hover:bg-orange-600">Entrar</button>
             </div>
         </form>
      </div>
    </div>
  );

  const advanceTime = () => {
      const newParty = party.map(p => {
          if (!p.activeEffects) return p;
          
          const updatedEffects = p.activeEffects
             .map(e => ({ ...e, duration: e.duration - 1 }))
             .filter(e => e.duration > 0);
          
          return { ...p, activeEffects: updatedEffects };
      });
      setParty(newParty);
  };

  const processAiResponse = (responseText: string) => {
      if (combatState.isActive) return;

      const itemRegex = /\[ITEM:\s*(.*?)(?:\|(.*?))?(?:\|(.*?))?\]/g;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(responseText)) !== null) {
          const rawName = itemMatch[1].trim();
          const rawType = itemMatch[2]?.trim().toLowerCase();
          const rawSlot = itemMatch[3]?.trim();
          let props = guessItemProperties(rawName);
          if (rawType) props.type = (rawType === 'weapon' || rawType === 'armor' || rawType === 'item') ? rawType : 'item';
          if (rawSlot) props.slot = rawSlot as ItemSlot;
          const newItem: Item = { id: uuidv4(), name: rawName, type: props.type || 'item', slot: props.slot || 'none', description: 'Item obtido.', price: 50, tags: props.tags || { main: 'Material', secondary: 'Nenhuma' }, damage: props.damage, statModifier: props.statModifier, quantity: 1 };
          const newParty = [...party];
          const char = newParty[activeCharIndex];
          if (newItem.slot && newItem.slot !== 'none' && !char.equipment[newItem.slot]) {
               char.equipment[newItem.slot] = newItem;
               setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `🛡️ ${char.name} equipou automaticamente: ${newItem.name}.`, timestamp: new Date() }]);
          } else {
               const existingItem = char.inventory.find(i => i.name === newItem.name);
               const limit = getMaxInventorySize(char);
               if (existingItem && existingItem.tags?.main !== 'Equipável' && (existingItem.quantity || 1) < 25) { existingItem.quantity = (existingItem.quantity || 1) + 1; } 
               else if (char.inventory.length < limit) { char.inventory.push(newItem); }
          }
          setParty(newParty);
      }
      
      const npcRegex = /\[NPC:\s*(.*?)\|(.*?)(?:\|(.*?)(?:\|(.*?))?)?\]/g;
      let npcMatch;
      while ((npcMatch = npcRegex.exec(responseText)) !== null) {
          const npcName = npcMatch[1].trim();
          const npcGenderRaw = npcMatch[2].trim().toLowerCase();
          const npcOccupation = npcMatch[3] ? npcMatch[3].trim() : 'Desconhecido';
          const npcPersonality = npcMatch[4] ? npcMatch[4].trim() : 'Neutro';
          const npcGender = npcGenderRaw.includes('fem') ? 'Feminino' : 'Masculino';
          
          const newParty = [...party];
          newParty.forEach(member => {
              const existingBond = member.social.find(s => s.targetName === npcName);
              if (!existingBond) {
                  member.social.push({ 
                      targetId: uuidv4(), 
                      targetName: npcName, 
                      targetGender: npcGender, 
                      occupation: npcOccupation, 
                      personality: npcPersonality, 
                      affinity: 0, 
                      relation: 'Neutro' 
                  });
              } else {
                  if (!existingBond.occupation || existingBond.occupation === 'Desconhecido') existingBond.occupation = npcOccupation;
                  if (!existingBond.personality || existingBond.personality === 'Neutro') existingBond.personality = npcPersonality;
              }
          });
          setParty(newParty);
      }
      
      const questRegex = /\[QUEST:\s*(.*?)\|(.*?)\|(.*?)\]/g;
      let questMatch;
      while ((questMatch = questRegex.exec(responseText)) !== null) {
          const title = questMatch[1].trim();
          const description = questMatch[2].trim();
          const reward = questMatch[3].trim();
          if (!quests.find(q => q.title === title)) { setQuests(prev => [...prev, { id: uuidv4(), title, description, reward, status: 'active' }]); }
      }
      
      const rewardRegex = /\[REWARD:\s*(\d+)\|(\d+)\]/g;
      let rewardMatch;
      while ((rewardMatch = rewardRegex.exec(responseText)) !== null) {
          const xp = parseInt(rewardMatch[1]);
          const goldVal = parseInt(rewardMatch[2]);
          const newParty = [...party];
          newParty.forEach((p, idx) => {
              p.xp.current += xp;
              newParty[idx] = addMoney(p, 'iron', goldVal);

              if (p.xp.current >= p.xp.max) {
                  p.level += 1; p.xp.current -= p.xp.max; p.xp.max = Math.floor(p.xp.max * 1.5); p.evoPoints.current += 1;
                  if (p.level % 25 === 0) p.classPoints += 1;
              }
          });
          setParty(newParty);
      }

      const combatMatch = responseText.match(/\[COMBATE:\s*(.*?)\]/i);
      if (combatMatch && combatMatch[1]) {
          const monsterName = combatMatch[1].trim();
          const monster = monsters.find(m => m.name.toLowerCase() === monsterName.toLowerCase());
          setTimeout(() => {
              if (combatState.isActive) return;
              if (monster) handleStartCombat(monster);
              else {
                  const newMonster: Monster = { id: uuidv4(), name: monsterName, level: 1, levelRange: '1-5', hp: {current: 20, max: 20}, ac: 10, stats: {str: 10, dex: 10}, attacks: [{name: 'Ataque', damage: '1d6'}], description: 'Inimigo desconhecido.', tegs: '(desconhecido)' };
                  setMonsters(prev => [...prev, newMonster]);
                  handleStartCombat(newMonster);
              }
          }, 1000);
      }

      const shopMatch = responseText.match(/\[LOJA:\s*(.*?)\]/i);
      if (shopMatch && shopMatch[1]) {
          const type = shopMatch[1].trim();
          setCurrentShop(type);
          setActiveTab('inventory'); 
          setSidebarOpen(true); 
      }
  };

  const handleSendMessage = async (text: string) => {
      if (!checkRaceValidity(activeCharacter)) return;
      if (!text.trim()) return;
      
      advanceTime();

      const userMsg: Message = { id: uuidv4(), role: 'user', text: `[${activeCharacter.name}]: ${text}`, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      
      try {
        const response = await sendMessageToDM(text, activeCharacter, party, monsters, quests, isDevMode, gameMode === 'offline');
        if (!response) {
             throw new Error("Empty response from AI");
        }

        const cleanResponse = response.replace(/\[COMBATE:.*?\]/g, '').replace(/\[ITEM:.*?\]/g, '').replace(/\[LOJA:.*?\]/g, '').replace(/\[NPC:.*?\]/g, '').replace(/\[QUEST:.*?\]/g, '').replace(/\[REWARD:.*?\]/g, '');
        
        const dmMsg: Message = { id: uuidv4(), role: 'model', text: cleanResponse || response, timestamp: new Date() };
        setMessages(prev => [...prev, dmMsg]);
        processAiResponse(response);
      } catch (e) {
          console.error("Chat Error:", e);
          const errorMsg = generateOfflineResponse(text);
          setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `(Erro de conexão: ${errorMsg})`, timestamp: new Date() }]);
      } finally {
          setIsTyping(false);
      }
  };

  const handleSkipTurn = async () => {
    setIsTyping(true);
    advanceTime();
    const systemNote = "(O grupo aguarda observando o desenrolar da situação...)";
    try {
        const response = await sendMessageToDM(systemNote, activeCharacter, party, monsters, quests, isDevMode, gameMode === 'offline');
        const cleanResponse = response.replace(/\[COMBATE:.*?\]/g, '').replace(/\[ITEM:.*?\]/g, '').replace(/\[LOJA:.*?\]/g, '').replace(/\[NPC:.*?\]/g, '').replace(/\[QUEST:.*?\]/g, '').replace(/\[REWARD:.*?\]/g, '');
        setMessages(prev => [...prev, { id: uuidv4(), role: 'model', text: cleanResponse || response, timestamp: new Date() }]);
        processAiResponse(response);
    } catch (error) { 
        console.error(error); 
        setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: "Erro ao pular turno. Tente novamente.", timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  };

  const handleDiceRoll = async (result: DiceRollResult) => {
    if (!checkRaceValidity(activeCharacter)) return;
    const rollMsg: Message = { id: uuidv4(), role: 'system', text: `🎲 ${activeCharacter.name} rolou d${result.sides}: ${result.value}`, timestamp: new Date(), isDiceRoll: true };
    setMessages(prev => [...prev, rollMsg]);
    setIsTyping(true);
    try {
      const response = await sendMessageToDM(`(${activeCharacter.name} rolou d${result.sides} = ${result.value})`, activeCharacter, party, monsters, quests, isDevMode, gameMode === 'offline');
      setMessages(prev => [...prev, { id: uuidv4(), role: 'model', text: response, timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  };

  const handleStartCombat = (baseMonster: Monster) => {
    if (!checkRaceValidity(activeCharacter)) return;
    if (combatState.isActive) return; 
    const participants: Combatant[] = [];
    party.forEach(p => {
        participants.push({ id: p.id, name: p.name, type: 'player', hp: { ...p.hp }, maxHp: p.hp.max, initiative: Math.floor(Math.random()*20)+1, ac: 10 + (p.equipment.body?.statModifier?.value || 0), sourceId: p.id });
    });
    participants.push({ id: uuidv4(), name: baseMonster.name, type: 'monster', hp: { ...baseMonster.hp }, maxHp: baseMonster.hp.max, initiative: Math.floor(Math.random()*20)+1, ac: baseMonster.ac, sourceId: baseMonster.id });
    participants.sort((a, b) => b.initiative - a.initiative);
    setCombatState({ isActive: true, round: 1, turnIndex: 0, participants, log: [`Combate: vs ${baseMonster.name}`] });
    handleSendMessage(`(Combate contra ${baseMonster.name}!)`);
    setSidebarOpen(false); 
  };

  const handleCombatUpdate = (newState: CombatState) => {
    setCombatState(newState);
    const newParty = [...party];
    let playerDied = false;
    let deadPlayerName = "";

    newState.participants.filter(p => p.type === 'player').forEach(p => {
        const index = newParty.findIndex(c => c.id === p.sourceId);
        if (index !== -1) {
            newParty[index] = { ...newParty[index], hp: p.hp };
            if (p.hp.current <= 0) {
                playerDied = true;
                deadPlayerName = p.name;
                const char = newParty[index];
                char.xp.current = Math.floor(char.xp.current * 0.5);
                char.wallet.iron = Math.floor(char.wallet.iron * 0.5);
                const totalItemCount = char.inventory.reduce((sum, item) => sum + (item.quantity || 1), 0);
                if (totalItemCount > 16) {
                     const looseCount = Math.floor(totalItemCount * 0.3);
                     const shuffled = [...char.inventory].sort(() => 0.5 - Math.random());
                     char.inventory = shuffled.slice(looseCount);
                }
                newParty[index] = char;
            }
        }
    });

    setParty(newParty);
    if (playerDied) {
       setCombatState(prev => ({ ...prev, isActive: false }));
       alert(`Morte! ${deadPlayerName} caiu.`);
       setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `☠️ ${deadPlayerName} foi derrotado.`, timestamp: new Date() }]);
    }
  };

  const handleCombatVictory = (monsterId: string) => {
      const defeated = combatState.participants.find(p => p.id === monsterId);
      const monster = monsters.find(m => m.id === defeated?.sourceId) || monsters[0];
      const xpGained = monster.level * 10;
      const goldGained = monster.level * 5;
      const newParty = [...party];
      newParty.forEach(char => {
          if (char.hp.current > 0) {
             char.xp.current += xpGained;
             char = addMoney(char, 'iron', goldGained);
             if (char.xp.current >= char.xp.max) {
                 char.level += 1;
                 char.xp.current -= char.xp.max;
                 char.xp.max = Math.floor(char.xp.max * 1.5);
                 char.evoPoints.current += 1;
                 if (char.level % 25 === 0) char.classPoints += 1;
                 setMessages(prev => [...prev, { id: uuidv4(), role: 'system', text: `🆙 ${char.name} subiu para o Nível ${char.level}!`, timestamp: new Date() }]);
             }
          }
      });
      setParty(newParty);
      setCombatState(prev => ({ ...prev, isActive: false }));
      handleSendMessage(`(Combate vencido! +${xpGained} XP)`);
  };

  const handleSelectRace = (raceName: string) => {
      const cleanRaceName = typeof raceName === 'string' ? raceName.split('(')[0].trim() : 'Humano';
      const newChar = { ...activeCharacter, race: cleanRaceName };
      updateActiveCharacter(newChar);
  };

  if (gameState === GameState.WORLD_SELECT) { return ( <div className="h-[100dvh] w-screen bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center p-4 flex items-center justify-center overflow-auto"><div className="absolute inset-0 bg-rpg-900/90"></div><div className="relative z-10 w-full max-w-4xl bg-rpg-800 rounded-lg shadow-2xl border border-rpg-700 flex flex-col md:flex-row overflow-hidden min-h-[500px] max-h-full"><div className="w-full md:w-1/3 bg-rpg-900 p-6 md:p-8 border-r border-rpg-700 flex flex-col justify-center overflow-y-auto"><h1 className="text-3xl md:text-4xl font-fantasy text-rpg-accent mb-6">Leitor Onisciente</h1><div className="space-y-4"><input type="text" value={newWorldName} onChange={(e) => setNewWorldName(e.target.value)} className="w-full bg-rpg-800 border border-rpg-700 rounded p-3 text-white text-sm" placeholder="Nome do Mundo" />
  <input type="text" value={newWorldEra} onChange={(e) => setNewWorldEra(e.target.value)} className="w-full bg-rpg-800 border border-rpg-700 rounded p-3 text-white text-sm" placeholder="Época (ex: Medieval, Cyberpunk)" />
  <input type="text" value={newWorldSeed} onChange={(e) => setNewWorldSeed(e.target.value.replace(/[^0-9]/g, ''))} maxLength={40} className="w-full bg-rpg-800 border border-rpg-700 rounded p-3 text-white text-sm font-mono" placeholder="Seed (Opcional)" /><textarea value={newWorldPlot} onChange={(e) => setNewWorldPlot(e.target.value)} className="w-full bg-rpg-800 border border-rpg-700 rounded p-3 text-white text-sm h-24 resize-none focus:border-rpg-accent focus:outline-none placeholder-gray-500" placeholder="Cenário Inicial..." /><div className="flex bg-rpg-800 rounded p-1 border border-rpg-700"><button onClick={() => setNewWorldMode('online')} className={`flex-1 py-2 text-xs font-bold rounded ${newWorldMode === 'online' ? 'bg-green-700 text-white' : 'text-gray-500'}`}>Online</button><button onClick={() => setNewWorldMode('offline')} className={`flex-1 py-2 text-xs font-bold rounded ${newWorldMode === 'offline' ? 'bg-gray-600 text-white' : 'text-gray-500'}`}>Offline</button></div><button onClick={handleCreateWorld} className="w-full bg-rpg-accent hover:bg-orange-600 text-white font-bold py-3 rounded mt-4">Criar Novo Mundo</button></div></div><div className="w-full md:w-2/3 p-6 md:p-8 bg-rpg-800 flex flex-col relative h-auto overflow-y-auto"><h2 className="text-xl font-bold text-white mb-4 border-b border-rpg-700 pb-2">Seus Mundos</h2><div className="flex-1 space-y-3">{worlds.map(w => (<div key={w.id} onClick={() => loadWorld(w)} className="bg-rpg-900 border border-rpg-700 p-4 rounded hover:border-rpg-accent cursor-pointer group relative"><h3 className="font-bold text-lg text-white group-hover:text-rpg-accent">{w.name}</h3><p className="text-[10px] text-gray-600 mt-2">Jogadores: {w.party.length} | Época: {w.era || 'Medieval'}</p><div className="absolute top-4 right-4 flex gap-2"><button onClick={(e) => { e.stopPropagation(); setEditingWorld(w); }} className="text-gray-500 hover:text-white">✏️</button></div></div>))}</div></div></div></div> ); }

  if (gameState === GameState.SETUP) {
    const currentWorld = worlds.find(w => w.id === currentWorldId);
    return (
      <div className="h-[100dvh] w-screen flex items-center justify-center bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center p-4 overflow-auto">
        <div className="absolute inset-0 bg-rpg-900/80"></div>
        <div className="relative z-10 w-full max-w-6xl bg-rpg-900 border border-rpg-700 shadow-2xl rounded-xl overflow-hidden flex flex-col md:flex-row h-full md:h-[85vh]">
            <div className="flex-1 p-8 flex flex-col justify-center items-start text-left border-b md:border-b-0 md:border-r border-rpg-700 overflow-y-auto">
                <button onClick={() => setGameState(GameState.WORLD_SELECT)} className="mb-4 text-xs text-gray-500 hover:text-white">← Voltar</button>
                <h1 className="text-4xl md:text-5xl font-fantasy text-rpg-accent mb-2">Criação</h1>
                {currentWorld?.initialPlot && (<div className="w-full mb-4 p-3 bg-blue-900/20 border border-blue-900/50 rounded text-sm text-blue-200 italic"><strong>Cenário:</strong> "{currentWorld.initialPlot}"</div>)}
                <div className="w-full mb-6 bg-rpg-800 rounded p-4 border border-rpg-700">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {party.map((p, idx) => (<button key={p.id} onClick={() => setActiveCharIndex(idx)} className={`px-4 py-2 rounded text-sm font-bold ${activeCharIndex === idx ? 'bg-rpg-accent text-white' : 'bg-rpg-700 text-gray-400'}`}>{p.name || `Jogador ${idx + 1}`}</button>))}
                        {party.length < 4 && <button onClick={() => addPartyMember(createNewCharacter(party.length))} className="px-4 py-2 bg-green-700 text-white rounded font-bold hover:bg-green-600">+ Add</button>}
                    </div>
                </div>
                <button onClick={startGame} className="w-full bg-rpg-accent hover:bg-orange-600 text-white text-xl font-bold py-4 px-10 rounded shadow-lg transform transition hover:scale-105">Iniciar Aventura</button>
            </div>
            <div className="flex-1 p-4 overflow-hidden relative">
                <CharacterSheet character={activeCharacter} onChange={updateActiveCharacter} onOpenBestiary={() => setActiveTab('bestiary')} isDevMode={isDevMode} isNsfwMode={isNsfwMode} onAction={handleSocialAction} />
            </div>
        </div>
      </div>
    );
  }

  const worldSeed = worlds.find(w => w.id === currentWorldId)?.seed || '12345';
  const activeNotifications = activeCharacter?.notifications || [];

  return (
    <div className="h-[100dvh] w-screen flex flex-col md:flex-row overflow-hidden relative">
      {showDevModal && <DevModal />}
      
      {activeNotifications.length > 0 && (
          <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-rpg-800 p-6 rounded-lg border border-pink-500 shadow-2xl max-w-sm w-full text-center">
                  <h3 className="text-xl font-fantasy text-pink-400 mb-2">Pedido Especial!</h3>
                  <p className="text-white mb-6 italic">"{activeNotifications[0].text}"</p>
                  <div className="flex gap-4 justify-center">
                      <button onClick={() => handleProposalResponse(activeNotifications[0].id, false)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-white">Recusar</button>
                      <button onClick={() => handleProposalResponse(activeNotifications[0].id, true)} className="px-4 py-2 bg-pink-600 rounded hover:bg-pink-500 text-white font-bold animate-pulse">Aceitar ❤️</button>
                  </div>
              </div>
          </div>
      )}
      
      <div className="md:hidden h-14 bg-rpg-800 border-b border-rpg-700 flex items-center justify-between px-4 z-40 shrink-0 w-full">
        <span className="font-fantasy text-rpg-accent text-lg truncate max-w-[120px]">Leitor Onisciente</span>
        <div className="flex gap-2">
            <PlayerProfile character={activeCharacter} compact={true} />
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-2 bg-rpg-700 rounded px-3 font-bold border border-rpg-600 z-50">
                {sidebarOpen ? '✕' : '☰'}
            </button>
        </div>
      </div>

      <main className="flex-1 h-full relative order-2 md:order-1 flex flex-col min-h-0 w-full">
        <div className="bg-rpg-900 border-b border-rpg-700 p-2 flex gap-2 justify-between items-center shrink-0 overflow-x-auto">
             <div className="flex gap-2 items-center">
                 <div className="hidden md:block mr-2"><PlayerProfile character={activeCharacter} /></div>
                {party.map((p, idx) => (
                    <button key={p.id} onClick={() => setActiveCharIndex(idx)} className={`relative flex flex-col items-center justify-center w-10 h-10 rounded border transition-all ${activeCharIndex === idx ? 'bg-rpg-800 border-rpg-accent text-white scale-110' : 'border-transparent text-gray-500 hover:text-gray-300'}`} title={p.name}>
                        <div className={`w-3 h-3 rounded-full mb-1 ${activeCharIndex === idx ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                        <span className="text-[9px] font-bold">P{idx+1}</span>
                        {p.notifications?.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-ping"></span>}
                    </button>
                ))}
             </div>
             <div className="flex gap-2 items-center">
                 <button onClick={() => setShowJournal(true)} className="text-xs bg-red-900 text-red-200 px-3 py-1.5 rounded border border-red-800 hover:bg-red-800 whitespace-nowrap">📖 Diário</button>
                 <button onClick={saveCurrentWorld} className="text-xs bg-blue-900 text-blue-200 px-3 py-1.5 rounded border border-blue-800 hover:bg-blue-800 whitespace-nowrap">💾 Salvar</button>
                 <button onClick={() => {saveCurrentWorld(); setGameState(GameState.WORLD_SELECT);}} className="text-xs bg-red-900 text-red-200 px-3 py-1.5 rounded border border-red-800 hover:bg-red-800 whitespace-nowrap">🚪 Sair</button>
             </div>
        </div>
        <ChatInterface messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} onSkip={handleSkipTurn} />
        {combatState.isActive && <CombatInterface combatState={combatState} character={activeCharacter} onCombatUpdate={handleCombatUpdate} onEndCombat={() => setCombatState(p => ({...p, isActive: false}))} onVictory={handleCombatVictory} onLogAction={(t) => setMessages(p => [...p, {id: uuidv4(), role: 'system', text: t, timestamp: new Date()}])} />}
      </main>

      <aside 
          className={`
            fixed md:relative z-50 w-full md:w-96 h-[calc(100%-3.5rem)] md:h-full top-14 md:top-0
            bg-rpg-900 border-l border-rpg-700 flex flex-col 
            transform transition-transform duration-300 ease-in-out 
            order-1 md:order-2 shrink-0
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}
      >
        <div className="flex border-b border-rpg-700 bg-rpg-800 shrink-0 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('sheet')} className={`flex-1 py-3 px-2 text-[10px] md:text-sm font-bold uppercase whitespace-nowrap transition-colors ${activeTab === 'sheet' ? 'text-rpg-accent border-b-2 border-rpg-accent bg-rpg-900' : 'text-rpg-sub hover:text-white'}`}>Ficha</button>
          <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-3 px-2 text-[10px] md:text-sm font-bold uppercase whitespace-nowrap transition-colors ${activeTab === 'inventory' ? 'text-rpg-accent border-b-2 border-rpg-accent bg-rpg-900' : 'text-rpg-sub hover:text-white'}`}>Mochila</button>
          <button onClick={() => setActiveTab('table')} className={`flex-1 py-3 px-2 text-[10px] md:text-sm font-bold uppercase whitespace-nowrap transition-colors ${activeTab === 'table' ? 'text-rpg-accent border-b-2 border-rpg-accent bg-rpg-900' : 'text-rpg-sub hover:text-white'}`}>Mesa</button>
          <button onClick={() => setActiveTab('social')} className={`flex-1 py-3 px-2 text-[10px] md:text-sm font-bold uppercase whitespace-nowrap transition-colors ${activeTab === 'social' ? 'text-rpg-accent border-b-2 border-rpg-accent bg-rpg-900' : 'text-rpg-sub hover:text-white'}`}>Social</button>
          <button onClick={() => setActiveTab('bestiary')} className={`flex-1 py-3 px-2 text-[10px] md:text-sm font-bold uppercase whitespace-nowrap transition-colors ${activeTab === 'bestiary' ? 'text-rpg-accent border-b-2 border-rpg-accent bg-rpg-900' : 'text-rpg-sub hover:text-white'}`}>Bestiário</button>
        </div>
        <div className="flex-1 overflow-hidden relative">
           {activeTab === 'sheet' && (
             <div className="h-full flex flex-col">
               <div className="flex-1 overflow-y-auto p-2">
                 <CharacterSheet character={activeCharacter} onChange={updateActiveCharacter} readOnly={gameState === GameState.PLAYING} onOpenBestiary={() => setActiveTab('bestiary')} isDevMode={isDevMode} isNsfwMode={isNsfwMode} onAction={handleSocialAction} />
               </div>
               <div className="p-2 border-t border-rpg-700 bg-rpg-900 shrink-0"><DiceRoller onRoll={handleDiceRoll} disabled={isTyping || combatState.isActive} /></div>
             </div>
           )}
           {activeTab === 'inventory' && <Inventory character={activeCharacter} party={party} onUpdateCharacter={updateActiveCharacter} onTradeItem={handleTradeItem} onConsumeItem={handleConsumeItem} isDevMode={isDevMode} currentShop={currentShop} onLeaveShop={() => setCurrentShop(null)} gameMode={gameMode} onOpenShopOffline={(shop) => setCurrentShop(shop)} onSocialAction={handleSocialAction} />}
           {activeTab === 'bestiary' && <Bestiary monsters={monsters} onAddMonster={(m) => setMonsters([...monsters, m])} onStartCombat={handleStartCombat} onSelectRace={handleSelectRace} />}
           {activeTab === 'social' && <Social character={activeCharacter} party={party} onAction={handleSocialAction} isDevMode={isDevMode} isNsfwMode={isNsfwMode} />}
           {activeTab === 'table' && <GameTable party={party} monsters={monsters} quests={quests} seed={worldSeed} />}
        </div>
        <div className="p-2 bg-rpg-900 border-t border-rpg-700 flex justify-end shrink-0">
            <button onClick={toggleDevMode} className="text-gray-600 hover:text-white text-xs flex items-center gap-2" title="Modo Desenvolvedor">{isDevMode ? <span className="text-red-500 font-bold">DEV MODE ON</span> : 'v1.1'} {isDevMode ? '🔓' : '🔒'}</button>
        </div>
      </aside>
      
      {showJournal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-[#5a1a1a] w-full md:w-[80vw] max-w-2xl h-[80vh] rounded-r-2xl rounded-l-md shadow-2xl border-r-8 border-[#3d1010] flex flex-col overflow-hidden relative border-l-[12px] border-l-[#2a0b0b]">
               <div className="bg-[#4d1515] p-4 border-b border-[#3d1010] flex justify-between items-center shadow-inner"><h2 className="text-xl md:text-2xl font-fantasy text-[#e0c097] tracking-widest drop-shadow-md">Diário de Aventura</h2><button onClick={() => setShowJournal(false)} className="text-[#e0c097] hover:text-white text-xl">✕</button></div>
               <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f5e6d3] text-[#2c1810] font-serif leading-relaxed shadow-inner">
                    {messages.length === 0 && <p className="text-center italic opacity-50">O diário está vazio...</p>}
                    {messages.filter(m => !m.isDiceRoll).map((msg, i) => (<div key={i} className="mb-4"><span className="font-bold text-[#8b4513] text-sm uppercase tracking-wide block mb-1">{msg.role === 'user' ? msg.text.split(':')[0] : (msg.role === 'system' ? 'Sistema' : 'Mestre')}</span><p className="border-b border-[#d4c5b0] pb-2 text-sm md:text-base">{msg.role === 'user' ? msg.text.split(':').slice(1).join(':') : msg.text}</p></div>))}
               </div>
           </div>
        </div>
      )}
    </div>
  );
};
