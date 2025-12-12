
import React, { useMemo, useState, useEffect } from 'react';
import { Character, Item } from '../types';

interface CharacterSheetProps {
  character: Character;
  onChange?: (char: Character) => void;
  readOnly?: boolean;
  onOpenBestiary?: () => void;
  isDevMode?: boolean; 
  isNsfwMode?: boolean;
  onAction?: (action: string, data: string) => void;
}

const RACE_DATA: Record<string, { maturity: number; maxAge: number }> = {
  'humano': { maturity: 18, maxAge: 100 },
  'elfo': { maturity: 100, maxAge: 750 },
  'anão': { maturity: 50, maxAge: 350 },
  'orc': { maturity: 12, maxAge: 50 },
  'draconato': { maturity: 15, maxAge: 80 },
};

const CONDITION_ICONS: Record<string, string> = {
    'Grávida (Gêmeos)': '🤰x2',
    'Grávida': '🤰',
    'Esperando um filho': '👶',
    'Vigor Lácteo': '🥛',
    'Bem Estar na Gravidez': '💖',
    'Feliz': '🥰',
    'Envenenado': '🤢',
    'Atordoado': '💫',
    'Queimando': '🔥',
    'Congelado': '❄️',
    'Amaldiçoado': '💀',
    'Abençoado': '✨'
};

// --- CLASS SYSTEM DEFINITIONS ---
interface SkillDefinition {
    id: string;
    name: string;
    desc: string;
    cost: number;
    mpCost?: number;
}

interface ClassDefinition {
    name: string;
    skills: SkillDefinition[];
    evolvesTo?: string[]; 
    evolutionLevel?: number;
}

const ROOT_CLASSES = [
    'Leitor', 'Crente', 'Invocador de Besta (grau 1)', 'Mago Aprendiz', 'Metamorfo', 'Arqueiro', 'Guerreiro'
];

