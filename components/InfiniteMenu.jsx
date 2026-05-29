/* InfiniteMenu — from React Bits, adapted for SECANT.
   Key modifications vs original:
     1. RectGeometry replaces DiscGeometry → rectangular cards, not circles
     2. Vertex shader: stretch applied to ALL vertices (no center-vertex skip)
     3. Fragment shader: containerAspect=4/3 to match rect and show full render
     4. onItemClick prop for in-app navigation instead of window.open           */

import { useEffect, useRef, useState } from 'react';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';
import './InfiniteMenu.css';

/* ── Vertex shader — rect version (no gl_VertexID guard) ───────────────── */
const discVertShaderSource = `#version 300 es

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

#define PI 3.141593

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);

    /* Apply stretch to ALL vertices — rect has no centre vertex to skip */
    vec3 rotationAxis = uRotationAxisVelocity.xyz;
    float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
    vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
    vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
    float strength = dot(stretchDir, relativeVertexPos);
    float invAbsStrength = min(0., abs(strength) - 1.);
    strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
    worldPosition.xyz += stretchDir * strength;

    worldPosition.xyz = radius * normalize(worldPosition.xyz);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

/* ── Fragment shader — uses 4:3 container aspect for render images ──────── */
const discFragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellX = itemIndex % uAtlasSize;
    int cellY = itemIndex / uAtlasSize;
    vec2 cellSize = vec2(1.0) / vec2(float(uAtlasSize));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    ivec2 texSize = textureSize(uTex, 0);
    float imageAspect = float(texSize.x) / float(texSize.y);
    float containerAspect = 4.0 / 3.0;  /* matches our 4:3 rect */

    float scale = max(imageAspect / containerAspect,
                      containerAspect / imageAspect);

    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = (st - 0.5) * scale + 0.5;
    st = clamp(st, 0.0, 1.0);
    st = st * cellSize + cellOffset;

    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`;

