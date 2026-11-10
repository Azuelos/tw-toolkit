// ===========================================================================
// 🏰 Póquer de Cerco AI — Assistente Tático & Otimizador de Mãos e Descarte
// Evento "Póquer de Cerco" (Siege Poker) — Tribal Wars BR143
// Versão: 1.0.0 (Edição Oficial TW Toolkit)
// Desenvolvido por: Azuelos (@jhonatanazuelosoficial)
//
// Uso na Barra de Acesso Rápido do Tribal Wars:
// javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/SiegePokerPTBR.js?_='+Date.now();document.head.appendChild(s);})();void(0);
// ===========================================================================

(function () {
    'use strict';

    // Evita duplicar instância se já estiver aberta
    const CONTAINER_ID = 'twSiegePokerAIContainer';
    if (document.getElementById(CONTAINER_ID)) {
        const existing = document.getElementById(CONTAINER_ID);
        if (existing.style.display === 'none') {
            existing.style.display = 'flex';
        }
        existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.UI && typeof window.UI.InfoMessage === 'function') {
            window.UI.InfoMessage('🏰 Assistente do Póquer de Cerco já está ativo na tela!', 2500);
        }
        return;
    }

    const SCRIPT_NAME = 'Póquer de Cerco AI';
    const SCRIPT_VERSION = 'v1.0.0';
    const STORAGE_KEY = 'ond_tw_siege_poker_prefs';

    // Definição e Constantes Oficiais do Jogo
    const SUITS = ['infantry', 'archer', 'cavalry', 'siege'];
    const SUIT_LABELS = {
        infantry: '🛡️ Infantaria',
        archer: '🏹 Arqueiro',
        cavalry: '🐎 Cavalaria',
        siege: '🎯 Cerco'
    };
    const SUIT_SHORT = {
        infantry: 'Inf',
        archer: 'Arq',
        cavalry: 'Cav',
        siege: 'Cer'
    };
    const SUIT_ICONS = {
        infantry: '🛡️',
        archer: '🏹',
        cavalry: '🐎',
        siege: '🎯'
    };
    const SUIT_COLORS = {
        infantry: '#38bdf8', // azul
        archer: '#4ade80',   // verde
        cavalry: '#facc15',  // amarelo
        siege: '#f87171'     // vermelho
    };

    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
    const RANK_LABELS = {
        '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
        'j': 'Valete (J)', 'q': 'Dama (Q)', 'k': 'Rei (K)', 'a': 'Ás (A)'
    };
    const RANK_SHORT = {
        '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
        'j': 'J', 'q': 'Q', 'k': 'K', 'a': 'A'
    };
    const RANK_VALUES = {};
    RANKS.forEach((r, i) => { RANK_VALUES[r] = i; });

    // Hierarquia e Valores Oficiais do Póquer de Cerco
    const HAND_TYPES = {
        ROYAL_FLUSH: { id: 9, name: 'Royal Flush', pts: 1600, badge: '👑', color: '#fbbf24' },
        STRAIGHT_FLUSH: { id: 8, name: 'Straight Flush', pts: 800, badge: '🔥', color: '#f59e0b' },
        FOUR_OF_A_KIND: { id: 7, name: 'Quadra', pts: 400, badge: '💎', color: '#c084fc' },
        FULL_HOUSE: { id: 6, name: 'Full House', pts: 200, badge: '🏰', color: '#a855f7' },
        FLUSH: { id: 5, name: 'Flush (Mesmo Naipe)', pts: 150, badge: '🌊', color: '#38bdf8' },
        STRAIGHT: { id: 4, name: 'Sequência (Straight)', pts: 125, badge: '⚡', color: '#2dd4bf' },
        THREE_OF_A_KIND: { id: 3, name: 'Trinca', pts: 100, badge: '⚔️', color: '#4ade80' },
        TWO_PAIR: { id: 2, name: 'Dois Pares', pts: 50, badge: '🛡️', color: '#94a3b8' },
        ONE_PAIR: { id: 1, name: 'Um Par', pts: 20, badge: '🎲', color: '#64748b' },
        HIGH_CARD: { id: 0, name: 'Carta Alta', pts: 5, badge: '🃏', color: '#475569' }
    };

    // Preferências Locais
    let prefs = {
        minimized: false,
        autoPlay: false,
        safeOnlyFreeDiscards: true,
        fullFiveCardAttack: true // se true, preenche até 5 cartas para reciclar lixo do baralho de graça
    };

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) prefs = Object.assign(prefs, JSON.parse(saved));
    } catch (e) {}

    function savePrefs() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
    }

    // =========================================================================
    // 🧠 MOTOR MATEMÁTICO DE AVALIAÇÃO DE MÃOS (POKER ENGINE)
    // =========================================================================

    /**
     * Avalia uma combinação específica de até 5 cartas e retorna [tipo, pontos, cartasContribuintes]
     */
    function evaluateCombination(cards) {
        if (!cards || cards.length === 0) return null;

        // Agrupamento por Rank
        const byRank = {};
        cards.forEach(c => {
            byRank[c.rank] = byRank[c.rank] || [];
            byRank[c.rank].push(c);
        });

        // Agrupamento por Naipe
        const bySuit = {};
        cards.forEach(c => {
            bySuit[c.suit] = bySuit[c.suit] || [];
            bySuit[c.suit].push(c);
        });

        const isFlush = cards.length === 5 && Object.keys(bySuit).length === 1;

        // Verificação de Sequência (Straight)
        let isStraight = false;
        let isRoyal = false;
        let straightCards = [];

        if (cards.length === 5) {
            const sortedRanks = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);
            // Sequência normal
            if (new Set(sortedRanks).size === 5 && sortedRanks[4] - sortedRanks[0] === 4) {
                isStraight = true;
                straightCards = cards;
                if (sortedRanks[4] === 12) isRoyal = true; // Termina em Ás
            }
            // Sequência com Ás baixo (A, 2, 3, 4, 5) -> índices: [0, 1, 2, 3, 12]
            else if (sortedRanks.join(',') === '0,1,2,3,12') {
                isStraight = true;
                straightCards = cards;
            }
        }

        const rankGroups = Object.values(byRank).sort((a, b) => b.length - a.length);
        const counts = rankGroups.map(g => g.length);

        if (isFlush && isStraight && isRoyal) {
            return { type: 'ROYAL_FLUSH', info: HAND_TYPES.ROYAL_FLUSH, contributing: cards };
        }
        if (isFlush && isStraight) {
            return { type: 'STRAIGHT_FLUSH', info: HAND_TYPES.STRAIGHT_FLUSH, contributing: cards };
        }
        if (counts[0] === 4) {
            return { type: 'FOUR_OF_A_KIND', info: HAND_TYPES.FOUR_OF_A_KIND, contributing: rankGroups[0] };
        }
        if (counts[0] === 3 && counts[1] === 2) {
            return { type: 'FULL_HOUSE', info: HAND_TYPES.FULL_HOUSE, contributing: rankGroups[0].concat(rankGroups[1]) };
        }
        if (isFlush) {
            return { type: 'FLUSH', info: HAND_TYPES.FLUSH, contributing: cards };
        }
        if (isStraight) {
            return { type: 'STRAIGHT', info: HAND_TYPES.STRAIGHT, contributing: straightCards };
        }
        if (counts[0] === 3) {
            return { type: 'THREE_OF_A_KIND', info: HAND_TYPES.THREE_OF_A_KIND, contributing: rankGroups[0] };
        }
        if (counts[0] === 2 && counts[1] === 2) {
            return { type: 'TWO_PAIR', info: HAND_TYPES.TWO_PAIR, contributing: rankGroups[0].concat(rankGroups[1]) };
        }
        if (counts[0] === 2) {
            return { type: 'ONE_PAIR', info: HAND_TYPES.ONE_PAIR, contributing: rankGroups[0] };
        }

        // Carta mais alta
        const highestCard = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank])[0];
        return { type: 'HIGH_CARD', info: HAND_TYPES.HIGH_CARD, contributing: [highestCard] };
    }

    /**
     * Gera todas as combinações de tamanho k de um array
     */
    function combinations(arr, k) {
        if (k === 0) return [[]];
        if (arr.length === 0 || k > arr.length) return [];
        const head = arr[0];
        const tail = arr.slice(1);
        const withHead = combinations(tail, k - 1).map(c => [head, ...c]);
        const withoutHead = combinations(tail, k);
        return [...withHead, ...withoutHead];
    }

    /**
     * Analisa as 8 cartas na mão do jogador e gera todas as mãos possíveis ordenadas
     */
    function analyzeAllHands(handCards) {
        if (!handCards || handCards.length === 0) return { best: null, allHands: [] };

        const evaluatedList = [];
        const seenHandSignatures = new Set();

        // Avalia todas as combinações de tamanho 5 (56 combinações possíveis)
        const combos5 = combinations(handCards, Math.min(5, handCards.length));
        combos5.forEach(combo => {
            const res = evaluateCombination(combo);
            if (res) {
                // Identificador único para a mão por cartas contribuintes
                const sig = res.type + ':' + res.contributing.map(c => c.suit + '_' + c.rank).sort().join('|');
                if (!seenHandSignatures.has(sig)) {
                    seenHandSignatures.add(sig);
                    evaluatedList.push({
                        ...res,
                        fullFiveCards: combo
                    });
                }
            }
        });

        // Avalia também combinações puras menores (ex: 4 cartas para Quadra, 3 para Trinca, 2 para Par)
        [4, 3, 2, 1].forEach(size => {
            if (handCards.length >= size) {
                combinations(handCards, size).forEach(combo => {
                    const res = evaluateCombination(combo);
                    if (res && res.contributing.length === combo.length) {
                        const sig = res.type + ':' + res.contributing.map(c => c.suit + '_' + c.rank).sort().join('|');
                        if (!seenHandSignatures.has(sig)) {
                            seenHandSignatures.add(sig);
                            // Cria um combo de 5 completando com cartas de menor valor se disponível
                            const remaining = handCards.filter(c => !combo.includes(c))
                                .sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]); // cartas mais baixas
                            const fullFive = [...combo, ...remaining.slice(0, 5 - combo.length)];
                            evaluatedList.push({
                                ...res,
                                fullFiveCards: fullFive
                            });
                        }
                    }
                });
            }
        });

        // Ordena por pontuação decrescente
        evaluatedList.sort((a, b) => {
            if (b.info.pts !== a.info.pts) return b.info.pts - a.info.pts;
            // Desempate por valor das cartas contribuintes
            const sumA = a.contributing.reduce((acc, c) => acc + RANK_VALUES[c.rank], 0);
            const sumB = b.contributing.reduce((acc, c) => acc + RANK_VALUES[c.rank], 0);
            return sumB - sumA;
        });

        return {
            best: evaluatedList[0] || null,
            allHands: evaluatedList
        };
    }

    /**
     * Analisador de Potencial de Descarte (Draw Odds & Outs)
     */
    function analyzeDiscardStrategy(handCards, deckCards) {
        if (!handCards || handCards.length === 0) return null;
        deckCards = deckCards || [];

        // 1. Flush Draw: 4 cartas do mesmo naipe
        const bySuit = {};
        handCards.forEach(c => {
            bySuit[c.suit] = bySuit[c.suit] || [];
            bySuit[c.suit].push(c);
        });
        for (const [s, cards] of Object.entries(bySuit)) {
            if (cards.length === 4) {
                const discard = handCards.filter(c => !cards.includes(c));
                const outs = deckCards.filter(c => c.suit === s).length;
                const totalDeck = deckCards.length || 44;
                // Chance aproximada de acertar pelo menos 1 carta em 4 compras
                const prob = totalDeck > 0 ? Math.min(99, Math.round((1 - Math.pow((totalDeck - outs) / totalDeck, discard.length)) * 100)) : 0;
                return {
                    strategy: 'FLUSH_DRAW',
                    title: `🎯 Flush Draw (${SUIT_LABELS[s]})`,
                    description: `Você tem 4 cartas de ${SUIT_LABELS[s]}. Descartando as 4 restantes, restam <b>${outs}</b> cartas desse naipe no baralho.`,
                    prob: `${prob}%`,
                    keep: cards,
                    discard: discard
                };
            }
        }

        // 2. Straight Draw Aberto: 4 cartas em sequência
        const uniqueRankValues = Array.from(new Set(handCards.map(c => RANK_VALUES[c.rank]))).sort((a, b) => a - b);
        for (let i = 0; i <= uniqueRankValues.length - 4; i++) {
            const slice = uniqueRankValues.slice(i, i + 4);
            if (slice[3] - slice[0] === 3) { // 4 em sequência
                const neededRanks = [];
                if (slice[0] > 0) neededRanks.push(RANKS[slice[0] - 1]);
                if (slice[3] < 12) neededRanks.push(RANKS[slice[3] + 1]);

                const keep = [];
                slice.forEach(rVal => {
                    const rStr = RANKS[rVal];
                    const c = handCards.find(card => card.rank === rStr);
                    if (c && !keep.includes(c)) keep.push(c);
                });
                const discard = handCards.filter(c => !keep.includes(c));
                const outs = deckCards.filter(c => neededRanks.includes(c.rank)).length;
                const totalDeck = deckCards.length || 44;
                const prob = totalDeck > 0 ? Math.min(99, Math.round((1 - Math.pow((totalDeck - outs) / totalDeck, discard.length)) * 100)) : 0;
                const neededStr = neededRanks.map(r => RANK_SHORT[r]).join(' ou ');

                return {
                    strategy: 'STRAIGHT_DRAW',
                    title: `⚡ Sequência Aberta (Straight Draw)`,
                    description: `Sequência de 4 cartas (${RANK_SHORT[RANKS[slice[0]]]}-${RANK_SHORT[RANKS[slice[3]]]}). Precisa de <b>${neededStr}</b> (${outs} outs no baralho).`,
                    prob: `${prob}%`,
                    keep: keep,
                    discard: discard
                };
            }
        }

        // 3. Trinca: manter as 3 cartas e descartar 5 para buscar Quadra ou Full House
        const byRank = {};
        handCards.forEach(c => {
            byRank[c.rank] = byRank[c.rank] || [];
            byRank[c.rank].push(c);
        });
        const trips = Object.values(byRank).find(g => g.length === 3);
        if (trips) {
            const discard = handCards.filter(c => !trips.includes(c));
            return {
                strategy: 'TRIPS_KEEP',
                title: `⚔️ Trinca de ${RANK_SHORT[trips[0].rank]}`,
                description: `Manter a Trinca (100 pts) e descartar as outras 5 cartas para caçar Quadra (400 pts) ou Full House (200 pts)!`,
                prob: `Alto`,
                keep: trips,
                discard: discard
            };
        }

        // 4. Dois Pares: manter os 2 pares e descartar 4 para buscar Full House
        const pairs = Object.values(byRank).filter(g => g.length === 2);
        if (pairs.length >= 2) {
            const keep = [...pairs[0], ...pairs[1]];
            const discard = handCards.filter(c => !keep.includes(c));
            return {
                strategy: 'TWO_PAIR_KEEP',
                title: `🛡️ Dois Pares (${RANK_SHORT[pairs[0][0].rank]} e ${RANK_SHORT[pairs[1][0].rank]})`,
                description: `Manter os Dois Pares (50 pts) e descartar as 4 cartas restantes para buscar Full House (200 pts)!`,
                prob: `Médio`,
                keep: keep,
                discard: discard
            };
        }

        // 5. Um Par: manter o par e descartar as 6 cartas mais fracas
        if (pairs.length === 1) {
            const keep = pairs[0];
            const discard = handCards.filter(c => !keep.includes(c));
            return {
                strategy: 'ONE_PAIR_KEEP',
                title: `🎲 Par de ${RANK_SHORT[pairs[0][0].rank]}`,
                description: `Manter o par e descartar as cartas restantes para buscar Trinca, 2 Pares ou Full House.`,
                prob: `Excelente`,
                keep: keep,
                discard: discard
            };
        }

        // 6. Carta Alta: manter as 3 maiores cartas e descartar as 5 menores
        const sortedDesc = [...handCards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
        const keepHigh = sortedDesc.slice(0, 3);
        const discardLow = sortedDesc.slice(3);
        return {
            strategy: 'HIGH_CARD_RESET',
            title: `🃏 Reciclagem de Mão Fraca`,
            description: `Mão dispersa sem par. Recomendado descartar as 5 cartas mais baixas mantendo as cartas altas (${keepHigh.map(c => RANK_SHORT[c.rank]).join(', ')}).`,
            prob: `Novo Sorteio`,
            keep: keepHigh,
            discard: discardLow
        };
    }

    // =========================================================================
    // 🎮 INTERAÇÃO COM O JOGO (DOM SELECTION & ACTIONS)
    // =========================================================================

    function isEventScreen() {
        return window.location.href.includes('screen=event_siege_poker') || Boolean(window.SiegePoker || window.SiegePokerFlagShop);
    }

    function isBattleActive() {
        return Boolean(window.SiegePoker && window.SiegePoker.hand_cards && window.SiegePoker.hand_cards.length > 0);
    }

    function isFlagShopActive() {
        return Boolean(window.SiegePokerFlagShop && window.SiegePokerFlagShop.flag_shop);
    }

    /**
     * Limpa a seleção de todas as cartas na tela
     */
    function clearBoardSelection() {
        const selected = document.querySelectorAll('#hand_cards .card.card-selected');
        selected.forEach(el => el.click());
    }

    /**
     * Seleciona no tabuleiro as cartas fornecidas
     */
    function selectCardsOnBoard(cardsToSelect) {
        if (!cardsToSelect || cardsToSelect.length === 0) return;
        const targetKeys = new Set(cardsToSelect.map(c => `${c.suit}_${c.rank}`));
        const cardElements = document.querySelectorAll('#hand_cards .card');

        cardElements.forEach(el => {
            const key = `${el.dataset.suit}_${el.dataset.rank}`;
            const isSelected = el.classList.contains('card-selected');
            if (targetKeys.has(key) && !isSelected) {
                el.click();
            } else if (!targetKeys.has(key) && isSelected) {
                el.click();
            }
        });
    }

    /**
     * Executa o ataque com segurança
     */
    function executeAttack() {
        const btn = document.getElementById('btn_attack');
        if (!btn || btn.hasAttribute('disabled')) {
            if (window.UI) window.UI.ErrorMessage('Ataque indisponível no momento.', 2000);
            return false;
        }
        btn.click();
        return true;
    }

    /**
     * Executa o descarte com proteção estrita contra gasto de Pontos Premium
     */
    function executeDiscard() {
        const btn = document.getElementById('btn_discard');
        if (!btn || btn.hasAttribute('disabled')) {
            if (window.UI) window.UI.ErrorMessage('Descarte indisponível no momento.', 2000);
            return false;
        }

        const cost = parseInt(btn.getAttribute('data-cost') || '0', 10);
        if (cost > 0) {
            if (window.UI) {
                window.UI.ErrorMessage('⚠️ Descarte Grátis esgotado! Ação cancelada para blindar seus Pontos Premium.', 3500);
            }
            return false;
        }

        btn.click();
        return true;
    }

    // =========================================================================
    // 🎨 INTERFACE VISUAL (GLASSMORPHISM DARK UI)
    // =========================================================================

    function createUI() {
        const existing = document.getElementById(CONTAINER_ID);
        if (existing) existing.remove();

        const box = document.createElement('div');
        box.id = CONTAINER_ID;
        box.innerHTML = `
            <style>
                #${CONTAINER_ID} {
                    position: fixed;
                    top: 65px;
                    right: 20px;
                    width: 390px;
                    max-height: 90vh;
                    background: rgba(15, 23, 42, 0.94);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(240, 168, 96, 0.35);
                    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65), 0 0 15px rgba(240, 168, 96, 0.15);
                    border-radius: 12px;
                    z-index: 15000;
                    color: #f8fafc;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-sizing: border-box;
                    transition: all 0.25s ease;
                }
                #${CONTAINER_ID} * { box-sizing: border-box; }
                .tw-sp-header {
                    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
                    padding: 10px 14px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(240, 168, 96, 0.25);
                    cursor: move;
                    user-select: none;
                }
                .tw-sp-title {
                    font-weight: 700;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #f0a860;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                }
                .tw-sp-badge {
                    font-size: 9px;
                    background: rgba(240, 168, 96, 0.2);
                    color: #fadc9b;
                    border: 1px solid rgba(240, 168, 96, 0.4);
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .tw-sp-actions-bar {
                    display: flex;
                    gap: 6px;
                }
                .tw-sp-btn-icon {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    transition: 0.15s;
                }
                .tw-sp-btn-icon:hover { color: #f8fafc; background: rgba(255, 255, 255, 0.1); }
                .tw-sp-body {
                    padding: 12px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    font-size: 12px;
                }
                .tw-sp-hud {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 6px;
                    background: rgba(30, 41, 59, 0.6);
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    text-align: center;
                }
                .tw-sp-hud-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .tw-sp-hud-label { font-size: 10px; color: #94a3b8; margin-bottom: 2px; }
                .tw-sp-hud-val { font-size: 13px; font-weight: 700; color: #f8fafc; }
                .tw-sp-hud-val.gold { color: #f0a860; }
                .tw-sp-hud-val.green { color: #4ade80; }
                .tw-sp-hud-val.red { color: #f87171; }

                /* Best Hand Card */
                .tw-sp-card-box {
                    background: linear-gradient(135deg, rgba(240, 168, 96, 0.12), rgba(15, 23, 42, 0.6));
                    border: 1px solid rgba(240, 168, 96, 0.4);
                    border-radius: 8px;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .tw-sp-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .tw-sp-hand-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #fadc9b;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .tw-sp-hand-pts {
                    font-size: 14px;
                    font-weight: 800;
                    color: #4ade80;
                    background: rgba(34, 197, 94, 0.15);
                    padding: 2px 8px;
                    border-radius: 6px;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                }
                .tw-sp-cards-preview {
                    display: flex;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                .tw-sp-mini-card {
                    padding: 4px 6px;
                    border-radius: 4px;
                    font-weight: 700;
                    font-size: 11px;
                    background: rgba(30, 41, 59, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }

                /* Buttons */
                .tw-sp-btn {
                    background: linear-gradient(135deg, #f0a860, #d97706);
                    color: #0f172a;
                    font-weight: 700;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: 0.15s;
                    font-size: 12px;
                    box-shadow: 0 2px 6px rgba(240, 168, 96, 0.3);
                }
                .tw-sp-btn:hover {
                    filter: brightness(1.1);
                    transform: translateY(-1px);
                }
                .tw-sp-btn:active { transform: translateY(0); }
                .tw-sp-btn-secondary {
                    background: rgba(51, 65, 85, 0.8);
                    color: #f8fafc;
                    box-shadow: none;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .tw-sp-btn-secondary:hover { background: rgba(71, 85, 105, 0.9); }
                .tw-sp-btn-success {
                    background: linear-gradient(135deg, #22c55e, #15803d);
                    color: #ffffff;
                    box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
                }

                /* Strategy Box */
                .tw-sp-strategy-box {
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px dashed rgba(240, 168, 96, 0.3);
                    border-radius: 8px;
                    padding: 9px;
                    font-size: 11px;
                    line-height: 1.4;
                }
                .tw-sp-strategy-title {
                    font-weight: 700;
                    color: #f0a860;
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                /* Deck Tracker */
                .tw-sp-deck-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 4px;
                    font-size: 11px;
                }
                .tw-sp-deck-pill {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 4px;
                    border-radius: 4px;
                    text-align: center;
                }

                /* Hands List Accordion */
                .tw-sp-hands-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    max-height: 130px;
                    overflow-y: auto;
                    padding-right: 2px;
                }
                .tw-sp-hand-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 5px 8px;
                    background: rgba(30, 41, 59, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: 0.15s;
                }
                .tw-sp-hand-row:hover {
                    background: rgba(240, 168, 96, 0.15);
                    border-color: rgba(240, 168, 96, 0.3);
                }

                .tw-sp-toggle-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 4px 0;
                    font-size: 11px;
                    color: #cbd5e1;
                }
            </style>

            <div class="tw-sp-header" id="twSpHeader">
                <div class="tw-sp-title">
                    <span>🏰 ${SCRIPT_NAME}</span>
                    <span class="tw-sp-badge">${SCRIPT_VERSION}</span>
                </div>
                <div class="tw-sp-actions-bar">
                    <button class="tw-sp-btn-icon" id="twSpBtnMin" title="Minimizar">_</button>
                    <button class="tw-sp-btn-icon" id="twSpBtnClose" title="Fechar">✕</button>
                </div>
            </div>

            <div class="tw-sp-body" id="twSpBody">
                <div id="twSpContent">
                    <div style="text-align: center; padding: 20px; color: #94a3b8;">
                        Carregando dados do Póquer de Cerco...
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(box);

        // Arrastar Janela
        makeDraggable(box, document.getElementById('twSpHeader'));

        // Minimizar e Fechar
        document.getElementById('twSpBtnClose').addEventListener('click', () => box.remove());
        document.getElementById('twSpBtnMin').addEventListener('click', () => {
            prefs.minimized = !prefs.minimized;
            savePrefs();
            updateMinimizedState();
        });

        updateMinimizedState();
    }

    function updateMinimizedState() {
        const body = document.getElementById('twSpBody');
        const minBtn = document.getElementById('twSpBtnMin');
        if (body && minBtn) {
            body.style.display = prefs.minimized ? 'none' : 'flex';
            minBtn.textContent = prefs.minimized ? '□' : '_';
        }
    }

    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // =========================================================================
    // 🔄 RENDERIZADOR PRINCIPAL DO PAINEL
    // =========================================================================

    let cachedHandAnalysis = null;
    let cachedDiscardAnalysis = null;

    function renderUI() {
        const container = document.getElementById('twSpContent');
        if (!container) return;

        // Caso 1: Não está na tela do evento
        if (!isEventScreen()) {
            container.innerHTML = `
                <div style="text-align: center; padding: 15px;">
                    <div style="font-size: 28px; margin-bottom: 8px;">🏰</div>
                    <div style="font-weight: 700; color: #f0a860; margin-bottom: 6px;">Póquer de Cerco Inativo</div>
                    <p style="color: #94a3b8; font-size: 11px; margin-bottom: 14px;">
                        Você precisa estar na tela oficial do evento no Tribal Wars para o assistente ler suas cartas e calcular as jogadas.
                    </p>
                    <a href="/game.php?village=${window.game_data?.village?.id || ''}&screen=event_siege_poker" 
                       class="tw-sp-btn" style="text-decoration: none; display: inline-flex;">
                        Abrir Póquer de Cerco
                    </a>
                </div>
            `;
            return;
        }

        // Caso 2: Está na Loja de Bandeiras (entre batalhas)
        if (isFlagShopActive()) {
            const shop = window.SiegePokerFlagShop.flag_shop;
            const flagsCount = shop.flags ? shop.flags.length : 0;
            const maxFlags = shop.max_amount_flags || 6;
            const freeRerolls = shop.available_free_flag_rerolls || 0;

            container.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="tw-sp-strategy-box">
                        <div class="tw-sp-strategy-title">
                            <span>🚩 Loja de Bandeiras</span>
                            <span style="color: #fadc9b;">${flagsCount}/${maxFlags} Bandeiras</span>
                        </div>
                        <p style="margin: 0; color: #cbd5e1;">
                            Você está na etapa de melhorias. Escolha as bandeiras com sinergia ao seu estilo (ex: buffs de Flush, cartas de Infantaria/Cavalaria ou reduções de defesa).
                        </p>
                        ${freeRerolls > 0 ? `<p style="margin-top: 5px; color: #4ade80;">🎲 Você possui <b>${freeRerolls}</b> reroll(s) grátis disponível(is)!</p>` : ''}
                    </div>
                    <button class="tw-sp-btn" id="twSpBtnStartBattle">
                        ⚔️ Iniciar Próxima Batalha
                    </button>
                </div>
            `;

            document.getElementById('twSpBtnStartBattle')?.addEventListener('click', () => {
                const btn = document.getElementById('btn_start_battle');
                if (btn) btn.click();
            });
            return;
        }

        // Caso 3: Batalha em Andamento
        const sp = window.SiegePoker;
        if (!sp || !sp.hand_cards || sp.hand_cards.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #94a3b8;">
                    Aguardando distribuição de cartas pelo jogo...
                </div>
            `;
            return;
        }

        const handCards = sp.hand_cards;
        const castle = sp.castle || { number: 1, defense_power: 0, difficulty_level: 1 };
        const availableAttacks = sp.available_attacks !== undefined ? sp.available_attacks : 3;
        const maxAttacks = sp.max_attacks || 3;
        const freeDiscards = sp.available_free_discards !== undefined ? sp.available_free_discards : 0;
        const remainingDeck = sp.remaining_cards_in_deck !== undefined ? sp.remaining_cards_in_deck : 44;
        const deckCards = sp.cards_in_deck || [];

        // Realiza cálculo tático
        const handAnalysis = analyzeAllHands(handCards);
        const discardAnalysis = analyzeDiscardStrategy(handCards, deckCards);
        cachedHandAnalysis = handAnalysis;
        cachedDiscardAnalysis = discardAnalysis;

        const bestHand = handAnalysis.best;
        const isLethal = bestHand && bestHand.info.pts >= castle.defense_power;

        // Contagem de Naipes e Figuras no Baralho
        const deckSuits = { infantry: 0, archer: 0, cavalry: 0, siege: 0 };
        const deckHighCards = { 'a': 0, 'k': 0, 'q': 0, 'j': 0, '10': 0 };
        deckCards.forEach(c => {
            if (deckSuits[c.suit] !== undefined) deckSuits[c.suit]++;
            if (deckHighCards[c.rank] !== undefined) deckHighCards[c.rank]++;
        });

        container.innerHTML = `
            <!-- HUD Superior -->
            <div class="tw-sp-hud">
                <div class="tw-sp-hud-item">
                    <span class="tw-sp-hud-label">🏰 Castelo #${castle.number}</span>
                    <span class="tw-sp-hud-val gold">${castle.defense_power} <span style="font-size: 10px;">HP</span></span>
                </div>
                <div class="tw-sp-hud-item">
                    <span class="tw-sp-hud-label">⚔️ Ataques</span>
                    <span class="tw-sp-hud-val ${availableAttacks > 1 ? 'green' : 'red'}">${availableAttacks}/${maxAttacks}</span>
                </div>
                <div class="tw-sp-hud-item">
                    <span class="tw-sp-hud-label">♻️ Descartes Grátis</span>
                    <span class="tw-sp-hud-val ${freeDiscards > 0 ? 'green' : 'red'}">${freeDiscards}</span>
                </div>
            </div>

            <!-- Card da Melhor Mão -->
            <div class="tw-sp-card-box">
                <div class="tw-sp-card-header">
                    <div class="tw-sp-hand-name">
                        <span>${bestHand ? bestHand.info.badge : '🃏'}</span>
                        <span>${bestHand ? bestHand.info.name : 'Nenhuma mão'}</span>
                    </div>
                    <div class="tw-sp-hand-pts">
                        +${bestHand ? bestHand.info.pts : 0} pts
                    </div>
                </div>

                ${isLethal ? `
                    <div style="background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4); padding: 5px 8px; border-radius: 6px; font-weight: 700; color: #4ade80; font-size: 11px; text-align: center;">
                        🎯 DANO LETAL: Esta mão derrota o castelo agora!
                    </div>
                ` : `
                    <div style="font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
                        <span>Dano previsto: ${bestHand ? bestHand.info.pts : 0}</span>
                        <span>Faltarão: ${Math.max(0, castle.defense_power - (bestHand ? bestHand.info.pts : 0))} HP</span>
                    </div>
                `}

                <div class="tw-sp-cards-preview">
                    ${bestHand ? (prefs.fullFiveCardAttack ? bestHand.fullFiveCards : bestHand.contributing).map(c => `
                        <div class="tw-sp-mini-card" style="border-color: ${SUIT_COLORS[c.suit]};">
                            <span>${SUIT_ICONS[c.suit]}</span>
                            <span>${RANK_SHORT[c.rank]}</span>
                        </div>
                    `).join('') : ''}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 4px;">
                    <button class="tw-sp-btn" id="twSpBtnSelectBest">
                        👑 Selecionar Mão
                    </button>
                    <button class="tw-sp-btn ${isLethal ? 'tw-sp-btn-success' : 'tw-sp-btn-secondary'}" id="twSpBtnAttackBest">
                        ⚔️ Atacar (${bestHand ? bestHand.info.pts : 0})
                    </button>
                </div>
            </div>

            <!-- Estratégia de Descarte Ótimo -->
            ${discardAnalysis ? `
                <div class="tw-sp-strategy-box">
                    <div class="tw-sp-strategy-title">
                        <span>${discardAnalysis.title}</span>
                        <span style="color: #4ade80; font-size: 10px;">Prob: ${discardAnalysis.prob}</span>
                    </div>
                    <p style="margin: 0 0 8px 0; color: #cbd5e1;">${discardAnalysis.description}</p>
                    <div style="display: flex; gap: 6px;">
                        <button class="tw-sp-btn tw-sp-btn-secondary" id="twSpBtnSelectDiscard" style="flex: 1; padding: 6px 10px;">
                            🎲 Marcar Descarte (${discardAnalysis.discard.length})
                        </button>
                        ${freeDiscards > 0 ? `
                            <button class="tw-sp-btn tw-sp-btn-secondary" id="twSpBtnExecuteDiscard" style="padding: 6px 10px;" title="Descartar com proteção anti-gasto PP">
                                ♻️ Descartar
                            </button>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Rastreador de Baralho -->
            <div>
                <div style="font-weight: 700; font-size: 11px; color: #f0a860; margin-bottom: 4px; display: flex; justify-content: space-between;">
                    <span>📊 Baralho Restante (${remainingDeck} cartas)</span>
                    <span style="font-size: 10px; color: #94a3b8;">A: ${deckHighCards.a} · K: ${deckHighCards.k} · Q: ${deckHighCards.q}</span>
                </div>
                <div class="tw-sp-deck-grid">
                    <div class="tw-sp-deck-pill">🛡️ Inf: <b>${deckSuits.infantry}</b></div>
                    <div class="tw-sp-deck-pill">🏹 Arq: <b>${deckSuits.archer}</b></div>
                    <div class="tw-sp-deck-pill">🐎 Cav: <b>${deckSuits.cavalry}</b></div>
                    <div class="tw-sp-deck-pill">🎯 Cer: <b>${deckSuits.siege}</b></div>
                </div>
            </div>

            <!-- Outras Mãos Possíveis -->
            ${handAnalysis.allHands.length > 1 ? `
                <div>
                    <div style="font-weight: 700; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
                        Combinações Disponíveis (${handAnalysis.allHands.length})
                    </div>
                    <div class="tw-sp-hands-list">
                        ${handAnalysis.allHands.slice(0, 6).map((h, idx) => `
                            <div class="tw-sp-hand-row" data-hand-idx="${idx}">
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <span>${h.info.badge}</span>
                                    <span>${h.info.name}</span>
                                </div>
                                <span style="font-weight: 700; color: #4ade80;">+${h.info.pts}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Opções e Automação -->
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 6px;">
                <div class="tw-sp-toggle-row">
                    <span>Reciclar 5 cartas no ataque (recicla lixo):</span>
                    <input type="checkbox" id="twSpToggleFiveCard" ${prefs.fullFiveCardAttack ? 'checked' : ''}>
                </div>
                <div class="tw-sp-toggle-row">
                    <span style="color: #fadc9b; font-weight: 700;">🤖 Auto-Jogar Rodada (Seguro):</span>
                    <input type="checkbox" id="twSpToggleAutoPlay" ${prefs.autoPlay ? 'checked' : ''}>
                </div>
            </div>
        `;

        bindEvents();
    }

    function bindEvents() {
        // Selecionar Melhor Mão
        document.getElementById('twSpBtnSelectBest')?.addEventListener('click', () => {
            if (cachedHandAnalysis && cachedHandAnalysis.best) {
                const targetCards = prefs.fullFiveCardAttack ? cachedHandAnalysis.best.fullFiveCards : cachedHandAnalysis.best.contributing;
                selectCardsOnBoard(targetCards);
                if (window.UI) window.UI.SuccessMessage(`👑 ${cachedHandAnalysis.best.info.name} (+${cachedHandAnalysis.best.info.pts} pts) selecionada!`, 1800);
            }
        });

        // Atacar com Melhor Mão
        document.getElementById('twSpBtnAttackBest')?.addEventListener('click', () => {
            if (cachedHandAnalysis && cachedHandAnalysis.best) {
                const targetCards = prefs.fullFiveCardAttack ? cachedHandAnalysis.best.fullFiveCards : cachedHandAnalysis.best.contributing;
                selectCardsOnBoard(targetCards);
                setTimeout(() => {
                    executeAttack();
                }, 150);
            }
        });

        // Marcar Descarte
        document.getElementById('twSpBtnSelectDiscard')?.addEventListener('click', () => {
            if (cachedDiscardAnalysis && cachedDiscardAnalysis.discard) {
                selectCardsOnBoard(cachedDiscardAnalysis.discard);
                if (window.UI) window.UI.InfoMessage(`🎲 ${cachedDiscardAnalysis.discard.length} carta(s) para descarte selecionada(s)!`, 1800);
            }
        });

        // Executar Descarte Seguro
        document.getElementById('twSpBtnExecuteDiscard')?.addEventListener('click', () => {
            if (cachedDiscardAnalysis && cachedDiscardAnalysis.discard) {
                selectCardsOnBoard(cachedDiscardAnalysis.discard);
                setTimeout(() => {
                    executeDiscard();
                }, 150);
            }
        });

        // Clique em Mão da Lista
        document.querySelectorAll('.tw-sp-hand-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const idx = parseInt(row.dataset.handIdx, 10);
                if (cachedHandAnalysis && cachedHandAnalysis.allHands[idx]) {
                    const chosen = cachedHandAnalysis.allHands[idx];
                    const targetCards = prefs.fullFiveCardAttack ? chosen.fullFiveCards : chosen.contributing;
                    selectCardsOnBoard(targetCards);
                    if (window.UI) window.UI.SuccessMessage(`${chosen.info.name} (+${chosen.info.pts} pts) selecionada!`, 1500);
                }
            });
        });

        // Toggle Reciclar 5 Cartas
        document.getElementById('twSpToggleFiveCard')?.addEventListener('change', (e) => {
            prefs.fullFiveCardAttack = e.target.checked;
            savePrefs();
            renderUI();
        });

        // Toggle Auto-Play
        document.getElementById('twSpToggleAutoPlay')?.addEventListener('change', (e) => {
            prefs.autoPlay = e.target.checked;
            savePrefs();
            if (prefs.autoPlay) {
                if (window.UI) window.UI.SuccessMessage('🤖 Auto-Jogar Rodada ativado!', 2000);
                runAutoPlayCycle();
            } else {
                if (window.UI) window.UI.InfoMessage('⏸️ Auto-Jogar pausado.', 1500);
            }
        });
    }

    // =========================================================================
    // 🤖 CICLO DE AUTO-JOGAR INTELIGENTE (SMART AUTO-PLAY)
    // =========================================================================

    let isAutoPlaying = false;

    async function runAutoPlayCycle() {
        if (!prefs.autoPlay || isAutoPlaying || !isBattleActive()) return;
        isAutoPlaying = true;

        try {
            const sp = window.SiegePoker;
            if (sp.actions_disabled) {
                setTimeout(runAutoPlayCycle, 800);
                return;
            }

            const handCards = sp.hand_cards;
            const castle = sp.castle || { defense_power: 0 };
            const freeDiscards = sp.available_free_discards || 0;
            const handAnalysis = analyzeAllHands(handCards);
            const discardAnalysis = analyzeDiscardStrategy(handCards, sp.cards_in_deck || []);

            const best = handAnalysis.best;
            if (!best) return;

            // Decisão 1: Dano Letal (Derruba o castelo imediatamente)
            if (best.info.pts >= castle.defense_power) {
                selectCardsOnBoard(prefs.fullFiveCardAttack ? best.fullFiveCards : best.contributing);
                await delay(350);
                executeAttack();
                return;
            }

            // Decisão 2: Se tiver mão excelente (Trinca, Straight, Flush, Full House, etc.) -> Ataca!
            if (best.info.pts >= 100) {
                selectCardsOnBoard(prefs.fullFiveCardAttack ? best.fullFiveCards : best.contributing);
                await delay(350);
                executeAttack();
                return;
            }

            // Decisão 3: Se a mão é fraca (< 100 pts) e TEM descartes grátis -> Descarta para buscar mão maior!
            if (freeDiscards > 0 && discardAnalysis && discardAnalysis.discard.length > 0) {
                selectCardsOnBoard(discardAnalysis.discard);
                await delay(350);
                const ok = executeDiscard();
                if (!ok) {
                    // Fallback se descarte falhar: ataca com o que tiver
                    selectCardsOnBoard(prefs.fullFiveCardAttack ? best.fullFiveCards : best.contributing);
                    await delay(300);
                    executeAttack();
                }
                return;
            }

            // Decisão 4: Sem descartes grátis -> Ataca com a melhor mão disponível
            selectCardsOnBoard(prefs.fullFiveCardAttack ? best.fullFiveCards : best.contributing);
            await delay(350);
            executeAttack();

        } catch (err) {
            console.error('[SiegePokerAI] Erro no ciclo auto-play:', err);
        } finally {
            isAutoPlaying = false;
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =========================================================================
    // 📡 OBSERVADOR DE MUTAÇÕES DO JOGO (AUTO-REFRESH HUD)
    // =========================================================================

    function setupObserver() {
        // Observa alterações no tabuleiro para re-renderizar o HUD instantaneamente
        const targetNode = document.getElementById('hand_cards') || document.getElementById('contentContainer') || document.body;
        const observer = new MutationObserver(() => {
            // Re-renderiza com debounce
            if (renderTimeout) clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                renderUI();
                if (prefs.autoPlay) {
                    setTimeout(runAutoPlayCycle, 700);
                }
            }, 300);
        });

        let renderTimeout = null;
        observer.observe(targetNode, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-cost'] });
    }

    // =========================================================================
    // 🚀 INICIALIZAÇÃO
    // =========================================================================

    createUI();
    renderUI();
    setupObserver();

    if (window.UI && typeof window.UI.SuccessMessage === 'function') {
        window.UI.SuccessMessage('🏰 Assistente do Póquer de Cerco carregado!', 2500);
    }

})();
