import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

type PrimitiveType = 'sphere' | 'box' | 'cylinder';
type PrimitiveOp = 'union' | 'subtract';

interface Primitive {
  id: string;
  type: PrimitiveType;
  op: PrimitiveOp;
  position: THREE.Vector3;
  scale: THREE.Vector3;
}

const MAX_PRIMITIVES = 12;

const vertexShader = `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCameraPos;
uniform mat4 uCameraWorld;
uniform mat4 uCameraProjectionInverse;
uniform int uPrimitiveCount;
uniform vec4 uPrimitivePositionRadius[${MAX_PRIMITIVES}];
uniform vec4 uPrimitiveScaleType[${MAX_PRIMITIVES}];
uniform float uPrimitiveOp[${MAX_PRIMITIVES}];
uniform float uSmoothness;
uniform vec3 uBaseColorA;
uniform vec3 uBaseColorB;

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * h * k * (1.0 / 6.0);
}

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCylinder(vec3 p, vec2 h) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - h;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float evaluatePrimitiveSDF(vec3 p, vec4 posRadius, vec4 scaleType) {
  vec3 local = p - posRadius.xyz;
  float primitiveType = scaleType.w;

  if (primitiveType < 0.5) {
    return sdSphere(local, posRadius.w * scaleType.x);
  }

  if (primitiveType < 1.5) {
    return sdBox(local, scaleType.xyz);
  }

  return sdCylinder(local, vec2(scaleType.x, scaleType.y));
}

float mapScene(vec3 p) {
  float d = 1e5;
  bool first = true;

  for (int i = 0; i < ${MAX_PRIMITIVES}; i++) {
    if (i >= uPrimitiveCount) {
      break;
    }

    float primitiveD = evaluatePrimitiveSDF(p, uPrimitivePositionRadius[i], uPrimitiveScaleType[i]);

    if (first) {
      d = primitiveD;
      first = false;
    } else {
      if (uPrimitiveOp[i] > 0.5) {
        d = smin(d, primitiveD, uSmoothness);
      } else {
        d = max(d, -primitiveD);
      }
    }
  }

  return d;
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    mapScene(p + e.xyy) - mapScene(p - e.xyy),
    mapScene(p + e.yxy) - mapScene(p - e.yxy),
    mapScene(p + e.yyx) - mapScene(p - e.yyx)
  ));
}

vec3 shade(vec3 p, vec3 rd, float travel) {
  vec3 normal = getNormal(p);
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.35));
  float diffuse = max(dot(normal, lightDir), 0.0);
  float fresnel = pow(1.0 - max(dot(-rd, normal), 0.0), 3.0);

  float gradient = clamp(0.5 + 0.5 * p.y, 0.0, 1.0);
  vec3 liquidColor = mix(uBaseColorA, uBaseColorB, gradient + 0.2 * sin(uTime + p.x * 2.0));
  vec3 subsurface = liquidColor * vec3(1.0, 0.7, 0.9) * pow(diffuse, 0.35);
  vec3 specular = vec3(1.0) * pow(max(dot(reflect(-lightDir, normal), -rd), 0.0), 42.0);
  vec3 bloomTint = vec3(0.9, 0.9, 1.0) * fresnel * 0.65;

  vec3 color = liquidColor * (0.2 + diffuse * 0.8) + subsurface * 0.5 + specular * 0.9 + bloomTint;

  float fog = exp(-travel * 0.06);
  vec3 bg = vec3(0.05, 0.07, 0.12);
  return mix(bg, color, fog);
}

void main() {
  vec2 uv = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;

  vec4 clip = vec4(uv, -1.0, 1.0);
  vec4 view = uCameraProjectionInverse * clip;
  view /= view.w;

  vec3 ro = uCameraPos;
  vec3 rd = normalize((uCameraWorld * vec4(normalize(view.xyz), 0.0)).xyz);

  float t = 0.0;
  float hit = -1.0;
  for (int i = 0; i < 128; i++) {
    vec3 p = ro + rd * t;
    float d = mapScene(p);
    if (d < 0.001) {
      hit = t;
      break;
    }
    if (t > 50.0) break;
    t += d * 0.8;
  }

  if (hit > 0.0) {
    vec3 p = ro + rd * hit;
    gl_FragColor = vec4(shade(p, rd, hit), 1.0);
  } else {
    vec3 sky = vec3(0.04, 0.06, 0.1) + 0.25 * vec3(uv.y * 0.4 + 0.4);
    gl_FragColor = vec4(sky, 1.0);
  }
}
`;

