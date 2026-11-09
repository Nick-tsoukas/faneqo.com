# Docker + Compose installation

Faneqo needs **Docker Engine** and **Compose V2** as `docker compose` (plugin). Local `npm run dev` starts Postgres; `npm run staging` starts Postgres + FE + BE from root `docker-compose.yml`. Needs **Compose ≥ 2.18**.

Official docs: [Docker Engine install](https://docs.docker.com/engine/install/) · [Compose plugin](https://docs.docker.com/compose/install/) · [Docker Desktop](https://docs.docker.com/desktop/)

After install, from this repo you only need a working daemon — stackrun drives compose.

---

## 1. Linux (Ubuntu / Debian / Pop!_OS)

Recommended: Docker’s official apt repo (Engine + Compose plugin).

Remove conflicting distro packages if present:

```bash
sudo apt remove docker.io docker-compose docker-compose-v2 docker-doc podman-docker 2>/dev/null || true
```

Add Docker’s apt repository and install:

```bash
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Start daemon (usually already enabled):

```bash
sudo systemctl enable --now docker
```

Use Docker without `sudo` (log out/in after):

```bash
sudo usermod -aG docker "$USER"
```

Verify:

```bash
docker version
docker compose version
sudo docker run --rm hello-world
```

**Debian** (not Ubuntu): same steps but use Docker’s Debian repo — [Install Docker Engine on Debian](https://docs.docker.com/engine/install/debian/).

**Fedora / RHEL / CentOS:** [Fedora](https://docs.docker.com/engine/install/fedora/) · [RHEL](https://docs.docker.com/engine/install/rhel/) · [CentOS](https://docs.docker.com/engine/install/centos/) — install `docker-ce` + `docker-compose-plugin` from Docker’s yum/dnf repo the same way.

---

## 2. macOS

**Docker Desktop** (recommended; includes Engine + Compose V2):

1. Download: [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
2. Open the `.dmg`, drag Docker to Applications, launch Docker Desktop
3. Wait until the whale icon shows Docker is running

**Homebrew cask:**

```bash
brew install --cask docker
open -a Docker
```

Verify in Terminal:

```bash
docker version
docker compose version
```

---

## 3. Windows native

**Docker Desktop** (recommended; WSL2 backend):

1. Download: [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
2. Run the installer, enable **WSL 2** when prompted
3. Reboot if asked, then start Docker Desktop

**Winget:**

```powershell
winget install Docker.DockerDesktop
```

Restart the terminal (and start Docker Desktop if needed). Verify:

```powershell
docker version
docker compose version
```

---

## 4. Windows WSL + Bash

Prefer **Docker Desktop on Windows** with WSL integration (Settings → Resources → WSL integration → enable your distro). Then inside WSL:

```bash
docker version
docker compose version
```

### Or: Engine inside WSL only

Install the **Linux** packages inside WSL (same commands as §1 Ubuntu/Debian) — not the Windows `.exe` on `PATH`.

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

Reopen your WSL terminal, then run `docker version` and `docker compose version` again.
