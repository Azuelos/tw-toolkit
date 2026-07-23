// ==UserScript==
// @name         TW Toolkit v4.1 — Tribal Wars
// @namespace    tw-toolkit
// @version      4.1.0
// @description  Toolkit COMPLETO para Tribal Wars: Command Sniper (ms), Buscador de Farms, Planejador de Ataques, Analisador de Incoming, HUD de Recursos, Auto Farm, Trem de Nobres e mais.
// @author       TW Toolkit
// @match        *://*.tribalwars.com.br/game.php*
// @match        *://*.tribalwars.net/game.php*
// @match        *://*.tribalwars.com/game.php*
// @match        *://*.tribos.com.pt/game.php*
// @icon         https://dsbr.innogamescdn.com/favicon.ico
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

/**
 * ============================================================================
 *  ⚔️  TW TOOLKIT v4.1 — Tribal Wars (Qualquer Mundo)
 * ============================================================================
 *  Conjunto de ferramentas para Tribal Wars
 *  Compatível com: BR, EN, PT e outros mercados
 *
 *  🔗 INSTALAÇÃO COM TAMPERMONKEY (persistência entre telas):
 *  1. Instale a extensão Tampermonkey no Chrome/Firefox/Edge
 *  2. Clique no ícone do Tampermonkey → "Criar novo script"
 *  3. Cole TODO este arquivo e salve (Ctrl+S)
 *  4. O toolkit carregará automaticamente em TODA página do TW!
 *
 *  🔗 USO MANUAL (sem Tampermonkey):
 *  1. Cole no Console do navegador (F12 → Console) em qualquer tela do TW
 *  2. OU adicione na Quickbar: javascript: (cole o script); void(0);
 *
 *  ⚠️ Este script NÃO automatiza ações. É uma ferramenta de APOIO à decisão.
 *  Todas as ações ainda requerem cliques manuais do jogador.
 * ============================================================================
 */

