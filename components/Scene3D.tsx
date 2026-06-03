'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — architectural sketch renderer for public/assets/base.glb
  ──────────────────────────────────────────────────────────────────
  Sketch pipeline:
  · Custom toon GLSL (smooth gradient, not posterised)
  · Dark ink EdgeGeometry LineSegments on every mesh
  · Pure white / warm-off-white background — reads as paper
  · No PBR, no shadows, no tone-mapping

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

const CAM_STOPS = [
  { pos: [32,  8, 24],  look: [10, 2.5,  2]  }, /* hero — three-quarter front, pool fg  */
  { pos: [8,   3, 22],  look: [8,  2.0,  4]  }, /* manifesto — entrance + gate          */
  { pos: [36,  4, -4],  look: [20, 2.0, -4]  }, /* stats — carport / right profile      */
  { pos: [12, 22, 20],  look: [12, 0.5, -2]  }, /* services — aerial overview           */
  { pos: [-4,  6, 18],  look: [4,  3.5, -2]  }, /* contact — left wing + stair          */
  { pos: [12, 30,  2],  look: [12, 0.0, -4]  }, /* end — top-down plan                  */
]

/* Mobile camera stops — pulled further back, centred on building.
   Portrait aspect ≈ 0.89 means horizontal FoV shrinks to ~36° at 40°
   vertical. Using 62° FOV + these positions keeps the full building
   visible and centred in the narrower mobile canvas. */
const CAM_STOPS_MOBILE = [
  { pos: [10,  10, 42],  look: [10, 2.0, -2]  }, /* hero: full building centred   */
  { pos: [ 5,   7, 36],  look: [ 8, 1.8,  0]  }, /* manifesto: entrance / gate    */
  { pos: [30,   5, 10],  look: [14, 2.0, -3]  }, /* stats: right-side profile     */
  { pos: [10,  20, 22],  look: [10, 0.5, -3]  }, /* services: aerial              */
  { pos: [-4,   6, 22],  look: [ 4, 3.0, -2]  }, /* contact: left wing + stair    */
  { pos: [10,  28,  3],  look: [10, 0.0, -4]  }, /* end: top-down plan            */
]

/* ── World-space toon vertex shader (shared by toon + dark) ─────── */
const VERT = /* glsl */`
  varying vec3 vWorldNormal;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position  = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`

/* Off-white toon — smooth gradient, reads as hand-drawn mass model */
const TOON_FRAG = /* glsl */`
  uniform vec3 uLight;
  varying vec3 vWorldNormal;
  void main() {
    float d = clamp(dot(normalize(vWorldNormal), uLight), 0.0, 1.0);
    vec3 shadow = vec3(0.80, 0.79, 0.77);
    vec3 lit    = vec3(1.00, 1.00, 0.99);
    gl_FragColor = vec4(mix(shadow, lit, d), 1.0);
  }
`

/* Dark / charcoal elements (steel, concrete trim) */
const DARK_FRAG = /* glsl */`
  uniform vec3 uLight;
  varying vec3 vWorldNormal;
  void main() {
    float d = clamp(dot(normalize(vWorldNormal), uLight), 0.0, 1.0);
    float b = mix(0.08, 0.34, d);
    gl_FragColor = vec4(vec3(b), 1.0);
  }
`

/* Glass — solid sketch-blue toon, same pipeline as toonMat.
   Opaque + depthWrite prevents every source of glass flicker. */
const GLASS_FRAG = /* glsl */`
  uniform vec3 uLight;
  varying vec3 vWorldNormal;
  void main() {
    float d = clamp(dot(normalize(vWorldNormal), uLight), 0.0, 1.0);
    vec3 shadow = vec3(0.68, 0.80, 0.88);
    vec3 lit    = vec3(0.84, 0.92, 0.97);
    gl_FragColor = vec4(mix(shadow, lit, d), 1.0);
  }
`

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

      /* Portrait / narrow viewport = mobile — use wider FOV + zoomed-out stops */
      const isMobileView = W < H || W < 560
      const stops  = isMobileView ? CAM_STOPS_MOBILE : CAM_STOPS
      const camFov = isMobileView ? 62 : 40

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

      /* ── Shared light direction ───────────────────────────────── */
      const uLight = new THREE.Vector3(0.55, 1.0, 0.75).normalize()

      /* ── Sketch materials ─────────────────────────────────────── */

      /* polygonOffset pushes face fragments slightly BACK in depth
         buffer → ink LineSegments at identical Z always win → no flicker */
      const toonMat = new THREE.ShaderMaterial({
        uniforms:            { uLight: { value: uLight } },
        vertexShader:        VERT,
        fragmentShader:      TOON_FRAG,
        side:                THREE.FrontSide,
        polygonOffset:       true,
        polygonOffsetFactor: 2,
        polygonOffsetUnits:  2,
      })

      const darkMat = new THREE.ShaderMaterial({
        uniforms:            { uLight: { value: uLight } },
        vertexShader:        VERT,
        fragmentShader:      DARK_FRAG,
        side:                THREE.FrontSide,
        polygonOffset:       true,
        polygonOffsetFactor: 2,
        polygonOffsetUnits:  2,
      })

      /* Glass: opaque solid-blue shader — no transparency, no depthWrite:false.
         This is the definitive fix: transparent+depthWrite:false is what
         causes sort-order flicker every frame on overlapping glass meshes. */
      const glassMat = new THREE.ShaderMaterial({
        uniforms:            { uLight: { value: uLight } },
        vertexShader:        VERT,
        fragmentShader:      GLASS_FRAG,
        transparent:         false,
        side:                THREE.FrontSide,
        depthWrite:          true,
        polygonOffset:       true,
        polygonOffsetFactor: 2,
        polygonOffsetUnits:  2,
      })

      /* Ink lines — pencil weight, soft opacity */
      const inkMat = new THREE.LineBasicMaterial({
        color: 0x1a1714, transparent: true, opacity: 0.28,
      })

      /* ── Load GLB ─────────────────────────────────────────────── */
      const loader = new GLTFLoader()
      loader.load(
        '/assets/base.glb',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (gltf: any) => {
          if (disposed) return
          const model = gltf.scene

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model.traverse((child: any) => {
            if (!child.isMesh) return

            const matName: string = (
              Array.isArray(child.material)
                ? child.material[0]?.name
                : child.material?.name
            )?.toLowerCase() ?? ''

            /* Assign sketch shader by material name */
            if (matName.includes('glass') || matName.includes('water')) {
              child.material = glassMat
            } else if (
              matName.includes('steel') ||
              matName.includes('concdark') ||
              matName.includes('concretedark') ||
              matName.includes('dark') ||
              matName.includes('poolrim')
            ) {
              child.material = darkMat
            } else {
              child.material = toonMat
            }

            /* Ink edge lines — added as child so they share the mesh
               transform; polygonOffset on the face mat means lines
               always render on top at zero extra cost               */
            const edges = new THREE.EdgesGeometry(child.geometry, 15)
            child.add(new THREE.LineSegments(edges, inkMat))
          })

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
