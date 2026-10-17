// GitHub activity heatmap on the home menu: one square per day, drawn from /api/contributions
(function () {
  const section = document.getElementById("activitySection");
  const grid = document.getElementById("heatmap");
  const info = document.getElementById("heatmapInfo");
  if (!section || !grid || !info) return;

  const CELL = 10;
  const GAP = 3;
  const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  let data = null;
  let shown = 0;
  let summary = "";

  const label = ([date, count]) => {
    const [, m, d] = date.split("-").map(Number);
    return `${count === 0 ? "nenhuma contribuição" : count === 1 ? "1 contribuição" : count + " contribuições"} em ${d} de ${MONTHS[m - 1]}`;
  };

  function render() {
    const room = grid.parentElement.clientWidth;
    const fit = Math.max(8, Math.min(data.weeks.length, Math.floor((room + GAP) / (CELL + GAP))));
    if (fit === shown) return;
    shown = fit;

    const weeks = data.weeks.slice(-fit);
    const frag = document.createDocumentFragment();
    weeks.forEach((week, w) => {
      week.forEach((day) => {
        const cell = document.createElement("i");
        cell.className = "heat-cell";
        cell.dataset.level = day[2];
        cell.dataset.info = label(day);
        cell.style.setProperty("--w", w);
        // Weeks run Sunday to Saturday, but the first and the current one can be partial
        cell.style.gridRow = new Date(day[0] + "T12:00:00").getDay() + 1;
        frag.appendChild(cell);
      });
    });
    grid.replaceChildren(frag);
    grid.style.setProperty("--weeks", fit);
    const first = weeks[0][0][0].split("-");
    summary = `${data.total} contribuições no último ano`;
    info.textContent = summary;
    grid.setAttribute("aria-label", `${summary}, exibindo desde ${first[2]}/${first[1]}`);
  }

  grid.addEventListener("pointerover", (e) => {
    if (e.target.classList.contains("heat-cell")) info.textContent = e.target.dataset.info;
  });
  // A touch pointer "leaves" as soon as the finger lifts, so the day stays until the next tap elsewhere
  grid.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "touch") info.textContent = summary;
  });
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" && !grid.contains(e.target)) info.textContent = summary;
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => data && !section.hidden && render(), 150);
  });

  fetch("/api/contributions")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((json) => {
      if (!json.weeks || !json.weeks.length) return;
      data = json;
      section.hidden = false;
      render();
    })
    .catch(() => {});
})();
