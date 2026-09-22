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
  const units = game_data.units || [];
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

  // Bárbaros=1, Cavalaria leve=4, Ariete=5
  function offPop(map) {
    return unitAt(map, "axe") + unitAt(map, "light") * 4 + unitAt(map, "ram") * 5;
  }

  function tribeLine() {
    return gameTribe ? `Tribo no jogo: ${gameTribe}` : "";
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function cleanPlayerName(name) {
    return String(name || "")
      .replace(/\s*\((?:sem permiss[aã]o|no permission|keine berechtigung)\)\s*/i, "")
      .trim() || "Jogador";
  }

  function memberOptionsFromHtml(html) {
    return $(html).find(".input-nicer option:not(:first)").map(function () {
      return { id: this.value, name: cleanPlayerName($(this).text()) };
    }).get().filter((m) => m.id);
  }

  function parseTroops(html) {
    const $doc = $("<div>").append($.parseHTML(html));
    const playerName = cleanPlayerName($doc.find(".input-nicer option:selected").text());
    const $tables = $doc.find("#ally_content .table-responsive table");
    const $table = $tables.length ? $tables.last() : $doc.find(".table-responsive table").last();
    const rows = $table.find("tr").slice(1);
    const villages = [];
    // Aba Membros → Tropas: pares "na aldeia" / "a caminho" (igual ao Overwatch)
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
    const img = $(th).find("img")[0];
    return [
      cellText(th),
      img && img.getAttribute("src"),
      img && img.getAttribute("title"),
      img && img.getAttribute("alt"),
    ].filter(Boolean).join(" ");
  }

  function findAcademyCol($table) {
    let idx = -1;
    $table.find("tr").first().find("th, td").each(function (i) {
      if (/snob|academia|academy|building\/snob|buildings\/snob/i.test(headerBlob(this))) {
        idx = i;
        return false;
      }
    });
    return idx;
  }

  function parseBuildings(html) {
    const $doc = $("<div>").append($.parseHTML(html));
    const playerName = cleanPlayerName($doc.find(".input-nicer option:selected").text());
    const $tables = $doc.find("#ally_content .table-responsive table");
    const $table = $tables.length ? $tables.last() : $doc.find(".table-responsive table, #ally_content table.vis").last();
    const academyByCoord = {};
    let hasAcademyCol = false;
    if (!$table.length) return { playerName, academyByCoord, hasAcademyCol };

    const academyCol = findAcademyCol($table);
    if (academyCol >= 0) hasAcademyCol = true;

    $table.find("tr").slice(1).each(function () {
      const cells = this.cells || this.children;
      if (!cells || !cells.length) return;
      const coord = extractCoord(cells[0]);
      if (!coord) return;
      const classCell = $(this).find("td.b_snob, td[data-building='snob'], [class*='b_snob']").first()[0];
      let level = 0;
      if (classCell) {
        hasAcademyCol = true;
        level = parseCount(cellText(classCell));
      } else if (academyCol >= 0 && cells[academyCol]) {
        level = parseCount(cellText(cells[academyCol]));
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
    }));
    return {
      playerName: troops.playerName || (buildings && buildings.playerName) || "Jogador",
      hasAcademyCol: Boolean(buildings && buildings.hasAcademyCol),
      villages,
    };
  }

  function hitsForPlayer(player, minPop) {
    return (player.villages || [])
      .filter((v) => (Number(v.academy) || 0) >= 1 && (Number(v.pop) || 0) > minPop)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0) || String(a.coord).localeCompare(String(b.coord)));
  }

  function formatList(title, minPop, players) {
    const blocks = [];
    let total = 0;
    const allCoords = [];

    (players || []).forEach((p) => {
      const hits = hitsForPlayer(p, minPop);
      if (!hits.length) return;
      total += hits.length;
      const coords = hits.map((v) => v.coord);
      allCoords.push(...coords);
      const lines = [
        p.playerName,
        `Coordenadas: ${coords.join(" ")}`,
        "",
      ];
      hits.forEach((v, i) => {
        const n = String(i + 1).padStart(2, "0");
        lines.push(
          `${n} - ${v.coord} - (${kOf(v.coord)}) — pop ${v.pop} — B ${v.axe} / CL ${v.light} / Ar ${v.ram} — acad ${v.academy}`
        );
      });
      blocks.push(lines.join("\n").replace(/\n+$/, ""));
    });

    const header = [
      title,
      "Fonte: Tribo → Membros → Tropas + Edifícios (aba individual de cada jogador)",
      tribeLine(),
      "Pop ofensiva = B×1 + CL×4 + Ar×5",
      `Filtro: academia ≥ 1 e pop > ${minPop}`,
      `${total} aldeia${total === 1 ? "" : "s"} · ${blocks.length} jogador${blocks.length === 1 ? "" : "es"}`,
      "",
      "Todas as coordenadas:",
      allCoords.join(" ") || "(nenhuma)",
      "",
    ].filter((line, i, arr) => line || i === arr.length - 1);

    if (!blocks.length) {
      return header.concat(["Nenhuma aldeia nestes critérios."]).join("\n");
    }
    return header.concat(blocks).join("\n\n");
  }

  function formatResult(players) {
    const anyAcademy = players.some((p) => p.hasAcademyCol);
    if (!anyAcademy) {
      return [
        "Ofensivas com academia — tribo",
        tribeLine(),
        "",
        "Não encontrei a coluna Academia em Membros → Edifícios.",
        "Precisas de permissão de ver Tropas e Edifícios dos membros (aristocrata / diplomata).",
      ].filter(Boolean).join("\n");
    }
    return [
      formatList(`Lista 1 — academia + ofensiva > ${MIN_OFF_HEAVY}`, MIN_OFF_HEAVY, players),
      "",
      "==========",
      "",
      formatList(`Lista 2 — academia + ofensiva > ${MIN_OFF}`, MIN_OFF, players),
    ].join("\n");
  }

  function showPanel() {
    const box = $(`
      <div id="nomadesOfensivasBox" class="vis" style="margin:12px 0;padding:10px">
        <h3>Nômades — Ofensivas com academia (tribo)</h3>
        <p>Entra em <b>Membros → Tropas</b> e <b>Membros → Edifícios</b>, abre a aba de cada jogador, e lista aldeias com academia e pop ofensiva (B + CL×4 + Ar×5) acima de 9000 e de 18000. Coordenadas separadas por jogador. Corre uma vez na OND 1 e outra na OND 2.</p>
        <p><a href="#" class="btn" id="nomadesBtnOfensivas">Gerar listas</a></p>
        <textarea id="nomadesOfensivasText" rows="22" style="width:98%;font:12px/1.4 monospace"></textarea>
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
    UI.InfoMessage("A abrir Membros → Tropas…");
    const first = await $.get("/game.php?screen=ally&mode=members_troops");
    const members = memberOptionsFromHtml(first);
    if (!members.length) {
      UI.ErrorMessage("Não encontrei membros. Abre a tribo com permissão de ver Tropas e Edifícios dos membros.");
      return null;
    }
    const fromPage = $(first).find("#content_value h2").first().text().split("(")[0].trim();
    const fromGame = (game_data.player && (game_data.player.ally_tag || game_data.player.ally)) || "";
    gameTribe = [fromGame, fromPage].map((s) => String(s || "").trim()).filter(Boolean).join(" — ") || fromPage;

    const players = [];
    for (let i = 0; i < members.length; i += 1) {
      const m = members[i];
      UI.InfoMessage(`${m.name || "Jogador"} — tropas (${i + 1}/${members.length})`);
      const troopsHtml = await $.get(
        "/game.php?screen=ally&mode=members_troops&player_id=" + encodeURIComponent(m.id)
      );
      await wait(PAUSE);
      UI.InfoMessage(`${m.name || "Jogador"} — edifícios (${i + 1}/${members.length})`);
      const buildingsHtml = await $.get(
        "/game.php?screen=ally&mode=members_buildings&player_id=" + encodeURIComponent(m.id)
      );
      const troops = parseTroops(troopsHtml);
      if (!troops.playerName || troops.playerName === "Jogador") troops.playerName = m.name;
      const buildings = parseBuildings(buildingsHtml);
      players.push(mergePlayer(troops, buildings));
      if (i < members.length - 1) await wait(PAUSE);
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
