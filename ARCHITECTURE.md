# ARCHITECTURE.md — TW Toolkit

## Visão Geral
Toolkit em JavaScript (Client-side / Userscript / Quickbar) para o jogo Tribal Wars.

## Estrutura do Projeto
- `MassBuddyAcceptPTBR.js` / `massBuddyAccept.js`: Aprovador de Amizades em Massa (Mass Buddy Approver & Invitations) — OND BR143 com interface Dark/Glassmorphism, aprovação em lote de pedidos de amizade recebidos com checkboxes individuais de desmarcação, envio em massa de convites para amigos sugeridos, cancelamento de convites enviados, jitter dinâmico anti-detecção e suporte a execução em segundo plano em qualquer tela do jogo.
- `SiegePokerPTBR.js` / `siegePoker.js`: Póquer de Cerco AI — Assistente Tático & Otimizador de Mãos e Descarte (Siege Poker Optimizer) para o evento "Póquer de Cerco" do Tribal Wars BR143 com interface Dark/Glassmorphism, motor de cálculo exaustivo de 218 combinações de poker, seleção com 1 clique de melhor mão letal, estrategista de descarte ótimo com cálculo de outs e probabilidades (Flush Draw, Straight Draw, Trips, Pares), rastreador de baralho e modo semi-automático seguro com proteção estrita contra gasto de Pontos Premium.
- `RelicFusionPTBR.js` / `relicFusion.js`: Fusão e Otimizador de Relíquias Inteligente (Relic Fusion Optimizer) — OND BR143 com interface neomórfica Dark, simulação de combinações, fusão em massa automática (com proteção de favoritos, modo cascata/recursivo e anti-detecção com jitter) e sincronização nativa com a Tesouraria.
- `MassAttackPlannerPTBR.js` / `massAttackPlanner.js`: Planejador de Ataques em Massa (Mass Attack Planner) — In-game modal escuro, cálculo de velocidades e distâncias nativo, atalhos de chegada, auto-detecção de aldeias e abertura direta de Praça de Reunião com alvo pré-preenchido.
- `WHBalancerPTBR.js`: Balanceador de Armazém Inteligente — OND BR143 com interface neomórfica Dark e distribuição otimizada de recursos.
- `ssp.js`: Single Screen Planner (SSP) — Planejador de ataques e snipes em tela única com detecção automática de nobres entrantes, grupos e exportação BBCode.
- `ofensivas-academia.js`: Censo da tribo por jogador (Tropas e Edifícios) com listas de 9k/18k.
- `overwatch-tropas.js`: Bookmarklet de tropas para alimentação manual/auxiliar do Overwatch.
- `tw_overdosee_toolkit.js`: Script contendo módulos de FarmFinder, AutoFarm, AttackPlanner, CommandSniper, NobleTrain, ResourceHUD e IncomingAnalyzer.
- Repositório remoto: GitHub `Azuelos/tw-toolkit` servido via CDN jsDelivr.

## Formato de Execução via Barra Rápida (Quickbar)

### Aprovador de Amizades em Massa (Mass Buddy Approver):
```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/MassBuddyAcceptPTBR.js?_='+Date.now();document.head.appendChild(s);})();void(0);
```
*Ou formato alternativo via jQuery:*
```javascript
javascript:$.getScript("https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/MassBuddyAcceptPTBR.js");void(0);
```

### Póquer de Cerco AI (Siege Poker Optimizer):
```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@v1.2.2/SiegePokerPTBR.js';document.head.appendChild(s);})();void(0);
```
> ⚠️ **Nota CSP:** Nunca utilize `$.getScript()`, pois o jQuery invoca `eval()` internamente e é bloqueado pela Content Security Policy da InnoGames. O formato acima com `document.createElement('script')` é 100% à prova de CSP.

### Fusão de Relíquias Inteligente (Relic Fusion Optimizer):
```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Azuelos/tw-toolkit@main/RelicFusionPTBR.js?_='+Date.now();document.head.appendChild(s);})();void(0);
```
*Ou formato alternativo via jQuery:*
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

