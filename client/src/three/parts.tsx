import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { alignY, buildPipePath, createWaterMaterial, pointOnSamples, sampleCurve, type V3 } from './pipes';

export const metal = new THREE.MeshStandardMaterial({ color: '#c9d3de', metalness: 1, roughness: 0.22 });
export const darkMetal = new THREE.MeshStandardMaterial({ color: '#5d6b7a', metalness: 0.9, roughness: 0.35 });
export const brass = new THREE.MeshStandardMaterial({ color: '#d9a441', metalness: 1, roughness: 0.3 });

interface PipeProps {
  points: V3[];
  radius?: number;
  bend?: number;
  variant?: 'glass' | 'solid';
  pipeColor?: string;
  waterDeep?: string;
  waterBright?: string;
  speed?: number;
  particles?: number;
  animate?: boolean;
  couplings?: boolean;
  dim?: boolean;
  highlight?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

/**
 * A pipe run with: outer pipe shell (transparent glass or tinted PVC), an inner flowing-water core
 * driven by a shader, travelling water particles and metallic couplings at joints.
 */
export function Pipe({
  points,
  radius = 0.22,
  bend = 0.5,
  variant = 'glass',
  pipeColor = '#cfe8ff',
  waterDeep,
  waterBright,
  speed = 0.8,
  particles = 24,
  animate = true,
  couplings = true,
  dim = false,
  highlight = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: PipeProps) {
  const path = useMemo(() => buildPipePath(points, bend), [points, bend]);
  const segs = Math.max(48, Math.round(path.length * 14));

  const shellGeo = useMemo(() => new THREE.TubeGeometry(path.curve, segs, radius, 20, false), [path, segs, radius]);
  const coreGeo = useMemo(() => new THREE.TubeGeometry(path.curve, segs, radius * 0.62, 14, false), [path, segs, radius]);
  const water = useMemo(
    () => createWaterMaterial({ repeat: path.length / 0.9, speed, deep: waterDeep, bright: waterBright }),
    [path.length, speed, waterDeep, waterBright],
  );
  const shellMat = useMemo(
    () =>
      variant === 'glass'
        ? new THREE.MeshPhysicalMaterial({
            color: pipeColor,
            transparent: true,
            opacity: 0.22,
            roughness: 0.05,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
            envMapIntensity: 1.6,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        : new THREE.MeshStandardMaterial({
            color: pipeColor,
            transparent: true,
            opacity: 0.55,
            roughness: 0.35,
            metalness: 0.1,
            depthWrite: false,
          }),
    [variant, pipeColor],
  );

  useEffect(
    () => () => {
      shellGeo.dispose();
      coreGeo.dispose();
      water.dispose();
      shellMat.dispose();
    },
    [shellGeo, coreGeo, water, shellMat],
  );

  // Dim / highlight state (used by the interactive system explorer).
  useEffect(() => {
    const base = variant === 'glass' ? 0.22 : 0.55;
    shellMat.opacity = dim ? base * 0.25 : highlight ? Math.min(1, base + 0.3) : base;
    if (shellMat instanceof THREE.MeshStandardMaterial) {
      shellMat.emissive = new THREE.Color(highlight ? pipeColor : '#000000');
      shellMat.emissiveIntensity = highlight ? 0.6 : 0;
    }
    water.uniforms.uOpacity.value = dim ? 0.15 : 0.9;
  }, [dim, highlight, shellMat, water, variant, pipeColor]);

  // Travelling particles
  const samples = useMemo(() => sampleCurve(path.curve, Math.max(128, Math.round(path.length * 24))), [path]);
  const count = particles;
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        t: Math.random(),
        off: new THREE.Vector3((Math.random() - 0.5) * radius * 0.7, (Math.random() - 0.5) * radius * 0.7, (Math.random() - 0.5) * radius * 0.7),
        s: 0.6 + Math.random() * 0.7,
        k: 0.85 + Math.random() * 0.3,
      })),
    [count, radius],
  );
  const inst = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const v = useMemo(() => new THREE.Vector3(), []);

  const place = (time: number) => {
    const mesh = inst.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      const sd = seeds[i];
      pointOnSamples(samples, sd.t + (time * speed * sd.k * 0.9) / path.length, v);
      tmp.position.copy(v).add(sd.off);
      tmp.scale.setScalar(sd.s * (dim ? 0.4 : 1));
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useEffect(() => place(0)); // initial placement (also for reduced-motion static render)

  useFrame((state) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    water.uniforms.uTime.value = t;
    place(t);
  });

