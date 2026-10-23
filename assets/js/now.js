// /now page: live clock, degree progress bar, current Spotify track and latest GitHub commit
(function () {
  const music = document.getElementById("nowMusic");
  const commit = document.getElementById("nowCommit");
  if (!music || !commit) return;

  const ago = (iso) => {
    const min = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (min < 1) return tr("agora mesmo");
    if (min < 60) return tr("{n}m atrás", { n: min });
    if (min < 1440) return tr("{n}h atrás", { n: Math.floor(min / 60) });
    return tr("{n}d atrás", { n: Math.floor(min / 1440) });
  };

  // 1. Relative age next to the "Updated on" date in the header
  const updatedEl = document.getElementById("nowUpdated");
  const updatedAgoEl = document.getElementById("nowUpdatedAgo");
  if (updatedEl && updatedAgoEl) {
    const raw = updatedEl.getAttribute("datetime");
    if (raw) {
      const [y, m, d] = raw.split("-").map(Number);
      const now = new Date();
      const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const dateUtc = Date.UTC(y, (m || 1) - 1, d || 1);
      const days = Math.max(0, Math.floor((todayUtc - dateUtc) / 86400000));
      const label = days === 0 ? tr("hoje") : days === 1 ? tr("ontem") : days <= 90 ? tr("{n}d atrás", { n: days }) : "";
      if (label) updatedAgoEl.textContent = ` (${label})`;
    }
  }

  // 2. Live clock in São Paulo (BRT / UTC-3)
  const clockEl = document.getElementById("nowClock");
  if (clockEl) {
    const fmt = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tickClock = () => {
      try {
        clockEl.textContent = `${tr("São Paulo, SP")} · ${fmt.format(new Date())} BRT (UTC-3)`;
      } catch (_) {}
    };
    tickClock();
    setInterval(tickClock, 1000);
  }

  // 3. FIAP Software Engineering progress (Aug 2024 – Jul 2028)
  const eduMeta = document.getElementById("nowEduMeta");
  const eduBar = document.getElementById("nowEduBar");
  if (eduMeta && eduBar) {
    const start = new Date(2024, 7, 1);
    const end = new Date(2028, 6, 31);
    const now = new Date();
    const totalMs = end - start;
    const elapsedMs = Math.max(0, Math.min(now - start, totalMs));
    const pct = (elapsedMs / totalMs) * 100;
    const totalMonths = Math.floor(elapsedMs / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts = [];
    if (years > 0) parts.push(tr(years === 1 ? "{n} ano" : "{n} anos", { n: years }));
    if (months > 0) parts.push(tr(months === 1 ? "{n} mês" : "{n} meses", { n: months }));
    eduMeta.textContent = (parts.length ? parts.join(tr(" e ")) : tr("início")) + " — " + tr("{pct}% concluído", { pct: pct.toFixed(0) });

    const totalSegs = 20;
    const filledSegs = Math.round((pct / 100) * totalSegs);
    eduBar.setAttribute("aria-valuenow", String(Math.round(pct)));
    eduBar.textContent = "";
    for (let i = 0; i < totalSegs; i++) {
      const seg = document.createElement("span");
      seg.className = i < filledSegs ? "now-edu-seg is-on" : "now-edu-seg";
      eduBar.appendChild(seg);
    }
  }

  const showRow = (el, label, nodes) => {
    el.textContent = "";
    const lbl = document.createElement("span");
    lbl.className = "now-live-label";
    lbl.textContent = label;
    const val = document.createElement("span");
    val.className = "now-live-value";
    for (const n of nodes) val.append(n);
    el.append(lbl, val);
    el.hidden = false;
  };

  const fmtTime = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // 4. Spotify live playback
  let musicTimer = null;
  fetch("/api/spotify")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((s) => {
      if (!s.is_playing) {
        const idle = document.createElement("span");
        idle.className = "now-live-sub";
        idle.textContent = tr("nada tocando agora");
        return showRow(music, tr("ouvindo"), [idle]);
      }
      const a = document.createElement("a");
      a.href = s.songUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = `${s.title} — ${s.artist}`;
      const nodes = [a];
      if (typeof s.progress_ms === "number" && typeof s.duration_ms === "number" && s.duration_ms > 0) {
        let cur = s.progress_ms;
        const dur = s.duration_ms;
        const timeSpan = document.createElement("span");
        timeSpan.className = "now-live-sub";
        const renderTime = () => {
          timeSpan.textContent = ` · ${fmtTime(cur)} / ${fmtTime(dur)}`;
        };
        renderTime();
        nodes.push(timeSpan);
        if (musicTimer) clearInterval(musicTimer);
        musicTimer = setInterval(() => {
          cur = Math.min(dur, cur + 1000);
          renderTime();
        }, 1000);
      }
      showRow(music, tr("ouvindo"), nodes);
    })
    .catch(() => {});

  // 5. Latest GitHub commit
  fetch("/api/github")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((g) => {
      if (!g.found) return;
      const a = document.createElement("a");
      a.href = `https://github.com/rouri404/${encodeURIComponent(g.repo)}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = g.repo;
      const sub = document.createElement("span");
      sub.className = "now-live-sub";
      sub.textContent = ` · ${ago(g.created_at)}`;
      showRow(commit, tr("último commit"), [a, sub]);
    })
    .catch(() => {});
})();
