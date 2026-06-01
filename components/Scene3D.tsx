'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — PBR render of public/assets/base.glb
  ─────────────────────────────────────────────
  Full physically-based rendering pipeline:
  · ACES Filmic tone mapping
  · PCFSoft shadow maps (2048 px, radius 4)
  · Directional sun + hemisphere + fill + ambient
  · Glass: MeshPhysicalMaterial with transmission
  · Fog to blend model edges with page background

  Coordinate space (after GLTF Y-up conversion from Blender Z-up):
    X 0–22  (left → right)
    Y 0–7   (ground → roof)
    Z −11–+6 (back → front; compound wall at +6, front façade at −2)
*/

const LERP = 0.07
const SNAP = 0.0008

/*
  Six scroll-driven positions for the new Casa Terracotta model.
  Three.js coordinates (Y-up, after GLTF conversion from Blender Z-up):
    Building front face : Z =  0  (Blender Y=0)
    Pool / forecourt    : Z = +5  (Blender Y=-5)
    Gate                : Z = +9  (Blender Y=-9)
    Building centre X   :  ≈ 13
    Building height Y   :  0–5.8
*/
const CAM_STOPS = [
  { pos: [32,  8, 24],  look: [10, 2.5,  2]  }, /* hero — three-quarter, pool foreground  */
  { pos: [8,   3, 22],  look: [8,  2.0,  4]  }, /* manifesto — entrance zoom + gate       */
  { pos: [36,  4, -4],  look: [20, 2.0, -4]  }, /* stats — carport / right profile        */
  { pos: [12, 22, 20],  look: [12, 0.5, -2]  }, /* services — aerial overview             */
  { pos: [-4,  5, 18],  look: [4,  3.5, -2]  }, /* contact — left terrace + stair         */
  { pos: [12, 30,  2],  look: [12, 0.0, -4]  }, /* end — top-down plan                    */
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

      if (disposed) return

      const W   = mount.clientWidth  || window.innerWidth
      const H   = mount.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 2)

      /* ── Renderer ─────────────────────────────────────────────── */
      /* logarithmicDepthBuffer eliminates Z-fighting between coplanar
         facade overlays (glass panels, slat cladding) and solid body   */
      const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(dpr)

      /* PBR quality settings */
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type    = THREE.PCFSoftShadowMap
      renderer.toneMapping          = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure  = 1.15
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(renderer as any).outputColorSpace = 'srgb'

      renderer.setClearColor(0xf5f3f0, 1)
      mount.appendChild(renderer.domElement)

      /* ── Scene ────────────────────────────────────────────────── */
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf5f3f0)
      /* Subtle fog — same hue as background, fades distant geometry
         naturally so the model blends into the white page   */
      scene.fog = new THREE.FogExp2(0xf5f3f0, 0.008)

      /* ── Camera ───────────────────────────────────────────────── */
      const p0 = CAM_STOPS[0]
      const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 500)
      camera.position.set(p0.pos[0], p0.pos[1], p0.pos[2])
      camera.lookAt(p0.look[0], p0.look[1], p0.look[2])

      /* ── LIGHTING ─────────────────────────────────────────────── */

      /* Primary sun — warm golden-hour directional, casts soft shadows */
      const sun = new THREE.DirectionalLight(0xfffbf0, 3.8)
      sun.position.set(18, 32, 18)
      sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      sun.shadow.camera.near   = 1
      sun.shadow.camera.far    = 120
      sun.shadow.camera.left   = -45
      sun.shadow.camera.right  =  45
      sun.shadow.camera.top    =  45
      sun.shadow.camera.bottom = -45
      sun.shadow.bias          = -0.0004
      sun.shadow.radius        = 4      /* soft penumbra */
      scene.add(sun)

      /* Sky hemisphere — warm sky above, cool concrete bounce below */
      const hemi = new THREE.HemisphereLight(0xc8d8f0, 0xcfc6b0, 1.4)
      scene.add(hemi)

      /* Secondary fill — cool blue from front-left (simulates open sky) */
      const fill = new THREE.DirectionalLight(0xd0e6ff, 1.0)
      fill.position.set(-18, 14, 28)
      scene.add(fill)

      /* Ambient — prevents pure black in shadows */
      scene.add(new THREE.AmbientLight(0xffffff, 0.5))

      /* ── GLASS MATERIAL (applied to glass meshes after GLB loads) ── */
      const glassMat = new THREE.MeshPhysicalMaterial({
        color:               0x9fcce0,
        metalness:           0.0,
        roughness:           0.05,
        transmission:        0.88,
        thickness:           0.6,
        ior:                 1.50,
        transparent:         true,
        opacity:             0.35,
        side:                THREE.DoubleSide,
        depthWrite:          false,
        /* polygon offset pushes glass fragments toward camera so they
           always render in front of the solid body behind them        */
        polygonOffset:       true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits:  -2,
      })

      /* ── LOAD GLB ─────────────────────────────────────────────── */
      const loader = new GLTFLoader()
      loader.load(
        '/assets/base.glb',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (gltf: any) => {
          if (disposed) return
          const model = gltf.scene

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model.traverse((child: any) => {
            const mesh = child
            if (!mesh.isMesh) return

            const matName: string = (
              Array.isArray(mesh.material)
                ? mesh.material[0]?.name
                : mesh.material?.name
            )?.toLowerCase() ?? ''

            /* Replace glass / water with proper transmission material */
            if (matName.includes('glass') || matName.includes('water')) {
              mesh.material  = glassMat
              mesh.castShadow    = false
              mesh.receiveShadow = true
              return
            }

            /* All solid geometry casts and receives shadows */
            mesh.castShadow    = true
            mesh.receiveShadow = true

            /* Ground plane — receive only (no self-cast artefacts) */
            if (matName.includes('grass') || mesh.name?.toLowerCase().includes('ground')) {
              mesh.castShadow = false
            }
          })

          scene.add(model)
        },
        undefined,
        (err: unknown) => console.warn('GLB load error', err)
      )

      /* ── CAMERA ANIMATION ─────────────────────────────────────── */
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
        const N  = CAM_STOPS.length
        const fp = p * (N - 1)
        const i0 = Math.floor(fp)
        const i1 = Math.min(i0 + 1, N - 1)
        const tt = fp - i0
        /* Ease-in-out between stops */
        const e  = tt < 0.5 ? 2 * tt * tt : 1 - 2 * (1 - tt) * (1 - tt)
        const a  = CAM_STOPS[i0]
        const b  = CAM_STOPS[i1]
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

      /* ── RESIZE ───────────────────────────────────────────────── */
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
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  )
}
