// Pixel background engine. It draws whatever window.ART (from /art) describes as a grid
// of grey squares, with a few text characters mixed in.
(() => {
  const art = window.ART;
  const cv = document.getElementById('sea');
  if (!art || !cv) return;
  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const GLYPHS = ['+', ':', '*', '#', '%', '=', '3', '7'];
  const FRAME = 1000 / 30; // 30 frames a second is plenty for pixel art and halves the work.
  let W, H, cell, cols, rows, grid, critters = [], specks = [];
  let paused = false, t = 0, last = 0, rgb = '28,28,27';

  const rnd = (a, b) => a + Math.random() * (b - a);

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const wasPhone = W < 640;
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = W < 640 ? 7 : 9;
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
    grid = new Float32Array(cols * rows);
    rgb = getComputedStyle(document.documentElement).getPropertyValue('--pixel').trim() || rgb;
    if (!critters.length || wasPhone !== (W < 640)) {
      critters = art.population(W);
      critters.forEach(c => art.spawn(c, W, H, true));
    }
  }

  function step(dt) {
    t += dt;
    for (const c of critters) {
      art.move(c, dt, t, W, H);
      const m = c.size * 0.8;
      if (c.x < -m || c.x > W + m || c.y < -m || c.y > H + m) art.spawn(c, W, H, false);
      if (Math.random() < dt * 0.9) {
        const back = c.size * 0.5;
        specks.push({ x: c.x - Math.cos(c.dir) * back + rnd(-12, 12), y: c.y - Math.sin(c.dir) * back + rnd(-12, 12), life: 1, a: c.depth });
      }
    }
    for (const s of specks) s.life -= dt * 0.35;
    specks = specks.filter(s => s.life > 0);
  }

  function render() {
    // Old values fade slowly, which leaves a soft trail.
    for (let i = 0; i < grid.length; i++) grid[i] *= 0.8;
    for (const c of critters) {
      const half = c.size / 2, R = c.size * 0.75;
      const cos = Math.cos(c.dir), sin = Math.sin(c.dir);
      const x0 = Math.max(0, Math.floor((c.x - R) / cell)), x1 = Math.min(cols - 1, Math.ceil((c.x + R) / cell));
      const y0 = Math.max(0, Math.floor((c.y - R) / cell)), y1 = Math.min(rows - 1, Math.ceil((c.y + R) / cell));
      for (let gy = y0; gy <= y1; gy++) {
        for (let gx = x0; gx <= x1; gx++) {
          const dx = (gx + 0.5) * cell - c.x, dy = (gy + 0.5) * cell - c.y;
          const u = (dx * cos + dy * sin) / half, v = (-dx * sin + dy * cos) / half;
          const d = art.shape(u, v, t, c.ph) * c.depth;
          const i = gy * cols + gx;
          if (d > grid[i]) grid[i] = d;
        }
      }
    }
    for (const s of specks) {
      const gx = Math.floor(s.x / cell), gy = Math.floor(s.y / cell);
      if (gx >= 0 && gy >= 0 && gx < cols && gy < rows) {
        const i = gy * cols + gx;
        grid[i] = Math.max(grid[i], 0.28 * s.life * s.a);
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.font = `${cell}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const gap = cell > 7 ? 1.5 : 1;
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const g = grid[gy * cols + gx];
        if (g < 0.04) continue;
        const px = gx * cell, py = gy * cell;
        const hash = ((gx * 73856093) ^ (gy * 19349663)) >>> 0;
        if (g < 0.3) {
          // Edges dissolve into small dots.
          const sz = Math.max(1, (cell - gap) * g * 2.4);
          ctx.fillStyle = `rgba(${rgb},${0.25 + g})`;
          ctx.fillRect(px + (cell - sz) / 2, py + (cell - sz) / 2, sz, sz);
        } else if (hash % 9 === 0 && g < 0.8) {
          ctx.fillStyle = `rgba(${rgb},${g * 0.25})`;
          ctx.fillRect(px, py, cell - gap, cell - gap);
          ctx.fillStyle = `rgba(${rgb},${g * 0.9})`;
          ctx.fillText(GLYPHS[(hash >>> 4) % GLYPHS.length], px + cell / 2, py + cell / 2 + 0.5);
        } else {
          ctx.fillStyle = `rgba(${rgb},${g * 0.78})`;
          ctx.fillRect(px, py, cell - gap, cell - gap);
        }
      }
    }
  }

  function frame(now) {
    if (reduce.matches) { still(); return; }
    requestAnimationFrame(frame);
    if (now - last < FRAME - 2) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused) { step(dt); render(); }
  }

  function still() {
    // Reduced motion: settle a frame without a trail, then stop.
    for (let i = 0; i < 6; i++) { step(0.016); render(); }
  }

  addEventListener('resize', () => { resize(); if (reduce.matches || paused) still(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { resize(); still(); });
  reduce.addEventListener('change', () => { if (!reduce.matches) { last = performance.now(); requestAnimationFrame(frame); } });
  resize();
  if (reduce.matches) still(); else { last = performance.now(); requestAnimationFrame(frame); }

  window.sea = {
    setPaused(p) { paused = p; last = performance.now(); },
    burst(el) {
      // A little spray of pixels when something gets handed to Remy.
      const r = el.getBoundingClientRect();
      for (let i = 0; i < 40; i++) specks.push({ x: rnd(r.left, r.right), y: r.top + rnd(-6, 6), life: rnd(0.5, 1), a: 1 });
      if (reduce.matches || paused) still();
    },
  };
})();
