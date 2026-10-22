// Balanceador de Armazém Inteligente — OND BR143
// Desenvolvido por Azuelos (@jhonatanazuelosoficial)
// Uso: javascript: $.getScript("URL_DO_SCRIPT");
console.log("Balanceador de Armazém Inteligente — OND BR143 — por Azuelos");

var testPage;
var is_mobile = !!navigator.userAgent.match(/iphone|android|blackberry/ig) || false;
var warehouseCapacity = [];
var allWoodTotals = [];
var allClayTotals = [];
var allIronTotals = [];
var availableMerchants = [];
var totalMerchants = [];
var farmSpaceUsed = [];
var farmSpaceTotal = [];
var villagePoints = [];
var villagesData = [];
var villageID = [];
var allWoodObjects, allClayObjects, allIronObjects, allVillages;
var totalsAndAverages = "";
var incomingRes = {};
var totalWood = 0, totalStone = 0, totalIron = 0;
var woodAverage = 0, stoneAverage = 0, ironAverage = 0;
var actualWoodAverage = 0, actualStoneAverage = 0, actualIronAverage = 0;
var merchantOrders = [];
var excessResources = [];
var shortageResources = [];
var links = [];
var cleanLinks = [];
var stillShortage = [];
var stillExcess = [];

// Variáveis de Estado para Cunhagem Automática e Nivelamento Premium
var whAutoMintRunning = false;
var whAutoMintIndex = 0;
var whAutoMintStats = { activated: 0, alreadyActive: 0, noAcademy: 0, errors: 0 };
var whMerchantExchangeRunning = false;
var whMerchantSelectedQueue = [];
var whMerchantIndex = 0;
var whMerchantStats = { success: 0, errors: 0, ppSpent: 0 };
var whPremiumBuyRunning = false;
var whPremiumBuySpent = 0;
var whPremiumBuyBudget = 0;
var whPremiumBuyQueue = [];
var whPremiumBuyIndex = 0;

function init() {
    warehouseCapacity = [];
    allWoodTotals = [];
    allClayTotals = [];
    allIronTotals = [];
    availableMerchants = [];
    totalMerchants = [];
    farmSpaceUsed = [];
    farmSpaceTotal = [];
    villagePoints = [];
    villagesData = [];
    villageID = [];
    allWoodObjects, allClayObjects, allIronObjects, allVillages;
    totalsAndAverages = "";
    incomingRes = {};
    totalWood, totalStone, totalIron;
    merchantOrders = [];
    excessResources = [];
    shortageResources = [];
    links = [];
    cleanLinks = [];
    stillShortage = [];
    stillExcess = [];
    whAutoMintRunning = false;
    whMerchantExchangeRunning = false;
    whPremiumBuyRunning = false;
}

function cleanup() {
    warehouseCapacity = [];
    allWoodTotals = [];
    allClayTotals = [];
    allIronTotals = [];
    availableMerchants = [];
    totalMerchants = [];
    farmSpaceUsed = [];
    farmSpaceTotal = [];
    villagePoints = [];
    villageID = [];
    allWoodObjects, allClayObjects, allIronObjects, allVillages;
    incomingRes = {};
    merchantOrders = [];
    links = [];
    cleanLinks = [];
}

// ===== IDIOMA FORÇADO: PORTUGUÊS BR =====
var whLang = [
    "Balanceador de Armazém Inteligente", // 0 - título
    "Aldeia de Origem",                   // 1 - source village
    "Aldeia de Destino",                  // 2 - target village
    "Distância",                          // 3 - distance
    "Madeira",                            // 4 - wood
    "Argila",                             // 5 - clay
    "Ferro",                              // 6 - iron
    "Enviar",                             // 7 - send resources
    "por Azuelos",                        // 8 - credits
    "Total de Madeira",                   // 9 - total wood
    "Total de Argila",                    // 10 - total clay
    "Total de Ferro",                     // 11 - total iron
    "Madeira por aldeia",                 // 12 - wood per village
    "Argila por aldeia",                  // 13 - clay per village
    "Ferro por aldeia",                   // 14 - iron per village
    "Troca Premium",                      // 15 - premium exchange
    "Sistema"                             // 16 - system
];
var langShinko = whLang; // Compatibilidade de execução interna

