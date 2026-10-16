# Heatmap de atividade

Na home, o menu tem a seção `// atividade no github`: um quadrado por dia, nas últimas 53 semanas, com 5 tons (nenhuma contribuição a muitas). Passar o mouse sobre um quadrado mostra o dia e a contagem na linha de baixo; o total do ano fica ali quando nada está em foco. A seção só aparece se a API responder.

- **API:** [api/contributions.js](../api/contributions.js) consulta o GraphQL do GitHub (`contributionsCollection.contributionCalendar`) com o `GITHUB_TOKEN` e devolve `{ total, weeks }`, em que cada dia é `[data, contagem, nível 0-4]`. Cache de borda `s-maxage=60, stale-while-revalidate=120`.
- **Front-end:** [assets/js/heatmap.js](../assets/js/heatmap.js) monta a grade (`#heatmap`) com quantas semanas cabem na coluna (as mais recentes), e refaz ao redimensionar. Os estilos estão na seção "GitHub activity heatmap" de [assets/css/style.css](../assets/css/style.css).
- **Terminal:** o comando `activity` desenha o mesmo calendário em ASCII (`. : + * #`).

## Tema
Cada quadrado é uma folha do `elementsToFlip` (`.heat-cell` em `script.js`): a cor vem de `currentColor` e o tom do `opacity`, então o quadrado vira quando a onda passa por ele. Os quadrados entram semana a semana com uma animação `steps()`, desligada com `prefers-reduced-motion`.

> O `GITHUB_TOKEN` precisa poder consultar o GraphQL. Se a consulta falhar, a seção simplesmente não aparece.
