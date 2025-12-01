import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { Character } from '../types';

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const API_KEY = process.env.API_KEY || '';

export const initializeGemini = (): boolean => {
  if (!API_KEY) {
    console.error("API Key not found in environment variables.");
    return false;
  }
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    return true;
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
    return false;
  }
};

export const startNewGame = (character: Character): void => {
  if (!ai) initializeGemini();
  if (!ai) throw new Error("AI not initialized");

  const systemPrompt = `
    Você é um Mestre de RPG (Dungeon Master) experiente, criativo e imersivo.
    Você está mestrando uma aventura de fantasia medieval (estilo D&D 5e) para um jogador.
    
    O personagem do jogador é:
    Nome: ${character.name}
    Raça: ${character.race}
    Classe: ${character.class}
    Nível: ${character.level}
    
    Atributos:
    Força: ${character.stats.str}
    Destreza: ${character.stats.dex}
    Constituição: ${character.stats.con}
    Inteligência: ${character.stats.int}
    Sabedoria: ${character.stats.wis}
    Carisma: ${character.stats.cha}

    INSTRUÇÕES:
    1. Seu idioma principal é o PORTUGUÊS (Brasil).
    2. Seja descritivo, use os cinco sentidos para narrar o ambiente.
    3. Interprete os NPCs com personalidade.
    4. Peça testes de atributos (ex: "Faça um teste de Percepção") quando o jogador tentar algo incerto.
    5. Respeite as rolagens de dados do jogador. Se ele falhar, narre as consequências. Se ele tiver sucesso, narre o êxito.
    6. Mantenha o controle da narrativa, mas dê liberdade ao jogador.
    7. Comece a aventura descrevendo onde o personagem está e qual é o gancho inicial da aventura.
    
    Responda em formato de texto limpo. Use parágrafos para separar ações e falas.
  `;

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.9, // Creative and varied
    },
  });
};

export const sendMessageToDM = async (message: string): Promise<string> => {
  if (!chatSession) throw new Error("Chat session not started");

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "";
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "O Mestre parece estar consultando os livros antigos... (Erro de conexão)";
  }
};