'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — Procedural architectural sketch model
  ─────────────────────────────────────────────────
  Entire building built from Three.js primitives.
  No GLB file. No organic noise. Full artistic control.

  Rendering:
    • Custom toon ShaderMaterial — warm cream 4-step palette
    • EdgesGeometry + ShaderMaterial lines with animated vertex jitter
      (shader-driven sine-wave displacement per frame → living sketch feel)
    • EffectComposer: subtle paper grain post-process
    • Background: warm paper cream #f5f2ed

  Camera: 6 scroll-driven viewpoints, progressRef-driven, snap-to-rest.
*/

const LERP = 0.10
const SNAP = 0.001

const CAM_STOPS = [
  { pos: [  0,  6, 38], look: [ 0, 3.0,  0] }, /* front elevation       */
  { pos: [ -3,  4, 18], look: [-2, 2.5,  3] }, /* zoom in — entrance    */
  { pos: [ 20,  8, 22], look: [ 3, 3.0,  0] }, /* three-quarter right   */
  { pos: [ 24, 20, 24], look: [ 0, 2.0,  0] }, /* high aerial           */
  { pos: [-22,  7, 20], look: [-4, 3.0,  0] }, /* three-quarter left    */
  { pos: [0.5, 40, 0.5], look: [0, 0.0,  0] }, /* top-down plan         */
]

/* Warm cream toon shader — 4 steps matching paper sketch palette */
const TOON_VERT = /* glsl */`
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const TOON_FRAG = /* glsl */`
  uniform vec3 uLight;
  varying vec3 vNormal;
  void main() {
    float d = max(dot(normalize(vNormal), uLight), 0.0);
    vec3 c;
    if      (d > 0.65) c = vec3(0.980, 0.965, 0.945);
    else if (d > 0.35) c = vec3(0.905, 0.888, 0.865);
    else if (d > 0.10) c = vec3(0.795, 0.775, 0.752);
    else               c = vec3(0.620, 0.600, 0.578);
    gl_FragColor = vec4(c, 1.0);
  }
