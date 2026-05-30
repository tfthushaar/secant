/* InfiniteMenu — adapted for SECANT.
   Key changes vs React Bits source:
   • RoundedRectGeometry replaces DiscGeometry — rounded rectangles, not circles
   • Atlas preserves each image's original aspect ratio (no distortion)
   • Per-instance geometry scaling matches card to image aspect
   • Fragment shader: rounded corner SDF + direct UV (no scale math needed)
   • alpha:true WebGL context — no dark border artefacts
   • Canvas click = navigate to active item (no separate Open button)
   • onItemClick prop for in-app navigation                                        */

import { useEffect, useRef, useState } from 'react';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';
import './InfiniteMenu.css';

/* ── Vertex shader (original from React Bits, unchanged) ─────────────────── */
const discVertShaderSource = `#version 300 es
uniform mat4 uWorldMatrix;uniform mat4 uViewMatrix;uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;uniform vec4 uRotationAxisVelocity;
in vec3 aModelPosition;in vec3 aModelNormal;in vec2 aModelUvs;in mat4 aInstanceMatrix;
out vec2 vUvs;out float vAlpha;flat out int vInstanceId;
#define PI 3.141593
void main(){
  vec4 worldPosition=uWorldMatrix*aInstanceMatrix*vec4(aModelPosition,1.);
  vec3 centerPos=(uWorldMatrix*aInstanceMatrix*vec4(0.,0.,0.,1.)).xyz;
  float radius=length(centerPos.xyz);
  if(gl_VertexID>0){
    vec3 ra=uRotationAxisVelocity.xyz;
    float rv=min(.15,uRotationAxisVelocity.w*15.);
    vec3 sd=normalize(cross(centerPos,ra));
    vec3 rp=normalize(worldPosition.xyz-centerPos);
    float s=dot(sd,rp);float i=min(0.,abs(s)-1.);
    s=rv*sign(s)*abs(i*i*i+1.);worldPosition.xyz+=sd*s;
  }
  worldPosition.xyz=radius*normalize(worldPosition.xyz);
  gl_Position=uProjectionMatrix*uViewMatrix*worldPosition;
  vAlpha=smoothstep(0.5,1.,normalize(worldPosition.xyz).z)*.9+.1;
  vUvs=aModelUvs;vInstanceId=gl_InstanceID;
}`;

/* ── Fragment shader — rounded corners SDF + direct UV sample ────────────── */
const discFragShaderSource = `#version 300 es
precision highp float;
uniform sampler2D uTex;uniform int uItemCount;uniform int uAtlasSize;
out vec4 outColor;in vec2 vUvs;in float vAlpha;flat in int vInstanceId;

float roundedBoxSDF(vec2 p,vec2 b,float r){
  vec2 d=abs(p)-b;
  return length(max(d,vec2(0.)))+min(max(d.x,d.y),0.)-r;
}

void main(){
  int idx=vInstanceId%uItemCount;
  int cx=idx%uAtlasSize,cy=idx/uAtlasSize;
  vec2 cellSize=vec2(1.)/vec2(float(uAtlasSize));
  vec2 cellOff=vec2(float(cx),float(cy))*cellSize;

  /* Direct UV — atlas stores images at correct aspect with transparent padding */
  vec2 st=vec2(vUvs.x,1.-vUvs.y)*cellSize+cellOff;
  outColor=texture(uTex,st);

  /* Rounded corner SDF (r=0.07 in [0,1] UV space) */
  float r=0.07;
  vec2 p=vUvs-0.5;
  float d=roundedBoxSDF(p,vec2(0.5-r),r);
  float cornerAlpha=1.-smoothstep(-0.012,0.012,d);

  outColor.a*=vAlpha*cornerAlpha;
}`;

