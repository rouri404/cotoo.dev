# Blog cotoo.dev

Para criar uma nova postagem no blog, basta adicionar um arquivo `.md` diretamente nesta pasta (`/blog/`).

## Formato do Post

O arquivo Markdown deve começar com o frontmatter YAML contendo os seguintes campos:

```markdown
---
title: Título do Artigo
description: Breve descrição ou resumo do post para os cards e meta tags de SEO.
date: 2026-10-12
tags: Docker, Containers, DevOps
slug: titulo-do-artigo
---

## Introdução

Escreva seu conteúdo normalmente em Markdown...
```

### Campos do Frontmatter
- **`title`**: Título principal da publicação.
- **`description`**: Resumo da publicação (usado nos cards de listagem e nas tags Open Graph / SEO).
- **`date`**: Data no formato `YYYY-MM-DD` (usada para ordenação cronológica decrescente).
- **`tags`**: Tags separadas por vírgula.
- **`slug`**: Identificador da URL (ex: `slug: meu-post` gerará a página em `/blog/meu-post/`).

---

## Callouts & Alertas do GitHub

Você pode usar as tags de alerta nativas do GitHub Flavored Markdown (com suporte a ícones em pixel art e temas dark/light):

```markdown
> [!NOTE]
> Informação útil que vale a pena destacar.

> [!TIP]
> Uma dica prática para melhorar o fluxo de trabalho.

> [!IMPORTANT]
> Informação crucial que não deve ser ignorada.

> [!WARNING]
> Aviso importante para evitar problemas ou erros comuns.

> [!CAUTION]
> Alerta de risco ou cuidado redobrado em ações perigosas.
```

---

## Como Publicar

Os posts são renderizados dinamicamente via serverless (`api/blog.js`) e cacheados em memória / Edge. Basta criar ou editar o arquivo `.md` nesta pasta e fazer o commit/push.

Para o guia detalhado com todas as opções de frontmatter, callouts e arquitetura, veja [`docs/blog.md`](../docs/blog.md).

