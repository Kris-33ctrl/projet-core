// Surf : le surf de l'envie. Une vague monte, culmine, puis retombe d'elle-même.
// Glisser doucement garde le surfeur sur la crête ; lutter (gestes brusques) le fait vaciller.
// On ne « perd » jamais : s'il glisse, il remonte. L'envie passe sans qu'on y réponde.

import { h } from '../dom.js';
import { audio, vibrate, themeColors, fitCanvas, rgba } from './feedback.js';

const PROMPTS = [
  [0, 'Une envie arrive. Observe-la monter.'],
  [0.2, 'Remarque où elle se loge dans ton corps.'],
  [0.42, 'Elle culmine. Respire, reste sur la crête.'],
  [0.6, 'Elle redescend déjà, d’elle-même.'],
  [0.82, 'Tu n’as rien eu à faire d’autre que l’observer.'],
];
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.ceil(s)) % 60).padStart(2, '0')}`;
const smooth = (x) => x * x * (3 - 2 * x);

export function createSurf({ stage, seconds, onEnd }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = themeColors();
  const canvas = h('canvas', { class: 'game-canvas', 'aria-hidden': 'true', style: { 'touch-action': 'none' } });
  const cue = h('p', { class: 'game-cue', 'aria-live': 'polite', text: PROMPTS[0][1] });
  const clock = h('span', { class: 'game-clock', text: mmss(seconds) });
  const hint = h('span', { class: 'small muted', text: 'Glisse doucement, ou utilise les flèches ← →' });
  stage.append(h('div', { class: 'game-canvas-wrap' }, canvas, cue), h('div', { class: 'game-controls' }, clock, hint));
  const { ctx, size, disconnect } = fitCanvas(canvas);

  // L'envie : monte jusqu'à 42 % du temps, plateau jusqu'à 55 %, puis redescend.
  const urge = (t) => {
    const p = t / seconds;
    if (p < 0.42) return 0.15 + 0.85 * smooth(p / 0.42);
    if (p < 0.55) return 1;
    return 0.1 + 0.9 * (1 - smooth(Math.min(1, (p - 0.55) / 0.45)));
  };

  let t = 0;
  let last = performance.now();
  let raf = 0;
  let ended = false;
  let promptIndex = 0;
  let peaked = false;
  let offset = 0; // position du surfeur par rapport à la crête (-1 à 1)
  let target = 0;
  let wobble = 0;
  let sliding = false;
  const waves = audio.waves();

  // Glisser : la cible suit le doigt ; un geste brusque fait vaciller (lutter ne sert à rien).
  let lastX = null;
  const move = (e) => {
    const { left, width } = canvas.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 2;
    if (lastX !== null) wobble = Math.min(1, wobble + Math.abs(x - lastX) * 1.5);
    lastX = x;
    target = Math.max(-1, Math.min(1, x));
  };
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture?.(e.pointerId);
    move(e);
  });
  canvas.addEventListener('pointerleave', () => (lastX = null));
  const keys = (e) => {
    if (e.key === 'ArrowLeft') target = Math.max(-1, target - 0.08);
    if (e.key === 'ArrowRight') target = Math.min(1, target + 0.08);
  };
  window.addEventListener('keydown', keys);

  function swellY(x, W, H, u) {
    const crest = W / 2;
    const width = W * 0.24;
    const height = H * (0.1 + 0.36 * u);
    return H * 0.78 - height * Math.exp(-((x - crest) ** 2) / (2 * width * width));
  }

  function draw(u) {
    const { width: W, height: H } = size();
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, colors.ground);
    sky.addColorStop(1, colors.ground2);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Houle de fond.
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * 0.7 + Math.sin(x * 0.015 + t * 0.6) * 6);
    ctx.lineTo(W, H);
    ctx.fillStyle = rgba(colors.soupapes, 0.18);
    ctx.fill();

    // La vague de l'envie.
    const ripple = reduced ? 0 : 4;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) ctx.lineTo(x, swellY(x, W, H, u) + Math.sin(x * 0.05 - t * 2) * ripple * u);
    ctx.lineTo(W, H);
    const sea = ctx.createLinearGradient(0, H * 0.3, 0, H);
    sea.addColorStop(0, rgba(colors.soupapes, 0.75));
    sea.addColorStop(1, rgba(colors.pilote, 0.9));
    ctx.fillStyle = sea;
    ctx.fill();

    // Écume à la crête quand l'envie est forte.
    if (u > 0.6) {
      ctx.beginPath();
      for (let x = W * 0.4; x <= W * 0.6; x += 5) ctx.lineTo(x, swellY(x, W, H, u) - 2);
      ctx.strokeStyle = rgba(colors.ground, 0.8 * (u - 0.6) * 2.5);
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Surfeur : planche + silhouette abstraite, posés sur la pente.
    const sx = W / 2 + offset * W * 0.3;
    const sy = swellY(sx, W, H, u) + (sliding ? 16 : 0);
    const slope = (swellY(sx + 2, W, H, u) - swellY(sx - 2, W, H, u)) / 4;
    ctx.save();
    ctx.translate(sx, sy - 6);
    ctx.rotate(Math.atan(slope) + Math.sin(t * 9) * 0.12 * wobble);
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -22, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = colors.ink;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -4);
    ctx.stroke();
    ctx.restore();
  }

  function frame(now) {
    // Temps réel, y compris sur un appareil lent ; au-delà de 250 ms (onglet en arrière-plan), la partie se met en pause.
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    t += dt;
    const u = urge(t);

    // La vague pousse le surfeur hors de la crête, d'autant plus que l'envie est forte.
    const drift = (Math.sin(t * 0.7) + Math.sin(t * 1.3 + 1)) * 0.5 * u * 0.35;
    offset += ((target - offset) * 1.6 + drift) * dt + Math.sin(t * 8) * wobble * 0.01;
    offset = Math.max(-1.2, Math.min(1.2, offset));
    wobble = Math.max(0, wobble - dt * 0.8);

    const wasSliding = sliding;
    sliding = Math.abs(offset) > (sliding ? 0.25 : 0.45);
    if (sliding && !wasSliding) cue.textContent = 'Ce n’est pas grave : remonte doucement vers la crête.';
    if (!sliding && wasSliding) cue.textContent = PROMPTS[promptIndex][1];

    const p = t / seconds;
    while (promptIndex < PROMPTS.length - 1 && p >= PROMPTS[promptIndex + 1][0]) {
      promptIndex += 1;
      if (!sliding) cue.textContent = PROMPTS[promptIndex][1];
    }
    if (!peaked && p >= 0.42) {
      peaked = true;
      vibrate([30, 80, 30]);
    }
    waves.level(u);
    clock.textContent = mmss(seconds - t);
    draw(u);

    if (t >= seconds && !ended) {
      ended = true;
      onEnd({ message: 'La vague est passée, sans que tu aies eu à y répondre.' });
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keys);
      disconnect();
      waves.stop();
    },
  };
}
