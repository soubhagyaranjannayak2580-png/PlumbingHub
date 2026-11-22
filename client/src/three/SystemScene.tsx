import { createContext, Suspense, useContext, useEffect, useMemo, useRef, type ElementRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Edges, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Pipe, ValveWheel, metal, darkMetal } from './parts';
import type { V3 } from './pipes';
import { COMPONENT_BY_ID, CATEGORY_META, type SystemView } from './systemData';
import type { Quality } from '../lib/device';

/* ------------------------------------------------------------------ interaction context */

interface Ctx {
  selected: string | null;
  hovered: string | null;
  focus: Set<string> | null;
  animate: boolean;
  quality: Exclude<Quality, 'off'>;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
}
const SceneCtx = createContext<Ctx>(null as unknown as Ctx);

function usePart(id: string) {
  const c = useContext(SceneCtx);
  const dim = !!c.focus && !c.focus.has(id) && c.selected !== id;
  const highlight = c.selected === id || c.hovered === id;
  const handlers = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      c.select(id);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      c.hover(id);
    },
    onPointerOut: () => c.hover(null),
  };
  return { dim, highlight, handlers, animate: c.animate, quality: c.quality };
}

function usePartMaterial(color: string, state: { dim: boolean; highlight: boolean }, opts: { opacity?: number; metalness?: number; roughness?: number } = {}) {
  const baseOpacity = opts.opacity ?? 1;
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, metalness: opts.metalness ?? 0.1, roughness: opts.roughness ?? 0.45, transparent: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color],
  );
  useEffect(() => {
    mat.opacity = state.dim ? Math.min(0.12, baseOpacity) : baseOpacity;
    mat.depthWrite = !state.dim && baseOpacity >= 1;
    mat.emissive.set(state.highlight ? '#168BFF' : '#000000');
    mat.emissiveIntensity = state.highlight ? 0.55 : 0;
  }, [mat, state.dim, state.highlight, baseOpacity]);
  useEffect(() => () => mat.dispose(), [mat]);
  return mat;
}

/** Selectable group wrapper for non-pipe components. */
function Part({ id, children, position, rotation }: { id: string; children: (m: { dim: boolean; highlight: boolean }) => ReactNode; position?: V3; rotation?: V3 }) {
  const { dim, highlight, handlers } = usePart(id);
  return (
    <group position={position} rotation={rotation} {...handlers}>
      {children({ dim, highlight })}
    </group>
  );
}

const PIPE_STYLE = {
  supply: { pipeColor: '#3b82f6', waterDeep: '#0b4ea8', waterBright: '#8fd0ff', speed: 0.9 },
  rising: { pipeColor: '#22d3ee', waterDeep: '#0e7490', waterBright: '#a5f3fc', speed: 1.2 },
  hot: { pipeColor: '#ef4444', waterDeep: '#7f1d1d', waterBright: '#fca5a5', speed: 0.8 },
  drain: { pipeColor: '#94a3b8', waterDeep: '#334155', waterBright: '#cbd5e1', speed: 0.45 },
} as const;

function SPipe({ id, points, style, radius = 0.075, particles = 6 }: { id: string; points: V3[]; style: keyof typeof PIPE_STYLE; radius?: number; particles?: number }) {
  const { dim, highlight, handlers, animate, quality } = usePart(id);
  const s = PIPE_STYLE[style];
  return (
    <Pipe
      points={points}
      radius={radius}
      bend={Math.min(0.25, radius * 2.5)}
      variant="solid"
      pipeColor={s.pipeColor}
      waterDeep={s.waterDeep}
      waterBright={s.waterBright}
      speed={s.speed}
      particles={quality === 'high' ? particles : Math.ceil(particles / 2)}
      animate={animate}
      couplings={false}
      dim={dim}
      highlight={highlight}
      {...handlers}
    />
  );
}

/* ------------------------------------------------------------------ geometry */

const FLOORS = [0, 3.2];
const ROOF = 6.4;

