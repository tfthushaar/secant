'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — "The Pavilion" — Hybrid sketch+realism renderer
  ──────────────────────────────────────────────────────────
  Architecture: Asymmetric elevated pavilion inspired by
    Farnsworth House × Villa dall'Ava × Tadao Ando concrete

  Rendering: Two-pass hybrid
    Pass 1 → PBR scene with shadows, MeshStandardMaterial
    Pass 2 → EdgesGeometry ink lines on top (crisp architectural lines)
    Result: Architectural sketch WITH real shadows and depth

  The sketch lines give the drawing quality.
  The PBR shading gives depth, weight and realism.
  Together they look like a hand-rendered section perspective.
*/

const LERP = 0.10
const SNAP = 0.001

const CAM_STOPS = [
  { pos: [22, 10, 24],  look: [4, 3.5,  0] }, /* three-quarter front   */
  { pos: [ 0,  4, 20],  look: [1, 3.0,  3] }, /* zoom — entrance/stair */
  { pos: [24,  6,  8],  look: [14,4.0,  0] }, /* right — secondary vol */
  { pos: [10, 22, 20],  look: [4, 2.0,  0] }, /* high aerial           */
  { pos: [-15, 7, 18],  look: [-2,3.0,  0] }, /* left — terrace        */
  { pos: [ 4, 30,0.5],  look: [4, 0.0,  0] }, /* top-down plan         */
]

