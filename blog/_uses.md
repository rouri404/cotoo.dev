---
title: uses
description: O hardware, o sistema imutável e as ferramentas que eu uso no dia a dia.
date: 2026-10-23
---

## Máquina

Um desktop só, que precisa dar conta de containers, emuladores e builds rodando ao mesmo tempo.

- **CPU:** AMD Ryzen 7 5700X, 8 núcleos e 16 threads.
- **GPU:** NVIDIA GeForce RTX 4060, com o driver proprietário do [RPM Fusion](https://rpmfusion.org) (`akmod-nvidia`) assinado para funcionar com o Secure Boot ligado.
- **RAM:** 24 GB DDR4 a 3200 MHz.
- **Armazenamento:** dois SSDs NVMe, um Kingston NV2 de 1 TB e um de 128 GB.

## Periféricos

- **Teclado:** X85 Pro com keycaps de perfil XDA, baixas e retas, entre o perfil baixo e o médio.
- **Mouse:** ATK A9 Plus.
- **RGB:** a iluminação fica toda no [OpenRGB](https://openrgb.org), sem instalar o software de cada fabricante. E fica no branco mesmo.

## Sistema

- **Sistema operacional:** [Fedora Silverblue](https://fedoraproject.org/atomic-desktops/silverblue/) 43. A base é imutável e atualizada pelo [`rpm-ostree`](https://coreos.github.io/rpm-ostree/): cada atualização vira uma imagem nova, e se algo quebrar basta escolher a anterior no boot.
- **Pacotes no host:** só o que não funciona bem dentro de container fica em camada sobre a imagem, como o driver da NVIDIA, o Docker, o `git`, o [`gh`](https://cli.github.com) e o [`earlyoom`](https://github.com/rfjakob/earlyoom), que encerra o processo mais pesado antes de a memória acabar e a máquina travar.
- **Apps gráficos:** todos em Flatpak, do [Flathub](https://flathub.org), com as permissões ajustadas no [Flatseal](https://github.com/tchx84/Flatseal).
- **Ambiente gráfico:** [GNOME](https://www.gnome.org) 49, no tema escuro.
- **Extensões do GNOME:** [Dash to Dock](https://micheleg.github.io/dash-to-dock/), [Search Light](https://github.com/icedman/search-light) (a busca de apps abre no meio da tela), [Vertical Workspaces](https://github.com/G-dH/vertical-workspaces), [Clipboard History](https://github.com/SUPERCILEX/gnome-clipboard-history) e [Caffeine](https://github.com/eonpatapon/gnome-shell-extension-caffeine). Também uso a [lâmpada mágica do Compiz](https://github.com/hermes83/compiz-alike-magic-lamp-effect) e o [Burn My Windows](https://github.com/Schneegans/Burn-My-Windows) com o efeito de TV antiga: a janela nasce de uma linha horizontal e se abre na vertical, como um tubo de imagem ligando. Não ajudam em nada, mas nunca perdem a graça.

## Terminal

- **Emulador:** [Ptyxis](https://gitlab.gnome.org/chergert/ptyxis), o terminal padrão do Fedora. Ele reconhece os containers do Toolbx, então cada aba já abre no ambiente certo. Fonte AdwaitaMono [Nerd Font](https://www.nerdfonts.com) e paleta Darkside.
- **Shell:** Bash com [Oh My Posh](https://ohmyposh.dev). O tema que fiz ([`oh-my-posh-toolbx`](https://github.com/rouri404/oh-my-posh-toolbx)) mostra no prompt se o shell está no host ou dentro de um container do Toolbx.
- **Editores:** Nano para ajustes rápidos em arquivos de configuração e o Vim que já vem no sistema para o resto.

## Desenvolvimento

Como a raiz do Silverblue é somente leitura, nenhum runtime de projeto é instalado na imagem do sistema.

- **Toolbx:** um container do [Toolbx](https://containertoolbx.org) por stack, todos a partir da imagem `fedora-toolbox`: `java`, com o OpenJDK 21, e `csharp`, com o SDK do .NET 10. O que eu instalo ou quebro lá dentro não encosta no host.
- **Node.js e Python:** Node pelo [`nvm`](https://github.com/nvm-sh/nvm) e Python com o [`uv`](https://docs.astral.sh/uv/), os dois na pasta do usuário, fora da imagem.
- **Serviços locais:** cada projeto tem o seu [Docker Compose](https://docs.docker.com/compose/), com PostgreSQL, Redis, [Mailhog](https://github.com/mailhog/MailHog) para pegar os e-mails de teste e até um servidor de Minecraft ([`itzg/minecraft-server`](https://github.com/itzg/docker-minecraft-server)) para testar o [PremiumUUID](https://premiumuuid.cotoo.dev). O [Podman](https://podman.io) fica com os containers do Toolbx.
- **Editor:** [VS Code](https://code.visualstudio.com), no tema escuro com o [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme). As extensões que não saem: [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens), [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), o [pacote de Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack), [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance), [PlatformIO](https://platformio.org) para microcontroladores e [Markdown Mermaid](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid), que uso para revisar os diagramas do blog.
- **APIs e bancos:** [Bruno](https://www.usebruno.com) para testar APIs, com as coleções em arquivos versionados junto do código, e [DBeaver](https://dbeaver.io) para os bancos.
- **Mobile:** [Android Studio](https://developer.android.com/studio), pelo SDK e pelo emulador do Android.

## Apps do dia a dia

- **Navegador:** [Brave](https://brave.com), pelo bloqueio de rastreadores embutido e pelo DevTools do Chromium.
- **Música:** Spotify, quase sempre tocando. É ele que alimenta o widget da home e o fone do Tux.
- **OCR de tela:** [Grabtext](https://github.com/rouri404/grabtext), um utilitário open source que fiz em Python (com Flameshot, Tesseract e OpenCV) para copiar o texto de qualquer área da tela apertando `Insert`.
- **Documentos:** [ONLYOFFICE](https://www.onlyoffice.com).
- **Imagens:** [Pinta](https://www.pinta-project.com), para edições rápidas.
- **VPN:** [Proton VPN](https://protonvpn.com).
