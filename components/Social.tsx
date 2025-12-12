
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Character, SocialBond } from '../types';

interface SocialProps {
    character: Character;
    party: Character[];
    onAction: (action: string, data: string) => void; 
    isDevMode?: boolean; 
    isNsfwMode?: boolean;
}

export const Social: React.FC<SocialProps> = ({ character, party, onAction, isDevMode = false, isNsfwMode = false }) => {
    const [makingProgress, setMakingProgress] = useState(0);
    const [isMaking, setIsMaking] = useState(false);
    
    // Manual NPC adding state
    const [showAddNpc, setShowAddNpc] = useState(false);
    const [newNpcName, setNewNpcName] = useState('');
    const [newNpcGender, setNewNpcGender] = useState<'Masculino'|'Feminino'>('Feminino');
    const [newNpcOccupation, setNewNpcOccupation] = useState('');
    const [newNpcPersonality, setNewNpcPersonality] = useState('');

    const partyIds = party.map(p => p.id);
    const npcBonds = character.social.filter(bond => !partyIds.includes(bond.targetId));
    
    const relevantIds = [
        ...party.filter(p => p.id !== character.id).map(p => p.id),
        ...npcBonds.map(b => b.targetId)
    ];

    const getRelation = (targetId: string): SocialBond => {
        const existing = character.social?.find(s => s.targetId === targetId);
        if (existing) return existing;

        const partyMember = party.find(p => p.id === targetId);
        return {
            targetId,
            targetName: partyMember ? partyMember.name : 'Desconhecido',
            targetGender: partyMember ? partyMember.gender : 'Desconhecido',
            occupation: partyMember ? partyMember.class : 'Aventureiro',
            personality: 'Heróico',
            affinity: 0,
            relation: 'Neutro'
        };
    };

    const getStatusLabel = (affinity: number) => {
        if (affinity <= -40) return { label: 'Inimigo Mortal', color: 'text-red-600' };
        if (affinity <= -20) return { label: 'Inimigo', color: 'text-red-500' };
        if (affinity <= -10) return { label: 'Desgosto', color: 'text-orange-500' };
        if (affinity < 10) return { label: 'Neutro', color: 'text-gray-400' };
        if (affinity < 25) return { label: 'Conhecido', color: 'text-blue-300' };
        if (affinity < 40) return { label: 'Amigo', color: 'text-green-400' };
        return { label: 'Amor/Leal', color: 'text-pink-500 font-bold' };
    };

    const handleFazer = (targetId: string) => {
        setIsMaking(true);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setMakingProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setIsMaking(false);
                setMakingProgress(0);
                onAction('fazer', targetId);
            }
        }, 300); 
    };

    const handleAddNpc = () => {
        if (!newNpcName.trim()) return;
        const newBond: SocialBond = {
            targetId: uuidv4(),
            targetName: newNpcName,
            targetGender: newNpcGender,
            occupation: newNpcOccupation || 'Desconhecido',
            personality: newNpcPersonality || 'Neutro',
            affinity: 0,
            relation: 'Neutro'
        };
        onAction('add_bond', JSON.stringify(newBond)); 
        setNewNpcName('');
        setNewNpcOccupation('');
        setNewNpcPersonality('');
        setShowAddNpc(false);
    };

    return (
        <div className="flex flex-col h-full bg-rpg-800 text-white p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-fantasy text-rpg-accent">Social & Vínculos</h2>
                {isDevMode && (
                    <button 
                        onClick={() => setShowAddNpc(!showAddNpc)}
                        className="text-xs bg-rpg-700 border border-rpg-600 px-2 py-1 rounded hover:bg-rpg-600"
                    >
                        + Add NPC (Dev)
                    </button>
                )}
            </div>
            
            {showAddNpc && (
                <div className="bg-rpg-900 p-3 rounded border border-rpg-700 mb-4 animate-in fade-in">
                    <input 
                        className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm mb-2 text-white"
                        placeholder="Nome do NPC"
                        value={newNpcName}
                        onChange={e => setNewNpcName(e.target.value)}
                    />
                    <input 
                        className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm mb-2 text-white"
                        placeholder="Profissão (Ex: Ferreiro)"
                        value={newNpcOccupation}
                        onChange={e => setNewNpcOccupation(e.target.value)}
                    />
                    <input 
                        className="w-full bg-rpg-800 border border-rpg-700 rounded p-2 text-sm mb-2 text-white"
                        placeholder="Personalidade (Ex: Ranzinza)"
                        value={newNpcPersonality}
                        onChange={e => setNewNpcPersonality(e.target.value)}
                    />
                    <div className="flex gap-2 mb-2">
                        <button 
                            onClick={() => setNewNpcGender('Masculino')}
                            className={`flex-1 py-1 text-xs rounded border ${newNpcGender === 'Masculino' ? 'bg-blue-900 border-blue-500' : 'bg-rpg-800 border-rpg-700'}`}
                        >
                            Masculino
                        </button>
                        <button 
                            onClick={() => setNewNpcGender('Feminino')}
                            className={`flex-1 py-1 text-xs rounded border ${newNpcGender === 'Feminino' ? 'bg-pink-900 border-pink-500' : 'bg-rpg-800 border-rpg-700'}`}
                        >
                            Feminino
                        </button>
                    </div>
                    <button onClick={handleAddNpc} className="w-full bg-green-700 hover:bg-green-600 text-xs py-2 rounded font-bold">
                        Confirmar
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {relevantIds.map(targetId => {
                    const relation = getRelation(targetId);
                    const isPartner = character.partnerId === targetId;
                    const status = getStatusLabel(relation.affinity);
                    
                    const isSameGender = character.gender === relation.targetGender;
                    const canDate = relation.affinity >= 30 && !isSameGender;
                    const canMarry = relation.affinity >= 45 && !isSameGender;
                    
                    let displayRelation: string = relation.relation;
                    if (isPartner) displayRelation = 'Parceiro(a)';

                    return (
                        <div key={targetId} className="bg-rpg-900 border border-rpg-700 rounded p-4">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-lg">{relation.targetName}</h3>
                                <span className="text-[10px] text-gray-500 bg-black/30 px-2 rounded">
                                    {relation.targetGender}
                                </span>
                            </div>
                            
                            {/* NEW: Occupation and Personality Display */}
                            <div className="flex flex-col gap-1 mb-2 text-xs text-rpg-sub">
                                <div className="flex items-center gap-2">
                                    <span className="opacity-70">💼</span>
                                    <span>{relation.occupation || 'Desconhecido'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="opacity-70">🧠</span>
                                    <span className="italic">{relation.personality || 'Neutro'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs mb-2">
                                <span className={`${status.color} font-bold`}>{status.label} ({relation.affinity})</span>
                                <span className={`px-2 py-0.5 rounded border ${isPartner ? 'bg-pink-900/50 border-pink-500 text-pink-300' : 'border-gray-600 text-gray-400'}`}>
                                    {displayRelation}
                                </span>
                            </div>

                            {/* Affinity Bar */}
                            <div className="w-full bg-gray-800 h-2 rounded-full mb-3 relative overflow-hidden">
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-500 z-10"></div>
                                <div 
                                    className={`h-full rounded-full transition-all ${relation.affinity < 0 ? 'bg-red-500' : 'bg-green-500'}`} 
                                    style={{ 
                                        width: `${Math.abs(relation.affinity) / 100 * 100 * 2}%`, 
                                        position: 'absolute',
                                        left: relation.affinity >= 0 ? '50%' : `calc(50% - ${Math.abs(relation.affinity)/50*50}%)`
                                    }}
                                ></div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3">
                                {relation.relation !== 'Namorado(a)' && relation.relation !== 'Esposo(a)' && !isPartner && (
                                     <button 
                                        onClick={() => onAction('date', targetId)}
                                        disabled={!canDate}
                                        className={`py-1 rounded text-xs border ${canDate ? 'bg-pink-900 hover:bg-pink-800 border-pink-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'}`}
                                     >
                                         ❤️ Namorar
                                     </button>
                                )}
                                
                                {(relation.relation === 'Namorado(a)' || canMarry) && relation.relation !== 'Esposo(a)' && (
                                    <button 
                                        onClick={() => onAction('marry', targetId)}
                                        disabled={!canMarry}
                                        className={`py-1 rounded text-xs border ${canMarry ? 'bg-yellow-900 hover:bg-yellow-800 border-yellow-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'}`}
                                    >
                                        💍 Casar
                                    </button>
                                )}

                                {isPartner && (
                                    <>
                                        <button 
                                            onClick={() => handleFazer(targetId)}
                                            disabled={isMaking}
                                            className="col-span-2 bg-purple-700 hover:bg-purple-600 py-1 rounded text-xs border border-purple-600 font-bold relative overflow-hidden text-white"
                                        >
                                            {isMaking ? `... ${makingProgress}%` : '💞 AMOR'}
                                        </button>
                                        {isNsfwMode && character.gender === 'Masculino' && relation.relation === 'Esposo(a)' && (
                                            <button 
                                                onClick={() => onAction('milk_spouse', targetId)}
                                                className="col-span-2 mt-1 bg-pink-900/50 hover:bg-pink-800 border border-pink-600 text-white py-1 rounded text-[10px]"
                                            >
                                                🍼 Ordenhar Esposa (Extra)
                                            </button>
                                        )}
                                    </>
                                )}
                                
                                {isDevMode && (
                                    <div className="col-span-2 flex gap-1 justify-center mt-1">
                                        <button onClick={() => onAction('adjust_affinity', JSON.stringify({id: targetId, val: -5}))} className="bg-red-900/50 text-red-200 text-[10px] px-2 rounded">-5 (Dev)</button>
                                        <button onClick={() => onAction('adjust_affinity', JSON.stringify({id: targetId, val: 5}))} className="bg-green-900/50 text-green-200 text-[10px] px-2 rounded">+5 (Dev)</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