/* ── Geometry ─────────────────────────────────────────────────────────────── */
class Face{constructor(a,b,c){this.a=a;this.b=b;this.c=c;}}
class Vertex{constructor(x,y,z){this.position=vec3.fromValues(x,y,z);this.normal=vec3.create();this.uv=vec2.create();}}
class Geometry{
  constructor(){this.vertices=[];this.faces=[];}
  addVertex(...a){for(let i=0;i<a.length;i+=3)this.vertices.push(new Vertex(a[i],a[i+1],a[i+2]));return this;}
  addFace(...a){for(let i=0;i<a.length;i+=3)this.faces.push(new Face(a[i],a[i+1],a[i+2]));return this;}
  get lastVertex(){return this.vertices[this.vertices.length-1];}
  subdivide(divs=1){
    const cache={};let f=this.faces;
    for(let d=0;d<divs;++d){const nf=new Array(f.length*4);f.forEach((face,ndx)=>{const mAB=this.getMidPoint(face.a,face.b,cache),mBC=this.getMidPoint(face.b,face.c,cache),mCA=this.getMidPoint(face.c,face.a,cache),i=ndx*4;nf[i]=new Face(face.a,mAB,mCA);nf[i+1]=new Face(face.b,mBC,mAB);nf[i+2]=new Face(face.c,mCA,mBC);nf[i+3]=new Face(mAB,mBC,mCA);});f=nf;}this.faces=f;return this;
  }
  spherize(r=1){this.vertices.forEach(v=>{vec3.normalize(v.normal,v.position);vec3.scale(v.position,v.normal,r);});return this;}
  get data(){return{vertices:this.vertexData,indices:this.indexData,normals:this.normalData,uvs:this.uvData};}
  get vertexData(){return new Float32Array(this.vertices.flatMap(v=>Array.from(v.position)));}
  get normalData(){return new Float32Array(this.vertices.flatMap(v=>Array.from(v.normal)));}
  get uvData(){return new Float32Array(this.vertices.flatMap(v=>Array.from(v.uv)));}
  get indexData(){return new Uint16Array(this.faces.flatMap(f=>[f.a,f.b,f.c]));}
  getMidPoint(a,b,cache){const key=a<b?`k_${b}_${a}`:`k_${a}_${b}`;if(Object.prototype.hasOwnProperty.call(cache,key))return cache[key];const pa=this.vertices[a].position,pb=this.vertices[b].position;const ndx=this.vertices.length;cache[key]=ndx;this.addVertex((pa[0]+pb[0])*.5,(pa[1]+pb[1])*.5,(pa[2]+pb[2])*.5);return ndx;}
}
class IcosahedronGeometry extends Geometry{
  constructor(){super();const t=Math.sqrt(5)*.5+.5;this.addVertex(-1,t,0,1,t,0,-1,-t,0,1,-t,0,0,-1,t,0,1,t,0,-1,-t,0,1,-t,t,0,-1,t,0,1,-t,0,-1,-t,0,1).addFace(0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1);}
}

/* Rounded-rectangle quad — standard 0-1 UV, CCW winding ──────────────────── */
class RoundedRectGeometry extends Geometry{
  constructor(){
    super();
    /* 4 corners at ±0.5 */
    this.addVertex(-.5,.5,0, .5,.5,0, .5,-.5,0, -.5,-.5,0);
    this.vertices[0].uv=vec2.fromValues(0,1);  /* TL */
    this.vertices[1].uv=vec2.fromValues(1,1);  /* TR */
    this.vertices[2].uv=vec2.fromValues(1,0);  /* BR */
    this.vertices[3].uv=vec2.fromValues(0,0);  /* BL */
    this.vertices.forEach(v=>vec3.set(v.normal,0,0,1));
    this.addFace(0,3,1); this.addFace(1,3,2);  /* two CCW triangles */
  }
}

