// Représentation 3D organique du « Core » : une forme abstraite qui remplace les scores chiffrés.
// Chaque sphère pousse un lobe dans sa direction : une sphère ressourcée gonfle, une sphère sollicitée se creuse.
// Plus les jauges sont déséquilibrées, plus la surface ondule. Une jauge bien remplie ne donne jamais de rouge.

import * as THREE from 'three';

const SPHERE_ORDER = ['machine', 'pilote', 'reseau', 'cadre', 'soupapes'];

const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const VERTEX = /* glsl */ `
uniform vec3 uDirs[5];
uniform vec3 uColors[5];
uniform float uLevels[5];
uniform float uTime;
uniform float uTurb;
uniform float uBreath;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vColor;
${NOISE}
float radius(vec3 n) {
  float r = 1.0;
  for (int i = 0; i < 5; i++) {
    float d = max(dot(n, uDirs[i]), 0.0);
    r += (uLevels[i] - 0.55) * 0.46 * pow(d, 3.0);
  }
  r += snoise(n * 1.5 + vec3(uTime * 0.11)) * uTurb;
  r += snoise(n * 3.1 - vec3(uTime * 0.07)) * uTurb * 0.35;
  return r * (1.0 + uBreath);
}
vec3 displaced(vec3 n) { return n * radius(n); }
void main() {
  vec3 n = normalize(position);
  vec3 up = abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(n, up));
  vec3 b = normalize(cross(n, t));
  vec3 p0 = displaced(n);
  vec3 p1 = displaced(normalize(n + t * 0.01));
  vec3 p2 = displaced(normalize(n + b * 0.01));
  vec3 nrm = normalize(cross(p1 - p0, p2 - p0));

  vec3 col = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 5; i++) {
    float w = pow(max(dot(n, uDirs[i]) * 0.5 + 0.5, 0.0), 6.0);
    col += uColors[i] * w;
    total += w;
  }
  vColor = col / max(total, 0.0001);

  vec4 mv = modelViewMatrix * vec4(p0, 1.0);
  vNormal = normalize(normalMatrix * nrm);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uRim;
uniform float uCalm;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vColor;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 L = normalize(vec3(0.35, 0.8, 0.6));
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  float diff = max(dot(N, L), 0.0) * 0.5 + 0.5;
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 28.0) * 0.4;
  vec3 col = vColor * (0.5 + 0.5 * diff) + uRim * fres * 0.85 + spec;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(lum), uCalm * 0.55);
  gl_FragColor = vec4(col, 1.0);
}
`;

function directions() {
  // Cinq lobes répartis en pentagone, légèrement tournés vers la caméra pour rester lisibles.
  return SPHERE_ORDER.map((_, i) => {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return new THREE.Vector3(Math.cos(a), Math.sin(a), 0.45).normalize();
  });
}

function cssColor(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || fallback);
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * @param {HTMLElement} container
 * @param {{levels?: Record<string, number|null>, harmony?: number, calm?: boolean}} state
 */
export function createBlob(container, state = {}) {
  container.classList.add('blob-stage');
  if (!webglAvailable()) {
    container.append(Object.assign(document.createElement('div'), { className: 'blob-fallback' }));
    return { update() {}, destroy() {} };
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Forme organique représentant ton équilibre du moment');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0, 5.2);

  const uniforms = {
    uDirs: { value: directions() },
    uColors: { value: SPHERE_ORDER.map((s) => cssColor(`--${s}`, '#5c80e6')) },
    uLevels: { value: SPHERE_ORDER.map(() => 0.6) },
    uTime: { value: 0 },
    uTurb: { value: 0.06 },
    uBreath: { value: 0 },
    uRim: { value: new THREE.Color(0xdff4ff) },
    uCalm: { value: 0 },
  };

  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 48),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT }),
  );
  scene.add(mesh);

  const target = { levels: uniforms.uLevels.value.slice(), turb: 0.06, calm: 0 };
  const pointer = { x: 0, y: 0 };

  function apply(next) {
    if (next.levels) {
      target.levels = SPHERE_ORDER.map((s) => {
        const v = next.levels[s];
        return v === null || v === undefined ? 0.55 : v / 100;
      });
    }
    if (typeof next.harmony === 'number') target.turb = 0.035 + (1 - next.harmony) * 0.16;
    target.calm = next.calm ? 1 : 0;
  }
  apply(state);

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    const size = Math.max(1, Math.min(width, height || width));
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  function onPointer(e) {
    const r = container.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }
  container.addEventListener('pointermove', onPointer);
  container.addEventListener('pointerleave', () => Object.assign(pointer, { x: 0, y: 0 }));

  const clock = new THREE.Clock();
  let raf = 0;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const ease = 1 - Math.pow(0.04, dt);
    const calm = uniforms.uCalm.value;
    const speed = 1 - calm * 0.6;

    uniforms.uTime.value += dt * speed;
    uniforms.uLevels.value = uniforms.uLevels.value.map((v, i) => v + (target.levels[i] - v) * ease);
    uniforms.uTurb.value += (target.turb * (1 - calm * 0.5) - uniforms.uTurb.value) * ease;
    uniforms.uCalm.value += (target.calm - calm) * ease;
    // Respiration lente : 6 cycles par minute, le rythme de la cohérence cardiaque.
    uniforms.uBreath.value = Math.sin((t * 2 * Math.PI) / 10) * 0.025;

    const follow = 1 - calm;
    mesh.rotation.y += ((pointer.x * 0.35 + Math.sin(t * 0.2) * 0.15) * follow - mesh.rotation.y) * ease * 0.6;
    mesh.rotation.x += ((pointer.y * 0.25) * follow - mesh.rotation.x) * ease * 0.6;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  if (reduced) {
    uniforms.uLevels.value = target.levels.slice();
    uniforms.uTurb.value = target.turb;
    uniforms.uCalm.value = target.calm;
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(frame);
  }

  return {
    update(next) {
      apply(next);
      if (reduced) {
        uniforms.uLevels.value = target.levels.slice();
        uniforms.uTurb.value = target.turb;
        uniforms.uCalm.value = target.calm;
        renderer.render(scene, camera);
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mesh.geometry.dispose();
      mesh.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