// ===== CSS PREMIUM — DESIGN DE ALTA PERFORMANCE & CONTRASTE MÁXIMO =====
var whBalancerStyles = `
<style id="whBalancerStyles">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

/* ===== RESET & ROOT CONTAINER ===== */
#whBalancerContainer {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    color: #ffffff !important;
    margin: 12px 0 24px 0 !important;
    animation: whFadeIn 0.35s ease-out !important;
}
#whBalancerContainer *, #whBalancerContainer *::before, #whBalancerContainer *::after {
    box-sizing: border-box !important;
}

@keyframes whFadeIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ===== ISOLAMENTO TOTAL CONTRA O CSS DO TRIBAL WARS ===== */
#whBalancerContainer a,
#whBalancerContainer a:link,
#whBalancerContainer a:visited,
.wh-modal-wrapper a,
.wh-modal-wrapper a:link,
.wh-modal-wrapper a:visited {
    color: #38bdf8 !important;
    text-decoration: none !important;
}
#whBalancerContainer a:hover,
.wh-modal-wrapper a:hover {
    color: #7dd3fc !important;
    text-decoration: underline !important;
}
#whBalancerContainer strong,
.wh-modal-wrapper strong {
    color: inherit !important;
}
#whBalancerContainer th,
.wh-modal-wrapper th,
#whBalancerContainer td,
.wh-modal-wrapper td {
    background-image: none !important;
}

/* ===== PAINEL PRINCIPAL ===== */
.wh-panel {
    background: linear-gradient(145deg, #070d19 0%, #0f172a 50%, #1e293b 100%) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 16px !important;
    overflow: hidden !important;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.1) inset !important;
}

/* ===== CABEÇALHO & CRÉDITOS ===== */
.wh-title-bar {
    background: linear-gradient(135deg, #091220 0%, #0d2838 50%, #0f3d4c 100%) !important;
    padding: 16px 22px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: 2px solid #0d9488 !important;
    gap: 12px !important;
}
.wh-title-left {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
}
.wh-title-icon {
    font-size: 28px !important;
    line-height: 1 !important;
    filter: drop-shadow(0 2px 8px rgba(20, 184, 166, 0.6)) !important;
}
.wh-main-title {
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 900 !important;
    color: #ffffff !important;
    letter-spacing: 0.3px !important;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8) !important;
}
.wh-sub-title {
    font-size: 12px !important;
    color: #e2e8f0 !important;
    margin-top: 3px !important;
    font-weight: 600 !important;
}
.wh-creator-badge {
    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important;
    color: #ffffff !important;
    padding: 9px 18px !important;
    border-radius: 9999px !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    box-shadow: 0 4px 18px rgba(220, 39, 67, 0.5) !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    white-space: nowrap !important;
}
.wh-creator-badge:hover {
    transform: translateY(-2px) scale(1.04) !important;
    box-shadow: 0 8px 25px rgba(220, 39, 67, 0.75) !important;
    color: #ffffff !important;
    text-decoration: none !important;
}

/* ===== CARDS DE RECURSOS (TOTAIS & MÉDIAS) ===== */
.wh-stats-grid {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 14px !important;
    padding: 18px 20px !important;
    background: rgba(0, 0, 0, 0.35) !important;
}
.wh-stat-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 12px !important;
    padding: 14px 16px !important;
    position: relative !important;
    overflow: hidden !important;
    transition: all 0.2s ease !important;
}
.wh-stat-card:hover {
    border-color: rgba(255, 255, 255, 0.3) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 10px 28px rgba(0,0,0,0.5) !important;
}
.wh-stat-card::before {
    content: '' !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 4px !important;
}
.wh-stat-card.wood::before { background: linear-gradient(90deg, #15803d, #4ade80) !important; }
.wh-stat-card.clay::before { background: linear-gradient(90deg, #c2410c, #fb923c) !important; }
.wh-stat-card.iron::before { background: linear-gradient(90deg, #1d4ed8, #93c5fd) !important; }

.wh-stat-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 6px !important;
}
.wh-stat-title {
    font-size: 12px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.8px !important;
    color: #ffffff !important;
}
.wh-stat-icon {
    font-size: 22px !important;
    line-height: 1 !important;
}
.wh-stat-card.wood .wh-stat-title { color: #86efac !important; }
.wh-stat-card.clay .wh-stat-title { color: #fed7aa !important; }
.wh-stat-card.iron .wh-stat-title { color: #bae6fd !important; }

.wh-stat-val {
    font-size: 24px !important;
    font-weight: 900 !important;
    letter-spacing: -0.5px !important;
    margin-bottom: 10px !important;
    font-variant-numeric: tabular-nums !important;
}
.wh-stat-card.wood .wh-stat-val { color: #4ade80 !important; text-shadow: 0 0 12px rgba(74, 222, 128, 0.3) !important; }
.wh-stat-card.clay .wh-stat-val { color: #fb923c !important; text-shadow: 0 0 12px rgba(251, 146, 60, 0.3) !important; }
.wh-stat-card.iron .wh-stat-val { color: #93c5fd !important; text-shadow: 0 0 12px rgba(147, 197, 253, 0.3) !important; }

.wh-stat-chips {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
    font-size: 11px !important;
}
.wh-stat-chip {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 6px !important;
    padding: 4px 9px !important;
    color: #f1f5f9 !important;
    font-weight: 600 !important;
}
.wh-stat-chip strong {
    color: #ffffff !important;
    font-weight: 800 !important;
}

/* ===== BARRA DE VISÃO GERAL ===== */
.wh-overview-strip {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 12px 20px !important;
    background: rgba(0,0,0,0.45) !important;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
    font-size: 12px !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    flex-wrap: wrap !important;
    gap: 10px !important;
}
.wh-overview-item strong {
    color: #5eead4 !important;
    font-weight: 800 !important;
}

/* ===== TOOLBAR ===== */
.wh-toolbar {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 14px 20px !important;
    background: rgba(15, 23, 42, 0.95) !important;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
    gap: 12px !important;
    flex-wrap: wrap !important;
}
.wh-toolbar-left {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    flex-wrap: wrap !important;
}
.wh-btn-tool {
    background: #1e293b !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
    padding: 9px 16px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    font-family: inherit !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
}
.wh-btn-tool:hover {
    background: #334155 !important;
    border-color: rgba(255, 255, 255, 0.35) !important;
    color: #ffffff !important;
    transform: translateY(-1px) !important;
}
.wh-btn-tool.active {
    background: #0f766e !important;
    border-color: #2dd4bf !important;
    color: #ffffff !important;
}
.wh-toolbar-right {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    flex-wrap: wrap !important;
}
.wh-hotkey-badge {
    background: #854d0e !important;
    border: 1px solid #eab308 !important;
    color: #fef08a !important;
    border-radius: 6px !important;
    padding: 6px 12px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
}
.wh-progress-pill {
    background: #0f766e !important;
    border: 1px solid #14b8a6 !important;
    color: #ffffff !important;
    border-radius: 9999px !important;
    padding: 5px 14px !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
}

/* ===== PROGRESS TRACK ===== */
.wh-progress-track {
    width: 100% !important;
    height: 6px !important;
    background: rgba(0,0,0,0.6) !important;
    overflow: hidden !important;
}
.wh-progress-fill {
    height: 100% !important;
    background: linear-gradient(90deg, #0d9488 0%, #14b8a6 50%, #22c55e 100%) !important;
    transition: width 0.25s ease !important;
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.7) !important;
}

/* ===== PAINEL DE CONFIGURAÇÕES ===== */
.wh-settings-panel {
    max-height: 0 !important;
    overflow: hidden !important;
    transition: max-height 0.35s ease-out, padding 0.35s ease-out !important;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(7, 13, 25, 0.99) 100%) !important;
    border-bottom: 1px solid transparent !important;
}
.wh-settings-panel.active {
    max-height: 800px !important;
    padding: 22px !important;
    border-bottom-color: rgba(255,255,255,0.12) !important;
}
.wh-settings-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
    gap: 16px !important;
    margin-bottom: 18px !important;
}
.wh-setting-item {
    background: rgba(255,255,255,0.05) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 10px !important;
    padding: 14px !important;
}
.wh-setting-item label {
    display: block !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.6px !important;
    color: #ffffff !important;
    margin-bottom: 6px !important;
}
.wh-setting-item .wh-setting-desc {
    font-size: 11px !important;
    color: #cbd5e1 !important;
    font-weight: 500 !important;
    margin-bottom: 8px !important;
}
.wh-setting-item input[type="range"] {
    width: 100% !important;
    height: 6px !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    background: rgba(255,255,255,0.2) !important;
    border-radius: 4px !important;
    outline: none !important;
}
.wh-setting-item input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none !important;
    appearance: none !important;
    width: 18px !important;
    height: 18px !important;
    background: #14b8a6 !important;
    border: 2px solid #ffffff !important;
    border-radius: 50% !important;
    cursor: pointer !important;
    box-shadow: 0 0 10px rgba(20,184,166,0.8) !important;
}
.wh-setting-item .wh-range-value {
    font-size: 15px !important;
    font-weight: 800 !important;
    color: #2dd4bf !important;
    margin-top: 6px !important;
    text-align: right !important;
}
.wh-setting-item input[type="checkbox"] {
    width: 20px !important;
    height: 20px !important;
    accent-color: #14b8a6 !important;
    cursor: pointer !important;
}
.wh-btn-save {
    background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255,255,255,0.25) !important;
    border-radius: 10px !important;
    padding: 12px 34px !important;
    font-size: 13px !important;
    font-weight: 800 !important;
    font-family: inherit !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    letter-spacing: 0.3px !important;
    box-shadow: 0 4px 16px rgba(20,184,166,0.45) !important;
}
.wh-btn-save:hover {
    background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%) !important;
    box-shadow: 0 6px 22px rgba(20,184,166,0.65) !important;
    transform: translateY(-1px) !important;
}

/* ===== TABELA DE ENVIOS ===== */
.wh-table-wrap {
    overflow-x: auto !important;
    background: #070d19 !important;
}
table.wh-table {
    width: 100% !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    font-size: 12px !important;
    background: #070d19 !important;
    margin: 0 !important;
}
#content_value table.wh-table th,
#content_value table.wh-table thead th,
table.wh-table th,
table.wh-table thead th,
#whSendTableWrap table th,
#tableSend th {
    background: #090e17 !important;
    background-color: #090e17 !important;
    background-image: none !important;
    color: #ffffff !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.8px !important;
    padding: 14px 12px !important;
    border: 1px solid #1e293b !important;
    border-bottom: 3px solid #38bdf8 !important;
    text-align: center !important;
    text-shadow: 0 1px 3px rgba(0,0,0,0.9) !important;
    white-space: nowrap !important;
}
table.wh-table th.wh-th-orig,
table.wh-table th.wh-th-dest {
    text-align: left !important;
    color: #ffffff !important;
    border-bottom: 3px solid #38bdf8 !important;
}
table.wh-table th.wh-th-dist {
    color: #ffffff !important;
    border-bottom: 3px solid #94a3b8 !important;
}
table.wh-table th.wh-th-wood {
    color: #ffffff !important;
    border-bottom: 3px solid #22c55e !important;
}
table.wh-table th.wh-th-clay {
    color: #ffffff !important;
    border-bottom: 3px solid #f97316 !important;
}
table.wh-table th.wh-th-iron {
    color: #ffffff !important;
    border-bottom: 3px solid #3b82f6 !important;
}
table.wh-table th.wh-th-total {
    color: #ffffff !important;
    border-bottom: 3px solid #eab308 !important;
}
table.wh-table th.wh-th-act {
    color: #ffffff !important;
    border-bottom: 3px solid #14b8a6 !important;
}

table.wh-table td {
    padding: 11px 14px !important;
    border: none !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
    text-align: center !important;
    vertical-align: middle !important;
    color: #ffffff !important;
    background-image: none !important;
}
table.wh-table td.wh-td-left { text-align: left !important; }
table.wh-table tr:nth-child(even) td { background: #070d19 !important; }
table.wh-table tr:nth-child(odd) td { background: #0f172a !important; }
table.wh-table tr:hover td { background: #1e3a5f !important; }

.wh-village-link {
    color: #38bdf8 !important;
    text-decoration: none !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    transition: color 0.15s ease !important;
}
.wh-village-link:hover {
    color: #7dd3fc !important;
    text-decoration: underline !important;
    text-shadow: 0 0 8px rgba(56, 189, 248, 0.4) !important;
}
.wh-merch-badge {
    background: #0369a1 !important;
    border: 1px solid #38bdf8 !important;
    color: #ffffff !important;
    border-radius: 4px !important;
    padding: 3px 7px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    margin-left: 8px !important;
    display: inline-block !important;
}
.wh-dist-badge {
    background: #334155 !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #ffffff !important;
    border-radius: 6px !important;
    padding: 4px 9px !important;
    font-weight: 800 !important;
    font-size: 11px !important;
    display: inline-block !important;
}
.wh-res-cell {
    font-weight: 800 !important;
    font-size: 13px !important;
    font-variant-numeric: tabular-nums !important;
}
.wh-res-cell.wh-wood { color: #4ade80 !important; text-shadow: 0 0 8px rgba(74, 222, 128, 0.25) !important; }
.wh-res-cell.wh-clay { color: #fb923c !important; text-shadow: 0 0 8px rgba(251, 146, 60, 0.25) !important; }
.wh-res-cell.wh-iron { color: #93c5fd !important; text-shadow: 0 0 8px rgba(147, 197, 253, 0.25) !important; }
.wh-res-cell.wh-cargo { color: #fde047 !important; text-shadow: 0 0 8px rgba(250, 204, 21, 0.25) !important; }

/* ===== BOTÃO DE ENVIO ===== */
.wh-btn-send {
    background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 8px !important;
    padding: 8px 18px !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    font-family: inherit !important;
    cursor: pointer !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 3px 12px rgba(20, 184, 166, 0.4) !important;
    white-space: nowrap !important;
}
.wh-btn-send:hover {
    background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%) !important;
    box-shadow: 0 6px 18px rgba(20, 184, 166, 0.6) !important;
    transform: translateY(-1px) scale(1.03) !important;
}
.wh-btn-send:focus {
    outline: 2px solid #5eead4 !important;
    outline-offset: 2px !important;
}
.wh-btn-send:disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    transform: none !important;
}

/* ===== BANNER DE CONCLUSÃO ===== */
.wh-all-done-banner {
    padding: 40px 20px !important;
    text-align: center !important;
    background: linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(34, 197, 94, 0.15) 100%) !important;
    border: 2px dashed rgba(34, 197, 94, 0.4) !important;
    border-radius: 12px !important;
    margin: 16px !important;
}
.wh-done-icon { font-size: 42px !important; margin-bottom: 8px !important; }
.wh-done-title { font-size: 20px !important; font-weight: 900 !important; color: #4ade80 !important; }
.wh-done-desc { font-size: 13px !important; color: #ffffff !important; margin-top: 5px !important; font-weight: 600 !important; }

/* ===== RODAPÉ ===== */
.wh-credit-bar {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 14px 22px !important;
    background: rgba(0, 0, 0, 0.5) !important;
    border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
    font-size: 12px !important;
    color: #ffffff !important;
    font-weight: 600 !important;
}
.wh-footer-insta {
    color: #f472b6 !important;
    text-decoration: none !important;
    font-weight: 800 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    transition: color 0.15s ease !important;
}
.wh-footer-insta:hover {
    color: #fbcfe8 !important;
    text-decoration: underline !important;
}

/* ===== DIÁLOGOS E MODAIS (RESULTADO FINAL & ESCASSEZ) ===== */
.popup_box, #popup_box, #inline_popup {
    background: #070d19 !important;
    border: 2px solid #334155 !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 60px rgba(0,0,0,0.95) !important;
}
.popup_box_content {
    background: #070d19 !important;
    background-color: #070d19 !important;
    background-image: none !important;
    padding: 0 !important;
    border-radius: 14px !important;
    color: #ffffff !important;
}
.wh-modal-wrapper {
    background: #070d19 !important;
    background-color: #070d19 !important;
    background-image: none !important;
    color: #ffffff !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8) !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    max-width: 960px !important;
}
.wh-modal-header {
    background: linear-gradient(135deg, #091220 0%, #1e293b 100%) !important;
    padding: 16px 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: 2px solid #14b8a6 !important;
    gap: 10px !important;
}
.wh-modal-title {
    font-size: 17px !important;
    font-weight: 800 !important;
    color: #ffffff !important;
    letter-spacing: 0.3px !important;
}
.wh-modal-subtitle {
    font-size: 12px !important;
    color: #cbd5e1 !important;
    margin-top: 3px !important;
    font-weight: 500 !important;
}
.wh-modal-author {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888) !important;
    color: #ffffff !important;
    padding: 7px 16px !important;
    border-radius: 9999px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    text-decoration: none !important;
    box-shadow: 0 2px 10px rgba(220, 39, 67, 0.5) !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
}
.wh-modal-author:hover {
    transform: translateY(-1px) scale(1.04) !important;
    box-shadow: 0 4px 16px rgba(220, 39, 67, 0.7) !important;
    color: #ffffff !important;
}
.wh-modal-body {
    max-height: 560px !important;
    overflow-y: auto !important;
    padding: 0 !important;
    background: #070d19 !important;
}
.wh-modal-body::-webkit-scrollbar {
    width: 8px !important;
}
.wh-modal-body::-webkit-scrollbar-track {
    background: #070d19 !important;
}
.wh-modal-body::-webkit-scrollbar-thumb {
    background: #334155 !important;
    border-radius: 4px !important;
}
.wh-modal-body::-webkit-scrollbar-thumb:hover {
    background: #475569 !important;
}

table.wh-dialog-table {
    width: 100% !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    background: #070d19 !important;
    margin: 0 !important;
}
#content_value table.wh-dialog-table th,
table.wh-dialog-table th,
.popup_box table.wh-dialog-table th,
.popup_box_content table th {
    background: #090e17 !important;
    background-color: #090e17 !important;
    background-image: none !important;
    color: #ffffff !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.8px !important;
    padding: 13px 14px !important;
    border: 1px solid #1e293b !important;
    border-bottom: 3px solid #38bdf8 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.7) !important;
    text-shadow: 0 1px 3px rgba(0,0,0,0.9) !important;
    white-space: nowrap !important;
}
table.wh-dialog-table th.wh-th-village { color: #ffffff !important; text-align: left !important; border-bottom: 3px solid #38bdf8 !important; }
table.wh-dialog-table th.wh-th-points { color: #ffffff !important; text-align: right !important; border-bottom: 3px solid #94a3b8 !important; }
table.wh-dialog-table th.wh-th-merch { color: #ffffff !important; text-align: center !important; border-bottom: 3px solid #0284c7 !important; }
table.wh-dialog-table th.wh-th-wood { color: #ffffff !important; text-align: right !important; border-bottom: 3px solid #22c55e !important; }
table.wh-dialog-table th.wh-th-clay { color: #ffffff !important; text-align: right !important; border-bottom: 3px solid #f97316 !important; }
table.wh-dialog-table th.wh-th-iron { color: #ffffff !important; text-align: right !important; border-bottom: 3px solid #3b82f6 !important; }
table.wh-dialog-table th.wh-th-cap { color: #ffffff !important; text-align: right !important; border-bottom: 3px solid #eab308 !important; }

table.wh-dialog-table td {
    padding: 11px 14px !important;
    border: none !important;
    border-bottom: 1px solid rgba(255,255,255,0.06) !important;
    color: #ffffff !important;
    font-size: 12px !important;
    vertical-align: middle !important;
    background-image: none !important;
}
table.wh-dialog-table tr:nth-child(even) td { background: #070d19 !important; }
table.wh-dialog-table tr:nth-child(odd) td { background: #0f172a !important; }
table.wh-dialog-table tr:hover td { background: #1e3a5f !important; }

.wh-td-village { text-align: left !important; color: #ffffff !important; font-weight: 700 !important; font-size: 13px !important; }
.wh-td-points { text-align: right !important; color: #f8fafc !important; font-weight: 700 !important; font-variant-numeric: tabular-nums !important; }
.wh-td-merch { text-align: center !important; }
.wh-td-wood { text-align: right !important; font-variant-numeric: tabular-nums !important; }
.wh-td-clay { text-align: right !important; font-variant-numeric: tabular-nums !important; }
.wh-td-iron { text-align: right !important; font-variant-numeric: tabular-nums !important; }
.wh-td-cap { text-align: right !important; font-variant-numeric: tabular-nums !important; }

.wh-dialog-wood { color: #4ade80 !important; font-weight: 800 !important; font-size: 13px !important; text-shadow: 0 0 10px rgba(74, 222, 128, 0.3) !important; }
.wh-dialog-clay { color: #fb923c !important; font-weight: 800 !important; font-size: 13px !important; text-shadow: 0 0 10px rgba(251, 146, 60, 0.3) !important; }
.wh-dialog-iron { color: #93c5fd !important; font-weight: 800 !important; font-size: 13px !important; text-shadow: 0 0 10px rgba(147, 197, 253, 0.3) !important; }
.wh-dialog-cap { color: #fde047 !important; font-weight: 800 !important; font-size: 13px !important; text-shadow: 0 0 12px rgba(250, 204, 21, 0.35) !important; }

.wh-merch-pill {
    background: #0369a1 !important;
    border: 1px solid #38bdf8 !important;
    color: #ffffff !important;
    border-radius: 9999px !important;
    padding: 3px 9px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    display: inline-block !important;
}

.wh-badge-shortage {
    background: #991b1b !important;
    color: #ffffff !important;
    border: 1px solid #ef4444 !important;
    border-radius: 6px !important;
    padding: 4px 10px !important;
    font-weight: 800 !important;
    font-size: 12px !important;
    display: inline-block !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6) !important;
}
.wh-badge-excess {
    background: #166534 !important;
    color: #ffffff !important;
    border: 1px solid #22c55e !important;
    border-radius: 6px !important;
    padding: 4px 10px !important;
    font-weight: 800 !important;
    font-size: 12px !important;
    display: inline-block !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6) !important;
}

.wh-section-title {
    font-size: 13px !important;
    font-weight: 800 !important;
    padding: 13px 18px !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    letter-spacing: 0.3px !important;
    color: #ffffff !important;
}
.wh-title-shortage {
    background: #7f1d1d !important;
    color: #fef2f2 !important;
    border-bottom: 2px solid #ef4444 !important;
}
.wh-title-excess {
    background: #14532d !important;
    color: #f0fdf4 !important;
    border-bottom: 2px solid #22c55e !important;
}

/* Compatibilidade de classes legadas */
.sophRowA { background-color: #070d19 !important; color: #ffffff !important; }
.sophRowB { background-color: #0f172a !important; color: #ffffff !important; }
.sophHeader { background-color: #020617 !important; font-weight: bold !important; color: #ffffff !important; }
.sophLink { color: #38bdf8 !important; text-decoration: none !important; }
.btnSophie {
    background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%) !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 8px 18px !important;
    font-weight: 800 !important;
}

/* ===== BOTÕES ESPECIAIS DA TOOLBAR ===== */
.wh-btn-gold {
    background: linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%) !important;
    border: 1px solid #f59e0b !important;
    color: #ffffff !important;
    box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4) !important;
}
.wh-btn-gold:hover {
    background: linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%) !important;
    border-color: #fde047 !important;
    color: #ffffff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(217, 119, 6, 0.6) !important;
}
.wh-btn-diamond {
    background: linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%) !important;
    border: 1px solid #38bdf8 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4) !important;
}
.wh-btn-diamond:hover {
    background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%) !important;
    border-color: #bae6fd !important;
    color: #ffffff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.6) !important;
}

/* ===== BADGES DE STATUS ===== */
.wh-status-badge {
    padding: 4px 10px !important;
    border-radius: 9999px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    display: inline-block !important;
    white-space: nowrap !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8) !important;
}
.wh-status-badge.badge-success { background: #15803d !important; border: 1px solid #22c55e !important; color: #ffffff !important; }
.wh-status-badge.badge-running { background: #065f46 !important; border: 1px solid #10b981 !important; color: #ffffff !important; }
.wh-status-badge.badge-working { background: #854d0e !important; border: 1px solid #eab308 !important; color: #fef08a !important; }
.wh-status-badge.badge-none { background: #334155 !important; border: 1px solid #64748b !important; color: #cbd5e1 !important; }
.wh-status-badge.badge-error { background: #991b1b !important; border: 1px solid #ef4444 !important; color: #ffffff !important; }

/* ===== CARDS INFORMATIVOS ===== */
.wh-automint-info-card, .wh-premium-info-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.98) 100%) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 12px !important;
    padding: 14px 18px !important;
    margin-bottom: 16px !important;
    position: relative !important;
}
.wh-automint-info-card { border-left: 4px solid #f59e0b !important; }
.wh-premium-info-card { border-left: 4px solid #38bdf8 !important; }

.wh-automint-badge {
    font-size: 10px !important;
    font-weight: 900 !important;
    color: #fde047 !important;
    letter-spacing: 0.8px !important;
    margin-bottom: 6px !important;
}
.wh-premium-badge {
    font-size: 10px !important;
    font-weight: 900 !important;
    color: #7dd3fc !important;
    letter-spacing: 0.8px !important;
    margin-bottom: 6px !important;
}
.wh-automint-text, .wh-premium-text {
    font-size: 12px !important;
    line-height: 1.55 !important;
    color: #f1f5f9 !important;
    margin-bottom: 10px !important;
}
.wh-automint-meta, .wh-premium-meta {
    display: flex !important;
    gap: 16px !important;
    font-size: 11px !important;
    color: #cbd5e1 !important;
    flex-wrap: wrap !important;
}
.wh-automint-meta strong, .wh-premium-meta strong {
    color: #ffffff !important;
}

/* ===== GRIDS DE MÉTRICAS ===== */
.wh-automint-metrics-grid, .wh-premium-metrics-grid {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 10px !important;
    margin-bottom: 16px !important;
}
.wh-metric-box {
    background: rgba(15, 23, 42, 0.9) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 8px !important;
    padding: 10px !important;
    text-align: center !important;
}
.wh-metric-box.metric-total { border-top: 3px solid #38bdf8 !important; }
.wh-metric-box.metric-success { border-top: 3px solid #eab308 !important; }
.wh-metric-box.metric-running { border-top: 3px solid #22c55e !important; }
.wh-metric-box.metric-none { border-top: 3px solid #64748b !important; }
.wh-metric-box.metric-pp { border-top: 3px solid #a855f7 !important; }

.wh-metric-val {
    font-size: 18px !important;
    font-weight: 900 !important;
    color: #ffffff !important;
}
.wh-metric-lbl {
    font-size: 11px !important;
    color: #94a3b8 !important;
    font-weight: 600 !important;
    margin-top: 2px !important;
}

/* ===== TABS NO MODAL PREMIUM ===== */
.wh-tabs-nav {
    display: flex !important;
    gap: 8px !important;
    border-bottom: 1px solid rgba(255,255,255,0.12) !important;
    margin-bottom: 16px !important;
}
.wh-tab-btn {
    background: transparent !important;
    color: #94a3b8 !important;
    border: none !important;
    border-bottom: 2px solid transparent !important;
    padding: 10px 18px !important;
    font-size: 13px !important;
    font-weight: 800 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}
.wh-tab-btn.active {
    color: #38bdf8 !important;
    border-bottom-color: #38bdf8 !important;
    background: rgba(56, 189, 248, 0.08) !important;
    border-radius: 6px 6px 0 0 !important;
}
.wh-tab-btn:hover {
    color: #ffffff !important;
}
</style>`;