/* ── Geometry classes ────────────────────────────────────────────────────── */
class Face { constructor(a,b,c){this.a=a;this.b=b;this.c=c;} }
class Vertex {
  constructor(x,y,z){
    this.position = vec3.fromValues(x,y,z);
    this.normal   = vec3.create();
    this.uv       = vec2.create();
  }
}
class Geometry {
  constructor(){this.vertices=[];this.faces=[];}
  addVertex(...args){
    for(let i=0;i<args.length;i+=3)
      this.vertices.push(new Vertex(args[i],args[i+1],args[i+2]));
    return this;
  }
  addFace(...args){
    for(let i=0;i<args.length;i+=3)
      this.faces.push(new Face(args[i],args[i+1],args[i+2]));
    return this;
  }
  get lastVertex(){return this.vertices[this.vertices.length-1];}
  subdivide(divisions=1){
    const cache={};let f=this.faces;
    for(let d=0;d<divisions;++d){
      const nf=new Array(f.length*4);
      f.forEach((face,ndx)=>{
        const mAB=this.getMidPoint(face.a,face.b,cache);
        const mBC=this.getMidPoint(face.b,face.c,cache);
        const mCA=this.getMidPoint(face.c,face.a,cache);
        const i=ndx*4;
        nf[i+0]=new Face(face.a,mAB,mCA);nf[i+1]=new Face(face.b,mBC,mAB);
        nf[i+2]=new Face(face.c,mCA,mBC);nf[i+3]=new Face(mAB,mBC,mCA);
      });f=nf;
    }this.faces=f;return this;
  }
  spherize(radius=1){
    this.vertices.forEach(v=>{vec3.normalize(v.normal,v.position);vec3.scale(v.position,v.normal,radius);});
    return this;
  }
  get data(){return{vertices:this.vertexData,indices:this.indexData,normals:this.normalData,uvs:this.uvData};}
  get vertexData(){return new Float32Array(this.vertices.flatMap(v=>Array.from(v.position)));}
  get normalData(){return new Float32Array(this.vertices.flatMap(v=>Array.from(v.normal)));}
  get uvData(){return new Float32Array(this.vertices.flatMap(v=>Array.from(v.uv)));}
  get indexData(){return new Uint16Array(this.faces.flatMap(f=>[f.a,f.b,f.c]));}
  getMidPoint(ndxA,ndxB,cache){
    const key=ndxA<ndxB?`k_${ndxB}_${ndxA}`:`k_${ndxA}_${ndxB}`;
    if(Object.prototype.hasOwnProperty.call(cache,key))return cache[key];
    const a=this.vertices[ndxA].position,b=this.vertices[ndxB].position;
    const ndx=this.vertices.length;cache[key]=ndx;
    this.addVertex((a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5);
    return ndx;
  }
}

class IcosahedronGeometry extends Geometry {
  constructor(){
    super();
    const t=Math.sqrt(5)*.5+.5;
    this.addVertex(-1,t,0,1,t,0,-1,-t,0,1,-t,0,0,-1,t,0,1,t,0,-1,-t,0,1,-t,t,0,-1,t,0,1,-t,0,-1,-t,0,1)
        .addFace(0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1);
  }
}

/* ── RectGeometry — replaces DiscGeometry, gives 4:3 rectangular cards ─── */
class RectGeometry extends Geometry {
  constructor(width=2.0, height=1.5){
    super();
    const hw=width/2, hh=height/2;
    /* 4 corners: 0=TL, 1=TR, 2=BR, 3=BL */
    this.addVertex(-hw,hh,0, hw,hh,0, hw,-hh,0, -hw,-hh,0);
    /* Standard 0-1 UV mapping */
    this.vertices[0].uv=vec2.fromValues(0,1);  /* TL */
    this.vertices[1].uv=vec2.fromValues(1,1);  /* TR */
    this.vertices[2].uv=vec2.fromValues(1,0);  /* BR */
    this.vertices[3].uv=vec2.fromValues(0,0);  /* BL */
    /* Normals facing +Z */
    this.vertices.forEach(v=>vec3.set(v.normal,0,0,1));
    /* Two CCW triangles from front */
    this.addFace(0,3,1);  /* TL,BL,TR */
    this.addFace(1,3,2);  /* TR,BL,BR */
  }
}

/* ── WebGL helpers ──────────────────────────────────────────────────────── */
function createShader(gl,type,source){
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(gl.getShaderParameter(s,gl.COMPILE_STATUS))return s;
  console.error(gl.getShaderInfoLog(s));gl.deleteShader(s);return null;
}
function createProgram(gl,srcs,tfv,attribs){
  const p=gl.createProgram();
  [gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].forEach((t,i)=>{const s=createShader(gl,t,srcs[i]);if(s)gl.attachShader(p,s);});
  if(tfv)gl.transformFeedbackVaryings(p,tfv,gl.SEPARATE_ATTRIBS);
  if(attribs)for(const a in attribs)gl.bindAttribLocation(p,attribs[a],a);
  gl.linkProgram(p);
  if(gl.getProgramParameter(p,gl.LINK_STATUS))return p;
  console.error(gl.getProgramInfoLog(p));gl.deleteProgram(p);return null;
}
function makeVertexArray(gl,bufLocNums,indices){
  const va=gl.createVertexArray();gl.bindVertexArray(va);
  for(const[buf,loc,ne]of bufLocNums){if(loc===-1)continue;gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,ne,gl.FLOAT,false,0,0);}
  if(indices){const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);}
  gl.bindVertexArray(null);return va;
}
function resizeCanvasToDisplaySize(canvas){
  const dpr=Math.min(2,window.devicePixelRatio);
  const dW=Math.round(canvas.clientWidth*dpr),dH=Math.round(canvas.clientHeight*dpr);
  const need=canvas.width!==dW||canvas.height!==dH;
  if(need){canvas.width=dW;canvas.height=dH;}return need;
}
function makeBuffer(gl,data,usage){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,usage);gl.bindBuffer(gl.ARRAY_BUFFER,null);return b;}
function createAndSetupTexture(gl,min,mag,wS,wT){
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wS);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,min);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,mag);
  return t;
}