(function() {
    'use strict';

    // Evita dupla execução na mesma página (mas permite se a anterior falhou)
    if (window.__TW_TOOLKIT_LOADED__ && document.getElementById('tw-toolkit-toggle')) {
        console.warn('[TW Toolkit] Já carregado nesta página. Recarregue (F5) para re-executar.');
        return;
    }
    window.__TW_TOOLKIT_LOADED__ = true;
    console.log('[TW Toolkit] IIFE iniciando...');

    // ═══════════════════════════════════════════════════
    // 📦 CONFIGURAÇÃO E DADOS DO JOGO
    // ═══════════════════════════════════════════════════
    
    // ═══════════════════════════════════════════════════
    // 💾 PERSISTÊNCIA DE ESTADO (entre navegações)
    // ═══════════════════════════════════════════════════
    
    const State = {
        KEY: 'tw_toolkit_state',
        
        save(updates) {
            const current = this.load();
            const merged = { ...current, ...updates };
            try { localStorage.setItem(this.KEY, JSON.stringify(merged)); } catch(e) {}
        },
        
        load() {
            try {
                return JSON.parse(localStorage.getItem(this.KEY) || '{}');
            } catch(e) { return {}; }
        },
        
        get isOpen() { return this.load().isOpen || false; },
        get activeTab() { return this.load().activeTab || 'dashboard'; },
        get position() { return this.load().position || null; },
        
        saveOpen(isOpen) { this.save({ isOpen }); },
        saveTab(activeTab) { this.save({ activeTab }); },
        savePosition(left, top) { this.save({ position: { left, top } }); },
        
        // Dados persistentes do usuário
        NOTES_KEY: 'tw_toolkit_notes',
        TARGETS_KEY: 'tw_toolkit_targets',
        TROOP_CALC_KEY: 'tw_toolkit_troop_calc',
        
        saveNotes(text) { try { localStorage.setItem(this.NOTES_KEY, text); } catch(e) {} },
        loadNotes() { return localStorage.getItem(this.NOTES_KEY) || ''; },
        
        saveTargets(targets) { try { localStorage.setItem(this.TARGETS_KEY, JSON.stringify(targets)); } catch(e) {} },
        loadTargets() { try { return JSON.parse(localStorage.getItem(this.TARGETS_KEY) || '[]'); } catch(e) { return []; } },
        
        saveTroopCalc(troops) { try { localStorage.setItem(this.TROOP_CALC_KEY, JSON.stringify(troops)); } catch(e) {} },
        loadTroopCalc() { try { return JSON.parse(localStorage.getItem(this.TROOP_CALC_KEY) || '{}'); } catch(e) { return {}; } }
    };

    const TW = {
        version: '4.1.0',
        name: 'TW Toolkit',
        
        // Helper para acessar o contexto real da página (necessário para Tampermonkey)
        _getPageWindow() {
            if (typeof unsafeWindow !== 'undefined') return unsafeWindow;
            return window;
        },
        
        // Dados dinâmicos do jogo (lidos do game_data global — compatível com sandbox)
        get gameData() { 
            const w = this._getPageWindow();
            if (w.game_data) return w.game_data;
            if (typeof game_data !== 'undefined') return game_data;
            return null;
        },
        get village() { return this.gameData?.village || {}; },
        get player() { return this.gameData?.player || {}; },
        get world() { return this.gameData?.world || ''; },
        get screen() { return this.gameData?.screen || ''; },
        get csrf() { return this.gameData?.csrf || ''; },
        get villageId() { return this.village?.id || 0; },
        get linkBase() { return this.gameData?.link_base_pure || ''; },
        
        // Detecção de Premium e Features
        get isPremium() { 
            const w = this._getPageWindow();
            return (w.premium === true) || this.gameData?.features?.Premium?.active || false; 
        },
        get hasFarmAssistant() { const f = this.gameData?.features?.FarmAssistent; return f ? f.active : false; },
        get canHaveFarmAssistant() { const f = this.gameData?.features?.FarmAssistent; return f ? f.possible : false; },
        get hasAccountManager() { const f = this.gameData?.features?.AccountManager; return f ? f.active : false; },
        
        // Constantes de edifícios
        buildings: {
            main: { name: 'Edifício Principal', maxLevel: 30 },
            barracks: { name: 'Quartel', maxLevel: 25 },
            stable: { name: 'Estábulo', maxLevel: 20 },
            garage: { name: 'Oficina', maxLevel: 15 },
            watchtower: { name: 'Torre de Vigia', maxLevel: 20 },
            snob: { name: 'Academia', maxLevel: 3 },
            smith: { name: 'Ferreiro', maxLevel: 20 },
            place: { name: 'Praça', maxLevel: 1 },
            statue: { name: 'Estátua', maxLevel: 1 },
            market: { name: 'Mercado', maxLevel: 25 },
            wood: { name: 'Bosque', maxLevel: 30 },
            stone: { name: 'Poço de Argila', maxLevel: 30 },
            iron: { name: 'Mina de Ferro', maxLevel: 30 },
            farm: { name: 'Fazenda', maxLevel: 30 },
            storage: { name: 'Armazém', maxLevel: 30 },
            hide: { name: 'Esconderijo', maxLevel: 10 },
            wall: { name: 'Muralha', maxLevel: 20 }
        },
        
        // Dados de unidades
        units: {
            spear: { name: 'Lanceiro', speed: 18, attack: 10, defGeneral: 15, defCav: 45, defArcher: 20, carry: 25, pop: 1, wood: 50, stone: 30, iron: 10 },
            sword: { name: 'Espadachim', speed: 22, attack: 25, defGeneral: 50, defCav: 15, defArcher: 40, carry: 15, pop: 1, wood: 30, stone: 30, iron: 70 },
            axe: { name: 'Bárbaro', speed: 18, attack: 40, defGeneral: 10, defCav: 5, defArcher: 10, carry: 10, pop: 1, wood: 60, stone: 30, iron: 40 },
            spy: { name: 'Explorador', speed: 9, attack: 0, defGeneral: 2, defCav: 1, defArcher: 2, carry: 0, pop: 2, wood: 50, stone: 50, iron: 20 },
            light: { name: 'Cav. Leve', speed: 10, attack: 130, defGeneral: 30, defCav: 40, defArcher: 30, carry: 80, pop: 4, wood: 125, stone: 100, iron: 250 },
            heavy: { name: 'Cav. Pesada', speed: 11, attack: 150, defGeneral: 200, defCav: 80, defArcher: 180, carry: 50, pop: 6, wood: 200, stone: 150, iron: 600 },
            ram: { name: 'Aríete', speed: 30, attack: 2, defGeneral: 20, defCav: 50, defArcher: 20, carry: 0, pop: 5, wood: 300, stone: 200, iron: 200 },
            catapult: { name: 'Catapulta', speed: 30, attack: 100, defGeneral: 100, defCav: 50, defArcher: 100, carry: 0, pop: 8, wood: 320, stone: 400, iron: 100 },
            knight: { name: 'Paladino', speed: 10, attack: 150, defGeneral: 250, defCav: 400, defArcher: 150, carry: 100, pop: 10, wood: 20, stone: 20, iron: 40 },
            snob: { name: 'Nobre', speed: 35, attack: 30, defGeneral: 100, defCav: 50, defArcher: 100, carry: 0, pop: 100, wood: 40000, stone: 50000, iron: 50000 }
        }
    };

    // ═══════════════════════════════════════════════════
    // 🎨 INTERFACE VISUAL (UI)
    // ═══════════════════════════════════════════════════
    
    const UI = {
        styles: `
            #tw-toolkit-overlay {
                display: none !important;
            }
            #tw-toolkit {
                position: fixed;
                top: 0;
                left: -440px;
                width: 420px;
                height: 100vh;
                background: linear-gradient(180deg, #1a0a00 0%, #2d1810 50%, #1a0a00 100%);
                border-right: 3px solid #c8a050;
                z-index: 99999;
                font-family: 'Segoe UI', Verdana, sans-serif;
                color: #f0e0c0;
                overflow: hidden;
                box-shadow: 5px 0 30px rgba(0,0,0,0.6);
                transition: left 0.3s ease;
                display: flex;
                flex-direction: column;
            }
            #tw-toolkit.tw-open {
                left: 0;
            }
            #tw-toolkit-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 14px;
                background: linear-gradient(90deg, #3a2010, #5a3a1a, #3a2010);
                border-bottom: 2px solid #c8a050;
                cursor: default;
                flex-shrink: 0;
            }
            #tw-toolkit-header h2 {
                margin: 0;
                font-size: 14px;
                color: #ffd700;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
            #tw-toolkit-close {
                background: linear-gradient(180deg, #8b0000, #5a0000);
                border: 1px solid #ff4444;
                color: #fff;
                width: 28px; height: 28px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.2s;
            }
            #tw-toolkit-close:hover {
                background: linear-gradient(180deg, #cc0000, #8b0000);
                transform: scale(1.1);
            }
            #tw-toolkit-tabs {
                display: flex;
                flex-wrap: wrap;
                gap: 2px;
                padding: 6px;
                background: rgba(0,0,0,0.3);
                border-bottom: 1px solid #3a2010;
                flex-shrink: 0;
            }
            .tw-tab {
                padding: 4px 8px;
                background: rgba(90,58,26,0.5);
                border: 1px solid #3a2010;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
                color: #a08060;
                transition: all 0.2s;
                white-space: nowrap;
            }
            .tw-tab:hover { color: #ffd700; background: rgba(255,215,0,0.05); }
            .tw-tab.active {
                color: #ffd700;
                border-bottom-color: #ffd700;
                background: rgba(255,215,0,0.08);
            }
            #tw-toolkit-body {
                padding: 12px;
                overflow-y: auto;
                flex: 1;
                scrollbar-width: thin;
                scrollbar-color: #5a3a1a #1a0a00;
            }
            .tw-panel { display: none; }
            .tw-panel.active { display: block; }
            
            /* Cards e Grids */
            .tw-grid { display: grid; gap: 12px; }
            .tw-grid-2 { grid-template-columns: 1fr 1fr; }
            .tw-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
            .tw-grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
            .tw-card {
                background: rgba(90,58,26,0.4);
                border: 1px solid #5a3a1a;
                border-radius: 8px;
                padding: 14px;
                transition: all 0.2s;
            }
            .tw-card:hover {
                border-color: #c8a050;
                box-shadow: 0 0 15px rgba(200,160,80,0.15);
            }
            .tw-card h4 {
                margin: 0 0 8px 0;
                color: #ffd700;
                font-size: 13px;
            }
            .tw-card .value {
                font-size: 22px;
                font-weight: bold;
                color: #fff;
            }
            .tw-card .sub { color: #a08060; font-size: 11px; margin-top: 4px; }
            
            /* Tabelas */
            .tw-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            .tw-table th {
                background: #3a2010;
                color: #ffd700;
                padding: 8px 10px;
                text-align: left;
                font-weight: 600;
                border-bottom: 2px solid #c8a050;
            }
            .tw-table td {
                padding: 6px 10px;
                border-bottom: 1px solid rgba(90,58,26,0.5);
            }
            .tw-table tr:hover td { background: rgba(200,160,80,0.08); }
            
            /* Botões */
            .tw-btn {
                background: linear-gradient(180deg, #5a8a2a, #3a6a1a);
                border: 1px solid #7ab03a;
                color: #fff;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s;
            }
            .tw-btn:hover {
                background: linear-gradient(180deg, #6a9a3a, #4a7a2a);
                transform: translateY(-1px);
                box-shadow: 0 3px 10px rgba(90,160,50,0.3);
            }
            .tw-btn-gold {
                background: linear-gradient(180deg, #c8a050, #8a6a30);
                border-color: #ffd700;
            }
            .tw-btn-gold:hover {
                background: linear-gradient(180deg, #d8b060, #9a7a40);
            }
            .tw-btn-danger {
                background: linear-gradient(180deg, #8b0000, #5a0000);
                border-color: #ff4444;
            }
            .tw-btn-sm { padding: 4px 10px; font-size: 11px; }
            
            /* Inputs */
            .tw-input {
                background: #1a0a00;
                border: 1px solid #5a3a1a;
                color: #f0e0c0;
                padding: 8px 12px;
                border-radius: 5px;
                font-size: 12px;
                width: 100%;
                box-sizing: border-box;
            }
            .tw-input:focus {
                border-color: #c8a050;
                outline: none;
                box-shadow: 0 0 8px rgba(200,160,80,0.2);
            }
            .tw-select {
                background: #1a0a00;
                border: 1px solid #5a3a1a;
                color: #f0e0c0;
                padding: 6px 10px;
                border-radius: 5px;
                font-size: 12px;
            }
            
            /* Progress bars */
            .tw-progress {
                background: #1a0a00;
                border-radius: 10px;
                height: 12px;
                overflow: hidden;
                border: 1px solid #3a2010;
            }
            .tw-progress-bar {
                height: 100%;
                border-radius: 10px;
                transition: width 0.5s ease;
            }
            .tw-progress-wood { background: linear-gradient(90deg, #4a8020, #6ab030); }
            .tw-progress-stone { background: linear-gradient(90deg, #8a6030, #b08040); }
            .tw-progress-iron { background: linear-gradient(90deg, #606060, #909090); }
            .tw-progress-pop { background: linear-gradient(90deg, #c04040, #e06060); }
            
            /* Badges */
            .tw-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: bold;
            }
            .tw-badge-green { background: #2a5a1a; color: #7ab03a; }
            .tw-badge-yellow { background: #5a4a1a; color: #ffd700; }
            .tw-badge-red { background: #5a1a1a; color: #ff4444; }
            .tw-badge-blue { background: #1a3a5a; color: #4488ff; }
            
            /* Scrollbar */
            #tw-toolkit-body::-webkit-scrollbar { width: 8px; }
            #tw-toolkit-body::-webkit-scrollbar-track { background: #1a0a00; }
            #tw-toolkit-body::-webkit-scrollbar-thumb { background: #5a3a1a; border-radius: 4px; }
            #tw-toolkit-body::-webkit-scrollbar-thumb:hover { background: #c8a050; }
            
            /* Textarea */
            .tw-textarea {
                background: #1a0a00;
                border: 1px solid #5a3a1a;
                color: #f0e0c0;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                font-family: 'Consolas', monospace;
                width: 100%;
                box-sizing: border-box;
                resize: vertical;
            }
            
            /* Animações */
            @keyframes tw-fadeIn {
                from { opacity: 0; transform: translate(-50%, -48%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
            #tw-toolkit.show {
                animation: tw-fadeIn 0.3s ease forwards;
            }
            
            /* Separator */
            .tw-separator {
                border: none;
                border-top: 1px solid #3a2010;
                margin: 16px 0;
            }
            /* Pulse animation */
            @keyframes tw-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            .tw-pulse { animation: tw-pulse 2s infinite; }
            @keyframes tw-glow {
                0%, 100% { box-shadow: 0 0 5px rgba(255,215,0,0.3); }
                50% { box-shadow: 0 0 20px rgba(255,215,0,0.6); }
            }
            .tw-glow { animation: tw-glow 2s infinite; }
            
            /* Status dots */
            .tw-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; }
            .tw-dot-green { background:#7ab03a; }
            .tw-dot-yellow { background:#ffd700; }
            .tw-dot-red { background:#ff4444; }
            .tw-dot-blue { background:#4488ff; }
            
            /* Resource HUD */
            #tw-resource-hud {
                position: fixed;
                top: 5px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(180deg, rgba(26,10,0,0.95), rgba(45,24,16,0.95));
                border: 1px solid #5a3a1a;
                border-radius: 0 0 10px 10px;
                padding: 4px 20px;
                z-index: 99990;
                font-family: 'Segoe UI', Verdana, sans-serif;
                font-size: 12px;
                color: #f0e0c0;
                display: flex;
                gap: 16px;
                align-items: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            }
            #tw-resource-hud .hud-item { display:flex; align-items:center; gap:4px; }
            #tw-resource-hud .hud-value { font-weight:bold; color:#fff; }
            #tw-resource-hud .hud-warn { color:#ff4444; }
            #tw-resource-hud .hud-ok { color:#7ab03a; }
            #tw-resource-hud .hud-close {
                cursor:pointer; color:#a08060; font-size:16px; margin-left:8px;
                transition: color 0.2s;
            }
            #tw-resource-hud .hud-close:hover { color:#ff4444; }
            
            .tw-label {
                color: #a08060;
                font-size: 11px;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        `,
        
        inject() {
            // Remove instância anterior se existir
            const existing = document.getElementById('tw-toolkit');
            if (existing) existing.remove();
            const existingOverlay = document.getElementById('tw-toolkit-overlay');
            if (existingOverlay) existingOverlay.remove();
            const existingStyle = document.getElementById('tw-toolkit-style');
            if (existingStyle) existingStyle.remove();
            
            // Injeta CSS
            const style = document.createElement('style');
            style.id = 'tw-toolkit-style';
            style.textContent = this.styles;
            document.head.appendChild(style);
            
            // Overlay
            const overlay = document.createElement('div');
            overlay.id = 'tw-toolkit-overlay';
            overlay.onclick = () => this.toggle(false);
            document.body.appendChild(overlay);
            
            // Container principal
            const container = document.createElement('div');
            container.id = 'tw-toolkit';
            container.innerHTML = this.buildHTML();
            document.body.appendChild(container);
            
            // Event listeners
            this.bindEvents();
            
            // Abre
            this.toggle(true);
        },
        
        buildHTML() {
            const tabs = [
                { id: 'dashboard', icon: '📊', label: 'Painel' },
                { id: 'farmfinder', icon: '🏴\u200d☠️', label: 'Buscar Farms' },
                { id: 'planner', icon: '🗺️', label: 'Planejador' },
                { id: 'incomings', icon: '🚨', label: 'Chegadas' },
                { id: 'buildings', icon: '🏗️', label: 'Edifícios' },
                { id: 'troops', icon: '⚔️', label: 'Tropas' },
                { id: 'attack', icon: '🎯', label: 'Calculadora' },
                { id: 'coords', icon: '📍', label: 'Coords' },
                { id: 'backtime', icon: '⏱️', label: 'Retorno' },
                { id: 'notes', icon: '📝', label: 'Notas' },
                { id: 'export', icon: '💾', label: 'Salvar' },
                { id: 'mapEnhancer', icon: '🗺️', label: 'Mapa' },
                { id: 'farmScheduler', icon: '🌾', label: 'Auto Farm' },
                { id: 'buildQueue', icon: '🏗️', label: 'Auto Build' },
                { id: 'nobleTrain', icon: '🏰', label: 'Trem Nobre' },
                { id: 'commandSniper', icon: '🎯', label: 'Sniper MS' }
            ];
            
            const tabsHTML = tabs.map((t, i) => 
                `<div class="tw-tab ${i === 0 ? 'active' : ''}" data-panel="${t.id}">${t.icon} ${t.label}</div>`
            ).join('');
            
            return `
                <div id="tw-toolkit-header">
                    <h2>⚔️ ${TW.name} v${TW.version}</h2>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="color:#a08060;font-size:11px;">👤 ${TW.player.name || 'N/A'} | 🌍 ${TW.world} | 🏰 ${TW.village.name || ''} (${TW.village.x}|${TW.village.y}) ${TW.isPremium ? '<span style="color:#ffd700" title="Premium Ativo">⭐ P</span>' : '<span style="color:#888" title="Sem Premium">🔓</span>'}</span>
                        <button id="tw-toolkit-close">✕</button>
                    </div>
                </div>
                <div id="tw-toolkit-tabs">${tabsHTML}</div>
                <div id="tw-toolkit-body">
                    ${Panels.dashboard()}
                    ${Panels.farmFinder()}
                    ${Panels.attackPlanner()}
                    ${Panels.incomings()}
                    ${Panels.buildings()}
                    ${Panels.troops()}
                    ${Panels.attack()}
                    ${Panels.coords()}
                    ${Panels.backtime()}
                    ${Panels.notes()}
                    ${Panels.exportData()}
                    <div class="tw-panel" id="tw-panel-mapEnhancer">${MapEnhancer.buildHTML()}</div>
                    <div class="tw-panel" id="tw-panel-farmScheduler">${FarmScheduler.buildHTML()}</div>
                    <div class="tw-panel" id="tw-panel-buildQueue">${BuildQueue.buildHTML()}</div>
                    <div class="tw-panel" id="tw-panel-nobleTrain">${NobleTrain.buildHTML()}</div>
                    <div class="tw-panel" id="tw-panel-commandSniper">${CommandSniper.buildHTML()}</div>
                </div>
            `;
        },
        
        bindEvents() {
            // Fechar
            document.getElementById('tw-toolkit-close').onclick = () => this.toggle(false);
            
            // Tabs — com persistência
            document.querySelectorAll('.tw-tab').forEach(tab => {
                tab.onclick = () => {
                    document.querySelectorAll('.tw-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tw-panel').forEach(p => p.classList.remove('active'));
                    tab.classList.add('active');
                    const panel = document.getElementById(`tw-panel-${tab.dataset.panel}`);
                    if (panel) panel.classList.add('active');
                    // Salva aba ativa
                    State.saveTab(tab.dataset.panel);
                };
            });
            
            // Restaura aba ativa
            const savedTab = State.activeTab;
            if (savedTab && savedTab !== 'dashboard') {
                const tabEl = document.querySelector(`.tw-tab[data-panel="${savedTab}"]`);
                if (tabEl) tabEl.click();
            }
            
            
            // Tecla ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.toggle(false);
            });
            
            // Handler para botões "Evoluir" (delegação de evento)
            document.addEventListener('click', async (e) => {
                const btn = e.target.closest('.tw-upgrade-building');
                if (!btn) return;
                
                const building = btn.dataset.building;
                if (!building) return;
                
                btn.disabled = true;
                btn.textContent = '⏳...';
                
                try {
                    const vid = TW.villageId;
                    const h = typeof game_data !== 'undefined' ? game_data.csrf : TW.csrf;
                    
                    // Busca a página principal para pegar o link de upgrade atualizado
                    const resp = await fetch(`/game.php?village=${vid}&screen=main`, { credentials: 'same-origin' });
                    const html = await resp.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Busca o link de upgrade para este edifício
                    let upgradeUrl = null;
                    doc.querySelectorAll('a[href]').forEach(link => {
                        const href = link.getAttribute('href');
                        if (href && href.includes('action=upgrade_building') && href.includes(`id=${building}`)) {
                            upgradeUrl = href;
                        }
                    });
                    
                    if (!upgradeUrl) {
                        // Tenta URL direta
                        upgradeUrl = `/game.php?village=${vid}&screen=main&action=upgrade_building&id=${building}&type=main&h=${h}`;
                    }
                    
                    upgradeUrl = upgradeUrl.replace(/&amp;/g, '&');
                    if (!upgradeUrl.startsWith('/') && !upgradeUrl.startsWith('http')) upgradeUrl = '/' + upgradeUrl;
                    
                    const buildResp = await fetch(upgradeUrl, { credentials: 'same-origin', redirect: 'follow' });
                    
                    if (buildResp.ok) {
                        btn.textContent = '✅';
                        btn.style.background = 'linear-gradient(180deg,#006600,#004400)';
                        UI.showFeedback(`✅ ${TW.buildings[building]?.name || building} mandada construir!`);
                        
                        // Atualiza o nível no TW local após 2s
                        setTimeout(() => { location.reload(); }, 2000);
                    } else {
                        btn.textContent = '❌';
                        UI.showFeedback(`❌ Erro ao construir ${building}: HTTP ${buildResp.status}`);
                        setTimeout(() => { btn.textContent = 'Evoluir'; btn.disabled = false; }, 2000);
                    }
                } catch (err) {
                    btn.textContent = '❌';
                    UI.showFeedback(`❌ Erro: ${err.message}`);
                    setTimeout(() => { btn.textContent = 'Evoluir'; btn.disabled = false; }, 2000);
                }
            });
        },
        

        
        toggle(show) {
            const el = document.getElementById('tw-toolkit');
            const toggleBtn = document.getElementById('tw-toolkit-toggle');
            if (show) {
                el.classList.add('tw-open');
                if (toggleBtn) toggleBtn.classList.add('active');
            } else {
                el.classList.remove('tw-open');
                if (toggleBtn) toggleBtn.classList.remove('active');
            }
            State.saveOpen(show);
        },
        
        showFeedback(msg) {
            const toast = document.createElement('div');
            toast.textContent = msg;
            toast.style.cssText = 'position:fixed;bottom:80px;left:20px;background:linear-gradient(135deg,#3a2010,#5a3a1a);color:#ffd700;padding:10px 18px;border-radius:8px;border:1px solid #c8a050;font-size:12px;z-index:999999;box-shadow:0 4px 15px rgba(0,0,0,0.5);animation:fadeInUp 0.3s ease;font-family:"Segoe UI",Verdana,sans-serif';
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; }, 2000);
            setTimeout(() => toast.remove(), 2500);
        },
        
        // Botão flutuante sempre visível na página
        injectFloatingButton() {
            const existing = document.getElementById('tw-toolkit-toggle');
            if (existing) existing.remove();
            
            const btn = document.createElement('div');
            btn.id = 'tw-toolkit-toggle';
            btn.innerHTML = '⚔️';
            btn.title = 'Abrir/Fechar TW Toolkit';
            btn.onclick = () => {
                const el = document.getElementById('tw-toolkit');
                const isOpen = el && el.classList.contains('tw-open');
                this.toggle(!isOpen);
            };
            
            const style = document.createElement('style');
            style.id = 'tw-toolkit-toggle-style';
            style.textContent = `
                #tw-toolkit-toggle {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #5a3a1a, #3a2010);
                    border: 2px solid #c8a050;
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 99997;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 20px rgba(200,160,80,0.3);
                    transition: all 0.3s ease;
                    user-select: none;
                }
                #tw-toolkit-toggle:hover {
                    transform: scale(1.15) rotate(15deg);
                    box-shadow: 0 6px 25px rgba(0,0,0,0.6), 0 0 30px rgba(200,160,80,0.5);
                    border-color: #ffd700;
                }
                #tw-toolkit-toggle.active {
                    background: linear-gradient(135deg, #8a6a3a, #5a3a1a);
                    border-color: #ffd700;
                    box-shadow: 0 0 25px rgba(255,215,0,0.4);
                }
                #tw-toolkit-toggle::after {
                    content: 'Toolkit';
                    position: absolute;
                    bottom: -22px;
                    font-size: 9px;
                    color: #c8a050;
                    font-weight: bold;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(btn);
        }
    };

    // ═══════════════════════════════════════════════════
    // 🧮 MÓDULO DE CÁLCULOS
    // ═══════════════════════════════════════════════════
    
    const Calc = {
        // Calcula distância entre duas coordenadas
        distance(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        },
        
        // Tempo de viagem em segundos
        travelTime(x1, y1, x2, y2, unitSpeed) {
            const dist = this.distance(x1, y1, x2, y2);
            return Math.round(dist * unitSpeed * 60);
        },
        
        // Formata segundos em HH:MM:SS
        formatTime(seconds) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        },
        
        // Tempo até encher armazém
        timeToFull(current, max, prodPerHour) {
            if (prodPerHour <= 0) return Infinity;
            const remaining = max - current;
            return (remaining / prodPerHour) * 3600; // em segundos
        },
        
        // Capacidade de saque de um exército
        carryCapacity(troops) {
            let total = 0;
            for (const [unit, count] of Object.entries(troops)) {
                if (TW.units[unit]) {
                    total += TW.units[unit].carry * count;
                }
            }
            return total;
        },
        
        // Poder de ataque
        attackPower(troops) {
            let total = 0;
            for (const [unit, count] of Object.entries(troops)) {
                if (TW.units[unit]) {
                    total += TW.units[unit].attack * count;
                }
            }
            return total;
        },
        
        // Custo total de tropas
        troopCost(troops) {
            let wood = 0, stone = 0, iron = 0;
            for (const [unit, count] of Object.entries(troops)) {
                if (TW.units[unit]) {
                    wood += TW.units[unit].wood * count;
                    stone += TW.units[unit].stone * count;
                    iron += TW.units[unit].iron * count;
                }
            }
            return { wood, stone, iron, total: wood + stone + iron };
        },
        
        // População usada
        troopPop(troops) {
            let total = 0;
            for (const [unit, count] of Object.entries(troops)) {
                if (TW.units[unit]) {
                    total += TW.units[unit].pop * count;
                }
            }
            return total;
        },
        
        // Parsear coordenadas de texto (ex: "500|500 501|501")
        parseCoords(text) {
            const regex = /(\d{1,3})\|(\d{1,3})/g;
            const coords = [];
            let match;
            while ((match = regex.exec(text)) !== null) {
                coords.push({ x: parseInt(match[1]), y: parseInt(match[2]) });
            }
            return coords;
        }
    };

    // ═══════════════════════════════════════════════════
    // 📊 PAINÉIS DO TOOLKIT
    // ═══════════════════════════════════════════════════
    
    const Panels = {
        
        // ─── DASHBOARD ──────────────────────────────────
        dashboard() {
            const v = TW.village;
            const p = TW.player;
            
            const woodPct = v.storage_max ? Math.round((v.wood / v.storage_max) * 100) : 0;
            const stonePct = v.storage_max ? Math.round((v.stone / v.storage_max) * 100) : 0;
            const ironPct = v.storage_max ? Math.round((v.iron / v.storage_max) * 100) : 0;
            const popPct = v.pop_max ? Math.round((v.pop / v.pop_max) * 100) : 0;
            const popFree = (v.pop_max || 0) - (v.pop || 0);
            
            const woodProd = Math.round((v.wood_prod || 0) * 3600);
            const stoneProd = Math.round((v.stone_prod || 0) * 3600);
            const ironProd = Math.round((v.iron_prod || 0) * 3600);
            
            const woodFull = Calc.formatTime(Calc.timeToFull(v.wood || 0, v.storage_max || 0, woodProd));
            const stoneFull = Calc.formatTime(Calc.timeToFull(v.stone || 0, v.storage_max || 0, stoneProd));
            const ironFull = Calc.formatTime(Calc.timeToFull(v.iron || 0, v.storage_max || 0, ironProd));
            
            const getColor = (pct) => pct > 90 ? 'tw-badge-red' : pct > 70 ? 'tw-badge-yellow' : 'tw-badge-green';
            
            return `
            <div id="tw-panel-dashboard" class="tw-panel active">
                <div class="tw-grid tw-grid-4" style="margin-bottom:16px;">
                    <div class="tw-card">
                        <h4>🏰 Aldeia</h4>
                        <div class="value">${v.name || 'N/A'}</div>
                        <div class="sub">(${v.x || '?'}|${v.y || '?'}) — ${v.points || 0} pts</div>
                    </div>
                    <div class="tw-card">
                        <h4>👤 Jogador</h4>
                        <div class="value">${p.name || 'N/A'}</div>
                        <div class="sub">Rank #${p.rank || '?'} | ${p.points || 0} pts</div>
                    </div>
                    <div class="tw-card">
                        <h4>🏘️ Aldeias</h4>
                        <div class="value">${p.villages || 1}</div>
                        <div class="sub">Ataques: ${p.incomings || 0} | PP: ${p.pp || 0} ${TW.isPremium ? '<span class="tw-badge tw-badge-yellow">Premium</span>' : ''}</div>
                    </div>
                    <div class="tw-card">
                        <h4>👥 População</h4>
                        <div class="value">${v.pop || 0}/${v.pop_max || 0}</div>
                        <div class="sub">Livre: ${popFree} <span class="${getColor(popPct)}">${popPct}%</span></div>
                    </div>
                </div>
                
                <h3 style="color:#ffd700;margin:0 0 12px 0;font-size:14px;">📦 Recursos</h3>
                <div class="tw-grid tw-grid-3" style="margin-bottom:16px;">
                    <div class="tw-card">
                        <h4>🪵 Madeira</h4>
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span class="value" style="font-size:18px;">${v.wood || 0}</span>
                            <span class="${getColor(woodPct)}">${woodPct}%</span>
                        </div>
                        <div class="tw-progress" style="margin:6px 0;"><div class="tw-progress-bar tw-progress-wood" style="width:${woodPct}%"></div></div>
                        <div class="sub">+${woodProd}/h | Enche em: ${woodFull}</div>
                    </div>
                    <div class="tw-card">
                        <h4>🧱 Argila</h4>
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span class="value" style="font-size:18px;">${v.stone || 0}</span>
                            <span class="${getColor(stonePct)}">${stonePct}%</span>
                        </div>
                        <div class="tw-progress" style="margin:6px 0;"><div class="tw-progress-bar tw-progress-stone" style="width:${stonePct}%"></div></div>
                        <div class="sub">+${stoneProd}/h | Enche em: ${stoneFull}</div>
                    </div>
                    <div class="tw-card">
                        <h4>⛓️ Ferro</h4>
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span class="value" style="font-size:18px;">${v.iron || 0}</span>
                            <span class="${getColor(ironPct)}">${ironPct}%</span>
                        </div>
                        <div class="tw-progress" style="margin:6px 0;"><div class="tw-progress-bar tw-progress-iron" style="width:${ironPct}%"></div></div>
                        <div class="sub">+${ironProd}/h | Enche em: ${ironFull}</div>
                    </div>
                </div>
                
                <h3 style="color:#ffd700;margin:0 0 12px 0;font-size:14px;">⚡ Ações Rápidas</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="tw-btn" onclick="window.location.href='${TW.linkBase}main'">🏗️ Construir</button>
                    <button class="tw-btn" onclick="window.location.href='${TW.linkBase}train'">⚔️ Recrutar</button>
                    <button class="tw-btn" onclick="window.location.href='${TW.linkBase}place'">🏰 Praça</button>
                    <button class="tw-btn" onclick="window.location.href='${TW.linkBase}market'">🏪 Mercado</button>
                    ${TW.hasFarmAssistant ? `<button class="tw-btn" onclick="window.location.href='${TW.linkBase}am_farm'">🌾 Farm</button>` : (TW.canHaveFarmAssistant ? `<button class="tw-btn" style="opacity:0.6" onclick="window.location.href='${TW.linkBase}premium&mode=use'" title="Ative o Assistente de Saque nas Subscrições Premium">🌾 Farm 🔒</button>` : `<button class="tw-btn" onclick="window.location.href='${TW.linkBase}place'">🌾 Praça</button>`)}
                    <button class="tw-btn" onclick="window.location.href='${TW.linkBase}map'">🗺️ Mapa</button>
                    <button class="tw-btn tw-btn-gold" onclick="window.location.href='${TW.linkBase}place&mode=scavenge'">🔄 Coleta</button>
                </div>
            </div>`;
        },
        
        // ─── FARM FINDER ────────────────────────────────
        farmFinder() {
            const vx = TW.village.x || 0;
            const vy = TW.village.y || 0;
            
            return `
            <div id="tw-panel-farmfinder" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">🏴‍☠️ Buscador de Farms — Aldeias Bárbaras</h3>
                <div class="tw-card" style="margin-bottom:16px;">
                    <p style="font-size:12px;color:#a08060;margin:0 0 12px 0;">
                        Busca aldeias bárbaras (sem jogador) usando dados públicos do mundo. 
                        Os dados são baixados do servidor TW (village.txt) e filtrados por distância.
                    </p>
                    <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
                        <div>
                            <div class="tw-label">Centro X</div>
                            <input type="number" class="tw-input" id="tw-farm-cx" value="${vx}" style="width:80px;">
                        </div>
                        <div>
                            <div class="tw-label">Centro Y</div>
                            <input type="number" class="tw-input" id="tw-farm-cy" value="${vy}" style="width:80px;">
                        </div>
                        <div>
                            <div class="tw-label">Raio (campos)</div>
                            <input type="number" class="tw-input" id="tw-farm-radius" value="15" style="width:80px;">
                        </div>
                        <div>
                            <div class="tw-label">Pontos máx.</div>
                            <input type="number" class="tw-input" id="tw-farm-maxpts" value="1500" style="width:80px;">
                        </div>
                        <div>
                            <div class="tw-label">Resultados</div>
                            <input type="number" class="tw-input" id="tw-farm-limit" value="50" style="width:80px;">
                        </div>
                        <button class="tw-btn tw-btn-gold" onclick="window._twFarmSearch()" id="tw-farm-btn">🔍 Buscar Farms</button>
                    </div>
                </div>
                
                <div id="tw-farm-status" style="margin-bottom:12px;font-size:12px;color:#a08060;"></div>
                
                <div id="tw-farm-results"></div>
                
                <hr class="tw-separator">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">💡 Dicas de Farm</h3>
                <div class="tw-grid tw-grid-3">
                    <div class="tw-card">
                        <h4>🐴 Cav. Leve</h4>
                        <div style="font-size:12px;">Melhor unidade para farm. Rápida, alta carga (80). Envie 3-5 por aldeia bárbara pequena.</div>
                    </div>
                    <div class="tw-card">
                        <h4>🪓 Bárbaros</h4>
                        <div style="font-size:12px;">Alternativa barata. Carga baixa (10) mas fácil de produzir em massa. Envie 15-25.</div>
                    </div>
                    <div class="tw-card">
                        <h4>📊 Eficiência</h4>
                        <div style="font-size:12px;">Farms até 5 campos = ótimo. 5-10 = bom. 10+ = envie apenas cavalaria.</div>
                    </div>
                </div>
            </div>`;
        },
        
        // ─── ATTACK PLANNER ─────────────────────────────
        attackPlanner() {
            const vx = TW.village.x || 0;
            const vy = TW.village.y || 0;
            
            return `
            <div id="tw-panel-planner" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">🗺️ Planejador de Ataques</h3>
                <div class="tw-card" style="margin-bottom:16px;">
                    <p style="font-size:12px;color:#a08060;margin:0 0 12px 0;">
                        Planeje ataques coordenados em múltiplos alvos. Defina o horário de chegada 
                        e o sistema calcula quando enviar cada ataque com cada tipo de tropa.
                    </p>
                    
                    <div class="tw-grid tw-grid-2">
                        <div>
                            <div class="tw-label">Sua aldeia (origem)</div>
                            <input type="text" class="tw-input" id="tw-plan-origin" value="${vx}|${vy}" placeholder="X|Y" style="width:150px;">
                        </div>
                        <div>
                            <div class="tw-label">Horário de chegada desejado</div>
                            <div style="display:flex;gap:8px;">
                                <input type="date" class="tw-input" id="tw-plan-date" style="width:160px;">
                                <input type="time" class="tw-input" id="tw-plan-time" value="12:00" step="1" style="width:120px;">
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top:12px;">
                        <div class="tw-label">Tipo de unidade para o ataque</div>
                        <select class="tw-select" id="tw-plan-unit" style="width:200px;">
                            <option value="light">🐴 Cavalaria Leve</option>
                            <option value="axe">🪓 Bárbaros</option>
                            <option value="heavy">🐎 Cavalaria Pesada</option>
                            <option value="ram">🪵 Aríete</option>
                            <option value="snob">👑 Nobre (trem)</option>
                            <option value="spy">👁️ Explorador</option>
                            <option value="catapult">💣 Catapulta</option>
                        </select>
                    </div>
                    
                    <div style="margin-top:12px;">
                        <div class="tw-label">Coordenadas dos alvos (uma por linha ou separadas por espaço)</div>
                        <textarea class="tw-textarea" id="tw-plan-targets" rows="4" placeholder="500|500&#10;501|501&#10;502|502"></textarea>
                    </div>
                    
                    <div style="margin-top:12px;">
                        <button class="tw-btn tw-btn-gold" onclick="window._twPlanAttacks()">🗺️ Calcular Plano</button>
                        <button class="tw-btn" onclick="window._twPlanCopy()" style="margin-left:8px;">📋 Copiar Plano</button>
                    </div>
                </div>
                
                <div id="tw-plan-results"></div>
                
                <hr class="tw-separator">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">👑 Planejador de Trem de Nobres</h3>
                <div class="tw-card">
                    <p style="font-size:12px;color:#a08060;margin:0 0 12px 0;">
                        Calcule o timing para enviar 4 nobres para conquistar uma aldeia. Os nobres devem chegar 
                        com segundos de diferença para reduzir lealdade de 100 a 0.
                    </p>
                    <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
                        <div>
                            <div class="tw-label">Alvo</div>
                            <input type="text" class="tw-input" id="tw-noble-target" placeholder="500|500" style="width:100px;">
                        </div>
                        <div>
                            <div class="tw-label">Chegada 1º nobre (HH:MM:SS)</div>
                            <input type="text" class="tw-input" id="tw-noble-time" placeholder="14:30:00" style="width:120px;">
                        </div>
                        <div>
                            <div class="tw-label">Intervalo (seg)</div>
                            <input type="number" class="tw-input" id="tw-noble-gap" value="3" style="width:60px;">
                        </div>
                        <button class="tw-btn" onclick="window._twPlanNoble()">👑 Calcular Trem</button>
                    </div>
                    <div id="tw-noble-results" style="margin-top:12px;"></div>
                </div>
            </div>`;
        },
        
        // ─── INCOMINGS ANALYZER ─────────────────────────
        incomings() {
            return `
            <div id="tw-panel-incomings" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">🚨 Analisador de Ataques Recebidos</h3>
                <div class="tw-card" style="margin-bottom:16px;">
                    <p style="font-size:12px;color:#a08060;margin:0 0 12px 0;">
                        Analisa os ataques recebidos (incomings) visíveis na página atual. 
                        Detecta tipo de ataque pela velocidade e calcula distância do atacante.
                        <br><strong>Use na tela da Praça de Reunião → Comandos recebidos.</strong>
                    </p>
                    <button class="tw-btn tw-btn-gold" onclick="window._twAnalyzeIncomings()">🔍 Analisar Chegadas da Página</button>
                    <button class="tw-btn" onclick="window._twFakeDetect()" style="margin-left:8px;">🎭 Detectar Fakes</button>
                </div>
                
                <div id="tw-incoming-results"></div>
                
                <hr class="tw-separator">
                
                <h3 style="color:#ffd700;margin:0 0 12px 0;">📊 Tabela de Velocidades (referência)</h3>
                <div class="tw-card">
                    <table class="tw-table">
                        <thead><tr><th>Unidade</th><th>Velocidade</th><th>Indica</th></tr></thead>
                        <tbody>
                            <tr><td>👁️ Explorador</td><td>9 min/campo</td><td><span class="tw-badge tw-badge-blue">Espionagem</span></td></tr>
                            <tr><td>🐴 Cav. Leve</td><td>10 min/campo</td><td><span class="tw-badge tw-badge-yellow">Farm/Saque</span></td></tr>
                            <tr><td>🐎 Cav. Pesada</td><td>11 min/campo</td><td><span class="tw-badge tw-badge-yellow">Ataque pesado</span></td></tr>
                            <tr><td>🗡️ Lanceiro</td><td>18 min/campo</td><td><span class="tw-badge tw-badge-red">Ataque real</span></td></tr>
                            <tr><td>🪓 Bárbaro</td><td>18 min/campo</td><td><span class="tw-badge tw-badge-red">Ataque real</span></td></tr>
                            <tr><td>⚔️ Espadachim</td><td>22 min/campo</td><td><span class="tw-badge tw-badge-red">Defesa/Fake</span></td></tr>
                            <tr><td>🪵 Aríete</td><td>30 min/campo</td><td><span class="tw-badge tw-badge-red">Ataque com aríete!</span></td></tr>
                            <tr><td>👑 Nobre</td><td>35 min/campo</td><td><span class="tw-badge tw-badge-red tw-pulse">⚠️ CONQUISTA!</span></td></tr>
                        </tbody>
                    </table>
                </div>
                
                <hr class="tw-separator">
                
                <h3 style="color:#ffd700;margin:0 0 12px 0;">🛡️ Calculadora de Defesa Necessária</h3>
                <div class="tw-card">
                    <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
                        <div>
                            <div class="tw-label">Qtd ataques recebidos</div>
                            <input type="number" class="tw-input" id="tw-def-attacks" value="1" style="width:80px;">
                        </div>
                        <div>
                            <div class="tw-label">Tipo estimado</div>
                            <select class="tw-select" id="tw-def-type">
                                <option value="small">Pequeno (50-200 pop)</option>
                                <option value="medium">Médio (200-1000 pop)</option>
                                <option value="large">Grande (1000-5000 pop)</option>
                                <option value="noble">Trem de Nobres</option>
                            </select>
                        </div>
                        <div>
                            <div class="tw-label">Nível da Muralha</div>
                            <input type="number" class="tw-input" id="tw-def-wall" value="${TW.village.buildings?.wall || 0}" style="width:60px;">
                        </div>
                        <button class="tw-btn" onclick="window._twCalcDefense()">🛡️ Calcular Defesa</button>
                    </div>
                    <div id="tw-def-results" style="margin-top:12px;"></div>
                </div>
            </div>`;
        },
        
        // ─── EDIFÍCIOS ──────────────────────────────────
        buildings() {
            const b = TW.village.buildings || {};
            let rows = '';
            
            for (const [key, info] of Object.entries(TW.buildings)) {
                const level = parseInt(b[key]) || 0;
                const maxLevel = info.maxLevel;
                const pct = Math.round((level / maxLevel) * 100);
                const isMax = level >= maxLevel;
                
                rows += `
                <tr>
                    <td><a href="${TW.linkBase}${key}" style="color:#f0e0c0;text-decoration:none;">${info.name}</a></td>
                    <td style="text-align:center;"><strong style="color:${isMax ? '#7ab03a' : '#ffd700'}">${level}</strong> / ${maxLevel}</td>
                    <td>
                        <div class="tw-progress" style="width:120px;">
                            <div class="tw-progress-bar" style="width:${pct}%;background:${isMax ? '#7ab03a' : pct > 50 ? '#c8a050' : '#4a8020'}"></div>
                        </div>
                    </td>
                    <td style="text-align:center;">
                        ${isMax ? '<span class="tw-badge tw-badge-green">MAX</span>' : 
                        `<button class="tw-btn tw-btn-sm tw-upgrade-building" data-building="${key}">Evoluir</button>`}
                    </td>
                </tr>`;
            }
            
            // Ordem de construção recomendada
            const buildOrder = this.getBuildRecommendation(b);
            
            return `
            <div id="tw-panel-buildings" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">🏗️ Edifícios da Aldeia</h3>
                <table class="tw-table">
                    <thead>
                        <tr>
                            <th>Edifício</th>
                            <th style="text-align:center;">Nível</th>
                            <th>Progresso</th>
                            <th style="text-align:center;">Ação</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                
                <hr class="tw-separator">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">💡 Recomendações de Construção</h3>
                <div class="tw-card">
                    <div style="font-size:13px;line-height:1.8;">
                        ${buildOrder}
                    </div>
                </div>
            </div>`;
        },
        
        getBuildRecommendation(b) {
            const recommendations = [];
            const lvl = (key) => parseInt(b[key]) || 0;
            
            // Lógica de prioridade para early-game
            if (lvl('farm') < 10) recommendations.push('🔴 <strong>Fazenda</strong> → Nível ' + (lvl('farm')+1) + ' (PRIORIDADE: sem pop livre não recruta)');
            if (lvl('storage') < 10 && lvl('storage') < lvl('wood')) recommendations.push('🟡 <strong>Armazém</strong> → Nível ' + (lvl('storage')+1) + ' (aumentar capacidade)');
            if (lvl('main') < 15) recommendations.push('🟡 <strong>Ed. Principal</strong> → Nível ' + (lvl('main')+1) + ' (constrói mais rápido)');
            if (lvl('barracks') < 10) recommendations.push('🟢 <strong>Quartel</strong> → Nível ' + (lvl('barracks')+1) + ' (recrutar mais rápido)');
            if (lvl('wall') < 10) recommendations.push('🔴 <strong>Muralha</strong> → Nível ' + (lvl('wall')+1) + ' (defesa essencial)');
            if (lvl('wood') < 20) recommendations.push('🟢 <strong>Bosque</strong> → Nível ' + (lvl('wood')+1));
            if (lvl('stone') < 20) recommendations.push('🟢 <strong>Argila</strong> → Nível ' + (lvl('stone')+1));
            if (lvl('iron') < 20) recommendations.push('🟢 <strong>Ferro</strong> → Nível ' + (lvl('iron')+1));
            if (lvl('stable') < 5) recommendations.push('🟡 <strong>Estábulo</strong> → Nível ' + (lvl('stable')+1) + ' (cavalaria leve)');
            if (lvl('market') < 5) recommendations.push('🟢 <strong>Mercado</strong> → Nível ' + (lvl('market')+1) + ' (comerciar recursos)');
            
            if (recommendations.length === 0) {
                return '✅ Sua aldeia está bem desenvolvida! Continue evoluindo recursos e tropas.';
            }
            
            return recommendations.slice(0, 6).join('<br>');
        },
        
        // ─── TROPAS ─────────────────────────────────────
        troops() {
            let rows = '';
            for (const [key, info] of Object.entries(TW.units)) {
                rows += `
                <tr>
                    <td><img src="${TW.gameData ? 'https://dsbr.innogamescdn.com/asset/e4dc0f79a8/graphic/unit/unit_' + key + '.webp' : ''}" 
                        style="width:20px;vertical-align:middle;margin-right:6px;" alt="">${info.name}</td>
                    <td style="text-align:center;color:#ff6666;">${info.attack}</td>
                    <td style="text-align:center;color:#66ff66;">${info.defGeneral}</td>
                    <td style="text-align:center;color:#6666ff;">${info.defCav}</td>
                    <td style="text-align:center;">${info.speed} min/campo</td>
                    <td style="text-align:center;">${info.carry}</td>
                    <td style="text-align:center;">${info.pop}</td>
                    <td style="text-align:center;color:#a08060;font-size:11px;">${info.wood}/${info.stone}/${info.iron}</td>
                </tr>`;
            }
            
            return `
            <div id="tw-panel-troops" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">⚔️ Tabela de Unidades</h3>
                <table class="tw-table">
                    <thead>
                        <tr>
                            <th>Unidade</th>
                            <th style="text-align:center;">⚔️ Ataque</th>
                            <th style="text-align:center;">🛡️ Def Geral</th>
                            <th style="text-align:center;">🐴 Def Cav</th>
                            <th style="text-align:center;">⏱️ Velocidade</th>
                            <th style="text-align:center;">📦 Carga</th>
                            <th style="text-align:center;">👥 Pop</th>
                            <th style="text-align:center;">💰 Custo</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                
                <hr class="tw-separator">
                
                <h3 style="color:#ffd700;margin:0 0 12px 0;">📐 Calculadora de Tropas</h3>
                <div class="tw-grid tw-grid-2">
                    <div class="tw-card">
                        <h4>Calcular custo do exército</h4>
                        <div id="tw-troop-calc">
                            ${Object.entries(TW.units).map(([key, info]) => `
                                <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                                    <span style="width:100px;font-size:12px;">${info.name}:</span>
                                    <input type="number" class="tw-input tw-troop-input" data-unit="${key}" value="0" min="0" 
                                        style="width:80px;" oninput="window._twCalcTroops()">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tw-card">
                        <h4>📊 Resultado</h4>
                        <div id="tw-troop-result" style="font-size:13px;line-height:2;">
                            <div>⚔️ Ataque Total: <strong id="tw-res-atk">0</strong></div>
                            <div>📦 Capacidade Carga: <strong id="tw-res-carry">0</strong></div>
                            <div>👥 População: <strong id="tw-res-pop">0</strong></div>
                            <hr class="tw-separator">
                            <div>🪵 Madeira: <strong id="tw-res-wood">0</strong></div>
                            <div>🧱 Argila: <strong id="tw-res-stone">0</strong></div>
                            <div>⛓️ Ferro: <strong id="tw-res-iron">0</strong></div>
                            <div>💰 Custo Total: <strong id="tw-res-total">0</strong></div>
                        </div>
                    </div>
                </div>
            </div>`;
        },
        
        // ─── CALCULADORA DE ATAQUE ──────────────────────
        attack() {
            const vx = TW.village.x || 0;
            const vy = TW.village.y || 0;
            
            return `
            <div id="tw-panel-attack" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">🎯 Calculadora de Distância e Tempo</h3>
                <div class="tw-grid tw-grid-2">
                    <div class="tw-card">
                        <h4>📍 Origem (sua aldeia)</h4>
                        <div style="display:flex;gap:8px;">
                            <div>
                                <div class="tw-label">X</div>
                                <input type="number" class="tw-input" id="tw-origin-x" value="${vx}" style="width:80px;">
                            </div>
                            <div>
                                <div class="tw-label">Y</div>
                                <input type="number" class="tw-input" id="tw-origin-y" value="${vy}" style="width:80px;">
                            </div>
                        </div>
                    </div>
                    <div class="tw-card">
                        <h4>🎯 Destino</h4>
                        <div style="display:flex;gap:8px;">
                            <div>
                                <div class="tw-label">X</div>
                                <input type="number" class="tw-input" id="tw-dest-x" value="" placeholder="500" style="width:80px;">
                            </div>
                            <div>
                                <div class="tw-label">Y</div>
                                <input type="number" class="tw-input" id="tw-dest-y" value="" placeholder="500" style="width:80px;">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin:12px 0;">
                    <button class="tw-btn tw-btn-gold" onclick="window._twCalcDistance()">📐 Calcular Distâncias</button>
                </div>
                
                <div id="tw-distance-result" class="tw-card" style="display:none;">
                    <h4>📊 Resultados</h4>
                    <div id="tw-distance-data"></div>
                </div>
                
                <hr class="tw-separator">
                
                <h3 style="color:#ffd700;margin:0 0 12px 0;">🧮 Simulador Rápido de Saque</h3>
                <div class="tw-card">
                    <p style="font-size:12px;color:#a08060;margin:0 0 12px 0;">
                        Calcule quantas tropas enviar para maximizar saque em aldeias bárbaras.
                    </p>
                    <div style="display:flex;gap:12px;align-items:flex-end;">
                        <div>
                            <div class="tw-label">Recursos estimados</div>
                            <input type="number" class="tw-input" id="tw-loot-resources" placeholder="1000" style="width:120px;">
                        </div>
                        <div>
                            <div class="tw-label">Tipo de tropa</div>
                            <select class="tw-select" id="tw-loot-unit">
                                <option value="axe">Bárbaro (10 carga)</option>
                                <option value="light">Cav. Leve (80 carga)</option>
                                <option value="heavy">Cav. Pesada (50 carga)</option>
                                <option value="spear">Lanceiro (25 carga)</option>
                            </select>
                        </div>
                        <button class="tw-btn" onclick="window._twCalcLoot()">Calcular</button>
                    </div>
                    <div id="tw-loot-result" style="margin-top:12px;font-size:13px;"></div>
                </div>
            </div>`;
        },
        
        // ─── COORDENADAS ────────────────────────────────
        coords() {
            return `
            <div id="tw-panel-coords" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">📍 Gerenciador de Coordenadas</h3>
                <div class="tw-grid tw-grid-2">
                    <div class="tw-card">
                        <h4>📝 Cole coordenadas aqui</h4>
                        <textarea class="tw-textarea" id="tw-coords-input" rows="8" 
                            placeholder="Cole coordenadas no formato X|Y, uma por linha ou separadas por espaço.&#10;&#10;Exemplo:&#10;500|500&#10;501|501 502|502&#10;392|273"></textarea>
                        <div style="margin-top:8px;display:flex;gap:8px;">
                            <button class="tw-btn" onclick="window._twParseCoords()">📊 Analisar</button>
                            <button class="tw-btn tw-btn-gold" onclick="window._twSortCoords()">📐 Ordenar por Distância</button>
                            <button class="tw-btn" onclick="window._twCopyCoords()">📋 Copiar</button>
                        </div>
                    </div>
                    <div class="tw-card">
                        <h4>📊 Resultado</h4>
                        <div id="tw-coords-result" style="font-size:12px;max-height:250px;overflow-y:auto;">
                            <span style="color:#a08060;">Cole coordenadas e clique em Analisar.</span>
                        </div>
                        <div style="margin-top:8px;">
                            <span class="tw-label">Total: <strong id="tw-coords-count">0</strong> coordenadas</span>
                        </div>
                    </div>
                </div>
                
                <hr class="tw-separator">
                
                <h3 style="color:#ffd700;margin:0 0 12px 0;">🔍 Buscar aldeias próximas (da página atual)</h3>
                <div class="tw-card">
                    <p style="font-size:12px;color:#a08060;margin:0 0 8px 0;">
                        Este botão coleta coordenadas de aldeias visíveis na página atual do jogo (ex: mapa, relatórios, perfil de jogador).
                    </p>
                    <button class="tw-btn tw-btn-gold" onclick="window._twGrabCoords()">🔍 Capturar Coordenadas da Página</button>
                    <div id="tw-grab-result" style="margin-top:8px;font-size:12px;"></div>
                </div>
            </div>`;
        },
        
        // ─── BACKTIME ───────────────────────────────────
        backtime() {
            const vx = TW.village.x || 0;
            const vy = TW.village.y || 0;
            
            return `
            <div id="tw-panel-backtime" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">⏱️ Calculadora de Retorno</h3>
                <div class="tw-card" style="margin-bottom:16px;">
                    <p style="font-size:12px;color:#a08060;margin:0 0 12px 0;">
                        Calcule quando enviar tropas para chegar logo após o ataque inimigo retornar.
                        O "backtime" é uma técnica onde você envia um ataque para chegar à aldeia inimiga 
                        poucos segundos após as tropas de ataque dele voltarem.
                    </p>
                    
                    <div class="tw-grid tw-grid-2">
                        <div>
                            <div class="tw-label">Sua aldeia (Origem)</div>
                            <div style="display:flex;gap:8px;">
                                <input type="number" class="tw-input" id="tw-bt-ox" value="${vx}" style="width:80px;" placeholder="X">
                                <input type="number" class="tw-input" id="tw-bt-oy" value="${vy}" style="width:80px;" placeholder="Y">
                            </div>
                        </div>
                        <div>
                            <div class="tw-label">Aldeia do inimigo (Destino)</div>
                            <div style="display:flex;gap:8px;">
                                <input type="number" class="tw-input" id="tw-bt-dx" value="" style="width:80px;" placeholder="X">
                                <input type="number" class="tw-input" id="tw-bt-dy" value="" style="width:80px;" placeholder="Y">
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top:12px;">
                        <div class="tw-label">Horário de chegada do ataque inimigo (HH:MM:SS)</div>
                        <input type="text" class="tw-input" id="tw-bt-arrival" value="" style="width:200px;" placeholder="14:30:00">
                    </div>
                    
                    <div style="margin-top:12px;">
                        <div class="tw-label">Aldeia de onde o inimigo atacou (para calcular o retorno dele)</div>
                        <div style="display:flex;gap:8px;">
                            <input type="number" class="tw-input" id="tw-bt-ex" value="" style="width:80px;" placeholder="X">
                            <input type="number" class="tw-input" id="tw-bt-ey" value="" style="width:80px;" placeholder="Y">
                        </div>
                    </div>
                    
                    <div style="margin-top:12px;">
                        <button class="tw-btn tw-btn-gold" onclick="window._twCalcBacktime()">⏱️ Calcular Retorno</button>
                    </div>
                </div>
                
                <div id="tw-bt-result" class="tw-card" style="display:none;">
                    <h4>📊 Resultados do Retorno</h4>
                    <div id="tw-bt-data"></div>
                </div>
            </div>`;
        },
        
        // ─── NOTAS ──────────────────────────────────────
        notes() {
            const saved = localStorage.getItem('tw_toolkit_notes') || '';
            const savedTargets = localStorage.getItem('tw_toolkit_targets') || '[]';
            let targets;
            try { targets = JSON.parse(savedTargets); } catch(e) { targets = []; }
            
            const targetRows = targets.map((t, i) => `
                <tr>
                    <td>${t.coord || 'N/A'}</td>
                    <td>${t.name || '-'}</td>
                    <td><span class="tw-badge ${t.type === 'attack' ? 'tw-badge-red' : t.type === 'farm' ? 'tw-badge-green' : 'tw-badge-blue'}">${t.type || 'outro'}</span></td>
                    <td>${t.note || '-'}</td>
                    <td><button class="tw-btn tw-btn-danger tw-btn-sm" onclick="window._twRemoveTarget(${i})">✕</button></td>
                </tr>
            `).join('');
            
            return `
            <div id="tw-panel-notes" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">📝 Bloco de Notas Estratégico</h3>
                <div class="tw-card" style="margin-bottom:16px;">
                    <textarea class="tw-textarea" id="tw-notes-text" rows="6" 
                        placeholder="Anote suas estratégias, coordenadas importantes, horários de ataque...">${saved}</textarea>
                    <div style="margin-top:8px;">
                        <button class="tw-btn" onclick="window._twSaveNotes()">💾 Salvar Notas</button>
                        <span id="tw-notes-saved" style="color:#7ab03a;font-size:12px;margin-left:8px;display:none;">✅ Salvo!</span>
                    </div>
                </div>
                
                <h3 style="color:#ffd700;margin:0 0 12px 0;">🎯 Lista de Alvos</h3>
                <div class="tw-card" style="margin-bottom:12px;">
                    <div style="display:flex;gap:8px;align-items:flex-end;">
                        <div>
                            <div class="tw-label">Coordenada</div>
                            <input type="text" class="tw-input" id="tw-target-coord" placeholder="500|500" style="width:100px;">
                        </div>
                        <div>
                            <div class="tw-label">Nome/Jogador</div>
                            <input type="text" class="tw-input" id="tw-target-name" placeholder="Aldeia X" style="width:120px;">
                        </div>
                        <div>
                            <div class="tw-label">Tipo</div>
                            <select class="tw-select" id="tw-target-type">
                                <option value="farm">🌾 Farm</option>
                                <option value="attack">⚔️ Ataque</option>
                                <option value="defense">🛡️ Defesa</option>
                                <option value="spy">👁️ Espionar</option>
                            </select>
                        </div>
                        <div>
                            <div class="tw-label">Nota</div>
                            <input type="text" class="tw-input" id="tw-target-note" placeholder="Observação" style="width:140px;">
                        </div>
                        <button class="tw-btn tw-btn-gold" onclick="window._twAddTarget()">+ Adicionar</button>
                    </div>
                </div>
                
                <table class="tw-table">
                    <thead>
                        <tr>
                            <th>Coordenada</th>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Nota</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody id="tw-targets-body">${targetRows || '<tr><td colspan="5" style="text-align:center;color:#a08060;">Nenhum alvo cadastrado</td></tr>'}</tbody>
                </table>
            </div>`;
        },
        
        // ─── EXPORTAR ───────────────────────────────────
        exportData() {
            return `
            <div id="tw-panel-export" class="tw-panel">
                <h3 style="color:#ffd700;margin:0 0 12px 0;">💾 Exportar Dados da Conta</h3>
                
                <div class="tw-grid tw-grid-2" style="margin-bottom:16px;">
                    <div class="tw-card">
                        <h4>📊 Dados da Aldeia</h4>
                        <p style="font-size:12px;color:#a08060;">Exporta todos os dados visíveis da sua aldeia atual em formato JSON.</p>
                        <button class="tw-btn" onclick="window._twExportVillage()">💾 Exportar Aldeia</button>
                    </div>
                    <div class="tw-card">
                        <h4>📋 Dados do Jogador</h4>
                        <p style="font-size:12px;color:#a08060;">Exporta informações do jogador (rank, pontos, aldeias).</p>
                        <button class="tw-btn" onclick="window._twExportPlayer()">💾 Exportar Jogador</button>
                    </div>
                </div>
                
                <div class="tw-card" style="margin-bottom:16px;">
                    <h4>📤 Game Data Completo (para análise)</h4>
                    <p style="font-size:12px;color:#a08060;">Exporta o objeto game_data completo do jogo. Útil para análise avançada.</p>
                    <button class="tw-btn tw-btn-gold" onclick="window._twExportAll()">💾 Exportar Tudo</button>
                </div>
                
                <div class="tw-card">
                    <h4>📦 Resultado</h4>
                    <textarea class="tw-textarea" id="tw-export-output" rows="10" readonly 
                        placeholder="Os dados exportados aparecerão aqui..."></textarea>
                    <div style="margin-top:8px;">
                        <button class="tw-btn" onclick="window._twCopyExport()">📋 Copiar</button>
                    </div>
                </div>
            </div>`;
        }
    };

    // ═══════════════════════════════════════════════════
    // 🎮 FUNÇÕES GLOBAIS (onclick handlers)
    // ═══════════════════════════════════════════════════
    
    // Calculadora de tropas
    window._twCalcTroops = function() {
        const troops = {};
        document.querySelectorAll('.tw-troop-input').forEach(input => {
            troops[input.dataset.unit] = parseInt(input.value) || 0;
        });
        
        const cost = Calc.troopCost(troops);
        const atk = Calc.attackPower(troops);
        const carry = Calc.carryCapacity(troops);
        const pop = Calc.troopPop(troops);
        
        document.getElementById('tw-res-atk').textContent = atk.toLocaleString();
        document.getElementById('tw-res-carry').textContent = carry.toLocaleString();
        document.getElementById('tw-res-pop').textContent = pop.toLocaleString();
        document.getElementById('tw-res-wood').textContent = cost.wood.toLocaleString();
        document.getElementById('tw-res-stone').textContent = cost.stone.toLocaleString();
        document.getElementById('tw-res-iron').textContent = cost.iron.toLocaleString();
        document.getElementById('tw-res-total').textContent = cost.total.toLocaleString();
    };
    
    // Calculadora de distância
    window._twCalcDistance = function() {
        const ox = parseInt(document.getElementById('tw-origin-x').value) || 0;
        const oy = parseInt(document.getElementById('tw-origin-y').value) || 0;
        const dx = parseInt(document.getElementById('tw-dest-x').value) || 0;
        const dy = parseInt(document.getElementById('tw-dest-y').value) || 0;
        
        if (!dx && !dy) { alert('Preencha as coordenadas de destino!'); return; }
        
        const dist = Calc.distance(ox, oy, dx, dy);
        
        let html = `<p>📐 <strong>Distância:</strong> ${dist.toFixed(2)} campos</p><table class="tw-table"><thead><tr><th>Unidade</th><th>Tempo de Viagem</th><th>Horário de Chegada</th></tr></thead><tbody>`;
        
        for (const [key, info] of Object.entries(TW.units)) {
            const seconds = Calc.travelTime(ox, oy, dx, dy, info.speed);
            const time = Calc.formatTime(seconds);
            const arrival = new Date(Date.now() + seconds * 1000);
            const arrivalStr = arrival.toLocaleTimeString('pt-BR');
            html += `<tr><td>${info.name}</td><td>${time}</td><td>${arrivalStr}</td></tr>`;
        }
        
        html += '</tbody></table>';
        
        document.getElementById('tw-distance-result').style.display = 'block';
        document.getElementById('tw-distance-data').innerHTML = html;
    };
    
    // Calculadora de saque
    window._twCalcLoot = function() {
        const resources = parseInt(document.getElementById('tw-loot-resources').value) || 0;
        const unitKey = document.getElementById('tw-loot-unit').value;
        const unit = TW.units[unitKey];
        
        if (!resources || !unit) { alert('Preencha os recursos estimados!'); return; }
        
        const needed = Math.ceil(resources / unit.carry);
        const pop = needed * unit.pop;
        const cost = { wood: needed * unit.wood, stone: needed * unit.stone, iron: needed * unit.iron };
        
        document.getElementById('tw-loot-result').innerHTML = `
            <div class="tw-card">
                <p>🎯 Para saquear <strong>${resources.toLocaleString()}</strong> recursos com <strong>${unit.name}</strong>:</p>
                <p>⚔️ Envie: <strong style="color:#ffd700;">${needed}</strong> ${unit.name}(s)</p>
                <p>👥 População necessária: <strong>${pop}</strong></p>
                <p>💰 Custo para recrutar: 🪵${cost.wood.toLocaleString()} 🧱${cost.stone.toLocaleString()} ⛓️${cost.iron.toLocaleString()}</p>
            </div>
        `;
    };
    
    // Coordenadas
    window._twParseCoords = function() {
        const text = document.getElementById('tw-coords-input').value;
        const coords = Calc.parseCoords(text);
        
        if (coords.length === 0) {
            document.getElementById('tw-coords-result').innerHTML = '<span style="color:#ff4444;">Nenhuma coordenada encontrada!</span>';
            return;
        }
        
        let html = '<table class="tw-table"><thead><tr><th>#</th><th>Coordenada</th><th>Distância</th></tr></thead><tbody>';
        const vx = TW.village.x || 0;
        const vy = TW.village.y || 0;
        
        coords.forEach((c, i) => {
            const dist = Calc.distance(vx, vy, c.x, c.y);
            html += `<tr><td>${i+1}</td><td>${c.x}|${c.y}</td><td>${dist.toFixed(1)} campos</td></tr>`;
        });
        
        html += '</tbody></table>';
        document.getElementById('tw-coords-result').innerHTML = html;
        document.getElementById('tw-coords-count').textContent = coords.length;
    };
    
    window._twSortCoords = function() {
        const text = document.getElementById('tw-coords-input').value;
        const coords = Calc.parseCoords(text);
        const vx = TW.village.x || 0;
        const vy = TW.village.y || 0;
        
        coords.sort((a, b) => Calc.distance(vx, vy, a.x, a.y) - Calc.distance(vx, vy, b.x, b.y));
        
        document.getElementById('tw-coords-input').value = coords.map(c => `${c.x}|${c.y}`).join('\n');
        window._twParseCoords();
    };
    
    window._twCopyCoords = function() {
        const text = document.getElementById('tw-coords-input').value;
        navigator.clipboard.writeText(text).then(() => alert('Coordenadas copiadas!')).catch(() => {
            const ta = document.getElementById('tw-coords-input');
            ta.select();
            document.execCommand('copy');
        });
    };
    
    window._twGrabCoords = function() {
        const pageHTML = document.body.innerHTML;
        const coords = Calc.parseCoords(pageHTML);
        const unique = [...new Map(coords.map(c => [`${c.x}|${c.y}`, c])).values()];
        
        if (unique.length === 0) {
            document.getElementById('tw-grab-result').innerHTML = '<span style="color:#ff4444;">Nenhuma coordenada encontrada na página atual.</span>';
            return;
        }
        
        document.getElementById('tw-coords-input').value = unique.map(c => `${c.x}|${c.y}`).join('\n');
        document.getElementById('tw-grab-result').innerHTML = `<span style="color:#7ab03a;">✅ ${unique.length} coordenadas capturadas!</span>`;
        window._twParseCoords();
    };
    
    // Backtime
    window._twCalcBacktime = function() {
        const ox = parseInt(document.getElementById('tw-bt-ox').value) || 0;
        const oy = parseInt(document.getElementById('tw-bt-oy').value) || 0;
        const dx = parseInt(document.getElementById('tw-bt-dx').value) || 0;
        const dy = parseInt(document.getElementById('tw-bt-dy').value) || 0;
        const ex = parseInt(document.getElementById('tw-bt-ex').value) || 0;
        const ey = parseInt(document.getElementById('tw-bt-ey').value) || 0;
        const arrival = document.getElementById('tw-bt-arrival').value;
        
        if (!dx || !dy || !ex || !ey || !arrival) {
            alert('Preencha todos os campos!');
            return;
        }
        
        // Parse arrival time
        const [ah, am, as] = arrival.split(':').map(Number);
        const now = new Date();
        const arrivalDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ah, am, as || 0);
        if (arrivalDate < now) arrivalDate.setDate(arrivalDate.getDate() + 1);
        
        // Distância de retorno do inimigo (da sua aldeia de volta à dele)
        const enemyReturnDist = Calc.distance(TW.village.x || ox, TW.village.y || oy, ex, ey);
        
        // Distância do seu ataque (da sua aldeia até a do inimigo)
        const yourAttackDist = Calc.distance(ox, oy, dx, dy);
        
        let html = `<p>📐 Distância do retorno inimigo: <strong>${enemyReturnDist.toFixed(2)}</strong> campos</p>`;
        html += `<p>📐 Distância do seu ataque: <strong>${yourAttackDist.toFixed(2)}</strong> campos</p>`;
        html += '<table class="tw-table"><thead><tr><th>Sua Unidade</th><th>Tempo Viagem</th><th>Enviar às</th><th>Chegada</th><th>Status</th></tr></thead><tbody>';
        
        for (const [key, info] of Object.entries(TW.units)) {
            if (!info.attack && key !== 'spy') continue;
            
            // Tempo de retorno das tropas inimigas (usando a unidade mais lenta = axe/ram)
            const enemyReturnSeconds = Math.round(enemyReturnDist * 18 * 60); // assume axe speed
            const enemyReturnTime = new Date(arrivalDate.getTime() + enemyReturnSeconds * 1000);
            
            // Seu tempo de viagem
            const yourTravelSeconds = Math.round(yourAttackDist * info.speed * 60);
            
            // Quando você deve enviar = hora que inimigo volta - seu tempo de viagem
            const sendTime = new Date(enemyReturnTime.getTime() - yourTravelSeconds * 1000);
            const arrivalTime = new Date(sendTime.getTime() + yourTravelSeconds * 1000);
            
            const sendStr = sendTime.toLocaleTimeString('pt-BR');
            const arrivalStr = arrivalTime.toLocaleTimeString('pt-BR');
            const travelStr = Calc.formatTime(yourTravelSeconds);
            
            const isPast = sendTime < now;
            const status = isPast ? '<span class="tw-badge tw-badge-red">Atrasado</span>' : '<span class="tw-badge tw-badge-green">OK</span>';
            
            html += `<tr style="${isPast ? 'opacity:0.5' : ''}"><td>${info.name}</td><td>${travelStr}</td><td><strong style="color:#ffd700;">${sendStr}</strong></td><td>${arrivalStr}</td><td>${status}</td></tr>`;
        }
        
        html += '</tbody></table>';
        html += `<p style="color:#a08060;font-size:11px;margin-top:8px;">⚠️ O cálculo assume que o inimigo usou Bárbaros (machado). Ajuste se necessário.</p>`;
        
        document.getElementById('tw-bt-result').style.display = 'block';
        document.getElementById('tw-bt-data').innerHTML = html;
    };
    
    // Notas
    window._twSaveNotes = function() {
        const text = document.getElementById('tw-notes-text').value;
        localStorage.setItem('tw_toolkit_notes', text);
        const saved = document.getElementById('tw-notes-saved');
        saved.style.display = 'inline';
        setTimeout(() => saved.style.display = 'none', 2000);
    };
    
    // Alvos
    window._twAddTarget = function() {
        const coord = document.getElementById('tw-target-coord').value;
        const name = document.getElementById('tw-target-name').value;
        const type = document.getElementById('tw-target-type').value;
        const note = document.getElementById('tw-target-note').value;
        
        if (!coord) { alert('Preencha a coordenada!'); return; }
        
        let targets = [];
        try { targets = JSON.parse(localStorage.getItem('tw_toolkit_targets') || '[]'); } catch(e) {}
        targets.push({ coord, name, type, note });
        localStorage.setItem('tw_toolkit_targets', JSON.stringify(targets));
        
        // Refresh
        UI.inject();
        // Navegar para aba Notas
        document.querySelector('.tw-tab[data-panel="notes"]').click();
    };
    
    window._twRemoveTarget = function(index) {
        let targets = [];
        try { targets = JSON.parse(localStorage.getItem('tw_toolkit_targets') || '[]'); } catch(e) {}
        targets.splice(index, 1);
        localStorage.setItem('tw_toolkit_targets', JSON.stringify(targets));
        UI.inject();
        document.querySelector('.tw-tab[data-panel="notes"]').click();
    };
    
    // Export
    window._twExportVillage = function() {
        document.getElementById('tw-export-output').value = JSON.stringify(TW.village, null, 2);
    };
    
    window._twExportPlayer = function() {
        document.getElementById('tw-export-output').value = JSON.stringify(TW.player, null, 2);
    };
    
    window._twExportAll = function() {
        document.getElementById('tw-export-output').value = JSON.stringify(TW.gameData, null, 2);
    };
    
    window._twCopyExport = function() {
        const ta = document.getElementById('tw-export-output');
        navigator.clipboard.writeText(ta.value).then(() => alert('Copiado!')).catch(() => {
            ta.select();
            document.execCommand('copy');
        });
    };

    // ═══════════════════════════════════════════════════
    // 🏴‍☠️ FARM FINDER — Busca aldeias bárbaras do mundo
    // ═══════════════════════════════════════════════════
    
    const WorldData = {
        cache: null,
        cacheTime: 0,
        CACHE_TTL: 10 * 60 * 1000, // 10 minutos
        
        async fetchVillages() {
            // Usa cache se válido
            if (this.cache && (Date.now() - this.cacheTime < this.CACHE_TTL)) {
                return this.cache;
            }
            
            const world = TW.world || window.location.hostname.split('.')[0];
            const url = `/map/village.txt`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const text = await response.text();
            const villages = [];
            const lines = text.trim().split('\n');
            
            for (const line of lines) {
                const parts = line.split(',');
                if (parts.length >= 7) {
                    villages.push({
                        id: parseInt(parts[0]),
                        name: decodeURIComponent(parts[1].replace(/\+/g, ' ')),
                        x: parseInt(parts[2]),
                        y: parseInt(parts[3]),
                        playerId: parseInt(parts[4]),
                        points: parseInt(parts[5]),
                        bonus: parseInt(parts[6])
                    });
                }
            }
            
            this.cache = villages;
            this.cacheTime = Date.now();
            return villages;
        },
        
        async findBarbarians(cx, cy, radius, maxPoints, limit) {
            const villages = await this.fetchVillages();
            
            return villages
                .filter(v => v.playerId === 0) // Sem jogador = bárbara
                .filter(v => v.points <= maxPoints)
                .map(v => ({
                    ...v,
                    distance: Calc.distance(cx, cy, v.x, v.y)
                }))
                .filter(v => v.distance <= radius)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, limit);
        },
        
        // Cache de jogadores (player.txt: id,name,allyId,villages,points,rank)
        playersCache: null,
        playersCacheTime: 0,
        
        async fetchPlayers() {
            if (this.playersCache && (Date.now() - this.playersCacheTime < this.CACHE_TTL)) {
                return this.playersCache;
            }
            const resp = await fetch('/map/player.txt');
            if (!resp.ok) return {};
            const text = await resp.text();
            const map = {};
            text.trim().split('\n').forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 6) {
                    map[parts[0]] = {
                        name: decodeURIComponent(parts[1].replace(/\+/g, ' ')),
                        allyId: parts[2]
                    };
                }
            });
            this.playersCache = map;
            this.playersCacheTime = Date.now();
            return map;
        },
        
        // Cache de tribos (ally.txt: id,name,tag,members,villages,points,allpoints,rank)
        tribesCache: null,
        tribesCacheTime: 0,
        
        async fetchTribes() {
            if (this.tribesCache && (Date.now() - this.tribesCacheTime < this.CACHE_TTL)) {
                return this.tribesCache;
            }
            const resp = await fetch('/map/ally.txt');
            if (!resp.ok) return {};
            const text = await resp.text();
            const map = {};
            text.trim().split('\n').forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 8) {
                    map[parts[0]] = {
                        name: decodeURIComponent(parts[1].replace(/\+/g, ' ')),
                        tag: decodeURIComponent(parts[2].replace(/\+/g, ' '))
                    };
                }
            });
            this.tribesCache = map;
            this.tribesCacheTime = Date.now();
            return map;
        }
    };
    
    window._twFarmSearch = async function() {
        const cx = parseInt(document.getElementById('tw-farm-cx').value) || 0;
        const cy = parseInt(document.getElementById('tw-farm-cy').value) || 0;
        const radius = parseInt(document.getElementById('tw-farm-radius').value) || 15;
        const maxPts = parseInt(document.getElementById('tw-farm-maxpts').value) || 1500;
        const limit = parseInt(document.getElementById('tw-farm-limit').value) || 50;
        
        const btn = document.getElementById('tw-farm-btn');
        const status = document.getElementById('tw-farm-status');
        const results = document.getElementById('tw-farm-results');
        
        btn.disabled = true;
        btn.textContent = '⏳ Buscando...';
        status.innerHTML = '<span class="tw-pulse">📡 Baixando dados do mundo...</span>';
        
        try {
            const farms = await WorldData.findBarbarians(cx, cy, radius, maxPts, limit);
            
            if (farms.length === 0) {
                results.innerHTML = '<div class="tw-card"><span style="color:#ff4444;">Nenhuma aldeia bárbara encontrada! Tente aumentar o raio.</span></div>';
                status.innerHTML = '✅ Busca concluída — 0 resultados';
                return;
            }
            
            let html = `<table class="tw-table"><thead><tr>
                <th>#</th><th>Coordenada</th><th>Nome</th><th>Pontos</th><th>Distância</th>
                <th>⏱️ Cav.Leve</th><th>⏱️ Bárbaro</th><th>Bônus</th><th>Ação</th>
            </tr></thead><tbody>`;
            
            const bonusNames = { 0: '-', 1: '🪵 Mad.', 2: '🧱 Arg.', 3: '⛓️ Fer.', 4: '🌾 Pop.', 5: '🏰 Quartel', 6: '📦 Armazém', 7: '🏪 Mercado', 8: '💰 Todos', 9: '⚔️ Prod.Trop.' };
            
            farms.forEach((f, i) => {
                const timeLc = Calc.formatTime(Calc.travelTime(cx, cy, f.x, f.y, 10));
                const timeAxe = Calc.formatTime(Calc.travelTime(cx, cy, f.x, f.y, 18));
                const distColor = f.distance < 5 ? '#7ab03a' : f.distance < 10 ? '#ffd700' : '#ff4444';
                
                html += `<tr>
                    <td>${i+1}</td>
                    <td><strong>${f.x}|${f.y}</strong></td>
                    <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;">${f.name}</td>
                    <td>${f.points}</td>
                    <td style="color:${distColor}">${f.distance.toFixed(1)}</td>
                    <td>${timeLc}</td>
                    <td>${timeAxe}</td>
                    <td>${bonusNames[f.bonus] || '-'}</td>
                    <td><a href="${TW.linkBase}place&target=${f.id}" class="tw-btn tw-btn-sm">⚔️</a></td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            results.innerHTML = html;
            status.innerHTML = `✅ Encontradas <strong style="color:#ffd700;">${farms.length}</strong> aldeias bárbaras em raio de ${radius} campos`;
            
        } catch (err) {
            results.innerHTML = `<div class="tw-card"><span style="color:#ff4444;">❌ Erro: ${err.message}</span></div>`;
            status.innerHTML = '❌ Falha na busca';
        } finally {
            btn.disabled = false;
            btn.textContent = '🔍 Buscar Farms';
        }
    };

    // ═══════════════════════════════════════════════════
    // 🗺️ ATTACK PLANNER
    // ═══════════════════════════════════════════════════
    
    window._twPlanAttacks = function() {
        const originText = document.getElementById('tw-plan-origin').value;
        const originCoords = Calc.parseCoords(originText);
        if (!originCoords.length) { alert('Coordenada de origem inválida!'); return; }
        const origin = originCoords[0];
        
        const dateVal = document.getElementById('tw-plan-date').value;
        const timeVal = document.getElementById('tw-plan-time').value;
        
        if (!dateVal || !timeVal) { alert('Defina a data e hora de chegada!'); return; }
        
        const arrivalDate = new Date(`${dateVal}T${timeVal}`);
        if (isNaN(arrivalDate.getTime())) { alert('Data/hora inválida!'); return; }
        
        const unitKey = document.getElementById('tw-plan-unit').value;
        const unit = TW.units[unitKey];
        if (!unit) return;
        
        const targetsText = document.getElementById('tw-plan-targets').value;
        const targets = Calc.parseCoords(targetsText);
        
        if (!targets.length) { alert('Cole coordenadas dos alvos!'); return; }
        
        const now = new Date();
        
        let html = `<div class="tw-card"><h4>📋 Plano de Ataque — ${unit.name} — Chegada: ${arrivalDate.toLocaleString('pt-BR')}</h4>
        <table class="tw-table"><thead><tr>
            <th>#</th><th>Alvo</th><th>Distância</th><th>Tempo Viagem</th>
            <th>🚀 Enviar às</th><th>Status</th>
        </tr></thead><tbody>`;
        
        const plans = targets.map((t, i) => {
            const dist = Calc.distance(origin.x, origin.y, t.x, t.y);
            const travelSec = Calc.travelTime(origin.x, origin.y, t.x, t.y, unit.speed);
            const sendTime = new Date(arrivalDate.getTime() - travelSec * 1000);
            const isPast = sendTime < now;
            const diffMs = sendTime - now;
            const countdown = diffMs > 0 ? Calc.formatTime(Math.floor(diffMs / 1000)) : 'PASSADO';
            
            return { target: t, dist, travelSec, sendTime, isPast, countdown, index: i + 1 };
        }).sort((a, b) => a.sendTime - b.sendTime);
        
        plans.forEach(p => {
            html += `<tr style="${p.isPast ? 'opacity:0.4;' : ''}">
                <td>${p.index}</td>
                <td><strong>${p.target.x}|${p.target.y}</strong></td>
                <td>${p.dist.toFixed(1)} campos</td>
                <td>${Calc.formatTime(p.travelSec)}</td>
                <td><strong style="color:${p.isPast ? '#ff4444' : '#ffd700'};">${p.sendTime.toLocaleTimeString('pt-BR')}</strong></td>
                <td>${p.isPast ? '<span class="tw-badge tw-badge-red">Atrasado</span>' : '<span class="tw-badge tw-badge-green">' + p.countdown + '</span>'}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('tw-plan-results').innerHTML = html;
    };
    
    window._twPlanCopy = function() {
        const el = document.getElementById('tw-plan-results');
        if (!el || !el.textContent.trim()) { alert('Calcule o plano primeiro!'); return; }
        navigator.clipboard.writeText(el.textContent).then(() => alert('Plano copiado!'));
    };
    
    // Trem de nobres
    window._twPlanNoble = function() {
        const targetText = document.getElementById('tw-noble-target').value;
        const target = Calc.parseCoords(targetText);
        if (!target.length) { alert('Coordenada do alvo inválida!'); return; }
        
        const timeText = document.getElementById('tw-noble-time').value;
        const gap = parseInt(document.getElementById('tw-noble-gap').value) || 3;
        const [h, m, s] = timeText.split(':').map(Number);
        
        const vx = TW.village.x || 0;
        const vy = TW.village.y || 0;
        const dist = Calc.distance(vx, vy, target[0].x, target[0].y);
        const nobleSpeed = TW.units.snob.speed;
        const nobleTravel = Calc.travelTime(vx, vy, target[0].x, target[0].y, nobleSpeed);
        const ramTravel = Calc.travelTime(vx, vy, target[0].x, target[0].y, TW.units.ram.speed);
        
        const now = new Date();
        const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s || 0);
        if (base < now) base.setDate(base.getDate() + 1);
        
        let html = `<div class="tw-card"><h4>👑 Trem de Nobres → ${target[0].x}|${target[0].y} (${dist.toFixed(1)} campos)</h4><table class="tw-table">
            <thead><tr><th>Onda</th><th>Tipo</th><th>Chegada</th><th>Enviar às</th><th>Lealdade</th></tr></thead><tbody>`;
        
        // Onda 0: Aríete de limpeza
        const ramArrival = new Date(base.getTime() - 2000);
        const ramSend = new Date(ramArrival.getTime() - ramTravel * 1000);
        html += `<tr><td>Limpeza</td><td>🪵 Aríete + Tropas</td><td>${ramArrival.toLocaleTimeString('pt-BR')}</td>
            <td><strong style="color:#ffd700;">${ramSend.toLocaleTimeString('pt-BR')}</strong></td><td>—</td></tr>`;
        
        // 4 ondas de nobres
        const loyalties = [100, 75, 50, 25];
        for (let i = 0; i < 4; i++) {
            const arrival = new Date(base.getTime() + (i * gap * 1000));
            const sendAt = new Date(arrival.getTime() - nobleTravel * 1000);
            const loyaltyAfter = Math.max(0, loyalties[i] - 30);
            
            html += `<tr><td>Nobre ${i+1}</td><td>👑 Nobre + Escolta</td>
                <td>${arrival.toLocaleTimeString('pt-BR')}:<span class="grey">${String(arrival.getMilliseconds()).padStart(3,'0').slice(0,3)}</span></td>
                <td><strong style="color:#ffd700;">${sendAt.toLocaleTimeString('pt-BR')}:<span class="grey">${String(sendAt.getMilliseconds()).padStart(3,'0').slice(0,3)}</span></strong></td>
                <td>${loyalties[i]}→<strong style="color:${loyaltyAfter === 0 ? '#7ab03a' : '#ffd700'}">${loyaltyAfter}</strong></td></tr>`;
        }
        
        html += '</tbody></table><p style="font-size:11px;color:#a08060;margin-top:8px;">💡 Cada nobre reduz ~20-35 de lealdade. Com 4 nobres, a aldeia será conquistada.</p></div>';
        document.getElementById('tw-noble-results').innerHTML = html;
    };

    // ═══════════════════════════════════════════════════
    // 🚨 INCOMING ANALYZER
    // ═══════════════════════════════════════════════════
    
    window._twAnalyzeIncomings = function() {
        const results = document.getElementById('tw-incoming-results');
        
        // Tenta parsear da página do jogo
        const commandRows = document.querySelectorAll('#commands_incomings .command-row, .commands-container[data-type="incoming"] tr.command-row, #incomings_table tr');
        
        if (!commandRows || commandRows.length === 0) {
            // Fallback: busca qualquer timer na página
            const timers = document.querySelectorAll('.widget-command-timer, span.timer');
            if (timers.length === 0) {
                results.innerHTML = `<div class="tw-card">
                    <p style="color:#ff4444;">⚠️ Nenhum ataque recebido encontrado nesta página.</p>
                    <p style="font-size:12px;color:#a08060;">Para analisar incomings, navegue para:</p>
                    <ul style="font-size:12px;color:#a08060;">
                        <li><a href="${TW.linkBase}overview" style="color:#ffd700;">Visão geral</a> (se tiver ataques)</li>
                        <li><a href="${TW.linkBase}place&mode=incomings" style="color:#ffd700;">Praça → Comandos recebidos</a></li>
                    </ul>
                </div>`;
                return;
            }
        }
        
        // Coleta todos os comandos visíveis na página
        const allCommands = [];
        const pageText = document.getElementById('content_value')?.innerHTML || document.body.innerHTML;
        
        // Busca padrões de coordenadas de origem
        const coordMatches = pageText.match(/(\d{1,3})\|(\d{1,3})/g) || [];
        const timerElements = document.querySelectorAll('.widget-command-timer, span.timer, .command-timer');
        
        let html = '<div class="tw-card"><h4>📊 Análise da Página</h4>';
        html += `<p>📍 Coordenadas encontradas: <strong>${coordMatches.length}</strong></p>`;
        html += `<p>⏱️ Timers encontrados: <strong>${timerElements.length}</strong></p>`;
        
        const incomingCount = parseInt(TW.player.incomings) || 0;
        if (incomingCount > 0) {
            html += `<p style="color:#ff4444;">🚨 <strong>${incomingCount}</strong> ataques recebidos!</p>`;
        } else {
            html += `<p style="color:#7ab03a;">✅ Nenhum ataque recebido no momento.</p>`;
        }
        
        html += '</div>';
        results.innerHTML = html;
    };
    
    window._twFakeDetect = function() {
        const results = document.getElementById('tw-incoming-results');
        results.innerHTML = `<div class="tw-card">
            <h4>🎭 Detector de Fakes</h4>
            <p style="font-size:12px;">Dicas para identificar fakes:</p>
            <ul style="font-size:12px;line-height:2;">
                <li><span class="tw-dot tw-dot-red"></span>Múltiplos ataques do <strong>mesmo jogador</strong> ao mesmo tempo = provável fake</li>
                <li><span class="tw-dot tw-dot-red"></span>Ataques de <strong>aldeias muito distantes</strong> com tropas rápidas = pode ser fake</li>
                <li><span class="tw-dot tw-dot-yellow"></span>Ataques com <strong>velocidade de explorador</strong> (9 min/campo) = espionagem, não ataque</li>
                <li><span class="tw-dot tw-dot-yellow"></span>Ataques chegando em <strong>horários exatos</strong> (minuto redondo) = manual, pode ser real</li>
                <li><span class="tw-dot tw-dot-green"></span>Ataque <strong>lento</strong> (30-35 min/campo) = <strong>REAL com aríete/nobre!</strong> Defenda!</li>
                <li><span class="tw-dot tw-dot-blue"></span>Use espião para verificar tropas antes de decidir defender</li>
            </ul>
        </div>`;
    };
    
    window._twCalcDefense = function() {
        const attacks = parseInt(document.getElementById('tw-def-attacks').value) || 1;
        const type = document.getElementById('tw-def-type').value;
        const wallLevel = parseInt(document.getElementById('tw-def-wall').value) || 0;
        
        const wallBonus = 1 + (wallLevel * 0.05);
        const estimates = {
            small: { pop: 150, atk: 3000, desc: 'Pequeno (farm/saque)' },
            medium: { pop: 600, atk: 15000, desc: 'Médio' },
            large: { pop: 3000, atk: 80000, desc: 'Grande (full nuke)' },
            noble: { pop: 4000, atk: 100000, desc: 'Trem de Nobres' }
        };
        
        const est = estimates[type];
        const totalAtk = est.atk * attacks;
        const defNeeded = Math.ceil(totalAtk / wallBonus);
        
        // Recomendações de tropas de defesa
        const spearDef = TW.units.spear.defGeneral;
        const swordDef = TW.units.sword.defGeneral;
        const heavyDef = TW.units.heavy.defGeneral;
        
        const spearsNeeded = Math.ceil(defNeeded / spearDef);
        const swordsNeeded = Math.ceil(defNeeded / swordDef);
        const heavyNeeded = Math.ceil(defNeeded / heavyDef);
        
        // Mix ótimo: 60% lanceiros, 30% espadachins, 10% cav pesada
        const mixSpears = Math.ceil(spearsNeeded * 0.4);
        const mixSwords = Math.ceil(swordsNeeded * 0.35);
        const mixHeavy = Math.ceil(heavyNeeded * 0.6);
        
        const results = document.getElementById('tw-def-results');
        results.innerHTML = `<div class="tw-card">
            <h4>🛡️ Defesa Necessária vs ${attacks}x ${est.desc}</h4>
            <p>⚔️ Poder de ataque estimado: <strong style="color:#ff4444;">${totalAtk.toLocaleString()}</strong></p>
            <p>🏰 Bônus muralha nv${wallLevel}: <strong>+${Math.round((wallBonus-1)*100)}%</strong></p>
            <p>🛡️ Defesa necessária: <strong style="color:#ffd700;">${defNeeded.toLocaleString()}</strong></p>
            <hr class="tw-separator">
            <p><strong>Opções de defesa:</strong></p>
            <table class="tw-table">
                <thead><tr><th>Composição</th><th>Lanceiros</th><th>Espadachins</th><th>Cav. Pesada</th><th>Pop Total</th></tr></thead>
                <tbody>
                    <tr><td>Só Lanceiros</td><td>${spearsNeeded.toLocaleString()}</td><td>0</td><td>0</td><td>${spearsNeeded.toLocaleString()}</td></tr>
                    <tr><td>Só Espadachins</td><td>0</td><td>${swordsNeeded.toLocaleString()}</td><td>0</td><td>${swordsNeeded.toLocaleString()}</td></tr>
                    <tr style="background:rgba(200,160,80,0.1);"><td><strong>🌟 Mix Ótimo</strong></td><td>${mixSpears.toLocaleString()}</td><td>${mixSwords.toLocaleString()}</td><td>${mixHeavy.toLocaleString()}</td><td>${(mixSpears + mixSwords + mixHeavy * 6).toLocaleString()}</td></tr>
                </tbody>
            </table>
        </div>`;
    };

    // ═══════════════════════════════════════════════════
    // 📡 RESOURCE HUD (overlay em tempo real)
    // ═══════════════════════════════════════════════════
    
    const ResourceHUD = {
        intervalId: null,
        
        inject() {
            const existing = document.getElementById('tw-resource-hud');
            if (existing) existing.remove();
            
            if (localStorage.getItem('tw_hud_hidden') === 'true') return;
            
            const hud = document.createElement('div');
            hud.id = 'tw-resource-hud';
            hud.innerHTML = this.buildHTML();
            document.body.appendChild(hud);
            
            // Atualiza a cada 5 segundos
            this.intervalId = setInterval(() => this.update(), 5000);
        },
        
        buildHTML() {
            const v = TW.village;
            const woodPct = v.storage_max ? Math.round((v.wood / v.storage_max) * 100) : 0;
            const stonePct = v.storage_max ? Math.round((v.stone / v.storage_max) * 100) : 0;
            const ironPct = v.storage_max ? Math.round((v.iron / v.storage_max) * 100) : 0;
            const popFree = (v.pop_max || 0) - (v.pop || 0);
            
            const warnClass = (pct) => pct > 90 ? 'hud-warn' : 'hud-ok';
            
            return `
                <div class="hud-item">🪵 <span class="hud-value ${warnClass(woodPct)}">${v.wood || 0}</span></div>
                <div class="hud-item">🧱 <span class="hud-value ${warnClass(stonePct)}">${v.stone || 0}</span></div>
                <div class="hud-item">⛓️ <span class="hud-value ${warnClass(ironPct)}">${v.iron || 0}</span></div>
                <div class="hud-item">📦 <span style="color:#a08060;">${v.storage_max || 0}</span></div>
                <div class="hud-item">👥 <span class="hud-value">${popFree}</span><span style="color:#a08060;"> livre</span></div>
                ${(parseInt(TW.player.incomings) > 0) ? '<div class="hud-item"><span class="hud-warn tw-pulse">🚨 ' + TW.player.incomings + ' ATK</span></div>' : ''}
                <span class="hud-close" onclick="document.getElementById('tw-resource-hud').remove();localStorage.setItem('tw_hud_hidden','true');">✕</span>
            `;
        },
        
        update() {
            const hud = document.getElementById('tw-resource-hud');
            if (!hud) { clearInterval(this.intervalId); return; }
            
            // Lê valores atualizados do DOM do jogo
            const wood = document.getElementById('wood');
            const stone = document.getElementById('stone');
            const iron = document.getElementById('iron');
            
            if (wood && stone && iron) {
                const v = {
                    wood: parseInt(wood.textContent) || 0,
                    stone: parseInt(stone.textContent) || 0,
                    iron: parseInt(iron.textContent) || 0,
                    storage_max: TW.village.storage_max || 5222
                };
                const popCur = document.getElementById('pop_current_label');
                const popMax = document.getElementById('pop_max_label');
                const popFree = popMax && popCur ? (parseInt(popMax.textContent) - parseInt(popCur.textContent)) : 0;
                
                const warnClass = (val) => (val / v.storage_max) > 0.9 ? 'hud-warn' : 'hud-ok';
                
                hud.innerHTML = `
                    <div class="hud-item">🪵 <span class="hud-value ${warnClass(v.wood)}">${v.wood}</span></div>
                    <div class="hud-item">🧱 <span class="hud-value ${warnClass(v.stone)}">${v.stone}</span></div>
                    <div class="hud-item">⛓️ <span class="hud-value ${warnClass(v.iron)}">${v.iron}</span></div>
                    <div class="hud-item">📦 <span style="color:#a08060;">${v.storage_max}</span></div>
                    <div class="hud-item">👥 <span class="hud-value">${popFree}</span><span style="color:#a08060;"> livre</span></div>
                    <span class="hud-close" onclick="document.getElementById('tw-resource-hud').remove();localStorage.setItem('tw_hud_hidden','true');">✕</span>
                `;
            }
        }
    };

    // ═══════════════════════════════════════════════════
    // ⌨️ KEYBOARD SHORTCUTS
    // ═══════════════════════════════════════════════════
    
    const Hotkeys = {
        init() {
            document.addEventListener('keydown', (e) => {
                // Não ativar se estiver digitando em input/textarea
                if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
                
                if (e.altKey) {
                    switch(e.key.toLowerCase()) {
                        case 't': // Alt+T = Toggle toolkit
                            e.preventDefault();
                            const el = document.getElementById('tw-toolkit');
                            const isVisible = el && el.style.display !== 'none';
                            UI.toggle(!isVisible);
                            break;
                        case 'f': // Alt+F = Buscar Farms
                            e.preventDefault();
                            UI.toggle(true);
                            document.querySelector('.tw-tab[data-panel="farmfinder"]')?.click();
                            break;
                        case 'p': // Alt+P = Planner
                            e.preventDefault();
                            UI.toggle(true);
                            document.querySelector('.tw-tab[data-panel="planner"]')?.click();
                            break;
                        case 'i': // Alt+I = Chegadas
                            e.preventDefault();
                            UI.toggle(true);
                            document.querySelector('.tw-tab[data-panel="incomings"]')?.click();
                            break;
                        case 's': // Alt+S = Sniper MS
                            e.preventDefault();
                            UI.toggle(true);
                            document.querySelector('.tw-tab[data-panel="commandSniper"]')?.click();
                            break;
                        case 'h': // Alt+H = Toggle HUD
                            e.preventDefault();
                            const hud = document.getElementById('tw-resource-hud');
                            if (hud) {
                                hud.remove();
                                localStorage.setItem('tw_hud_hidden', 'true');
                            } else {
                                localStorage.removeItem('tw_hud_hidden');
                                ResourceHUD.inject();
                            }
                            break;
                    }
                }
            });
        }
    };

    // ═══════════════════════════════════════════════════
    // 🗺️ MAP ENHANCER (Mapa expandido + marcações)
    // ═══════════════════════════════════════════════════
    
    const MapEnhancer = {
        KEY: 'tw_map_enhancer',
        
        get settings() {
            try {
                const s = JSON.parse(localStorage.getItem(this.KEY)) || {};
                return {
                    size: s.size || 15,
                    markers: Array.isArray(s.markers) ? s.markers : [],
                    tribeMarkers: Array.isArray(s.tribeMarkers) ? s.tribeMarkers : []
                };
            } catch {
                return { size: 15, markers: [], tribeMarkers: [] };
            }
        },
        
        save(data) {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        },
        
        unlockPageLayout() {
            // Remove a trava de 850px de largura fixa da página do Tribal Wars
            const selectors = ['.maincell', '#contentContainer', '#content_value', 'table.main', '#main_layout'];
            selectors.forEach(sel => {
                const els = document.querySelectorAll(sel);
                els.forEach(el => {
                    el.style.width = 'auto';
                    el.style.maxWidth = 'none';
                });
            });
        },
        
        resizeMap(cols) {
            if (typeof TWMap === 'undefined') return;
            this.unlockPageLayout();
            
            const tileW = (TWMap.tileSize && TWMap.tileSize[0]) || 53;
            const tileH = (TWMap.tileSize && TWMap.tileSize[1]) || 38;
            const widthPx = cols * tileW;
            const heightPx = cols * tileH;
            
            if (TWMap.map && TWMap.map.resize) {
                TWMap.map.resize(widthPx, heightPx, 1);
            } else if (TWMap.resize) {
                TWMap.resize(widthPx, heightPx, 1);
            }
            
            if (TWMap.urls && TWMap.urls.sizeSave) {
                fetch(TWMap.urls.sizeSave, {
                    method: 'POST',
                    body: `map_size=${widthPx}x${heightPx}`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    credentials: 'same-origin'
                }).catch(() => {});
            }
            
            const s = this.settings;
            s.size = cols;
            this.save(s);
        },
        
        addPlayerMarker(name, color) {
            const s = this.settings;
            if (s.markers.find(m => m.name.toLowerCase() === name.toLowerCase())) return false;
            s.markers.push({ name, color, active: true });
            this.save(s);
            return true;
        },
        
        removePlayerMarker(name) {
            const s = this.settings;
            s.markers = s.markers.filter(m => m.name.toLowerCase() !== name.toLowerCase());
            this.save(s);
        },
        
        addTribeMarker(tag, color) {
            const s = this.settings;
            if (s.tribeMarkers.find(m => m.tag.toLowerCase() === tag.toLowerCase())) return false;
            s.tribeMarkers.push({ tag, color, active: true });
            this.save(s);
            return true;
        },
        
        removeTribeMarker(tag) {
            const s = this.settings;
            s.tribeMarkers = s.tribeMarkers.filter(m => m.tag.toLowerCase() !== tag.toLowerCase());
            this.save(s);
        },
        
        hexToRgb(hex) {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            const num = parseInt(hex, 16);
            return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
        },
        
        // Hook no motor nativo de cores do Tribal Wars (TWMap.getColorByPlayer)
        initNativeHook() {
            if (typeof TWMap === 'undefined' || TWMap._toolkitHooked) return;
            TWMap._toolkitHooked = true;
            
            const origGetColor = TWMap.getColorByPlayer;
            TWMap.getColorByPlayer = function(player_id, ally_id, village_id) {
                const s = MapEnhancer.settings;
                
                // 1. Checa se o jogador está marcado
                if (s.markers && s.markers.length && player_id && TWMap.players && TWMap.players[player_id]) {
                    const pName = TWMap.players[player_id].name;
                    if (pName) {
                        const m = s.markers.find(m => m.active && pName.toLowerCase().includes(m.name.toLowerCase()));
                        if (m) return MapEnhancer.hexToRgb(m.color);
                    }
                }
                
                // 2. Checa se a tribo está marcada
                if (s.tribeMarkers && s.tribeMarkers.length && ally_id && TWMap.allies && TWMap.allies[ally_id]) {
                    const aTag = TWMap.allies[ally_id].tag || TWMap.allies[ally_id].name;
                    if (aTag) {
                        const tm = s.tribeMarkers.find(m => m.active && aTag.toLowerCase().includes(m.tag.toLowerCase()));
                        if (tm) return MapEnhancer.hexToRgb(tm.color);
                    }
                }
                
                return origGetColor.call(this, player_id, ally_id, village_id);
            };
        },
        
        // Aplica as marcações no motor nativo do jogo + Minimapa / Mapa Mundial
        async applyOverlay() {
            if (typeof TWMap === 'undefined' || TW.screen !== 'map') return;
            
            this.initNativeHook();
            const s = this.settings;
            
            try {
                const [villages, players, tribes] = await Promise.all([
                    WorldData.fetchVillages(),
                    WorldData.fetchPlayers(),
                    WorldData.fetchTribes()
                ]);
                
                this._cachedWorldData = { villages, players, tribes };
                this.initMinimapMovementHook();
                
                // 1. Popula as tabelas nativas de cores do jogo
                if (typeof TWMap.playerColors !== 'undefined') {
                    s.markers.forEach(m => {
                        if (!m.active) return;
                        const rgb = this.hexToRgb(m.color);
                        Object.entries(players).forEach(([pId, pData]) => {
                            if (pData.name.toLowerCase().includes(m.name.toLowerCase())) {
                                TWMap.playerColors[pId] = rgb;
                                if (typeof MapHighlighter !== 'undefined' && MapHighlighter.alterPlayer) {
                                    MapHighlighter.alterPlayer(pId, rgb);
                                }
                            }
                        });
                    });
                }
                
                if (typeof TWMap.allyColors !== 'undefined') {
                    s.tribeMarkers.forEach(m => {
                        if (!m.active) return;
                        const rgb = this.hexToRgb(m.color);
                        Object.entries(tribes).forEach(([tId, tData]) => {
                            if (tData.tag.toLowerCase().includes(m.tag.toLowerCase())) {
                                TWMap.allyColors[tId] = rgb;
                                if (typeof MapHighlighter !== 'undefined' && MapHighlighter.alterAlly) {
                                    MapHighlighter.alterAlly(tId, rgb);
                                }
                            }
                        });
                    });
                }
                
                // 2. Desenha marcações em tempo real no Minimapa via Canvas Overlay
                this.drawMinimapOverlay(villages, players, tribes);
                
                // 3. Força atualização do motor do jogo
                TWMap.minimap_cache_stamp++;
                if (TWMap.minimap && TWMap.minimap.reload) TWMap.minimap.reload(true);
                if (TWMap.map && TWMap.map.reload) TWMap.map.reload(true);
            } catch (e) {
                console.warn('[TW Toolkit] Erro ao aplicar marcações nativas no minimapa:', e);
            }
        },
        
        initMinimapMovementHook() {
            if (typeof TWMap === 'undefined' || !TWMap.minimap || TWMap.minimap._overlayHooked) return;
            TWMap.minimap._overlayHooked = true;
            
            const origSetPos = TWMap.minimap.setPosPixel;
            if (typeof origSetPos === 'function') {
                TWMap.minimap.setPosPixel = function(x, y) {
                    const res = origSetPos.call(this, x, y);
                    if (MapEnhancer._cachedWorldData) {
                        const { villages, players, tribes } = MapEnhancer._cachedWorldData;
                        MapEnhancer.drawMinimapOverlay(villages, players, tribes);
                    }
                    return res;
                };
            }
        },
        
        drawMinimapOverlay(villages, players, tribes) {
            const old = document.getElementById('tw-minimap-overlay');
            if (old) old.remove();
            
            const minimapWrap = document.getElementById('minimap');
            if (!minimapWrap) return;
            
            const s = this.settings;
            if (!s.markers.length && !s.tribeMarkers.length) return;
            
            if (!TWMap || !TWMap.minimap || !TWMap.minimap.pos || !TWMap.minimap.scale) return;
            
            const width = minimapWrap.offsetWidth || (TWMap.minimap.size ? TWMap.minimap.size[0] : 250);
            const height = minimapWrap.offsetHeight || (TWMap.minimap.size ? TWMap.minimap.size[1] : 250);
            
            const canvas = document.createElement('canvas');
            canvas.id = 'tw-minimap-overlay';
            canvas.width = width;
            canvas.height = height;
            canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:20;';
            minimapWrap.style.position = 'relative';
            minimapWrap.appendChild(canvas);
            
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const posX = TWMap.minimap.pos[0];
            const posY = TWMap.minimap.pos[1];
            const scaleX = TWMap.minimap.scale[0];
            const scaleY = TWMap.minimap.scale[1];
            
            villages.forEach(v => {
                const player = players[v.playerId];
                const playerName = player ? player.name : '';
                const tribe = player && player.allyId ? tribes[player.allyId] : null;
                const tribeTag = tribe ? tribe.tag : '';
                
                let color = null;
                s.markers.forEach(m => {
                    if (m.active && playerName && playerName.toLowerCase().includes(m.name.toLowerCase())) {
                        color = m.color;
                    }
                });
                s.tribeMarkers.forEach(m => {
                    if (m.active && tribeTag && tribeTag.toLowerCase().includes(m.tag.toLowerCase())) {
                        color = m.color;
                    }
                });
                
                if (color) {
                    const px = (v.x * scaleX) - posX + (scaleX / 2);
                    const py = (v.y * scaleY) - posY + (scaleY / 2);
                    
                    if (px >= -5 && px <= width + 5 && py >= -5 && py <= height + 5) {
                        ctx.shadowColor = color;
                        ctx.shadowBlur = 4;
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(px, py, 4, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                        
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }
            });
        },
        
        buildHTML() {
            const s = this.settings;
            const playerRows = s.markers.map(m => 
                `<tr><td><span style="color:${m.color}">■</span> ${m.name}</td>
                 <td style="text-align:right"><button class="tw-btn-small tw-remove-player" data-name="${m.name}">❌</button></td></tr>`
            ).join('') || '<tr><td colspan="2" style="color:#666;font-style:italic">Nenhum jogador marcado</td></tr>';
            
            const tribeRows = s.tribeMarkers.map(m => 
                `<tr><td><span style="color:${m.color}">■</span> [${m.tag}]</td>
                 <td style="text-align:right"><button class="tw-btn-small tw-remove-tribe" data-tag="${m.tag}">❌</button></td></tr>`
            ).join('') || '<tr><td colspan="2" style="color:#666;font-style:italic">Nenhuma tribo marcada</td></tr>';
            
            return `
                <div class="tw-section">
                    <h3 class="tw-section-title">🗺️ Tamanho do Mapa Principal</h3>
                    <div style="display:flex;align-items:center;gap:10px;margin:8px 0">
                        <span>Menor</span>
                        <input type="range" id="tw-map-size" min="7" max="35" value="${s.size}" style="flex:1;accent-color:#ffd700">
                        <span>Maior</span>
                        <strong id="tw-map-size-val" style="color:#ffd700;min-width:40px">${s.size}x${s.size}</strong>
                    </div>
                    <button class="tw-btn" id="tw-map-apply-size">📐 Aplicar Tamanho do Mapa</button>
                    <div style="margin-top:8px;display:flex;gap:6px">
                        <input type="text" id="tw-map-goto-coord" placeholder="Ex: 392|273" style="flex:1;padding:5px;background:#1a0a00;border:1px solid #5a3a1a;color:#f0e0c0;border-radius:4px">
                        <button class="tw-btn" id="tw-map-goto">🔍 Ir</button>
                    </div>
                </div>
                <div class="tw-section">
                    <h3 class="tw-section-title">👤 Marcar Jogadores</h3>
                    <div style="display:flex;gap:6px;margin:6px 0">
                        <input type="text" id="tw-mark-player" placeholder="Nome do jogador" style="flex:1;padding:5px;background:#1a0a00;border:1px solid #5a3a1a;color:#f0e0c0;border-radius:4px">
                        <input type="color" id="tw-mark-player-color" value="#ff4444" style="width:35px;border:1px solid #5a3a1a;background:#1a0a00;cursor:pointer">
                        <button class="tw-btn" id="tw-add-player-mark">+</button>
                    </div>
                    <table class="tw-table" style="width:100%"><tbody>${playerRows}</tbody></table>
                </div>
                <div class="tw-section">
                    <h3 class="tw-section-title">🏰 Marcar Tribos</h3>
                    <div style="display:flex;gap:6px;margin:6px 0">
                        <input type="text" id="tw-mark-tribe" placeholder="Tag da tribo" style="flex:1;padding:5px;background:#1a0a00;border:1px solid #5a3a1a;color:#f0e0c0;border-radius:4px">
                        <input type="color" id="tw-mark-tribe-color" value="#4488ff" style="width:35px;border:1px solid #5a3a1a;background:#1a0a00;cursor:pointer">
                        <button class="tw-btn" id="tw-add-tribe-mark">+</button>
                    </div>
                    <table class="tw-table" style="width:100%"><tbody>${tribeRows}</tbody></table>
                </div>
                <button class="tw-btn" id="tw-map-apply-markers" style="width:100%;margin-top:8px">🎨 Aplicar Marcações no Mapa</button>
            `;
        },
        
        bindEvents() {
            this.initNativeHook();
            
            const slider = document.getElementById('tw-map-size');
            const label = document.getElementById('tw-map-size-val');
            if (slider) {
                slider.oninput = () => { label.textContent = `${slider.value}x${slider.value}`; };
            }
            
            document.getElementById('tw-map-apply-size')?.addEventListener('click', () => {
                const val = parseInt(document.getElementById('tw-map-size').value);
                this.resizeMap(val);
                UI.showFeedback('Mapa redimensionado para ' + val + 'x' + val);
            });
            
            document.getElementById('tw-map-goto')?.addEventListener('click', () => {
                const input = document.getElementById('tw-map-goto-coord').value;
                const match = input.match(/(\d+)\|(\d+)/);
                if (match && typeof TWMap !== 'undefined') {
                    const x = parseInt(match[1]);
                    const y = parseInt(match[2]);
                    if (TWMap.focusUserSpecified) {
                        TWMap.focusUserSpecified(x, y);
                    } else if (TWMap.map && TWMap.map.centerPos) {
                        TWMap.map.centerPos(x, y);
                    } else {
                        window.location.hash = `#${x};${y}`;
                    }
                    UI.showFeedback('Mapa centralizado em ' + x + '|' + y);
                }
            });
            
            document.getElementById('tw-add-player-mark')?.addEventListener('click', async () => {
                const name = document.getElementById('tw-mark-player').value.trim();
                const color = document.getElementById('tw-mark-player-color').value;
                if (name && this.addPlayerMarker(name, color)) {
                    this.refreshPanel();
                    UI.showFeedback('Jogador ' + name + ' marcado!');
                    await this.applyOverlay();
                }
            });
            
            document.getElementById('tw-add-tribe-mark')?.addEventListener('click', async () => {
                const tag = document.getElementById('tw-mark-tribe').value.trim();
                const color = document.getElementById('tw-mark-tribe-color').value;
                if (tag && this.addTribeMarker(tag, color)) {
                    this.refreshPanel();
                    UI.showFeedback('Tribo [' + tag + '] marcada!');
                    await this.applyOverlay();
                }
            });
            
            document.querySelectorAll('.tw-remove-player').forEach(btn => {
                btn.onclick = async () => {
                    this.removePlayerMarker(btn.dataset.name);
                    this.refreshPanel();
                    await this.applyOverlay();
                };
            });
            document.querySelectorAll('.tw-remove-tribe').forEach(btn => {
                btn.onclick = async () => {
                    this.removeTribeMarker(btn.dataset.tag);
                    this.refreshPanel();
                    await this.applyOverlay();
                };
            });
            
            document.getElementById('tw-map-apply-markers')?.addEventListener('click', async () => {
                UI.showFeedback('⏳ Carregando dados e destacando nativamente...');
                await this.applyOverlay();
                UI.showFeedback('Marcações aplicadas com sucesso!');
            });
        },
        
        refreshPanel() {
            const panel = document.getElementById('tw-panel-mapEnhancer');
            if (panel) {
                panel.innerHTML = this.buildHTML();
                this.bindEvents();
            }
        }
    };

    // ═══════════════════════════════════════════════════
    // 🌾 FARM SCHEDULER (Agendador de Farm automático)
    // ═══════════════════════════════════════════════════
    
    const FarmScheduler = {
        KEY: 'tw_farm_scheduler',
        timers: {},
        
        get config() {
            try { return JSON.parse(localStorage.getItem(this.KEY)) || { targets: [], interval: 60, radius: 15, template: 'a', running: false }; }
            catch { return { targets: [], interval: 60, radius: 15, template: 'a', running: false }; }
        },
        
        save(data) {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        },
        
        addTarget(x, y) {
            const cfg = this.config;
            const key = `${x}|${y}`;
            if (cfg.targets.find(t => t.key === key)) return false;
            cfg.targets.push({ key, x, y, active: true, lastSent: null, status: 'pendente' });
            this.save(cfg);
            return true;
        },
        
        removeTarget(key) {
            const cfg = this.config;
            cfg.targets = cfg.targets.filter(t => t.key !== key);
            this.save(cfg);
        },
        
        async sendFarm(target) {
            // Verifica se o Assistente de Saque está disponível (requer Premium)
            if (!TW.hasFarmAssistant) {
                return { ok: false, error: TW.canHaveFarmAssistant ? 'Ative o Assistente de Saque (Premium)' : 'Assistente de Saque indisponível neste mundo' };
            }
            const vid = TW.villageId;
            const h = typeof game_data !== 'undefined' ? game_data.csrf : TW.csrf;
            if (!h || !vid) return { ok: false, error: 'Dados do jogo não disponíveis' };
            
            try {
                const villageId = await this.getVillageId(target.x, target.y);
                if (!villageId) return { ok: false, error: 'Aldeia não encontrada' };
                
                const cfg = this.config;
                
                let url;
                if (typeof TWMap !== 'undefined' && TWMap.urls && TWMap.urls.ctx) {
                    const farmUrl = cfg.template === 'b' ? TWMap.urls.ctx.mp_farm_b : TWMap.urls.ctx.mp_farm_a;
                    if (farmUrl) {
                        url = farmUrl
                            .replace('__village__', villageId)
                            .replace('__source__', vid)
                            .replace(/h=[a-f0-9]+/, `h=${h}`);
                    }
                }
                
                if (!url) {
                    const templateId = cfg.template === 'b' ? '3178' : '3177';
                    url = `/game.php?village=${vid}&screen=am_farm&mode=farm&ajaxaction=farm&template_id=${templateId}&target=${villageId}&source=${vid}&json=1&h=${h}`;
                }
                
                const resp = await fetch(url, {
                    method: 'GET',
                    credentials: 'same-origin'
                });
                
                let data;
                try {
                    data = await resp.json();
                } catch {
                    return { ok: false, error: 'CSRF expirado - recarregue a página' };
                }
                
                const updCfg = this.config;
                const t = updCfg.targets.find(t => t.key === target.key);
                if (t) {
                    t.lastSent = new Date().toLocaleTimeString('pt-BR');
                    if (data.error) {
                        t.status = `❌ ${typeof data.error === 'string' ? data.error : 'Erro'}`;
                    } else if (data.response && data.response.error) {
                        t.status = `❌ ${data.response.error}`;
                    } else {
                        t.status = '✅ Enviado';
                    }
                }
                this.save(updCfg);
                
                return { ok: !data.error, data };
            } catch (e) {
                return { ok: false, error: e.message };
            }
        },
        
        async getVillageId(x, y) {
            try {
                const villages = await WorldData.fetchVillages();
                const found = villages.find(v => v.x == x && v.y == y);
                return found ? found.id : null;
            } catch (e) {
                console.warn('[TW Toolkit] Erro ao buscar village ID:', e);
                return null;
            }
        },
        
        startAll() {
            // Verifica premium antes de iniciar
            if (!TW.hasFarmAssistant) {
                UI.showFeedback(TW.canHaveFarmAssistant ? '❌ Auto Farm requer Assistente de Saque! Ative nas Subscrições Premium.' : '❌ Assistente de Saque indisponível neste mundo.');
                return;
            }
            const cfg = this.config;
            cfg.running = true;
            this.save(cfg);
            
            this.stopAll(false);
            
            cfg.targets.filter(t => t.active).forEach(target => {
                this.timers[target.key] = setInterval(async () => {
                    await this.sendFarm(target);
                    this.refreshPanel();
                }, cfg.interval * 60 * 1000);
                
                this.sendFarm(target).then(() => this.refreshPanel());
            });
        },
        
        stopAll(persist = true) {
            Object.values(this.timers).forEach(t => clearInterval(t));
            this.timers = {};
            if (persist) {
                const cfg = this.config;
                cfg.running = false;
                this.save(cfg);
            }
        },
        
        buildHTML() {
            const cfg = this.config;
            const radiusVal = cfg.radius || 15;
            const targetRows = cfg.targets.map(t =>
                `<tr>
                    <td><input type="checkbox" class="tw-farm-toggle" data-key="${t.key}" ${t.active ? 'checked' : ''}></td>
                    <td>${t.key}</td>
                    <td>${t.lastSent || '--'}</td>
                    <td style="font-size:10px">${t.status}</td>
                    <td><button class="tw-btn-small tw-farm-remove" data-key="${t.key}">🗑️</button></td>
                </tr>`
            ).join('') || '<tr><td colspan="5" style="color:#666;font-style:italic">Nenhum alvo adicionado</td></tr>';
            
            return `
                <div class="tw-section">
                    <h3 class="tw-section-title">⚙️ Configuração</h3>
                    <div style="display:flex;gap:8px;align-items:center;margin:6px 0;flex-wrap:wrap">
                        <label>Intervalo: <input type="number" id="tw-farm-interval" value="${cfg.interval}" min="5" max="480" style="width:45px;padding:3px;background:#1a0a00;border:1px solid #5a3a1a;color:#ffd700;border-radius:4px"> min</label>
                        <label>Raio de Busca: <input type="number" id="tw-farm-radius" value="${radiusVal}" min="1" max="50" style="width:45px;padding:3px;background:#1a0a00;border:1px solid #5a3a1a;color:#ffd700;border-radius:4px"> campos</label>
                        <label>Modelo: <select id="tw-farm-template" style="padding:3px;background:#1a0a00;border:1px solid #5a3a1a;color:#ffd700;border-radius:4px">
                            <option value="a" ${cfg.template === 'a' ? 'selected' : ''}>A (Lanc+Esp+Expl)</option>
                            <option value="b" ${cfg.template === 'b' ? 'selected' : ''}>B (Expl+CL)</option>
                        </select></label>
                    </div>
                </div>
                <div class="tw-section">
                    <h3 class="tw-section-title">🎯 Alvos</h3>
                    <div style="display:flex;gap:6px;margin:6px 0">
                        <input type="text" id="tw-farm-coords" placeholder="Ex: 392|276 ou várias coords" style="flex:1;padding:5px;background:#1a0a00;border:1px solid #5a3a1a;color:#f0e0c0;border-radius:4px">
                        <button class="tw-btn" id="tw-farm-add">+</button>
                    </div>
                    <div style="margin:6px 0;display:flex;gap:6px;align-items:center">
                        <button class="tw-btn" id="tw-farm-auto-find" style="width:100%">🏴‍☠️ Buscar Bárbaras Próximas (Raio: ${radiusVal} campos)</button>
                    </div>
                    <table class="tw-table" style="width:100%">
                        <thead><tr><th>✓</th><th>Coord</th><th>Último</th><th>Status</th><th></th></tr></thead>
                        <tbody>${targetRows}</tbody>
                    </table>
                </div>
                <div style="display:flex;gap:6px;margin-top:8px">
                    <button class="tw-btn" id="tw-farm-start" style="flex:1;${cfg.running ? 'background:linear-gradient(180deg,#006600,#004400)' : ''}" ${!TW.hasFarmAssistant ? 'title="Requer Assistente de Saque (Premium)"' : ''}>
                        ${cfg.running ? '🟢 Rodando...' : '▶ Iniciar Farm'}
                    </button>
                    <button class="tw-btn" id="tw-farm-stop" style="flex:1">⏸ Parar</button>
                </div>
                ${!TW.hasFarmAssistant ? 
                    (TW.canHaveFarmAssistant ? 
                        '<div style="background:#5a4a1a;border:1px solid #ffd700;border-radius:5px;padding:8px;margin-top:8px;font-size:11px;color:#ffe066">🔒 <strong>Assistente de Saque inativo!</strong><br>O Auto Farm usa o Assistente de Saque do jogo. <a href="' + TW.linkBase + 'premium&mode=use" style="color:#ffd700;text-decoration:underline">Ative nas Subscrições Premium</a>.</div>' :
                        '<div style="background:#3a3a3a;border:1px solid #888;border-radius:5px;padding:8px;margin-top:8px;font-size:11px;color:#aaa">ℹ️ Assistente de Saque não está disponível neste mundo.</div>'
                    ) :
                    '<p style="font-size:10px;color:#666;margin-top:6px">⚠️ Funciona apenas com o jogo aberto. Usa o Assistente de Saque do jogo.</p>'
                }
            `;
        },
        
        bindEvents() {
            document.getElementById('tw-farm-add')?.addEventListener('click', () => {
                const input = document.getElementById('tw-farm-coords').value;
                const coords = input.match(/\d+\|\d+/g);
                if (coords) {
                    coords.forEach(c => {
                        const [x, y] = c.split('|').map(Number);
                        this.addTarget(x, y);
                    });
                    document.getElementById('tw-farm-coords').value = '';
                    this.refreshPanel();
                    UI.showFeedback(coords.length + ' alvo(s) adicionado(s)');
                }
            });
            
            document.getElementById('tw-farm-radius')?.addEventListener('change', (e) => {
                const cfg = this.config;
                cfg.radius = parseInt(e.target.value) || 15;
                this.save(cfg);
                this.refreshPanel();
            });
            
            document.getElementById('tw-farm-auto-find')?.addEventListener('click', async () => {
                const cfg = this.config;
                const radius = cfg.radius || 15;
                const btn = document.getElementById('tw-farm-auto-find');
                if (btn) { btn.disabled = true; btn.textContent = '⏳ Buscando bárbaras...'; }
                UI.showFeedback(`📡 Buscando bárbaras num raio de ${radius} campos...`);
                
                try {
                    const cx = TW.village.x || 0;
                    const cy = TW.village.y || 0;
                    const farms = await WorldData.findBarbarians(cx, cy, radius, 3000, 50);
                    
                    if (farms && farms.length > 0) {
                        let addedCount = 0;
                        farms.forEach(f => {
                            if (this.addTarget(f.x, f.y)) addedCount++;
                        });
                        this.refreshPanel();
                        UI.showFeedback(`✅ ${addedCount} nova(s) bárbara(s) adicionada(s) aos Alvos (Raio: ${radius})!`);
                    } else {
                        UI.showFeedback(`Nenhuma bárbara encontrada num raio de ${radius} campos.`);
                        if (btn) { btn.disabled = false; btn.textContent = `🏴‍☠️ Buscar Bárbaras Próximas (Raio: ${radius} campos)`; }
                    }
                } catch (e) {
                    UI.showFeedback('❌ Erro ao buscar bárbaras: ' + e.message);
                    if (btn) { btn.disabled = false; btn.textContent = `🏴‍☠️ Buscar Bárbaras Próximas (Raio: ${radius} campos)`; }
                }
            });
            
            document.getElementById('tw-farm-interval')?.addEventListener('change', (e) => {
                const cfg = this.config;
                cfg.interval = parseInt(e.target.value) || 60;
                this.save(cfg);
            });
            
            document.getElementById('tw-farm-template')?.addEventListener('change', (e) => {
                const cfg = this.config;
                cfg.template = e.target.value;
                this.save(cfg);
            });
            
            document.getElementById('tw-farm-start')?.addEventListener('click', () => {
                this.startAll();
                this.refreshPanel();
                UI.showFeedback('Auto Farm ATIVO!');
            });
            
            document.getElementById('tw-farm-stop')?.addEventListener('click', () => {
                this.stopAll();
                this.refreshPanel();
                UI.showFeedback('Auto Farm parado.');
            });
            
            document.querySelectorAll('.tw-farm-remove').forEach(btn => {
                btn.onclick = () => { this.removeTarget(btn.dataset.key); this.refreshPanel(); };
            });
            
            document.querySelectorAll('.tw-farm-toggle').forEach(cb => {
                cb.onchange = () => {
                    const cfg = this.config;
                    const t = cfg.targets.find(t => t.key === cb.dataset.key);
                    if (t) { t.active = cb.checked; this.save(cfg); }
                };
            });
        },
        
        refreshPanel() {
            const panel = document.getElementById('tw-panel-farmScheduler');
            if (panel) {
                panel.innerHTML = this.buildHTML();
                this.bindEvents();
            }
        },
        
        resume() {
            const cfg = this.config;
            if (cfg.running) {
                // Só retoma se o Assistente de Saque ainda estiver disponível
                if (!TW.hasFarmAssistant) {
                    cfg.running = false;
                    this.save(cfg);
                    console.warn('[TW Toolkit] Auto Farm parado: Assistente de Saque não está ativo.');
                    return;
                }
                setTimeout(() => this.startAll(), 3000);
            }
        }
    };

    // ═══════════════════════════════════════════════════
    // 🏗️ BUILD QUEUE (Fila de Construção Automática)
    // ═══════════════════════════════════════════════════
    
    const BuildQueue = {
        KEY: 'tw_build_queue',
        checkTimer: null,
        
        get config() {
            try { return JSON.parse(localStorage.getItem(this.KEY)) || { queue: [], running: false, log: [], checkInterval: 30 }; }
            catch { return { queue: [], running: false, log: [], checkInterval: 30 }; }
        },
        
        save(data) {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        },
        
        addToQueue(building, targetLevel) {
            const cfg = this.config;
            cfg.queue.push({ building, targetLevel: parseInt(targetLevel), status: 'aguardando' });
            this.save(cfg);
        },
        
        removeFromQueue(index) {
            const cfg = this.config;
            cfg.queue.splice(index, 1);
            this.save(cfg);
        },
        
        addLog(msg) {
            const cfg = this.config;
            const time = new Date().toLocaleTimeString('pt-BR');
            cfg.log.unshift(`[${time}] ${msg}`);
            if (cfg.log.length > 20) cfg.log = cfg.log.slice(0, 20);
            this.save(cfg);
        },
        
        async checkAndBuild() {
            const cfg = this.config;
            if (!cfg.running || !cfg.queue.length) return;
            
            try {
                const vid = TW.villageId;
                
                // Busca página do edifício principal
                const resp = await fetch(`/game.php?village=${vid}&screen=main`, { credentials: 'same-origin' });
                const html = await resp.text();
                
                // Extrai CSRF mais recente diretamente do HTML baixado
                const csrfMatch = html.match(/csrf_token\s*=\s*['"]([a-f0-9]+)['"]/i) || 
                                  html.match(/csrf['"]\s*:\s*['"]([a-f0-9]+)['"]/i) ||
                                  html.match(/h=([a-f0-9]+)/i);
                const h = csrfMatch ? csrfMatch[1] : (typeof game_data !== 'undefined' ? game_data.csrf : TW.csrf);
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // 1. Verifica se a fila de construção está cheia
                const buildQueue = doc.querySelector('#buildqueue');
                if (buildQueue) {
                    const queueItems = buildQueue.querySelectorAll('tr.buildorder_building, tr[class*="buildorder"], tr[id^="buildorder_"]');
                    if (queueItems.length >= 2) {
                        const nextItem = cfg.queue[0];
                        if (nextItem) { nextItem.status = '⏳ Fila cheia (2/2)'; this.save(cfg); }
                        this.refreshPanel();
                        return;
                    }
                }
                
                // Pega próximo item da fila
                const next = cfg.queue[0];
                if (!next) return;
                
                const bRow = doc.querySelector(`#main_buildrow_${next.building}`);
                
                // 2. Verifica se a aldeia já possui o nível desejado
                let currentLevel = 0;
                if (bRow) {
                    const lvlEl = bRow.querySelector('.building_level, td:nth-child(2)');
                    if (lvlEl) {
                        const txt = lvlEl.textContent.trim();
                        const match = txt.match(/(\d+)/);
                        if (match) currentLevel = parseInt(match[1]);
                    }
                } else if (typeof game_data !== 'undefined' && game_data.village && game_data.village.buildings) {
                    currentLevel = parseInt(game_data.village.buildings[next.building]) || 0;
                }
                
                if (currentLevel >= next.targetLevel) {
                    const buildName = TW.buildings[next.building]?.name || next.building;
                    this.addLog(`✅ ${buildName} já está no Nv.${currentLevel} (Alvo: ${next.targetLevel})`);
                    cfg.queue.shift();
                    this.save(cfg);
                    this.refreshPanel();
                    return;
                }
                
                // 3. Procura o link de construção (upgrade_building)
                let buildUrl = null;
                if (bRow) {
                    const linkEl = bRow.querySelector('a.btn-build, a.main_buildlink, a[href*="action=upgrade_building"]');
                    if (linkEl) {
                        buildUrl = linkEl.getAttribute('href');
                    } else {
                        // Se botão está desabilitado (sem recursos, armazém cheio, fazenda cheia)
                        const disabledBtn = bRow.querySelector('.btn-disabled, .inactive, .main_buildlink_disabled');
                        if (disabledBtn) {
                            const reason = disabledBtn.textContent.trim() || 'Sem recursos/requisitos';
                            next.status = `⚠️ ${reason}`;
                            this.save(cfg);
                            this.refreshPanel();
                            return;
                        }
                    }
                }
                
                // Fallback: procura na página inteira por links de upgrade do edifício
                if (!buildUrl) {
                    const allLinks = doc.querySelectorAll('a[href*="action=upgrade_building"]');
                    for (const link of allLinks) {
                        const href = link.getAttribute('href');
                        if (href && (href.includes(`id=${next.building}`) || href.includes(`id=${next.building}&`))) {
                            buildUrl = href;
                            break;
                        }
                    }
                }
                
                // Fallback final: monta URL manualmente com CSRF atualizado
                if (!buildUrl) {
                    buildUrl = `/game.php?village=${vid}&screen=main&action=upgrade_building&id=${next.building}&force=1&h=${h}`;
                }
                
                // Garante formatação correta da URL
                if (!buildUrl.startsWith('/') && !buildUrl.startsWith('http')) {
                    buildUrl = '/' + buildUrl;
                }
                buildUrl = buildUrl.replace(/&amp;/g, '&');
                if (!buildUrl.includes('h=')) {
                    buildUrl += `&h=${h}`;
                } else {
                    buildUrl = buildUrl.replace(/h=[a-f0-9]+/, `h=${h}`);
                }
                
                // 4. Executa a requisição de construção
                const buildResp = await fetch(buildUrl, { 
                    credentials: 'same-origin',
                    redirect: 'follow'
                });
                
                if (buildResp.ok) {
                    const buildName = TW.buildings[next.building]?.name || next.building;
                    this.addLog(`🚀 ${buildName} iniciada (Nv.${currentLevel + 1})`);
                    next.status = '🟢 Em andamento';
                    this.save(cfg);
                    
                    // Se o próximo nível após este upgrade for atingir o alvo, remove da fila
                    if (currentLevel + 1 >= next.targetLevel) {
                        const currentCfg = this.config;
                        currentCfg.queue.shift();
                        this.save(currentCfg);
                    }
                } else {
                    next.status = '❌ Erro ' + buildResp.status;
                    this.save(cfg);
                }
                
                this.refreshPanel();
            } catch (e) {
                this.addLog(`❌ Erro: ${e.message}`);
            }
        },
        
        start() {
            const cfg = this.config;
            cfg.running = true;
            this.save(cfg);
            
            this.stop(false);
            this.checkTimer = setInterval(() => this.checkAndBuild(), cfg.checkInterval * 1000);
            this.checkAndBuild(); // Checa imediatamente
        },
        
        stop(persist = true) {
            if (this.checkTimer) clearInterval(this.checkTimer);
            this.checkTimer = null;
            if (persist) {
                const cfg = this.config;
                cfg.running = false;
                this.save(cfg);
            }
        },
        
        buildHTML() {
            const cfg = this.config;
            const buildingOptions = Object.entries(TW.buildings).map(([k, v]) => 
                `<option value="${k}">${v.name}</option>`
            ).join('');
            
            const queueRows = cfg.queue.map((q, i) =>
                `<tr>
                    <td>${i + 1}</td>
                    <td>${TW.buildings[q.building]?.name || q.building}</td>
                    <td>→ Nv.${q.targetLevel}</td>
                    <td style="font-size:10px">${q.status}</td>
                    <td>
                        <button class="tw-btn-small tw-bq-remove" data-idx="${i}">🗑️</button>
                    </td>
                </tr>`
            ).join('') || '<tr><td colspan="5" style="color:#666;font-style:italic">Fila vazia</td></tr>';
            
            const logHtml = cfg.log.slice(0, 8).map(l => `<div style="font-size:10px;color:#a08060;padding:2px 0;border-bottom:1px solid #2a1808">${l}</div>`).join('');
            
            return `
                <div class="tw-section">
                    <h3 class="tw-section-title">➕ Adicionar à Fila</h3>
                    <div style="display:flex;gap:6px;margin:6px 0;align-items:center;flex-wrap:wrap">
                        <select id="tw-bq-building" style="flex:1;padding:5px;background:#1a0a00;border:1px solid #5a3a1a;color:#ffd700;border-radius:4px">
                            ${buildingOptions}
                        </select>
                        <label>Nível: <input type="number" id="tw-bq-level" value="20" min="1" max="30" style="width:45px;padding:3px;background:#1a0a00;border:1px solid #5a3a1a;color:#ffd700;border-radius:4px"></label>
                        <button class="tw-btn" id="tw-bq-add">+</button>
                    </div>
                </div>
                <div class="tw-section">
                    <h3 class="tw-section-title">📋 Fila (${cfg.queue.length} itens)</h3>
                    <table class="tw-table" style="width:100%">
                        <thead><tr><th>#</th><th>Edifício</th><th>Alvo</th><th>Status</th><th></th></tr></thead>
                        <tbody>${queueRows}</tbody>
                    </table>
                </div>
                <div style="display:flex;gap:6px;margin-top:8px">
                    <button class="tw-btn" id="tw-bq-start" style="flex:1;${cfg.running ? 'background:linear-gradient(180deg,#006600,#004400)' : ''}">
                        ${cfg.running ? '🟢 Monitorando...' : '▶ Iniciar'}
                    </button>
                    <button class="tw-btn" id="tw-bq-stop" style="flex:1">⏸ Parar</button>
                    <button class="tw-btn" id="tw-bq-check" style="flex:1">🔄 Checar Agora</button>
                </div>
                <div class="tw-section" style="margin-top:8px">
                    <h3 class="tw-section-title">📜 Log</h3>
                    <div style="max-height:100px;overflow-y:auto">${logHtml || '<div style="color:#666;font-size:10px">Nenhuma ação registrada</div>'}</div>
                </div>
                <p style="font-size:10px;color:#666;margin-top:4px">⚠️ Checa a cada ${cfg.checkInterval}s. Funciona com o jogo aberto.</p>
            `;
        },
        
        bindEvents() {
            document.getElementById('tw-bq-add')?.addEventListener('click', () => {
                const building = document.getElementById('tw-bq-building').value;
                const level = document.getElementById('tw-bq-level').value;
                this.addToQueue(building, level);
                this.refreshPanel();
                UI.showFeedback(`${TW.buildings[building]?.name || building} Nv.${level} adicionado à fila!`);
            });
            
            document.getElementById('tw-bq-start')?.addEventListener('click', () => {
                this.start();
                this.refreshPanel();
                UI.showFeedback('Auto Build ATIVO! Monitorando...');
            });
            
            document.getElementById('tw-bq-stop')?.addEventListener('click', () => {
                this.stop();
                this.refreshPanel();
                UI.showFeedback('Auto Build parado.');
            });
            
            document.getElementById('tw-bq-check')?.addEventListener('click', () => {
                this.checkAndBuild();
                UI.showFeedback('Verificando fila...');
            });
            
            document.querySelectorAll('.tw-bq-remove').forEach(btn => {
                btn.onclick = () => { this.removeFromQueue(parseInt(btn.dataset.idx)); this.refreshPanel(); };
            });
        },
        
        refreshPanel() {
            const panel = document.getElementById('tw-panel-buildQueue');
            if (panel) {
                panel.innerHTML = this.buildHTML();
                this.bindEvents();
            }
        },
        
        resume() {
            const cfg = this.config;
            if (cfg.running) {
                setTimeout(() => this.start(), 5000);
            }
        }
    };

    // ═══════════════════════════════════════════════════
    // 🏰 TREM DE NOBRES (Noble Train)
    // ═══════════════════════════════════════════════════
    
    const NobleTrain = {
        KEY: 'tw_toolkit_noble_train',
        
        get config() {
            try { return JSON.parse(localStorage.getItem(this.KEY)) || this.defaultConfig(); }
            catch { return this.defaultConfig(); }
        },
        
        defaultConfig() {
            return {
                targetX: '',
                targetY: '',
                delayMs: 200,
                waves: [
                    { label: 'Onda 1 (Limpeza + Nobre)', troops: { spear: 0, sword: 0, axe: 0, archer: 0, spy: 0, light: 0, marcher: 0, heavy: 0, ram: 0, catapult: 0, knight: 0, snob: 1 }},
                    { label: 'Onda 2 (Nobre)', troops: { spear: 0, sword: 0, axe: 0, archer: 0, spy: 0, light: 0, marcher: 0, heavy: 0, ram: 0, catapult: 0, knight: 0, snob: 1 }},
                    { label: 'Onda 3 (Nobre)', troops: { spear: 0, sword: 0, axe: 0, archer: 0, spy: 0, light: 0, marcher: 0, heavy: 0, ram: 0, catapult: 0, knight: 0, snob: 1 }},
                    { label: 'Onda 4 (Nobre)', troops: { spear: 0, sword: 0, axe: 0, archer: 0, spy: 0, light: 0, marcher: 0, heavy: 0, ram: 0, catapult: 0, knight: 0, snob: 1 }}
                ],
                log: []
            };
        },
        
        init() {
            this.injectOnConfirmPage();
            this.bindEvents();
        },

        injectOnConfirmPage() {
            const form = document.getElementById('command-data-form');
            if (!form) return;
            if (document.getElementById('tw-nt-confirm-widget')) return;

            const submitBtn = document.getElementById('troop_confirm_submit');
            if (!submitBtn) return;

            const widget = document.createElement('div');
            widget.id = 'tw-nt-confirm-widget';
            widget.style.cssText = `
                margin: 10px 0;
                padding: 10px 14px;
                background: linear-gradient(135deg, #1f0a00 0%, #0d0400 100%);
                border: 2px solid #ffd700;
                border-radius: 6px;
                color: #f0e0c0;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                font-family: Verdana, Arial, sans-serif;
            `;

            const defaultDelay = this.config.delayMs || 200;

            widget.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;border-bottom:1px solid #5a3a1a;padding-bottom:6px">
                    <strong style="color:#ffd700;font-size:13px;display:flex;align-items:center;gap:6px">
                        🏰 Trem de Nobres Instantâneo (Ondas Automáticas)
                    </strong>
                    <span style="font-size:11px;color:#a08060">Delay: <b style="color:#ffd700">${defaultDelay}ms</b></span>
                </div>
                <div style="display:flex;gap:10px;align-items:center">
                    <button id="tw-nt-instant-fire-btn" type="button" style="flex:1;padding:8px 12px;background:linear-gradient(to bottom, #d9822b, #b86014);border:1px solid #8c4405;color:#fff;font-weight:bold;font-size:12px;border-radius:4px;cursor:pointer">
                        🚀 Disparar Trem (4 Ondas de Nobre)
                    </button>
                </div>
                <div id="tw-nt-instant-info" style="font-size:10px;color:#a08060;margin-top:6px">
                    ℹ️ Dispara as 4 ondas do Trem de Nobres sequencialmente com ${defaultDelay}ms de intervalo.
                </div>
            `;

            form.insertBefore(widget, form.firstChild);

            document.getElementById('tw-nt-instant-fire-btn').onclick = (e) => {
                e.preventDefault();
                this.fireInstantTrainFromConfirmPage();
            };
        },

        async fireInstantTrainFromConfirmPage() {
            const form = document.getElementById('command-data-form');
            const submitBtn = document.getElementById('troop_confirm_submit');
            
            if (!form || !submitBtn) {
                UI.showNotification('❌ Formulário de confirmação não encontrado!', 'error');
                return;
            }

            const targetLink = document.querySelector('#command-data-form a[href*="screen=info_village"]');
            let targetX = '', targetY = '';
            if (targetLink) {
                const match = targetLink.innerText.match(/(\d+)\|(\d+)/);
                if (match) {
                    targetX = match[1];
                    targetY = match[2];
                }
            }

            const cfg = this.config;
            if (targetX && targetY) {
                cfg.targetX = targetX;
                cfg.targetY = targetY;
            }

            const btn = document.getElementById('tw-nt-instant-fire-btn');
            if (btn) { btn.disabled = true; btn.innerText = '⏳ Disparando Ondas...'; }

            UI.showNotification(`🚀 Disparando Trem de Nobres...`, 'info');

            let successCount = 0;

            // Onda 1: Clica no botão nativo da página
            console.log('[TW Toolkit] 🏰 Disparando Onda 1 via clique nativo no formulário...');
            submitBtn.click();
            successCount++;
            this.addLog(`✅ Onda 1 (Confirmação Nativa) enviada.`);

            // Ondas de fundo (2, 3, 4...)
            for (let i = 1; i < cfg.waves.length; i++) {
                const wave = cfg.waves[i];
                if (cfg.delayMs > 0) {
                    await new Promise(r => setTimeout(r, cfg.delayMs));
                }

                try {
                    const result = await this.sendWave(wave, cfg.targetX, cfg.targetY, TW.villageId, TW.csrf);
                    if (result.ok) {
                        successCount++;
                        this.addLog(`✅ Onda ${i + 1} enviada.`);
                    } else {
                        this.addLog(`❌ Onda ${i + 1}: ${result.error}`);
                    }
                } catch (e) {
                    this.addLog(`❌ Onda ${i + 1}: ${e.message}`);
                }
            }

            UI.showNotification(`🏰 Trem de Nobres finalizado: ${successCount}/${cfg.waves.length} ondas enviadas!`, 'success');
        },

        async sendWave(wave, targetX, targetY, vid, h) {
            const csrfToken = h || (typeof game_data !== 'undefined' ? game_data.csrf : TW.csrf);
            
            // Submete via formulário HTML real criado em iframe oculto para simular submissão do browser
            return new Promise((resolve) => {
                try {
                    const iframe = document.createElement('iframe');
                    iframe.name = 'tw_nt_frame_' + Date.now() + '_' + Math.random();
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);

                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = `/game.php?village=${vid}&screen=place&try=confirm`;
                    form.target = iframe.name;

                    const params = {
                        x: targetX,
                        y: targetY,
                        attack: 'Atacar',
                        target_type: 'coord',
                        h: csrfToken
                    };

                    const unitOrder = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'];
                    unitOrder.forEach(u => {
                        params[u] = wave.troops[u] || 0;
                    });

                    Object.entries(params).forEach(([k, v]) => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = k;
                        input.value = v;
                        form.appendChild(input);
                    });

                    document.body.appendChild(form);

                    let step = 1;
                    iframe.onload = () => {
                        try {
                            const frameDoc = iframe.contentDocument || iframe.contentWindow.document;
                            if (!frameDoc) {
                                cleanup();
                                resolve({ ok: false, error: 'Sem acesso ao frame' });
                                return;
                            }

                            if (step === 1) {
                                // Passo 1 concluído: formulário de confirmação carregou no iframe
                                const confirmForm = frameDoc.querySelector('#command-data-form, form[action*="screen=place"]');
                                const errorBox = frameDoc.querySelector('.error_box, .error, .info_box.error');
                                
                                if (errorBox) {
                                    const errText = errorBox.innerText.trim();
                                    cleanup();
                                    resolve({ ok: false, error: errText });
                                    return;
                                }

                                if (!confirmForm) {
                                    cleanup();
                                    resolve({ ok: false, error: 'Formulário de confirmação não retornado' });
                                    return;
                                }

                                step = 2;
                                const submitBtn = frameDoc.getElementById('troop_confirm_submit') || frameDoc.querySelector('input[type="submit"], button[type="submit"]');
                                if (submitBtn) {
                                    submitBtn.click();
                                } else {
                                    confirmForm.submit();
                                }
                            } else if (step === 2) {
                                // Passo 2 concluído: confirmação enviada
                                const sendErr = frameDoc.querySelector('.error_box, .error, .info_box.error');
                                if (sendErr) {
                                    const errText = sendErr.innerText.trim();
                                    cleanup();
                                    resolve({ ok: false, error: errText });
                                    return;
                                }

                                cleanup();
                                resolve({ ok: true });
                            }
                        } catch (e) {
                            cleanup();
                            resolve({ ok: true }); // Ignora erro de cross-origin pós navegação
                        }
                    };

                    const cleanup = () => {
                        setTimeout(() => {
                            try { form.remove(); iframe.remove(); } catch(e) {}
                        }, 1000);
                    };

                    form.submit();
                } catch (e) {
                    resolve({ ok: false, error: e.message });
                }
            });
        },
        
        refreshPanel() {
            const panel = document.getElementById('tw-panel-nobleTrain');
            if (panel) {
                panel.innerHTML = this.buildHTML();
                this.bindEvents();
            }
        }
    };

    // ═══════════════════════════════════════════════════
    // 🎯 COMMAND SNIPER (Timer de Milissegundo)
    // ═══════════════════════════════════════════════════
    
    const CommandSniper = {
        KEY: 'tw_toolkit_sniper',
        timerId: null,

        get config() {
            try { return JSON.parse(localStorage.getItem(this.KEY)) || { offset: -250, log: [] }; }
            catch { return { offset: -250, log: [] }; }
        },

        save(cfg) {
            try { localStorage.setItem(this.KEY, JSON.stringify(cfg)); } catch(e) {}
        },

        init() {
            this.injectOnConfirmPage();
            this.bindEvents();
        },

        injectOnConfirmPage() {
            const form = document.getElementById('command-data-form');
            if (!form) return;
            if (document.getElementById('tw-sniper-widget')) return;

            const submitBtn = document.getElementById('troop_confirm_submit');
            if (!submitBtn) return;

            let durationText = '';
            const durationTd = typeof jQuery !== 'undefined' 
                ? jQuery(form).find('td:contains("Duração:"), td:contains("Durações:"), td:contains("Duration:")').next()
                : null;
            if (durationTd && durationTd.length) {
                durationText = durationTd.text().trim();
            }

            const defaultOffset = this.config.offset !== undefined ? this.config.offset : -250;

            const widget = document.createElement('div');
            widget.id = 'tw-sniper-widget';
            widget.style.cssText = `
                margin: 10px 0 16px 0;
                padding: 12px 16px;
                background: linear-gradient(135deg, #2a1200 0%, #150800 100%);
                border: 2px solid #ff6b6b;
                border-radius: 6px;
                color: #f0e0c0;
                box-shadow: 0 4px 14px rgba(0,0,0,0.6);
                font-family: Verdana, Arial, sans-serif;
            `;

            widget.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;border-bottom:1px solid #5a3a1a;padding-bottom:6px">
                    <strong style="color:#ff6b6b;font-size:14px;display:flex;align-items:center;gap:6px">
                        🎯 Sniper de Comando (Milissegundos)
                    </strong>
                    <span style="font-size:11px;color:#a08060">Duração: <b style="color:#ffd700">${durationText || 'N/A'}</b></span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
                    <div>
                        <label style="font-size:11px;color:#a08060;display:block;margin-bottom:3px">Hora Alvo de Chegada (AAAA-MM-DD HH:MM:SS.mmm):</label>
                        <input type="datetime-local" id="tw-sniper-time" step="0.001" 
                            style="width:100%;padding:6px;background:#0d0500;border:1px solid #8a5a2a;color:#ffd700;border-radius:4px;font-size:12px">
                    </div>
                    <div>
                        <label style="font-size:11px;color:#a08060;display:block;margin-bottom:3px">Offset de Latência (ms):</label>
                        <div style="display:flex;gap:6px">
                            <input type="number" id="tw-sniper-offset" value="${defaultOffset}" step="10" 
                                style="width:100%;padding:6px;background:#0d0500;border:1px solid #8a5a2a;color:#ffd700;border-radius:4px;font-size:12px">
                            <button id="tw-sniper-preset-offset" class="tw-btn-small" type="button" style="white-space:nowrap" title="Salvar Offset como Padrão">💾 Padrão</button>
                        </div>
                    </div>
                </div>
                <div id="tw-sniper-info" style="font-size:11px;color:#c0a080;margin-bottom:10px;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;border:1px dashed #5a3a1a">
                    ℹ️ Defina o horário exato de chegada e clique em <b>Agendar Disparo</b>. O script enviará no milissegundo exato!
                </div>
                <div style="display:flex;gap:10px;align-items:center">
                    <button id="tw-sniper-start-btn" type="button" style="flex:1;padding:9px 14px;background:linear-gradient(to bottom, #d9534f, #c9302c);border:1px solid #ac2925;color:#fff;font-weight:bold;font-size:13px;border-radius:4px;cursor:pointer">
                        🎯 Agendar Disparo Sniper
                    </button>
                    <button id="tw-sniper-cancel-btn" type="button" style="display:none;padding:9px 14px;background:#555;border:1px solid #333;color:#fff;font-size:12px;border-radius:4px;cursor:pointer">
                        🚫 Cancelar Agendamento
                    </button>
                </div>
            `;

            form.insertBefore(widget, form.firstChild);
            this.setupWidgetEvents(durationText);
        },

        setupWidgetEvents(durationText) {
            const timeInput = document.getElementById('tw-sniper-time');
            const offsetInput = document.getElementById('tw-sniper-offset');
            const startBtn = document.getElementById('tw-sniper-start-btn');
            const cancelBtn = document.getElementById('tw-sniper-cancel-btn');
            const presetBtn = document.getElementById('tw-sniper-preset-offset');

            if (!timeInput || !startBtn) return;

            if (durationText && !timeInput.value) {
                const parts = durationText.split(':').map(Number);
                if (parts.length === 3) {
                    const durMs = ((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000;
                    const getServerTime = () => (typeof Timing !== 'undefined' && Timing.getCurrentServerTime) ? Timing.getCurrentServerTime() : Date.now();
                    const estimatedArrival = new Date(getServerTime() + durMs + 60000);
                    timeInput.value = this.dateToInputString(estimatedArrival);
                }
            }

            if (presetBtn) {
                presetBtn.onclick = (e) => {
                    e.preventDefault();
                    const val = parseInt(offsetInput.value) || -250;
                    const cfg = this.config;
                    cfg.offset = val;
                    this.save(cfg);
                    UI.showNotification(`💾 Offset padrão salvo como ${val}ms!`, 'success');
                };
            }

            startBtn.onclick = (e) => {
                e.preventDefault();
                this.startSniper(timeInput.value, parseInt(offsetInput.value) || -250, durationText);
            };

            cancelBtn.onclick = (e) => {
                e.preventDefault();
                this.stopSniper();
            };
        },

        dateToInputString(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');
            const ss = String(date.getSeconds()).padStart(2, '0');
            const ms = String(date.getMilliseconds()).padStart(3, '0');
            return `${y}-${m}-${d}T${hh}:${mm}:${ss}.${ms}`;
        },

        startSniper(targetTimeString, offsetMs, durationText) {
            if (!targetTimeString) {
                UI.showNotification('⚠️ Especifique a hora alvo de chegada!', 'warning');
                return;
            }

            const arrivalDate = new Date(targetTimeString);
            if (isNaN(arrivalDate.getTime())) {
                UI.showNotification('⚠️ Data/Hora inválida!', 'error');
                return;
            }

            const arrivalMs = arrivalDate.getTime();
            
            let durationMs = 0;
            if (durationText) {
                const parts = durationText.split(':').map(Number);
                if (parts.length === 3) {
                    durationMs = ((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000;
                }
            }

            const targetLaunchMs = arrivalMs - durationMs;
            const triggerMs = targetLaunchMs + offsetMs;

            const submitBtn = document.getElementById('troop_confirm_submit');
            if (!submitBtn) {
                UI.showNotification('❌ Botão de confirmação de ataque não encontrado!', 'error');
                return;
            }

            const startBtn = document.getElementById('tw-sniper-start-btn');
            const cancelBtn = document.getElementById('tw-sniper-cancel-btn');
            const infoDiv = document.getElementById('tw-sniper-info');

            startBtn.disabled = true;
            startBtn.style.opacity = '0.5';
            cancelBtn.style.display = 'inline-block';
            submitBtn.classList.add('btn-disabled');

            UI.showNotification('🎯 Agendamento ativado! Mantenha a aba aberta.', 'info');

            if (this.timerId) clearInterval(this.timerId);

            const getServerTime = () => (typeof Timing !== 'undefined' && Timing.getCurrentServerTime) ? Timing.getCurrentServerTime() : Date.now();

            this.timerId = setInterval(() => {
                const nowMs = getServerTime();
                const remaining = triggerMs - nowMs;

                if (infoDiv) {
                    const launchDate = new Date(targetLaunchMs);
                    const launchStr = launchDate.toLocaleTimeString('pt-BR') + '.' + String(launchDate.getMilliseconds()).padStart(3, '0');
                    
                    if (remaining > 0) {
                        const secLeft = (remaining / 1000).toFixed(2);
                        infoDiv.innerHTML = `
                            <div style="color:#ffd700;font-weight:bold;font-size:13px">
                                ⏳ Disparo para: <span style="color:#64b5f6">${launchStr}</span> | Offset: <b>${offsetMs}ms</b>
                            </div>
                            <div style="color:#ff6b6b;font-size:14px;margin-top:4px">
                                ⏱️ Contagem Regressiva: <b>${secLeft}s</b>
                            </div>
                        `;
                    } else {
                        infoDiv.innerHTML = `<span style="color:#81c784;font-size:14px;font-weight:bold">🚀 DISPARANDO COMANDO AGORA!</span>`;
                    }
                }

                if (remaining <= 0) {
                    clearInterval(this.timerId);
                    this.timerId = null;
                    submitBtn.classList.remove('btn-disabled');
                    console.log('[TW Toolkit] 🎯 Disparando comando via Sniper!');
                    submitBtn.click();
                }
            }, 10);
        },

        stopSniper() {
            if (this.timerId) {
                clearInterval(this.timerId);
                this.timerId = null;
            }

            const startBtn = document.getElementById('tw-sniper-start-btn');
            const cancelBtn = document.getElementById('tw-sniper-cancel-btn');
            const infoDiv = document.getElementById('tw-sniper-info');
            const submitBtn = document.getElementById('troop_confirm_submit');

            if (startBtn) {
                startBtn.disabled = false;
                startBtn.style.opacity = '1';
            }
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (submitBtn) submitBtn.classList.remove('btn-disabled');
            if (infoDiv) infoDiv.innerHTML = `ℹ️ Agendamento cancelado.`;

            UI.showNotification('🛑 Agendamento do Sniper cancelado.', 'info');
        },

        bindEvents() {
            const saveBtn = document.getElementById('tw-sniper-save-cfg');
            if (saveBtn) {
                saveBtn.onclick = () => {
                    const offsetVal = parseInt(document.getElementById('tw-sniper-tab-offset')?.value) || -250;
                    const cfg = this.config;
                    cfg.offset = offsetVal;
                    this.save(cfg);
                    UI.showNotification(`💾 Configurações salvas! Offset padrão: ${offsetVal}ms`, 'success');
                };
            }
        },

        buildHTML() {
            const cfg = this.config;
            return `
                <div class="tw-card">
                    <h3>🎯 Command Sniper (Milissegundos)</h3>
                    <p style="font-size:12px;color:#a08060;margin-bottom:12px">
                        O Sniper permite enviar ataques ou apoios no milissegundo exato para encaixar comandos (Snipes, NTs, Apoios após nobre) com precisão cirúrgica.
                    </p>

                    <div style="background:#1a0a00;border:1px solid #5a3a1a;padding:10px;border-radius:6px;margin-bottom:12px">
                        <h4 style="color:#ffd700;margin-bottom:6px">📋 Como Usar:</h4>
                        <ol style="font-size:11px;color:#f0e0c0;padding-left:20px;line-height:1.6">
                            <li>Vá até a <b>Praça de Armas</b> e envie um comando de ataque ou apoio.</li>
                            <li>Na tela de <b>Confirmação de Ataque</b>, a caixa do 🎯 <b>Sniper</b> aparecerá automaticamente no topo do formulário.</li>
                            <li>Informe a <b>Hora Alvo de Chegada</b> desejada (incluindo os milissegundos).</li>
                            <li>Ajuste o <b>Offset de Latência</b> (padrão <code>-250ms</code> compensa a latência do servidor).</li>
                            <li>Clique em <b>🎯 Agendar Disparo Sniper</b>. O toolkit disparará o comando no instante exato!</li>
                        </ol>
                    </div>

                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                        <div style="flex:1">
                            <label style="font-size:11px;color:#a08060">Offset de Latência Padrão (ms):</label>
                            <input type="number" id="tw-sniper-tab-offset" value="${cfg.offset !== undefined ? cfg.offset : -250}" step="10" 
                                style="width:100%;padding:5px;background:#0d0500;border:1px solid #8a5a2a;color:#ffd700;border-radius:3px;font-size:11px">
                        </div>
                        <button id="tw-sniper-save-cfg" class="tw-btn" style="margin-top:14px">💾 Salvar Configurações</button>
                        <a href="${TW.linkBase || '/game.php?screen='}place" class="tw-btn" style="margin-top:14px;text-decoration:none;display:inline-block;text-align:center">
                            🏰 Ir para Praça de Armas
                        </a>
                    </div>
                </div>
            `;
        }
    };

    // ═══════════════════════════════════════════════════
    // 🚀 INICIALIZAÇÃO (com restauração de estado)
    // ═══════════════════════════════════════════════════
    
    function init() {
        try {
            console.log('[TW Toolkit] init() chamada...');
            
            if (!TW.gameData) {
                // Se game_data ainda não carregou, tenta de novo em 500ms (máx 10x)
                if (!window.__TW_TOOLKIT_RETRIES__) window.__TW_TOOLKIT_RETRIES__ = 0;
                if (window.__TW_TOOLKIT_RETRIES__++ < 10) {
                    console.log('[TW Toolkit] game_data não encontrado, tentando novamente... (' + window.__TW_TOOLKIT_RETRIES__ + '/10)');
                    setTimeout(init, 500);
                    return;
                }
                console.warn('⚔️ Toolkit: game_data não encontrado. Certifique-se de estar na página do jogo.');
                return;
            }
            
            console.log('[TW Toolkit] game_data encontrado. Premium:', TW.isPremium, '| FarmAssistant:', TW.hasFarmAssistant);
            
            // Injeta botão flutuante (sempre visível)
            UI.injectFloatingButton();
            console.log('[TW Toolkit] Botão flutuante injetado.');
            
            // Injeta toolkit (inicialmente oculto)
            UI.inject();
            console.log('[TW Toolkit] Painel injetado.');
            
            // Ativa Resource HUD (overlay de recursos)
            ResourceHUD.inject();
            
            // Ativa atalhos de teclado
            Hotkeys.init();
            
            // Ativa novos módulos
            MapEnhancer.bindEvents();
            FarmScheduler.bindEvents();
            FarmScheduler.resume();
            BuildQueue.bindEvents();
            BuildQueue.resume();
            NobleTrain.init();
            CommandSniper.init();
            
            // Aplica tamanho salvo do mapa principal e marcações
            if (TW.screen === 'map') {
                const mapSize = MapEnhancer.settings.size;
                if (mapSize && mapSize !== 15) {
                    setTimeout(() => MapEnhancer.resizeMap(mapSize), 1000);
                }
                setTimeout(() => MapEnhancer.applyOverlay(), 1200);
            }
            
            // Restaura estado anterior: se estava aberto, abre novamente
            const wasOpen = State.isOpen;
            if (!wasOpen) {
                UI.toggle(false);
            }
            // Se estava aberto, UI.inject() já mostra e o bindEvents() restaura a aba
            
            console.log(`%c⚔️ ${TW.name} v${TW.version} carregado com sucesso!`, 
                'color: #ffd700; font-size: 16px; font-weight: bold; text-shadow: 0 0 5px rgba(255,215,0,0.5);');
            console.log(`%c👤 Jogador: ${TW.player.name} | 🏰 Aldeia: ${TW.village.name} (${TW.village.x}|${TW.village.y}) | Premium: ${TW.isPremium}`, 
                'color: #f0e0c0; font-size: 12px;');
            console.log('%c⌨️ Atalhos: Alt+T (toolkit) | Alt+F (farms) | Alt+P (planner) | Alt+S (sniper) | Alt+I (incomings) | Alt+H (HUD)',
                'color: #a08060; font-size: 11px;');
        } catch (e) {
            console.error('❌ [TW Toolkit] ERRO FATAL no init():', e);
            console.error('Stack:', e.stack);
            // Tenta pelo menos injetar o botão flutuante
            try { UI.injectFloatingButton(); } catch (e2) { console.error('❌ Falha no botão:', e2); }
        }
    }
    
    // Inicia o toolkit
    // Funciona com:
    // 1. Quickbar: javascript:$.getScript('URL') — game_data já disponível
    // 2. Tampermonkey: @run-at document-idle — DOM já carregado
    // 3. Console: colado manualmente — DOM já carregado
    console.log('[TW Toolkit] Script carregado. readyState:', document.readyState, '| URL:', window.location.href);
    
    // Verifica se estamos em uma página do jogo
    if (!window.location.pathname.includes('game.php')) {
        console.log('[TW Toolkit] Não é uma página do jogo (game.php). Abortando.');
        return;
    }
    
    // Se game_data já existe (Quickbar/Console), inicia imediatamente
    // Se não (Tampermonkey com timing ruim), o retry dentro de init() cuida
    if (typeof game_data !== 'undefined' || (typeof unsafeWindow !== 'undefined' && unsafeWindow.game_data)) {
        setTimeout(init, 100); // delay mínimo para estabilidade
    } else {
        setTimeout(init, 500); // delay maior para Tampermonkey
    }
})();
