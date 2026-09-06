/**
 * main.js
 * -------------------------------------------------------------
 * Glue code: starts the camera + game on user action, feeds
 * Game.setInput() every frame from either hand-tracking data or
 * a keyboard fallback, and updates the HUD elements.
 * -------------------------------------------------------------
 */

(() => {
  const gameCanvas = document.getElementById("gameCanvas");
  const gestureCanvas = document.getElementById("gestureCanvas");
  const inputVideo = document.getElementById("inputVideo");

  const startOverlay = document.getElementById("startOverlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const finalScoreLabel = document.getElementById("finalScoreLabel");

  const handStatusDot = document.getElementById("handStatusDot");
  const handStatusText = document.getElementById("handStatusText");
  const scoreReadout = document.getElementById("scoreReadout");
  const speedReadout = document.getElementById("speedReadout");
  const throttleReadout = document.getElementById("throttleReadout");
  const laneReadout = document.getElementById("laneReadout");
  const steerReadout = document.getElementById("steerReadout");
  const radarNeedle = document.getElementById("radarNeedle");

  let cameraActive = false;

  // ---- keyboard fallback -------------------------------------------------
  const keys = { left: false, right: false, brake: false, boost: false };
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") keys.brake = true;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") keys.boost = true;
    if (e.key.toLowerCase() === "s" && startOverlay && !startOverlay.classList.contains("hidden")) {
      beginGame({ useCamera: false });
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") keys.brake = false;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") keys.boost = false;
  });

  let keyboardSteer = 0;

  // ---- HUD helpers --------------------------------------------------------
  function updateRadar(steer) {
    // Needle sweeps between -55deg (full left) and +55deg (full right)
    // around the hub at (100,110).
    const angle = steer * 55;
    radarNeedle.style.transformOrigin = "100px 110px";
    radarNeedle.style.transform = `rotate(${angle}deg)`;
    steerReadout.textContent = steer.toFixed(2);
  }

  function updateHandStatus(detected) {
    handStatusDot.classList.toggle("active", detected);
    handStatusText.textContent = detected ? "HAND TRACKED" : (cameraActive ? "SEARCHING…" : "KEYBOARD MODE");
  }

  // ---- main input -> game bridge ------------------------------------------
  function frameTick() {
    let steer, throttle;

    if (cameraActive) {
      steer = window.gestureState.steer;
      throttle = window.gestureState.throttle;
      updateHandStatus(window.gestureState.handDetected);
    } else {
      const target = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      keyboardSteer += (target - keyboardSteer) * 0.2;
      steer = keyboardSteer;
      throttle = keys.brake ? "brake" : keys.boost ? "boost" : "normal";
      updateHandStatus(false);
    }

    Game.setInput(steer, throttle);
    updateRadar(steer);
    laneReadout.textContent = steer.toFixed(2);
    throttleReadout.textContent = throttle.toUpperCase();

    requestAnimationFrame(frameTick);
  }

  // ---- lifecycle ------------------------------------------------------------
  Game.init(gameCanvas, {
    onScore: (v) => (scoreReadout.textContent = String(v).padStart(4, "0")),
    onSpeed: (v) => (speedReadout.textContent = String(v).padStart(3, "0")),
    onThrottle: () => {}, // handled in frameTick for immediacy
    onGameOver: (finalScore) => {
      finalScoreLabel.textContent = `${finalScore} M`;
      gameOverOverlay.classList.remove("hidden");
    }
  });

  async function beginGame({ useCamera }) {
    startOverlay.classList.add("hidden");
    gameOverOverlay.classList.add("hidden");

    if (useCamera) {
      try {
        await Gesture.start(inputVideo, gestureCanvas);
        cameraActive = true;
      } catch (err) {
        console.warn("Camera/hand-tracking unavailable, falling back to keyboard:", err);
        cameraActive = false;
        handStatusText.textContent = "CAMERA UNAVAILABLE — KEYBOARD MODE";
      }
    } else {
      cameraActive = false;
    }

    Game.start();
    requestAnimationFrame(frameTick);
  }

  startBtn.addEventListener("click", () => beginGame({ useCamera: true }));
  restartBtn.addEventListener("click", () => {
    gameOverOverlay.classList.add("hidden");
    Game.start();
  });
})();