/* ── ArcballControl ─────────────────────────────────────────────────────── */
class ArcballControl {
  isPointerDown=false;orientation=quat.create();pointerRotation=quat.create();
  rotationVelocity=0;rotationAxis=vec3.fromValues(1,0,0);
  snapDirection=vec3.fromValues(0,0,-1);snapTargetDirection;
  EPSILON=0.1;IDENTITY_QUAT=quat.create();

  constructor(canvas,cb){
    this.canvas=canvas;this.updateCallback=cb||((()=>null));
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
      const INT=0.3*ts,AA=5/ts;
      const mp=vec2.sub(vec2.create(),this.pointerPos,this.previousPointerPos);
      vec2.scale(mp,mp,INT);
      if(vec2.sqrLen(mp)>this.EPSILON){
        vec2.add(mp,this.previousPointerPos,mp);
        const p=this.#project(mp),q=this.#project(this.previousPointerPos);
        const a=vec3.normalize(vec3.create(),p),b=vec3.normalize(vec3.create(),q);
        vec2.copy(this.previousPointerPos,mp);af*=AA;
        this.quatFromVectors(a,b,this.pointerRotation,af);
      }else{quat.slerp(this.pointerRotation,this.pointerRotation,this.IDENTITY_QUAT,INT);}
    }else{
      quat.slerp(this.pointerRotation,this.pointerRotation,this.IDENTITY_QUAT,0.1*ts);
      if(this.snapTargetDirection){
        const sd=0.2,a=this.snapTargetDirection,b=this.snapDirection;
        const sqD=vec3.squaredDistance(a,b),df=Math.max(0.1,1-sqD*10);
        af*=sd*df;this.quatFromVectors(a,b,sr,af);
      }
    }
    const cq=quat.multiply(quat.create(),sr,this.pointerRotation);
    this.orientation=quat.multiply(quat.create(),cq,this.orientation);
    quat.normalize(this.orientation,this.orientation);
    quat.slerp(this._combinedQuat,this._combinedQuat,cq,0.8*ts);
    quat.normalize(this._combinedQuat,this._combinedQuat);
    const rad=Math.acos(this._combinedQuat[3])*2,s=Math.sin(rad/2);
    let rv=0;
    if(s>0.000001){rv=rad/(2*Math.PI);this.rotationAxis[0]=this._combinedQuat[0]/s;this.rotationAxis[1]=this._combinedQuat[1]/s;this.rotationAxis[2]=this._combinedQuat[2]/s;}
    this._rotationVelocity+=(rv-this._rotationVelocity)*0.5*ts;
    this.rotationVelocity=this._rotationVelocity/ts;
    this.updateCallback(dt);
  }
  quatFromVectors(a,b,out,af=1){
    const axis=vec3.normalize(vec3.create(),vec3.cross(vec3.create(),a,b));
    const d=Math.max(-1,Math.min(1,vec3.dot(a,b)));
    const angle=Math.acos(d)*af;quat.setAxisAngle(out,axis,angle);
    return{q:out,axis,angle};
  }
  #project(pos){
    const r=2,w=this.canvas.clientWidth,h=this.canvas.clientHeight,s=Math.max(w,h)-1;
    const x=(2*pos[0]-w-1)/s,y=(2*pos[1]-h-1)/s;let z=0;
    const xySq=x*x+y*y,rSq=r*r;
    z=xySq<=rSq/2?Math.sqrt(rSq-xySq):rSq/Math.sqrt(xySq);
    return vec3.fromValues(-x,y,z);
  }
}