const CLASS_TREE: Record<string, ClassDefinition> = {
    'Leitor': { 
        name: 'Leitor', 
        skills: [
            { id: 'l_read', name: 'Leitura Rápida', desc: 'Lê pergaminhos 2x mais rápido.', cost: 1, mpCost: 5 },
            { id: 'l_scan', name: 'Olhar Analítico', desc: 'Descobre nível do alvo.', cost: 1, mpCost: 2 },
            { id: 'l_mem', name: 'Memória Fotográfica', desc: 'Recorda mapas vistos.', cost: 2, mpCost: 0 },
            { id: 'l_dec', name: 'Decifrar', desc: 'Lê línguas antigas.', cost: 2, mpCost: 10 },
            { id: 'l_focus', name: 'Foco Absoluto', desc: '+2 INT temporário.', cost: 3, mpCost: 15 }
        ], 
        evolvesTo: ['Escritor', 'Leitor Onisciente', 'Bibliotecario'], 
        evolutionLevel: 25 
    },
    'Escritor': { 
        name: 'Escritor', 
        skills: [
            { id: 'e_plot', name: 'Reescrever', desc: 'Refaz uma rolagem por descanso.', cost: 2, mpCost: 20 },
            { id: 'e_char', name: 'Criar Personagem', desc: 'Cria um NPC temporário fraco.', cost: 3, mpCost: 30 },
            { id: 'e_scene', name: 'Cenário Descritivo', desc: 'Confunde inimigos.', cost: 2, mpCost: 15 },
            { id: 'e_edit', name: 'Edição Menor', desc: 'Move objeto pequeno.', cost: 4, mpCost: 25 },
            { id: 'e_pen', name: 'Pena Afiada', desc: 'Dano mental em alvo.', cost: 2, mpCost: 10 }
        ], 
        evolvesTo: ['Alterador da Realidade'], 
        evolutionLevel: 50 
    },
    'Leitor Onisciente': { 
        name: 'Leitor Onisciente', 
        skills: [
            { id: 'lo_know', name: 'Olhar Verdadeiro', desc: 'Vê status completos.', cost: 2, mpCost: 10 },
            { id: 'lo_weak', name: 'Detectar Fraqueza', desc: 'Crítico com 19-20.', cost: 3, mpCost: 5 },
            { id: 'lo_path', name: 'Caminho Oculto', desc: 'Encontra passagens secretas.', cost: 2, mpCost: 10 },
            { id: 'lo_mind', name: 'Ler Mente', desc: 'Ouve pensamentos superficiais.', cost: 4, mpCost: 20 },
            { id: 'lo_fate', name: 'Ver o Destino', desc: 'Prevê próximo ataque (Evasão +5).', cost: 5, mpCost: 30 }
        ], 
        evolvesTo: ['Vidente'], 
        evolutionLevel: 50 
    },
    'Bibliotecario': { 
        name: 'Bibliotecario', 
        skills: [
            { id: 'b_lore', name: 'Conhecimento Antigo', desc: 'Identifica itens mágicos.', cost: 2, mpCost: 5 },
            { id: 'b_silence', name: 'Silêncio', desc: 'Área sem som (anti-mago).', cost: 3, mpCost: 20 },
            { id: 'b_org', name: 'Mente Organizada', desc: 'Imune a medo.', cost: 2, mpCost: 0 },
            { id: 'b_scroll', name: 'Mestre dos Pergaminhos', desc: 'Usa qualquer pergaminho.', cost: 4, mpCost: 0 },
            { id: 'b_trap', name: 'Glifo de Proteção', desc: 'Armadilha mágica.', cost: 3, mpCost: 15 }
        ], 
        evolvesTo: ['Guardião do Conhecimento'], 
        evolutionLevel: 50 
    },
    'Crente': { 
        name: 'Crente', 
        skills: [
            { id: 'cr_pray', name: 'Oração', desc: 'Cura 1d4 HP.', cost: 1, mpCost: 5 },
            { id: 'cr_faith', name: 'Fé Inabalável', desc: '+2 resist. mental.', cost: 1, mpCost: 0 },
            { id: 'cr_help', name: 'Mão Amiga', desc: '+2 no teste de aliado.', cost: 1, mpCost: 5 },
            { id: 'cr_light', name: 'Luz Divina', desc: 'Ilumina área.', cost: 1, mpCost: 2 },
            { id: 'cr_peace', name: 'Aura de Paz', desc: 'Inimigos hesitam atacar.', cost: 2, mpCost: 10 }
        ], 
        evolvesTo: ['Cavaleiro da Igreja', 'Clérigo'], 
        evolutionLevel: 25 
    },
    'Cavaleiro da Igreja': { 
        name: 'Cavaleiro da Igreja', 
        skills: [
            { id: 'ci_smite', name: 'Golpe Sagrado', desc: '+1d6 dano radiante.', cost: 2, mpCost: 10 },
            { id: 'ci_armor', name: 'Armadura da Fé', desc: '+2 AC temporário.', cost: 2, mpCost: 10 },
            { id: 'ci_duty', name: 'Dever', desc: 'Imune a charme.', cost: 2, mpCost: 0 },
            { id: 'ci_charge', name: 'Investida Santa', desc: 'Derruba inimigo.', cost: 3, mpCost: 15 },
            { id: 'ci_heal', name: 'Impor Mãos', desc: 'Cura 5 HP.', cost: 2, mpCost: 10 }
        ], 
        evolvesTo: ['Paladino'], 
        evolutionLevel: 50 
    },
    'Clérigo': { 
        name: 'Clérigo', 
        skills: [
            { id: 'cl_heal', name: 'Cura Maior', desc: 'Cura 2d8 HP.', cost: 2, mpCost: 15 },
            { id: 'cl_turn', name: 'Expulsar Mortos', desc: 'Amedronta mortos-vivos.', cost: 3, mpCost: 20 },
            { id: 'cl_buff', name: 'Benção de Força', desc: '+2 FOR para aliado.', cost: 2, mpCost: 10 },
            { id: 'cl_sanct', name: 'Santuário', desc: 'Protege alvo de ataques.', cost: 3, mpCost: 20 },
            { id: 'cl_purge', name: 'Remover Doença', desc: 'Cura status físicos.', cost: 3, mpCost: 20 }
        ], 
        evolvesTo: ['Padre'], 
        evolutionLevel: 50 
    },
    'Invocador de Besta (grau 1)': { 
        name: 'Invocador de Besta (grau 1)', 
        skills: [
            { id: 'ib1_sum', name: 'Invocar Besta Menor', desc: 'Invoca 1 criatura fraca.', cost: 1, mpCost: 10 },
            { id: 'ib1_bond', name: 'Vínculo Mental', desc: 'Sente o que a besta sente.', cost: 1, mpCost: 5 },
            { id: 'ib1_heal', name: 'Curar Besta', desc: 'Cura sua invocação.', cost: 1, mpCost: 8 },
            { id: 'ib1_cmd', name: 'Comando de Ataque', desc: 'Besta ataca com vantagem.', cost: 1, mpCost: 5 },
            { id: 'ib1_eye', name: 'Olhos da Besta', desc: 'Vê através da invocação.', cost: 2, mpCost: 5 }
        ], 
        evolvesTo: ['Invocador de Besta (grau 2)', 'Invocador Especializado'], 
        evolutionLevel: 25 
    },
    'Mago Aprendiz': { 
        name: 'Mago Aprendiz', 
        skills: [
            { id: 'ma_bolt', name: 'Dardo Mágico', desc: 'Dano arcano (1d4+1).', cost: 1, mpCost: 5 },
            { id: 'ma_shield', name: 'Escudo Arcano', desc: '+5 AC (Reação).', cost: 2, mpCost: 10 },
            { id: 'ma_det', name: 'Detectar Magia', desc: 'Vê auras mágicas.', cost: 1, mpCost: 2 },
            { id: 'ma_light', name: 'Globos de Luz', desc: 'Iluminação móvel.', cost: 1, mpCost: 2 },
            { id: 'ma_ill', name: 'Pequena Ilusão', desc: 'Som ou imagem simples.', cost: 1, mpCost: 5 }
        ], 
        evolvesTo: ['Mago', 'Bruxo'], 
        evolutionLevel: 25 
    },
    'Metamorfo': { 
        name: 'Metamorfo', 
        skills: [
            { id: 'met_disguise', name: 'Disfarçar', desc: 'Muda aparência facial.', cost: 1, mpCost: 5 },
            { id: 'met_claw', name: 'Garras Naturais', desc: 'Mãos viram garras (1d6).', cost: 1, mpCost: 5 },
            { id: 'met_skin', name: 'Pele Rígida', desc: '+2 AC natural.', cost: 2, mpCost: 10 },
            { id: 'met_gill', name: 'Guelras', desc: 'Respira na água.', cost: 2, mpCost: 5 },
            { id: 'met_voice', name: 'Imitar Voz', desc: 'Copia perfeitamente.', cost: 1, mpCost: 2 }
        ], 
        evolvesTo: ['Matamorfo Bestial', 'Metamorfo Insectos', 'Metamorfo de Habilidade'], 
        evolutionLevel: 25 
    },
    'Arqueiro': { 
        name: 'Arqueiro', 
        skills: [
            { id: 'arq_shot', name: 'Tiro Preciso', desc: '+2 no ataque.', cost: 1, mpCost: 0 },
            { id: 'arq_move', name: 'Tiro em Movimento', desc: 'Move e ataca sem penalidade.', cost: 1, mpCost: 0 },
            { id: 'arq_eye', name: 'Olhos de Águia', desc: 'Visão dobrada.', cost: 1, mpCost: 0 },
            { id: 'arq_cam', name: 'Camuflagem', desc: 'Furtividade em natureza.', cost: 2, mpCost: 0 },
            { id: 'arq_vol', name: 'Voleio', desc: 'Ataca 2 alvos próximos.', cost: 2, mpCost: 10 }
        ], 
        evolvesTo: ['Besteiro', 'Caçador'], 
        evolutionLevel: 25 
    },
    'Guerreiro': { 
        name: 'Guerreiro', 
        skills: [
            { id: 'gue_slash', name: 'Golpe Poderoso', desc: 'Ataque básico +2 dano.', cost: 1, mpCost: 0 },
            { id: 'gue_block', name: 'Bloqueio', desc: 'Reduz dano recebido em 1d4.', cost: 1, mpCost: 0 },
            { id: 'gue_shout', name: 'Grito de Guerra', desc: 'Aliados ganham +1 ataque.', cost: 2, mpCost: 5 },
            { id: 'gue_stance', name: 'Postura Defensiva', desc: '+2 AC, -2 Ataque.', cost: 1, mpCost: 0 },
            { id: 'gue_rush', name: 'Investida', desc: 'Move o dobro e ataca.', cost: 2, mpCost: 10 }
        ], 
        evolvesTo: ['Beserker', 'Guerreiro de Armadura'], 
        evolutionLevel: 25 
    },
    'Aventureiro': { 
        name: 'Aventureiro', 
        skills: [
            { id: 'av_run', name: 'Correr', desc: 'Foge de combate.', cost: 1, mpCost: 5 },
            { id: 'av_cook', name: 'Cozinhar', desc: 'Comida cura +1 HP.', cost: 1, mpCost: 0 },
            { id: 'av_scav', name: 'Vasculhar', desc: 'Acha mais itens.', cost: 1, mpCost: 0 },
            { id: 'av_rest', name: 'Descanso Rápido', desc: 'Recupera HP extra dormindo.', cost: 1, mpCost: 0 },
            { id: 'av_thrw', name: 'Arremessar Pedra', desc: 'Ataque à distância fraco.', cost: 1, mpCost: 0 }
        ], 
        evolvesTo: ROOT_CLASSES, 
        evolutionLevel: 10 
    },
    // Placeholder expansions for other classes to ensure structure integrity
    'Mago': { name: 'Mago', skills: [{ id: 'm_fire', name: 'Bola de Fogo', desc: 'Dano em área.', cost: 2, mpCost: 15 }, { id: 'm_fly', name: 'Voo', desc: 'Levita por 1 min.', cost: 3, mpCost: 20 }, { id: 'm_inv', name: 'Invisibilidade', desc: 'Fica invisível.', cost: 3, mpCost: 20 }, { id: 'm_cone', name: 'Cone de Frio', desc: 'Dano gelado em cone.', cost: 3, mpCost: 20 }, { id: 'm_wall', name: 'Muralha de Energia', desc: 'Bloqueia passagem.', cost: 4, mpCost: 30 }], evolvesTo: ['Feiticeiro', 'Mago Avançado'], evolutionLevel: 50 },
    'Beserker': { name: 'Beserker', skills: [{ id: 'bes_rage', name: 'Fúria', desc: '+Dano, -Defesa.', cost: 2, mpCost: 10 }, { id: 'bes_pain', name: 'Ignorar Dor', desc: 'HP temporário.', cost: 2, mpCost: 15 }, { id: 'bes_fear', name: 'Amedrontar', desc: 'Assusta inimigo.', cost: 2, mpCost: 5 }, { id: 'bes_cleave', name: 'Corte Amplo', desc: 'Ataca 3 inimigos.', cost: 3, mpCost: 20 }, { id: 'bes_die', name: 'Recusar Morte', desc: 'Fica com 1 HP.', cost: 4, mpCost: 50 }], evolvesTo: ['Lutador de Rua', 'Barbaro'], evolutionLevel: 50 },
    // Keeping advanced classes minimal for brevity but ensuring key ones have structure
    'Alterador da Realidade': { name: 'Alterador da Realidade', skills: [{ id: 'ar_warp', name: 'Distorção', desc: 'Altera o terreno.', cost: 5, mpCost: 50 }, { id: 'ar_stop', name: 'Parar Tempo', desc: 'Turno extra.', cost: 6, mpCost: 100 }, { id: 'ar_wish', name: 'Desejo Menor', desc: 'Cria item.', cost: 5, mpCost: 80 }, { id: 'ar_erase', name: 'Apagar', desc: 'Deleta inimigo fraco.', cost: 6, mpCost: 90 }, { id: 'ar_rev', name: 'Reverter', desc: 'Desfaz última ação.', cost: 5, mpCost: 60 }] },
    // Defaults for existing deep classes (Generic filler if not specified above to match type)
    'Vidente': { name: 'Vidente', skills: [{ id: 'v_future', name: 'Previsão', desc: '+5 AC.', cost: 4, mpCost: 0 }] },
    'Guardião do Conhecimento': { name: 'Guardião do Conhecimento', skills: [{ id: 'gc_protect', name: 'Barreira', desc: 'Imune mental.', cost: 4, mpCost: 0 }] },
    'Paladino': { name: 'Paladino', skills: [{ id: 'pal_aura', name: 'Aura', desc: 'Imune medo.', cost: 2, mpCost: 0 }] },
    'Templario de Luz': { name: 'Templario de Luz', skills: [{ id: 'tl_sun', name: 'Luz Solar', desc: 'Cega.', cost: 3, mpCost: 20 }] },
    'O Santo': { name: 'O Santo', skills: [{ id: 'os_miracle', name: 'Milagre', desc: 'Cura total.', cost: 4, mpCost: 50 }] },
    'Arcanjo de Luz': { name: 'Arcanjo de Luz', skills: [{ id: 'al_wings', name: 'Asas', desc: 'Voo.', cost: 5, mpCost: 30 }] },
    'Padre': { name: 'Padre', skills: [{ id: 'pa_bless', name: 'Bênção', desc: '+1d4.', cost: 2, mpCost: 10 }] },
    'Bispo': { name: 'Bispo', skills: [{ id: 'bi_res', name: 'Ressurreição', desc: 'Revive.', cost: 5, mpCost: 100 }] },
    'Invocador de Besta (grau 2)': { name: 'Invocador de Besta (grau 2)', skills: [{ id: 'ib2_cap', name: 'Capacidade +', desc: '2 bestas.', cost: 2, mpCost: 0 }] },
    'Invocador de Besta (grau 3)': { name: 'Invocador de Besta (grau 3)', skills: [{ id: 'ib3_buff', name: 'Buff', desc: 'Bestas fortes.', cost: 3, mpCost: 20 }] },
    'Invocador de Besta (grau 4)': { name: 'Invocador de Besta (grau 4)', skills: [{ id: 'ib4_horde', name: 'Horda', desc: '4 bestas.', cost: 4, mpCost: 0 }] },
    'Invocador de Besta (grau 5)': { name: 'Invocador de Besta (grau 5)', skills: [{ id: 'ib5_master', name: 'Mestre', desc: 'Lendárias.', cost: 5, mpCost: 100 }] },
    'Invocador Especializado': { name: 'Invocador Especializado', skills: [{ id: 'ie_spec', name: 'Único', desc: 'Besta única.', cost: 3, mpCost: 50 }] },
    'Feiticeiro': { name: 'Feiticeiro', skills: [{ id: 'f_meta', name: 'Metamagia', desc: 'Modifica magia.', cost: 3, mpCost: 25 }] },
    'Mago Avançado': { name: 'Mago Avançado', skills: [{ id: 'mav_int', name: 'Intelecto', desc: '+5 INT.', cost: 3, mpCost: 0 }] },
    'Seme Deus da Magia': { name: 'Seme Deus da Magia', skills: [{ id: 'sdm_pure', name: 'Magia Pura', desc: 'Ignora resist.', cost: 4, mpCost: 30 }] },
    'Deus da Purificação': { name: 'Deus da Purificação', skills: [{ id: 'dp_cleanse', name: 'Purificação', desc: 'Remove tudo.', cost: 5, mpCost: 50 }] },
    'Bruxo': { name: 'Bruxo', skills: [{ id: 'br_curse', name: 'Maldição', desc: 'Dano extra.', cost: 2, mpCost: 10 }, { id: 'br_fear', name: 'Medo', desc: 'Amedronta.', cost: 2, mpCost: 10 }, { id: 'br_blast', name: 'Rajada', desc: 'Dano força.', cost: 1, mpCost: 0 }, { id: 'br_dev', name: 'Visão do Diabo', desc: 'Vê no escuro.', cost: 2, mpCost: 0 }, { id: 'br_pac', name: 'Pacto', desc: 'Recupera magia.', cost: 3, mpCost: 0 }], evolvesTo: ['Alquimista', 'Bruxo Maligno'], evolutionLevel: 50 },
    'Alquimista': { name: 'Alquimista', skills: [{ id: 'alq_pot', name: 'Poções', desc: 'Dobro efeito.', cost: 3, mpCost: 0 }] },
    'Chefe Alquimista': { name: 'Chefe Alquimista', skills: [{ id: 'ca_trans', name: 'Transmutação', desc: 'Materiais.', cost: 4, mpCost: 20 }] },
    'Rei da Alquimia': { name: 'Rei da Alquimia', skills: [{ id: 'ra_gold', name: 'Ouro', desc: 'Ouro infinito.', cost: 5, mpCost: 50 }] },
    'Bruxo Maligno': { name: 'Bruxo Maligno', skills: [{ id: 'bm_dark', name: 'Trevas', desc: 'Necrótico.', cost: 3, mpCost: 15 }] },
    'Seme Deus da Magia Impura': { name: 'Seme Deus da Magia Impura', skills: [{ id: 'sdmi_rot', name: 'Corrosão', desc: 'Destrói armadura.', cost: 4, mpCost: 25 }] },
    'Deus da Corrupção': { name: 'Deus da Corrupção', skills: [{ id: 'dc_corr', name: 'Corrupção', desc: 'Controla mente.', cost: 5, mpCost: 100 }] },
    'Matamorfo Bestial': { name: 'Matamorfo Bestial', skills: [{ id: 'mb_quad', name: 'Quadrúpede', desc: 'Vira lobo.', cost: 2, mpCost: 15 }] },
    'Metamorfo Insectos': { name: 'Metamorfo Insectos', skills: [{ id: 'mi_giant', name: 'Inseto', desc: 'Vira besouro.', cost: 2, mpCost: 15 }] },
    'Metamorfo de Habilidade': { name: 'Metamorfo de Habilidade', skills: [{ id: 'mh_copy', name: 'Cópia', desc: 'Copia skill.', cost: 3, mpCost: 30 }] },
    'Besteiro': { name: 'Besteiro', skills: [{ id: 'bes_pierce', name: 'Perfurar', desc: 'Ignora AC.', cost: 2, mpCost: 0 }] },
    'Atirador de Trabuco': { name: 'Atirador de Trabuco', skills: [{ id: 'at_heavy', name: 'Pesado', desc: 'Dano alto.', cost: 3, mpCost: 0 }] },
    'Atirador de Morteiro': { name: 'Atirador de Morteiro', skills: [{ id: 'am_bomb', name: 'Explosivo', desc: 'Área.', cost: 4, mpCost: 5 }] },
    'Besteiro Composto': { name: 'Besteiro Composto', skills: [{ id: 'bc_fast', name: 'Rápido', desc: '2x ataque.', cost: 3, mpCost: 0 }] },
    'Besteiro Potente': { name: 'Besteiro Potente', skills: [{ id: 'bp_crit', name: 'Letal', desc: 'Crítico fácil.', cost: 4, mpCost: 0 }] },
    'Caçador': { name: 'Caçador', skills: [{ id: 'cac_trap', name: 'Armadilha', desc: 'Prende.', cost: 2, mpCost: 5 }] },
    'Arqueiro Composto': { name: 'Arqueiro Composto', skills: [{ id: 'ac_range', name: 'Alcance', desc: 'Longe.', cost: 3, mpCost: 0 }] },
    'Arqueiro do Fogo': { name: 'Arqueiro do Fogo', skills: [{ id: 'af_burn', name: 'Fogo', desc: 'Queima.', cost: 4, mpCost: 5 }] },
    'Atirador': { name: 'Atirador', skills: [{ id: 'ati_snipe', name: 'Headshot', desc: 'Morte.', cost: 5, mpCost: 20 }] },
    'Arqueiro do Vento': { name: 'Arqueiro do Vento', skills: [{ id: 'av_speed', name: 'Vendaval', desc: 'Empurra.', cost: 4, mpCost: 5 }] },
    'Arqueiro das Balas Invisíveis': { name: 'Arqueiro das Balas Invisíveis', skills: [{ id: 'abi_inv', name: 'Fantasma', desc: 'Indefensável.', cost: 5, mpCost: 20 }] },
    'Lutador de Rua': { name: 'Lutador de Rua', skills: [{ id: 'lr_brawl', name: 'Sujo', desc: 'Atordoa.', cost: 3, mpCost: 5 }] },
    'Bugilista': { name: 'Bugilista', skills: [{ id: 'bug_fist', name: 'Aço', desc: 'Dano alto.', cost: 4, mpCost: 0 }] },
    'Arte do Bugilista': { name: 'Arte do Bugilista', skills: [{ id: 'ab_tech', name: 'Técnica', desc: 'Contra-ataque.', cost: 5, mpCost: 15 }] },
    'Seme Deus Bugilista': { name: 'Seme Deus Bugilista', skills: [{ id: 'sdb_aura', name: 'Aura', desc: 'Intimida.', cost: 5, mpCost: 30 }] },
    'Deus da Arte Marcial': { name: 'Deus da Arte Marcial', skills: [{ id: 'dam_god', name: 'Infinito', desc: 'Dano max.', cost: 6, mpCost: 100 }] },
    'Barbaro': { name: 'Barbaro', skills: [{ id: 'bar_hp', name: 'Pele Dura', desc: '-3 Dano.', cost: 3, mpCost: 0 }] },
    'Lunático dos Punhos': { name: 'Lunático dos Punhos', skills: [{ id: 'lp_mad', name: 'Loucura', desc: '2x Força.', cost: 4, mpCost: 20 }] },
    'Beserker Bestial': { name: 'Beserker Bestial', skills: [{ id: 'bb_beast', name: 'Instinto', desc: 'Imortal.', cost: 5, mpCost: 50 }] },
    'Seme Deus da Guerra': { name: 'Seme Deus da Guerra', skills: [{ id: 'sdg_war', name: 'Avatar', desc: 'Exército.', cost: 5, mpCost: 60 }] },
    'Deus da Guerra': { name: 'Deus da Guerra', skills: [{ id: 'dg_end', name: 'Fim', desc: 'Apocalipse.', cost: 6, mpCost: 200 }] },
    'Guerreiro de Armadura': { name: 'Guerreiro de Armadura', skills: [{ id: 'ga_tank', name: 'Tanque', desc: '+4 AC.', cost: 2, mpCost: 0 }] },
    'Espadachim': { name: 'Espadachim', skills: [{ id: 'esp_parry', name: 'Aparar', desc: 'Nega dano.', cost: 3, mpCost: 5 }] },
    'Santo da Espada': { name: 'Santo da Espada', skills: [{ id: 'se_cut', name: 'Corte', desc: 'Distância.', cost: 4, mpCost: 20 }] },
    'Seme Deus da Espada': { name: 'Seme Deus da Espada', skills: [{ id: 'sde_sum', name: 'Chuva', desc: '1000 espadas.', cost: 5, mpCost: 50 }] },
    'Deus da Espada': { name: 'Deus da Espada', skills: [{ id: 'de_final', name: 'Final', desc: 'Corta realidade.', cost: 6, mpCost: 100 }] },
    'Guardião de Armadura Leve': { name: 'Guardião de Armadura Leve', skills: [{ id: 'gal_mob', name: 'Mobilidade', desc: 'Sem penalidade.', cost: 3, mpCost: 0 }] },
    'Guardião de Armadura Pesada': { name: 'Guardião de Armadura Pesada', skills: [{ id: 'gap_iron', name: 'Ferro', desc: 'Imune crit.', cost: 3, mpCost: 0 }] },
    'Muralha': { name: 'Muralha', skills: [{ id: 'mur_block', name: 'Bloqueio', desc: 'Total.', cost: 4, mpCost: 15 }] },
    'Muralha de Ferro': { name: 'Muralha de Ferro', skills: [{ id: 'mf_inv', name: 'Invulnerável', desc: 'Imortal.', cost: 5, mpCost: 100 }] },
};

