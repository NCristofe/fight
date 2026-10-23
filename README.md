# BR FIGHTER — Duelo de Poder

Jogo de luta 2D retrô para navegador, satira ficticia e nao-oficial da politica
brasileira. HTML5 Canvas + JavaScript moderno, sem frameworks de UI — apenas
Vite como servidor de desenvolvimento/build.

> **Aviso:** personagens, falas e golpes sao ficticios e feitos para fins de
> comedia e entretenimento. Nenhum evento aqui representa um fato real, e
> nenhuma imagem real de qualquer pessoa e usada — todos os lutadores sao
> silhuetas vetoriais originais.

## Como rodar

```bash
npm install
npm run dev       # servidor de desenvolvimento (http://localhost:5173)
npm run build      # build de producao em dist/
npm run preview    # serve o build de producao localmente
```

Requer Node.js 18+.

## Controles

Golpes basicos (iguais para os dois jogadores e para a CPU): **Jab** (soco),
**Gancho** (agachar + soco), **Chute Alto** (chute), **Chute Baixo** (agachar
+ chute) e **Defesa**. Uma tela simples com essa lista aparece antes de cada
luta, com as teclas de cada jogador.

**Jogador 1 (teclado):** A/D movem, W pula, S agacha, F soco, G chute,
H defesa.

**Jogador 2 (teclado):** setas movem/pulam/agacham, J soco, K chute,
L defesa.

Ambos os mapeamentos podem ser alterados em **Configuracoes**.

**Toque:** em dispositivos com tela sensivel ao toque os controles virtuais
aparecem automaticamente (configuravel em Configuracoes → Controles). Lado
esquerdo move/pula/agacha, lado direito ataca/defende. Em uma partida local
de 2 jogadores no mesmo celular, cada jogador recebe um conjunto compacto
de botoes no seu lado da tela.

`Esc` pausa a luta a qualquer momento (tambem pausa automaticamente ao
perder o foco da janela/aba).

## Estrutura do projeto

```
src/
  main.js                  ponto de entrada
  game/                    loop, renderizacao, colisao, combate, rodadas, IA, cenarios
  characters/               dados, rig/animacao e logica dos lutadores
  controls/                 teclado, toque e o InputManager que unifica os dois
  ui/                       telas de menu, selecao, HUD de luta, config, creditos
  audio/                    efeitos e musica sintetizados via Web Audio API
  styles/                   CSS por tela
  utils/                    constantes e wrapper de localStorage
```

Cada sistema de jogo (combate, colisao, rodadas, IA) e independente dos
outros e so conversa atraves de dados simples (objetos `Character`, eventos
de hit, etc.), entao e seguro mexer em um sem quebrar os demais.

## Como adicionar um personagem ou golpe

Tudo que diferencia um lutador vive em
[`src/characters/characterData.js`](src/characters/characterData.js): um
objeto com `id`, `name`, `title`, `bio`, `stats` (vida, velocidade, forca,
defesa) e `moves`. Hoje todo personagem usa o mesmo conjunto basico de
golpes (`BASIC_MOVES` no topo do arquivo: `jab`, `hook`, `highKick`,
`lowKick`), cada um com dano, tempos de `startup`/`active`/`recovery` e
alcance — e e so o que CombatSystem/Character leem, entao e seguro trocar
os numeros ou dar a um personagem um `moves` proprio (copiando e editando
`BASIC_MOVES`) sem tocar no sistema de combate.

Para adicionar um personagem novo, basta copiar um bloco existente, trocar
os valores e adicionar o objeto ao array `CHARACTERS`. Ele aparece
automaticamente na tela de selecao e funciona com toda a logica de
combate, IA e HUD.

Golpes especiais/energia existiam numa versao anterior do projeto e foram
removidos de propósito para manter o combate simples por enquanto — a
infraestrutura (projeteis, contra-ataques, barra de energia) ainda existe
em `CombatSystem.js`/`Character.js` e pode ser religada depois.

## Substituindo os bonecos-palito por arte definitiva

Os lutadores hoje sao bonecos-palito pretos genericos desenhados em tempo
real por um "rig" vetorial (`src/characters/CharacterSprite.js` +
`characterAnimations.js`): um boneco de linhas com membros que giram
conforme poses pre-definidas por estado (`idle`, `jab`, `hook`,
`highKick`, `lowKick`, etc.), interpoladas suavemente quadro a quadro. Isso
evita retangulos coloridos estaticos e ja anima tudo, mas é propositalmente
generico — o ponto certo para plugar sprites de pixel art definitivos.

Para trocar por sprite sheets reais:

1. Crie um `SpriteRenderer` alternativo que, dado `(characterId, state,
   frameIndex)`, desenhe a imagem correta de uma sprite sheet carregada em
   `assets/sprites/`.
2. Em `Renderer.drawFighter()`, troque a chamada a `drawCharacter(...)`
   (modo vetorial) pela chamada ao novo renderer quando uma sprite sheet
   existir para aquele personagem — pode manter o rig vetorial como
   fallback para personagens sem arte ainda.
3. `characterAnimations.js` ja descreve duracao de cada frame por estado;
   reaproveite esses tempos para sincronizar a sprite sheet.

Nenhum outro sistema (combate, colisao, IA, HUD) depende da forma como o
personagem e desenhado, entao essa troca e isolada ao Renderer.

## Funcionalidades implementadas

- Menu principal, selecao de personagens (estilo KOF, com dois cursores
  independentes para 2 jogadores), tela de golpes basicos antes da luta,
  HUD de luta, configuracoes e creditos.
- Movimento, pulo, agachar, 4 golpes basicos (jab, gancho, chute alto,
  chute baixo), defesa (com dano reduzido), combos simples por janela de
  tempo.
- Efeitos de impacto (particulas, faiscas, ondas de choque) e um pequeno
  "hit-stop" (congelamento breve no momento do golpe) para dar peso aos
  acertos.
- Sistema de rodadas (melhor de 3), cronometro, mensagens de
  ROUND/FIGHT/K.O./VITORIA, modo Treinamento com rodadas infinitas.
- IA com 3 dificuldades (reacao, agressividade e chance de bloqueio
  diferentes — nao apenas vida extra).
- 4 personagens jogaveis (Lula, Bolsonaro, Marina Silva, Ciro Gomes),
  arquitetura pronta para novos.
- 3 arenas originais com camadas de fundo animadas.
- Audio 100% sintetizado (efeitos e musica), sem arquivos externos.
- Controles de teclado remapeaveis e controles de toque multi-touch,
  com deteccao automatica de dispositivo.
- Configuracoes e recordes persistidos em `localStorage`.
- Pausa automatica ao perder o foco da janela/aba.

## O que ainda depende de recursos externos

- **Arte final (pixel art).** Os personagens e cenarios atuais sao
  bonecos-palito/silhuetas vetoriais proprias, claramente provisórias (ver
  secao acima para o caminho de substituicao).
- **Golpes especiais e barra de energia.** Removidos de propósito nesta
  passada para manter o combate simples; a base (projeteis, contra-ataque)
  continua no codigo para religar depois.
- **Trilha sonora/efeitos "de verdade".** Hoje tudo e sintetizado via
  Web Audio API; trocar por arquivos `.mp3`/`.ogg` compostos originalmente
  so exige carrega-los em `AudioManager` no lugar das chamadas a
  `tone()`/`noise()`.
- **Mais personagens e arenas** (Alckmin e outros arquétipos) — a
  arquitetura ja suporta, falta so escrever os dados.
