'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { workItems, type Category } from '@/lib/projects'

/* ── Fibonacci hemisphere — points on the FRONT half of a sphere ──────────────
   Generates n evenly-spaced positions on the z > 0 hemisphere.             */
function fibHemisphere(n: number, radius: number) {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const pts: { x: number; y: number; z: number }[] = []
  const oversample = n * 5 // oversample to get enough front-facing points

  for (let i = 0; i < oversample && pts.length < n; i++) {
    const y     = 1 - (i / (oversample - 1)) * 2
    const r     = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    const x     = Math.cos(theta) * r
    const z     = Math.sin(theta) * r
    // Accept any z > -0.1 (slight blend past the equator for realism)
    if (z > -0.1) {
      pts.push({ x: x * radius, y: y * radius, z: z * radius })
    }
  }
  return pts.slice(0, n)
}

interface GlobeProps {
  filterRef: React.MutableRefObject<string>
}

export function Globe({ filterRef }: GlobeProps) {
  const mountRef  = useRef<HTMLDivElement>(null)
  const labelRef  = useRef<HTMLDivElement>(null)

  const router = useRouter()

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    import('three').then((THREE) => {
      const W = mount.clientWidth
      const H = mount.clientHeight

      /* ── Renderer ────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({
        antialias: true, alpha: true, powerPreference: 'high-performance',
      })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      renderer.domElement.style.cursor = 'none'
      mount.appendChild(renderer.domElement)

      const maxAniso = renderer.capabilities.getMaxAnisotropy()

      /* ── Scene / Camera ──────────────────────────── */
      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 2000)
      camera.position.z = 600

      /* ── Subtle globe wireframe reference ────────── */
      const sphereGeo = new THREE.SphereGeometry(265, 24, 16)
      const wireMat   = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.04, wireframe: true,
      })
      const wireframe = new THREE.Mesh(sphereGeo, wireMat)
      scene.add(wireframe)

      /* ── Distribute positions on hemisphere ──────── */
      const positions = fibHemisphere(workItems.length, 255)
      const loader    = new THREE.TextureLoader()

      interface MeshMeta {
        mesh: THREE.Mesh
        baseOpacity: number
        targetOpacity: number
      }
      const meshMetas: MeshMeta[] = []

      workItems.forEach((item, i) => {
        const pos      = positions[i] ?? { x: 0, y: 0, z: 200 }
        const isSketch = item.kind === 'sketch'

        /* Placeholder geometry — resized on texture load */
        const geo = new THREE.PlaneGeometry(
          isSketch ? 52 : 84,
          isSketch ? 68 : 56,
        )
        const mat = new THREE.MeshBasicMaterial({
          transparent: true, opacity: 0, side: THREE.FrontSide, depthWrite: false,
        })

        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(pos.x, pos.y, pos.z)
        mesh.userData = { id: item.id, category: item.category, kind: item.kind }

        scene.add(mesh)
        const base = isSketch ? 0.80 : 0.87
        meshMetas.push({ mesh, baseOpacity: base, targetOpacity: base })

        /* Load texture, then fix aspect ratio */
        loader.load(item.image, (tex) => {
          tex.colorSpace      = THREE.SRGBColorSpace
          tex.anisotropy      = maxAniso
          tex.minFilter       = THREE.LinearMipmapLinearFilter
          tex.magFilter       = THREE.LinearFilter
          tex.generateMipmaps = true

          if (tex.image?.naturalWidth && tex.image?.naturalHeight) {
            const aspect = tex.image.naturalWidth / tex.image.naturalHeight
            const baseH  = isSketch ? 66 : 58
            mesh.geometry.dispose()
            mesh.geometry = new THREE.PlaneGeometry(baseH * aspect, baseH)
          }

          mat.map = tex
          mat.opacity = 0
          mat.needsUpdate = true
          /* Fade in */
          meshMetas[i].targetOpacity = meshMetas[i].baseOpacity
        })
      })

      /* ── Rotation state ──────────────────────────── */
      let rotY = 0         /* accumulated y rotation */
      let velY = 0
      const AUTO = 0.00035 /* slow auto drift */

      /* ── Drag / click distinction ─────────────────
         Only fire click if pointer barely moved       */
      let pointerDown = false
      let startX = 0, startY = 0, hasDragged = false
      let lastDX = 0, lastFrameTime = 0

      function onPointerDown(e: PointerEvent) {
        pointerDown = true; hasDragged = false
        startX = e.clientX; startY = e.clientY
        lastDX = 0
        mount.setPointerCapture(e.pointerId)
      }
      function onPointerMove(e: PointerEvent) {
        if (!pointerDown) return
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        if (Math.sqrt(dx * dx + dy * dy) > 5) hasDragged = true
        lastDX = e.movementX * 0.003
        velY   = lastDX
        startX = e.clientX; startY = e.clientY
      }
      function onPointerUp() { pointerDown = false }

      mount.addEventListener('pointerdown', onPointerDown)
      mount.addEventListener('pointermove', onPointerMove)
      mount.addEventListener('pointerup', onPointerUp)
      mount.addEventListener('pointercancel', onPointerUp)

      /* ── Raycasting ───────────────────────────────── */
      const raycaster = new THREE.Raycaster()
      const mouse2d   = new THREE.Vector2()
      let hovered: THREE.Mesh | null = null

      mount.addEventListener('mousemove', (e) => {
        const rect = mount.getBoundingClientRect()
        mouse2d.x  =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
        mouse2d.y  = -((e.clientY - rect.top)  / rect.height) * 2 + 1
        renderer.domElement.style.cursor = 'none'
      })

      mount.addEventListener('click', () => {
        if (hasDragged) return               /* drag → ignore click */
        if (hovered) {
          router.push(`/work/${hovered.userData.id}`)
        }
      })

      /* ── Animation loop ───────────────────────────── */
      let rafId: number

      function animate(time: number) {
        rafId = requestAnimationFrame(animate)

        /* Auto drift + inertia */
        if (!pointerDown) { velY *= 0.92; velY += AUTO }
        rotY += velY
        scene.rotation.y = rotY
        wireframe.rotation.y = rotY

        /* Billboard: each mesh faces the camera */
        meshMetas.forEach(({ mesh }) => {
          mesh.quaternion.copy(camera.quaternion)
        })

        /* Raycast hover */
        raycaster.setFromCamera(mouse2d, camera)
        const visibleMeshes = meshMetas
          .filter(m => m.mesh.visible)
          .map(m => m.mesh)
        const hits  = raycaster.intersectObjects(visibleMeshes)
        const newH  = hits.length > 0 ? (hits[0].object as THREE.Mesh) : null

        if (newH !== hovered) {
          hovered = newH
          if (labelRef.current) {
            if (hovered) {
              const id = hovered.userData.id as string
              const item = workItems.find(w => w.id === id)
              labelRef.current.textContent = item?.title ?? id
              labelRef.current.style.opacity = '1'
            } else {
              labelRef.current.style.opacity = '0'
            }
          }
        }

        /* Per-mesh: filter opacity + hover scale */
        const currentFilter = filterRef.current
        meshMetas.forEach(({ mesh, baseOpacity, targetOpacity }, idx) => {
          const cat = mesh.userData.category as string
          const kind = mesh.userData.kind as string

          /* Filter match: 'Sketch' filter maps to kind === 'sketch' */
          let matches: boolean
          if (currentFilter === 'All') {
            matches = true
          } else if (currentFilter === 'Sketch') {
            matches = kind === 'sketch'
          } else {
            matches = cat === currentFilter
          }

          /* Update target opacity */
          const base = matches ? (kind === 'sketch' ? 0.80 : 0.87) : 0.0
          meshMetas[idx].targetOpacity = base

          /* Lerp opacity */
          const mat = mesh.material as THREE.MeshBasicMaterial
          if (mat.map) {
            const isHov = mesh === hovered
            const goal  = isHov ? Math.min(1, base + 0.13) : base
            mat.opacity += (goal - mat.opacity) * 0.1
            mesh.visible = mat.opacity > 0.01

            /* Hover scale */
            const s = isHov ? 1.09 : 1
            mesh.scale.lerp(new THREE.Vector3(s, s, s), 0.1)
          }
        })

        renderer.render(scene, camera)
      }
      animate(0)

      /* ── Resize ───────────────────────────────────── */
      function onResize() {
        camera.aspect = mount.clientWidth / mount.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(mount.clientWidth, mount.clientHeight)
      }
      window.addEventListener('resize', onResize)

      return () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', onResize)
        mount.removeEventListener('pointerdown', onPointerDown)
        mount.removeEventListener('pointermove', onPointerMove)
        mount.removeEventListener('pointerup', onPointerUp)
        mount.removeEventListener('pointercancel', onPointerUp)
        renderer.dispose()
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      }
    })
  }, [router, filterRef])

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />

      {/* Hover title label */}
      <div
        ref={labelRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-200"
        style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 400,
          fontSize: '0.6rem',
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.7)',
          opacity: 0,
          whiteSpace: 'nowrap',
        }}
      />
    </div>
  )
}
