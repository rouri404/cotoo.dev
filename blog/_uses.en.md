---
title: uses
description: The hardware, immutable Linux desktop and tools I use every day.
date: 2026-10-23
---

## Machine

A single desktop that has to handle containers, emulators and builds running at the same time.

- **CPU:** AMD Ryzen 7 5700X, 8 cores and 16 threads.
- **GPU:** NVIDIA GeForce RTX 4060, on the proprietary [RPM Fusion](https://rpmfusion.org) driver (`akmod-nvidia`), signed so it works with Secure Boot on.
- **RAM:** 24 GB of DDR4 at 3200 MHz.
- **Storage:** two NVMe SSDs, a 1 TB Kingston NV2 and a 128 GB one.

## Peripherals

- **Keyboard:** X85 Pro with XDA-profile keycaps, flat and uniform, between low and medium height.
- **Mouse:** ATK A9 Plus.
- **RGB:** all the lighting runs through [OpenRGB](https://openrgb.org), so I don't need each vendor's software. And it stays plain white.

## System

- **Operating system:** [Fedora Silverblue](https://fedoraproject.org/atomic-desktops/silverblue/) 43. The base is immutable and updated by [`rpm-ostree`](https://coreos.github.io/rpm-ostree/): every update is a new image, and if something breaks I just pick the previous one at boot.
- **Host packages:** only what doesn't work well inside a container is layered on top of the image, like the NVIDIA driver, Docker, `git`, [`gh`](https://cli.github.com) and [`earlyoom`](https://github.com/rfjakob/earlyoom), which kills the heaviest process before memory runs out and the machine freezes.
- **Desktop apps:** all Flatpaks from [Flathub](https://flathub.org), with permissions tuned in [Flatseal](https://github.com/tchx84/Flatseal).
- **Desktop environment:** [GNOME](https://www.gnome.org) 49, in dark mode.
- **GNOME extensions:** [Dash to Dock](https://micheleg.github.io/dash-to-dock/), [Search Light](https://github.com/icedman/search-light) (app search in the middle of the screen), [Vertical Workspaces](https://github.com/G-dH/vertical-workspaces), [Clipboard History](https://github.com/SUPERCILEX/gnome-clipboard-history) and [Caffeine](https://github.com/eonpatapon/gnome-shell-extension-caffeine). I also run the [Compiz magic lamp](https://github.com/hermes83/compiz-alike-magic-lamp-effect) and [Burn My Windows](https://github.com/Schneegans/Burn-My-Windows) with the old TV effect: each window starts as a horizontal line and opens up vertically, like a CRT warming up. They add nothing, but they never get old.

## Terminal

- **Emulator:** [Ptyxis](https://gitlab.gnome.org/chergert/ptyxis), Fedora's default terminal. It knows about Toolbx containers, so each tab opens in the right environment. AdwaitaMono [Nerd Font](https://www.nerdfonts.com) with the Darkside palette.
- **Shell:** Bash with [Oh My Posh](https://ohmyposh.dev). My theme ([`oh-my-posh-toolbx`](https://github.com/rouri404/oh-my-posh-toolbx)) shows on the prompt whether the shell is on the host or inside a Toolbx container.
- **Editors:** Nano for quick config edits and the Vim that ships with the system for everything else.

## Development

Since Silverblue's root is read-only, no project runtime is installed on the system image.

- **Toolbx:** one [Toolbx](https://containertoolbx.org) container per stack, all from the `fedora-toolbox` image: `java`, with OpenJDK 21, and `csharp`, with the .NET 10 SDK. Whatever I install or break in there never touches the host.
- **Node.js and Python:** Node through [`nvm`](https://github.com/nvm-sh/nvm) and Python with [`uv`](https://docs.astral.sh/uv/), both in my home folder, outside the image.
- **Local services:** each project has its own [Docker Compose](https://docs.docker.com/compose/) file, with PostgreSQL, Redis, [Mailhog](https://github.com/mailhog/MailHog) to catch test emails and even a Minecraft server ([`itzg/minecraft-server`](https://github.com/itzg/docker-minecraft-server)) to test [PremiumUUID](https://premiumuuid.cotoo.dev). [Podman](https://podman.io) runs the Toolbx containers.
- **Editor:** [VS Code](https://code.visualstudio.com), dark theme with the [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme). The extensions that never leave: [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens), [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), the [Java pack](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack), [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance), [PlatformIO](https://platformio.org) for microcontrollers and [Markdown Mermaid](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid), which I use to review the blog's diagrams.
- **APIs and databases:** [Bruno](https://www.usebruno.com) for testing APIs, with collections stored as files versioned next to the code, and [DBeaver](https://dbeaver.io) for databases.
- **Mobile:** [Android Studio](https://developer.android.com/studio), for the Android SDK and emulator.

## Daily apps

- **Browser:** [Brave](https://brave.com), for its built-in tracker blocking and Chromium DevTools.
- **Music:** Spotify, nearly always playing. It feeds the home page widget and Tux's headphones.
- **Screen OCR:** [Grabtext](https://github.com/rouri404/grabtext), an open-source Python utility I built (with Flameshot, Tesseract and OpenCV) to copy the text from any region of the screen by pressing `Insert`.
- **Documents:** [ONLYOFFICE](https://www.onlyoffice.com).
- **Images:** [Pinta](https://www.pinta-project.com), for quick edits.
- **VPN:** [Proton VPN](https://protonvpn.com).
