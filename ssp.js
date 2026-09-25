// ==UserScript==
// @name         Tribal Wars — SSP (Single Screen Planner & Precision Snipe)
// @version      3.2
// @description  Planejador de ataques e snipes em tela única com cronômetro de precisão e disparo automático
// @author       Azuelos
// @match        https://*.tribalwars.com.br/game.php*
// @grant        none
// ==/UserScript==

/**
 * Single Screen Planner (SSP) — Planejador de Ataques e Snipes com Cronômetro e Disparo de Precisão
 * Tribal Wars BR / Internacional
 *
 * Repositório: https://github.com/Azuelos/tw-toolkit
 * Versão: 3.2 (Envio Direto para Confirmação + Cronômetro HUD + Disparo Automático)
 */

var isMobile = (typeof mobile !== 'undefined' && Boolean(mobile)) || (typeof game_data !== 'undefined' && game_data.device === 'mobile');
var mobile = isMobile;

var carregando = true;
var gruposCarregados = false;
var sort_of_low = true;
var img_tropas = (typeof image_base !== 'undefined' ? image_base : '') + "unit/";
var minimo_numero_tropas = [];
var tempoSaida = [];
var tempoUltrapassado = [];
var id = [];
var tropas = [];
var minhasAldeias = [];
var nomesAldeias = [];
var mostrarAldeias = [];
var tabelaBB = [];
var imagens = "spear,sword,axe,archer,spy,light,marcher,heavy,ram,catapult,knight,snob".split(',');
var unidadesAtivas = [];
var info = {};
var todasTropas = "";
var snipeInterval = null;
var audioHabilitado = true;

// -------------------------------------------------------------
// BEEP DE ÁUDIO VIA WEB AUDIO API (Zero dependências externas)
// -------------------------------------------------------------
function tocarBeep(frequencia, duracao) {
  if (!audioHabilitado) return;
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    var ctx = new AudioCtx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequencia || 800;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ((duracao || 80) / 1000));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(function() {
      try {
        osc.stop();
        ctx.close();
      } catch (e) {}
    }, (duracao || 80) + 20);
  } catch (e) {}
}

// -------------------------------------------------------------
// SALVAR COMANDO DO SSP PARA A TELA DE CONFIRMAÇÃO
// -------------------------------------------------------------
function salvarComandoSSP(villageId, targetCoord, launchTimestamp, paramsUrl) {
  var dados = {
    villageId: villageId,
    targetCoord: targetCoord,
    launchTimestamp: launchTimestamp,
    paramsUrl: paramsUrl,
    savedAt: Date.now()
  };
  try {
    sessionStorage.setItem("ssp_pending_cmd", JSON.stringify(dados));
    localStorage.setItem("ssp_last_cmd", JSON.stringify(dados));
  } catch (e) {}
}

// -------------------------------------------------------------
// ENVIO DIRETO PARA A TELA DE CONFIRMAÇÃO (1 CLIQUE)
// -------------------------------------------------------------
function enviarDiretoConfirmacao(villageId, targetCoord, launchTimestamp, paramsUrl) {
  var tipoComando = ($("#tipoComandoSSP").val()) || "support";
  var tipoNome = (tipoComando === "attack") ? "ataque" : "apoio";

  if (typeof UI !== 'undefined' && UI.InfoMessage) {
    UI.InfoMessage("Preparando " + tipoNome + " e abrindo tela de confirmação...", 2000, "info");
  }

  // 1. Salva o comando no sessionStorage e localStorage
  salvarComandoSSP(villageId, targetCoord, launchTimestamp, paramsUrl);

  // 2. Busca a Praça de Reunião da aldeia de origem em segundo plano
  var placeUrl = "/game.php?village=" + villageId + "&screen=place";

  var xhr = new XMLHttpRequest();
  xhr.open("GET", placeUrl, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xhr.responseText, "text/html");

        var formOrig = doc.querySelector("#command-data-form") || doc.querySelector("form[action*='try=confirm']");
        if (!formOrig) {
          // Fallback caso a aldeia não tenha praça ou formato seja diferente
          window.location.href = placeUrl + "&x=" + targetCoord.split('|')[0] + "&y=" + targetCoord.split('|')[1] + paramsUrl;
          return;
        }

        var actionUrl = formOrig.getAttribute("action") || (placeUrl + "&try=confirm");
        if (actionUrl.indexOf("/") !== 0 && actionUrl.indexOf("http") !== 0) {
          actionUrl = "/" + actionUrl;
        }
        actionUrl = actionUrl.replace(/&amp;/g, '&');

        // Cria os parâmetros em formato URL-encoded idêntico ao formulário nativo do TW
        var postParams = new URLSearchParams();

        // Copia todos os inputs hidden originais (ch, csrf tokens, etc.)
        $(formOrig).find("input[type='hidden']").each(function() {
          var hName = $(this).attr("name");
          var hVal = $(this).val();
          if (hName && hName !== "x" && hName !== "y" && hName !== "target_type" && hName !== "attack" && hName !== "support") {
            postParams.append(hName, hVal);
          }
        });

        postParams.append("target_type", "coord");
        var parts = targetCoord.split('|');
        postParams.append("x", parts[0]);
        postParams.append("y", parts[1]);

        // Preenche as tropas a partir de paramsUrl
        var pairs = decodeURIComponent(paramsUrl).split('&');
        var troopsMap = {};
        pairs.forEach(function(pair) {
          if (pair.indexOf("att_") === 0) {
            var unitData = pair.replace("att_", "").split('=');
            if (unitData.length === 2 && Number(unitData[1]) > 0) {
              troopsMap[unitData[0]] = unitData[1];
              postParams.append(unitData[0], unitData[1]);
            }
          }
        });

        // Garante que todas as unidades do jogo presentes no formulário original sejam declaradas
        $(formOrig).find("input.unitsInput, input[name='spear'], input[name='sword'], input[name='axe'], input[name='archer'], input[name='spy'], input[name='light'], input[name='marcher'], input[name='heavy'], input[name='ram'], input[name='catapult'], input[name='knight'], input[name='snob']").each(function() {
          var uName = $(this).attr("name");
          if (uName && !postParams.has(uName)) {
            postParams.append(uName, "");
          }
        });

        // Adiciona a ação "Apoiar" ou "Atacar"
        if (tipoComando === "attack") {
          postParams.append("attack", "Atacar");
        } else {
          postParams.append("support", "Apoiar");
        }

        // Tenta envio via AJAX para transição instantânea sem descarregar a página
        var postXhr = new XMLHttpRequest();
        postXhr.open("POST", actionUrl, true);
        postXhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        postXhr.onreadystatechange = function() {
          if (postXhr.readyState === 4) {
            if (postXhr.status === 200 && postXhr.responseText.indexOf("troop_confirm_submit") !== -1) {
              // Transição instantânea com sucesso!
              var confirmDoc = parser.parseFromString(postXhr.responseText, "text/html");
              var newContent = confirmDoc.querySelector("#content_value");

              if (newContent) {
                try {
                  history.pushState(null, "", actionUrl);
                } catch (e) {}

                // Remove o planejador SSP
                $("#planer_klinow").remove();

                // Atualiza o conteúdo central com a tela de confirmação oficial do Tribal Wars
                var mainContent = document.getElementById("content_value");
                if (mainContent) {
                  mainContent.innerHTML = newContent.innerHTML;
                } else {
                  $("#contentContainer").html(newContent.innerHTML);
                }

                // Renderiza o HUD de precisão imediatamente com o alvo já setado!
                desenharSnipeHUD(launchTimestamp);

                if (typeof UI !== 'undefined' && UI.InfoMessage) {
                  UI.InfoMessage("Tela de confirmação pronta! Cronômetro ativo.", 2000, "success");
                }
                return;
              }
            }

            // Se o AJAX retornou erro específico do TW, exibe para o jogador
            if (postXhr.status === 200 && postXhr.responseText.indexOf("error_box") !== -1) {
              var errDoc = parser.parseFromString(postXhr.responseText, "text/html");
              var errBox = errDoc.querySelector(".error_box");
              if (errBox) {
                var msg = $(errBox).text().trim();
                if (typeof UI !== 'undefined' && UI.InfoMessage) {
                  UI.InfoMessage("Erro do servidor: " + msg, 4000, "error");
                }
                return;
              }
            }

            // Fallback: se o AJAX não retornou o botão troop_confirm_submit, submete nativamente pelo navegador
            submeterFormularioNativo(actionUrl, formOrig, targetCoord, paramsUrl, tipoComando);
          }
        };
        postXhr.send(postParams.toString());

      } else {
        window.location.href = placeUrl + "&x=" + targetCoord.split('|')[0] + "&y=" + targetCoord.split('|')[1] + paramsUrl;
      }
    }
  };
  xhr.send(null);
}