const primitiveTypeToFloat = (type: PrimitiveType) => (type === 'sphere' ? 0 : type === 'box' ? 1 : 2);

const buildTextBlob = (text: string): Primitive[] => {
  const chars = text.slice(0, 8).toUpperCase().split('');
  const centerOffset = (chars.length - 1) * 0.35 * 0.5;

  return chars.map((char, index) => ({
    id: `${char}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'sphere',
    op: 'union',
    position: new THREE.Vector3(index * 0.35 - centerOffset, 0.8 + (char.charCodeAt(0) % 4) * 0.02, 0),
    scale: new THREE.Vector3(0.25, 0.25, 0.25),
  }));
};

const createPrimitive = (type: PrimitiveType, op: PrimitiveOp): Primitive => ({
  id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  op,
  position: new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.2 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2),
  scale: new THREE.Vector3(type === 'box' ? 0.45 : 0.35, type === 'cylinder' ? 0.65 : 0.35, type === 'box' ? 0.45 : 0.35),
});

export const SDFLiquidEditor: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const helperMeshRef = useRef<THREE.Mesh>();
  const transformRef = useRef<TransformControls>();
  const primitivesRef = useRef<Primitive[]>([]);
  const selectedIdRef = useRef<string>('base-a');
  const smoothnessRef = useRef(0.35);
  const [primitives, setPrimitives] = useState<Primitive[]>([
    {
      id: 'base-a',
      type: 'sphere',
      op: 'union',
      position: new THREE.Vector3(-0.5, 0.4, 0),
      scale: new THREE.Vector3(0.7, 0.7, 0.7),
    },
    {
      id: 'base-b',
      type: 'sphere',
      op: 'union',
      position: new THREE.Vector3(0.5, 0.4, 0),
      scale: new THREE.Vector3(0.7, 0.7, 0.7),
    },
  ]);
  const [selectedId, setSelectedId] = useState<string>('base-a');
  const [transformMode, setTransformMode] = useState<'translate' | 'scale'>('translate');
  const [shapeType, setShapeType] = useState<PrimitiveType>('sphere');
  const [booleanMode, setBooleanMode] = useState<PrimitiveOp>('union');
  const [smoothness, setSmoothness] = useState(0.35);
  const [textInput, setTextInput] = useState('LIQUID');

  const selectedPrimitive = useMemo(
    () => primitives.find((primitive) => primitive.id === selectedId),
    [primitives, selectedId]
  );

  const updateSelectedPrimitive = useCallback((next: (primitive: Primitive) => Primitive) => {
    setPrimitives((current) =>
      current.map((primitive) => (primitive.id === selectedId ? next(primitive) : primitive))
    );
  }, [selectedId]);

  useEffect(() => {
    primitivesRef.current = primitives;
  }, [primitives]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    smoothnessRef.current = smoothness;
  }, [smoothness]);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.autoClear = false;
    mount.appendChild(renderer.domElement);

    const raymarchScene = new THREE.Scene();
    const overlayScene = new THREE.Scene();
    overlayScene.add(new THREE.GridHelper(16, 16, 0x445169, 0x2a3446));

    const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const viewCamera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.01, 100);
    viewCamera.position.set(3.4, 2.1, 3.4);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
      uTime: { value: 0 },
      uCameraPos: { value: viewCamera.position.clone() },
      uCameraWorld: { value: viewCamera.matrixWorld.clone() },
      uCameraProjectionInverse: { value: viewCamera.projectionMatrixInverse.clone() },
      uPrimitiveCount: { value: 0 },
      uPrimitivePositionRadius: { value: Array.from({ length: MAX_PRIMITIVES }, () => new THREE.Vector4()) },
      uPrimitiveScaleType: { value: Array.from({ length: MAX_PRIMITIVES }, () => new THREE.Vector4()) },
      uPrimitiveOp: { value: Array.from({ length: MAX_PRIMITIVES }, () => 1) },
      uSmoothness: { value: smoothness },
      uBaseColorA: { value: new THREE.Color('#55ffad') },
      uBaseColorB: { value: new THREE.Color('#6b7cff') },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    raymarchScene.add(quad);

    const orbit = new OrbitControls(viewCamera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.target.set(0, 0.6, 0);

    const helperMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: '#93c5fd', wireframe: true })
    );
    helperMesh.visible = false;
    helperMeshRef.current = helperMesh;
    overlayScene.add(helperMesh);

    const transform = new TransformControls(viewCamera, renderer.domElement);
    transform.attach(helperMesh);
    transform.setMode(transformMode);
    transform.addEventListener('dragging-changed', (event) => {
      orbit.enabled = !event.value;
    });
    transformRef.current = transform;
    transform.addEventListener('objectChange', () => {
      const selected = selectedIdRef.current;
      setPrimitives((current) =>
        current.map((primitive) => {
          if (primitive.id !== selected) return primitive;
          return {
            ...primitive,
            position: helperMesh.position.clone(),
            scale: helperMesh.scale.clone(),
          };
        })
      );
    });
    overlayScene.add(transform);

    const applyPrimitiveUniforms = () => {
      const count = Math.min(primitivesRef.current.length, MAX_PRIMITIVES);
      uniforms.uPrimitiveCount.value = count;

      for (let i = 0; i < MAX_PRIMITIVES; i += 1) {
        if (i < count) {
          const primitive = primitivesRef.current[i];
          uniforms.uPrimitivePositionRadius.value[i].set(
            primitive.position.x,
            primitive.position.y,
            primitive.position.z,
            primitive.type === 'sphere' ? primitive.scale.x : 1.0
          );
          uniforms.uPrimitiveScaleType.value[i].set(
            primitive.scale.x,
            primitive.scale.y,
            primitive.scale.z,
            primitiveTypeToFloat(primitive.type)
          );
          uniforms.uPrimitiveOp.value[i] = primitive.op === 'union' ? 1 : 0;
        } else {
          uniforms.uPrimitivePositionRadius.value[i].set(0, 0, 0, 0);
          uniforms.uPrimitiveScaleType.value[i].set(0, 0, 0, 0);
          uniforms.uPrimitiveOp.value[i] = 1;
        }
      }
    };

    const onResize = () => {
      if (!mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      renderer.setSize(clientWidth, clientHeight);
      uniforms.uResolution.value.set(clientWidth, clientHeight);
      viewCamera.aspect = clientWidth / clientHeight;
      viewCamera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      orbit.update();

      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uCameraPos.value.copy(viewCamera.position);
      uniforms.uCameraWorld.value.copy(viewCamera.matrixWorld);
      uniforms.uCameraProjectionInverse.value.copy(viewCamera.projectionMatrixInverse);
      uniforms.uSmoothness.value = smoothnessRef.current;
      applyPrimitiveUniforms();

      renderer.clear();
      renderer.render(raymarchScene, screenCamera);
      renderer.clearDepth();
      renderer.render(overlayScene, viewCamera);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      orbit.dispose();
      transform.dispose();
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!transformRef.current) return;
    transformRef.current.setMode(transformMode);
  }, [transformMode]);

  useEffect(() => {
    if (!helperMeshRef.current || !selectedPrimitive) return;
    helperMeshRef.current.visible = true;
    helperMeshRef.current.position.copy(selectedPrimitive.position);
    helperMeshRef.current.scale.copy(selectedPrimitive.scale);
  }, [selectedPrimitive]);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="absolute inset-0" />

      <aside className="absolute right-4 top-4 z-10 w-80 rounded-xl border border-white/10 bg-slate-900/85 p-4 shadow-2xl backdrop-blur">
        <h1 className="text-lg font-semibold">SDF Liquid Editor</h1>
        <p className="mt-1 text-xs text-slate-300">Raymarched booleans with smooth liquid blending.</p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <button
            onClick={() => setTransformMode('translate')}
            className={`rounded px-2 py-1 ${transformMode === 'translate' ? 'bg-blue-500' : 'bg-slate-700'}`}
          >
            Move
          </button>
          <button
            onClick={() => setTransformMode('scale')}
            className={`rounded px-2 py-1 ${transformMode === 'scale' ? 'bg-blue-500' : 'bg-slate-700'}`}
          >
            Scale
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <select
            value={shapeType}
            onChange={(event) => setShapeType(event.target.value as PrimitiveType)}
            className="rounded bg-slate-800 px-2 py-1 text-sm"
          >
            <option value="sphere">Sphere</option>
            <option value="box">Box</option>
            <option value="cylinder">Cylinder</option>
          </select>
          <select
            value={booleanMode}
            onChange={(event) => setBooleanMode(event.target.value as PrimitiveOp)}
            className="rounded bg-slate-800 px-2 py-1 text-sm"
          >
            <option value="union">Union</option>
            <option value="subtract">Subtract / Hole</option>
          </select>
          <button
            onClick={() => {
              const primitive = createPrimitive(shapeType, booleanMode);
              setPrimitives((current) => [...current, primitive].slice(-MAX_PRIMITIVES));
              setSelectedId(primitive.id);
            }}
            className="col-span-2 rounded bg-emerald-500 px-2 py-1 text-sm font-medium text-slate-950"
          >
            Add Shape
          </button>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-400">Smoothness: {smoothness.toFixed(2)}</label>
          <input
            type="range"
            min={0.05}
            max={0.9}
            step={0.01}
            value={smoothness}
            onChange={(event) => setSmoothness(Number(event.target.value))}
            className="w-full"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-400">Add Text as SDF metaball chain</label>
          <div className="mt-1 flex gap-2">
            <input
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              className="w-full rounded bg-slate-800 px-2 py-1 text-sm"
              maxLength={8}
            />
            <button
              onClick={() => {
                const textPrims = buildTextBlob(textInput || 'TEXT');
                setPrimitives((current) => [...current, ...textPrims].slice(-MAX_PRIMITIVES));
                setSelectedId(textPrims[textPrims.length - 1].id);
              }}
              className="rounded bg-fuchsia-500 px-2 py-1 text-sm font-medium text-slate-950"
            >
              Union Text
            </button>
          </div>
        </div>

        <div className="mt-4 max-h-44 overflow-auto rounded border border-white/10 p-2">
          {primitives.map((primitive) => (
            <button
              key={primitive.id}
              onClick={() => setSelectedId(primitive.id)}
              className={`mb-1 flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs ${selectedId === primitive.id ? 'bg-blue-500/40' : 'bg-slate-800/70'}`}
            >
              <span>{primitive.type} · {primitive.op}</span>
              <span>{primitive.id.slice(0, 6)}</span>
            </button>
          ))}
        </div>

        {selectedPrimitive && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() =>
                updateSelectedPrimitive((primitive) => ({
                  ...primitive,
                  op: primitive.op === 'union' ? 'subtract' : 'union',
                }))
              }
              className="rounded bg-amber-400 px-2 py-1 text-xs font-medium text-slate-950"
            >
              Toggle Union/Subtract
            </button>
            <button
              onClick={() => {
                setPrimitives((current) => current.filter((primitive) => primitive.id !== selectedPrimitive.id));
              }}
              className="rounded bg-rose-500 px-2 py-1 text-xs font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
