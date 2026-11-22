import * as THREE from 'three';

export type V3 = [number, number, number];

export interface Joint {
  position: THREE.Vector3;
  direction: THREE.Vector3;
}

export interface PipePath {
  curve: THREE.CurvePath<THREE.Vector3>;
  joints: Joint[];
  length: number;
}

/**
 * Builds an orthogonal "real plumbing" route through the given points with rounded elbows.
 * Returns the curve plus coupling positions at each straight-to-bend transition.
 */
export function buildPipePath(points: V3[], bendRadius = 0.45): PipePath {
  const pts = points.map((p) => new THREE.Vector3(...p));
  const curve = new THREE.CurvePath<THREE.Vector3>();
  const joints: Joint[] = [];
  let cursor = pts[0].clone();

  joints.push({ position: pts[0].clone(), direction: pts[1].clone().sub(pts[0]).normalize() });

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const corner = pts[i];
    const next = pts[i + 1];
    const inDir = corner.clone().sub(prev);
    const outDir = next.clone().sub(corner);
    const r = Math.min(bendRadius, inDir.length() / 2, outDir.length() / 2);
    inDir.normalize();
    outDir.normalize();
    const entry = corner.clone().addScaledVector(inDir, -r);
    const exit = corner.clone().addScaledVector(outDir, r);
    if (cursor.distanceTo(entry) > 1e-4) curve.add(new THREE.LineCurve3(cursor.clone(), entry));
    curve.add(new THREE.QuadraticBezierCurve3(entry, corner.clone(), exit));
    joints.push({ position: entry.clone(), direction: inDir.clone() });
    joints.push({ position: exit.clone(), direction: outDir.clone() });
    cursor = exit;
  }
  const last = pts[pts.length - 1];
  curve.add(new THREE.LineCurve3(cursor.clone(), last.clone()));
  joints.push({ position: last.clone(), direction: last.clone().sub(pts[pts.length - 2]).normalize() });

  return { curve, joints, length: curve.getLength() };
}

/** Pre-samples a curve into a flat array for very cheap per-frame position lookups. */
export function sampleCurve(curve: THREE.Curve<THREE.Vector3>, samples = 256) {
  const arr = new Float32Array((samples + 1) * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i <= samples; i++) {
    curve.getPointAt(i / samples, v);
    arr.set([v.x, v.y, v.z], i * 3);
  }
  return { arr, samples };
}

export function pointOnSamples(s: { arr: Float32Array; samples: number }, t: number, out: THREE.Vector3) {
  const f = (((t % 1) + 1) % 1) * s.samples;
  const i = Math.floor(f);
  const k = f - i;
  const a = i * 3;
  const b = Math.min(i + 1, s.samples) * 3;
  out.set(
    s.arr[a] + (s.arr[b] - s.arr[a]) * k,
    s.arr[a + 1] + (s.arr[b + 1] - s.arr[a + 1]) * k,
    s.arr[a + 2] + (s.arr[b + 2] - s.arr[a + 2]) * k,
  );
  return out;
}

/** Quaternion rotating +Y onto the given direction (cylinders are Y-aligned in three.js). */
export function alignY(direction: THREE.Vector3) {
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
}

/* ------------------------------------------------------------------ flowing water shader */

const waterVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform float uRepeat;
  uniform float uSpeed;
  uniform vec3 uDeep;
  uniform vec3 uBright;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;

  float band(float x, float w) { return smoothstep(0.5 - w, 0.5, x) * (1.0 - smoothstep(0.5, 0.5 + w, x)); }

  void main() {
    float flow = vUv.x * uRepeat - uTime * uSpeed;
    float ripple = sin((vUv.y * 6.2831) * 3.0 + flow * 2.0) * 0.06;
    float b1 = band(fract(flow + ripple), 0.22);
    float b2 = band(fract(flow * 2.3 + 0.37 - ripple), 0.12) * 0.6;
    float fres = pow(1.0 - abs(dot(vNormal, vView)), 2.2);
    vec3 col = mix(uDeep, uBright, clamp(b1 + b2, 0.0, 1.0));
    col += uBright * fres * 0.9;
    float alpha = uOpacity * (0.55 + 0.45 * clamp(b1 + b2 + fres, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha);
  }
`;

export function createWaterMaterial(opts: { deep?: string; bright?: string; repeat: number; speed?: number; opacity?: number }) {
  return new THREE.ShaderMaterial({
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uRepeat: { value: opts.repeat },
      uSpeed: { value: opts.speed ?? 1 },
      uDeep: { value: new THREE.Color(opts.deep ?? '#0a4fa3') },
      uBright: { value: new THREE.Color(opts.bright ?? '#7cc4ff') },
      uOpacity: { value: opts.opacity ?? 0.9 },
    },
  });
}
