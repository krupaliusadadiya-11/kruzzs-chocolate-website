import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { StudioLights } from "./FilmScene";
import { pieceGeometry, piecePositions } from "./geometry";
import { chocolateMaterial, softShadowTexture } from "./materials";
import { PACK_FLAVOURS, cartonMaterial, crinkle, foilMaterial, packBack, packEdge, packFront, pointer } from "./packaging";
import { device } from "../lib/device";
import { pack } from "../lib/film";

/* carton: a printed paperboard sleeve over a slide-out tray, gold foil inside */
const L = 3.8; // length
const HH = 2.0; // height of the printed face
const T = 0.44; // thickness
const P = 0.02; // board thickness
const SNAP = 5; // corner piece that breaks off at the end

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** ease-out with a little overshoot, like board settling after a push */
const settle = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
};

/** scroll → beats. Exported so the DOM copy uses the exact same thresholds. */
export function packBeats(p: number) {
  const turns = seg(0.04, 0.16, p) + seg(0.2, 0.32, p); // two full spins, a hold on each flavour
  return {
    angle: turns * Math.PI * 2,
    tilt: seg(0.36, 0.5, p),
    slide: seg(0.48, 0.62, p),
    away: seg(0.6, 0.72, p),
    foil: seg(0.7, 0.84, p),
    lift: seg(0.82, 0.97, p),
  };
}