/* ── WebGL helpers ─────────────────────────────────────────────────────────── */
function createShader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(gl.getShaderParameter(s,gl.COMPILE_STATUS))return s;console.error(gl.getShaderInfoLog(s));gl.deleteShader(s);return null;}
function createProgram(gl,srcs,tfv,attrs){const p=gl.createProgram();[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].forEach((t,i)=>{const s=createShader(gl,t,srcs[i]);if(s)gl.attachShader(p,s);});if(tfv)gl.transformFeedbackVaryings(p,tfv,gl.SEPARATE_ATTRIBS);if(attrs)for(const a in attrs)gl.bindAttribLocation(p,attrs[a],a);gl.linkProgram(p);if(gl.getProgramParameter(p,gl.LINK_STATUS))return p;console.error(gl.getProgramInfoLog(p));gl.deleteProgram(p);return null;}
function makeVertexArray(gl,blns,indices){const va=gl.createVertexArray();gl.bindVertexArray(va);for(const[b,l,n]of blns){if(l===-1)continue;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,0,0);}if(indices){const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);}gl.bindVertexArray(null);return va;}
function resizeCanvas(canvas){const dpr=Math.min(2,window.devicePixelRatio);const dW=Math.round(canvas.clientWidth*dpr),dH=Math.round(canvas.clientHeight*dpr);const need=canvas.width!==dW||canvas.height!==dH;if(need){canvas.width=dW;canvas.height=dH;}return need;}
function makeBuffer(gl,data,usage){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,usage);gl.bindBuffer(gl.ARRAY_BUFFER,null);return b;}
function makeTexture(gl,min,mag,wS,wT){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wS);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,min);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,mag);return t;}

/* ── ArcballControl ────────────────────────────────────────────────────────── */
class ArcballControl{
  isPointerDown=false;orientation=quat.create();pointerRotation=quat.create();
  rotationVelocity=0;rotationAxis=vec3.fromValues(1,0,0);
  snapDirection=vec3.fromValues(0,0,-1);snapTargetDirection;
  EPSILON=0.1;IDENTITY_QUAT=quat.create();

  constructor(canvas,cb){
    this.canvas=canvas;this.updateCallback=cb||(()=>null);
    this.pointerPos=vec2.create();this.previousPointerPos=vec2.create();
    this._rotationVelocity=0;this._combinedQuat=quat.create();
    canvas.addEventListener('pointerdown',e=>{vec2.set(this.pointerPos,e.clientX,e.clientY);vec2.copy(this.previousPointerPos,this.pointerPos);this.isPointerDown=true;});
    canvas.addEventListener('pointerup',()=>this.isPointerDown=false);
    canvas.addEventListener('pointerleave',()=>this.isPointerDown=false);
    canvas.addEventListener('pointermove',e=>{if(this.isPointerDown)vec2.set(this.pointerPos,e.clientX,e.clientY);});
    canvas.style.touchAction='none';
  }
  update(dt,tfd=16){
    const ts=dt/tfd+0.00001;let af=ts,sr=quat.create();
    if(this.isPointerDown){
      const INT=0.10*ts,AA=2/ts;
      const mp=vec2.sub(vec2.create(),this.pointerPos,this.previousPointerPos);vec2.scale(mp,mp,INT);
      if(vec2.sqrLen(mp)>this.EPSILON){vec2.add(mp,this.previousPointerPos,mp);const p=this.#project(mp),q=this.#project(this.previousPointerPos);vec2.copy(this.previousPointerPos,mp);af*=AA;this.quatFromVectors(vec3.normalize(vec3.create(),p),vec3.normalize(vec3.create(),q),this.pointerRotation,af);}
      else quat.slerp(this.pointerRotation,this.pointerRotation,this.IDENTITY_QUAT,INT);
    }else{
      quat.slerp(this.pointerRotation,this.pointerRotation,this.IDENTITY_QUAT,0.18*ts);
      if(this.snapTargetDirection){const sd=0.2,a=this.snapTargetDirection,b=this.snapDirection;af*=sd*Math.max(0.1,1-vec3.squaredDistance(a,b)*10);this.quatFromVectors(a,b,sr,af);}
    }
    const cq=quat.multiply(quat.create(),sr,this.pointerRotation);
    this.orientation=quat.normalize(quat.create(),quat.multiply(quat.create(),cq,this.orientation));
    quat.slerp(this._combinedQuat,this._combinedQuat,cq,0.8*ts);quat.normalize(this._combinedQuat,this._combinedQuat);
    const rad=Math.acos(this._combinedQuat[3])*2,s=Math.sin(rad/2);let rv=0;
    if(s>1e-6){rv=rad/(2*Math.PI);this.rotationAxis[0]=this._combinedQuat[0]/s;this.rotationAxis[1]=this._combinedQuat[1]/s;this.rotationAxis[2]=this._combinedQuat[2]/s;}
    this._rotationVelocity+=(rv-this._rotationVelocity)*0.5*ts;this.rotationVelocity=this._rotationVelocity/ts;
    this.updateCallback(dt);
  }
  quatFromVectors(a,b,out,af=1){const axis=vec3.normalize(vec3.create(),vec3.cross(vec3.create(),a,b));quat.setAxisAngle(out,axis,Math.acos(Math.max(-1,Math.min(1,vec3.dot(a,b))))*af);return out;}
  #project(pos){const r=2,w=this.canvas.clientWidth,h=this.canvas.clientHeight,s=Math.max(w,h)-1;const x=(2*pos[0]-w-1)/s,y=(2*pos[1]-h-1)/s;const xySq=x*x+y*y,rSq=r*r;return vec3.fromValues(-x,y,xySq<=rSq/2?Math.sqrt(rSq-xySq):rSq/Math.sqrt(xySq));}
}

/* ── InfiniteGridMenu ──────────────────────────────────────────────────────── */
class InfiniteGridMenu{
  TARGET_FRAME_DURATION=1000/60;SPHERE_RADIUS=2;
  #time=0;#deltaTime=0;#deltaFrames=0;#frames=0;
  rafId=null;

