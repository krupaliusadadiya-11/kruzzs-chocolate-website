import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { StudioLights } from "./FilmScene";
import { chocolateMaterial, matteMaterial, noiseTexture, softShadowTexture } from "./materials";
import { crinkle, pointer, ribbonAlong, satinMaterial } from "./packaging";
import { device } from "../lib/device";
import { gift } from "../lib/film";

/*
 * A rigid two-piece gift box (telescoping lid over an open base), the way
 * premium chocolate boxes are actually made: wrapped paperboard, a hot-foil
 * logo, satin ribbon crossed over the lid and tied in a bow, tissue folded
 * over a card insert that holds nine truffles.
 */
const W = 2.3; // box footprint
const H = 0.78; // base height
const LID_H = 0.3;
const WALL = 0.05;
const RIB = 0.22; // ribbon width
const XO = -0.42; // ribbon crossing point (off-centre, like a hand-tied box)
const ZO = 0.34;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** scroll → beats; the DOM step list uses the same boundaries (see Sections.tsx) */
function beats(p: number) {
  return {
    untie: seg(0.03, 0.2, p),
    ribbonOff: seg(0.15, 0.33, p),
    lift: seg(0.32, 0.48, p),
    lidAway: seg(0.44, 0.62, p),
    tissue: seg(0.58, 0.76, p),
    rise: seg(0.72, 0.95, p),
  };
}

