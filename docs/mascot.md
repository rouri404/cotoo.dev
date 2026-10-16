# Mascote (Tux)

O Tux é um modelo 3D desenhado com caracteres ASCII num `<canvas>`, presente na home e no blog.

- **Código:** [assets/js/mascot.js](../assets/js/mascot.js) (carregado nas duas áreas) e [assets/css/mascot.css](../assets/css/mascot.css).
- **Modelo:** `assets/models/tux.bin`, gerado por `node scripts/build-tux-model.js 40` a partir de `scripts/models/tux.glb`. Detalhes em [assets/models/README.md](../assets/models/README.md).

## Como ele se move
O mascote é uma camada `position: fixed` que o script desloca com `transform`, deslizando entre estas posições:

| Onde | Posição |
| :--- | :--- |
| Home, hero | Embaixo, no centro |
| Home, menu | No fim da página (segue o bloco `.mascot-spot` ao rolar), com um balão que leva ao repositório (ver abaixo) |
| Blog (índice e posts) | Canto inferior esquerdo, onde não atrapalha (o sumário dos posts fica à direita); em telas estreitas, no fim da página |

As páginas são documentos separados, então a última posição vai para o `sessionStorage` ao sair (`pagehide`) e a página seguinte continua dali, por até 8 s. Isso faz o Tux "andar" da home para o blog.

## Balão
No índice do blog (`/blog/`) há um segundo balão, sem link: "bora ler um post? escolhe um aí :)". Ele fica quase em cima da cabeça (72°) e só aparece se couber no espaço livre à esquerda do texto. Ao clicar num post ele some com a transição de saída (~320 ms) e só então a página muda; dentro do post ele não tem texto próprio, só os comentários da seção "Reações" abaixo.

É um balão de pensamento em pixel art: uma nuvem (elipse com "gomos" redondos na borda) feita de células de 2 px (a mesma espessura das bordas do site), desenhada em SVG com `crispEdges`, ligada à cabeça por três bolinhas que diminuem. Fica em cima e ao lado da cabeça, a uns 38° dela, no lado direito, e passa para o esquerdo se não houver espaço. O texto ("curtiu o site? da uma estrelinha lá :p") é digitado só na primeira vez em que aparece: abrir e fechar o formulário de contato mexe na página, mas não reinicia a digitação.

## Interações
Segue o cursor, gira ao clicar (ou com Enter/Espaço), abrindo ou fechando o [terminal](terminal.md) logo depois, e dá uma cambalhota ao trocar o tema. O canvas é 60% maior que a caixa dele (margem transparente em volta), para o pulo e a cambalhota caberem inteiros sem encolher o Tux; a área clicável (`.mascot-hit`) tem só o tamanho da caixa, então a margem não bloqueia cliques no conteúdo ao redor. Com `prefers-reduced-motion` fica parado e o balão aparece sem digitar. Se o arquivo do modelo não carregar, a camada é removida.

### Reações
Um comentário curto toma o balão por alguns segundos (`say(texto, ms)` em `mascot.js`; a nuvem é redimensionada e o texto é digitado de novo). Ele aparece onde o Tux estiver, desde que haja espaço, e na home o link do repositório só vale para o texto próprio dele.

| Quando | Fala |
| :--- | :--- |
| 45 s sem nenhum input (mouse, teclado, rolagem, toque; inclusive no terminal) | Dorme: cabeça baixa respirando e "zzz..." no balão até você voltar |
| Voltou depois de dormir | Gira e diz "ué, voltou? :)" |
| Posts longos (mais de 2 telas): passou da metade | "metade do post, segura aí :)" |
| Posts longos: chegou ao fim | "acabou! bora pro próximo?" |
| Clicou em "copiar" num bloco de código | "copiou! confere antes de rodar ;)" |

As reações de leitura valem só nos posts (não em `/now`) e disparam uma vez por visita. Com `prefers-reduced-motion` ele não gira ao acordar. Os textos ficam em `mascot.js`.

### Easter egg (Konami)
Digitar `↑ ↑ ↓ ↓ ← → ← → B A` (fora de campos de texto) faz o Tux girar três vezes, dar três pulinhos e soltar confete. O mesmo efeito dispara com `window.dispatchEvent(new Event("mascot:party"))`. O confete são 36 quadrados de 6 px (`.mascot-confetti`) cujas cores são copiadas do tema no início da explosão; eles somem em menos de 2 s, então não entram no `elementsToFlip`. Com `prefers-reduced-motion` nada acontece.

## Tema
O canvas lê a cor do texto e as variáveis `--mascot-white` e `--mascot-accent` (bico e pés, em verde-limão) a cada quadro. O `.mascot` e o balão estão no `elementsToFlip` de `script.js` e de `blog.js`, e o fundo do balão fica transparente durante a transição (ver a seção 4 do `AGENTS.md`).
