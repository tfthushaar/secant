'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — solid white architectural model + black edge lines
  ─────────────────────────────────────────────────────────────
  Rendering approach:
  • Meshes stay VISIBLE with flat white MeshPhongMaterial.
    A soft directional light + ambient gives just enough shading to
    read the 3D form (bright tops, slightly darker sides).
  • Black LineSegments2 edges overlay the surfaces for architectural
    line quality. LineMaterial linewidth 0.5 px (screen-accurate, GPU
    ignores LineBasicMaterial above 1px).
  • Background #f5f0e8 (warm off-white). No shadows, no PBR.
  • Model scaled to 6 units so it fills the viewport generously.
  • 5 camera presets, scroll-driven via progressRef.
*/

const CAM_STOPS = [
  { pos: [0,    2.5, 10.5], look: [0, 1.2, 0] },  /* front elevation          */
  { pos: [5.5,  3.0,  8.5], look: [0, 1.2, 0] },  /* three-quarter entry      */
  { pos: [8.0,  3.0,  2.0], look: [0, 1.2, 0] },  /* side elevation           */
  { pos: [4.5,  7.5,  5.5], look: [0, 0.8, 0] },  /* aerial three-quarter     */
  { pos: [0.5,  9.0,  0.5], look: [0, 0.0, 0] },  /* plan / top-down          */
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

      const W   = mount.clientWidth  || window.innerWidth
      const H   = mount.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 2)

      /* ── Renderer ─────────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0xf5f0e8, 1)   /* warm off-white — model pops */
      renderer.shadowMap.enabled = false
      mount.appendChild(renderer.domElement)

      /* ── Scene ────────────────────────────────────────────────────── */
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf5f0e8)

      /* ── Lighting — soft, enough to read 3D form, no drama ────────── */
      const ambient = new THREE.AmbientLight(0xffffff, 2.0)
      scene.add(ambient)
      const sun = new THREE.DirectionalLight(0xffffff, 1.2)
      sun.position.set(5, 10, 8)
      sun.castShadow = false
      scene.add(sun)
      const fill = new THREE.DirectionalLight(0xffffff, 0.4)
      fill.position.set(-4, 2, -4)
      scene.add(fill)

      /* ── Camera ────────────────────────────────────────────────────── */
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000)
      const p0 = CAM_STOPS[0].pos, l0 = CAM_STOPS[0].look
      camera.position.set(p0[0], p0[1], p0[2])
      camera.lookAt(l0[0], l0[1], l0[2])
      const camTarget = { x: p0[0], y: p0[1], z: p0[2],
                          lx: l0[0], ly: l0[1], lz: l0[2] }

      /* ── OrbitControls ─────────────────────────────────────────────── */
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

      /* ── Edge line material ────────────────────────────────────────── */
      const lineMat = new LineMaterial({
        color: 0x1a1a1a,
        linewidth: 0.5,
        resolution: new THREE.Vector2(W * dpr, H * dpr),
        dashed: false,
      })

      /* ── Load GLB ──────────────────────────────────────────────────── */
      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      const loader = new GLTFLoader(); loader.setDRACOLoader(draco)

      loader.load('/assets/base.glb', (gltf) => {
        const model = gltf.scene

        /* ── Fit model to fill the hero — scale = 6 units ──────────── */
        scene.add(model)
        const box    = new THREE.Box3().setFromObject(model)
        const centre = box.getCenter(new THREE.Vector3())
        const size   = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale  = 6.0 / maxDim   /* bigger than before — fills the canvas */

        model.position.sub(centre)
        model.scale.setScalar(scale)
        model.updateMatrixWorld(true)

        model.traverse((obj) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mesh = obj as any
          if (!mesh.isMesh) return

          /* ── Solid white surface — gives depth via directional light ─
             Meshes stay VISIBLE. Without this the model is transparent. */
          mesh.material = new THREE.MeshPhongMaterial({
            color:    0xfafafa,   /* near-white, light will shade it softly */
            specular: new THREE.Color(0x111111),
            shininess: 5,
            side: THREE.FrontSide,
          })
          mesh.castShadow    = false
          mesh.receiveShadow = false

          /* ── Black edge lines on top ────────────────────────────────
             World-space geometry so nested transforms are handled.      */
          const worldGeo = mesh.geometry.clone()
          worldGeo.applyMatrix4(mesh.matrixWorld)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let cleanGeo: any
          try { cleanGeo = mergeVertices(worldGeo, 1e-4) }
          catch { cleanGeo = worldGeo }

          const edges = new THREE.EdgesGeometry(cleanGeo, 20)
          const linesGeo = new LineSegmentsGeometry()
          linesGeo.setPositions(Array.from(edges.attributes.position.array as Float32Array))

          const lineSegs = new LineSegments2(linesGeo, lineMat)
          lineSegs.computeLineDistances()
          scene.add(lineSegs)
        })
      }, undefined, (e) => console.error('GLB error:', e))

      /* ── Animate ───────────────────────────────────────────────────── */
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

      /* ── Resize ─────────────────────────────────────────────────────── */
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
