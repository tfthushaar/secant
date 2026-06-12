'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — architectural sketch renderer for public/assets/model.glb
  ──────────────────────────────────────────────────────────────────
  Model: Meshy AI "Modern Oasis Plaza"

  Linework pipeline:
  · Surfaces paper-coloured (0xfaf8f5) — hidden-line masks only
  · Dark ink EdgesGeometry LineSegments define all form (opacity 0.82)
  · No PBR, no shadows, no tone-mapping — pure architectural drawing look

  polygonOffset on paperMat pushes faces back in depth buffer so ink
  lines always render in front at the same position → no z-fighting.
*/

const LERP = 0.08
const SNAP = 0.0008

/* Camera stops — Meshy AI Modern Oasis Plaza model.
   Model normalised to 20-unit max axis, centred at origin, lifted +2 Y.
   Six stops orbit the complex from varied heights and angles.            */
const CAM_STOPS = [
  { pos: [-10,  6,  26],  look: [ 0,  3,  2]  }, /* hero: front-left three-quarter     */
  { pos: [-18,  2,  16],  look: [-4,  4,  2]  }, /* manifesto: ground-level left facade */
  { pos: [  0, 22,  18],  look: [ 0,  1,  4]  }, /* stats: aerial panoramic            */
  { pos: [ 14,  4,  20],  look: [ 2,  3,  4]  }, /* services: front-right three-quarter */
  { pos: [ -6, 18,  10],  look: [-2,  1,  4]  }, /* contact: close aerial, front-left  */
  { pos: [  6,  5,  24],  look: [ 2,  2,  4]  }, /* end: gentle front three-quarter    */
]

/* Mobile: ~40 % further back for portrait viewport */
const CAM_STOPS_MOBILE = [
  { pos: [-14,  8,  36],  look: [ 0,  3,  2]  },
  { pos: [-25,  3,  22],  look: [-4,  4,  2]  },
  { pos: [  0, 31,  25],  look: [ 0,  1,  4]  },
  { pos: [ 20,  6,  28],  look: [ 2,  3,  4]  },
  { pos: [ -8, 25,  14],  look: [-2,  1,  4]  },
  { pos: [  8,  7,  34],  look: [ 2,  2,  4]  },
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

      /* Ink lines — fully opaque for crisp architectural pen weight */
      const inkMat = new THREE.LineBasicMaterial({ color: 0x0d0c0a })

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
            /* Apply paper mask to all material-bearing objects (meshes, points,
               vegetation sprites, etc.) so coloured foliage doesn't break the
               sketch look. Edge lines are only added for true Mesh geometry.    */
            if (child.material) child.material = paperMat
            if (!child.isMesh) return

            /* 30° threshold: only architectural crease edges, no mesh triangulation.
               Then filter degenerate zero-length segments that render as dots.      */
            const edges = new THREE.EdgesGeometry(child.geometry, 30)
            const src = edges.attributes.position?.array as Float32Array | undefined
            if (!src) { edges.dispose(); return }

            const kept: number[] = []
            for (let i = 0; i < src.length; i += 6) {
              const dx = src[i+3]-src[i], dy = src[i+4]-src[i+1], dz = src[i+5]-src[i+2]
              if (dx*dx + dy*dy + dz*dz > 1e-10) {
                kept.push(src[i],src[i+1],src[i+2],src[i+3],src[i+4],src[i+5])
              }
            }
            edges.dispose()

            if (kept.length > 0) {
              const clean = new THREE.BufferGeometry()
              clean.setAttribute('position', new THREE.Float32BufferAttribute(kept, 3))
              child.add(new THREE.LineSegments(clean, inkMat))
            }
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
          /* Lift model so building roof sits close to hero headline */
          model.position.y += 2

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