// Adicionando classes CSS à página
$("#whBalancerStyles").remove();
$("#contentContainer").eq(0).prepend(whBalancerStyles);
$("#mobileHeader").eq(0).prepend(whBalancerStyles);
var cssClassesSophie = whBalancerStyles; // Compatibilidade de escopo

// Carregando configurações salvas ou definindo padrões
var savedSettings = localStorage.getItem("settingsWHBalancerAzuelos") || localStorage.getItem("settingsWHBalancerSophie");
if (savedSettings != null) {
    tempArray = JSON.parse(savedSettings);
    var settings = {};
    settings.isMinting = !!tempArray.isMinting;
    settings.lowPoints = parseInt(tempArray.lowPoints) || 3000;
    settings.highPoints = parseInt(tempArray.highPoints) || 8000;
    settings.highFarm = parseInt(tempArray.highFarm) || 23000;
    settings.builtOutPercentage = parseFloat(tempArray.builtOutPercentage) || 0.25;
    settings.needsMorePercentage = parseFloat(tempArray.needsMorePercentage) || 0.85;
} else {
    var settings = {
        "isMinting": false,
        "highPoints": 8000,
        "highFarm": 23000,
        "lowPoints": 3000,
        "builtOutPercentage": 0.25,
        "needsMorePercentage": 0.85
    };
    localStorage.setItem("settingsWHBalancerAzuelos", JSON.stringify(settings));
}

// Verificando se configurações individuais estão faltando
if (!settings.isMinting) settings.isMinting = false;
if (!settings.highFarm) settings.highFarm = 99999;
if (!settings.highPoints) settings.highPoints = 12000;
if (!settings.lowPoints) settings.lowPoints = 1;
if (!settings.builtOutPercentage) settings.builtOutPercentage = 0.20;
if (!settings.needsMorePercentage) settings.needsMorePercentage = 0.85;
if (settings.builtOutPercentage > 1) settings.builtOutPercentage = 0.95;
if (settings.needsMorePercentage > 1) settings.needsMorePercentage = 0.95;
if (settings.builtOutPercentage < 0) settings.builtOutPercentage = 0.1;
if (settings.needsMorePercentage < 0) settings.needsMorePercentage = 0.1;

// Removendo instâncias anteriores se o script já foi executado
if ($("#sendResources")[0]) {
    $("#sendResources")[0].remove();
    $("#tableSend")[0].remove();
    $("#totals")[0].remove();
}
if ($("#whBalancerContainer")[0]) {
    $("#whBalancerContainer")[0].remove();
}

// Verificar se é sitter ou não
if (game_data.player.sitter > 0) {
    URLIncRes = `game.php?t=${game_data.player.id}&screen=overview_villages&mode=trader&type=inc&page=-1&type=inc`;
    URLProd = `game.php?t=${game_data.player.id}&screen=overview_villages&mode=prod&page=-1&`;
} else {
    URLIncRes = "game.php?&screen=overview_villages&mode=trader&type=inc&page=-1&type=inc";
    URLProd = `game.php?&screen=overview_villages&mode=prod&page=-1&`;
}

// Contadores de progresso de transferências
var whCompletedTransfers = 0;
var whTotalTransfers = 0;

function updateWhProgress() {
    if (whTotalTransfers <= 0) return;
    var pct = Math.min(100, Math.round((whCompletedTransfers / whTotalTransfers) * 100));
    $("#whLiveProgressBar").css("width", pct + "%");
    $("#whSendProgressPill").text(`${whCompletedTransfers} / ${whTotalTransfers} enviados (${pct}%)`);
    var remaining = Math.max(0, whTotalTransfers - whCompletedTransfers);
    $("#whTransfersRemaining").text(remaining);
}

