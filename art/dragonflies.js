// Background art for 2026 Q4: dragonflies that hover, then dart somewhere new.
// Each quarter gets a new file in /art with the same shape. See README.md.
(() => {
  const rnd = (a, b) => a + Math.random() * (b - a);

  window.ART = {
    name: 'Dragonflies',
    season: '2026 Q4',

    // How many creatures, and how big. Phones get fewer and smaller ones.
    population(W) {
      const phone = W < 640;
      const scale = phone ? 0.55 : 1;
      const sizes = phone ? [300, 260, 110] : [320, 270, 240, 120, 100];
      return sizes.map((s, i) => ({
        size: s * scale,
        cruise: rnd(70, 110) * scale,
        depth: s > 200 ? rnd(0.6, 1) : rnd(0.3, 0.5),
        ph: rnd(0, 9),
      }));
    },

    spawn(c, W, H, fresh) {
      const ltr = Math.random() < 0.5;
      c.dir = c.goal = (ltr ? 0 : Math.PI) + rnd(-0.6, 0.6);
      c.mode = 'hover'; c.timer = rnd(0.5, 4); c.v = 5;
      if (fresh) { c.x = rnd(0, W); c.y = rnd(0, H); }
      else { c.x = ltr ? -c.size * 0.6 : W + c.size * 0.6; c.y = rnd(H * 0.1, H * 0.9); c.mode = 'dart'; c.timer = 2; }
    },

    move(c, dt, t, W, H) {
      c.timer -= dt;
      if (c.timer <= 0) {
        if (c.mode === 'hover') {
          c.mode = 'dart'; c.timer = rnd(0.9, 1.6);
          const far = Math.hypot(c.x - W / 2, c.y - H / 2) > Math.max(W, H) * 0.38;
          c.goal = far && Math.random() < 0.7 ? Math.atan2(H / 2 - c.y, W / 2 - c.x) + rnd(-0.8, 0.8) : c.dir + rnd(-1.2, 1.2);
        } else { c.mode = 'hover'; c.timer = rnd(2.5, 6); }
      }
      c.v += ((c.mode === 'dart' ? c.cruise : 4) - c.v) * Math.min(1, dt * 2.4);
      c.dir += ((((c.goal - c.dir) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 2.5);
      c.x += Math.cos(c.dir) * c.v * dt;
      c.y += Math.sin(c.dir) * c.v * dt + Math.sin(t * 1.4 + c.ph) * 4 * dt;
    },

    // Local coords: u runs head(+1) to tail(-1), v across the body. Returns 0..1 darkness.
    shape(u, v, time, ph) {
      const av = Math.abs(v);
      let d = 0;
      const hu = u - 0.86, ev = av - 0.05;
      if (hu * hu + ev * ev < 0.0045) d = 1;
      if (u > 0.5 && u < 0.84) { const x = (u - 0.67) / 0.17; const hw = 0.085 * Math.sqrt(Math.max(0, 1 - x * x)); if (av < hw) d = 1; }
      if (u <= 0.52 && u > -1) {
        const hw = 0.042 - (0.52 - u) * 0.009 + (u < -0.86 ? 0.014 : 0);
        if (av < hw) d = Math.max(d, Math.sin(u * 40) > -0.3 ? 0.95 : 0.55);
      }
      // Two pairs of long wings with a slight shimmer.
      const span = 1 + 0.035 * Math.sin(time * 34 + ph);
      const s = av / span;
      if (s > 0.03 && s < 1) {
        const e = Math.sqrt(Math.max(0, 1 - Math.pow(2 * s - 1, 2)));
        const fc = 0.66 + 0.03 * s - 0.08 * s * s, fh = 0.02 + 0.1 * e;
        const hc = 0.4 - 0.1 * s, hh = 0.025 + 0.12 * e;
        const w = Math.max(0, 1 - Math.abs(u - fc) / fh, 1 - Math.abs(u - hc) / hh);
        if (w > 0) {
          const spot = s > 0.82 && s < 0.9 && w > 0.3 ? 0.9 : 0;
          d = Math.max(d, spot, (0.3 + 0.4 * (1 - w)) * (0.85 + 0.15 * Math.sin(s * 32)));
        }
      }
      return d;
    },
  };
})();