function submeterFormularioNativo(actionUrl, formOrig, targetCoord, paramsUrl, tipoComando) {
  var form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";

  function addInput(name, val) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = val;
    form.appendChild(input);
  }

  $(formOrig).find("input[type='hidden']").each(function() {
    var hName = $(this).attr("name");
    var hVal = $(this).val();
    if (hName && hName !== "x" && hName !== "y" && hName !== "target_type" && hName !== "attack" && hName !== "support") {
      addInput(hName, hVal);
    }
  });

  addInput("target_type", "coord");
  var parts = targetCoord.split('|');
  addInput("x", parts[0]);
  addInput("y", parts[1]);

  var pairs = decodeURIComponent(paramsUrl).split('&');
  var troopsAdded = {};
  pairs.forEach(function(pair) {
    if (pair.indexOf("att_") === 0) {
      var unitData = pair.replace("att_", "").split('=');
      if (unitData.length === 2 && Number(unitData[1]) > 0) {
        troopsAdded[unitData[0]] = true;
        addInput(unitData[0], unitData[1]);
      }
    }
  });

  $(formOrig).find("input.unitsInput, input[name='spear'], input[name='sword'], input[name='axe'], input[name='archer'], input[name='spy'], input[name='light'], input[name='marcher'], input[name='heavy'], input[name='ram'], input[name='catapult'], input[name='knight'], input[name='snob']").each(function() {
    var uName = $(this).attr("name");
    if (uName && !troopsAdded[uName]) {
      addInput(uName, "");
    }
  });

  if (tipoComando === "attack") {
    addInput("attack", "Atacar");
  } else {
    addInput("support", "Apoiar");
  }

  document.body.appendChild(form);
  form.submit();
}

// -------------------------------------------------------------
// ASSISTENTE DE CONFIRMAÇÃO (SNIPE HUD + DISPARO AUTOMÁTICO)
// -------------------------------------------------------------
function obterTempoServidorMs() {
  if (typeof Timing !== 'undefined' && Timing.getCurrentServerTime) {
    return Timing.getCurrentServerTime();
  }
  var t = $("#serverTime").html() ? $("#serverTime").html().match(/\d+/g) : null;
  var d = $("#serverDate").html() ? $("#serverDate").html().match(/\d+/g) : null;
  if (t && d && t.length >= 3 && d.length >= 3) {
    return new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]).getTime();
  }
  return Date.now();
}

function formatarHoraCompletaMs(timestamp) {
  var d = new Date(timestamp);
  var h = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
  var m = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
  var s = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();
  var ms = d.getMilliseconds();
  if (ms < 10) ms = '00' + ms;
  else if (ms < 100) ms = '0' + ms;
  return h + ':' + m + ':' + s + '.' + ms;
}

