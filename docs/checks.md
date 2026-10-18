# Checagens locais

`scripts/check.js` é um teste de fumaça e desempenho do site, rodado num Chromium headless com `playwright-core`.

## O que confere

Em desktop (1280x800) e iPhone 14 (com toque):

- fps e long tasks no hero, no menu, na troca de tema e no blog;
- o arrasto do Tux com mouse e com toque, sem abrir o terminal;
- que o Tux não é arrastável no blog;
- que um clique nele abre o terminal;
- a ausência de requisições ao Google Fonts;
- a ausência de erros não tratados na página (o erro 600010 do Cloudflare Turnstile é ruído local e é ignorado).

O script sai com código 1 quando alguma checagem falha.

## Como rodar

O `playwright-core` não é dependência do projeto, então é instalado sem mexer no `package.json`:

```sh
npm i --no-save playwright-core && npx playwright-core install chromium
node scripts/check.js                               # sobe o vercel dev na porta 3111 e o derruba no fim
node scripts/check.js --url http://localhost:3111   # usa um servidor que já está rodando
node scripts/check.js --port 3200                   # outra porta para o servidor que ele sobe
```

## Limites

Os limites ficam no topo do script: `MIN_FPS` (50) e `MAX_LONG_TASK_MS` (100). Eles medem o Chromium da máquina onde o script roda, então servem para pegar regressões, não como números absolutos.
