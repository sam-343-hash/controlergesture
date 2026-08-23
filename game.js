/**
 * game.js
 * -------------------------------------------------------------
 * Small self-contained top-down "endless highway" driving game.
 * Knows nothing about gestures or the keyboard — it just reads
 * Game.input.steer (-1..1) and Game.input.throttle
 * ("brake" | "normal" | "boost") every frame, which main.js sets
 * from whichever control source is active.
 * -------------------------------------------------------------
 */

const Game = (() => {
  let canvas, ctx;
  let width, height;

  const ROAD_MARGIN = 36;      // shoulder width on each side
  const LANE_COUNT = 3;

  let roadLeft, roadRight, roadWidth;

  const player = {
    w: 40, h: 66,
    x: 0,      // center x, in road space
    y: 0,      // fixed near bottom
    steerVel: 0
  };

  let obstacles = [];
  let dashOffset = 0;

  let baseSpeed = 220;      // px/sec, world scroll speed
  let speed = baseSpeed;
  let distance = 0;         // -> score
  let elapsed = 0;
  let spawnTimer = 0;
  let spawnInterval = 1.1;

  let running = false;
  let gameOver = false;
  let rafId = null;
  let lastT = 0;

  const input = { steer: 0, throttle: "normal" };

  const hooks = {
    onScore: () => {},
    onSpeed: () => {},
    onThrottle: () => {},
    onGameOver: () => {}
  };

  function init(canvasEl, hookOverrides) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;
    Object.assign(hooks, hookOverrides || {});

    roadLeft = ROAD_MARGIN;
    roadRight = width - ROAD_MARGIN;
    roadWidth = roadRight - roadLeft;

    reset();
    render(); // paint initial frame before the player starts
  }

  function reset() {
    player.x = width / 2;
    player.y = height - 110;
    player.steerVel = 0;
    obstacles = [];
    dashOffset = 0;
    speed = baseSpeed;
    distance = 0;
    elapsed = 0;
    spawnTimer = 0;
    spawnInterval = 1.1;
    gameOver = false;
  }

  function laneCenterX(laneIndex) {
    const laneW = roadWidth / LANE_COUNT;
    return roadLeft + laneW * (laneIndex + 0.5);
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const w = 38 + Math.random() * 8;
    const h = 60 + Math.random() * 14;
    const hue = ["#ff3d81", "#ffb020", "#8f7bff", "#4ce0d2"][Math.floor(Math.random() * 4)];
    obstacles.push({
      x: laneCenterX(lane) + (Math.random() * 20 - 10),
      y: -h,
      w, h,
      color: hue
    });
  }

  function update(dt) {
    if (gameOver) return;

    elapsed += dt;

    // Difficulty ramps slowly with survival time.
    baseSpeed = 220 + Math.min(260, elapsed * 6);

    const throttleMult =
      input.throttle === "boost" ? 1.55 :
      input.throttle === "brake" ? 0.45 : 1.0;
    speed = baseSpeed * throttleMult;

    distance += speed * dt * 0.05;

    // Steering: input.steer (-1..1) drives an acceleration toward a
    // target lateral velocity, giving a touch of car-like inertia
    // instead of the car snapping directly to the hand position.
    const targetVel = input.steer * 260;
    player.steerVel += (targetVel - player.steerVel) * Math.min(1, dt * 6);
    player.x += player.steerVel * dt;

    const halfW = player.w / 2;
    if (player.x - halfW < roadLeft) player.x = roadLeft + halfW;
    if (player.x + halfW > roadRight) player.x = roadRight - halfW;

    dashOffset = (dashOffset + speed * dt) % 40;

    spawnTimer += dt;
    spawnInterval = Math.max(0.45, 1.1 - elapsed * 0.01);
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnObstacle();
    }

    for (const o of obstacles) {
      o.y += speed * dt;
    }
    obstacles = obstacles.filter(o => o.y < height + 80);

    // AABB collision (a little inset so near-misses feel fair).
    const pad = 6;
    const px1 = player.x - halfW + pad, px2 = player.x + halfW - pad;
    const py1 = player.y - player.h / 2 + pad, py2 = player.y + player.h / 2 - pad;
    for (const o of obstacles) {
      const ox1 = o.x - o.w / 2, ox2 = o.x + o.w / 2;
      const oy1 = o.y - o.h / 2, oy2 = o.y + o.h / 2;
      if (px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1) {
        endGame();
        break;
      }
    }

    hooks.onScore(Math.floor(distance));
    hooks.onSpeed(Math.floor(speed / 3));
    hooks.onThrottle(input.throttle);
  }

  function drawCar(x, y, w, h, bodyColor, glow) {
    ctx.save();
    ctx.translate(x, y);
    if (glow) {
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = bodyColor;
    roundRect(-w / 2, -h / 2, w, h, 8);
    ctx.fill();
    // windshield
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(10,12,18,0.55)";
    roundRect(-w / 2 + 6, -h / 2 + 10, w - 12, h * 0.32, 4);
    ctx.fill();
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // shoulders
    ctx.fillStyle = "#0d1017";
    ctx.fillRect(0, 0, width, height);

    // road
    ctx.fillStyle = "#181d28";
    ctx.fillRect(roadLeft, 0, roadWidth, height);

    // edge lines
    ctx.strokeStyle = "rgba(76,224,210,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(roadLeft, 0); ctx.lineTo(roadLeft, height);
    ctx.moveTo(roadRight, 0); ctx.lineTo(roadRight, height);
    ctx.stroke();

    // lane dashes
    ctx.strokeStyle = "#3a4152";
    ctx.lineWidth = 3;
    for (let i = 1; i < LANE_COUNT; i++) {
      const x = roadLeft + (roadWidth / LANE_COUNT) * i;
      ctx.setLineDash([18, 20]);
      ctx.lineDashOffset = -dashOffset;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // obstacles
    for (const o of obstacles) {
      drawCar(o.x, o.y, o.w, o.h, o.color, false);
    }

    // player
    drawCar(player.x, player.y, player.w, player.h, gameOver ? "#4d5468" : "#4ce0d2", true);

    if (gameOver) {
      ctx.fillStyle = "rgba(11,14,20,0.35)";
      ctx.fillRect(0, 0, width, height);
    }
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    update(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    reset();
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function endGame() {
    gameOver = true;
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    hooks.onGameOver(Math.floor(distance));
  }

  function setInput(steer, throttle) {
    input.steer = Math.max(-1, Math.min(1, steer));
    input.throttle = throttle;
  }

  return { init, start, reset, setInput, get isRunning() { return running; } };
})();