function desenharSnipeHUD(targetTimestamp) {
  if ($("#ssp_snipe_hud").length) {
    $("#ssp_snipe_hud").remove();
    if (snipeInterval) clearInterval(snipeInterval);
    return;
  }

  var btnSubmit = $("#troop_confirm_submit");
  if (!btnSubmit.length) {
    btnSubmit = $('input[type="submit"].btn-attack, input[type="submit"].btn, #command-data-form input[type="submit"]');
  }

  // Foco no botão de envio
  if (btnSubmit.length) {
    btnSubmit.focus();
  }

  var hudHtml = "" +
    "<div id='ssp_snipe_hud' style='margin: 15px auto; max-width: 650px; background: #222a1f; color: #fff; border: 3px solid #7d510f; border-radius: 8px; padding: 12px 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); font-family: Verdana, sans-serif; text-align: center; transition: border-color 0.3s;'>" +
    "  <div style='display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px; margin-bottom: 10px;'>" +
    "    <span style='font-size: 13px; font-weight: bold; color: #ffcc00;'>🎯 SSP — Cronômetro de Precisão (Snipe / Apoio)</span>" +
    "    <div>" +
    "      <button id='ssp_toggle_audio' type='button' style='font-size: 11px; background: #3c4a2c; color: #fff; border: 1px solid #7d510f; padding: 2px 8px; border-radius: 4px; cursor: pointer; margin-right: 6px;'>🔊 Áudio: ON</button>" +
    "      <button id='ssp_close_hud' type='button' style='font-size: 11px; background: #661111; color: #fff; border: 1px solid #990000; padding: 2px 6px; border-radius: 4px; cursor: pointer;'>✖</button>" +
    "    </div>" +
    "  </div>" +
    "  <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; font-size: 12px;'>" +
    "    <div style='background: rgba(0,0,0,0.3); padding: 8px; border-radius: 5px;'>" +
    "      <span style='color: #aaa;'>Hora Oficial do Servidor:</span><br>" +
    "      <strong id='ssp_server_clock' style='font-size: 15px; color: #55ff55;'>--:--:--.---</strong>" +
    "    </div>" +
    "    <div style='background: rgba(0,0,0,0.3); padding: 8px; border-radius: 5px;'>" +
    "      <span style='color: #aaa;'>Hora de Disparo Alvo:</span><br>" +
    "      <strong id='ssp_target_clock' style='font-size: 15px; color: #ffdd44;'>--:--:--.---</strong>" +
    "    </div>" +
    "  </div>" +
    "  <div style='background: #111; border: 2px solid #444; border-radius: 6px; padding: 12px; margin-bottom: 10px;'>" +
    "    <div style='font-size: 12px; color: #ccc; margin-bottom: 4px;'>CONTAGEM REGRESSIVA PARA O CLIQUE:</div>" +
    "    <div id='ssp_countdown_display' style='font-size: 34px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #ffffff;'>00:00.000</div>" +
    "    <div id='ssp_status_badge' style='margin-top: 6px; font-size: 13px; font-weight: bold; padding: 4px 10px; border-radius: 4px; display: inline-block; background: #333; color: #aaa;'>Aguardando momento ideal...</div>" +
    "  </div>" +
    "  <div style='background: rgba(255,255,255,0.06); padding: 8px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 12px; display: flex; justify-content: center; align-items: center; gap: 15px; flex-wrap: wrap;'>" +
    "    <label style='display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: bold; color: #ffaa33;'>" +
    "      <input type='checkbox' id='ssp_auto_fire' style='width: 16px; height: 16px; cursor: pointer;'> ⚡ Ativar Disparo Automático" +
    "    </label>" +
    "    <span style='color: #888;'>|</span>" +
    "    <label style='display: flex; align-items: center; gap: 4px; color: #ccc;'>" +
    "      Compensação/Ping: <input type='number' id='ssp_offset_ms' value='0' step='5' style='width: 55px; text-align: center; background: #222; color: #fff; border: 1px solid #666; border-radius: 3px; padding: 2px;'> ms" +
    "    </label>" +
    "  </div>" +
    "  <div style='font-size: 11px; color: #bbb; line-height: 1.4;'>" +
    "    💡 <strong>Dica de Tolerância (±75ms):</strong> Nos últimos 3s soam bips sonoros. Quando o cronômetro zerar e a barra ficar <span style='color:#00ff00; font-weight:bold;'>VERDE</span>, aperte o botão de envio!<br>" +
    "    ⚡ <strong>Modo Automático:</strong> Marque a caixa de disparo automático para envio no ms exato. Mantenha a aba aberta e visível.<br>" +
    "    <span style='color: #88cc88;'>O clique humano é 100% seguro contra detecção e mantém a sua conta protegida.</span>" +
    "  </div>" +
    "</div>";

  if (btnSubmit.length) {
    btnSubmit.closest("form").before(hudHtml);
  } else {
    $("#content_value").prepend(hudHtml);
  }

  $("#ssp_close_hud").on("click", function() {
    $("#ssp_snipe_hud").remove();
    if (snipeInterval) clearInterval(snipeInterval);
  });

  $("#ssp_toggle_audio").on("click", function() {
    audioHabilitado = !audioHabilitado;
    $(this).text(audioHabilitado ? "🔊 Áudio: ON" : "🔇 Áudio: OFF");
  });

  var autoFireArmed = false;
  var disparado = false;
  var rafId = null;

  $("#ssp_auto_fire").on("change", function() {
    autoFireArmed = $(this).is(":checked");
    if (autoFireArmed) {
      $("#ssp_snipe_hud").css("border-color", "#ffaa00");
      $("#ssp_status_badge").css({ background: "#aa5500", color: "#ffffff" }).text("⚡ DISPARO AUTOMÁTICO ARMADO");
    } else {
      $("#ssp_snipe_hud").css("border-color", "#7d510f");
      $("#ssp_status_badge").css({ background: "#333333", color: "#aaaaaa" }).text("Modo Manual Selecionado");
    }
  });

  var targetMs = targetTimestamp || Date.now() + 60000;
  $("#ssp_target_clock").text(formatarHoraCompletaMs(targetMs));

  var lastBeepSec = -1;

  function dispararComando() {
    if (disparado) return;
    disparado = true;
    if (snipeInterval) clearInterval(snipeInterval);
    if (rafId) cancelAnimationFrame(rafId);

    tocarBeep(1200, 160);
    $("#ssp_countdown_display").css("color", "#00ff00").text("00:00.000");
    $("#ssp_status_badge").css({ background: "#00aa00", color: "#ffffff" }).text("🚀 DISPARO ENVIADO NO MILISSEGUNDO EXATO!");

    if (btnSubmit.length) {
      btnSubmit.css({ "box-shadow": "0 0 25px #00ff00", "outline": "4px solid #00ff00" });
      try {
        btnSubmit[0].click();
      } catch (e) {
        btnSubmit.trigger("click");
      }
    }
  }

  // Loop de micro-precisão acionado nos últimos 1500ms
  function microLoopPrecision() {
    if (disparado) return;
    var nowMs = obterTempoServidorMs();
    var offsetMs = Number($("#ssp_offset_ms").val()) || 0;
    var triggerAt = targetMs - offsetMs;
    var remaining = triggerAt - nowMs;

    if (autoFireArmed) {
      if (remaining <= 0) {
        dispararComando();
        return;
      } else if (remaining <= 15) {
        var startSpin = performance.now();
        while ((obterTempoServidorMs() < triggerAt) && (performance.now() - startSpin < 30)) {
          // micro spin-lock
        }
        dispararComando();
        return;
      }
    }

    if (remaining < 1500 && !disparado) {
      rafId = requestAnimationFrame(microLoopPrecision);
    }
  }

  snipeInterval = setInterval(function() {
    if (disparado) return;
    var nowMs = obterTempoServidorMs();
    $("#ssp_server_clock").text(formatarHoraCompletaMs(nowMs));

    var offsetMs = Number($("#ssp_offset_ms").val()) || 0;
    var triggerAt = targetMs - offsetMs;
    var diffMs = triggerAt - nowMs;
    var displayEl = $("#ssp_countdown_display");
    var badgeEl = $("#ssp_status_badge");

    if (diffMs > 0) {
      var totalSec = Math.floor(diffMs / 1000);
      var min = Math.floor(totalSec / 60);
      var sec = totalSec % 60;
      var ms = diffMs % 1000;
      var strMs = ms < 10 ? '00' + ms : (ms < 100 ? '0' + ms : ms);
      var strSec = sec < 10 ? '0' + sec : sec;
      var strMin = min < 10 ? '0' + min : min;

      displayEl.text(strMin + ':' + strSec + '.' + strMs);

      // Bips de áudio nos últimos 3 segundos
      if (totalSec <= 3 && totalSec !== lastBeepSec) {
        lastBeepSec = totalSec;
        if (totalSec === 3) tocarBeep(650, 70);
        else if (totalSec === 2) tocarBeep(750, 70);
        else if (totalSec === 1) tocarBeep(850, 90);
      }

      if (diffMs <= 1500 && !rafId) {
        rafId = requestAnimationFrame(microLoopPrecision);
      }

      if (diffMs <= 250) {
        displayEl.css("color", "#00ff00");
        badgeEl.css({ background: "#008800", color: "#ffffff" }).text(autoFireArmed ? "⚡ DISPARANDO NO MS EXATO..." : "🔥 CLIQUE AGORA! 🔥");
        if (btnSubmit.length) {
          btnSubmit.css({ "box-shadow": "0 0 15px #00ff00", "outline": "3px solid #00ff00" });
        }
      } else if (diffMs <= 2000) {
        displayEl.css("color", "#ffaa00");
        badgeEl.css({ background: "#aa5500", color: "#ffffff" }).text("⚠️ ATENÇÃO MÁXIMA — Prepare o comando!");
      } else if (diffMs <= 5000) {
        displayEl.css("color", "#ffee55");
        badgeEl.css({ background: "#665500", color: "#ffffff" }).text("🔔 PREPARE-SE...");
      } else if (!autoFireArmed) {
        displayEl.css("color", "#ffffff");
        badgeEl.css({ background: "#333333", color: "#aaaaaa" }).text("Aguardando momento ideal...");
      }
    } else {
      if (autoFireArmed && !disparado) {
        dispararComando();
        return;
      }
      var passMs = Math.abs(diffMs);
      if (passMs <= 75) {
        displayEl.css("color", "#00ff00").text("00:00.000");
        badgeEl.css({ background: "#00aa00", color: "#fff" }).text("🎯 JANELA DE ±75ms ATINGIDA!");
        if (lastBeepSec !== 0) {
          tocarBeep(1100, 140);
          lastBeepSec = 0;
        }
      } else {
        displayEl.css("color", "#ff4444").text("+" + (passMs / 1000).toFixed(3) + "s");
        badgeEl.css({ background: "#660000", color: "#fff" }).text("Momento expirado (" + passMs + "ms atrás)");
        if (btnSubmit.length) {
          btnSubmit.css({ "box-shadow": "none", "outline": "none" });
        }
      }
    }
  }, 25);
}

