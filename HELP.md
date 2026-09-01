# Help — Running & Publishing GestureDrive

This file covers two things:
1. Running the game locally (you've already done this ✅)
2. Getting it up on GitHub so you have a real repo + optional live link

Drop this file straight into your `gesture-drive` folder alongside `README.md`.

---

## 1. Running it locally (recap)

From inside the `gesture-drive` folder:

```bash
npx serve .
```

Then open the printed address (usually `http://localhost:3000`) in **Chrome**,
click **Enable camera & start**, and click **Allow** on the permission prompt.

Stuck mid-command? Press `Ctrl + C` in the terminal to cancel whatever is
running, then try the command again on a fresh line.

No camera / camera not working? On the start screen, press the `S` key to
play with arrow keys / WASD instead.

---

## 2. Putting it on GitHub

### Step A — Create the repo on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `gesture-drive`
3. Leave it **empty** — do NOT check "Add a README" (you already have one)
4. Click **Create repository**
5. Keep that page open — it shows the commands from Step B

### Step B — Push your local folder to it

Open a terminal **inside your `gesture-drive` folder** (same place you ran
`npx serve .` from) and run these one line at a time, waiting for each to
finish:

```bash
git init
git add .
git commit -m "Initial commit: GestureDrive"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/gesture-drive.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username. GitHub will show
you this exact block (with your username already filled in) on the empty
repo page — you can copy it straight from there instead of editing it here.

If it asks you to log in, follow the prompt (browser sign-in or a
personal access token — GitHub will walk you through whichever it needs).

**No `git` command found?** Install it first:
- Mac: run `git --version` — macOS will offer to install it via Xcode
  Command Line Tools if it's missing. Accept the prompt, then retry.
- Windows: download from [git-scm.com](https://git-scm.com/download/win)

### Step C — Turn on GitHub Pages (free live link)

1. On your repo page: **Settings → Pages** (left sidebar)
2. Under "Build and deployment" → Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)` → **Save**
4. Wait ~1 minute, then refresh — your live URL appears at the top:
   `https://YOUR-USERNAME.github.io/gesture-drive/`

This link works for anyone, on any device with a camera — no terminal
needed, since GitHub Pages serves it over HTTPS (required for camera access).

---

## 3. Making future changes

After you edit any file (e.g. tweak `gesture.js`), push updates with:

```bash
git add .
git commit -m "describe what you changed"
git push
```

GitHub Pages auto-updates the live link a minute or two after each push.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `zsh: command not found: npx` | Install [Node.js](https://nodejs.org) (LTS version), then reopen your terminal |
| `zsh: command not found: git` | See "No git command found?" above |
| Terminal stuck asking `replace file? [y]es...` | Type `A` and press Enter to accept all and continue |
| Camera preview stays black | Check the browser tab/address bar for a blocked camera icon and allow it, or check System Settings → Privacy → Camera on Mac |
| Page loads but looks unstyled / broken | Make sure you're opening it via `http://localhost:...`, not double-clicking `index.html` directly |
| `git push` asks for a password and rejects it | GitHub no longer accepts account passwords for this — use the token/browser login flow it prompts you with |