function Carton() {
  const low = device.tier === "low";
  const sleeve = useRef<THREE.Group>(null!);
  const tray = useRef<THREE.Group>(null!);
  const flapA = useRef<THREE.Group>(null!);
  const flapB = useRef<THREE.Group>(null!);
  const bar = useRef<THREE.Group>(null!);
  const snap = useRef<THREE.Mesh>(null!);
  const printed = useRef<THREE.Mesh[]>([]);
  const cur = useRef(-1);

  const sets = useMemo(
    () =>
      PACK_FLAVOURS.map((f) => {
        const front = packFront(f);
        const bg = new THREE.MeshPhysicalMaterial({ color: f.bg, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3 });
        return {
          bg,
          front: cartonMaterial(front.map, front.metal),
          back: cartonMaterial(packBack(f)),
          edge: cartonMaterial(packEdge(f)),
        };
      }),
    [],
  );
  const shared = useMemo(
    () => ({
      kraft: new THREE.MeshStandardMaterial({ color: "#d8c2a2", roughness: 0.92 }),
      card: new THREE.MeshStandardMaterial({ color: "#f3e6d3", roughness: 0.85 }),
      foil: foilMaterial(),
      choc: chocolateMaterial("#3f1d11", low),
    }),
    [low],
  );

  const geos = useMemo(() => {
    const flap = (dir: 1 | -1) => {
      const g = new THREE.PlaneGeometry(L - 0.3, 0.97, low ? 24 : 60, low ? 8 : 16);
      g.translate(0, -dir * 0.485, 0);
      return crinkle(g, 0.005, dir === 1 ? 2 : 5);
    };
    return {
      face: new THREE.BoxGeometry(L, HH, P),
      rim: new THREE.BoxGeometry(L, P, T),
      cap: new THREE.BoxGeometry(P, HH - 0.01, T - 0.01),
      trayFloor: new THREE.BoxGeometry(L - 0.04, HH - 0.05, 0.015),
      trayWall: new THREE.BoxGeometry(L - 0.04, 0.015, 0.16),
      foilBase: crinkle(new THREE.PlaneGeometry(L - 0.3, 1.86, 40, 12), 0.004, 9),
      foilSide: crinkle(new THREE.PlaneGeometry(L - 0.3, 0.3, 40, 4), 0.01, 3),
      foilEnd: crinkle(new THREE.PlaneGeometry(1.86, 0.3, 14, 4), 0.012, 7),
      flapA: flap(1),
      flapB: flap(-1),
      piece: pieceGeometry(low),
    };
  }, [low]);
  const rest = useMemo(() => piecePositions(), []);

  // which material goes on which printed mesh (BoxGeometry groups: +x −x +y −y +z −z)
  const assign = (i: number) => {
    const s = sets[i];
    const [front, back, top, bottom, capL, capR] = printed.current;
    front.material = [s.bg, s.bg, s.bg, s.bg, s.front, shared.kraft];
    back.material = [s.bg, s.bg, s.bg, s.bg, shared.kraft, s.back];
    top.material = [s.bg, s.bg, s.edge, shared.kraft, s.bg, s.bg];
    bottom.material = [s.bg, s.bg, shared.kraft, s.edge, s.bg, s.bg];
    capL.material = capR.material = s.bg;
  };

  useFrame((state) => {
    const b = packBeats(pack.p);
    // swap the print while the back of the carton faces the camera
    const idx = b.angle < Math.PI ? 0 : b.angle < Math.PI * 3 ? 1 : 2;
    if (idx !== cur.current) {
      assign(idx);
      cur.current = idx;
    }
    const t = state.clock.elapsedTime;
    // sleeve is pushed off to the left, then drops out of frame
    sleeve.current.position.set(-b.slide * 2.1 - b.away * 3.6, -b.away * 0.8, -b.away * 0.4);
    sleeve.current.rotation.set(0, 0, b.away * 0.25);
    sleeve.current.visible = b.away < 0.999;
    // tray slides right (board friction → slight settle), then recentres
    tray.current.position.x = settle(0.48, 0.62, pack.p) * 1.8 - b.away * 1.8;
    // foil flaps peel open from the centre seam
    flapA.current.rotation.x = -b.foil * 2.55;
    flapB.current.rotation.x = b.foil * 2.55;
    // the bar rises out of its foil and turns to the camera
    bar.current.position.z = -0.07 + b.lift * 0.95 + Math.sin(t * 1.2) * 0.02 * b.lift;
    bar.current.rotation.set(Math.PI / 2 + b.lift * 0.32, b.lift * -0.18, 0);
    // …and one corner square snaps off along its groove
    const sn = seg(0.55, 1, b.lift);
    const c = rest[SNAP];
    snap.current.position.set(c.x + sn * 0.32, c.y + sn * 0.22, c.z - sn * 0.12);
    snap.current.rotation.set(sn * 0.25, sn * 0.35, -sn * 0.5);
  });

  return (
    <group>
      <group ref={sleeve}>
        <mesh ref={(m) => void (printed.current[0] = m!)} geometry={geos.face} position={[0, 0, T / 2 - P / 2]} />
        <mesh ref={(m) => void (printed.current[1] = m!)} geometry={geos.face} position={[0, 0, -T / 2 + P / 2]} />
        <mesh ref={(m) => void (printed.current[2] = m!)} geometry={geos.rim} position={[0, HH / 2 - P / 2, 0]} />
        <mesh ref={(m) => void (printed.current[3] = m!)} geometry={geos.rim} position={[0, -HH / 2 + P / 2, 0]} />
      </group>

      <group ref={tray}>
        <mesh ref={(m) => void (printed.current[4] = m!)} geometry={geos.cap} position={[-L / 2 + P / 2, 0, 0]} />
        <mesh ref={(m) => void (printed.current[5] = m!)} geometry={geos.cap} position={[L / 2 - P / 2, 0, 0]} />
        <mesh geometry={geos.trayFloor} material={shared.card} position={[0, 0, -T / 2 + 0.03]} />
        <mesh geometry={geos.trayWall} material={shared.card} position={[0, HH / 2 - 0.035, -T / 2 + 0.11]} />
        <mesh geometry={geos.trayWall} material={shared.card} position={[0, -HH / 2 + 0.035, -T / 2 + 0.11]} />

        {/* foil wrap: base, folded sides and ends, two flaps over the top */}
        <mesh geometry={geos.foilBase} material={shared.foil} position={[0, 0, -0.18]} />
        <mesh geometry={geos.foilSide} material={shared.foil} position={[0, 0.93, -0.03]} rotation-x={Math.PI / 2} />
        <mesh geometry={geos.foilSide} material={shared.foil} position={[0, -0.93, -0.03]} rotation-x={Math.PI / 2} />
        <mesh geometry={geos.foilEnd} material={shared.foil} position={[(L - 0.3) / 2, 0, -0.03]} rotation={[Math.PI / 2, Math.PI / 2, 0]} />
        <mesh geometry={geos.foilEnd} material={shared.foil} position={[-(L - 0.3) / 2, 0, -0.03]} rotation={[Math.PI / 2, Math.PI / 2, 0]} />
        <group ref={flapA} position={[0, 0.93, 0.12]}>
          <mesh geometry={geos.flapA} material={shared.foil} />
        </group>
        <group ref={flapB} position={[0, -0.93, 0.125]}>
          <mesh geometry={geos.flapB} material={shared.foil} />
        </group>

        <group ref={bar} position={[0, 0, -0.07]} rotation-x={Math.PI / 2}>
          {rest.map((p, i) => (
            <mesh key={i} ref={i === SNAP ? snap : undefined} geometry={geos.piece} material={shared.choc} position={p} />
          ))}
        </group>
      </group>
    </group>
  );
}

