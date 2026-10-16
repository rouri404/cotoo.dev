// Terminal pop-up that comes out of Tux: opened by clicking him, the Backquote key or Ctrl+K. Shared by the home page and the blog
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const startedAt = Date.now();

  const SITE_LINKS = {
    home: "/",
    blog: "/blog/",
    now: "/now/",
    rss: "/blog/rss.xml",
    github: "https://github.com/rouri404",
    linkedin: "https://linkedin.com/in/gabricouto",
  };

  const PROJECTS = [
    ["Protech The Future", "https://github.com/rouri404/site-gs-fiap", "telemetria e detecção de enchentes em tempo real, 1º lugar FIAP GS 2025"],
    ["CRMed", "https://github.com/GrupoMoskitto/Challenge-2026", "gestão clínica com Redis e GraphQL, Hospital São Rafael"],
    ["Grabtext", "https://github.com/rouri404/grabtext", "OCR local de baixa latência no clipboard GNU/Linux"],
    ["OEDLA (Unicamp)", "/blog/oedla-plataforma-editorial/", "portal de notícias com cache na borda (~93% de hit ratio)"],
    ["PremiumUUID", "https://github.com/rouri404/premium-uuid", "resolução concorrente de UUID Mojang (Java/Paper)"],
    ["cotoo.dev", "https://github.com/rouri404/cotoo.dev", "esse portfólio :P"],
  ];

  const STACK = [
    ["sistemas", "Java (JVM/GC), C/C++, QuickFIX/J, Linux Internals, Concorrência"],
    ["redes", "Sockets (TCP/UDP), Protocolo FIX, Docker, Kubernetes, AWS, Cloudflare"],
    ["back-end", "Redis, PostgreSQL, Python, TypeScript, GraphQL, Prisma"],
    ["observabilidade", "Grafana, Jaeger, MQTT, GitHub Actions, Shell Scripting"],
    ["front-end", "React, Tailwind CSS, Expo, Canvas Puro"],
  ];

  const TUX = [
    "    .--.   ",
    "   |o_o |  ",
    "   |:_/ |  ",
    "  //   \\ \\ ",
    " (|     | )",
    "/'\\_   _/`\\",
    "\\___)=(___/",
  ];

  // Markup
  const term = document.createElement("section");
  term.className = "term";
  term.id = "term";
  term.setAttribute("role", "dialog");
  term.setAttribute("aria-label", "Terminal");
  term.setAttribute("aria-hidden", "true");
  term.innerHTML =
    '<div class="term-bar"><span class="term-title">tux@cotoo.dev: ~</span>' +
    '<button class="term-close" type="button" aria-label="Fechar terminal" title="Fechar (Esc)">x</button></div>' +
    '<div class="term-body" role="log" aria-live="polite"></div>' +
    '<form class="term-form" autocomplete="off"><span class="term-prompt">$</span>' +
    '<input class="term-input" type="text" aria-label="Comando" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="send" /></form>';
  document.body.appendChild(term);

  const body = term.querySelector(".term-body");
  const form = term.querySelector(".term-form");
  const input = term.querySelector(".term-input");

  // The page underneath must not react to what happens inside the terminal (the home page changes stage on click and wheel)
  for (const type of ["click", "wheel", "touchstart", "pointerdown"]) {
    term.addEventListener(type, (e) => e.stopPropagation(), { passive: true });
  }

  let isOpen = false;
  let booted = false;
  const history = [];
  let historyAt = 0;

  // Output
  function line(content, className = "") {
    const el = document.createElement("div");
    el.className = "term-line" + (className ? " " + className : "");
    if (typeof content === "string") el.textContent = content;
    else if (content) el.append(...[].concat(content));
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  const span = (text, className) => {
    const el = document.createElement("span");
    el.textContent = text;
    if (className) el.className = className;
    return el;
  };

  function link(href, label) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    if (/^https?:\/\//.test(href) && new URL(href).origin !== location.origin) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    return a;
  }

  // A command name or label in a fixed-width column, followed by its description
  function row(label, rest, width = 11) {
    const left = typeof label === "string" ? span(label.padEnd(width), "term-key") : label;
    return line([left, typeof rest === "string" ? span(rest, "term-dim") : rest]);
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function go(href) {
    setTimeout(() => (location.href = href), reduceMotion.matches ? 0 : 350);
  }

  // Commands
  const commands = {
    help: {
      desc: "mostra esta lista",
      run() {
        line("comandos disponíveis:");
        for (const name of Object.keys(commands)) {
          if (!commands[name].hidden) row("  " + name + (commands[name].args ? " " + commands[name].args : ""), commands[name].desc, 18);
        }
        line("dica: Tab completa, ↑ e ↓ navegam no histórico.", "term-dim");
      },
    },
    whoami: {
      desc: "quem sou eu",
      run() {
        line("Gabriel Couto");
        line("estudante de Engenharia de Software na FIAP e estagiário de Arquitetura e Tecnologia na Ideal CTVM.", "term-dim");
        line("gosto de back-end, sistemas e baixa latência.", "term-dim");
      },
    },
    projects: {
      desc: "projetos em destaque",
      run() {
        for (const [name, url, desc] of PROJECTS) {
          line(link(url, name));
          line("  " + desc, "term-dim");
        }
      },
    },
    stack: {
      desc: "stack técnica",
      run() {
        for (const [area, items] of STACK) row(area, items, 17);
      },
    },
    blog: {
      desc: "últimos posts",
      async run() {
        const wait = line("buscando posts...", "term-dim");
        try {
          const res = await fetch("/blog/?format=json", { headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error();
          const data = await res.json();
          wait.remove();
          for (const { slug, meta } of data.posts) {
            line([span(meta.date + "  ", "term-dim"), link(`/blog/${slug}/`, meta.title)]);
          }
          line([span("todos os posts: ", "term-dim"), link("/blog/", "/blog/"), span("  rss: ", "term-dim"), link("/blog/rss.xml", "/blog/rss.xml")]);
        } catch (_) {
          wait.textContent = "não consegui buscar os posts agora. tente em /blog/.";
        }
      },
    },
    activity: {
      desc: "atividade no GitHub",
      async run() {
        const wait = line("buscando atividade...", "term-dim");
        try {
          const res = await fetch("/api/contributions");
          if (!res.ok) throw new Error();
          const data = await res.json();
          wait.remove();

          // As many weeks as fit in the window, most recent ones, one character per day
          const probe = span("MMMMMMMMMM");
          probe.style.visibility = "hidden";
          body.appendChild(probe);
          const charW = probe.getBoundingClientRect().width / 10 || 8;
          probe.remove();
          const padding = parseFloat(getComputedStyle(body).paddingLeft) * 2;
          const fit = Math.max(8, Math.min(data.weeks.length, Math.floor((body.clientWidth - padding) / charW) - 6));

          // Plain ASCII: block glyphs fall back to another font and break the columns
          const shades = [".", ":", "+", "*", "#"];
          const labels = ["   ", "seg", "   ", "qua", "   ", "sex", "   "];
          const rows = labels.map((label) => [label + " "]);
          for (const week of data.weeks.slice(-fit)) {
            const byDay = new Array(7).fill(" ");
            for (const [date, , level] of week) byDay[new Date(date + "T12:00:00").getDay()] = shades[level] || shades[0];
            byDay.forEach((ch, i) => rows[i].push(ch));
          }
          line(rows.map((r) => r.join("")).join("\n"), "term-art");
          line(data.total + " contribuições no último ano", "term-dim");
        } catch (_) {
          wait.textContent = "não consegui buscar a atividade agora.";
        }
      },
    },
    now: {
      desc: "o que estou fazendo agora",
      run() {
        line([span("abrindo ", "term-dim"), link(SITE_LINKS.now, "/now/")]);
        go(SITE_LINKS.now);
      },
    },
    contact: {
      desc: "como falar comigo",
      run() {
        row("email", link("mailto:gabriel@cotoo.dev", "gabriel@cotoo.dev"), 10);
        row("github", link(SITE_LINKS.github, "github.com/rouri404"), 10);
        row("linkedin", link(SITE_LINKS.linkedin, "linkedin.com/in/gabricouto"), 10);
      },
    },
    open: {
      desc: "abre uma página",
      args: "<destino>",
      run(args) {
        const target = (args[0] || "").toLowerCase();
        if (!SITE_LINKS[target]) {
          line("uso: open <" + Object.keys(SITE_LINKS).join(" | ") + ">");
          return;
        }
        line([span("abrindo ", "term-dim"), span(target)]);
        if (/^https?:\/\//.test(SITE_LINKS[target])) window.open(SITE_LINKS[target], "_blank", "noopener,noreferrer");
        else go(SITE_LINKS[target]);
      },
    },
    theme: {
      desc: "troca o tema",
      args: "[dark|light]",
      run(args) {
        const want = (args[0] || "").toLowerCase();
        if (want && want !== "dark" && want !== "light") {
          line("uso: theme [dark | light]");
          return;
        }
        const next = want || (currentTheme() === "dark" ? "light" : "dark");
        const toggle = document.getElementById("themeToggle");
        if (next === currentTheme() || !toggle) {
          line("tema já é " + currentTheme() + ".", "term-dim");
          return;
        }
        // The line goes in first, so it is already in the page when the dither wave starts flipping elements
        line("tema: " + next);
        toggle.click();
      },
    },
    neofetch: {
      desc: "informações do sistema",
      run() {
        const mins = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
        const info = [
          "tux@cotoo.dev",
          "-------------",
          "os:     cotoo.dev",
          "stack:  HTML, CSS e JS puros",
          "host:   Vercel",
          "shell:  cotoo-sh",
          "tema:   " + currentTheme(),
          "tela:   " + window.innerWidth + "x" + window.innerHeight,
          "uptime: " + mins + (mins === 1 ? " min" : " mins"),
        ];
        // On narrow screens the info goes under the penguin instead of beside him
        const art = window.innerWidth < 600 ? [...TUX, "", ...info] : Array.from({ length: Math.max(TUX.length, info.length) }, (_, i) => (TUX[i] || "").padEnd(14) + (info[i] || ""));
        line(art.join("\n"), "term-art");
      },
    },
    party: {
      desc: "chama o Tux pra festa",
      run() {
        line("bora comemorar!", "term-dim");
        close();
        setTimeout(() => window.dispatchEvent(new Event("mascot:party")), reduceMotion.matches ? 0 : 320);
      },
    },
    clear: {
      desc: "limpa a tela",
      run() {
        body.textContent = "";
      },
    },
    exit: {
      desc: "fecha o terminal",
      run() {
        close();
      },
    },
    ls: {
      hidden: true,
      run() {
        line("blog/  now/  projects  stack  contact");
      },
    },
    pwd: {
      hidden: true,
      run() {
        line(location.pathname);
      },
    },
    sudo: {
      hidden: true,
      run() {
        line("tux não está no arquivo sudoers. Este incidente será reportado.");
      },
    },
    rm: {
      hidden: true,
      run() {
        line("boa tentativa :)");
      },
    },
  };

  function run(raw) {
    const text = raw.trim();
    const echo = line([span("$ ", "term-dim"), span(text)]);
    echo.classList.add("term-echo");
    if (!text) return;
    if (history[history.length - 1] !== text) history.push(text);
    historyAt = history.length;

    const [name, ...args] = text.split(/\s+/);
    const cmd = commands[name.toLowerCase()];
    if (!cmd) {
      line("comando não encontrado: " + name + ". Digite help.");
      return;
    }
    return cmd.run(args);
  }

  function complete() {
    const parts = input.value.split(/\s+/);
    const word = parts[parts.length - 1].toLowerCase();
    if (!word) return;
    let pool = Object.keys(commands);
    if (parts.length > 1) {
      const first = parts[0].toLowerCase();
      pool = first === "open" ? Object.keys(SITE_LINKS) : first === "theme" ? ["dark", "light"] : [];
    }
    const matches = pool.filter((c) => c.startsWith(word));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = parts.join(" ") + " ";
    } else if (matches.length > 1) {
      line(matches.join("  "), "term-dim");
    }
  }

  // Keeps the pop-up above Tux's head, following him while he moves, and inside the visible viewport
  const GAP = 10;
  let placing = false;
  let closedAt = 0;

  function place() {
    const w = term.offsetWidth;
    const h = term.offsetHeight;
    const vv = window.visualViewport;
    const vx = vv ? vv.offsetLeft : 0;
    const vy = vv ? vv.offsetTop : 0;
    const vw = vv ? vv.width : window.innerWidth;
    const vh = vv ? vv.height : window.innerHeight;
    const hit = document.querySelector(".mascot-hit");
    const r = hit && hit.getBoundingClientRect();
    // Without a mascot (the blog 404) it comes out of the bottom center
    const ax = r && r.width ? r.left + r.width / 2 : vx + vw / 2;
    const ay = r && r.width ? r.top + r.height * 0.1 : vy + vh - 8;
    const x = Math.min(Math.max(ax - w / 2, vx + 8), Math.max(vx + 8, vx + vw - w - 8));
    const y = Math.min(Math.max(ay - h - GAP, vy + 8), Math.max(vy + 8, vy + vh - h - 8));
    term.style.transform = `translate(${x}px, ${y}px)`;
    term.style.setProperty("--ox", ax - x + "px");
    term.style.setProperty("--oy", ay - y + "px");
  }

  function track() {
    place();
    if (isOpen || performance.now() - closedAt < 400) requestAnimationFrame(track);
    else placing = false;
  }

  // Open and close
  function open() {
    if (isOpen) return;
    isOpen = true;
    place();
    if (!placing) {
      placing = true;
      requestAnimationFrame(track);
    }
    term.setAttribute("aria-hidden", "false");
    term.classList.add("is-open");
    if (!booted) {
      booted = true;
      line("cotoo.dev terminal. Digite help para ver os comandos.");
      line("Esc fecha.", "term-dim");
    }
    // Focus after the pop-in starts, so the page does not scroll toward the input
    setTimeout(() => input.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 60);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    closedAt = performance.now();
    term.setAttribute("aria-hidden", "true");
    term.classList.remove("is-open");
    input.blur();
  }

  const toggle = () => (isOpen ? close() : open());

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value;
    input.value = "";
    const result = run(value);
    if (result && typeof result.then === "function") result.then(() => (body.scrollTop = body.scrollHeight));
  });

  // Keys typed in the terminal never reach the page's own shortcuts
  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      close();
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      historyAt = Math.min(history.length, Math.max(0, historyAt + (e.key === "ArrowUp" ? -1 : 1)));
      input.value = history[historyAt] || "";
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      commands.clear.run();
    } else if (e.ctrlKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      close();
    }
  });

  term.querySelector(".term-close").addEventListener("click", close);
  body.addEventListener("click", () => {
    if (!window.getSelection().toString()) input.focus({ preventScroll: true });
  });

  window.addEventListener("terminal:open", open);
  window.addEventListener("terminal:toggle", toggle);
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.target === input) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    // Backquote is the physical key, so it also works on layouts where the backtick is a dead key
    if (e.code === "Backquote" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggle();
    } else if (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      toggle();
    } else if (e.key === "Escape" && isOpen) {
      close();
    }
  });
})();
