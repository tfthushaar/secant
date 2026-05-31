'use client'

import { useEffect, useRef } from 'react'

/*
  Scene3D — 4-pass sketch rendering
  ───────────────────────────────────
  Pass 1  MeshNormalMaterial → normalTarget   (camera-space normals for edge detection)
  Pass 2  Custom toon shader  → colorTarget   (4-step directional shading)
  Pass 3  MeshBasicMaterial  → depthTarget    (depth texture for silhouette edges)
  Pass 4  Composite shader   → screen         (toon base + crisp black edge lines)

  Flat normals from Blender export mean each face has one exact normal —
  edge detection fires cleanly at corners with zero in-between noise.
  Camera snaps to target within 0.001 world units → zero flicker at rest.
*/

const CAM_STOPS = [
  { pos: [ 0,    3.5, 11.5], look: [0,  0.6, 0] },  /* front elevation      */
  { pos: [ 0,    2.2,  7.5], look: [0,  0.4, 0] },  /* zoom in              */
  { pos: [ 8.5,  3.0,  8.5], look: [0,  0.3, 0] },  /* three-quarter right  */
  { pos: [ 7.0,  8.5,  5.0], look: [0, -0.4, 0] },  /* aerial right         */
  { pos: [-7.5,  3.0,  9.0], look: [0,  0.3, 0] },  /* three-quarter left   */
  { pos: [ 0.5, 13.5,  0.5], look: [0, -0.5, 0] },  /* top-down plan        */
]

const LERP = 0.12
const SNAP = 0.001

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

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0xffffff, 1)
      mount.appendChild(renderer.domElement)

      const scene  = new THREE.Scene()
      scene.background = new THREE.Color(0xffffff)
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 400)
      const p0 = CAM_STOPS[0]
      camera.position.set(p0.pos[0], p0.pos[1], p0.pos[2])
      camera.lookAt(p0.look[0], p0.look[1], p0.look[2])

      const rtOpts = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }
      const normalTarget = new THREE.WebGLRenderTarget(PW, PH, rtOpts)
      const colorTarget  = new THREE.WebGLRenderTarget(PW, PH, rtOpts)
      const depthTarget  = new THREE.WebGLRenderTarget(PW, PH, {
        ...rtOpts, depthBuffer: true,
        depthTexture: new THREE.DepthTexture(PW, PH),
      })

      const whiteMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide })
      const normalMat = new THREE.MeshNormalMaterial({ side: THREE.FrontSide })

      /*
        4-step toon shading — architectural sketch look.
        Light from upper-right-front gives roof highlight, lit facade,
        side shadow, and deep shadow under overhangs/eaves.
        Flat normals mean each face has one exact shade — no gradient
        across a surface, pure architectural technical drawing.
      */
      const toonMat = new THREE.ShaderMaterial({
        uniforms: {
          uLight: { value: new THREE.Vector3(0.7, 1.2, 0.8).normalize() },
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
            float d = max(dot(normalize(vWorldNormal), uLight), 0.0);
            float toon;
            if      (d > 0.65) toon = 1.00;   /* full light  — white           */
            else if (d > 0.40) toon = 0.88;   /* lit face    — near white      */
            else if (d > 0.15) toon = 0.74;   /* shadow face — medium gray     */
            else               toon = 0.60;   /* deep shadow — under overhangs */
            gl_FragColor = vec4(vec3(toon), 1.0);
          }
        `,
        side: THREE.FrontSide,
      })

      /* Composite: toon shading base + binary black edge lines */
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
          uniform float     near, far;
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

            /*
              1.5 px radius — fills gaps between adjacent edge pixels so
              lines are continuous, not dotted.
              MAX operator: one strong neighbour = solid line, stable under
              camera movement.
            */
            vec2 dirs[8];
            dirs[0] = vec2( 1.5,  0.0); dirs[1] = vec2(-1.5,  0.0);
            dirs[2] = vec2( 0.0,  1.5); dirs[3] = vec2( 0.0, -1.5);
            dirs[4] = vec2( 1.1,  1.1); dirs[5] = vec2(-1.1,  1.1);
            dirs[6] = vec2( 1.1, -1.1); dirs[7] = vec2(-1.1, -1.1);

            float nMax = 0.0, dMax = 0.0;
            for (int i = 0; i < 8; i++) {
              vec2  uv2 = vUv + dirs[i] * t;
              vec3  n2  = normalize(texture2D(tNormal, uv2).rgb * 2.0 - 1.0);
              float d2  = linDepth(uv2);
              nMax = max(nMax, 1.0 - dot(n0, n2));
              dMax = max(dMax, abs(d2 - d0));
            }

            /* Threshold tuned for flat-normal bungalow:
               90° corners → nMax=1.0 → always above → solid black line ✓
               Organic facets 30-45° → nMax<0.30 → filtered out ✓        */
            float ne   = smoothstep(0.28, 0.46, nMax);
            float de   = smoothstep(0.018, 0.045, dMax);
            float edge = max(ne, de);

            /* Binary composite — no blending, pure toon or pure ink */
            vec3  base  = texture2D(tColor, vUv).rgb;
            float mask  = step(0.5, edge);
            gl_FragColor = vec4(mix(base, vec3(0.0), mask), 1.0);
          }
        `,
        depthTest: false,
        depthWrite: false,
      })

      const fsScene  = new THREE.Scene()
      const fsMesh   = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), edgeMat)
      fsMesh.frustumCulled = false
      fsScene.add(fsMesh)
      const fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      const loader = new GLTFLoader()
      loader.setDRACOLoader(draco)

      loader.load('/assets/base.glb', (gltf) => {
        const model  = gltf.scene
        scene.add(model)
        const box    = new THREE.Box3().setFromObject(model)
        const centre = box.getCenter(new THREE.Vector3())
        const size   = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)

        /* 12 world units on longest axis — 20% bigger than the old 10 */
        const sc = 12.0 / maxDim
        model.position.sub(centre)
        model.scale.setScalar(sc)
        model.position.y -= size.y * sc * 0.15
        model.updateMatrixWorld(true)
      }, undefined, (e) => console.error('GLB error:', e))

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      const cam  = { x: p0.pos[0], y: p0.pos[1], z: p0.pos[2],
                     lx: p0.look[0], ly: p0.look[1], lz: p0.look[2] }

      function moveAxis(cur: number, tgt: number): number {
        const d = tgt - cur
        return Math.abs(d) < SNAP ? tgt : cur + d * LERP
      }

      function animate() {
        rafId = requestAnimationFrame(animate)

        /* Quantize progress to 0.1% steps → eliminates Lenis drift flicker */
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

        scene.overrideMaterial = normalMat
        renderer.setRenderTarget(normalTarget)
        renderer.render(scene, camera)

        scene.overrideMaterial = toonMat
        renderer.setRenderTarget(colorTarget)
        renderer.render(scene, camera)

        scene.overrideMaterial = whiteMat
        renderer.setRenderTarget(depthTarget)
        renderer.render(scene, camera)

        scene.overrideMaterial = null
        renderer.setRenderTarget(null)
        renderer.render(fsScene, fsCamera)
      }
      animate()

      function onResize() {
        const nW  = mount!.clientWidth, nH  = mount!.clientHeight
        const nDPR = Math.min(window.devicePixelRatio, 2)
        const nPW = Math.floor(nW * nDPR), nPH = Math.floor(nH * nDPR)
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH); renderer.setPixelRatio(nDPR)
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
