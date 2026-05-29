'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
  Scene3D — loads base.glb with sketch post-processing.
  Camera visits 4 preset architectural angles as the user scrolls:
    0%   → Front elevation  (straight-on facade)
    33%  → Three-quarter    (classic architecture photo angle)
    66%  → Side elevation   (right-facing)
    100% → Aerial           (bird's-eye overview)
  Lines thinned to lw=0.008 (≈ 0.2mm mechanical pencil).
  Model scaled to 4.0 units (bigger).
*/

const CAM_STOPS = [
  { pos: [0, 1.5, 6],   look: [0, 0.8, 0], label: 'Front elevation' },
  { pos: [3.5, 2.0, 5], look: [0, 0.8, 0], label: 'Three-quarter'   },
  { pos: [5.0, 2.0, 1], look: [0, 0.8, 0], label: 'Side elevation'  },
  { pos: [2.5, 4.5, 4], look: [0, 0.5, 0], label: 'Aerial overview'  },
]

export function Scene3D({ heroRef }: { heroRef: React.RefObject<HTMLElement | null> }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let rafId = 0

    ;(async () => {
      const THREE = await import('three')
      const { GLTFLoader }    = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader }   = await import('three/examples/jsm/loaders/DRACOLoader.js')
      const { EffectComposer }= await import('three/examples/jsm/postprocessing/EffectComposer.js')
      const { RenderPass }    = await import('three/examples/jsm/postprocessing/RenderPass.js')
      const { ShaderPass }    = await import('three/examples/jsm/postprocessing/ShaderPass.js')
      const { OutlinePass }   = await import('three/examples/jsm/postprocessing/OutlinePass.js')

      const W = mount.clientWidth, H = mount.clientHeight

      /* ── Renderer ─────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      mount.appendChild(renderer.domElement)

      /* ── Scene ────────────────────────────────────────────────── */
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf5f0e8)

      /* ── Camera — starts at front elevation ──────────────────── */
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000)
      camera.position.set(...(CAM_STOPS[0].pos as [number,number,number]))
      camera.lookAt(...(CAM_STOPS[0].look as [number,number,number]))

      /* ── Shadow ground ────────────────────────────────────────── */
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.ShadowMaterial({ opacity: 0.06, color: 0x111111 })
      )
      ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01
      ground.receiveShadow = true; scene.add(ground)

      /* ── Lighting ─────────────────────────────────────────────── */
      const dir = new THREE.DirectionalLight(0xffffff, 1.4)
      dir.position.set(5, 10, 3); dir.castShadow = true
      dir.shadow.mapSize.set(2048, 2048)
      dir.shadow.camera.left = -6; dir.shadow.camera.right = 6
      dir.shadow.camera.top  =  6; dir.shadow.camera.bottom = -6
      dir.shadow.bias = -0.001; dir.shadow.normalBias = 0.02; scene.add(dir)
      scene.add(new THREE.AmbientLight(0xffffff, 2.2))

      /* ── Sketch shader ────────────────────────────────────────────
         lw=0.008 → hairline mechanical pencil (≈0.2mm)             */
      const SketchShader = {
        uniforms: {
          tDiffuse:   { value: null },
          resolution: { value: new THREE.Vector2(W, H) },
          time:       { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform vec2 resolution;
          uniform float time;
          varying vec2 vUv;

          float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float noise(vec2 p){
            vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
          }
          float hatch(vec2 uv,float ang,float sp,float wb){
            float r=ang*3.14159/180.0;
            float c=cos(r),s=sin(r);
            vec2 sc=uv*resolution;
            float wob=noise(uv*120.0)*wb;
            float proj=sc.x*c-sc.y*s+wob;
            float line=mod(proj,sp)/sp;
            float lw=0.008;          /* ← pencil-thin: 0.008 */
            return 1.0-smoothstep(lw-0.008,lw+0.008,line)*(1.0-smoothstep(1.0-lw-0.008,1.0-lw+0.008,line));
          }
          float sobel(vec2 uv){
            vec2 px=1.0/resolution;
            float tl=dot(texture2D(tDiffuse,uv+vec2(-px.x,px.y)).rgb,vec3(0.299,0.587,0.114));
            float t =dot(texture2D(tDiffuse,uv+vec2(0,px.y)).rgb,vec3(0.299,0.587,0.114));
            float tr=dot(texture2D(tDiffuse,uv+vec2(px.x,px.y)).rgb,vec3(0.299,0.587,0.114));
            float l =dot(texture2D(tDiffuse,uv+vec2(-px.x,0)).rgb,vec3(0.299,0.587,0.114));
            float r =dot(texture2D(tDiffuse,uv+vec2(px.x,0)).rgb,vec3(0.299,0.587,0.114));
            float bl=dot(texture2D(tDiffuse,uv+vec2(-px.x,-px.y)).rgb,vec3(0.299,0.587,0.114));
            float b =dot(texture2D(tDiffuse,uv+vec2(0,-px.y)).rgb,vec3(0.299,0.587,0.114));
            float br=dot(texture2D(tDiffuse,uv+vec2(px.x,-px.y)).rgb,vec3(0.299,0.587,0.114));
            float gx=-tl-2.0*l-bl+tr+2.0*r+br;
            float gy=-tl-2.0*t-tr+bl+2.0*b+br;
            return clamp(sqrt(gx*gx+gy*gy)*4.5,0.0,1.0);
          }
          void main(){
            vec4 col=texture2D(tDiffuse,vUv);
            float lum=dot(col.rgb,vec3(0.299,0.587,0.114));
            float isG=1.0-smoothstep(0.88,0.94,lum);
            float h1=0.0,h2=0.0,h3=0.0;
            if(lum<0.40){h1=hatch(vUv,45.0,9.0,2.5);h2=hatch(vUv,-45.0,9.0,2.0);h3=hatch(vUv,0.0,9.0,1.5)*0.5;}
            if(lum<0.60){h1=max(h1,hatch(vUv,45.0,13.0,2.0));h2=max(h2,hatch(vUv,-45.0,16.0,1.5)*0.65);}
            if(lum<0.78){h3=max(h3,hatch(vUv,45.0,20.0,1.5)*0.45);}
            float hd=clamp(h1+h2+h3,0.0,1.0)*isG;
            float inkD=mix(0.55,0.06,clamp((0.78-lum)/0.78,0.0,1.0));
            float fg=mix(0.97,inkD,hd);
            fg=min(fg,mix(0.97,0.91,(1.0-lum)*isG*0.3));
            float edge=sobel(vUv);
            float ew=noise(vUv*300.0)*0.0012;
            fg=mix(fg,0.04,clamp(max(edge,sobel(vUv+ew))*1.6,0.0,1.0));
            float grain=(hash(vUv*900.0+time*0.1)-0.5)*0.018;
            gl_FragColor=vec4(vec3(clamp(fg+grain,0.0,1.0)),col.a);
          }
        `,
      }

      /* ── Composer ─────────────────────────────────────────────── */
      const composer  = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))

      const outline = new OutlinePass(new THREE.Vector2(W, H), scene, camera)
      outline.edgeStrength = 2.5; outline.edgeGlow = 0; outline.edgeThickness = 0.8
      outline.visibleEdgeColor.set(0x0a0a0a); outline.hiddenEdgeColor.set(0x333333)
      composer.addPass(outline)

      const sketch = new ShaderPass(SketchShader)
      composer.addPass(sketch)

      /* ── Load GLB ─────────────────────────────────────────────── */
      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      const loader = new GLTFLoader(); loader.setDRACOLoader(draco)

      loader.load('/assets/base.glb', (gltf) => {
        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0) model.scale.multiplyScalar(4.0 / maxDim)   /* bigger: 4.0 */
        box.setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)
        const box2 = new THREE.Box3().setFromObject(model)
        model.position.y -= box2.min.y

        const meshes: THREE.Mesh[] = []
        model.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const m = c as THREE.Mesh
            m.castShadow = true
            m.material = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x111111, shininess: 8 })
            meshes.push(m)
          }
        })
        outline.selectedObjects = meshes
        scene.add(model)
      }, undefined, (e) => console.error('GLB load error', e))

      /* ── Scroll-driven camera keyframes ──────────────────────────
         User scrolls through 4 preset angles.                       */
      const cam = {
        px: CAM_STOPS[0].pos[0], py: CAM_STOPS[0].pos[1], pz: CAM_STOPS[0].pos[2],
        lx: CAM_STOPS[0].look[0], ly: CAM_STOPS[0].look[1], lz: CAM_STOPS[0].look[2],
      }
      const target = { ...cam }

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

      ScrollTrigger.create({
        trigger: heroRef.current ?? mount!,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          const p  = clamp01(self.progress) * (CAM_STOPS.length - 1)
          const i0 = Math.floor(p)
          const i1 = Math.min(i0 + 1, CAM_STOPS.length - 1)
          const tRaw  = p - i0
          const ease  = tRaw < 0.5 ? 2 * tRaw * tRaw : 1 - 2 * (1 - tRaw) * (1 - tRaw)

          const a = CAM_STOPS[i0], b = CAM_STOPS[i1]
          target.px = lerp(a.pos[0],  b.pos[0],  ease)
          target.py = lerp(a.pos[1],  b.pos[1],  ease)
          target.pz = lerp(a.pos[2],  b.pos[2],  ease)
          target.lx = lerp(a.look[0], b.look[0], ease)
          target.ly = lerp(a.look[1], b.look[1], ease)
          target.lz = lerp(a.look[2], b.look[2], ease)
        },
      })

      /* ── Animate ───────────────────────────────────────────────── */
      let t = 0
      const LERP = 0.038   /* camera follow speed */
      function animate() {
        rafId = requestAnimationFrame(animate); t += 0.016
        cam.px += (target.px - cam.px) * LERP
        cam.py += (target.py - cam.py) * LERP
        cam.pz += (target.pz - cam.pz) * LERP
        cam.lx += (target.lx - cam.lx) * LERP
        cam.ly += (target.ly - cam.ly) * LERP
        cam.lz += (target.lz - cam.lz) * LERP
        camera.position.set(cam.px, cam.py, cam.pz)
        camera.lookAt(cam.lx, cam.ly, cam.lz)
        sketch.uniforms.time.value = t
        sketch.uniforms.resolution.value.set(mount.clientWidth, mount.clientHeight)
        composer.render()
      }
      animate()

      /* ── Resize ─────────────────────────────────────────────────── */
      function onResize() {
        const nW = mount.clientWidth, nH = mount.clientHeight
        camera.aspect = nW / nH; camera.updateProjectionMatrix()
        renderer.setSize(nW, nH); composer.setSize(nW, nH)
        sketch.uniforms.resolution.value.set(nW, nH)
      }
      window.addEventListener('resize', onResize)
      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize)
        ScrollTrigger.getAll().forEach(s => s.kill())
        renderer.dispose()
        if (mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [heroRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