  camera={matrix:mat4.create(),near:0.1,far:40,fov:Math.PI/4,aspect:1,
    position:vec3.fromValues(0,0,3),up:vec3.fromValues(0,1,0),
    matrices:{view:mat4.create(),projection:mat4.create(),inversProjection:mat4.create()}};
  smoothRotationVelocity=0;scaleFactor=1;movementActive=false;

  constructor(canvas,items,onActiveItemChange,onMovementChange,onItemClick,onInit=null,scale=1){
    this.canvas=canvas;this.items=items||[];
    this.onActiveItemChange=onActiveItemChange||(()=>{});
    this.onMovementChange=onMovementChange||(()=>{});
    this.onItemClick=onItemClick||null;
    this.scaleFactor=scale;this.camera.position[2]=3*scale;
    this.activeItemIndex=0;
    this.instanceAspects=new Array(this.items.length).fill(1.0);
    this.#init(onInit);
  }
  stop(){if(this.rafId){cancelAnimationFrame(this.rafId);this.rafId=null;}}
  resize(){
    this.viewportSize=vec2.set(this.viewportSize||vec2.create(),this.canvas.clientWidth,this.canvas.clientHeight);
    const gl=this.gl;if(resizeCanvas(gl.canvas))gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
    this.#updateProjectionMatrix(gl);
  }
  run(time=0){
    this.#deltaTime=Math.min(32,time-this.#time);this.#time=time;
    this.#deltaFrames=this.#deltaTime/this.TARGET_FRAME_DURATION;this.#frames+=this.#deltaFrames;
    this.#animate(this.#deltaTime);this.#render();
    this.rafId=requestAnimationFrame(t=>this.run(t));
  }
  #init(onInit){
    this.gl=this.canvas.getContext('webgl2',{antialias:true,alpha:true,powerPreference:'high-performance'});
    const gl=this.gl;if(!gl)throw new Error('No WebGL 2!');
    this.viewportSize=vec2.fromValues(this.canvas.clientWidth,this.canvas.clientHeight);
    this.discProgram=createProgram(gl,[discVertShaderSource,discFragShaderSource],null,{aModelPosition:0,aModelNormal:1,aModelUvs:2,aInstanceMatrix:3});
    this.discLocations={
      aModelPosition:gl.getAttribLocation(this.discProgram,'aModelPosition'),
      aModelUvs:gl.getAttribLocation(this.discProgram,'aModelUvs'),
      aInstanceMatrix:gl.getAttribLocation(this.discProgram,'aInstanceMatrix'),
      uWorldMatrix:gl.getUniformLocation(this.discProgram,'uWorldMatrix'),
      uViewMatrix:gl.getUniformLocation(this.discProgram,'uViewMatrix'),
      uProjectionMatrix:gl.getUniformLocation(this.discProgram,'uProjectionMatrix'),
      uCameraPosition:gl.getUniformLocation(this.discProgram,'uCameraPosition'),
      uRotationAxisVelocity:gl.getUniformLocation(this.discProgram,'uRotationAxisVelocity'),
      uTex:gl.getUniformLocation(this.discProgram,'uTex'),
      uFrames:gl.getUniformLocation(this.discProgram,'uFrames'),
      uItemCount:gl.getUniformLocation(this.discProgram,'uItemCount'),
      uAtlasSize:gl.getUniformLocation(this.discProgram,'uAtlasSize')
    };

