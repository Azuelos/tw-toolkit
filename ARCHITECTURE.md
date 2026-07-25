# ARCHITECTURE.md — TW Toolkit

## Visão Geral
Toolkit em JavaScript (Client-side / Userscript / Quickbar) para o jogo Tribal Wars.

## Estrutura do Projeto
- `tw_overdosee_toolkit.js`: Script principal contendo toda a lógica de UI, módulos (FarmFinder, AutoFarm, AttackPlanner, CommandSniper, NobleTrain, ResourceHUD, IncomingAnalyzer) e integração com o jogo via `game_data` e DOM.
- Repositório remoto: GitHub `Azuelos/tw-toolkit` servido via CDN jsDelivr.

## Módulos
1. `TW`: Dados globais e helper de janela.
2. `UI`: Injeção de CSS, dashboard flutuante, janelas e formulários.
3. `CommandSniper`: Temporizador de comandos com precisão de milissegundos usando relógio do servidor (`Timing.getCurrentServerTime()`).
4. `FarmFinder`: Buscador e calculador de aldeias bárbaras.
5. `FarmScheduler`: Agendador/automador de farm via assistente de saque.
6. `AttackPlanner`: Planejador de ataques e tempos de viagem.
7. `NobleTrain`: Trem de nobres com intervalo automático.