function Building() {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7fb6ff', transparent: true, opacity: 0.035, depthWrite: false, side: THREE.DoubleSide }), []);
  const slab = useMemo(() => new THREE.MeshStandardMaterial({ color: '#21456b', transparent: true, opacity: 0.32, depthWrite: false, roughness: 0.8 }), []);
  return (
    <group>
      {[...FLOORS, ROOF].map((y) => (
        <mesh key={y} position={[0, y - 0.075, 0]} material={slab} raycast={() => null}>
          <boxGeometry args={[10.4, 0.15, 7.4]} />
          <Edges color="#3f77ad" />
        </mesh>
      ))}
      {FLOORS.map((f) => (
        <group key={f}>
          <mesh position={[0, f + 1.6, 0]} material={glass} raycast={() => null}>
            <boxGeometry args={[10, 3.2, 7]} />
            <Edges color="#2f5f8f" />
          </mesh>
          {/* bathroom & kitchen partitions */}
          <mesh position={[3.2, f + 1.6, -1.75]} material={glass} raycast={() => null}>
            <boxGeometry args={[3.6, 3.2, 3.5]} />
            <Edges color="#3f77ad" />
          </mesh>
          <mesh position={[-3.2, f + 1.6, -2.4]} material={glass} raycast={() => null}>
            <boxGeometry args={[3.6, 3.2, 2.2]} />
            <Edges color="#3f77ad" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ground({ underground }: { underground: boolean }) {
  const earth = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b4f36', transparent: true, depthWrite: false, roughness: 1 }), []);
  useEffect(() => {
    earth.opacity = underground ? 0.12 : 0.38;
  }, [earth, underground]);
  return (
    <group>
      <mesh position={[0, -1.5 - 0.001, 0]} material={earth} raycast={() => null}>
        <boxGeometry args={[30, 3, 14]} />
        <Edges color="#8a6a4a" />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[30, 14]} />
        <meshStandardMaterial color="#1f3b2a" transparent opacity={underground ? 0.08 : 0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

function WaterVolume({ size, position, level = 0.7 }: { size: V3; position: V3; level?: number }) {
  const h = size[1] * level;
  return (
    <mesh position={[position[0], position[1] - size[1] / 2 + h / 2, position[2]]} raycast={() => null}>
      <boxGeometry args={[size[0] * 0.94, h, size[2] * 0.94]} />
      <meshStandardMaterial color="#168BFF" transparent opacity={0.45} roughness={0.1} emissive="#0b4ea8" emissiveIntensity={0.4} depthWrite={false} />
    </mesh>
  );
}

function Sump() {
  return (
    <Part id="sump" position={[-7.2, -1.5, 0]}>
      {(s) => <SumpBody s={s} />}
    </Part>
  );
}
function SumpBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#9aa7b4', s, { opacity: 0.28, roughness: 0.9 });
  return (
    <>
      <mesh material={m}>
        <boxGeometry args={[2.2, 2, 2.2]} />
        <Edges color="#c3d0dc" />
      </mesh>
      <WaterVolume size={[2.2, 2, 2.2]} position={[0, 0, 0]} level={0.65} />
      <mesh position={[0, 1.52, 0]} material={darkMetal}>
        <boxGeometry args={[0.7, 0.06, 0.7]} />
      </mesh>
    </>
  );
}

function Tank() {
  return (
    <Part id="overhead-tank" position={[-3, ROOF + 0.85, -2.3]}>
      {(s) => <TankBody s={s} />}
    </Part>
  );
}
function TankBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#1f2937', s, { opacity: 0.45, roughness: 0.4 });
  return (
    <>
      <mesh material={m}>
        <cylinderGeometry args={[0.85, 0.85, 1.6, 40]} />
        <Edges color="#64748b" threshold={30} />
      </mesh>
      <mesh position={[0, -0.25, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.8, 0.8, 1.05, 40]} />
        <meshStandardMaterial color="#168BFF" transparent opacity={0.5} emissive="#0b4ea8" emissiveIntensity={0.4} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.86, 0]} material={m}>
        <cylinderGeometry args={[0.35, 0.35, 0.14, 24]} />
      </mesh>
    </>
  );
}

function PumpSet() {
  return (
    <Part id="pump" position={[-7.2, 0.32, -2.3]}>
      {(s) => <PumpBody s={s} />}
    </Part>
  );
}
function PumpBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const motor = usePartMaterial('#1d4ed8', s, { metalness: 0.4, roughness: 0.4 });
  const body = usePartMaterial('#94a3b8', s, { metalness: 0.8, roughness: 0.3 });
  return (
    <>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.2, 0, 0]} material={motor}>
        <cylinderGeometry args={[0.24, 0.24, 0.6, 24]} />
      </mesh>
      <mesh position={[0.25, 0, 0]} material={body}>
        <sphereGeometry args={[0.22, 20, 16]} />
      </mesh>
      <mesh position={[0, -0.27, 0]} material={body}>
        <boxGeometry args={[1, 0.08, 0.5]} />
      </mesh>
    </>
  );
}

