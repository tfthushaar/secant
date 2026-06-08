'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — architectural sketch renderer for public/assets/base.glb
  ──────────────────────────────────────────────────────────────────
  Linework pipeline:
  · Surfaces are paper-coloured (0xfaf8f5) — hidden-line masks, not visible
  · Dark ink EdgesGeometry LineSegments define all form (opacity 0.82)
  · Glass uses the same paper mask as solid surfaces — lines only
  · No shaders, no PBR, no shadows, no tone-mapping

  Z-fighting / flicker fix (two layers):
  1. logarithmicDepthBuffer: true  — massively improves depth precision,
     eliminates fighting between close coplanar surfaces in the GLB
  2. polygonOffset on toonMat + darkMat — pushes face fragments slightly
     away from camera in the depth buffer, so ink LineSegments at the
     exact same position always render in front → zero flicker on edges

  Material name rules (read from Blender export):
    contains "glass" / "water" → glassMat  (faint translucent wash)
    contains "steel" / "concdark" / "dark" → darkMat (charcoal)
    everything else → toonMat (off-white toon)

  Camera coordinates (Three.js Y-up after GLTF conversion from Blender Z-up):
    X same  |  Y = Blender Z (height)  |  Z = −Blender Y
    Building front face  : Z =  0   Pool / forecourt : Z = +5
    Gate                 : Z = +9   Building centre X:  ≈ 10
*/

const LERP = 0.08
const SNAP = 0.0008

/* Camera stops — all positions kept in front of the building (Z > 0) and
   look targets kept at Z > 0 so neither the main block nor the right wing's
   back face is ever visible from any camera angle.                          */
const CAM_STOPS = [
  { pos: [-18,  6,  24],  look: [-4,  1,  3]  }, /* hero — front-left three-quarter   */
  { pos: [-26,  2,  20],  look: [-6,  0,  2]  }, /* manifesto — tight left facade     */
  { pos: [  4,  2,  27],  look: [-1,  2,  3]  }, /* stats — straight front, low       */
  { pos: [ -2, 26,  14],  look: [ 0,  0,  4]  }, /* services — forward aerial         */
  { pos: [  9,  5,  26],  look: [ 3,  1,  3]  }, /* contact — front-right wing face   */
  { pos: [ -7, 18,  22],  look: [-1,  0,  3]  }, /* end — diagonal aerial from front  */
]

/* Mobile: same orbit, pulled ~40 % further back for portrait viewport */
const CAM_STOPS_MOBILE = [
  { pos: [-26,  9,  34],  look: [-4,  1,  3]  },
  { pos: [-37,  3,  28],  look: [-6,  0,  2]  },
  { pos: [  6,  3,  38],  look: [-1,  2,  3]  },
  { pos: [ -3, 37,  20],  look: [ 0,  0,  4]  },
  { pos: [ 13,  7,  37],  look: [ 3,  1,  3]  },
  { pos: [-10, 25,  31],  look: [-1,  0,  3]  },
]


interface Props { progressRef: React.MutableRefObject<number> }

