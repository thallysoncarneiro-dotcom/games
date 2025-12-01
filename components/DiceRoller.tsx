import React from 'react';
import { DiceRollResult } from '../types';

interface DiceRollerProps {
  onRoll: (result: DiceRollResult) => void;
  disabled?: boolean;
}

const DICE_TYPES = [
  { sides: 4, label: 'd4', color: 'bg-red-600' },
  { sides: 6, label: 'd6', color: 'bg-blue-600' },
  { sides: 8, label: 'd8', color: 'bg-green-600' },
  { sides: 10, label: 'd10', color: 'bg-purple-600' },
  { sides: 12, label: 'd12', color: 'bg-orange-600' },
  { sides: 20, label: 'd20', color: 'bg-yellow-600' },
];

export const DiceRoller: React.FC<DiceRollerProps> = ({ onRoll, disabled }) => {
  const handleRoll = (sides: number) => {
    const value = Math.floor(Math.random() * sides) + 1;
    // Simple logic: no modifier by default here, can be enhanced
    onRoll({ sides, value, total: value });
  };

  return (
    <div className="p-4 bg-rpg-800 rounded-lg shadow-lg border border-rpg-700">
      <h3 className="text-sm font-bold text-rpg-sub uppercase mb-3 tracking-wider">Dados do Destino</h3>
      <div className="grid grid-cols-3 gap-3">
        {DICE_TYPES.map((die) => (
          <button
            key={die.sides}
            onClick={() => handleRoll(die.sides)}
            disabled={disabled}
            className={`${die.color} hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-2 rounded shadow-md transition-transform active:scale-95 flex flex-col items-center justify-center`}
          >
            <span className="text-xs opacity-75">ROLL</span>
            <span className="text-lg">{die.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};