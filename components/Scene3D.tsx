'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — architectural wireframe viewer
  ──────────────────────────────────────────────────────────────────────────
  Rendering strategy
  • EdgesGeometry (crease 20°) → LineSegmentsGeometry → LineSegments2
  • LineMaterial with linewidth 0.6 px — renders crisp anti-aliased lines
    at any screen density (WebGL canvas ignores LineBasicMaterial linewidth
    above 1px on most GPUs; LineMaterial / Line2 bypass that limitation)
  • mergeVertices() before edge detection → removes duplicate vertices so
    edge detection is clean and lines are not jagged
  • Color 0x000000, background #ffffff — sketch-came-to-life aesthetic
  • Zero lights, zero shadows, zero PBR materials

  Camera
  • Five presets visited sequentially as the user scrolls through the
    pinned hero section (progressRef 0 → 1)
  • Smooth lerp 0.04 per frame between current position and target
  • OrbitControls available for manual grab; re-enable after 2 s idle
──────────────────────────────────────────────────────────────────────────
*/

const CAM_STOPS = [
  { pos: [0,    1.5, 6.5], look: [0, 0.8, 0] },  /* front elevation          */
  { pos: [3.5,  2.0, 5.5], look: [0, 0.8, 0] },  /* three-quarter entry      */
  { pos: [5.2,  2.0, 1.2], look: [0, 0.8, 0] },  /* side elevation           */
  { pos: [3.0,  5.0, 3.5], look: [0, 0.4, 0] },  /* aerial three-quarter     */
  { pos: [0.5,  6.0, 0.5], look: [0, 0.0, 0] },  /* plan / top-down          */
]

interface Props {
  progressRef: React.MutableRefObject<number>
}

