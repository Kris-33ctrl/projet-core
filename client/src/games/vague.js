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

  // Mer, ciel et bateau peints avec les jetons du thème : aube le jour, nuit bleutée le soir.
  const seaFar = mix(colors.pilote, colors.sky3, 0.55);
  const seaMid = mix(colors.pilote, colors.sun, 0.2);
  const seaNear = mix(colors.pilote, colors.ink, 0.25);

  function draw() {
    const { width: W, height: H } = size();
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, colors.sky1);
    sky.addColorStop(0.6, colors.sky2);
    sky.addColorStop(1, colors.sky3);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Astre : plus la mer est calme, plus il rayonne.
    const sx = W * 0.72;
    const sy = H * 0.3;
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * (0.28 + 0.12 * calm));
    halo.addColorStop(0, rgba(colors.sunGlow, 0.55 + 0.35 * calm));
    halo.addColorStop(1, rgba(colors.sunGlow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = colors.sun;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.min(W, H) * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Mer : trois couches, agitées selon l'écart entre le souffle et le guide.
    const chop = (reduced ? 0.5 : 1) * (3 + 22 * (1 - calm));
    [
      { base: 0.54, color: seaFar, speed: 0.4, k: 0.012 },
      { base: 0.66, color: seaMid, speed: 0.6, k: 0.018 },
      { base: 0.82, color: seaNear, speed: 0.8, k: 0.024 },
    ].forEach((layer, i) => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) {
        const y = H * layer.base + Math.sin(x * layer.k + t * layer.speed + i) * chop * (0.6 + i * 0.3) + Math.sin(x * layer.k * 2.3 - t * layer.speed * 1.7) * chop * 0.35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = layer.color;
      ctx.fill();
    });

    // Reflet de l'astre sur l'eau calme.
    ctx.fillStyle = rgba(colors.sun, 0.25 + 0.4 * calm);
    for (let k = 0; k < 3; k++) ctx.fillRect(sx - (26 - k * 7), H * (0.6 + k * 0.035), (26 - k * 7) * 2, 2);

    // Ligne guide : une traînée de lumière qui défile de droite à gauche (12 s visibles).
    const boatX = W * 0.28;
    const pxPerSec = W / 12;
    ctx.save();
    ctx.setLineDash([1, 9]);
    ctx.beginPath();
    for (let x = 0; x <= W; x += 4) {
      const y = yFor(guide(t + (x - boatX) / pxPerSec).level, H);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(colors.gold, 0.55 + 0.4 * calm);
    ctx.stroke();
    ctx.restore();

    // Bateau : suit le souffle. Sa voile s'illumine quand il est sur la ligne.
    const by = yFor(breath, H);
    const onLine = Math.abs(breath - guide(t).level) < 0.12;
    if (onLine) {
      const glow = ctx.createRadialGradient(boatX, by - 14, 0, boatX, by - 14, 46);
      glow.addColorStop(0, rgba(colors.gold, 0.55));
      glow.addColorStop(1, rgba(colors.gold, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(boatX - 48, by - 62, 96, 96);
    }
    ctx.save();
    ctx.translate(boatX, by);
    ctx.rotate((holding ? -1 : 1) * 0.08);
    ctx.fillStyle = colors.dark ? mix(colors.ink, colors.pilote, 0.4) : colors.ink;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(0, 14, 22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colors.sun;
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.lineTo(-2, -34);
    ctx.quadraticCurveTo(14, -18, 14, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mix(colors.sun, colors.gold, 0.4);
    ctx.beginPath();
    ctx.moveTo(-5, -4);
    ctx.lineTo(-5, -24);
    ctx.quadraticCurveTo(-14, -12, -14, -4);
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
