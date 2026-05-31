'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — Procedural mid-century modern bungalow
  ──────────────────────────────────────────────────
  Pure Three.js primitives. No GLB. No trees.
  Black & white architectural line drawing with toon shading.
  Static vertex jitter baked into edge geometry at build time —
  gives hand-drawn quality without any per-frame flickering.
*/

const LERP = 0.10
const SNAP = 0.001

const CAM_STOPS = [
  { pos: [ -2,  5.5, 30], look: [-2.5, 2.5,  0] }, /* front — shows full asymmetry  */
  { pos: [ -8,  4.0, 16], look: [-6.0, 2.5,  3] }, /* zoom — stair + glass          */
  { pos: [ 14,  7.0, 22], look: [ 0.0, 2.5,  0] }, /* three-quarter right           */
  { pos: [ 10, 20.0, 22], look: [-2.0, 1.0,  0] }, /* high aerial                   */
  { pos: [-18,  7.0, 20], look: [-5.0, 2.5,  0] }, /* three-quarter left — terrace  */
  { pos: [-2, 36.0, 0.5], look: [-2.0,-0.5,  0] }, /* top-down plan                 */
]

/*
  World-space normal lighting — normals transformed via mat3(modelMatrix)
  so the dot product against uLight is always in the same coordinate space.
  This prevents the roof (upward-facing) from appearing dark when the camera
  tilts, which happened when normalMatrix (camera-space) was used instead.
*/
const TOON_VERT = /* glsl */`
  varying vec3 vWorldNormal;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position  = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`
/* Stronger contrast — more dramatic architectural sketch depth */
const TOON_FRAG = /* glsl */`
  uniform vec3 uLight;
  varying vec3 vWorldNormal;
  void main() {
    float d = max(dot(normalize(vWorldNormal), uLight), 0.0);
    vec3 c;
    if      (d > 0.62) c = vec3(1.00);   /* full light: pure white           */
    else if (d > 0.40) c = vec3(0.86);   /* lit face: light gray             */
    else if (d > 0.14) c = vec3(0.66);   /* shadow: noticeably darker        */
    else               c = vec3(0.44);   /* deep shadow: strong under-eaves  */
    gl_FragColor = vec4(c, 1.0);
  }
`
const DARK_FRAG = /* glsl */`
  uniform vec3 uLight;
  varying vec3 vWorldNormal;
  void main() {
    float d = max(dot(normalize(vWorldNormal), uLight), 0.0);
    vec3 c;
    if (d > 0.6) c = vec3(0.20);
    else if (d > 0.3) c = vec3(0.12);
    else c = vec3(0.05);
    gl_FragColor = vec4(c, 1.0);
  }
`
/* Static ink line — no time uniform, no per-frame movement */
const LINE_VERT = /* glsl */`
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const LINE_FRAG = /* glsl */`
  void main() { gl_FragColor = vec4(0.05, 0.04, 0.04, 0.90); }
`
/* Subtle grain only — no UV distortion */
const GRAIN_VERT = /* glsl */`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}`
const GRAIN_FRAG = /* glsl */`
  uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
  float rand(vec2 co){return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453);}
  void main(){
    vec4 c=texture2D(tDiffuse,vUv);
    /* Grain at 0.008 — barely perceptible, won't appear as line flicker */
    c.rgb+=(rand(vUv+uTime*0.04)-0.5)*0.008;
    gl_FragColor=c;
  }
