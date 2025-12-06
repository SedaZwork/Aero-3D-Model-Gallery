import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { Rotation } from '../types';

interface ThreeSceneProps {
  modelUrl: string;
  scale: number;
  rotation: Rotation;
  backgroundColor: string;
  setIsLoading: (isLoading: boolean) => void;
  isArMode: boolean;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
  modelUrl,
  scale,
  rotation,
  backgroundColor,
  setIsLoading,
  isArMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelContainerRef = useRef<THREE.Group>(new THREE.Group());
  const initialScaleRef = useRef<number>(1);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.add(modelContainerRef.current);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler for embeddability
    const resizeObserver = new ResizeObserver(() => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    });
    resizeObserver.observe(currentMount);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
    };
  }, []);

  // Update background color or transparency for AR
  useEffect(() => {
    if (sceneRef.current) {
      if (isArMode) {
        sceneRef.current.background = null;
      } else {
        sceneRef.current.background = new THREE.Color(backgroundColor);
      }
    }
  }, [backgroundColor, isArMode]);

  // Load new model when URL changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const loader = new GLTFLoader();
    setIsLoading(true);

    loader.load(
      modelUrl,
      (gltf) => {
        while (modelContainerRef.current.children.length > 0) {
          modelContainerRef.current.remove(modelContainerRef.current.children[0]);
        }

        const model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitScale = 2.5 / maxDim;
        initialScaleRef.current = fitScale;

        modelContainerRef.current.add(model);
        
        if (controlsRef.current) {
          controlsRef.current.reset();
          controlsRef.current.autoRotate = true;
        }

        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('An error happened during model loading:', error);
        alert('Failed to load model. Please check the console.');
        setIsLoading(false);
      }
    );
  }, [modelUrl, setIsLoading]);

  // Apply transformations (scale and rotation)
  useEffect(() => {
    const finalScale = initialScaleRef.current * scale;
    modelContainerRef.current.scale.set(finalScale, finalScale, finalScale);
    modelContainerRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
  }, [scale, rotation]);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />;
};
