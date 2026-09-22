(function () {
  if (typeof game_data === "undefined" || typeof $ === "undefined") {
    alert("Corre este script dentro do Tribal Wars, na conta da tribo.");
    return;
  }
  if ($("#nomadesOfensivasBox").length) {
    $("#nomadesOfensivasBox")[0].scrollIntoView();
    return;
  }

  const PAUSE = 250;
  const MIN_OFF = 9000;
  const MIN_OFF_HEAVY = 18000;
  let busy = false;
  let gameTribe = "";

  function kOf(coord) {
    const m = String(coord || "").match(/^(\d{1,3})\|(\d{1,3})$/);
    return m ? `k${Math.floor(Number(m[2]) / 100)}${Math.floor(Number(m[1]) / 100)}` : "";
  }

  function extractCoord(cell) {
    if (!cell) return "";
    const text = (cell.innerText || cell.textContent || "").replace(/\s+/g, " ");
    const paren = text.match(/\((\d{1,3}\|\d{1,3})\)/);
    if (paren) return paren[1];
    const $cell = $(cell);
    const dataCoord = $cell.find("[data-coord]").attr("data-coord");
    if (dataCoord && /^\d{1,3}\|\d{1,3}$/.test(dataCoord)) return dataCoord;
    const href = $cell.find("a[href]").map(function () {
      return this.getAttribute("href") || "";
    }).get().join(" ");
    const fromQuery = href.match(/[?&]x=(\d{1,3}).*[?&]y=(\d{1,3})/);
    if (fromQuery) return fromQuery[1] + "|" + fromQuery[2];
    const fromHash = href.match(/#(\d{1,3})[;|](\d{1,3})/);
    if (fromHash) return fromHash[1] + "|" + fromHash[2];
    const all = text.match(/\d{1,3}\|\d{1,3}/g) || [];
    if (all.length > 1) return all[all.length - 1];
    return all[0] || "";
  }

  function cellText(node) {
    return node ? String(node.innerText || node.textContent || "").trim() : "";
  }

  function parseCount(text) {
    const n = parseInt(String(text || "").replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  }

  function unitAt(map, key) {
    return parseCount(map && map[key]);
  }

  // Mesma fórmula das Metas (goals.js ataqueOf): B + CL*4 + Ar*5
  function offPop(map) {
    return unitAt(map, "axe") + unitAt(map, "light") * 4 + unitAt(map, "ram") * 5;
  }

  function tribeLine() {
    return gameTribe ? `Tribo no jogo: ${gameTribe}` : "";
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function memberIdsFromHtml(html) {
    return $(html).find(".input-nicer option:not(:first)").map(function () {
      return this.value;
    }).get().filter(Boolean);
  }

  function parseTroops(html) {
    const $doc = $("<div>").append($.parseHTML(html));
    const playerName = $doc.find(".input-nicer option:selected").text().trim() || "Jogador";
    const $tables = $doc.find("#ally_content .table-responsive table");
    const $table = $tables.length ? $tables.last() : $doc.find(".table-responsive table").last();
    const rows = $table.find("tr").slice(1);
    const villages = [];
    const units = game_data.units || [];
    for (let i = 0; i < rows.length / 2; i += 1) {
      const home = rows[i * 2];
      const road = rows[i * 2 + 1];
      if (!home || !road) continue;
      const nameCell = home.cells ? home.cells[0] : home.children[0];
      const coord = extractCoord(nameCell);
      if (!coord) continue;
      const unitsInVillage = {};
      units.forEach((unit, j) => {
        unitsInVillage[unit] = (home.children[j + 3] && home.children[j + 3].innerText.trim()) || "0";
      });
      villages.push({
        coord,
        axe: unitAt(unitsInVillage, "axe"),
        light: unitAt(unitsInVillage, "light"),
        ram: unitAt(unitsInVillage, "ram"),
        pop: offPop(unitsInVillage),
      });
    }
    return { playerName, villages };
  }

  function headerBlob(th) {
    const $th = $(th);
    const img = $th.find("img")[0];
    return [
      cellText(th),
      img && img.getAttribute("src"),
      img && img.getAttribute("title"),
      img && img.getAttribute("alt"),
      img && img.getAttribute("data-title"),
    ].filter(Boolean).join(" ");
  }

  function findAcademyCol($table) {
    const headers = $table.find("tr").first().find("th, td");
    let idx = -1;
    headers.each(function (i) {
      const blob = headerBlob(this);
      if (/snob|academia|academy|building\/snob|buildings\/snob/i.test(blob)) {
        idx = i;
        return false;
      }
    });
    return idx;
  }

  function academyLevelFromCell(cell) {
    if (!cell) return 0;
    const $cell = $(cell);
    if ($cell.find(".hidden, .inactive").length && !/\d/.test(cellText(cell))) return 0;
    return parseCount(cellText(cell));
  }

  function parseBuildings(html) {
    const $doc = $("<div>").append($.parseHTML(html));
    const playerName = $doc.find(".input-nicer option:selected").text().trim() || "Jogador";
    const $tables = $doc.find("#ally_content .table-responsive table");
    const $table = $tables.length ? $tables.last() : $doc.find(".table-responsive table, #ally_content table.vis").last();
    const academyByCoord = {};
    if (!$table.length) return { playerName, academyByCoord, hasAcademyCol: false };

    const academyCol = findAcademyCol($table);
    const rows = $table.find("tr").slice(1);
    let hasAcademyCol = academyCol >= 0;

    rows.each(function () {
      const cells = this.cells || this.children;
      if (!cells || !cells.length) return;
      const coord = extractCoord(cells[0]);
      if (!coord) return;
      let level = 0;
      const classCell = $(this).find("td.b_snob, td[data-building='snob'], [class*='b_snob']").first()[0];
      if (classCell) {
        hasAcademyCol = true;
        level = academyLevelFromCell(classCell);
      } else if (academyCol >= 0 && cells[academyCol]) {
        level = academyLevelFromCell(cells[academyCol]);
      }
      academyByCoord[coord] = level;
    });

    return { playerName, academyByCoord, hasAcademyCol };
  }

  function mergePlayer(troops, buildings) {
    const academyByCoord = (buildings && buildings.academyByCoord) || {};
    const villages = (troops.villages || []).map((v) => ({
      ...v,
      academy: Number(academyByCoord[v.coord]) || 0,
      playerName: troops.playerName,
    }));
    return {
      playerName: troops.playerName,
      hasAcademyCol: Boolean(buildings && buildings.hasAcademyCol),
      villages,
    };
  }

  function pickHits(players, minPop) {
    const hits = [];
    for (const p of players || []) {
      for (const v of p.villages || []) {
        if ((Number(v.academy) || 0) < 1) continue;
        if ((Number(v.pop) || 0) <= minPop) continue;
        hits.push(v);
      }
    }
    hits.sort((a, b) => (b.pop || 0) - (a.pop || 0) || String(a.coord).localeCompare(String(b.coord)));
    return hits;
  }

  function formatList(title, minPop, hits) {
    const coords = hits.map((v) => v.coord).join(" ");
    const lines = [
      title,
      "Fonte: Membros → Tropas + Edifícios (academia)",
      tribeLine(),
      "Pop ofensiva = B×1 + CL×4 + Ar×5 (só tropas próprias na aldeia)",
      `Filtro: academia ≥ 1 e pop > ${minPop}`,
      `${hits.length} aldeia${hits.length === 1 ? "" : "s"}`,
      "",
      "Coordenadas:",
      coords || "(nenhuma)",
      "",
      "Detalhe:",
    ].filter((line, i, arr) => line || i === arr.length - 1);

    if (!hits.length) {
      lines.push("Nenhuma aldeia nestes critérios.");
      return lines.join("\n");
    }

    hits.forEach((v, i) => {
      const n = String(i + 1).padStart(2, "0");
      lines.push(
        `${n} - ${v.coord} - (${kOf(v.coord)}) — pop ${v.pop} — B ${v.axe} / CL ${v.light} / Ar ${v.ram} — acad ${v.academy} — ${v.playerName}`
      );
    });
    return lines.join("\n");
  }

  function formatResult(players) {
    const anyAcademy = players.some((p) => p.hasAcademyCol);
    if (!anyAcademy) {
      return [
        "Ofensivas com academia — Nômades",
        tribeLine(),
        "",
        "Não encontrei a coluna Academia na aba Edifícios dos membros.",
        "Confirma permissão de ver Edifícios (e Tropas) dos membros, como no Overwatch.",
      ].filter(Boolean).join("\n");
    }

    const over18 = pickHits(players, MIN_OFF_HEAVY);
    const over9 = pickHits(players, MIN_OFF);
    return [
      formatList(`Lista 1 — academia + ofensiva > ${MIN_OFF_HEAVY}`, MIN_OFF_HEAVY, over18),
      "",
      "==========",
      "",
      formatList(`Lista 2 — academia + ofensiva > ${MIN_OFF}`, MIN_OFF, over9),
    ].join("\n");
  }

  function showPanel() {
    const box = $(`
      <div id="nomadesOfensivasBox" class="vis" style="margin:12px 0;padding:10px">
        <h3>Nômades — Ofensivas com academia</h3>
        <p>Lê Tropas + Edifícios dos membros da tribo em que estás logado. Lista aldeias com academia e pop ofensiva (B + CL×4 + Ar×5) acima de 9000 e de 18000. Corre uma vez na OND 1 e outra na OND 2.</p>
        <p>
          <a href="#" class="btn" id="nomadesBtnOfensivas">Gerar listas</a>
        </p>
        <textarea id="nomadesOfensivasText" rows="20" style="width:98%;font:12px/1.4 monospace"></textarea>
        <p><a href="#" class="btn" id="nomadesOfensivasCopy">Copiar texto</a></p>
      </div>`);
    ($("#contentContainer")[0] ? $("#contentContainer") : $("#mobileHeader")).eq(0).prepend(box);
    $("#nomadesBtnOfensivas").on("click", function (e) {
      e.preventDefault();
      runOfensivas();
    });
    $("#nomadesOfensivasCopy").on("click", function (e) {
      e.preventDefault();
      const el = document.getElementById("nomadesOfensivasText");
      el.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.value);
      } else {
        document.execCommand("copy");
      }
      UI.SuccessMessage("Texto copiado.");
    });
  }

  async function loadPlayers() {
    UI.InfoMessage("A ler tropas e edifícios dos membros…");
    const firstTroops = await $.get("/game.php?screen=ally&mode=members_troops");
    const ids = memberIdsFromHtml(firstTroops);
    if (!ids.length) {
      UI.ErrorMessage("Não encontrei membros. Abre o jogo na tribo, com permissão de ver Tropas e Edifícios dos membros.");
      return null;
    }
    const fromPage = $(firstTroops).find("#content_value h2").first().text().split("(")[0].trim();
    const fromGame = (game_data.player && (game_data.player.ally_tag || game_data.player.ally)) || "";
    gameTribe = [fromGame, fromPage].map((s) => String(s || "").trim()).filter(Boolean).join(" — ") || fromPage;

    const players = [];
    for (let i = 0; i < ids.length; i += 1) {
      UI.InfoMessage("Jogador " + (i + 1) + "/" + ids.length + " (tropas)");
      const troopsHtml = await $.get(
        "/game.php?screen=ally&mode=members_troops&player_id=" + encodeURIComponent(ids[i])
      );
      await wait(PAUSE);
      UI.InfoMessage("Jogador " + (i + 1) + "/" + ids.length + " (edifícios)");
      const buildingsHtml = await $.get(
        "/game.php?screen=ally&mode=members_buildings&player_id=" + encodeURIComponent(ids[i])
      );
      const troops = parseTroops(troopsHtml);
      const buildings = parseBuildings(buildingsHtml);
      players.push(mergePlayer(troops, buildings));
      if (i < ids.length - 1) await wait(PAUSE);
    }
    return players;
  }

  async function withBusy(fn) {
    if (busy) {
      UI.InfoMessage("Ainda estou a ler. Espera um pouco.");
      return;
    }
    busy = true;
    try {
      await fn();
    } catch (err) {
      UI.ErrorMessage("Não consegui ler Tropas/Edifícios dos membros. Confirma permissões na tribo.");
    } finally {
      busy = false;
    }
  }

  async function runOfensivas() {
    await withBusy(async () => {
      const players = await loadPlayers();
      if (!players) return;
      $("#nomadesOfensivasText").val(formatResult(players));
      UI.SuccessMessage("Listas de ofensivas prontas para copiar.");
    });
  }

  showPanel();
})();