function GateValve({ position, rotation }: { position: V3; rotation?: V3 }) {
  return (
    <Part id="gate-valve" position={position} rotation={rotation}>
      {(s) => <GateValveBody s={s} />}
    </Part>
  );
}
function GateValveBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#d9a441', s, { metalness: 0.9, roughness: 0.3 });
  return (
    <>
      <mesh material={m}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
      </mesh>
      <group position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.3}>
        <ValveWheel color={s.highlight ? '#168BFF' : '#d6383a'} />
      </group>
    </>
  );
}

function WaterMeter() {
  return (
    <Part id="water-meter" position={[-11, -0.6, 3]}>
      {(s) => <MeterBody s={s} />}
    </Part>
  );
}
function MeterBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#d9a441', s, { metalness: 0.9, roughness: 0.3 });
  return (
    <>
      <mesh rotation={[0, 0, Math.PI / 2]} material={m}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 20]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={m}>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 20]} />
      </mesh>
    </>
  );
}

function Geyser({ f }: { f: number }) {
  return (
    <Part id="geyser" position={[3.1, f + 2.35, -3.05]}>
      {(s) => <GeyserBody s={s} />}
    </Part>
  );
}
function GeyserBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#f1f5f9', s, { roughness: 0.3 });
  const red = usePartMaterial('#ef4444', s);
  return (
    <>
      <mesh rotation={[0, 0, Math.PI / 2]} material={m}>
        <cylinderGeometry args={[0.26, 0.26, 0.85, 28]} />
      </mesh>
      <mesh position={[0, -0.05, 0.26]} material={red}>
        <boxGeometry args={[0.1, 0.06, 0.02]} />
      </mesh>
    </>
  );
}

function WC({ f }: { f: number }) {
  return (
    <Part id="wc" position={[4.1, f, -2.6]}>
      {(s) => <WCBody s={s} />}
    </Part>
  );
}
function WCBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#f8fafc', s, { roughness: 0.2 });
  return (
    <>
      <mesh position={[0, 0.2, 0.1]} material={m}>
        <cylinderGeometry args={[0.17, 0.2, 0.4, 20]} />
      </mesh>
      <mesh position={[0, 0.43, 0.15]} scale={[1, 0.35, 1.3]} material={m}>
        <sphereGeometry args={[0.24, 24, 16]} />
      </mesh>
      <mesh position={[0, 0.72, -0.28]} material={m}>
        <boxGeometry args={[0.46, 0.42, 0.18]} />
      </mesh>
    </>
  );
}

function Basin({ f }: { f: number }) {
  return (
    <Part id="wash-basin" position={[2.25, f + 0.85, -2.95]}>
      {(s) => <BasinBody s={s} />}
    </Part>
  );
}
function BasinBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#f8fafc', s, { roughness: 0.2 });
  return (
    <>
      <mesh position={[0, 0, 0.12]} material={m}>
        <boxGeometry args={[0.56, 0.14, 0.42]} />
      </mesh>
      <mesh position={[0, -0.42, 0.05]} material={m}>
        <cylinderGeometry args={[0.08, 0.11, 0.7, 16]} />
      </mesh>
      <mesh position={[0, 0.15, -0.05]} material={metal}>
        <cylinderGeometry args={[0.025, 0.025, 0.2, 10]} />
      </mesh>
    </>
  );
}