`

/* Animated ink line shader — subtle sine-wave jitter per vertex */
const LINE_VERT = /* glsl */`
  uniform float uTime;
  void main() {
    vec3 pos = position;
    float j = 0.007;
    pos.x += sin(pos.y * 11.0 + uTime * 0.28) * j;
    pos.y += sin(pos.x * 11.0 + uTime * 0.35) * j;
    pos.z += sin(pos.z * 11.0 + uTime * 0.22) * j;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`
const LINE_FRAG = /* glsl */`
  void main() { gl_FragColor = vec4(0.07, 0.06, 0.05, 0.88); }
`

/* Paper grain post-process */
const GRAIN_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`
const GRAIN_FRAG = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform float uTime;
  varying vec2 vUv;
  float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }
  void main() {
    vec4 col = texture2D(tDiffuse, vUv);
    col.rgb += (rand(vUv + uTime * 0.07) - 0.5) * 0.028;
    gl_FragColor = col;
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

      /* ── Renderer ─────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H); renderer.setPixelRatio(dpr)
      renderer.setClearColor(0xf5f2ed, 1)
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf5f2ed)

      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 500)
      const p0 = CAM_STOPS[0]
      camera.position.set(...(p0.pos as [number,number,number]))
      camera.lookAt(...(p0.look as [number,number,number]))

      /* ── Shared materials ─────────────────────────────────────── */
      const toonMat = new THREE.ShaderMaterial({
        uniforms: { uLight: { value: new THREE.Vector3(0.5, 1.0, 0.8).normalize() } },
        vertexShader: TOON_VERT, fragmentShader: TOON_FRAG,
        side: THREE.FrontSide,
      })
      const darkMat = new THREE.ShaderMaterial({
        uniforms: { uLight: { value: new THREE.Vector3(0.5, 1.0, 0.8).normalize() } },
        vertexShader: TOON_VERT,
        fragmentShader: /* glsl */`
          uniform vec3 uLight; varying vec3 vNormal;
          void main() {
            float d = max(dot(normalize(vNormal), uLight), 0.0);
            vec3 c;
            if (d > 0.6) c = vec3(0.22,0.20,0.18);
            else if (d > 0.3) c = vec3(0.14,0.13,0.12);
            else c = vec3(0.06,0.05,0.04);
            gl_FragColor = vec4(c, 1.0);
          }
        `,
        side: THREE.FrontSide,
      })
      const glassMat = new THREE.MeshBasicMaterial({ color: 0xddd8d0, transparent: true, opacity: 0.55 })

      const lineUniforms = { uTime: { value: 0 } }
      const lineMat = new THREE.ShaderMaterial({
        uniforms: lineUniforms,
        vertexShader: LINE_VERT, fragmentShader: LINE_FRAG,
        transparent: true,
      })

      /* ── Helpers ─────────────────────────────────────────────── */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function mkEdges(geo: any, angle = 20, jitter = 0.018) {
        const e = new THREE.EdgesGeometry(geo, angle)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pos = e.attributes.position as any
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(i,
            pos.getX(i) + (Math.random()-.5) * jitter,
            pos.getY(i) + (Math.random()-.5) * jitter,
            pos.getZ(i) + (Math.random()-.5) * jitter,
          )
        }
        pos.needsUpdate = true
        return new THREE.LineSegments(e, lineMat)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function outlined(geo: any, mat: any = toonMat, angle = 20, j = 0.018) {
        const g = new THREE.Group()
        g.add(new THREE.Mesh(geo, mat))
        g.add(mkEdges(geo, angle, j))
        return g
      }

      function box(w: number, h: number, d: number, mat: any = toonMat, angle = 20) {
        return outlined(new THREE.BoxGeometry(w, h, d), mat, angle)
      }
      function cyl(r: number, h: number, seg = 8, mat: any = toonMat) {
        return outlined(new THREE.CylinderGeometry(r, r, h, seg), mat)
      }

      function place(obj: any, x: number, y: number, z: number) {
        obj.position.set(x, y, z); return obj
      }

      /* ── Building group ───────────────────────────────────────── */
      const bld = new THREE.Group()
      scene.add(bld)

      /* Ground plane */
      bld.add(place(box(60, 0.1, 40, toonMat, 5), 0, -0.05, -5))

      /* Plinth */
      bld.add(place(box(38, 0.45, 22, toonMat, 10), 0, 0.22, -1))

      /* ── Main Central Mass ──────────────────────────────────────
         Glass curtain wall (center) + solid siding walls (left/right)       */
      const centralBack = box(14, 5.5, 0.4)
      place(centralBack, 0, 3.2, -5.8)
      bld.add(centralBack)

      /* Glass curtain wall — front face */
      const glassWall = new THREE.Group()
      glassWall.add(new THREE.Mesh(new THREE.PlaneGeometry(9, 5), glassMat))
      glassWall.add(mkEdges(new THREE.PlaneGeometry(9, 5), 1, 0.01))
      /* Vertical mullions */
      for (let i = 0; i <= 5; i++) {
        const m = box(0.07, 5, 0.12, darkMat, 5)
        place(m, -4.5 + i * 1.8, 3.0, 5.02)
        glassWall.add(m)
      }
      /* Horizontal transom */
      const transom = box(9, 0.07, 0.12, darkMat, 5)
      place(transom, 0, 4.5, 5.02)
      glassWall.add(transom)
      glassWall.position.set(0, 3.0, 5.0)
      bld.add(glassWall)

      /* Vertical siding — LEFT of glass (x: -7 to -4.5) */
      for (let i = 0; i < 10; i++) {
        const p = box(0.18, 5.5, 0.16, toonMat, 5)
        place(p, -7 + i * 0.25, 3.0, 5.01)
        bld.add(p)
      }
      /* Vertical siding — RIGHT of glass (x: 4.5 to 7) */
      for (let i = 0; i < 10; i++) {
        const p = box(0.18, 5.5, 0.16, toonMat, 5)
        place(p, 4.5 + i * 0.25, 3.0, 5.01)
        bld.add(p)
      }

      /* ── Left Wing ──────────────────────────────────────────────
         Lower volume, full vertical siding on front face              */
      const leftBack = box(12, 4.5, 0.4)
      place(leftBack, -13, 2.7, -5.8)
      bld.add(leftBack)
      const leftSide = box(0.4, 4.5, 12)
      place(leftSide, -19, 2.7, -0.2)
      bld.add(leftSide)
      /* Left wing siding — 36 panels */
      for (let i = 0; i < 36; i++) {
        const p = box(0.2, 4.5, 0.18, toonMat, 5)
        place(p, -19 + i * 0.33, 2.7, 5.01)
        bld.add(p)
      }

      /* ── Right Covered Area ─────────────────────────────────────
         Open pavilion, columns visible                                */
      const rightBack = box(9, 4.5, 0.4)
      place(rightBack, 12.5, 2.7, -5.8)
      bld.add(rightBack)
      const rightSide = box(0.4, 4.5, 12)
      place(rightSide, 17, 2.7, -0.2)
      bld.add(rightSide)
      /* Right siding */
      for (let i = 0; i < 22; i++) {
        const p = box(0.2, 4.5, 0.18, toonMat, 5)
        place(p, 8 + i * 0.42, 2.7, 5.01)
        bld.add(p)
      }

      /* ── Main Roof — wide flat cantilever ───────────────────── */
      const mainRoof = box(44, 0.28, 25, toonMat, 8)
      place(mainRoof, 0, 5.92, -2)
      bld.add(mainRoof)
      /* Thin top edge trim */
      const roofTrim = box(44.5, 0.09, 25.5, darkMat, 5)
      place(roofTrim, 0, 6.07, -2)
      bld.add(roofTrim)
      /* Soffit lines — horizontal hatching under the roof */
      for (let i = 0; i < 18; i++) {
        const sl = new THREE.Group()
        sl.add(new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(44, 25, 1, 1)),
          lineMat
        ))
        sl.position.set(0, 5.75 - i * 0.005, -2)
        sl.rotation.x = Math.PI / 2
        if (i < 1) bld.add(sl)
      }
      /* Secondary lower overhang right */
      const overhang = box(12, 0.18, 13, toonMat, 8)
      place(overhang, 11, 4.85, 1)
      bld.add(overhang)

      /* ── Support Columns ────────────────────────────────────── */
      const colPositions: [number,number,number][] = [
        [-3, 2.25, 6.5], [3, 2.25, 6.5],          /* central front */
        [-16, 2.25, 5.5], [-12, 2.25, 5.5],        /* left wing     */
        [9, 2.25, 5.5], [13, 2.25, 5.5],           /* right         */
        [17, 2.25, 0], [17, 2.25, -4],             /* right side    */
      ]
      colPositions.forEach(([x,y,z]) => {
        bld.add(place(cyl(0.14, 4.5, 8, darkMat), x, y, z))
      })

      /* ── Pendant Lights ─────────────────────────────────────── */
      const pendPos: [number,number,number][] = [
        [-2.5, 5.0, 2], [-1.0, 4.6, 1.5], [0.5, 4.8, 2.5],
        [2.0, 4.5, 1], [-0.2, 4.9, 3.5],
      ]
      pendPos.forEach(([x,y,z]) => {
        const r = 0.65 + Math.random() * 0.35
        const disk = cyl(r, 0.07, 20, toonMat)
        place(disk, x, y, z)
        bld.add(disk)
        const stemH = 5.75 - y
        const stem = cyl(0.022, stemH, 4, darkMat)
        place(stem, x, y + stemH/2, z)
        bld.add(stem)
      })

      /* ── Sculptures ─────────────────────────────────────────── */
      /* Torus ring */
      const ring = outlined(new THREE.TorusGeometry(1.0, 0.26, 16, 40), toonMat, 12)
      ring.rotation.x = Math.PI / 2
      place(ring, 0.5, 2.0, 3.5)
      bld.add(ring)

      /* Dark vase / organic drop shape */
      const vasePoints = [
        new THREE.Vector2(0, 0), new THREE.Vector2(0.45, 0.3),
        new THREE.Vector2(0.65, 0.9), new THREE.Vector2(0.55, 1.8),
        new THREE.Vector2(0.28, 2.6), new THREE.Vector2(0.08, 3.2),
      ]
      const vaseGeo = new THREE.LatheGeometry(vasePoints, 12)
      const vase = outlined(vaseGeo, darkMat, 25, 0.015)
      place(vase, -5, 0.45, 4)
      bld.add(vase)

      /* Oval standing stones — cluster of 5 on left */
      for (let i = 0; i < 5; i++) {
        const h = 1.6 + Math.random() * 0.8
        const r = 0.5 + Math.random() * 0.2
        const stone = outlined(new THREE.SphereGeometry(r, 10, 8), toonMat, 20, 0.012)
        stone.scale.set(0.7, h, 0.65)
        place(stone, -11 + i * 1.4, 0.45 + h * r, 5)
        bld.add(stone)
      }

      /* ── Palm Trees ─────────────────────────────────────────── */
      function makePalm(x: number, z: number, scale = 1.0) {
        const g = new THREE.Group()
        const h = 14, segs = 9
        for (let i = 0; i < segs; i++) {
          const r = Math.max(0.06, 0.28 - i * 0.022)
          const seg = cyl(r - 0.015, h / segs, 7, toonMat)
          seg.position.y = i * (h / segs) + h / segs / 2
          seg.rotation.z = Math.sin(i * 0.3) * 0.04
          g.add(seg)
        }
        /* Fronds */
        for (let f = 0; f < 10; f++) {
          const frondGeo = new THREE.PlaneGeometry(7, 1.8, 6, 2)
          const frond = new THREE.Mesh(frondGeo, toonMat)
          const fLines = mkEdges(frondGeo, 2, 0.008)
          frond.add(fLines)
          frond.position.y = h
          const pivot = new THREE.Group()
          pivot.position.y = h
          pivot.rotation.y = (Math.PI * 2 / 10) * f + 0.15
          frond.position.set(3.5, 0, 0)
          frond.rotation.x = -Math.PI / 5 + (Math.random() * 0.3 - 0.15)
          frond.rotation.z = -Math.PI / 12
          pivot.add(frond)
          g.add(pivot)
        }
        g.position.set(x, 0, z)
        g.scale.setScalar(scale)
        return g
      }
      bld.add(makePalm(-22, 6, 1.1))
      bld.add(makePalm( 22, 4, 1.25))
      bld.add(makePalm( 28, -10, 1.0))

      /* ── Background Trees ───────────────────────────────────── */
      function makeTree(x: number, z: number, scale = 1.0) {
        const g = new THREE.Group()
        /* Trunk */
        const trunk = cyl(0.25, 6, 6, toonMat)
        trunk.position.y = 3
        g.add(trunk)
        /* Canopy layers — overlapping spheres at different heights */
        const canopyPositions: [number,number,number,number][] = [
          [0, 9, 0, 4.5], [-2, 8, 1, 3.5], [2, 8.5, -1, 3.8],
          [-1, 10.5, -1, 3.0], [1.5, 9.8, 1.5, 3.2],
        ]
        canopyPositions.forEach(([cx, cy, cz, cr]) => {
          const cg = outlined(new THREE.SphereGeometry(cr, 8, 6), toonMat, 3, 0.025)
          place(cg, cx, cy, cz)
          g.add(cg)
        })
        g.position.set(x, 0, z)
        g.scale.setScalar(scale)
        return g
      }
      bld.add(makeTree(-28, -10, 1.3))
      bld.add(makeTree(-18, -12, 1.1))
      bld.add(makeTree( -8, -13, 1.2))
      bld.add(makeTree(  5, -14, 1.0))
      bld.add(makeTree( 18, -12, 1.15))
      bld.add(makeTree( 28, -9, 1.05))

      /* ── Foreground Boulders ─────────────────────────────────── */
      const boulderData: [number,number,number,number,number,number][] = [
        [3, 0.8, 7.5,  1.6, 0.9, 1.2],
        [-3, 0.6, 8.0, 1.2, 0.8, 1.0],
        [8, 0.5, 7.0,  1.0, 0.7, 0.9],
      ]
      boulderData.forEach(([x,y,z,sx,sy,sz]) => {
        const b = outlined(new THREE.SphereGeometry(1, 10, 8), toonMat, 20, 0.015)
        b.scale.set(sx, sy, sz)
        place(b, x, y, z)
        bld.add(b)
      })

      /* ── EffectComposer — paper grain ────────────────────────── */
      const composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      const grainPass = new ShaderPass({
        uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
        vertexShader: GRAIN_VERT, fragmentShader: GRAIN_FRAG,
      })
      composer.addPass(grainPass)

      /* ── Camera lerp + snap ──────────────────────────────────── */
      const lerp = (a: number, b: number, t: number) => a + (b-a)*t
      const cam = {
        x: p0.pos[0], y: p0.pos[1], z: p0.pos[2],
        lx: p0.look[0], ly: p0.look[1], lz: p0.look[2],
      }
      function moveAxis(cur: number, tgt: number) {
        const d = tgt - cur
        return Math.abs(d) < SNAP ? tgt : cur + d * LERP
      }

      const clock = new THREE.Clock()

      function animate() {
        rafId = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()
        lineUniforms.uTime.value = t
        grainPass.uniforms['uTime'].value = t * 0.12

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

        camera.position.x = moveAxis(camera.position.x, cam.x)
        camera.position.y = moveAxis(camera.position.y, cam.y)
        camera.position.z = moveAxis(camera.position.z, cam.z)
        camera.lookAt(cam.lx, cam.ly, cam.lz)

        composer.render()
      }
      animate()

      function onResize() {
        const nW = mount!.clientWidth, nH = mount!.clientHeight
        const nDPR = Math.min(window.devicePixelRatio, 2)
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH); renderer.setPixelRatio(nDPR)
        composer.setSize(nW * nDPR, nH * nDPR)
      }
      window.addEventListener('resize', onResize)

      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', onResize)
        toonMat.dispose(); darkMat.dispose(); lineMat.dispose()
        renderer.dispose()
        if (mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [progressRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />
}
