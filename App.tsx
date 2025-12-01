import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Character, GameState, Message, DiceRollResult, Monster, CombatState, Combatant } from './types';
import { startNewGame, sendMessageToDM } from './services/geminiService';
import { CharacterSheet } from './components/CharacterSheet';
import { ChatInterface } from './components/ChatInterface';
import { DiceRoller } from './components/DiceRoller';
import { Inventory } from './components/Inventory';
import { Bestiary } from './components/Bestiary';
import { CombatInterface } from './components/CombatInterface';

const initialCharacter: Character = {
  name: '',
  race: '',
  class: '',
  level: 1,
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  hp: { current: 10, max: 10 },
  equipment: { weapon: null, armor: null },
  inventory: []
};

type Tab = 'sheet' | 'inventory' | 'bestiary';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('sheet');
  const [monsters, setMonsters] = useState<Monster[]>([]);
  
  // Combat State
  const [combatState, setCombatState] = useState<CombatState>({
    isActive: false,
    round: 0,
    turnIndex: 0,
    participants: [],
    log: []
  });

  const startGame = async () => {
    if (!character.name || !character.class) {
      alert("Por favor, preencha pelo menos o Nome e a Classe do personagem.");
      return;
    }

    setGameState(GameState.PLAYING);
    setIsTyping(true);
    
    setMessages([{
      id: uuidv4(),
      role: 'system',
      text: 'Configurando a mesa e invocando o Mestre...',
      timestamp: new Date()
    }]);

    try {
      startNewGame(character);
      const initialResponse = await sendMessageToDM("Estou pronto para começar a aventura. Onde estou?");
      
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          role: 'model',
          text: initialResponse,
          timestamp: new Date()
        }
      ]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
         id: uuidv4(),
         role: 'system',
         text: 'Erro ao conectar com o plano astral (API Error). Verifique sua chave API.',
         timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await sendMessageToDM(text);
      setMessages(prev => [
        ...prev, 
        {
          id: uuidv4(),
          role: 'model',
          text: response,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
       console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDiceRoll = async (result: DiceRollResult) => {
    const rollMsg: Message = {
      id: uuidv4(),
      role: 'system',
      text: `🎲 O jogador rolou um d${result.sides} e tirou: ${result.value}`,
      timestamp: new Date(),
      isDiceRoll: true
    };
    
    setMessages(prev => [...prev, rollMsg]);
    setIsTyping(true);

    try {
      const response = await sendMessageToDM(`(O jogador rolou o dado d${result.sides}. O resultado foi ${result.value})`);
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          role: 'model',
          text: response,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- Combat Logic ---
  const handleStartCombat = (monster: Monster) => {
    const playerInit = Math.floor(Math.random() * 20) + 1 + Math.floor((character.stats.dex - 10) / 2);
    const monsterInit = Math.floor(Math.random() * 20) + 1 + Math.floor((monster.stats.dex - 10) / 2);

    const playerCombatant: Combatant = {
      id: 'player',
      name: character.name,
      type: 'player',
      hp: { ...character.hp },
      maxHp: character.hp.max,
      initiative: playerInit,
      ac: 10 + Math.floor((character.stats.dex - 10) / 2) + (character.equipment.armor?.statModifier?.value || 0), // Basic AC calc
      sourceId: 'player'
    };

    const monsterCombatant: Combatant = {
      id: uuidv4(),
      name: monster.name,
      type: 'monster',
      hp: { ...monster.hp },
      maxHp: monster.hp.max,
      initiative: monsterInit,
      ac: monster.ac,
      sourceId: monster.id
    };

    const participants = [playerCombatant, monsterCombatant].sort((a, b) => b.initiative - a.initiative);

    setCombatState({
      isActive: true,
      round: 1,
      turnIndex: 0,
      participants,
      log: [`Iniciativa: ${playerCombatant.name} (${playerInit}) vs ${monsterCombatant.name} (${monsterInit})`]
    });

    handleSendMessage(`(O combate começou contra ${monster.name}!)`);
    setSidebarOpen(false); // Close sidebar on mobile to show combat
  };

  const handleCombatUpdate = (newState: CombatState) => {
    setCombatState(newState);
    
    // Sync HP back to character sheet if player took damage
    const playerState = newState.participants.find(p => p.type === 'player');
    if (playerState) {
      setCharacter(prev => ({
        ...prev,
        hp: playerState.hp
      }));
    }
  };

  const handleEndCombat = () => {
    setCombatState(prev => ({ ...prev, isActive: false }));
    handleSendMessage("(O combate terminou.)");
  };

  const handleCombatLog = (text: string) => {
    // Add to chat history so AI knows context
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'system',
      text: text,
      timestamp: new Date()
    }]);
  };

  if (gameState === GameState.SETUP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center p-4">
        <div className="absolute inset-0 bg-rpg-900/80"></div>
        <div className="relative z-10 w-full max-w-4xl bg-rpg-900 border border-rpg-700 shadow-2xl rounded-xl overflow-hidden flex flex-col md:flex-row h-[80vh]">
            <div className="flex-1 p-8 flex flex-col justify-center items-start text-left border-b md:border-b-0 md:border-r border-rpg-700">
                <h1 className="text-5xl font-fantasy text-rpg-accent mb-4">Mestre AI</h1>
                <p className="text-rpg-sub text-lg mb-8">
                    Bem-vindo, aventureiro. Antes de iniciarmos sua jornada, precisamos saber quem você é.
                    Preencha sua ficha e prepare-se para o desconhecido.
                </p>
                <button 
                    onClick={startGame}
                    className="bg-rpg-accent hover:bg-orange-600 text-white text-xl font-bold py-4 px-10 rounded shadow-lg transform transition hover:scale-105"
                >
                    Começar Aventura
                </button>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
                <CharacterSheet character={character} onChange={setCharacter} />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden relative">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-rpg-800 border-b border-rpg-700 flex items-center justify-between px-4 z-20">
        <span className="font-fantasy text-rpg-accent text-lg">Mestre AI</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-2">
            {sidebarOpen ? 'Fechar Menu' : 'Abrir Menu'}
        </button>
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 h-full relative order-2 md:order-1">
        <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isTyping={isTyping}
        />
        {combatState.isActive && (
          <CombatInterface 
            combatState={combatState}
            character={character}
            onCombatUpdate={handleCombatUpdate}
            onEndCombat={handleEndCombat}
            onLogAction={handleCombatLog}
          />
        )}
      </main>

      {/* Sidebar (Character, Inventory, Bestiary) */}
      <aside 
        className={`
            fixed md:relative z-30 w-full md:w-96 h-[calc(100%-3.5rem)] md:h-full bg-rpg-900 border-l border-rpg-700 flex flex-col
            transform transition-transform duration-300 ease-in-out order-1 md:order-2
            ${sidebarOpen ? 'translate-x-0 top-14' : 'translate-x-full md:translate-x-0 top-14 md:top-0'}
        `}
      >
        {/* Sidebar Tabs */}
        <div className="flex border-b border-rpg-700 bg-rpg-800">
          <button 
            onClick={() => setActiveTab('sheet')}
            className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'sheet' ? 'text-rpg-accent border-b-2 border-rpg-accent bg-rpg-900' : 'text-rpg-sub hover:text-white'}`}
          >
            Ficha
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'inventory' ? 'text-rpg-accent border-b-2 border-rpg-accent bg-rpg-900' : 'text-rpg-sub hover:text-white'}`}
          >
            Mochila
          </button>
          <button 
            onClick={() => setActiveTab('bestiary')}
            className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'bestiary' ? 'text-rpg-accent border-b-2 border-rpg-accent bg-rpg-900' : 'text-rpg-sub hover:text-white'}`}
          >
            Bestiário
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
           {activeTab === 'sheet' && (
             <div className="h-full flex flex-col">
               <div className="flex-1 overflow-y-auto p-2">
                 <CharacterSheet character={character} readOnly={true} />
               </div>
               <div className="p-2 border-t border-rpg-700 bg-rpg-900">
                  <DiceRoller onRoll={handleDiceRoll} disabled={isTyping || combatState.isActive} />
               </div>
             </div>
           )}
           {activeTab === 'inventory' && (
             <Inventory character={character} onUpdateCharacter={setCharacter} />
           )}
           {activeTab === 'bestiary' && (
             <Bestiary 
                monsters={monsters} 
                onAddMonster={(m) => setMonsters([...monsters, m])} 
                onStartCombat={handleStartCombat}
             />
           )}
        </div>
      </aside>
    </div>
  );
};

export default App;