function Shower({ f }: { f: number }) {
  return (
    <Part id="shower" position={[4.4, f, -0.8]}>
      {(s) => <ShowerBody s={s} />}
    </Part>
  );
}
function ShowerBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#cbd5e1', s, { metalness: 1, roughness: 0.2 });
  const { animate } = usePart('shower');
  const spray = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    if (animate && spray.current) (spray.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(st.clock.elapsedTime * 8) * 0.05;
  });
  return (
    <>
      <mesh position={[0.22, 2.15, 0]} rotation={[0, 0, Math.PI / 2]} material={m}>
        <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
      </mesh>
      <mesh position={[0, 2.12, 0]} material={m}>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 24]} />
      </mesh>
      <mesh ref={spray} position={[0, 1.2, 0]} raycast={() => null}>
        <coneGeometry args={[0.38, 1.8, 24, 1, true]} />
        <meshBasicMaterial color="#8fd0ff" transparent opacity={s.dim ? 0.03 : 0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.43, 1.2, 0]} material={m}>
        <boxGeometry args={[0.04, 0.18, 0.18]} />
      </mesh>
    </>
  );
}

function FloorTrap({ f }: { f: number }) {
  return (
    <Part id="floor-trap" position={[4.3, f + 0.02, -0.8]}>
      {(s) => <TrapBody s={s} />}
    </Part>
  );
}
function TrapBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#475569', s, { metalness: 0.8, roughness: 0.4 });
  return (
    <mesh material={m}>
      <boxGeometry args={[0.28, 0.04, 0.28]} />
    </mesh>
  );
}

function KitchenSink({ f }: { f: number }) {
  return (
    <Part id="kitchen-sink" position={[-3, f, -2.85]}>
      {(s) => <SinkBody s={s} />}
    </Part>
  );
}
function SinkBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const counter = usePartMaterial('#334155', s, { roughness: 0.6 });
  const steel = usePartMaterial('#cbd5e1', s, { metalness: 1, roughness: 0.25 });
  return (
    <>
      <mesh position={[0, 0.45, 0]} material={counter}>
        <boxGeometry args={[2.2, 0.9, 0.6]} />
      </mesh>
      <mesh position={[0, 0.88, 0.02]} material={steel}>
        <boxGeometry args={[0.7, 0.08, 0.42]} />
      </mesh>
      <mesh position={[0, 1.05, -0.2]} material={steel}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 10]} />
      </mesh>
    </>
  );
}

function InspectionChamber() {
  return (
    <Part id="inspection-chamber" position={[7.3, -0.7, 0]}>
      {(s) => <ChamberBody s={s} />}
    </Part>
  );
}
function ChamberBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#a8a29e', s, { opacity: 0.4, roughness: 0.9 });
  const cover = usePartMaterial('#334155', s, { metalness: 0.7, roughness: 0.5 });
  return (
    <>
      <mesh material={m}>
        <boxGeometry args={[1, 1.4, 1]} />
        <Edges color="#d6d3d1" />
      </mesh>
      <mesh position={[0, 0.72, 0]} material={cover}>
        <boxGeometry args={[0.9, 0.05, 0.9]} />
      </mesh>
    </>
  );
}

function GullyTrap() {
  return (
    <Part id="gully-trap" position={[-5.35, -0.2, -4.1]}>
      {(s) => <GullyBody s={s} />}
    </Part>
  );
}
function GullyBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#78716c', s, { roughness: 0.9 });
  return (
    <mesh material={m}>
      <boxGeometry args={[0.6, 0.45, 0.6]} />
      <Edges color="#a8a29e" />
    </mesh>
  );
}

function VentCowl() {
  return (
    <Part id="vent-pipe" position={[5.35, ROOF + 1.25, -3]}>
      {(s) => <CowlBody s={s} />}
    </Part>
  );
}
function CowlBody({ s }: { s: { dim: boolean; highlight: boolean } }) {
  const m = usePartMaterial('#94a3b8', s);
  return (
    <mesh material={m}>
      <coneGeometry args={[0.22, 0.25, 16]} />
    </mesh>
  );
}

