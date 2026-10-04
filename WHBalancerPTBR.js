// Balanceador de Armazém — Tradução PT-BR — OND BR143
// Uso: javascript: $.getScript("URL_DO_SCRIPT");
console.log("Balanceador de Armazém — Tradução PT-BR — OND BR143");

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
var totalWood, totalStone, totalIron;
var merchantOrders = [];
var excessResources = [];
var shortageResources = [];
var links = [];
var cleanLinks = [];
var stillShortage = [];
var stillExcess = [];


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
var langShinko = [
    "Balanceador de Armazém",        // 0 - título
    "Aldeia de Origem",              // 1 - source village
    "Aldeia de Destino",             // 2 - target village
    "Distância",                     // 3 - distance
    "Madeira",                       // 4 - wood
    "Argila",                        // 5 - clay
    "Ferro",                         // 6 - iron
    "Enviar",                        // 7 - send resources
    "por Azuelos", // 8 - credits
    "Total de Madeira",              // 9 - total wood
    "Total de Argila",               // 10 - total clay
    "Total de Ferro",                // 11 - total iron
    "Madeira por aldeia",            // 12 - wood per village
    "Argila por aldeia",             // 13 - clay per village
    "Ferro por aldeia",              // 14 - iron per village
    "Troca Premium",                 // 15 - premium exchange
    "Sistema"                        // 16 - system
];

// ===== CSS PREMIUM — DESIGN MODERNO =====
cssClassesSophie = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ===== RESET & BASE ===== */
#whBalancerContainer *, #whBalancerContainer *::before, #whBalancerContainer *::after {
    box-sizing: border-box;
}
#whBalancerContainer {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e2e8f0;
    margin: 8px 0;
}

/* ===== PAINEL PRINCIPAL ===== */
.wh-panel {
    background: linear-gradient(135deg, #1a1d23 0%, #2d3139 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset;
    margin-bottom: 10px;
}

/* ===== TÍTULO/HEADER ===== */
.wh-title-bar {
    background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}
.wh-title-bar h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    letter-spacing: 0.3px;
}
.wh-title-bar .wh-badge {
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.5px;
}
.wh-credit-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    background: rgba(0,0,0,0.2);
    border-top: 1px solid rgba(255,255,255,0.04);
    font-size: 11px;
    color: #64748b;
}
.wh-credit-bar a {
    color: #5eead4;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
}
.wh-credit-bar a:hover {
    color: #99f6e4;
    text-decoration: underline;
}

