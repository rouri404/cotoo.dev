// English text for the home page, as [Portuguese, English] pairs applied to index.html by api/en.js. Each key is copied
// exactly from index.html, with enough markup around short words to match only where they are meant to.
// Keys are small (a label, a sentence, a bullet), so an edit to the Portuguese page leaves only that piece untranslated;
// `node scripts/check-en.js` lists the keys that no longer match
export const HOME_EN = [
  // Head
  ['Architecture and Technology IT Intern na Ideal CTVM, estudante de Engenharia de Software na FIAP. Projetos de back-end, infraestrutura e sistemas.', 'Architecture and Technology IT Intern at Ideal CTVM and Software Engineering student at FIAP. Back-end, infrastructure and systems projects.'],
  ['Gabriel Couto | Engenheiro de Software', 'Gabriel Couto | Software Engineer'],
  ['Gabriel Couto — Engenheiro de Software', 'Gabriel Couto — Software Engineer'],
  ['"inLanguage": "pt-BR"', '"inLanguage": "en"'],

  // Top of the page
  ['aria-label="Navegação principal"', 'aria-label="Main navigation"'],
  ['title="Acessar o blog"', 'title="Go to the blog (in Portuguese)"'],
  ['title="Alternar tema" role="button" tabindex="0" aria-label="Alternar tema"', 'title="Toggle theme" role="button" tabindex="0" aria-label="Toggle theme"'],
  ['aria-label="Contador de visitas" title="visitas"', 'aria-label="Visit counter" title="visits"'],
  ['<span class="visit-label">visitas</span>', '<span class="visit-label">visits</span>'],
  ['<p class="eyebrow">// formação</p>', '<p class="eyebrow">// education</p>'],
  ['<span class="education-name">Engenharia de Software</span>', '<span class="education-name">Software Engineering</span>'],
  ['FIAP — ago/2024 – jul/2028', 'FIAP — Aug 2024 – Jul 2028'],
  ['<p class="hint">role ou clique para continuar</p>', '<p class="hint">scroll or click to continue</p>'],

  // Projects
  ['<p class="eyebrow">// projetos</p>', '<p class="eyebrow">// projects</p>'],
  ['Telemetria e detecção de enchentes em tempo real (Edge/IoT) — <span class="shimmer">1º lugar</span> FIAP GS 2025', 'Real-time flood telemetry and detection (Edge/IoT) — <span class="shimmer">1st place</span> FIAP GS 2025'],
  ['Gestão clínica com cache em memória (Redis) e GraphQL — Hospital São Rafael', 'Clinic management with in-memory caching (Redis) and GraphQL — Hospital São Rafael'],
  ['Processamento de imagem e OCR local de baixa latência no clipboard GNU/Linux', 'Image processing and low-latency local OCR to the clipboard on GNU/Linux'],
  ['Portal de notícias de custo zero, com SEO agressivo e cache na borda (~93% hit ratio)', 'Zero-cost news portal with aggressive SEO and edge caching (~93% hit ratio)'],
  ['Plugin de Minecraft que dá a cada jogador premium o UUID certo, mesmo em servidor offline-mode', 'Minecraft plugin that gives every premium player the right UUID, even on offline-mode servers'],
  ['<span class="desc">Esse portfólio :P</span>', '<span class="desc">This portfolio :P</span>'],
  ['aria-label="Stack e status"', 'aria-label="Stack and status"'],
  ['<span class="project-status">no Modrinth</span>', '<span class="project-status">on Modrinth</span>'],
  ['<span class="project-status">no ar</span>', '<span class="project-status">up</span>'],

  // Tech stack
  ['<p class="eyebrow">// stack técnica</p>', '<p class="eyebrow">// tech stack</p>'],
  ['<span class="name">Sistemas &amp; Baixa Latência</span>', '<span class="name">Systems &amp; Low Latency</span>'],
  ['Java (JVM/GC), C/C++, QuickFIX/J, Linux Internals, Concorrência</span>', 'Java (JVM/GC), C/C++, QuickFIX/J, Linux Internals, Concurrency</span>'],
  ['<span class="name">Redes &amp; Infraestrutura</span>', '<span class="name">Networking &amp; Infrastructure</span>'],
  ['Sockets (TCP/UDP), Protocolo FIX, Docker, Kubernetes, AWS, Cloudflare</span>', 'Sockets (TCP/UDP), FIX Protocol, Docker, Kubernetes, AWS, Cloudflare</span>'],
  ['<span class="name">Back-end &amp; Dados</span>', '<span class="name">Back-end &amp; Data</span>'],
  ['<span class="name">Observabilidade &amp; Automação</span>', '<span class="name">Observability &amp; Automation</span>'],
  ['React, Tailwind CSS, Expo, Canvas Puro</span>', 'React, Tailwind CSS, Expo, Plain Canvas</span>'],

  // Experience, blog and activity
  ['<p class="eyebrow">// experiência</p>', '<p class="eyebrow">// experience</p>'],
  ['Ideal CTVM — dez/2025 - o momento', 'Ideal CTVM — Dec 2025 – present'],
  ['Kumon Brasil — jan/2022 - dez/2025', 'Kumon Brasil — Jan 2022 – Dec 2025'],
  ['<p class="eyebrow">// blog</p>', '<p class="eyebrow">// blog (in Portuguese)</p>'],
  ['<span class="name">Construindo o OEDLA</span>', '<span class="name">Building OEDLA</span>'],
  ['Como cache, proxy e roteamento no edge transformaram planos gratuitos numa plataforma editorial rápida e segura, com custo de infraestrutura zero.', 'How edge caching, proxying and routing turned free plans into a fast, secure editorial platform at zero infrastructure cost.'],
  ['<span class="name">Guia Prático de Docker</span>', '<span class="name">Practical Docker Guide</span>'],
  ['Guia completo e prático de Docker, da instalação à orquestração com Docker Compose. Imagens, volumes, redes e boas práticas.', 'Hands-on guide to Docker, from installation to orchestration with Docker Compose. Images, volumes, networks and best practices.'],
  ['title="Ver todos os posts"', 'title="See every post"'],
  ['<span>ver todos os posts</span>', '<span>all posts</span>'],
  ['<a href="/now/" class="blog-all-btn" title="O que estou fazendo agora">', '<a href="/en/now/" class="blog-all-btn" title="What I am up to now">'],
  ['<a href="/uses/" class="blog-all-btn" title="O que eu uso no dia a dia">', '<a href="/en/uses/" class="blog-all-btn" title="What I use every day">'],
  ['<a href="/colophon/" class="blog-all-btn" title="Como este site é feito">', '<a href="/en/colophon/" class="blog-all-btn" title="How this site is built">'],
  ['<p class="eyebrow">// atividade no github</p>', '<p class="eyebrow">// github activity</p>'],

  // Contact
  ['<p class="eyebrow">// contato</p>', '<p class="eyebrow">// contact</p>'],
  ['id="contactExpandBtn">enviar mensagem</button>', 'id="contactExpandBtn">send a message</button>'],
  ['placeholder="Nome"', 'placeholder="Name"'],
  ['placeholder="E-mail"', 'placeholder="Email"'],
  ['placeholder="Mensagem"', 'placeholder="Message"'],
  ['class="btn" style="width: 100%;">enviar</button>', 'class="btn" style="width: 100%;">send</button>'],

  // Socials and Spotify
  ['aria-label="Redes sociais"', 'aria-label="Social links"'],
  ['class="github-status loading">buscando status</div>', 'class="github-status loading">fetching status</div>'],
  ['aria-label="Ouvindo no Spotify"', 'aria-label="Listening on Spotify"'],
  ['<span class="spotify-label" id="spotifyLabel">coto tá ouvindo</span>', '<span class="spotify-label" id="spotifyLabel">coto is listening to</span>'],
  ['<span class="spotify-track" id="spotifyTrack">carregando...</span>', '<span class="spotify-track" id="spotifyTrack">loading...</span>'],
  ['        ouvir com o coto\n', '        listen along\n'],

  // Modals: shared
  ['title="fechar">x</button>', 'title="close">x</button>'],

  // Ideal CTVM
  ['Atuação como estagiário na área de arquitetura e tecnologia da Ideal CTVM (corretora institucional e HFT, 50,1% Itaú).', 'Intern in the architecture and technology team at Ideal CTVM (an institutional and HFT brokerage, 50.1% owned by Itaú).'],
  ['<strong>Conectividade &amp; Protocolo FIX:</strong> Introdução e atuação prática com o protocolo <strong>FIX</strong> utilizando <strong>QuickFIX/J</strong>, acompanhando a integração de gateways de mercado e o fluxo de mensageria financeira.', '<strong>Connectivity &amp; FIX Protocol:</strong> Hands-on work with the <strong>FIX</strong> protocol using <strong>QuickFIX/J</strong>, following the integration of market gateways and the flow of financial messaging.'],
  ['<strong>Desenvolvimento Back-end:</strong> Apoio no desenvolvimento e manutenção de serviços internos com <strong>Java</strong> e <strong>TypeScript</strong>, auxiliando no processamento de dados e suporte a rotinas operacionais.', '<strong>Back-end Development:</strong> Helping build and maintain internal services in <strong>Java</strong> and <strong>TypeScript</strong>, supporting data processing and operational routines.'],
  ['<strong>Ambiente de Missão Crítica:</strong> Aprendizado contínuo sobre sistemas de trading, redes, sockets de baixa latência e requisitos de alta confiabilidade em ambiente institucional.', '<strong>Mission-Critical Environment:</strong> Ongoing learning about trading systems, networking, low-latency sockets and high-reliability requirements in an institutional setting.'],

  // Kumon
  ['Atuação por 4 anos (jan/2022 – dez/2025) como orientador especializado em matemática superior e avançada:', 'Four years (Jan 2022 – Dec 2025) as a tutor specialized in higher and advanced mathematics:'],
  ['<strong>Cálculo Diferencial e Integral (1 a 3):</strong> Instrução e resolução aprofundada de limites, derivadas, integrais múltiplas, campos vetoriais, séries infinitas e equações diferenciais aplicadas.', '<strong>Differential and Integral Calculus (1 to 3):</strong> In-depth teaching and problem solving on limits, derivatives, multiple integrals, vector fields, infinite series and applied differential equations.'],
  ['<strong>Álgebra Linear:</strong> Espaços vetoriais, transformações lineares, determinantes, álgebra matricial, autovalores e autovetores.', '<strong>Linear Algebra:</strong> Vector spaces, linear transformations, determinants, matrix algebra, eigenvalues and eigenvectors.'],
  ['<strong>Rigor Analítico:</strong> Capacidade comprovada de decompor problemas complexos, rigor matemático e didática técnica.', '<strong>Analytical Rigor:</strong> Proven ability to break down complex problems, with mathematical rigor and clear technical teaching.'],

  // Protech
  ['<strong>Protech The Future — Detecção Precoce de Enchentes</strong>', '<strong>Protech The Future — Early Flood Detection</strong>'],
  ['Projeto da Global Solution 2025 da FIAP (1º lugar), feito em equipe com mais dois colegas. Bueiros entupidos por lixo agravam as enchentes urbanas, e um alerta antecipado reduziria danos e salvaria vidas. A solução monitora o nível de água dos bueiros em tempo real e avisa a prefeitura e a Defesa Civil antes de o alagamento acontecer.', 'FIAP Global Solution 2025 project (1st place), built with two teammates. Storm drains clogged with trash make urban floods worse, and an early warning would reduce damage and save lives. The solution monitors the water level of storm drains in real time and warns the city hall and Civil Defense before the flooding happens.'],
  ['Gráfico do histórico de nível de água de um bueiro, subindo até o nível crítico', "Chart of a storm drain's water level history, rising to the critical level"],
  ['Mapa de São Paulo com os bueiros monitorados, marcados por nível normal, moderado e crítico', 'Map of São Paulo with the monitored storm drains, marked as normal, moderate and critical'],
  ['<strong>Sensores no bueiro:</strong> Um ESP32 numa caixa selada (IP67), fixada fora da linha d\'água, lê um sensor analógico de nível de água e a umidade de um DHT22 perto da base, que denuncia o acúmulo antes de a água subir. Roda com bateria Li-ion e painel solar, ou com a rede elétrica municipal.', '<strong>Sensors in the drain:</strong> An ESP32 in a sealed (IP67) box, mounted above the waterline, reads an analog water level sensor and the humidity from a DHT22 near the base, which gives away the build-up before the water rises. It runs on a Li-ion battery and a solar panel, or on the city power grid.'],
  ['<strong>Dados em tempo real:</strong> Os dispositivos enviam as leituras por MQTT para o broker FIWARE, e o dashboard em Python e Django mostra o nível de cada bueiro, os alertas e um mapa dos dispositivos pelos bairros.', '<strong>Real-time data:</strong> The devices send their readings over MQTT to the FIWARE broker, and the Python and Django dashboard shows the level of each drain, the alerts and a map of the devices across neighborhoods.'],
  ['<strong>Alertas:</strong> Quando o nível passa de um limite definido, o sistema dispara o aviso por HTTP ou SMS. O dashboard também guarda o histórico de enchentes por local, com gráficos e relatórios mensais.', '<strong>Alerts:</strong> When the level goes past a set limit, the system sends the warning over HTTP or SMS. The dashboard also keeps the flood history per location, with charts and monthly reports.'],
  ['<strong>Custo baixo:</strong> Menos de R$ 300 por unidade, usando ESP32, sensores comuns e plataformas de código aberto (Mosquitto e FIWARE). Uma solução parecida, de um projeto da FAPESP, custa cerca de R$ 15 mil por unidade. Isso permite instalar dezenas de bueiros críticos em cidades pequenas, e não só pontos isolados.', '<strong>Low cost:</strong> Under R$ 300 per unit, using an ESP32, common sensors and open source platforms (Mosquitto and FIWARE). A similar solution from a FAPESP project costs about R$ 15,000 per unit. That makes it possible to cover dozens of critical drains in small towns, not just a few isolated spots.'],

  // CRMed
  ['<strong>CRMed — Gestão Clínica para o Hospital São Rafael</strong>', '<strong>CRMed — Clinic Management for Hospital São Rafael</strong>'],
  ['Sistema de relacionamento e performance clínica que acompanha a jornada do paciente, da captação do lead ao pós-operatório, feito em equipe para o Hospital São Rafael. Ele liga o marketing, a recepção e os cirurgiões num só lugar e automatiza o contato com o paciente pelo WhatsApp.', 'A patient relationship and clinical performance system that follows the patient journey, from the first lead to post-op care, built as a team for Hospital São Rafael. It brings marketing, the front desk and the surgeons into one place and automates patient contact over WhatsApp.'],
  ['Dashboard do CRMed com indicadores de leads, taxa de conversão e gráficos de tendência e status', 'CRMed dashboard with lead metrics, conversion rate, and trend and status charts'],
  ['Quadro de leads do CRMed organizado em colunas por etapa do funil', 'CRMed lead board organized in columns by funnel stage'],
  ['<strong>Leads e pacientes:</strong> Fluxo de conversão do lead ao paciente, ficha clínica centralizada e auditoria de toda mudança de status.', '<strong>Leads and patients:</strong> Conversion flow from lead to patient, a single clinical record and an audit trail of every status change.'],
  ['<strong>Agenda inteligente:</strong> Disponibilidade dos cirurgiões, bloqueio de horários fora do expediente (08h às 18h) e alertas quando uma confirmação fica mais de 24 horas úteis sem resposta.', '<strong>Smart scheduling:</strong> Surgeon availability, blocking slots outside business hours (8 am to 6 pm) and alerts when a confirmation goes unanswered for more than 24 business hours.'],
  ['<strong>WhatsApp automatizado:</strong> Lembretes 30 dias, 7 dias e 48 horas antes da cirurgia, confirmação e reagendamento, e um chatbot que capta leads e passa para a equipe humana quando precisa.', '<strong>Automated WhatsApp:</strong> Reminders 30 days, 7 days and 48 hours before surgery, confirmation and rescheduling, and a chatbot that captures leads and hands them over to the team when needed.'],
  ['<strong>Risco de não comparecimento:</strong> Uma nota de 0 a 100 por agendamento, calculada a partir de confirmações, cancelamentos anteriores, horário e antecedência, para a equipe ligar antes de perder a cirurgia.', '<strong>No-show risk:</strong> A 0 to 100 score per appointment, based on confirmations, past cancellations, time slot and lead time, so the team can call before the surgery is lost.'],
  ['<strong>Segurança e LGPD:</strong> Controle de acesso por perfil, JWT em cookie HttpOnly, rate limit distribuído no Redis e validação da data de nascimento antes de abrir dados sensíveis.', '<strong>Security and LGPD:</strong> Role-based access control, JWT in an HttpOnly cookie, distributed rate limiting in Redis and a date of birth check before sensitive data is shown.'],
  ['<strong>Por dentro:</strong> Monorepo com pnpm e Turborepo, API GraphQL em Node.js e TypeScript, painel em React, PostgreSQL com Prisma e workers BullMQ com Redis para os lembretes.', '<strong>Under the hood:</strong> A pnpm and Turborepo monorepo, a GraphQL API in Node.js and TypeScript, a React dashboard, PostgreSQL with Prisma and BullMQ workers on Redis for the reminders.'],
  ['crmed.cotoo.dev (documentação)', 'crmed.cotoo.dev (docs)'],

  // Grabtext
  ['<strong>Grabtext — OCR de tela para Linux</strong>', '<strong>Grabtext — Screen OCR for Linux</strong>'],
  ['Ferramenta open source para GNU/Linux que copia para a área de transferência o texto de qualquer coisa que apareça na tela: imagem, vídeo, PDF protegido ou página web. Você aperta uma tecla, seleciona a área e cola o texto com <code>Ctrl+V</code>.', 'An open source GNU/Linux tool that copies to the clipboard the text of anything on the screen: an image, a video, a protected PDF or a web page. You press a key, select the area and paste the text with <code>Ctrl+V</code>.'],
  ['Grabtext em uso: a área com o texto escrito à mão é selecionada no Flameshot e confirmada', 'Grabtext in use: the area with handwritten text is selected in Flameshot and confirmed'],
  ['<strong>Captura:</strong> A seleção da área usa o Flameshot, e o reconhecimento de caracteres usa o Tesseract, com OCR em português e inglês.', '<strong>Capture:</strong> The area is selected with Flameshot and the characters are recognized by Tesseract, with OCR in Portuguese and English.'],
  ['<strong>Interface gráfica e CLI:</strong> No modo gráfico basta apertar <code>INSERT</code>. Na linha de comando, <code>grabtext process</code> lê imagens e pastas inteiras, e <code>grabtext monitor</code> fica de olho numa pasta e processa o que chegar.', '<strong>GUI and CLI:</strong> In graphical mode you just press <code>INSERT</code>. On the command line, <code>grabtext process</code> reads images and whole folders, and <code>grabtext monitor</code> watches a folder and processes whatever lands in it.'],
  ['<strong>Exportação:</strong> A saída pode ser texto, JSON ou CSV, com metadados da imagem e a confiança do OCR, para usar em pipelines e planilhas.', '<strong>Export:</strong> The output can be text, JSON or CSV, with image metadata and the OCR confidence, for pipelines and spreadsheets.'],
  ['<strong>Instalação:</strong> Um <code>install.sh</code> instala as dependências em distribuições baseadas em apt, pacman, dnf ou zypper e configura o atalho.', '<strong>Install:</strong> An <code>install.sh</code> installs the dependencies on apt, pacman, dnf or zypper based distributions and sets up the shortcut.'],
  ['Feito em Python, com OpenCV e Pillow no tratamento da imagem, sob licença MIT.', 'Written in Python, with OpenCV and Pillow for image processing, under the MIT license.'],

  // OEDLA
  ['<strong>OEDLA (Unicamp) — Portal de Notícias &amp; Arquitetura de Cache</strong>', '<strong>OEDLA (Unicamp) — News Portal &amp; Cache Architecture</strong>'],
  ['Arquitetei toda a infraestrutura e a plataforma do OEDLA (iniciativa acadêmica de observatório sediada na Unicamp), concebido e estruturado como um <strong>portal de notícias de ponta a ponta</strong> com foco em alta disponibilidade sob picos de tráfego, SEO agressivo e latência mínima para os leitores no Brasil.', 'I designed the whole infrastructure and platform of OEDLA (an academic observatory based at Unicamp), built as an <strong>end-to-end news portal</strong> focused on high availability under traffic spikes, aggressive SEO and minimal latency for readers in Brazil.'],
  ['Página inicial do OEDLA, com o destaque do observatório e as publicações recentes', 'OEDLA home page, with the observatory banner and the latest publications'],
  ['<strong>Portal de Notícias Ponta a Ponta:</strong> Arquitetura completa para publicação jornalística e acadêmica, contemplando fluxo editorial, gestão de artigos e dossiês, categorização temática, pipeline de renderização rápida e distribuição contínua.', '<strong>End-to-End News Portal:</strong> A complete architecture for journalistic and academic publishing, covering the editorial workflow, management of articles and dossiers, topic categories, a fast rendering pipeline and continuous distribution.'],
  ['<strong>SEO Agressivo &amp; Descoberta:</strong> Otimização técnica aprofundada voltada a indexação imediata nos motores de busca e Google Notícias: Schema.org semântico (<code>NewsArticle</code>), metadados Open Graph/Twitter completos, sitemaps dinâmicos e URLs amigáveis estruturadas para captura de tráfego orgânico.', '<strong>Aggressive SEO &amp; Discovery:</strong> In-depth technical optimization for immediate indexing in search engines and Google News: semantic Schema.org (<code>NewsArticle</code>), complete Open Graph/Twitter metadata, dynamic sitemaps and friendly URLs built to capture organic traffic.'],
  ['<strong>Cache na Borda com ~93% de Hit Ratio:</strong> Proxy reverso e cache no edge da Vercel, com regras rigorosas de cache. Cerca de <strong>~93% de todas as requisições são entregues diretamente pelo cache na borda (edge)</strong>, eliminando gargalos no servidor de origem.', '<strong>Edge Cache with a ~93% Hit Ratio:</strong> A reverse proxy and edge cache on Vercel, with strict caching rules. About <strong>~93% of all requests are served straight from the edge cache</strong>, removing bottlenecks at the origin server.'],
  ['<strong>Baixa Latência no Brasil:</strong> Roteamento inteligente pelos PoPs locais no Brasil (São Paulo, Rio de Janeiro e Fortaleza), garantindo TTFB (Time to First Byte) na casa dos milissegundos sem requisições transatlânticas desnecessárias.', '<strong>Low Latency in Brazil:</strong> Smart routing through local PoPs in Brazil (São Paulo, Rio de Janeiro and Fortaleza), keeping the TTFB (Time to First Byte) in the milliseconds without needless transatlantic requests.'],
  ['<strong>Estratégia Multi-Camadas &amp; Mitigação de Egress:</strong> Cabeçalhos <code>Cache-Control</code> com <code>s-maxage</code> e <code>stale-while-revalidate</code>, garantindo custos de infraestrutura praticamente nulos e blindagem ativa contra bots e scraping abusivo.', '<strong>Multi-Layer Strategy &amp; Egress Mitigation:</strong> <code>Cache-Control</code> headers with <code>s-maxage</code> and <code>stale-while-revalidate</code>, keeping infrastructure costs close to zero and actively shielding against bots and abusive scraping.'],
  ['<strong>Custo de Infraestrutura Zero:</strong> Roda inteiramente em planos gratuitos (R$ 0 por mês), com API em Flask, frontend em React, MongoDB, Redis como cache e Cloudinary para as imagens. A regra que guiou o projeto: a requisição mais barata é a que nunca chega ao servidor.', '<strong>Zero Infrastructure Cost:</strong> It runs entirely on free plans (R$ 0 a month), with a Flask API, a React front end, MongoDB, Redis as a cache and Cloudinary for images. The rule behind the project: the cheapest request is the one that never reaches the server.'],
  ['<strong>Pré-visualização de Links sem SSR:</strong> WhatsApp, LinkedIn e Telegram não executam JavaScript, então o edge reconhece esses bots pelo User-Agent e devolve um HTML mínimo com título, resumo, imagem e JSON-LD, sem precisar de um servidor renderizando páginas.', '<strong>Link Previews without SSR:</strong> WhatsApp, LinkedIn and Telegram do not run JavaScript, so the edge recognizes those bots by their User-Agent and returns minimal HTML with the title, summary, image and JSON-LD, with no server rendering pages.'],
  ['<strong>Login sem Senha:</strong> Os editores entram com um código OTP de 6 dígitos enviado por e-mail (uso único, válido por 10 minutos, 3 tentativas), e recebem um JWT em cookie HTTP-only.', '<strong>Passwordless Login:</strong> Editors sign in with a 6-digit OTP sent by email (single use, valid for 10 minutes, 3 attempts) and get a JWT in an HTTP-only cookie.'],
  ['<strong>Segurança em Camadas:</strong> Porta única (só o proxy fala com a API), rate limit por IP com agrupamento de IPv6 por /64, CORS, sanitização e newsletter com double opt-in e reCAPTCHA.', '<strong>Layered Security:</strong> A single entry point (only the proxy talks to the API), per-IP rate limiting with IPv6 grouped by /64, CORS, sanitization and a newsletter with double opt-in and reCAPTCHA.'],
  ['<span class="modal-link-text">OEDLA: portal editorial com custo zero</span>', '<span class="modal-link-text">OEDLA: an editorial portal at zero cost (in Portuguese)</span>'],

  // PremiumUUID
  ['<strong>PremiumUUID — Plugin de Minecraft</strong>', '<strong>PremiumUUID — Minecraft Plugin</strong>'],
  ['Em servidores com <code>online-mode=false</code>, um jogador com conta premium entra com um UUID diferente do verdadeiro e perde itens, estatísticas e permissões. O PremiumUUID resolve isso: quando o jogador entra, ele confere se o nick é de uma conta premium da Mojang e, se for, usa o UUID real dela.', 'On servers with <code>online-mode=false</code>, a player with a premium account joins with a UUID that differs from the real one and loses items, stats and permissions. PremiumUUID fixes that: when the player joins, it checks whether the name belongs to a premium Mojang account and, if it does, uses its real UUID.'],
  ['Página inicial da documentação do PremiumUUID, com o resumo do plugin e os recursos principais', 'PremiumUUID documentation home page, with a summary of the plugin and its main features'],
  ['Página Como funciona da documentação, com os passos que o plugin segue para decidir o UUID no login', 'The How it works page of the documentation, with the steps the plugin follows to pick the UUID at login'],
  ['<strong>Resolução no login:</strong> Consulta o nick na API da Mojang no <code>AsyncPlayerPreLoginEvent</code>, antes de o jogador ser criado. Contas premium recebem o UUID real, e as demais mantêm o UUID offline.', '<strong>Resolved at Login:</strong> It looks the name up on the Mojang API in <code>AsyncPlayerPreLoginEvent</code>, before the player is created. Premium accounts get their real UUID, and everyone else keeps the offline one.'],
  ['<strong>Cache em disco:</strong> As respostas ficam em <code>uuid-cache.yml</code> com TTL configurável (24 horas por padrão), para não consultar a Mojang a cada entrada.', '<strong>Disk Cache:</strong> Answers are stored in <code>uuid-cache.yml</code> with a configurable TTL (24 hours by default), so Mojang is not queried on every join.'],
  ['<strong>Nunca bloqueia o login:</strong> Se a Mojang estiver lenta, fora do ar ou limitando requisições (HTTP 429), usa o cache expirado ou o UUID offline, sem passar do <code>timeout-ms</code>.', '<strong>Never Blocks a Login:</strong> If Mojang is slow, down or rate limiting (HTTP 429), it uses the expired cache entry or the offline UUID, never waiting past <code>timeout-ms</code>.'],
  ['<strong>Overrides por nick:</strong> Liga ou desliga a checagem premium para um nick específico, independente da configuração global, mesmo antes de o jogador entrar pela primeira vez.', '<strong>Per-Name Overrides:</strong> Turns the premium check on or off for a single name, regardless of the global setting, even before that player first joins.'],
  ['<strong>Bans por identidade:</strong> Um ban em qualquer identidade conhecida do nick (UUID offline, UUID premium ou nome) é aplicado, então ninguém burla um ban trocando de UUID.', '<strong>Identity-Aware Bans:</strong> A ban on any known identity of a name (offline UUID, premium UUID or the name itself) is enforced, so nobody gets around a ban by switching UUIDs.'],
  ['<strong>Comandos de admin:</strong> <code>/premiumuuid</code> (ou <code>/puuid</code>) recarrega a configuração, mostra o estado de um jogador, limpa o cache e define os overrides.', '<strong>Admin Commands:</strong> <code>/premiumuuid</code> (or <code>/puuid</code>) reloads the config, shows a player\'s state, clears the cache and sets the overrides.'],
  ['<strong>Testado de ponta a ponta:</strong> Feito em Java para o Paper e testado em sete versões dele (da 1.21.1 à 26.3) a cada commit, sob licença GPLv3.', '<strong>Tested End to End:</strong> Written in Java for Paper and tested on seven Paper versions (1.21.1 to 26.3) on every commit, under the GPLv3 license.'],
  ['Ele não confirma que o jogador é dono da conta, então serve só para servidores privados e de confiança.', 'It does not prove that the player owns the account, so it is only meant for private, trusted servers.'],

  // Unfinished projects (their cards are commented out)
  ['Actions Heartbeat (Em Construção)', 'Actions Heartbeat (Under Construction)'],
  ['Um dead man\'s switch em formato SaaS para monitoramento de workflows de cron do GitHub Actions. Sistema desenvolvido do zero com FastAPI, MongoDB, Redis e React, envelopado por um design system próprio inspirado em traçados de eletrocardiograma. Repositório e case study arquitetural serão publicados em breve.', 'A dead man\'s switch SaaS that monitors GitHub Actions cron workflows. Built from scratch with FastAPI, MongoDB, Redis and React, wrapped in its own design system inspired by electrocardiogram traces. The repository and an architecture case study are coming soon.'],
  ['Caderno Digital (Em Construção)', 'Digital Notebook (Under Construction)'],
  ['Projeto de hardware embarcado integrando um ESP32 a uma tela touchscreen de 7 polegadas. A interface local é desenhada via LVGL e os dados são sincronizados em tempo real através de SignalR/WebSockets. Conta com integração ao Azure AI Vision para OCR direto no dispositivo. A documentação completa e o código-fonte estarão abertos em breve.', 'An embedded hardware project that connects an ESP32 to a 7-inch touchscreen. The local interface is drawn with LVGL and the data syncs in real time over SignalR/WebSockets. It uses Azure AI Vision for OCR straight from the device. The full documentation and source code will be open soon.'],

  // Gallery buttons
  ['aria-label="Ampliar: ', 'aria-label="Enlarge: '],
];
