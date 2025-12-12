
import React, { useState, useRef, useEffect } from 'react';
import { Character, Monster, Quest } from '../types';

interface GameTableProps {
    party: Character[];
    monsters: Monster[];
    quests: Quest[];
    seed?: string;
}

interface TokenPosition {
    id: string;
    x: number;
    y: number;
    type: 'player' | 'monster';
    initials: string;
    color: string;
}

export const GameTable: React.FC<GameTableProps> = ({ party, monsters, quests, seed = '0' }) => {
    const [tokens, setTokens] = useState<TokenPosition[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // Map Configuration
    const MAP_WIDTH = 2000;
    const MAP_HEIGHT = 1200;
    const GRID_SIZE = 20;

    // Improved Pseudo-Random Number Generator
    const seededRandom = (s: number) => {
        let t = s + 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // Perlin-ish Noise Function (Simple superposition of sines)
    const noise = (x: number, y: number, s: number) => {
        const freq = 0.005;
        return (
            Math.sin(x * freq + s) + 
            Math.sin(y * freq + s) + 
            0.5 * Math.sin(x * freq * 2 + s * 2) + 
            0.5 * Math.sin(y * freq * 2 + s * 2) +
            0.25 * Math.sin(x * freq * 4 + s)
        ) / 2.75; // Normalize roughly between -1 and 1
    };

    // Draw Medieval Map
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Parse seed
        const seedNum = parseInt(seed.replace(/[^0-9]/g, '').substring(0, 5)) || 12345;

        // 1. Base Water Background
        ctx.fillStyle = '#4B6E85'; // Deep Ocean Blue
        ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

        const cols = Math.ceil(MAP_WIDTH / GRID_SIZE);
        const rows = Math.ceil(MAP_HEIGHT / GRID_SIZE);

        // 2. Generate Terrain Features
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const posX = x * GRID_SIZE;
                const posY = y * GRID_SIZE;
                
                // Elevation Noise
                const e = noise(posX, posY, seedNum); 
                // Moisture Noise (offsets the map slightly to create biomes)
                const m = noise(posX + 1000, posY + 1000, seedNum + 500); 

                // Thresholds for Terrain
                if (e > -0.2) { // Landmass starts
                    
                    // Base Land Color
                    if (e < -0.15) {
                        ctx.fillStyle = '#E6D5AC'; // Sand/Beach
                    } else if (e < 0.3) {
                        ctx.fillStyle = '#9CB380'; // Grasslands
                    } else if (e < 0.6) {
                        ctx.fillStyle = '#5F8766'; // Forest Base
                    } else if (e < 0.8) {
                        ctx.fillStyle = '#787368'; // Mountain Base
                    } else {
                        ctx.fillStyle = '#E8E8E8'; // Snow Peaks
                    }
                    
                    // Draw Tile
                    ctx.fillRect(posX, posY, GRID_SIZE + 1, GRID_SIZE + 1); // +1 to prevent gaps

                    // Details
                    if (e >= 0.3 && e < 0.6) {
                        // Draw Forest Trees
                        if (seededRandom(x * y + seedNum) > 0.6) {
                            ctx.fillStyle = '#2D4A33'; // Dark Tree Green
                            ctx.beginPath();
                            ctx.moveTo(posX + GRID_SIZE/2, posY + 2);
                            ctx.lineTo(posX + GRID_SIZE - 2, posY + GRID_SIZE - 2);
                            ctx.lineTo(posX + 2, posY + GRID_SIZE - 2);
                            ctx.fill();
                        }
                    } else if (e >= 0.6 && e < 0.8) {
                        // Draw Mountains
                        ctx.fillStyle = '#4A453E';
                        ctx.beginPath();
                        ctx.moveTo(posX + GRID_SIZE/2, posY + 2);
                        ctx.lineTo(posX + GRID_SIZE, posY + GRID_SIZE);
                        ctx.lineTo(posX, posY + GRID_SIZE);
                        ctx.fill();
                        // Highlight side
                        ctx.fillStyle = '#8C867A';
                        ctx.beginPath();
                        ctx.moveTo(posX + GRID_SIZE/2, posY + 2);
                        ctx.lineTo(posX + GRID_SIZE/2 + 4, posY + GRID_SIZE);
                        ctx.lineTo(posX + GRID_SIZE/2, posY + GRID_SIZE);
                        ctx.fill();
                    } else if (e >= 0.8) {
                        // Snow Caps
                        ctx.fillStyle = '#FFFFFF';
                        ctx.beginPath();
                        ctx.moveTo(posX + GRID_SIZE/2, posY + 2);
                        ctx.lineTo(posX + GRID_SIZE/2 + 5, posY + 8);
                        ctx.lineTo(posX + GRID_SIZE/2 - 5, posY + 8);
                        ctx.fill();
                    }
                } else {
                    // Water Details (Waves)
                    if (seededRandom(x * y + seedNum) > 0.95) {
                        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(posX + 4, posY + 10);
                        ctx.quadraticCurveTo(posX + 10, posY + 5, posX + 16, posY + 10);
                        ctx.stroke();
                    }
                }
            }
        }

        // 3. Grid Overlay (Subtle)
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let x = 0; x <= MAP_WIDTH; x += GRID_SIZE * 4) {
            ctx.moveTo(x, 0); ctx.lineTo(x, MAP_HEIGHT);
        }
        for (let y = 0; y <= MAP_HEIGHT; y += GRID_SIZE * 4) {
            ctx.moveTo(0, y); ctx.lineTo(MAP_WIDTH, y);
        }
        ctx.stroke();

        // 4. Vignette
        const gradient = ctx.createRadialGradient(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH / 3, MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(20,10,0,0.4)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    }, [seed]);

    // Initialize tokens based on party and monsters
    useEffect(() => {
        const newTokens: TokenPosition[] = [];
        
        party.forEach((p, idx) => {
            const existing = tokens.find(t => t.id === p.id);
            newTokens.push({
                id: p.id,
                x: existing ? existing.x : 200 + (idx * 60),
                y: existing ? existing.y : 200,
                type: 'player',
                initials: p.name.substring(0, 2).toUpperCase(),
                color: 'bg-blue-600'
            });
        });

        monsters.forEach((m, idx) => {
            const existing = tokens.find(t => t.id === m.id);
            newTokens.push({
                id: m.id,
                x: existing ? existing.x : 200 + (idx * 60),
                y: existing ? existing.y : 400,
                type: 'monster',
                initials: m.name.substring(0, 2).toUpperCase(),
                color: 'bg-red-600'
            });
        });
        
        setTokens(newTokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [party, monsters]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggingId || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;
        const scrollTop = containerRef.current.scrollTop;
        
        const x = e.clientX - rect.left + scrollLeft - 15; 
        const y = e.clientY - rect.top + scrollTop - 15;

        setTokens(prev => prev.map(t => 
            t.id === draggingId ? { ...t, x, y } : t
        ));
        setDraggingId(null);
    };

    return (
        <div className="flex flex-col h-full bg-rpg-800 p-4 overflow-hidden">
            <h2 className="text-xl font-fantasy text-rpg-accent mb-4">Mapa do Mundo & Missões</h2>
            
            {/* THE MAP CONTAINER */}
            <div 
                ref={containerRef}
                className="w-full h-[500px] bg-[#1a1a1a] rounded-lg border-4 border-[#5d4037] relative overflow-auto shadow-2xl mb-6 scrollbar-thin cursor-grab active:cursor-grabbing"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div style={{ width: MAP_WIDTH, height: MAP_HEIGHT, position: 'relative' }}>
                    {/* The Drawn Map */}
                    <canvas 
                        ref={canvasRef}
                        width={MAP_WIDTH}
                        height={MAP_HEIGHT}
                        className="absolute inset-0 pointer-events-none"
                    />

                    {/* Map Info Overlay */}
                    <div className="absolute top-4 left-4 z-20 bg-[#f3e5ab] px-4 py-2 rounded shadow border border-[#8b4513] transform rotate-[-1deg]">
                        <h3 className="font-fantasy text-[#5d4037] font-bold text-lg border-b border-[#8b4513] mb-1">Terras de Itan</h3>
                        <p className="text-xs text-[#5d4037] font-mono opacity-80">Seed: {seed}</p>
                    </div>
                    
                    {/* Tokens */}
                    {tokens.map(token => (
                        <div
                            key={token.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, token.id)}
                            className={`
                                absolute w-10 h-10 rounded-full 
                                ${token.color} 
                                border-2 border-white 
                                text-white
                                flex items-center justify-center 
                                font-serif font-bold text-xs 
                                cursor-move shadow-[0_4px_6px_rgba(0,0,0,0.5)] z-30 
                                hover:scale-110 transition-transform select-none
                                ring-2 ring-black/50
                            `}
                            style={{ left: token.x, top: token.y }}
                            title={token.type === 'player' ? 'Herói' : 'Inimigo'}
                        >
                            {token.initials}
                        </div>
                    ))}
                </div>
            </div>

            {/* QUEST BOARD */}
            <div className="overflow-y-auto flex-1 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#4e342e] p-4 rounded border-4 border-[#3e2723] shadow-inner">
                <h3 className="text-sm font-bold text-[#d7ccc8] uppercase mb-3 text-center border-b border-[#8d6e63] pb-2 tracking-widest drop-shadow-md">
                    📜 Quadro de Missões
                </h3>
                <div className="grid gap-3">
                    {quests.length === 0 && <p className="text-[#a1887f] italic text-sm text-center">Nenhuma missão disponível. Explore o mundo para encontrar aventuras.</p>}
                    {quests.map(quest => (
                        <div key={quest.id} className="bg-[#fff8e1] p-3 rounded shadow-md relative overflow-hidden transform hover:scale-[1.01] transition-transform text-[#3e2723] border border-[#d7ccc8]">
                            {quest.status === 'completed' && (
                                <div className="absolute top-2 right-2 bg-green-700 text-[9px] px-2 py-0.5 rounded text-white font-bold uppercase tracking-wider shadow">
                                    Concluída
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-2xl">🛡️</div>
                                <div>
                                    <h4 className="font-bold text-base font-fantasy text-[#5d4037]">{quest.title}</h4>
                                    <p className="text-xs my-1 text-[#4e342e] leading-relaxed italic">"{quest.description}"</p>
                                    <p className="text-[10px] font-bold text-[#795548] mt-2 bg-[#efebe9] inline-block px-2 py-1 rounded border border-[#d7ccc8]">
                                        Recompensa: {quest.reward}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