function PlumbingNetwork() {
  return (
    <group>
      {/* --- supply & storage --- */}
      <SPipe id="municipal-inlet" style="supply" radius={0.08} points={[[-14, -0.6, 3], [-9.6, -0.6, 3], [-9.6, -0.6, 0.3], [-8.3, -0.6, 0.3]]} particles={8} />
      <WaterMeter />
      <Sump />
      <SPipe id="pump" style="rising" radius={0.08} points={[[-7.2, -2.1, -0.75], [-7.2, 0.32, -0.75], [-7.2, 0.32, -1.95]]} particles={6} />
      <PumpSet />
      <SPipe id="rising-main" style="rising" radius={0.08} points={[[-6.75, 0.32, -2.3], [-5.6, 0.32, -2.3], [-5.6, 8.25, -2.3], [-3, 8.25, -2.3], [-3, 8.0, -2.3]]} particles={14} />
      <Tank />
      <SPipe id="cold-riser" style="supply" radius={0.085} points={[[-2.15, ROOF + 0.35, -2.3], [0.5, ROOF + 0.35, -2.3], [0.5, 0.6, -2.3]]} particles={14} />
      <GateValve position={[-1.4, ROOF + 0.35, -2.3]} />

      {FLOORS.map((f) => (
        <group key={f}>
          <SPipe id="cold-branches" style="supply" radius={0.06} points={[[0.5, f + 0.6, -2.3], [1.6, f + 0.6, -2.3], [1.6, f + 0.6, -3.1], [4.7, f + 0.6, -3.1], [4.7, f + 0.6, -0.8], [4.7, f + 1.2, -0.8]]} />
          <SPipe id="cold-branches" style="supply" radius={0.05} points={[[2.9, f + 0.6, -3.1], [2.9, f + 2.1, -3.1]]} particles={3} />
          <SPipe id="cold-branches" style="supply" radius={0.05} points={[[2.15, f + 0.6, -3.1], [2.15, f + 0.95, -3.1]]} particles={2} />
          <SPipe id="cold-branches" style="supply" radius={0.06} points={[[0.5, f + 0.6, -2.3], [-3, f + 0.6, -2.3], [-3, f + 0.6, -3.05], [-3, f + 1.05, -3.05]]} />
          {f > 0 && <GateValve position={[0.5, f + 0.6, -2.0]} />}

          <SPipe id="hot-line" style="hot" radius={0.055} points={[[3.45, f + 2.1, -3.15], [3.45, f + 1.3, -3.15], [4.85, f + 1.3, -3.15], [4.85, f + 1.3, -0.8], [4.85, f + 1.25, -0.8]]} />
          <SPipe id="hot-line" style="hot" radius={0.05} points={[[3.45, f + 1.3, -3.15], [2.35, f + 1.3, -3.15], [2.35, f + 0.95, -3.15]]} particles={3} />
          <Geyser f={f} />
          <WC f={f} />
          <Basin f={f} />
          <Shower f={f} />
          <FloorTrap f={f} />
          <KitchenSink f={f} />

          {/* --- drainage per floor --- */}
          <SPipe id="soil-stack" style="drain" radius={0.1} points={[[4.1, f + 0.12, -3.0], [4.1, f - 0.25, -3.0], [5.35, f - 0.25, -3.0]]} particles={4} />
          <SPipe id="waste-lines" style="drain" radius={0.065} points={[[2.25, f + 0.6, -3.22], [2.25, f - 0.32, -3.22], [5.35, f - 0.32, -3.22]]} particles={4} />
          <SPipe id="waste-lines" style="drain" radius={0.065} points={[[4.3, f, -0.8], [4.3, f - 0.32, -0.8], [4.3, f - 0.32, -3.22]]} particles={4} />
          <SPipe id="kitchen-waste" style="drain" radius={0.065} points={[[-3, f + 0.75, -3.2], [-3, f - 0.25, -3.2], [-5.35, f - 0.25, -3.2]]} particles={4} />
        </group>
      ))}

      {/* --- stacks & vents --- */}
      <SPipe id="soil-stack" style="drain" radius={0.12} points={[[5.35, ROOF, -3.0], [5.35, -1.0, -3.0]]} particles={12} />
      <SPipe id="vent-pipe" style="drain" radius={0.12} points={[[5.35, ROOF + 1.1, -3.0], [5.35, ROOF, -3.0]]} particles={0} />
      <VentCowl />
      <SPipe id="kitchen-waste" style="drain" radius={0.09} points={[[-5.35, 4.2, -3.2], [-5.35, -0.05, -3.2], [-5.35, -0.05, -3.8]]} particles={8} />
      <GullyTrap />

      {/* --- underground --- */}
      <SPipe id="underground-drain" style="drain" radius={0.12} points={[[5.35, -1.0, -3.0], [7.3, -1.0, -3.0], [7.3, -1.0, -0.5]]} particles={6} />
      <SPipe id="underground-drain" style="drain" radius={0.11} points={[[-5.35, -0.4, -4.1], [-5.35, -1.05, -4.1], [-5.35, -1.05, 4.2], [7.3, -1.05, 4.2], [7.3, -1.05, 0.5]]} particles={12} />
      <InspectionChamber />
      <SPipe id="sewer-connection" style="drain" radius={0.14} points={[[7.8, -1.15, 0], [11.4, -1.15, 0], [11.4, -2.1, 0]]} particles={6} />
      <SPipe id="sewer-connection" style="drain" radius={0.32} points={[[11.4, -2.4, -6.8], [11.4, -2.4, 6.8]]} particles={10} />
    </group>
  );
}

