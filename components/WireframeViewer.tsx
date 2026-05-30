'use client'

import { useEffect, useRef } from 'react'

/*
  WireframeViewer — architectural edge-only model renderer
  ─────────────────────────────────────────────────────────
  • Loads base.glb via GLTFLoader + DRACOLoader
  • EdgesGeometry (crease 25°) → only sharp architectural edges
  • No lighting, no shadows, no filled surfaces
  • Line color #1a1a1a @ 0.85 opacity, background #f8f6f2
  • OrbitControls: drag, scroll-zoom, right-drag pan
  • Scroll-driven orbit (progressRef 0→1 maps to 0→2π orbit)
  • OrbitControls re-enabled when user manually drags

  TIP: Screen-record this component to produce the hero-model.mp4
       that the video-scrubbing hero will use in production.
*/

interface WireframeViewerProps {
  progressRef: React.MutableRefObject<number>
}

export function WireframeViewer({ progressRef }: WireframeViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let rafId = 0

    ;(async () => {
      const THREE = await import('three')
      const { GLTFLoader }   = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader }  = await import('three/examples/jsm/loaders/DRACOLoader.js')
      const { OrbitControls }= await import('three/examples/jsm/controls/OrbitControls.js')

      /* ── Renderer ─────────────────────────────────────────────────── */
      const W = mount.clientWidth || window.innerWidth
      const H = mount.clientHeight || window.innerHeight

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0xf8f6f2, 1)
      mount.appendChild(renderer.domElement)

      /* ── Scene ────────────────────────────────────────────────────── */
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf8f6f2)

      /* ── Camera ───────────────────────────────────────────────────── */
      const camera = new THREE.PerspectiveCamera(42, W / H, 0.01, 1000)
      camera.position.set(6, 3, 9)
      camera.lookAt(0, 0, 0)

      /* ── OrbitControls ────────────────────────────────────────────── */
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping    = true
      controls.dampingFactor    = 0.06
      controls.enablePan        = true
      controls.enableZoom       = true
      controls.mouseButtons     = {
        LEFT:   0,   /* rotate     */
        MIDDLE: 1,   /* zoom       */
        RIGHT:  2,   /* pan        */
      } as typeof controls.mouseButtons

      /* User interaction state — pauses auto-orbit while dragging */
      let userActive = false
      let idleTimer  = 0
      renderer.domElement.addEventListener('pointerdown', () => {
        userActive = true
        controls.enabled = true
        clearTimeout(idleTimer)
      })
      renderer.domElement.addEventListener('pointerup', () => {
        /* Resume auto-orbit after 3 s of inactivity */
        idleTimer = window.setTimeout(() => { userActive = false }, 3000)
      })

      /* ── Load model ───────────────────────────────────────────────── */
      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      const loader = new GLTFLoader()
      loader.setDRACOLoader(draco)

      let orbitRadius = 12
      let orbitHeight = 4

      loader.load('/assets/base.glb', (gltf) => {
        const model = gltf.scene

        /* ── Box3 fit ─────────────────────────────────────────────── */
        const box    = new THREE.Box3().setFromObject(model)
        const centre = box.getCenter(new THREE.Vector3())
        const size   = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale  = 4.0 / maxDim           /* normalise to ~4 units  */

        /* Centre at origin */
        model.position.sub(centre)
        model.scale.setScalar(scale)

        /* Force matrix update so children have correct world matrices */
        model.updateMatrixWorld(true)

        /* ── EdgesGeometry — 25° crease, architectural edges only ─── */
        const lineMat = new THREE.LineBasicMaterial({
          color:       0x1a1a1a,
          opacity:     0.85,
          transparent: true,
        })

        model.traverse((obj) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mesh = obj as any
          if (!mesh.isMesh) return

          /* Hide filled surface */
          mesh.visible = false

          /* Clone geometry, apply local-to-parent transform */
          const edges = new THREE.EdgesGeometry(mesh.geometry, 25)
          const lines = new THREE.LineSegments(edges, lineMat)

          /* Preserve the mesh's own local transform */
          lines.position.copy(mesh.position)
          lines.quaternion.copy(mesh.quaternion)
          lines.scale.copy(mesh.scale)

          mesh.parent?.add(lines)
        })

        scene.add(model)

        /* Fit camera orbit radius to scaled model */
        const scaledSize = size.clone().multiplyScalar(scale)
        const fitDist    = Math.max(scaledSize.x, scaledSize.y, scaledSize.z) * 1.8
        orbitRadius  = fitDist
        orbitHeight  = scaledSize.y * 0.55
        camera.position.set(0, orbitHeight, orbitRadius)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()
      },
      undefined,
      (err) => console.error('GLB load error:', err))

      /* ── Animate ──────────────────────────────────────────────────── */
      function animate() {
        rafId = requestAnimationFrame(animate)

        if (!userActive) {
          /* Scroll-driven orbit: progressRef 0→1 → full 0→2π rotation */
          const theta = progressRef.current * Math.PI * 2
          camera.position.set(
            Math.sin(theta) * orbitRadius,
            orbitHeight,
            Math.cos(theta) * orbitRadius,
          )
          camera.lookAt(0, 0, 0)
          controls.enabled = false
        } else {
          controls.enabled = true
        }

        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      /* ── Resize ───────────────────────────────────────────────────── */
      function onResize() {
        const nW = mount!.clientWidth, nH = mount!.clientHeight
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
      }
      window.addEventListener('resize', onResize)

      ;(mount as any)._cleanup = () => {
        cancelAnimationFrame(rafId)
        clearTimeout(idleTimer)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        renderer.dispose()
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup?.() }
  }, [progressRef])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%' }}
      title="Drag to rotate · Scroll to zoom · Right-drag to pan"
    />
  )
}
