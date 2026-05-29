import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f2ee);
scene.fog = new THREE.Fog(0xf5f2ee, 40, 90);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(18, 9, 22);
camera.lookAt(0, 2.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
const root = document.getElementById('root') ?? document.body;
root.appendChild(renderer.domElement);

// --- MATERIALS (strict B&W palette) ---
const mWall   = new THREE.MeshStandardMaterial({ color: 0xfafaf8, roughness: 0.9, metalness: 0.0 });
const mRoof   = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.05 });
const mDark   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.05 });
const mMid    = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.85, metalness: 0.0 });
const mLight  = new THREE.MeshStandardMaterial({ color: 0xdddbd6, roughness: 0.9, metalness: 0.0 });
const mGround = new THREE.MeshStandardMaterial({ color: 0xe8e5e0, roughness: 1.0, metalness: 0.0 });
const mGlass  = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18 });
const mStone  = new THREE.MeshStandardMaterial({ color: 0xc8c5be, roughness: 0.95, metalness: 0.0 });
const mTree   = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1.0, metalness: 0.0 });

// helpers
function mkBox(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true; return m;
}
function mkCyl(rt, rb, h, seg, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.castShadow = true; m.receiveShadow = true; return m;
}
function mkSphere(r, seg, mat) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  m.castShadow = true; m.receiveShadow = true; return m;
}
function mkTorus(R, r, seg, mat) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 16, 60), mat);
  m.castShadow = true; m.receiveShadow = true; return m;
}
function add(obj, x, y, z, name) {
  obj.position.set(x, y, z);
  obj.name = name;
  scene.add(obj);
  return obj;
}

// ── GROUND ──────────────────────────────────────────────────────────────────
const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mGround);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.name = 'ground';
scene.add(ground);

// subtle ground grid lines
for (let i = -20; i <= 20; i++) {
  const hLine = mkBox(40, 0.01, 0.02, mLight);
  hLine.position.set(0, 0.005, i * 1.0);
  hLine.name = `gridH_${i}`;
  scene.add(hLine);
  const vLine = mkBox(0.02, 0.01, 40, mLight);
  vLine.position.set(i * 1.0, 0.005, 0);
  vLine.name = `gridV_${i}`;
  scene.add(vLine);
}

// ── LEFT WING (low pavilion, louvered walls) ─────────────────────────────────
// body
const lWingBody = mkBox(6.5, 2.8, 5.5, mWall);
add(lWingBody, -9.5, 1.4, 0.5, 'lWingBody');

// louvered slats on front face (left wing)
for (let s = 0; s < 9; s++) {
  const slat = mkBox(6.6, 0.08, 0.12, mDark);
  slat.position.set(-9.5, 0.4 + s * 0.28, 0.5 - 2.76);
  slat.name = `lSlat_${s}`;
  scene.add(slat);
}

// left wing roof slab
const lRoof = mkBox(8.0, 0.22, 7.0, mRoof);
add(lRoof, -9.5, 2.9, 0.5, 'lRoof');

// left wing roof overhang edge
const lRoofEdge = mkBox(8.0, 0.06, 0.06, mDark);
lRoofEdge.position.set(-9.5, 3.01, 0.5 - 3.5);
lRoofEdge.name = 'lRoofEdge';
scene.add(lRoofEdge);

// low bench / planter in front of left wing
const bench = mkBox(3.5, 0.22, 0.6, mLight);
add(bench, -9.5, 0.22, -3.8, 'bench');
const benchLeg1 = mkBox(0.15, 0.38, 0.6, mMid);
add(benchLeg1, -11, 0.19, -3.8, 'benchLeg1');
const benchLeg2 = mkBox(0.15, 0.38, 0.6, mMid);
add(benchLeg2, -8, 0.19, -3.8, 'benchLeg2');

// ── MAIN BUILDING ────────────────────────────────────────────────────────────
// rear wall (solid)
const mainRearWall = mkBox(13.5, 5.0, 0.3, mWall);
add(mainRearWall, 0.5, 2.5, 3.8, 'mainRearWall');

// vertical cladding stripes on main facade
for (let i = 0; i < 18; i++) {
  const stripe = mkBox(0.07, 5.0, 0.07, mMid);
  stripe.position.set(-5.9 + i * 0.72, 2.5, -3.45);
  stripe.name = `fStripe_${i}`;
  scene.add(stripe);
}

