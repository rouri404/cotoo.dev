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

  // Nerd Font glyphs (Agave Nerd Font Mono, loaded on first open). They stay hidden until the font is ready (see terminal.css)
  const NF = {
    linux: "\uf17c", terminal: "\uf120", folder: "\uf07b", github: "\uf09b", linkedin: "\uf08c", mail: "\uf0e0", rss: "\uf09e",
    file: "\uf0f6", user: "\uf007", clock: "\uf017", moon: "\uf186", sun: "\uf185", warn: "\uf071", lock: "\uf023", rocket: "\uf135",
    chart: "\uf080", book: "\uf02d", cubes: "\uf1b3", help: "\uf059", adjust: "\uf042", link: "\uf08e", eraser: "\uf12d",
    signout: "\uf08b", server: "\uf233", code: "\uf121", desktop: "\uf108", prompt: "\u276f", folderOpen: "\uf07c", sitemap: "\uf0e8",
  };

  // Markup
  const term = document.createElement("section");
  term.className = "term";
  term.id = "term";
  term.setAttribute("role", "dialog");
  term.setAttribute("aria-label", "Terminal");
  term.setAttribute("aria-hidden", "true");
  term.innerHTML =
    '<div class="term-bar" title="Arraste para mover. Duplo clique para voltar ao Tux"><span class="term-title"><span class="ico">' + NF.linux + '</span>tux@cotoo.dev: <span class="term-cwd">~</span></span>' +
    '<button class="term-close" type="button" aria-label="Fechar terminal" title="Fechar (Esc)">x</button></div>' +
    '<div class="term-body" role="log" aria-live="polite"></div>' +
    '<form class="term-form" autocomplete="off"><span class="term-prompt"><span class="nf-off">$</span><span class="ico">' + NF.prompt + '</span></span>' +
    '<span class="term-field"><span class="term-ghost" aria-hidden="true"></span>' +
    '<input class="term-input" type="text" aria-label="Comando" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="send" /></span></form>';
  document.body.appendChild(term);

  const body = term.querySelector(".term-body");
  const form = term.querySelector(".term-form");
  const input = term.querySelector(".term-input");
  const ghost = term.querySelector(".term-ghost");

  // The page underneath must not react to what happens inside the terminal (the home page changes stage on click and wheel)
  for (const type of ["click", "wheel", "touchstart", "pointerdown"]) {
    term.addEventListener(type, (e) => e.stopPropagation(), { passive: true });
  }

  let isOpen = false;
  let booted = false;
  const history = [];
  let historyAt = 0;

  // Output
  // Lines added in the same tick step in with a small stagger
  let burst = 0;
  let burstTimer = 0;

  function line(content, className = "") {
    const el = document.createElement("div");
    el.className = "term-line" + (className ? " " + className : "");
    el.style.setProperty("--d", Math.min(burst++, 14) * 24 + "ms");
    if (!burstTimer) {
      burstTimer = setTimeout(() => {
        burst = 0;
        burstTimer = 0;
      }, 0);
    }
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

  const ico = (glyph, className = "") => span(glyph, "ico" + (className ? " " + className : ""));
  // Keeps the columns aligned on a row that has no icon of its own
  const blankIco = () => ico("\u00a0");

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

  // A row whose label is an icon plus a fixed-width name
  function iconRow(glyph, name, rest, width = 11) {
    const label = document.createElement("span");
    label.append(ico(glyph), span(name.padEnd(width), "term-key"));
    return row(label, rest, width);
  }

  // Long outputs start at their first line instead of scrolling to the end
  function scrollToStart(el) {
    body.scrollTop = Math.max(0, el.offsetTop - body.offsetTop - 4);
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function go(href) {
    setTimeout(() => (location.href = href), reduceMotion.matches ? 0 : 350);
  }

  // A small make-believe file system: ~ holds projects/ and blog/ plus a few text files
  let cwd = []; // path segments below ~
  let posts = null; // blog posts, fetched once

  const slugify = (name) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const projectFiles = PROJECTS.map(([name, url, desc]) => ({ name: slugify(name) + ".md", title: name, url, desc }));
  const HOME_FILES = ["about.txt", "stack.txt", "contact.txt", "now.md"];

  async function loadPosts() {
    if (posts) return posts;
    try {
      const res = await fetch("/blog/?format=json", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error();
      posts = (await res.json()).posts;
    } catch (_) {
      posts = [];
    }
    return posts;
  }

  // Entries of a directory, as [{ name, dir }]; the blog list is whatever has been fetched so far
  function entriesOf(segs) {
    if (!segs.length) return [{ name: "projects", dir: true }, { name: "blog", dir: true }, ...HOME_FILES.map((name) => ({ name, dir: false }))];
    if (segs[0] === "projects" && segs.length === 1) return projectFiles.map((f) => ({ name: f.name, dir: false }));
    if (segs[0] === "blog" && segs.length === 1) return (posts || []).map((p) => ({ name: p.slug + ".md", dir: false }));
    return null;
  }

  // Segments for a path typed by the user, relative to the current directory
  function resolvePath(arg) {
    let rest = (arg || "").trim();
    let segs = cwd.slice();
    if (rest === "" || rest === "~") return [];
    if (rest.startsWith("~/")) {
      segs = [];
      rest = rest.slice(2);
    } else if (rest.startsWith("/")) {
      segs = [];
    }
    for (const part of rest.split("/").filter(Boolean)) {
      if (part === "..") segs.pop();
      else if (part !== ".") segs.push(part);
    }
    return segs;
  }

  // What lives at a path: a directory, a file (with how to print it), or nothing
  function statPath(segs) {
    if (!segs.length || (segs.length === 1 && (segs[0] === "projects" || segs[0] === "blog"))) return { kind: "dir" };
    const [first, second] = segs;
    const bare = (n) => (n || "").replace(/\.md$/, "");
    if (segs.length === 1 && HOME_FILES.includes(first)) return { kind: "file", home: first };
    if (first === "projects" && segs.length === 2) {
      const file = projectFiles.find((f) => f.name === second || bare(f.name) === second);
      return file ? { kind: "file", project: file } : null;
    }
    if (first === "blog" && segs.length === 2) {
      const post = (posts || []).find((p) => p.slug === bare(second));
      return post ? { kind: "file", post } : null;
    }
    return null;
  }

  const showPath = (segs) => (segs.length ? "~/" + segs.join("/") : "~");

  function setCwd(segs) {
    cwd = segs;
    term.querySelector(".term-cwd").textContent = showPath(segs);
    if (segs[0] === "blog") loadPosts();
  }

  const entryNodes = (entries) =>
    entries.flatMap((e, i) => [i ? span("  ") : "", e.dir ? span(e.name + "/", "term-accent") : span(e.name)]);

  // Commands
  const commands = {
    help: {
      icon: NF.help,
      desc: "mostra esta lista",
      run() {
        line("comandos disponíveis:");
        for (const [name, cmd] of Object.entries(commands)) {
          if (cmd.hidden) continue;
          const label = document.createElement("span");
          label.append(span("  "), ico(cmd.icon), span((name + (cmd.args ? " " + cmd.args : "")).padEnd(16), "term-key"));
          row(label, cmd.desc);
        }
        line("dica: Tab completa, ↑ e ↓ navegam no histórico.", "term-dim");
      },
    },
    whoami: {
      icon: NF.user,
      desc: "quem sou eu",
      run() {
        line("Gabriel Couto");
        line("estudante de Engenharia de Software na FIAP e estagiário de Arquitetura e Tecnologia na Ideal CTVM.", "term-dim");
        line("gosto de back-end, sistemas e baixa latência.", "term-dim");
      },
    },
    projects: {
      icon: NF.folder,
      desc: "projetos em destaque",
      run() {
        for (const [name, url, desc] of PROJECTS) {
          line([ico(url.includes("github.com") ? NF.github : NF.folder), link(url, name)]);
          line("  " + desc, "term-dim");
        }
      },
    },
    stack: {
      icon: NF.cubes,
      desc: "stack técnica",
      run() {
        for (const [area, items] of STACK) iconRow(NF.code, area, items, 16);
      },
    },
    blog: {
      icon: NF.book,
      desc: "últimos posts",
      async run() {
        const wait = line("buscando posts...", "term-dim");
        try {
          const res = await fetch("/blog/?format=json", { headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error();
          const data = await res.json();
          wait.remove();
          for (const { slug, meta } of data.posts) {
            line([ico(NF.file), span(meta.date + "  ", "term-dim"), link(`/blog/${slug}/`, meta.title)]);
          }
          line([ico(NF.rss), span("rss: ", "term-dim"), link("/blog/rss.xml", "/blog/rss.xml"), span("  todos os posts: ", "term-dim"), link("/blog/", "/blog/")]);
        } catch (_) {
          wait.textContent = "não consegui buscar os posts agora. tente em /blog/.";
        }
      },
    },
    activity: {
      icon: NF.chart,
      desc: "atividade no GitHub",
      async run() {
        const wait = line("buscando atividade...", "term-dim");
        try {
          const res = await fetch("/api/contributions");
          if (!res.ok) throw new Error();
          const data = await res.json();
          wait.remove();

          // As many weeks as fit in the window (most recent ones), one square per day
          const probe = span("MMMMMMMMMM");
          probe.style.visibility = "hidden";
          body.appendChild(probe);
          const charW = probe.getBoundingClientRect().width / 10 || 8;
          probe.remove();
          const padding = parseFloat(getComputedStyle(body).paddingLeft) * 2;
          // Each square is one character plus the chart's letter-spacing (0.22ch), and four columns go to the day names
          const fit = Math.max(8, Math.min(data.weeks.length, Math.floor((body.clientWidth - padding) / (charW * 1.22)) - 5));
          const weeks = data.weeks.slice(-fit);

          // Same five shades as the heatmap on the home page: one glyph, five opacities
          const glyph = term.classList.contains("term-nf") ? "\u25a0" : "#";
          const opacity = [0.14, 0.38, 0.6, 0.8, 1];
          const square = (level) => {
            const el = span(glyph);
            el.style.opacity = opacity[level] ?? opacity[0];
            return el;
          };

          // Month names over the week where each month starts, when there is room for them
          const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
          const header = new Array(fit).fill(" ");
          let lastMonth = -1;
          let freeFrom = 0;
          weeks.forEach((week, w) => {
            const month = new Date(week[week.length - 1][0] + "T12:00:00").getMonth();
            if (month === lastMonth) return;
            lastMonth = month;
            if (w < freeFrom || w + 3 > fit) return;
            months[month].split("").forEach((ch, k) => (header[w + k] = ch));
            freeFrom = w + 4;
          });

          const labels = ["   ", "seg", "   ", "qua", "   ", "sex", "   "];
          const nodes = [span("    " + header.join(""), "term-dim"), "\n"];
          for (let day = 0; day < 7; day++) {
            nodes.push(span(labels[day] + " ", "term-dim"));
            for (const week of weeks) {
              const cell = week.find(([date]) => new Date(date + "T12:00:00").getDay() === day);
              nodes.push(cell ? square(cell[2]) : span(" "));
            }
            nodes.push("\n");
          }
          nodes.push(span("    menos ", "term-dim"), ...[0, 1, 2, 3, 4].map(square), span(" mais", "term-dim"));
          const chart = line(nodes, "term-art term-chart");
          line(data.total + " contribuições no último ano", "term-dim");
          scrollToStart(chart);
        } catch (_) {
          wait.textContent = "não consegui buscar a atividade agora.";
        }
      },
    },
    now: {
      icon: NF.clock,
      desc: "o que estou fazendo agora",
      run() {
        line([span("abrindo ", "term-dim"), link(SITE_LINKS.now, "/now/")]);
        go(SITE_LINKS.now);
      },
    },
    contact: {
      icon: NF.mail,
      desc: "como falar comigo",
      run() {
        iconRow(NF.mail, "email", link("mailto:gabriel@cotoo.dev", "gabriel@cotoo.dev"), 9);
        iconRow(NF.github, "github", link(SITE_LINKS.github, "github.com/rouri404"), 9);
        iconRow(NF.linkedin, "linkedin", link(SITE_LINKS.linkedin, "linkedin.com/in/gabricouto"), 9);
      },
    },
    open: {
      icon: NF.link,
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
      icon: NF.adjust,
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
        line([ico(next === "dark" ? NF.moon : NF.sun), span("tema: " + next)]);
        toggle.click();
      },
    },
    neofetch: {
      icon: NF.terminal,
      desc: "informações do sistema",
      run() {
        const mins = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
        // Colour palette row, like the real neofetch
        const swatch = document.createElement("span");
        for (const level of [0.2, 0.4, 0.6, 0.8, 1]) {
          const block = span("\u2588\u2588");
          block.style.opacity = level;
          swatch.append(block);
        }
        swatch.append(span("\u2588\u2588", "term-accent"));

        // Each row is [icon, key, value]; keys use the theme's accent colour
        const info = [
          [null, "tux@cotoo.dev", null],
          [NF.linux, "os", "cotoo.dev"],
          [NF.code, "stack", "HTML, CSS e JS puros"],
          [NF.server, "host", "Vercel"],
          [NF.terminal, "shell", "cotoo-sh"],
          [NF.adjust, "tema", currentTheme()],
          [NF.desktop, "tela", window.innerWidth + "x" + window.innerHeight],
          [NF.clock, "uptime", mins + (mins === 1 ? " min" : " mins")],
          [null, "", swatch],
        ];
        // Beside the penguin, who sits in the middle of the rows, or under him on narrow screens
        const narrow = window.innerWidth < 600;
        const offset = narrow ? TUX.length + 1 : Math.floor((info.length - TUX.length) / 2);
        const rows = narrow ? offset + info.length : info.length;
        const nodes = [];
        for (let i = 0; i < rows; i++) {
          nodes.push(narrow ? TUX[i] || "" : (TUX[i - offset] || "").padEnd(14));
          const entry = info[narrow ? i - offset : i];
          if (entry) {
            const [glyph, key, value] = entry;
            nodes.push(glyph ? ico(glyph) : blankIco());
            if (value === null) nodes.push(span(key, "term-accent"));
            else nodes.push(span(key ? (key + ":").padEnd(8) : "", "term-accent"), value);
          }
          if (i < rows - 1) nodes.push("\n");
        }
        scrollToStart(line(nodes, "term-art"));
      },
    },
    party: {
      icon: NF.rocket,
      desc: "chama o Tux pra festa",
      run() {
        line("bora comemorar!", "term-dim");
        window.dispatchEvent(new Event("mascot:party"));
      },
    },
    clear: {
      icon: NF.eraser,
      desc: "limpa a tela",
      run() {
        body.textContent = "";
      },
    },
    exit: {
      icon: NF.signout,
      desc: "fecha o terminal",
      run() {
        close();
      },
    },
    ls: {
      icon: NF.folder,
      desc: "lista os arquivos",
      args: "[pasta]",
      async run(args) {
        const target = args.filter((x) => !x.startsWith("-"))[0];
        // Without an argument it lists the current folder (only cd goes home)
        const segs = target ? resolvePath(target) : cwd.slice();
        if (segs[0] === "blog") await loadPosts();
        const found = statPath(segs);
        if (!found) return line([ico(NF.warn), span("ls: " + target + ": arquivo ou diretório inexistente")]);
        if (found.kind === "file") return line(segs[segs.length - 1]);
        const entries = entriesOf(segs);
        line(entries.length ? entryNodes(entries) : span("(vazio)", "term-dim"));
      },
    },
    cd: {
      icon: NF.folderOpen,
      desc: "entra numa pasta",
      args: "<pasta>",
      async run(args) {
        const segs = resolvePath(args[0]);
        if (segs[0] === "blog") await loadPosts();
        const found = statPath(segs);
        if (!found) return line([ico(NF.warn), span("cd: " + args[0] + ": arquivo ou diretório inexistente")]);
        if (found.kind === "file") return line([ico(NF.warn), span("cd: " + args[0] + ": não é um diretório")]);
        setCwd(segs);
      },
    },
    cat: {
      icon: NF.file,
      desc: "mostra um arquivo",
      args: "<arquivo>",
      async run(args) {
        if (!args[0]) return line("uso: cat <arquivo>");
        const segs = resolvePath(args[0]);
        if (segs[0] === "blog") await loadPosts();
        const found = statPath(segs);
        if (!found) return line([ico(NF.warn), span("cat: " + args[0] + ": arquivo ou diretório inexistente")]);
        if (found.kind === "dir") return line([ico(NF.warn), span("cat: " + args[0] + ": é um diretório")]);
        if (found.home === "about.txt") return commands.whoami.run();
        if (found.home === "stack.txt") return commands.stack.run();
        if (found.home === "contact.txt") return commands.contact.run();
        if (found.home === "now.md") {
          line("o que estou fazendo agora, em", "term-dim");
          return line(link(SITE_LINKS.now, "/now/"));
        }
        if (found.project) {
          line([ico(found.project.url.includes("github.com") ? NF.github : NF.folder), link(found.project.url, found.project.title)]);
          return line(found.project.desc, "term-dim");
        }
        const { slug, meta, readingMinutes } = found.post;
        line(link(`/blog/${slug}/`, meta.title));
        line(meta.date + (readingMinutes ? " · " + readingMinutes + " min de leitura" : ""), "term-dim");
        line(meta.description);
      },
    },
    tree: {
      icon: NF.sitemap,
      desc: "mostra todas as pastas",
      async run() {
        await loadPosts();
        const lines = ["~"];
        const root = entriesOf([]);
        root.forEach((entry, i) => {
          const last = i === root.length - 1;
          lines.push((last ? "\u2514\u2500\u2500 " : "\u251c\u2500\u2500 ") + entry.name + (entry.dir ? "/" : ""));
          if (!entry.dir) return;
          const kids = entriesOf([entry.name]);
          kids.forEach((kid, k) => lines.push((last ? "    " : "\u2502   ") + (k === kids.length - 1 ? "\u2514\u2500\u2500 " : "\u251c\u2500\u2500 ") + kid.name));
        });
        line(lines.join("\n"), "term-art");
      },
    },
    pwd: {
      hidden: true,
      run() {
        line("/home/tux" + (cwd.length ? "/" + cwd.join("/") : ""));
      },
    },
    sudo: {
      hidden: true,
      run() {
        line([ico(NF.lock), span("tux não está no arquivo sudoers. Este incidente será reportado.")]);
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
    const echo = line([span("$ ", "nf-off term-dim"), ico(NF.prompt, "term-dim"), span(text)]);
    echo.classList.add("term-echo");
    if (!text) return;
    if (history[history.length - 1] !== text) history.push(text);
    historyAt = history.length;

    const [name, ...args] = text.split(/\s+/);
    const cmd = commands[name.toLowerCase()];
    if (!cmd) {
      line([ico(NF.warn), span("comando não encontrado: " + name + ". Digite help.")]);
      return;
    }
    return cmd.run(args);
  }

  // Tab completion and the grey suggestion shown after the cursor (accepted with Tab or the right arrow)
  const visibleCommands = () => Object.keys(commands).filter((name) => !commands[name].hidden);

  // What can be completed at the end of the current input: the word being typed and the words that could replace it
  function candidates() {
    const parts = input.value.trimStart().split(/\s+/);
    const word = parts[parts.length - 1].toLowerCase();
    let pool = visibleCommands();
    if (parts.length > 1) {
      const first = parts[0].toLowerCase();
      if (first === "open") pool = Object.keys(SITE_LINKS);
      else if (first === "theme") pool = ["dark", "light"];
      else if (["cd", "ls", "cat"].includes(first)) {
        const here = entriesOf(cwd) || [];
        const names = here.filter((e) => first !== "cd" || e.dir).map((e) => e.name + (e.dir ? "/" : ""));
        pool = first === "cd" ? [...names, ".."] : names;
      } else pool = [];
    }
    return { parts, word, pool: pool.filter((c) => c.startsWith(word)) };
  }

  // A previous command that starts like the input wins, then the first matching command or argument
  function historySuggestion() {
    const value = input.value;
    if (!value) return "";
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].startsWith(value) && history[i] !== value) return history[i].slice(value.length);
    }
    return "";
  }

  function suggestion() {
    if (!input.value || input.selectionStart !== input.value.length) return "";
    const fromHistory = historySuggestion();
    if (fromHistory) return fromHistory;
    const { word, pool } = candidates();
    const match = word && pool.find((c) => c !== word);
    return match ? match.slice(word.length) : "";
  }

  function renderGhost() {
    ghost.textContent = "";
    const rest = suggestion();
    if (!rest) return;
    const typed = span(input.value);
    typed.style.visibility = "hidden";
    ghost.append(typed, span(rest));
  }

  function acceptSuggestion() {
    const rest = suggestion();
    if (!rest) return false;
    input.value += rest;
    renderGhost();
    return true;
  }

  function complete() {
    // A suggestion from the history is taken as it is
    if (historySuggestion() && acceptSuggestion()) return;
    const { parts, word, pool } = candidates();
    if (!pool.length) return;
    if (pool.length === 1) {
      parts[parts.length - 1] = pool[0];
      // A directory keeps the cursor next to its slash, ready for what comes inside
      input.value = parts.join(" ") + (pool[0].endsWith("/") ? "" : " ");
    } else {
      // The longest start the candidates share; when that adds nothing, show them all
      let prefix = pool[0];
      for (const c of pool) while (!c.startsWith(prefix)) prefix = prefix.slice(0, -1);
      if (prefix.length > word.length) {
        parts[parts.length - 1] = prefix;
        input.value = parts.join(" ");
      } else {
        line(pool.join("  "), "term-dim");
      }
    }
    renderGhost();
  }

  // Keeps the pop-up above Tux's head, following him while he moves, and inside the visible viewport
  const GAP = 10;
  let placing = false;
  let closedAt = 0;
  // Where the window sits once it is dragged by the title bar; null means it follows Tux
  let manual = null;
  let current = { x: 0, y: 0 };

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
    const fit = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
    const x = fit(manual ? manual.x : ax - w / 2, vx + 8, vx + vw - w - 8);
    const y = fit(manual ? manual.y : ay - h - GAP, vy + 8, vy + vh - h - 8);
    current = { x, y };
    // The translate property (not transform) comes before the pop-in's scale, so the scale grows around Tux
    term.style.translate = `${x}px ${y}px`;
    term.style.setProperty("--ox", ax - x + "px");
    term.style.setProperty("--oy", ay - y + "px");
  }

  // The party belongs to Tux: the window disappears while it runs and grows back out of him afterwards
  window.addEventListener("party:start", () => term.classList.add("is-party-hidden"));
  window.addEventListener("party:end", () => {
    term.classList.remove("is-party-hidden");
    if (!isOpen) return;
    // Restart the pop-in animation
    term.style.animation = "none";
    void term.offsetWidth;
    term.style.animation = "";
    input.focus({ preventScroll: true });
  });

  function track() {
    place();
    if (isOpen || performance.now() - closedAt < 400) requestAnimationFrame(track);
    else placing = false;
  }

  // The font file is only fetched the first time the terminal opens; the glyphs show once it is in
  function loadNerdFont() {
    if (!document.fonts || !document.fonts.load) return;
    document.fonts
      .load('1em "Agave NF"', NF.linux)
      .then((faces) => {
        if (faces.length) term.classList.add("term-nf");
      })
      .catch(() => {});
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
      loadNerdFont();
      loadPosts();
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
    renderGhost();
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
    } else if (e.key === "ArrowRight" && input.selectionStart === input.value.length && suggestion()) {
      e.preventDefault();
      acceptSuggestion();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      historyAt = Math.min(history.length, Math.max(0, historyAt + (e.key === "ArrowUp" ? -1 : 1)));
      input.value = history[historyAt] || "";
      renderGhost();
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      commands.clear.run();
    } else if (e.ctrlKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      close();
    }
  });

  // Dragging the title bar turns it into a free window; a double click sends it back to Tux
  const bar = term.querySelector(".term-bar");
  let drag = null;
  bar.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".term-close")) return;
    drag = { px: e.clientX, py: e.clientY, x: current.x, y: current.y };
    bar.setPointerCapture(e.pointerId);
    bar.classList.add("is-dragging");
    // Moving the mouse over the page must not select its text
    e.preventDefault();
    document.body.style.userSelect = "none";
    window.getSelection().removeAllRanges();
  });
  bar.addEventListener("pointermove", (e) => {
    if (!drag) return;
    manual = { x: drag.x + e.clientX - drag.px, y: drag.y + e.clientY - drag.py };
    place();
  });
  const drop = () => {
    drag = null;
    bar.classList.remove("is-dragging");
    document.body.style.userSelect = "";
  };
  bar.addEventListener("pointerup", drop);
  bar.addEventListener("pointercancel", drop);
  bar.addEventListener("dblclick", (e) => {
    if (e.target.closest(".term-close")) return;
    manual = null;
    place();
  });

  input.addEventListener("input", renderGhost);

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
