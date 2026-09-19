// ==UserScript==
// @name         Overwatch Tropas — censo em texto
// @namespace    tw-toolkit
// @version      1.0.0
// @description  Exporta, por jogador e aldeia, tropas em casa e a caminho (página oficial Defesa dos membros).
// @author       TW Toolkit
// @match        *://*.tribalwars.com.br/game.php*
// @match        *://*.tribalwars.net/game.php*
// @match        *://*.tribalwars.com/game.php*
// @match        *://*.tribos.com.pt/game.php*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

/**
 * Censo de tropas da tribo (mesma fonte do Overwatch).
 * Quickbar: javascript:$.getScript("https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/overwatch-tropas.js");
 */

(function () {
  if (typeof game_data === "undefined" || typeof $ === "undefined") {
    alert("Corre este script dentro do Tribal Wars, na conta da tribo.");
    return;
  }

  const PAUSE = 250;
  const units = game_data.units || [];
  const unitNames = {
    spear: "L",
    sword: "E",
    axe: "B",
    archer: "A",
    spy: "X",
    light: "CL",
    marcher: "CA",
    heavy: "CP",
    ram: "Ar",
    catapult: "Cat",
    knight: "Pal",
    snob: "Nob",
    militia: "Mil",
  };

  function kOf(coord) {
    const m = String(coord || "").match(/^(\d{1,3})\|(\d{1,3})$/);
    return m ? `k${Math.floor(Number(m[2]) / 100)}${Math.floor(Number(m[1]) / 100)}` : "";
  }

  function listNum(i) {
    return String(i).padStart(2, "0");
  }

  function slash(map) {
    return units.map((u) => {
      const n = parseInt(map[u], 10);
      return Number.isFinite(n) ? n : 0;
    }).join("/");
  }

  function parseDefense(html) {
    const $doc = $(html);
    const playerName = $doc.find(".input-nicer option:selected").text().trim() || "Jogador";
    const rows = $doc.find(".table-responsive table tr:not(:first)");
    const villages = [];
    for (let i = 0; i < rows.length / 2; i += 1) {
      const home = rows[i * 2];
      const road = rows[i * 2 + 1];
      if (!home || !road || !home.children || !home.children[0]) continue;
      const coordMatch = home.children[0].innerText.match(/\d+\|\d+/);
      if (!coordMatch) continue;
      const unitsInVillage = {};
      const unitsEnroute = {};
      units.forEach((unit, j) => {
        unitsInVillage[unit] = (home.children[j + 3] && home.children[j + 3].innerText.trim()) || "0";
        const raw = (road.children[j + 1] && road.children[j + 1].innerText.trim()) || "0";
        unitsEnroute[unit] = raw === "?" ? "0" : raw;
      });
      villages.push({ coord: coordMatch[0], unitsInVillage, unitsEnroute });
    }
    return { playerName, villages };
  }

  function formatAll(players) {
    const header = [
      "Tropas da tribo — Overwatch / defesa dos membros",
      "Ordem: " + units.map((u) => unitNames[u] || u).join("/"),
      "",
    ];
    const blocks = players.map((p) => {
      const lines = [p.playerName, ""];
      p.villages.forEach((v, i) => {
        lines.push(`${listNum(i + 1)} - ${v.coord} - (${kOf(v.coord)})`);
        lines.push(`Em casa: ${slash(v.unitsInVillage)}`);
        lines.push(`A caminho: ${slash(v.unitsEnroute)}`);
        lines.push("");
      });
      return lines.join("\n").replace(/\n+$/, "");
    });
    return header.concat(blocks).join("\n\n");
  }

  function showBox(text) {
    $("#nomadesTropasBox").remove();
    const box = $(`
      <div id="nomadesTropasBox" class="vis" style="margin:12px 0;padding:10px">
        <h3>Cópia — tropas em casa e a caminho</h3>
        <p>Mesma fonte do Overwatch (Defesa dos membros). Copia e cola.</p>
        <textarea id="nomadesTropasText" rows="18" style="width:98%;font:12px/1.4 monospace"></textarea>
        <p><a href="#" class="btn" id="nomadesTropasCopy">Copiar texto</a></p>
      </div>`);
    ($("#contentContainer")[0] ? $("#contentContainer") : $("#mobileHeader")).eq(0).prepend(box);
    $("#nomadesTropasText").val(text);
    $("#nomadesTropasCopy").on("click", function (e) {
      e.preventDefault();
      const el = document.getElementById("nomadesTropasText");
      el.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.value);
      } else {
        document.execCommand("copy");
      }
      UI.SuccessMessage("Texto copiado.");
    });
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function run() {
    UI.InfoMessage("A ler a defesa dos membros…");
    const first = await $.get("/game.php?screen=ally&mode=members_defense");
    const ids = $(first).find(".input-nicer option:not(:first)").map(function () {
      return this.value;
    }).get().filter(Boolean);
    if (!ids.length) {
      UI.ErrorMessage("Não encontrei membros. Abre o jogo na tribo, com permissão de ver a Defesa dos membros (a mesma do Overwatch).");
      return;
    }
    const players = [];
    for (let i = 0; i < ids.length; i += 1) {
      UI.InfoMessage("Jogador " + (i + 1) + "/" + ids.length);
      const html = await $.get("/game.php?screen=ally&mode=members_defense&player_id=" + encodeURIComponent(ids[i]));
      players.push(parseDefense(html));
      if (i < ids.length - 1) await wait(PAUSE);
    }
    showBox(formatAll(players));
    UI.SuccessMessage("Lista pronta para copiar.");
  }

  run().catch(function () {
    UI.ErrorMessage("Não consegui ler a defesa dos membros. Confirma que estás na tribo e que o Overwatch também abre.");
  });
})();