function sendResource(sourceID, targetID, woodAmount, stoneAmount, ironAmount, rowNr) {
    var $row = $("#whRow_" + rowNr);
    if ($row.length) {
        $row.remove();
    }
    whCompletedTransfers++;
    updateWhProgress();

    var e = { "target_id": targetID, "wood": woodAmount, "stone": stoneAmount, "iron": ironAmount };
    TribalWars.post("market", {
        ajaxaction: "map_send", village: sourceID
    }, e, function (res) {
        if (res && res.message) {
            UI.SuccessMessage(res.message, 1500);
        }
    }, !1);

    var remainingRows = $("#whSendTable tr").length;
    if (remainingRows <= 0) {
        $("#whSendTableWrap").html(`
            <div class="wh-all-done-banner">
                <div class="wh-done-icon">🎉</div>
                <div class="wh-done-title">Todos os Envios Concluídos com Sucesso!</div>
                <div class="wh-done-desc">Todos os recursos foram perfeitamente distribuídos entre as suas aldeias.</div>
            </div>
        `);
        UI.SuccessMessage("✅ Todos os recursos foram balanceados com sucesso!");
        if ($(".btn-pp").length > 0) {
            $(".btn-pp").remove();
        }
        return;
    }

    var nextBtn = $(':button[id^="building"]').first();
    if (nextBtn.length) {
        nextBtn.focus();
    }
}
function displayEverything() {

    // Buscando página de recursos em trânsito
    $.get(URLIncRes, function () {
        console.log("Página de transportes carregada");
    })
        .done(function (page) {
            // Capturando todos os recursos em trânsito para cada aldeia
            var $page = $(page);

            for (var i = 1; i < $page.find("#trades_table tr").length - 1; i++) {
                var villageData = {};
                var villageIDtemp;
                if ($("#mobileHeader")[0]) {
                    console.log("mobile");
                    let $resourceGroups = $page.find("#trades_table tr")[i].children[5].children[1].children;
                    for (let j = 0; j < Object.keys($resourceGroups).length; j++) {
                        if ($page.find("#trades_table tr")[1].children[2].innerText != whLang[16]) {
                            let $child = $($resourceGroups[j]);
                            let classNames = $child.find('.icon.mheader').attr('class').split(' ');
                            let resourceType = classNames[classNames.length - 1];
                            let resourceAmount = $child.text().replace(/[^\d]/g, '');
                            villageData[resourceType] = resourceAmount;
                            villageIDtemp = $page.find("#trades_table tr")[i].children[3].children[2].href.match(/id=(\d*)/)[1];
                        }
                    }
                } else {
                    console.log("desktop");
                    let $resourceGroups = $page.find("#trades_table tr")[i].children[8].children;
                    for (let j = 0; j < Object.keys($resourceGroups).length; j++) {
                        let $child = $($resourceGroups[j]);
                        var classNames;
                        if ($child[0].innerHTML.indexOf("header") > -1) {
                            classNames = $child.find('.icon.header').attr('class').split(' ');
                        } else {
                            classNames = $child.attr('class').split(' ');
                        }
                        if ($page.find("#trades_table tr")[1].children[3].innerText != whLang[15]) {
                            let resourceType = classNames[classNames.length - 1];
                            let resourceAmount = $child.text().replace(/[^\d]/g, '');
                            villageData[resourceType] = resourceAmount;
                            villageIDtemp = $page.find("#trades_table tr")[i].children[4].children[0].href.match(/id=(\d*)/)[1];
                        }
                    }
                }
                if ($page.find("#trades_table tr")[1].children[3].innerText != whLang[15] && $page.find("#trades_table tr")[1].children[2].innerText != whLang[16]) {
                    if (incomingRes[villageIDtemp] == undefined) {
                        incomingRes[villageIDtemp] = { "wood": 0, "stone": 0, "iron": 0 };
                    }
                    if (villageData.wood != undefined) {
                        incomingRes[villageIDtemp].wood += parseInt(villageData.wood);
                    }
                    if (villageData.stone != undefined) {
                        incomingRes[villageIDtemp].stone += parseInt(villageData.stone);
                    }
                    if (villageData.iron != undefined) {
                        incomingRes[villageIDtemp].iron += parseInt(villageData.iron);
                    }
                }
            }


            // Buscando dados de todas as aldeias
            $.get(URLProd, function () {
                console.log("Página de produção carregada");
            })
                .done(function (page) {
                    testPage = page;
                    uniVillage = $(page).find("span.bonus_icon_33");
                    if (uniVillage.length > 0) {
                        uniRow = uniVillage.closest('tr').index() - 1;
                    } else {
                        uniRow = -1;
                    }
                    if ($("#mobileHeader")[0]) {
                        console.log("mobile");
                        allWoodObjects = $(page).find(".res.mwood,.warn_90.mwood,.warn.mwood");
                        allClayObjects = $(page).find(".res.mstone,.warn_90.mstone,.warn.mstone");
                        allIronObjects = $(page).find(".res.miron,.warn_90.miron,.warn.miron");
                        allWarehouses = $(page).find(".mheader.ressources");
                        allVillages = $(page).find(".quickedit-vn");
                        allFarms = $(page).find(".header.population");
                        allMerchants = $(page).find('.trader_img').parent();
                        productionTable = $(page).find(".points-header");
                        if (uniRow >= 0) {
                            allVillages.splice(uniRow, 1);
                            allWoodObjects.splice(uniRow, 1);
                            allClayObjects.splice(uniRow, 1);
                            allIronObjects.splice(uniRow, 1);
                            allWarehouses.splice(uniRow, 1);
                            allFarms.splice(uniRow, 1);
                            allMerchants.splice(uniRow, 1);
                            productionTable.splice(uniRow, 1);
                        }
                        for (var i = 0; i < allWoodObjects.length; i++) {
                            n = allWoodObjects[i].textContent;
                            n = n.replace(/\./g, '').replace(',', '');
                            allWoodTotals.push(n);
                            n = allClayObjects[i].textContent;
                            n = n.replace(/\./g, '').replace(',', '');
                            allClayTotals.push(n);
                            n = allIronObjects[i].textContent;
                            n = n.replace(/\./g, '').replace(',', '');
                            allIronTotals.push(n);
                        }
                        for (let i = 0; i < allVillages.length; i++) {
                            farmSpaceUsed.push(allFarms[i].parentElement.innerText.match(/(\d*)\/(\d*)/)[1]);
                            farmSpaceTotal.push(allFarms[i].parentElement.innerText.match(/(\d*)\/(\d*)/)[2]);
                            warehouseCapacity.push(allWarehouses[i].parentElement.innerText);
                            availableMerchants.push(allMerchants[i].innerText);
                            totalMerchants.push("999");
                            const pointsText = $(productionTable[i]).children().length - 1;
                            villagePoints.push($(productionTable[i]).children()[pointsText].innerText.replace(/\./g, '').replace(',', ''));
                        }
                    } else {
                        console.log("desktop");
                        allWoodObjects = $(page).find(".res.wood,.warn_90.wood,.warn.wood");
                        allClayObjects = $(page).find(".res.stone,.warn_90.stone,.warn.stone");
                        allIronObjects = $(page).find(".res.iron,.warn_90.iron,.warn.iron");
                        allVillages = $(page).find(".quickedit-vn");
                        if (uniRow >= 0) {
                            allVillages.splice(uniRow, 1);
                            allWoodObjects.splice(uniRow, 1);
                            allClayObjects.splice(uniRow, 1);
                            allIronObjects.splice(uniRow, 1);
                        }
                        for (let i = 0; i < allWoodObjects.length; i++) {
                            n = allWoodObjects[i].textContent;
                            n = n.replace(/\./g, '').replace(',', '');
                            allWoodTotals.push(n);
                            n = allClayObjects[i].textContent;
                            n = n.replace(/\./g, '').replace(',', '');
                            allClayTotals.push(n);
                            n = allIronObjects[i].textContent;
                            n = n.replace(/\./g, '').replace(',', '');
                            allIronTotals.push(n);
                        }
                        for (let i = 0; i < allVillages.length; i++) {
                            warehouseCapacity.push(allIronObjects[i].parentElement.nextElementSibling.innerHTML);
                            availableMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
                            totalMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
                            farmSpaceUsed.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
                            farmSpaceTotal.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
                            villagePoints.push(allWoodObjects[i].parentElement.previousElementSibling.innerText.replace(/\./g, '').replace(',', ''));
                        }
                    }

                    // Criando objeto de dados
                    for (let i = 0; i < allVillages.length; i++) {
                        villagesData.push({
                            "id": allVillages[i].dataset.id,
                            "points": villagePoints[i],
                            "url": allVillages[i].children[0].children[0].href,
                            "name": allVillages[i].innerText.trim(),
                            "wood": allWoodTotals[i],
                            "stone": allClayTotals[i],
                            "iron": allIronTotals[i],
                            "availableMerchants": availableMerchants[i],
                            "totalMerchants": totalMerchants[i],
                            "warehouseCapacity": warehouseCapacity[i],
                            "farmSpaceUsed": farmSpaceUsed[i],
                            "farmSpaceTotal": farmSpaceTotal[i]
                        });
                    }

                    // Ordenando para priorizar aldeias menores
                    villagesData.sort((a, b) => (parseInt(a.points) < parseInt(b.points)) ? 1 : -1);

                    // Calculando totais e médias
                    totalWood = 0;
                    totalStone = 0;
                    totalIron = 0;

                    for (let i in allWoodTotals) { totalWood += parseInt(allWoodTotals[i]); }
                    for (let i in allClayTotals) { totalStone += parseInt(allClayTotals[i]); }
                    for (let i in allIronTotals) { totalIron += parseInt(allIronTotals[i]); }
                    for (let o = 0; o < Object.keys(incomingRes).length; o++) {
                        totalWood += incomingRes[Object.keys(incomingRes)[o]].wood;
                        totalStone += incomingRes[Object.keys(incomingRes)[o]].stone;
                        totalIron += incomingRes[Object.keys(incomingRes)[o]].iron;
                    }
                    woodAverage = Math.floor(totalWood / warehouseCapacity.length);
                    stoneAverage = Math.floor(totalStone / warehouseCapacity.length);
                    ironAverage = Math.floor(totalIron / warehouseCapacity.length);


                    if (settings.isMinting == false) {
                        actualWoodAverage = woodAverage;
                        actualStoneAverage = stoneAverage;
                        actualIronAverage = ironAverage;
                        consideredBuiltOut = 0;
                        actualTotalWood = totalWood;
                        actualTotalStone = totalStone;
                        actualTotalIron = totalIron;
                        actualWHCountNeedsBalancingWood = warehouseCapacity.length;
                        actualWHCountNeedsBalancingStone = warehouseCapacity.length;
                        actualWHCountNeedsBalancingIron = warehouseCapacity.length;
                        for (let i = 0; i < warehouseCapacity.length; i++) {
                            actualWoodAverage = Math.floor(actualTotalWood / actualWHCountNeedsBalancingWood);
                            actualStoneAverage = Math.floor(actualTotalStone / actualWHCountNeedsBalancingStone);
                            actualIronAverage = Math.floor(actualTotalIron / actualWHCountNeedsBalancingIron);
                            if (warehouseCapacity[i] < actualWoodAverage) {
                                actualTotalWood -= actualWoodAverage - warehouseCapacity[i] * settings.needsMorePercentage;
                                actualWHCountNeedsBalancingWood--;
                            }
                            if (warehouseCapacity[i] < actualStoneAverage) {
                                actualTotalStone -= actualStoneAverage - warehouseCapacity[i] * settings.needsMorePercentage;
                                actualWHCountNeedsBalancingStone--;
                            }
                            if (warehouseCapacity[i] < actualIronAverage) {
                                actualTotalIron -= actualIronAverage - warehouseCapacity[i] * settings.needsMorePercentage;
                                actualWHCountNeedsBalancingIron--;
                            }
                        }

                        if (actualWoodAverage >= 350000 || actualStoneAverage >= 350000 || actualIronAverage >= 350000) {
                            UI.InfoMessage("⚠️ Atenção: Há excedentes que não puderam ser distribuídos com as regras atuais.", 4000);
                        }

                    } else {
                        actualWoodAverage = woodAverage;
                        actualStoneAverage = stoneAverage;
                        actualIronAverage = ironAverage;
                    }

                                                            // ===== CONSTRUINDO DASHBOARD VISUAL PREMIUM =====
                    totalsAndAverages = `
                    <div id="totals">
                        <div class="wh-stats-grid">
                            <!-- Card Madeira -->
                            <div class="wh-stat-card wood">
                                <div class="wh-stat-header">
                                    <span class="wh-stat-title">🪵 Madeira Total</span>
                                    <span class="wh-stat-icon">🪵</span>
                                </div>
                                <div class="wh-stat-val">${numberWithCommas(totalWood)}</div>
                                <div class="wh-stat-chips">
                                    <span class="wh-stat-chip">Média Simples: <strong>${numberWithCommas(woodAverage)}</strong></span>
                                    <span class="wh-stat-chip">Meta Balanceada: <strong>${numberWithCommas(actualWoodAverage)}</strong></span>
                                </div>
                            </div>

                            <!-- Card Argila -->
                            <div class="wh-stat-card clay">
                                <div class="wh-stat-header">
                                    <span class="wh-stat-title">🧱 Argila Total</span>
                                    <span class="wh-stat-icon">🧱</span>
                                </div>
                                <div class="wh-stat-val">${numberWithCommas(totalStone)}</div>
                                <div class="wh-stat-chips">
                                    <span class="wh-stat-chip">Média Simples: <strong>${numberWithCommas(stoneAverage)}</strong></span>
                                    <span class="wh-stat-chip">Meta Balanceada: <strong>${numberWithCommas(actualStoneAverage)}</strong></span>
                                </div>
                            </div>

                            <!-- Card Ferro -->
                            <div class="wh-stat-card iron">
                                <div class="wh-stat-header">
                                    <span class="wh-stat-title">⛏️ Ferro Total</span>
                                    <span class="wh-stat-icon">⛏️</span>
                                </div>
                                <div class="wh-stat-val">${numberWithCommas(totalIron)}</div>
                                <div class="wh-stat-chips">
                                    <span class="wh-stat-chip">Média Simples: <strong>${numberWithCommas(ironAverage)}</strong></span>
                                    <span class="wh-stat-chip">Meta Balanceada: <strong>${numberWithCommas(actualIronAverage)}</strong></span>
                                </div>
                            </div>
                        </div>

                        <!-- Barra de Resumo Rápido -->
                        <div class="wh-overview-strip">
                            <span class="wh-overview-item">🏰 Aldeias Analisadas: <strong>${villagesData.length}</strong></span>
                            <span class="wh-overview-item">🚚 Envios a Realizar: <strong id="whTransfersRemaining">0</strong></span>
                            <span class="wh-overview-item">📦 Recursos em Trânsito: <strong>${numberWithCommas(Object.keys(incomingRes).length)} aldeias</strong></span>
                            <span class="wh-overview-item">⚡ Modo: <strong>${settings.isMinting ? "Cunhagem de Moedas" : "Balanceamento Proporcional"}</strong></span>
                        </div>
                    </div>`;



                    // Barra de progresso premium
                    $(".content-border").eq(0).prepend(`
                    <div id="whProgressWrap" class="wh-progress-wrap"><div id="progress" class="wh-progress-bar"></div></div>`);
                    $("#mobileHeader").eq(0).prepend(`
                    <div id="whProgressWrap" class="wh-progress-wrap"><div id="progress" class="wh-progress-bar"></div></div>`);

                    // ===== CÁLCULO DE EXCESSO/ESCASSEZ =====
                    for (let v = 0; v < villagesData.length; v++) {
                        excessResources[v] = [];
                        shortageResources[v] = [];
                        villageID.push(villagesData[v].id);
                        if (typeof incomingRes[villagesData[v].id] == "undefined") {
                            incomingWood = 0;
                            incomingStone = 0;
                            incomingIron = 0;
                        } else {
                            incomingWood = incomingRes[villagesData[v].id].wood;
                            incomingStone = incomingRes[villagesData[v].id].stone;
                            incomingIron = incomingRes[villagesData[v].id].iron;
                        }
                        if (actualWoodAverage < villagesData[v].warehouseCapacity * settings.needsMorePercentage) {
                            tempWood = parseInt(villagesData[v].wood) + incomingWood - actualWoodAverage;
                        } else {
                            tempWood = -Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - incomingWood - parseInt(villagesData[v].wood));
                        }
                        if (actualStoneAverage < villagesData[v].warehouseCapacity * settings.needsMorePercentage) {
                            tempStone = parseInt(villagesData[v].stone) + incomingStone - actualStoneAverage;
                        } else {
                            tempStone = -Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - incomingStone - parseInt(villagesData[v].stone));
                        }
                        if (actualIronAverage < villagesData[v].warehouseCapacity * settings.needsMorePercentage) {
                            tempIron = parseInt(villagesData[v].iron) + incomingIron - actualIronAverage;
                        } else {
                            tempIron = -Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - incomingIron - parseInt(villagesData[v].iron));
                        }

                        // Aldeia quase totalmente construída
                        if (villagesData[v].farmSpaceUsed > settings.highFarm || villagesData[v].points > settings.highPoints) {
                            if (parseInt(villagesData[v].wood) + incomingWood > settings.builtOutPercentage * villagesData[v].warehouseCapacity) {
                                tempWood = Math.round((parseInt(villagesData[v].wood) + incomingWood) - (settings.builtOutPercentage * villagesData[v].warehouseCapacity));
                            }
                            if (parseInt(villagesData[v].stone) + incomingStone > settings.builtOutPercentage * villagesData[v].warehouseCapacity) {
                                tempStone = Math.round((parseInt(villagesData[v].stone) + incomingStone) - (settings.builtOutPercentage * villagesData[v].warehouseCapacity));
                            }
                            if (parseInt(villagesData[v].iron) + incomingIron > settings.builtOutPercentage * villagesData[v].warehouseCapacity) {
                                tempIron = Math.round((parseInt(villagesData[v].iron) + incomingIron) - (settings.builtOutPercentage * villagesData[v].warehouseCapacity));
                            }
                        }

                        // Aldeia pequena precisa de mais
                        if (villagesData[v].points < settings.lowPoints) {
                            tempWood = -Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - parseInt(villagesData[v].wood) - incomingWood);
                            tempStone = -Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - parseInt(villagesData[v].stone) - incomingStone);
                            tempIron = -Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - parseInt(villagesData[v].iron) - incomingIron);
                        }

                        if (incomingWood + parseInt(villagesData[v].wood) > villagesData[v].warehouseCapacity) {
                            tempWood = -(Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - incomingWood - parseInt(villagesData[v].wood)));
                        }
                        if (incomingStone + parseInt(villagesData[v].stone) > villagesData[v].warehouseCapacity) {
                            tempStone = -(Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - incomingStone - parseInt(villagesData[v].stone)));
                        }
                        if (incomingIron + parseInt(villagesData[v].iron) > villagesData[v].warehouseCapacity) {
                            tempIron = -(Math.round((villagesData[v].warehouseCapacity * settings.needsMorePercentage) - incomingIron - parseInt(villagesData[v].iron)));
                        }

                        if (tempWood > 0 && tempWood > parseInt(villagesData[v].wood)) { tempWood = parseInt(villagesData[v].wood); }
                        if (tempStone > 0 && tempStone > parseInt(villagesData[v].stone)) { tempStone = parseInt(villagesData[v].stone); }
                        if (tempIron > 0 && tempIron > parseInt(villagesData[v].iron)) { tempIron = parseInt(villagesData[v].iron); }

                        if (tempWood > 0) {
                            excessResources[v].push({ "wood": Math.floor(tempWood / 1000) * 1000 });
                            shortageResources[v].push({ "wood": 0 });
                        } else {
                            shortageResources[v].push({ "wood": Math.floor(-tempWood / 1000) * 1000 });
                            excessResources[v].push({ "wood": 0 });
                        }
                        if (tempStone > 0) {
                            excessResources[v].push({ "stone": Math.floor(tempStone / 1000) * 1000 });
                            shortageResources[v].push({ "stone": 0 });
                        } else {
                            shortageResources[v].push({ "stone": Math.floor(-tempStone / 1000) * 1000 });
                            excessResources[v].push({ "stone": 0 });
                        }
                        if (tempIron > 0) {
                            excessResources[v].push({ "iron": Math.floor(tempIron / 1000) * 1000 });
                            shortageResources[v].push({ "iron": 0 });
                        } else {
                            shortageResources[v].push({ "iron": Math.floor(-tempIron / 1000) * 1000 });
                            excessResources[v].push({ "iron": 0 });
                        }
                    }

                    // Atribuindo mercadores
                    for (let p = 0; p < excessResources.length; p++) {
                        tempAllExcessCombined = parseInt(Math.floor(excessResources[p][0].wood / 1000) * 1000) + parseInt(Math.floor(excessResources[p][1].stone / 1000) * 1000) + parseInt(Math.floor(excessResources[p][2].iron / 1000) * 1000);
                        if (tempAllExcessCombined > 0) {
                            tempMaxMerchantsNeeded = Math.floor(tempAllExcessCombined / 1000);
                            if (tempMaxMerchantsNeeded < villagesData[p].availableMerchants) {
                                merchantOrders.push({ "villageID": villagesData[p].id, "x": villagesData[p].name.match(/(\d+)\|(\d+)/)[1], "y": villagesData[p].name.match(/(\d+)\|(\d+)/)[2], "wood": Math.floor(excessResources[p][0].wood / 1000), "stone": Math.floor(excessResources[p][1].stone / 1000), "iron": Math.floor(excessResources[p][2].iron / 1000) });
                            } else {
                                tempPercWood = excessResources[p][0].wood / tempAllExcessCombined;
                                tempPercStone = excessResources[p][1].stone / tempAllExcessCombined;
                                tempPercIron = excessResources[p][2].iron / tempAllExcessCombined;
                                merchantOrders.push({ "villageID": villagesData[p].id, "x": villagesData[p].name.match(/(\d+)\|(\d+)/)[1], "y": villagesData[p].name.match(/(\d+)\|(\d+)/)[2], "wood": Math.floor(tempPercWood * villagesData[p].availableMerchants), "stone": Math.floor(tempPercStone * villagesData[p].availableMerchants), "iron": Math.floor(tempPercIron * villagesData[p].availableMerchants) });
                            }
                        }
                    }

                    // ===== DISTRIBUIÇÃO: MADEIRA =====
                    for (let q = shortageResources.length - 1; q >= 0; q--) {
                        $("#progress").css("width", `${(shortageResources.length - q) / shortageResources.length * 100}%`);
                        for (let d = 0; d < merchantOrders.length; d++) {
                            merchantOrders[d].distance = checkDistance(merchantOrders[d].x, merchantOrders[d].y, villagesData[q].name.match(/(\d+)\|(\d+)/)[1], villagesData[q].name.match(/(\d+)\|(\d+)/)[2]);
                        }
                        merchantOrders.sort(function (left, right) { return left.distance - right.distance; });
                        if (shortageResources[q][0].wood > 0) {
                            while (shortageResources[q][0].wood > 0) {
                                var totalWoodToTrade = 0;
                                for (let m = 0; m < merchantOrders.length; m++) {
                                    totalWoodToTrade += merchantOrders[m].wood;
                                    if (merchantOrders[m].wood > 0) {
                                        if (shortageResources[q][0].wood <= merchantOrders[m].wood * 1000) {
                                            links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "wood": shortageResources[q][0].wood });
                                            merchantOrders[m].wood -= shortageResources[q][0].wood / 1000;
                                            shortageResources[q][0].wood = 0;
                                        }
                                        if (shortageResources[q][0].wood > merchantOrders[m].wood * 1000) {
                                            links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "wood": merchantOrders[m].wood * 1000 });
                                            shortageResources[q][0].wood -= merchantOrders[m].wood * 1000;
                                            merchantOrders[m].wood = 0;
                                        }
                                    }
                                    if (shortageResources[q][0].wood <= 0) { break; }
                                    if (m == merchantOrders.length - 1 && shortageResources[q][0].wood > 0) { totalWoodToTrade = 0; break; }
                                }
                                if (totalWoodToTrade == 0) { q = 0; break; }
                            }
                        }
                    }

                    // ===== DISTRIBUIÇÃO: ARGILA =====
                    for (let q = shortageResources.length - 1; q >= 0; q--) {
                        $("#progress").css("width", `${(shortageResources.length - q) / shortageResources.length * 100}%`);
                        for (var d = 0; d < merchantOrders.length; d++) {
                            merchantOrders[d].distance = checkDistance(merchantOrders[d].x, merchantOrders[d].y, villagesData[q].name.match(/(\d+)\|(\d+)/)[1], villagesData[q].name.match(/(\d+)\|(\d+)/)[2]);
                        }
                        merchantOrders.sort(function (left, right) { return left.distance - right.distance; });
                        if (shortageResources[q][1].stone > 0) {
                            while (shortageResources[q][1].stone > 0) {
                                var totalstoneToTrade = 0;
                                for (var m = 0; m < merchantOrders.length; m++) {
                                    totalstoneToTrade += merchantOrders[m].stone;
                                    if (merchantOrders[m].stone > 0) {
                                        if (shortageResources[q][1].stone <= merchantOrders[m].stone * 1000) {
                                            links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "stone": shortageResources[q][1].stone });
                                            merchantOrders[m].stone -= shortageResources[q][1].stone / 1000;
                                            shortageResources[q][1].stone = 0;
                                        }
                                        if (shortageResources[q][1].stone > merchantOrders[m].stone * 1000) {
                                            links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "stone": merchantOrders[m].stone * 1000 });
                                            shortageResources[q][1].stone -= merchantOrders[m].stone * 1000;
                                            merchantOrders[m].stone = 0;
                                        }
                                    }
                                    if (shortageResources[q][1].stone <= 0) { break; }
                                    if (m == merchantOrders.length - 1 && shortageResources[q][1].stone > 0) { totalstoneToTrade = 0; break; }
                                }
                                if (totalstoneToTrade == 0) { q = 0; break; }
                            }
                        }
                    }

                    // ===== DISTRIBUIÇÃO: FERRO =====
                    for (let q = shortageResources.length - 1; q >= 0; q--) {
                        $("#progress").css("width", `${(shortageResources.length - q) / shortageResources.length * 100}%`);
                        for (let d = 0; d < merchantOrders.length; d++) {
                            merchantOrders[d].distance = checkDistance(merchantOrders[d].x, merchantOrders[d].y, villagesData[q].name.match(/(\d+)\|(\d+)/)[1], villagesData[q].name.match(/(\d+)\|(\d+)/)[2]);
                        }
                        merchantOrders.sort(function (left, right) { return left.distance - right.distance; });
                        if (shortageResources[q][2].iron > 0) {
                            while (shortageResources[q][2].iron > 0) {
                                var totalironToTrade = 0;
                                for (let m = 0; m < merchantOrders.length; m++) {
                                    totalironToTrade += merchantOrders[m].iron;
                                    if (merchantOrders[m].iron > 0) {
                                        if (shortageResources[q][2].iron <= merchantOrders[m].iron * 1000) {
                                            links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "iron": shortageResources[q][2].iron });
                                            merchantOrders[m].iron -= shortageResources[q][2].iron / 1000;
                                            shortageResources[q][2].iron = 0;
                                        }
                                        if (shortageResources[q][2].iron > merchantOrders[m].iron * 1000) {
                                            links.push({ "source": merchantOrders[m].villageID, "target": villageID[q], "iron": merchantOrders[m].iron * 1000 });
                                            shortageResources[q][2].iron -= merchantOrders[m].iron * 1000;
                                            merchantOrders[m].iron = 0;
                                        }
                                    }
                                    if (shortageResources[q][2].iron <= 0) { break; }
                                    if (m == merchantOrders.length - 1 && shortageResources[q][2].iron > 0) { totalironToTrade = 0; break; }
                                }
                                if (totalironToTrade == 0) { q = 0; break; }
                            }
                        }
                    }
                    $("#whProgressWrap").remove();

                                                            // ===== MONTAGEM DO HTML FINAL =====
                    htmlCode = `
                    <div id="whBalancerContainer">
                        <div class="wh-panel">
                            <!-- Cabeçalho Principal -->
                            <div class="wh-title-bar">
                                <div class="wh-title-left">
                                    <span class="wh-title-icon">⚖️</span>
                                    <div>
                                        <h2 class="wh-main-title">${whLang[0]}</h2>
                                        <div class="wh-sub-title">Distribuição Inteligente de Recursos · OND BR143</div>
                                    </div>
                                </div>
                                <div class="wh-title-right">
                                    <a href="https://www.instagram.com/jhonatanazuelosoficial" target="_blank" class="wh-creator-badge" title="Abrir perfil no Instagram">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                        <span>Criado por <strong>@jhonatanazuelosoficial</strong></span>
                                    </a>
                                </div>
                            </div>

                            <!-- Cards de Totais e Médias -->
                            ${totalsAndAverages}

                            <!-- Toolbar de Ações e Atalhos -->
                            <div class="wh-toolbar">
                                <div class="wh-toolbar-left">
                                    <button type="button" class="wh-btn-tool" onclick="toggleWhSettings(this)">⚙️ Configurações</button>
                                    <button type="button" class="wh-btn-tool" onclick="showStats()">📊 Escassez & Excesso</button>
                                    <button type="button" class="wh-btn-tool" onclick="resAfterBalance()">📋 Projeção Final</button>
                                    <button type="button" class="wh-btn-tool wh-btn-gold" onclick="openWhAutoMintModal()" title="Ativar criação automática de moedas (8h contínuas) em todas as aldeias com academia">🪙 Cunhagem Automática</button>
                                    <button type="button" class="wh-btn-tool wh-btn-diamond" onclick="openWhPremiumExchangeModal()" title="Nivelar recursos entre as aldeias usando compra na Troca Premium e Comerciante NPC">💎 Nivelamento Premium</button>
                                </div>
                                <div class="wh-toolbar-right">
                                    <div class="wh-hotkey-badge">⌨️ Pressione [ESPAÇO] ou [ENTER] para despachar!</div>
                                    <div class="wh-progress-pill" id="whSendProgressPill">0 / 0 enviados (0%)</div>
                                </div>
                            </div>

                            <!-- Barra de Progresso em Tempo Real -->
                            <div class="wh-progress-track">
                                <div class="wh-progress-fill" id="whLiveProgressBar" style="width: 0%"></div>
                            </div>

                            <!-- Painel Deslizante de Configurações -->
                            <div id="whSettingsPanel" class="wh-settings-panel">
                                <form id="settings">
                                    <div class="wh-settings-grid">
                                        <div class="wh-setting-item">
                                            <label>⚡ Ignorar configurações</label>
                                            <div class="wh-setting-desc">Balancear igualmente sem regras específicas</div>
                                            <input type="checkbox" name="isMinting">
                                        </div>
                                        <div class="wh-setting-item">
                                            <label>🏗️ Priorizar aldeias menores que</label>
                                            <div class="wh-setting-desc">Aldeias abaixo desse nível recebem mais recursos</div>
                                            <input type="range" min="0" max="13000" step="10" value="${settings.lowPoints}" name="lowPoints" oninput="sliderChange('lowPointsVal',this.value)">
                                            <div class="wh-range-value"><span id="lowPointsVal">${settings.lowPoints}</span> pontos</div>
                                        </div>
                                        <div class="wh-setting-item">
                                            <label>🏰 Aldeias finalizadas acima de</label>
                                            <div class="wh-setting-desc">Acima desse nível, a aldeia doa excedentes</div>
                                            <input type="range" min="0" max="13000" step="10" value="${settings.highPoints}" name="highPoints" oninput="sliderChange('highPointsVal',this.value)">
                                            <div class="wh-range-value"><span id="highPointsVal">${settings.highPoints}</span> pontos</div>
                                        </div>
                                        <div class="wh-setting-item">
                                            <label>🌾 Fazenda alta (população)</label>
                                            <div class="wh-setting-desc">Aldeias com população acima disso são consideradas prontas</div>
                                            <input type="range" min="0" max="33000" step="10" value="${settings.highFarm}" name="highFarm" oninput="sliderChange('highFarmVal',this.value)">
                                            <div class="wh-range-value"><span id="highFarmVal">${settings.highFarm}</span> pop</div>
                                        </div>
                                        <div class="wh-setting-item">
                                            <label>📦 % armazém → aldeias prontas</label>
                                            <div class="wh-setting-desc">Percentual do armazém retido nas aldeias finalizadas</div>
                                            <input type="range" min="0" max="1" step="0.01" value="${settings.builtOutPercentage}" name="builtOutPercentage" oninput="sliderChange('builtOutVal',this.value)">
                                            <div class="wh-range-value"><span id="builtOutVal">${settings.builtOutPercentage}</span></div>
                                        </div>
                                        <div class="wh-setting-item">
                                            <label>🎯 % armazém → aldeias prioritárias</label>
                                            <div class="wh-setting-desc">Percentual do armazém alocado nas aldeias em crescimento</div>
                                            <input type="range" min="0" max="1" step="0.01" value="${settings.needsMorePercentage}" name="needsMorePercentage" oninput="sliderChange('needsMoreVal',this.value)">
                                            <div class="wh-range-value"><span id="needsMoreVal">${settings.needsMorePercentage}</span></div>
                                        </div>
                                    </div>
                                    <div style="text-align:center">
                                        <button type="button" class="wh-btn-save" onclick="saveSettings()">💾 Salvar e Recalcular Balanceamento</button>
                                    </div>
                                </form>
                            </div>

                            <!-- Tabela de Envios -->
                            <div id="sendResources" class="wh-table-wrap">
                                <div id="whSendTableWrap">
                                    <table id="tableSend" class="wh-table">
                                        <thead>
                                            <tr>
                                                <th class="wh-th-orig">📤 ${whLang[1]}</th>
                                                <th class="wh-th-dest">📥 ${whLang[2]}</th>
                                                <th class="wh-th-dist">📏 ${whLang[3]}</th>
                                                <th class="wh-th-wood">🪵 ${whLang[4]}</th>
                                                <th class="wh-th-clay">🧱 ${whLang[5]}</th>
                                                <th class="wh-th-iron">⛏️ ${whLang[6]}</th>
                                                <th class="wh-th-total">📦 Carga Total</th>
                                                <th class="wh-th-act">⚡ Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody id="whSendTable"></tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Rodapé com Crédito Clicável do Azuelos -->
                            <div class="wh-credit-bar">
                                <span>⚔️ Balanceador de Armazém · OND BR143</span>
                                <a href="https://www.instagram.com/jhonatanazuelosoficial" target="_blank" class="wh-footer-insta">
                                    📸 Criado por <strong>Azuelos</strong> (@jhonatanazuelosoficial)
                                </a>
                            </div>
                        </div>
                    </div>`;


                    $("#content_value").eq(0).prepend(htmlCode);
                    if (is_mobile == true) {
                        $("#mobile_header").eq(0).prepend(htmlCode);
                    }
                    // Preenchendo settings
                    $("input[name='isMinting']").attr("checked", settings.isMinting);
                    createList();
                })

                .fail(function () {
                    console.log("Erro ao carregar dados");
                })

                .always(function () {
                    console.log("Finalizado");
                });
        }
    );

            function createList() {
        console.log("Iniciando criação da lista");
        for (let i = 0; i < links.length; i++) {
            if (links[i].wood == undefined) links[i].wood = 0;
            if (links[i].stone == undefined) links[i].stone = 0;
            if (links[i].iron == undefined) links[i].iron = 0;
        }
        // Combinando envios duplicados
        for (let i = 0; i < links.length; i++) {
            for (let j = 0; j < links.length; j++) {
                if (links[i].source == links[j].source && links[i].target == links[j].target && i != j) {
                    links[i].wood += parseInt(links[j].wood);
                    links[j].wood = 0;
                    links[i].stone += parseInt(links[j].stone);
                    links[j].stone = 0;
                    links[i].iron += parseInt(links[j].iron);
                    links[j].iron = 0;
                }
            }
        }
        for (let i = 0; i < links.length; i++) {
            if (links[i].wood + links[i].stone + links[i].iron == 0) {
                delete links[i];
            }
        }
        for (let i = 0; i < Object.keys(links).length; i++) {
            cleanLinks.push(links[Object.keys(links)[i]]);
        }

        whTotalTransfers = cleanLinks.length;
        whCompletedTransfers = 0;
        updateWhProgress();

        cleanLinks = addDistanceToArray(cleanLinks);
        listHTML = ``;
        cleanLinks.sort(function (left, right) { return left.distance - right.distance; });

        for (let i = 0; i < cleanLinks.length; i++) {
            var sourceName = "", sourceURL = "", sourceMerchants = "—";
            for (let property in villagesData) {
                if (villagesData[property].id == cleanLinks[i].source) {
                    sourceName = villagesData[property].name;
                    sourceURL = villagesData[property].url;
                    sourceMerchants = villagesData[property].availableMerchants;
                }
            }
            var targetName = "", targetURL = "", targetWood = 0, targetStone = 0, targetIron = 0, targetCapacity = 0;
            for (let property in villagesData) {
                if (villagesData[property].id == cleanLinks[i].target) {
                    targetName = villagesData[property].name;
                    targetURL = villagesData[property].url;
                    targetWood = villagesData[property].wood;
                    targetStone = villagesData[property].stone;
                    targetIron = villagesData[property].iron;
                    targetCapacity = villagesData[property].warehouseCapacity;
                }
            }

            var cargoSum = cleanLinks[i].wood + cleanLinks[i].stone + cleanLinks[i].iron;
            var merchNeeded = Math.ceil(cargoSum / 1000);

            listHTML += `
            <tr id="whRow_${i}">
                <td class="wh-td-left"><a href="${sourceURL}" class="wh-village-link">${sourceName}</a><span class="wh-merch-badge" title="Mercadores disponíveis na aldeia de origem">🚚 ${sourceMerchants}</span></td>
                <td class="wh-td-left"><a href="${targetURL}" class="wh-village-link" title="Estoque atual: 🪵 ${numberWithCommas(targetWood)} · 🧱 ${numberWithCommas(targetStone)} · ⛏️ ${numberWithCommas(targetIron)} · 📦 Armazém: ${numberWithCommas(targetCapacity)}">${targetName}</a></td>
                <td><span class="wh-dist-badge">📍 ${cleanLinks[i].distance}</span></td>
                <td><span class="wh-res-cell wh-wood">🪵 ${numberWithCommas(cleanLinks[i].wood)}</span></td>
                <td><span class="wh-res-cell wh-clay">🧱 ${numberWithCommas(cleanLinks[i].stone)}</span></td>
                <td><span class="wh-res-cell wh-iron">⛏️ ${numberWithCommas(cleanLinks[i].iron)}</span></td>
                <td><span class="wh-res-cell wh-cargo" title="${merchNeeded} mercadores necessários">📦 ${numberWithCommas(cargoSum)}</span></td>
                <td><button type="button" class="wh-btn-send" id="building_${i}" tabindex="-1" onclick="sendResource(${cleanLinks[i].source},${cleanLinks[i].target},${cleanLinks[i].wood},${cleanLinks[i].stone},${cleanLinks[i].iron},${i})">📨 Enviar</button></td>
            </tr>`;
        }
        $("#whSendTable").eq(0).append(listHTML);
        var firstBtn = $(':button[id^="building"]').first();
        if (firstBtn.length) firstBtn.focus();

        // Ativação do atalho de teclado global (ESPAÇO ou ENTER despacha a primeira linha)
        $(document).off("keydown.whBalancer").on("keydown.whBalancer", function (e) {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
                return;
            }
            if (e.keyCode === 32 || e.keyCode === 13) {
                var btn = $(':button[id^="building"]:visible:not(:disabled)').first();
                if (btn.length > 0) {
                    e.preventDefault();
                    btn.click();
                }
            }
        });

        // Escassez/excesso restantes
        for (let i = 0; i < shortageResources.length; i++) {
            if (parseInt(shortageResources[i][0].wood) + parseInt(shortageResources[i][1].stone) + parseInt(shortageResources[i][2].iron) != 0) {
                stillShortage.push([villagesData[i].name, shortageResources[i]]);
            }
        }
        for (let i = 0; i < excessResources.length; i++) {
            if (parseInt(excessResources[i][0].wood) + parseInt(excessResources[i][1].stone) + parseInt(excessResources[i][2].iron) != 0) {
                stillExcess.push([villagesData[i].name, excessResources[i]]);
            }
        }

        console.log("Lista de envios criada com sucesso");
    }
}
displayEverything();
function checkDistance(x1, y1, x2, y2) {
    var a = x1 - x2;
    var b = y1 - y2;
    return Math.round(Math.hypot(a, b));
}

