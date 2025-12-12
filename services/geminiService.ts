
import { GoogleGenAI, Chat } from "@google/genai";
import { Character, Monster, Quest } from '../types';

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const API_KEY = process.env.API_KEY || '';

export const initializeGemini = (): boolean => {
  if (!API_KEY) {
    console.warn("API Key not found or empty. Switching to offline capabilities where possible.");
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

export const startNewGame = (party: Character[], worldDetails: string = "", initialPlot: string = ""): void => {
  if (!initializeGemini()) {
      console.log("Starting in Offline Mode (AI unavailable)");
      return;
  }
  
  if (!ai) return;

  const charactersDescription = party.map((char, index) => `
    Jogador ${index + 1}:
    Nome: ${char.name} | Classe: ${char.class} | Raça: ${char.race} | Nível: ${char.level}
    Atributos: FOR:${char.stats.for}, DEF:${char.stats.def}, VIT:${char.stats.vit}, AGI:${char.stats.agi}, INT:${char.stats.int}
  `).join('\n');

  const systemPrompt = `
    Você é o [LEITOR ONISCIENTE].
    Você é o Mestre de RPG (Dungeon Master).
    
    DETALHES DO MUNDO:
    ${worldDetails ? worldDetails : "Mundo padrão de fantasia."}

    ENREDO INICIAL:
    ${initialPlot ? initialPlot : "Introduza os personagens em uma situação de aventura."}

    JOGADORES:
    ${charactersDescription}

    REGRAS DE CONTEXTO:
    Você receberá dados ocultos sobre o inventário, equipamento, relacionamentos e missões dos jogadores a cada turno. USE ESSES DADOS.
    - Se um jogador equipar algo novo, comente.
    - Se um jogador estiver 'Grávida', avance a gravidez conforme o tempo passa na narrativa.
    - Se um NPC tiver afinidade alta, faça-o agir como amigo/amante.
    - Avalie a dificuldade das ações para dar recompensas justas.

    TAGS DE COMANDO (Use para alterar o jogo):
    - [COMBATE: NomeDoMonstro]: Inicia lutas.
    - [ITEM: NomeDoItem]: Dá um item.
    - [LOJA: TIPO]: Abre loja (Geral, Ferreiro, Magia).
    - [NPC: Nome|Genero|Profissao|Personalidade]: Registra um novo NPC. OBRIGATORIAMENTE use o formato: Nome|Genero|Profissao|Personalidade. Ex: [NPC: Gary|Masculino|Ferreiro|Ranzinza].
    - [QUEST: Título|Descrição|Recompensa]: Cria uma missão nova.
    - [REWARD: XP|Gold]: Dá XP ou Ouro direto ao grupo (ex: [REWARD: 100|50]).

    ESTILO: Narrativo, imersivo, reativo às escolhas e itens dos jogadores.
    Responda em PORTUGUÊS (Brasil).
  `;

  try {
      chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.9, 
        },
      });
  } catch (e) {
      console.error("Failed to create chat session", e);
      chatSession = null;
  }
};

export const generateOfflineResponse = (lastMessage: string): string => {
    const lower = lastMessage.toLowerCase();
    if (lower.includes('atacar') || lower.includes('ataque')) return "[Leitor Onisciente]: A violência é uma escolha. Role os dados. (Modo Offline)";
    if (lower.includes('olhar') || lower.includes('procurar')) return "[Leitor Onisciente]: Seus olhos varrem o local. Nada de especial. (Modo Offline)";
    if (lower.includes('loja')) return "[Leitor Onisciente]: O destino colocou um mercador aqui. [LOJA: GERAL]";
    return "[Leitor Onisciente]: O destino aguarda. (Offline - Conecte a API para narrativa completa)";
};

// Expanded function to include full game state context
export const sendMessageToDM = async (
    message: string, 
    activeChar: Character,
    party: Character[],
    monsters: Monster[], 
    quests: Quest[],
    isDevMode: boolean = false, 
    isOffline: boolean = false
): Promise<string> => {
  if (isOffline || !chatSession) {
      return generateOfflineResponse(message);
  }

  // Serialize Equipment
  const eq = activeChar.equipment;
  const equipStr = `
    Cabeça: ${eq.head?.name || 'Nada'}
    Corpo: ${eq.body?.name || 'Nada'}
    Pernas: ${eq.legs?.name || 'Nada'}
    Pés: ${eq.feet?.name || 'Nada'}
    Mão Princ.: ${eq.mainHand?.name || 'Nada'}
    Mão Sec.: ${eq.offHand?.name || 'Nada'}
    Acessório 1: ${eq.accessory1?.name || 'Nada'}
    Acessório 2: ${eq.accessory2?.name || 'Nada'}
    Mochila: ${eq.backpack?.name || 'Nada'}
  `;

  // Serialize Inventory (Summary)
  const invStr = activeChar.inventory.map(i => i.name).join(', ') || "Mochila vazia";

  // Serialize Social & Conditions
  const socialStr = activeChar.social.map(s => `${s.targetName} (${s.relation}, ${s.affinity})`).join(', ');
  const condStr = activeChar.conditions.join(', ') || "Saudável";

  // Serialize Quests
  const activeQuests = quests.filter(q => q.status === 'active').map(q => q.title).join(', ') || "Nenhuma";

  const contextInjection = `
  (SISTEMA - DADOS OCULTOS ATUAIS DO JOGADOR ATIVO ${activeChar.name}:
   CONDICÕES: ${condStr} (Se grávida, considere o tempo passado).
   EQUIPAMENTO: ${equipStr}
   MOCHILA: ${invStr}
   SOCIAL: ${socialStr}
   MISSÕES ATIVAS: ${activeQuests}
   BESTIÁRIO CONHECIDO: ${monsters.map(m => m.name).join(', ')}.
   DEV MODE: ${isDevMode}.
  )`;

  try {
    const response = await chatSession.sendMessage({ message: message + contextInjection });
    return response.text || "";
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    // Return null or throw to trigger fallback in UI
    throw error;
  }
};