const STAT_DESCRIPTIONS = {
    for: "FORÇA: Mede o poder físico e atlético. Afeta o dano de ataques corpo a corpo e a capacidade de carga.",
    def: "DEFESA: Mede a resistência a danos e proteção natural. Afeta a Classe de Armadura (CA) e resistência física.",
    vit: "VITALIDADE: Mede a saúde e vigor. Determina a Vida Máxima (HP) e a velocidade de regeneração de ferimentos.",
    agi: "AGILIDADE: Mede a velocidade, reflexos e equilíbrio. Afeta a iniciativa em combate e a chance de esquiva.",
    int: "INTELIGÊNCIA: Mede a acuidade mental e poder mágico. Determina a Mana Máxima (MP) e a regeneração mágica."
};

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ 
    character, 
    onChange, 
    readOnly = false, 
    onOpenBestiary,
    isDevMode = false,
    isNsfwMode = false,
    onAction
}) => {
  
  const [activeTab, setActiveTab] = useState<'main' | 'skills'>('main');
  const [pendingAllocations, setPendingAllocations] = useState<Record<string, number>>({
      for: 0, def: 0, vit: 0, agi: 0, int: 0
  });

  const currentClassDef: ClassDefinition = CLASS_TREE[character.class] || { name: character.class, skills: [] };

  useEffect(() => {
      setPendingAllocations({ for: 0, def: 0, vit: 0, agi: 0, int: 0 });
  }, [character.id]);

  const handleChange = (field: keyof Character, value: any) => {
    if (onChange) {
      onChange({ ...character, [field]: value });
    }
  };

  const handleStatChange = (stat: keyof Character['stats'], value: string) => {
    if (!isDevMode) return; 
    if (onChange) {
      onChange({
        ...character,
        stats: { ...character.stats, [stat]: parseInt(value) || 10 }
      });
    }
  };
  
  const currentTotalPending = (Object.values(pendingAllocations) as number[]).reduce((a: number, b: number) => a + b, 0);
  const availablePoints = character.evoPoints.current - currentTotalPending;

  const incrementPending = (stat: keyof Character['stats']) => {
    if (availablePoints > 0) {
        setPendingAllocations(prev => ({ ...prev, [stat]: (prev[stat] || 0) + 1 }));
    }
  };

  const decrementPending = (stat: keyof Character['stats']) => {
    if ((pendingAllocations[stat] as number) > 0) {
        setPendingAllocations(prev => ({ ...prev, [stat]: (prev[stat] || 0) - 1 }));
    }
  };

  const confirmEvo = () => {
      if (!onChange) return;
      const newStats = { ...character.stats };
      (Object.keys(pendingAllocations) as Array<keyof Character['stats']>).forEach(key => {
          newStats[key] += ((pendingAllocations[key] as number) || 0);
      });
      
      const vitBonus = (pendingAllocations['vit'] || 0) * 5;
      const intBonus = (pendingAllocations['int'] || 0) * 5;

      onChange({
          ...character,
          stats: newStats,
          hp: { ...character.hp, max: character.hp.max + vitBonus, current: character.hp.current + vitBonus },
          mp: { ...character.mp, max: character.mp.max + intBonus, current: character.mp.current + intBonus },
          evoPoints: {
              ...character.evoPoints,
              current: character.evoPoints.current - currentTotalPending
          }
      });
      setPendingAllocations({ for: 0, def: 0, vit: 0, agi: 0, int: 0 });
  };

  const displayStats = useMemo(() => {
    const stats = { ...character.stats };
    (Object.keys(pendingAllocations) as Array<keyof Character['stats']>).forEach(key => {
        stats[key] += (pendingAllocations[key] || 0);
    });
    return stats;
  }, [character, pendingAllocations]);

  const armorClass = useMemo(() => {
    const base = 10;
    const defMod = Math.floor((displayStats.def - 10) / 2);
    let armorBonus = 0;
    
    Object.values(character.equipment).forEach((item) => {
        const eqItem = item as Item | null;
        if (eqItem && eqItem.statModifier?.stat === 'ac') {
            armorBonus += eqItem.statModifier.value;
        }
    });
    
    return base + defMod + armorBonus;
  }, [displayStats, character.equipment]);

  const lifeStage = useMemo(() => {
      const raceKey = character.race.toLowerCase().split(' ')[0];
      const data = RACE_DATA[raceKey] || RACE_DATA['humano'];
      
      const isChild = character.age < (data.maturity * 0.7); 
      // Adolescent Logic: Between Child and Maturity
      const isAdolescent = !isChild && character.age < data.maturity;

      if (isChild) return { label: 'Bebê/Criança', color: 'text-blue-300 border-blue-300' };
      if (isAdolescent) return { label: 'Adolescente', color: 'text-green-300 border-green-300' }; // Acts like adult mechanic-wise per request
      if (character.age >= data.maxAge) return { label: 'Ancião', color: 'text-gray-400 border-gray-400' };
      return { label: 'Adulto', color: 'text-yellow-300 border-yellow-300' };
  }, [character.age, character.race]);

  // Derived Stats with Milk & Happy Buff
  const derivedStats = useMemo(() => {
      const isPregnant = character.conditions.some(c => c.toLowerCase().includes('grávida'));
      const hasMilkBuff = character.activeEffects?.some(e => e.name === 'Vigor Lácteo');
      const hasWellbeing = character.activeEffects?.some(e => e.name === 'Bem Estar na Gravidez');
      
      // Happy Effect Logic
      const happyEffect = character.activeEffects?.find(e => e.name === 'Feliz');
      const happyIntensity = happyEffect ? happyEffect.intensity : 0;
      const happyMult = 1 + (happyIntensity * 0.05); // +5% per stack

      const vitalidadePct = Math.min(100, Math.floor((character.hp.current / character.hp.max) * 100));
      
      let hpRecovery = 100 + (displayStats.vit - 10) * 5; 
      let mpRecovery = 100 + (displayStats.int - 10) * 5;
      
      if (hasMilkBuff) {
          hpRecovery = Math.floor(hpRecovery * 1.5);
          mpRecovery = Math.floor(mpRecovery * 1.5);
      }
      if (hasWellbeing) {
          hpRecovery = Math.floor(hpRecovery * 1.4); // +40%
      }
      if (happyEffect) {
          hpRecovery = Math.floor(hpRecovery * (1.3 * happyMult)); // +30% Base * Intensity
      }

      let speed = 100 + (displayStats.agi - 10) * 2;
      if (isPregnant) speed -= 30; 
      if (happyEffect) speed = Math.floor(speed * (1.15 * happyMult)); // +15% Base
      
      let fertility = 50; 
      if (character.age >= 13 && character.age <= 45) fertility += 30; // Included adolescents in fertility range mechanically
      if (isPregnant) fertility = 0; 
      if (hasMilkBuff && !isPregnant) fertility = Math.min(100, Math.floor(fertility * 1.5));
      if (happyEffect && !isPregnant) fertility += 100; // Flat +100 as requested

      const dmgBonusPct = happyEffect ? Math.floor(20 * happyMult) : 0;

      return { vitalidadePct, hpRecovery, speed, fertility, mpRecovery, hasMilkBuff, hasWellbeing, happyEffect, happyIntensity, dmgBonusPct };
  }, [character, displayStats]);

  const canEvolve = currentClassDef.evolvesTo && character.level >= (currentClassDef.evolutionLevel || 999);

  const handleBuySkill = (skillDef: SkillDefinition) => {
      if (!onChange) return;
      if (character.classPoints < skillDef.cost) { alert("Pontos de Classe insuficientes."); return; }
      const existing = character.skills?.find(s => s.id === skillDef.id);
      if (existing) {
          const updatedSkills = character.skills.map(s => s.id === skillDef.id ? { ...s, level: s.level + 1 } : s);
          onChange({ ...character, classPoints: character.classPoints - skillDef.cost, skills: updatedSkills });
      } else {
          const newSkill = { id: skillDef.id, name: skillDef.name, level: 1 };
          onChange({ ...character, classPoints: character.classPoints - skillDef.cost, skills: [...(character.skills || []), newSkill] });
      }
  };

  const handleUseSkill = (skillDef: SkillDefinition) => {
      if (!onChange) return;
      const cost = skillDef.mpCost || 0;
      if (character.mp.current < cost) { alert("Mana insuficiente!"); return; }
      onChange({ ...character, mp: { ...character.mp, current: character.mp.current - cost } });
      alert(`Você usou ${skillDef.name}! (-${cost} MP)`);
  };

  const handleRegenMp = () => {
      if (!onChange) return;
      const baseRegen = Math.floor(character.mp.max * 0.25);
      const buffMult = derivedStats.hasMilkBuff ? 1.5 : 1;
      const regenAmount = Math.floor(baseRegen * buffMult);
      onChange({ ...character, mp: { ...character.mp, current: Math.min(character.mp.max, character.mp.current + regenAmount) } });
  };

  const handleEvolve = (targetClass: string) => {
      if (!onChange) return;
      if (confirm(`Evoluir de ${character.class} para ${targetClass}?`)) { onChange({ ...character, class: targetClass }); }
  };

  const StatBlock = ({ label, value, statKey }: { label: string, value: number, statKey: keyof Character['stats'] }) => {
      const canDirectEdit = isDevMode;
      const pendingVal = (pendingAllocations[statKey] as number) || 0;
      const tooltip = STAT_DESCRIPTIONS[statKey as keyof typeof STAT_DESCRIPTIONS];
      return (
        <div className={`group relative bg-rpg-900 p-2 rounded border flex flex-col items-center ${pendingVal > 0 ? 'border-yellow-500' : 'border-rpg-700'}`}>
          <label className="text-xs text-rpg-sub uppercase font-bold mb-1 cursor-help underline decoration-dotted" title={tooltip}>{label}</label>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-rpg-600 shadow-xl hidden md:block">
              <span className="font-bold block mb-1 text-rpg-accent">{label}</span>
              {tooltip}
          </div>
          {character.evoPoints.current > 0 && (
              <>
                 <button onClick={() => incrementPending(statKey)} className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg z-10" disabled={availablePoints <= 0}>+</button>
                  {pendingVal > 0 && <button onClick={() => decrementPending(statKey)} className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg z-10">-</button>}
              </>
          )}
          <div className="relative">
             <input type="number" className={`w-12 text-center bg-rpg-800 border rounded text-white font-bold focus:outline-none ${canDirectEdit ? 'border-red-500/50' : 'border-transparent pointer-events-none'} ${pendingVal > 0 ? 'text-yellow-400' : ''}`} value={value} onChange={(e) => handleStatChange(statKey, e.target.value)} readOnly={!canDirectEdit} />
             {pendingVal > 0 && <span className="absolute -top-3 -left-3 text-[10px] text-yellow-500 font-bold">+{pendingVal}</span>}
          </div>
        </div>
      );
  };

  return (
    <div className="bg-rpg-800 p-6 rounded-lg shadow-lg border border-rpg-700 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b border-rpg-700 pb-2">
        <div>
            <h2 className="text-xl md:text-2xl font-fantasy text-rpg-accent truncate mr-2">{readOnly ? character.name : 'Criar Personagem'}</h2>
            <div className="flex gap-2 text-xs text-gray-400">
                <button onClick={() => setActiveTab('main')} className={`${activeTab === 'main' ? 'text-white font-bold underline' : 'hover:text-white'}`}>Atributos</button>
                <button onClick={() => setActiveTab('skills')} className={`${activeTab === 'skills' ? 'text-white font-bold underline' : 'hover:text-white'}`}>Classe & Skills</button>
            </div>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end">
            <span className="text-xs text-rpg-sub uppercase block">Nível</span>
            {isDevMode ? ( <input type="number" value={character.level} onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)} className="w-16 bg-red-900/20 border border-red-500 rounded text-right text-white font-bold px-1" /> ) : <span className="text-xl font-bold text-white">{character.level}</span>}
        </div>
      </div>

      {activeTab === 'main' ? (
        <>
            <div className="space-y-4 mb-6">
                <div>
                <label className="block text-xs text-rpg-sub uppercase mb-1">Nome</label>
                {readOnly && !isDevMode ? <p className="text-lg text-white">{character.name}</p> : <input type="text" className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white focus:border-rpg-accent focus:outline-none" value={character.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Nome do Herói" />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <label className="block text-xs text-rpg-sub uppercase mb-1">Raça</label>
                    <div className="flex gap-2">
                        {readOnly && !isDevMode ? <p className="text-white flex-1">{character.race}</p> : <input type="text" className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white focus:border-rpg-accent focus:outline-none" value={character.race} onChange={(e) => handleChange('race', e.target.value)} placeholder="Raça" />}
                        <button onClick={onOpenBestiary} className="bg-rpg-700 text-white p-2 rounded border border-rpg-600" title="Bestiário">📖</button>
                    </div>
                    </div>
                    <div>
                    <label className="block text-xs text-rpg-sub uppercase mb-1">Classe</label>
                    {!readOnly ? (
                        <select value={character.class} onChange={(e) => handleChange('class', e.target.value)} className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white text-sm">
                            <option value="">-- Selecione a Classe Inicial --</option>
                            <option value="Aventureiro">Aventureiro (Iniciante)</option>
                            {ROOT_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                    ) : (
                        <p className="text-white bg-rpg-900 p-2 rounded border border-rpg-700 flex justify-between">
                            {character.class}
                            <button onClick={() => setActiveTab('skills')} className="text-xs text-blue-400 hover:underline">Ver Árvore</button>
                        </p>
                    )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-rpg-sub uppercase mb-1">Gênero</label>
                        <select value={character.gender} onChange={(e) => handleChange('gender', e.target.value)} disabled={readOnly && !isDevMode} className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white text-sm"><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select>
                        {isNsfwMode && character.gender === 'Feminino' && onAction && (
                            <div className="flex gap-1 mt-2">
                                <button onClick={() => onAction('milk_self', '')} className="flex-1 text-[10px] bg-pink-900/50 hover:bg-pink-800 border border-pink-600 rounded text-white py-1" title="Requer Frasco Vazio">🍼 Ordenhar (Frasco)</button>
                                <button onClick={() => onAction('drink_milk_self', '')} className="flex-1 text-[10px] bg-pink-700/50 hover:bg-pink-600 border border-pink-400 rounded text-white py-1">🥛 Beber (Direto)</button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs text-rpg-sub uppercase mb-1">Idade ({lifeStage.label})</label>
                        <input type="number" min="0" className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white" value={character.age} onChange={(e) => handleChange('age', parseInt(e.target.value))} disabled={readOnly && !isDevMode} />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="block text-xs text-rpg-sub uppercase mb-1">Origem</label>
                        <select value={character.origin || 'Forasteiro'} onChange={(e) => handleChange('origin', e.target.value)} disabled={readOnly && !isDevMode} className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white text-xs"><option value="Forasteiro">Forasteiro (Nu)</option><option value="Nativo">Nativo (Vestido)</option></select>
                    </div>
                    <div><label className="block text-xs text-rpg-sub uppercase mb-1">Gosta de</label><input type="text" className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white text-xs" value={character.likes || ''} onChange={(e) => handleChange('likes', e.target.value)} placeholder="Ex: Doces" disabled={readOnly && !isDevMode} /></div>
                    <div><label className="block text-xs text-rpg-sub uppercase mb-1">Não Gosta</label><input type="text" className="w-full bg-rpg-900 border border-rpg-700 rounded p-2 text-white text-xs" value={character.dislikes || ''} onChange={(e) => handleChange('dislikes', e.target.value)} placeholder="Ex: Frio" disabled={readOnly && !isDevMode} /></div>
                </div>
            </div>

            <div className="mb-6 space-y-2">
                <div className="p-2 bg-rpg-900 rounded border border-rpg-700">
                    <div className="flex justify-between items-center text-xs mb-1"><span className="font-bold text-red-400">HP (Vida)</span><span className="text-white">{character.hp.current}/{character.hp.max}</span></div>
                    <div className="w-full bg-gray-800 h-2 rounded-full"><div className="bg-red-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (character.hp.current / character.hp.max) * 100)}%` }}></div></div>
                </div>
                <div className="p-2 bg-rpg-900 rounded border border-rpg-700">
                    <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-blue-400">MP (Mana)</span>
                        <div className="flex items-center gap-2"><span className="text-white">{character.mp.current}/{character.mp.max}</span>{!readOnly && (<button onClick={handleRegenMp} className="text-[9px] bg-blue-900 border border-blue-600 text-blue-200 px-1 rounded hover:bg-blue-800" title="Regenerar Mana">+MP</button>)}</div>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (character.mp.current / character.mp.max) * 100)}%` }}></div></div>
                </div>
            </div>

            <div className="mb-6 p-3 bg-gradient-to-r from-rpg-900 to-rpg-800 rounded border border-yellow-900/50">
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-yellow-500 uppercase">Pontos de Evo: {character.evoPoints.current}</span></div>
                {currentTotalPending > 0 && (<div className="mt-3 flex gap-2 justify-end"><button onClick={() => setPendingAllocations({ for: 0, def: 0, vit: 0, agi: 0, int: 0 })} className="text-xs bg-gray-700 px-3 py-1 rounded text-white">Cancelar</button><button onClick={confirmEvo} className="text-xs bg-green-600 px-3 py-1 rounded text-white font-bold">Confirmar</button></div>)}
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-bold text-rpg-sub uppercase mb-3">Atributos</h3>
                <div className="grid grid-cols-3 gap-2">
                <StatBlock label="FORÇA" value={displayStats.for} statKey="for" />
                <StatBlock label="DEFESA" value={displayStats.def} statKey="def" />
                <StatBlock label="VIT." value={displayStats.vit} statKey="vit" />
                <StatBlock label="AGIL." value={displayStats.agi} statKey="agi" />
                <StatBlock label="INT." value={displayStats.int} statKey="int" />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-2 bg-rpg-900 rounded border border-rpg-700 text-center"><span className="block text-xs text-rpg-sub uppercase font-bold">Defesa Total</span><span className="text-xl text-blue-400 font-bold">🛡️ {armorClass}</span></div>
                <div className="p-2 bg-rpg-900 rounded border border-rpg-700 text-center"><span className="block text-xs text-rpg-sub uppercase font-bold">Iniciativa</span><span className="text-xl text-yellow-400 font-bold">⚡ {Math.floor((displayStats.agi - 10) / 2)}</span></div>
            </div>

            {/* BUFFS DISPLAY */}
            <div className="space-y-2 mb-4">
                {derivedStats.hasMilkBuff && (
                    <div className="p-2 bg-pink-900/30 border border-pink-500/50 rounded flex items-center gap-3 animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                        <div className="text-2xl">🥛</div>
                        <div>
                            <span className="text-xs text-pink-300 font-bold block">Vigor Lácteo Ativo</span>
                            <span className="text-[9px] text-gray-400">+50% Rec/Fert, +10% Dano</span>
                        </div>
                    </div>
                )}
                {derivedStats.happyEffect && (
                    <div className="p-2 bg-orange-900/30 border border-orange-500/50 rounded flex flex-col items-center justify-center animate-in fade-in shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🥰</span>
                            <span className="text-xs text-orange-300 font-bold">FELIZ (x{derivedStats.happyIntensity}) - {derivedStats.happyEffect.duration}t</span>
                        </div>
                        <span className="text-[9px] text-gray-400 text-center">
                            Fertilidade Max • Rec +{30 * (1 + (derivedStats.happyIntensity * 0.05))}% • Dano +{derivedStats.dmgBonusPct}% • Vel +{Math.floor(15 * (1 + (derivedStats.happyIntensity * 0.05)))}%
                        </span>
                    </div>
                )}
                {derivedStats.hasWellbeing && (
                    <div className="p-2 bg-purple-900/30 border border-purple-500/50 rounded flex items-center gap-3 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                        <div className="text-2xl">💖</div>
                        <div>
                            <span className="text-xs text-purple-300 font-bold block">Bem Estar na Gravidez</span>
                            <span className="text-[9px] text-gray-400">+40% Recuperação Vida & Melhor Parto</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 p-2 bg-purple-900/20 border border-purple-500/50 rounded min-h-[60px]">
                <span className="text-xs text-purple-300 font-bold uppercase block mb-2">Efeitos & Condições</span>
                <div className="flex flex-wrap gap-2">
                    {character.activeEffects?.map((e, i) => {
                        const icon = CONDITION_ICONS[e.name] || '✨';
                        return (
                            <span key={e.id} className="text-xs bg-orange-800 text-white px-2 py-1 rounded shadow-sm border border-orange-600 flex items-center gap-1">
                                <span>{icon}</span> {e.name} ({e.duration}t)
                            </span>
                        );
                    })}
                    {character.conditions && character.conditions.length > 0 ? character.conditions.map((c, i) => {
                            const iconKey = Object.keys(CONDITION_ICONS).find(k => c.includes(k));
                            const icon = iconKey ? CONDITION_ICONS[iconKey] : '🔸';
                            return (<span key={i} className="text-xs bg-purple-800 text-white px-2 py-1 rounded shadow-sm border border-purple-600 flex items-center gap-1"><span>{icon}</span> {c}</span>);
                        }) : (!character.activeEffects || character.activeEffects.length === 0) && <p className="text-xs text-gray-500 italic">Nenhum efeito ativo.</p>
                    }
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-rpg-700">
                <h3 className="text-sm font-bold text-rpg-sub uppercase mb-3">Aprofundamento de Informação</h3>
                <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between items-center bg-rpg-900 p-2 rounded border border-rpg-700"><span className="text-gray-400">Vitalidade (HP %)</span><span className={`font-bold ${derivedStats.vitalidadePct < 30 ? 'text-red-500' : 'text-green-400'}`}>{derivedStats.vitalidadePct}%</span></div>
                    <div className="flex justify-between items-center bg-rpg-900 p-2 rounded border border-rpg-700"><span className="text-gray-400">Recuperação de Vida</span><span className="font-bold text-blue-300">{derivedStats.hpRecovery}</span></div>
                    <div className="flex justify-between items-center bg-rpg-900 p-2 rounded border border-rpg-700"><span className="text-gray-400">Agilidade / Velocidade</span><span className={`font-bold ${derivedStats.speed < 100 ? 'text-red-400' : 'text-yellow-400'}`}>{derivedStats.speed}%</span></div>
                    <div className="flex justify-between items-center bg-rpg-900 p-2 rounded border border-rpg-700"><span className="text-gray-400">Fertilidade</span><span className="font-bold text-pink-400">{derivedStats.fertility}%</span></div>
                    <div className="flex justify-between items-center bg-rpg-900 p-2 rounded border border-rpg-700"><span className="text-gray-400">Recuperação de Mana</span><span className="font-bold text-purple-400">{derivedStats.mpRecovery}</span></div>
                    {derivedStats.happyEffect && <div className="flex justify-between items-center bg-rpg-900 p-2 rounded border border-rpg-700"><span className="text-gray-400">Bônus de Dano (Feliz)</span><span className="font-bold text-red-400 flex gap-1 items-center"><span>🥰</span> +{derivedStats.dmgBonusPct}%</span></div>}
                    {derivedStats.hasMilkBuff && <div className="flex justify-between items-center bg-rpg-900 p-2 rounded border border-rpg-700"><span className="text-gray-400">Bônus Vigor Lácteo</span><span className="font-bold text-pink-300 flex gap-1 items-center"><span>🥛</span> +50% Vit/MP Reg</span></div>}
                    {derivedStats.hasWellbeing && <div className="flex justify-between items-center bg-rpg-900 p-2 rounded border border-rpg-700"><span className="text-gray-400">Bônus Bem Estar</span><span className="font-bold text-purple-300 flex gap-1 items-center"><span>💖</span> +40% Vida Reg</span></div>}
                </div>
            </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in">
             {/* Skills Tab Content (kept same) */}
            <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-blue-300">{character.class}</h3><div className="text-right"><span className="text-xs text-gray-400 block">Pontos de Classe</span><span className="text-xl font-bold text-yellow-400">{character.classPoints || 0}</span></div></div>
                {canEvolve ? ( <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600 rounded flex flex-col items-center text-center"><span className="text-yellow-400 font-bold text-lg mb-2">Evolução Disponível!</span><div className="flex flex-wrap gap-2 justify-center">{currentClassDef.evolvesTo?.map(target => (<button key={target} onClick={() => handleEvolve(target)} className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded shadow-lg animate-pulse mb-2">Evoluir para {target}</button>))}</div></div> ) : ( currentClassDef.evolvesTo && (<div className="mb-4 text-xs text-gray-500 text-center italic">Próxima evolução (Nível {currentClassDef.evolutionLevel}): {currentClassDef.evolvesTo.join(' OU ')}</div>))}
                <div className="space-y-3"><h4 className="text-sm font-bold text-white border-b border-gray-700 pb-1">Habilidades Disponíveis</h4>{currentClassDef.skills.map(skillDef => { const learned = character.skills?.find(s => s.id === skillDef.id); const canAfford = (character.classPoints || 0) >= skillDef.cost; return (<div key={skillDef.id} className="bg-rpg-900 p-3 rounded border border-rpg-700 flex flex-col gap-2"><div className="flex justify-between items-start"><div><div className="flex items-center gap-2"><span className="font-bold text-white">{skillDef.name}</span>{learned && <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 rounded">Nv. {learned.level}</span>}</div><p className="text-xs text-gray-400">{skillDef.desc}</p><p className="text-[10px] text-blue-400 mt-1">Custo: {skillDef.mpCost || 0} MP</p></div><button onClick={() => handleBuySkill(skillDef)} disabled={!canAfford} className={`px-3 py-1 rounded text-xs font-bold border shrink-0 ${canAfford ? 'bg-green-800 border-green-600 hover:bg-green-700 text-white' : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'}`}>{learned ? 'Melhorar' : 'Aprender'} ({skillDef.cost} pts)</button></div>{learned && !readOnly && (<button onClick={() => handleUseSkill(skillDef)} className="w-full bg-blue-700 hover:bg-blue-600 text-white text-xs py-1 rounded font-bold">✨ Usar (-{skillDef.mpCost || 0} MP)</button>)}</div>)})}</div>
            </div>
            {character.skills && character.skills.length > 0 && (<div className="mt-4"><h4 className="text-sm font-bold text-white border-b border-gray-700 pb-1 mb-2">Habilidades Aprendidas</h4><div className="grid grid-cols-2 gap-2">{character.skills.map(s => (<div key={s.id} className="bg-gray-800 p-2 rounded text-xs border border-gray-600"><span className="font-bold text-blue-300">{s.name}</span> <span className="text-gray-400">- Nv.{s.level}</span></div>))}</div></div>)}
        </div>
      )}
    </div>
  );
};
