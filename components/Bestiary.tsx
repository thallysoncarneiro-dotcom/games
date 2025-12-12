
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Monster } from '../types';

interface BestiaryProps {
  monsters: Monster[];
  onAddMonster: (monster: Monster) => void;
  onStartCombat: (monster: Monster) => void;
  onSelectRace?: (name: string) => void; 
}

type TegCategory = 'primaria' | 'secundaria' | 'terciaria';

interface TegDefinition {
  id: number;
  name: string;
  allowed: TegCategory[];
  description: string;
}

const TEG_LIST: TegDefinition[] = [
  { id: 1, name: 'humanoides', allowed: ['secundaria'], description: 'Aparência humanoide' },
  { id: 2, name: 'hibridos', allowed: ['secundaria'], description: 'Fusões entre duas espécies' },
  { id: 3, name: 'draconianos', allowed: ['primaria'], description: 'Dragões ou metade dragões' },
  { id: 4, name: 'neutros', allowed: ['primaria', 'secundaria'], description: 'Animais da vida real' },
  { id: 5, name: 'bestial', allowed: ['primaria', 'secundaria'], description: 'Feras irracionais' },
  { id: 6, name: 'elementais', allowed: ['primaria'], description: 'Feitos de elementos puros' },
  { id: 7, name: 'faéricos', allowed: ['primaria'], description: 'Ligados à magia natural' },
  { id: 8, name: 'sombríos', allowed: ['primaria', 'secundaria'], description: 'Associados à escuridão' },
  { id: 9, name: 'golemicos', allowed: ['primaria'], description: 'Construtos animados' },
  { id: 10, name: 'colossais', allowed: ['primaria'], description: 'Criaturas gigantes' },
  { id: 11, name: 'parasíticos', allowed: ['primaria', 'secundaria'], description: 'Vivem de hospedeiros' },
  { id: 12, name: 'aviarios', allowed: ['secundaria'], description: 'Características de aves' },
  { id: 13, name: 'aracnideos', allowed: ['secundaria'], description: 'Baseados em aranhas' },
  { id: 14, name: 'plantoides', allowed: ['primaria', 'secundaria'], description: 'Vegetais vivos' },
  { id: 15, name: 'mineralóides', allowed: ['primaria'], description: 'Pedra, cristal ou metal vivo' },
  { id: 16, name: 'metamorfos', allowed: ['secundaria', 'terciaria'], description: 'Mudam de forma' },
  { id: 17, name: 'psíquicos', allowed: ['secundaria', 'terciaria'], description: 'Poder mental' },
  { id: 18, name: 'felinoides', allowed: ['terciaria'], description: 'Baseados em felinos' },
  { id: 19, name: 'canideos', allowed: ['terciaria'], description: 'Lobos e cães' },
  { id: 20, name: 'insetoides', allowed: ['secundaria', 'terciaria'], description: 'Baseados em insetos' },
];

const DEFAULT_MONSTERS: Monster[] = [
  {
    id: 'humano',
    name: 'Humano',
    level: 1,
    levelRange: '1-100',
    hp: { current: 10, max: 10 },
    ac: 10,
    stats: { str: 10, dex: 10 },
    attacks: [{ name: 'Soco', damage: '1' }],
    description: 'Versátil e ambicioso.',
    tegs: '(humanoides)'
  },
  {
    id: 'porco', name: 'Porco', level: 1,
    hp: { current: 4, max: 4 }, ac: 9, stats: { str: 8, dex: 8 },
    attacks: [{ name: 'Mordida', damage: '1d4' }], description: 'Animal de fazenda comum.', tegs: '[neutros]'
  },
  {
    id: 'cabra', name: 'Cabra', level: 1,
    hp: { current: 5, max: 5 }, ac: 10, stats: { str: 9, dex: 10 },
    attacks: [{ name: 'Chifrada', damage: '1d4' }], description: 'Teimosa e ágil.', tegs: '[neutros]'
  },
  {
    id: 'vaca', name: 'Vaca', level: 2,
    hp: { current: 12, max: 12 }, ac: 9, stats: { str: 14, dex: 8 },
    attacks: [{ name: 'Investida', damage: '1d6' }], description: 'Gado robusto.', tegs: '[neutros]'
  },
  {
    id: 'cobra', name: 'Cobra Venenosa', level: 1,
    hp: { current: 3, max: 3 }, ac: 12, stats: { str: 4, dex: 14 },
    attacks: [{ name: 'Picada', damage: '1d4' }], description: 'Réptil perigoso.', tegs: '[neutros]'
  },
  {
    id: 'cavalo', name: 'Cavalo', level: 2,
    hp: { current: 14, max: 14 }, ac: 11, stats: { str: 14, dex: 12 },
    attacks: [{ name: 'Patada', damage: '1d6' }], description: 'Forte e veloz.', tegs: '[neutros]'
  },
  {
    id: 'lobo', name: 'Lobo', level: 2,
    hp: { current: 10, max: 10 }, ac: 12, stats: { str: 10, dex: 13 },
    attacks: [{ name: 'Mordida', damage: '1d6' }], description: 'Caçador em matilha.', tegs: '[neutros/canideos]'
  },
  {
    id: 'urso', name: 'Urso Pardo', level: 4,
    hp: { current: 30, max: 30 }, ac: 12, stats: { str: 16, dex: 10 },
    attacks: [{ name: 'Garras', damage: '1d8' }], description: 'Predador massivo.', tegs: '[neutros/bestial]'
  },
  {
    id: 'aguia', name: 'Águia Gigante', level: 3,
    hp: { current: 15, max: 15 }, ac: 13, stats: { str: 12, dex: 15 },
    attacks: [{ name: 'Rasante', damage: '1d6' }], description: 'Predador dos céus.', tegs: '[neutros/aviarios]'
  },
  {
    id: 'rato', name: 'Rato Gigante', level: 1,
    hp: { current: 5, max: 5 }, ac: 11, stats: { str: 6, dex: 12 },
    attacks: [{ name: 'Mordida', damage: '1d4' }], description: 'Praga de esgotos.', tegs: '[neutros]'
  },
];