function addDistanceToArray(array) {
    for (let i = 0; i < array.length; i++) {
        for (let property in villagesData) {
            if (villagesData[property].id == array[i].source) {
                sourceName = villagesData[property].name;
                sourceURL = villagesData[property].url;
            }
        }
        for (let property in villagesData) {
            if (villagesData[property].id == array[i].target) {
                targetName = villagesData[property].name;
                targetURL = villagesData[property].url;
            }
        }
        array[i].distance = checkDistance(sourceName.match(/(\d+)\|(\d+)/)[1], sourceName.match(/(\d+)\|(\d+)/)[2], targetName.match(/(\d+)\|(\d+)/)[1], targetName.match(/(\d+)\|(\d+)/)[2]);
    }
    return array;
}

function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1.$2");
    return x;
}

function toggleWhSettings(btn) {
    var panel = document.getElementById("whSettingsPanel");
    btn.classList.toggle("active");
    panel.classList.toggle("active");
}

function showStats() {
    var htmlStats = `
    <div class="wh-modal-wrapper">
        <div class="wh-modal-header">
            <div>
                <div class="wh-modal-title">📊 Balanço de Excesso & Escassez</div>
                <div class="wh-modal-subtitle">Aldeias com déficit ou excedentes que não puderam ser balanceados</div>
            </div>
            <a href="https://www.instagram.com/jhonatanazuelosoficial" target="_blank" class="wh-modal-author">
                📸 Criado por <strong>@jhonatanazuelosoficial</strong>
            </a>
        </div>
        <div class="wh-modal-body">
            <div class="wh-section-title wh-title-shortage">
                🔻 Aldeias em Déficit / Escassez (${stillShortage.length} aldeias)
            </div>
            <table class="wh-dialog-table">
                <thead>
                    <tr>
                        <th class="wh-th-village">Aldeia</th>
                        <th class="wh-th-wood">🪵 Falta Madeira</th>
                        <th class="wh-th-clay">🧱 Falta Argila</th>
                        <th class="wh-th-iron">⛏️ Falta Ferro</th>
                    </tr>
                </thead>
                <tbody>`;

    if (stillShortage.length === 0) {
        htmlStats += `<tr><td colspan="4" style="text-align:center;padding:18px;color:#4ade80;font-weight:700;">✅ Nenhuma aldeia com escassez de recursos pendente!</td></tr>`;
    } else {
        for (let i = 0; i < stillShortage.length; i++) {
            htmlStats += `<tr>
                <td class="wh-td-village"><strong>${stillShortage[i][0]}</strong></td>
                <td class="wh-td-wood"><span class="wh-badge-shortage">🪵 -${numberWithCommas(stillShortage[i][1][0].wood)}</span></td>
                <td class="wh-td-clay"><span class="wh-badge-shortage">🧱 -${numberWithCommas(stillShortage[i][1][1].stone)}</span></td>
                <td class="wh-td-iron"><span class="wh-badge-shortage">⛏️ -${numberWithCommas(stillShortage[i][1][2].iron)}</span></td>
            </tr>`;
        }
    }

    htmlStats += `</tbody></table>
            <div class="wh-section-title wh-title-excess" style="margin-top:16px;">
                🔺 Aldeias com Recursos Excedentes (${stillExcess.length} aldeias)
            </div>
            <table class="wh-dialog-table">
                <thead>
                    <tr>
                        <th class="wh-th-village">Aldeia</th>
                        <th class="wh-th-wood">🪵 Sobra Madeira</th>
                        <th class="wh-th-clay">🧱 Sobra Argila</th>
                        <th class="wh-th-iron">⛏️ Sobra Ferro</th>
                    </tr>
                </thead>
                <tbody>`;

    if (stillExcess.length === 0) {
        htmlStats += `<tr><td colspan="4" style="text-align:center;padding:18px;color:#4ade80;font-weight:700;">✅ Nenhum recurso excedente acumulado sem destino!</td></tr>`;
    } else {
        for (let i = 0; i < stillExcess.length; i++) {
            htmlStats += `<tr>
                <td class="wh-td-village"><strong>${stillExcess[i][0]}</strong></td>
                <td class="wh-td-wood"><span class="wh-badge-excess">🪵 +${numberWithCommas(stillExcess[i][1][0].wood)}</span></td>
                <td class="wh-td-clay"><span class="wh-badge-excess">🧱 +${numberWithCommas(stillExcess[i][1][1].stone)}</span></td>
                <td class="wh-td-iron"><span class="wh-badge-excess">⛏️ +${numberWithCommas(stillExcess[i][1][2].iron)}</span></td>
            </tr>`;
        }
    }

    htmlStats += `</tbody></table></div></div>`;
    Dialog.show("wh_stats_dialog", htmlStats);
}
function makeThingsCollapsible() {
    var coll = $(".collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}

function saveSettings() {
    tempArray = $("#settings").serializeArray();
    if ($("input[name='isMinting']")[0].checked == true) {
        settings.isMinting = true;
        settings.lowPoints = parseInt(tempArray[1].value);
        settings.highPoints = parseInt(tempArray[2].value);
        settings.highFarm = parseInt(tempArray[3].value);
        settings.builtOutPercentage = parseFloat(tempArray[4].value);
        settings.needsMorePercentage = parseFloat(tempArray[5].value);
    } else {
        settings.isMinting = false;
        settings.lowPoints = parseInt(tempArray[0].value);
        settings.highPoints = parseInt(tempArray[1].value);
        settings.highFarm = parseInt(tempArray[2].value);
        settings.builtOutPercentage = parseFloat(tempArray[3].value);
        settings.needsMorePercentage = parseFloat(tempArray[4].value);
    }
    localStorage.setItem("settingsWHBalancerAzuelos", JSON.stringify(settings));
    localStorage.setItem("settingsWHBalancerSophie", JSON.stringify(settings));
    $("#whBalancerContainer").remove();
    $("div[id*='restart']").remove();
    $("div[id*='sendResources']").remove();
    init();
    displayEverything();
}

function sliderChange(name, val) {
    document.getElementById(name).innerHTML = val;
}

function resAfterBalance() {
    var resBalancedHTML = `
    <div class="wh-modal-wrapper">
        <div class="wh-modal-header">
            <div>
                <div class="wh-modal-title">📋 Projeção Final Pós-Balanceamento</div>
                <div class="wh-modal-subtitle">Estoque projetado de cada aldeia após a conclusão de todas as entregas</div>
            </div>
            <a href="https://www.instagram.com/jhonatanazuelosoficial" target="_blank" class="wh-modal-author">
                📸 Criado por <strong>@jhonatanazuelosoficial</strong>
            </a>
        </div>
        <div class="wh-modal-body">
            <table class="wh-dialog-table">
                <thead>
                    <tr>
                        <th class="wh-th-village">Aldeia</th>
                        <th class="wh-th-points">Pontos</th>
                        <th class="wh-th-merch">Mercadores Restantes</th>
                        <th class="wh-th-wood">🪵 Madeira</th>
                        <th class="wh-th-clay">🧱 Argila</th>
                        <th class="wh-th-iron">⛏️ Ferro</th>
                        <th class="wh-th-cap">📦 Armazém</th>
                    </tr>
                </thead>
                <tbody>`;

    for (var i = 0; i < villagesData.length; i++) {
        var thisMerchantLeft = villagesData[i].availableMerchants;
        var thisVillageTotalWood = parseInt(villagesData[i].wood);
        var thisVillageTotalStone = parseInt(villagesData[i].stone);
        var thisVillageTotalIron = parseInt(villagesData[i].iron);
        if (incomingRes[villagesData[i].id] != undefined) {
            thisVillageTotalWood += incomingRes[villagesData[i].id].wood;
            thisVillageTotalStone += incomingRes[villagesData[i].id].stone;
            thisVillageTotalIron += incomingRes[villagesData[i].id].iron;
        }
        for (var j = 0; j < cleanLinks.length; j++) {
            if (cleanLinks[j].target == villagesData[i].id) {
                thisVillageTotalWood += cleanLinks[j].wood;
                thisVillageTotalStone += cleanLinks[j].stone;
                thisVillageTotalIron += cleanLinks[j].iron;
            }
            if (cleanLinks[j].source == villagesData[i].id) {
                thisVillageTotalWood -= cleanLinks[j].wood;
                thisVillageTotalStone -= cleanLinks[j].stone;
                thisVillageTotalIron -= cleanLinks[j].iron;
                thisMerchantLeft -= (cleanLinks[j].wood + cleanLinks[j].stone + cleanLinks[j].iron) / 1000;
            }
        }

        resBalancedHTML += `
        <tr>
            <td class="wh-td-village"><strong>${villagesData[i].name}</strong></td>
            <td class="wh-td-points">${numberWithCommas(villagesData[i].points)}</td>
            <td class="wh-td-merch"><span class="wh-merch-pill">${thisMerchantLeft}/${villagesData[i].totalMerchants}</span></td>
            <td class="wh-td-wood"><span class="wh-dialog-wood">🪵 ${numberWithCommas(thisVillageTotalWood)}</span></td>
            <td class="wh-td-clay"><span class="wh-dialog-clay">🧱 ${numberWithCommas(thisVillageTotalStone)}</span></td>
            <td class="wh-td-iron"><span class="wh-dialog-iron">⛏️ ${numberWithCommas(thisVillageTotalIron)}</span></td>
            <td class="wh-td-cap"><span class="wh-dialog-cap">📦 ${numberWithCommas(villagesData[i].warehouseCapacity)}</span></td>
        </tr>`;
    }

    resBalancedHTML += `</tbody></table></div></div>`;
    Dialog.show('wh_res_after_balance', resBalancedHTML);
}

// =========================================================================
// 🪙 1. MODAL E MOTOR DE CUNHAGEM AUTOMÁTICA EM MASSA (ACADEMIA 8H)
// =========================================================================

function openWhAutoMintModal() {
    var totalVillages = villagesData.length;
    var html = `
    <div class="wh-modal-wrapper" style="max-width: 900px !important;">
        <div class="wh-modal-header" style="background: linear-gradient(135deg, #1f1406 0%, #3b2207 50%, #1e293b 100%) !important; border-bottom: 2px solid #f59e0b !important;">
            <div>
                <div class="wh-modal-title" style="color: #fde68a !important;">🪙 Ativação em Massa — Criação Automática de Moedas</div>
                <div class="wh-modal-subtitle">Tribal Wars BR143 · Ativação oficial na Academia (8 horas contínuas em segundo plano)</div>
            </div>
            <a href="https://www.instagram.com/jhonatanazuelosoficial" target="_blank" class="wh-modal-author">
                📸 Criado por <strong>@jhonatanazuelosoficial</strong>
            </a>
        </div>
        <div class="wh-modal-body" style="padding: 20px !important; background: #070d19 !important;">
            <div class="wh-automint-info-card">
                <div class="wh-automint-badge">ℹ️ RECURSO OFICIAL DA ACADEMIA</div>
                <div class="wh-automint-text">
                    <strong>Criação automática:</strong> Quando ativada, a disponibilidade de recursos nesta aldeia será usada para cunhar moedas de ouro.
                    Assim que houver recursos suficientes para uma moeda de ouro, ela será cunhada automaticamente.
                    Você pode cancelar o processo a qualquer momento.
                </div>
                <div class="wh-automint-meta">
                    <span>⏱️ <strong>Duração:</strong> Até 8 horas contínuas</span>
                    <span>💰 <strong>Custo:</strong> 100% Gratuito (0 PP)</span>
                    <span>🏰 <strong>Aldeias no Grupo:</strong> <strong>${totalVillages}</strong></span>
                </div>
            </div>

            <!-- Resumo e Métricas -->
            <div class="wh-automint-metrics-grid">
                <div class="wh-metric-box metric-total">
                    <div class="wh-metric-val" id="whMintTotalVal">${totalVillages}</div>
                    <div class="wh-metric-lbl">Total de Aldeias</div>
                </div>
                <div class="wh-metric-box metric-success">
                    <div class="wh-metric-val" id="whMintSuccessVal">0</div>
                    <div class="wh-metric-lbl">⚡ Ativadas Agora</div>
                </div>
                <div class="wh-metric-box metric-running">
                    <div class="wh-metric-val" id="whMintActiveVal">0</div>
                    <div class="wh-metric-lbl">🟢 Já Ativas</div>
                </div>
                <div class="wh-metric-box metric-none">
                    <div class="wh-metric-val" id="whMintNoAcadVal">0</div>
                    <div class="wh-metric-lbl">🏛️ Sem Academia</div>
                </div>
            </div>

            <!-- Barra de Progresso -->
            <div class="wh-progress-box" style="margin: 16px 0 !important;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size:12px; font-weight:700; color:#e2e8f0;">
                    <span id="whMintProgressLabel">Pronto para iniciar verificação</span>
                    <span id="whMintProgressPercent">0%</span>
                </div>
                <div class="wh-progress-track" style="border-radius:6px; height:8px;">
                    <div class="wh-progress-fill" id="whMintProgressBar" style="width: 0%; background: linear-gradient(90deg, #f59e0b, #fbbf24, #22c55e) !important;"></div>
                </div>
            </div>

            <!-- Botões de Ação -->
            <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 18px;">
                <button type="button" class="wh-btn-gold" id="whBtnRunAutoMint" style="padding: 11px 24px; font-size: 13px;" onclick="startWhAutoMintProcess()">
                    🚀 Iniciar Ativação em Todas as ${totalVillages} Aldeias
                </button>
                <button type="button" class="wh-btn-tool" id="whBtnCancelAutoMint" style="display:none; padding: 11px 20px; font-size: 13px;" onclick="stopWhAutoMintProcess()">
                    ⏹️ Parar Processo
                </button>
            </div>

            <!-- Tabela de Log ao Vivo -->
            <div style="max-height: 280px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
                <table class="wh-dialog-table" id="whMintLogTable">
                    <thead>
                        <tr>
                            <th style="width: 45px; text-align: center;">#</th>
                            <th class="wh-th-village">Aldeia</th>
                            <th style="width: 140px; text-align: center;">Status</th>
                            <th>Detalhes / Sessão</th>
                        </tr>
                    </thead>
                    <tbody id="whMintLogBody">
                        <tr><td colspan="4" style="text-align:center; padding:18px; color:#94a3b8;">Clique em "Iniciar Ativação" para verificar e ativar a cunhagem automática em cada aldeia.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
    Dialog.show("wh_auto_mint_dialog", html);
}

function stopWhAutoMintProcess() {
    whAutoMintRunning = false;
    $("#whBtnCancelAutoMint").hide();
    $("#whBtnRunAutoMint").show().text("🚀 Retomar Ativação");
    $("#whMintProgressLabel").text("Processo pausado pelo jogador.");
}

function startWhAutoMintProcess() {
    if (whAutoMintRunning) return;
    whAutoMintRunning = true;
    $("#whBtnRunAutoMint").hide();
    $("#whBtnCancelAutoMint").show();

    whAutoMintStats = { activated: 0, alreadyActive: 0, noAcademy: 0, errors: 0 };
    $("#whMintSuccessVal").text("0");
    $("#whMintActiveVal").text("0");
    $("#whMintNoAcadVal").text("0");
    $("#whMintLogBody").empty();

    whAutoMintIndex = 0;
    processNextAutoMintVillage();
}

function processNextAutoMintVillage() {
    if (!whAutoMintRunning) return;
    if (whAutoMintIndex >= villagesData.length) {
        whAutoMintRunning = false;
        $("#whBtnCancelAutoMint").hide();
        $("#whBtnRunAutoMint").show().text("✅ Ativação Concluída").css("background", "#15803d");
        $("#whMintProgressLabel").text(`🎉 Finalizado! ${whAutoMintStats.activated} ativadas, ${whAutoMintStats.alreadyActive} já ativas, ${whAutoMintStats.noAcademy} sem academia.`);
        $("#whMintProgressBar").css("width", "100%");
        $("#whMintProgressPercent").text("100%");
        UI.SuccessMessage(`✅ Cunhagem automática finalizada! ${whAutoMintStats.activated} aldeias ativadas.`);
        return;
    }

    var v = villagesData[whAutoMintIndex];
    var currentNr = whAutoMintIndex + 1;
    var total = villagesData.length;
    var pct = Math.round((currentNr / total) * 100);

    $("#whMintProgressBar").css("width", pct + "%");
    $("#whMintProgressPercent").text(pct + "%");
    $("#whMintProgressLabel").text(`Verificando aldeia ${currentNr} de ${total}: ${v.name}...`);

    var rowId = "whMintRow_" + v.id;
    $("#whMintLogBody").prepend(`
        <tr id="${rowId}">
            <td style="text-align:center; color:#94a3b8;">${currentNr}</td>
            <td class="wh-td-village"><strong>${v.name}</strong></td>
            <td style="text-align:center;"><span class="wh-status-badge badge-working">⏳ Verificando...</span></td>
            <td style="color:#cbd5e1; font-size:11px;">Consultando Academia...</td>
        </tr>
    `);

    $.get('/game.php?village=' + v.id + '&screen=snob')
        .done(function(html) {
            if (!whAutoMintRunning) return;
            var docStr = typeof html === "string" ? html : "";
            
            // 1. Verificar se possui academia construída
            var hasSnob = docStr.indexOf('auto-minting') > -1 ||
                          docStr.indexOf('cancel_auto_minting_session') > -1 ||
                          docStr.indexOf('start_auto_minting_session') > -1 ||
                          docStr.indexOf('gold-overview') > -1;

            if (!hasSnob) {
                whAutoMintStats.noAcademy++;
                $("#whMintNoAcadVal").text(whAutoMintStats.noAcademy);
                $(`#${rowId} td:nth-child(3)`).html('<span class="wh-status-badge badge-none">🏛️ Sem Academia</span>');
                $(`#${rowId} td:nth-child(4)`).html('<span style="color:#94a3b8;">Edifício não construído ou indisponível</span>');
            } else {
                // 2. Verificar se já está ativa
                var isAlreadyRunning = docStr.indexOf('auto-minting-status') > -1 &&
                                       (docStr.indexOf('cancel_auto_minting_session') > -1 ||
                                        docStr.indexOf('title="Ativo"') > -1 ||
                                        docStr.indexOf('class="running') > -1 ||
                                        docStr.indexOf('Cancelar') > -1);

                if (isAlreadyRunning) {
                    whAutoMintStats.alreadyActive++;
                    $("#whMintActiveVal").text(whAutoMintStats.alreadyActive);
                    var mCoins = docStr.match(/coletado at[ée] agora:\s*(\d+)/i);
                    var mEnd = docStr.match(/Fim:\s*([^<]+)/i);
                    var info = "Sessão já em andamento";
                    if (mCoins) info += ` (${mCoins[1]} moedas)`;
                    if (mEnd) info += ` · Término: ${mEnd[1].trim()}`;
                    $(`#${rowId} td:nth-child(3)`).html('<span class="wh-status-badge badge-running">🟢 Já Ativa</span>');
                    $(`#${rowId} td:nth-child(4)`).html(`<span style="color:#86efac;">${info}</span>`);
                } else {
                    // 3. Ativar sessão de cunhagem automática
                    var $temp = $('<div>').html(docStr);
                    var $form = $temp.find('form[action*="start_auto_minting_session"], .auto-minting form');
                    var targetUrl = $form.length && $form.attr('action') ? $form.attr('action') : `/game.php?village=${v.id}&screen=snob&action=start_auto_minting_session&h=${game_data.csrf || csrf_token}`;
                    var postPayload = $form.length ? $form.serialize() : { h: game_data.csrf || csrf_token };

                    $.post(targetUrl, postPayload)
                        .done(function() {
                            whAutoMintStats.activated++;
                            $("#whMintSuccessVal").text(whAutoMintStats.activated);
                            $(`#${rowId} td:nth-child(3)`).html('<span class="wh-status-badge badge-success">⚡ Ativada</span>');
                            $(`#${rowId} td:nth-child(4)`).html('<span style="color:#fde047; font-weight:700;">✅ Sessão de 8h iniciada com sucesso!</span>');
                        })
                        .fail(function() {
                            whAutoMintStats.errors++;
                            $(`#${rowId} td:nth-child(3)`).html('<span class="wh-status-badge badge-error">❌ Erro</span>');
                            $(`#${rowId} td:nth-child(4)`).html('<span style="color:#f87171;">Falha na requisição de ativação</span>');
                        });
                }
            }
        })
        .fail(function() {
            whAutoMintStats.errors++;
            $(`#${rowId} td:nth-child(3)`).html('<span class="wh-status-badge badge-error">❌ Falha</span>');
            $(`#${rowId} td:nth-child(4)`).html('<span style="color:#f87171;">Erro de rede ao conectar à aldeia</span>');
        })
        .always(function() {
            whAutoMintIndex++;
            setTimeout(processNextAutoMintVillage, 280);
        });
}


