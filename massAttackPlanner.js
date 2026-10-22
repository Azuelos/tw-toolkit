// ===========================================================================
// ⚔️ Planejador de Ataques em Massa (Mass Attack Planner) — OND BR143
// Versão: 2.0.0 (Edição Premium In-Game)
// Remasterizado, Aprimorado & Traduzido por: Azuelos (@jhonatanazuelosoficial)
// Uso na Barra de Acesso Rápido do Tribal Wars:
// javascript:$.getScript('https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/MassAttackPlannerPTBR.js');void(0);
// ===========================================================================

(function () {
    'use strict';

    // Evita duplicar se já estiver aberto na tela
    if (document.getElementById('twMapPlannerContainer')) {
        const existing = document.getElementById('twMapPlannerContainer');
        if (existing.style.display === 'none') {
            existing.style.display = 'block';
        }
        existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.UI && typeof window.UI.InfoMessage === 'function') {
            window.UI.InfoMessage('⚔️ Planejador de Ataques já está ativo na tela!', 2000);
        }
        return;
    }

    const SCRIPT_NAME = 'Planejador de Ataques em Massa';
    const SCRIPT_VERSION = 'v2.0.0';
    const LS_PREFIX = 'ond_mass_planner_';
    const TIME_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 dias para cache de config de unidades

    // Fallbacks padrão de velocidade (minutos por campo) para mundos com velocidade 1
    const DEFAULT_SPEEDS = {
        spear: 18,
        sword: 22,
        axe: 18,
        archer: 18,
        spy: 9,
        light: 10,
        marcher: 10,
        heavy: 11,
        ram: 30,
        catapult: 30,
        knight: 10,
        snob: 35
    };

    let worldUnitInfo = null;
    let playerVillagesCache = {};
    let countdownIntervalId = null;

    // ===========================================================================
    // CSS PREMIUM & ISOLAMENTO TOTAL CONTRA O CSS DO TRIBAL WARS
    // ===========================================================================
    const plannerStyles = `
<style id="twMapPlannerStyles">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

#twMapPlannerContainer {
    position: fixed !important;
    top: 40px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 95vw !important;
    max-width: 980px !important;
    max-height: 90vh !important;
    background: linear-gradient(145deg, #070d19 0%, #0f172a 50%, #1e293b 100%) !important;
    border: 1px solid rgba(255, 255, 255, 0.16) !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.15) !important;
    z-index: 99999 !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    color: #ffffff !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    animation: twMapPlannerFadeIn 0.25s ease-out !important;
}

@keyframes twMapPlannerFadeIn {
    from { opacity: 0; transform: translate(-50%, -15px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}

#twMapPlannerContainer *,
#twMapPlannerContainer *::before,
#twMapPlannerContainer *::after {
    box-sizing: border-box !important;
    margin: 0;
    padding: 0;
}

/* Header & Barra Superior */
.tw-map-header {
    background: linear-gradient(135deg, #091220 0%, #0d2838 50%, #0f3d4c 100%) !important;
    padding: 14px 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: 2px solid #0284c7 !important;
    cursor: move !important;
    user-select: none !important;
}
.tw-map-header-left {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
}
.tw-map-icon {
    font-size: 26px !important;
    line-height: 1 !important;
    filter: drop-shadow(0 2px 8px rgba(14, 165, 233, 0.7)) !important;
}
.tw-map-title-group h2 {
    font-size: 16px !important;
    font-weight: 900 !important;
    color: #ffffff !important;
    letter-spacing: 0.3px !important;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8) !important;
}
.tw-map-title-group span {
    font-size: 11px !important;
    color: #94a3b8 !important;
    font-weight: 600 !important;
}

.tw-map-header-right {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
}

.tw-creator-badge {
    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important;
    color: #ffffff !important;
    padding: 6px 14px !important;
    border-radius: 9999px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    box-shadow: 0 3px 14px rgba(220, 39, 67, 0.45) !important;
    transition: all 0.2s ease !important;
}
.tw-creator-badge:hover {
    transform: scale(1.04) !important;
    box-shadow: 0 5px 20px rgba(220, 39, 67, 0.7) !important;
    color: #ffffff !important;
    text-decoration: none !important;
}

.tw-btn-window {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #ffffff !important;
    border-radius: 8px !important;
    width: 28px !important;
    height: 28px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 13px !important;
    font-weight: bold !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
}
.tw-btn-window:hover {
    background: rgba(239, 68, 68, 0.8) !important;
    border-color: #ef4444 !important;
}

/* Corpo Principal Scrollável */
.tw-map-body {
    padding: 16px 20px !important;
    overflow-y: auto !important;
    flex: 1 1 auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
}
.tw-map-body::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
}
.tw-map-body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3) !important;
}
.tw-map-body::-webkit-scrollbar-thumb {
    background: #334155 !important;
    border-radius: 4px !important;
}
.tw-map-body::-webkit-scrollbar-thumb:hover {
    background: #475569 !important;
}

/* Cards de Configuração */
.tw-card {
    background: rgba(15, 23, 42, 0.85) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    padding: 14px 16px !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
}
.tw-card-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 12px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    padding-bottom: 8px !important;
}
.tw-card-title {
    font-size: 13px !important;
    font-weight: 800 !important;
    color: #38bdf8 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.6px !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
}

/* Configuração de Horário */
.tw-time-container {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
}
.tw-time-input-wrap {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    flex-wrap: wrap !important;
}
.tw-time-input-wrap label {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #e2e8f0 !important;
}
.tw-input-text {
    background: #090d16 !important;
    border: 1px solid #334155 !important;
    border-radius: 8px !important;
    color: #f8fafc !important;
    padding: 8px 12px !important;
    font-size: 14px !important;
    font-family: inherit !important;
    font-weight: 700 !important;
    outline: none !important;
    transition: all 0.2s ease !important;
    min-width: 220px !important;
}
.tw-input-text:focus {
    border-color: #38bdf8 !important;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.4) !important;
    background: #0d1527 !important;
}
.tw-quick-pills {
    display: flex !important;
    gap: 6px !important;
    flex-wrap: wrap !important;
}
.tw-pill-btn {
    background: #1e293b !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    color: #cbd5e1 !important;
    border-radius: 6px !important;
    padding: 5px 10px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
}
.tw-pill-btn:hover {
    background: #0284c7 !important;
    color: #ffffff !important;
    border-color: #38bdf8 !important;
    transform: translateY(-1px) !important;
}

/* Seletor de Velocidades */
.tw-grid-2 {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 14px !important;
}
@media (max-width: 700px) {
    .tw-grid-2 { grid-template-columns: 1fr !important; }
}
.tw-form-group {
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
}
.tw-form-group label {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #cbd5e1 !important;
}
.tw-select {
    background: #090d16 !important;
    border: 1px solid #334155 !important;
    border-radius: 8px !important;
    color: #ffffff !important;
    padding: 8px 12px !important;
    font-size: 13px !important;
    font-family: inherit !important;
    font-weight: 600 !important;
    outline: none !important;
    cursor: pointer !important;
}
.tw-select:focus {
    border-color: #38bdf8 !important;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.3) !important;
}

/* Grid de Coordenadas (Alvos, Nobres, Nukes, Apoios) */
.tw-coords-grid {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 12px !important;
}
@media (max-width: 900px) {
    .tw-coords-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
@media (max-width: 550px) {
    .tw-coords-grid { grid-template-columns: 1fr !important; }
}

.tw-coord-col {
    background: rgba(15, 23, 42, 0.95) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 10px !important;
    padding: 12px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
}
.tw-col-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    color: #ffffff !important;
}
.tw-badge-count {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    padding: 2px 7px !important;
    border-radius: 9999px !important;
    font-size: 10px !important;
    color: #38bdf8 !important;
    font-weight: 800 !important;
}
.tw-coord-textarea {
    width: 100% !important;
    height: 120px !important;
    background: #090d16 !important;
    border: 1px solid #334155 !important;
    border-radius: 6px !important;
    color: #f1f5f9 !important;
    padding: 8px !important;
    font-family: 'Consolas', 'Courier New', monospace !important;
    font-size: 12px !important;
    resize: vertical !important;
    outline: none !important;
    line-height: 1.4 !important;
}
.tw-coord-textarea:focus {
    border-color: #38bdf8 !important;
    background: #0b1120 !important;
}
.tw-col-control {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
    font-size: 11px !important;
    color: #94a3b8 !important;
}
.tw-input-number {
    width: 60px !important;
    background: #090d16 !important;
    border: 1px solid #334155 !important;
    border-radius: 6px !important;
    color: #ffffff !important;
    padding: 4px 6px !important;
    font-size: 12px !important;
    font-weight: bold !important;
    text-align: center !important;
    outline: none !important;
}

/* Barra de Ações & Estratégia */
.tw-actions-strip {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    background: rgba(0, 0, 0, 0.35) !important;
    border-radius: 10px !important;
    padding: 10px 14px !important;
    gap: 12px !important;
    flex-wrap: wrap !important;
}
.tw-actions-left {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    flex-wrap: wrap !important;
}
.tw-btn-action {
    background: #1e293b !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #ffffff !important;
    border-radius: 8px !important;
    padding: 8px 14px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    transition: all 0.2s ease !important;
}
.tw-btn-action:hover {
    background: #334155 !important;
    border-color: rgba(255, 255, 255, 0.4) !important;
    transform: translateY(-1px) !important;
}

.tw-btn-primary {
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
    border: 1px solid #38bdf8 !important;
    color: #ffffff !important;
    border-radius: 10px !important;
    padding: 10px 24px !important;
    font-size: 14px !important;
    font-weight: 900 !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    box-shadow: 0 4px 15px rgba(2, 132, 199, 0.45) !important;
    transition: all 0.2s ease !important;
    letter-spacing: 0.4px !important;
}
.tw-btn-primary:hover {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
    box-shadow: 0 6px 22px rgba(2, 132, 199, 0.7) !important;
    transform: translateY(-2px) !important;
}

/* Área de Resultados */
.tw-results-card {
    display: none;
    flex-direction: column !important;
    gap: 14px !important;
}
.tw-results-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: wrap !important;
    gap: 10px !important;
}
.tw-stat-summary {
    display: flex !important;
    gap: 10px !important;
    flex-wrap: wrap !important;
}
.tw-stat-chip {
    background: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 6px !important;
    padding: 4px 10px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
}
.tw-stat-chip strong {
    color: #38bdf8 !important;
}

/* Tabela de Lançamentos */
.tw-table-container {
    max-height: 280px !important;
    overflow-y: auto !important;
    border-radius: 8px !important;
    border: 1px solid #334155 !important;
    background: #090d16 !important;
}
.tw-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 12px !important;
    text-align: left !important;
}
.tw-table th {
    background: #0f172a !important;
    color: #94a3b8 !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    padding: 9px 12px !important;
    border-bottom: 2px solid #334155 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
}
.tw-table td {
    padding: 8px 12px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
    color: #e2e8f0 !important;
    vertical-align: middle !important;
}
.tw-table tr:hover td {
    background: #1e293b !important;
}

.tw-type-nuke { color: #f87171 !important; font-weight: 800 !important; }
.tw-type-noble { color: #fbbf24 !important; font-weight: 800 !important; }
.tw-type-support { color: #2dd4bf !important; font-weight: 800 !important; }

.tw-badge-status {
    padding: 3px 8px !important;
    border-radius: 9999px !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
}
.tw-status-pending { background: rgba(56, 189, 248, 0.2) !important; color: #38bdf8 !important; border: 1px solid rgba(56, 189, 248, 0.4) !important; }
.tw-status-urgent { background: rgba(245, 158, 11, 0.2) !important; color: #fbbf24 !important; border: 1px solid rgba(245, 158, 11, 0.5) !important; animation: twPulse 1.5s infinite !important; }
.tw-status-expired { background: rgba(239, 68, 68, 0.2) !important; color: #f87171 !important; border: 1px solid rgba(239, 68, 68, 0.4) !important; }

@keyframes twPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.tw-btn-place {
    background: #0284c7 !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 6px !important;
    padding: 4px 10px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    cursor: pointer !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    transition: all 0.15s ease !important;
}
.tw-btn-place:hover {
    background: #0ea5e9 !important;
    transform: translateY(-1px) !important;
    color: #ffffff !important;
    text-decoration: none !important;
}
.tw-btn-place.opened {
    background: #059669 !important;
    opacity: 0.7 !important;
}

/* Área de BBCode */
.tw-bbcode-area {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
}
.tw-bbcode-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}
.tw-bbcode-header span {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #cbd5e1 !important;
}
.tw-textarea-bbcode {
    width: 100% !important;
    height: 100px !important;
    background: #090d16 !important;
    border: 1px solid #334155 !important;
    border-radius: 8px !important;
    color: #f8fafc !important;
    padding: 10px !important;
    font-family: 'Consolas', 'Courier New', monospace !important;
    font-size: 11px !important;
    resize: vertical !important;
    outline: none !important;
}

/* Rodapé */
.tw-map-footer {
    background: #090e17 !important;
    padding: 10px 20px !important;
    border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    font-size: 11px !important;
    color: #94a3b8 !important;
}
</style>
`;

    // ===========================================================================
    // FUNÇÕES DE DATA, HORA & CÁLCULOS MATEMÁTICOS
    // ===========================================================================
    function formatDateTime(date) {
        const d = new Date(date);
        const pad = (n) => String(n).padStart(2, '0');
        const day = pad(d.getDate());
        const month = pad(d.getMonth() + 1);
        const year = d.getFullYear();
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        const seconds = pad(d.getSeconds());
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    function formatDisplayDate(date) {
        const d = new Date(date);
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function formatDuration(totalSeconds) {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = Math.floor(totalSeconds % 60);
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }

    function calculateDistance(coordA, coordB) {
        const [x1, y1] = coordA.split('|').map(Number);
        const [x2, y2] = coordB.split('|').map(Number);
        return Math.hypot(x1 - x2, y1 - y2);
    }

    function parseCoordinates(rawText) {
        if (!rawText) return [];
        const matches = rawText.match(/\b\d{1,3}\|\d{1,3}\b/g);
        return matches ? matches : [];
    }

    function uniqueCoordinates(coordsArray) {
        return Array.from(new Set(coordsArray));
    }

    // ===========================================================================
    // BUSCA DE VELOCIDADES DO MUNDO
    // ===========================================================================
    function fetchUnitInfo(callback) {
        const cached = localStorage.getItem(`${LS_PREFIX}unit_info`);
        const lastUpdated = localStorage.getItem(`${LS_PREFIX}last_updated`) ?? 0;

        if (cached && Date.now() < Number(lastUpdated) + TIME_INTERVAL) {
            try {
                worldUnitInfo = JSON.parse(cached);
                callback(worldUnitInfo);
                return;
            } catch (e) {
                console.warn('[Mass Attack Planner] Cache de unidades corrompido, buscando novamente...');
            }
        }

        jQuery.ajax({
            url: '/interface.php?func=get_unit_info',
            dataType: 'xml'
        }).done(function (xmlResponse) {
            worldUnitInfo = xml2json(jQuery(xmlResponse));
            localStorage.setItem(`${LS_PREFIX}unit_info`, JSON.stringify(worldUnitInfo));
            localStorage.setItem(`${LS_PREFIX}last_updated`, String(Date.now()));
            callback(worldUnitInfo);
        }).fail(function () {
            console.warn('[Mass Attack Planner] Falha na busca XML. Usando velocidades padrão.');
            worldUnitInfo = { config: {} };
            for (const [u, spd] of Object.entries(DEFAULT_SPEEDS)) {
                worldUnitInfo.config[u] = { speed: spd };
            }
            callback(worldUnitInfo);
        });
    }

    function xml2json($xml) {
        const data = {};
        jQuery.each($xml.children(), function () {
            const $this = jQuery(this);
            if ($this.children().length > 0) {
                data[$this.prop('tagName')] = xml2json($this);
            } else {
                data[$this.prop('tagName')] = jQuery.trim($this.text());
            }
        });
        return data;
    }

    // ===========================================================================
    // CAPTURA AUTOMÁTICA DAS ALDEIAS DO JOGADOR
    // ===========================================================================
    function loadPlayerVillages(onComplete) {
        if (window.game_data && window.game_data.villages && Object.keys(window.game_data.villages).length > 0) {
            for (const [id, vData] of Object.entries(window.game_data.villages)) {
                if (vData.coord) {
                    playerVillagesCache[vData.coord] = {
                        id: id,
                        name: vData.name || `Aldeia (${vData.coord})`,
                        coord: vData.coord
                    };
                }
            }
            if (Object.keys(playerVillagesCache).length > 0) {
                if (onComplete) onComplete(playerVillagesCache);
                return;
            }
        }

        // Tenta buscar via página overview prod
        jQuery.get('/game.php?screen=overview_villages&mode=prod&page=-1')
            .done(function (html) {
                const $doc = jQuery(html);
                $doc.find('.quickedit-vn').each(function () {
                    const $el = jQuery(this);
                    const vId = $el.attr('data-id');
                    const text = $el.text().trim();
                    const coordMatch = text.match(/\b\d{1,3}\|\d{1,3}\b/);
                    if (coordMatch && vId) {
                        const coord = coordMatch[0];
                        playerVillagesCache[coord] = {
                            id: vId,
                            name: text,
                            coord: coord
                        };
                    }
                });
                if (onComplete) onComplete(playerVillagesCache);
            })
            .fail(function () {
                if (window.game_data && window.game_data.village) {
                    const cur = window.game_data.village;
                    playerVillagesCache[cur.coord] = {
                        id: cur.id,
                        name: cur.name,
                        coord: cur.coord
                    };
                }
                if (onComplete) onComplete(playerVillagesCache);
            });
    }

    // ===========================================================================
    // CONSTRUÇÃO E INJEÇÃO DA INTERFACE VISUAL
    // ===========================================================================
    function buildInterface(unitInfo) {
        // Remove instâncias antigas
        jQuery('#twMapPlannerStyles').remove();
        jQuery('#twMapPlannerContainer').remove();
        jQuery('head').append(plannerStyles);

        // Define velocidades
        const getSpeed = (unit, defaultVal) => {
            return (unitInfo?.config?.[unit]?.speed) ? parseFloat(unitInfo.config[unit].speed) : defaultVal;
        };

        const ramSpeed = getSpeed('ram', 30);
        const axeSpeed = getSpeed('axe', 18);
        const lightSpeed = getSpeed('light', 10);
        const heavySpeed = getSpeed('heavy', 11);
        const swordSpeed = getSpeed('sword', 22);
        const spearSpeed = getSpeed('spear', 18);
        const snobSpeed = getSpeed('snob', 35);
        const knightSpeed = getSpeed('knight', 10);
        const spySpeed = getSpeed('spy', 9);

        // Data de chegada sugerida: +2 horas no futuro
        const defaultArrival = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const defaultArrivalStr = formatDateTime(defaultArrival);

        const html = `
        <div id="twMapPlannerContainer">
            <!-- Barra Superior (Header & Crédito) -->
            <div class="tw-map-header" id="twMapHeaderDrag">
                <div class="tw-map-header-left">
                    <span class="tw-map-icon">⚔️</span>
                    <div class="tw-map-title-group">
                        <h2>${SCRIPT_NAME}</h2>
                        <span>OND BR143 · Motor de Precisão Estratégica</span>
                    </div>
                </div>
                <div class="tw-map-header-right">
                    <a href="https://www.instagram.com/jhonatanazuelosoficial" target="_blank" class="tw-creator-badge">
                        📸 Criado por <strong>Azuelos</strong> (@jhonatanazuelosoficial)
                    </a>
                    <button class="tw-btn-window" id="twBtnClose" title="Fechar">✕</button>
                </div>
            </div>

            <!-- Conteúdo Principal -->
            <div class="tw-map-body">
                <!-- Card 1: Horário de Impacto (Chegada) -->
                <div class="tw-card">
                    <div class="tw-card-header">
                        <span class="tw-card-title">🎯 Horário de Chegada dos Ataques</span>
                    </div>
                    <div class="tw-time-container">
                        <div class="tw-time-input-wrap">
                            <label for="twArrivalInput">Data & Hora de Impacto:</label>
                            <input type="text" id="twArrivalInput" class="tw-input-text" value="${defaultArrivalStr}" placeholder="YYYY-MM-DD HH:MM:SS" />
                            <div class="tw-quick-pills">
                                <button class="tw-pill-btn" data-time-add="3600">+1 Hora</button>
                                <button class="tw-pill-btn" data-time-add="7200">+2 Horas</button>
                                <button class="tw-pill-btn" data-time-add="14400">+4 Horas</button>
                                <button class="tw-pill-btn" data-time-add="28800">+8 Horas</button>
                                <button class="tw-pill-btn" data-time-preset="tomorrow_07">Amanhã 07:00</button>
                                <button class="tw-pill-btn" data-time-preset="tomorrow_08">Amanhã 08:00</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 2: Seleção de Unidades Mais Lentas -->
                <div class="tw-card">
                    <div class="tw-card-header">
                        <span class="tw-card-title">⚡ Velocidades & Unidades Mais Lentas</span>
                    </div>
                    <div class="tw-grid-2">
                        <div class="tw-form-group">
                            <label for="twNukeUnit">Unidade Mais Lenta dos Fulls de Ataque:</label>
                            <select id="twNukeUnit" class="tw-select">
                                <option value="${ramSpeed}" selected>🐏 Aríete / Catapulta (${ramSpeed} min/campo)</option>
                                <option value="${axeSpeed}">🪓 Bárbaro / Lanceiro (${axeSpeed} min/campo)</option>
                                <option value="${lightSpeed}">🐴 Cavalaria Leve (${lightSpeed} min/campo)</option>
                                <option value="${heavySpeed}">🛡️ Cavalaria Pesada (${heavySpeed} min/campo)</option>
                            </select>
                        </div>
                        <div class="tw-form-group">
                            <label for="twSupportUnit">Unidade Mais Lenta dos Apoios:</label>
                            <select id="twSupportUnit" class="tw-select">
                                <option value="${swordSpeed}" selected>🛡️ Espadachim (${swordSpeed} min/campo)</option>
                                <option value="${spearSpeed}">🗡️ Lanceiro / Arqueiro (${spearSpeed} min/campo)</option>
                                <option value="${heavySpeed}">🛡️ Cavalaria Pesada (${heavySpeed} min/campo)</option>
                                <option value="${ramSpeed}">🏹 Catapulta (${ramSpeed} min/campo)</option>
                                <option value="${spySpeed}">🕵️ Explorador (${spySpeed} min/campo)</option>
                            </select>
                        </div>
                    </div>
                    <input type="hidden" id="twSnobSpeed" value="${snobSpeed}" />
                </div>

                <!-- Card 3: Inserção de Coordenadas -->
                <div class="tw-card">
                    <div class="tw-card-header">
                        <span class="tw-card-title">📍 Coordenadas de Origem & Alvos</span>
                        <div style="display:flex; gap:8px;">
                            <button class="tw-pill-btn" id="twBtnAutoFillVillages" title="Carrega automaticamente as suas aldeias">📥 Minhas Aldeias</button>
                            <button class="tw-pill-btn" id="twBtnCleanCoords" title="Remove duplicados e caracteres extras">🧹 Limpar Duplicados</button>
                        </div>
                    </div>

                    <div class="tw-coords-grid">
                        <!-- Coluna 1: Alvos -->
                        <div class="tw-coord-col">
                            <div class="tw-col-header">
                                <span>🎯 Alvos</span>
                                <span class="tw-badge-count" id="twBadgeTargets">0</span>
                            </div>
                            <textarea id="twTargetsCoords" class="tw-coord-textarea" placeholder="Cole os alvos aqui:&#10;500|500&#10;501|502"></textarea>
                            <div class="tw-col-control">
                                <span>Destinos de Ataque</span>
                            </div>
                        </div>

                        <!-- Coluna 2: Nobres -->
                        <div class="tw-coord-col">
                            <div class="tw-col-header">
                                <span>👑 Nobres</span>
                                <span class="tw-badge-count" id="twBadgeNobles">0</span>
                            </div>
                            <textarea id="twNoblesCoords" class="tw-coord-textarea" placeholder="Origens com nobre:&#10;498|498&#10;499|499"></textarea>
                            <div class="tw-col-control">
                                <span>Qtd/Alvo:</span>
                                <input type="number" id="twNoblesPerTarget" class="tw-input-number" value="1" min="1" max="10" />
                            </div>
                        </div>

                        <!-- Coluna 3: Fulls -->
                        <div class="tw-coord-col">
                            <div class="tw-col-header">
                                <span>💥 Fulls</span>
                                <span class="tw-badge-count" id="twBadgeNukes">0</span>
                            </div>
                            <textarea id="twNukesCoords" class="tw-coord-textarea" placeholder="Origens dos fulls:&#10;490|490&#10;492|493"></textarea>
                            <div class="tw-col-control">
                                <span>Qtd/Alvo:</span>
                                <input type="number" id="twNukesPerTarget" class="tw-input-number" value="1" min="1" max="50" />
                            </div>
                        </div>

                        <!-- Coluna 4: Apoios -->
                        <div class="tw-coord-col">
                            <div class="tw-col-header">
                                <span>🛡️ Apoios</span>
                                <span class="tw-badge-count" id="twBadgeSupports">0</span>
                            </div>
                            <textarea id="twSupportsCoords" class="tw-coord-textarea" placeholder="Origens dos apoios:&#10;505|505&#10;506|506"></textarea>
                            <div class="tw-col-control">
                                <span>Qtd/Alvo:</span>
                                <input type="number" id="twSupportsPerTarget" class="tw-input-number" value="1" min="1" max="50" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Barra de Ação & Estratégia -->
                <div class="tw-actions-strip">
                    <div class="tw-actions-left">
                        <label style="font-size:12px; font-weight:700; color:#cbd5e1;">Estratégia de Roteamento:</label>
                        <select id="twStrategy" class="tw-select" style="padding:6px 10px; font-size:12px;">
                            <option value="nearest" selected>⚡ Mais Próximas Primeiro (Menor tempo de viagem)</option>
                            <option value="farthest">🎯 Mais Distantes Primeiro (Maior tempo de viagem)</option>
                            <option value="balanced">⚖️ Distribuição Equilibrada</option>
                        </select>
                    </div>
                    <button class="tw-btn-primary" id="twBtnGeneratePlan">
                        <span>⚔️ Gerar Plano de Ataque</span>
                    </button>
                </div>

                <!-- Card 4: Resultados da Operação -->
                <div class="tw-card tw-results-card" id="twResultsCard">
                    <div class="tw-results-header">
                        <span class="tw-card-title">📋 Comandos Estruturados</span>
                        <div class="tw-stat-summary">
                            <div class="tw-stat-chip">Total de Envios: <strong id="twStatTotal">0</strong></div>
                            <div class="tw-stat-chip">Nobres: <strong id="twStatNobles">0</strong></div>
                            <div class="tw-stat-chip">Fulls: <strong id="twStatNukes">0</strong></div>
                            <div class="tw-stat-chip">Apoios: <strong id="twStatSupports">0</strong></div>
                        </div>
                    </div>

                    <!-- Tabela de Lançamentos -->
                    <div class="tw-table-container">
                        <table class="tw-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Origem</th>
                                    <th>Alvo</th>
                                    <th>Distância</th>
                                    <th>Duração</th>
                                    <th>Hora de Lançamento</th>
                                    <th>Tempo Restante</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody id="twTablePlanBody"></tbody>
                        </table>
                    </div>

                    <!-- BBCode Formatado -->
                    <div class="tw-bbcode-area">
                        <div class="tw-bbcode-header">
                            <span>BBCode Pronto para Fórum da Tribo / MP / Bloco de Notas:</span>
                            <div style="display:flex; gap:8px;">
                                <button class="tw-pill-btn" id="twBtnCopySimple">📄 Copiar Lista</button>
                                <button class="tw-btn-action" id="twBtnCopyBBCode" style="background:#0284c7; border-color:#38bdf8;">
                                    📋 Copiar BBCode Oficial
                                </button>
                            </div>
                        </div>
                        <textarea id="twBBCodeOutput" class="tw-textarea-bbcode" readonly></textarea>
                    </div>
                </div>
            </div>

            <!-- Rodapé -->
            <div class="tw-map-footer">
                <span>Tribal Wars · Ferramenta Oficial de Guerra OND BR143</span>
                <span>Planejamento Dinâmico em Tempo Real</span>
            </div>
        </div>
        `;

        jQuery('body').append(html);
        bindEvents();
        loadPlayerVillages();
    }

    // ===========================================================================
    // VINCULAÇÃO DE EVENTOS & INTERATIVIDADE
    // ===========================================================================
    function bindEvents() {
        // Fechar janela
        jQuery('#twBtnClose').on('click', function () {
            if (countdownIntervalId) clearInterval(countdownIntervalId);
            jQuery('#twMapPlannerContainer').remove();
        });

        // Atualização de badges ao digitar/colar coordenadas
        const updateBadges = () => {
            const targets = parseCoordinates(jQuery('#twTargetsCoords').val());
            const nobles = parseCoordinates(jQuery('#twNoblesCoords').val());
            const nukes = parseCoordinates(jQuery('#twNukesCoords').val());
            const supports = parseCoordinates(jQuery('#twSupportsCoords').val());

            jQuery('#twBadgeTargets').text(targets.length);
            jQuery('#twBadgeNobles').text(nobles.length);
            jQuery('#twBadgeNukes').text(nukes.length);
            jQuery('#twBadgeSupports').text(supports.length);
        };

        jQuery('#twTargetsCoords, #twNoblesCoords, #twNukesCoords, #twSupportsCoords').on('input', updateBadges);

        // Limpar e deduplicar
        jQuery('#twBtnCleanCoords').on('click', function () {
            ['#twTargetsCoords', '#twNoblesCoords', '#twNukesCoords', '#twSupportsCoords'].forEach((selector) => {
                const coords = parseCoordinates(jQuery(selector).val());
                jQuery(selector).val(uniqueCoordinates(coords).join('\n'));
            });
            updateBadges();
            if (window.UI && typeof window.UI.SuccessMessage === 'function') {
                window.UI.SuccessMessage('Coordenadas deduplicadas com sucesso!', 1500);
            }
        });

        // Atalhos de Horário Rápido
        jQuery('.tw-pill-btn[data-time-add]').on('click', function () {
            const secs = parseInt(jQuery(this).attr('data-time-add'), 10);
            const curVal = jQuery('#twArrivalInput').val();
            let baseTime = curVal ? new Date(curVal).getTime() : Date.now();
            if (isNaN(baseTime)) baseTime = Date.now();
            const newDate = new Date(baseTime + secs * 1000);
            jQuery('#twArrivalInput').val(formatDateTime(newDate));
        });

        jQuery('.tw-pill-btn[data-time-preset]').on('click', function () {
            const preset = jQuery(this).attr('data-time-preset');
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 1); // Amanhã

            if (preset === 'tomorrow_07') {
                targetDate.setHours(7, 0, 0, 0);
            } else if (preset === 'tomorrow_08') {
                targetDate.setHours(8, 0, 0, 0);
            }
            jQuery('#twArrivalInput').val(formatDateTime(targetDate));
        });

        // Carregar Minhas Aldeias
        jQuery('#twBtnAutoFillVillages').on('click', function () {
            loadPlayerVillages(function (villages) {
                const coords = Object.keys(villages);
                if (coords.length === 0) {
                    alert('Nenhuma aldeia encontrada na sessão atual.');
                    return;
                }
                const choice = prompt(
                    `Foram encontradas ${coords.length} aldeia(s) sua(s)!\n\n` +
                    `Onde deseja inserir as coordenadas?\n` +
                    `1 = Fulls\n` +
                    `2 = Nobres\n` +
                    `3 = Apoios`,
                    '1'
                );

                if (choice === '1') {
                    jQuery('#twNukesCoords').val(coords.join('\n'));
                } else if (choice === '2') {
                    jQuery('#twNoblesCoords').val(coords.join('\n'));
                } else if (choice === '3') {
                    jQuery('#twSupportsCoords').val(coords.join('\n'));
                }
                updateBadges();
            });
        });

        // Gerar Plano
        jQuery('#twBtnGeneratePlan').on('click', function () {
            executePlanGeneration();
        });

        // Copiar BBCode
        jQuery('#twBtnCopyBBCode').on('click', function () {
            const text = jQuery('#twBBCodeOutput').val();
            if (!text) return;
            copyToClipboard(text, '✅ BBCode copiado com sucesso para a área de transferência!');
        });

        jQuery('#twBtnCopySimple').on('click', function () {
            const text = jQuery('#twBBCodeOutput').data('simpleText');
            if (!text) return;
            copyToClipboard(text, '✅ Lista de envios copiada com sucesso!');
        });

        // Tornar Arrastável pelo Cabeçalho
        setupDraggable(document.getElementById('twMapPlannerContainer'), document.getElementById('twMapHeaderDrag'));
    }

    // ===========================================================================
    // MOTOR DE GERAÇÃO & ALOCAÇÃO DO PLANO DE ATAQUE
    // ===========================================================================
    function executePlanGeneration() {
        const arrivalInput = jQuery('#twArrivalInput').val().trim();
        const arrivalDate = new Date(arrivalInput);
        if (isNaN(arrivalDate.getTime())) {
            alert('Horário de chegada inválido. Use o formato YYYY-MM-DD HH:MM:SS');
            return;
        }

        const targetsCoords = uniqueCoordinates(parseCoordinates(jQuery('#twTargetsCoords').val()));
        if (targetsCoords.length === 0) {
            alert('Por favor, informe ao menos uma coordenada de alvo.');
            return;
        }

        const nukeSpeed = parseFloat(jQuery('#twNukeUnit').val());
        const supportSpeed = parseFloat(jQuery('#twSupportUnit').val());
        const snobSpeed = parseFloat(jQuery('#twSnobSpeed').val()) || 35;

        const noblePerTarget = parseInt(jQuery('#twNoblesPerTarget').val(), 10) || 1;
        const nukePerTarget = parseInt(jQuery('#twNukesPerTarget').val(), 10) || 1;
        const supportPerTarget = parseInt(jQuery('#twSupportsPerTarget').val(), 10) || 1;

        const noblesSources = uniqueCoordinates(parseCoordinates(jQuery('#twNoblesCoords').val()));
        const nukesSources = uniqueCoordinates(parseCoordinates(jQuery('#twNukesCoords').val()));
        const supportsSources = uniqueCoordinates(parseCoordinates(jQuery('#twSupportsCoords').val()));

        const strategy = jQuery('#twStrategy').val();

        const planItems = [];

        // 1. Alocação de Nobres
        if (noblesSources.length > 0) {
            const allocatedNobles = allocateSourcesToTargets(noblesSources, targetsCoords, snobSpeed, arrivalDate, noblePerTarget, 'noble', strategy);
            planItems.push(...allocatedNobles);
        }

        // 2. Alocação de Fulls (Nukes)
        if (nukesSources.length > 0) {
            const allocatedNukes = allocateSourcesToTargets(nukesSources, targetsCoords, nukeSpeed, arrivalDate, nukePerTarget, 'nuke', strategy);
            planItems.push(...allocatedNukes);
        }

        // 3. Alocação de Apoios
        if (supportsSources.length > 0) {
            const allocatedSupports = allocateSourcesToTargets(supportsSources, targetsCoords, supportSpeed, arrivalDate, supportPerTarget, 'support', strategy);
            planItems.push(...allocatedSupports);
        }

        if (planItems.length === 0) {
            alert('Nenhum envio pôde ser gerado. Verifique as origens e os alvos inseridos.');
            return;
        }

        // Ordenação cronológica por horário de lançamento (mais cedo primeiro)
        planItems.sort((a, b) => a.launchTime.getTime() - b.launchTime.getTime());

        renderPlanResults(planItems, arrivalDate);
    }

    function allocateSourcesToTargets(sources, targets, unitSpeed, arrivalDate, maxPerTarget, type, strategy) {
        const matrix = [];

        for (const src of sources) {
            for (const tgt of targets) {
                const dist = calculateDistance(src, tgt);
                const travelMs = dist * unitSpeed * 60 * 1000;
                const launchTime = new Date(arrivalDate.getTime() - travelMs);
                matrix.push({
                    source: src,
                    target: tgt,
                    distance: dist,
                    travelMs: travelMs,
                    launchTime: launchTime,
                    type: type
                });
            }
        }

        // Ordenação conforme a estratégia
        if (strategy === 'nearest') {
            matrix.sort((a, b) => a.distance - b.distance);
        } else if (strategy === 'farthest') {
            matrix.sort((a, b) => b.distance - a.distance);
        } else {
            // Balanced
            matrix.sort((a, b) => a.launchTime.getTime() - b.launchTime.getTime());
        }

        const allocated = [];
        const targetUsage = {};
        const sourceUsage = new Set();

        targets.forEach((t) => (targetUsage[t] = 0));

        for (const item of matrix) {
            if (sourceUsage.has(item.source)) continue;
            if (targetUsage[item.target] < maxPerTarget) {
                allocated.push(item);
                sourceUsage.add(item.source);
                targetUsage[item.target]++;
            }
        }

        return allocated;
    }

    // ===========================================================================
    // RENDERIZAÇÃO DOS RESULTADOS & ATUALIZAÇÃO DO CRONÔMETRO
    // ===========================================================================
    function renderPlanResults(planItems, arrivalDate) {
        jQuery('#twResultsCard').css('display', 'flex');

        let nobleCount = 0;
        let nukeCount = 0;
        let supportCount = 0;

        let tableRowsHtml = '';
        let bbCodeTableRows = '';
        let simpleTextList = '';

        const arrivalStr = formatDisplayDate(arrivalDate);

        planItems.forEach((item, index) => {
            if (item.type === 'noble') nobleCount++;
            else if (item.type === 'nuke') nukeCount++;
            else if (item.type === 'support') supportCount++;

            const [srcX, srcY] = item.source.split('|');
            const [tgtX, tgtY] = item.target.split('|');

            const sourceVillage = playerVillagesCache[item.source];
            const sourceId = sourceVillage ? sourceVillage.id : (window.game_data?.village?.id || '');
            const sourceName = sourceVillage ? sourceVillage.name : item.source;

            const placeUrl = `/game.php?village=${sourceId}&screen=place&x=${tgtX}&y=${tgtY}`;

            let typeIcon = '';
            let typeLabel = '';
            let typeClass = '';
            let bbCodeUnit = '';

            if (item.type === 'noble') {
                typeIcon = '👑';
                typeLabel = 'Nobre';
                typeClass = 'tw-type-noble';
                bbCodeUnit = '[unit]snob[/unit]';
            } else if (item.type === 'nuke') {
                typeIcon = '💥';
                typeLabel = 'Full';
                typeClass = 'tw-type-nuke';
                bbCodeUnit = '[unit]ram[/unit]';
            } else {
                typeIcon = '🛡️';
                typeLabel = 'Apoio';
                typeClass = 'tw-type-support';
                bbCodeUnit = '[unit]sword[/unit]';
            }

            const launchFormatted = formatDisplayDate(item.launchTime);
            const durationFormatted = formatDuration(item.travelMs / 1000);

            tableRowsHtml += `
            <tr id="twRow_${index}" data-launch-timestamp="${item.launchTime.getTime()}">
                <td class="${typeClass}">${typeIcon} ${typeLabel}</td>
                <td><a href="/game.php?screen=info_village&id=${sourceId}" target="_blank" style="color:#38bdf8; text-decoration:none; font-weight:700;">${item.source}</a></td>
                <td><a href="/game.php?screen=map&x=${tgtX}&y=${tgtY}" target="_blank" style="color:#ffffff; text-decoration:none; font-weight:700;">${item.target}</a></td>
                <td>${item.distance.toFixed(1)}</td>
                <td>${durationFormatted}</td>
                <td style="font-weight:700;">${launchFormatted}</td>
                <td><span class="tw-badge-status tw-status-pending" id="twTimer_${index}">Calculando...</span></td>
                <td>
                    <a href="${placeUrl}" target="_blank" class="tw-btn-place" onclick="jQuery(this).addClass('opened').text('✅ Aberto');">
                        ⚔️ Abrir Praça
                    </a>
                </td>
            </tr>
            `;

            // BBCode Formatado
            bbCodeTableRows += `[*] ${typeIcon} ${bbCodeUnit} [|] [coord]${item.source}[/coord] [|] [coord]${item.target}[/coord] [|] ${item.distance.toFixed(1)} [|] ${durationFormatted} [|] [b]${launchFormatted}[/b] [*]\n`;

            // Texto Simples
            simpleTextList += `${typeLabel.toUpperCase()} | ${item.source} ➔ ${item.target} | Dist: ${item.distance.toFixed(1)} | Lançar em: ${launchFormatted}\n`;
        });

        jQuery('#twTablePlanBody').html(tableRowsHtml);

        jQuery('#twStatTotal').text(planItems.length);
        jQuery('#twStatNobles').text(nobleCount);
        jQuery('#twStatNukes').text(nukeCount);
        jQuery('#twStatSupports').text(supportCount);

        const fullBBCode = `[size=12][b]⚔️ Planejamento de Operação — Horário de Chegada: ${arrivalStr}[/b][/size]\n\n` +
            `[table]\n` +
            `[**]Tipo[||]Origem[||]Alvo[||]Distância[||]Duração[||]Horário de Lançamento[/**]\n` +
            bbCodeTableRows +
            `[/table]\n\n` +
            `[size=9]Criado pelo [b]Planejador de Ataques em Massa · OND BR143[/b] (Azuelos)[/size]`;

        jQuery('#twBBCodeOutput').val(fullBBCode);
        jQuery('#twBBCodeOutput').data('simpleText', simpleTextList);

        // Inicia contagem regressiva ao vivo
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        updateLiveCountdown();
        countdownIntervalId = setInterval(updateLiveCountdown, 1000);

        // Rola a tela até os resultados
        document.getElementById('twResultsCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function updateLiveCountdown() {
        const now = Date.now();
        jQuery('#twTablePlanBody tr').each(function () {
            const $row = jQuery(this);
            const launchTimestamp = parseInt($row.attr('data-launch-timestamp'), 10);
            const $badge = $row.find('.tw-badge-status');

            const diffSecs = Math.floor((launchTimestamp - now) / 1000);

            if (diffSecs <= 0) {
                $badge.removeClass('tw-status-pending tw-status-urgent').addClass('tw-status-expired').text('❌ JÁ PASSOU');
            } else if (diffSecs <= 900) { // Menos de 15 minutos
                $badge.removeClass('tw-status-pending tw-status-expired').addClass('tw-status-urgent').text(`⚡ ${formatDuration(diffSecs)}`);
            } else {
                $badge.removeClass('tw-status-urgent tw-status-expired').addClass('tw-status-pending').text(`⏳ ${formatDuration(diffSecs)}`);
            }
        });
    }

    // ===========================================================================
    // UTILITÁRIO: COPIAR PARA ÁREA DE TRANSFERÊNCIA
    // ===========================================================================
    function copyToClipboard(text, successMsg) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showSuccess(successMsg);
            }).catch(() => {
                fallbackCopy(text, successMsg);
            });
        } else {
            fallbackCopy(text, successMsg);
        }
    }

    function fallbackCopy(text, successMsg) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showSuccess(successMsg);
        } catch (err) {
            alert('Não foi possível copiar automaticamente.');
        }
        document.body.removeChild(textArea);
    }

    function showSuccess(msg) {
        if (window.UI && typeof window.UI.SuccessMessage === 'function') {
            window.UI.SuccessMessage(msg, 2000);
        } else {
            alert(msg);
        }
    }

    // ===========================================================================
    // UTILITÁRIO: JANELA ARRASTÁVEL
    // ===========================================================================
    function setupDraggable(container, handle) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        handle.addEventListener('mousedown', function (e) {
            if (e.target.closest('button') || e.target.closest('a')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = container.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            container.style.transform = 'none';
            container.style.left = `${initialLeft}px`;
            container.style.top = `${initialTop}px`;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            container.style.left = `${initialLeft + dx}px`;
            container.style.top = `${initialTop + dy}px`;
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    // ===========================================================================
    // INICIALIZAÇÃO
    // ===========================================================================
    fetchUnitInfo(function (unitInfo) {
        buildInterface(unitInfo);
    });

})();