// -------------------------------------------------------------
// VERIFICAÇÃO AUTOMÁTICA DE TELAS AO CLICAR NO QUICKBAR OU USERSCRIPT
// -------------------------------------------------------------
function verificarTelaAtual() {
  var isConfirmScreen = location.href.indexOf("try=confirm") !== -1 || $("#troop_confirm_submit").length > 0;
  var isPlaceScreen = location.href.indexOf("screen=place") !== -1;

  // 1. Se estiver na tela de confirmação de envio:
  if (isConfirmScreen) {
    var pendingCmd = null;
    try {
      var raw = sessionStorage.getItem("ssp_pending_cmd") || localStorage.getItem("ssp_last_cmd");
      if (raw) pendingCmd = JSON.parse(raw);
    } catch (e) {}

    var targetMs = Date.now() + 30000;
    if (pendingCmd && pendingCmd.launchTimestamp) {
      targetMs = pendingCmd.launchTimestamp;
    }

    desenharSnipeHUD(targetMs);
    return true;
  }

  // 2. Se estiver na Praça de Reunião:
  if (isPlaceScreen) {
    try {
      var raw = sessionStorage.getItem("ssp_pending_cmd");
      if (raw) {
        var cmd = JSON.parse(raw);
        if (cmd.targetCoord) {
          var parts = cmd.targetCoord.split('|');
          if (parts.length === 2) {
            $('input[name="x"]').val(parts[0]);
            $('input[name="y"]').val(parts[1]);
          }
        }
        if (cmd.paramsUrl) {
          var pairs = decodeURIComponent(cmd.paramsUrl).split('&');
          pairs.forEach(function(pair) {
            if (pair.indexOf("att_") === 0) {
              var unitData = pair.replace("att_", "").split('=');
              if (unitData.length === 2) {
                $('input[name="' + unitData[0] + '"]').val(unitData[1]);
              }
            }
          });
        }
      }
    } catch (e) {}
  }

  return false;
}

// -------------------------------------------------------------
// NÚCLEO DO SINGLE SCREEN PLANNER (SSP)
// -------------------------------------------------------------
function iniciarSSP() {
  if (verificarTelaAtual()) {
    return;
  }

  if (!$("#planer_klinow").length) {
    var configuracao = configuracaoMundo();
    info = {};
    info.velocidade_jogo = Number($(configuracao).find("config speed").text()) || 1;
    info.velocidade_tropas = Number($(configuracao).find("config unit_speed").text()) || 1;
    info.arqueiros = Number($(configuracao).find("game archer").text()) || 0;
    info.paladino = Number($(configuracao).find("game knight").text()) || 0;
    info.linkTropas = "/game.php?&village=" + game_data.village.id + "&type=own_home&mode=units&group=0&page=-1&screen=overview_villages";
    info.linkVisualizacaoGeral = "/game.php?";
    info.linkComando = "/game.php?";
    info.velocidade = [18, 22, 18, 18, 9, 10, 10, 11, 30, 30, 10, 35];
    info.nomesTropas = [
      "Lanceiro", "Espadachim", "Viking", "Arqueiro",
      "Batedor", "Cavalaria leve", "Arqueiro a cavalo", "Cavalaria Pesada",
      "Aríete", "Catapulta", "Paladino", "Nobre"
    ];

    carregando = true;
    gruposCarregados = false;
    sort_of_low = true;
    img_tropas = (typeof image_base !== 'undefined' ? image_base : '') + "unit/";
    minimo_numero_tropas = [];
    tempoSaida = [];
    tempoUltrapassado = [];
    id = [];
    tropas = [];
    minhasAldeias = [];
    nomesAldeias = [];
    mostrarAldeias = [];
    tabelaBB = [];
    imagens = "spear,sword,axe,archer,spy,light,marcher,heavy,ram,catapult,knight,snob".split(',');
    unidadesAtivas = ("111" + (info.paladino ? '10' : '0')).split('');

    if (!info.paladino) {
      var kIdx = imagens.indexOf("knight");
      if (kIdx !== -1) {
        info.velocidade.splice(kIdx, 1);
        info.nomesTropas.splice(kIdx, 1);
        imagens.splice(kIdx, 1);
      }
    }
    if (!info.arqueiros) {
      var aIdx = imagens.indexOf("archer");
      if (aIdx !== -1) {
        info.velocidade.splice(aIdx, 1);
        info.nomesTropas.splice(aIdx, 1);
        imagens.splice(aIdx, 1);
      }
      var mIdx = imagens.indexOf("marcher");
      if (mIdx !== -1) {
        info.velocidade.splice(mIdx, 1);
        info.nomesTropas.splice(mIdx, 1);
        imagens.splice(mIdx, 1);
      }
    }

    var propagacao = getCookie("atkjed");
    if (propagacao != '') {
      try {
        unidadesAtivas = parseInt(propagacao, 36).toString(2).split('');
        while (unidadesAtivas.length < info.velocidade.length) {
          unidadesAtivas.splice(0, 0, '0');
        }
      } catch (e) {}
    }

    var t = $("#serverTime").html() ? $("#serverTime").html().match(/\d+/g) : null;
    var d = $("#serverDate").html() ? $("#serverDate").html().match(/\d+/g) : null;
    var tempoAtual = new Date();
    if (t && d && t.length >= 3 && d.length >= 3) {
      tempoAtual = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]);
    }

    if (game_data.player.sitter != 0) {
      info.linkTropas = "/game.php?t=" + game_data.player.id + "&village=" + game_data.village.id + "&type=own_home&mode=units&group=0&page=-1&screen=overview_villages";
      info.linkVisualizacaoGeral += "t=" + game_data.player.id + "&village=" + game_data.village.id + "&screen=info_village&id=";
      info.linkComando += "t=" + game_data.player.id + "&village=";
    } else {
      info.linkVisualizacaoGeral += "village=" + game_data.village.id + "&screen=info_village&id=";
      info.linkComando += "village=";
    }

    todasTropas = info.linkTropas;
    var velocidade_mundo = Number((info.velocidade_jogo * info.velocidade_tropas).toFixed(5)) || 1;

    for (var i = 0; i < info.velocidade.length; i++) {
      minimo_numero_tropas[i] = 0;
      info.velocidade[i] /= velocidade_mundo;
    }

    desenharPlanner(tempoAtual);
    carregarInfo();
  } else {
    $("#planer_klinow").remove();
  }
}

