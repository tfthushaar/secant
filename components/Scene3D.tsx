'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ──────────────────────────────────────────────────────────────────────────────
  Architectural 3-D scene — ported from "3d entity/index.js" and adapted for
  Next.js. Improvements over the base entity:
    • Warm paper background + fog (#f7f4ef) matches the page exactly
    • Reflecting pool in front of the main building
    • Warmer material tones on walls
    • No OrbitControls — camera floats on a slow arc automatically
    • Scroll-driven: camera dolly-in as the user scrolls through the hero
    • Subtle ambient animation: pendant sway, slow camera drift
──────────────────────────────────────────────────────────────────────────────── */

export function Scene3D({ heroRef }: { heroRef: React.RefObject<HTMLElement | null> }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let rafId = 0
    let stInstance: ReturnType<typeof ScrollTrigger.create> | null = null

    import('three').then((THREE) => {
      /* ── Renderer ─────────────────────────────────────────────────────── */
      const W = mount.clientWidth
      const H = mount.clientHeight

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      mount.appendChild(renderer.domElement)

      /* ── Scene — background matches page bg exactly ───────────────────── */
      const PAGE_BG = 0xf7f4ef
      const scene   = new THREE.Scene()
      scene.background = new THREE.Color(PAGE_BG)
      scene.fog        = new THREE.Fog(PAGE_BG, 38, 88)

      /* ── Camera ─────────────────────────────────────────────────────────── */
      const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 200)
      camera.position.set(18, 9, 22)
      camera.lookAt(0, 2.5, -1)

      /* ── Materials ───────────────────────────────────────────────────────── */
      const mWall   = new THREE.MeshStandardMaterial({ color: 0xfafaf8, roughness: 0.88, metalness: 0 })
      const mRoof   = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7,  metalness: 0.05 })
      const mDark   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6,  metalness: 0.05 })
      const mMid    = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.85, metalness: 0 })
      const mLight  = new THREE.MeshStandardMaterial({ color: 0xdddbd6, roughness: 0.9,  metalness: 0 })
      const mGround = new THREE.MeshStandardMaterial({ color: 0xe6e3de, roughness: 1.0,  metalness: 0 })
      const mGlass  = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.2 })
      const mStone  = new THREE.MeshStandardMaterial({ color: 0xc6c3bc, roughness: 0.95, metalness: 0 })
      const mTree   = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1.0,  metalness: 0 })
      /* NEW — water/pool */
      const mPool   = new THREE.MeshStandardMaterial({ color: 0xa8aaa8, roughness: 0.0,  metalness: 0.5, transparent: true, opacity: 0.55 })

      /* ── Helpers ─────────────────────────────────────────────────────────── */
      function mkBox(w: number, h: number, d: number, mat: THREE.Material) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
        m.castShadow = true; m.receiveShadow = true; return m
      }
      function mkCyl(rt: number, rb: number, h: number, seg: number, mat: THREE.Material) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat)
        m.castShadow = true; m.receiveShadow = true; return m
      }
      function mkSphere(r: number, seg: number, mat: THREE.Material) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat)
        m.castShadow = true; m.receiveShadow = true; return m
      }
      function mkTorus(R: number, r: number, mat: THREE.Material) {
        const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 16, 60), mat)
        m.castShadow = true; m.receiveShadow = true; return m
      }
      function add(obj: THREE.Object3D, x: number, y: number, z: number, name: string) {
        obj.position.set(x, y, z); obj.name = name; scene.add(obj); return obj
      }

      /* ── Ground ─────────────────────────────────────────────────────────── */
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mGround)
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)

      /* Grid lines */
      for (let i = -20; i <= 20; i++) {
        const h = mkBox(40, 0.01, 0.02, mLight); h.position.set(0, 0.005, i); scene.add(h)
        const v = mkBox(0.02, 0.01, 40, mLight);  v.position.set(i, 0.005, 0); scene.add(v)
      }

      /* ── NEW: Reflecting Pool ─────────────────────────────────────────── */
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), mPool)
      pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.02, -5.8); scene.add(pool)
      const poolEdgeN = mkBox(9.2, 0.1, 0.12, mLight); poolEdgeN.position.set(0, 0.06, -7.46); scene.add(poolEdgeN)
      const poolEdgeS = mkBox(9.2, 0.1, 0.12, mLight); poolEdgeS.position.set(0, 0.06, -4.26); scene.add(poolEdgeS)
      const poolEdgeE = mkBox(0.12, 0.1, 3.2, mLight);  poolEdgeE.position.set(4.54, 0.06, -5.86); scene.add(poolEdgeE)
      const poolEdgeW = mkBox(0.12, 0.1, 3.2, mLight);  poolEdgeW.position.set(-4.54, 0.06, -5.86); scene.add(poolEdgeW)

      /* ── Left Wing ──────────────────────────────────────────────────────── */
      add(mkBox(6.5, 2.8, 5.5, mWall), -9.5, 1.4, 0.5, 'lWingBody')
      for (let s = 0; s < 9; s++) {
        const sl = mkBox(6.6, 0.08, 0.12, mDark); sl.position.set(-9.5, 0.4 + s * 0.28, 0.5 - 2.76); scene.add(sl)
      }
      add(mkBox(8.0, 0.22, 7.0, mRoof), -9.5, 2.9, 0.5, 'lRoof')
      const lrEdge = mkBox(8.0, 0.06, 0.06, mDark); lrEdge.position.set(-9.5, 3.01, -3.0); scene.add(lrEdge)
      add(mkBox(3.5, 0.22, 0.6, mLight), -9.5, 0.22, -3.8, 'bench')

      /* ── Main Building ──────────────────────────────────────────────────── */
      add(mkBox(13.5, 5.0, 0.3, mWall), 0.5, 2.5, 3.8, 'mainRear')
      for (let i = 0; i < 18; i++) {
        const s = mkBox(0.07, 5.0, 0.07, mMid); s.position.set(-5.9 + i * 0.72, 2.5, -3.45); scene.add(s)
      }
      add(mkBox(0.2, 5.0, 8.0, mLight), 7.3, 2.5, 0.3, 'mainSide')
      add(mkBox(4.0, 4.2, 0.08, mGlass), -3.5, 2.3, -3.38, 'gPanel1')
      add(mkBox(4.0, 4.2, 0.08, mGlass),  1.5, 2.3, -3.38, 'gPanel2')
      add(mkBox(13.5, 0.28, 8.5, mLight), 0.5, 0.14, 0.0, 'floor')

      /* NEW: door frame detail */
      add(mkBox(0.12, 4.0, 0.12, mDark), -3.5 - 2.0, 2.1, -3.36, 'dframeL')
      add(mkBox(0.12, 4.0, 0.12, mDark), -3.5 + 2.0, 2.1, -3.36, 'dframeR')
      add(mkBox(4.0, 0.12, 0.12, mDark), -3.5, 4.25, -3.36, 'dframeTop')

      /* ── Main Roof ──────────────────────────────────────────────────────── */
      add(mkBox(15.5, 0.28, 10.5, mRoof), 0.5, 5.1, 0.3, 'mainRoof')
      const mre = mkBox(15.5, 0.08, 0.08, mDark); mre.position.set(0.5, 5.24, -4.96); scene.add(mre)
      const mrr = mkBox(0.08, 0.08, 10.5, mDark); mrr.position.set(8.26, 5.24, 0.3);  scene.add(mrr)
      ;[[-5.5,-3.9],[-2.0,-3.9],[1.5,-3.9],[5.0,-3.9],[-5.5,3.6],[5.0,3.6]].forEach(([cx,cz],i)=>{
        const col = mkCyl(0.09, 0.09, 5.1, 8, mDark); col.position.set(cx, 2.55, cz); col.name=`col_${i}`; scene.add(col)
      })

      /* ── Right Wing ─────────────────────────────────────────────────────── */
      add(mkBox(5.5, 3.5, 5.0, mWall), 10.5, 1.75, 0.5, 'rWing')
      for (let i = 0; i < 10; i++) {
        const rs = mkBox(0.06, 3.5, 0.06, mMid); rs.position.set(8.3 + i * 0.58, 1.75, -2.04); scene.add(rs)
      }
      add(mkBox(6.5, 0.22, 6.5, mRoof), 10.5, 3.62, 0.5, 'rRoof')
      ;[[8.3,-2.2],[12.7,-2.2],[8.3,3.2],[12.7,3.2]].forEach(([cx,cz],i)=>{
        const rc = mkCyl(0.08,0.08,3.5,8,mDark); rc.position.set(cx,1.75,cz); rc.name=`rc_${i}`; scene.add(rc)
      })

      /* ── Pendant Lights ─────────────────────────────────────────────────── */
      const pendants = [[-3.5,4.85,-1.5],[0.5,4.85,-1.0],[4.0,4.85,-1.5]]
      pendants.forEach((p, i) => {
        const cable = mkCyl(0.018, 0.018, 1.2, 6, mDark); cable.position.set(p[0], p[1], p[2]); cable.name=`pcable_${i}`; scene.add(cable)
        const ro = mkTorus(0.62, 0.07, mMid); ro.rotation.x = Math.PI/2; ro.position.set(p[0],p[1]-0.65,p[2]); ro.name=`ro_${i}`; scene.add(ro)
        const ri = mkTorus(0.38, 0.04, mLight); ri.rotation.x = Math.PI/2; ri.position.set(p[0],p[1]-0.65,p[2]); ri.name=`ri_${i}`; scene.add(ri)
        for (let sp = 0; sp < 4; sp++) {
          const spk = mkBox(0.9, 0.025, 0.025, mMid); spk.rotation.y = sp * Math.PI / 4; spk.position.set(p[0],p[1]-0.65,p[2]); spk.name=`spk_${i}_${sp}`; scene.add(spk)
        }
      })

      /* ── Wall Ring Sculpture ────────────────────────────────────────────── */
      const wro = mkTorus(1.05, 0.10, mMid); wro.position.set(3.5, 2.6, -3.3); scene.add(wro)
      const wri = mkTorus(0.65, 0.05, mLight); wri.position.set(3.5, 2.6, -3.3); scene.add(wri)
      ;['h','v'].forEach(dir => {
        const cr = mkBox(dir==='h'?2.1:0.04, dir==='h'?0.04:2.1, 0.04, mMid); cr.position.set(3.5,2.6,-3.28); scene.add(cr)
      })

      /* ── Boulder Cluster ────────────────────────────────────────────────── */
      ;[{x:-8.5,y:0.42,z:-4.2,rx:0.42,ry:0.45,rz:0.42},{x:-7.5,y:0.38,z:-4.4,rx:0.38,ry:0.42,rz:0.38},{x:-6.7,y:0.32,z:-4.0,rx:0.35,ry:0.38,rz:0.32},{x:-7.1,y:0.28,z:-4.8,rx:0.28,ry:0.32,rz:0.30},{x:-6.0,y:0.25,z:-4.5,rx:0.25,ry:0.28,rz:0.25}]
      .forEach((b,i)=>{
        const s=mkSphere(1.0,12,mStone); s.scale.set(b.rx,b.ry*0.85,b.rz); s.position.set(b.x,b.ry*0.7,b.z); s.name=`bg_${i}`; scene.add(s)
      })

      /* ── Teardrop Sculpture ─────────────────────────────────────────────── */
      add(mkCyl(0.24, 0.30, 1.8, 18, mDark), -4.8, 0.9, -3.9, 'tearBase')
      add(mkCyl(0.20, 0.24, 0.8, 18, mDark), -4.8, 2.2, -3.9, 'tearMid')
      add(mkCyl(0.10, 0.20, 0.5, 18, mDark), -4.8, 2.85,-3.9, 'tearNeck')
      add(mkSphere(0.30, 18, mDark), -4.8, 3.22, -3.9, 'tearHead')
      const ov = mkSphere(0.55, 16, mDark); ov.scale.set(0.7,1.35,0.7); add(ov,-5.9,0.8,-3.9,'ovalSculpt')

      /* ── Foreground Rocks ───────────────────────────────────────────────── */
      ;[[2.0,0.28,-4.8,0.55,0.38,0.50],[3.5,0.22,-4.5,0.45,0.30,0.42],[0.5,0.18,-4.6,0.38,0.25,0.36],[5.0,0.30,-4.2,0.60,0.40,0.55],[6.5,0.20,-3.8,0.40,0.28,0.38],[-1.5,0.20,-4.7,0.35,0.26,0.32],[7.8,0.32,-3.5,0.52,0.38,0.48]]
      .forEach(([x,,z,sx,sy,sz],i)=>{ const r=mkSphere(1.0,8,mStone); r.scale.set(sx,sy,sz); r.position.set(x,sy,z); r.name=`rock_${i}`; scene.add(r) })

      /* ── Palm Trees ─────────────────────────────────────────────────────── */
      function makePalm(x: number, z: number, h: number, lean: number, nm: string) {
        const trunk = mkCyl(0.09, 0.16, h, 7, mDark); trunk.position.set(x, h/2, z); trunk.rotation.z = lean; trunk.name = nm+'_trunk'; scene.add(trunk)
        for (let f = 0; f < 9; f++) {
          const angle = (f/9)*Math.PI*2
          const frond = mkBox(2.2, 0.035, 0.18, mDark)
          frond.position.set(x+Math.cos(angle)*1.3+lean*h*0.5, h+0.1, z+Math.sin(angle)*1.3)
          frond.rotation.y = -angle; frond.rotation.z = 0.52+Math.sin(f)*0.08; frond.name = nm+`_f${f}`; scene.add(frond)
          for (let lf = 0; lf < 5; lf++) {
            const lr = 0.3+lf*0.15
            const lft = mkBox(0.5,0.02,0.12,mTree)
            lft.position.set(x+Math.cos(angle)*(1.3+lr)+lean*h*0.5, h+0.1-lr*0.4, z+Math.sin(angle)*(1.3+lr))
            lft.rotation.y = -angle; lft.rotation.z = 0.55+lr*0.3; lft.name = nm+`_lf${f}_${lf}`; scene.add(lft)
          }
        }
      }
      makePalm(-14, -0.5, 10.5, -0.05, 'pL1')
      makePalm(-11.5, -2.5, 8.5,  0.04, 'pL2')
      makePalm(13.5,  -1.0, 10.0,  0.04, 'pR1')
      makePalm(16.0,   1.0,  7.5, -0.03, 'pR2')

      /* ── Background Trees ───────────────────────────────────────────────── */
      ;[[-16,6.5,5],[-13,5.5,6],[-10,6.0,6.5],[-7,5.0,7],[-4,5.5,6.8],[-1,6.0,7],[2,5.5,7.2],[5,6.5,6.5],[8,5.8,7],[11,6.2,6.8],[14,5.5,7.2],[17,6.0,6.5]]
      .forEach(([tx,th,tz],i)=>{
        const tr = mkCyl(0.09,0.13,th,6,mDark); tr.position.set(tx,th/2,tz); tr.name=`bgt_${i}`; scene.add(tr)
        const cr1=mkSphere(1.5,7,mTree); cr1.position.set(tx,th+0.8,tz); scene.add(cr1)
        const cr2=mkSphere(1.1,6,mDark); cr2.position.set(tx+0.5,th+1.4,tz-0.3); scene.add(cr2)
      })

      /* ── Lighting ───────────────────────────────────────────────────────── */
      const sun = new THREE.DirectionalLight(0xffffff, 2.8); sun.position.set(-18,22,12); sun.castShadow=true; sun.shadow.mapSize.set(4096,4096); sun.shadow.camera.left=-35; sun.shadow.camera.right=35; sun.shadow.camera.top=30; sun.shadow.camera.bottom=-15; sun.shadow.bias=-0.0008; sun.shadow.normalBias=0.015; scene.add(sun)
      scene.add(new THREE.AmbientLight(0xffffff, 1.4))
      const fill = new THREE.DirectionalLight(0xf0f0f0, 0.65); fill.position.set(15,10,15); scene.add(fill)
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d5d0, 0.55))

      /* ── Camera path ────────────────────────────────────────────────────── */
      const startCam = { x: 18, y: 9,  z: 22 }
      const endCam   = { x: 5,  y: 4,  z: 14 }
      const camTarget = { ...startCam }

      /* Scroll-driven camera dolly-in */
      stInstance = ScrollTrigger.create({
        trigger: heroRef.current ?? mount,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          const p = THREE.MathUtils.clamp(self.progress, 0, 1)
          camTarget.x = THREE.MathUtils.lerp(startCam.x, endCam.x, p)
          camTarget.y = THREE.MathUtils.lerp(startCam.y, endCam.y, p)
          camTarget.z = THREE.MathUtils.lerp(startCam.z, endCam.z, p)
        },
      })

      /* ── Animation loop ──────────────────────────────────────────────────── */
      const clock = new THREE.Clock()

      function animate() {
        rafId = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()

        /* Slow gentle camera orbit on top of scroll position */
        const drift = Math.sin(t * 0.12) * 1.2
        camera.position.set(camTarget.x + drift, camTarget.y, camTarget.z)
        camera.lookAt(0, 2.5, -1)

        /* Pendant sway */
        pendants.forEach((_, i) => {
          const ro = scene.getObjectByName(`ro_${i}`)
          const ri = scene.getObjectByName(`ri_${i}`)
          const sway = Math.sin(t * 0.35 + i * 1.1) * 0.018
          if (ro) ro.rotation.z = sway
          if (ri) ri.rotation.z = sway
        })

        renderer.render(scene, camera)
      }
      animate()

      /* ── Resize ─────────────────────────────────────────────────────────── */
      function onResize() {
        const nW = mount.clientWidth; const nH = mount.clientHeight
        camera.aspect = nW / nH; camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
      }
      window.addEventListener('resize', onResize)

      /* ── Cleanup ────────────────────────────────────────────────────────── */
      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId)
        stInstance?.kill()
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      }
    })

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [heroRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