    /* Rounded rectangle geometry */
    this.discGeo=new RoundedRectGeometry();
    this.discBuffers=this.discGeo.data;
    this.discVAO=makeVertexArray(gl,[
      [makeBuffer(gl,this.discBuffers.vertices,gl.STATIC_DRAW),this.discLocations.aModelPosition,3],
      [makeBuffer(gl,this.discBuffers.uvs,gl.STATIC_DRAW),this.discLocations.aModelUvs,2]
    ],this.discBuffers.indices);

    this.icoGeo=new IcosahedronGeometry();
    this.icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS);
    this.instancePositions=this.icoGeo.vertices.map(v=>v.position);
    this.DISC_INSTANCE_COUNT=this.icoGeo.vertices.length;
    this.#initDiscInstances(this.DISC_INSTANCE_COUNT);
    this.worldMatrix=mat4.create();
    this.#initTexture();
    this.control=new ArcballControl(this.canvas,dt=>this.#onControlUpdate(dt));

    /* Click canvas = navigate to active item */
    let clickStartX=0,didMove=false;
    this.canvas.addEventListener('pointerdown',e=>{clickStartX=e.clientX;didMove=false;});
    this.canvas.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-clickStartX)>5)didMove=true;});
    this.canvas.addEventListener('click',()=>{
      if(didMove)return;
      if(this.onItemClick){
        const ii=this.activeItemIndex%Math.max(1,this.items.length);
        this.onItemClick(this.items[ii]);
      }
    });

    this.#updateCameraMatrix();this.#updateProjectionMatrix(gl);this.resize();
    if(onInit)onInit(this);
  }
  #initTexture(){
    const gl=this.gl;
    this.tex=makeTexture(gl,gl.LINEAR,gl.LINEAR,gl.CLAMP_TO_EDGE,gl.CLAMP_TO_EDGE);
    const ic=Math.max(1,this.items.length);this.atlasSize=Math.ceil(Math.sqrt(ic));
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),cell=512;
    canvas.width=this.atlasSize*cell;canvas.height=this.atlasSize*cell;
    /* Transparent background so letter/pillarbox areas are see-through */
    ctx.clearRect(0,0,canvas.width,canvas.height);

    Promise.all(this.items.map(item=>new Promise(res=>{
      const img=new Image();img.crossOrigin='anonymous';
      img.onload=()=>res({img,item});
      img.src=item.image;
    }))).then(results=>{
      results.forEach(({img,item},i)=>{
        const x=(i%this.atlasSize)*cell,y=Math.floor(i/this.atlasSize)*cell;
        const aspect=img.naturalWidth/img.naturalHeight;
        /* Store actual aspect for per-instance geometry scaling */
        this.instanceAspects[i]=aspect;
        /* Draw image preserving aspect ratio (FIT — no crop, no distortion) */
        let dw,dh,dx,dy;
        if(aspect>=1){dw=cell;dh=cell/aspect;dx=x;dy=y+(cell-dh)/2;}
        else{dh=cell;dw=cell*aspect;dx=x+(cell-dw)/2;dy=y;}
        ctx.clearRect(x,y,cell,cell);
        ctx.drawImage(img,dx,dy,dw,dh);
      });
      gl.bindTexture(gl.TEXTURE_2D,this.tex);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
  }
  #initDiscInstances(count){
    const gl=this.gl;
    this.discInstances={matricesArray:new Float32Array(count*16),matrices:[],buffer:gl.createBuffer()};
    for(let i=0;i<count;++i){const a=new Float32Array(this.discInstances.matricesArray.buffer,i*64,16);a.set(mat4.create());this.discInstances.matrices.push(a);}
    gl.bindVertexArray(this.discVAO);gl.bindBuffer(gl.ARRAY_BUFFER,this.discInstances.buffer);
    gl.bufferData(gl.ARRAY_BUFFER,this.discInstances.matricesArray.byteLength,gl.DYNAMIC_DRAW);
    for(let j=0;j<4;++j){const loc=this.discLocations.aInstanceMatrix+j;gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,4,gl.FLOAT,false,64,j*16);gl.vertexAttribDivisor(loc,1);}
    gl.bindBuffer(gl.ARRAY_BUFFER,null);gl.bindVertexArray(null);
  }
  #animate(dt){
    const gl=this.gl;this.control.update(dt,this.TARGET_FRAME_DURATION);
    const baseScale=0.30,SI=0.6;
    this.instancePositions.map(p=>vec3.transformQuat(vec3.create(),p,this.control.orientation)).forEach((p,ndx)=>{
      const s=(Math.abs(p[2])/this.SPHERE_RADIUS)*SI+(1-SI);
      const fs=s*baseScale;
      /* Per-instance aspect ratio — card matches image proportions */
      const ii=ndx%Math.max(1,this.items.length);
      const aspect=this.instanceAspects[ii]||1.0;
      const m=mat4.create();
      mat4.multiply(m,m,mat4.fromTranslation(mat4.create(),vec3.negate(vec3.create(),p)));
      mat4.multiply(m,m,mat4.targetTo(mat4.create(),[0,0,0],p,[0,1,0]));
      /* Non-uniform scale: width=fs*aspect, height=fs — card sized to image */
      mat4.multiply(m,m,mat4.fromScaling(mat4.create(),[fs*aspect,fs,fs]));
      mat4.multiply(m,m,mat4.fromTranslation(mat4.create(),[0,0,-this.SPHERE_RADIUS]));
      mat4.copy(this.discInstances.matrices[ndx],m);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER,this.discInstances.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,this.discInstances.matricesArray);
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
    this.smoothRotationVelocity=this.control.rotationVelocity;
  }
  #render(){
    const gl=this.gl;gl.useProgram(this.discProgram);
    gl.enable(gl.CULL_FACE);gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(this.discLocations.uWorldMatrix,false,this.worldMatrix);
    gl.uniformMatrix4fv(this.discLocations.uViewMatrix,false,this.camera.matrices.view);
    gl.uniformMatrix4fv(this.discLocations.uProjectionMatrix,false,this.camera.matrices.projection);
    gl.uniform3f(this.discLocations.uCameraPosition,...this.camera.position);
    gl.uniform4f(this.discLocations.uRotationAxisVelocity,...this.control.rotationAxis,this.smoothRotationVelocity*1.1);
    gl.uniform1i(this.discLocations.uItemCount,this.items.length);
    gl.uniform1i(this.discLocations.uAtlasSize,this.atlasSize);
    gl.uniform1f(this.discLocations.uFrames,this.#frames);
    gl.uniform1i(this.discLocations.uTex,0);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.tex);
    gl.bindVertexArray(this.discVAO);
    gl.drawElementsInstanced(gl.TRIANGLES,this.discBuffers.indices.length,gl.UNSIGNED_SHORT,0,this.DISC_INSTANCE_COUNT);
  }
  #updateCameraMatrix(){mat4.targetTo(this.camera.matrix,this.camera.position,[0,0,0],this.camera.up);mat4.invert(this.camera.matrices.view,this.camera.matrix);}
  #updateProjectionMatrix(gl){
    this.camera.aspect=gl.canvas.clientWidth/gl.canvas.clientHeight;
    const h=this.SPHERE_RADIUS*0.35,d=this.camera.position[2];
    this.camera.fov=this.camera.aspect>1?2*Math.atan(h/d):2*Math.atan(h/this.camera.aspect/d);
    mat4.perspective(this.camera.matrices.projection,this.camera.fov,this.camera.aspect,this.camera.near,this.camera.far);
    mat4.invert(this.camera.matrices.inversProjection,this.camera.matrices.projection);
  }
  #onControlUpdate(dt){
    const ts=dt/this.TARGET_FRAME_DURATION+0.0001;let damping=5/ts,ctz=3*this.scaleFactor;
    const isMoving=this.control.isPointerDown||Math.abs(this.smoothRotationVelocity)>0.01;
    if(isMoving!==this.movementActive){this.movementActive=isMoving;this.onMovementChange(isMoving);}
    if(!this.control.isPointerDown){
      const nvi=this.#findNearestVertexIndex();
      const ii=nvi%Math.max(1,this.items.length);
      this.activeItemIndex=ii;
      this.onActiveItemChange(ii);
      this.control.snapTargetDirection=vec3.normalize(vec3.create(),this.#getVertexWorldPosition(nvi));
    }else{ctz+=this.control.rotationVelocity*80+2.5;damping=7/ts;}
    this.camera.position[2]+=(ctz-this.camera.position[2])/damping;this.#updateCameraMatrix();
  }
  #findNearestVertexIndex(){const n=this.control.snapDirection,io=quat.conjugate(quat.create(),this.control.orientation),nt=vec3.transformQuat(vec3.create(),n,io);let maxD=-1,nvi=0;for(let i=0;i<this.instancePositions.length;++i){const d=vec3.dot(nt,this.instancePositions[i]);if(d>maxD){maxD=d;nvi=i;}}return nvi;}
  #getVertexWorldPosition(i){return vec3.transformQuat(vec3.create(),this.instancePositions[i],this.control.orientation);}
}