function escolherOpcoes() {
  if (carregando) {
    if (typeof UI !== 'undefined' && UI.InfoMessage) {
      UI.InfoMessage("Aguarde enquanto os dados das aldeias estão carregando...", 1500, "info");
    }
    $("#carregamento").html("Aguarde enquanto carrega...");
    setTimeout(escolherOpcoes, 500);
    return;
  }

  if ($("#escolher_tropas").is(":visible")) {
    mudarSeta();
    $("#escolher_tropas").hide();
    $("#lista_tropas").show();
    guardarSelecao();
  }

  var _0x59487e = [];
  var _0x335285 = [];
  var _0x5b1439 = -1;

  var objEl = document.getElementById("objetivoCommun");
  var _0x56acf5 = objEl && objEl.value ? objEl.value.match(/\d+/g) : null;
  if (!_0x56acf5 || _0x56acf5.length < 2) {
    if (typeof UI !== 'undefined' && UI.InfoMessage) {
      UI.InfoMessage("Insira as coordenadas do alvo (ex: 500|500)!", 2000, "error");
    } else {
      alert("Insira as coordenadas do alvo (ex: 500|500)!");
    }
    return;
  }

  var horaEl = document.getElementById("hora_input");
  var dataEl = document.getElementById("data_input");
  var _0x492574 = horaEl && horaEl.value ? horaEl.value.match(/\d+/g) : null;
  var _0x10de71 = dataEl && dataEl.value ? dataEl.value.match(/\d+/g) : null;

  if (!_0x492574 || _0x492574.length < 3 || !_0x10de71 || _0x10de71.length < 3) {
    if (typeof UI !== 'undefined' && UI.InfoMessage) {
      UI.InfoMessage("Data ou hora inválida! Formato: DD.MM.AAAA e HH:MM:SS", 2000, "error");
    } else {
      alert("Data ou hora inválida!");
    }
    return;
  }

  $("#lista_tropas th").each(function(_0x3460a3) {
    if (_0x3460a3 > info.velocidade.length) return;
    if (_0x3460a3 && $(this).hasClass("faded")) {
      unidadesAtivas[_0x3460a3 - 1] = '0';
    } else if (_0x3460a3) {
      unidadesAtivas[_0x3460a3 - 1] = '1';
    }
  });

  setCookie("atkjed", parseInt(unidadesAtivas.join(''), 2).toString(36), 360);

  var _0x2c6563 = $("#serverTime").html() ? $("#serverTime").html().match(/\d+/g) : null;
  var _0x34468f = $("#serverDate").html() ? $("#serverDate").html().match(/\d+/g) : null;
  var _0x28246d = new Date();
  if (_0x2c6563 && _0x34468f && _0x2c6563.length >= 3 && _0x34468f.length >= 3) {
    _0x28246d = new Date(_0x34468f[2], _0x34468f[1] - 1, _0x34468f[0], _0x2c6563[0], _0x2c6563[1], _0x2c6563[2]);
  }

  var _0x3adafd = new Date(_0x10de71[2], _0x10de71[1] - 1, _0x10de71[0], _0x492574[0], _0x492574[1], _0x492574[2]);
  var _0x2ee81b = (_0x3adafd - _0x28246d) / 1000;
  var _0x42d393 = 0;

  for (var i = 0; i < minhasAldeias.length; i++) {
    if (!mostrarAldeias[i]) continue;
    var mCoord = (nomesAldeias[i] || '').match(/\b(\d{1,3})\|(\d{1,3})\b/);
    var ax = mCoord ? Number(mCoord[1]) : Number(minhasAldeias[i][minhasAldeias[i].length - 3]);
    var ay = mCoord ? Number(mCoord[2]) : Number(minhasAldeias[i][minhasAldeias[i].length - 2]);

    _0x335285[i] = "<tr><td><a href='" + info.linkVisualizacaoGeral + id[i] + "'>" + nomesAldeias[i].replace(/\s+/g, '\u00a0') + "</a></td>";
    var tropa_mais_lenta = 0;
    var tropa_possiveis = "&from=simulator";

    for (var j = 0; j < info.velocidade.length; j++) {
      if (unidadesAtivas[j] == '0' || tropas[i][j] < 1) {
        _0x335285[i] += "<td class='hidden'>" + (tropas[i][j] || 0) + "</td>";
        continue;
      }
      var a = Math.abs(Number(_0x56acf5[0]) - ax);
      var b = Math.abs(Number(_0x56acf5[1]) - ay);
      var tempoDeslocacao = Math.sqrt(a * a + b * b) * info.velocidade[j] * 60;
      if (tempoDeslocacao <= _0x2ee81b) {
        if (tempoDeslocacao > tropa_mais_lenta) {
          tropa_mais_lenta = tempoDeslocacao;
          _0x5b1439 = j;
        }
        tropa_possiveis += "&att_" + imagens[j] + "=" + tropas[i][j];
        _0x335285[i] += "<td style='background-color: #C3FFA5;'>" + tropas[i][j] + "</td>";
      } else {
        _0x335285[i] += "<td>" + tropas[i][j] + "</td>";
      }
    }

    if (tropa_mais_lenta != 0) {
      var tmp = new Date(_0x3adafd);
      tmp.setSeconds(tmp.getSeconds() - tropa_mais_lenta);
      tempoSaida[_0x42d393] = new Date(tmp);
      var launchTs = tmp.getTime();
      var ddd = formatarDatas(tmp) + " às " + formatarHoras(tmp);
      var linkHref = info.linkComando + id[i] + "&screen=place&x=" + _0x56acf5[0] + "&y=" + _0x56acf5[1] + tropa_possiveis;
      var targetCoordStr = _0x56acf5[0] + "|" + _0x56acf5[1];

      // O botão "Enviar" agora submete via POST direto para try=confirm
      _0x59487e[_0x42d393] = _0x335285[i] + "<td>" + ddd + "</td><td>0</td><td><a class='btn btn-ssp-enviar' href='#' onclick=\"enviarDiretoConfirmacao('" + id[i] + "', '" + targetCoordStr + "', " + launchTs + ", '" + encodeURIComponent(tropa_possiveis) + "'); return false;\">Enviar</a></td></tr>";
      tabelaBB[_0x42d393] = "[*]" + info.nomesTropas[_0x5b1439] + "[|] " + ax + "|" + ay + " [|] " + _0x56acf5[0] + "|" + _0x56acf5[1] + " [|] " + ddd + " [|] [url=https://" + document.URL.split('/')[2] + linkHref + "]Enviar\n";
      _0x42d393++;
    } else {
      _0x335285[i] = '';
    }
  }

  if (_0x42d393 == 0) {
    if (typeof UI !== 'undefined' && UI.InfoMessage) {
      UI.InfoMessage("Não há aldeias a tempo...", 1500, "error");
    }
  }
  $("#numero_possibilidades").html("<b>" + _0x42d393 + "/" + minhasAldeias.length + "</b>");

  for (var i = 0; i < _0x59487e.length - 1; i++) {
    var min = i;
    for (var j = i + 1; j < _0x59487e.length; j++) {
      if (tempoSaida[min] > tempoSaida[j]) min = j;
    }
    var tmp = _0x59487e[min]; _0x59487e[min] = _0x59487e[i]; _0x59487e[i] = tmp;
    tmp = tempoSaida[min]; tempoSaida[min] = tempoSaida[i]; tempoSaida[i] = tmp;
    tmp = tabelaBB[min]; tabelaBB[min] = tabelaBB[i]; tabelaBB[i] = tmp;
  }
  tabelaBB.splice(_0x42d393, tabelaBB.length - _0x42d393);

  $("#lista_tropas tbody").html(
    _0x59487e.join('\n') +
    (_0x42d393 ? "<tr><td id='export_bb' colspan=" + (info.velocidade.length + 4) + "><a href='#' onclick=\"$('#export_bb').html('<textarea cols=100 rows=2 onclick=\\'this.select()\\'>[table][**]Unidade[||]Fonte[||]Alvo[||]Hora de saída[||]Comando[/**]\\n' + tabelaBB.join('') + '[/table]</textarea>');\"><img src='" + (typeof image_base !== 'undefined' ? image_base : '') + "igm/export.png'> Exportar Código</a></td></tr>" : '')
  );

  $("#lista_tropas tbody tr").each(function(_0x3054d5) {
    $(this).addClass(_0x3054d5 % 2 ? "row_a" : "row_b");
  });
  $("#carregamento").html('');
  contar();
}

