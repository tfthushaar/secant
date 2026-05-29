import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f0e8);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const root = document.getElementById('root') ?? document.body;
root.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.5, 0);

// Ground — very faint ink shadow blob only
const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.07, color: 0x111111 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.name = 'ground';
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
ground.receiveShadow = true;
scene.add(ground);

// Lighting — angled like an artist's lamp from upper-right
const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
dirLight.name = 'dirLight';
dirLight.position.set(5, 10, 3);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -6;
dirLight.shadow.camera.right = 6;
dirLight.shadow.camera.top = 6;
dirLight.shadow.camera.bottom = -6;
dirLight.shadow.bias = -0.001;
dirLight.shadow.normalBias = 0.02;
scene.add(dirLight);

// Enough ambient to keep whites white — hatching carries the shadow detail
const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
ambientLight.name = 'ambientLight';
scene.add(ambientLight);

// ---------- SKETCH SHADER ----------
// Converts render to B&W with pencil hatching + ink outline baked in
const SketchShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    time: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float time;
    varying vec2 vUv;

    // Pseudo-random
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // Smooth noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // Hatching line — slightly wobbly for hand-drawn feel
    float hatchLine(vec2 uv, float angleDeg, float spacing, float wobbleAmt) {
      float rad = angleDeg * 3.14159 / 180.0;
      float c = cos(rad), s = sin(rad);
      vec2 screenUV = uv * resolution;
      // Add micro wobble along the line
      float wobble = noise(uv * 120.0) * wobbleAmt;
      float proj = screenUV.x * c - screenUV.y * s + wobble;
      float line = mod(proj, spacing) / spacing;
      float w = 0.032;
      return 1.0 - smoothstep(w - 0.012, w + 0.012, line) * (1.0 - smoothstep(1.0 - w - 0.012, 1.0 - w + 0.012, line));
    }

    // Sobel edge detection on luminance
    float edgeSobel(vec2 uv) {
      vec2 px = 1.0 / resolution;
      float tl = dot(texture2D(tDiffuse, uv + vec2(-px.x,  px.y)).rgb, vec3(0.299,0.587,0.114));
      float t  = dot(texture2D(tDiffuse, uv + vec2(0.0,    px.y)).rgb, vec3(0.299,0.587,0.114));
      float tr = dot(texture2D(tDiffuse, uv + vec2( px.x,  px.y)).rgb, vec3(0.299,0.587,0.114));
      float l  = dot(texture2D(tDiffuse, uv + vec2(-px.x,  0.0 )).rgb, vec3(0.299,0.587,0.114));
      float r  = dot(texture2D(tDiffuse, uv + vec2( px.x,  0.0 )).rgb, vec3(0.299,0.587,0.114));
      float bl = dot(texture2D(tDiffuse, uv + vec2(-px.x, -px.y)).rgb, vec3(0.299,0.587,0.114));
      float b  = dot(texture2D(tDiffuse, uv + vec2(0.0,   -px.y)).rgb, vec3(0.299,0.587,0.114));
      float br = dot(texture2D(tDiffuse, uv + vec2( px.x, -px.y)).rgb, vec3(0.299,0.587,0.114));
      float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
      float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
      return clamp(sqrt(gx*gx + gy*gy) * 4.5, 0.0, 1.0);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

      // --- Hatching layers ---
      // Only hatch where there's actual geometry (non-background)
      // Background is ~0.96 brightness, geometry varies
      float isGeometry = 1.0 - smoothstep(0.88, 0.94, lum);

      float h1 = 0.0, h2 = 0.0, h3 = 0.0, h4 = 0.0;

      // Very dark zones (deep shadow): dense cross-hatch + extra diagonal
      if (lum < 0.40) {
        h1 = hatchLine(vUv, 45.0,  9.0, 2.5);
        h2 = hatchLine(vUv, -45.0, 9.0, 2.0);
        h3 = hatchLine(vUv, 0.0,   9.0, 1.5) * 0.5;
      }
      // Mid shadow: two diagonals
      if (lum < 0.60) {
        h1 = max(h1, hatchLine(vUv, 45.0,  13.0, 2.0));
        h2 = max(h2, hatchLine(vUv, -45.0, 16.0, 1.5) * 0.65);
      }
      // Light shadow: single fine diagonal
      if (lum < 0.78) {
        h3 = max(h3, hatchLine(vUv, 45.0, 20.0, 1.5) * 0.45);
      }

      // Blend hatching — darker base = denser hatch
      float hatchDensity = clamp(h1 + h2 + h3 + h4, 0.0, 1.0);
      hatchDensity *= isGeometry;

      // Ink darkness scales with how dark the original zone was
      float inkDark = mix(0.55, 0.06, clamp((0.78 - lum) / 0.78, 0.0, 1.0));
      float paper = 0.97;

      float finalGrey = mix(paper, inkDark, hatchDensity);

      // Very subtle tonal base so lit areas aren't flat white
      float tonalHint = mix(0.97, 0.91, (1.0 - lum) * isGeometry * 0.3);
      finalGrey = min(finalGrey, tonalHint);

      // --- Ink edge lines (Sobel) ---
      float edge = edgeSobel(vUv);
      // Slightly wobbly edge by offsetting sample
      float edgeWobble = noise(vUv * 300.0) * 0.0012;
      float edge2 = edgeSobel(vUv + edgeWobble);
      float inkEdge = clamp(max(edge, edge2) * 1.6, 0.0, 1.0);
      finalGrey = mix(finalGrey, 0.04, inkEdge);

      // --- Paper grain ---
      float grain = (hash(vUv * 900.0 + time * 0.1) - 0.5) * 0.018;
      finalGrey = clamp(finalGrey + grain, 0.0, 1.0);

      gl_FragColor = vec4(vec3(finalGrey), color.a);
    }
  `
};

// Composer
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Outline pass — bold ink silhouette
const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.name = 'outlinePass';
outlinePass.edgeStrength = 4.5;
outlinePass.edgeGlow = 0.0;
outlinePass.edgeThickness = 1.2;
outlinePass.visibleEdgeColor.set(0x0a0a0a);
outlinePass.hiddenEdgeColor.set(0x222222);
composer.addPass(outlinePass);

// Single combined sketch pass (hatch + sobel edge + grain)
const sketchPass = new ShaderPass(SketchShader);
sketchPass.name = 'sketchPass';
composer.addPass(sketchPass);

// Load model
const modelData = window.UPLOADED_3D_MODELS?.find(m => m.name === 'base.glb');
if (modelData) {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  loader.load(modelData.dataUrl, (gltf) => {
    const model = gltf.scene;
    model.name = 'loadedModel';

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) model.scale.multiplyScalar(2.5 / maxDim);
    box.setFromObject(model);
    box.getCenter(center);
    model.position.sub(center);

    const box2 = new THREE.Box3().setFromObject(model);
    model.position.y -= box2.min.y;

    const meshes = [];
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
        // MeshPhongMaterial gives smoother tonal gradients for the hatch zones
        child.material = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: 0x111111,
          shininess: 8,
          side: THREE.FrontSide
        });
        meshes.push(child);
      }
    });

    outlinePass.selectedObjects = meshes;
    scene.add(model);

    const box3 = new THREE.Box3().setFromObject(model);
    controls.target.copy(box3.getCenter(new THREE.Vector3()));
    controls.update();
  }, undefined, (err) => console.error('Model load error:', err));
}

let t = 0;
function animate() {
  t += 0.016;
  sketchPass.uniforms.time.value = t;
  sketchPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
  controls.update();
  composer.render();
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  sketchPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
});