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

### Arrastar e voltar ao lugar
No hero da home (e só lá, em telas com pelo menos 560 px de altura) o Tux pode ser arrastado com mouse ou toque: um movimento de alguns pixels (6 com mouse, 12 com o dedo) o pega, e um clique parado continua abrindo o terminal. Ele fica onde foi solto, guardado como fração do espaço livre em `sessionStorage` (`mascot-perch`), até a aba fechar; o menu e o blog sempre o mandam para o lugar próprio deles.

Para devolvê-lo ao lugar padrão: **duplo clique** nele ou `tux reset` no [terminal](terminal.md) (evento `mascot:reset`). O duplo clique não mexe no terminal: o toggle agendado pelo primeiro clique é cancelado (ou desfeito, se já tiver rodado), então o terminal fica como estava antes.

### Reações
Um comentário curto toma o balão por alguns segundos (`say(texto, ms)` em `mascot.js`; a nuvem é redimensionada e o texto é digitado de novo). Quando um comentário substitui outro com o balão aberto, a nuvem esmaece e encolhe um pouco (~170 ms, classe `is-swapping`), troca texto e formato sem ser vista e volta com o efeito de entrada; ao sair, as palavras ficam até a nuvem sumir, para ela nunca aparecer vazia. Com `prefers-reduced-motion` a troca é direta. Ele aparece onde o Tux estiver, desde que haja espaço, e na home o link do repositório só vale para o texto próprio dele.

| Quando | Fala |
| :--- | :--- |
| Primeira aparição da visita (uma vez por sessão, `mascot-greeted`) | Saudação pela hora local: "madrugada, hein?..." (0-6 h), "bom dia!..." (6-12 h), "boa tarde!..." (12-18 h) ou "boa noite!..." |
| 45 s sem nenhum input (mouse, teclado, rolagem, toque; inclusive no terminal); de madrugada (0-6 h) bastam 20 s | Dorme: cabeça baixa respirando e "zzz..." no balão até você voltar |
| Voltou depois de dormir | Gira e diz "opa, voltou amigao? o.O" (de madrugada: "hm? tava cochilando...") |
| Música nova no widget do Spotify da home | "ouvindo <música>? boa escolha :)" e, enquanto a música toca, balança a cabeça de leve (~120 bpm) |
| Posts longos (mais de 2 telas): passou da metade | "metade do post, segura aí :)" |
| Posts longos: chegou ao fim | "acabou! bora pro próximo?" |
| Clicou em "copiar" num bloco de código | "copiou! confere antes de rodar ;)" |

As reações de leitura valem só nos posts (não em `/now`) e disparam uma vez por visita. A saudação e a música não aparecem no menu da home, onde o balão é o do repositório; se chegarem juntas, uma espera a outra terminar (`sayNext`). O estado do Spotify chega pelo evento `spotify:update` (`detail: { playing, title, artist }`), disparado por `script.js` a cada consulta. Com `prefers-reduced-motion` ele não gira ao acordar. Os textos ficam em `mascot.js`.

### Party (Konami e `party`)
Digitar `↑ ↑ ↓ ↓ ← → ← → B A` (fora de campos de texto) ou rodar `party` no [terminal](terminal.md) (também vale `window.dispatchEvent(new Event("mascot:party"))`) dispara uma festa de 8 s, ao ritmo de 126 bpm (`BEAT_MS` em `mascot.js`). Com `prefers-reduced-motion` nada acontece, e só roda uma por vez.

- **Tux:** vai para o meio da tela e cresce até ~76% da altura, deixando o alto da tela para a bola de espelhos e o letreiro. Como o canvas é ASCII, o tamanho real muda (o ASCII fica nítido) e só a transição entre os tamanhos é um `scale` de CSS (`growTux`/`shrinkTux`, mantendo o centro). Por isso o `layout()` mede o canvas com `offsetWidth`/`offsetHeight` e não com `getBoundingClientRect`, que incluiria o `scale` e criaria um bitmap pequeno, depois esticado. Na festa ele ganha caracteres em vez de letras maiores: o tamanho da célula é o mesmo do Tux normal (mínimo de 5 px), então a grade passa de ~56 para ~140 colunas. Ele é desenhado claro sobre escuro, mesmo no tema claro, com as cores dele só mais claras (corpo claro, barriga branca, bico e pés amarelos). Pula no tempo, balança, dá um giro a cada 8 batidas e uma cambalhota a cada 16.
- **Saída:** nos últimos 900 ms (`LEAVE_MS`) ele encolhe e volta ao lugar dele enquanto as luzes se apagam; 400 ms antes do fim (`LOOK_END_MS`) a aparência da festa é desfeita, com a tela ainda meio escura, e só então o tamanho real volta ao normal. Enquanto ainda está grande, o alvo é calculado como se ele já fosse pequeno, com o mesmo centro, para nada deslizar.
- **Luzes:** [assets/js/party.js](../assets/js/party.js) desenha, num canvas de baixa resolução (cada pixel vira ~3-5 px da tela), a tela escurecida e cada elemento no seu canto, para não competirem: o letreiro "PARTY TIME" no alto e, acima dele, uma bola de espelhos pendurada com brilhos espalhados pela sala; 4 raios suaves saindo dos cantos de cima e mirando o Tux; a pista de dança xadrez embaixo, que inverte a cada batida; um equalizador em cada canto de baixo; quatro Tuxes em pixel dançando na pista (só em telas largas); um anel que sai do Tux; confete; e um flash discreto a cada 8 batidas. Cada festa sorteia um "clima" de três cores (rave, disco ou neon) e usa só elas, então a tela nunca vira um arco-íris. O canvas (`.party-lights`) fica acima da página, abaixo do Tux (40) e do terminal (500); as cores são neon fixos, então nada ali depende do tema. Em telas estreitas há menos confete e raios mais curtos.
- **Som:** uma batida de 126 bpm sintetizada no navegador (WebAudio: bumbo, palma, chimbal, baixo e acordes), sem arquivos de áudio e alinhada à dança. Vem ligada onde há mouse e desligada no toque; o botão "som: on/off" no canto de cima lembra a escolha em `localStorage` (`party-sound`). Se o navegador bloquear o áudio, o botão mostra "off".
- **Interação:** tocar ou clicar na tela joga confete naquele ponto e acende os raios por um instante. `Esc` ou o botão "sair" encerram antes: o Tux encolhe e volta em ~0,9 s (evento `party:stop`).
- **Resto da página:** some com um fade de 0,5 s (`body.party-on`, e `party-ending` na volta): cabeçalho, contador, widgets, texto e o terminal (`is-party-hidden`, sem perder o histórico), que volta crescendo do Tux no fim. Só ficam o Tux, as luzes e o confete. O Tux não fala durante a festa; no fim ele diz "valeu a festa!".
- **Eventos:** `party:start` (com `detail.ms`) e `party:end` no `window`.

