---
title: colophon
description: Como este site é feito, do código à hospedagem.
date: 2026-10-20
---

## A base

- **Sem framework:** HTML, CSS e JavaScript puros. Não há React, bundler nem etapa de build; o navegador recebe os arquivos como eles estão no repositório.
- **Hospedagem:** Vercel. As páginas estáticas saem direto da borda, e algumas funções serverless em `/api` cuidam do que é dinâmico.
- **Código aberto:** o repositório inteiro está no [GitHub](https://github.com/rouri404/cotoo.dev).

## O visual

- **Fontes:** Tiny5, uma fonte em pixel, e a Agave Nerd Font no terminal. As duas são servidas pelo próprio site, em subsets pequenos.
- **Troca de tema:** o botão de tema dispara uma onda de dither (uma matriz de Bayer 4×4 num `<canvas>`) que sai do canto superior direito. Cada elemento troca de cor no instante em que a onda passa por ele, e não todos de uma vez.
- **Hover dos projetos:** as letras de cada nome giram em 3D uma depois da outra e voltam na ordem contrária quando o mouse sai.

## O Tux

- **ASCII em 3D:** o pinguim é um modelo 3D de verdade, desenhado com caracteres num `<canvas>` por um rasterizador escrito à mão. Ele segue o mouse, pode ser arrastado e gira quando você clica nele.
- **Acessórios:** gorro no Natal, chapéu de bruxa no Halloween, orelhas de coelho na Páscoa, fone quando estou ouvindo música e touca de dormir de madrugada.
- **Terminal:** clicar no Tux, ou apertar `/`, abre um terminal com comandos como `projects`, `grep`, `music`, `neofetch` e até `snake`.

## Dados ao vivo

- **Spotify:** o widget da home mostra o que estou ouvindo agora, por uma função que renova o token da API do Spotify.
- **GitHub:** o calendário de atividade e o último commit vêm das APIs do GitHub, com cache curto na borda.
- **Visitas e leituras:** contadores no Redis (Upstash), um por site e um por post.
- **Status dos projetos:** os cards conferem se os sites dos projetos estão no ar.

## O blog

- **Markdown:** cada post é um arquivo `.md` no repositório. Uma função converte para HTML na hora do pedido e guarda o resultado no Redis e na borda, então o post só é processado de novo quando o arquivo muda.
- **Extras:** sumário com títulos que grudam no topo, blocos de código com destaque de sintaxe, diagramas Mermaid, feed RSS e um link `#` em cada seção.

## Cuidados

- **Desempenho:** um script com Playwright abre o site, mede os quadros por segundo das animações e acusa tarefas longas que travariam a página.
- **Movimento reduzido:** com `prefers-reduced-motion`, as animações dispensáveis ficam desligadas.
- **Privacidade:** não há rastreadores nem cookies de análise. O formulário de contato usa o Turnstile da Cloudflare contra spam.