// =========================================================================
// 💎 2. MODAL E MOTOR DE EQUILÍBRIO & NIVELAMENTO PREMIUM DE RECURSOS
// =========================================================================

function openWhPremiumExchangeModal() {
    var userPP = parseInt(game_data.player.pp) || 0;
    var totalVillages = villagesData.length;
    var maxTradesPossible = Math.floor(userPP / 10);

    // Calcular candidatos a nivelamento com Comerciante NPC
    var merchantCandidates = [];
    for (var i = 0; i < villagesData.length; i++) {
        var v = villagesData[i];
        var w = parseInt(v.wood) || 0;
        var s = parseInt(v.stone) || 0;
        var ir = parseInt(v.iron) || 0;
        var total = w + s + ir;
        var targetEach = Math.floor(total / 3);

        // Identificar o recurso com maior excesso e maior falta
        var resList = [
            { type: 'wood', name: 'Madeira', icon: '🪵', amount: w, diff: w - targetEach },
            { type: 'stone', name: 'Argila', icon: '🧱', amount: s, diff: s - targetEach },
            { type: 'iron', name: 'Ferro', icon: '⛏️', amount: ir, diff: ir - targetEach }
        ];

        resList.sort(function(a, b) { return b.diff - a.diff; });
        var excessRes = resList[0]; // Maior excesso
        var deficitRes = resList[2]; // Maior falta

        var tradeAmount = Math.min(excessRes.diff, Math.abs(deficitRes.diff));
        var disparity = excessRes.amount - deficitRes.amount;

        if (disparity >= 10000 && tradeAmount >= 5000) {
            merchantCandidates.push({
                village: v,
                excess: excessRes,
                deficit: deficitRes,
                tradeAmount: tradeAmount,
                disparity: disparity
            });
        }
    }

    merchantCandidates.sort(function(a, b) { return b.disparity - a.disparity; });

    // Calcular candidatos a compra na Troca Premium (Bolsa)
    var deficitCandidates = [];
    for (var i = 0; i < villagesData.length; i++) {
        var v = villagesData[i];
        var wShort = Math.max(0, (actualWoodAverage || woodAverage) - (parseInt(v.wood) || 0));
        var sShort = Math.max(0, (actualStoneAverage || stoneAverage) - (parseInt(v.stone) || 0));
        var iShort = Math.max(0, (actualIronAverage || ironAverage) - (parseInt(v.iron) || 0));
        var totalDef = wShort + sShort + iShort;
        if (totalDef > 8000) {
            deficitCandidates.push({
                village: v,
                wShort: wShort,
                sShort: sShort,
                iShort: iShort,
                totalDef: totalDef
            });
        }
    }
    deficitCandidates.sort(function(a, b) { return b.totalDef - a.totalDef; });

    var html = `
    <div class="wh-modal-wrapper" style="max-width: 960px !important;">
        <div class="wh-modal-header" style="background: linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #1e293b 100%) !important; border-bottom: 2px solid #38bdf8 !important;">
            <div>
                <div class="wh-modal-title" style="color: #7dd3fc !important;">💎 Nivelamento & Equilíbrio Premium de Recursos</div>
                <div class="wh-modal-subtitle">Tribal Wars BR143 · Nivelamento instantâneo com Pontos Premium e Troca Oficial</div>
            </div>
            <a href="https://www.instagram.com/jhonatanazuelosoficial" target="_blank" class="wh-modal-author">
                📸 Criado por <strong>@jhonatanazuelosoficial</strong>
            </a>
        </div>
        <div class="wh-modal-body" style="padding: 20px !important; background: #070d19 !important;">
            
            <!-- Banner de Saldo e Informações -->
            <div class="wh-premium-info-card">
                <div class="wh-premium-badge">💎 SALDO PREMIUM & CONTROLE DE EQUILÍBRIO</div>
                <div class="wh-premium-text">
                    Nivele os recursos das suas aldeias gastando Pontos Premium de forma ultra otimizada.
                    Você pode equalizar internamente os estoques (1:1:1) com o <strong>Comerciante NPC (10 PP/aldeia)</strong> ou comprar diretamente da <strong>Troca Premium (Bolsa do Mercado)</strong> para socorrer aldeias em déficit.
                </div>
                <div class="wh-premium-meta">
                    <span>💰 <strong>Pontos Premium Disponíveis:</strong> <span style="color:#fde047; font-weight:900;">${userPP} PP</span></span>
                    <span>🏰 <strong>Aldeias no Grupo:</strong> <strong>${totalVillages}</strong></span>
                    <span>⚡ <strong>Trocas NPC Possíveis:</strong> <strong style="color:#38bdf8;">${maxTradesPossible} aldeias</strong></span>
                </div>
            </div>

            <!-- Navegação de Abas -->
            <div class="wh-tabs-nav">
                <button type="button" class="wh-tab-btn active" id="whTabBtnMerch" onclick="switchWhPremiumTab('merch')">
                    ⚖️ Comerciante NPC (10 PP / aldeia) [${merchantCandidates.length} Candidatas]
                </button>
                <button type="button" class="wh-tab-btn" id="whTabBtnExchange" onclick="switchWhPremiumTab('exchange')">
                    🛒 Troca Premium (Bolsa de Recursos) [${deficitCandidates.length} em Déficit]
                </button>
            </div>

            <!-- ABA 1: COMERCIANTE NPC -->
            <div id="whPremiumTabContent_merch">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                    <div style="font-size:12px; color:#cbd5e1;">
                        Aldeias com desnível interno relevante. Marcadas automaticamente até o seu limite de PP.
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button type="button" class="wh-btn-tool" style="font-size:11px; padding:6px 12px;" onclick="toggleAllMerchantChecks(true)">Marcar Todas</button>
                        <button type="button" class="wh-btn-tool" style="font-size:11px; padding:6px 12px;" onclick="toggleAllMerchantChecks(false)">Desmarcar</button>
                        <button type="button" class="wh-btn-diamond" id="whBtnExecMerch" style="font-size:12px; padding:8px 18px;" onclick="runMerchantExchange()">
                            ⚡ Executar Nivelamento NPC
                        </button>
                    </div>
                </div>

                <div style="max-height: 350px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
                    <table class="wh-dialog-table">
                        <thead>
                            <tr>
                                <th style="width: 40px; text-align: center;"><input type="checkbox" id="whMerchMasterChk" onchange="toggleAllMerchantChecks(this.checked)" checked></th>
                                <th class="wh-th-village">Aldeia</th>
                                <th>Estoque Atual</th>
                                <th>Troca Sugerida (1:1)</th>
                                <th style="width: 80px; text-align: center;">Custo</th>
                                <th style="width: 130px; text-align: center;">Status</th>
                            </tr>
                        </thead>
                        <tbody id="whMerchTableBody">`;

    if (merchantCandidates.length === 0) {
        html += `<tr><td colspan="6" style="text-align:center; padding:24px; color:#4ade80; font-weight:700;">✅ Todas as suas aldeias estão com recursos perfeitamente nivelados!</td></tr>`;
    } else {
        var autoCheckedLimit = Math.min(merchantCandidates.length, maxTradesPossible);
        for (var i = 0; i < merchantCandidates.length; i++) {
            var c = merchantCandidates[i];
            var isChecked = i < autoCheckedLimit ? 'checked' : '';
            var rowId = "whMerchRow_" + c.village.id;
            html += `
            <tr id="${rowId}">
                <td style="text-align: center;">
                    <input type="checkbox" class="wh-merch-chk" data-vid="${c.village.id}" data-sell="${c.excess.type}" data-buy="${c.deficit.type}" data-amount="${c.tradeAmount}" data-name="${c.village.name}" ${isChecked}>
                </td>
                <td class="wh-td-village"><strong>${c.village.name}</strong></td>
                <td style="font-size: 11px; font-variant-numeric: tabular-nums;">
                    <span style="color:#4ade80;">🪵 ${numberWithCommas(c.village.wood)}</span> · 
                    <span style="color:#fb923c;">🧱 ${numberWithCommas(c.village.stone)}</span> · 
                    <span style="color:#93c5fd;">⛏️ ${numberWithCommas(c.village.iron)}</span>
                </td>
                <td style="font-size: 12px; font-weight: 700; color:#fde047;">
                    Dar ${c.excess.icon} ${numberWithCommas(c.tradeAmount)} por ${c.deficit.icon} ${numberWithCommas(c.tradeAmount)}
                </td>
                <td style="text-align: center;"><span class="wh-merch-badge">10 PP</span></td>
                <td style="text-align: center;"><span class="wh-status-badge badge-working">Pendente</span></td>
            </tr>`;
        }
    }

    html += `
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- ABA 2: TROCA PREMIUM (BOLSA) -->
            <div id="whPremiumTabContent_exchange" style="display:none;">
                <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div>
                            <label style="font-size:12px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px;">
                                🎯 Orçamento Máximo de Pontos Premium:
                            </label>
                            <div style="font-size:11px; color:#94a3b8; margin-top:2px;">
                                O script distribuirá este saldo comprando recursos nas aldeias com maior escassez
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <input type="number" id="whPremiumBudgetInput" min="1" max="${userPP}" value="${Math.min(userPP, 100)}" style="background:#020617; color:#fde047; border:1px solid #38bdf8; border-radius:6px; padding:6px 10px; font-weight:800; font-size:14px; width:100px; text-align:center;">
                            <span style="font-weight:800; color:#ffffff;">PP</span>
                            <button type="button" class="wh-btn-tool" style="font-size:11px; padding:6px 10px;" onclick="$('#whPremiumBudgetInput').val(50)">50 PP</button>
                            <button type="button" class="wh-btn-tool" style="font-size:11px; padding:6px 10px;" onclick="$('#whPremiumBudgetInput').val(100)">100 PP</button>
                            <button type="button" class="wh-btn-tool" style="font-size:11px; padding:6px 10px;" onclick="$('#whPremiumBudgetInput').val(250)">250 PP</button>
                            <button type="button" class="wh-btn-tool" style="font-size:11px; padding:6px 10px;" onclick="$('#whPremiumBudgetInput').val(${userPP})">Máximo (${userPP})</button>
                            <button type="button" class="wh-btn-diamond" id="whBtnExecPremiumBuy" style="font-size:12px; padding:8px 18px;" onclick="executePremiumExchangeBuy()">
                                🛒 Iniciar Compras na Bolsa
                            </button>
                        </div>
                    </div>
                </div>

                <div style="max-height: 320px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
                    <table class="wh-dialog-table">
                        <thead>
                            <tr>
                                <th class="wh-th-village">Aldeia</th>
                                <th class="wh-th-wood">🪵 Falta Madeira</th>
                                <th class="wh-th-clay">🧱 Falta Argila</th>
                                <th class="wh-th-iron">⛏️ Falta Ferro</th>
                                <th style="text-align: right;">Déficit Total</th>
                            </tr>
                        </thead>
                        <tbody>`;

    if (deficitCandidates.length === 0) {
        html += `<tr><td colspan="5" style="text-align:center; padding:24px; color:#4ade80; font-weight:700;">✅ Nenhuma aldeia com déficit crítico encontrado!</td></tr>`;
    } else {
        for (var i = 0; i < deficitCandidates.length; i++) {
            var d = deficitCandidates[i];
            html += `
            <tr>
                <td class="wh-td-village"><strong>${d.village.name}</strong></td>
                <td class="wh-td-wood">${d.wShort > 0 ? '<span class="wh-badge-shortage">🪵 -' + numberWithCommas(d.wShort) + '</span>' : '—'}</td>
                <td class="wh-td-clay">${d.sShort > 0 ? '<span class="wh-badge-shortage">🧱 -' + numberWithCommas(d.sShort) + '</span>' : '—'}</td>
                <td class="wh-td-iron">${d.iShort > 0 ? '<span class="wh-badge-shortage">⛏️ -' + numberWithCommas(d.iShort) + '</span>' : '—'}</td>
                <td style="text-align: right; font-weight: 800; color: #f87171;">📦 -${numberWithCommas(d.totalDef)}</td>
            </tr>`;
        }
    }

    html += `
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </div>`;
    Dialog.show("wh_premium_exchange_dialog", html);
}

