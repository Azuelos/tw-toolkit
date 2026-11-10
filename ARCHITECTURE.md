# ARCHITECTURE.md — TW Toolkit

## Visão Geral
Toolkit em JavaScript (Client-side / Userscript / Quickbar) para o jogo Tribal Wars.

## Estrutura do Projeto
- `RelicFusionPTBR.js` / `relicFusion.js`: Fusão e Otimizador de Relíquias Inteligente (Relic Fusion Optimizer) — OND BR143 com interface neomórfica Dark, simulação de combinações, fusão em massa automática (com proteção de favoritos, modo cascata/recursivo e anti-detecção com jitter) e sincronização nativa com a Tesouraria.
- `MassAttackPlannerPTBR.js` / `massAttackPlanner.js`: Planejador de Ataques em Massa (Mass Attack Planner) — In-game modal escuro, cálculo de velocidades e distâncias nativo, atalhos de chegada, auto-detecção de aldeias e abertura direta de Praça de Reunião com alvo pré-preenchido.
- `WHBalancerPTBR.js`: Balanceador de Armazém Inteligente — OND BR143 com interface neomórfica Dark e distribuição otimizada de recursos.
- `ssp.js`: Single Screen Planner (SSP) — Planejador de ataques e snipes em tela única com detecção automática de nobres entrantes, grupos e exportação BBCode.
- `ofensivas-academia.js`: Censo da tribo por jogador (Tropas e Edifícios) com listas de 9k/18k.
- `overwatch-tropas.js`: Bookmarklet de tropas para alimentação manual/auxiliar do Overwatch.
- `tw_overdosee_toolkit.js`: Script contendo módulos de FarmFinder, AutoFarm, AttackPlanner, CommandSniper, NobleTrain, ResourceHUD e IncomingAnalyzer.
- Repositório remoto: GitHub `Azuelos/tw-toolkit` servido via CDN jsDelivr.

## Formato de Execução via Barra Rápida (Quickbar)

### Fusão de Relíquias Inteligente (Relic Fusion Optimizer):
```javascript
javascript:$.getScript("https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/RelicFusionPTBR.js");void(0);
```

### Planejador de Ataques em Massa (Mass Attack Planner):
```javascript
javascript:$.getScript("https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/MassAttackPlannerPTBR.js");void(0);
```

### Balanceador de Armazém:
```javascript
javascript:$.getScript("https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/WHBalancerPTBR.js");void(0);
```

### Single Screen Planner (SSP):
```javascript
javascript:$.getScript("https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/ssp.js");void(0);
```

