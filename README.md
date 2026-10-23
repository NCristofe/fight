# DUELO DE LÂMINAS

Jogo de luta 2D para navegador com bonecos-palito e espadas. HTML5 Canvas +
JavaScript moderno, sem frameworks de UI — apenas Vite como servidor de
desenvolvimento/build.

## Como rodar

```bash
npm install
npm run dev       # servidor de desenvolvimento (http://localhost:5173)
npm run build      # build de producao em dist/
npm run preview    # serve o build de producao localmente
```

Requer Node.js 18+.

## Modos de jogo

- **Lutar contra a CPU** — melhor de 3 rodadas.
- **Treinamento** — contra a CPU, tempo e rodadas infinitos.
- **PVP local** — dois jogadores no mesmo teclado (P1: A/D/W/S + F/G/H, P2: setas + J/K/L).
- **PVP online** — cada jogador no seu dispositivo (veja "Jogando online" abaixo).

Nao ha selecao de personagem: todos os lutadores sao iguais (bonecos-palito
pretos). Voce e o "Jogador" a esquerda, o adversario e a "CPU".

## Jogando online (dois dispositivos)

O servidor de salas ja vem junto: `npm run dev` sobe o jogo **e** o servidor
(WebSocket em `/ws`, mesma porta).

1. Rode `npm run dev`. O terminal mostra dois enderecos: `Local` e `Network`
   (ex.: `http://192.168.0.10:5173`).
2. Os dois dispositivos precisam abrir **o mesmo endereco**. Para jogar de dois
   aparelhos diferentes, use o endereco `Network` (nao o `localhost`), com os
   dois no mesmo wifi. Se o firewall do Windows perguntar, permita o acesso.
3. Um escolhe **PVP ONLINE → CRIAR SALA** e passa o codigo de 4 letras; o outro
   escolhe **ENTRAR EM UMA SALA** e digita o codigo.
4. Os dois veem a tela de golpes e clicam em LUTAR para comecar.

Como funciona: quem cria a sala roda a luta inteira (ele e o Jogador da esquerda)
e envia o estado a cada passo; quem entra so envia seus comandos e desenha o que
recebe. Por isso quem entra sente um pequeno atraso (uma ida e volta de rede),
imperceptivel no mesmo wifi. Online o jogo nao pausa ao perder o foco da janela,
senao congelaria a partida do oponente.

Para jogar pela internet (fora da sua rede): `npm run build && npm start`
(serve o jogo e o servidor de salas na porta 3000, ou `PORT=...`) em um
servidor publico, ou exponha a porta com um tunel (cloudflared, ngrok). O
endereco funciona igual para os dois jogadores.

## Golpes e espada

| Golpe | Comando |
|---|---|
| Corte Rapido (avanca um passo) | corte |
| Golpe Descendente (lento, muito critico) | agachar + corte |
| Estocada (longo alcance, investida) | estocada |
| Rasteira | agachar + estocada |
| Golpe Aereo (corte em mergulho) | corte durante o pulo |
| Defesa (lamina na vertical) | defesa |

**Golpe critico:** cada golpe tem uma chance de critico (o Golpe Forte e o mais
arriscado). Um critico causa 40% a mais de dano e **derruba a espada** de quem
foi atingido. Sem espada o lutador nao ataca e defende pior (reduz 60% do dano
em vez de 88%). A espada cai no chao, longe do atacante, e so o dono pode pega-la
de volta caminhando ate ela (pulos atravessam o adversario). A CPU tambem
perde e recupera a espada. As espadas voltam todas no inicio de cada rodada.

A chance de critico de cada golpe fica em `SWORD_MOVES`
([characterData.js](src/characters/characterData.js)).

## Controles

**Teclado:** A/D movem, W pula, S agacha, F corte, G estocada, H defesa.
Remapeavel em **Configuracoes**. `Esc` pausa a luta (tambem pausa ao perder o
foco da janela).

**Toque:** os controles virtuais aparecem automaticamente em telas sensiveis
ao toque (ou force em Configuracoes → Controles). Esquerda move/pula/agacha,
direita ataca/defende. Segure AGACHAR e toque CORTE/ESTOC. para os golpes
agachados.

Uma tela de golpes aparece antes de cada luta.

## Estrutura do projeto

```
src/
  main.js                  ponto de entrada
  game/                    loop, renderizacao, colisao, combate, rodadas, IA, cenarios
  characters/              dados dos golpes, animacoes (poses) e logica do lutador
  controls/                teclado, toque e o InputManager que unifica os dois
  ui/                      menu, tela de golpes, HUD de luta, config, creditos
  audio/                   efeitos e musica sintetizados via Web Audio API
  styles/                  CSS por tela
  utils/                   constantes e wrapper de localStorage
```

## Como ajustar golpes e animacoes

- **Numeros dos golpes** (dano, tempos, alcance, chance de critico): `SWORD_MOVES`
  em `characterData.js`. Os dois lutadores compartilham o mesmo objeto.
- **Animacoes:** `characterAnimations.js` define poses-chave por estado
  (idle, andar, pular/cair, agachar, os 5 golpes, defesa, dano, vitoria, queda).
  A convencao de angulos esta no topo do arquivo. A duracao de cada quadro e o
  tempo ate o proximo, e o total de cada golpe deve bater com
  startup+active+recovery em `SWORD_MOVES` para a lamina chegar ao contato dentro
  da janela de acerto. Os pes sao aterrados automaticamente, entao agachar so
  precisa dos angulos das pernas.
- **Efeitos:** rastro da lamina (segue a ponta da espada), tremor de tela,
  faiscas, aneis de impacto, poeira nas investidas e hit-stop, tudo em
  `Renderer.js`/`Game.js`.
- **Cenarios:** `arenas.js` (dojo, patio do castelo, bambuzal), desenhados por codigo.
- **Desenho:** `CharacterSprite.js` desenha o boneco-palito e a espada
  (presa a mao da frente, inclinada para cima na guarda).

Para trocar os bonecos por sprite sheets de verdade, basta substituir a chamada a
`drawCharacter` em `Renderer.drawFighter()`; combate, IA e HUD nao dependem de
como o lutador e desenhado.

## Estado atual

Implementado: combate com espada, critico/desarme, IA com 3 dificuldades (a CPU
tambem corre para recuperar a espada), 3 arenas, efeitos de impacto com
hit-stop, audio sintetizado, controles de teclado remapeaveis e de toque,
pausa, recordes em `localStorage`.

Pendente: modo PVP local, animacao de vitoria elaborada (hoje e uma pose
simples), golpes especiais (removidos de proposito por enquanto) e arte final.