// side wall (right face of main building, visible from angle)
const mainSideWall = mkBox(0.2, 5.0, 8.0, mLight);
add(mainSideWall, 7.3, 2.5, 0.3, 'mainSideWall');

// glass panels on main facade
const gPanel1 = mkBox(4.0, 4.2, 0.08, mGlass);
add(gPanel1, -3.5, 2.3, -3.38, 'gPanel1');
const gPanel2 = mkBox(4.0, 4.2, 0.08, mGlass);
add(gPanel2, 1.5, 2.3, -3.38, 'gPanel2');

// floor slab
const floorSlab = mkBox(13.5, 0.28, 8.5, mLight);
add(floorSlab, 0.5, 0.14, 0.0, 'floorSlab');

// ── MAIN ROOF SLAB ────────────────────────────────────────────────────────────
const mainRoof = mkBox(15.5, 0.28, 10.5, mRoof);
add(mainRoof, 0.5, 5.1, 0.3, 'mainRoof');

// roof front edge highlight
const mainRoofEdge = mkBox(15.5, 0.08, 0.08, mDark);
mainRoofEdge.position.set(0.5, 5.24, -4.96);
mainRoofEdge.name = 'mainRoofEdge';
scene.add(mainRoofEdge);

// roof side edge
const mainRoofEdgeR = mkBox(0.08, 0.08, 10.5, mDark);
mainRoofEdgeR.position.set(8.26, 5.24, 0.3);
mainRoofEdgeR.name = 'mainRoofEdgeR';
scene.add(mainRoofEdgeR);

// slim support columns under main roof
const colPos = [
  [-5.5, -3.9], [-2.0, -3.9], [1.5, -3.9], [5.0, -3.9],
  [-5.5,  3.6], [5.0,  3.6]
];
colPos.forEach(([cx, cz], i) => {
  const col = mkCyl(0.09, 0.09, 5.1, 8, mDark);
  col.position.set(cx, 2.55, cz);
  col.name = `col_${i}`;
  scene.add(col);
});

// ── RIGHT WING (secondary pavilion) ──────────────────────────────────────────
const rWingBody = mkBox(5.5, 3.5, 5.0, mWall);
add(rWingBody, 10.5, 1.75, 0.5, 'rWingBody');

// vertical stripes on right wing
for (let i = 0; i < 10; i++) {
  const rs = mkBox(0.06, 3.5, 0.06, mMid);
  rs.position.set(8.3 + i * 0.58, 1.75, -2.0 - 0.04);
  rs.name = `rStripe_${i}`;
  scene.add(rs);
}

const rRoof = mkBox(6.5, 0.22, 6.5, mRoof);
add(rRoof, 10.5, 3.62, 0.5, 'rRoof');

// right wing columns
[[8.3, -2.2],[12.7,-2.2],[8.3,3.2],[12.7,3.2]].forEach(([cx,cz],i)=>{
  const rc = mkCyl(0.08,0.08,3.5,8,mDark);
  rc.position.set(cx,1.75,cz);
  rc.name=`rcol_${i}`;
  scene.add(rc);
});

// ── HANGING RING PENDANTS (3 under main canopy) ───────────────────────────────
const pendantPositions = [[-3.5, 4.85, -1.5], [0.5, 4.85, -1.0], [4.0, 4.85, -1.5]];
pendantPositions.forEach((p, i) => {
  // suspension cable
  const cable = mkCyl(0.018, 0.018, 1.2, 6, mDark);
  cable.position.set(p[0], p[1] + 0.0, p[2]);
  cable.name = `pcable_${i}`;
  scene.add(cable);

  // outer ring
  const ringOut = mkTorus(0.62, 0.07, mMid);
  ringOut.rotation.x = Math.PI / 2;
  ringOut.position.set(p[0], p[1] - 0.65, p[2]);
  ringOut.name = `ringOut_${i}`;
  scene.add(ringOut);

  // inner ring
  const ringIn = mkTorus(0.38, 0.04, mLight);
  ringIn.rotation.x = Math.PI / 2;
  ringIn.position.set(p[0], p[1] - 0.65, p[2]);
  ringIn.name = `ringIn_${i}`;
  scene.add(ringIn);

  // tiny spokes
  for (let sp = 0; sp < 4; sp++) {
    const spoke = mkBox(0.9, 0.025, 0.025, mMid);
    spoke.rotation.y = sp * Math.PI / 4;
    spoke.position.set(p[0], p[1] - 0.65, p[2]);
    spoke.name = `spoke_${i}_${sp}`;
    scene.add(spoke);
  }
});

