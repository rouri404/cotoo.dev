<div align="center">
  <a href="https://cotoo.dev">
    <img src="assets/img/header.svg" alt="cotoo.dev" width="464">
  </a>
</div>

---

### Portfólio

Página pessoal interativa e minimalista desenvolvida por mim.

---

### Documentação

- [Guia do Blog](docs/blog.md): Como criar e gerenciar postagens em Markdown.
- [Mascote Tux](docs/mascot.md): Como funciona o Tux em ASCII 3D, o balão e como regerar o modelo.
- [Heatmap](docs/heatmap.md): O calendário de atividade do GitHub na home.
- [Terminal](docs/terminal.md): O terminal em pop-up que sai do Tux, seus comandos e a integração com o tema.

---

### Checagens locais

`scripts/check.js` abre o site num Chromium headless (desktop e iPhone 14) e confere fps e long tasks no hero, no menu, na troca de tema e no blog, o arrasto do Tux com mouse e toque, que ele não é arrastável no blog, a ausência de requisições ao Google Fonts e de erros na página. O `playwright-core` não é dependência do projeto:

```sh
npm i --no-save playwright-core && npx playwright-core install chromium
node scripts/check.js                            # sobe o vercel dev na porta 3111 e o derruba no fim
node scripts/check.js --url http://localhost:3111   # usa um servidor que já está rodando
```
