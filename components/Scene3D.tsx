'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — "Casa Horizonte"
  ──────────────────────────
  Architectural sketch of a modernist villa in the tradition of
  Mies van der Rohe × Tadao Ando × Brazilian modernism.

  Rendering: proven toon shader + selective ink edge lines.
  • World-space flat normals → crisp 4-step toon shading
  • EdgesGeometry LineSegments on each structural element
  • Black ink lines, pure white background
  • Result: hand-drawn architectural section perspective

  Building: asymmetric composition
  • Long elevated glass pavilion on pilotis (Farnsworth DNA)
  • Dramatic cantilevering left terrace
  • Taller solid secondary tower (right, perpendicular)
  • Ceremonial entry: reflecting pool → stepping stone path → stair
  • Entry canopy, pendant lights, corten sculptures
*/

const LERP = 0.10
const SNAP = 0.001

const CAM_STOPS = [
  { pos: [24, 10, 26], look: [4, 3.5,  0] }, /* three-quarter front    */
  { pos: [ 0,  4, 20], look: [0, 3.0,  3] }, /* zoom — entrance        */
  { pos: [26,  6,  8], look: [15,4.0,  0] }, /* right — tower          */
  { pos: [12, 22, 22], look: [4, 2.0,  0] }, /* aerial                 */
  { pos: [-16, 7, 18], look: [-3,3.0,  0] }, /* left — terrace         */
  { pos: [ 4, 32, 0.5],look: [4, 0.0,  0] }, /* top-down plan          */
]

