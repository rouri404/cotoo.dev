---
title: Post de Teste: Demonstração e Componentes
description: Publicação de teste com texto genérico, imagens, tabelas, blocos de código e alertas do GitHub.
date: 2026-10-11
tags: Demonstração, Teste, Pixel Art, Componentes
slug: post-exemplo
---

## Introdução

Este é um post de demonstração para testar todos os elementos visuais, blocos de código, tabelas, imagens e alertas disponíveis na renderização do blog.

![Header cotoo.dev](/assets/img/header.svg)

---

## Alertas do GitHub (Callouts)

Abaixo estão os cinco tipos de alertas disponíveis, estilizados com ícones em pixel art:

> [!NOTE]
> Esta é uma **Nota** de esclarecimento. Use para informações contextuais que auxiliam na compreensão do conteúdo.

> [!TIP]
> Esta é uma **Dica** útil. Dicas práticas ajudam os desenvolvedores a otimizar seu fluxo diário de trabalho.

> [!IMPORTANT]
> Este é um aviso **Importante**. Informações cruciais que afetam o resultado das operações devem ser destacadas assim.

> [!WARNING]
> Este é um **Aviso** de atenção. Sinaliza armadilhas comuns, comportamentos inesperados ou pré-requisitos não atendidos.

> [!CAUTION]
> Este é um alerta de **Cuidado**. Use para advertir sobre riscos de perda irreversível de dados, brechas ou falhas graves.

---

## Blocos de Código e Copiar Comandos

Cada bloco de código exibe a linguagem no cabeçalho e possui um botão retrô para copiar comandos:

```bash
# Atualizar repositórios e instalar dependências
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh   # Script oficial de instalação
sudo usermod -aG docker $USER            # Permissão sem sudo
```

Outro exemplo em JavaScript:

```javascript
// Exemplo de debounce em JavaScript vanilla
function debounce(fn, delay = 200) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

E um arquivo de configuração Docker Compose:

```yaml
version: "3.8"
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    restart: always
```

---

## Imagens e Mídia

As imagens são responsivas e adaptadas ao layout centralizado:

![Ícone do Projeto](/assets/img/favicon.png)

---

## Tabelas Comparativas

As tabelas contam com barra de rolagem horizontal responsiva quando necessário:

| Comando | Descrição | Escopo |
| :--- | :--- | :--- |
| `docker run` | Cria e inicia um novo container | Instância |
| `docker ps -a` | Lista todos os containers locais | Sistema |
| `docker compose up` | Sobe múltiplos serviços coordenados | Orquestração |
| `docker system prune` | Remove recursos órfãos e limpa disco | Manutenção |

---

## Listas e Formatações

- Item de lista com texto em **negrito** e *itálico*.
- Suporte a comandos inline como `docker ps` e links externos como [Docker Docs](https://docs.docker.com).
- Subitens aninhados:
  - Nível 2 com informação detalhada.
  - Outro detalhe com código `npm run build`.

1. Primeiro passo da execução.
2. Segundo passo com validação de saída.
3. Terceiro passo com conclusão bem-sucedida.
