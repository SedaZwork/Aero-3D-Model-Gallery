
import type { Model } from './types';

export const MODELS: Model[] = [
  { 
    name: 'Damaged Helmet', 
    url: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/screenshots/webgl_loader_gltf.jpg',
    description: 'A sci-fi helmet model that shows signs of battle. Notice the detailed textures and material properties that give it a realistic, worn look.'
  },
  { 
    name: 'Sheen Chair', 
    url: 'https://threejs.org/examples/models/gltf/SheenChair.glb',
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/screenshots/webgl_materials_sheen.jpg',
    description: 'A modern chair demonstrating the "sheen" material property, which simulates the soft, scattered reflection of light from microfiber surfaces like velvet.'
  },
  { 
    name: 'Primary Ion Drive', 
    url: 'https://threejs.org/examples/models/gltf/PrimaryIonDrive.glb',
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/screenshots/webgl_loader_gltf_lights.jpg',
    description: 'A detailed ion drive from a spacecraft. This model showcases emissive materials to create the glowing effect of the engine.'
  },
  { 
    name: 'Flight Helmet', 
    url: 'https://threejs.org/examples/models/gltf/FlightHelmet/glTF/FlightHelmet.gltf',
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/screenshots/webgl_loader_gltf_variants.jpg',
    description: 'A classic flight helmet with multiple material variants. This demonstrates how a single GLTF file can contain different appearances for the same model.'
  }
];