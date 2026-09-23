// La vague : cohérence cardiaque. Maintenir pour inspirer, relâcher pour expirer, au rythme de la ligne guide
// (5 s + 5 s, soit 6 cycles par minute). Plus le souffle suit le guide, plus la mer se lisse. Aucun score.

import { h } from '../dom.js';
import { audio, vibrate, themeColors, fitCanvas, rgba, mix } from './feedback.js';

const HALF = 5; // secondes d'inspiration, puis autant d'expiration
const CYCLE = HALF * 2;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.ceil(s)) % 60).padStart(2, '0')}`;

function guide(t) {
  const c = t % CYCLE;
  const inhale = c < HALF;
  return { inhale, level: inhale ? c / HALF : 1 - (c - HALF) / HALF };
}

export function createVague({ stage, seconds, onEnd }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = themeColors();
  const canvas = h('canvas', { class: 'game-canvas', 'aria-hidden': 'true' });
  const cue = h('p', { class: 'game-cue', 'aria-live': 'polite', text: 'Maintiens pour inspirer' });
  const clock = h('span', { class: 'game-clock', text: mmss(seconds) });
  const hold = h('button', { type: 'button', class: 'game-hold' }, 'Maintenir pour inspirer');
  stage.append(h('div', { class: 'game-canvas-wrap' }, canvas, cue), h('div', { class: 'game-controls' }, clock, hold));
  const { ctx, size, disconnect } = fitCanvas(canvas);

  let holding = false;
  let breath = 0;
  let calm = 0.3;
  let t = 0;
  let last = performance.now();
  let phase = null;
  let raf = 0;
  let ended = false;
  const waves = audio.waves();
  const tone = audio.breath();

  const press = (e) => {
    e.preventDefault();
    holding = true;
    hold.classList.add('on');
    if (e.pointerId !== undefined) e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const release = () => {
    holding = false;
    hold.classList.remove('on');
  };
  const keyDown = (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) press(e);
  };
  const keyUp = (e) => {
    if (e.key === ' ' || e.key === 'Enter') release();
  };
  for (const el of [hold, canvas]) {
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }
  hold.addEventListener('keydown', keyDown);
  hold.addEventListener('keyup', keyUp);
  hold.focus();

  const yFor = (v, H) => H * 0.74 - v * H * 0.36;

  function draw() {
    const { width: W, height: H } = size();
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, colors.ground);
    sky.addColorStop(1, colors.ground2);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Soleil diffus : plus la mer est calme, plus il est présent.
    const sun = ctx.createRadialGradient(W * 0.78, H * 0.22, 0, W * 0.78, H * 0.22, H * 0.35);
    sun.addColorStop(0, rgba(colors.machine, 0.25 + 0.35 * calm));
    sun.addColorStop(1, rgba(colors.machine, 0));
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, H);

    // Mer : trois couches, agitées selon l'écart entre le souffle et le guide.
    const chop = (reduced ? 0.5 : 1) * (3 + 22 * (1 - calm));
    [
      { base: 0.52, color: colors.pilote, alpha: 0.25, speed: 0.4, k: 0.012 },
      { base: 0.62, color: colors.soupapes, alpha: 0.3, speed: 0.6, k: 0.018 },
      { base: 0.8, color: colors.pilote, alpha: 0.45, speed: 0.8, k: 0.024 },
    ].forEach((layer, i) => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) {
        const y = H * layer.base + Math.sin(x * layer.k + t * layer.speed + i) * chop * (0.6 + i * 0.3) + Math.sin(x * layer.k * 2.3 - t * layer.speed * 1.7) * chop * 0.35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = rgba(layer.color, layer.alpha);
      ctx.fill();
    });

    // Ligne guide : le rythme à suivre défile de droite à gauche (12 s visibles).
    const boatX = W * 0.28;
    const pxPerSec = W / 12;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 4) {
      const y = yFor(guide(t + (x - boatX) / pxPerSec).level, H);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(colors.accent, 0.35 + 0.45 * calm);
    ctx.stroke();

    // Bateau : suit le souffle. Un halo apparaît quand il est sur la ligne.
    const by = yFor(breath, H);
    const onLine = Math.abs(breath - guide(t).level) < 0.12;
    if (onLine) {
      const halo = ctx.createRadialGradient(boatX, by, 0, boatX, by, 38);
      halo.addColorStop(0, rgba(colors.accent, 0.45));
      halo.addColorStop(1, rgba(colors.accent, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(boatX - 40, by - 40, 80, 80);
    }
    ctx.save();
    ctx.translate(boatX, by);
    ctx.rotate((holding ? -1 : 1) * 0.08);
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(0, 14, 22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mix(colors.ground, colors.accent, 0.15);
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.lineTo(-2, -34);
    ctx.quadraticCurveTo(14, -18, 14, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    // Temps réel, y compris sur un appareil lent ; au-delà de 250 ms (onglet en arrière-plan), la partie se met en pause.
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    t += dt;
    breath = Math.min(1, Math.max(0, breath + ((holding ? 1 : -1) * dt) / HALF));
    const g = guide(t);
    const sync = 1 - Math.abs(breath - g.level);
    calm += (sync - calm) * Math.min(1, dt / 3);

    if (g.inhale !== phase) {
      phase = g.inhale;
      cue.textContent = phase ? 'Inspire…' : 'Expire…';
      hold.textContent = phase ? 'Maintenir pour inspirer' : 'Relâcher pour expirer';
      vibrate(phase ? 40 : [15, 50, 15]);
    }
    tone.set(g.level);
    waves.level(1 - calm);
    clock.textContent = mmss(seconds - t);
    draw();

    if (t >= seconds && !ended) {
      ended = true;
      onEnd({
        message:
          calm > 0.6 ? 'La mer est calme : ton souffle a trouvé son rythme.' : 'C’est fait. Chaque respiration lente compte, même imparfaite.',
      });
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      disconnect();
      waves.stop();
      tone.stop();
    },
  };
}