function switchWhPremiumTab(tab) {
    if (tab === 'merch') {
        $("#whTabBtnMerch").addClass("active");
        $("#whTabBtnExchange").removeClass("active");
        $("#whPremiumTabContent_merch").show();
        $("#whPremiumTabContent_exchange").hide();
    } else {
        $("#whTabBtnExchange").addClass("active");
        $("#whTabBtnMerch").removeClass("active");
        $("#whPremiumTabContent_exchange").show();
        $("#whPremiumTabContent_merch").hide();
    }
}

function toggleAllMerchantChecks(state) {
    $(".wh-merch-chk").prop("checked", state);
    $("#whMerchMasterChk").prop("checked", state);
}

function runMerchantExchange() {
    var selected = [];
    $(".wh-merch-chk:checked").each(function() {
        var vId = $(this).data("vid");
        var sellRes = $(this).data("sell");
        var buyRes = $(this).data("buy");
        var amount = parseInt($(this).data("amount"));
        var name = $(this).data("name");
        selected.push({ id: vId, sell: sellRes, buy: buyRes, amount: amount, name: name });
    });

    if (selected.length === 0) {
        UI.ErrorMessage("Selecione ao menos uma aldeia para realizar a troca com o comerciante.");
        return;
    }

    var totalCost = selected.length * 10;
    var userPP = parseInt(game_data.player.pp) || 0;
    if (userPP < totalCost) {
        var possibleCount = Math.floor(userPP / 10);
        if (possibleCount === 0) {
            UI.ErrorMessage(`Você não possui Pontos Premium suficientes (necessário 10 PP, disponível: ${userPP} PP).`);
            return;
        }
        if (!confirm(`Você selecionou ${selected.length} trocas (${totalCost} PP), mas possui ${userPP} PP. Deseja executar as primeiras ${possibleCount} aldeias possíveis?`)) {
            return;
        }
        selected = selected.slice(0, possibleCount);
    } else {
        if (!confirm(`Confirmar nivelamento de ${selected.length} aldeias via Comerciante NPC?\nCusto total: ${selected.length * 10} Pontos Premium (10 PP/aldeia).`)) {
            return;
        }
    }

    whMerchantExchangeRunning = true;
    whMerchantSelectedQueue = selected;
    whMerchantIndex = 0;
    whMerchantStats = { success: 0, errors: 0, ppSpent: 0 };

    $("#whBtnExecMerch").prop("disabled", true).text("⏳ Executando...");
    processNextMerchantTrade();
}