/* ------------------------------------------------------------------ camera director */

function CameraDirector({ view, controls, animate }: { view: SystemView; controls: React.RefObject<ElementRef<typeof OrbitControls>>; animate: boolean }) {
  const { camera, invalidate } = useThree();
  const active = useRef(true);
  const first = useRef(true);
  const goalPos = useMemo(() => new THREE.Vector3(...view.camera), [view]);
  const goalTarget = useMemo(() => new THREE.Vector3(...view.target), [view]);

  useEffect(() => {
    active.current = true;
    // Snap on first mount (no swoop from the origin); animate on later view changes.
    if ((!animate || first.current) && controls.current) {
      first.current = false;
      camera.position.copy(goalPos);
      controls.current.target.copy(goalTarget);
      controls.current.update();
      active.current = false;
    }
    invalidate();
  }, [view, animate, camera, controls, goalPos, goalTarget, invalidate]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => (active.current = false);
    c.addEventListener('start', stop);
    return () => c.removeEventListener('start', stop);
  }, [controls]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!active.current || !c) return;
    const k = 1 - Math.pow(0.004, delta);
    camera.position.lerp(goalPos, k);
    c.target.lerp(goalTarget, k);
    c.update();
    if (camera.position.distanceTo(goalPos) < 0.03 && c.target.distanceTo(goalTarget) < 0.03) active.current = false;
  });
  return null;
}

/* ------------------------------------------------------------------ canvas */

interface SceneProps {
  view: SystemView;
  selected: string | null;
  hovered: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  quality: Exclude<Quality, 'off'>;
  animate: boolean;
  active: boolean;
}

export default function SystemScene({ view, selected, hovered, onSelect, onHover, quality, animate, active }: SceneProps) {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const focus = useMemo(() => (view.focus ? new Set(view.focus) : null), [view]);
  const ctx = useMemo<Ctx>(
    () => ({ selected, hovered, focus, animate, quality, select: onSelect, hover: onHover }),
    [selected, hovered, focus, animate, quality, onSelect, onHover],
  );

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  return (
    <Canvas
      dpr={quality === 'high' ? [1, 1.75] : [1, 1.25]}
      camera={{ position: view.camera, fov: 40, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      frameloop={active ? (animate ? 'always' : 'demand') : 'never'}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={['#06131f']} />
      <fog attach="fog" args={['#06131f', 30, 70]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 16, 10]} intensity={1.5} />
      <pointLight position={[-8, 6, 6]} intensity={40} color="#168BFF" distance={30} />
      <Suspense fallback={null}>
        <Environment resolution={64} frames={1}>
          <Lightformer form="rect" intensity={2} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-10, 3, 5]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} color="#9fd0ff" />
        </Environment>
      </Suspense>
      <SceneCtx.Provider value={ctx}>
        <Ground underground={view.id === 'underground'} />
        <Building />
        <PlumbingNetwork />
      </SceneCtx.Provider>
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={42}
        maxPolarAngle={Math.PI * 0.62}
      />
      <CameraDirector view={view} controls={controls} animate={animate} />
    </Canvas>
  );
}

export { CATEGORY_META, COMPONENT_BY_ID };
