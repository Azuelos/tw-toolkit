// ===========================================================================
// 🏰 Póquer de Cerco AI — Assistente Tático & Otimizador de Mãos e Descarte
// Evento "Póquer de Cerco" (Siege Poker) — Tribal Wars BR143
// Versão: 1.2.2 (Piloto Automático Mãos Livres) (Edição Oficial TW Toolkit)
// Desenvolvido por: Azuelos (@jhonatanazuelosoficial)
//
// Uso na Barra de Acesso Rápido do Tribal Wars:
// javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/SiegePokerPTBR.js?_='+Date.now();document.head.appendChild(s);})();void(0);
// ===========================================================================

(function () {
    'use strict';

    // Se já houver instância aberta, remove para injetar e atualizar para a v1.1.0 sem precisar recarregar página
    const CONTAINER_ID = 'twSiegePokerAIContainer';
    if (document.getElementById(CONTAINER_ID)) {
        try {
            document.getElementById(CONTAINER_ID).remove();
            if (window.twSpPollInterval) clearInterval(window.twSpPollInterval);
        } catch (e) {}
    }

    const SCRIPT_NAME = 'Póquer de Cerco AI';
    const SCRIPT_VERSION = 'v1.2.2';
    const STORAGE_KEY = 'ond_tw_siege_poker_prefs';

    // Definição e Constantes Oficiais do Jogo
    const SUITS = ['infantry', 'archer', 'cavalry', 'siege'];
    const SUIT_LABELS = {
        infantry: '🛡️ Infantaria',
        archer: '🏹 Arqueiro',
        cavalry: '🐎 Cavalaria',
        siege: '🎯 Cerco'
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
        autoPlay: true, // Piloto Automático Mãos Livres ATIVO por padrão
        safeOnlyFreeDiscards: true,
        fullFiveCardAttack: true // preenche até 5 cartas para reciclar lixo de graça
    };

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) prefs = Object.assign(prefs, JSON.parse(saved));
        prefs.autoPlay = true; // Sempre inicia jogando automaticamente a pedido do jogador
    } catch (e) {}

    function savePrefs() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
    }

    // =========================================================================
    // 🔍 IDENTIFICAÇÃO RESILIENTE DO JOGO (DUAL DOM + SCOPE DETECTION)
    // =========================================================================

    function getSiegePoker() {
        try {
            if (typeof SiegePoker !== 'undefined' && SiegePoker) {
                if (typeof window !== 'undefined' && !window.SiegePoker) window.SiegePoker = SiegePoker;
                return SiegePoker;
            }
        } catch (e) {}
        try {
            if (typeof window !== 'undefined' && window.SiegePoker) return window.SiegePoker;
        } catch (e) {}
        return null;
    }

    function getSiegePokerFlagShop() {
        try {
            if (typeof SiegePokerFlagShop !== 'undefined' && SiegePokerFlagShop) {
                if (typeof window !== 'undefined' && !window.SiegePokerFlagShop) window.SiegePokerFlagShop = SiegePokerFlagShop;
                return SiegePokerFlagShop;
            }
        } catch (e) {}
        try {
            if (typeof window !== 'undefined' && window.SiegePokerFlagShop) return window.SiegePokerFlagShop;
        } catch (e) {}
        return null;
    }

    function isEventScreen() {
        return Boolean(
            document.getElementById('hand_cards') ||
            document.getElementById('btn_attack') ||
            document.getElementById('btn_start_battle') ||
            window.location.href.includes('screen=event_siege_poker') ||
            getSiegePoker() ||
            getSiegePokerFlagShop()
        );
    }

    function isBattleScreen() {
        return Boolean(document.getElementById('btn_attack') || document.getElementById('hand_cards'));
    }

    function isFlagShopActive() {
        // Se a tela de batalha com botão de ataque ou cartas estiver presente, JAMAIS é Flag Shop
        if (isBattleScreen()) return false;
        return Boolean(document.getElementById('btn_start_battle'));
    }

    /**
     * Extrai o estado completo da batalha atual com leitura direta no DOM
     */
    function getGameState() {
        const sp = getSiegePoker();
        const fs = getSiegePokerFlagShop();

        // 1. Extração de Cartas da Mão (Prioridade DOM com Fallback via background-image)
        const cardElements = document.querySelectorAll('#hand_cards .card, .hand-cards .card, [id^="card_slot_"]');
        const domHand = [];
        const seenSlots = new Set();

        cardElements.forEach(el => {
            if (el.id && seenSlots.has(el.id)) return;
            if (el.id) seenSlots.add(el.id);

            let suit = el.dataset?.suit || el.getAttribute('data-suit');
            let rank = el.dataset?.rank || el.getAttribute('data-rank');

            // Fallback via estilo se dataset ainda não tiver sido sincronizado
            if ((!suit || !rank) && el.style && el.style.backgroundImage) {
                const m = el.style.backgroundImage.match(/cards\/([^_]+)_([^.]+)\.(?:png|webp)/i);
                if (m) {
                    rank = m[1].toLowerCase();
                    suit = m[2].toLowerCase();
                }
            }

            if (suit && rank) {
                domHand.push({
                    suit: suit.toLowerCase(),
                    rank: rank.toLowerCase(),
                    modifiers: (el.dataset?.modifier_veteran || el.getAttribute('data-modifier_veteran')) ? ['veteran'] : [],
                    element: el
                });
            }
        });

        // Se DOM ainda não populou mas o objeto sp tem cards_hand
        let finalHand = domHand;
        if (finalHand.length === 0 && sp && sp.hand_cards && sp.hand_cards.length > 0) {
            finalHand = sp.hand_cards;
        }

        // 2. Pontos de Defesa do Castelo e Número
        let castleDef = 0;
        const defEl = document.getElementById('castle_defense_power_value');
        if (defEl && defEl.textContent.trim()) {
            castleDef = parseInt(defEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
        } else if (sp && sp.castle && sp.castle.defense_power !== undefined) {
            castleDef = sp.castle.defense_power;
        }

        let castleNum = 1;
        const numEl = document.getElementById('castle_number_value');
        if (numEl && numEl.textContent.trim()) {
            castleNum = parseInt(numEl.textContent.replace(/[^0-9]/g, ''), 10) || 1;
        } else if (sp && sp.castle && sp.castle.number !== undefined) {
            castleNum = sp.castle.number;
        }

        // 3. Ataques Restantes
        let availableAttacks = 3;
        const attEl = document.getElementById('btn_attack_stats');
        if (attEl && attEl.textContent.trim()) {
            const m = attEl.textContent.match(/(\d+)/);
            if (m) availableAttacks = parseInt(m[1], 10);
        } else if (sp && sp.available_attacks !== undefined) {
            availableAttacks = sp.available_attacks;
        }

        // 4. Descartes Gratuitos Restantes e Custo
        let freeDiscards = 0;
        const discardBtn = document.getElementById('btn_discard');
        const cost = discardBtn ? parseInt(discardBtn.getAttribute('data-cost') || '0', 10) : 0;
        const discStats = document.getElementById('btn_discard_stats');
        if (discStats && discStats.textContent.trim()) {
            const m = discStats.textContent.match(/(\d+)/);
            if (m) {
                freeDiscards = (cost === 0) ? parseInt(m[1], 10) : 0;
            }
        } else if (sp && sp.available_free_discards !== undefined) {
            freeDiscards = (cost === 0) ? sp.available_free_discards : 0;
        }

        // 5. Cartas Restantes no Baralho
        let deckCount = 44;
        const deckStats = document.getElementById('card_deck_stats');
        if (deckStats && deckStats.textContent.trim()) {
            const m = deckStats.textContent.match(/(\d+)/);
            if (m) deckCount = parseInt(m[1], 10);
        } else if (sp && sp.remaining_cards_in_deck !== undefined) {
            deckCount = sp.remaining_cards_in_deck;
        }

        // Lista de Cartas no Baralho
        let deckCards = (sp && sp.cards_in_deck) ? sp.cards_in_deck : [];
        if (deckCards.length === 0 && finalHand.length > 0) {
            const handKeys = new Set(finalHand.map(c => `${c.suit}_${c.rank}`));
            const fullDeck = [];
            SUITS.forEach(s => {
                RANKS.forEach(r => {
                    if (!handKeys.has(`${s}_${r}`)) fullDeck.push({ suit: s, rank: r });
                });
            });
            deckCards = fullDeck;
        }

        // Status de botões desabilitados
        let actionsDisabled = false;
        const attackBtn = document.getElementById('btn_attack');
        if (attackBtn && attackBtn.hasAttribute('disabled')) {
            actionsDisabled = true;
        } else if (sp && sp.actions_disabled !== undefined) {
            actionsDisabled = sp.actions_disabled;
        }

        return {
            sp: sp,
            fs: fs,
            handCards: finalHand,
            castle: {
                number: castleNum,
                defense_power: castleDef
            },
            availableAttacks: availableAttacks,
            freeDiscards: freeDiscards,
            discardCost: cost,
            remainingDeck: deckCount,
            deckCards: deckCards,
            actionsDisabled: actionsDisabled
        };
    }

    // =========================================================================
    // 🧠 MOTOR DE AVALIAÇÃO DE MÃOS (POKER ENGINE)
    // =========================================================================

    function evaluateCombination(cards) {
        if (!cards || cards.length === 0) return null;

        const byRank = {};
        cards.forEach(c => {
            byRank[c.rank] = byRank[c.rank] || [];
            byRank[c.rank].push(c);
        });

        const bySuit = {};
        cards.forEach(c => {
            bySuit[c.suit] = bySuit[c.suit] || [];
            bySuit[c.suit].push(c);
        });

        const isFlush = cards.length === 5 && Object.keys(bySuit).length === 1;

        let isStraight = false;
        let isRoyal = false;
        let straightCards = [];

        if (cards.length === 5) {
            const sortedRanks = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);
            if (new Set(sortedRanks).size === 5 && sortedRanks[4] - sortedRanks[0] === 4) {
                isStraight = true;
                straightCards = cards;
                if (sortedRanks[4] === 12) isRoyal = true;
            } else if (sortedRanks.join(',') === '0,1,2,3,12') {
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

        const highestCard = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank])[0];
        return { type: 'HIGH_CARD', info: HAND_TYPES.HIGH_CARD, contributing: [highestCard] };
    }

    function combinations(arr, k) {
        if (k === 0) return [[]];
        if (arr.length === 0 || k > arr.length) return [];
        const head = arr[0];
        const tail = arr.slice(1);
        const withHead = combinations(tail, k - 1).map(c => [head, ...c]);
        const withoutHead = combinations(tail, k);
        return [...withHead, ...withoutHead];
    }

    function analyzeAllHands(handCards) {
        if (!handCards || handCards.length === 0) return { best: null, allHands: [] };

        const evaluatedList = [];
        const seenHandSignatures = new Set();

        const combos5 = combinations(handCards, Math.min(5, handCards.length));
        combos5.forEach(combo => {
            const res = evaluateCombination(combo);
            if (res) {
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

        [4, 3, 2, 1].forEach(size => {
            if (handCards.length >= size) {
                combinations(handCards, size).forEach(combo => {
                    const res = evaluateCombination(combo);
                    if (res && res.contributing.length === combo.length) {
                        const sig = res.type + ':' + res.contributing.map(c => c.suit + '_' + c.rank).sort().join('|');
                        if (!seenHandSignatures.has(sig)) {
                            seenHandSignatures.add(sig);
                            const remaining = handCards.filter(c => !combo.includes(c))
                                .sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]);
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

        evaluatedList.sort((a, b) => {
            if (b.info.pts !== a.info.pts) return b.info.pts - a.info.pts;
            const sumA = a.contributing.reduce((acc, c) => acc + RANK_VALUES[c.rank], 0);
            const sumB = b.contributing.reduce((acc, c) => acc + RANK_VALUES[c.rank], 0);
            return sumB - sumA;
        });

        return {
            best: evaluatedList[0] || null,
            allHands: evaluatedList
        };
    }

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
            if (slice[3] - slice[0] === 3) {
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

        // 3. Trinca
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

        // 4. Dois Pares
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

        // 5. Um Par
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

        // 6. Carta Alta
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
    // 🎮 INTERAÇÃO COM O TABULEIRO (DOM ACTIONS)
    // =========================================================================

    function selectCardsOnBoard(cardsToSelect) {
        if (!cardsToSelect || cardsToSelect.length === 0) return;
        const targetKeys = new Set(cardsToSelect.map(c => `${c.suit.toLowerCase()}_${c.rank.toLowerCase()}`));
        const cardElements = document.querySelectorAll('#hand_cards .card, .hand-cards .card, [id^="card_slot_"]');
        const seenSlots = new Set();

        const toUnselect = [];
        const toSelect = [];

        cardElements.forEach(el => {
            if (el.id && seenSlots.has(el.id)) return;
            if (el.id) seenSlots.add(el.id);

            let suit = el.dataset?.suit || el.getAttribute('data-suit');
            let rank = el.dataset?.rank || el.getAttribute('data-rank');
            if (!suit || !rank) {
                const m = el.style.backgroundImage ? el.style.backgroundImage.match(/cards\/([^_]+)_([^.]+)\.(?:png|webp)/i) : null;
                if (m) { rank = m[1]; suit = m[2]; }
            }
            if (!suit || !rank) return;

            const key = `${suit.toLowerCase()}_${rank.toLowerCase()}`;
            const isSelected = el.classList.contains('card-selected');

            if (!targetKeys.has(key) && isSelected) {
                toUnselect.push(el);
            } else if (targetKeys.has(key) && !isSelected) {
                toSelect.push(el);
            }
        });

        // 1. Desmarca primeiro as cartas indesejadas
        toUnselect.forEach(el => el.click());

        // 2. Marca as novas cartas sem estourar o limite de 5 da interface
        toSelect.forEach(el => el.click());
    }

    function executeAttack() {
        const btn = document.getElementById('btn_attack');
        if (!btn || btn.hasAttribute('disabled')) {
            if (window.UI) window.UI.ErrorMessage('Ataque indisponível no momento.', 2000);
            return false;
        }
        btn.click();
        return true;
    }

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
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    border: 1px solid rgba(240, 168, 96, 0.4);
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 18px rgba(240, 168, 96, 0.18);
                    border-radius: 12px;
                    z-index: 15000;
                    color: #f8fafc;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-sizing: border-box;
                }
                #${CONTAINER_ID} * { box-sizing: border-box; }
                .tw-sp-header {
                    background: linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98));
                    padding: 10px 14px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(240, 168, 96, 0.3);
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
                    background: rgba(240, 168, 96, 0.25);
                    color: #fadc9b;
                    border: 1px solid rgba(240, 168, 96, 0.45);
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
                    font-size: 13px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    transition: 0.15s;
                }
                .tw-sp-btn-icon:hover { color: #f8fafc; background: rgba(255, 255, 255, 0.12); }
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
                    background: rgba(30, 41, 59, 0.65);
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.06);
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

                .tw-sp-card-box {
                    background: linear-gradient(135deg, rgba(240, 168, 96, 0.15), rgba(15, 23, 42, 0.7));
                    border: 1px solid rgba(240, 168, 96, 0.45);
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
                    background: rgba(34, 197, 94, 0.18);
                    padding: 2px 8px;
                    border-radius: 6px;
                    border: 1px solid rgba(34, 197, 94, 0.35);
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
                    background: rgba(30, 41, 59, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }

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
                .tw-sp-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
                .tw-sp-btn:active { transform: translateY(0); }
                .tw-sp-btn-secondary {
                    background: rgba(51, 65, 85, 0.85);
                    color: #f8fafc;
                    box-shadow: none;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }
                .tw-sp-btn-secondary:hover { background: rgba(71, 85, 105, 0.95); }
                .tw-sp-btn-success {
                    background: linear-gradient(135deg, #22c55e, #15803d);
                    color: #ffffff;
                    box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
                }

                .tw-sp-strategy-box {
                    background: rgba(30, 41, 59, 0.55);
                    border: 1px dashed rgba(240, 168, 96, 0.35);
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

                .tw-sp-deck-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 4px;
                    font-size: 11px;
                }
                .tw-sp-deck-pill {
                    background: rgba(15, 23, 42, 0.65);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 4px;
                    border-radius: 4px;
                    text-align: center;
                }

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
                    background: rgba(30, 41, 59, 0.45);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: 0.15s;
                }
                .tw-sp-hand-row:hover {
                    background: rgba(240, 168, 96, 0.18);
                    border-color: rgba(240, 168, 96, 0.35);
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
                    <button class="tw-sp-btn-icon" id="twSpBtnRefresh" title="Atualizar / Forçar Leitura">🔄</button>
                    <button class="tw-sp-btn-icon" id="twSpBtnMin" title="Minimizar">_</button>
                    <button class="tw-sp-btn-icon" id="twSpBtnClose" title="Fechar">✕</button>
                </div>
            </div>

            <div class="tw-sp-body" id="twSpBody">
                <div id="twSpContent">
                    <div style="text-align: center; padding: 20px; color: #94a3b8;">
                        Carregando cartas e analisando tabuleiro...
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(box);

        makeDraggable(box, document.getElementById('twSpHeader'));

        document.getElementById('twSpBtnClose').addEventListener('click', () => {
            if (pollInterval) clearInterval(pollInterval);
            box.remove();
        });
        document.getElementById('twSpBtnRefresh').addEventListener('click', () => {
            renderUI(true);
            if (window.UI) window.UI.InfoMessage('🔄 Tabuleiro atualizado!', 1200);
        });
        document.getElementById('twSpBtnMin').addEventListener('click', () => {
            prefs.minimized = !prefs.minimized;
            savePrefs();
            updateMinimizedState();
        });

        window.twSpForceRender = () => renderUI(true);
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
    let lastRenderFingerprint = '';

    function renderUI(force = false) {
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

        // Caso 2: Loja de Bandeiras (entre batalhas)
        if (isFlagShopActive()) {
            const fs = getSiegePokerFlagShop();
            const shop = fs && fs.flag_shop ? fs.flag_shop : {};
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
        const state = getGameState();
        const handCards = state.handCards;

        // Se ainda não há cartas detectadas no DOM nem em memória
        if (!handCards || handCards.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 18px; color: #94a3b8;">
                    <div style="font-size: 26px; margin-bottom: 6px;">⏳</div>
                    <div style="font-weight: 700; color: #f0a860; margin-bottom: 4px;">Aguardando distribuição de cartas pelo jogo...</div>
                    <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 12px;">
                        Assim que a rodada carregar, o assistente detectará as 8 cartas automaticamente.
                    </div>
                    <button class="tw-sp-btn tw-sp-btn-secondary" id="twSpBtnForceDetect" style="margin: 0 auto; padding: 6px 12px;">
                        🔄 Detectar Agora
                    </button>
                </div>
            `;
            document.getElementById('twSpBtnForceDetect')?.addEventListener('click', () => renderUI(true));
            return;
        }

        // Evita re-desenhar o DOM se nada mudou
        const fingerprint = handCards.map(c => `${c.suit}_${c.rank}`).join(',') +
            `|hp:${state.castle.defense_power}|att:${state.availableAttacks}|disc:${state.freeDiscards}|deck:${state.remainingDeck}`;
        if (!force && fingerprint === lastRenderFingerprint) {
            return;
        }
        lastRenderFingerprint = fingerprint;

        const castle = state.castle;
        const availableAttacks = state.availableAttacks;
        const freeDiscards = state.freeDiscards;
        const remainingDeck = state.remainingDeck;
        const deckCards = state.deckCards;

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
            <!-- Banner Piloto Automático Mãos Livres -->
            <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-weight: 800; font-size: 12px; color: ${prefs.autoPlay ? '#4ade80' : '#f87171'}; display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 14px;">${prefs.autoPlay ? '🟢' : '⏸️'}</span>
                        <span>${prefs.autoPlay ? 'PILOTO AUTOMÁTICO (Mãos Livres)' : 'PILOTO AUTOMÁTICO PAUSADO'}</span>
                    </div>
                    <div id="twSpAutoPilotStatusText" style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
                        ${autoPilotStatus}
                    </div>
                </div>
                <button id="twSpBtnToggleAutopilot" class="tw-sp-btn" style="padding: 5px 12px; font-size: 11px; font-weight: 700; background: ${prefs.autoPlay ? '#ef4444' : '#22c55e'}; color: #fff; width: auto; margin: 0;">
                    ${prefs.autoPlay ? '⏸️ Pausar' : '▶️ Retomar'}
                </button>
            </div>

            <!-- HUD Superior -->
            <div class="tw-sp-hud">
                <div class="tw-sp-hud-item">
                    <span class="tw-sp-hud-label">🏰 Castelo #${castle.number}</span>
                    <span class="tw-sp-hud-val gold">${castle.defense_power} <span style="font-size: 10px;">HP</span></span>
                </div>
                <div class="tw-sp-hud-item">
                    <span class="tw-sp-hud-label">⚔️ Ataques</span>
                    <span class="tw-sp-hud-val ${availableAttacks > 1 ? 'green' : 'red'}">${availableAttacks}/3</span>
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
        document.getElementById('twSpBtnToggleAutopilot')?.addEventListener('click', () => {
            prefs.autoPlay = !prefs.autoPlay;
            savePrefs();
            renderUI(true);
            if (prefs.autoPlay) {
                if (window.UI) window.UI.SuccessMessage('🟢 Piloto Automático ativado! Jogando por você...', 2000);
                runAutoPlayCycle();
            } else {
                if (window.UI) window.UI.InfoMessage('⏸️ Piloto Automático pausado. Modo manual ativo.', 1500);
            }
        });

        document.getElementById('twSpBtnSelectBest')?.addEventListener('click', () => {
            if (cachedHandAnalysis && cachedHandAnalysis.best) {
                const targetCards = prefs.fullFiveCardAttack ? cachedHandAnalysis.best.fullFiveCards : cachedHandAnalysis.best.contributing;
                selectCardsOnBoard(targetCards);
                if (window.UI) window.UI.SuccessMessage(`👑 ${cachedHandAnalysis.best.info.name} (+${cachedHandAnalysis.best.info.pts} pts) selecionada!`, 1800);
            }
        });

        document.getElementById('twSpBtnAttackBest')?.addEventListener('click', () => {
            if (cachedHandAnalysis && cachedHandAnalysis.best) {
                const targetCards = prefs.fullFiveCardAttack ? cachedHandAnalysis.best.fullFiveCards : cachedHandAnalysis.best.contributing;
                selectCardsOnBoard(targetCards);
                setTimeout(() => {
                    executeAttack();
                }, 150);
            }
        });

        document.getElementById('twSpBtnSelectDiscard')?.addEventListener('click', () => {
            if (cachedDiscardAnalysis && cachedDiscardAnalysis.discard) {
                selectCardsOnBoard(cachedDiscardAnalysis.discard);
                if (window.UI) window.UI.InfoMessage(`🎲 ${cachedDiscardAnalysis.discard.length} carta(s) para descarte selecionada(s)!`, 1800);
            }
        });

        document.getElementById('twSpBtnExecuteDiscard')?.addEventListener('click', () => {
            if (cachedDiscardAnalysis && cachedDiscardAnalysis.discard) {
                selectCardsOnBoard(cachedDiscardAnalysis.discard);
                setTimeout(() => {
                    executeDiscard();
                }, 150);
            }
        });

        document.querySelectorAll('.tw-sp-hand-row').forEach(row => {
            row.addEventListener('click', () => {
                const idx = parseInt(row.dataset.handIdx, 10);
                if (cachedHandAnalysis && cachedHandAnalysis.allHands[idx]) {
                    const chosen = cachedHandAnalysis.allHands[idx];
                    const targetCards = prefs.fullFiveCardAttack ? chosen.fullFiveCards : chosen.contributing;
                    selectCardsOnBoard(targetCards);
                    if (window.UI) window.UI.SuccessMessage(`${chosen.info.name} (+${chosen.info.pts} pts) selecionada!`, 1500);
                }
            });
        });

        document.getElementById('twSpToggleFiveCard')?.addEventListener('change', (e) => {
            prefs.fullFiveCardAttack = e.target.checked;
            savePrefs();
            renderUI(true);
        });

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
    // 🤖 CICLO DE AUTO-JOGAR INTELIGENTE (SMART AUTO-PLAY / MÃOS LIVRES)
    // =========================================================================

    let isAutoPlaying = false;
    let autoPilotStatus = '🟢 Analisando rodada...';

    function setAutoPilotStatus(msg) {
        autoPilotStatus = msg;
        const el = document.getElementById('twSpAutoPilotStatusText');
        if (el) el.textContent = msg;
    }

    async function runAutoPlayCycle() {
        if (!prefs.autoPlay || isAutoPlaying) return;
        isAutoPlaying = true;

        try {
            // Fase A: Fechar modais de vitória / recompensa / diálogo do jogo
            const rewardCloser = document.querySelector('#match_reward .popup_closer, #match_reward .btn-confirm-yes, .popup_box.match_reward .popup_closer, .siege-poker-modal .popup_closer, .popup_box .popup_closer');
            if (rewardCloser && rewardCloser.offsetParent !== null) {
                setAutoPilotStatus('🎁 Coletando recompensa do castelo...');
                await delay(700);
                rewardCloser.click();
                await delay(900);
                return;
            }

            // Fase B: Loja de Bandeiras (entre castelos) -> Avançar automaticamente para o próximo castelo
            if (isFlagShopActive()) {
                const startBattleBtn = document.getElementById('btn_start_battle');
                if (startBattleBtn && startBattleBtn.offsetParent !== null) {
                    setAutoPilotStatus('⚔️ Loja concluída. Iniciando próximo castelo...');
                    await delay(1000);
                    startBattleBtn.click();
                    return;
                }
            }

            // Fase C: Batalha em Andamento
            const state = getGameState();
            const handCards = state.handCards;

            if (handCards.length === 0) {
                setAutoPilotStatus('⏳ Aguardando distribuição de cartas...');
                return;
            }

            if (state.actionsDisabled) {
                setAutoPilotStatus('⏳ Aguardando animação do jogo finalizar...');
                return;
            }

            if (state.availableAttacks <= 0) {
                setAutoPilotStatus('⏸️ Sem ataques disponíveis nesta rodada.');
                return;
            }

            const castle = state.castle;
            const freeDiscards = state.freeDiscards;
            const handAnalysis = analyzeAllHands(handCards);
            const discardAnalysis = analyzeDiscardStrategy(handCards, state.deckCards);

            const best = handAnalysis.best;
            if (!best) return;

            // Decisão 1: Dano Letal (Derruba o castelo imediatamente)
            if (best.info.pts >= castle.defense_power) {
                setAutoPilotStatus(`👑 Dano letal (${best.info.pts} pts)! Atacando com ${best.info.name}...`);
                selectCardsOnBoard(prefs.fullFiveCardAttack ? best.fullFiveCards : best.contributing);
                await delay(450);
                executeAttack();
                return;
            }

            // Decisão 2: Mão Forte (Trinca, Straight, Flush, Full House, Quadra, etc. >= 100 pts) -> Ataca!
            if (best.info.pts >= 100) {
                setAutoPilotStatus(`⚔️ Mão forte! Atacando com ${best.info.name} (+${best.info.pts} pts)...`);
                selectCardsOnBoard(prefs.fullFiveCardAttack ? best.fullFiveCards : best.contributing);
                await delay(450);
                executeAttack();
                return;
            }

            // Decisão 3: Mão Fraca (< 100 pts) e TEM descartes grátis -> Descarta pelo maior EV!
            if (freeDiscards > 0 && discardAnalysis && discardAnalysis.discard.length > 0) {
                setAutoPilotStatus(`🎲 ${discardAnalysis.title} (${discardAnalysis.prob}). Descartando ${discardAnalysis.discard.length} cartas...`);
                selectCardsOnBoard(discardAnalysis.discard);
                await delay(450);
                const ok = executeDiscard();
                if (!ok) {
                    setAutoPilotStatus(`⚔️ Atacando com ${best.info.name} (+${best.info.pts} pts)...`);
                    selectCardsOnBoard(prefs.fullFiveCardAttack ? best.fullFiveCards : best.contributing);
                    await delay(400);
                    executeAttack();
                }
                return;
            }

            // Decisão 4: Sem descartes grátis -> Ataca com a melhor mão disponível
            setAutoPilotStatus(`⚔️ Sem descartes. Atacando com ${best.info.name} (+${best.info.pts} pts)...`);
            selectCardsOnBoard(prefs.fullFiveCardAttack ? best.fullFiveCards : best.contributing);
            await delay(450);
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
    // 📡 OBSERVADOR & POLLING CONTÍNUO
    // =========================================================================

    let pollInterval = null;

    function setupObserverAndPolling() {
        const targetNode = document.getElementById('hand_cards') || document.getElementById('contentContainer') || document.body;
        const observer = new MutationObserver(() => {
            renderUI();
            if (prefs.autoPlay && !isAutoPlaying) {
                setTimeout(runAutoPlayCycle, 500);
            }
        });

        observer.observe(targetNode, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-cost', 'style'] });

        // Polling ativo a cada 900ms para execução imediata e ágil
        pollInterval = setInterval(() => {
            renderUI();
            if (prefs.autoPlay && !isAutoPlaying) {
                runAutoPlayCycle();
            }
        }, 900);
    }

    // =========================================================================
    // 🚀 INICIALIZAÇÃO
    // =========================================================================

    createUI();
    renderUI(true);
    setupObserverAndPolling();

    if (prefs.autoPlay) {
        setTimeout(runAutoPlayCycle, 400);
    }

    if (window.UI && typeof window.UI.SuccessMessage === 'function') {
        window.UI.SuccessMessage('🏰 Piloto Automático Ativado! Jogando por você...', 2500);
    }

})();
