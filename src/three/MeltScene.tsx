import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { FirstFrame } from "./FirstFrame";
import { device } from "../lib/device";
import { melt } from "../lib/film";


/*
 * A liquid-chocolate sheet: a dense plane displaced in the vertex shader of a
 * physical material. The flow front travels left → right with scroll; the
 * surface keeps rippling with time. Normals are rebuilt from the height field
 * by finite differences so the clearcoat highlights ride the ripples — that's
 * what reads as "thick, glossy liquid" rather than plastic.
 */
const GLSL_HEIGHT = /* glsl */ `
uniform float uTime;
uniform float uFront;
uniform float uHalfW;
varying float vMask;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float a = 0.5, s = 0.0; for(int i=0;i<4;i++){ s += a*vnoise(p); p *= 2.03; a *= 0.5; } return s; }
// band edges wander so the stream never looks like a rectangle
float edgeMask(vec2 xz, float front){
  float w = 1.6 + 0.35*sin(xz.x*0.55 + 1.3) + 0.25*fbm(vec2(xz.x*0.4, 3.0));
  float side = smoothstep(w, w - 0.55, abs(xz.y + 0.15*sin(xz.x*0.7)));
  float head = smoothstep(front + 0.1, front - 1.1, xz.x + 0.35*sin(xz.y*2.2));
  return side * head;
}
float heightAt(vec2 xz, out float mask){
  float front = uFront;
  mask = edgeMask(xz, front);
  vec2 q = vec2(xz.x*0.9 - uTime*0.55, xz.y*1.4);
  float ripple = fbm(q) * 0.16 + sin(xz.x*2.2 - uTime*1.6 + xz.y*1.3)*0.025;
  // the leading edge piles up into a rounded bulge, like poured ganache
  float bulge = exp(-pow((xz.x - front + 0.55)*1.6, 2.0)) * 0.22;
  float body = 0.16 + ripple + bulge * smoothstep(0.0, 0.5, mask);
  return mask * body - (1.0 - mask) * 0.06;
}
`;

function MeltSheet() {
  const low = device.tier === "low";
  const { size } = useThree();
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uFront: { value: -12 }, uHalfW: { value: 9 } }), []);
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#4b2213"),
      roughness: 0.28,
      metalness: 0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.2,
      sheen: 0.4,
      sheenColor: new THREE.Color("#9a5a3a"),
      specularIntensity: 0.8,
      transparent: false,
    });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\n" + GLSL_HEIGHT)
        .replace(
          "#include <beginnormal_vertex>",
          /* glsl */ `
          float mk; float e = 0.04;
          float h0 = heightAt(position.xz, mk);
          float m1; float m2;
          float hx = heightAt(position.xz + vec2(e, 0.0), m1);
          float hz = heightAt(position.xz + vec2(0.0, e), m2);
          vec3 objectNormal = normalize(vec3(h0 - hx, e, h0 - hz));
          vMask = mk;
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(1.0, 0.0, 0.0);
          #endif
          `,
        )
        .replace("#include <begin_vertex>", "vec3 transformed = vec3(position.x, h0, position.z);");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vMask;")
        .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\n if (vMask < 0.04) discard;");
    };
    return m;
  }, [uniforms]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(22, 4.4, low ? 260 : 460, low ? 48 : 90);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [low]);

  const cur = useRef(-12);
  useFrame((state, dt) => {
    const halfW = 11 * Math.min(1, size.width / size.height / 1.2 + 0.2);
    uniforms.uHalfW.value = halfW;
    const target = THREE.MathUtils.lerp(-12.5, 12.5, melt.p);
    cur.current += (target - cur.current) * (1 - Math.exp(-dt * 6));
    uniforms.uFront.value = cur.current;
    uniforms.uTime.value = state.clock.elapsedTime * (device.reducedMotion ? 0.15 : 1);
  });

  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

function Cam() {
  const { camera, size } = useThree();
  useFrame(() => {
    const aspect = size.width / size.height;
    // keep the stream spanning the full width on every aspect ratio
    // frame ~16 world units of stream width whatever the canvas aspect
    const dist = THREE.MathUtils.clamp(8 / (Math.tan(THREE.MathUtils.degToRad(16)) * aspect), 6, 15);
    camera.position.set(0, dist * 0.55, dist * 0.84);
    camera.lookAt(0, 0, 0.2);
  });
  return null;
}

export default function MeltScene({ active }: { active: boolean }) {
  const low = device.tier === "low";
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={low ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 32, position: [0, 6, 7], near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <ambientLight intensity={0.3} color="#ffe6d6" />
      <directionalLight position={[-4, 6, 3]} intensity={1.4} color="#fff0e2" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#fff6ec" position={[0, 6, -2]} rotation-x={Math.PI / 2.2} scale={[18, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#ffffff" position={[-6, 3, 4]} rotation-y={Math.PI / 3} scale={[2, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#E9B7B5" position={[6, 2, 4]} rotation-y={-Math.PI / 3} scale={[4, 5, 1]} />
        <Lightformer form="circle" intensity={0.8} color="#F4DDA8" position={[0, -3, 5]} scale={6} />
      </Environment>
      <Cam />
      <MeltSheet />
      <FirstFrame name="melt" />
    </Canvas>
  );
}
