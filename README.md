# 🕹️ GestureDrive

A tiny browser driving game you control **with your hand, on your webcam** —
no controller, no keyboard (though it has a fallback for those, too).

Built with plain HTML/CSS/JS, [MediaPipe Hands](https://developers.google.com/mediapipe)
for hand tracking, and Canvas2D for the game itself. No build step, no backend —
everything (including your camera feed) stays in your browser tab.

![status](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-4ce0d2)
![status](https://img.shields.io/badge/tracking-MediaPipe%20Hands-ff3d81)
![license](https://img.shields.io/badge/license-MIT-8b93a7)

## How it plays

Your car auto-scrolls down an endless 3-lane highway. Dodge oncoming traffic
for as long as you can — distance survived is your score.

| Gesture | Effect |
|---|---|
| Move open hand left / right across the frame | Steer left / right |
| Make a fist | Brake (slow down, easier to dodge) |
| Open palm, raised above your wrist | Boost (faster, higher score rate, riskier) |
| No hand / camera denied | Falls back to **arrow keys** or **WASD** |

Press `S` on the start screen to skip the camera and play with the keyboard.

## Running it

This is a fully static site — any static file server works.

```bash
# clone it
git clone https://github.com/<your-username>/gesture-drive.git
cd gesture-drive

# serve it (any static server works, here's one that needs no install)
npx serve .
# then open the printed http://localhost:... URL
```

You can't just double-click `index.html` and open it as a `file://` URL —
browsers block camera access on `file://` pages, so it needs to be served
over `http://localhost` or `https://`.

### Deploying to GitHub Pages

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`. Save.
4. Your game will be live at `https://<your-username>.github.io/gesture-drive/`.

GitHub Pages serves over HTTPS, which is required for camera access in the browser.

## How the hand-tracking works

`gesture.js` sets up a MediaPipe `Hands` model and a `Camera` helper that
feeds it webcam frames. On every detected frame it:

1. Reads the **palm-center landmark** (`x` position) and maps it to a
   `-1 (left) … 1 (right)` steering value, smoothed over time so tracking
   jitter doesn't make the car twitch.
2. Counts how many fingers are **extended** (tip farther from the wrist than
   the middle knuckle) to tell a fist from an open palm.
3. Combines finger count + hand height to classify throttle as
   `brake` / `normal` / `boost`.

That state is exposed as `window.gestureState`, which `main.js` reads every
animation frame and hands to the game via `Game.setInput(steer, throttle)`.

## Project structure

```
gesture-drive/
├── index.html      # page structure, HUD layout, CDN script tags
├── style.css        # neon-arcade HUD theme
├── gesture.js        # MediaPipe Hands wrapper → { steer, throttle, handDetected }
├── game.js            # canvas game: road, car physics, obstacles, scoring
├── main.js             # wires gesture/keyboard input into the game loop + HUD
└── README.md
```

Each file is independent on purpose — swap `gesture.js` for a different
tracking backend (e.g. a different model, or a Leap Motion / pose-based
input) without touching the game logic at all, as long as it keeps writing
to `window.gestureState`.

## Customizing

- **Sensitivity / smoothing** — `STEER_SMOOTHING` in `gesture.js`.
- **Difficulty ramp, obstacle spawn rate, speed** — top of `game.js`
  (`baseSpeed`, `spawnInterval`, the `elapsed * ...` ramps in `update()`).
- **Look & feel** — CSS custom properties at the top of `style.css`
  (`--cyan`, `--magenta`, `--amber`, fonts, etc).

## Browser support

Needs a browser with `getUserMedia` and WebAssembly support (recent Chrome,
Edge, Firefox, or Safari). Works on mobile, but a front-facing camera and a
bit of space to move your hand around make it far more playable on desktop.

## License

MIT — see [LICENSE](LICENSE).