function contar() {
  var _0x3e1638 = $("#serverTime").html() ? $("#serverTime").html().match(/\d+/g) : null;
  var _0x455f0f = $("#serverDate").html() ? $("#serverDate").html().match(/\d+/g) : null;
  if (!_0x3e1638 || !_0x455f0f) return;
  var _0x3e450f = new Date(_0x455f0f[2], _0x455f0f[1] - 1, _0x455f0f[0], _0x3e1638[0], _0x3e1638[1], _0x3e1638[2]);

  $("#lista_tropas tbody > tr").each(function(_0x51477e) {
    if (!tempoSaida[_0x51477e]) return;
    var tempoDiferenca = (tempoSaida[_0x51477e] - _0x3e450f) / 1000;
    if (tempoDiferenca > 60) {
      $(this).find('td').eq(info.velocidade.length + 2).html(formatarHora(tempoDiferenca));
    } else {
      $(this).find('td').eq(info.velocidade.length + 2).html("<font color='red'>" + Math.round(tempoDiferenca) + "</font>");
    }
  });
  setTimeout(contar, 1000);
}

function formatarHora(_0x22622a) {
  var sec = Math.max(0, Math.floor(_0x22622a));
  var _0x2cb4c8 = Math.floor(sec / 3600);
  sec = sec - _0x2cb4c8 * 3600;
  var _0x4734ce = Math.floor(sec / 60);
  sec = sec - _0x4734ce * 60;
  return _0x2cb4c8 + ':' + (_0x4734ce < 10 ? '0' + _0x4734ce : _0x4734ce) + ':' + (sec < 10 ? '0' + sec : sec);
}

function mudarGrupo() {
  $("#carregamento").html("<img src='" + (typeof image_base !== 'undefined' ? image_base : '') + "throbber.gif' />");
  tropas = [];
  id = [];
  minhasAldeias = [];
  nomesAldeias = [];
  info.linkTropas = document.getElementById("listGrup").value;
  carregarInfo();
}

function verificarTudo(_0x335a5f) {
  var checkboxes = document.getElementsByName("selecao");
  for (var _0x2a1e35 = 0, _0xfc5421 = checkboxes.length; _0x2a1e35 < _0xfc5421; _0x2a1e35++) {
    checkboxes[_0x2a1e35].checked = _0x335a5f.checked;
  }
}

function definirMinimo(_0x5076db) {
  var el = document.getElementById("escolher_tropas");
  if (!el) return;
  var inputs = el.getElementsByTagName("input");
  for (var i = 0; i < info.velocidade.length; i++) {
    if (inputs[i]) {
      inputs[i].value = _0x5076db;
      minimo_numero_tropas[i] = _0x5076db;
    }
  }
}

function esconderTropas(_0x44c73b, _0x17f445) {
  _0x17f445 = Number(_0x17f445);
  minimo_numero_tropas[_0x44c73b] = _0x17f445;
  $("#escolher_tropas tr:has(td)").each(function() {
    var tt = 0;
    if (Number($(this).find('td').eq(_0x44c73b + 1).text()) < _0x17f445) {
      $(this).hide();
      $(this).find("input").prop("checked", false);
    } else {
      for (var j = 0; j < minimo_numero_tropas.length; j++) {
        if (Number($(this).find('td').eq(j + 1).text()) >= minimo_numero_tropas[j]) tt++;
      }
    }
    if (tt == info.velocidade.length) {
      $(this).show();
      $(this).find("input").prop("checked", true);
    } else {
      $(this).hide();
      $(this).find("input").prop("checked", false);
    }
  });
}

function ordenarVisualizacao(_0x17f829) {
  _0x17f829++;
  var _0x5dbf59 = [];
  var _0x45db74 = document.getElementById("escolher_tropas");
  if (!_0x45db74 || !_0x45db74.rows || !_0x45db74.rows[1]) return;
  var x;
  var cell = _0x45db74.rows[1].cells[_0x17f829];
  if (!cell) return;
  var imgs = cell.getElementsByTagName("img");
  var imgIdx = (!_0x17f829 || _0x17f829 == info.velocidade.length + 1) ? 0 : 1;
  if (x = imgs[imgIdx]) {
    x.src = sort_of_low ? (typeof image_base !== 'undefined' ? image_base : '') + "list-up.png" : (typeof image_base !== 'undefined' ? image_base : '') + "list-down.png";
    sort_of_low = !sort_of_low;
  } else {
    cell.innerHTML += "<img src='" + (typeof image_base !== 'undefined' ? image_base : '') + "list-down.png'>";
    sort_of_low = true;
  }

  for (var i = 0; i < _0x45db74.rows[1].cells.length; i++) {
    if (i == _0x17f829) continue;
    var otherCell = _0x45db74.rows[1].cells[i];
    var otherImgs = otherCell.getElementsByTagName("img");
    var otherImgIdx = (!i || i == info.velocidade.length + 1) ? 0 : 1;
    if (x = otherImgs[otherImgIdx]) {
      x.remove();
    }
  }

  $("[name='selecao']").each(function() {
    _0x5dbf59.push($(this).is(":checked"));
  });

  for (var i = 2; i < _0x45db74.rows.length - 1; i++) {
    if (_0x45db74.rows[i].style.display == "none") continue;
    var min = i;
    for (var j = i + 1; j < _0x45db74.rows.length; j++) {
      if (_0x45db74.rows[j].style.display == "none") continue;
      if (_0x17f829 == 0) {
        if (_0x45db74.rows[sort_of_low ? j : min].cells[_0x17f829].textContent > _0x45db74.rows[sort_of_low ? min : j].cells[_0x17f829].textContent) {
          min = j;
        }
      }
      if (Number(_0x45db74.rows[sort_of_low ? j : min].cells[_0x17f829].textContent) > Number(_0x45db74.rows[sort_of_low ? min : j].cells[_0x17f829].textContent)) {
        min = j;
      }
    }
    var tmp = _0x45db74.rows[min].innerHTML;
    _0x45db74.rows[min].innerHTML = _0x45db74.rows[i].innerHTML;
    _0x45db74.rows[i].innerHTML = tmp;
    var tmp2 = _0x5dbf59[i - 2];
    _0x5dbf59[i - 2] = _0x5dbf59[min - 2];
    _0x5dbf59[min - 2] = tmp2;
  }

  $("[name='selecao']").each(function(_0x5aa115) {
    $(this).prop("checked", _0x5dbf59[_0x5aa115]);
  });
}

