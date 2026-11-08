# mise installation (local host only)

Faneqo uses [mise](https://mise.jdx.dev/) on the **development host** to pin Node from `.env` via root `mise.toml`. Staging droplet and staging containers do **not** need mise.

Official docs: [mise.jdx.dev](https://mise.jdx.dev/) · [Getting started](https://mise.jdx.dev/getting-started.html) · [Installing mise](https://mise.jdx.dev/installing-mise.html)

After install, from this repo: `cp example.env .env` (if needed), then `mise install`.

---

## 1. Linux (Bash)

Recommended: official install script, then activate Bash:

```bash
curl -fsSL https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
mise --version
```

One-step install + Bash activation: `curl -fsSL https://mise.run/bash | sh`

Zsh / Fish and other methods: [Getting started — activate](https://mise.jdx.dev/getting-started.html#_4-activate-mise-optional) · [Installing mise](https://mise.jdx.dev/installing-mise.html)

---

## 2. macOS

**Install script** (recommended; same as Linux):

```bash
curl -fsSL https://mise.run | sh
```

**Homebrew** (formula can lag / differ from official binaries):

```bash
brew install mise
```

Activate for your shell (use `mise` instead of `~/.local/bin/mise` if Homebrew installed it):

```bash
# zsh (default on modern macOS)
echo 'eval "$(~/.local/bin/mise activate zsh)"' >> "${ZDOTDIR:-$HOME}/.zshrc"
source "${ZDOTDIR:-$HOME}/.zshrc"

# bash
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
```

One-step: `curl -fsSL https://mise.run/zsh | sh` or `…/bash | sh`

---

## 3. Windows native (`.exe`)

**PowerShell script** (recommended by mise; official release binaries):

```powershell
irm https://mise.run/powershell | iex
```

**Winget:**

```powershell
winget install jdx.mise
```

Winget can lag releases; upgrade with `winget upgrade jdx.mise`. Restart the terminal after install. Shell activation: [Getting started](https://mise.jdx.dev/getting-started.html#_4-activate-mise-optional) (PowerShell tab).

---

## 4. Windows WSL + Bash

Install the **Linux** binary inside WSL (not the Windows `.exe`).

### Install inside WSL

```bash
curl -fsSL https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
mise --version
```

### Stop Windows PATH pollution

WSL often appends Windows `.exe` paths into Linux `PATH`, which can break Linux tools. Disable that:

```bash
sudo nano /etc/wsl.conf
```

Add:

```ini
[interop]
appendWindowsPath = false
```

Save and exit.

### Restart WSL

From **Windows** PowerShell or cmd:

```powershell
wsl --shutdown
```

Reopen your WSL terminal, then run `mise --version` again.