/* ===== CARDS DE RECURSOS (TOTAIS) ===== */
.wh-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 14px 16px;
    background: rgba(0,0,0,0.15);
}
.wh-stat-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 12px 14px;
    transition: all 0.2s ease;
}
.wh-stat-card:hover {
    border-color: rgba(255,255,255,0.12);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.wh-stat-card .wh-stat-icon {
    font-size: 18px;
    margin-bottom: 4px;
}
.wh-stat-card .wh-stat-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #94a3b8;
    margin-bottom: 4px;
}
.wh-stat-card .wh-stat-value {
    font-size: 18px;
    font-weight: 700;
    color: #f1f5f9;
}
.wh-stat-card .wh-stat-avg {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
}
.wh-stat-card .wh-stat-avg span {
    color: #94a3b8;
    font-weight: 600;
}
.wh-stat-card.wood { border-left: 3px solid #a3e635; }
.wh-stat-card.wood .wh-stat-value { color: #a3e635; }
.wh-stat-card.clay { border-left: 3px solid #f97316; }
.wh-stat-card.clay .wh-stat-value { color: #f97316; }
.wh-stat-card.iron { border-left: 3px solid #94a3b8; }
.wh-stat-card.iron .wh-stat-value { color: #e2e8f0; }

/* ===== BARRA DE PROGRESSO ===== */
.wh-progress-wrap {
    width: 100%;
    height: 4px;
    background: rgba(255,255,255,0.05);
    overflow: hidden;
}
.wh-progress-bar {
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #14b8a6, #a3e635);
    transition: width 0.3s ease;
    border-radius: 0 4px 4px 0;
}

/* ===== TABELA DE ENVIOS ===== */
.wh-table-wrap {
    overflow-x: auto;
    padding: 0;
}
.wh-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
}
.wh-table thead th {
    background: rgba(0,0,0,0.3);
    color: #94a3b8;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 10px 12px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    position: sticky;
    top: 0;
    z-index: 10;
}
.wh-table thead th:first-child { text-align: left; }
.wh-table thead th:nth-child(2) { text-align: left; }
.wh-table tbody tr {
    transition: all 0.15s ease;
}
.wh-table tbody tr:hover {
    background: rgba(20, 184, 166, 0.08) !important;
}
.wh-table tbody tr:nth-child(odd) {
    background: rgba(255,255,255,0.015);
}
.wh-table tbody tr:nth-child(even) {
    background: rgba(0,0,0,0.1);
}
.wh-table td {
    padding: 8px 12px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    vertical-align: middle;
}
.wh-table td:first-child, .wh-table td:nth-child(2) {
    text-align: left;
}
.wh-table .wh-village-link {
    color: #5eead4;
    text-decoration: none;
    font-weight: 500;
    font-size: 12px;
    transition: color 0.15s;
}
.wh-table .wh-village-link:hover {
    color: #99f6e4;
    text-decoration: underline;
}
.wh-table .wh-dist {
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
    background: rgba(255,255,255,0.04);
    border-radius: 6px;
    padding: 3px 8px;
    display: inline-block;
}
.wh-table .wh-res-wood {
    color: #a3e635;
    font-weight: 600;
    font-size: 12px;
}
.wh-table .wh-res-clay {
    color: #fb923c;
    font-weight: 600;
    font-size: 12px;
}
.wh-table .wh-res-iron {
    color: #cbd5e1;
    font-weight: 600;
    font-size: 12px;
}

/* ===== BOTÃO DE ENVIO ===== */
.wh-btn-send {
    background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.3px;
    box-shadow: 0 2px 6px rgba(20,184,166,0.25);
    white-space: nowrap;
}
.wh-btn-send:hover {
    background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%);
    box-shadow: 0 4px 12px rgba(20,184,166,0.4);
    transform: translateY(-1px);
}
.wh-btn-send:active {
    transform: translateY(0);
}
.wh-btn-send:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
}

/* ===== BOTÕES DE AÇÃO (STATS/RESULTADO) ===== */
.wh-actions {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    justify-content: center;
    background: rgba(0,0,0,0.15);
    border-top: 1px solid rgba(255,255,255,0.04);
}
.wh-btn-action {
    background: rgba(255,255,255,0.06);
    color: #e2e8f0;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.2px;
}
.wh-btn-action:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.15);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* ===== MENU DE CONFIGURAÇÕES ===== */
.wh-settings-toggle {
    background: rgba(255,255,255,0.05);
    color: #94a3b8;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    width: auto;
    text-align: left;
    outline: none;
}
.wh-settings-toggle:hover {
    background: rgba(255,255,255,0.08);
    color: #e2e8f0;
}
.wh-settings-toggle::after {
    content: '⚙️';
    font-size: 14px;
}
.wh-settings-toggle.active {
    background: rgba(20,184,166,0.1);
    border-color: rgba(20,184,166,0.3);
    color: #5eead4;
}

.wh-settings-panel {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out, padding 0.3s ease-out;
    background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.2) 100%);
}
.wh-settings-panel.active {
    max-height: 600px;
    padding: 16px;
    border-top: 1px solid rgba(255,255,255,0.04);
}
.wh-settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
}
.wh-setting-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    padding: 12px;
}
.wh-setting-item label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #94a3b8;
    margin-bottom: 8px;
}
.wh-setting-item .wh-setting-desc {
    font-size: 10px;
    color: #64748b;
    margin-bottom: 6px;
}
.wh-setting-item input[type="range"] {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
    outline: none;
}
.wh-setting-item input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: #14b8a6;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 6px rgba(20,184,166,0.5);
}
.wh-setting-item .wh-range-value {
    font-size: 14px;
    font-weight: 700;
    color: #5eead4;
    margin-top: 4px;
    text-align: right;
}
.wh-setting-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #14b8a6;
    cursor: pointer;
}
.wh-btn-save {
    background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 28px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.3px;
    box-shadow: 0 2px 8px rgba(20,184,166,0.3);
}
.wh-btn-save:hover {
    background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%);
    box-shadow: 0 4px 16px rgba(20,184,166,0.4);
    transform: translateY(-1px);
}