function selecionarAldeias() {
  var _0x3a5f52;
  var ib = typeof image_base !== 'undefined' ? image_base : '';
  var janela = "<tr><th style=\"cursor:pointer;\" onclick=\"definirMinimo(0); $('#escolher_tropas tr:has(td)').each(function(i){$(this).show();});\">Número mínimo de tropas:</th>";
  for (var i = 0; i < info.velocidade.length; i++) {
    janela += "<th><input onchange=\"esconderTropas(" + i + ",this.value);\" type='text' value='" + minimo_numero_tropas[i] + "' size='1'></th>";
  }
  janela += "<th colspan=2></tr><tr><th style=\"cursor:pointer;\" onclick=\"ordenarVisualizacao(-1);\"><span class='icon header village'></span></th>";
  for (var i = 0; i < imagens.length; i++) {
    janela += "<th style=\"cursor:pointer;\" onclick=\"ordenarVisualizacao(" + i + ");\"><img src='" + img_tropas + "unit_" + imagens[i] + ".png'></th>";
  }
  janela += "<th style=\"cursor:pointer;\" onclick=\"ordenarVisualizacao(" + imagens.length + ");\">Dist</th><th><input type='checkbox' onClick='verificarTudo(this)'></th></tr>";

  for (var i = 0; i < tropas.length; i++) {
    var escondido = false;
    var komorki = "<td><a href='" + info.linkVisualizacaoGeral + id[i] + "'>" + nomesAldeias[i].replace(/\s+/g, '\u00a0') + "</a></td>";
    for (var j = 0; j < imagens.length; j++) {
      komorki += "<td>" + tropas[i][j] + "</td>";
      if (!escondido && tropas[i][j] < minimo_numero_tropas[i]) escondido = true;
    }
    if (!escondido) {
      _0x3a5f52 = "<tr class='" + (i % 2 ? "row_a" : "row_b") + "'>";
    } else {
      _0x3a5f52 = "<tr class='" + (i % 2 ? "row_a" : "row_b") + "' style=\"display: none;\">";
    }
    janela += _0x3a5f52 + komorki;
    janela += "<td></td><td><input name='selecao' type='checkbox' " + (mostrarAldeias[i] ? "checked" : "disabled") + "></td></tr>";
  }

  $("#escolher_tropas").html(janela);
  mostrarDistancia();
}

function mostrarDistancia() {
  var objEl = document.getElementById("objetivoCommun");
  if (objEl && objEl.value) {
    var match = objEl.value.match(/\d+\|\d+/);
    if (match) objEl.value = match[0];
  }
  var coords = objEl && objEl.value ? objEl.value.match(/\d+/g) : null;
  if (!coords || coords.length < 2) return;

  $("#escolher_tropas tr:has(td) td:nth-child(" + (info.velocidade.length + 2) + ")").each(function(_0x5dab34) {
    if (!minhasAldeias[_0x5dab34]) return;
    var mCoord = (nomesAldeias[_0x5dab34] || '').match(/\b(\d{1,3})\|(\d{1,3})\b/);
    var ax = mCoord ? Number(mCoord[1]) : Number(minhasAldeias[_0x5dab34][minhasAldeias[_0x5dab34].length - 3]);
    var ay = mCoord ? Number(mCoord[2]) : Number(minhasAldeias[_0x5dab34][minhasAldeias[_0x5dab34].length - 2]);
    var a = Math.abs(Number(coords[0]) - ax);
    var b = Math.abs(Number(coords[1]) - ay);
    $(this).html(Number(Math.sqrt(a * a + b * b).toFixed(2)));
  });
}

function guardarSelecao() {
  $("#escolher_tropas input:checkbox").each(function(_0x301cb6) {
    if (_0x301cb6) mostrarAldeias[_0x301cb6 - 1] = $(this).is(":checked");
  });
  $("#escolher_tropas").hide();
  $("#lista_tropas").show();
}

function mudarSeta() {
  if ($("#icone_seta").hasClass("arr_down")) {
    $("#icone_seta").removeClass("arr_down");
    $("#icone_seta").addClass("arr_up");
  } else {
    $("#icone_seta").removeClass("arr_up");
    $("#icone_seta").addClass("arr_down");
  }
}

