'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — 4-pass rendering pipeline
  ─────────────────────────────────────
  Pass 1  MeshNormalMaterial → normalTarget   (camera-space normals)
  Pass 2  Custom toon shader  → colorTarget   (3-step directional shading)
  Pass 3  MeshBasicMaterial  → depthTarget    (depth texture for silhouettes)
  Pass 4  Composite shader   → screen
            reads colorTarget as base, overlays black lines where
            normals or depth change sharply (architectural edges).

  Camera snaps to target when within 0.001 world units — eliminates
  all flicker when stationary. Wide 2px sample radius absorbs
  sub-pixel drift during movement.
*/

/*
  New model is taller (7.4 world units vs 2.6 before).
  Look-at Y raised by ~1 unit so the building fills the viewport
  below the SECANT wordmark rather than pushing above it.
*/
const CAM_STOPS = [
  { pos: [ 0,    3.5, 12.0], look: [0,  1.5, 0] },  /* front elevation      */
  { pos: [ 0,    2.5,  8.0], look: [0,  1.2, 0] },  /* zoom in              */
  { pos: [ 8.5,  3.5,  9.0], look: [0,  1.0, 0] },  /* three-quarter right  */
  { pos: [ 7.0,  9.0,  5.5], look: [0,  0.0, 0] },  /* aerial right         */
  { pos: [-8.0,  3.5,  9.0], look: [0,  1.0, 0] },  /* three-quarter left   */
  { pos: [ 0.5, 14.0,  0.5], look: [0, -1.0, 0] },  /* top-down plan        */
]

