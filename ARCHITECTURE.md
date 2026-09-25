# ARCHITECTURE.md — TW Toolkit

## Visão Geral
Toolkit em JavaScript (Client-side / Userscript / Quickbar) para o jogo Tribal Wars.

## Estrutura do Projeto
- `ssp.js`: Single Screen Planner (SSP) — Planejador de ataques e snipes em tela única com detecção automática de nobres entrantes, grupos e exportação BBCode.
- `ofensivas-academia.js`: Censo da tribo por jogador (Tropas e Edifícios) com listas de 9k/18k.
- `overwatch-tropas.js`: Bookmarklet de tropas para alimentação manual/auxiliar do Overwatch.
- `tw_overdosee_toolkit.js`: Script contendo módulos de FarmFinder, AutoFarm, AttackPlanner, CommandSniper, NobleTrain, ResourceHUD e IncomingAnalyzer.
- Repositório remoto: GitHub `Azuelos/tw-toolkit` servido via CDN jsDelivr.

## Formato de Execução via Barra Rápida (Quickbar)
```javascript
javascript:$.getScript("https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/ssp.js");void(0);
```