/* ===== TOOLBAR ===== */
.wh-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: rgba(0,0,0,0.1);
    border-bottom: 1px solid rgba(255,255,255,0.04);
}
.wh-toolbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
}
.wh-toolbar-info {
    font-size: 11px;
    color: #64748b;
}
.wh-toolbar-info strong {
    color: #94a3b8;
}

/* ===== DIÁLOGOS (STATS/RESULTADO) ===== */
.wh-dialog-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
}
.wh-dialog-table th {
    background: rgba(0,0,0,0.4);
    color: #94a3b8;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.06);
}
.wh-dialog-table td {
    padding: 8px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    color: #e2e8f0;
}
.wh-dialog-table tr:nth-child(odd) { background: rgba(255,255,255,0.02); }
.wh-dialog-table tr:nth-child(even) { background: rgba(0,0,0,0.1); }
.wh-dialog-table tr:hover { background: rgba(20,184,166,0.06); }

.wh-section-title {
    font-size: 14px;
    font-weight: 700;
    color: #e2e8f0;
    padding: 14px 16px 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Inter', sans-serif;
}
.wh-res-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
}
.wh-res-badge.shortage {
    background: rgba(239,68,68,0.15);
    color: #fca5a5;
}
.wh-res-badge.excess {
    background: rgba(34,197,94,0.15);
    color: #86efac;
}