// ── LARGE CIRCULAR WALL SCULPTURE (center facade) ────────────────────────────
const wallRingOuter = mkTorus(1.05, 0.10, mMid);
wallRingOuter.position.set(3.5, 2.6, -3.3);
wallRingOuter.name = 'wallRingOuter';
scene.add(wallRingOuter);

const wallRingInner = mkTorus(0.65, 0.05, mLight);
wallRingInner.position.set(3.5, 2.6, -3.3);
wallRingInner.name = 'wallRingInner';
scene.add(wallRingInner);

// cross detail on wall ring
['h','v'].forEach((dir, i) => {
  const cr = mkBox(dir==='h' ? 2.1 : 0.04, dir==='h' ? 0.04 : 2.1, 0.04, mMid);
  cr.position.set(3.5, 2.6, -3.28);
  cr.name = `wallCross_${i}`;
  scene.add(cr);
});

// ── ORGANIC BOULDER SCULPTURES (left foreground cluster) ─────────────────────
// rounded boulder group
const boulderGroup = [
  { x: -8.5, y: 0.42, z: -4.2, rx: 0.42, ry: 0.45, rz: 0.42 },
  { x: -7.5, y: 0.38, z: -4.4, rx: 0.38, ry: 0.42, rz: 0.38 },
  { x: -6.7, y: 0.32, z: -4.0, rx: 0.35, ry: 0.38, rz: 0.32 },
  { x: -7.1, y: 0.28, z: -4.8, rx: 0.28, ry: 0.32, rz: 0.30 },
  { x: -6.0, y: 0.25, z: -4.5, rx: 0.25, ry: 0.28, rz: 0.25 },
];
boulderGroup.forEach((b, i) => {
  const s = mkSphere(1.0, 12, mStone);
  s.scale.set(b.rx, b.ry * 0.85, b.rz);
  s.position.set(b.x, b.ry * 0.7, b.z);
  s.name = `bgrp_${i}`;
  scene.add(s);
});

// ── TALL TEARDROP / BOTTLE FIGURE (left of main entry) ───────────────────────
// body
const tearBase = mkCyl(0.24, 0.30, 1.8, 18, mDark);
add(tearBase, -4.8, 0.9, -3.9, 'tearBase');
const tearMid  = mkCyl(0.20, 0.24, 0.8, 18, mDark);
add(tearMid,  -4.8, 2.2, -3.9, 'tearMid');
const tearNeck = mkCyl(0.10, 0.20, 0.5, 18, mDark);
add(tearNeck, -4.8, 2.85, -3.9, 'tearNeck');
const tearHead2 = mkSphere(0.30, 18, mDark);
add(tearHead2, -4.8, 3.22, -3.9, 'tearHead2');

// smaller oval sculpture next to it
const ovalSculpt = mkSphere(0.55, 16, mDark);
ovalSculpt.scale.set(0.7, 1.35, 0.7);
add(ovalSculpt, -5.9, 0.8, -3.9, 'ovalSculpt');

// ── FOREGROUND ROCKS / BOULDERS ───────────────────────────────────────────────
const rocks = [
  [2.0,  0.28, -4.8, 0.55, 0.38, 0.50],
  [3.5,  0.22, -4.5, 0.45, 0.30, 0.42],
  [0.5,  0.18, -4.6, 0.38, 0.25, 0.36],
  [5.0,  0.30, -4.2, 0.60, 0.40, 0.55],
  [6.5,  0.20, -3.8, 0.40, 0.28, 0.38],
  [-1.5, 0.20, -4.7, 0.35, 0.26, 0.32],
  [7.8,  0.32, -3.5, 0.52, 0.38, 0.48],
];
rocks.forEach(([x,y,z,sx,sy,sz], i) => {
  const r = mkSphere(1.0, 8, mStone);
  r.scale.set(sx, sy, sz);
  r.position.set(x, sy, z);
  r.name = `rock_${i}`;
  scene.add(r);
});