const LERP   = 0.12
const SNAP   = 0.001   /* snap to target when closer than this → zero flicker */

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
      const renderer = new THREE.WebGLRenderer({ antialias: true })
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
      const normalTarget = new THREE.WebGLRenderTarget(PW, PH, rtOpts)
      const colorTarget  = new THREE.WebGLRenderTarget(PW, PH, rtOpts)
      const depthTarget  = new THREE.WebGLRenderTarget(PW, PH, {
        ...rtOpts, depthBuffer: true,
        depthTexture: new THREE.DepthTexture(PW, PH),
      })

      /* ── Pass materials ─────────────────────────────────────────── */
      const whiteMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide })
      const normalMat = new THREE.MeshNormalMaterial({ side: THREE.FrontSide })

      /*
        Toon shader — fixed directional light from upper-right-front.
        Flat normals from the model give distinct face shading (no gradient
        across a face) which reads exactly like a technical pen drawing.
        3 steps: highlight (1.0), midtone (0.87), shadow (0.74).
      */
      const toonMat = new THREE.ShaderMaterial({
        uniforms: {
          uLight: { value: new THREE.Vector3(0.6, 1.0, 0.8).normalize() },
        },
        vertexShader: /* glsl */`
          varying vec3 vWorldNormal;
          void main() {
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position  = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          uniform vec3 uLight;
          varying vec3 vWorldNormal;
          void main() {
            float d    = max(dot(normalize(vWorldNormal), uLight), 0.0);
            /* Subtle 3-step shading — light contrast keeps organic blobs pale */
            float toon = d > 0.60 ? 1.0 : (d > 0.25 ? 0.93 : 0.84);
            gl_FragColor = vec4(vec3(toon), 1.0);
          }
        `,
        side: THREE.FrontSide,
      })

      /* ── Composite edge + shading shader ────────────────────────── */
      const edgeMat = new THREE.ShaderMaterial({
        uniforms: {
          tNormal: { value: normalTarget.texture },
          tColor:  { value: colorTarget.texture  },
          tDepth:  { value: depthTarget.depthTexture },
          res:     { value: new THREE.Vector2(PW, PH) },
          near:    { value: camera.near },
          far:     { value: camera.far  },
        },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */`
          uniform sampler2D tNormal;
          uniform sampler2D tColor;
          uniform sampler2D tDepth;
          uniform vec2      res;
          uniform float     near;
          uniform float     far;
          varying vec2      vUv;

          float linDepth(vec2 uv) {
            float d = texture2D(tDepth, uv).r;
            float z = d * 2.0 - 1.0;
            return (2.0 * near * far) / (far + near - z * (far - near)) / far;
          }

          void main() {
            vec2  t  = 1.0 / res;
            vec3  n0 = normalize(texture2D(tNormal, vUv).rgb * 2.0 - 1.0);
            float d0 = linDepth(vUv);

            /* 8 neighbours at 1 px radius — thin crisp lines, MAX for stability */
            vec2 dirs[8];
            dirs[0] = vec2( 1.0,  0.0); dirs[1] = vec2(-1.0,  0.0);
            dirs[2] = vec2( 0.0,  1.0); dirs[3] = vec2( 0.0, -1.0);
            dirs[4] = vec2( 0.8,  0.8); dirs[5] = vec2(-0.8,  0.8);
            dirs[6] = vec2( 0.8, -0.8); dirs[7] = vec2(-0.8, -0.8);

            float nMax = 0.0, dMax = 0.0;
            for (int i = 0; i < 8; i++) {
              vec2  uv2 = vUv + dirs[i] * t;
              vec3  n2  = normalize(texture2D(tNormal, uv2).rgb * 2.0 - 1.0);
              float d2  = linDepth(uv2);
              nMax = max(nMax, 1.0 - dot(n0, n2));
              dMax = max(dMax, abs(d2 - d0));
            }

            /*
              High threshold (0.35) = only show 50°+ angular changes.
              Architectural 90° corners: always above threshold → always solid.
              Organic rock facets (30-45°): below threshold → invisible.
              Narrow range (0.15) = near-binary output, crisp not blurry.
            */
            float ne   = smoothstep(0.35, 0.50, nMax);
            float de   = smoothstep(0.020, 0.045, dMax);
            float edge = max(ne, de);

            /* Hard composite — no blending at edges, purely toon or purely black */
            vec3  base  = texture2D(tColor, vUv).rgb;
            float mask  = step(0.5, edge);           /* binary: edge or not */
            vec3  color = mix(base, vec3(0.0), mask);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
        depthTest: false,
        depthWrite: false,
      })

      const fsMesh   = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), edgeMat)
      fsMesh.frustumCulled = false
      const fsScene  = new THREE.Scene()
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
      }, undefined, (e) => console.error('GLB error:', e))

      /* ── Camera lerp with snap threshold ───────────────────────── */
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      const cam  = { x: p0.pos[0], y: p0.pos[1], z: p0.pos[2],
                     lx: p0.look[0], ly: p0.look[1], lz: p0.look[2] }

      function moveAxis(cur: number, tgt: number): number {
        const d = tgt - cur
        return Math.abs(d) < SNAP ? tgt : cur + d * LERP
      }

      function animate() {
        rafId = requestAnimationFrame(animate)

        /* Quantize to 0.1% steps — eliminates Lenis momentum drift from
           updating progressRef by tiny amounts after user stops scrolling */
        const p  = Math.round(Math.max(0, Math.min(1, progressRef.current)) * 1000) / 1000
        const N  = CAM_STOPS.length
        const fp = p * (N - 1)
        const i0 = Math.floor(fp), i1 = Math.min(i0 + 1, N - 1)
        const t  = fp - i0
        const e  = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
        const a  = CAM_STOPS[i0], b = CAM_STOPS[i1]

        cam.x  = lerp(a.pos[0],  b.pos[0],  e)
        cam.y  = lerp(a.pos[1],  b.pos[1],  e)
        cam.z  = lerp(a.pos[2],  b.pos[2],  e)
        cam.lx = lerp(a.look[0], b.look[0], e)
        cam.ly = lerp(a.look[1], b.look[1], e)
        cam.lz = lerp(a.look[2], b.look[2], e)

        camera.position.x = moveAxis(camera.position.x, cam.x)
        camera.position.y = moveAxis(camera.position.y, cam.y)
        camera.position.z = moveAxis(camera.position.z, cam.z)
        camera.lookAt(cam.lx, cam.ly, cam.lz)

        /* Pass 1 — Normals */
        scene.overrideMaterial = normalMat
        renderer.setRenderTarget(normalTarget)
        renderer.render(scene, camera)

        /* Pass 2 — Toon shading */
        scene.overrideMaterial = toonMat
        renderer.setRenderTarget(colorTarget)
        renderer.render(scene, camera)

        /* Pass 3 — Depth */
        scene.overrideMaterial = whiteMat
        renderer.setRenderTarget(depthTarget)
        renderer.render(scene, camera)

        /* Pass 4 — Composite to screen */
        scene.overrideMaterial = null
        renderer.setRenderTarget(null)
        renderer.render(fsScene, fsCamera)
      }
      animate()

      /* ── Resize ─────────────────────────────────────────────────── */
      function onResize() {
        const nW  = mount!.clientWidth, nH  = mount!.clientHeight
        const nDPR = Math.min(window.devicePixelRatio, 2)
        const nPW = Math.floor(nW * nDPR), nPH = Math.floor(nH * nDPR)
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
        renderer.setPixelRatio(nDPR)
        normalTarget.setSize(nPW, nPH)
        colorTarget.setSize(nPW, nPH)
        depthTarget.setSize(nPW, nPH)
        edgeMat.uniforms.res.value.set(nPW, nPH)
      }
      window.addEventListener('resize', onResize)

      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', onResize)
        normalTarget.dispose(); colorTarget.dispose(); depthTarget.dispose()
        whiteMat.dispose(); normalMat.dispose(); toonMat.dispose(); edgeMat.dispose()
        renderer.dispose()
        if (mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [progressRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />
}
