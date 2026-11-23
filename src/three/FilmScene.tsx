import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { BAR, hazelnutGeometry, nibGeometry, pieceGeometry, piecePositions, pistachioGeometry } from "./geometry";
import { chocolateMaterial, softShadowTexture } from "./materials";
import { film, labelEls } from "../lib/film";
import { device } from "../lib/device";


const SOLO = 8; // the piece that performs the intro on its own
const REF_DIST = 9;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* deterministic pseudo-random so the explosion is identical every visit (and reversible) */
const rand = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function Bar() {
  const low = device.tier === "low";
  const geo = useMemo(() => pieceGeometry(low), [low]);
  const mat = useMemo(() => chocolateMaterial("#3f1d11", low), [low]);
  const rest = useMemo(() => piecePositions(), []);
  const refs = useRef<THREE.Mesh[]>([]);
  const explodeDir = useMemo(
    () =>
      rest.map((p, i) => ({
        pos: new THREE.Vector3(p.x * 0.8, (rand(i, 1) - 0.5) * 1.1, p.z * 1.3 + (rand(i, 2) - 0.5) * 0.8),
        rot: new THREE.Euler((rand(i, 3) - 0.5) * 2.2, (rand(i, 4) - 0.5) * 1.6, (rand(i, 5) - 0.5) * 2.0),
      })),
    [rest],
  );

  useFrame(() => {
    const e = film.explode;
    const a = smooth(0.38, 0.92, film.intro); // intro assembly
    const solo = rest[SOLO];
    refs.current.forEach((m, i) => {
      if (!m) return;
      const p = rest[i];
      const d = explodeDir[i];
      const isSolo = i === SOLO;
      // intro: everything but the solo piece flies in from outside
      const fly = isSolo ? 0 : (1 - a) * (2.4 + rand(i, 6) * 1.6);
      const ex = e + fly * 0.6;
      m.position.set(
        p.x + d.pos.x * ex - solo.x * (1 - a) + (isSolo ? 0 : Math.sign(p.x - solo.x || 1) * fly),
        p.y + d.pos.y * ex,
        p.z + d.pos.z * ex - solo.z * (1 - a),
      );
      m.rotation.set(d.rot.x * ex, d.rot.y * ex, d.rot.z * ex);
      const s = isSolo ? 1 : Math.max(0.0001, a);
      m.scale.setScalar(s);
      m.visible = s > 0.002;
    });
  });

  return (
    <group>
      {rest.map((_, i) => (
        <mesh key={i} ref={(m) => void (refs.current[i] = m!)} geometry={geo} material={mat} />
      ))}
    </group>
  );
}

/** hazelnuts, pistachio kernels and cocoa nibs drifting around the exploded bar */
function Ingredients() {
  const low = device.tier === "low";
  const nuts = useRef<THREE.InstancedMesh>(null!);
  const pist = useRef<THREE.InstancedMesh>(null!);
  const nibs = useRef<THREE.InstancedMesh>(null!);
  const g = useMemo(() => ({ nut: hazelnutGeometry(), pist: pistachioGeometry(), nib: nibGeometry() }), []);
  const m = useMemo(
    () => ({
      nut: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4 }),
      pist: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 }),
      nib: chocolateMaterial("#3a1a10", true),
    }),
    [],
  );
  const counts = { nut: low ? 7 : 10, pist: low ? 8 : 12, nib: low ? 14 : 26 };
  const data = useMemo(() => {
    const mk = (n: number, k: number) =>
      Array.from({ length: n }, (_, i) => {
        // spread on a loose shell around the bar, never in its middle
        const ang = (i / n) * Math.PI * 2 + rand(i, k) * 0.8;
        const rad = 2.0 + rand(i, k + 1) * 1.1;
        return {
          p: new THREE.Vector3(Math.cos(ang) * rad * 1.15, (rand(i, k + 2) - 0.5) * 2.0, Math.sin(ang) * rad * 0.6),
          r: new THREE.Euler(rand(i, k + 3) * 6, rand(i, k + 4) * 6, rand(i, k + 5) * 6),
          s: 0.8 + rand(i, k + 6) * 0.5,
          delay: rand(i, k + 7) * 0.45,
          spin: (rand(i, k + 8) - 0.5) * 0.8,
        };
      });
    return { nut: mk(counts.nut, 10), pist: mk(counts.pist, 20), nib: mk(counts.nib, 30) };
  }, [counts.nut, counts.pist, counts.nib]);

  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const k = film.ingredients;
    const set = (mesh: THREE.InstancedMesh, arr: typeof data.nut) => {
      // stays in the scene at zero scale so its shaders compile with the first frame (no hitch mid-scroll)
      if (k <= 0.001 && mesh.userData.zeroed) return;
      mesh.userData.zeroed = k <= 0.001;
      arr.forEach((d, i) => {
        const v = smooth(d.delay, d.delay + 0.55, k);
        o.position.set(d.p.x * (0.6 + 0.4 * v), d.p.y * v + Math.sin(t * 0.8 + i) * 0.05, d.p.z * (0.6 + 0.4 * v));
        o.rotation.set(d.r.x + t * d.spin, d.r.y + t * d.spin * 0.7, d.r.z);
        o.scale.setScalar(d.s * v);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    set(nuts.current, data.nut);
    set(pist.current, data.pist);
    set(nibs.current, data.nib);
  });

  return (
    <group>
      <instancedMesh ref={nuts} args={[g.nut, m.nut, counts.nut]} frustumCulled={false} />
      <instancedMesh ref={pist} args={[g.pist, m.pist, counts.pist]} frustumCulled={false} />
      <instancedMesh ref={nibs} args={[g.nib, m.nib, counts.nib]} frustumCulled={false} />
    </group>
  );
}

