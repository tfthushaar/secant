'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — depth + normal edge detection pipeline
  ──────────────────────────────────────────────────
  The GLB is one single merged mesh (building + rocks + trees all fused).
  EdgesGeometry on this mesh is unusable — it generates edges on EVERY
  polygon junction including organic surfaces.

  Solution: two-pass GPU rendering.
    Pass 1 → render scene with MeshNormalMaterial into normalTarget
    Pass 2 → render scene with white MeshBasicMaterial into depthTarget
    Pass 3 → fullscreen Sobel shader reads normal + depth buffers
              and outputs: black lines where normals or depth change sharply.

  Why this works for architecture:
    • Architectural corners (90° walls meeting) → large normal change → black line
    • Rock surfaces (gradual 20-30° facets) → small normal change → invisible
    • Silhouette edges → large depth change → black line
    • Flat ground / walls → no change → white (blend with background)
*/

/*
  Camera stops calibrated to the actual model geometry:
  bboxY: 0.00003–0.49039 → after scale 5.25 → height 2.57 world units
  pulldown = 0.15 → model center ≈ Y –0.39, top ≈ Y 0.90, bottom ≈ Y –1.67
  Look-at points target model center/top so the building fills the lower
  half of the viewport cleanly beneath the SECANT wordmark.
*/
const CAM_STOPS = [
  { pos: [ 0,    3.5, 11.5], look: [0,  0.6, 0] },  /* front elevation      */
  { pos: [ 0,    2.2,  7.5], look: [0,  0.4, 0] },  /* zoom in              */
  { pos: [ 8.5,  3.0,  8.5], look: [0,  0.3, 0] },  /* three-quarter right  */
  { pos: [ 7.0,  8.5,  5.0], look: [0, -0.4, 0] },  /* aerial right         */
  { pos: [-7.5,  3.0,  9.0], look: [0,  0.3, 0] },  /* three-quarter left   */
  { pos: [ 0.5, 13.5,  0.5], look: [0, -0.5, 0] },  /* top-down plan        */
]

interface Props { progressRef: React.MutableRefObject<number> }

