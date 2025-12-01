export interface Character {
  name: string;
  class: string;
  race: string;
  level: number;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  hp: {
    current: number;
    max: number;
  };
  equipment: {
    weapon: Item | null;
    armor: Item | null;
  };
  inventory: Item[];
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'item';
  description: string;
  statModifier?: {
    stat: keyof Character['stats'] | 'ac';
    value: number;
  };
  damage?: string; // e.g. "1d8"
}

export interface Monster {
  id: string;
  name: string;
  hp: { current: number; max: number };
  ac: number;
  stats: { str: number; dex: number }; // Simplified for MVP
  attacks: { name: string; damage: string }[];
  description: string;
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
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  COMBAT = 'COMBAT',
}

export interface CombatState {
  isActive: boolean;
  round: number;
  turnIndex: number; // Index in the participants array
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
  ac: number; // Armor Class
  sourceId?: string; // Ref to original monster or character
}