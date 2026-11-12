// ===========================================================================
// 🤝 Aprovador de Amizades em Massa (Mass Buddy Approver & Invitations) — TW Toolkit
// Versão: 1.0.0 (Edição Oficial TW Toolkit — OND BR143)
// Desenvolvido por: Azuelos (@jhonatanazuelosoficial)
// 
// Execução via Barra de Acesso Rápido do Tribal Wars (100% à prova de CSP):
// javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/MassBuddyAcceptPTBR.js?_='+Date.now();document.head.appendChild(s);})();void(0);
// ===========================================================================

(function () {
    'use strict';

    // Evita duplicar instância se já estiver aberta
    if (document.getElementById('twMassBuddyContainer')) {
        const existing = document.getElementById('twMassBuddyContainer');
        if (existing.style.display === 'none') {
            existing.style.display = 'flex';
        }
        existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.UI && typeof window.UI.InfoMessage === 'function') {
            window.UI.InfoMessage('🤝 Aprovador de Amizades já está ativo na tela!', 2500);
        }
        return;
    }

    const SCRIPT_NAME = 'Aprovador de Amizades em Massa';
    const SCRIPT_VERSION = 'v1.0.0';
    const STORAGE_KEY = 'ond_tw_mass_buddy_prefs';

    // Preferências padrão
    let userPrefs = {
        delayMs: 450,
        activeTab: 'incoming', // 'incoming' | 'suggested' | 'outgoing' | 'log'
        autoSwitchToAvailable: true
    };

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            userPrefs = Object.assign(userPrefs, JSON.parse(saved));
        }
    } catch (e) {
        console.warn('Erro ao ler localStorage do Mass Buddy:', e);
    }

    function savePrefs() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userPrefs));
        } catch (e) {}
    }

    // Estado da Aplicação
    let appState = {
        incoming: [],   // Pedidos recebidos para aprovar
        suggested: [],  // Amigos sugeridos de outros mundos/tribos
        outgoing: [],   // Convites enviados pelo jogador
        isRunning: false,
        shouldCancel: false,
        activeTab: 'incoming',
        stats: {
            approved: 0,
            invited: 0,
            cancelled: 0,
            errors: 0
        }
    };

    // ===========================================================================
    // ESTILOS CSS MODERNOS (Glassmorphism Dark Theme — Padrão TW Toolkit OND)
    // ===========================================================================
    const massBuddyStyles = `
<style id="twMassBuddyStyles">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

#twMassBuddyContainer {
    position: fixed !important;
    top: 55px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 95vw !important;
    max-width: 920px !important;
    max-height: 88vh !important;
    background: linear-gradient(145deg, #070d19 0%, #0d172a 50%, #152238 100%) !important;
    border: 1px solid rgba(56, 189, 248, 0.28) !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 65px rgba(0, 0, 0, 0.9), 0 0 30px rgba(2, 132, 199, 0.2) !important;
    z-index: 99999 !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    color: #f8fafc !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    animation: twBuddyFadeIn 0.22s ease-out !important;
}

@keyframes twBuddyFadeIn {
    from { opacity: 0; transform: translate(-50%, -15px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}

#twMassBuddyContainer *,
#twMassBuddyContainer *::before,
#twMassBuddyContainer *::after {
    box-sizing: border-box !important;
    margin: 0;
    padding: 0;
}

/* Header */
.tw-buddy-header {
    background: linear-gradient(135deg, #091426 0%, #0c2338 50%, #0a334a 100%) !important;
    padding: 14px 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: 2px solid #0284c7 !important;
    cursor: move !important;
    user-select: none !important;
}

.tw-buddy-title {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    font-size: 16px !important;
    font-weight: 800 !important;
    letter-spacing: 0.5px !important;
    color: #38bdf8 !important;
    text-shadow: 0 2px 4px rgba(0,0,0,0.6) !important;
}

.tw-buddy-title .version-badge {
    background: rgba(2, 132, 199, 0.25) !important;
    border: 1px solid rgba(56, 189, 248, 0.4) !important;
    color: #bae6fd !important;
    padding: 2px 8px !important;
    border-radius: 999px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
}

.tw-buddy-controls {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}

.tw-buddy-btn-ctrl {
    background: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    color: #e2e8f0 !important;
    width: 28px !important;
    height: 28px !important;
    border-radius: 6px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 14px !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
}

.tw-buddy-btn-ctrl:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    color: #ffffff !important;
}

.tw-buddy-btn-ctrl.close:hover {
    background: #ef4444 !important;
    border-color: #f87171 !important;
}

/* Stats Bar */
.tw-buddy-stats-bar {
    background: rgba(15, 23, 42, 0.85) !important;
    padding: 10px 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 12px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    flex-wrap: wrap !important;
}

.tw-buddy-stat-box {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    background: rgba(30, 41, 59, 0.5) !important;
    padding: 6px 12px !important;
    border-radius: 8px !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.tw-buddy-stat-label {
    font-size: 11px !important;
    color: #94a3b8 !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px !important;
}

.tw-buddy-stat-val {
    font-size: 13px !important;
    font-weight: 800 !important;
    color: #38bdf8 !important;
}

/* Tabs */
.tw-buddy-tabs {
    display: flex !important;
    background: rgba(11, 20, 38, 0.95) !important;
    border-bottom: 1px solid rgba(56, 189, 248, 0.2) !important;
    padding: 0 16px !important;
    gap: 6px !important;
}

.tw-buddy-tab-btn {
    background: transparent !important;
    border: none !important;
    outline: none !important;
    color: #94a3b8 !important;
    padding: 12px 16px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    border-bottom: 3px solid transparent !important;
    transition: all 0.15s ease !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}

.tw-buddy-tab-btn:hover {
    color: #e2e8f0 !important;
    background: rgba(255, 255, 255, 0.03) !important;
}

.tw-buddy-tab-btn.active {
    color: #38bdf8 !important;
    border-bottom-color: #38bdf8 !important;
    background: rgba(56, 189, 248, 0.06) !important;
}

.tw-buddy-tab-badge {
    padding: 2px 7px !important;
    border-radius: 999px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    background: rgba(255, 255, 255, 0.1) !important;
    color: #cbd5e1 !important;
}

.tw-buddy-tab-btn.active .tw-buddy-tab-badge {
    background: #0284c7 !important;
    color: #ffffff !important;
}

/* Body */
.tw-buddy-body {
    padding: 16px 20px !important;
    overflow-y: auto !important;
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    min-height: 280px !important;
    max-height: calc(88vh - 190px) !important;
}

.tw-buddy-body::-webkit-scrollbar {
    width: 8px !important;
}
.tw-buddy-body::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.6) !important;
}
.tw-buddy-body::-webkit-scrollbar-thumb {
    background: #334155 !important;
    border-radius: 4px !important;
}
.tw-buddy-body::-webkit-scrollbar-thumb:hover {
    background: #0284c7 !important;
}

/* Control Toolbar */
.tw-buddy-toolbar {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 10px !important;
    background: rgba(30, 41, 59, 0.45) !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-radius: 10px !important;
    padding: 10px 14px !important;
    flex-wrap: wrap !important;
}

.tw-buddy-toolbar-left {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    flex-wrap: wrap !important;
}

.tw-buddy-btn-sm {
    background: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    color: #cbd5e1 !important;
    padding: 5px 10px !important;
    border-radius: 6px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
}

.tw-buddy-btn-sm:hover:not(:disabled) {
    background: rgba(56, 189, 248, 0.2) !important;
    border-color: #38bdf8 !important;
    color: #ffffff !important;
}

.tw-buddy-search {
    background: rgba(15, 23, 42, 0.8) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    color: #f8fafc !important;
    padding: 6px 12px !important;
    border-radius: 6px !important;
    font-size: 12px !important;
    outline: none !important;
    min-width: 180px !important;
    transition: border 0.15s ease !important;
}

.tw-buddy-search:focus {
    border-color: #38bdf8 !important;
}

.tw-buddy-select {
    background: #0f172a !important;
    border: 1px solid #334155 !important;
    color: #e2e8f0 !important;
    padding: 5px 10px !important;
    border-radius: 6px !important;
    font-size: 12px !important;
    outline: none !important;
}

/* Card List */
.tw-buddy-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
}

.tw-buddy-card {
    background: rgba(30, 41, 59, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 10px !important;
    padding: 10px 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 12px !important;
    transition: all 0.15s ease !important;
}

.tw-buddy-card:hover {
    background: rgba(30, 41, 59, 0.85) !important;
    border-color: rgba(56, 189, 248, 0.3) !important;
}

.tw-buddy-card.success {
    border-color: rgba(74, 222, 128, 0.4) !important;
    background: rgba(22, 101, 52, 0.2) !important;
    opacity: 0.75 !important;
}

.tw-buddy-card.error {
    border-color: rgba(239, 68, 68, 0.4) !important;
    background: rgba(127, 29, 29, 0.2) !important;
}

.tw-buddy-card-left {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    flex: 1 !important;
    min-width: 0 !important;
}

.tw-buddy-check {
    width: 17px !important;
    height: 17px !important;
    accent-color: #0284c7 !important;
    cursor: pointer !important;
}

.tw-buddy-avatar {
    width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    background: #0f172a !important;
    border: 2px solid #0284c7 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 16px !important;
    color: #38bdf8 !important;
    font-weight: 800 !important;
    flex-shrink: 0 !important;
}

.tw-buddy-info {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    min-width: 0 !important;
}

.tw-buddy-player-name {
    font-size: 14px !important;
    font-weight: 700 !important;
    color: #f8fafc !important;
    text-decoration: none !important;
    transition: color 0.15s ease !important;
}

.tw-buddy-player-name:hover {
    color: #38bdf8 !important;
    text-decoration: underline !important;
}

.tw-buddy-meta {
    font-size: 11px !important;
    color: #94a3b8 !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    flex-wrap: wrap !important;
}

.tw-buddy-meta-pill {
    background: rgba(255, 255, 255, 0.07) !important;
    padding: 1px 6px !important;
    border-radius: 4px !important;
    color: #cbd5e1 !important;
}

.tw-buddy-card-right {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}

.tw-buddy-badge-status {
    padding: 4px 8px !important;
    border-radius: 6px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
}

.tw-buddy-badge-pending {
    background: rgba(56, 189, 248, 0.15) !important;
    color: #38bdf8 !important;
    border: 1px solid rgba(56, 189, 248, 0.3) !important;
}

.tw-buddy-badge-ok {
    background: rgba(34, 197, 94, 0.2) !important;
    color: #4ade80 !important;
    border: 1px solid rgba(34, 197, 94, 0.4) !important;
}

.tw-buddy-badge-err {
    background: rgba(239, 68, 68, 0.2) !important;
    color: #f87171 !important;
    border: 1px solid rgba(239, 68, 68, 0.4) !important;
}

/* Empty State */
.tw-buddy-empty {
    padding: 35px 20px !important;
    text-align: center !important;
    color: #94a3b8 !important;
    font-size: 13px !important;
    background: rgba(15, 23, 42, 0.4) !important;
    border-radius: 12px !important;
    border: 1px dashed rgba(255, 255, 255, 0.1) !important;
    line-height: 1.6 !important;
}

/* Progress Bar */
.tw-buddy-progress-container {
    background: rgba(15, 23, 42, 0.9) !important;
    border: 1px solid rgba(56, 189, 248, 0.3) !important;
    border-radius: 10px !important;
    padding: 10px 14px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
}

.tw-buddy-progress-info {
    display: flex !important;
    justify-content: space-between !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #bae6fd !important;
}

.tw-buddy-progress-track {
    width: 100% !important;
    height: 10px !important;
    background: #0f172a !important;
    border-radius: 6px !important;
    overflow: hidden !important;
    border: 1px solid #334155 !important;
}

.tw-buddy-progress-bar {
    height: 100% !important;
    width: 0% !important;
    background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%) !important;
    transition: width 0.2s ease !important;
    box-shadow: 0 0 10px #38bdf8 !important;
}

/* Actions Footer */
.tw-buddy-actions {
    background: rgba(9, 20, 38, 0.95) !important;
    padding: 12px 20px !important;
    border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    flex-wrap: wrap !important;
}

.tw-buddy-btn {
    border: none !important;
    outline: none !important;
    padding: 9px 18px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    transition: all 0.15s ease !important;
}

.tw-buddy-btn-primary {
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4) !important;
}

.tw-buddy-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
    box-shadow: 0 6px 18px rgba(14, 165, 233, 0.5) !important;
    transform: translateY(-1px) !important;
}

.tw-buddy-btn-success {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4) !important;
}

.tw-buddy-btn-success:hover:not(:disabled) {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
    box-shadow: 0 6px 18px rgba(34, 197, 94, 0.5) !important;
    transform: translateY(-1px) !important;
}

.tw-buddy-btn-danger {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
    color: #ffffff !important;
}

.tw-buddy-btn-secondary {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #cbd5e1 !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

.tw-buddy-btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.16) !important;
    color: #ffffff !important;
}

.tw-buddy-btn:disabled {
    opacity: 0.45 !important;
    cursor: not-allowed !important;
    transform: none !important;
}

/* Logs Box */
.tw-buddy-log-box {
    background: #090e17 !important;
    border: 1px solid #1e293b !important;
    border-radius: 8px !important;
    padding: 12px !important;
    font-family: 'Courier New', Courier, monospace !important;
    font-size: 11px !important;
    max-height: 280px !important;
    overflow-y: auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
}

.tw-buddy-log-item {
    line-height: 1.4 !important;
    word-break: break-all !important;
}

.tw-buddy-log-ok { color: #4ade80 !important; }
.tw-buddy-log-info { color: #38bdf8 !important; }
.tw-buddy-log-warn { color: #facc15 !important; }
.tw-buddy-log-err { color: #f87171 !important; }
</style>
    `;

    // ===========================================================================
    // CONSTRUÇÃO DO HTML DA INTERFACE
    // ===========================================================================
    function buildInterfaceHtml() {
        return `
${massBuddyStyles}
<div id="twMassBuddyContainer">
    <!-- Header -->
    <div class="tw-buddy-header" id="twBuddyHeader">
        <div class="tw-buddy-title">
            <span style="font-size: 20px;">🤝</span>
            <span>Aprovador de Amizades em Massa</span>
            <span class="version-badge">${SCRIPT_VERSION}</span>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">OND BR143</span>
        </div>
        <div class="tw-buddy-controls">
            <button class="tw-buddy-btn-ctrl" id="twBuddyBtnMinimize" title="Minimizar">_</button>
            <button class="tw-buddy-btn-ctrl close" id="twBuddyBtnClose" title="Fechar">×</button>
        </div>
    </div>

    <!-- Barra de Estatísticas -->
    <div class="tw-buddy-stats-bar">
        <div class="tw-buddy-stat-box">
            <span class="tw-buddy-stat-label">Pedidos Recebidos:</span>
            <span class="tw-buddy-stat-val" id="twStatIncoming">0</span>
        </div>
        <div class="tw-buddy-stat-box">
            <span class="tw-buddy-stat-label">Amigos Sugeridos:</span>
            <span class="tw-buddy-stat-val" style="color: #4ade80;" id="twStatSuggested">0</span>
        </div>
        <div class="tw-buddy-stat-box">
            <span class="tw-buddy-stat-label">Convites Enviados:</span>
            <span class="tw-buddy-stat-val" style="color: #facc15;" id="twStatOutgoing">0</span>
        </div>
        <div class="tw-buddy-stat-box">
            <span class="tw-buddy-stat-label">Aprovados Nesta Sessão:</span>
            <span class="tw-buddy-stat-val" style="color: #a855f7;" id="twStatSessionApproved">0</span>
        </div>
    </div>

    <!-- Abas -->
    <div class="tw-buddy-tabs" id="twBuddyTabs">
        <button class="tw-buddy-tab-btn active" data-tab="incoming">
            <span>📥 Pedidos Recebidos</span>
            <span class="tw-buddy-tab-badge" id="twTabBadgeIncoming">0</span>
        </button>
        <button class="tw-buddy-tab-btn" data-tab="suggested">
            <span>💡 Amigos Sugeridos</span>
            <span class="tw-buddy-tab-badge" id="twTabBadgeSuggested">0</span>
        </button>
        <button class="tw-buddy-tab-btn" data-tab="outgoing">
            <span>📤 Convites Enviados</span>
            <span class="tw-buddy-tab-badge" id="twTabBadgeOutgoing">0</span>
        </button>
        <button class="tw-buddy-tab-btn" data-tab="log">
            <span>📋 Logs</span>
            <span class="tw-buddy-tab-badge" id="twTabBadgeLog">0</span>
        </button>
    </div>

    <!-- Corpo -->
    <div class="tw-buddy-body" id="twBuddyBody">
        <!-- Barra de Ferramentas / Filtros -->
        <div class="tw-buddy-toolbar">
            <div class="tw-buddy-toolbar-left">
                <button class="tw-buddy-btn-sm" id="twBtnSelectAll">☑️ Marcar Todos</button>
                <button class="tw-buddy-btn-sm" id="twBtnDeselectAll">◻️ Desmarcar Todos</button>
                <button class="tw-buddy-btn-sm" id="twBtnInvertSelection">🔄 Inverter</button>
                <input type="text" class="tw-buddy-search" id="twBuddySearch" placeholder="🔍 Filtrar por nome...">
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 11px; color: #94a3b8; font-weight: 600;">Intervalo Anti-Detecção:</label>
                <select class="tw-buddy-select" id="twSelectDelay">
                    <option value="300">300 ms (Rápido)</option>
                    <option value="450" selected>450 ms (Recomendado)</option>
                    <option value="800">800 ms (Suave)</option>
                    <option value="1200">1.2 s (Lento / Humano)</option>
                </select>
            </div>
        </div>

        <!-- Barra de Progresso (oculta inicialmente) -->
        <div class="tw-buddy-progress-container" id="twProgressContainer" style="display: none;">
            <div class="tw-buddy-progress-info">
                <span id="twProgressStatus">Processando solicitações...</span>
                <span id="twProgressCount">0 / 0 (0%)</span>
            </div>
            <div class="tw-buddy-progress-track">
                <div class="tw-buddy-progress-bar" id="twProgressBar"></div>
            </div>
        </div>

        <!-- Painel Aba 1: Pedidos Recebidos -->
        <div id="twPaneIncoming" class="tw-buddy-tab-pane">
            <div class="tw-buddy-list" id="twListIncoming"></div>
        </div>

        <!-- Painel Aba 2: Amigos Sugeridos -->
        <div id="twPaneSuggested" class="tw-buddy-tab-pane" style="display: none;">
            <div class="tw-buddy-list" id="twListSuggested"></div>
        </div>

        <!-- Painel Aba 3: Convites Enviados -->
        <div id="twPaneOutgoing" class="tw-buddy-tab-pane" style="display: none;">
            <div class="tw-buddy-list" id="twListOutgoing"></div>
        </div>

        <!-- Painel Aba 4: Logs -->
        <div id="twPaneLog" class="tw-buddy-tab-pane" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 700; color: #bae6fd;">Histórico de Ações da Sessão</span>
                <button class="tw-buddy-btn-sm" id="twBtnClearLog">🗑️ Limpar Log</button>
            </div>
            <div class="tw-buddy-log-box" id="twLogBox">
                <div class="tw-buddy-log-item tw-buddy-log-info">[Inicialização] Script carregado e pronto para execução.</div>
            </div>
        </div>
    </div>

    <!-- Rodapé de Ações -->
    <div class="tw-buddy-actions">
        <button class="tw-buddy-btn tw-buddy-btn-success" id="twBtnExecuteBatch">
            <span>⚡ Aprovar Selecionados (0)</span>
        </button>
        <button class="tw-buddy-btn tw-buddy-btn-danger" id="twBtnStopBatch" style="display: none;">
            <span>⏹️ Interromper</span>
        </button>
        <button class="tw-buddy-btn tw-buddy-btn-secondary" id="twBtnReloadData">
            <span>🔄 Recarregar Dados</span>
        </button>
        <button class="tw-buddy-btn tw-buddy-btn-secondary" id="twBtnGoToBuddies" title="Abrir página oficial de amigos do jogo">
            <span>↗️ Abrir Tela Amigos</span>
        </button>
        <div style="margin-left: auto; font-size: 11px; color: #64748b; font-weight: 600;">
            Desenvolvido por <b style="color: #38bdf8;">Azuelos</b>
        </div>
    </div>
</div>
        `;
    }

    // ===========================================================================
    // LOGS DO SISTEMA
    // ===========================================================================
    function addLog(msg, type = 'info') {
        const box = document.getElementById('twLogBox');
        if (!box) return;

        const time = new Date().toLocaleTimeString();
        const item = document.createElement('div');
        item.className = `tw-buddy-log-item tw-buddy-log-${type}`;
        item.textContent = `[${time}] ${msg}`;
        box.appendChild(item);
        box.scrollTop = box.scrollHeight;

        const badge = document.getElementById('twTabBadgeLog');
        if (badge) {
            badge.textContent = box.children.length;
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===========================================================================
    // EXTRAÇÃO E PARSE DOS DADOS DE AMIGOS DO TRIBAL WARS
    // ===========================================================================
    async function loadBuddiesData() {
        const villageId = (window.game_data && window.game_data.village && window.game_data.village.id) || '';
        const currentScreen = (window.game_data && window.game_data.screen) || '';
        const csrf = (window.game_data && window.game_data.csrf) || '';

        addLog('Carregando dados de amigos...', 'info');

        let htmlContent = null;
        let isNative = false;

        if (currentScreen === 'buddies') {
            isNative = true;
            htmlContent = document.documentElement.outerHTML;
            addLog('Lendo dados diretamente da página ativa (screen=buddies)...', 'info');
        } else {
            addLog(`Buscando tela de amigos em segundo plano via AJAX (village=${villageId})...`, 'info');
            try {
                const url = `/game.php?village=${villageId}&screen=buddies`;
                htmlContent = await $.ajax({
                    url: url,
                    type: 'GET',
                    dataType: 'html'
                });
                addLog('Página recebida com sucesso em segundo plano!', 'ok');
            } catch (err) {
                console.error('Erro ao buscar página buddies:', err);
                addLog(`Falha ao carregar tela de amigos: ${err.statusText || err}`, 'err');
                if (window.UI && typeof window.UI.ErrorMessage === 'function') {
                    window.UI.ErrorMessage('Erro ao carregar dados de amigos via background.', 3000);
                }
                return;
            }
        }

        parseBuddiesHtml(htmlContent, isNative);
    }

    function parseBuddiesHtml(html, isNative) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const csrf = (window.game_data && window.game_data.csrf) || '';
        const villageId = (window.game_data && window.game_data.village && window.game_data.village.id) || '';

        // 1. EXTRAÇÃO DE PEDIDOS RECEBIDOS (a[href*="action=approve_buddy"])
        const incomingList = [];
        const approveLinks = doc.querySelectorAll('a[href*="action=approve_buddy"]');

        approveLinks.forEach((link, idx) => {
            const href = link.getAttribute('href') || '';
            const tr = link.closest('tr');

            // ID do pedido / buddy
            const buddyMatch = href.match(/buddy_id=(\d+)/);
            const buddyId = buddyMatch ? buddyMatch[1] : '';

            // Token CSRF
            const hMatch = href.match(/h=([a-f0-9]+)/);
            const h = hMatch ? hMatch[1] : csrf;

            // Jogador que enviou
            let playerName = 'Jogador';
            let playerId = '';
            let playerUrl = '#';

            if (tr) {
                const pLink = tr.querySelector('a[href*="screen=info_player"]');
                if (pLink) {
                    playerName = pLink.textContent.trim();
                    playerUrl = pLink.getAttribute('href');
                    const idMatch = playerUrl.match(/id=(\d+)/);
                    if (idMatch) playerId = idMatch[1];
                }
            }

            // Link de recusa caso exista
            let rejectUrl = '';
            if (tr) {
                const rLink = tr.querySelector('a[href*="action=reject_buddy"]');
                if (rLink) rejectUrl = rLink.getAttribute('href');
            }
            if (!rejectUrl && buddyId) {
                rejectUrl = `/game.php?village=${villageId}&screen=buddies&action=reject_buddy&buddy_id=${buddyId}&h=${h}`;
            }

            incomingList.push({
                id: `inc_${buddyId || idx}`,
                buddyId: buddyId,
                h: h,
                playerName: playerName,
                playerId: playerId,
                playerUrl: playerUrl,
                approveUrl: href,
                rejectUrl: rejectUrl,
                selected: true, // Marcado por padrão para aprovação em massa
                status: 'pending'
            });
        });

        // 2. EXTRAÇÃO DE AMIGOS SUGERIDOS (#contact_list_table tr.contact_entry)
        const suggestedList = [];
        const contactEntries = doc.querySelectorAll('#contact_list_table tr.contact_entry, tr.contact_entry');

        contactEntries.forEach((tr, idx) => {
            const pLink = tr.querySelector('a[href*="screen=info_player"]');
            let playerName = pLink ? pLink.textContent.trim() : '';
            let playerUrl = pLink ? pLink.getAttribute('href') : '#';
            let playerId = '';

            if (playerUrl) {
                const idMatch = playerUrl.match(/id=(\d+)/);
                if (idMatch) playerId = idMatch[1];
            }

            const nameInput = tr.querySelector('input[name="name"]');
            if (nameInput && nameInput.value) {
                playerName = nameInput.value;
            }

            const form = tr.querySelector('form[action*="add_buddy"]');
            const formAction = form ? form.getAttribute('action') : `/game.php?village=${villageId}&screen=buddies&action=add_buddy&h=${csrf}`;

            // Metadados (Mundo, Tribo, Último contato)
            const cells = tr.querySelectorAll('td');
            let world = cells.length > 1 ? cells[1].textContent.trim() : '';
            let tribe = cells.length > 2 ? cells[2].textContent.trim() : '-';
            let lastContact = cells.length > 3 ? cells[3].textContent.trim() : '';

            suggestedList.push({
                id: `sug_${playerId || idx}`,
                playerId: playerId,
                playerName: playerName,
                playerUrl: playerUrl,
                formAction: formAction,
                world: world,
                tribe: tribe,
                lastContact: lastContact,
                selected: true,
                status: 'pending'
            });
        });

        // 3. EXTRAÇÃO DE CONVITES ENVIADOS (Seus Convites - a[href*="action=cancel_buddy"])
        const outgoingList = [];
        const cancelLinks = doc.querySelectorAll('a[href*="action=cancel_buddy"]');

        cancelLinks.forEach((link, idx) => {
            const href = link.getAttribute('href') || '';
            const tr = link.closest('tr');

            const buddyMatch = href.match(/buddy_id=(\d+)/);
            const buddyId = buddyMatch ? buddyMatch[1] : '';

            let playerName = 'Jogador';
            let playerId = '';
            let playerUrl = '#';

            if (tr) {
                const pLink = tr.querySelector('a[href*="screen=info_player"]');
                if (pLink) {
                    playerName = pLink.textContent.trim();
                    playerUrl = pLink.getAttribute('href');
                    const idMatch = playerUrl.match(/id=(\d+)/);
                    if (idMatch) playerId = idMatch[1];
                }
            }

            outgoingList.push({
                id: `out_${buddyId || idx}`,
                buddyId: buddyId,
                playerName: playerName,
                playerId: playerId,
                playerUrl: playerUrl,
                cancelUrl: href,
                selected: false, // Desmarcado por padrão por segurança
                status: 'pending'
            });
        });

        appState.incoming = incomingList;
        appState.suggested = suggestedList;
        appState.outgoing = outgoingList;

        // Atualiza contadores
        document.getElementById('twStatIncoming').textContent = incomingList.length;
        document.getElementById('twStatSuggested').textContent = suggestedList.length;
        document.getElementById('twStatOutgoing').textContent = outgoingList.length;

        document.getElementById('twTabBadgeIncoming').textContent = incomingList.length;
        document.getElementById('twTabBadgeSuggested').textContent = suggestedList.length;
        document.getElementById('twTabBadgeOutgoing').textContent = outgoingList.length;

        // Se houver pedidos recebidos, abre a aba de pedidos recebidos; se não houver, mas houver sugeridos, sugere a aba
        if (incomingList.length > 0) {
            switchTab('incoming');
        } else if (suggestedList.length > 0 && appState.activeTab === 'incoming') {
            // Mantém ou permite o usuário navegar
        }

        renderCurrentTab();
        updateActionButton();

        addLog(`Leitura concluída: ${incomingList.length} pedidos recebidos, ${suggestedList.length} amigos sugeridos, ${outgoingList.length} convites enviados.`, 'ok');
    }

    // ===========================================================================
    // RENDERIZAÇÃO DOS CARDS DAS ABAS
    // ===========================================================================
    function renderCurrentTab() {
        const query = (document.getElementById('twBuddySearch') ? document.getElementById('twBuddySearch').value.toLowerCase().trim() : '');

        if (appState.activeTab === 'incoming') {
            renderIncomingList(query);
        } else if (appState.activeTab === 'suggested') {
            renderSuggestedList(query);
        } else if (appState.activeTab === 'outgoing') {
            renderOutgoingList(query);
        }
    }

    function renderIncomingList(filter = '') {
        const container = document.getElementById('twListIncoming');
        if (!container) return;

        let list = appState.incoming;
        if (filter) {
            list = list.filter(item => item.playerName.toLowerCase().includes(filter));
        }

        if (list.length === 0) {
            container.innerHTML = `
                <div class="tw-buddy-empty">
                    <span style="font-size: 26px;">🎉</span><br>
                    <b>Nenhum pedido de amizade pendente no momento!</b><br>
                    <span style="font-size: 11px; color: #64748b;">Quando outro jogador enviar um convite de amizade, ele aparecerá aqui com checkbox para aprovação em massa.</span><br><br>
                    <button class="tw-buddy-btn-sm" id="twBtnSwitchSuggested">👉 Ver ${appState.suggested.length} Amigos Sugeridos</button>
                </div>
            `;
            const btn = document.getElementById('twBtnSwitchSuggested');
            if (btn) btn.addEventListener('click', () => switchTab('suggested'));
            return;
        }

        let html = '';
        list.forEach((item, idx) => {
            const isDone = item.status === 'success';
            const isErr = item.status === 'error';

            let statusBadge = `<span class="tw-buddy-badge-status tw-buddy-badge-pending">⏳ Aguardando Aprovação</span>`;
            if (isDone) statusBadge = `<span class="tw-buddy-badge-status tw-buddy-badge-ok">✅ Aprovado</span>`;
            if (isErr) statusBadge = `<span class="tw-buddy-badge-status tw-buddy-badge-err">❌ Falha</span>`;

            html += `
            <div class="tw-buddy-card ${isDone ? 'success' : ''} ${isErr ? 'error' : ''}" id="card_${item.id}">
                <div class="tw-buddy-card-left">
                    <input type="checkbox" class="tw-buddy-check" data-id="${item.id}" ${item.selected ? 'checked' : ''} ${isDone || appState.isRunning ? 'disabled' : ''}>
                    <div class="tw-buddy-avatar">${item.playerName.charAt(0).toUpperCase()}</div>
                    <div class="tw-buddy-info">
                        <a href="${item.playerUrl}" target="_blank" class="tw-buddy-player-name">${item.playerName}</a>
                        <div class="tw-buddy-meta">
                            <span class="tw-buddy-meta-pill">ID Pedido: #${item.buddyId}</span>
                            ${item.playerId ? `<span class="tw-buddy-meta-pill">ID Jogador: ${item.playerId}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="tw-buddy-card-right">
                    ${statusBadge}
                    ${!isDone && !appState.isRunning ? `
                        <button class="tw-buddy-btn-sm" data-action="single-accept" data-id="${item.id}" title="Aprovar apenas este agora">✓ Aceitar</button>
                        <button class="tw-buddy-btn-sm" data-action="single-reject" data-id="${item.id}" title="Recusar este pedido" style="color: #f87171;">✕ Recusar</button>
                    ` : ''}
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
        attachItemEventListeners(container, appState.incoming);
    }

    function renderSuggestedList(filter = '') {
        const container = document.getElementById('twListSuggested');
        if (!container) return;

        let list = appState.suggested;
        if (filter) {
            list = list.filter(item => item.playerName.toLowerCase().includes(filter) || item.world.toLowerCase().includes(filter) || item.tribe.toLowerCase().includes(filter));
        }

        if (list.length === 0) {
            container.innerHTML = `
                <div class="tw-buddy-empty">
                    Nenhum amigo sugerido encontrado com o filtro atual.
                </div>
            `;
            return;
        }

        let html = '';
        list.forEach(item => {
            const isDone = item.status === 'success';
            const isErr = item.status === 'error';

            let statusBadge = `<span class="tw-buddy-badge-status tw-buddy-badge-pending">💡 Sugerido</span>`;
            if (isDone) statusBadge = `<span class="tw-buddy-badge-status tw-buddy-badge-ok">✉️ Convite Enviado</span>`;
            if (isErr) statusBadge = `<span class="tw-buddy-badge-status tw-buddy-badge-err">❌ Erro</span>`;

            html += `
            <div class="tw-buddy-card ${isDone ? 'success' : ''} ${isErr ? 'error' : ''}" id="card_${item.id}">
                <div class="tw-buddy-card-left">
                    <input type="checkbox" class="tw-buddy-check" data-id="${item.id}" ${item.selected ? 'checked' : ''} ${isDone || appState.isRunning ? 'disabled' : ''}>
                    <div class="tw-buddy-avatar" style="border-color: #22c55e; color: #4ade80;">${item.playerName.charAt(0).toUpperCase()}</div>
                    <div class="tw-buddy-info">
                        <a href="${item.playerUrl}" target="_blank" class="tw-buddy-player-name">${item.playerName}</a>
                        <div class="tw-buddy-meta">
                            ${item.world ? `<span class="tw-buddy-meta-pill" style="color: #38bdf8;">🌍 ${item.world}</span>` : ''}
                            ${item.tribe && item.tribe !== '-' ? `<span class="tw-buddy-meta-pill" style="color: #facc15;">🛡️ ${item.tribe}</span>` : ''}
                            ${item.lastContact ? `<span class="tw-buddy-meta-pill">🕒 ${item.lastContact}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="tw-buddy-card-right">
                    ${statusBadge}
                    ${!isDone && !appState.isRunning ? `
                        <button class="tw-buddy-btn-sm" data-action="single-invite" data-id="${item.id}" title="Enviar convite apenas para este">➕ Convidar</button>
                    ` : ''}
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
        attachItemEventListeners(container, appState.suggested);
    }

    function renderOutgoingList(filter = '') {
        const container = document.getElementById('twListOutgoing');
        if (!container) return;

        let list = appState.outgoing;
        if (filter) {
            list = list.filter(item => item.playerName.toLowerCase().includes(filter));
        }

        if (list.length === 0) {
            container.innerHTML = `
                <div class="tw-buddy-empty">
                    Você não possui convites pendentes de envio.
                </div>
            `;
            return;
        }

        let html = '';
        list.forEach(item => {
            const isDone = item.status === 'success';

            html += `
            <div class="tw-buddy-card ${isDone ? 'success' : ''}" id="card_${item.id}">
                <div class="tw-buddy-card-left">
                    <input type="checkbox" class="tw-buddy-check" data-id="${item.id}" ${item.selected ? 'checked' : ''} ${isDone || appState.isRunning ? 'disabled' : ''}>
                    <div class="tw-buddy-avatar" style="border-color: #facc15; color: #facc15;">${item.playerName.charAt(0).toUpperCase()}</div>
                    <div class="tw-buddy-info">
                        <a href="${item.playerUrl}" target="_blank" class="tw-buddy-player-name">${item.playerName}</a>
                        <div class="tw-buddy-meta">
                            <span class="tw-buddy-meta-pill">Convite Enviado (Pendente)</span>
                            <span class="tw-buddy-meta-pill">ID: #${item.buddyId}</span>
                        </div>
                    </div>
                </div>
                <div class="tw-buddy-card-right">
                    ${isDone ? `<span class="tw-buddy-badge-status tw-buddy-badge-ok">Cancelado</span>` : `
                        <button class="tw-buddy-btn-sm" data-action="single-cancel" data-id="${item.id}" style="color: #f87171;">✕ Cancelar Convite</button>
                    `}
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
        attachItemEventListeners(container, appState.outgoing);
    }

    function attachItemEventListeners(container, targetArray) {
        // Toggle individual do checkbox
        container.querySelectorAll('.tw-buddy-check').forEach(chk => {
            chk.addEventListener('change', function () {
                const id = this.dataset.id;
                const found = targetArray.find(x => x.id === id);
                if (found) {
                    found.selected = this.checked;
                }
                updateActionButton();
            });
        });

        // Ações de clique único
        container.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', async function (e) {
                e.preventDefault();
                const action = this.dataset.action;
                const id = this.dataset.id;
                const item = targetArray.find(x => x.id === id);
                if (!item) return;

                if (action === 'single-accept') {
                    await executeSingleApprove(item);
                    renderCurrentTab();
                    updateActionButton();
                } else if (action === 'single-reject') {
                    await executeSingleReject(item);
                    renderCurrentTab();
                    updateActionButton();
                } else if (action === 'single-invite') {
                    await executeSingleInvite(item);
                    renderCurrentTab();
                    updateActionButton();
                } else if (action === 'single-cancel') {
                    await executeSingleCancel(item);
                    renderCurrentTab();
                    updateActionButton();
                }
            });
        });
    }

    function updateActionButton() {
        const btn = document.getElementById('twBtnExecuteBatch');
        if (!btn) return;

        let selectedCount = 0;
        let actionLabel = 'Aprovar Selecionados';

        if (appState.activeTab === 'incoming') {
            selectedCount = appState.incoming.filter(x => x.selected && x.status !== 'success').length;
            actionLabel = `⚡ Aprovar Pedidos Selecionados (${selectedCount})`;
            btn.className = 'tw-buddy-btn tw-buddy-btn-success';
        } else if (appState.activeTab === 'suggested') {
            selectedCount = appState.suggested.filter(x => x.selected && x.status !== 'success').length;
            actionLabel = `➕ Enviar Pedidos para Selecionados (${selectedCount})`;
            btn.className = 'tw-buddy-btn tw-buddy-btn-primary';
        } else if (appState.activeTab === 'outgoing') {
            selectedCount = appState.outgoing.filter(x => x.selected && x.status !== 'success').length;
            actionLabel = `✕ Cancelar Convites Selecionados (${selectedCount})`;
            btn.className = 'tw-buddy-btn tw-buddy-btn-danger';
        }

        btn.disabled = selectedCount === 0 || appState.isRunning;
        btn.innerHTML = `<span>${actionLabel}</span>`;
    }

    // ===========================================================================
    // REQUISIÇÕES INDIVIDUAIS COM O TRIBAL WARS
    // ===========================================================================
    async function executeSingleApprove(item) {
        addLog(`Aprovando pedido de amizade de ${item.playerName}...`, 'info');
        try {
            await $.ajax({
                url: item.approveUrl,
                type: 'GET'
            });

            item.status = 'success';
            appState.stats.approved++;
            document.getElementById('twStatSessionApproved').textContent = appState.stats.approved;
            addLog(`✅ Pedido de ${item.playerName} aprovado com sucesso!`, 'ok');
            return true;
        } catch (err) {
            console.error('Erro ao aprovar amizade:', err);
            item.status = 'error';
            appState.stats.errors++;
            addLog(`❌ Falha ao aprovar pedido de ${item.playerName}`, 'err');
            return false;
        }
    }

    async function executeSingleReject(item) {
        addLog(`Recusando pedido de amizade de ${item.playerName}...`, 'warn');
        try {
            await $.ajax({
                url: item.rejectUrl,
                type: 'GET'
            });

            item.status = 'success';
            addLog(`Pedido de ${item.playerName} recusado.`, 'info');
            return true;
        } catch (err) {
            console.error('Erro ao recusar amizade:', err);
            item.status = 'error';
            return false;
        }
    }

    async function executeSingleInvite(item) {
        addLog(`Enviando pedido de amizade para ${item.playerName}...`, 'info');
        try {
            const villageId = (window.game_data && window.game_data.village && window.game_data.village.id) || '';
            const csrf = (window.game_data && window.game_data.csrf) || '';
            const postUrl = item.formAction || `/game.php?village=${villageId}&screen=buddies&action=add_buddy&h=${csrf}`;

            await $.ajax({
                url: postUrl,
                type: 'POST',
                data: {
                    name: item.playerName
                }
            });

            item.status = 'success';
            appState.stats.invited++;
            addLog(`✅ Pedido de amizade enviado para ${item.playerName}!`, 'ok');
            return true;
        } catch (err) {
            console.error('Erro ao enviar pedido de amizade:', err);
            item.status = 'error';
            appState.stats.errors++;
            addLog(`❌ Falha ao enviar pedido para ${item.playerName}`, 'err');
            return false;
        }
    }

    async function executeSingleCancel(item) {
        addLog(`Cancelando convite enviado para ${item.playerName}...`, 'warn');
        try {
            await $.ajax({
                url: item.cancelUrl,
                type: 'GET'
            });

            item.status = 'success';
            appState.stats.cancelled++;
            addLog(`Convite para ${item.playerName} cancelado com sucesso.`, 'info');
            return true;
        } catch (err) {
            console.error('Erro ao cancelar convite:', err);
            item.status = 'error';
            return false;
        }
    }

    // ===========================================================================
    // MOTOR DE PROCESSAMENTO EM MASSA
    // ===========================================================================
    async function runBatchExecution() {
        let queue = [];
        let execFn = null;
        let actionWord = 'processar';

        if (appState.activeTab === 'incoming') {
            queue = appState.incoming.filter(x => x.selected && x.status !== 'success');
            execFn = executeSingleApprove;
            actionWord = 'Aprovando pedidos';
        } else if (appState.activeTab === 'suggested') {
            queue = appState.suggested.filter(x => x.selected && x.status !== 'success');
            execFn = executeSingleInvite;
            actionWord = 'Enviando pedidos para sugeridos';
        } else if (appState.activeTab === 'outgoing') {
            queue = appState.outgoing.filter(x => x.selected && x.status !== 'success');
            execFn = executeSingleCancel;
            actionWord = 'Cancelando convites';
        }

        if (queue.length === 0) return;

        appState.isRunning = true;
        appState.shouldCancel = false;

        document.getElementById('twBtnExecuteBatch').style.display = 'none';
        document.getElementById('twBtnStopBatch').style.display = 'inline-flex';
        document.getElementById('twBtnReloadData').disabled = true;

        const progressContainer = document.getElementById('twProgressContainer');
        const progressBar = document.getElementById('twProgressBar');
        const progressStatus = document.getElementById('twProgressStatus');
        const progressCount = document.getElementById('twProgressCount');

        progressContainer.style.display = 'flex';

        const total = queue.length;
        let successCount = 0;
        let errorCount = 0;

        addLog(`🚀 Iniciando lote: ${total} itens selecionados (${actionWord})...`, 'info');

        for (let i = 0; i < total; i++) {
            if (appState.shouldCancel) {
                addLog('⏹️ Execução interrompida pelo usuário.', 'warn');
                break;
            }

            const item = queue[i];
            const pct = Math.round((i / total) * 100);
            progressBar.style.width = `${pct}%`;
            progressCount.textContent = `${i + 1} / ${total} (${pct}%)`;
            progressStatus.textContent = `${actionWord}: ${item.playerName}...`;

            const card = document.getElementById(`card_${item.id}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            const ok = await execFn(item);
            if (ok) {
                successCount++;
                if (card) {
                    card.classList.add('success');
                }
            } else {
                errorCount++;
                if (card) {
                    card.classList.add('error');
                }
            }

            renderCurrentTab();

            // Intervalo Anti-Detecção com Jitter Dinâmico
            const baseDelay = parseInt(userPrefs.delayMs, 10) || 450;
            const jitter = Math.floor(Math.random() * 120) - 60;
            const finalDelay = Math.max(250, baseDelay + jitter);
            await delay(finalDelay);
        }

        progressBar.style.width = '100%';
        progressCount.textContent = `${total} / ${total} (100%)`;
        progressStatus.textContent = `Concluído: ${successCount} sucessos, ${errorCount} erros.`;

        addLog(`🎉 Processamento em lote finalizado! Sucessos: ${successCount} | Falhas: ${errorCount}`, successCount > 0 ? 'ok' : 'warn');

        if (window.UI && typeof window.UI.SuccessMessage === 'function' && successCount > 0) {
            window.UI.SuccessMessage(`🤝 Operação concluída: ${successCount} ações realizadas com sucesso!`, 3500);
        }

        appState.isRunning = false;
        document.getElementById('twBtnExecuteBatch').style.display = 'inline-flex';
        document.getElementById('twBtnStopBatch').style.display = 'none';
        document.getElementById('twBtnReloadData').disabled = false;

        updateActionButton();
    }

    // ===========================================================================
    // CONTROLES DE JANELA E EVENTOS
    // ===========================================================================
    function switchTab(tabKey) {
        appState.activeTab = tabKey;
        userPrefs.activeTab = tabKey;
        savePrefs();

        document.querySelectorAll('.tw-buddy-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabKey);
        });

        document.getElementById('twPaneIncoming').style.display = tabKey === 'incoming' ? 'block' : 'none';
        document.getElementById('twPaneSuggested').style.display = tabKey === 'suggested' ? 'block' : 'none';
        document.getElementById('twPaneOutgoing').style.display = tabKey === 'outgoing' ? 'block' : 'none';
        document.getElementById('twPaneLog').style.display = tabKey === 'log' ? 'block' : 'none';

        renderCurrentTab();
        updateActionButton();
    }

    function setupWindowEvents() {
        const container = document.getElementById('twMassBuddyContainer');
        const header = document.getElementById('twBuddyHeader');
        const closeBtn = document.getElementById('twBuddyBtnClose');
        const minBtn = document.getElementById('twBuddyBtnMinimize');

        // Fechar
        closeBtn.addEventListener('click', () => {
            if (appState.isRunning) {
                if (!confirm('Uma operação está em execução. Deseja realmente parar e fechar?')) return;
                appState.shouldCancel = true;
            }
            container.remove();
            const styleTag = document.getElementById('twMassBuddyStyles');
            if (styleTag) styleTag.remove();
        });

        // Minimizar
        let isMinimized = false;
        minBtn.addEventListener('click', () => {
            const body = document.getElementById('twBuddyBody');
            const tabs = document.getElementById('twBuddyTabs');
            const stats = document.querySelector('.tw-buddy-stats-bar');
            const actions = document.querySelector('.tw-buddy-actions');
            if (!isMinimized) {
                if (body) body.style.display = 'none';
                if (tabs) tabs.style.display = 'none';
                if (stats) stats.style.display = 'none';
                if (actions) actions.style.display = 'none';
                container.style.maxHeight = '55px';
                minBtn.textContent = '□';
                isMinimized = true;
            } else {
                if (body) body.style.display = 'flex';
                if (tabs) tabs.style.display = 'flex';
                if (stats) stats.style.display = 'flex';
                if (actions) actions.style.display = 'flex';
                container.style.maxHeight = '88vh';
                minBtn.textContent = '_';
                isMinimized = false;
            }
        });

        // Arrastar Janela
        let isDragging = false;
        let startX, startY, origX, origY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = container.getBoundingClientRect();
            origX = rect.left;
            origY = rect.top;
            container.style.transform = 'none';
            container.style.left = `${origX}px`;
            container.style.top = `${origY}px`;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            container.style.left = `${Math.max(10, origX + dx)}px`;
            container.style.top = `${Math.max(10, origY + dy)}px`;
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        // Troca de Abas
        document.querySelectorAll('.tw-buddy-tab-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                switchTab(this.dataset.tab);
            });
        });

        // Seleção Rápida
        document.getElementById('twBtnSelectAll').addEventListener('click', () => {
            getCurrentTargetList().forEach(x => { if (x.status !== 'success') x.selected = true; });
            renderCurrentTab();
            updateActionButton();
        });

        document.getElementById('twBtnDeselectAll').addEventListener('click', () => {
            getCurrentTargetList().forEach(x => { x.selected = false; });
            renderCurrentTab();
            updateActionButton();
        });

        document.getElementById('twBtnInvertSelection').addEventListener('click', () => {
            getCurrentTargetList().forEach(x => { if (x.status !== 'success') x.selected = !x.selected; });
            renderCurrentTab();
            updateActionButton();
        });

        // Busca / Filtro
        document.getElementById('twBuddySearch').addEventListener('input', () => {
            renderCurrentTab();
        });

        // Delay Selector
        document.getElementById('twSelectDelay').addEventListener('change', function () {
            userPrefs.delayMs = parseInt(this.value, 10);
            savePrefs();
        });

        // Botão de Execução
        document.getElementById('twBtnExecuteBatch').addEventListener('click', () => {
            runBatchExecution();
        });

        // Botão Parar
        document.getElementById('twBtnStopBatch').addEventListener('click', () => {
            appState.shouldCancel = true;
            addLog('Interrupção solicitada. Aguardando término da requisição atual...', 'warn');
        });

        // Botão Recarregar
        document.getElementById('twBtnReloadData').addEventListener('click', async () => {
            await loadBuddiesData();
        });

        // Botão Ir Para Amigos Oficial
        document.getElementById('twBtnGoToBuddies').addEventListener('click', () => {
            const villageId = (window.game_data && window.game_data.village && window.game_data.village.id) || '';
            window.location.href = `/game.php?village=${villageId}&screen=buddies`;
        });

        // Limpar Logs
        document.getElementById('twBtnClearLog').addEventListener('click', () => {
            const box = document.getElementById('twLogBox');
            if (box) {
                box.innerHTML = '<div class="tw-buddy-log-item tw-buddy-log-info">[Log Limpo]</div>';
                document.getElementById('twTabBadgeLog').textContent = '1';
            }
        });
    }

    function getCurrentTargetList() {
        if (appState.activeTab === 'incoming') return appState.incoming;
        if (appState.activeTab === 'suggested') return appState.suggested;
        if (appState.activeTab === 'outgoing') return appState.outgoing;
        return [];
    }

    // ===========================================================================
    // INICIALIZAÇÃO
    // ===========================================================================
    function init() {
        const div = document.createElement('div');
        div.innerHTML = buildInterfaceHtml();
        document.body.appendChild(div);

        setupWindowEvents();
        loadBuddiesData();
    }

    // Inicia a execução
    init();

})();