/* ===== LINHAS ALTERNADAS LEGADO (compatibilidade) ===== */
.sophRowA { background-color: rgba(255,255,255,0.015); color: #e2e8f0; }
.sophRowB { background-color: rgba(0,0,0,0.1); color: #e2e8f0; }
.sophHeader { background-color: rgba(0,0,0,0.3); font-weight: bold; color: #94a3b8; }
.sophLink { color: #5eead4; text-decoration: none; }
.sophLink:hover { color: #99f6e4; }
.btnSophie {
    background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}
.btnSophie:hover {
    background: linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%);
    box-shadow: 0 4px 12px rgba(20,184,166,0.4);
}

/* ===== COLLAPSIBLE LEGADO ===== */
.collapsible {
    background-color: transparent;
    color: #94a3b8;
    cursor: pointer;
    padding: 10px;
    width: 100%;
    border: none;
    text-align: left;
    outline: none;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
}
.active, .collapsible:hover { background-color: rgba(255,255,255,0.05); }
.collapsible:after { content: '⚙️'; float: right; margin-left: 5px; }
.active:after { content: "✕"; }
.content {
    padding: 0 5px;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.2s ease-out;
    background-color: rgba(0,0,0,0.3);
    color: #e2e8f0;
}
.item-padded { padding: 5px; }
.flex-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.submenu {
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 0px;
    top: 37px;
    min-width: 240px;
}

/* ===== ANIMAÇÃO DE ENTRADA ===== */
@keyframes whSlideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
}
#whBalancerContainer {
    animation: whSlideIn 0.4s ease-out;
}

/* ===== TOOLTIP CUSTOM ===== */
.wh-village-link[title] {
    position: relative;
}
</style>`;

// Adicionando classes CSS à página
$("#contentContainer").eq(0).prepend(cssClassesSophie);
$("#mobileHeader").eq(0).prepend(cssClassesSophie);

// Carregando configurações salvas ou definindo padrões
if (localStorage.getItem("settingsWHBalancerSophie") != null) {
    tempArray = JSON.parse(localStorage.getItem("settingsWHBalancerSophie"));
    var settings = {};
    settings.isMinting = tempArray.isMinting;
    settings.lowPoints = parseInt(tempArray.lowPoints);
    settings.highPoints = parseInt(tempArray.highPoints);
    settings.highFarm = parseInt(tempArray.highFarm);
    settings.builtOutPercentage = parseFloat(tempArray.builtOutPercentage);
    settings.needsMorePercentage = parseFloat(tempArray.needsMorePercentage);
} else {
    if (typeof settings == 'undefined') {
        var settings = {
            "isMinting": false,
            "highPoints": 8000,
            "highFarm": 23000,
            "lowPoints": 3000,
            "builtOutPercentage": 0.25,
            "needsMorePercentage": 0.85
        };
    }
    localStorage.setItem("settingsWHBalancerSophie", JSON.stringify(settings));
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

// Removendo tabela se o script já foi executado antes
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


function sendResource(sourceID, targetID, woodAmount, stoneAmount, ironAmount, rowNr) {
    $("#whRow_" + rowNr)[0].remove();
    var e = { "target_id": targetID, "wood": woodAmount, "stone": stoneAmount, "iron": ironAmount };
    TribalWars.post("market", {
        ajaxaction: "map_send", village: sourceID
    }, e, function (e) {
        UI.SuccessMessage(e.message);
        console.log(e.message);
        $(':button[id^="building"]')[0].focus();
    }, !1);
    $(':button[id^="building"]').prop('disabled', true);
    setTimeout(function () {
        $(':button[id^="building"]').prop('disabled', false);
        console.log("Botões reativados");
        if ($("#whSendTable tbody tr").length <= 0) {
            alert("✅ Envio finalizado! Todos os recursos foram distribuídos.");
            if ($(".btn-pp").length > 0) {
                $(".btn-pp").remove();
            }
            throw Error("Concluído.");
        }
        $(':button[id^="building"]')[0].focus();
    }, 150);
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
                        if ($page.find("#trades_table tr")[1].children[2].innerText != langShinko[16]) {
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
                        if ($page.find("#trades_table tr")[1].children[3].innerText != langShinko[15]) {
                            let resourceType = classNames[classNames.length - 1];
                            let resourceAmount = $child.text().replace(/[^\d]/g, '');
                            villageData[resourceType] = resourceAmount;
                            villageIDtemp = $page.find("#trades_table tr")[i].children[4].children[0].href.match(/id=(\d*)/)[1];
                        }
                    }
                }
                if ($page.find("#trades_table tr")[1].children[3].innerText != langShinko[15] && $page.find("#trades_table tr")[1].children[2].innerText != langShinko[16]) {
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
                            alert(`⚠️ ATENÇÃO — Excesso de Recursos!\n\nCom as configurações atuais, há muitos recursos excedentes que não podem ser distribuídos.\n\n📊 Médias atuais:\n• Madeira: ${numberWithCommas(actualWoodAverage)}\n• Argila: ${numberWithCommas(actualStoneAverage)}\n• Ferro: ${numberWithCommas(actualIronAverage)}\n\n💡 Dicas:\n• Aumente "Fazenda alta" para incluir mais aldeias\n• Aumente "Pontos mínimos" para mais prioridades\n• Para balancear igualmente, defina "Fazenda alta" = 99999\n\nAldeias finalizadas: ${numberWithCommas(consideredBuiltOut)}`);
                        }

                    } else {
                        actualWoodAverage = woodAverage;
                        actualStoneAverage = stoneAverage;
                        actualIronAverage = ironAverage;
                    }

                    // ===== CONSTRUINDO HTML PREMIUM =====
                    totalsAndAverages = `
                    <div id="totals">
                        <div class="wh-stats-grid">
                            <div class="wh-stat-card wood">
                                <div class="wh-stat-icon">🪵</div>
                                <div class="wh-stat-label">Madeira Total</div>
                                <div class="wh-stat-value">${numberWithCommas(totalWood)}</div>
                                <div class="wh-stat-avg">Média: <span>${numberWithCommas(woodAverage)}</span> · Corrigida: <span>${numberWithCommas(actualWoodAverage)}</span></div>
                            </div>
                            <div class="wh-stat-card clay">
                                <div class="wh-stat-icon">🧱</div>
                                <div class="wh-stat-label">Argila Total</div>
                                <div class="wh-stat-value">${numberWithCommas(totalStone)}</div>
                                <div class="wh-stat-avg">Média: <span>${numberWithCommas(stoneAverage)}</span> · Corrigida: <span>${numberWithCommas(actualStoneAverage)}</span></div>
                            </div>
                            <div class="wh-stat-card iron">
                                <div class="wh-stat-icon">⛏️</div>
                                <div class="wh-stat-label">Ferro Total</div>
                                <div class="wh-stat-value">${numberWithCommas(totalIron)}</div>
                                <div class="wh-stat-avg">Média: <span>${numberWithCommas(ironAverage)}</span> · Corrigida: <span>${numberWithCommas(actualIronAverage)}</span></div>
                            </div>
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
                    htmlCode = `<div id="whBalancerContainer">
                    <div class="wh-panel">
                        <div class="wh-title-bar">
                            <h2>⚖️ ${langShinko[0]}</h2>
                            <span class="wh-badge">${villagesData.length} aldeias · <a href="https://www.instagram.com/jhonatanazuelosoficial" target="_blank" style="color:#fff;text-decoration:none;border-bottom:1px dotted rgba(255,255,255,0.5)">por Azuelos</a></span>
                        </div>

                        ${totalsAndAverages}

                        <div class="wh-toolbar">
                            <div class="wh-toolbar-left">
                                <button class="wh-settings-toggle" onclick="toggleWhSettings(this)">Configurações</button>
                            </div>
                            <div class="wh-toolbar-info">
                                Clique em <strong>"${langShinko[7]}"</strong> para enviar cada lote
                            </div>
                        </div>

                        <div id="whSettingsPanel" class="wh-settings-panel">
                            <form id="settings">
                                <div class="wh-settings-grid">
                                    <div class="wh-setting-item">
                                        <label>⚡ Ignorar configurações</label>
                                        <div class="wh-setting-desc">Balancear igualmente sem regras</div>
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
                                        <div class="wh-setting-desc">Acima desse nível, a aldeia recebe menos recursos</div>
                                        <input type="range" min="0" max="13000" step="10" value="${settings.highPoints}" name="highPoints" oninput="sliderChange('highPointsVal',this.value)">
                                        <div class="wh-range-value"><span id="highPointsVal">${settings.highPoints}</span> pontos</div>
                                    </div>
                                    <div class="wh-setting-item">
                                        <label>🌾 Fazenda alta (população)</label>
                                        <div class="wh-setting-desc">Aldeias com farm acima disso são consideradas prontas</div>
                                        <input type="range" min="0" max="33000" step="10" value="${settings.highFarm}" name="highFarm" oninput="sliderChange('highFarmVal',this.value)">
                                        <div class="wh-range-value"><span id="highFarmVal">${settings.highFarm}</span> pop</div>
                                    </div>
                                    <div class="wh-setting-item">
                                        <label>📦 % armazém → aldeias prontas</label>
                                        <div class="wh-setting-desc">Quanto do armazém manter cheio nas aldeias finalizadas</div>
                                        <input type="range" min="0" max="1" step="0.01" value="${settings.builtOutPercentage}" name="builtOutPercentage" oninput="sliderChange('builtOutVal',this.value)">
                                        <div class="wh-range-value"><span id="builtOutVal">${settings.builtOutPercentage}</span></div>
                                    </div>
                                    <div class="wh-setting-item">
                                        <label>🎯 % armazém → aldeias prioritárias</label>
                                        <div class="wh-setting-desc">Quanto do armazém encher nas aldeias que precisam crescer</div>
                                        <input type="range" min="0" max="1" step="0.01" value="${settings.needsMorePercentage}" name="needsMorePercentage" oninput="sliderChange('needsMoreVal',this.value)">
                                        <div class="wh-range-value"><span id="needsMoreVal">${settings.needsMorePercentage}</span></div>
                                    </div>
                                </div>
                                <div style="text-align:center">
                                    <button type="button" class="wh-btn-save" onclick="saveSettings()">💾 Salvar e Recalcular</button>
                                </div>
                            </form>
                        </div>

                        <div id="sendResources" class="wh-table-wrap">
                            <table id="tableSend" class="wh-table">
                                <thead>
                                    <tr>
                                        <th>📤 ${langShinko[1]}</th>
                                        <th>📥 ${langShinko[2]}</th>
                                        <th>📏 ${langShinko[3]}</th>
                                        <th>🪵 ${langShinko[4]}</th>
                                        <th>🧱 ${langShinko[5]}</th>
                                        <th>⛏️ ${langShinko[6]}</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody id="whSendTable"></tbody>
                            </table>
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

        cleanLinks = addDistanceToArray(cleanLinks);
        listHTML = ``;
        cleanLinks.sort(function (left, right) { return left.distance - right.distance; });

        for (let i = 0; i < cleanLinks.length; i++) {
            for (let property in villagesData) {
                if (villagesData[property].id == cleanLinks[i].source) {
                    sourceName = villagesData[property].name;
                    sourceURL = villagesData[property].url;
                }
            }
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

            listHTML += `
            <tr id="whRow_${i}">
                <td><a href="${sourceURL}" class="wh-village-link">${sourceName}</a></td>
                <td><a href="${targetURL}" class="wh-village-link" title="🪵 ${targetWood} · 🧱 ${targetStone} · ⛏️ ${targetIron} · 📦 ${targetCapacity}">${targetName}</a></td>
                <td><span class="wh-dist">${cleanLinks[i].distance}</span></td>
                <td><span class="wh-res-wood">${numberWithCommas(cleanLinks[i].wood)}</span></td>
                <td><span class="wh-res-clay">${numberWithCommas(cleanLinks[i].stone)}</span></td>
                <td><span class="wh-res-iron">${numberWithCommas(cleanLinks[i].iron)}</span></td>
                <td><button type="button" class="wh-btn-send" id="building" tabindex="-1" onclick="sendResource(${cleanLinks[i].source},${cleanLinks[i].target},${cleanLinks[i].wood},${cleanLinks[i].stone},${cleanLinks[i].iron},${i})">📨 ${langShinko[7]}</button></td>
            </tr>`;
        }
        $("#whSendTable").eq(0).append(listHTML);
        if ($("#building")[0]) $("#building")[0].focus();

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

        // Botões de ação
        $("#totals").eq(0).append(`
        <div class="wh-actions">
            <button type="button" class="wh-btn-action" onclick="showStats()">📊 Mostrar Excesso / Escassez</button>
            <button type="button" class="wh-btn-action" onclick="resAfterBalance()">📋 Resultado do Balanceamento</button>
        </div>
        <div class="wh-credit-bar">
            ⚔️ Feito por <a href="https://www.instagram.com/jhonatanazuelosoficial" target="_blank">@Azuelos</a> · OND BR143
        </div>`);
        console.log("Finalizado");
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
    htmlStats = `<div style="font-family:'Inter',sans-serif;max-width:850px;background:#1a1d23;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
    <div class="wh-section-title" style="background:rgba(239,68,68,0.1);border-bottom:1px solid rgba(239,68,68,0.2);">
        🔻 Escassez de Recursos (${stillShortage.length} aldeias)
    </div>
    <table class="wh-dialog-table"><tr><th>Aldeia</th><th>🪵 Madeira</th><th>🧱 Argila</th><th>⛏️ Ferro</th></tr>`;

    for (let i = 0; i < stillShortage.length; i++) {
        htmlStats += `<tr>
            <td style="font-weight:600">${stillShortage[i][0]}</td>
            <td><span class="wh-res-badge shortage">${numberWithCommas(stillShortage[i][1][0].wood)}</span></td>
            <td><span class="wh-res-badge shortage">${numberWithCommas(stillShortage[i][1][1].stone)}</span></td>
            <td><span class="wh-res-badge shortage">${numberWithCommas(stillShortage[i][1][2].iron)}</span></td>
        </tr>`;
    }

    htmlStats += `</table>
    <div class="wh-section-title" style="background:rgba(34,197,94,0.1);border-bottom:1px solid rgba(34,197,94,0.2);">
        🔺 Excesso de Recursos (${stillExcess.length} aldeias)
    </div>
    <table class="wh-dialog-table"><tr><th>Aldeia</th><th>🪵 Madeira</th><th>🧱 Argila</th><th>⛏️ Ferro</th></tr>`;

    for (let i = 0; i < stillExcess.length; i++) {
        htmlStats += `<tr>
            <td style="font-weight:600">${stillExcess[i][0]}</td>
            <td><span class="wh-res-badge excess">${numberWithCommas(stillExcess[i][1][0].wood)}</span></td>
            <td><span class="wh-res-badge excess">${numberWithCommas(stillExcess[i][1][1].stone)}</span></td>
            <td><span class="wh-res-badge excess">${numberWithCommas(stillExcess[i][1][2].iron)}</span></td>
        </tr>`;
    }
    htmlStats += "</table></div>";

    Dialog.show("content", htmlStats);
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
    resBalancedHTML = `<div style="font-family:'Inter',sans-serif;max-width:900px;background:#1a1d23;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
    <div class="wh-section-title" style="background:rgba(20,184,166,0.1);border-bottom:1px solid rgba(20,184,166,0.2);">
        📋 Resultado Final do Balanceamento
    </div>
    <table class="wh-dialog-table">
    <tr><th>Aldeia</th><th>Pontos</th><th>Mercadores</th><th>🪵 Madeira</th><th>🧱 Argila</th><th>⛏️ Ferro</th><th>📦 Armazém</th></tr>`;

    for (var i = 0; i < villagesData.length; i++) {
        thisMerchantLeft = villagesData[i].availableMerchants;
        if (incomingRes[villagesData[i].id] != undefined) {
            thisVillageTotalWood = incomingRes[villagesData[i].id].wood + parseInt(villagesData[i].wood);
            thisVillageTotalStone = incomingRes[villagesData[i].id].stone + parseInt(villagesData[i].stone);
            thisVillageTotalIron = incomingRes[villagesData[i].id].iron + parseInt(villagesData[i].iron);
        } else {
            thisVillageTotalWood = parseInt(villagesData[i].wood);
            thisVillageTotalStone = parseInt(villagesData[i].stone);
            thisVillageTotalIron = parseInt(villagesData[i].iron);
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
            <td style="font-weight:600">${villagesData[i].name}</td>
            <td>${numberWithCommas(villagesData[i].points)}</td>
            <td style="text-align:center">${thisMerchantLeft}/${villagesData[i].totalMerchants}</td>
            <td><span class="wh-res-wood">${numberWithCommas(thisVillageTotalWood)}</span></td>
            <td><span class="wh-res-clay">${numberWithCommas(thisVillageTotalStone)}</span></td>
            <td><span class="wh-res-iron">${numberWithCommas(thisVillageTotalIron)}</span></td>
            <td style="text-align:right;color:#64748b">${numberWithCommas(villagesData[i].warehouseCapacity)}</td>
        </tr>`;
    }
    resBalancedHTML += `</table></div>`;
    Dialog.show('content', resBalancedHTML);
}