function lidLabel() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d")!;
  const draw = () => {
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(512, 512, 420, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(512, 512, 400, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "italic 700 168px Fraunces, Georgia, serif";
    ctx.fillText("KRUZZ'S", 512, 480);
    ctx.font = "600 34px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText("T O O   G O O D   T O   S H A R E", 512, 610);
  };
  draw();
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  document.fonts?.ready.then(() => {
    draw();
    t.needsUpdate = true;
  });
  return t;
}

function Box() {
  const low = device.tier === "low";
  const lid = useRef<THREE.Group>(null!);
  const ribbon = useRef<THREE.Group>(null!);
  const bow = useRef<THREE.Group>(null!);
  const loopL = useRef<THREE.Group>(null!);
  const loopR = useRef<THREE.Group>(null!);
  const knot = useRef<THREE.Mesh>(null!);
  const tails = useRef<THREE.Group>(null!);
  const tissueL = useRef<THREE.Group>(null!);
  const tissueR = useRef<THREE.Group>(null!);
  const truffles = useRef<THREE.Group[]>([]);

  const mats = useMemo(() => {
    const paperBump = noiseTexture("paper", 256, [[64, 0.6], [180, 0.4]], 4, 11);
    const paper = new THREE.MeshPhysicalMaterial({ color: "#E9B7B5", roughness: 0.82, bumpMap: paperBump, bumpScale: 0.2, sheen: 0.35, sheenColor: new THREE.Color("#fff0ee") });
    const inside = new THREE.MeshStandardMaterial({ color: "#5A3026", roughness: 0.9, bumpMap: paperBump, bumpScale: 0.1 });
    const satin = satinMaterial("#5A3026");
    satin.transparent = true;
    const foil = new THREE.MeshPhysicalMaterial({ color: "#c9973f", alphaMap: lidLabel(), transparent: true, metalness: 1, roughness: 0.24, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const cup = new THREE.MeshStandardMaterial({ color: "#F4DDA8", roughness: 0.6, side: THREE.DoubleSide });
    const tissue = new THREE.MeshPhysicalMaterial({ color: "#fff4f0", roughness: 0.95, sheen: 0.6, sheenColor: new THREE.Color("#ffffff"), transparent: true, opacity: 0.93, side: THREE.DoubleSide });
    const gold = new THREE.MeshPhysicalMaterial({ color: "#d9b46c", metalness: 1, roughness: 0.3 });
    return { paper, inside, satin, foil, cup, tissue, gold };
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

  const grid = useMemo(() => {
    const out: { x: number; z: number; m: number; d: number }[] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push({ x: (c - 1) * 0.7, z: (r - 1) * 0.7, m: (r * 3 + c) % 4, d: ((r * 3 + c) * 0.37) % 1 });
    return out;
  }, []);

  const geos = useMemo(() => {
    const s = low ? 2 : 4;
    const half = W / 2;
    const lidW = W + 0.08;
    // card insert with nine wells
    const ins = new THREE.Shape();
    ins.moveTo(-half + 0.06, -half + 0.06);
    ins.lineTo(half - 0.06, -half + 0.06);
    ins.lineTo(half - 0.06, half - 0.06);
    ins.lineTo(-half + 0.06, half - 0.06);
    grid.forEach((g) => {
      const h = new THREE.Path();
      h.absarc(g.x, -g.z, 0.3, 0, Math.PI * 2, true);
      ins.holes.push(h);
    });
    const insert = new THREE.ShapeGeometry(ins, 24);
    insert.rotateX(-Math.PI / 2);

    const tissueSheet = (dir: 1 | -1) => {
      const w = half + 0.16;
      const g = new THREE.PlaneGeometry(w, W - 0.14, low ? 16 : 36, low ? 16 : 36);
      crinkle(g, 0.025, dir === 1 ? 3 : 8);
      g.rotateX(-Math.PI / 2);
      g.translate((dir * w) / 2, 0, 0);
      return g;
    };

    // bow: two teardrop loops in the XY plane (ribbon width along Z), two tails lying on the lid
    const loopCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.16, 0.16, 0),
        new THREE.Vector3(0.4, 0.26, 0),
        new THREE.Vector3(0.54, 0.14, 0),
        new THREE.Vector3(0.44, 0.02, 0),
        new THREE.Vector3(0.18, 0.02, 0),
        new THREE.Vector3(0, 0, 0),
      ],
      false,
      "catmullrom",
      0.5,
    );
    const tailA = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(0.14, -0.06, 0.22), new THREE.Vector3(0.2, -0.075, 0.48), new THREE.Vector3(0.34, -0.075, 0.7)]);
    const tailB = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(-0.16, -0.06, 0.2), new THREE.Vector3(-0.32, -0.075, 0.42), new THREE.Vector3(-0.58, -0.075, 0.58)]);
    const k = new THREE.SphereGeometry(0.11, 20, 14);
    k.scale(1.15, 0.75, 1.2);

    return {
      wallX: new RoundedBoxGeometry(W, H, WALL, s, 0.02),
      wallZ: new RoundedBoxGeometry(WALL, H, W, s, 0.02),
      bottom: new RoundedBoxGeometry(W, WALL, W, s, 0.02),
      lidTop: new RoundedBoxGeometry(lidW, 0.06, lidW, s, 0.025),
      lidSideX: new RoundedBoxGeometry(lidW, LID_H, 0.04, s, 0.015),
      lidSideZ: new RoundedBoxGeometry(0.04, LID_H, lidW, s, 0.015),
      truffle: new THREE.SphereGeometry(0.27, low ? 24 : 40, low ? 18 : 28),
      cupG: new THREE.CylinderGeometry(0.34, 0.27, 0.2, low ? 18 : 28, 1, true),
      insert,
      tissueL: tissueSheet(1),
      tissueR: tissueSheet(-1),
      // ribbon bands: across the lid top and down the lid + base sides
      bandTopZ: new THREE.BoxGeometry(RIB, 0.012, lidW + 0.03),
      bandTopX: new THREE.BoxGeometry(lidW + 0.03, 0.012, RIB),
      bandSideZ: new THREE.BoxGeometry(RIB, H + 0.07, 0.012),
      bandSideX: new THREE.BoxGeometry(0.012, H + 0.07, RIB),
      loop: ribbonAlong(loopCurve, RIB * 0.95, 48, new THREE.Vector3(0, 0, 1)),
      tailA: ribbonAlong(tailA, RIB * 0.9, 24, new THREE.Vector3(1, 0, -0.4), true),
      tailB: ribbonAlong(tailB, RIB * 0.9, 24, new THREE.Vector3(1, 0, 0.6), true),
      knot: k,
    };
  }, [low, grid]);

  useFrame((state) => {
    const b = beats(gift.p);
    const t = state.clock.elapsedTime;

    // 1 · untie: loops collapse and flop down, the knot slips, tails slide out
    loopL.current.scale.setScalar(Math.max(0.001, 1 - b.untie * 0.92));
    loopR.current.scale.setScalar(Math.max(0.001, 1 - b.untie * 0.92));
    loopL.current.rotation.set(-b.untie * 0.6, 0, -b.untie * 0.9);
    loopR.current.rotation.set(-b.untie * 0.6, 0, b.untie * 0.9);
    knot.current.scale.setScalar(Math.max(0.001, 1 - b.untie));
    tails.current.position.set(b.untie * 0.15, -b.untie * 0.02, b.untie * 0.25);
    tails.current.scale.setScalar(Math.max(0.001, 1 - b.ribbonOff));
    bow.current.position.y = H + 0.08 + Math.sin(b.untie * Math.PI) * 0.06;

    // 2 · the loosened band lifts and slides off to the side
    ribbon.current.position.set(b.ribbonOff * 1.4, b.untie * 0.03 + b.ribbonOff * 0.35, b.ribbonOff * 0.3);
    ribbon.current.rotation.set(0, b.ribbonOff * 0.25, -b.ribbonOff * 0.3);
    ribbon.current.scale.set(1 + b.untie * 0.04, 1, 1 + b.untie * 0.04);
    mats.satin.opacity = 1 - seg(0.17, 0.29, gift.p);
    ribbon.current.visible = mats.satin.opacity > 0.01;

    // 3 · lid: a snug telescoping lid — it sticks for a moment, then lifts straight up
    const stick = b.lift < 0.15 ? Math.sin(b.lift * 60) * 0.006 * (1 - b.lift / 0.15) : 0;
    lid.current.position.set(0, H + b.lift * 0.95 - b.lidAway * 0.45 + stick, -b.lidAway * 2.1);
    // …then floats back behind the box, tilting its foil logo toward you
    lid.current.rotation.set(b.lidAway * 0.85 + Math.sin(t * 0.9) * 0.015 * b.lidAway, b.lidAway * 0.2, Math.sin(b.lift * Math.PI) * 0.04);

    // 4 · tissue unfolds over the walls
    tissueL.current.rotation.z = b.tissue * 2.55;
    tissueR.current.rotation.z = -b.tissue * 2.55;
    mats.tissue.opacity = 0.93 * (1 - seg(0.9, 1, gift.p) * 0.5);

    // 5 · truffles rise out of their wells, slightly staggered
    grid.forEach((g, i) => {
      const tr = truffles.current[i];
      if (!tr) return;
      const r = seg(g.d * 0.4, g.d * 0.4 + 0.6, b.rise);
      tr.position.y = 0.38 + r * 0.32 + Math.sin(t * 1.4 + i) * 0.012 * r;
      tr.rotation.y = r * (i % 2 ? 0.6 : -0.6);
    });
  });

  const half = W / 2;
  const lidHalf = half + 0.04;
  return (
    <group position={[0, -0.55, 0]}>
      {/* base: open-topped, paper outside, chocolate-brown inside */}
      <mesh geometry={geos.bottom} material={mats.inside} position={[0, WALL / 2, 0]} />
      <mesh geometry={geos.wallX} material={mats.paper} position={[0, H / 2, half]} />
      <mesh geometry={geos.wallX} material={mats.paper} position={[0, H / 2, -half]} />
      <mesh geometry={geos.wallZ} material={mats.paper} position={[half, H / 2, 0]} />
      <mesh geometry={geos.wallZ} material={mats.paper} position={[-half, H / 2, 0]} />
      {/* thin gold foil line around the base */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[W + 0.012, 0.018, W + 0.012]} />
        <primitive object={mats.gold} attach="material" />
      </mesh>

      {/* card insert + truffles in paper cups */}
      <mesh geometry={geos.insert} material={mats.inside} position={[0, 0.3, 0]} />
      {grid.map((g, i) => (
        <group key={i} position={[g.x, 0, g.z]}>
          <mesh geometry={geos.cupG} material={mats.cup} position={[0, 0.28, 0]} />
          <group ref={(m) => void (truffles.current[i] = m!)} position={[0, 0.38, 0]}>
            <mesh geometry={geos.truffle} material={truffleMats[g.m]} scale={[1, 0.9, 1]} />
          </group>
        </group>
      ))}

      {/* tissue sheets hinged at the left and right inner walls */}
      <group ref={tissueL} position={[-half + WALL, H - 0.07, 0]}>
        <mesh geometry={geos.tissueL} material={mats.tissue} />
      </group>
      <group ref={tissueR} position={[half - WALL, H - 0.065, 0]}>
        <mesh geometry={geos.tissueR} material={mats.tissue} />
      </group>

      {/* telescoping lid (origin at the base rim) */}
      <group ref={lid} position={[0, H, 0]}>
        <mesh geometry={geos.lidTop} material={mats.paper} position={[0, 0.03, 0]} />
        <mesh geometry={geos.lidSideX} material={mats.paper} position={[0, 0.06 - LID_H / 2, lidHalf]} />
        <mesh geometry={geos.lidSideX} material={mats.paper} position={[0, 0.06 - LID_H / 2, -lidHalf]} />
        <mesh geometry={geos.lidSideZ} material={mats.paper} position={[lidHalf, 0.06 - LID_H / 2, 0]} />
        <mesh geometry={geos.lidSideZ} material={mats.paper} position={[-lidHalf, 0.06 - LID_H / 2, 0]} />
        <mesh material={mats.foil} position={[0.32, 0.061, -0.32]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.35, 1.35]} />
        </mesh>
      </group>

      {/* satin ribbon crossed over the lid, separate from it so it can come off first */}
      <group ref={ribbon}>
        <mesh geometry={geos.bandTopZ} material={mats.satin} position={[XO, H + 0.068, 0]} />
        <mesh geometry={geos.bandTopX} material={mats.satin} position={[0, H + 0.07, ZO]} />
        <mesh geometry={geos.bandSideZ} material={mats.satin} position={[XO, (H + 0.07) / 2, lidHalf + 0.035]} />
        <mesh geometry={geos.bandSideZ} material={mats.satin} position={[XO, (H + 0.07) / 2, -lidHalf - 0.035]} />
        <mesh geometry={geos.bandSideX} material={mats.satin} position={[lidHalf + 0.035, (H + 0.07) / 2, ZO]} />
        <mesh geometry={geos.bandSideX} material={mats.satin} position={[-lidHalf - 0.035, (H + 0.07) / 2, ZO]} />
        <group ref={bow} position={[XO, H + 0.08, ZO]}>
          <group ref={loopR} rotation-y={-0.25}>
            <mesh geometry={geos.loop} material={mats.satin} />
          </group>
          <group ref={loopL} rotation-y={0.25}>
            <mesh geometry={geos.loop} material={mats.satin} scale={[-1, 1, 1]} />
          </group>
          <mesh ref={knot} geometry={geos.knot} material={mats.satin} position={[0, 0.02, 0]} />
          <group ref={tails}>
            <mesh geometry={geos.tailA} material={mats.satin} />
            <mesh geometry={geos.tailB} material={mats.satin} />
          </group>
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
  const par = useRef({ x: 0, y: 0 });
  useFrame((state, dt) => {
    const p = gift.p;
    const b = beats(p);
    const t = state.clock.elapsedTime;
    const still = device.reducedMotion ? 0 : 1;
    const aspect = size.width / size.height;
    const fit = THREE.MathUtils.clamp(aspect / 1.1, 0.62, 1) * 1.14;
    g.current.scale.setScalar(fit);
    const k = 1 - Math.exp(-dt * 4);
    par.current.x += (pointer.y * 0.06 * still - par.current.x) * k;
    par.current.y += (pointer.x * 0.18 * still - par.current.y) * k;
    g.current.rotation.set(par.current.x, -0.6 + p * 0.55 + Math.sin(t * 0.3) * 0.06 * still + par.current.y, 0);
    // camera rises and pushes in as the box opens, so we look down into it
    const push = seg(0.55, 1, p);
    camera.position.set(0, 3.1 + push * 1.7 + b.lidAway * 0.2, 7.6 - push * 2.0);
    camera.lookAt(0, 0.1 - push * 0.2 + b.lidAway * 0.15, -b.lidAway * 0.25);
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
      camera={{ fov: 30, position: [0, 3.1, 7.6], near: 0.1, far: 50 }}
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