// ── PALM TREES ────────────────────────────────────────────────────────────────
function makePalm(x, z, h, lean, name) {
  const trunk = mkCyl(0.09, 0.16, h, 7, mDark);
  trunk.position.set(x, h / 2, z);
  trunk.rotation.z = lean;
  trunk.name = name + '_trunk';
  scene.add(trunk);

  // fronds
  const frondCount = 9;
  for (let f = 0; f < frondCount; f++) {
    const angle = (f / frondCount) * Math.PI * 2;
    // main frond stem
    const frond = mkBox(2.2, 0.035, 0.18, mDark);
    const fx = x + Math.cos(angle) * 1.3 + lean * h * 0.5;
    const fz = z + Math.sin(angle) * 1.3;
    frond.position.set(fx, h + 0.1, fz);
    frond.rotation.y = -angle;
    frond.rotation.z = 0.52 + Math.sin(f) * 0.08;
    frond.name = name + `_frond_${f}`;
    scene.add(frond);

    // leaflets along frond
    for (let lf = 0; lf < 5; lf++) {
      const leaflet = mkBox(0.5, 0.02, 0.12, mTree);
      const lratio = 0.3 + lf * 0.15;
      leaflet.position.set(
        x + Math.cos(angle) * (1.3 + lratio * 1.0) + lean * h * 0.5,
        h + 0.1 - lratio * 0.4,
        z + Math.sin(angle) * (1.3 + lratio * 1.0)
      );
      leaflet.rotation.y = -angle;
      leaflet.rotation.z = 0.55 + lratio * 0.3;
      leaflet.name = name + `_lf_${f}_${lf}`;
      scene.add(leaflet);
    }
  }
}

makePalm(-14, -0.5, 10.5, -0.05, 'palm_L1');
makePalm(-11.5, -2.5, 8.5, 0.04, 'palm_L2');
makePalm(13.5, -1.0, 10.0, 0.04, 'palm_R1');
makePalm(16.0, 1.0, 7.5, -0.03, 'palm_R2');

// ── BACKGROUND FOLIAGE TREES ──────────────────────────────────────────────────
const bgTreeData = [
  [-16,6.5,5], [-13,5.5,6], [-10,6.0,6.5], [-7,5.0,7], [-4,5.5,6.8],
  [-1,6.0,7], [2,5.5,7.2], [5,6.5,6.5], [8,5.8,7], [11,6.2,6.8],
  [14,5.5,7.2], [17,6.0,6.5]
];
bgTreeData.forEach(([tx, th, tz], i) => {
  // trunk
  const ttrunk = mkCyl(0.09, 0.13, th, 6, mDark);
  ttrunk.position.set(tx, th / 2, tz);
  ttrunk.name = `bgTrunk_${i}`;
  scene.add(ttrunk);

  // layered crown (2 spheres for fluffy silhouette)
  const cr1 = mkSphere(1.5 + Math.random() * 0.5, 7, mTree);
  cr1.position.set(tx, th + 0.8, tz);
  cr1.name = `bgCrown1_${i}`;
  scene.add(cr1);

  const cr2 = mkSphere(1.1 + Math.random() * 0.4, 6, mDark);
  cr2.position.set(tx + 0.5, th + 1.4, tz - 0.3);
  cr2.name = `bgCrown2_${i}`;
  scene.add(cr2);
});

// ── LIGHTING ──────────────────────────────────────────────────────────────────
// Strong directional key light (sun from upper-left front — matching sketch angle)
const sun = new THREE.DirectionalLight(0xffffff, 3.0);
sun.position.set(-18, 22, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 100;
sun.shadow.camera.left   = -35;
sun.shadow.camera.right  =  35;
sun.shadow.camera.top    =  30;
sun.shadow.camera.bottom = -15;
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.015;
sun.name = 'sun';
scene.add(sun);

// soft white ambient (sketch feel — mostly bright)
const ambient = new THREE.AmbientLight(0xffffff, 1.4);
ambient.name = 'ambient';
scene.add(ambient);

// secondary fill from front-right (softens shadows)
const fill = new THREE.DirectionalLight(0xf0f0f0, 0.7);
fill.position.set(15, 10, 15);
fill.name = 'fill';
scene.add(fill);

// sky bounce
const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d5d0, 0.6);
hemi.name = 'hemi';
scene.add(hemi);

// ── CONTROLS ──────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 8;
controls.maxDistance = 60;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 2.0, -1);
controls.update();

// ── ANIMATION ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();

  // gentle pendant sway
  pendantPositions.forEach((_, i) => {
    const ro = scene.getObjectByName(`ringOut_${i}`);
    const ri = scene.getObjectByName(`ringIn_${i}`);
    const rc = scene.getObjectByName(`pcable_${i}`);
    const sway = Math.sin(t * 0.35 + i * 1.1) * 0.018;
    if (ro) { ro.rotation.z = sway; }
    if (ri) { ri.rotation.z = sway; }
    if (rc) { rc.rotation.z = sway; }
  });

  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});