function Rig() {
  const { camera, size } = useThree();
  const g = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const shadow = useRef<THREE.MeshBasicMaterial>(null!);
  const tiltIn = useRef({ x: 0, y: 0 });
  useFrame((state, dt) => {
    const b = packBeats(pack.p);
    const t = state.clock.elapsedTime;
    const still = device.reducedMotion ? 0 : 1;
    const aspect = size.width / size.height;
    // zoom out while sleeve and tray sit side by side, back in once the sleeve has gone
    const roomy = (1 - (aspect < 1.3 ? 0.56 : 0.44) * b.slide * (1 - b.away)) * (1 - 0.12 * b.lift);
    g.current.scale.setScalar(THREE.MathUtils.clamp(aspect / 1.0, 0.6, 1.02) * roomy);
    g.current.position.x = -0.3 * b.slide * (1 - b.away);
    // pointer parallax, eased
    const k = 1 - Math.exp(-dt * 4);
    tiltIn.current.x += (pointer.y * 0.1 * still - tiltIn.current.x) * k;
    tiltIn.current.y += (pointer.x * 0.16 * still - tiltIn.current.y) * k;
    const sway = Math.sin(t * 0.6) * 0.05 * still * (1 - b.tilt);
    spin.current.rotation.set(
      0.16 * (1 - b.tilt) - b.tilt * 1.02 + tiltIn.current.x + Math.sin(t * 0.8) * 0.02 * still,
      b.angle - 0.42 + sway + tiltIn.current.y + b.tilt * 0.04,
      b.tilt * 0.06,
    );
    spin.current.position.y = Math.sin(t * 1.1) * 0.05 * still - b.tilt * 0.15;
    shadow.current.opacity = 0.36 * (0.75 + 0.25 * b.tilt) * (1 - b.away * 0.3);
    const push = b.lift;
    camera.position.set(0, 0.5 + b.tilt * 1.5 + push * 0.3, 8.4 - push * 0.5);
    camera.lookAt(0, -0.05 + push * 0.2, 0);
  });
  return (
    <group ref={g}>
      <group ref={spin}>
        <Carton />
      </group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.55, 0]} scale={[L * 1.5, 2.6, 1]}>
        <planeGeometry />
        <meshBasicMaterial ref={shadow} map={softShadowTexture()} color="#2b140c" transparent opacity={0.36} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function PackScene({ active }: { active: boolean }) {
  const low = device.tier === "low";
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={low ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 30, position: [0, 0.5, 9.6], near: 0.1, far: 60 }}
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