### Skins
O Tux pode ganhar um acessório, feito de geometria extra somada ao modelo (`buildSkin`/`withSkin` em `mascot.js`), então ele é desenhado pelo mesmo rasterizador ASCII, gira junto com a cabeça e não custa nada perceptível (poucas centenas de vértices a mais; 60 fps com a CPU 4× mais lenta). Cinco seguem o calendário (a `festa` só no aniversário), uma segue o relógio e as outras só aparecem quando você pede (ou, no caso do `fone`, quando há música tocando).

| Skin | Quando (data local) | Desenho |
| :--- | :--- | :--- |
| `natal` | 1º de dezembro a 6 de janeiro | Gorro de Papai Noel vermelho (`--mascot-red`, material 3), com a faixa e o pompom brancos |
| `halloween` | 20 de outubro a 2 de novembro | Chapéu de bruxa preto, de aba larga e ponta dobrada para trás |
| `pascoa` | semana da Páscoa (7 dias antes até 1 dia depois do domingo, calculado por ano) | Orelhas de coelho brancas, com o forro na cor de destaque |
| `junina` | junho | Chapéu de palha (cor de destaque) com faixa vermelha |
| `formatura` | só por pedido | Capelo preto, com botão e uma borla pendurada de um lado |
| `fone` | por pedido e sempre que o Spotify mostra música tocando | Fones de ouvido brancos: arco sobre a cabeça e uma concha em cada orelha |
| `coroa` | só por pedido | Coroa de ouro (cor de destaque) com cinco pontas e contas brancas |
| `festa` | 27 de abril (aniversário do dono, o dia todo, com um balão de parabéns na saudação) e por pedido | Chapéu de festa listrado de vermelho e branco, inclinado, com pompom |
| `sono` | da meia-noite às 6h (hora local), por cima do calendário | Touca de dormir listrada de branco e cor de destaque, que sobe e cai para o lado, com pompom |
| `rainbow` | só por pedido | Sem acessório: as penas pretas (material 0) são pintadas em listras diagonais de arco-íris que correm pelo corpo (uma volta a cada 3 s, paradas com `prefers-reduced-motion`). As cores vêm de `RAINBOW` em `mascot.js`, mais escuras no tema claro e mais claras no escuro, e trocam com a onda junto com o `data-theme` do canvas |

Enquanto o widget do Spotify (home) informa que há música tocando, o Tux usa o `fone` por cima do calendário e da touca; a skin pedida no terminal ganha dos dois. O último aviso fica em `sessionStorage` `mascot-music` por 5 minutos, para o fone continuar no blog, onde o widget não existe. Para ver uma skin fora da data, use `tux skin <nome>` no [terminal](terminal.md); `nenhuma` tira a skin e `auto` volta ao calendário (vale até a aba fechar, em `sessionStorage` `mascot-skin`). A cor vermelha tem uma variável para cada tema em `mascot.css`, então vira com a onda como o resto do Tux. Para criar outra, acrescente o nome em `SKINS` (e em `SKIN_NAMES` no `terminal.js`) e um bloco em `buildSkin`, usando as formas já prontas (`sphere`, `cone`, `wall`, `ring`, `slab`) e os materiais 0 (preto), 1 (branco), 2 (destaque) e 3 (vermelho).

### Posição e escala
O Tux é posicionado com a propriedade CSS `translate` (e não com `transform`), e o terminal também. As propriedades individuais se aplicam na ordem `translate`, `rotate`, `scale` e só então `transform`, então um `scale` junto de `transform: translate()` escalaria também a posição, fazendo o elemento deslizar enquanto cresce ou encolhe.

## Tema
O canvas lê a cor do texto e as variáveis `--mascot-white` e `--mascot-accent` (bico e pés, em verde-limão) a cada quadro. O `.mascot` e o balão estão no `elementsToFlip` de `script.js` e de `blog.js`, e o fundo do balão fica transparente durante a transição (ver a seção 4 do `AGENTS.md`).
