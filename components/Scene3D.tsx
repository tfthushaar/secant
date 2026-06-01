'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — Full-colour PBR architectural model
  Ported from Spline export (index.js) with:
    • OrbitControls replaced by scroll-driven progressRef camera
    • Dynamic Three.js import for Next.js compatibility
    • Snap-to-rest camera (LERP 0.10, SNAP 0.001)
    • Progress quantised to 0.1% — eliminates Lenis drift flicker
    • Shadows: PCFSoftShadowMap 2048px
    • ACES Filmic tone mapping
    • Materials: MeshStandardMaterial with roughness/metalness
*/

const LERP = 0.10
const SNAP = 0.001

/* 6 scroll-driven viewpoints calibrated to this building's coordinate space
   (main box centre ~x:4, secondary volume x:14, left terrace x:-7)       */
const CAM_STOPS = [
  { pos: [22,  10, 24], look: [4,  3.5,  0] }, /* three-quarter front    */
  { pos: [ 0,   4, 20], look: [1,  3.0,  3] }, /* zoom — stair entrance  */
  { pos: [24,   6,  8], look: [14, 4.0,  0] }, /* right — secondary vol  */
  { pos: [10,  22, 20], look: [4,  2.0,  0] }, /* high aerial            */
  { pos: [-15,  7, 18], look: [-2, 3.0,  0] }, /* left — terrace view    */
  { pos: [ 4,  30, 0.5], look: [4, 0.0,  0] }, /* top-down plan          */
]

/* Palette — matches Spline export */
const C = {
  offWhite:     0xF5F0E6, concreteSlab: 0xD6D0C4, charcoal:   0x2C2A26,
  aquaGlass:    0x9EC8CC, bronze:       0x3D3028, terracotta: 0xC4785A,
  cream:        0xEDE7DB, floorPlate:   0xEEEBE3, sand:       0xD4C9AE,
  railBronze:   0x7A5C42, stone:        0xC8C4B8, slateBlue:  0x2A3845,
  nearBlack:    0x1C1A18, gold:         0xB8963E, pedestal:   0x2C2A26,
  claypot:      0x5C4435, sage:         0x7A9068, doorWalnut: 0x3A2C22,
  pendantBrass: 0xC8A84A, stairSide:    0x2C2A26, canopyUnder:0xB8B2A6,
  skylight:     0x2A3228, groundStone:  0xC8C4B8, mullion:    0x3D3028,
  entryFin:     0x7A5C42,
}

interface Props { progressRef: React.MutableRefObject<number> }