function desenharPlanner(tempoAtual) {
  var coordAtual = (game_data.village && game_data.village.x ? game_data.village.x : 500) + '|' + (game_data.village && game_data.village.y ? game_data.village.y : 500);
  if (game_data.screen == "info_village") {
    if (!mobile) {
      var el = document.getElementById("content_value") ? document.getElementById("content_value").getElementsByClassName("vis")[0] : null;
      if (el && el.rows && el.rows[2]) {
        coordAtual = el.rows[2].cells[1].textContent.trim();
      }
    } else {
      var elMobile = document.getElementsByClassName("mobileKeyValue")[0];
      if (elMobile) {
        var div = elMobile.getElementsByTagName("div")[0];
        if (div) {
          var m = div.textContent.match(/\d+\|\d+/);
          if (m) coordAtual = m[0];
        }
      }
    }
  }

  var achouComando = false;
  if ($(".no_ignored_command").length) {
    $(".no_ignored_command").each(function() {
      if ($(this).html().match("snob.png") && !achouComando) {
        var tempo_de_entrada = $(this).find("td:eq(2)").text().match(/\d+/g);
        if (tempo_de_entrada && tempo_de_entrada.length >= 3) {
          tempoAtual.setSeconds(tempoAtual.getSeconds() + Number(tempo_de_entrada[2]) + 60 * Number(tempo_de_entrada[1]) + 3600 * Number(tempo_de_entrada[0]));
          achouComando = true;
        }
      }
    });
  }

  var ib = typeof image_base !== 'undefined' ? image_base : '';
  var html = "<div class='vis vis_item' align='center' style='overflow: auto; height: 450px;' id='planer_klinow'>" +
    "<table width='100%'><tr><td width='300'>" +
    "<table style='border-spacing: 3px; border-collapse: separate;'>" +
    "<tr><th>Alvo</th><th>Data</th><th>Hora</th><th>Grupo</th><th>Tipo</th><th></th><th></th><th>Autor</th></tr>" +
    "<tr>" +
    "<td><input size=8 type='text' onchange='mostrarDistancia();' value='" + coordAtual + "' id='objetivoCommun' /></td>" +
    "<td><input size=8 type='text' value='" + formatarDatas(tempoAtual) + "' onchange=\"dataCorreta(this,'.');\" id='data_input'/></td>" +
    "<td><input size=8 type='text' value='" + formatarHoras(tempoAtual) + "' onchange=\"dataCorreta(this,':');\" id='hora_input'/></td>" +
    "<td><select id='listGrup' onchange='mudarGrupo();'><option value='" + todasTropas + "'>Todos</option></select></td>" +
    "<td><select id='tipoComandoSSP' style='padding: 2px 4px;'><option value='support' selected>Apoiar</option><option value='attack'>Atacar</option></select></td>" +
    "<td onclick=\"mudarSeta(); if($('#escolher_tropas').is(':visible')){ $('#escolher_tropas').hide();$('#lista_tropas').show(); guardarSelecao(); return;} else { $('#lista_tropas').hide(); $('#escolher_tropas').show(); }\" style='cursor:pointer;'><span id='icone_seta' class='icon header arr_down'></span></td>" +
    "<td><input type='button' class='btn' value='CALCULAR' onclick='escolherOpcoes();' id='przycisk'></td>" +
    "<td><a href='https://www.instagram.com/jhonatanazuelosoficial?stkn=NWZ3ZTVoMnE1NGwx&utm_source=qr' target='_blank' rel='noopener noreferrer' style='font-weight: bold; text-decoration: underline;'>Azuelos</a> (SSP)</td>" +
    "<td style='display:none;'><input size='8' type='text' onchange='mostrarDistancia();' value='0' id='sigilias'></td>" +
    "</tr>" +
    "</table>" +
    "</td><td id='carregamento'><img src='" + ib + "throbber.gif' /></td></tr>" +
    "<tr><td colspan=2 width='100%'>" +
    "<table style='display: none; border-spacing: 3px; border-collapse: separate;' id='escolher_tropas' width='100%'></table>" +
    "<table style='border-spacing: 3px; border-collapse: separate;' id='lista_tropas' width='100%'>" +
    "<thead><tr>" +
    "<th id='numero_possibilidades'><span class='icon header village'></span></th>";

  for (var i = 0; i < imagens.length; i++) {
    html += "<th style='cursor:pointer;' class='" + (unidadesAtivas[i] == '0' ? "faded" : '') + "' onClick=\"if(this.className == 'faded') this.className=''; else this.className='faded';\"><img title='" + info.nomesTropas[i] + "' src='" + img_tropas + "unit_" + imagens[i] + ".png'></th>";
  }

  html += "<th>Hora de Saída</th><th><span class='icon header time'></span></th><th><b>Comando</b></th></tr></thead><tbody></tbody></table>" +
    "</td></tr></table></div>";

  $(mobile ? "#mobileContent" : "#contentContainer").prepend(html);

  $(document).off('click', '#przycisk').on('click', '#przycisk', function(e) {
    if (e && e.preventDefault) e.preventDefault();
    escolherOpcoes();
  });
}

function dataCorreta(el, sep) {
  var x = el.value.match(/\d+/g);
  if (x && x.length >= 3) {
    el.value = x[0] + sep + x[1] + sep + x[2];
  }
}

function carregarInfo() {
  carregando = true;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", info.linkTropas, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        var requestedBody = document.createElement("body");
        requestedBody.innerHTML = xhr.responseText;
        var tableUnits = $(requestedBody).find("#units_table").get()[0];
        var visItem = $(requestedBody).find(".vis_item").get()[0];
        var groupLinks = visItem ? visItem.getElementsByTagName(mobile ? "option" : 'a') : [];

        if (!tableUnits) {
          $("#carregamento").html("Não existem aldeias neste grupo...");
          carregando = false;
          return;
        }

        for (var i = 1; i < tableUnits.rows.length; i++) {
          mostrarAldeias[i - 1] = true;
          tropas[i - 1] = [];
          var pustaWioska = 0;
          for (var j = 2; j < tableUnits.rows[i].cells.length - 1; j++) {
            var val = tableUnits.rows[i].cells[j].textContent.trim();
            tropas[i - 1].push(val);
            if (!Number(val)) pustaWioska++;
          }
          if (pustaWioska > info.velocidade.length) mostrarAldeias[i - 1] = false;

          var cell0 = tableUnits.rows[i].cells[0];
          var spans = cell0.getElementsByTagName("span");
          var villageDataId = (spans[0] ? spans[0].getAttribute("data-id") : null);
          if (!villageDataId) {
            var linkEl = cell0.querySelector("a");
            if (linkEl && linkEl.href) {
              var mId = linkEl.href.match(/village=(\d+)/);
              if (mId) villageDataId = mId[1];
            }
          }
          id.push(villageDataId || "0");

          var vText = spans[2] ? spans[2].textContent : cell0.textContent;
          nomesAldeias.push(vText.trim());
          minhasAldeias.push(vText.match(/\d+/g) || ["0", "0"]);
        }

        selecionarAldeias();
        if (gruposCarregados && $("#lista_tropas").is(":visible")) {
          escolherOpcoes();
        }

        if (!gruposCarregados && groupLinks.length) {
          for (var i = 0; i < groupLinks.length; i++) {
            var nome = groupLinks[i].textContent;
            if (mobile && groupLinks[i].textContent == "todos") continue;
            var valAttr = groupLinks[i].getAttribute(mobile ? "value" : "href");
            if (valAttr) {
              $("#listGrup").append($("<option>", {
                'value': valAttr + "&page=-1",
                'text': mobile ? nome : nome.slice(1, nome.length - 1)
              }));
            }
          }
          gruposCarregados = true;
        }

        $("#carregamento").html('');
      } else {
        $("#carregamento").html("Erro ao carregar tropas.");
      }
      carregando = false;
    }
  };
  xhr.send(null);
}

function formatarDatas(d) {
  var dia = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
  var mes = (d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1);
  return String(dia + '/' + mes + '/' + d.getFullYear());
}

function formatarHoras(d) {
  var h = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
  var m = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
  var s = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();
  return String(h + ':' + m + ':' + s);
}

function configuracaoMundo() {
  var res;
  $.ajax({
    async: false,
    url: "/interface.php?func=get_config",
    dataType: "xml",
    success: function(xml) {
      res = xml;
    }
  });
  return res;
}

function getCookie(name) {
  var prefix = name + "=";
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; i++) {
    var c = cookies[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(prefix) != -1) return c.substring(prefix.length, c.length);
  }
  return '';
}

function setCookie(name, val, days) {
  var date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  var expires = "expires=" + date.toGMTString();
  if (days == 0) expires = '';
  document.cookie = name + "=" + val + "; " + expires;
}

// Exportar funções explicitamente para o escopo global (window)
window.escolherOpcoes = escolherOpcoes;
window.mudarGrupo = mudarGrupo;
window.mudarSeta = mudarSeta;
window.definirMinimo = definirMinimo;
window.esconderTropas = esconderTropas;
window.ordenarVisualizacao = ordenarVisualizacao;
window.selecionarAldeias = selecionarAldeias;
window.mostrarDistancia = mostrarDistancia;
window.guardarSelecao = guardarSelecao;
window.dataCorreta = dataCorreta;
window.carregarInfo = carregarInfo;
window.verificarTudo = verificarTudo;
window.iniciarSSP = iniciarSSP;
window.salvarComandoSSP = salvarComandoSSP;
window.desenharSnipeHUD = desenharSnipeHUD;
window.enviarDiretoConfirmacao = enviarDiretoConfirmacao;
window.submeterFormularioNativo = submeterFormularioNativo;

// Inicia automaticamente
iniciarSSP();