export const Bestiary: React.FC<BestiaryProps> = ({ monsters, onAddMonster, onStartCombat, onSelectRace }) => {
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState(1);
  const [levelRange, setLevelRange] = useState('');
  const [hp, setHp] = useState(10);
  const [ac, setAc] = useState(10);
  const [damage, setDamage] = useState('1d6'); 
  const [desc, setDesc] = useState('');
  
  // Tag Selection State (Strict Slots)
  const [primaryTeg, setPrimaryTeg] = useState('');
  const [secondaryTeg, setSecondaryTeg] = useState('');
  const [tertiaryTeg, setTertiaryTeg] = useState('');

  const handleCreate = () => {
    if (!name) return;

    const parts = [];
    if (primaryTeg) parts.push(primaryTeg);
    if (secondaryTeg) parts.push(secondaryTeg);
    if (tertiaryTeg) parts.push(tertiaryTeg);
    
    const finalTegString = parts.length > 0 ? `[${parts.join('/')}]` : '(sem teg)';

    const monster: Monster = {
      id: uuidv4(),
      name: name,
      level: level,
      levelRange: levelRange || `${level}-${level}`,
      hp: { current: hp, max: hp },
      ac: ac,
      stats: { str: 10, dex: 10 },
      attacks: [{ name: 'Ataque Básico', damage: damage }], 
      description: desc,
      tegs: finalTegString
    };

    onAddMonster(monster);
    resetForm();
  };

  const resetForm = () => {
    setIsCreating(false);
    setName('');
    setLevel(1);
    setLevelRange('');
    setHp(10);
    setAc(10);
    setDamage('1d6');
    setDesc('');
    setPrimaryTeg('');
    setSecondaryTeg('');
    setTertiaryTeg('');
  };

  const primaryOptions = TEG_LIST.filter(t => t.allowed.includes('primaria'));
  const secondaryOptions = TEG_LIST.filter(t => t.allowed.includes('secundaria'));
  const tertiaryOptions = TEG_LIST.filter(t => t.allowed.includes('terciaria'));

  return (
    <div className="flex flex-col h-full bg-rpg-800 text-white p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-fantasy text-rpg-accent">Bestiário & Espécies</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="text-xs bg-rpg-700 hover:bg-rpg-600 px-3 py-1 rounded border border-rpg-600"
        >
          {isCreating ? 'Cancelar' : '+ Registrar Espécie'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-rpg-900 p-4 rounded border border-rpg-700 mb-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-rpg-sub uppercase border-b border-rpg-700 pb-1">Criar Criatura / Espécie</h3>
          
          <input 
            className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm focus:border-rpg-accent outline-none"
            placeholder="Nome (Ex: Orc, Dragão)"
            value={name}
            onChange={e => setName(e.target.value)}
          />

           <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Nível Base</label>
              <input 
                type="number"
                min="1"
                className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm"
                value={level}
                onChange={e => setLevel(Math.max(1, parseInt(e.target.value)))}
              />
            </div>
             <div>
              <label className="text-xs text-gray-500">Faixa de Nível (Ex: 40-50)</label>
              <input 
                type="text"
                className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm"
                placeholder="Ex: 5-10"
                value={levelRange}
                onChange={e => setLevelRange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">HP Médio</label>
              <input 
                type="number"
                className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm"
                value={hp}
                onChange={e => setHp(parseInt(e.target.value))}
              />
            </div>
             <div>
              <label className="text-xs text-gray-500">Classe de Armadura (CA)</label>
              <input 
                type="number"
                className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm"
                value={ac}
                onChange={e => setAc(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div>
             <label className="text-xs text-gray-500">Dano Médio (ex: 1d6 ou 5-10)</label>
             <input 
              type="text"
              className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm"
              placeholder="Ex: 1d6, 5-10, 8"
              value={damage}
              onChange={e => setDamage(e.target.value)}
            />
          </div>

          <div className="space-y-2 bg-black/20 p-3 rounded border border-rpg-700/50">
            <span className="text-xs text-rpg-accent font-bold uppercase block mb-1">Classificação (TEGs)</span>
            <div className="grid grid-cols-1 gap-2">
              <select 
                value={primaryTeg} 
                onChange={e => setPrimaryTeg(e.target.value)}
                className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-xs text-gray-300"
              >
                <option value="">-- Categoria Primária --</option>
                {primaryOptions.map(t => (
                  <option key={t.id} value={t.name}>{t.id}. {t.name} ({t.description})</option>
                ))}
              </select>

              <select 
                value={secondaryTeg} 
                onChange={e => setSecondaryTeg(e.target.value)}
                className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-xs text-gray-300"
                disabled={!primaryTeg}
              >
                <option value="">-- Categoria Secundária --</option>
                {secondaryOptions.map(t => (
                  <option key={t.id} value={t.name} disabled={t.name === primaryTeg}>{t.id}. {t.name} ({t.description})</option>
                ))}
              </select>

              <select 
                value={tertiaryTeg} 
                onChange={e => setTertiaryTeg(e.target.value)}
                className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-xs text-gray-300"
                disabled={!secondaryTeg}
              >
                <option value="">-- Categoria Terciária --</option>
                {tertiaryOptions.map(t => (
                  <option key={t.id} value={t.name} disabled={t.name === secondaryTeg}>{t.id}. {t.name} ({t.description})</option>
                ))}
              </select>
            </div>
          </div>
          
          <textarea 
             className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm h-20"
             placeholder="Descrição visual e comportamental..."
             value={desc}
             onChange={e => setDesc(e.target.value)}
          />
          
          <button 
            onClick={handleCreate}
            className="w-full bg-rpg-accent hover:bg-orange-600 py-3 rounded font-bold text-white shadow-md"
          >
            Registrar no Livro
          </button>
        </div>
      )}

      <div className="space-y-4 pb-20">
        {[...DEFAULT_MONSTERS, ...monsters].map(monster => (
          <div key={monster.id} className="bg-rpg-900 border border-rpg-700 rounded-lg p-4 shadow-md hover:border-rpg-600 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg text-white">
                    {monster.name} <span className="text-sm text-gray-500 font-normal">Nvl {monster.level} {monster.levelRange ? `(${monster.levelRange})` : ''}</span>
                </h3>
                <span className="text-xs font-mono text-rpg-accent block mb-1">
                  {monster.tegs || '(sem teg)'}
                </span>
                <p className="text-xs text-rpg-sub italic line-clamp-2">{monster.description}</p>
              </div>
              <div className="text-right text-xs text-rpg-sub flex flex-col gap-1">
                <span className="bg-red-900/30 px-2 py-0.5 rounded border border-red-900/50 text-red-300">HP: {monster.hp.max}</span>
                <span className="bg-blue-900/30 px-2 py-0.5 rounded border border-blue-900/50 text-blue-300">CA: {monster.ac}</span>
                <span className="bg-gray-700/50 px-2 py-0.5 rounded border border-gray-600 text-gray-300" title="Dano Médio">⚔️: {monster.attacks[0]?.damage || '?'}</span>
              </div>
            </div>
            
            <div className="mt-3 border-t border-rpg-800 pt-3 flex justify-end gap-2">
              {onSelectRace && (
                  <button
                    onClick={() => onSelectRace(monster.name)}
                    className="bg-rpg-700 hover:bg-rpg-600 text-white border border-rpg-500 text-xs px-3 py-2 rounded flex items-center gap-2 transition-all active:scale-95"
                    title="Escolher como Raça do Personagem"
                  >
                    👤 Escolher Raça
                  </button>
              )}
              <button 
                onClick={() => onStartCombat(monster)}
                className="bg-red-900/40 hover:bg-red-800 text-red-200 border border-red-800 text-xs px-3 py-2 rounded flex items-center gap-2 transition-all active:scale-95"
              >
                ⚔️ Combate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
