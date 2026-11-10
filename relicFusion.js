// ===========================================================================
// 🔮 Fusão e Otimizador de Relíquias Inteligente (Relic Fusion Optimizer) — OND BR143
// Versão: 1.0.0 (Edição Oficial TW Toolkit)
// Desenvolvido por: Azuelos (@jhonatanazuelosoficial)
// Uso na Barra de Acesso Rápido do Tribal Wars:
// javascript:$.getScript("https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/RelicFusionPTBR.js");void(0);
// ===========================================================================

(function () {
    'use strict';

    // Evita duplicar instância se já estiver aberta
    if (document.getElementById('twRelicFusionContainer')) {
        const existing = document.getElementById('twRelicFusionContainer');
        if (existing.style.display === 'none') {
            existing.style.display = 'flex';
        }
        existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.UI && typeof window.UI.InfoMessage === 'function') {
            window.UI.InfoMessage('🔮 Otimizador de Relíquias já está ativo na tela!', 2500);
        }
        return;
    }

    const SCRIPT_NAME = 'Fusão de Relíquias Inteligente';
    const SCRIPT_VERSION = 'v1.0.0';
    const STORAGE_KEY = 'ond_tw_relic_fusion_prefs';

    // Qualidades suportadas e ordem de evolução
    const QUALITIES = ['shoddy', 'polished', 'refined', 'superior', 'renowned'];
    const QUALITY_LABELS = {
        shoddy: 'De má qualidade',
        polished: 'Resistente',
        refined: 'Aprimorado',
        superior: 'Superior',
        renowned: 'Reconhecido'
    };

    const QUALITY_COLORS = {
        shoddy: '#94a3b8',    // cinza/ardósia
        polished: '#22c55e',  // verde
        refined: '#0ea5e9',   // azul ciano
        superior: '#a855f7',  // roxo/púrpura
        renowned: '#f59e0b'   // dourado lendário
    };

    // Preferências padrão salvas no LocalStorage
    let userPrefs = {
        fuseShoddy: true,
        fusePolished: true,
        fuseRefined: true,
        fuseSuperior: false, // Por segurança desmarcado por padrão (requer consentimento do usuário)
        protectFavorites: true,
        onlyJunkMaterials: true,
        mode: 'smart', // 'same_type', 'smart', 'junk_only', 'any'
        cascade: true,
        delayMs: 450
    };

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            userPrefs = Object.assign(userPrefs, JSON.parse(saved));
        }
    } catch (e) {
        console.warn('Erro ao ler localStorage do Relic Fusion:', e);
    }

    function savePrefs() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userPrefs));
        } catch (e) {}
    }

    // Estado da Aplicação
    let appState = {
        relics: [],
        materials: [],
        plannedFusions: [],
        isRunning: false,
        shouldCancel: false,
        activeTab: 'fusion', // 'fusion' | 'inventory' | 'log'
        stats: {
            total: 0,
            free: 0,
            equipped: 0,
            fusedSuccess: 0,
            fusedErrors: 0
        }
    };

    // ===========================================================================
    // ESTILOS CSS MODERNOS (Glassmorphism Dark Theme — Padrão TW Toolkit OND)
    // ===========================================================================
    const fusionStyles = `
<style id="twRelicFusionStyles">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

#twRelicFusionContainer {
    position: fixed !important;
    top: 50px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 95vw !important;
    max-width: 960px !important;
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
    animation: twRelicFadeIn 0.22s ease-out !important;
}

@keyframes twRelicFadeIn {
    from { opacity: 0; transform: translate(-50%, -15px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}

#twRelicFusionContainer *,
#twRelicFusionContainer *::before,
#twRelicFusionContainer *::after {
    box-sizing: border-box !important;
    margin: 0;
    padding: 0;
}

/* Header */
.tw-relic-header {
    background: linear-gradient(135deg, #091426 0%, #0c2338 50%, #0a334a 100%) !important;
    padding: 14px 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: 2px solid #0284c7 !important;
    cursor: move !important;
    user-select: none !important;
}

.tw-relic-title {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    font-size: 16px !important;
    font-weight: 800 !important;
    letter-spacing: 0.5px !important;
    color: #38bdf8 !important;
    text-shadow: 0 2px 4px rgba(0,0,0,0.6) !important;
}

.tw-relic-title .version-badge {
    background: rgba(2, 132, 199, 0.25) !important;
    border: 1px solid rgba(56, 189, 248, 0.4) !important;
    color: #bae6fd !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    padding: 2px 7px !important;
    border-radius: 6px !important;
}

.tw-relic-controls {
    display: flex !important;
    gap: 8px !important;
}

.tw-relic-btn-icon {
    background: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    color: #e2e8f0 !important;
    width: 28px !important;
    height: 28px !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 13px !important;
    font-weight: bold !important;
    transition: all 0.15s ease !important;
}

.tw-relic-btn-icon:hover {
    background: rgba(239, 68, 68, 0.8) !important;
    color: #fff !important;
    border-color: #ef4444 !important;
}

/* Tabs */
.tw-relic-tabs {
    display: flex !important;
    background: rgba(15, 23, 42, 0.85) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    padding: 6px 16px 0 !important;
    gap: 6px !important;
}

.tw-relic-tab-btn {
    background: transparent !important;
    border: none !important;
    outline: none !important;
    color: #94a3b8 !important;
    padding: 9px 18px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    border-bottom: 2px solid transparent !important;
    border-radius: 6px 6px 0 0 !important;
    transition: all 0.2s ease !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}

.tw-relic-tab-btn:hover {
    color: #f1f5f9 !important;
    background: rgba(255, 255, 255, 0.04) !important;
}

.tw-relic-tab-btn.active {
    color: #38bdf8 !important;
    border-bottom-color: #38bdf8 !important;
    background: rgba(56, 189, 248, 0.1) !important;
}

.tw-relic-tab-btn .tab-count {
    background: rgba(255, 255, 255, 0.1) !important;
    padding: 2px 6px !important;
    border-radius: 10px !important;
    font-size: 10px !important;
}

/* Body Content */
.tw-relic-body {
    flex: 1 !important;
    overflow-y: auto !important;
    padding: 16px 20px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
}

/* Summary Cards */
.tw-relic-stats-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)) !important;
    gap: 10px !important;
}

.tw-relic-stat-card {
    background: rgba(30, 41, 59, 0.6) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 10px !important;
    padding: 10px 14px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
}

.tw-relic-stat-label {
    font-size: 11px !important;
    color: #94a3b8 !important;
    font-weight: 500 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
}

.tw-relic-stat-val {
    font-size: 18px !important;
    font-weight: 800 !important;
    color: #f8fafc !important;
}

/* Filter & Options Box */
.tw-relic-config-box {
    background: rgba(15, 23, 42, 0.75) !important;
    border: 1px solid rgba(56, 189, 248, 0.2) !important;
    border-radius: 12px !important;
    padding: 14px 18px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
}

.tw-relic-config-row {
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 12px !important;
}

.tw-relic-checkbox-group {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 14px !important;
    align-items: center !important;
}

.tw-relic-checkbox-item {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    font-size: 12px !important;
    cursor: pointer !important;
    user-select: none !important;
    color: #cbd5e1 !important;
}

.tw-relic-checkbox-item input[type="checkbox"] {
    cursor: pointer !important;
    accent-color: #0284c7 !important;
    width: 15px !important;
    height: 15px !important;
}

.tw-relic-select {
    background: #0f172a !important;
    color: #f8fafc !important;
    border: 1px solid #334155 !important;
    border-radius: 6px !important;
    padding: 6px 10px !important;
    font-size: 12px !important;
    font-family: inherit !important;
    outline: none !important;
    cursor: pointer !important;
}

.tw-relic-select:focus {
    border-color: #38bdf8 !important;
}

/* Actions Row */
.tw-relic-actions {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    flex-wrap: wrap !important;
}

.tw-relic-btn {
    border: none !important;
    outline: none !important;
    padding: 8px 16px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    transition: all 0.15s ease !important;
    font-family: inherit !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
}

.tw-relic-btn-primary {
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
    color: #ffffff !important;
    border: 1px solid #38bdf8 !important;
}

.tw-relic-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.4) !important;
    transform: translateY(-1px) !important;
}

.tw-relic-btn-success {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
    color: #ffffff !important;
    border: 1px solid #4ade80 !important;
}

.tw-relic-btn-success:hover:not(:disabled) {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
    box-shadow: 0 0 15px rgba(74, 222, 128, 0.4) !important;
    transform: translateY(-1px) !important;
}

.tw-relic-btn-danger {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
    color: #ffffff !important;
    border: 1px solid #f87171 !important;
}

.tw-relic-btn-danger:hover:not(:disabled) {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
}

.tw-relic-btn-secondary {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #cbd5e1 !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

.tw-relic-btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15) !important;
    color: #ffffff !important;
}

.tw-relic-btn:disabled {
    opacity: 0.45 !important;
    cursor: not-allowed !important;
    transform: none !important;
}

/* Progress Bar */
.tw-relic-progress-container {
    background: rgba(15, 23, 42, 0.9) !important;
    border: 1px solid rgba(56, 189, 248, 0.3) !important;
    border-radius: 10px !important;
    padding: 10px 14px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
}

.tw-relic-progress-info {
    display: flex !important;
    justify-content: space-between !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #bae6fd !important;
}

.tw-relic-progress-track {
    width: 100% !important;
    height: 10px !important;
    background: #0f172a !important;
    border-radius: 6px !important;
    overflow: hidden !important;
    border: 1px solid #334155 !important;
}

.tw-relic-progress-bar {
    height: 100% !important;
    width: 0% !important;
    background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%) !important;
    transition: width 0.2s ease !important;
    box-shadow: 0 0 10px #38bdf8 !important;
}

/* Fusion Recipe Cards */
.tw-relic-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
}

.tw-relic-recipe-card {
    background: rgba(30, 41, 59, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.09) !important;
    border-radius: 10px !important;
    padding: 10px 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 12px !important;
    transition: all 0.15s ease !important;
}

.tw-relic-recipe-card:hover {
    background: rgba(30, 41, 59, 0.8) !important;
    border-color: rgba(56, 189, 248, 0.3) !important;
}

.tw-relic-recipe-card.fused {
    border-color: rgba(74, 222, 128, 0.4) !important;
    background: rgba(22, 101, 52, 0.2) !important;
    opacity: 0.65 !important;
}

.tw-relic-recipe-left {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    flex: 1 !important;
    min-width: 0 !important;
}

.tw-relic-slots-group {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
}

.tw-relic-slot-item {
    width: 44px !important;
    height: 44px !important;
    border-radius: 8px !important;
    border: 2px solid #475569 !important;
    background: #0f172a !important;
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
}

.tw-relic-slot-item img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
}

.tw-relic-slot-badge {
    position: absolute !important;
    bottom: 1px !important;
    right: 1px !important;
    background: rgba(0, 0, 0, 0.85) !important;
    font-size: 9px !important;
    font-weight: 700 !important;
    padding: 1px 3px !important;
    border-radius: 4px !important;
    color: #fff !important;
}

.tw-relic-arrow {
    color: #38bdf8 !important;
    font-size: 16px !important;
    font-weight: bold !important;
}

.tw-relic-recipe-desc {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    min-width: 0 !important;
}

.tw-relic-recipe-title {
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #f1f5f9 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}

.tw-relic-recipe-sub {
    font-size: 11px !important;
    color: #94a3b8 !important;
}

.tw-relic-outcome-badge {
    padding: 4px 10px !important;
    border-radius: 6px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
}

/* Inventory Grid Tab */
.tw-relic-inventory-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
    gap: 10px !important;
}

.tw-relic-card {
    background: rgba(30, 41, 59, 0.6) !important;
    border-radius: 10px !important;
    padding: 10px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    transition: all 0.15s ease !important;
}

.tw-relic-card:hover {
    border-color: rgba(56, 189, 248, 0.4) !important;
    background: rgba(30, 41, 59, 0.9) !important;
}

.tw-relic-card-header {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}

.tw-relic-card-img {
    width: 42px !important;
    height: 42px !important;
    border-radius: 6px !important;
    background: #0f172a !important;
    border: 2px solid transparent !important;
    object-fit: cover !important;
}

.tw-relic-card-info {
    flex: 1 !important;
    min-width: 0 !important;
}

.tw-relic-card-name {
    font-size: 12px !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}

.tw-relic-card-type {
    font-size: 11px !important;
    color: #94a3b8 !important;
}

.tw-relic-card-stats {
    font-size: 10px !important;
    color: #cbd5e1 !important;
    background: rgba(0,0,0,0.3) !important;
    border-radius: 6px !important;
    padding: 5px 8px !important;
    line-height: 1.4 !important;
}

.tw-relic-card-actions {
    display: flex !important;
    gap: 6px !important;
    margin-top: auto !important;
}

.tw-relic-badge-btn {
    flex: 1 !important;
    border: none !important;
    outline: none !important;
    padding: 4px 6px !important;
    border-radius: 4px !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
    transition: all 0.15s ease !important;
}

.tw-relic-badge-junk {
    background: rgba(239, 68, 68, 0.15) !important;
    color: #f87171 !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.tw-relic-badge-junk.active {
    background: #ef4444 !important;
    color: #ffffff !important;
}

.tw-relic-badge-fav {
    background: rgba(234, 179, 8, 0.15) !important;
    color: #facc15 !important;
    border: 1px solid rgba(234, 179, 8, 0.3) !important;
}

.tw-relic-badge-fav.active {
    background: #eab308 !important;
    color: #000000 !important;
}

/* Execution Log Tab */
.tw-relic-log-box {
    background: #090e17 !important;
    border: 1px solid #1e293b !important;
    border-radius: 10px !important;
    padding: 12px !important;
    font-family: 'JetBrains Mono', 'Courier New', monospace !important;
    font-size: 11px !important;
    line-height: 1.6 !important;
    max-height: 400px !important;
    overflow-y: auto !important;
    color: #cbd5e1 !important;
}

.tw-relic-log-item {
    margin-bottom: 4px !important;
    padding-bottom: 4px !important;
    border-bottom: 1px dotted rgba(255, 255, 255, 0.05) !important;
}

.tw-relic-log-ok { color: #4ade80 !important; }
.tw-relic-log-warn { color: #fbbf24 !important; }
.tw-relic-log-err { color: #f87171 !important; }
.tw-relic-log-info { color: #38bdf8 !important; }

/* Empty state */
.tw-relic-empty {
    text-align: center !important;
    padding: 30px 10px !important;
    color: #94a3b8 !important;
    font-size: 13px !important;
}
</style>
`;

    // ===========================================================================
    // HTML DA INTERFACE
    // ===========================================================================
    function buildInterfaceHtml() {
        return `
${fusionStyles}
<div id="twRelicFusionContainer">
    <!-- Header -->
    <div class="tw-relic-header" id="twRelicHeader">
        <div class="tw-relic-title">
            <span>🔮 ${SCRIPT_NAME}</span>
            <span class="version-badge">${SCRIPT_VERSION}</span>
            <span class="version-badge" style="background: rgba(234, 179, 8, 0.2); border-color: #f59e0b; color: #fde68a;">OND BR143</span>
        </div>
        <div class="tw-relic-controls">
            <button class="tw-relic-btn-icon" id="twRelicBtnMinimize" title="Minimizar / Restaurar">_</button>
            <button class="tw-relic-btn-icon" id="twRelicBtnClose" title="Fechar">&times;</button>
        </div>
    </div>

    <!-- Navegação de Abas -->
    <div class="tw-relic-tabs" id="twRelicTabs">
        <button class="tw-relic-tab-btn active" data-tab="fusion">
            <span>⚡ Painel de Fusão</span>
            <span class="tab-count" id="twTabCountFusion">0</span>
        </button>
        <button class="tw-relic-tab-btn" data-tab="inventory">
            <span>🎒 Meu Inventário</span>
            <span class="tab-count" id="twTabCountInventory">0</span>
        </button>
        <button class="tw-relic-tab-btn" data-tab="log">
            <span>📜 Log de Execução</span>
            <span class="tab-count" id="twTabCountLog">0</span>
        </button>
    </div>

    <!-- Painel de Estatísticas -->
    <div style="padding: 12px 20px 0; background: rgba(15, 23, 42, 0.65);">
        <div class="tw-relic-stats-grid">
            <div class="tw-relic-stat-card">
                <span class="tw-relic-stat-label">Total de Relíquias</span>
                <span class="tw-relic-stat-val" id="twStatTotal">0</span>
            </div>
            <div class="tw-relic-stat-card">
                <span class="tw-relic-stat-label">Disponíveis (Livres)</span>
                <span class="tw-relic-stat-val" style="color: #38bdf8;" id="twStatFree">0</span>
            </div>
            <div class="tw-relic-stat-card">
                <span class="tw-relic-stat-label">Em Aldeias / Bloq.</span>
                <span class="tw-relic-stat-val" style="color: #94a3b8;" id="twStatEquipped">0</span>
            </div>
            <div class="tw-relic-stat-card">
                <span class="tw-relic-stat-label">Lixo Marcado</span>
                <span class="tw-relic-stat-val" style="color: #f87171;" id="twStatJunk">0</span>
            </div>
            <div class="tw-relic-stat-card">
                <span class="tw-relic-stat-label">Fusões Possíveis</span>
                <span class="tw-relic-stat-val" style="color: #4ade80;" id="twStatPossible">0</span>
            </div>
        </div>
    </div>

    <!-- Corpo com Abas -->
    <div class="tw-relic-body" id="twRelicBody">
        <!-- ABA 1: PAINEL DE FUSÃO -->
        <div id="twTabPaneFusion" style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Painel de Configurações e Filtros -->
            <div class="tw-relic-config-box">
                <div class="tw-relic-config-row">
                    <div style="font-size: 13px; font-weight: 700; color: #bae6fd;">⚙️ Configuração da Fusão</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label style="font-size: 12px; color: #94a3b8;">Modo de Combinação:</label>
                        <select class="tw-relic-select" id="twSelectMode">
                            <option value="same_type">Garantido: Somente Mesmo Tipo (Sem RNG)</option>
                            <option value="smart" selected>Inteligente: Tipo Idêntico Primeiro + Lixo Restante</option>
                            <option value="junk_only">Limpeza de Lixo: Fundir Somente Marcadas como Lixo</option>
                            <option value="any">Agressivo: Qualquer 3 da Mesma Qualidade</option>
                        </select>
                    </div>
                </div>

                <div class="tw-relic-config-row">
                    <div class="tw-relic-checkbox-group">
                        <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Fundir Qualidades:</span>
                        <label class="tw-relic-checkbox-item">
                            <input type="checkbox" id="twCheckShoddy" ${userPrefs.fuseShoddy ? 'checked' : ''}>
                            <span style="color: ${QUALITY_COLORS.shoddy}; font-weight: 600;">Má Qualidade (0★)</span>
                        </label>
                        <label class="tw-relic-checkbox-item">
                            <input type="checkbox" id="twCheckPolished" ${userPrefs.fusePolished ? 'checked' : ''}>
                            <span style="color: ${QUALITY_COLORS.polished}; font-weight: 600;">Resistente (1★)</span>
                        </label>
                        <label class="tw-relic-checkbox-item">
                            <input type="checkbox" id="twCheckRefined" ${userPrefs.fuseRefined ? 'checked' : ''}>
                            <span style="color: ${QUALITY_COLORS.refined}; font-weight: 600;">Aprimorado (2★)</span>
                        </label>
                        <label class="tw-relic-checkbox-item">
                            <input type="checkbox" id="twCheckSuperior" ${userPrefs.fuseSuperior ? 'checked' : ''}>
                            <span style="color: ${QUALITY_COLORS.superior}; font-weight: 600;">Superior (3★)</span>
                        </label>
                    </div>
                </div>

                <div class="tw-relic-config-row" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
                    <div class="tw-relic-checkbox-group">
                        <label class="tw-relic-checkbox-item" title="Nunca usa relíquias marcadas como Favorito">
                            <input type="checkbox" id="twCheckProtectFav" ${userPrefs.protectFavorites ? 'checked' : ''}>
                            <span style="color: #facc15;">⭐ Proteger Favoritos (Inviolável)</span>
                        </label>
                        <label class="tw-relic-checkbox-item" title="Após fundir as de má qualidade, continua fundindo as novas geradas recursivamente">
                            <input type="checkbox" id="twCheckCascade" ${userPrefs.cascade ? 'checked' : ''}>
                            <span>🔄 Fusão em Cascata (Recursiva)</span>
                        </label>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label style="font-size: 12px; color: #94a3b8;">Intervalo:</label>
                        <select class="tw-relic-select" id="twSelectDelay">
                            <option value="350">350 ms (Rápido)</option>
                            <option value="500" selected>500 ms (Recomendado)</option>
                            <option value="800">800 ms (Suave)</option>
                            <option value="1200">1.2 s (Lento / Humano)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Botões de Ação do Painel de Fusão -->
            <div class="tw-relic-actions">
                <button class="tw-relic-btn tw-relic-btn-primary" id="twBtnRecalc">
                    <span>🔍 Simular / Recalcular Combinações</span>
                </button>
                <button class="tw-relic-btn tw-relic-btn-success" id="twBtnStartFusion" disabled>
                    <span>⚡ Iniciar Fusão em Massa</span>
                </button>
                <button class="tw-relic-btn tw-relic-btn-danger" id="twBtnStopFusion" style="display: none;">
                    <span>⏹️ Interromper</span>
                </button>
                <button class="tw-relic-btn tw-relic-btn-secondary" id="twBtnReloadData">
                    <span>🔄 Recarregar Dados do TW</span>
                </button>
                <div style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                    <button class="tw-relic-btn tw-relic-btn-secondary" id="twBtnSelectAll" style="font-size: 11px; padding: 6px 10px;">
                        <span>☑️ Marcar Todas</span>
                    </button>
                    <button class="tw-relic-btn tw-relic-btn-secondary" id="twBtnDeselectAll" style="font-size: 11px; padding: 6px 10px;">
                        <span>☐ Desmarcar Todas</span>
                    </button>
                </div>
            </div>

            <!-- Barra de Progresso (Visível durante execução) -->
            <div class="tw-relic-progress-container" id="twProgressContainer" style="display: none;">
                <div class="tw-relic-progress-info">
                    <span id="twProgressStatus">Executando fusões...</span>
                    <span id="twProgressCount">0 / 0 (0%)</span>
                </div>
                <div class="tw-relic-progress-track">
                    <div class="tw-relic-progress-bar" id="twProgressBar"></div>
                </div>
            </div>

            <!-- Lista de Fusões Planejadas -->
            <div class="tw-relic-list" id="twFusionList">
                <div class="tw-relic-empty">
                    Clique em <strong>"Simular / Recalcular Combinações"</strong> para analisar seu inventário e gerar as receitas de fusão automáticas.
                </div>
            </div>
        </div>

        <!-- ABA 2: MEU INVENTÁRIO COM AÇÕES RÁPIDAS -->
        <div id="twTabPaneInventory" style="display: none; flex-direction: column; gap: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="font-size: 13px; color: #cbd5e1;">
                    Marque rapidamente relíquias como <strong>Lixo</strong> (para serem consumidas em fusão) ou <strong>Favoritas</strong> (protegidas).
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <label style="font-size: 12px; color: #94a3b8;">Filtrar:</label>
                    <select class="tw-relic-select" id="twInventoryFilterQuality">
                        <option value="all">Todas as Qualidades</option>
                        <option value="shoddy">De má qualidade</option>
                        <option value="polished">Resistente</option>
                        <option value="refined">Aprimorado</option>
                        <option value="superior">Superior</option>
                        <option value="renowned">Reconhecido</option>
                    </select>
                    <select class="tw-relic-select" id="twInventoryFilterMark">
                        <option value="all">Todas as Marcações</option>
                        <option value="junk">Somente Lixo</option>
                        <option value="favorite">Somente Favoritos</option>
                        <option value="unmarked">Sem Marcação</option>
                    </select>
                </div>
            </div>
            <div class="tw-relic-inventory-grid" id="twInventoryGrid">
                <!-- Cards renderizados dinamicamente -->
            </div>
        </div>

        <!-- ABA 3: LOG DE EXECUÇÃO -->
        <div id="twTabPaneLog" style="display: none; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; color: #94a3b8;">Registro detalhado de operações e respostas do servidor:</span>
                <button class="tw-relic-btn tw-relic-btn-secondary" id="twBtnClearLog" style="font-size: 11px; padding: 4px 10px;">Limpar Log</button>
            </div>
            <div class="tw-relic-log-box" id="twLogBox">
                <div class="tw-relic-log-item tw-relic-log-info">✨ Otimizador de Relíquias inicializado com sucesso. Aguardando comando.</div>
            </div>
        </div>
    </div>
</div>
`;
    }

    // ===========================================================================
    // SISTEMA DE LOGGING
    // ===========================================================================
    function addLog(message, type = 'info') {
        const logBox = document.getElementById('twLogBox');
        if (!logBox) return;

        const time = new Date().toLocaleTimeString('pt-BR');
        const item = document.createElement('div');
        item.className = `tw-relic-log-item tw-relic-log-${type}`;
        item.innerHTML = `<strong>[${time}]</strong> ${message}`;
        logBox.appendChild(item);
        logBox.scrollTop = logBox.scrollHeight;

        const logCountEl = document.getElementById('twTabCountLog');
        if (logCountEl) {
            logCountEl.textContent = logBox.children.length;
        }
    }

    // ===========================================================================
    // OBTENÇÃO E PARSING DE DADOS DAS RELÍQUIAS DO JOGO
    // ===========================================================================
    async function loadRelicsData() {
        addLog('Carregando dados das relíquias...', 'info');

        // Cenário 1: Já estamos na tela relic_system e o objeto RelicSystem está instanciado
        if (window.RelicSystem && window.RelicSystem.Inventory && Array.isArray(window.RelicSystem.Inventory.all_relics) && window.RelicSystem.Inventory.all_relics.length > 0) {
            appState.relics = window.RelicSystem.Inventory.all_relics;
            appState.materials = window.RelicSystem.Inventory.materials || [];
            updateStatsAndViews();
            addLog(`✅ Carregadas ${appState.relics.length} relíquias diretamente da página da Tesouraria!`, 'ok');
            return;
        }

        // Cenário 2: Usuário está em outra página (ex: visualização geral, mapa, etc.)
        // Buscamos a página relic_system em background e parseamos o JSON
        try {
            const villageId = (window.game_data && window.game_data.village && window.game_data.village.id) || '';
            const url = `/game.php?village=${villageId}&screen=relic_system`;
            addLog(`Buscando dados da Tesouraria via AJAX (${url})...`, 'info');

            const html = await $.ajax({
                url: url,
                type: 'GET',
                dataType: 'html'
            });

            // Extrai a chamada RelicSystem.Inventory.init(...) usando balanceamento de colchetes
            const marker = 'RelicSystem.Inventory.init(';
            const idx = html.indexOf(marker);
            if (idx === -1) {
                throw new Error('Não foi possível encontrar RelicSystem.Inventory.init na resposta do jogo.');
            }

            const after = html.slice(idx + marker.length).trim();
            const start = after.indexOf('[');
            if (start === -1) {
                throw new Error('Formato inesperado de dados de relíquias.');
            }

            let depth = 0;
            let end = -1;
            for (let i = start; i < after.length; i++) {
                if (after[i] === '[') depth++;
                else if (after[i] === ']') {
                    depth--;
                    if (depth === 0) {
                        end = i;
                        break;
                    }
                }
            }

            if (end === -1) {
                throw new Error('Erro ao delimitar array JSON de relíquias.');
            }

            const jsonStr = after.slice(start, end + 1);
            const relics = JSON.parse(jsonStr);

            appState.relics = relics;
            updateStatsAndViews();
            addLog(`✅ Sucesso! Carregadas ${relics.length} relíquias via consulta em segundo plano!`, 'ok');

            if (window.UI && typeof window.UI.SuccessMessage === 'function') {
                window.UI.SuccessMessage(`🔮 ${relics.length} relíquias carregadas com sucesso!`, 2000);
            }
        } catch (err) {
            console.error('Erro ao buscar relíquias:', err);
            addLog(`❌ Falha ao carregar relíquias: ${err.message}`, 'err');
            if (window.UI && typeof window.UI.ErrorMessage === 'function') {
                window.UI.ErrorMessage('Erro ao carregar relíquias. Abra a aba Tesouraria e tente novamente.', 3000);
            }
        }
    }

    // ===========================================================================
    // CÁLCULO E ATUALIZAÇÃO DE ESTATÍSTICAS
    // ===========================================================================
    function updateStatsAndViews() {
        const total = appState.relics.length;
        const free = appState.relics.filter(r => !r.village_id && !r.trade_offer_id && !r.inactive_until);
        const equipped = appState.relics.filter(r => r.village_id || r.trade_offer_id || r.inactive_until);
        const junk = free.filter(r => r.mark === 'junk');

        appState.stats.total = total;
        appState.stats.free = free.length;
        appState.stats.equipped = equipped.length;

        document.getElementById('twStatTotal').textContent = total;
        document.getElementById('twStatFree').textContent = free.length;
        document.getElementById('twStatEquipped').textContent = equipped.length;
        document.getElementById('twStatJunk').textContent = junk.length;
        document.getElementById('twTabCountInventory').textContent = total;

        renderInventoryTab();
        calculateFusions();
    }

    // ===========================================================================
    // ALGORITMO INTELIGENTE DE FUSÃO E SIMULAÇÃO DE RECEITAS
    // ===========================================================================
    function calculateFusions() {
        const allowedQualities = [];
        if (userPrefs.fuseShoddy) allowedQualities.push('shoddy');
        if (userPrefs.fusePolished) allowedQualities.push('polished');
        if (userPrefs.fuseRefined) allowedQualities.push('refined');
        if (userPrefs.fuseSuperior) allowedQualities.push('superior');

        // Filtra relíquias elegíveis
        let pool = appState.relics.filter(r => {
            // Não pode estar em aldeia, nem em troca, nem em cooldown
            if (r.village_id || r.trade_offer_id || r.inactive_until) return false;
            // Qualidade permitida
            if (!allowedQualities.includes(r.quality)) return false;
            // Reconhecido não pode ser aprimorado
            if (r.quality === 'renowned') return false;
            // Proteção de favoritos
            if (userPrefs.protectFavorites && r.mark === 'favorite') return false;
            return true;
        });

        // Aplica restrição do modo "Somente Lixo"
        if (userPrefs.mode === 'junk_only') {
            pool = pool.filter(r => r.mark === 'junk');
        }

        const recipes = [];
        const usedIds = new Set();

        // Processa qualidade por qualidade em ordem (shoddy -> polished -> refined -> superior)
        for (const q of allowedQualities) {
            const qRelics = pool.filter(r => r.quality === q && !usedIds.has(r.id));
            if (qRelics.length < 3) continue;

            // FASE 1: Fusões Perfeitas (Mesmo Tipo)
            // Se o modo for 'same_type', 'smart' ou 'any', procuramos trios idênticos primeiro
            if (userPrefs.mode !== 'junk_only') {
                const byType = {};
                for (const r of qRelics) {
                    if (usedIds.has(r.id)) continue;
                    if (!byType[r.type]) byType[r.type] = [];
                    byType[r.type].push(r);
                }

                for (const type in byType) {
                    const list = byType[type];
                    while (list.length >= 3) {
                        // Se houver lixo deste tipo, prefere usar lixo nos slots 1 e 2
                        list.sort((a, b) => {
                            if (a.mark === 'junk' && b.mark !== 'junk') return 1;
                            if (a.mark !== 'junk' && b.mark === 'junk') return -1;
                            return 0;
                        });

                        const main = list.shift();
                        const mat1 = list.shift();
                        const mat2 = list.shift();

                        usedIds.add(main.id);
                        usedIds.add(mat1.id);
                        usedIds.add(mat2.id);

                        const nextQuality = getNextQuality(q);

                        recipes.push({
                            id: `fusion_${main.id}_${mat1.id}_${mat2.id}`,
                            main: main,
                            mat1: mat1,
                            mat2: mat2,
                            isSameType: true,
                            targetQuality: nextQuality,
                            targetTypeName: main.type_name,
                            selected: true
                        });
                    }
                }
            }

            // FASE 2: Fusões com Lixo / Sobras
            if (userPrefs.mode === 'smart' || userPrefs.mode === 'junk_only' || userPrefs.mode === 'any') {
                const remaining = qRelics.filter(r => !usedIds.has(r.id));

                if (userPrefs.mode === 'smart') {
                    // No modo inteligente: separa quem é lixo e quem é relíquia normal
                    const nonJunk = remaining.filter(r => r.mark !== 'junk');
                    const junkList = remaining.filter(r => r.mark === 'junk');

                    // Prioridade 2A: 1 normal + 2 lixos
                    while (nonJunk.length >= 1 && junkList.length >= 2) {
                        const main = nonJunk.shift();
                        const mat1 = junkList.shift();
                        const mat2 = junkList.shift();

                        usedIds.add(main.id);
                        usedIds.add(mat1.id);
                        usedIds.add(mat2.id);

                        recipes.push({
                            id: `fusion_${main.id}_${mat1.id}_${mat2.id}`,
                            main: main,
                            mat1: mat1,
                            mat2: mat2,
                            isSameType: false,
                            targetQuality: getNextQuality(q),
                            targetTypeName: 'Aleatório',
                            selected: true
                        });
                    }

                    // Prioridade 2B: Sobraram 3 lixos? Funde lixo com lixo!
                    while (junkList.length >= 3) {
                        const main = junkList.shift();
                        const mat1 = junkList.shift();
                        const mat2 = junkList.shift();

                        usedIds.add(main.id);
                        usedIds.add(mat1.id);
                        usedIds.add(mat2.id);

                        recipes.push({
                            id: `fusion_${main.id}_${mat1.id}_${mat2.id}`,
                            main: main,
                            mat1: mat1,
                            mat2: mat2,
                            isSameType: (main.type === mat1.type && main.type === mat2.type),
                            targetQuality: getNextQuality(q),
                            targetTypeName: (main.type === mat1.type && main.type === mat2.type) ? main.type_name : 'Aleatório',
                            selected: true
                        });
                    }
                } else if (userPrefs.mode === 'junk_only' || userPrefs.mode === 'any') {
                    // Agrupa de 3 em 3 o que sobrou
                    const list = remaining.slice();
                    while (list.length >= 3) {
                        const main = list.shift();
                        const mat1 = list.shift();
                        const mat2 = list.shift();

                        usedIds.add(main.id);
                        usedIds.add(mat1.id);
                        usedIds.add(mat2.id);

                        recipes.push({
                            id: `fusion_${main.id}_${mat1.id}_${mat2.id}`,
                            main: main,
                            mat1: mat1,
                            mat2: mat2,
                            isSameType: (main.type === mat1.type && main.type === mat2.type),
                            targetQuality: getNextQuality(q),
                            targetTypeName: (main.type === mat1.type && main.type === mat2.type) ? main.type_name : 'Aleatório',
                            selected: true
                        });
                    }
                }
            }
        }

        appState.plannedFusions = recipes;
        document.getElementById('twStatPossible').textContent = recipes.length;
        document.getElementById('twTabCountFusion').textContent = recipes.length;

        const startBtn = document.getElementById('twBtnStartFusion');
        if (startBtn) {
            startBtn.disabled = recipes.length === 0;
            startBtn.innerHTML = `<span>⚡ Iniciar Fusão em Massa (${recipes.length})</span>`;
        }

        renderFusionRecipes();
    }

    function getNextQuality(curr) {
        const idx = QUALITIES.indexOf(curr);
        if (idx !== -1 && idx < QUALITIES.length - 1) {
            return QUALITIES[idx + 1];
        }
        return curr;
    }

    // ===========================================================================
    // RENDERIZAÇÃO DA LISTA DE FUSÕES
    // ===========================================================================
    function renderFusionRecipes() {
        const container = document.getElementById('twFusionList');
        if (!container) return;

        if (appState.plannedFusions.length === 0) {
            container.innerHTML = `
                <div class="tw-relic-empty">
                    Nenhuma combinação possível encontrada com as opções selecionadas.<br>
                    <span style="font-size: 11px; color: #64748b;">(Tente marcar relíquias como Lixo, habilitar outras qualidades ou mudar para o modo Inteligente / Agressivo).</span>
                </div>
            `;
            return;
        }

        let html = '';
        appState.plannedFusions.forEach((f, idx) => {
            const outcomeColor = QUALITY_COLORS[f.targetQuality] || '#38bdf8';
            const outcomeName = QUALITY_LABELS[f.targetQuality] || f.targetQuality;

            const badgeType = f.isSameType 
                ? `<span class="tw-relic-outcome-badge" style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e;">🎯 Garantido: ${f.targetTypeName} [${outcomeName}]</span>`
                : `<span class="tw-relic-outcome-badge" style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid #0ea5e9;">🎲 Aleatório: [${outcomeName}]</span>`;

            html += `
            <div class="tw-relic-recipe-card ${f.done ? 'fused' : ''}" id="recipe_card_${f.id}">
                <div class="tw-relic-recipe-left">
                    <input type="checkbox" class="tw-relic-recipe-check" data-id="${f.id}" ${f.selected ? 'checked' : ''} ${appState.isRunning ? 'disabled' : ''}>
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; width: 22px;">#${idx + 1}</span>
                    
                    <div class="tw-relic-slots-group">
                        <!-- Slot Principal -->
                        <div class="tw-relic-slot-item" style="border-color: ${QUALITY_COLORS[f.main.quality]};" title="Principal: ${f.main.name}">
                            <img src="${f.main.image184_path || f.main.image46_path}" alt="">
                            <span class="tw-relic-slot-badge" style="color: ${QUALITY_COLORS[f.main.quality]};">Base</span>
                        </div>

                        <span style="font-size: 14px; color: #64748b;">+</span>

                        <!-- Material 1 -->
                        <div class="tw-relic-slot-item" style="border-color: ${QUALITY_COLORS[f.mat1.quality]};" title="Material 1: ${f.mat1.name}">
                            <img src="${f.mat1.image184_path || f.mat1.image46_path}" alt="">
                            ${f.mat1.mark ? `<span class="tw-relic-slot-badge" style="color: #f87171;">Lixo</span>` : ''}
                        </div>

                        <!-- Material 2 -->
                        <div class="tw-relic-slot-item" style="border-color: ${QUALITY_COLORS[f.mat2.quality]};" title="Material 2: ${f.mat2.name}">
                            <img src="${f.mat2.image184_path || f.mat2.image46_path}" alt="">
                            ${f.mat2.mark ? `<span class="tw-relic-slot-badge" style="color: #f87171;">Lixo</span>` : ''}
                        </div>
                    </div>

                    <span class="tw-relic-arrow">➔</span>

                    <div class="tw-relic-recipe-desc">
                        <div class="tw-relic-recipe-title">${f.main.name}</div>
                        <div class="tw-relic-recipe-sub">${f.main.main_stat ? f.main.main_stat.name : ''}</div>
                    </div>
                </div>

                <div>
                    ${badgeType}
                </div>
            </div>
            `;
        });

        container.innerHTML = html;

        // Checkbox individual listener
        container.querySelectorAll('.tw-relic-recipe-check').forEach(chk => {
            chk.addEventListener('change', function () {
                const id = this.dataset.id;
                const recipe = appState.plannedFusions.find(r => r.id === id);
                if (recipe) {
                    recipe.selected = this.checked;
                }
                updateStartButtonCount();
            });
        });
    }

    function updateStartButtonCount() {
        const count = appState.plannedFusions.filter(r => r.selected && !r.done).length;
        const btn = document.getElementById('twBtnStartFusion');
        if (btn) {
            btn.disabled = count === 0;
            btn.innerHTML = `<span>⚡ Iniciar Fusão em Massa (${count})</span>`;
        }
    }

    // ===========================================================================
    // RENDERIZAÇÃO DA ABA MEU INVENTÁRIO COM AÇÕES RÁPIDAS
    // ===========================================================================
    function renderInventoryTab() {
        const grid = document.getElementById('twInventoryGrid');
        if (!grid) return;

        const filterQ = document.getElementById('twInventoryFilterQuality') ? document.getElementById('twInventoryFilterQuality').value : 'all';
        const filterM = document.getElementById('twInventoryFilterMark') ? document.getElementById('twInventoryFilterMark').value : 'all';

        let list = appState.relics.slice();

        if (filterQ !== 'all') {
            list = list.filter(r => r.quality === filterQ);
        }

        if (filterM === 'junk') {
            list = list.filter(r => r.mark === 'junk');
        } else if (filterM === 'favorite') {
            list = list.filter(r => r.mark === 'favorite');
        } else if (filterM === 'unmarked') {
            list = list.filter(r => !r.mark);
        }

        if (list.length === 0) {
            grid.innerHTML = `<div class="tw-relic-empty" style="grid-column: 1 / -1;">Nenhuma relíquia encontrada com os filtros selecionados.</div>`;
            return;
        }

        let html = '';
        list.forEach(r => {
            const qColor = QUALITY_COLORS[r.quality] || '#94a3b8';
            const isEquipped = !!r.village_id;
            const isTrade = !!r.trade_offer_id;

            const isJunk = r.mark === 'junk';
            const isFav = r.mark === 'favorite';

            let statusTag = '';
            if (isEquipped) statusTag = `<span style="font-size: 10px; color: #38bdf8; font-weight: 600;">(Aldeia ${r.village_id})</span>`;
            else if (isTrade) statusTag = `<span style="font-size: 10px; color: #fbbf24; font-weight: 600;">(No Mercado)</span>`;

            html += `
            <div class="tw-relic-card" style="border-left: 3px solid ${qColor};">
                <div class="tw-relic-card-header">
                    <img class="tw-relic-card-img" style="border-color: ${qColor};" src="${r.image184_path || r.image46_path}" alt="">
                    <div class="tw-relic-card-info">
                        <div class="tw-relic-card-name" style="color: ${qColor};" title="${r.name}">${r.name}</div>
                        <div class="tw-relic-card-type">${r.type_name || r.type} ${statusTag}</div>
                    </div>
                </div>

                <div class="tw-relic-card-stats">
                    <strong>${r.main_stat ? r.main_stat.name : ''}</strong>
                    ${r.sub_stats && r.sub_stats.length > 0 ? r.sub_stats.map(s => `<br>• ${s.name}`).join('') : ''}
                </div>

                <div class="tw-relic-card-actions">
                    <button class="tw-relic-badge-btn tw-relic-badge-junk ${isJunk ? 'active' : ''}" data-action="toggle-junk" data-id="${r.id}">
                        🗑️ Lixo
                    </button>
                    <button class="tw-relic-badge-btn tw-relic-badge-fav ${isFav ? 'active' : ''}" data-action="toggle-fav" data-id="${r.id}">
                        ⭐ Favorito
                    </button>
                </div>
            </div>
            `;
        });

        grid.innerHTML = html;

        // Listeners para botões de Lixo e Favorito
        grid.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', async function (e) {
                e.preventDefault();
                const relicId = parseInt(this.dataset.id, 10);
                const action = this.dataset.action;
                const relic = appState.relics.find(r => r.id === relicId);
                if (!relic) return;

                let targetMark = null;
                if (action === 'toggle-junk') {
                    targetMark = relic.mark === 'junk' ? null : 'junk';
                } else if (action === 'toggle-fav') {
                    targetMark = relic.mark === 'favorite' ? null : 'favorite';
                }

                await setRelicMark(relicId, targetMark);
            });
        });
    }

    // ===========================================================================
    // COMUNICAÇÃO AJAX COM O SERVIDOR DO TRIBAL WARS
    // ===========================================================================
    async function setRelicMark(relicId, mark) {
        return new Promise((resolve) => {
            if (window.TribalWars && typeof window.TribalWars.post === 'function') {
                window.TribalWars.post('relic_system', { ajaxaction: 'set_relic_mark' }, { relic_id: relicId, mark: mark }, function (res) {
                    if (res && res.relics) {
                        appState.relics = res.relics;
                        updateStatsAndViews();
                        addLog(`Marcação da relíquia #${relicId} atualizada para: ${mark || 'nenhuma'}`, 'info');
                    }
                    resolve(true);
                }, function () {
                    addLog(`Erro ao atualizar marcação da relíquia #${relicId}`, 'err');
                    resolve(false);
                });
            } else {
                resolve(false);
            }
        });
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Executa a requisição de fusão de 3 relíquias
    async function executeSingleFusion(recipe) {
        return new Promise((resolve) => {
            const relicIds = [recipe.main.id, recipe.mat1.id, recipe.mat2.id];

            if (window.TribalWars && typeof window.TribalWars.post === 'function') {
                window.TribalWars.post('relic_system', { ajaxaction: 'upgrade_relic' }, {
                    relic_ids: relicIds,
                    material_qualities: []
                }, function (response) {
                    // Sincroniza inventário com o que o servidor devolveu
                    if (response && response.relics) {
                        appState.relics = response.relics;

                        // Se estiver na tela oficial da Tesouraria, atualiza a UI nativa do TW também!
                        if (window.RelicSystem && window.RelicSystem.Inventory && typeof window.RelicSystem.Inventory.updateData === 'function') {
                            try {
                                window.RelicSystem.Inventory.updateData(response.relics, response.village_id, response.can_equip);
                                window.RelicSystem.Inventory.updateUI();
                            } catch (e) {}
                        }
                    }

                    resolve({ success: true, response: response });
                }, function (err) {
                    resolve({ success: false, error: err });
                });
            } else {
                resolve({ success: false, error: 'TribalWars.post indisponível' });
            }
        });
    }

    // ===========================================================================
    // MOTOR DE EXECUÇÃO EM MASSA
    // ===========================================================================
    async function runFusionBatch() {
        const selected = appState.plannedFusions.filter(r => r.selected && !r.done);
        if (selected.length === 0) return;

        appState.isRunning = true;
        appState.shouldCancel = false;

        document.getElementById('twBtnStartFusion').style.display = 'none';
        document.getElementById('twBtnStopFusion').style.display = 'inline-flex';
        document.getElementById('twBtnRecalc').disabled = true;
        document.getElementById('twBtnReloadData').disabled = true;

        const progressContainer = document.getElementById('twProgressContainer');
        const progressBar = document.getElementById('twProgressBar');
        const progressStatus = document.getElementById('twProgressStatus');
        const progressCount = document.getElementById('twProgressCount');

        progressContainer.style.display = 'flex';

        const total = selected.length;
        let successCount = 0;
        let errorCount = 0;

        addLog(`🚀 Iniciando execução de ${total} fusões programadas...`, 'info');

        for (let i = 0; i < total; i++) {
            if (appState.shouldCancel) {
                addLog('⏹️ Operação cancelada pelo usuário.', 'warn');
                break;
            }

            const item = selected[i];
            const pct = Math.round(((i) / total) * 100);
            progressBar.style.width = `${pct}%`;
            progressCount.textContent = `${i + 1} / ${total} (${pct}%)`;
            progressStatus.textContent = `Fundindo: ${item.main.name} (${item.main.quality}) + 2 materiais...`;

            // Marca visualmente na lista
            const card = document.getElementById(`recipe_card_${item.id}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                card.style.borderColor = '#38bdf8';
            }

            // Envia para o servidor TW
            const res = await executeSingleFusion(item);

            if (res.success) {
                successCount++;
                item.done = true;
                if (card) {
                    card.classList.add('fused');
                    card.style.borderColor = 'rgba(74, 222, 128, 0.4)';
                }

                addLog(`[OK] #${i + 1} Fusão concluída: ${item.main.name} + [${item.mat1.name}, ${item.mat2.name}] ➔ Nova relíquia gerada!`, 'ok');
            } else {
                errorCount++;
                addLog(`[ERRO] #${i + 1} Falha ao fundir: ${item.main.name}`, 'err');
            }

            // Intervalo com Jitter natural anti-detecção
            const baseDelay = parseInt(userPrefs.delayMs, 10) || 500;
            const jitter = Math.floor(Math.random() * 120) - 60;
            const finalDelay = Math.max(250, baseDelay + jitter);
            await delay(finalDelay);
        }

        progressBar.style.width = '100%';
        progressCount.textContent = `${total} / ${total} (100%)`;
        progressStatus.textContent = `Concluído: ${successCount} fusões realizadas com sucesso!`;

        addLog(`🎉 Ciclo de fusão finalizado! Sucessos: ${successCount} | Erros: ${errorCount}`, successCount > 0 ? 'ok' : 'warn');

        if (window.UI && typeof window.UI.SuccessMessage === 'function') {
            window.UI.SuccessMessage(`🔮 ${successCount} fusões de relíquias concluídas com sucesso!`, 3500);
        }

        // Se a opção cascata estiver ativada e houver novos upgrades disponíveis
        if (userPrefs.cascade && !appState.shouldCancel && successCount > 0) {
            addLog('🔄 Modo Cascata: recalculando novas fusões de níveis superiores...', 'info');
            updateStatsAndViews();
            const nextRound = appState.plannedFusions.filter(r => r.selected && !r.done);
            if (nextRound.length > 0) {
                addLog(`🔄 Modo Cascata encontrou mais ${nextRound.length} fusões possíveis. Executando rodada...`, 'info');
                await delay(800);
                await runFusionBatch();
                return;
            }
        }

        appState.isRunning = false;
        document.getElementById('twBtnStartFusion').style.display = 'inline-flex';
        document.getElementById('twBtnStopFusion').style.display = 'none';
        document.getElementById('twBtnRecalc').disabled = false;
        document.getElementById('twBtnReloadData').disabled = false;

        updateStatsAndViews();
    }

    // ===========================================================================
    // CONTROLES DE JANELA (Arrastar, Minimizar, Fechar, Abas)
    // ===========================================================================
    function setupWindowEvents() {
        const container = document.getElementById('twRelicFusionContainer');
        const header = document.getElementById('twRelicHeader');
        const closeBtn = document.getElementById('twRelicBtnClose');
        const minBtn = document.getElementById('twRelicBtnMinimize');

        // Fechar
        closeBtn.addEventListener('click', () => {
            if (appState.isRunning) {
                if (!confirm('Uma fusão está em andamento. Deseja realmente parar e fechar?')) return;
                appState.shouldCancel = true;
            }
            container.remove();
            const styleTag = document.getElementById('twRelicFusionStyles');
            if (styleTag) styleTag.remove();
        });

        // Minimizar
        let isMinimized = false;
        minBtn.addEventListener('click', () => {
            const body = document.getElementById('twRelicBody');
            const tabs = document.getElementById('twRelicTabs');
            if (!isMinimized) {
                body.style.display = 'none';
                tabs.style.display = 'none';
                container.style.maxHeight = '60px';
                minBtn.textContent = '□';
                isMinimized = true;
            } else {
                body.style.display = 'flex';
                tabs.style.display = 'flex';
                container.style.maxHeight = '88vh';
                minBtn.textContent = '_';
                isMinimized = false;
            }
        });

        // Arrastar
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
        document.querySelectorAll('.tw-relic-tab-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.tw-relic-tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const tab = this.dataset.tab;
                appState.activeTab = tab;

                document.getElementById('twTabPaneFusion').style.display = tab === 'fusion' ? 'flex' : 'none';
                document.getElementById('twTabPaneInventory').style.display = tab === 'inventory' ? 'flex' : 'none';
                document.getElementById('twTabPaneLog').style.display = tab === 'log' ? 'flex' : 'none';

                if (tab === 'inventory') renderInventoryTab();
            });
        });

        // Configurações e Checkboxes
        document.getElementById('twCheckShoddy').addEventListener('change', function () {
            userPrefs.fuseShoddy = this.checked;
            savePrefs();
            calculateFusions();
        });
        document.getElementById('twCheckPolished').addEventListener('change', function () {
            userPrefs.fusePolished = this.checked;
            savePrefs();
            calculateFusions();
        });
        document.getElementById('twCheckRefined').addEventListener('change', function () {
            userPrefs.fuseRefined = this.checked;
            savePrefs();
            calculateFusions();
        });
        document.getElementById('twCheckSuperior').addEventListener('change', function () {
            userPrefs.fuseSuperior = this.checked;
            savePrefs();
            calculateFusions();
        });
        document.getElementById('twCheckProtectFav').addEventListener('change', function () {
            userPrefs.protectFavorites = this.checked;
            savePrefs();
            calculateFusions();
        });
        document.getElementById('twCheckCascade').addEventListener('change', function () {
            userPrefs.cascade = this.checked;
            savePrefs();
        });
        document.getElementById('twSelectMode').addEventListener('change', function () {
            userPrefs.mode = this.value;
            savePrefs();
            calculateFusions();
        });
        document.getElementById('twSelectDelay').addEventListener('change', function () {
            userPrefs.delayMs = parseInt(this.value, 10);
            savePrefs();
        });

        // Filtros da aba de Inventário
        const invQ = document.getElementById('twInventoryFilterQuality');
        const invM = document.getElementById('twInventoryFilterMark');
        if (invQ) invQ.addEventListener('change', renderInventoryTab);
        if (invM) invM.addEventListener('change', renderInventoryTab);

        // Botões de Ação
        document.getElementById('twBtnRecalc').addEventListener('click', () => {
            calculateFusions();
            addLog(`Simulação concluída: ${appState.plannedFusions.length} receitas geradas.`, 'info');
        });

        document.getElementById('twBtnReloadData').addEventListener('click', async () => {
            await loadRelicsData();
        });

        document.getElementById('twBtnStartFusion').addEventListener('click', () => {
            runFusionBatch();
        });

        document.getElementById('twBtnStopFusion').addEventListener('click', () => {
            appState.shouldCancel = true;
            addLog('Interrupção solicitada. Concluindo tarefa atual...', 'warn');
        });

        document.getElementById('twBtnSelectAll').addEventListener('click', () => {
            appState.plannedFusions.forEach(r => r.selected = true);
            renderFusionRecipes();
            updateStartButtonCount();
        });

        document.getElementById('twBtnDeselectAll').addEventListener('click', () => {
            appState.plannedFusions.forEach(r => r.selected = false);
            renderFusionRecipes();
            updateStartButtonCount();
        });

        document.getElementById('twBtnClearLog').addEventListener('click', () => {
            const box = document.getElementById('twLogBox');
            if (box) {
                box.innerHTML = '<div class="tw-relic-log-item tw-relic-log-info">Log limpo.</div>';
                document.getElementById('twTabCountLog').textContent = '1';
            }
        });
    }

    // ===========================================================================
    // INICIALIZAÇÃO
    // ===========================================================================
    function init() {
        const div = document.createElement('div');
        div.innerHTML = buildInterfaceHtml();
        document.body.appendChild(div);

        setupWindowEvents();
        loadRelicsData();
    }

    // Executa
    init();

})();