export function Scene3D({ progressRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let rafId = 0

    ;(async () => {
      const THREE = await import('three')
      const { GLTFLoader }  = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')

      const W   = mount.clientWidth  || window.innerWidth
      const H   = mount.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio, 2)
      const PW  = Math.floor(W * dpr)
      const PH  = Math.floor(H * dpr)

      /* ── Renderer ───────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: false })
      renderer.setSize(W, H)
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0xffffff, 1)
      mount.appendChild(renderer.domElement)

      /* ── Scene + Camera ─────────────────────────────────────────── */
      const scene  = new THREE.Scene()
      scene.background = new THREE.Color(0xffffff)
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 400)
      const p0 = CAM_STOPS[0]
      camera.position.set(p0.pos[0], p0.pos[1], p0.pos[2])
      camera.lookAt(p0.look[0], p0.look[1], p0.look[2])

      /* ── Render targets ─────────────────────────────────────────── */
      const rtOpts = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }

      /* Normal buffer — stores camera-space normals (R,G,B ↔ X,Y,Z) */
      const normalTarget = new THREE.WebGLRenderTarget(PW, PH, rtOpts)

      /* Depth buffer — depth texture for silhouette edges */
      const depthTarget = new THREE.WebGLRenderTarget(PW, PH, {
        ...rtOpts,
        depthBuffer: true,
        depthTexture: new THREE.DepthTexture(PW, PH),
      })

      /* ── Override materials (no per-mesh traversal each frame) ──── */
      const whiteMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide })
      const normalMat = new THREE.MeshNormalMaterial({ side: THREE.FrontSide })

      /* ── Edge detection fullscreen shader ───────────────────────── */
      const edgeMat = new THREE.ShaderMaterial({
        uniforms: {
          tNormal: { value: normalTarget.texture },
          tDepth:  { value: depthTarget.depthTexture },
          res:     { value: new THREE.Vector2(PW, PH) },
          near:    { value: camera.near },
          far:     { value: camera.far },
        },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */`
          uniform sampler2D tNormal;
          uniform sampler2D tDepth;
          uniform vec2 res;
          uniform float near;
          uniform float far;
          varying vec2 vUv;

          /* Normalized linear depth in [0, 1] — 0=near, 1=far */
          float linDepth(vec2 uv) {
            float d = texture2D(tDepth, uv).r;
            float z = d * 2.0 - 1.0;
            float lin = (2.0 * near * far) / (far + near - z * (far - near));
            return lin / far;
          }

          void main() {
            vec2 t = 1.0 / res;

            vec3 n0  = normalize(texture2D(tNormal, vUv).rgb * 2.0 - 1.0);
            float d0 = linDepth(vUv);

            /*
              Sample 8 neighbours at 1.5px radius.
              MAX operator: one strong neighbour is enough to draw the line.
              This gives 2-3px thick solid lines and eliminates flicker —
              the edge is either clearly there or clearly not, regardless
              of sub-pixel camera movement.
            */
            float nMax = 0.0;
            float dMax = 0.0;

            vec2 dirs[8];
            dirs[0] = vec2( 1.5,  0.0);
            dirs[1] = vec2(-1.5,  0.0);
            dirs[2] = vec2( 0.0,  1.5);
            dirs[3] = vec2( 0.0, -1.5);
            dirs[4] = vec2( 1.1,  1.1);
            dirs[5] = vec2(-1.1,  1.1);
            dirs[6] = vec2( 1.1, -1.1);
            dirs[7] = vec2(-1.1, -1.1);

            for (int i = 0; i < 8; i++) {
              vec2 uv2 = vUv + dirs[i] * t;
              vec3 n2  = normalize(texture2D(tNormal, uv2).rgb * 2.0 - 1.0);
              float d2 = linDepth(uv2);
              nMax = max(nMax, 1.0 - dot(n0, n2));
              dMax = max(dMax, abs(d2 - d0));
            }

            /* Lower threshold = more edges caught, less flickering */
            float ne = smoothstep(0.10, 0.45, nMax);
            float de = smoothstep(0.012, 0.07, dMax);

            float edge = max(ne, de);
            gl_FragColor = vec4(vec3(1.0 - edge), 1.0);
          }
        `,
        depthTest: false,
        depthWrite: false,
      })

      /* Fullscreen quad in its own scene */
      const fsScene  = new THREE.Scene()
      const fsMesh   = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), edgeMat)
      fsMesh.frustumCulled = false
      fsScene.add(fsMesh)
      const fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      /* ── Load GLB ──────────────────────────────────────────────── */
      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      const loader = new GLTFLoader()
      loader.setDRACOLoader(draco)

      loader.load('/assets/base.glb', (gltf) => {
        const model = gltf.scene
        scene.add(model)

        const box    = new THREE.Box3().setFromObject(model)
        const centre = box.getCenter(new THREE.Vector3())
        const size   = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        model.position.sub(centre)
        model.scale.setScalar(10.0 / maxDim)
        model.position.y -= size.y * (10.0 / maxDim) * 0.15
        model.updateMatrixWorld(true)
      }, undefined, (e) => console.error('GLB load error:', e))

      /* ── Camera lerp ────────────────────────────────────────────── */
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      const cam  = { x: p0.pos[0], y: p0.pos[1], z: p0.pos[2], lx: p0.look[0], ly: p0.look[1], lz: p0.look[2] }

      function animate() {
        rafId = requestAnimationFrame(animate)

        const p  = Math.max(0, Math.min(1, progressRef.current))
        const N  = CAM_STOPS.length
        const fp = p * (N - 1)
        const i0 = Math.floor(fp)
        const i1 = Math.min(i0 + 1, N - 1)
        const t  = fp - i0
        const e  = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
        const a  = CAM_STOPS[i0], b = CAM_STOPS[i1]

        cam.x  = lerp(a.pos[0],  b.pos[0],  e)
        cam.y  = lerp(a.pos[1],  b.pos[1],  e)
        cam.z  = lerp(a.pos[2],  b.pos[2],  e)
        cam.lx = lerp(a.look[0], b.look[0], e)
        cam.ly = lerp(a.look[1], b.look[1], e)
        cam.lz = lerp(a.look[2], b.look[2], e)

        camera.position.x += (cam.x - camera.position.x) * 0.04
        camera.position.y += (cam.y - camera.position.y) * 0.04
        camera.position.z += (cam.z - camera.position.z) * 0.04
        camera.lookAt(cam.lx, cam.ly, cam.lz)

        /* Pass 1 — Normals */
        scene.overrideMaterial = normalMat
        renderer.setRenderTarget(normalTarget)
        renderer.render(scene, camera)

        /* Pass 2 — Depth (white material writes correct depth) */
        scene.overrideMaterial = whiteMat
        renderer.setRenderTarget(depthTarget)
        renderer.render(scene, camera)

        /* Pass 3 — Edge detection → screen */
        scene.overrideMaterial = null
        renderer.setRenderTarget(null)
        renderer.render(fsScene, fsCamera)
      }
      animate()

      /* ── Resize ─────────────────────────────────────────────────── */
      function onResize() {
        const nW  = mount!.clientWidth
        const nH  = mount!.clientHeight
        const nDPR = Math.min(window.devicePixelRatio, 2)
        const nPW = Math.floor(nW * nDPR)
        const nPH = Math.floor(nH * nDPR)
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
        renderer.setPixelRatio(nDPR)
        normalTarget.setSize(nPW, nPH)
        depthTarget.setSize(nPW, nPH)
        edgeMat.uniforms.res.value.set(nPW, nPH)
      }
      window.addEventListener('resize', onResize)

      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', onResize)
        normalTarget.dispose()
        depthTarget.dispose()
        whiteMat.dispose()
        normalMat.dispose()
        edgeMat.dispose()
        renderer.dispose()
        if (mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [progressRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />
}
