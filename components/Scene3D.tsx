'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
  Scene3D — loads base.glb and renders it with the sketch post-processing
  pipeline from 3d entity/index.js:
    • Hatching shader: luminosity-driven pencil lines, w=0.020 (0.3mm technical pen)
    • Sobel edge detection → ink outline
    • Paper grain
  Camera starts at a frontal view, then dolly-shifts to three-quarter on scroll.
*/
export function Scene3D({ heroRef }: { heroRef: React.RefObject<HTMLElement | null> }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let rafId = 0

    ;(async () => {
      /* ── Dynamic imports (all browser-only) ─────────────────────────── */
      const THREE = await import('three')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')
      const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js')
      const { RenderPass }    = await import('three/examples/jsm/postprocessing/RenderPass.js')
      const { ShaderPass }    = await import('three/examples/jsm/postprocessing/ShaderPass.js')
      const { OutlinePass }   = await import('three/examples/jsm/postprocessing/OutlinePass.js')

      const W = mount.clientWidth
      const H = mount.clientHeight

      /* ── Renderer ─────────────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      mount.appendChild(renderer.domElement)

      /* ── Scene — warm paper bg ───────────────────────────────────────── */
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf5f0e8)

      /* ── Camera — starts FRONT VIEW ─────────────────────────────────── */
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000)
      camera.position.set(0, 2, 6)
      camera.lookAt(0, 0.5, 0)

      /* ── Ground (shadow only) ─────────────────────────────────────────── */
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.ShadowMaterial({ opacity: 0.07, color: 0x111111 })
      )
      ground.rotation.x = -Math.PI / 2
      ground.position.y = -0.01
      ground.receiveShadow = true
      scene.add(ground)

      /* ── Lighting — angled artist's lamp from upper-right ─────────────── */
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4)
      dirLight.position.set(5, 10, 3)
      dirLight.castShadow = true
      dirLight.shadow.mapSize.set(2048, 2048)
      dirLight.shadow.camera.left   = -6
      dirLight.shadow.camera.right  =  6
      dirLight.shadow.camera.top    =  6
      dirLight.shadow.camera.bottom = -6
      dirLight.shadow.bias = -0.001
      dirLight.shadow.normalBias = 0.02
      scene.add(dirLight)
      scene.add(new THREE.AmbientLight(0xffffff, 2.2))

      /* ── Sketch shader ───────────────────────────────────────────────────
         w = 0.020 → hairline 0.3mm technical pen feel (was 0.032 in draft)  */
      const SketchShader = {
        uniforms: {
          tDiffuse:   { value: null },
          resolution: { value: new THREE.Vector2(W, H) },
          time:       { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform vec2 resolution;
          uniform float time;
          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          float noise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
            return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
          }

          float hatchLine(vec2 uv, float angleDeg, float spacing, float wobble) {
            float rad = angleDeg * 3.14159 / 180.0;
            float c = cos(rad), s = sin(rad);
            vec2 sc = uv * resolution;
            float w = noise(uv * 120.0) * wobble;
            float proj = sc.x * c - sc.y * s + w;
            float line = mod(proj, spacing) / spacing;
            float lw = 0.020;  /* ← hairline pen: 0.020 (was 0.032) */
            return 1.0 - smoothstep(lw - 0.012, lw + 0.012, line)
                       * (1.0 - smoothstep(1.0 - lw - 0.012, 1.0 - lw + 0.012, line));
          }

          float edgeSobel(vec2 uv) {
            vec2 px = 1.0 / resolution;
            float tl=dot(texture2D(tDiffuse,uv+vec2(-px.x, px.y)).rgb,vec3(0.299,0.587,0.114));
            float t =dot(texture2D(tDiffuse,uv+vec2(0.0,   px.y)).rgb,vec3(0.299,0.587,0.114));
            float tr=dot(texture2D(tDiffuse,uv+vec2( px.x, px.y)).rgb,vec3(0.299,0.587,0.114));
            float l =dot(texture2D(tDiffuse,uv+vec2(-px.x, 0.0 )).rgb,vec3(0.299,0.587,0.114));
            float r =dot(texture2D(tDiffuse,uv+vec2( px.x, 0.0 )).rgb,vec3(0.299,0.587,0.114));
            float bl=dot(texture2D(tDiffuse,uv+vec2(-px.x,-px.y)).rgb,vec3(0.299,0.587,0.114));
            float b =dot(texture2D(tDiffuse,uv+vec2(0.0,  -px.y)).rgb,vec3(0.299,0.587,0.114));
            float br=dot(texture2D(tDiffuse,uv+vec2( px.x,-px.y)).rgb,vec3(0.299,0.587,0.114));
            float gx=-tl-2.0*l-bl+tr+2.0*r+br;
            float gy=-tl-2.0*t-tr+bl+2.0*b+br;
            return clamp(sqrt(gx*gx+gy*gy)*4.5, 0.0, 1.0);
          }

          void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            float lum  = dot(color.rgb, vec3(0.299,0.587,0.114));
            float isGeom = 1.0 - smoothstep(0.88, 0.94, lum);
            float h1=0.0,h2=0.0,h3=0.0;
            if (lum < 0.40) { h1=hatchLine(vUv,45.0,9.0,2.5); h2=hatchLine(vUv,-45.0,9.0,2.0); h3=hatchLine(vUv,0.0,9.0,1.5)*0.5; }
            if (lum < 0.60) { h1=max(h1,hatchLine(vUv,45.0,13.0,2.0)); h2=max(h2,hatchLine(vUv,-45.0,16.0,1.5)*0.65); }
            if (lum < 0.78) { h3=max(h3,hatchLine(vUv,45.0,20.0,1.5)*0.45); }
            float hd   = clamp(h1+h2+h3, 0.0, 1.0) * isGeom;
            float inkD = mix(0.55, 0.06, clamp((0.78-lum)/0.78, 0.0, 1.0));
            float paper= 0.97;
            float fg   = mix(paper, inkD, hd);
            float ton  = mix(0.97, 0.91, (1.0-lum)*isGeom*0.3);
            fg = min(fg, ton);
            float edge = edgeSobel(vUv);
            float ew   = noise(vUv*300.0)*0.0012;
            float e2   = edgeSobel(vUv + ew);
            fg = mix(fg, 0.04, clamp(max(edge,e2)*1.6, 0.0, 1.0));
            float grain= (hash(vUv*900.0+time*0.1)-0.5)*0.018;
            fg = clamp(fg+grain, 0.0, 1.0);
            gl_FragColor = vec4(vec3(fg), color.a);
          }
        `,
      }

      /* ── Composer ────────────────────────────────────────────────────── */
      const composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))

      const outlinePass = new OutlinePass(new THREE.Vector2(W, H), scene, camera)
      outlinePass.edgeStrength  = 4.5
      outlinePass.edgeGlow      = 0.0
      outlinePass.edgeThickness = 1.2
      outlinePass.visibleEdgeColor.set(0x0a0a0a)
      outlinePass.hiddenEdgeColor.set(0x222222)
      composer.addPass(outlinePass)

      const sketchPass = new ShaderPass(SketchShader)
      composer.addPass(sketchPass)

      /* ── Load GLB model ───────────────────────────────────────────────── */
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      const loader = new GLTFLoader()
      loader.setDRACOLoader(dracoLoader)

      loader.load('/assets/base.glb', (gltf) => {
        const model = gltf.scene
        model.name  = 'building'

        /* Normalise to 2.5 units */
        const box    = new THREE.Box3().setFromObject(model)
        const size   = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0) model.scale.multiplyScalar(2.5 / maxDim)

        box.setFromObject(model)
        box.getCenter(center)
        model.position.sub(center)

        /* Seat on ground */
        const box2 = new THREE.Box3().setFromObject(model)
        model.position.y -= box2.min.y

        /* Apply sketch-friendly material & collect meshes */
        const meshes: THREE.Mesh[] = []
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh
            m.castShadow   = true
            m.receiveShadow = false
            m.material = new THREE.MeshPhongMaterial({
              color: 0xffffff,
              specular: 0x111111,
              shininess: 8,
              side: THREE.FrontSide,
            })
            meshes.push(m)
          }
        })

        outlinePass.selectedObjects = meshes
        scene.add(model)

        /* Fine-tune camera to model centre */
        const finalBox  = new THREE.Box3().setFromObject(model)
        const modelCentre = finalBox.getCenter(new THREE.Vector3())
        camTarget.y = modelCentre.y + 0.5
      },
      undefined,
      (err) => console.error('GLB load error:', err))

      /* ── Scroll-driven camera ─────────────────────────────────────────── */
      /* Front → three-quarter shift as user scrolls through hero           */
      const camTarget = { x: 0, y: 1.5, z: 6 }
      const camEnd    = { x: 3.5, y: 2.0, z: 6 }

      ScrollTrigger.create({
        trigger: heroRef.current ?? mount,
        start: 'top top',
        end:   'bottom top',
        onUpdate: (self) => {
          const p = THREE.MathUtils.clamp(self.progress, 0, 1)
          camTarget.x = THREE.MathUtils.lerp(0,   camEnd.x, p)
          camTarget.y = THREE.MathUtils.lerp(1.5, camEnd.y, p)
          camTarget.z = THREE.MathUtils.lerp(6,   camEnd.z, p)
        },
      })

      /* ── Animate ─────────────────────────────────────────────────────── */
      let t = 0
      function animate() {
        rafId = requestAnimationFrame(animate)
        t += 0.016

        /* Smooth lerp camera toward target */
        camera.position.x += (camTarget.x - camera.position.x) * 0.04
        camera.position.y += (camTarget.y - camera.position.y) * 0.04
        camera.position.z += (camTarget.z - camera.position.z) * 0.04
        camera.lookAt(0, camTarget.y - 0.5, 0)

        sketchPass.uniforms.time.value = t
        sketchPass.uniforms.resolution.value.set(
          mount.clientWidth, mount.clientHeight
        )
        composer.render()
      }
      animate()

      /* ── Resize ────────────────────────────────────────────────────────── */
      function onResize() {
        const nW = mount.clientWidth; const nH = mount.clientHeight
        camera.aspect = nW / nH; camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
        composer.setSize(nW, nH)
        sketchPass.uniforms.resolution.value.set(nW, nH)
      }
      window.addEventListener('resize', onResize)

      /* ── Cleanup reference ─────────────────────────────────────────────── */
      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', onResize)
        ScrollTrigger.getAll().forEach(st => st.kill())
        renderer.dispose()
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [heroRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