/* ── React component ────────────────────────────────────────────────────────── */
export default function InfiniteMenu({items=[],scale=1.0,onItemClick}){
  const canvasRef=useRef(null);
  const sketchRef=useRef(null);
  /* Keep activeItem for face-title/description display only */
  const [activeItem,setActiveItem]=useState(null);
  const [isMoving,setIsMoving]=useState(false);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const useItems=items.length?items:[{image:'https://picsum.photos/900/600',link:'',title:'',description:''}];
    const sketch=new InfiniteGridMenu(
      canvas,useItems,
      idx=>{const ii=idx%Math.max(1,useItems.length);setActiveItem(useItems[ii]);},
      setIsMoving,
      onItemClick,  /* click handler passed directly */
      sk=>sk.run(),
      scale
    );
    sketchRef.current=sketch;
    const onResize=()=>sketch.resize();
    window.addEventListener('resize',onResize);onResize();
    return()=>{sketch.stop();window.removeEventListener('resize',onResize);};
  },[items,scale,onItemClick]);

  return(
    <div style={{position:'relative',width:'100%',height:'100%'}}>
      <canvas
        id="infinite-grid-menu-canvas"
        ref={canvasRef}
        style={{cursor:'pointer'}}
      />
      {/* Title and description overlays — action button removed */}
      {activeItem&&(
        <>
          <h2 className={`face-title ${isMoving?'inactive':'active'}`}>{activeItem.title}</h2>
          <p  className={`face-description ${isMoving?'inactive':'active'}`}>{activeItem.description}</p>
        </>
      )}
    </div>
  );
}