/* Refined architectural palette */
const C = {
  /* Surfaces */
  offWhite:     0xF8F4EE,   /* main walls — warm plaster             */
  concrete:     0xD8D3CB,   /* roof slab — béton brut                */
  darkConcrete: 0x4A4642,   /* fascia, frame — dark poured concrete  */
  warmGray:     0xC2BCB4,   /* floor plates, soffits                 */
  sand:         0xD8CEBC,   /* left terrace deck                     */
  stone:        0xCCC8C0,   /* stair treads, plinth                  */
  /* Accents */
  terracotta:   0xB86A48,   /* secondary volume — refined terracotta */
  corten:       0x8C5535,   /* corten steel — sculptures, fins       */
  glass:        0xA8C8D0,   /* curtain wall glass — cool blue-green  */
  bronze:       0x7A6040,   /* handles, rails                        */
  brass:        0xC4A03C,   /* pendant lights                        */
  /* Site */
  groundWarm:   0xD4CEBC,   /* paving — warm limestone               */
  water:        0x3C5868,   /* reflecting pool — deep slate          */
  soil:         0x6A5440,   /* planters                              */
  moss:         0x7A8C68,   /* planter tops — low vegetation         */
  nearBlack:    0x1E1C1A,   /* monoliths, door frame                 */
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
      renderer.toneMappingExposure = 1.05
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xffffff)
      /* Subtle fog — creates atmospheric depth on long views */
      scene.fog = new THREE.FogExp2(0xffffff, 0.008)

      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 500)
      const p0 = CAM_STOPS[0]
      camera.position.set(p0.pos[0], p0.pos[1], p0.pos[2])
      camera.lookAt(p0.look[0], p0.look[1], p0.look[2])

      /* ── Material factories ───────────────────────────────────── */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function pbr(color: number, roughness = 0.75, metalness = 0, opts: any = {}) {
        return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...opts })
      }

      /* Pre-built materials */
      const mats = {
        wall:     pbr(C.offWhite,   0.85, 0.00),
        concrete: pbr(C.concrete,   0.72, 0.02),
        darkConc: pbr(C.darkConcrete,0.40,0.08),
        warmGray: pbr(C.warmGray,   0.80, 0.01),
        sand:     pbr(C.sand,       0.88, 0.00),
        stone:    pbr(C.stone,      0.68, 0.03),
        terra:    pbr(C.terracotta, 0.82, 0.00),
        corten:   pbr(C.corten,     0.72, 0.20),
        glass:    pbr(C.glass,      0.04, 0.15, { transparent:true, opacity:0.42 }),
        bronze:   pbr(C.bronze,     0.35, 0.65),
        brass:    pbr(C.brass,      0.28, 0.80,
                      { emissive: new THREE.Color(C.brass), emissiveIntensity: 0.15 }),
        ground:   pbr(C.groundWarm, 0.92, 0.00),
        water:    pbr(C.water,      0.04, 0.35, { transparent:true, opacity:0.90 }),
        soil:     pbr(C.soil,       0.90, 0.00),
        moss:     pbr(C.moss,       0.88, 0.00),
        nearBlack:pbr(C.nearBlack,  0.55, 0.05),
        cream:    pbr(0xEDEAE2,     0.75, 0.00),
      }

      /* ── Mesh helpers ─────────────────────────────────────────── */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lineMat = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.55 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function addMesh(geo: any, mat: any, x=0,y=0,z=0,
                       rx=0,ry=0,rz=0, shadow=true) {
        const m = new THREE.Mesh(geo, mat)
        m.position.set(x,y,z); m.rotation.set(rx,ry,rz)
        if (shadow) { m.castShadow = true; m.receiveShadow = true }
        scene.add(m)
        /* Ink edge lines — architectural sketch overlay */
        const edges = new THREE.EdgesGeometry(geo, 20)
        const lines = new THREE.LineSegments(edges, lineMat)
        lines.position.set(x,y,z); lines.rotation.set(rx,ry,rz)
        scene.add(lines)
        return m
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function box(w: number, h: number, d: number, mat: any,
                   x=0, y=0, z=0, rx=0, ry=0, rz=0) {
        return addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function cyl(r: number, h: number, mat: any, x=0,y=0,z=0, segs=16) {
        return addMesh(new THREE.CylinderGeometry(r,r,h,segs), mat, x, y, z)
      }

      /* ── GROUND + PAVING ──────────────────────────────────────── */
      const gnd = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), mats.ground)
      gnd.rotation.x = -Math.PI/2; gnd.receiveShadow = true
      scene.add(gnd)
      /* Paving grid lines */
      const grid = new THREE.GridHelper(60, 20, 0xC0BBB0, 0xC8C4BB)
      grid.position.y = 0.01
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(grid.material as any).opacity = 0.18;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(grid.material as any).transparent = true
      scene.add(grid)

      /* Plinth/podium */
      box(28, 0.20, 17, mats.stone, 2, 0.10, 0)

      /* ── REFLECTING POOL ──────────────────────────────────────── */
      box(9.0, 0.30, 5.8, mats.stone, -7.5, 0.15, 3.5)
      /* Water surface */
      const wtr = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 5.0), mats.water)
      wtr.rotation.x = -Math.PI/2; wtr.position.set(-7.5, 0.31, 3.5); wtr.receiveShadow = true
      scene.add(wtr)

      /* ── PILOTIS (10 slender columns) ────────────────────────── */
      ;[-6.5,-3.5,-0.5,2.5,5.5,8.0].forEach(x =>
        [-3.8,3.8].forEach(z => cyl(0.12, 1.8, mats.darkConc, x, 0.9, z))
      )
      cyl(0.12, 1.8, mats.darkConc, 3.0, 0.9, 0)
      cyl(0.12, 1.8, mats.darkConc, 0.5, 0.9, 0)

      /* ── FLOOR PLATE + CEILING ────────────────────────────────── */
      box(21.5, 0.24, 9.6, mats.warmGray,  0.5, 1.90, 0)  /* elevated floor */
      box(15.0, 0.18, 9.0, mats.warmGray,  4.0, 7.00, 0)  /* interior ceiling */
      box(15.0, 0.10, 9.0, mats.warmGray,  4.0, 2.12, 0)  /* interior floor vis */

      /* ── MAIN BOX WALLS ──────────────────────────────────────── */
      box(15.0, 5.0, 0.22, mats.wall,  4.00, 4.50, -4.42) /* back wall      */
      box(0.22, 5.0, 9.20, mats.wall, -3.45, 4.50,  0)     /* left end wall  */
      box(0.22, 5.0, 9.20, mats.wall, 11.45, 4.50,  0)     /* right end wall */
      /* Interior cross-wall (visible through glass) */
      box(0.18, 4.2, 8.8, mats.warmGray, 2.0, 4.15, 0)

      /* ── CURTAIN WALL (front glass) ──────────────────────────── */
      /* Glass panels in 4 sections (door bay offset) */
      ;[[4.0,4.5,4.38,15.0,5.0]].forEach(([x,y,z,w,h]) => {
        const gp = new THREE.Mesh(new THREE.BoxGeometry(w,h,0.10), mats.glass)
        gp.position.set(x,y,z); scene.add(gp)
      })
      /* Vertical mullions — 8 bays */
      for (let i=0;i<=7;i++) {
        box(0.07,5.0,0.14,mats.darkConc, -3.5+i*(15/7), 4.5, 4.40)
      }
      /* Horizontal transoms — 3 rails */
      ;[3.0,4.4,5.8].forEach(y =>
        box(15.0, 0.07, 0.14, mats.darkConc, 4.0, y, 4.40)
      )

      /* ── ENTRANCE DOOR (glass, near stair, leftmost bay) ─────── */
      /* Glass panel */
      const dg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.10), mats.glass)
      dg.position.set(-2.6, 3.40, 4.44); scene.add(dg)
      /* Thin dark frame */
      ;[[0.07,2.88,0.14,-3.44,3.40,4.44],[0.07,2.88,0.14,-1.76,3.40,4.44]].forEach(
        ([w,h,d,x,y,z]) => box(w,h,d,mats.darkConc,x,y,z)
      )
      box(1.74,0.07,0.14,mats.darkConc,-2.60,4.76,4.44) /* top rail    */
      box(1.74,0.07,0.14,mats.darkConc,-2.60,2.02,4.44) /* bottom rail */
      box(1.60,0.05,0.10,mats.darkConc,-2.60,3.10,4.44) /* mid rail    */
      /* L-handle in bronze */
      box(0.05,0.42,0.05,mats.bronze,-1.85,3.38,4.52)
      box(0.22,0.05,0.05,mats.bronze,-1.85,3.58,4.52)

      /* ── PENDANT LIGHTS (inside) ──────────────────────────────── */
      const stemMat = pbr(C.nearBlack, 0.6)
      ;[[-0.5,0],[2,0.3],[4.5,0],[7,-0.3],[9,0.2]].forEach(([px,pz],i) => {
        const h = 1.4+[0.6,0.3,0.8,0.1,0.5][i]
        /* Stem */
        cyl(0.014, h, stemMat, px, 7-h/2, pz, 6)
        /* Brass ring */
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24,0.04,8,28), mats.brass)
        ring.position.set(px, 7-h, pz); ring.rotation.x=Math.PI/2; scene.add(ring)
        /* Warm point glow */
        const pl = new THREE.PointLight(0xFFCC70, 0.50, 5)
        pl.position.set(px, 7-h, pz); scene.add(pl)
      })

      /* ── LEFT TERRACE ─────────────────────────────────────────── */
      box(6.2, 0.20, 9.6, mats.sand, -6.5, 1.90, 0)
      /* Railing — thin flat bar */
      box(6.0, 0.06, 0.06, mats.bronze, -6.5, 2.92, -4.38)
      box(6.0, 0.06, 0.06, mats.bronze, -6.5, 2.92,  4.38)
      box(0.06, 0.52, 9.60, mats.bronze, -9.45, 2.66, 0)
      /* Rail posts */
      for (let i=0;i<=6;i++) {
        box(0.05,0.50,0.05,mats.bronze,-9.35+i*0.32,2.65,-4.38)
        box(0.05,0.50,0.05,mats.bronze,-9.35+i*0.32,2.65, 4.38)
      }

      /* ── EXTERIOR STAIRCASE ───────────────────────────────────── */
      /* Side wall */
      box(0.15, 2.10, 4.0, mats.darkConc, -6.4, 1.05, 5.9)
      /* 6 treads ascending toward building */
      for (let i=0;i<6;i++) {
        box(1.85, 0.16, 0.62, mats.stone, -5.5, 0.30+i*0.30, 7.50-i*0.62)
        /* Tread nose */
        box(1.85, 0.04, 0.06, mats.darkConc, -5.5, 0.22+i*0.30, 7.82-i*0.62)
      }
      /* Landing at top */
      box(1.85, 0.20, 0.90, mats.stone, -5.5, 1.90, 4.45)

      /* ── SECONDARY VOLUME (terracotta, right) ────────────────── */
      /* Walls */
      ;[[11.45,5.25,0],[17.45,5.25,0]].forEach(([x,y,z]) =>
        box(0.22, 6.5, 13.2, mats.terra, x, y, z)
      )
      box(6.2, 6.5, 0.22, mats.terra, 14.45, 5.25,-6.50)  /* back  */
      box(6.2, 0.22, 13.2, mats.terra, 14.45, 8.62, 0)     /* top closing strip */
      box(6.2, 1.40, 0.22, mats.terra, 14.45, 2.50, 6.50)  /* bottom fill  */

      /* Window slits × 3 */
      ;[3.8,5.2,6.6].forEach(y => {
        const wg = new THREE.Mesh(new THREE.BoxGeometry(5.0,0.55,0.10), mats.glass)
        wg.position.set(14.45,y,6.52); scene.add(wg)
        box(5.0,0.10,0.16,mats.darkConc,14.45,y+0.33,6.52)
        box(5.0,0.10,0.16,mats.darkConc,14.45,y-0.33,6.52)
      })

      /* Louvres — 9 cream horizontal fins, slightly angled */
      for (let i=0;i<9;i++) {
        box(5.8, 0.10, 0.90, mats.cream, 14.45, 7.55-i*0.52, 6.9,
            -0.20, 0, 0)
      }

      /* ── SECONDARY ROOF + PARAPET ─────────────────────────────── */
      box(6.8, 0.30, 13.8, mats.concrete, 14.45, 8.78, 0)
      ;[[11.20,8.98,0,0.20,0.42,13.8],[17.70,8.98,0,0.20,0.42,13.8],
        [14.45,8.98,-7.1,6.8,0.42,0.20],[14.45,8.98,7.1,6.8,0.42,0.20]
      ].forEach(([x,y,z,w,h,d]) => box(w,h,d,mats.darkConc,x,y,z))

      /* ── MAIN ROOF (asymmetric — extends further left) ────────── */
      box(23.0, 0.36, 10.8, mats.concrete, 1.0, 7.18, 0)  /* slab */
      /* Slim fascia — concrete colour, not charcoal, for elegance */
      ;[[1.0,7.00,-5.6,23.0,0.30,0.24],[1.0,7.00,5.6,23.0,0.30,0.24],
        [-9.0,7.00,0,0.24,0.30,10.8],[10.1,7.00,0,0.24,0.30,10.8]
      ].forEach(([x,y,z,w,h,d]) => box(w,h,d,mats.darkConc,x,y,z))
      /* Underside — warm canopy tone */
      box(22.6, 0.06, 10.4, pbr(0xB8B2A8,0.88), 1.0, 6.82, 0, 0,0,0)
      /* Skylight strip — dark tinted */
      box(7.0, 0.14, 1.4, pbr(C.water,0.04,0.3,{transparent:true,opacity:0.85}), 4, 7.38,-0.5)

      /* ── ENTRY CANOPY ─────────────────────────────────────────── */
      /* Thin projecting slab above the door/stair */
      box(5.0, 0.14, 2.8, mats.concrete, -3.5, 5.80, 5.8)
      /* Two slim columns supporting it */
      ;[-1.5,-5.5].forEach(x => cyl(0.08,3.70,mats.darkConc,x,2.90,6.8))

      /* ── SCULPTURES & SITE ART ────────────────────────────────── */
      /* Tall corten steel monolith — left of stair */
      box(0.32, 3.2, 0.80, mats.corten, -4.2, 1.60, 7.8)
      /* Low corten slab — angled near pool */
      box(0.28, 1.60, 0.60, mats.corten, -2.5, 0.80, 8.5)
      /* Gold disk on dark pedestal */
      box(0.40, 0.90, 0.40, mats.nearBlack, 8.5, 0.45, 7.5)
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.09,48), mats.brass)
      disk.position.set(8.5,0.95,7.5); disk.rotation.y=0.5; scene.add(disk)
      const dl = new THREE.LineSegments(new THREE.EdgesGeometry(
        new THREE.CylinderGeometry(0.55,0.55,0.09,48),10), lineMat)
      dl.position.set(8.5,0.95,7.5); dl.rotation.y=0.5; scene.add(dl)

      /* ── PLANTERS ─────────────────────────────────────────────── */
      ;[[5.5,0.42,8.2],[1.8,0.42,8.8],[-1.8,0.42,8.3]].forEach(([px,py,pz]) => {
        box(2.4, 0.58, 0.95, mats.soil, px, py, pz)
        /* Green planting surface */
        const gp = new THREE.Mesh(new THREE.PlaneGeometry(2.4,0.95), mats.moss)
        gp.rotation.x=-Math.PI/2; gp.position.set(px,py+0.32,pz); scene.add(gp)
      })

      /* ── PERIMETER WALLS ──────────────────────────────────────── */
      box(0.18, 0.70, 10.0, mats.stone, -15.0, 0.55, 5.0)
      box(0.18, 0.70, 10.0, mats.stone,  13.5, 0.55, 5.0)

      /* ── LIGHTING RIG ─────────────────────────────────────────── */
      /* Key: warm late-afternoon sun from upper right */
      const key = new THREE.DirectionalLight(0xFFF2DC, 2.0)
      key.position.set(20,25,18); key.castShadow=true
      key.shadow.mapSize.set(4096,4096)
      key.shadow.camera.left=-40; key.shadow.camera.right=40
      key.shadow.camera.top= 35; key.shadow.camera.bottom=-28
      key.shadow.camera.far= 100; key.shadow.bias=-0.0005
      key.shadow.normalBias=0.015
      scene.add(key)
      /* Cool sky fill — defines shadow faces */
      const fill=new THREE.DirectionalLight(0xD5E8F5,0.50)
      fill.position.set(-20,12,8); scene.add(fill)
      /* Rim — back warm light wraps secondary volume */
      const rim=new THREE.DirectionalLight(0xFFE4C0,0.65)
      rim.position.set(8,16,-25); scene.add(rim)
      /* Soft ambient */
      scene.add(new THREE.AmbientLight(0xF2EDE6,0.48))
      /* Sky/ground hemisphere */
      scene.add(new THREE.HemisphereLight(0xFFF8F0,0xD4CEC8,0.25))
      /* Underside fill (simulates AO under box) */
      scene.add(Object.assign(new THREE.PointLight(0xF0EAE0,0.30,14),
        { position: new THREE.Vector3(2,1.6,0) }))

      /* ── Camera system ───────────────────────────────────────── */
      const lerp=(a:number,b:number,t:number)=>a+(b-a)*t
      const cam={x:p0.pos[0],y:p0.pos[1],z:p0.pos[2],
                 lx:p0.look[0],ly:p0.look[1],lz:p0.look[2]}
      const snap=(c:number,t:number)=>{const d=t-c;return Math.abs(d)<SNAP?t:c+d*LERP}

      function animate(){
        rafId=requestAnimationFrame(animate)
        const p=Math.round(Math.max(0,Math.min(1,progressRef.current))*1000)/1000
        const N=CAM_STOPS.length,fp=p*(N-1)
        const i0=Math.floor(fp),i1=Math.min(i0+1,N-1),tt=fp-i0
        const e=tt<0.5?2*tt*tt:1-2*(1-tt)*(1-tt)
        const a=CAM_STOPS[i0],b=CAM_STOPS[i1]
        cam.x =lerp(a.pos[0],b.pos[0],e); cam.y =lerp(a.pos[1],b.pos[1],e)
        cam.z =lerp(a.pos[2],b.pos[2],e); cam.lx=lerp(a.look[0],b.look[0],e)
        cam.ly=lerp(a.look[1],b.look[1],e); cam.lz=lerp(a.look[2],b.look[2],e)
        camera.position.x=snap(camera.position.x,cam.x)
        camera.position.y=snap(camera.position.y,cam.y)
        camera.position.z=snap(camera.position.z,cam.z)
        camera.lookAt(cam.lx,cam.ly,cam.lz)
        renderer.render(scene,camera)
      }
      animate()

      function onResize(){
        const nW=mount!.clientWidth,nH=mount!.clientHeight
        camera.aspect=nW/nH; camera.updateProjectionMatrix()
        renderer.setSize(nW,nH); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
      }
      window.addEventListener('resize',onResize)

      ;(mount as any)._cleanup3D=()=>{
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize',onResize)
        renderer.dispose()
        if(mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return ()=>{;(mount as any)._cleanup3D?.()}
  },[progressRef])

  return <div ref={mountRef} style={{width:'100%',height:'100%'}} aria-hidden="true"/>
}
