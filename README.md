# BR FIGHTER — Duelo de Poder

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
- **PVP** — marcado como "Em breve" (botao desativado).

Nao ha selecao de personagem: todos os lutadores sao iguais (bonecos-palito
pretos). Voce e o "Jogador" a esquerda, o adversario e a "CPU".

## Golpes e espada

| Golpe | Comando |
|---|---|
| Golpe Rapido | soco |
| Golpe Forte | agachar + soco |
| Estocada (avanca) | chute |
| Golpe Baixo | agachar + chute |
| Defesa | defesa |

**Golpe critico:** cada golpe tem uma chance de critico (o Golpe Forte e o mais
arriscado). Um critico causa 40% a mais de dano e **derruba a espada** de quem
foi atingido. Sem espada o lutador nao ataca e defende pior (reduz 60% do dano
em vez de 88%). A espada cai no chao, longe do atacante, e so o dono pode pega-la
de volta caminhando ate ela (pulos atravessam o adversario). A CPU tambem
perde e recupera a espada. As espadas voltam todas no inicio de cada rodada.

A chance de critico de cada golpe fica em `SWORD_MOVES`
([characterData.js](src/characters/characterData.js)).

## Controles

**Teclado:** A/D movem, W pula, S agacha, F soco, G chute, H defesa.
Remapeavel em **Configuracoes**. `Esc` pausa a luta (tambem pausa ao perder o
foco da janela).

**Toque:** os controles virtuais aparecem automaticamente em telas sensiveis
ao toque (ou force em Configuracoes → Controles). Esquerda move/pula/agacha,
direita ataca/defende. Segure AGACHAR e toque SOCO/CHUTE para os golpes
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
- **Animacoes:** `characterAnimations.js` define poses-chave (angulos de
  ombro/cotovelo/quadril/joelho) por estado — `idle`, `walk_forward`, `jump`,
  `crouch`, `slash`, `heavySlash`, `thrust`, `lowSlash`, `block`, `hitstun`,
  `win`, `lose`. O renderer interpola suavemente entre as poses.
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