  return (
    <group>
      <mesh geometry={shellGeo} material={shellMat} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut} renderOrder={2} />
      <mesh geometry={coreGeo} material={water} renderOrder={1} raycast={() => null} />
      {count > 0 && (
        <instancedMesh ref={inst} args={[undefined, undefined, count]} raycast={() => null} frustumCulled={false}>
          <sphereGeometry args={[radius * 0.16, 8, 8]} />
          <meshBasicMaterial color={waterBright ?? '#bfe4ff'} toneMapped={false} transparent opacity={0.95} />
        </instancedMesh>
      )}
      {couplings &&
        path.joints.map((j, i) => (
          <mesh key={i} position={j.position} quaternion={alignY(j.direction)} material={metal} raycast={() => null}>
            <cylinderGeometry args={[radius * 1.22, radius * 1.22, radius * 0.9, 24]} />
          </mesh>
        ))}
    </group>
  );
}

/** Bolted flange at a pipe end/coupling. */
export function Flange({ position, direction = [0, 1, 0], radius = 0.22 }: { position: V3; direction?: V3; radius?: number }) {
  const q = useMemo(() => alignY(new THREE.Vector3(...direction)), [direction]);
  const bolts = 6;
  return (
    <group position={position} quaternion={q}>
      <mesh material={metal}>
        <cylinderGeometry args={[radius * 2, radius * 2, radius * 0.35, 32]} />
      </mesh>
      {Array.from({ length: bolts }).map((_, i) => {
        const a = (i / bolts) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius * 1.6, 0, Math.sin(a) * radius * 1.6]} material={darkMetal}>
            <cylinderGeometry args={[radius * 0.16, radius * 0.16, radius * 0.6, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Gate-valve hand-wheel. */
export function ValveWheel({ scale = 1, color = '#d6383a' }: { scale?: number; color?: string }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.35 }), [color]);
  return (
    <group scale={scale}>
      <mesh material={mat}>
        <torusGeometry args={[0.5, 0.06, 12, 40]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]} material={mat}>
          <boxGeometry args={[1, 0.06, 0.06]} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={metal}>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
      </mesh>
    </group>
  );
}

/** Pressure gauge with an animated needle. */
export function Gauge({ scale = 1, animate = true }: { scale?: number; animate?: boolean }) {
  const needle = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (animate && needle.current) needle.current.rotation.z = -0.6 + Math.sin(s.clock.elapsedTime * 0.8) * 0.35;
  });
  return (
    <group scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={metal}>
        <cylinderGeometry args={[0.5, 0.5, 0.16, 40]} />
      </mesh>
      <mesh position={[0, 0, 0.085]}>
        <circleGeometry args={[0.43, 40]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.6} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => {
        const a = Math.PI * 1.25 - (i / 8) * Math.PI * 1.5;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0.09]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.07, 0.015, 0.01]} />
            <meshBasicMaterial color={i > 6 ? '#e2483c' : '#0B2239'} />
          </mesh>
        );
      })}
      <mesh ref={needle} position={[0, 0, 0.1]}>
        <boxGeometry args={[0.02, 0.6, 0.01]} />
        <meshBasicMaterial color="#FF8A32" />
      </mesh>
      <mesh position={[0, -0.62, 0]} material={brass}>
        <cylinderGeometry args={[0.09, 0.09, 0.3, 12]} />
      </mesh>
    </group>
  );
}

export function HexNut({ scale = 1 }: { scale?: number }) {
  return (
    <mesh scale={scale} rotation={[Math.PI / 2, 0, 0]} material={metal}>
      <cylinderGeometry args={[0.4, 0.4, 0.28, 6]} />
    </mesh>
  );
}

export function ElbowFitting({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh material={metal}>
        <torusGeometry args={[0.45, 0.16, 16, 32, Math.PI / 2]} />
      </mesh>
      <mesh position={[0.45, -0.12, 0]} material={darkMetal}>
        <cylinderGeometry args={[0.2, 0.2, 0.18, 24]} />
      </mesh>
      <mesh position={[-0.12, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} material={darkMetal}>
        <cylinderGeometry args={[0.2, 0.2, 0.18, 24]} />
      </mesh>
    </group>
  );
}
