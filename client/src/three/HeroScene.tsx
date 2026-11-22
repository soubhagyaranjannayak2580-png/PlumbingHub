import { Suspense, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Grid, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { Pipe, Flange, Gauge, ValveWheel, HexNut, ElbowFitting, metal } from './parts';
import type { V3 } from './pipes';
import type { Quality } from '../lib/device';

interface Props {
  progress: MutableRefObject<number>;
  quality: Exclude<Quality, 'off'>;
  animate: boolean;
  active: boolean;
}

// Procedural pipe network: a main header feeding several branch risers.
const RUNS: { points: V3[]; r: number; speed: number }[] = [
  { points: [[-14, -1.6, -2], [-4, -1.6, -2], [-4, 1.2, -2], [3, 1.2, -2], [3, 3.5, -2], [14, 3.5, -2]], r: 0.34, speed: 1.1 },
  { points: [[-12, -2.6, 1.5], [-1, -2.6, 1.5], [-1, -0.3, 1.5], [6, -0.3, 1.5], [6, 2.2, 1.5], [6, 2.2, -2]], r: 0.26, speed: 0.9 },
  { points: [[1.5, -6, 0], [1.5, -1.6, 0], [1.5, -1.6, -2]], r: 0.22, speed: 1.3 },
  { points: [[-7, 7, -5], [-7, 2.4, -5], [-2, 2.4, -5], [-2, 4.5, -5], [9, 4.5, -5]], r: 0.2, speed: 0.8 },
  { points: [[8.5, -6, 3], [8.5, 0.8, 3], [11, 0.8, 3], [11, 0.8, -2], [11, 3.5, -2]], r: 0.24, speed: 1 },
];

function CameraRig({ progress, animate }: { progress: MutableRefObject<number>; animate: boolean }) {
  const look = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, delta) => {
    const p = THREE.MathUtils.clamp(progress.current, 0, 1);
    const angle = -0.25 + p * 0.9;
    const radius = 14 - p * 5.5;
    const px = animate ? state.pointer.x * 0.8 : 0;
    const py = animate ? state.pointer.y * 0.5 : 0;
    target.set(Math.sin(angle) * radius + px, 1.2 + p * 2.5 + py, Math.cos(angle) * radius);
    const k = 1 - Math.pow(0.001, delta);
    state.camera.position.lerp(target, animate ? k : 1);
    look.set(p * 2, 0.6 + p * 0.6, -1);
    state.camera.lookAt(look);
  });
  return null;
}

function TechRings({ animate }: { animate: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (animate && g.current) g.current.rotation.z += d * 0.08;
  });
  return (
    <group ref={g} position={[4, 1, -9]}>
      {[3.2, 4.4, 5.8].map((r, i) => (
        <mesh key={r} rotation={[0, 0, i]}>
          <torusGeometry args={[r, 0.012, 8, 120, Math.PI * (1.2 + i * 0.25)]} />
          <meshBasicMaterial color="#168BFF" transparent opacity={0.35 - i * 0.08} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Network({ quality, animate }: { quality: Props['quality']; animate: boolean }) {
  const particles = quality === 'high' ? 40 : 14;
  return (
    <group>
      {RUNS.map((r, i) => (
        <Pipe key={i} points={r.points} radius={r.r} speed={r.speed} particles={particles} animate={animate} bend={0.8} />
      ))}
      <Flange position={[-4, 0, -2]} direction={[0, 1, 0]} radius={0.34} />
      <Flange position={[6, 1, 1.5]} direction={[0, 1, 0]} radius={0.26} />
      <Flange position={[8.5, -3, 3]} direction={[0, 1, 0]} radius={0.24} />
      {/* Inline gate valve on the main header */}
      <group position={[0, 1.2, -2]}>
        <mesh material={metal}>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
        </mesh>
        <mesh position={[0, 0.9, 0]} material={metal}>
          <cylinderGeometry args={[0.08, 0.08, 1.1, 12]} />
        </mesh>
        <group position={[0, 1.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ValveWheel scale={0.9} />
        </group>
      </group>
      {/* Gauge tapped into the branch */}
      <group position={[-1, 0.9, 1.5]}>
        <mesh material={metal}>
          <cylinderGeometry args={[0.07, 0.07, 0.8, 12]} />
        </mesh>
        <group position={[0, 0.85, 0.05]}>
          <Gauge scale={0.75} animate={animate} />
        </group>
      </group>
    </group>
  );
}

function Floaters({ animate }: { animate: boolean }) {
  const speed = animate ? 1.4 : 0;
  return (
    <>
      <Float speed={speed} rotationIntensity={1.2} floatIntensity={1.6} position={[-6.5, 3.6, 2]}>
        <ValveWheel scale={0.75} color="#168BFF" />
      </Float>
      <Float speed={speed} rotationIntensity={1.4} floatIntensity={1.4} position={[7.5, -1.8, 4]}>
        <HexNut scale={0.7} />
      </Float>
      <Float speed={speed} rotationIntensity={1} floatIntensity={2} position={[-8.5, -0.5, 4]}>
        <ElbowFitting scale={0.9} />
      </Float>
      <Float speed={speed} rotationIntensity={0.6} floatIntensity={1.2} position={[9.5, 5.5, -1]}>
        <Gauge scale={0.8} animate={animate} />
      </Float>
      <Float speed={speed} rotationIntensity={2} floatIntensity={1} position={[3.5, 5.6, 3]}>
        <HexNut scale={0.45} />
      </Float>
    </>
  );
}

export default function HeroScene({ progress, quality, animate, active }: Props) {
  return (
    <Canvas
      dpr={quality === 'high' ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [0, 1.2, 14], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: quality === 'high', alpha: true, powerPreference: 'high-performance' }}
      frameloop={active ? (animate ? 'always' : 'demand') : 'never'}
      aria-hidden
    >
      <fog attach="fog" args={['#071827', 14, 34]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 6]} intensity={1.6} color="#ffffff" />
      <pointLight position={[-6, 2, 4]} intensity={30} color="#168BFF" distance={18} />
      <pointLight position={[8, 4, 2]} intensity={18} color="#FF8A32" distance={14} />
      <Suspense fallback={null}>
        <Environment resolution={quality === 'high' ? 256 : 64} frames={1}>
          <Lightformer form="rect" intensity={3} position={[0, 6, -6]} scale={[12, 3, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={2.5} position={[-8, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} color="#9fd0ff" />
          <Lightformer form="ring" intensity={2} position={[8, 3, 4]} scale={3} color="#FF8A32" />
          <Lightformer form="rect" intensity={1} position={[0, -4, 4]} rotation-x={-Math.PI / 2} scale={[20, 6, 1]} color="#0B2239" />
        </Environment>
      </Suspense>
      <Network quality={quality} animate={animate} />
      <Floaters animate={animate} />
      {quality === 'high' && <TechRings animate={animate} />}
      <Grid
        position={[0, -4.2, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#123a5e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#168BFF"
        fadeDistance={34}
        fadeStrength={1.6}
        infiniteGrid
      />
      <CameraRig progress={progress} animate={animate} />
    </Canvas>
  );
}
