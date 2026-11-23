import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { StudioLights } from "./FilmScene";
import { chocolateMaterial, matteMaterial, noiseTexture, softShadowTexture } from "./materials";
import { device } from "../lib/device";
import { gift } from "../lib/film";


const W = 2.3; // box footprint
const H = 0.78; // base height
const LID_H = 0.3;
const WALL = 0.05;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function lidLabel() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 1024, 1024);
  ctx.fillStyle = "#5A3026";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "italic 600 150px Fraunces, Georgia, serif";
  ctx.fillText("KRUZZ'S", 512, 470);
  ctx.font = "600 34px 'Bricolage Grotesque', Arial, sans-serif";
  ctx.fillText("T O O   G O O D   T O   S H A R E", 512, 600);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Box() {
  const low = device.tier === "low";
  const lid = useRef<THREE.Group>(null!);
  const ribbon = useRef<THREE.Group>(null!);
  const bowL = useRef<THREE.Mesh>(null!);
  const bowR = useRef<THREE.Mesh>(null!);
  const truffles = useRef<THREE.Group>(null!);

  const mats = useMemo(() => {
    const paperBump = noiseTexture("paper", 256, [[64, 0.6], [180, 0.4]], 4, 11);
    const paper = new THREE.MeshPhysicalMaterial({ color: "#E9B7B5", roughness: 0.88, bumpMap: paperBump, bumpScale: 0.2, sheen: 0.25, sheenColor: new THREE.Color("#fff0ee") });
    const inside = new THREE.MeshStandardMaterial({ color: "#5A3026", roughness: 0.9 });
    const satin = new THREE.MeshPhysicalMaterial({ color: "#5A3026", roughness: 0.32, sheen: 1, sheenColor: new THREE.Color("#c48c70"), sheenRoughness: 0.35, clearcoat: 0.3, transparent: true });
    const label = new THREE.MeshBasicMaterial({ map: lidLabel(), transparent: true, depthWrite: false, toneMapped: false });
    const cup = new THREE.MeshStandardMaterial({ color: "#F4DDA8", roughness: 0.6, side: THREE.DoubleSide });
    return { paper, inside, satin, label, cup };
  }, []);

  const truffleMats = useMemo(
    () => [
      matteMaterial("#3b1d12", 0.95, 0.9), // cocoa-dusted
      chocolateMaterial("#5a2c19", low), // glossy milk
      new THREE.MeshPhysicalMaterial({ color: "#d98f97", roughness: 0.35, clearcoat: 0.5 }), // ruby / blush shell
      matteMaterial("#a9b98a", 0.8, 1.2), // pistachio crumb
    ],
    [low],
  );

  const geos = useMemo(() => {
    const seg = low ? 2 : 4;
    const wallX = new RoundedBoxGeometry(W, H, WALL, seg, 0.02);
    const wallZ = new RoundedBoxGeometry(WALL, H, W, seg, 0.02);
    const bottom = new RoundedBoxGeometry(W, WALL, W, seg, 0.02);
    const lidTop = new RoundedBoxGeometry(W + 0.08, 0.06, W + 0.08, seg, 0.025);
    const lidSideX = new RoundedBoxGeometry(W + 0.08, LID_H, 0.04, seg, 0.015);
    const lidSideZ = new RoundedBoxGeometry(0.04, LID_H, W + 0.08, seg, 0.015);
    const truffle = new THREE.SphereGeometry(0.27, low ? 24 : 40, low ? 18 : 28);
    const cupG = new THREE.CylinderGeometry(0.34, 0.27, 0.2, low ? 18 : 28, 1, true);
    const strip = new THREE.BoxGeometry(0.26, 0.012, W + 0.14);
    const stripSide = new THREE.BoxGeometry(0.26, H + 0.07, 0.012);
    const loop = new THREE.TorusGeometry(0.3, 0.075, 12, 40);
    loop.scale(1, 0.62, 0.45);
    const knot = new THREE.SphereGeometry(0.12, 20, 14);
    knot.scale(1.2, 0.8, 1);
    return { wallX, wallZ, bottom, lidTop, lidSideX, lidSideZ, truffle, cupG, strip, stripSide, loop, knot };
  }, [low]);

  const grid = useMemo(() => {
    const out: { x: number; z: number; m: number }[] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push({ x: (c - 1) * 0.7, z: (r - 1) * 0.7, m: (r * 3 + c) % 4 });
    return out;
  }, []);

  useFrame((state) => {
    const p = gift.p;
    const t = state.clock.elapsedTime;
    const loosen = seg(0.04, 0.3, p);
    const slide = seg(0.22, 0.46, p);
    const open = seg(0.42, 0.74, p);
    const rise = seg(0.66, 0.92, p);
    // bow loops relax and droop, then the whole ribbon slips off sideways
    bowL.current.rotation.set(0, 0, 0.5 + loosen * 0.9);
    bowR.current.rotation.set(0, 0, -0.5 - loosen * 0.9);
    bowL.current.scale.setScalar(1 - loosen * 0.25);
    bowR.current.scale.setScalar(1 - loosen * 0.25);
    ribbon.current.position.set(slide * 3.2, loosen * 0.08 + slide * 0.5, slide * 0.4);
    ribbon.current.rotation.set(0, 0, -slide * 0.5);
    mats.satin.opacity = 1 - seg(0.3, 0.46, p);
    ribbon.current.visible = mats.satin.opacity > 0.01;
    // lid hinges at the back edge
    lid.current.rotation.x = -open * 1.95;
    lid.current.position.y = open * 0.05;
    truffles.current.position.y = WALL + rise * 0.12 + Math.sin(t * 1.4) * 0.01 * rise;
  });

  const half = W / 2;
  return (
    <group position={[0, -0.55, 0]}>
      {/* base: open-topped, paper outside, chocolate-brown inside */}
      <mesh geometry={geos.bottom} material={mats.inside} position={[0, WALL / 2, 0]} />
      <mesh geometry={geos.wallX} material={mats.paper} position={[0, H / 2, half]} />
      <mesh geometry={geos.wallX} material={mats.paper} position={[0, H / 2, -half]} />
      <mesh geometry={geos.wallZ} material={mats.paper} position={[half, H / 2, 0]} />
      <mesh geometry={geos.wallZ} material={mats.paper} position={[-half, H / 2, 0]} />
      <mesh material={mats.inside} position={[0, 0.16, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[W - 0.1, W - 0.1]} />
      </mesh>

      <group ref={truffles} position={[0, WALL, 0]}>
        {grid.map((g, i) => (
          <group key={i} position={[g.x, 0.16, g.z]}>
            <mesh geometry={geos.cupG} material={mats.cup} position={[0, 0.06, 0]} />
            <mesh geometry={geos.truffle} material={truffleMats[g.m]} position={[0, 0.22, 0]} scale={[1, 0.9, 1]} />
          </group>
        ))}
      </group>

      {/* lid, pivoting on its back edge */}
      <group position={[0, H, -half - 0.04]}>
        <group ref={lid}>
          <group position={[0, 0, half + 0.04]}>
            <mesh geometry={geos.lidTop} material={mats.paper} position={[0, 0.03, 0]} />
            <mesh geometry={geos.lidSideX} material={mats.paper} position={[0, 0.06 - LID_H / 2, half + 0.04]} />
            <mesh geometry={geos.lidSideX} material={mats.paper} position={[0, 0.06 - LID_H / 2, -half - 0.04]} />
            <mesh geometry={geos.lidSideZ} material={mats.paper} position={[half + 0.04, 0.06 - LID_H / 2, 0]} />
            <mesh geometry={geos.lidSideZ} material={mats.paper} position={[-half - 0.04, 0.06 - LID_H / 2, 0]} />
            <mesh material={mats.label} position={[0.25, 0.062, 0.35]} rotation-x={-Math.PI / 2}>
              <planeGeometry args={[1.7, 1.7]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* satin ribbon + bow (separate from the lid so it can slip off first) */}
      <group ref={ribbon}>
        <mesh geometry={geos.strip} material={mats.satin} position={[-0.45, H + 0.068, 0]} />
        <mesh geometry={geos.stripSide} material={mats.satin} position={[-0.45, (H + 0.07) / 2, half + 0.075]} />
        <mesh geometry={geos.stripSide} material={mats.satin} position={[-0.45, (H + 0.07) / 2, -half - 0.075]} />
        <group position={[-0.45, H + 0.08, 0]}>
          <mesh ref={bowL} geometry={geos.loop} material={mats.satin} position={[-0.26, 0.12, 0]} />
          <mesh ref={bowR} geometry={geos.loop} material={mats.satin} position={[0.26, 0.12, 0]} />
          <mesh geometry={geos.knot} material={mats.satin} position={[0, 0.08, 0]} />
        </group>
      </group>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} scale={[W * 2.1, W * 2.1, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={softShadowTexture()} color="#2f4a22" transparent opacity={0.42} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Rig() {
  const { camera, size } = useThree();
  const g = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const p = gift.p;
    const t = state.clock.elapsedTime;
    const aspect = size.width / size.height;
    const fit = THREE.MathUtils.clamp(aspect / 1.1, 0.62, 1);
    g.current.scale.setScalar(fit);
    g.current.rotation.y = -0.6 + p * 0.5 + (device.reducedMotion ? 0 : Math.sin(t * 0.3) * 0.06);
    // camera rises and pushes in as the box opens, so we look into it
    const push = seg(0.5, 1, p);
    camera.position.set(0, 3.1 + push * 1.6, 7.4 - push * 1.9);
    camera.lookAt(0, 0.05 - push * 0.15, 0);
  });
  return (
    <group ref={g}>
      <Box />
    </group>
  );
}

export default function GiftScene({ active }: { active: boolean }) {
  const low = device.tier === "low";
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={low ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 30, position: [0, 3, 7.4], near: 0.1, far: 50 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <StudioLights />
      <Rig />
    </Canvas>
  );
}