/* World-space toon vertex shader */
const VERT = /* glsl */`
  varying vec3 vWorldNormal;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position  = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0);
  }
`
/* 4-step toon — strong contrast for sketch depth */
const TOON_FRAG = /* glsl */`
  uniform vec3 uLight;
  varying vec3 vWorldNormal;
  void main() {
    float d = max(dot(normalize(vWorldNormal), uLight), 0.0);
    vec3 c;
    if      (d > 0.62) c = vec3(1.00);
    else if (d > 0.38) c = vec3(0.87);
    else if (d > 0.12) c = vec3(0.64);
    else               c = vec3(0.40);
    gl_FragColor = vec4(c, 1.0);
  }
`
/* Dark architectural elements (columns, frames, door) */
const DARK_FRAG = /* glsl */`
  uniform vec3 uLight;
  varying vec3 vWorldNormal;
  void main() {
    float d = max(dot(normalize(vWorldNormal), uLight), 0.0);
    vec3 c;
    if (d > 0.55) c = vec3(0.22);
    else if (d > 0.25) c = vec3(0.14);
    else c = vec3(0.06);
    gl_FragColor = vec4(c, 1.0);
  }
`
/* Glass — translucent pale blue */
const GLASS_FRAG = /* glsl */`
  void main() { gl_FragColor = vec4(0.76, 0.87, 0.90, 0.38); }
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

      const W   = mount.clientWidth  || window.innerWidth
      const H   = mount.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 2)

      /* ── Renderer ─────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0xffffff, 1)
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xffffff)

      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 500)
      const p0 = CAM_STOPS[0]
      camera.position.set(p0.pos[0], p0.pos[1], p0.pos[2])
      camera.lookAt(p0.look[0], p0.look[1], p0.look[2])

      /* ── Shared materials ─────────────────────────────────────── */
      const uLight = new THREE.Vector3(0.55, 1.0, 0.75).normalize()

      const toonMat = new THREE.ShaderMaterial({
        uniforms:       { uLight: { value: uLight } },
        vertexShader:   VERT,
        fragmentShader: TOON_FRAG,
        side: THREE.FrontSide,
      })
      const darkMat = new THREE.ShaderMaterial({
        uniforms:       { uLight: { value: uLight } },
        vertexShader:   VERT,
        fragmentShader: DARK_FRAG,
        side: THREE.FrontSide,
      })
      const glassMat = new THREE.ShaderMaterial({
        vertexShader: `void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: GLASS_FRAG,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const inkMat = new THREE.LineBasicMaterial({ color: 0x0a0a0a })

      /* ── Helpers ──────────────────────────────────────────────── */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function solid(geo: any, mat: any = toonMat, angle = 18) {
        const g = new THREE.Group()
        g.add(new THREE.Mesh(geo, mat))
        const e = new THREE.EdgesGeometry(geo, angle)
        g.add(new THREE.LineSegments(e, inkMat))
        return g
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function at(o: any, x: number, y: number, z: number) {
        o.position.set(x, y, z); scene.add(o); return o
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function rot(o: any, rx: number, ry: number, rz: number) {
        o.rotation.set(rx, ry, rz); return o
      }
      function box(w: number, h: number, d: number, mat: any = toonMat, angle = 18) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return solid(new THREE.BoxGeometry(w, h, d), mat as any, angle)
      }
      function cyl(r: number, h: number, mat: any = darkMat, segs = 8) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return solid(new THREE.CylinderGeometry(r, r, h, segs), mat as any, 15)
      }

      /* ── GROUND PLANE ─────────────────────────────────────────── */
      at(box(80, 0.06, 60, toonMat, 5), 0, -0.03, -5)
      /* Raised paving forecourt */
      at(box(30, 0.20, 20, toonMat, 10), 1, 0.10, 0)

      /* ── REFLECTING POOL ──────────────────────────────────────── */
      at(box(10.0, 0.28, 6.2, toonMat, 10), -7.5, 0.14, 3.0)
      /* Water surface — dark toned */
      at(solid(new THREE.PlaneGeometry(9.2, 5.4), darkMat, 5)
        .rotateX(-Math.PI/2), -7.5, 0.30, 3.0)

      /* ── STEPPING STONE PATH — entry axis ────────────────────── */
      ;[-5.5,-4.0,-2.5,-1.0].forEach(x =>
        at(box(0.9, 0.08, 0.9, toonMat, 10), x, 0.24, 6.0)
      )

      /* ── PILOTIS (12 slender columns) ────────────────────────── */
      const EL = 1.85  /* elevation of main floor */
      ;[-6.5,-3.5,-0.5,2.5,5.5,8.5].forEach(x =>
        [-4.2,4.2].forEach(z =>
          at(cyl(0.11, EL, darkMat, 8), x, EL/2, z)
        )
      )

      /* ── FLOOR + CEILING PLATES ───────────────────────────────── */
      at(box(22.0, 0.24, 10.0, toonMat, 8), 1.0, EL, 0)         /* floor */
      at(box(15.0, 0.18, 10.0, toonMat, 8), 4.0, EL+4.80, 0)    /* ceiling */

      /* ── MAIN PAVILION WALLS ──────────────────────────────────── */
      at(box(15.2, 4.8, 0.24, toonMat), 4.0, EL+2.40, -5.2)  /* back wall     */
      at(box(0.24, 4.8, 10.2, toonMat),-3.5, EL+2.40,  0)    /* left end wall */
      at(box(0.24, 4.8, 10.2, toonMat),11.6, EL+2.40,  0)    /* right end wall*/
      /* Interior dividing wall — visible through glass */
      at(box(0.18, 4.0, 9.8, toonMat), 2.0, EL+2.20, 0)

      /* ── CURTAIN WALL (full-height glass, front face) ─────────── */
      at(new THREE.Mesh(new THREE.BoxGeometry(15.2,4.80,0.10), glassMat),
        4.0, EL+2.40, 5.24)
      /* Vertical mullions (8 bays) */
      for (let i=0; i<=7; i++)
        at(box(0.06,4.80,0.12,darkMat,5), -3.5+i*(15/7), EL+2.40, 5.26)
      /* Horizontal transoms (3) */
      ;[EL+1.4, EL+2.8, EL+4.2].forEach(y =>
        at(box(15.2,0.06,0.12,darkMat,5), 4.0, y, 5.26)
      )

      /* ── ENTRANCE DOOR — glass + dark frame, near stair ───────── */
      /* Glass panel in leftmost bay */
      at(new THREE.Mesh(new THREE.BoxGeometry(1.55,2.70,0.10), glassMat),
        -2.65, EL+1.37, 5.28)
      /* Aluminium frame — 4 sides */
      at(box(0.06,2.78,0.12,darkMat,5), -3.48, EL+1.37, 5.29)  /* left  */
      at(box(0.06,2.78,0.12,darkMat,5), -1.82, EL+1.37, 5.29)  /* right */
      at(box(1.68,0.06,0.12,darkMat,5), -2.65, EL+2.74, 5.29)  /* top   */
      at(box(1.68,0.06,0.12,darkMat,5), -2.65, EL+0.00, 5.29)  /* sill  */
      at(box(1.55,0.05,0.10,darkMat,5), -2.65, EL+1.05, 5.29)  /* mid   */
      /* Bronze push-bar handle */
      at(box(0.05,0.42,0.05,darkMat), -1.88, EL+1.38, 5.36)
      at(box(0.22,0.05,0.05,darkMat), -1.88, EL+1.58, 5.36)

      /* ── PENDANT LIGHTS (inside, torus rings) ─────────────────── */
      ;[[0,0.3],[2.5,-0.2],[5,0.4],[7.5,-0.3],[10,0.1]].forEach(([px,pz],i) => {
        const drop = 1.2+[0.6,0.3,0.8,0.1,0.5][i]
        const ry   = EL+4.80-drop
        at(cyl(0.015, drop, darkMat, 4), px, EL+4.80-drop/2, pz)
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.22,0.04,8,24), toonMat)
        ring.position.set(px,ry,pz); ring.rotation.x=Math.PI/2; scene.add(ring)
        const re = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.TorusGeometry(0.22,0.04,8,24),10), inkMat)
        re.position.set(px,ry,pz); re.rotation.x=Math.PI/2; scene.add(re)
      })

      /* ── LEFT TERRACE (open deck, elevated, asymmetric extend) ── */
      at(box(7.0, 0.22, 10.2, toonMat, 8), -7.0, EL, 0)
      /* Perimeter rail — top bar only */
      at(box(7.0,0.06,0.06,darkMat), -7.0, EL+0.92,-5.20)
      at(box(7.0,0.06,0.06,darkMat), -7.0, EL+0.92, 5.20)
      at(box(0.06,0.58,10.2,darkMat),-10.6,EL+0.64, 0)
      /* Rail posts — vertical spacing */
      for (let i=0;i<=7;i++) {
        at(box(0.05,0.56,0.05,darkMat),-10.55+i*0.4, EL+0.62,-5.20)
        at(box(0.05,0.56,0.05,darkMat),-10.55+i*0.4, EL+0.62, 5.20)
      }

      /* ── EXTERIOR STAIRCASE ───────────────────────────────────── */
      /* Side wall */
      at(box(0.14,EL+0.4,4.2,darkMat,10), -6.4, (EL+0.4)/2, 5.9)
      /* 6 treads ascending toward building (i=0 far+low, i=5 near+high) */
      for (let i=0;i<6;i++) {
        at(box(1.90,0.16,0.65,toonMat), -5.4, 0.28+i*0.30, 7.60-i*0.65)
        /* Tread nose */
        at(box(1.90,0.04,0.06,darkMat), -5.4, 0.20+i*0.30, 7.93-i*0.65)
      }
      /* Landing slab at top */
      at(box(1.90,0.22,0.95,toonMat), -5.4, EL+0.04, 4.50)

      /* ── ENTRY CANOPY (thin projecting slab over door) ─────────── */
      at(box(5.2,0.14,3.0,toonMat,8), -3.4, EL+3.85, 6.0)
      /* Two slim support columns */
      at(cyl(0.07,EL+3.75,darkMat,6), -1.5, (EL+3.75)/2, 7.3)
      at(cyl(0.07,EL+3.75,darkMat,6), -5.2, (EL+3.75)/2, 7.3)

      /* ── SECONDARY TOWER (right, perpendicular, taller) ─────────
         Inspired by Tadao Ando — solid concrete forms, slot windows  */
      const TH = 7.2   /* tower height */
      ;[[11.7,TH/2,0],[17.7,TH/2,0]].forEach(([x,y,z]) =>
        at(box(0.24,TH,13.5,toonMat,10),x,y,z)
      )
      at(box(6.24, TH, 0.24, toonMat, 10), 14.7, TH/2,-7.0)  /* back  */
      at(box(6.24, 0.24, 13.5, toonMat, 8), 14.7, TH+0.14, 0)/* roof  */
      at(box(6.24, 1.40, 0.24, toonMat), 14.7, 2.6, 7.0)      /* base sill */

      /* Vertical slot windows — 4 deep reveals on front face */
      ;[-1.5, 0.5, 2.5].forEach(wx =>
        at(new THREE.Mesh(new THREE.BoxGeometry(0.8,2.8,0.12),glassMat),
          14.7+wx, TH*0.55, 7.16)
      )
      ;[-1.5, 0.5, 2.5].forEach(wx => {
        ;[[-0.43,2.8,0.16],[ 0.43,2.8,0.16]].forEach(([dx,h,d]) =>
          at(box(0.06,h,d,darkMat,5), 14.7+wx+dx, TH*0.55, 7.18)
        )
        at(box(0.88,0.06,0.16,darkMat,5),14.7+wx,TH*0.55+1.4,7.18)
        at(box(0.88,0.06,0.16,darkMat,5),14.7+wx,TH*0.55-1.4,7.18)
      })

      /* Horizontal fin shading — 8 cream louvres on tower front */
      for (let i=0;i<8;i++)
        rot(at(box(6.0,0.10,0.95,toonMat),14.7,TH-0.5-i*0.62,7.5),
          -0.18,0,0)

      /* Tower secondary roof + parapet */
      ;[[11.5,TH+0.42,0,0.20,0.42,13.8],[17.9,TH+0.42,0,0.20,0.42,13.8],
        [14.7,TH+0.42,-7.2,6.6,0.42,0.20],[14.7,TH+0.42,7.2,6.6,0.42,0.20]
      ].forEach(([x,y,z,w,h,d]) => at(box(w,h,d,darkMat),x,y,z))

      /* ── BRIDGE — connects main box to tower ─────────────────── */
      at(box(2.0,0.22,9.8,toonMat,8), 10.8, EL, 0)  /* bridge deck     */
      at(box(2.0,0.14,9.8,darkMat,8), 10.8, EL+4.40, 0) /* bridge soffit  */

      /* ── MAIN ROOF (asymmetric cantilever) ───────────────────── */
      at(box(24.0,0.36,11.8,toonMat,8),  0.5, EL+5.10, 0)  /* slab */
      /* Fascia — slim dark frame */
      ;[[0.5,EL+4.92,-6.2,24.0,0.28,0.24],[0.5,EL+4.92,6.2,24.0,0.28,0.24],
        [-9.6,EL+4.92,0,0.24,0.28,11.8],[10.7,EL+4.92,0,0.24,0.28,11.8]
      ].forEach(([x,y,z,w,h,d]) => at(box(w,h,d,darkMat),x,y,z))
      /* Soffit lines — 8 explicit horizontal line segments */
      for (let i=0;i<9;i++) {
        const sz = -5.8+i*1.46
        const sg = new THREE.BufferGeometry()
        sg.setAttribute('position', new THREE.BufferAttribute(
          new Float32Array([-9.5,EL+4.96,sz, 10.6,EL+4.96,sz]),3))
        scene.add(new THREE.LineSegments(sg,inkMat))
      }
      /* Skylight strip */
      at(solid(new THREE.BoxGeometry(7,0.14,1.5),darkMat,5), 4, EL+5.28,-0.6)

      /* ── SCULPTURES & SITE ART ────────────────────────────────── */
      /* Tall corten monolith — left of entry path */
      at(box(0.30,3.60,0.75,darkMat,12), -4.5, 1.80, 8.5)
      /* Horizontal corten slab on ground */
      at(box(0.26,1.80,0.60,darkMat,12), -2.8, 0.90, 9.2)
      /* Brass disk on slim pedestal — right forecourt */
      at(box(0.38,0.92,0.38,darkMat), 9.5, 0.46, 8.0)
      const disk = solid(new THREE.CylinderGeometry(0.58,0.58,0.10,40),toonMat,15)
      disk.rotation.y=0.6; at(disk, 9.5, 0.97, 8.0)

      /* ── PLANTERS ─────────────────────────────────────────────── */
      ;[[6.5,0.38,8.8],[2.5,0.38,9.4],[-1.0,0.38,8.8]].forEach(([px,py,pz]) => {
        at(box(2.4,0.55,0.90,toonMat), px, py, pz)
        /* Planting grid */
        const pg = new THREE.BufferGeometry()
        const pts: number[] = []
        ;[-0.25,0,0.25].forEach(dz => pts.push(px-1.1,py+0.30,pz+dz,px+1.1,py+0.30,pz+dz))
        pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts),3))
        scene.add(new THREE.LineSegments(pg,inkMat))
      })

      /* ── PERIMETER WALLS ──────────────────────────────────────── */
      at(box(0.18,0.75,12.0,toonMat,10),-15.5,0.55,4.5)
      at(box(0.18,0.75,12.0,toonMat,10), 14.5,0.55,4.5)

      /* ── CAMERA SYSTEM ────────────────────────────────────────── */
      const lerp=(a:number,b:number,t:number)=>a+(b-a)*t
      const cam={x:p0.pos[0],y:p0.pos[1],z:p0.pos[2],
                 lx:p0.look[0],ly:p0.look[1],lz:p0.look[2]}
      const snap=(c:number,t:number)=>{
        const d=t-c; return Math.abs(d)<SNAP?t:c+d*LERP
      }

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
        renderer.setSize(nW,nH)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
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
