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
  { pos: [  0,  5.5, 34], look: [ 0, 1.2,  0] }, /* front elevation     */
  { pos: [ -2,  3.5, 18], look: [-1, 0.8,  2] }, /* zoom in — entrance  */
  { pos: [ 20,  7,   24], look: [ 3, 1.2,  0] }, /* three-quarter right */
  { pos: [ 22, 20,   26], look: [ 0, 0.0,  0] }, /* high aerial         */
  { pos: [-22,  6,   24], look: [-4, 1.2,  0] }, /* three-quarter left  */
  { pos: [0.5, 38, 0.5],  look: [ 0,-1.5,  0] }, /* top-down plan       */
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
const TOON_FRAG = /* glsl */`
  uniform vec3 uLight;
  varying vec3 vWorldNormal;
  void main() {
    float d = max(dot(normalize(vWorldNormal), uLight), 0.0);
    vec3 c;
    if      (d > 0.62) c = vec3(1.00);
    else if (d > 0.38) c = vec3(0.90);
    else if (d > 0.12) c = vec3(0.76);
    else               c = vec3(0.58);
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
    c.rgb+=(rand(vUv+uTime*0.05)-0.5)*0.018;
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
      function mkEdges(geo: any, angle = 20, jitter = 0.012) {
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
      function solid(geo: any, mat: any = toonMat, edgeAngle = 15, jitter = 0.012) {
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
      const gnd = solid(new THREE.BoxGeometry(70, 0.08, 46), toonMat, 8, 0.04)
      at(gnd, 0, 0.04, -5)
      bld.add(gnd)

      /* Raised forecourt / entrance platform */
      bld.add(at(box(36, 0.36, 20), 0, 0.22, -1))

      /* ── WALLS — complete building envelope ──────────────────────
         Each section has: front face, back wall, side returns, so the
         building reads as solid 3D volumes, not cardboard facades.     */

      const wallH    = 5.4
      const wallHalf = wallH / 2 + 0.4  /* vertical centre including plinth */

      /* ── LEFT WING (x: -18 to -6) ─────────────────────────────── */
      /* Front wall — vertical siding panels */
      for (let i = 0; i < 30; i++) {
        const p = box(0.22, wallH, 0.18, toonMat, 5)
        at(p, -17.6 + i * 0.4, wallHalf, 5.6)
        bld.add(p)
      }
      /* Back wall */
      bld.add(at(box(12, wallH, 0.35), -12, wallHalf, -6.5))
      /* Left end wall */
      bld.add(at(box(0.35, wallH, 12.3), -18.2, wallHalf, -0.4))
      /* Right return (connects left wing to central mass) */
      bld.add(at(box(0.35, wallH, 12.3), -6.0, wallHalf, -0.4))
      /* Ceiling panel (between siding top and roof) */
      bld.add(at(box(12, 0.22, 12.3), -12, wallH + 0.4 + 0.11, -0.4))

      /* ── CENTRAL MASS (x: -6 to 6) ─────────────────────────────── */
      /* Glass curtain wall — front */
      const gw = new THREE.Group()
      gw.add(new THREE.Mesh(new THREE.PlaneGeometry(10.5, wallH), glassMat))
      gw.add(mkEdges(new THREE.PlaneGeometry(10.5, wallH), 1, 0.006))
      /* Mullions — vertical (5 bays) */
      for (let i = 0; i <= 5; i++) {
        const m = box(0.08, wallH, 0.14, darkMat, 5)
        at(m, -5.25 + i * 2.1, 0, 0.05)
        gw.add(m)
      }
      /* Mullions — horizontal (2 transoms) */
      for (let j = 1; j <= 2; j++) {
        const t = box(10.5, 0.08, 0.14, darkMat, 5)
        at(t, 0, -wallH / 2 + j * (wallH / 3), 0.05)
        gw.add(t)
      }
      gw.position.set(0, wallHalf, 5.65)
      bld.add(gw)
      /* Solid back wall behind glass */
      bld.add(at(box(12, wallH, 0.35), 0, wallHalf, -6.5))
      /* Ceiling */
      bld.add(at(box(12, 0.22, 12.3), 0, wallH + 0.4 + 0.11, -0.4))

      /* ── RIGHT SECTION (x: 6 to 18) ────────────────────────────── */
      /* Front — mixed siding */
      for (let i = 0; i < 30; i++) {
        const p = box(0.22, wallH, 0.18, toonMat, 5)
        at(p, 6.2 + i * 0.4, wallHalf, 5.6)
        bld.add(p)
      }
      /* Back wall */
      bld.add(at(box(12, wallH, 0.35), 12, wallHalf, -6.5))
      /* Right end wall */
      bld.add(at(box(0.35, wallH, 12.3), 18.2, wallHalf, -0.4))
      /* Left return already handled by central mass right edge */
      bld.add(at(box(0.35, wallH, 12.3), 6.0, wallHalf, -0.4))
      /* Ceiling */
      bld.add(at(box(12, 0.22, 12.3), 12, wallH + 0.4 + 0.11, -0.4))

      /* ── MAIN ROOF ─────────────────────────────────────────────── */
      /* Primary slab — wide cantilevered flat roof */
      bld.add(at(box(42, 0.32, 24, toonMat, 8), 0, wallH + 0.56, -1.5))
      /* Thin upper edge trim — gives the sharp crisp roof edge in the sketch */
      bld.add(at(box(42.6, 0.10, 24.6, darkMat, 5), 0, wallH + 0.73, -1.5))
      /* Soffit underside — fine horizontal lines for depth reading */
      const soffitLines = mkEdges(new THREE.PlaneGeometry(41.5, 23.5, 20, 14), 1, 0.005)
      soffitLines.rotation.x = Math.PI / 2
      at(soffitLines, 0, wallH + 0.38, -1.5)
      bld.add(soffitLines)

      /* ── SUPPORT COLUMNS ───────────────────────────────────────── */
      const cols: [number, number][] = [
        [-3.5, 6.5], [3.5, 6.5],               /* central front pair  */
        [-14, 6.5], [-10, 6.5],                 /* left wing front     */
        [10, 6.5], [14, 6.5],                   /* right front         */
        [18, -2], [18, -7],                      /* right side          */
        [-18, -2],                               /* left side           */
      ]
      cols.forEach(([x, z]) => {
        bld.add(at(cyl(0.15, wallH + 0.4, 8, darkMat), x, wallHalf + 0.2, z))
      })

      /* ── PENDANT LIGHTS ────────────────────────────────────────── */
      const pends: [number, number, number][] = [
        [-2.5, 5.1, 2.0], [-0.8, 4.7, 1.2], [0.8, 5.0, 2.8],
        [2.4, 4.6, 1.0], [-0.1, 4.8, 3.5], [1.6, 5.2, 0.4],
      ]
      pends.forEach(([x, y, z]) => {
        const r = 0.60 + Math.random() * 0.40
        bld.add(at(solid(new THREE.CylinderGeometry(r, r, 0.07, 22)), x, y, z))
        const stemH = wallH + 0.4 - y
        bld.add(at(cyl(0.02, stemH, 4, darkMat), x, y + stemH / 2, z))
      })

      /* ── ARCHITECTURAL FORECOURT ────────────────────────────────────
         Entrance steps, low perimeter walls, and a reflecting pool replace
         any organic/sculptural elements — everything reads as architecture. */

      /* Entrance steps — 3 shallow risers leading up to plinth */
      ;[0, 1, 2].forEach(i => {
        const stepW = 10 - i * 1.5
        bld.add(at(box(stepW, 0.18, 1.2), 0, 0.4 + i * 0.18, 6.8 + i * 1.2))
      })

      /* Low perimeter walls — frame the forecourt on left and right */
      bld.add(at(box(0.25, 0.8, 10, toonMat, 10), -13, 0.76, 4.5))
      bld.add(at(box(0.25, 0.8, 10, toonMat, 10),  13, 0.76, 4.5))

      /* Reflecting pool — long shallow rectangular water feature */
      const poolBox = box(16, 0.12, 4, darkMat, 8)
      at(poolBox, 0, 0.40, 10.5)
      bld.add(poolBox)
      /* Pool rim */
      bld.add(at(box(16.5, 0.08, 4.5, toonMat, 8), 0, 0.48, 10.5))

      /* Interior partition wall visible through glass */
      bld.add(at(box(0.25, wallH - 1.5, 7, darkMat, 10), 1.5, wallHalf - 0.3, -2))

      /* Low garden/planting bed frames left and right */
      bld.add(at(box(8, 0.20, 0.20, toonMat, 8), -14, 0.46, 6.0))
      bld.add(at(box(8, 0.20, 0.20, toonMat, 8),  12, 0.46, 6.0))

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