/* ── InfiniteGridMenu ───────────────────────────────────────────────────── */
class InfiniteGridMenu {
  TARGET_FRAME_DURATION=1000/60;SPHERE_RADIUS=2;
  #time=0;#deltaTime=0;#deltaFrames=0;#frames=0;
  camera={matrix:mat4.create(),near:0.1,far:40,fov:Math.PI/4,aspect:1,position:vec3.fromValues(0,0,3),up:vec3.fromValues(0,1,0),matrices:{view:mat4.create(),projection:mat4.create(),inversProjection:mat4.create()}};
  nearestVertexIndex=null;smoothRotationVelocity=0;scaleFactor=1;movementActive=false;

  constructor(canvas,items,onActiveItemChange,onMovementChange,onInit=null,scale=1){
    this.canvas=canvas;this.items=items||[];
    this.onActiveItemChange=onActiveItemChange||((()=>{}));
    this.onMovementChange=onMovementChange||((()=>{}));
    this.scaleFactor=scale;this.camera.position[2]=3*scale;
    this.#init(onInit);
  }
  resize(){
    this.viewportSize=vec2.set(this.viewportSize||vec2.create(),this.canvas.clientWidth,this.canvas.clientHeight);
    const gl=this.gl,nr=resizeCanvasToDisplaySize(gl.canvas);
    if(nr)gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
    this.#updateProjectionMatrix(gl);
  }
  run(time=0){
    this.#deltaTime=Math.min(32,time-this.#time);this.#time=time;
    this.#deltaFrames=this.#deltaTime/this.TARGET_FRAME_DURATION;this.#frames+=this.#deltaFrames;
    this.#animate(this.#deltaTime);this.#render();
    requestAnimationFrame(t=>this.run(t));
  }
  #init(onInit){
    this.gl=this.canvas.getContext('webgl2',{antialias:true,alpha:false});
    const gl=this.gl;if(!gl)throw new Error('No WebGL 2 context!');
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
    /* Use RectGeometry (4:3) instead of DiscGeometry */
    this.discGeo=new RectGeometry(2.0,1.5);
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
    this.#updateCameraMatrix();this.#updateProjectionMatrix(gl);this.resize();
    if(onInit)onInit(this);
  }
  #initTexture(){
    const gl=this.gl;
    this.tex=createAndSetupTexture(gl,gl.LINEAR,gl.LINEAR,gl.CLAMP_TO_EDGE,gl.CLAMP_TO_EDGE);
    const ic=Math.max(1,this.items.length);this.atlasSize=Math.ceil(Math.sqrt(ic));
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),cell=512;
    canvas.width=this.atlasSize*cell;canvas.height=this.atlasSize*cell;
    Promise.all(this.items.map(item=>new Promise(resolve=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.src=item.image;}))).then(imgs=>{
      imgs.forEach((img,i)=>{const x=(i%this.atlasSize)*cell,y=Math.floor(i/this.atlasSize)*cell;ctx.drawImage(img,x,y,cell,cell);});
      gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.generateMipmap(gl.TEXTURE_2D);
    });
  }
  #initDiscInstances(count){
    const gl=this.gl;
    this.discInstances={matricesArray:new Float32Array(count*16),matrices:[],buffer:gl.createBuffer()};
    for(let i=0;i<count;++i){const a=new Float32Array(this.discInstances.matricesArray.buffer,i*16*4,16);a.set(mat4.create());this.discInstances.matrices.push(a);}
    gl.bindVertexArray(this.discVAO);gl.bindBuffer(gl.ARRAY_BUFFER,this.discInstances.buffer);
    gl.bufferData(gl.ARRAY_BUFFER,this.discInstances.matricesArray.byteLength,gl.DYNAMIC_DRAW);
    for(let j=0;j<4;++j){const loc=this.discLocations.aInstanceMatrix+j;gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,4,gl.FLOAT,false,16*4,j*4*4);gl.vertexAttribDivisor(loc,1);}
    gl.bindBuffer(gl.ARRAY_BUFFER,null);gl.bindVertexArray(null);
  }
  #animate(dt){
    const gl=this.gl;this.control.update(dt,this.TARGET_FRAME_DURATION);
    const scale=0.25,SI=0.6;
    this.instancePositions.map(p=>vec3.transformQuat(vec3.create(),p,this.control.orientation)).forEach((p,ndx)=>{
      const s=(Math.abs(p[2])/this.SPHERE_RADIUS)*SI+(1-SI);
      const fs=s*scale,m=mat4.create();
      mat4.multiply(m,m,mat4.fromTranslation(mat4.create(),vec3.negate(vec3.create(),p)));
      mat4.multiply(m,m,mat4.targetTo(mat4.create(),[0,0,0],p,[0,1,0]));
      mat4.multiply(m,m,mat4.fromScaling(mat4.create(),[fs,fs,fs]));
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
    const ts=dt/this.TARGET_FRAME_DURATION+0.0001;
    let damping=5/ts,ctz=3*this.scaleFactor;
    const isMoving=this.control.isPointerDown||Math.abs(this.smoothRotationVelocity)>0.01;
    if(isMoving!==this.movementActive){this.movementActive=isMoving;this.onMovementChange(isMoving);}
    if(!this.control.isPointerDown){
      const nvi=this.#findNearestVertexIndex();
      const ii=nvi%Math.max(1,this.items.length);this.onActiveItemChange(ii);
      this.control.snapTargetDirection=vec3.normalize(vec3.create(),this.#getVertexWorldPosition(nvi));
    }else{ctz+=this.control.rotationVelocity*80+2.5;damping=7/ts;}
    this.camera.position[2]+=(ctz-this.camera.position[2])/damping;this.#updateCameraMatrix();
  }
  #findNearestVertexIndex(){
    const n=this.control.snapDirection,io=quat.conjugate(quat.create(),this.control.orientation);
    const nt=vec3.transformQuat(vec3.create(),n,io);
    let maxD=-1,nvi;
    for(let i=0;i<this.instancePositions.length;++i){const d=vec3.dot(nt,this.instancePositions[i]);if(d>maxD){maxD=d;nvi=i;}}
    return nvi;
  }
  #getVertexWorldPosition(i){return vec3.transformQuat(vec3.create(),this.instancePositions[i],this.control.orientation);}
}