/* label anchors in bar-local space (piece 0 top, a hazelnut-ish spot, piece 17 side) */
const ANCHORS = [new THREE.Vector3(-1.45, 0.35, -0.75), new THREE.Vector3(1.9, 0.55, 0.2), new THREE.Vector3(0.8, -0.45, 0.85)];

function Rig() {
  const outer = useRef<THREE.Group>(null!);
  const bar = useRef<THREE.Group>(null!);
  const shadow = useRef<THREE.Group>(null!);
  const shadowMat = useRef<THREE.MeshBasicMaterial>(null!);
  const { camera, size } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const portrait = aspect < 0.9;
    const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * REF_DIST;
    const halfW = halfH * aspect;

    const a = smooth(0.38, 0.92, film.intro);
    // hero pose: right column on desktop, top band on portrait
    const heroX = portrait ? 0 : halfW * 0.5;
    const heroY = portrait ? halfH * 0.36 : -halfH * 0.02;
    const heroW = portrait ? 0.7 : 0.36;
    const centreW = portrait ? Math.min(0.9, film.size + 0.32) : film.size;
    const h = film.hero * a; // during the intro the piece is centre stage
    const widthFrac = THREE.MathUtils.lerp(centreW, heroW, h);
    let scale = (widthFrac * 2 * halfW) / BAR.length;
    scale = Math.min(scale, ((portrait ? 0.42 : 0.62) * 2 * halfH) / (BAR.depth + 0.6));
    const introZoom = 1 + (1 - a) * (portrait ? 1.4 : 1.1);
    scale *= introZoom;

    const idle = film.idle * (device.reducedMotion ? 0 : 1);
    outer.current.position.set(THREE.MathUtils.lerp(0, heroX, h), THREE.MathUtils.lerp(film.lift * halfH, heroY, h) + Math.sin(t * 1.1) * 0.06 * idle, 0);
    outer.current.scale.setScalar(scale);
    bar.current.rotation.set(
      film.rotX + Math.sin(t * 0.5) * 0.05 * idle + (1 - film.intro) * 0.5,
      film.rotY + film.orbit + Math.sin(t * 0.33) * 0.32 * idle + (1 - film.intro) * -3.2,
      film.rotZ + Math.sin(t * 0.41) * 0.03 * idle,
    );
    // floor shadow follows the bar yaw, softens as it floats up, fades during the explosion
    const bob = Math.sin(t * 1.1) * 0.06 * idle;
    shadow.current.position.y = -1.0 - bob;
    shadow.current.rotation.y = bar.current.rotation.y;
    shadowMat.current.opacity = 0.34 * (1 - bob * 2) * Math.max(0, 1 - film.explode * 2.5) * smooth(0.6, 1, film.intro);

    cam.position.set(0, film.camY, film.camZ);
    cam.lookAt(0, 0, 0);

    // project label anchors to screen
    for (let i = 0; i < ANCHORS.length; i++) {
      const el = labelEls[i];
      if (!el) continue;
      tmp.copy(ANCHORS[i]).multiplyScalar(0.6 + 0.4 * film.explode);
      bar.current.localToWorld(tmp);
      tmp.project(cam);
      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      // keep the label text on whichever side has room
      const room = 300;
      if (x < room) el.classList.remove("left");
      else if (x > size.width - room) el.classList.add("left");
    }
  });

  return (
    <group ref={outer}>
      <group ref={bar}>
        <Bar />
        <Ingredients />
      </group>
      <group ref={shadow}>
        <mesh rotation-x={-Math.PI / 2} scale={[BAR.length * 1.35, BAR.depth * 2.4, 1]}>
          <planeGeometry />
          <meshBasicMaterial ref={shadowMat} map={softShadowTexture()} color="#3b1d12" transparent opacity={0.34} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.25} color="#ffe9dc" />
      <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff1e4" />
      <directionalLight position={[-5, 2, -3]} intensity={0.9} color="#ffd2c9" />
      <Environment resolution={256} frames={1}>
        {/* large warm softbox overhead → long glossy highlight across the pillows */}
        <Lightformer form="rect" intensity={2.4} color="#fff3e6" position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
        {/* rim strips */}
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[-5, 1, -2]} rotation-y={Math.PI / 2.4} scale={[6, 0.6, 1]} />
        <Lightformer form="rect" intensity={2} color="#ffe0cf" position={[5, 1.5, -1]} rotation-y={-Math.PI / 2.4} scale={[6, 0.8, 1]} />
        {/* blush + butter bounce cards — the brand colours live in the reflections */}
        <Lightformer form="circle" intensity={1.1} color="#E9B7B5" position={[2, -2, 3]} scale={4} />
        <Lightformer form="circle" intensity={0.8} color="#F4DDA8" position={[-3, -1, 3]} scale={3} />
      </Environment>
    </>
  );
}

export default function FilmScene({ active }: { active: boolean }) {
  const low = device.tier === "low";
  return (
    <Canvas
      className="film-canvas"
      frameloop={active ? "always" : "never"}
      dpr={low ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !low, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, position: [0, 0.9, 9], near: 0.1, far: 60 }}
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
