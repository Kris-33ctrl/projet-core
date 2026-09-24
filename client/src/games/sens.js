// Chasse aux sens : ancrage 5-4-3-2-1. Chaque chose repérée autour de soi allume une luciole
// dans une scène de crépuscule. Pas de chrono à battre : au bout de 3 minutes, la partie se clôt en douceur.

import { h } from '../dom.js';
import { audio, vibrate, themeColors, fitCanvas, rgba, mix } from './feedback.js';

const ROUNDS = [
  { count: 5, label: 'choses que tu vois', verb: 'vois' },
  { count: 4, label: 'choses que tu peux toucher', verb: 'touches' },
  { count: 3, label: 'sons que tu entends', verb: 'entends' },
  { count: 2, label: 'odeurs autour de toi', verb: 'sens' },
  { count: 1, label: 'goût dans ta bouche', verb: 'goûtes' },
];
const TOTAL = ROUNDS.reduce((n, r) => n + r.count, 0);

export function createSens({ stage, seconds, onEnd }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = themeColors();
  const canvas = h('canvas', { class: 'game-canvas', 'aria-hidden': 'true' });
  const cue = h('p', { class: 'game-cue', 'aria-live': 'polite' });
  const found = h('button', { type: 'button', class: 'game-hold' }, 'J’en ai repéré une');
  const progress = h('span', { class: 'game-clock' });
  stage.append(h('div', { class: 'game-canvas-wrap' }, canvas, cue), h('div', { class: 'game-controls' }, progress, found));
  const { ctx, size, disconnect } = fitCanvas(canvas);

  const flies = [];
  let round = 0;
  let inRound = 0;
  let t = 0;
  let last = performance.now();
  let raf = 0;
  let ended = false;
  const ambience = audio.waves();
  ambience.level(0.1);

  function prompt() {
    const r = ROUNDS[round];
    cue.textContent = `Repère ${r.count} ${r.label}. Touche la scène pour chacune.`;
    progress.textContent = `${flies.length} luciole${flies.length > 1 ? 's' : ''} sur ${TOTAL}`;
  }

  function light(x, y) {
    if (ended) return;
    const { width: W, height: H } = size();
    flies.push({ x: x ?? W * (0.1 + Math.random() * 0.8), y: y ?? H * (0.15 + Math.random() * 0.55), phase: Math.random() * 6.28, hue: ROUNDS[round].verb });
    audio.blip('pop');
    vibrate(12);
    inRound += 1;
    if (inRound >= ROUNDS[round].count) {
      round += 1;
      inRound = 0;
      if (round >= ROUNDS.length) return finish('Toutes les lucioles brillent : tu es revenu·e dans le présent.');
    }
    prompt();
  }

  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    light(e.clientX - r.left, e.clientY - r.top);
  });
  found.addEventListener('click', () => light());
  found.focus();

  function draw() {
    const { width: W, height: H } = size();
    const glow = flies.length / TOTAL;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix(colors.pilote, colors.ground, colors.dark ? 0.75 : 0.35));
    sky.addColorStop(1, mix(colors.soupapes, colors.ground2, 0.55));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Collines douces au premier plan, qui s'éclairent à mesure que les lucioles s'allument.
    [0.72, 0.8, 0.9].forEach((base, i) => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, H * base + Math.sin(x * (0.006 + i * 0.003) + i) * 18);
      ctx.lineTo(W, H);
      ctx.fillStyle = mix(colors.machine, colors.ink, 0.55 - glow * 0.25 - i * 0.08);
      ctx.fill();
    });

    for (const f of flies) {
      const dx = reduced ? 0 : Math.sin(t * 0.7 + f.phase) * 6;
      const dy = reduced ? 0 : Math.cos(t * 0.5 + f.phase) * 5;
      const pulse = 0.65 + 0.35 * Math.sin(t * 2 + f.phase);
      const halo = ctx.createRadialGradient(f.x + dx, f.y + dy, 0, f.x + dx, f.y + dy, 22);
      halo.addColorStop(0, rgba('#fff3b0', 0.9 * pulse));
      halo.addColorStop(0.35, rgba('#ffe27a', 0.45 * pulse));
      halo.addColorStop(1, rgba('#ffe27a', 0));
      ctx.fillStyle = halo;
      ctx.fillRect(f.x + dx - 24, f.y + dy - 24, 48, 48);
    }
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    t += dt;
    draw();
    if (t >= seconds && !ended) return finish('C’est le moment de conclure. Tu peux continuer la chasse dans ta tête, n’importe où.');
    raf = requestAnimationFrame(frame);
  }

  function finish(message) {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    onEnd({ message });
  }

  prompt();
  raf = requestAnimationFrame(frame);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      disconnect();
      ambience.stop();
    },
  };
}