export function Scene3D({ progressRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let rafId = 0
    let idleTimer = 0

    ;(async () => {
      /* ── Imports ────────────────────────────────────────────────── */
      const THREE = await import('three')

      /* Line2 addon — true-width lines independent of WebGL line limit */
      const { LineSegments2 }      = await import('three/addons/lines/LineSegments2.js')
      const { LineSegmentsGeometry }= await import('three/addons/lines/LineSegmentsGeometry.js')
      const { LineMaterial }       = await import('three/addons/lines/LineMaterial.js')

      const { GLTFLoader }   = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader }  = await import('three/examples/jsm/loaders/DRACOLoader.js')
      const { OrbitControls }= await import('three/examples/jsm/controls/OrbitControls.js')
      const { mergeVertices }= await import('three/addons/utils/BufferGeometryUtils.js')

      const W   = mount.clientWidth  || window.innerWidth
      const H   = mount.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 2)

      /* ── Renderer ─────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0xffffff, 1)
      renderer.shadowMap.enabled = false
      mount.appendChild(renderer.domElement)

      /* ── Scene — pure white, no fog, no lights ─────────────────── */
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xffffff)

      /* ── Camera ────────────────────────────────────────────────── */
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000)
      const [p0, l0] = [CAM_STOPS[0].pos, CAM_STOPS[0].look]
      camera.position.set(p0[0], p0[1], p0[2])
      camera.lookAt(l0[0], l0[1], l0[2])

      /* Smooth-lerp targets — updated from scroll progress */
      const camTarget = { x: p0[0], y: p0[1], z: p0[2],
                          lx: l0[0], ly: l0[1], lz: l0[2] }

      /* ── OrbitControls (manual grab overrides scroll camera) ──── */
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping    = true
      controls.dampingFactor    = 0.06
      controls.enablePan        = true
      controls.enableZoom       = true
      controls.enabled          = false   /* scroll drives by default */

      let userInteracting = false
      renderer.domElement.addEventListener('pointerdown', () => {
        userInteracting  = true
        controls.enabled = true
        clearTimeout(idleTimer)
      })
      renderer.domElement.addEventListener('pointerup', () => {
        idleTimer = window.setTimeout(() => {
          userInteracting  = false
          controls.enabled = false
        }, 2000) as unknown as number
      })

      /* ── Line material — anti-aliased, true linewidth ─────────── */
      const lineMat = new LineMaterial({
        color:     0x000000,
        linewidth: 0.6,                              /* screen pixels */
        resolution:new THREE.Vector2(W * dpr, H * dpr),
        dashed:    false,
      })

      /* ── Load GLB ──────────────────────────────────────────────── */
      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      const loader = new GLTFLoader()
      loader.setDRACOLoader(draco)

      loader.load('/assets/base.glb', (gltf) => {
        const model = gltf.scene

        /* ── Fit model to viewport ──────────────────────────────── */
        scene.add(model)
        const box    = new THREE.Box3().setFromObject(model)
        const centre = box.getCenter(new THREE.Vector3())
        const size   = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale  = 4.0 / maxDim

        model.position.sub(centre)         /* move to origin          */
        model.scale.setScalar(scale)       /* normalise to 4 units    */
        model.updateMatrixWorld(true)      /* bake transforms         */

        /* ── Build edge wireframe ───────────────────────────────── */
        model.traverse((obj) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mesh = obj as any
          if (!mesh.isMesh) return

          /* Hide original filled mesh */
          mesh.visible = false

          /* ── World-space geometry ──────────────────────────────
             Apply the mesh's full world matrix so the edge segments
             sit at the correct position even for deeply nested nodes  */
          const worldGeo = mesh.geometry.clone()
          worldGeo.applyMatrix4(mesh.matrixWorld)

          /* mergeVertices removes duplicate verts → cleaner edges   */
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let cleanGeo: any
          try {
            cleanGeo = mergeVertices(worldGeo, 1e-4)
          } catch {
            cleanGeo = worldGeo
          }

          /* ── EdgesGeometry (crease 20°) ────────────────────────
             Only edges where adjacent face normals differ by > 20°.
             This retains architectural silhouettes while suppressing
             triangle mesh noise inside flat surfaces.                 */
          const edges = new THREE.EdgesGeometry(cleanGeo, 20)

          /* ── LineSegmentsGeometry from edge positions ──────────
             Each consecutive pair of vertices in EdgesGeometry is one
             edge segment — exactly the format LineSegmentsGeometry
             expects from setPositions().                              */
          const linesGeo = new LineSegmentsGeometry()
          linesGeo.setPositions(
            Array.from(edges.attributes.position.array as Float32Array)
          )

          const lineSegs = new LineSegments2(linesGeo, lineMat)
          lineSegs.computeLineDistances()
          scene.add(lineSegs)   /* already in world space — no extra transform */
        })
      },
      undefined,
      (err) => console.error('GLB error:', err))

      /* ── Animate ───────────────────────────────────────────────── */
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t

      function animate() {
        rafId = requestAnimationFrame(animate)

        if (!userInteracting) {
          /* Map scroll progress 0→1 across the 5 camera stops */
          const p   = Math.max(0, Math.min(1, progressRef.current))
          const fp  = p * (CAM_STOPS.length - 1)
          const i0  = Math.floor(fp)
          const i1  = Math.min(i0 + 1, CAM_STOPS.length - 1)
          const t   = fp - i0
          const ease = t < 0.5 ? 2*t*t : 1 - 2*(1-t)*(1-t)

          const a = CAM_STOPS[i0], b = CAM_STOPS[i1]
          camTarget.x  = lerp(a.pos[0],  b.pos[0],  ease)
          camTarget.y  = lerp(a.pos[1],  b.pos[1],  ease)
          camTarget.z  = lerp(a.pos[2],  b.pos[2],  ease)
          camTarget.lx = lerp(a.look[0], b.look[0], ease)
          camTarget.ly = lerp(a.look[1], b.look[1], ease)
          camTarget.lz = lerp(a.look[2], b.look[2], ease)

          /* Smooth follow — camera glides to target */
          camera.position.x += (camTarget.x - camera.position.x) * 0.04
          camera.position.y += (camTarget.y - camera.position.y) * 0.04
          camera.position.z += (camTarget.z - camera.position.z) * 0.04

          camera.lookAt(camTarget.lx, camTarget.ly, camTarget.lz)
        }

        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      /* ── Resize ────────────────────────────────────────────────── */
      function onResize() {
        const nW  = mount!.clientWidth
        const nH  = mount!.clientHeight
        const nDPR= Math.min(window.devicePixelRatio, 2)
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
        renderer.setPixelRatio(nDPR)
        /* CRITICAL: update LineMaterial resolution on every resize */
        lineMat.resolution.set(nW * nDPR, nH * nDPR)
      }
      window.addEventListener('resize', onResize)

      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId)
        clearTimeout(idleTimer)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        renderer.dispose()
        if (mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [progressRef])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  )
}
