/**
 * gesture.js
 * -------------------------------------------------------------
 * Wraps MediaPipe Hands to turn a webcam feed into a small,
 * game-friendly state object:
 *
 *   window.gestureState = {
 *     handDetected: boolean,
 *     steer:        -1..1   (palm x-position across the frame)
 *     throttle:     "brake" | "normal" | "boost"
 *     raw:          last landmark array (or null)
 *   }
 *
 * Everything runs locally in the browser — frames are never
 * uploaded anywhere. If the camera / MediaPipe scripts fail to
 * load, gestureState.handDetected simply stays false and the
 * game falls back to keyboard control (see main.js).
 * -------------------------------------------------------------
 */

window.gestureState = {
  handDetected: false,
  steer: 0,
  throttle: "normal",
  raw: null
};

const Gesture = (() => {
  let hands = null;
  let camera = null;
  let videoEl = null;
  let canvasEl = null;
  let canvasCtx = null;
  let started = false;

  // Smoothing so small tracking jitter doesn't make the car twitch.
  let smoothedSteer = 0;
  const STEER_SMOOTHING = 0.35; // higher = snappier, lower = smoother

  /** Landmark indices we care about (MediaPipe Hands topology). */
  const WRIST = 0;
  const THUMB_TIP = 4;
  const INDEX_TIP = 8, INDEX_PIP = 6;
  const MIDDLE_TIP = 12, MIDDLE_PIP = 10, MIDDLE_MCP = 9;
  const RING_TIP = 16, RING_PIP = 14;
  const PINKY_TIP = 20, PINKY_PIP = 18;

  function dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Counts how many of the 4 fingers (not thumb) are extended. */
  function countExtendedFingers(lm) {
    const pairs = [
      [INDEX_TIP, INDEX_PIP],
      [MIDDLE_TIP, MIDDLE_PIP],
      [RING_TIP, RING_PIP],
      [PINKY_TIP, PINKY_PIP]
    ];
    let extended = 0;
    for (const [tip, pip] of pairs) {
      // A finger is "extended" if its tip is meaningfully farther from
      // the wrist than its middle knuckle is — works regardless of
      // hand rotation, unlike a plain y-coordinate comparison.
      if (dist(lm[tip], lm[WRIST]) > dist(lm[pip], lm[WRIST]) * 1.12) {
        extended++;
      }
    }
    return extended;
  }

  function classifyThrottle(lm) {
    const extended = countExtendedFingers(lm);
    const palmSize = dist(lm[WRIST], lm[MIDDLE_MCP]) || 0.001;
    const raisedAboveWrist = (lm[WRIST].y - lm[MIDDLE_MCP].y) / palmSize;

    if (extended <= 1) return "brake";                      // fist
    if (extended >= 4 && raisedAboveWrist > 0.9) return "boost"; // open palm, raised
    return "normal";
  }

  function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);

    const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;

    if (hasHand) {
      const lm = results.multiHandLandmarks[0];

      if (window.drawConnectors && window.HAND_CONNECTIONS) {
        window.drawConnectors(canvasCtx, lm, window.HAND_CONNECTIONS, {
          color: "rgba(76,224,210,0.85)",
          lineWidth: 2
        });
        window.drawLandmarks(canvasCtx, lm, {
          color: "#ff3d81",
          fillColor: "#ff3d81",
          radius: 2.5
        });
      }

      // Palm-center x drives steering. MediaPipe gives normalized (0..1)
      // coordinates on the RAW (unmirrored) frame; we mirror it so moving
      // your hand to YOUR right steers right on screen, matching what
      // you see in the little preview (which is CSS-mirrored).
      const rawX = 1 - lm[MIDDLE_MCP].x;
      const target = (rawX - 0.5) * 2.4; // -1.2..1.2, clamped below
      smoothedSteer += (target - smoothedSteer) * STEER_SMOOTHING;
      const clamped = Math.max(-1, Math.min(1, smoothedSteer));

      window.gestureState.handDetected = true;
      window.gestureState.steer = clamped;
      window.gestureState.throttle = classifyThrottle(lm);
      window.gestureState.raw = lm;
    } else {
      window.gestureState.handDetected = false;
      // Let steering ease back toward center when the hand is lost,
      // rather than snapping, so the car doesn't jolt.
      smoothedSteer *= 0.85;
      window.gestureState.steer = smoothedSteer;
      window.gestureState.throttle = "normal";
      window.gestureState.raw = null;
    }

    canvasCtx.restore();
  }

  /**
   * Starts the webcam + hand tracker. Must be called from a user
   * gesture (button click) so the browser grants camera permission.
   * Returns a promise that resolves once the camera is running, or
   * rejects if the camera / MediaPipe assets are unavailable.
   */
  async function start(videoElement, canvasElement) {
    if (started) return;
    videoEl = videoElement;
    canvasEl = canvasElement;
    canvasCtx = canvasEl.getContext("2d");

    if (typeof Hands === "undefined" || typeof Camera === "undefined") {
      throw new Error("MediaPipe scripts did not load (check your internet connection).");
    }

    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });
    hands.onResults(onResults);

    camera = new Camera(videoEl, {
      onFrame: async () => {
        await hands.send({ image: videoEl });
      },
      width: 480,
      height: 360
    });

    await camera.start();
    started = true;
  }

  function stop() {
    if (camera) camera.stop();
    started = false;
  }

  return { start, stop };
})();