export function Scene3D({ progressRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let rafId = 0
    let disposed = false

    ;(async () => {
      const THREE = await import('three')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js' as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js' as any)

      if (disposed) return

      const W   = mount.clientWidth  || window.innerWidth
      const H   = mount.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 2)

      /* Portrait / narrow viewport = mobile — use wider FOV + zoomed-out stops */
      const isMobileView = W < H || W < 560
      const stops  = isMobileView ? CAM_STOPS_MOBILE : CAM_STOPS
      /* 75° vertical FOV on portrait — gives ~39° horizontal on 375px phone,
         enough to show the full 64m building width at the pull-back distances */
      const camFov = isMobileView ? 75 : 40

      /* ── Renderer ─────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        /* logarithmicDepthBuffer intentionally removed: it requires
           custom ShaderMaterial shaders to include logdepthbuf_*
           GLSL chunks — without them the depth values are wrong on
           many GPUs, causing a blank scene. Glass z-fighting is
           fixed by making glass opaque, so this is no longer needed. */
      })
      renderer.setSize(W, H)
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0xfaf8f5, 1)
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xfaf8f5)

      /* ── Camera ───────────────────────────────────────────────── */
      const p0 = stops[0]
      const camera = new THREE.PerspectiveCamera(camFov, W / H, 0.1, 500)
      camera.position.set(p0.pos[0], p0.pos[1], p0.pos[2])
      camera.lookAt(p0.look[0], p0.look[1], p0.look[2])

      /* ── Linework materials ───────────────────────────────────── */

      /* Surfaces match background colour — they act as hidden-line
         masks that occlude back-facing edges without being visible
         themselves. polygonOffset pushes faces back so ink lines
         always render in front at zero cost.                        */
      const paperMat = new THREE.MeshBasicMaterial({
        color:               0xfaf8f5,
        side:                THREE.FrontSide,
        polygonOffset:       true,
        polygonOffsetFactor: 2,
        polygonOffsetUnits:  2,
      })

      const glassMat = paperMat

      /* Ink lines — architect-pen weight */
      const inkMat = new THREE.LineBasicMaterial({
        color: 0x1a1714, transparent: true, opacity: 0.82,
      })

      /* ── Load GLB ─────────────────────────────────────────────── */
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/gltf/')
      const loader = new GLTFLoader()
      loader.setDRACOLoader(dracoLoader)
      loader.load(
        '/assets/model.glb',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (gltf: any) => {
          if (disposed) return
          const model = gltf.scene

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model.traverse((child: any) => {
            if (!child.isMesh) return
            child.material = paperMat
            const edges = new THREE.EdgesGeometry(child.geometry, 15)
            child.add(new THREE.LineSegments(edges, inkMat))
          })

          /* Normalise: centre at origin, scale so longest axis = 20 units */
          const box = new THREE.Box3().setFromObject(model)
          const centre = new THREE.Vector3()
          const size   = new THREE.Vector3()
          box.getCenter(centre)
          box.getSize(size)
          const norm = 20 / Math.max(size.x, size.y, size.z)
          model.position.sub(centre)
          model.scale.setScalar(norm)

          scene.add(model)
        },
        undefined,
        (err: unknown) => console.warn('GLB load error', err)
      )

      /* ── Camera animation ─────────────────────────────────────── */
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      const cam = {
        x:  p0.pos[0],  y:  p0.pos[1],  z:  p0.pos[2],
        lx: p0.look[0], ly: p0.look[1], lz: p0.look[2],
      }
      const snap = (c: number, t: number) => {
        const d = t - c; return Math.abs(d) < SNAP ? t : c + d * LERP
      }

      function animate() {
        rafId = requestAnimationFrame(animate)
        const p  = Math.round(Math.max(0, Math.min(1, progressRef.current)) * 1000) / 1000
        const N  = stops.length
        const fp = p * (N - 1)
        const i0 = Math.floor(fp)
        const i1 = Math.min(i0 + 1, N - 1)
        const tt = fp - i0
        const e  = tt < 0.5 ? 2 * tt * tt : 1 - 2 * (1 - tt) * (1 - tt)
        const a  = stops[i0]
        const b  = stops[i1]
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

      /* ── Resize ───────────────────────────────────────────────── */
      function onResize() {
        if (!mount) return
        const nW = mount.clientWidth
        const nH = mount.clientHeight
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      }
      window.addEventListener('resize', onResize)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mount as any)._cleanup3D = () => {
        disposed = true
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', onResize)
        dracoLoader.dispose()
        renderer.dispose()
        if (mount!.contains(renderer.domElement))
          mount!.removeChild(renderer.domElement)
      }
    })()

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mount as any)._cleanup3D?.()
    }
  }, [progressRef])

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />
  )
}
