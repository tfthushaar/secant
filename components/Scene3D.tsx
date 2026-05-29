'use client'

import { useEffect, useRef } from 'react'

/*
  5 camera preset angles — visited sequentially as the hero is pinned.
  Each stop represents a distinct architectural reading of the building.
*/
const CAM_STOPS = [
  { pos: [0,    0.4, 3.0], look: [0, 0.6, 0] },  /* 1 — close front elevation    */
  { pos: [2.5,  0.8, 2.8], look: [0, 0.6, 0] },  /* 2 — three-quarter entry      */
  { pos: [4.5,  1.2, 1.5], look: [0, 0.6, 0] },  /* 3 — side elevation           */
  { pos: [3.5,  3.8, 3.5], look: [0, 0.4, 0] },  /* 4 — aerial three-quarter     */
  { pos: [0.5,  5.0, 0.5], look: [0, 0.0, 0] },  /* 5 — pure aerial / plan view  */
]

interface Scene3DProps {
  progressRef: React.MutableRefObject<number>
}

export function Scene3D({ progressRef }: Scene3DProps) {
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

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf5f0e8)

      /* ── Camera — FOV 55 to show more of the large model ─────── */
      const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000)
      camera.position.set(...(CAM_STOPS[0].pos as [number,number,number]))

      /* ── Lighting ─────────────────────────────────────────────── */
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.ShadowMaterial({ opacity: 0.05, color: 0x111111 })
      )
      ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01
      ground.receiveShadow = true; scene.add(ground)

      const dir = new THREE.DirectionalLight(0xffffff, 1.3)
      dir.position.set(5, 10, 3); dir.castShadow = true
      dir.shadow.mapSize.set(2048, 2048)
      dir.shadow.camera.left = -8; dir.shadow.camera.right = 8
      dir.shadow.camera.top  =  8; dir.shadow.camera.bottom = -8
      dir.shadow.bias = -0.001; dir.shadow.normalBias = 0.02
      scene.add(dir)
      scene.add(new THREE.AmbientLight(0xffffff, 2.0))

      /* ── Sketch shader — lw=0.004 (minimum visible hairline) ──── */
      const SketchShader = {
        uniforms: {
          tDiffuse:   { value: null },
          resolution: { value: new THREE.Vector2(W, H) },
          time:       { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
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

          /* lw=0.004 — minimum hairline, 0.2mm at typical screen DPI */
          float hatch(vec2 uv,float ang,float sp,float wb){
            float c=cos(ang*3.14159/180.0),s=sin(ang*3.14159/180.0);
            vec2 sc=uv*resolution;
            float proj=sc.x*c-sc.y*s+noise(uv*120.0)*wb;
            float ln=mod(proj,sp)/sp;
            float lw=0.004;
            return 1.0-smoothstep(lw-0.006,lw+0.006,ln)*(1.0-smoothstep(1.0-lw-0.006,1.0-lw+0.006,ln));
          }

          float sobel(vec2 uv){
            vec2 px=1.0/resolution;
            float tl=dot(texture2D(tDiffuse,uv+vec2(-px.x,px.y)).rgb,vec3(.299,.587,.114));
            float t =dot(texture2D(tDiffuse,uv+vec2(0,px.y)).rgb,   vec3(.299,.587,.114));
            float tr=dot(texture2D(tDiffuse,uv+vec2(px.x,px.y)).rgb, vec3(.299,.587,.114));
            float l =dot(texture2D(tDiffuse,uv+vec2(-px.x,0)).rgb,   vec3(.299,.587,.114));
            float r =dot(texture2D(tDiffuse,uv+vec2(px.x,0)).rgb,    vec3(.299,.587,.114));
            float bl=dot(texture2D(tDiffuse,uv+vec2(-px.x,-px.y)).rgb,vec3(.299,.587,.114));
            float b =dot(texture2D(tDiffuse,uv+vec2(0,-px.y)).rgb,   vec3(.299,.587,.114));
            float br=dot(texture2D(tDiffuse,uv+vec2(px.x,-px.y)).rgb,vec3(.299,.587,.114));
            float gx=-tl-2.0*l-bl+tr+2.0*r+br;
            float gy=-tl-2.0*t-tr+bl+2.0*b+br;
            return clamp(sqrt(gx*gx+gy*gy)*4.5,0.0,1.0);
          }

          void main(){
            vec4 col=texture2D(tDiffuse,vUv);
            float lum=dot(col.rgb,vec3(.299,.587,.114));
            float isG=1.0-smoothstep(0.88,0.94,lum);
            float h1=0.0,h2=0.0,h3=0.0;
            if(lum<0.40){h1=hatch(vUv,45.0,9.0,2.5);h2=hatch(vUv,-45.0,9.0,2.0);h3=hatch(vUv,0.0,9.0,1.5)*0.5;}
            if(lum<0.60){h1=max(h1,hatch(vUv,45.0,13.0,2.0));h2=max(h2,hatch(vUv,-45.0,16.0,1.5)*0.65);}
            if(lum<0.78){h3=max(h3,hatch(vUv,45.0,20.0,1.5)*0.45);}
            float hd=clamp(h1+h2+h3,0.0,1.0)*isG;
            float fg=mix(0.97,mix(0.55,0.06,clamp((0.78-lum)/0.78,0.0,1.0)),hd);
            fg=min(fg,mix(0.97,0.91,(1.0-lum)*isG*0.3));
            fg=mix(fg,0.04,clamp(max(sobel(vUv),sobel(vUv+noise(vUv*300.0)*0.0012))*1.6,0.0,1.0));
            fg=clamp(fg+(hash(vUv*900.0+time*0.1)-0.5)*0.016,0.0,1.0);
            gl_FragColor=vec4(vec3(fg),col.a);
          }
        `,
      }

      /* ── Composer ─────────────────────────────────────────────── */
      const composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))

      const outline = new OutlinePass(new THREE.Vector2(W, H), scene, camera)
      outline.edgeStrength = 2.0; outline.edgeGlow = 0; outline.edgeThickness = 0.7
      outline.visibleEdgeColor.set(0x111111); outline.hiddenEdgeColor.set(0x444444)
      composer.addPass(outline)

      const sketch = new ShaderPass(SketchShader)
      composer.addPass(sketch)

      /* ── Load GLB — scale to 7.0 (fills canvas, rises toward SECANT) ── */
      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      const loader = new GLTFLoader(); loader.setDRACOLoader(draco)

      loader.load('/assets/base.glb', (gltf) => {
        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0) model.scale.multiplyScalar(7.0 / maxDim)   /* bigger */
        box.setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)
        const box2 = new THREE.Box3().setFromObject(model)
        model.position.y -= box2.min.y

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meshes: any[] = []
        model.traverse((c: any) => {
          if (c.isMesh) {
            const m = c
            m.castShadow = true
            m.material = new THREE.MeshPhongMaterial({
              color: 0xffffff, specular: 0x111111, shininess: 6,
              side: THREE.FrontSide,
            })
            meshes.push(m)
          }
        })
        outline.selectedObjects = meshes
        scene.add(model)
      }, undefined, (e) => console.error('GLB error', e))

      /* ── Camera state — driven by progressRef read each frame ─── */
      const cam = {
        px: CAM_STOPS[0].pos[0], py: CAM_STOPS[0].pos[1], pz: CAM_STOPS[0].pos[2],
        lx: CAM_STOPS[0].look[0], ly: CAM_STOPS[0].look[1], lz: CAM_STOPS[0].look[2],
      }

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t

      /* ── Animate ──────────────────────────────────────────────── */
      let t = 0
      function animate() {
        rafId = requestAnimationFrame(animate)
        t += 0.016

        /* Read scroll progress and map to camera keyframes */
        const p  = Math.max(0, Math.min(1, progressRef.current))
        const fp = p * (CAM_STOPS.length - 1)
        const i0 = Math.floor(fp)
        const i1 = Math.min(i0 + 1, CAM_STOPS.length - 1)
        const tRaw = fp - i0
        /* Smooth ease between stops */
        const ease = tRaw < 0.5 ? 2 * tRaw * tRaw : 1 - 2 * (1 - tRaw) * (1 - tRaw)

        const a = CAM_STOPS[i0], b = CAM_STOPS[i1]
        const tx = lerp(a.pos[0],  b.pos[0],  ease)
        const ty = lerp(a.pos[1],  b.pos[1],  ease)
        const tz = lerp(a.pos[2],  b.pos[2],  ease)
        const lx = lerp(a.look[0], b.look[0], ease)
        const ly = lerp(a.look[1], b.look[1], ease)
        const lz = lerp(a.look[2], b.look[2], ease)

        /* Smooth camera lerp for buttery transitions */
        cam.px += (tx - cam.px) * 0.04
        cam.py += (ty - cam.py) * 0.04
        cam.pz += (tz - cam.pz) * 0.04
        cam.lx += (lx - cam.lx) * 0.04
        cam.ly += (ly - cam.ly) * 0.04
        cam.lz += (lz - cam.lz) * 0.04

        camera.position.set(cam.px, cam.py, cam.pz)
        camera.lookAt(cam.lx, cam.ly, cam.lz)

        sketch.uniforms.time.value = t
        sketch.uniforms.resolution.value.set(mount!.clientWidth, mount!.clientHeight)
        composer.render()
      }
      animate()

      /* ── Resize ─────────────────────────────────────────────────── */
      function onResize() {
        const nW = mount!.clientWidth, nH = mount!.clientHeight
        camera.aspect = nW / nH; camera.updateProjectionMatrix()
        renderer.setSize(nW, nH); composer.setSize(nW, nH)
        sketch.uniforms.resolution.value.set(nW, nH)
      }
      window.addEventListener('resize', onResize)

      ;(mount as any)._cleanup3D = () => {
        cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (mount!.contains(renderer.domElement)) mount!.removeChild(renderer.domElement)
      }
    })()

    return () => { ;(mount as any)._cleanup3D?.() }
  }, [progressRef])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