function processNextMerchantTrade() {
    if (!whMerchantExchangeRunning || whMerchantIndex >= whMerchantSelectedQueue.length) {
        whMerchantExchangeRunning = false;
        $("#whBtnExecMerch").prop("disabled", false).text("⚡ Executar Nivelamento NPC");
        UI.SuccessMessage(`✅ Nivelamento concluído! ${whMerchantStats.success} aldeias niveladas (${whMerchantStats.ppSpent} PP gastos).`);
        return;
    }

    var item = whMerchantSelectedQueue[whMerchantIndex];
    var rowId = "whMerchRow_" + item.id;
    $(`#${rowId} td:last-child`).html('<span class="wh-status-badge badge-working">⏳ Trocando...</span>');

    var postUrl = `/game.php?village=${item.id}&screen=market&mode=other_offer&action=merchantexchange&h=${game_data.csrf || csrf_token}`;
    var postData = {
        res_buy: item.buy,
        res_sell: item.sell,
        sell: item.amount
    };

    $.post(postUrl, postData)
        .done(function() {
            whMerchantStats.success++;
            whMerchantStats.ppSpent += 10;
            $(`#${rowId} td:last-child`).html('<span class="wh-status-badge badge-success">✅ Nivelada (10 PP)</span>');
        })
        .fail(function() {
            whMerchantStats.errors++;
            $(`#${rowId} td:last-child`).html('<span class="wh-status-badge badge-error">❌ Erro</span>');
        })
        .always(function() {
            whMerchantIndex++;
            setTimeout(processNextMerchantTrade, 320);
        });
}

function executePremiumExchangeBuy() {
    var budgetPP = parseInt($("#whPremiumBudgetInput").val()) || 0;
    var userPP = parseInt(game_data.player.pp) || 0;
    if (budgetPP <= 0) {
        UI.ErrorMessage("Defina uma quantidade válida de Pontos Premium a utilizar.");
        return;
    }
    if (budgetPP > userPP) {
        UI.ErrorMessage(`Você não possui Pontos Premium suficientes (Disponível: ${userPP} PP).`);
        return;
    }

    var deficitList = [];
    for (var i = 0; i < villagesData.length; i++) {
        var v = villagesData[i];
        var wShort = Math.max(0, (actualWoodAverage || woodAverage) - parseInt(v.wood));
        var sShort = Math.max(0, (actualStoneAverage || stoneAverage) - parseInt(v.stone));
        var iShort = Math.max(0, (actualIronAverage || ironAverage) - parseInt(v.iron));
        var totalDeficit = wShort + sShort + iShort;
        if (totalDeficit > 5000) {
            deficitList.push({ village: v, wShort: wShort, sShort: sShort, iShort: iShort, totalDeficit: totalDeficit });
        }
    }

    deficitList.sort(function(a, b) { return b.totalDeficit - a.totalDeficit; });

    if (deficitList.length === 0) {
        UI.SuccessMessage("Todas as aldeias já estão no patamar balanceado de recursos!");
        return;
    }

    if (!confirm(`Deseja iniciar as compras na Troca Premium para socorrer as aldeias com maior escassez até o limite de ${budgetPP} PP?`)) {
        return;
    }

    whPremiumBuyRunning = true;
    whPremiumBuyBudget = budgetPP;
    whPremiumBuySpent = 0;
    whPremiumBuyQueue = deficitList;
    whPremiumBuyIndex = 0;

    $("#whBtnExecPremiumBuy").prop("disabled", true).text("⏳ Comprando...");
    processNextPremiumBuy();
}

function processNextPremiumBuy() {
    if (!whPremiumBuyRunning || whPremiumBuySpent >= whPremiumBuyBudget || whPremiumBuyIndex >= whPremiumBuyQueue.length) {
        whPremiumBuyRunning = false;
        $("#whBtnExecPremiumBuy").prop("disabled", false).text("🛒 Comprar Recursos na Bolsa");
        UI.SuccessMessage(`✅ Compras na Troca Premium finalizadas! Total gasto: ${whPremiumBuySpent} PP.`);
        return;
    }

    var item = whPremiumBuyQueue[whPremiumBuyIndex];
    var v = item.village;

    var resType = "stone";
    var maxNeed = item.sShort;
    if (item.wShort > maxNeed) { resType = "wood"; maxNeed = item.wShort; }
    if (item.iShort > maxNeed) { resType = "iron"; maxNeed = item.iShort; }

    var buyAmount = Math.min(maxNeed, 10000);
    if (buyAmount < 500) {
        whPremiumBuyIndex++;
        processNextPremiumBuy();
        return;
    }

    var beginData = { h: game_data.csrf || csrf_token };
    beginData["buy_" + resType] = buyAmount;

    TribalWars.post("market", { ajaxaction: "exchange_begin", village: v.id }, beginData, function(r) {
        if (!r || !r[0] || r[0].error) {
            whPremiumBuyIndex++;
            setTimeout(processNextPremiumBuy, 300);
            return;
        }

        var rateHash = r[0].rate_hash;
        var actualAmount = r[0].amount;
        var costPP = r[0].cost || 1;

        if (whPremiumBuySpent + costPP > whPremiumBuyBudget) {
            whPremiumBuyRunning = false;
            $("#whBtnExecPremiumBuy").prop("disabled", false).text("🛒 Comprar Recursos na Bolsa");
            UI.SuccessMessage(`Limite de PP atingido (${whPremiumBuySpent} PP gastos).`);
            return;
        }

        var confirmData = {
            mb: 1,
            h: game_data.csrf || csrf_token
        };
        confirmData["buy_" + resType] = actualAmount;
        confirmData["rate_" + resType] = rateHash;

        TribalWars._ah = { TribalWarsTE: 1 };
        TribalWars.post("market", { ajaxaction: "exchange_confirm", village: v.id }, confirmData, function(res) {
            whPremiumBuySpent += costPP;
            whPremiumBuyIndex++;
            setTimeout(processNextPremiumBuy, 350);
        });
    });
}

