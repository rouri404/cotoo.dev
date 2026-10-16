// /now page: fills the live block with the current song and the last commit
(function () {
  const music = document.getElementById("nowMusic");
  const commit = document.getElementById("nowCommit");
  if (!music || !commit) return;

  const ago = (iso) => {
    const min = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (min < 1) return "agora mesmo";
    if (min < 60) return `${min}m atrás`;
    if (min < 1440) return `${Math.floor(min / 60)}h atrás`;
    return `${Math.floor(min / 1440)}d atrás`;
  };

  const show = (el, label, value) => {
    el.textContent = `${label}: `;
    el.append(value);
    el.hidden = false;
  };

  fetch("/api/spotify")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((s) => {
      if (!s.is_playing) return show(music, "ouvindo", "nada tocando agora");
      const a = document.createElement("a");
      a.href = s.songUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = `${s.title} — ${s.artist}`;
      show(music, "ouvindo", a);
    })
    .catch(() => {});

  fetch("/api/github")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((g) => {
      if (g.found) show(commit, "último commit", `${g.repo}, ${ago(g.created_at)}`);
    })
    .catch(() => {});
})();
