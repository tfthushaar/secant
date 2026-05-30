'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — clean white-wall + black-edge architectural model
  ────────────────────────────────────────────────────────────
  • Pure white background (#ffffff), model surfaces: MeshBasicMaterial
    white → walls disappear against background, edges carry all depth.
    Tiny ambient-only light is added as a fallback for GPUs that need it.
  • Black LineSegments2 edges (linewidth 0.5 px, screen-accurate).
  • Model scale 8.0 (fills viewport, pulled slightly downward so it sits
    below the SECANT wordmark at the top of the hero).
  • 5 camera presets, scroll-driven via progressRef.
*/

/*
  Six camera positions tuned to the landing page content sections.
  Progress 0→1 spreads across 5 × 100vh of content (500vh total).
  Each stop corresponds roughly to one content section.

  0 — front elevation     (hero section)
  1 — zoom-in close       (manifesto — camera moves in as text appears left)
  2 — three-quarter right (stats — model swings right, text sits left)
  3 — aerial three-quarter (services — elevated, overview feeling)
  4 — three-quarter left  (contact — symmetrical, draws eye right)
  5 — top-down plan       (final — contemplative, architectural plan view)
*/
const CAM_STOPS = [
  { pos: [ 0,    4.0, 11.5], look: [0, 1.5, 0] },  /* 0 — front elevation      */
  { pos: [ 0,    3.0,  7.5], look: [0, 2.5, 0] },  /* 1 — zoom in, slight up   */
  { pos: [ 8.5,  4.5,  8.5], look: [0, 1.2, 0] },  /* 2 — three-quarter right  */
  { pos: [ 7.0, 10.5,  5.0], look: [0, 0.2, 0] },  /* 3 — aerial right         */
  { pos: [-7.5,  4.5,  9.0], look: [0, 1.2, 0] },  /* 4 — three-quarter left   */
  { pos: [ 0.5, 14.0,  0.5], look: [0, 0.0, 0] },  /* 5 — top-down plan        */
]

interface Props { progressRef: React.MutableRefObject<number> }

export function Scene3D({ progressRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let rafId = 0
    let idleTimer = 0

    ;(async () => {
      const THREE = await import('three')
      const { LineSegments2 }       = await import('three/addons/lines/LineSegments2.js')
      const { LineSegmentsGeometry }= await import('three/addons/lines/LineSegmentsGeometry.js')
      const { LineMaterial }        = await import('three/addons/lines/LineMaterial.js')
      const { GLTFLoader }   = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader }  = await import('three/examples/jsm/loaders/DRACOLoader.js')
      const { OrbitControls }= await import('three/examples/jsm/controls/OrbitControls.js')
      const { mergeVertices }= await import('three/addons/utils/BufferGeometryUtils.js')

      const W = mount.clientWidth || window.innerWidth
      const H = mount.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 2)

      /* ── Renderer — pure white ────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0xffffff, 1)   /* pure white */
      renderer.shadowMap.enabled = false
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xffffff)

      /* Minimal ambient — just enough so MeshBasicMaterial-white is visible */
      scene.add(new THREE.AmbientLight(0xffffff, 1))

      /* ── Camera ────────────────────────────────────────────────── */
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000)
      const p0 = CAM_STOPS[0].pos, l0 = CAM_STOPS[0].look
      camera.position.set(p0[0], p0[1], p0[2])
      camera.lookAt(l0[0], l0[1], l0[2])
      const camTarget = { x:p0[0],y:p0[1],z:p0[2], lx:l0[0],ly:l0[1],lz:l0[2] }

      /* ── OrbitControls ─────────────────────────────────────────── */
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true; controls.dampingFactor = 0.06
      controls.enabled = false
      let userInteracting = false
      renderer.domElement.addEventListener('pointerdown', () => {
        userInteracting = true; controls.enabled = true; clearTimeout(idleTimer)
      })
      renderer.domElement.addEventListener('pointerup', () => {
        idleTimer = window.setTimeout(() => {
          userInteracting = false; controls.enabled = false
        }, 2000) as unknown as number
      })

      /* ── Edge material ─────────────────────────────────────────── */
      const lineMat = new LineMaterial({
        color: 0x000000,
        linewidth: 1.5,
        resolution: new THREE.Vector2(W * dpr, H * dpr),
        dashed: false,
      })

      /* ── Load GLB ──────────────────────────────────────────────── */
      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      const loader = new GLTFLoader(); loader.setDRACOLoader(draco)

      loader.load('/assets/base.glb', (gltf) => {
        const model = gltf.scene
        scene.add(model)

        /* ── Fit & position — big model that fills hero below SECANT ── */
        const box    = new THREE.Box3().setFromObject(model)
        const centre = box.getCenter(new THREE.Vector3())
        const size   = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale  = 10.0 / maxDim  /* larger — fills more of the hero */

        model.position.sub(centre)
        model.scale.setScalar(scale)

        /* Pull model down so it clears the SECANT wordmark at top */
        model.position.y -= size.y * scale * 0.35

        model.updateMatrixWorld(true)

        /*
          Keywords that identify organic / landscape meshes in the GLB.
          These meshes render as flat white (invisible against background)
          but produce NO edge lines — eliminating rock dots, tree noise etc.
        */
        const ORGANIC_KEYS = [
          'tree', 'palm', 'plant', 'bush', 'shrub', 'flower', 'grass',
          'rock', 'stone', 'boulder', 'pebble', 'gravel',
          'leaf', 'leaves', 'foliage', 'vegetation', 'nature',
          'landscape', 'terrain', 'ground_cover', 'topogr',
          'bench', 'furniture', 'chair', 'table', 'lamp', 'light',
          'car', 'vehicle', 'human', 'person', 'figure',
        ]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function isOrganic(mesh: any): boolean {
          const n = ((mesh.name ?? '') + ' ' + (mesh.parent?.name ?? '')).toLowerCase()
          /* High vertex density in a small bounding box → likely organic prop */
          const box = new THREE.Box3().setFromObject(mesh)
          const vol = box.getSize(new THREE.Vector3())
          const vol3 = vol.x * vol.y * vol.z
          const density = (mesh.geometry?.attributes?.position?.count ?? 0) / Math.max(vol3, 0.001)
          const highDensity = density > 8000  /* architectural walls are low-density */
          return ORGANIC_KEYS.some(k => n.includes(k)) || highDensity
        }

        model.traverse((obj) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mesh = obj as any
          if (!mesh.isMesh) return

          /* All meshes: flat white so they read as solid walls */
          mesh.material = new THREE.MeshBasicMaterial({
            color: 0xffffff, side: THREE.FrontSide,
          })
          mesh.castShadow    = false
          mesh.receiveShadow = false

          /* Organic / landscape meshes: white silhouette only, no edges */
          if (isOrganic(mesh)) return

          /* ── Architectural edges only ───────────────────────────── */
          const worldGeo = mesh.geometry.clone()
          worldGeo.applyMatrix4(mesh.matrixWorld)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let cleanGeo: any
          try { cleanGeo = mergeVertices(worldGeo, 1e-4) }
          catch { cleanGeo = worldGeo }

          /*
            65° crease: only show edges where adjacent faces meet at angle > 65°.
            This keeps hard architectural corners (walls, roofs, slabs = 90°)
            while eliminating surface texture from any remaining organic geometry.
          */
          const edges = new THREE.EdgesGeometry(cleanGeo, 65)
          if (edges.attributes.position.count === 0) return

          const linesGeo = new LineSegmentsGeometry()
          linesGeo.setPositions(Array.from(edges.attributes.position.array as Float32Array))

          const lineSegs = new LineSegments2(linesGeo, lineMat)
          lineSegs.computeLineDistances()
          scene.add(lineSegs)
        })
      }, undefined, (e) => console.error('GLB error:', e))

      /* ── Animate ───────────────────────────────────────────────── */
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t

      function animate() {
        rafId = requestAnimationFrame(animate)

        if (!userInteracting) {
          const p  = Math.max(0, Math.min(1, progressRef.current))
          const fp = p * (CAM_STOPS.length - 1)
          const i0 = Math.floor(fp), i1 = Math.min(i0 + 1, CAM_STOPS.length - 1)
          const t  = fp - i0
          const ease = t < 0.5 ? 2*t*t : 1 - 2*(1-t)*(1-t)

          const a = CAM_STOPS[i0], b = CAM_STOPS[i1]
          camTarget.x  = lerp(a.pos[0],  b.pos[0],  ease)
          camTarget.y  = lerp(a.pos[1],  b.pos[1],  ease)
          camTarget.z  = lerp(a.pos[2],  b.pos[2],  ease)
          camTarget.lx = lerp(a.look[0], b.look[0], ease)
          camTarget.ly = lerp(a.look[1], b.look[1], ease)
          camTarget.lz = lerp(a.look[2], b.look[2], ease)

          camera.position.x += (camTarget.x - camera.position.x) * 0.04
          camera.position.y += (camTarget.y - camera.position.y) * 0.04
          camera.position.z += (camTarget.z - camera.position.z) * 0.04
          camera.lookAt(camTarget.lx, camTarget.ly, camTarget.lz)
        }

        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      /* ── Resize ─────────────────────────────────────────────────── */
      function onResize() {
        const nW = mount!.clientWidth, nH = mount!.clientHeight
        const nDPR = Math.min(window.devicePixelRatio, 2)
        camera.aspect = nW / nH; camera.updateProjectionMatrix()
        renderer.setSize(nW, nH); renderer.setPixelRatio(nDPR)
        lineMat.resolution.set(nW * nDPR, nH * nDPR)
      }
      window.addEventListener('resize', onResize)

      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId); clearTimeout(idleTimer)
        window.removeEventListener('resize', onResize)
        controls.dispose(); renderer.dispose()
        if (mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [progressRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />
}
