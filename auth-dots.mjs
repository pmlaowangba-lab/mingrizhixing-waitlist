// 认证与门禁舞台背景（03 · 宣纸水纹砂环 · Washi Mineral Ripples）：
// 静谧宣纸矿物底砂 + 指针划过/点击激发嵌满赤陶与暖炭细砂粒的同心水纹环与无边界羽化微砂尾迹。
const mounted = new WeakMap();

export function mountAuthDots(root, env = globalThis) {
  mounted.get(root)?.();
  const { document, performance } = env;
  const raf = (fn) => env.requestAnimationFrame(fn);
  const caf = (id) => env.cancelAnimationFrame(id);
  const reduce = !!env.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'auth-dots';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.pointerEvents = 'none';
  root.prepend(canvas);
  const ctx = canvas.getContext('2d');

  // 04 规范色值：冷雾板岩微粒 #94A3B8、深板岩灰 #475569、活力橙点缀 [234, 88, 12]
  const baseSand = [148, 163, 184];
  const warmInk = [71, 85, 105];
  const orange = [234, 88, 12];

  const MAX_WAKE = 320;
  const MAX_RIPPLES = 12;

  let w = 0;
  let h = 0;
  let narrow = false;
  let grains = [];
  let wake = [];
  let ripples = [];
  let pointer = null;
  let lastRippleAt = 0;
  let frame = 0;
  let alive = true;

  function makeRipple(x, y, maxR, seedCount, now) {
    const seeds = [];
    for (let i = 0; i < seedCount; i += 1) {
      seeds.push({
        a: (i / seedCount) * Math.PI * 2 + (((i * 73) % 19) - 9) * 0.018,
        jitter: ((i * 37) % 9) - 4,
        warm: i % 3 !== 0,
      });
    }
    return { x, y, r: 6, maxR, t: now, seeds };
  }

  function initGrains() {
    let seed = 20261117;
    const rnd = () => {
      seed = (seed * 48271) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const count = narrow ? 180 : 520;
    grains = [];
    for (let i = 0; i < count; i += 1) {
      grains.push({
        x: rnd() * w,
        y: rnd() * h,
        sz: 0.75 + rnd() * 0.95,
        phase: rnd() * Math.PI * 2,
        warm: rnd() > 0.54,
      });
    }
  }

  function spawnWakeAndRipple(x0, y0, x1, y1, now) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.min(6, Math.ceil(dist / 12)));

    for (let s = 0; s < steps; s += 1) {
      const u = (s + 1) / steps;
      const cx = x0 + dx * u;
      const cy = y0 + dy * u;
      const burst = 2 + Math.min(4, Math.floor(dist * 0.07));
      for (let k = 0; k < burst; k += 1) {
        if (wake.length >= MAX_WAKE) wake.shift();
        // 二次径向分布，天然无硬切圆盘边界
        const rad = ((Math.random() + Math.random()) * 0.5) * 38;
        const th = Math.random() * Math.PI * 2;
        wake.push({
          x: cx + Math.cos(th) * rad,
          y: cy + Math.sin(th) * rad,
          vx: dx * 0.032 + Math.cos(th) * 0.42,
          vy: dy * 0.032 + Math.sin(th) * 0.42 - 0.06,
          sz: 1.0 + Math.random() * 1.15,
          life: 1,
          decay: 0.018 + Math.random() * 0.016,
          warm: Math.random() > 0.34,
        });
      }
    }

    if (dist > 5 && now - lastRippleAt >= 48) {
      lastRippleAt = now;
      if (ripples.length >= MAX_RIPPLES) ripples.shift();
      ripples.push(makeRipple(x1, y1, 132 + (dist % 52), 28, now));
    }
  }

  function draw(now) {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const t = now * 0.001;

    if (narrow) {
      wake.length = 0;
    }

    // 1. 宣纸矿物微砂底纹（近场指针柔和唤醒暖陶光泽与水波轻推）
    for (let i = 0; i < grains.length; i += 1) {
      const g = grains[i];
      let gx = g.x;
      let gy = g.y;
      let near = 0;
      if (!reduce && pointer) {
        const ex = gx - pointer.x;
        const ey = gy - pointer.y;
        const d = Math.hypot(ex, ey);
        if (d < 150 && d > 0.1) {
          near = (1 - d / 150) ** 2;
          gx += (ex / d) * near * 3.5;
          gy += (ey / d) * near * 3.5;
        }
      }
      const pulse = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.15 + g.phase);
      const alpha = (0.09 + pulse * 0.11 + near * 0.42).toFixed(3);
      const rgb = near > 0.18 || (g.warm && near > 0.04) ? orange : baseSand;
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
      ctx.fillRect?.(gx, gy, g.sz * 1.35, g.sz * 1.35);
    }

    // 2. 03 · 宣纸水纹砂环（同心细弧线 + 环周镶嵌矿物砂籽向外舒张）
    for (let rIdx = ripples.length - 1; rIdx >= 0; rIdx -= 1) {
      const rp = ripples[rIdx];
      const elapsed = Math.max(16, now - rp.t);
      rp.r = Math.min(rp.maxR + 4, 6 + elapsed * 0.095);
      const life = Math.max(0, 1 - rp.r / rp.maxR);
      if (life <= 0.015) {
        ripples.splice(rIdx, 1);
        continue;
      }

      ctx.strokeStyle = `rgba(${orange[0]},${orange[1]},${orange[2]},${(life * 0.19).toFixed(3)})`;
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke?.();

      for (let sIdx = 0; sIdx < rp.seeds.length; sIdx += 1) {
        const sd = rp.seeds[sIdx];
        const sx = rp.x + Math.cos(sd.a) * (rp.r + sd.jitter);
        const sy = rp.y + Math.sin(sd.a) * (rp.r + sd.jitter);
        const rgb = sd.warm ? orange : warmInk;
        const a = sd.warm ? life * 0.58 : life * 0.44;
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;
        ctx.fillRect?.(sx, sy, 1.55, 1.55);
      }
    }

    // 3. 指尖无边界羽化微砂散射尾迹
    for (let j = wake.length - 1; j >= 0; j -= 1) {
      const p = wake[j];
      p.x += p.vx + Math.sin(t * 5.2 + j) * 0.12;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= p.decay;
      if (p.life <= 0.01) {
        wake.splice(j, 1);
        continue;
      }
      const a = ((p.life ** 1.6) * 0.64).toFixed(3);
      const rgb = p.warm ? orange : warmInk;
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
      ctx.fillRect?.(p.x, p.y, p.sz * 1.35, p.sz * 1.35);
    }
  }

  function resize() {
    if (!alive || !ctx) return;
    const r = root.getBoundingClientRect();
    const dpr = Math.min(env.devicePixelRatio || 1, 2);
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    narrow = w < 600;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initGrains();
    draw(performance.now());
  }

  function loop(now) {
    frame = 0;
    if (!alive) return;
    draw(now);
    if (pointer || wake.length || ripples.length) {
      frame = raf(loop);
    }
  }

  const kick = () => {
    if (!frame && alive && !reduce) frame = raf(loop);
  };

  const at = (e) => {
    const r = root.getBoundingClientRect();
    return { x: (e?.clientX ?? 0) - r.left, y: (e?.clientY ?? 0) - r.top };
  };

  const move = (e) => {
    const next = at(e);
    const now = performance.now();
    if (!narrow) {
      if (pointer) {
        spawnWakeAndRipple(pointer.x, pointer.y, next.x, next.y, now);
      } else {
        spawnWakeAndRipple(next.x - 7, next.y - 4, next.x, next.y, now);
      }
    }
    pointer = next;
    kick();
  };

  const down = (e) => {
    const pt = at(e);
    const now = performance.now();
    if (ripples.length >= MAX_RIPPLES) ripples.shift();
    ripples.push(makeRipple(pt.x, pt.y, narrow ? 120 : 185, 36, now));
    kick();
  };

  const leave = () => {
    pointer = null;
    kick();
  };

  const events = reduce
    ? []
    : [
        ['pointermove', move],
        ['pointerdown', down],
        ['pointerleave', leave],
      ];
  for (const [type, fn] of events) root.addEventListener(type, fn, { passive: true });

  const ro = env.ResizeObserver ? new env.ResizeObserver(resize) : null;
  ro?.observe(root);
  resize();

  const cleanup = () => {
    if (!alive) return;
    alive = false;
    if (frame) caf(frame);
    frame = 0;
    ro?.disconnect();
    for (const [type, fn] of events) root.removeEventListener(type, fn, { passive: true });
    canvas.remove();
    if (mounted.get(root) === cleanup) mounted.delete(root);
  };

  mounted.set(root, cleanup);
  return cleanup;
}
