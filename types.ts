
export interface Character {
  id: string;
  name: string;
  class: string;
  race: string;
  origin: 'Nativo' | 'Forasteiro'; 
  gender: 'Masculino' | 'Feminino'; 
  level: number;
  age: number; 
  likes: string; 
  dislikes: string; 
  stats: {
    for: number; 
    def: number; 
    vit: number; 
    agi: number; 
    int: number; 
  };
  xp: {
    current: number;
    max: number;
  };
  evoPoints: {
    current: number; 
    total: number;   
  };
  classPoints: number; 
  skills: { id: string; name: string; level: number }[]; 
  hp: {
    current: number;
    max: number;
  };
  mp: { 
    current: number;
    max: number;
  };
  // New Currency System
  wallet: {
      copper: number;   // 1 cent
      iron: number;     // 1 real (100 copper)
      gold: number;     // 100 reais (100 iron)
      platinum: number; // 100 gold
  };
  conditions: string[]; 
  activeEffects: ActiveEffect[];
  equipment: {
    head: Item | null;     
    body: Item | null;     
    legs: Item | null;     
    feet: Item | null;     
    mainHand: Item | null; 
    offHand: Item | null;  
    accessory1: Item | null; 
    accessory2: Item | null; 
    backpack: Item | null;   
  };
  inventory: Item[];
  social: SocialBond[]; 
  partnerId?: string;
  // New: Proposals/Notifications
  notifications: GameNotification[];
}

export interface GameNotification {
    id: string;
    type: 'proposal';
    subtype: 'dating' | 'marriage';
    fromId: string;
    fromName: string;
    text: string;
}

export interface ActiveEffect {
    id: string;
    name: string;
    description: string;
    duration: number; // In turns/actions
    intensity: number; // Stack count (starts at 1, increases by 1 which adds 5% power)
}

export interface SocialBond {
    targetId: string;
    targetName: string;
    targetGender: 'Masculino' | 'Feminino' | 'Desconhecido';
    occupation?: string; 
    personality?: string; 
    affinity: number; 
    relation: 'Neutro' | 'Amigo' | 'Namorado(a)' | 'Esposo(a)' | 'Inimigo';
}

export type MainTag = 'Equipável' | 'Consumível' | 'Material' | 'Ferramenta' | 'Especial';
export type SecondaryTag = 'Arma de Coleta' | 'Arma de Combate' | 'Recurso Bruto' | 'Catalisador Mágico' | 'Proteção Leve' | 'Acessório Técnico' | 'Nenhuma';
export type ItemSlot = 'head' | 'body' | 'legs' | 'feet' | 'mainHand' | 'offHand' | 'accessory1' | 'accessory2' | 'backpack' | 'none';

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'item';
  slot?: ItemSlot; 
  description: string;
  price?: number;
  quantity?: number; 
  statModifier?: {
    stat: keyof Character['stats'] | 'ac';
    value: number;
  };
  damage?: string; 
  tags?: {
    main: MainTag;
    secondary: SecondaryTag;
  };
}

export interface Recipe {
    id: string;
    result: Item;
    ingredients: { name: string; count: number }[];
}

export interface Monster {
  id: string;
  name: string;
  level: number;
  levelRange?: string; 
  hp: { current: number; max: number };
  ac: number;
  stats: { str: number; dex: number }; 
  attacks: { name: string; damage: string }[];
  description: string;
  tegs: string; 
  position?: { x: number; y: number }; 
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: string;
  status: 'active' | 'completed' | 'failed';
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isDiceRoll?: boolean;
}

export interface DiceRollResult {
  sides: number;
  value: number;
  total: number;
  modifier?: number;
}

export enum GameState {
  WORLD_SELECT = 'WORLD_SELECT', 
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  COMBAT = 'COMBAT',
}

export interface CombatState {
  isActive: boolean;
  round: number;
  turnIndex: number; 
  participants: Combatant[];
  log: string[];
}

export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'monster';
  hp: { current: number; max: number };
  maxHp: number;
  initiative: number;
  ac: number; 
  sourceId?: string; 
}

export interface World {
    id: string;
    name: string;
    era?: string; 
    mode: 'online' | 'offline';
    createdAt: string;
    lastPlayed: string;
    party: Character[];
    messages: Message[];
    monsters: Monster[];
    quests: Quest[];
    seed?: string;
    worldDetails?: string;
    initialPlot?: string;
}