/* ── React component ─────────────────────────────────────────────────────── */
export default function InfiniteMenu({ items=[], scale=1.0, onItemClick }) {
  const canvasRef   = useRef(null);
  const [activeItem,setActiveItem] = useState(null);
  const [isMoving,setIsMoving]     = useState(false);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    let sketch;
    const handleActive=index=>{const ii=index%Math.max(1,items.length);setActiveItem(items[ii]);};
    if(canvas){
      sketch=new InfiniteGridMenu(canvas,items.length?items:[{image:'https://picsum.photos/900/900',link:'',title:'',description:''}],handleActive,setIsMoving,sk=>sk.run(),scale);
    }
    const onResize=()=>sketch&&sketch.resize();
    window.addEventListener('resize',onResize);onResize();
    return()=>window.removeEventListener('resize',onResize);
  },[items,scale]);

  const handleButtonClick=()=>{
    if(!activeItem)return;
    if(onItemClick){
      onItemClick(activeItem);
    }else if(activeItem.link){
      if(activeItem.link.startsWith('http'))window.open(activeItem.link,'_blank');
    }
  };

  return(
    <div style={{position:'relative',width:'100%',height:'100%'}}>
      <canvas id="infinite-grid-menu-canvas" ref={canvasRef}/>
      {activeItem&&(
        <>
          <h2 className={`face-title ${isMoving?'inactive':'active'}`}>{activeItem.title}</h2>
          <p  className={`face-description ${isMoving?'inactive':'active'}`}>{activeItem.description}</p>
          <div onClick={handleButtonClick} className={`action-button ${isMoving?'inactive':'active'}`}>
            <p className="action-button-icon">&#x2197;</p>
          </div>
        </>
      )}
    </div>
  );
}