`

interface Props { progressRef: React.MutableRefObject<number> }

export function Scene3D({ progressRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let rafId = 0

    ;(async () => {
      const THREE = await import('three')
      const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js')
      const { RenderPass }     = await import('three/addons/postprocessing/RenderPass.js')
      const { ShaderPass }     = await import('three/addons/postprocessing/ShaderPass.js')

      const W   = mount.clientWidth  || window.innerWidth
      const H   = mount.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 2)

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H); renderer.setPixelRatio(dpr)
      renderer.setClearColor(0xffffff, 1)
      renderer.shadowMap.enabled = false
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xffffff)

      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 500)
      const p0 = CAM_STOPS[0]
      camera.position.set(p0.pos[0], p0.pos[1], p0.pos[2])
      camera.lookAt(p0.look[0], p0.look[1], p0.look[2])

      /* ── Materials ────────────────────────────────────────────── */
      const uLight = new THREE.Vector3(0.5, 1.0, 0.8).normalize()
      const toonMat = new THREE.ShaderMaterial({
        uniforms: { uLight: { value: uLight } },
        vertexShader: TOON_VERT, fragmentShader: TOON_FRAG,
        side: THREE.FrontSide,
      })
      const darkMat = new THREE.ShaderMaterial({
        uniforms: { uLight: { value: uLight } },
        vertexShader: TOON_VERT, fragmentShader: DARK_FRAG,
        side: THREE.FrontSide,
      })
      const glassMat = new THREE.MeshBasicMaterial({
        color: 0xe0dcd8, transparent: true, opacity: 0.45, side: THREE.FrontSide,
      })
      const lineMat = new THREE.ShaderMaterial({
        vertexShader: LINE_VERT, fragmentShader: LINE_FRAG,
        transparent: true,
      })

      /* ── Helpers ──────────────────────────────────────────────── */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function mkEdges(geo: any, angle = 20, jitter = 0.006) {
        const e = new THREE.EdgesGeometry(geo, angle)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pos = e.attributes.position as any
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(i,
            pos.getX(i) + (Math.random() - .5) * jitter,
            pos.getY(i) + (Math.random() - .5) * jitter,
            pos.getZ(i) + (Math.random() - .5) * jitter,
          )
        }
        pos.needsUpdate = true
        return new THREE.LineSegments(e, lineMat)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function solid(geo: any, mat: any = toonMat, edgeAngle = 15, jitter = 0.006) {
        const g = new THREE.Group()
        g.add(new THREE.Mesh(geo, mat))
        g.add(mkEdges(geo, edgeAngle, jitter))
        return g
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function at(obj: any, x: number, y: number, z: number) {
        obj.position.set(x, y, z); return obj
      }
      function box(w: number, h: number, d: number, mat: any = toonMat, a = 15) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return solid(new THREE.BoxGeometry(w, h, d), mat as any, a)
      }
      function cyl(r: number, h: number, seg = 8, mat: any = toonMat) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return solid(new THREE.CylinderGeometry(r, r, h, seg), mat as any)
      }

      /* ── Building ─────────────────────────────────────────────── */
      const bld = new THREE.Group()
      scene.add(bld)
      /* Pull building down so it reads cleanly below the hero wordmark */
      bld.position.y = -1.5

      /* Ground plane — shows forecourt and context */
      /*
        Building concept — inspired by Farnsworth House (Mies) + Villa dall'Ava (OMA):
        · Main glazed box elevated 1.8 units on slender pilotis (columns)
        · Asymmetric: left terrace extends further than right
        · Secondary volume at ground level right-rear, perpendicular, taller
        · Off-center exterior staircase bridging ground to elevated box
        · Two distinct roof planes at different heights
        · Reflecting pool axis aligned with entrance
      */

      /* Ground plane */
      const gnd = solid(new THREE.BoxGeometry(60, 0.08, 42), toonMat, 8, 0.04)
      at(gnd, 0, 0.04, -3)
      bld.add(gnd)

      /* Ground-level base platform (forecourt paving) */
      bld.add(at(box(28, 0.22, 18, toonMat, 10), -1, 0.15, 1))

      /* ── ELEVATED MAIN BOX (raised 1.8 on columns) ────────────────
         16W × 4.8H × 9D, centred slightly left of overall composition */

      const wallH    = 5.4
      /* Elevation of the main box base */
      const EL = 1.8   /* pilotis height */
      const BH = 4.8   /* box interior height */

      /* ── ELEVATED MAIN BOX (x: -10 to 5, el+BH) ──────────────── */
      /* Full-height glass — front face — with mullion grid */
      const gw = new THREE.Group()
      gw.add(new THREE.Mesh(new THREE.PlaneGeometry(15.2, BH), glassMat))
      gw.add(mkEdges(new THREE.PlaneGeometry(15.2, BH), 1, 0.005))
      for (let i = 0; i <= 7; i++)        /* 7 vertical bays */
        gw.add(at(box(0.06, BH, 0.10, darkMat, 5), -7.6 + i * 2.17, 0, 0.04))
      for (let j = 1; j <= 3; j++)        /* 3 horizontal transoms */
        gw.add(at(box(15.2, 0.06, 0.10, darkMat, 5), 0, -BH/2 + j*(BH/4), 0.04))
      gw.position.set(-2.5, EL + BH/2, 4.52)
      bld.add(gw)

      /* ── ENTRANCE DOOR — positioned near the staircase (left side of glass) ──
         The stair lands at x≈-8.5, so the door sits in the first glass bay,
         at x≈-7.5 to -6.4, exactly where someone ascending the stair arrives. */
      const doorW = 1.1, doorH = 2.65
      const doorX = -7.2                 /* aligns with stair landing */
      /* Door panel — dark, solid */
      const doorMesh = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), darkMat)
      doorMesh.position.set(doorX, EL + doorH / 2, 4.56)
      bld.add(doorMesh)
      bld.add(at(mkEdges(new THREE.PlaneGeometry(doorW, doorH), 1, 0.004),
        doorX, EL + doorH / 2, 4.56))
      /* Door frame — crisp dark reveals */
      bld.add(at(box(0.055, doorH + 0.10, 0.12, darkMat, 5),
        doorX - doorW / 2 - 0.028, EL + doorH / 2, 4.57))
      bld.add(at(box(0.055, doorH + 0.10, 0.12, darkMat, 5),
        doorX + doorW / 2 + 0.028, EL + doorH / 2, 4.57))
      bld.add(at(box(doorW + 0.14, 0.055, 0.12, darkMat, 5),
        doorX, EL + doorH + 0.05, 4.57))
      /* Door handle — thin horizontal bar */
      bld.add(at(box(0.32, 0.04, 0.04, darkMat, 5), doorX + 0.42, EL + 1.1, 4.60))
      /* Back wall */
      bld.add(at(box(15.4, BH, 0.28), -2.5, EL + BH/2, -4.5))
      /* End walls */
      bld.add(at(box(0.28, BH, 9.3), -10.2, EL + BH/2, 0.1))
      bld.add(at(box(0.28, BH, 9.3),   5.2, EL + BH/2, 0.1))
      /* Floor plate of elevated box */
      bld.add(at(box(15.6, 0.22, 9.5), -2.5, EL, 0))
      /* Ceiling */
      bld.add(at(box(15.6, 0.22, 9.5), -2.5, EL + BH, 0))

      /* ── LEFT TERRACE (x: -16 to -10, at elevation) ──────────────
         Open deck extending left of the box — asymmetric key feature */
      bld.add(at(box(6.2, 0.22, 9.5), -13.1, EL, 0))
      /* Terrace railing — thin frame */
      bld.add(at(box(0.10, 0.9, 9.5), -16.1, EL + 0.65, 0))
      bld.add(at(box(6.2, 0.10, 0.10), -13.1, EL + 0.9, 4.72))
      bld.add(at(box(6.2, 0.10, 0.10), -13.1, EL + 0.9, -4.72))

      /* ── RIGHT SECONDARY VOLUME (x: 6 to 12, ground level) ────────
         Taller mass, perpendicular orientation, horizontal window slits.
         Creates asymmetric silhouette — inspired by Villa dall'Ava.    */
      const sh = 6.4   /* secondary height — taller than main box */
      bld.add(at(box(6.2, sh, 0.28),  9.0, sh/2, 4.52))   /* front wall */
      bld.add(at(box(6.2, sh, 0.28),  9.0, sh/2, -8.5))   /* back wall  */
      bld.add(at(box(0.28, sh, 13.3), 5.8, sh/2, -2.0))   /* left wall  */
      bld.add(at(box(0.28, sh, 13.3), 12.2, sh/2, -2.0))  /* right wall */
      /* Horizontal window slits — 3 openings across the front */
      const hSlits = [-1.8, 0.6, 3.0]
      hSlits.forEach(slitY => {
        bld.add(at(new THREE.Mesh(
          new THREE.PlaneGeometry(4.5, 0.9), glassMat,
        ), 9.0, slitY, 4.56))
        bld.add(mkEdges(new THREE.PlaneGeometry(4.5, 0.9), 1, 0.004))
      })
      /* Secondary roof — extends beyond walls, toonMat only */
      bld.add(at(box(7.2, 0.24, 14.5, toonMat, 8), 9.0, sh + 0.15, -2.0))
      /* Fascia beam around secondary roof */
      ;([
        [9.0, sh - 0.12,  5.15, 7.2, 0.42, 0.28],
        [9.0, sh - 0.12, -9.25, 7.2, 0.42, 0.28],
        [5.4, sh - 0.12, -2.0, 0.28, 0.42, 14.5],
        [12.6, sh - 0.12, -2.0, 0.28, 0.42, 14.5],
      ] as [number,number,number,number,number,number][]).forEach(([x,y,z,w,h,d]) => {
        bld.add(at(box(w, h, d, toonMat, 8), x, y, z))
      })

      /* ── MAIN ROOF (asymmetric — extends 4 extra units LEFT) ────────
         toonMat throughout — NO darkMat → roof stays white            */
      /* Left extension: x -19 to -10  Right: x -10 to 8 */
      bld.add(at(box(28, 0.26, 13, toonMat, 8), -5.5, EL + BH + 0.44, 0))
      /* Asymmetric fascia — different left vs right projection */
      bld.add(at(box(0.32, 0.60, 13.6, toonMat, 8), -19.2, EL+BH+0.12, 0))
      bld.add(at(box(0.32, 0.60, 13.6, toonMat, 8),   8.2, EL+BH+0.12, 0))
      bld.add(at(box(28.6, 0.60, 0.32, toonMat, 8), -5.5, EL+BH+0.12,  6.7))
      bld.add(at(box(28.6, 0.60, 0.32, toonMat, 8), -5.5, EL+BH+0.12, -6.7))
      /*
        Soffit hatching — explicit continuous line segments, NOT EdgesGeometry.
        EdgesGeometry on PlaneGeometry creates many tiny segments that appear
        dotted at shallow camera angles. Explicit BufferGeometry lines are
        always solid and continuous regardless of viewing angle.
      */
      const soffitY = EL + BH + 0.30
      for (let si = 0; si < 9; si++) {
        const sz = -6.0 + si * 1.55
        const sGeo = new THREE.BufferGeometry()
        sGeo.setAttribute('position', new THREE.BufferAttribute(
          new Float32Array([-19.0, soffitY, sz,  8.0, soffitY, sz]), 3
        ))
        bld.add(new THREE.LineSegments(sGeo, lineMat))
      }
      /* Rooftop element — thin skylight strip (dark glass) */
      bld.add(at(box(5, 0.08, 1.5, darkMat, 8), 0, EL + BH + 0.68, -2))

      /* ── PILOTIS — slender columns supporting elevated box ──────── */
      const pilotis: [number, number][] = [
        [-10, 4.5], [-6, 4.5], [-2.5, 4.5], [1, 4.5], /* front row */
        [-10, -4.5], [-6, -4.5], [-2.5, -4.5], [1, -4.5], /* back row */
        [5, 4.5], [5, -4.5],                             /* right end */
      ]
      pilotis.forEach(([x, z]) => {
        bld.add(at(cyl(0.10, EL, 8, darkMat), x, EL/2, z))
      })
      /* Additional columns for left terrace */
      ;[[-13, 4.5], [-16, 4.5], [-13, -4.5], [-16, -4.5]].forEach(([x,z]) => {
        bld.add(at(cyl(0.10, EL, 8, darkMat), x, EL/2, z))
      })

      /* ── EXTERIOR STAIRCASE ─────────────────────────────────────────
         Steps descend AWAY from the building: lowest step at furthest z,
         highest step adjacent to the elevated box floor (z=4.5).
         Each step: tread height rises as z decreases (toward building).  */
      for (let i = 0; i < 6; i++) {
        const stairZ = 9.8 - i * 1.0        /* far (ground) → near (building) */
        const stairY = 0.22 + i * (EL - 0.22) / 5  /* low → high as we approach */
        bld.add(at(box(4.5, 0.26, 1.0), -8.5, stairY, stairZ))
      }
      /* Stair side wall */
      bld.add(at(box(0.14, EL + 0.5, 6.5, darkMat, 10), -10.8, EL/2 + 0.1, 7.0))

      /* ── PENDANT LIGHTS inside elevated box ─────────────────────── */
      const pends: [number, number, number][] = [
        [-7, EL + 3.8, 1.5], [-4, EL + 3.5, 0.5], [-1, EL + 3.7, 2.0],
        [ 2, EL + 3.4, 0.8], [-5.5, EL + 3.6, -1.5],
      ]
      pends.forEach(([x, y, z]) => {
        const r = 0.55 + Math.random() * 0.30
        bld.add(at(solid(new THREE.CylinderGeometry(r, r, 0.07, 22)), x, y, z))
        const stemH = EL + BH - y
        bld.add(at(cyl(0.015, stemH, 4, darkMat), x, y + stemH/2, z))
      })

      /* ── ADDITIONAL ARCHITECTURAL DETAIL ─────────────────────────── */

      /* Horizontal louvres / sun shading fins on the secondary volume front */
      for (let li = 0; li < 8; li++) {
        bld.add(at(box(6.5, 0.06, 0.55, toonMat, 8), 9.0, 0.5 + li * 0.72, 5.1))
      }

      /* Structural beams visible under the main elevated box (front edge) */
      for (let bi = 0; bi < 4; bi++) {
        bld.add(at(box(0.18, 0.30, 9.3, darkMat, 8), -10 + bi * 5, EL - 0.05, 0))
      }

      /* Window sill ledges on secondary volume */
      hSlits.forEach(slitY => {
        bld.add(at(box(4.7, 0.08, 0.22, toonMat, 8), 9.0, slitY - 0.45, 4.9))
      })

      /* Roof terrace element on secondary volume — low parapet */
      bld.add(at(box(6.4, 0.35, 0.18, toonMat, 8), 9.0, sh + 0.40, 5.1))
      bld.add(at(box(6.4, 0.35, 0.18, toonMat, 8), 9.0, sh + 0.40, -8.7))
      bld.add(at(box(0.18, 0.35, 14.0, toonMat, 8), 5.8, sh + 0.40, -1.9))
      bld.add(at(box(0.18, 0.35, 14.0, toonMat, 8), 12.2, sh + 0.40, -1.9))

      /* Canopy over entrance — thin projecting slab above stair top */
      bld.add(at(box(5.5, 0.14, 2.5, toonMat, 8), -8.5, EL + BH * 0.55, 5.8))

      /* ── FORECOURT ───────────────────────────────────────────────── */
      /* Entrance axis: reflecting pool aligned with staircase */
      bld.add(at(box(4.5, 0.08, 3.0, darkMat, 8), -8.5, 0.12, 9.8))
      bld.add(at(box(5.0, 0.06, 3.5, toonMat, 8), -8.5, 0.16, 9.8))
      /* Low perimeter walls */
      bld.add(at(box(0.18, 0.65, 10, toonMat, 10), -17, 0.55, 5.5))
      bld.add(at(box(0.18, 0.65, 10, toonMat, 10),  13, 0.55, 5.5))
      /* Planting beds */
      bld.add(at(box(5, 0.16, 0.18, toonMat, 8), -14, 0.42, 6.5))
      bld.add(at(box(5, 0.16, 0.18, toonMat, 8),  10, 0.42, 6.5))

      /* ── SCULPTURES & SITE ELEMENTS ─────────────────────────────────
         Minimal, architectural — nothing organic. All geometric.        */

      /* Monolith 1 — tall dark vertical slab, left of entrance stair */
      bld.add(at(solid(new THREE.BoxGeometry(0.28, 3.8, 0.75), darkMat, 10, 0.006),
        -12.5, 1.9, 6.8))

      /* Monolith 2 — shorter, near reflecting pool, right side */
      bld.add(at(solid(new THREE.BoxGeometry(0.24, 2.4, 0.60), darkMat, 10, 0.006),
        11.0, 1.2, 9.0))

      /* Horizontal disk sculpture on pedestal — near secondary volume */
      bld.add(at(solid(new THREE.CylinderGeometry(1.2, 1.2, 0.10, 28), toonMat, 20, 0.005),
        10.5, 2.1, 7.0))
      /* Pedestal */
      bld.add(at(solid(new THREE.BoxGeometry(0.35, 1.9, 0.35), darkMat, 8, 0.006),
        10.5, 0.95, 7.0))

      /* Rectangular planters — left side forecourt, clean grid-lined tops */
      ;[[-14.5, 7.2], [-11.5, 7.2], [-9.0, 7.2]].forEach(([px, pz]) => {
        bld.add(at(box(2.0, 0.55, 0.75, toonMat, 15), px, 0.50, pz))
        /* Grid lines on planter top = stylised vegetation */
        const pg = new THREE.BufferGeometry()
        pg.setAttribute('position', new THREE.BufferAttribute(
          new Float32Array([px-0.9, 0.78, pz-0.35,  px+0.9, 0.78, pz-0.35,
                            px-0.9, 0.78, pz,       px+0.9, 0.78, pz,
                            px-0.9, 0.78, pz+0.35,  px+0.9, 0.78, pz+0.35]), 3
        ))
        bld.add(new THREE.LineSegments(pg, lineMat))
      })

      /* Thin vertical fins flanking the stair (like entry markers) */
      bld.add(at(box(0.10, 2.2, 0.10, darkMat, 8), -11.2, 1.1, 5.2))
      bld.add(at(box(0.10, 1.6, 0.10, darkMat, 8), -11.2, 0.8, 6.5))

      /* ── Post-processing — subtle grain only ─────────────────────── */
      const composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      const grainPass = new ShaderPass({
        uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
        vertexShader: GRAIN_VERT, fragmentShader: GRAIN_FRAG,
      })
      composer.addPass(grainPass)

      /* ── Camera lerp + snap ──────────────────────────────────────── */
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      const cam = {
        x: p0.pos[0], y: p0.pos[1], z: p0.pos[2],
        lx: p0.look[0], ly: p0.look[1], lz: p0.look[2],
      }
      function snap(cur: number, tgt: number) {
        const d = tgt - cur; return Math.abs(d) < SNAP ? tgt : cur + d * LERP
      }

      const clock = new THREE.Clock()

      function animate() {
        rafId = requestAnimationFrame(animate)
        grainPass.uniforms['uTime'].value = clock.getElapsedTime() * 0.08

        const p  = Math.round(Math.max(0, Math.min(1, progressRef.current)) * 1000) / 1000
        const N  = CAM_STOPS.length
        const fp = p * (N - 1)
        const i0 = Math.floor(fp), i1 = Math.min(i0 + 1, N - 1)
        const tt = fp - i0
        const e  = tt < 0.5 ? 2*tt*tt : 1-2*(1-tt)*(1-tt)
        const a  = CAM_STOPS[i0], b = CAM_STOPS[i1]

        cam.x  = lerp(a.pos[0],  b.pos[0],  e)
        cam.y  = lerp(a.pos[1],  b.pos[1],  e)
        cam.z  = lerp(a.pos[2],  b.pos[2],  e)
        cam.lx = lerp(a.look[0], b.look[0], e)
        cam.ly = lerp(a.look[1], b.look[1], e)
        cam.lz = lerp(a.look[2], b.look[2], e)

        camera.position.x = snap(camera.position.x, cam.x)
        camera.position.y = snap(camera.position.y, cam.y)
        camera.position.z = snap(camera.position.z, cam.z)
        camera.lookAt(cam.lx, cam.ly, cam.lz)

        composer.render()
      }
      animate()

      function onResize() {
        const nW = mount!.clientWidth, nH = mount!.clientHeight
        const nDPR = Math.min(window.devicePixelRatio, 2)
        camera.aspect = nW / nH; camera.updateProjectionMatrix()
        renderer.setSize(nW, nH); renderer.setPixelRatio(nDPR)
        composer.setSize(nW * nDPR, nH * nDPR)
      }
      window.addEventListener('resize', onResize)

      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', onResize)
        toonMat.dispose(); darkMat.dispose(); glassMat.dispose()
        lineMat.dispose(); renderer.dispose()
        if (mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [progressRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />
}
