# Terminal

Uma janela de terminal pequena (até 560 × 400 px; 380 px de altura no celular) que sai da cabeça do Tux, na home e em todas as páginas do blog (incluindo `/now/`).

- **Código:** [assets/js/terminal.js](../assets/js/terminal.js) e [assets/css/terminal.css](../assets/css/terminal.css). Os dois são carregados em `index.html` e no `layout()` de [api/blog.js](../api/blog.js).

## Como abrir e fechar
| Ação | Efeito |
| :--- | :--- |
| Clicar no Tux (ou Enter/Espaço nele) | Ele gira e o terminal abre ou fecha logo depois (evento `terminal:toggle`, disparado por `mascot.js`) |
| Tecla `` ` `` (a tecla física `Backquote`, que também funciona em layouts em que o acento é tecla morta) ou `Ctrl+K` | Alterna |
| Tecla `/` (fora de campos de texto) | Só abre, como nas buscas de outros sites |
| `Esc`, `Ctrl+K` dentro do campo, botão `x` ou o comando `exit` | Fecha |

## Posição
A janela fica acima da cabeça do Tux e o acompanha enquanto ele se move (um `requestAnimationFrame` só roda enquanto ela está aberta), sempre dentro da área visível (`visualViewport`, por causa do teclado do celular). Ao abrir, ela liga como um tubo de TV antigo (`termIn`): uma linha fina sai da cabeça do Tux (`transform-origin` e a propriedade `scale`), abre para cima com um leve estouro e assenta, enquanto as linhas de texto entram em cascata, em passos (`termLine`, com o atraso em `--d`). `transform: translate` só posiciona. Ao fechar, é só um fade rápido (120 ms), sem encolher de volta, já que ela pode estar longe do Tux. Sem mascote (404 do blog), ela sai do centro, embaixo.

A janela também pode ser arrastada pela barra de título (`tux@cotoo.dev: ~`): ela deixa de seguir o Tux e fica onde você a largar, sempre dentro da tela, mesmo se o Tux se mover ou a janela for fechada e reaberta. Um duplo clique na barra a devolve ao Tux. O movimento usa pointer events (mouse, toque e caneta) com `setPointerCapture`; durante o arrasto o texto da página não é selecionado e o pixel trail da home não desenha sobre o terminal.

Cliques, rolagem e teclas dentro do terminal não chegam à página (na home, um clique avançaria do hero para o menu).

## Comandos
`help`, `whoami`, `projects`, `stack`, `activity` (calendário de contribuições do GitHub, com quadrados em 5 tons como o heatmap da home), `blog`, `now` (mostra as seções de `/now` buscadas em `/now/?format=json`, com o link da página), `contact`, `open <home|blog|now|uses|rss|github|linkedin|slug-do-post>` (o Tab também completa os slugs dos posts), `theme [dark|light]` (dispara a mesma onda de dither do botão), `neofetch`, `party` (a [festa do Tux](mascot.md#party-konami-e-party)), `snake` (ver abaixo), `tux [reset | skin <nome>]` (devolve o Tux ao lugar depois de arrastado, ou mostra uma [skin](mascot.md#skins)), `clear` e `exit`. Também existem `sudo` e `rm`, fora do `help`.

### snake
`snake` abre o jogo da cobrinha numa linha do terminal: cada célula tem dois caracteres de largura (fica quadrada), o tamanho do tabuleiro se ajusta à janela (até 22 × 14) e a moldura é uma borda CSS na cor do texto, então vira com a onda do tema. A velocidade sobe a cada ponto e o recorde fica no `localStorage` (`snake-best`).

- **Teclado:** setas ou WASD viram, espaço (ou `P`) pausa, `Esc` sai do jogo sem fechar o terminal e, no fim de jogo, Enter joga de novo (qualquer outra tecla volta ao prompt). As teclas do jogo são tratadas na fase de captura do `window` e param ali, então a página (que usa as setas para trocar de seção na home) e o código Konami não as recebem.
- **Toque:** deslizar no tabuleiro vira, um toque pausa (ou recomeça no fim de jogo) e tocar no prompt sai do jogo. Só o tabuleiro tem `touch-action: none`; o resto do terminal e a página continuam rolando. O teclado do celular é fechado ao começar, para não cobrir o tabuleiro.
- Fechar o terminal ou começar a festa encerra o jogo; com a aba escondida ele não anda.

### Sistema de arquivos de mentira
`ls [pasta]`, `cd <pasta>`, `cat <arquivo>`, `tree` e `pwd` navegam por uma árvore montada a partir do conteúdo do site:

```
~
├── projects/   um .md por projeto (cat mostra nome, link e descrição)
├── blog/       um .md por post, buscado em /blog/?format=json
├── about.txt   = whoami
├── stack.txt   = stack
├── contact.txt = contact
└── now.md
```
`cd` aceita `..`, `~` e caminhos como `~/blog`, e o título da janela mostra a pasta atual (`tux@cotoo.dev: ~/projects`). `ls` sem argumento lista a pasta atual; `cd` sem argumento volta para `~`. Os posts são buscados uma vez, na primeira abertura.

### Autocomplete
- **Tab** completa o comando, o argumento (`open`, `theme`) ou o nome de arquivo/pasta (`cd`, `ls`, `cat`). Com vários candidatos, completa o prefixo comum; se não houver progresso, lista as opções. Com um comando já usado antes que comece igual ao que você digitou, o Tab aceita ele inteiro.
- **Sugestão em cinza** (estilo fish) depois do cursor: vem primeiro do histórico e depois dos comandos. **Seta →** (com o cursor no fim) ou Tab aceitam.
- `↑`/`↓` percorrem o histórico e `Ctrl+L` limpa.

Para adicionar um comando, inclua uma entrada em `commands` no `terminal.js` (`icon`, `desc`, `args` opcional e `run`). Os projetos e a stack ficam nas constantes `PROJECTS` e `STACK` no topo do arquivo.

### neofetch
Mostra o Tux em ASCII no meio das linhas de informação (ícone, chave em cor de destaque e valor) e a paleta de cores no fim; em telas estreitas as informações vão abaixo do pinguim. A saída começa sempre do topo. As linhas `visitas` (`GET /api/visits`, que não conta visita), `commit` (`/api/github`) e `posts` começam com `...` e são preenchidas quando as APIs respondem; as respostas ficam guardadas por 1 min (`getJson`). Se uma API falhar, o valor vira `indisponível`.

## Posição
A janela fica acima da cabeça do Tux e o acompanha enquanto ele se move (um `requestAnimationFrame` só roda enquanto ela está aberta), sempre dentro da área visível (`visualViewport`, por causa do teclado do celular). Ao abrir, ela cresce a partir da cabeça dele (`transform-origin` e a propriedade `scale`, na animação `termIn`), e `transform: translate` só posiciona. Ao fechar, é só um fade rápido (120 ms), sem encolher de volta, já que ela pode estar longe do Tux. Sem mascote (404 do blog), ela sai do centro, embaixo.

A janela também pode ser arrastada pela barra de título (`tux@cotoo.dev: ~`): ela deixa de seguir o Tux e fica onde você a largar, sempre dentro da tela, mesmo se o Tux se mover ou a janela for fechada e reaberta. Um duplo clique na barra a devolve ao Tux. O movimento usa pointer events (mouse, toque e caneta) com `setPointerCapture`.

Cliques, rolagem e teclas dentro do terminal não chegam à página (na home, um clique avançaria do hero para o menu).

## Comandos
`help`, `whoami`, `projects`, `stack`, `activity` (calendário de contribuições do GitHub em ASCII), `blog` (busca `/blog/?format=json`), `now`, `contact`, `open <home|blog|now|rss|github|linkedin>`, `theme [dark|light]`, `neofetch`, `party` (dispara o confete do Tux), `clear` e `exit`. Também existem `ls`, `pwd`, `sudo` e `rm`, fora do `help`. `Tab` completa comandos e argumentos, `↑`/`↓` percorrem o histórico e `Ctrl+L` limpa.

Para adicionar um comando, inclua uma entrada em `commands` no `terminal.js` (`desc`, `args` opcional e `run`). Os projetos e a stack ficam nas constantes `PROJECTS` e `STACK` no topo do arquivo.

## Fonte (Nerd Font)
O terminal usa a **Agave Nerd Font Mono**, em um subset woff2 de ~175 KB ([assets/fonts/AgaveNerdFontMono-subset.woff2](../assets/fonts/AgaveNerdFontMono-subset.woff2)): latim, setas, blocos, Powerline, Devicons e Font Awesome. A fonte só é baixada na primeira vez que o terminal abre (`document.fonts.load`); só então a classe `term-nf` entra na janela, mostrando os ícones (`.ico`), o prompt `❯` e o calendário em blocos (`·░▒▓█`). Sem a fonte, tudo continua legível: os ícones ficam ocultos, o prompt volta a ser `$` e o `activity` usa ASCII. A licença da Agave (MIT) está em [assets/fonts/AGAVE-LICENSE.txt](../assets/fonts/AGAVE-LICENSE.txt).

Os glifos ficam no objeto `NF` do `terminal.js`. Para regerar o subset (por exemplo, para incluir mais ícones), use o `pyftsubset` do fonttools sobre o `AgaveNerdFontMono-Regular.ttf` com os mesmos intervalos Unicode (`U+0020-007E, U+00A0-00FF, U+2013-2014, U+2018-201D, U+2022, U+2026, U+2190-2193, U+2500-259F, U+25A0-25FF, U+276F, U+E0A0-E0D7, U+E700-E7C5, U+F000-F2E0`) e `--flavor=woff2`.

## Tema
O fundo e a borda da janela são opacos, então durante a troca de tema ela usa o mesmo recurso dos títulos fixos do blog: duas camadas (`::before` com as cores antigas e `::after` com as novas, recortada por um círculo que acompanha a onda). `script.js` e `blog.js` definem `--tr-old-bg/fg`, `--tr-new-bg/fg` na raiz e `--wave-r/x/y` no `.term` a cada quadro. O texto (`.term-line`, `.term-title`, `.term-close`, `.term-prompt`, `.term-input`) são folhas do `elementsToFlip` nas duas páginas, então viram conforme a onda passa. O comando `theme` imprime a linha antes de clicar no botão, para que ela já exista quando a onda começar.