export function Scene3D({ progressRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let rafId = 0

    ;(async () => {
      const THREE = await import('three')

      const W   = mount.clientWidth  || window.innerWidth
      const H   = mount.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 2)

      /* ── Renderer ─────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H); renderer.setPixelRatio(dpr)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xffffff)

      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 500)
      const p0 = CAM_STOPS[0]
      camera.position.set(p0.pos[0], p0.pos[1], p0.pos[2])
      camera.lookAt(p0.look[0], p0.look[1], p0.look[2])

      /* ── Material + mesh helpers ──────────────────────────────── */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function mat(color: number, opts: any = {}) {
        return new THREE.MeshStandardMaterial({ color, ...opts })
      }
      function addBox(w: number, h: number, d: number, color: number,
                      x: number, y: number, z: number, opts = {}) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts))
        m.position.set(x, y, z)
        m.castShadow = true; m.receiveShadow = true
        scene.add(m); return m
      }

      /* ── Ground + grid ────────────────────────────────────────── */
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 60),
        mat(C.groundStone, { roughness: 0.95 })
      )
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true
      scene.add(ground)
      const grid = new THREE.GridHelper(60, 30, 0xBBB8B2, 0xCCC9C3)
      grid.position.y = 0.01
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(grid.material as any).opacity = 0.25;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(grid.material as any).transparent = true
      scene.add(grid)

      /* ── Plinth ───────────────────────────────────────────────── */
      addBox(27, 0.18, 16, C.stone, 2.5, 0.09, 0, { roughness: 0.8 })

      /* ── Reflecting pool ──────────────────────────────────────── */
      addBox(8.4, 0.25, 5.4, C.stone, -7.5, 0.125, 3.5, { roughness: 0.7 })
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(7.8, 4.8),
        mat(C.slateBlue, { roughness: 0.05, metalness: 0.3 })
      )
      water.rotation.x = -Math.PI / 2; water.position.set(-7.5, 0.26, 3.5)
      scene.add(water)

      /* ── Pilotis ──────────────────────────────────────────────── */
      const colMat = mat(C.charcoal, { roughness: 0.4, metalness: 0.1 })
      function addCol(x: number, z: number) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.8, 16), colMat)
        c.position.set(x, 0.9, z); c.castShadow = true; scene.add(c)
      }
      ;[-6.5,-3.5,-0.5,2.5,5.5,8.0].forEach(x =>
        [-3.8, 3.8].forEach(z => addCol(x, z))
      )
      addCol(3.0, 0); addCol(0.5, 0)

      /* ── Floor + ceiling plates ───────────────────────────────── */
      addBox(21.2, 0.22, 9.4, C.floorPlate,  0.6, 1.90, 0, { roughness: 0.6 })
      addBox(15,   0.15,  9,  C.floorPlate,  4,   6.97, 0, { roughness: 0.6 })
      addBox(15,   0.08,  9,  C.floorPlate,  4,   2.11, 0, { roughness: 0.6 })

      /* ── Main box walls ───────────────────────────────────────── */
      const wallMat = mat(C.offWhite, { roughness: 0.85 })
      const bw = new THREE.Mesh(new THREE.BoxGeometry(15, 5, 0.2), wallMat)
      bw.position.set(4, 4.5, -4.3); bw.castShadow = true; scene.add(bw)
      ;[[-3.45, 4.5, 0],[11.45, 4.5, 0]].forEach(([x,y,z]) =>
        addBox(0.2, 5, 9, C.offWhite, x, y, z, { roughness: 0.85 })
      )

      /* ── Curtain wall ─────────────────────────────────────────── */
      const gMat = mat(C.aquaGlass, { transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.15 })
      const gp = new THREE.Mesh(new THREE.BoxGeometry(15, 5, 0.1), gMat)
      gp.position.set(4, 4.5, 4.35); scene.add(gp)
      for (let i = 0; i < 8; i++) {
        const vm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5, 0.12), mat(C.mullion, { roughness: 0.3, metalness: 0.5 }))
        vm.position.set(-3.5 + i * (15/7), 4.5, 4.38); vm.castShadow = true; scene.add(vm)
      }
      ;[3.2, 4.5, 5.8].forEach(y => {
        const hm = new THREE.Mesh(new THREE.BoxGeometry(15, 0.07, 0.12), mat(C.mullion, { roughness: 0.3, metalness: 0.5 }))
        hm.position.set(4, y, 4.38); scene.add(hm)
      })

      /* ── Entrance door (near stair) ───────────────────────────── */
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.5, 0.1), mat(C.doorWalnut, { roughness: 0.6 }))
      door.position.set(-2.6, 3.75, 4.4); scene.add(door)
      ;[[-1.5, 3.75, 4.38],[-3.7, 3.75, 4.38]].forEach(([x,y,z]) => {
        const fr = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.6, 0.12), mat(C.charcoal, { roughness: 0.4 }))
        fr.position.set(x,y,z); scene.add(fr)
      })
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), mat(C.railBronze, { roughness: 0.3, metalness: 0.7 }))
      handle.position.set(-2.0, 3.6, 4.48); scene.add(handle)

      /* ── Pendant lights ───────────────────────────────────────── */
      const pMat = mat(C.pendantBrass, { roughness: 0.3, metalness: 0.8, emissive: new THREE.Color(C.pendantBrass), emissiveIntensity: 0.2 })
      const stMat = mat(C.charcoal, { roughness: 0.5 })
      ;[[-0.5,0],[2,0.3],[4.5,0],[7,-0.3],[9,0.2]].forEach(([px,pz],i) => {
        const dropH = 1.4 + [0.6, 0.3, 0.8, 0.1, 0.5][i]
        const stemY = 7 - dropH/2, ringY = 7 - dropH
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, dropH, 6), stMat)
        stem.position.set(px, stemY, pz); scene.add(stem)
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 24), pMat)
        ring.position.set(px, ringY, pz); ring.rotation.x = Math.PI/2; scene.add(ring)
        const pl = new THREE.PointLight(0xFFD080, 0.4, 4)
        pl.position.set(px, ringY, pz); scene.add(pl)
      })

      /* ── Entry fins ───────────────────────────────────────────── */
      ;[-4.2,-3.1].forEach(x =>
        addBox(0.08, 3.5, 1.2, C.entryFin, x, 3.75, 5.4, { roughness: 0.4, metalness: 0.4 })
      )

      /* ── Left terrace ─────────────────────────────────────────── */
      addBox(6, 0.18, 9, C.sand, -6.5, 2.0, 0, { roughness: 0.8 })
      const rpMat = mat(C.railBronze, { roughness: 0.4, metalness: 0.5 })
      for (let i = 0; i <= 5; i++) {
        ;[-4.3, 4.3].forEach(rz => {
          const rp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), rpMat)
          rp.position.set(-9.3 + i*0.35, 2.55, rz); scene.add(rp)
        })
      }
      ;[[-9.2,2.9,-4.3,6,0.05,0.05],[-9.2,2.9,4.3,6,0.05,0.05]].forEach(
        ([x,y,z,w,h,d]) => addBox(w,h,d,C.railBronze,x,y,z,{roughness:0.3,metalness:0.6})
      )
      addBox(0.05, 0.5, 9, C.railBronze, -9.45, 2.4, 0, { roughness: 0.3, metalness: 0.6 })

      /* ── Exterior staircase ───────────────────────────────────── */
      const ssm = mat(C.stairSide, { roughness: 0.5 })
      const ss = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.1, 3.8), ssm)
      ss.position.set(-5.5, 1.05, 6.2); ss.castShadow = true; scene.add(ss)
      const trMat = mat(C.stone, { roughness: 0.7 })
      for (let i = 0; i < 6; i++) {
        const tr = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.62), trMat)
        tr.position.set(-5.5, 0.3 + i*0.3, 4.35 + i*0.62)
        tr.castShadow = true; tr.receiveShadow = true; scene.add(tr)
      }

      /* ── Secondary volume ─────────────────────────────────────── */
      ;[[11.45,5.25,0],[17.45,5.25,0]].forEach(([x,y,z]) =>
        addBox(0.2, 6.5, 13, C.terracotta, x, y, z, { roughness: 0.82 })
      )
      addBox(6.2, 6.5, 0.2, C.terracotta, 14.45, 5.25, -6.3, { roughness: 0.82 })
      addBox(6.2, 0.2,  13, C.terracotta, 14.45, 8.55,  0,   { roughness: 0.82 })
      addBox(6.2, 1.2, 0.2, C.terracotta, 14.45, 2.4,  6.4,  { roughness: 0.82 })
      const wMat = mat(C.aquaGlass, { transparent: true, opacity: 0.5, roughness: 0.05, metalness: 0.1 })
      ;[3.8, 5.2, 6.6].forEach(y => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 0.12), wMat)
        win.position.set(14.45, y, 6.44); scene.add(win)
        addBox(5.2, 0.12, 0.18, C.charcoal, 14.45, y+0.31, 6.44)
        addBox(5.2, 0.12, 0.18, C.charcoal, 14.45, y-0.31, 6.44)
      })
      for (let i = 0; i < 8; i++) {
        const lv = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.8), mat(C.cream, { roughness: 0.7 }))
        lv.position.set(14.45, 7.4 - i*0.55, 6.8)
        lv.rotation.x = -0.18; lv.castShadow = true; scene.add(lv)
      }

      /* ── Secondary roof + parapet ─────────────────────────────── */
      addBox(6.6, 0.28, 13.4, C.concreteSlab, 14.45, 8.7, 0, { roughness: 0.75 })
      ;[[11.25,8.94,0,0.18,0.5,13.4],[17.65,8.94,0,0.18,0.5,13.4],
        [14.45,8.94,-6.9,6.8,0.5,0.18],[14.45,8.94,6.9,6.8,0.5,0.18]
      ].forEach(([x,y,z,w,h,d]) => addBox(w,h,d,C.charcoal,x,y,z,{roughness:0.4}))

      /* ── Main roof (asymmetric) ───────────────────────────────── */
      addBox(22, 0.3, 10.2, C.concreteSlab, 1.5, 7.14, 0, { roughness: 0.75 })
      ;[[1.5,6.88,-5.3,22,0.55,0.2],[1.5,6.88,5.3,22,0.55,0.2],
        [-8.55,6.88,0,0.2,0.55,10.2],[11.55,6.88,0,0.2,0.55,10.2]
      ].forEach(([x,y,z,w,h,d]) => addBox(w,h,d,C.charcoal,x,y,z,{roughness:0.4}))
      addBox(22, 0.05, 10.2, C.canopyUnder, 1.5, 6.6, 0, { roughness: 0.9 })
      addBox(8, 0.15, 1.0, C.skylight, 4, 7.32, -0.5, { roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.85 })

      /* ── Sculptures ───────────────────────────────────────────── */
      addBox(0.4, 2.8, 0.4, C.nearBlack, -4.0, 1.4, 7.5, { roughness: 0.8 })
      addBox(0.5, 1.8, 0.5, C.nearBlack, -2.2, 0.9, 8.0, { roughness: 0.8 })
      addBox(0.45, 0.85, 0.45, C.pedestal, 8.5, 0.42, 7.2, { roughness: 0.4 })
      const disk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.08, 48),
        mat(C.gold, { roughness: 0.2, metalness: 0.9 })
      )
      disk.position.set(8.5, 0.93, 7.2)
      disk.rotation.z = Math.PI/2; disk.rotation.y = 0.4; scene.add(disk)

      /* ── Planters ─────────────────────────────────────────────── */
      ;[[6,0.4,7.8],[2.0,0.4,8.5],[-1.5,0.4,8.0]].forEach(([px,py,pz]) => {
        const pl = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.9), mat(C.claypot, { roughness: 0.85 }))
        pl.position.set(px, py, pz); pl.castShadow = true; scene.add(pl)
        const top = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), mat(C.sage, { roughness: 0.9 }))
        top.rotation.x = -Math.PI/2; top.position.set(px, py+0.32, pz); scene.add(top)
      })

      /* ── Lighting ─────────────────────────────────────────────── */
      const key = new THREE.DirectionalLight(0xFFF5E8, 2.8)
      key.position.set(18, 20, 15); key.castShadow = true
      key.shadow.mapSize.set(2048, 2048)
      key.shadow.camera.left = -30; key.shadow.camera.right = 30
      key.shadow.camera.top  =  30; key.shadow.camera.bottom = -30
      key.shadow.camera.far  = 80;  key.shadow.bias = -0.001
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xE8EFF5, 0.6)
      fill.position.set(-15, 8, 5); scene.add(fill)
      const rim = new THREE.DirectionalLight(0xFFF0D8, 0.9)
      rim.position.set(5, 12, -20); scene.add(rim)
      scene.add(new THREE.AmbientLight(0xF5EEE4, 0.45))
      scene.add(new THREE.HemisphereLight(0xFFF5E0, 0xD8D2C8, 0.3))

      /* ── Camera lerp + snap ───────────────────────────────────── */
      const lerp = (a: number, b: number, t: number) => a + (b-a)*t
      const cam = { x: p0.pos[0], y: p0.pos[1], z: p0.pos[2],
                    lx: p0.look[0], ly: p0.look[1], lz: p0.look[2] }
      function snap(cur: number, tgt: number) {
        const d = tgt - cur; return Math.abs(d) < SNAP ? tgt : cur + d * LERP
      }

      function animate() {
        rafId = requestAnimationFrame(animate)

        const p  = Math.round(Math.max(0, Math.min(1, progressRef.current)) * 1000) / 1000
        const N  = CAM_STOPS.length
        const fp = p * (N - 1)
        const i0 = Math.floor(fp), i1 = Math.min(i0+1, N-1)
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

        renderer.render(scene, camera)
      }
      animate()

      function onResize() {
        const nW = mount!.clientWidth, nH = mount!.clientHeight
        camera.aspect = nW / nH; camera.updateProjectionMatrix()
        renderer.setSize(nW, nH); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      }
      window.addEventListener('resize', onResize)

      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [progressRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />
}
