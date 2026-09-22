(function () {
  if (typeof game_data === "undefined" || typeof $ === "undefined") {
    alert("Corre este script dentro do Tribal Wars, na tua conta.");
    return;
  }
  if ($("#nomadesOfensivasBox").length) {
    $("#nomadesOfensivasBox")[0].scrollIntoView();
    return;
  }

  const MIN_OFF = 9000;
  const MIN_OFF_HEAVY = 18000;
  let busy = false;

  function kOf(coord) {
    const m = String(coord || "").match(/^(\d{1,3})\|(\d{1,3})$/);
    return m ? `k${Math.floor(Number(m[2]) / 100)}${Math.floor(Number(m[1]) / 100)}` : "";
  }

  function parseCount(text) {
    const n = parseInt(String(text || "").replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  }

  function offPop(axe, light, ram) {
    return (Number(axe) || 0) + (Number(light) || 0) * 4 + (Number(ram) || 0) * 5;
  }

  function sitterQuery() {
    return game_data.player && Number(game_data.player.sitter) > 0
      ? "&t=" + encodeURIComponent(game_data.player.id)
      : "";
  }

  function param(name) {
    return new URLSearchParams(location.search).get(name) || "";
  }

  function coordOf(text) {
    const all = String(text || "").match(/\d{1,3}\|\d{1,3}/g) || [];
    if (all.length > 1) return all[all.length - 1];
    return all[0] || "";
  }

  function villageRef(row) {
    const vn = row.querySelector && row.querySelector(".quickedit-vn");
    if (vn) {
      return {
        id: String(vn.getAttribute("data-id") || "").replace(/\D/g, ""),
        coord: coordOf(vn.textContent),
      };
    }
    const link = row.querySelector && row.querySelector("a[href*='village=']");
    const href = link ? String(link.getAttribute("href") || "") : "";
    const text = row.innerText || row.textContent || "";
    return {
      id: (href.match(/[?&]village=(\d+)/) || [])[1] || "",
      coord: coordOf(text),
    };
  }

  function headerCol(doc, re) {
    const tables = [...doc.querySelectorAll("#buildings_table, #units_table, table.overview_table, table.vis")];
    for (let t = 0; t < tables.length; t += 1) {
      const headers = [...tables[t].querySelectorAll("thead th, tr:first-child th")];
      for (let i = 0; i < headers.length; i += 1) {
        const img = headers[i].querySelector("img");
        const blob = [
          headers[i].textContent,
          img && img.getAttribute("src"),
          img && img.getAttribute("title"),
          img && img.getAttribute("alt"),
        ].filter(Boolean).join(" ");
        if (re.test(blob)) return { table: tables[t], index: i };
      }
    }
    return null;
  }

  function unitHeadsFromTable(tableHtml) {
    const heads = [];
    const re = /unit_([a-z]+)\.(?:webp|png)/gi;
    let m;
    while ((m = re.exec(String(tableHtml || "")))) {
      if (!heads.includes(m[1])) heads.push(m[1]);
    }
    return heads;
  }

  function parseBuildingsHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const byCoord = {};
    const byId = {};
    const found = headerCol(doc, /snob|academia|academy|buildings\/snob|building\/snob/i);
    const rows = [...doc.querySelectorAll("#buildings_table tr, table.overview_table tr, table.vis tr")];
    let hits = 0;
    for (let i = 0; i < rows.length; i += 1) {
      const ref = villageRef(rows[i]);
      if (!ref.coord && !ref.id) continue;
      const classCell = rows[i].querySelector(".b_snob, td[data-building='snob'], [class*='b_snob']");
      const cell = classCell || (found && rows[i].cells && rows[i].cells[found.index]);
      const level = cell ? parseCount(cell.textContent) : 0;
      if (cell) hits += 1;
      if (ref.coord) byCoord[ref.coord] = level;
      if (ref.id) byId[ref.id] = level;
    }
    return { byCoord, byId, ok: hits > 0 || Boolean(found) };
  }

  function parseUnitsHtml(html) {
    const tableMatch = String(html || "").match(/id=["']units_table["'][\s\S]*?<\/table>/i);
    const block = tableMatch ? tableMatch[0] : String(html || "");
    const heads = unitHeadsFromTable(block);
    if (!heads.length) return { villages: [], ok: false };

    const doc = new DOMParser().parseFromString(
      tableMatch ? `<table>${tableMatch[0]}</table>` : html,
      "text/html"
    );
    const rows = [...doc.querySelectorAll("tr")];
    const villages = [];
    let current = null;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const body = row.innerHTML || "";
      const text = (row.innerText || row.textContent || "").replace(/\s+/g, " ");
      const ref = villageRef(row);
      const label = row.querySelector(".quickedit-label, .quickedit-vn");
      if (label || (ref.coord && /village=/.test(body))) {
        if (ref.coord || ref.id) {
          current = {
            id: ref.id,
            coord: ref.coord,
            axe: 0,
            light: 0,
            ram: 0,
          };
          villages.push(current);
        }
        continue;
      }
      if (!current) continue;
      const isHome = /Na Aldeia|na aldeia|in village|Presentes|presentes/i.test(text + body);
      if (!isHome) continue;

      const nums = [...body.matchAll(/unit-item[^>]*>(\d+)/gi)].map((m) => Number(m[1]));
      if (!nums.length && row.cells) {
        // fallback: células após o rótulo
        const cells = [...row.cells].slice(1);
        cells.forEach((cell, idx) => {
          const u = heads[idx];
          if (!u) return;
          const n = parseCount(cell.textContent);
          if (u === "axe") current.axe = n;
          if (u === "light") current.light = n;
          if (u === "ram") current.ram = n;
        });
      } else {
        heads.forEach((u, idx) => {
          const n = nums[idx] || 0;
          if (u === "axe") current.axe = n;
          if (u === "light") current.light = n;
          if (u === "ram") current.ram = n;
        });
      }
    }

    return { villages, ok: villages.length > 0 };
  }

  function mergeOwn(buildings, units) {
    return (units.villages || []).map((v) => {
      const academy = (v.coord && buildings.byCoord[v.coord] != null)
        ? buildings.byCoord[v.coord]
        : (v.id && buildings.byId[v.id] != null ? buildings.byId[v.id] : 0);
      const pop = offPop(v.axe, v.light, v.ram);
      return {
        coord: v.coord,
        id: v.id,
        axe: v.axe,
        light: v.light,
        ram: v.ram,
        pop,
        academy: Number(academy) || 0,
      };
    }).filter((v) => v.coord);
  }

  function pickHits(villages, minPop) {
    return (villages || [])
      .filter((v) => (Number(v.academy) || 0) >= 1 && (Number(v.pop) || 0) > minPop)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0) || String(a.coord).localeCompare(String(b.coord)));
  }

  function formatList(title, minPop, hits) {
    const coords = hits.map((v) => v.coord).join(" ");
    const lines = [
      title,
      "Fonte: tuas aldeias — Visão geral → Tropas + Edifícios",
      "Pop ofensiva = B×1 + CL×4 + Ar×5 (tropas na aldeia)",
      `Filtro: academia ≥ 1 e pop > ${minPop}`,
      `${hits.length} aldeia${hits.length === 1 ? "" : "s"}`,
      "",
      "Coordenadas:",
      coords || "(nenhuma)",
      "",
      "Detalhe:",
    ];
    if (!hits.length) {
      lines.push("Nenhuma aldeia nestes critérios.");
      return lines.join("\n");
    }
    hits.forEach((v, i) => {
      const n = String(i + 1).padStart(2, "0");
      lines.push(
        `${n} - ${v.coord} - (${kOf(v.coord)}) — pop ${v.pop} — B ${v.axe} / CL ${v.light} / Ar ${v.ram} — acad ${v.academy}`
      );
    });
    return lines.join("\n");
  }

  function formatResult(buildings, units, villages) {
    if (!units.ok) {
      return [
        "Ofensivas com academia — tuas aldeias",
        "",
        "Não consegui ler a tabela de tropas (Visão geral → Tropas).",
        "Abre o jogo na tua conta e tenta de novo.",
      ].join("\n");
    }
    if (!buildings.ok) {
      return [
        "Ofensivas com academia — tuas aldeias",
        "",
        "Não consegui ler a coluna Academia (Visão geral → Edifícios).",
        "Abre o jogo na tua conta e tenta de novo.",
      ].join("\n");
    }
    const over18 = pickHits(villages, MIN_OFF_HEAVY);
    const over9 = pickHits(villages, MIN_OFF);
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
        <h3>Ofensivas com academia — tuas aldeias</h3>
        <p>Lê só as <b>tuas</b> aldeias (Visão geral → Tropas e Edifícios). Lista quem tem academia e pop ofensiva (B + CL×4 + Ar×5) acima de 9000 e de 18000.</p>
        <p><a href="#" class="btn" id="nomadesBtnOfensivas">Gerar listas</a></p>
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

  async function loadOwn() {
    const sit = sitterQuery();
    UI.InfoMessage("A ler tuas tropas…");
    let unitsHtml = await $.get("/game.php?screen=overview_villages&mode=units&type=own&page=-1" + sit);
    let units = parseUnitsHtml(unitsHtml);
    if (!units.ok) {
      unitsHtml = await $.get("/game.php?screen=overview_villages&mode=units&type=there&page=-1" + sit);
      units = parseUnitsHtml(unitsHtml);
    }
    if (!units.ok) {
      unitsHtml = await $.get("/game.php?screen=overview_villages&mode=units&page=-1" + sit);
      units = parseUnitsHtml(unitsHtml);
    }

    UI.InfoMessage("A ler teus edifícios…");
    const buildingsHtml = await $.get("/game.php?screen=overview_villages&mode=buildings&page=-1" + sit);
    const buildings = parseBuildingsHtml(buildingsHtml);
    const villages = mergeOwn(buildings, units);
    return { buildings, units, villages };
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
      UI.ErrorMessage("Não consegui ler tuas aldeias. Confirma que estás logado no jogo.");
    } finally {
      busy = false;
    }
  }

  async function runOfensivas() {
    await withBusy(async () => {
      const { buildings, units, villages } = await loadOwn();
      $("#nomadesOfensivasText").val(formatResult(buildings, units, villages));
      UI.SuccessMessage("Listas prontas para copiar.");
    });
  }

  showPanel();
})();
