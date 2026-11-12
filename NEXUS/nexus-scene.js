/* NEXUS — WebGL scene: galaxy particles, nebula, warp tunnel, black hole + lensing, spacetime grid, bloom/VFX post */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const NX = window.NX;
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
} catch (e) {
  document.body.classList.add('nogl'); NX.ready = true; throw e;
}
renderer.setClearColor(0x03040a, 1);
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
scene.add(camera);

/* ================= GLSL helpers ================= */
const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float a=0.5,s=0.0;for(int i=0;i<4;i++){s+=a*snoise(p);p*=2.03;a*=0.5;}return s;}
`;

/* ================= NEBULA (baked once into a cubemap) ================= */
{
  const nebScene = new THREE.Scene();
  const neb = new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: NOISE + `
      varying vec3 vD;
      void main(){
        vec3 d=normalize(vD);
        float n=fbm(d*2.2);
        float n2=fbm(d*4.5+n*1.6+vec3(7.0));
        float band=exp(-pow((d.y+0.18*d.x)*2.6+n*0.5,2.0));
        vec3 c=mix(vec3(0.22,0.05,0.42),vec3(0.0,0.32,0.55),n2*0.5+0.5);
        c=mix(c,vec3(0.75,0.08,0.45),smoothstep(0.25,0.75,n));
        float I=(0.025+band*0.17)*smoothstep(-0.5,0.7,n2+n*0.6);
        float dust=smoothstep(0.1,0.5,fbm(d*9.0+3.0))*band;
        c*=I*(1.0-dust*0.6);
        gl_FragColor=vec4(c,1.0);
      }`
  }));
  nebScene.add(neb);
  const cubeRT = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType, generateMipmaps: false });
  const cubeCam = new THREE.CubeCamera(1, 1000, cubeRT);
  cubeCam.update(renderer, nebScene);
  scene.background = cubeRT.texture;
  neb.geometry.dispose(); neb.material.dispose();
}

/* ================= DISTANT STARS ================= */
const starMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uPR: { value: 1 } },
  vertexShader: `attribute float aS; attribute vec3 aC; uniform float uTime,uPR; varying vec3 vC;
    void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv;
      float tw=0.6+0.4*sin(uTime*(1.0+aS*2.0)+position.x*0.13);
      gl_PointSize=aS*uPR; vC=aC*tw; }`,
  fragmentShader: `varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float s=smoothstep(0.5,0.0,d); gl_FragColor=vec4(vC*s*s,1.0);} `
});
const stars = (() => {
  const N = 9000, p = new Float32Array(N * 3), c = new Float32Array(N * 3), s = new Float32Array(N);
  const v = new THREE.Vector3(), pal = [[.7, .85, 1], [1, .9, .75], [.85, .7, 1], [1, 1, 1]];
  for (let i = 0; i < N; i++) {
    v.randomDirection().multiplyScalar(500 + Math.random() * 200); v.toArray(p, i * 3);
    const k = pal[(Math.random() * 4) | 0], b = 0.3 + Math.pow(Math.random(), 4) * 1.4;
    c.set([k[0] * b, k[1] * b, k[2] * b], i * 3);
    s[i] = 1 + Math.pow(Math.random(), 6) * 4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aC', new THREE.BufferAttribute(c, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
  const m = new THREE.Points(g, starMat); m.frustumCulled = false; scene.add(m); return m;
})();

/* ================= NEAR DUST (true 3D parallax) ================= */
const dustMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uPR: { value: 1 }, uTime: { value: 0 } },
  vertexShader: `attribute float aS; uniform float uPR,uTime; varying float vA;
    void main(){ vec3 p=position; p.y+=sin(uTime*0.2+position.x)*0.4;
      vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
      gl_PointSize=min(aS*uPR*40.0/-mv.z,20.0); vA=smoothstep(120.0,10.0,-mv.z)*smoothstep(0.5,3.0,-mv.z); }`,
  fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float s=smoothstep(0.5,0.0,d);
    gl_FragColor=vec4(vec3(0.55,0.75,1.0)*s*s*vA*0.7,1.0);} `
});
{
  const N = 5000, p = new Float32Array(N * 3), s = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    p.set([(Math.random() - .5) * 120, (Math.random() - .5) * 60, 40 - Math.random() * 220], i * 3);
    s[i] = 0.5 + Math.random() * 1.5;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
  const m = new THREE.Points(g, dustMat); m.frustumCulled = false; scene.add(m);
}

/* ================= GALAXY ================= */
const MAXG = 130000;
const galMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uMouse: { value: new THREE.Vector3(999, 0, 999) }, uMouseOn: { value: 0 }, uShock: { value: 0 } },
  vertexShader: `
    attribute vec3 aP; attribute vec3 aC; attribute float aS;
    uniform float uTime,uPR,uMouseOn,uShock; uniform vec3 uMouse;
    varying vec3 vC;
    void main(){
      float r=aP.x;
      float w=0.03+0.42/(r*r*0.12+1.0);
      float a=aP.y+uTime*w;
      vec3 p=vec3(cos(a)*r,aP.z,sin(a)*r);
      // gravity well under the cursor
      vec2 d=p.xz-uMouse.xz; float dist=length(d);
      float f=smoothstep(4.0,0.0,dist)*uMouseOn;
      vec2 dir=d/(dist+1e-4);
      p.xz+=dir*f*1.8 + vec2(-dir.y,dir.x)*f*1.2;
      p.y+=f*f*1.6*sign(aP.z+1e-4);
      // global shock breathing
      p*=1.0+uShock*0.18*sin(r*1.4-uShock*6.0);
      vec4 mv=modelViewMatrix*vec4(p,1.0);
      gl_Position=projectionMatrix*mv;
      gl_PointSize=min(aS*uPR*30.0*(1.0+f*1.8)/-mv.z,48.0);
      vC=aC*(1.0+f*2.5+uShock*1.5);
    }`,
  fragmentShader: `varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float s=smoothstep(0.5,0.0,d); gl_FragColor=vec4(vC*s*s,1.0);} `
});
const galaxy = (() => {
  const aP = new Float32Array(MAXG * 3), aC = new Float32Array(MAXG * 3), aS = new Float32Array(MAXG);
  const arms = 4, R = 12, TAU = Math.PI * 2;
  const cIn = new THREE.Color(1.0, 0.72, 0.42), cMid = new THREE.Color(0.32, 0.85, 1.0), cOut = new THREE.Color(0.75, 0.3, 1.0), cHot = new THREE.Color(1, 0.35, 0.8), tmp = new THREE.Color();
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  for (let i = 0; i < MAXG; i++) {
    const core = Math.random() < 0.16;
    const r = core ? Math.pow(Math.random(), 1.8) * 2.4 : 0.5 + Math.pow(Math.random(), 1.25) * R;
    const base = (i % arms) / arms * TAU + r * 0.5;
    const rnd = core ? 1.0 : 0.22 + r * 0.035;
    const x = Math.cos(base) * r + Math.pow(Math.random(), 2.5) * Math.sign(Math.random() - .5) * rnd * r * (core ? 1 : .55);
    const z = Math.sin(base) * r + Math.pow(Math.random(), 2.5) * Math.sign(Math.random() - .5) * rnd * r * (core ? 1 : .55);
    const rr = Math.hypot(x, z);
    aP[i * 3] = rr; aP[i * 3 + 1] = Math.atan2(z, x);
    aP[i * 3 + 2] = gauss() * (0.12 + Math.exp(-rr * 0.9) * 0.9);
    const t = rr / R;
    if (t < 0.35) tmp.copy(cIn).lerp(cMid, t / 0.35); else tmp.copy(cMid).lerp(cOut, Math.min(1, (t - .35) / .5));
    if (Math.random() < 0.05) tmp.copy(cHot);
    if (Math.random() < 0.04) tmp.setRGB(1, 1, 1);
    const b = core ? 0.5 : 0.75;
    aC.set([tmp.r * b, tmp.g * b, tmp.b * b], i * 3);
    aS[i] = 0.7 + Math.random() * 1.6 + (Math.random() < 0.01 ? 4 : 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXG * 3), 3));
  g.setAttribute('aP', new THREE.BufferAttribute(aP, 3));
  g.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  const m = new THREE.Points(g, galMat); m.frustumCulled = false; scene.add(m); return m;
})();
// core glow sprite
function glowTex(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex([[0, 'rgba(255,230,200,1)'], [0.15, 'rgba(255,170,120,.55)'], [0.45, 'rgba(160,80,255,.12)'], [1, 'rgba(0,0,0,0)']]),
  blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
}));
coreGlow.scale.set(14, 14, 1); scene.add(coreGlow);

/* ================= WARP STREAKS (camera-local) ================= */
const warpMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uDist: { value: 0 }, uWarp: { value: 0 } },
  vertexShader: `attribute vec3 aSeed; attribute float aEnd; attribute vec3 aC;
    uniform float uDist,uWarp; varying vec3 vC; varying float vA;
    void main(){
      float L=240.0;
      float z=-L+mod(aSeed.z*L+uDist,L+10.0);
      float len=0.3+uWarp*uWarp*34.0;
      vec3 p=vec3(aSeed.xy,z-aEnd*len);
      vA=uWarp*smoothstep(-L,-L*0.55,z)*(1.0-aEnd*0.95);
      vC=aC;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    }`,
  fragmentShader: `varying vec3 vC; varying float vA; void main(){ gl_FragColor=vec4(vC*vA,1.0);} `
});
{
  const N = 2400, seed = new Float32Array(N * 6), end = new Float32Array(N * 2), col = new Float32Array(N * 6);
  const pal = [[.4, .95, 1], [1, .35, .85], [.7, .55, 1], [1, 1, 1]];
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, r = 1.2 + Math.pow(Math.random(), .7) * 26;
    const x = Math.cos(a) * r, y = Math.sin(a) * r, ph = Math.random();
    seed.set([x, y, ph, x, y, ph], i * 6); end.set([0, 1], i * 2);
    const k = pal[(Math.random() * 4) | 0], b = 0.6 + Math.random() * 1.2;
    col.set([k[0] * b, k[1] * b, k[2] * b, k[0] * b, k[1] * b, k[2] * b], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  g.setAttribute('aC', new THREE.BufferAttribute(col, 3));
  const m = new THREE.LineSegments(g, warpMat); m.frustumCulled = false; camera.add(m);
}

/* ================= BLACK HOLE ================= */
const BH = new THREE.Vector3(0, 0, -80), BH_R = 1.6;
const bhGroup = new THREE.Group(); bhGroup.position.copy(BH); scene.add(bhGroup);
const horizon = new THREE.Mesh(new THREE.SphereGeometry(BH_R, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
horizon.renderOrder = 2; bhGroup.add(horizon);

const diskFrag = NOISE + `
  uniform float uTime,uInner,uOuter,uGain; uniform vec3 uCam;
  varying vec2 vL; varying vec3 vW; varying vec3 vTan;
  void main(){
    float r=length(vL); float a=atan(vL.y,vL.x);
    float t=clamp((r-uInner)/(uOuter-uInner),0.0,1.0);
    float a2=a-uTime*(2.2/r);
    vec3 q=vec3(cos(a2)*r,sin(a2)*r,r*1.7);
    float n=fbm(q*0.9)*0.5+0.5;
    float streak=snoise(vec3(cos(a2)*3.0,sin(a2)*3.0,r*5.0))*0.5+0.5;
    vec3 c=mix(vec3(1.0,0.96,0.88)*2.6,vec3(1.0,0.48,0.16)*1.4,smoothstep(0.0,0.35,t));
    c=mix(c,vec3(0.85,0.14,0.62),smoothstep(0.45,1.0,t));
    float I=pow(1.0-t,1.6)*(0.35+n*0.9)*(0.6+streak*0.6);
    I*=smoothstep(0.0,0.04,t)*smoothstep(1.0,0.55,t);
    float dop=dot(normalize(vTan),normalize(uCam-vW));
    I*=1.0+dop*0.85;
    gl_FragColor=vec4(c*I*uGain,1.0);
  }`;
const diskVert = `varying vec2 vL; varying vec3 vW; varying vec3 vTan;
  void main(){ vL=position.xy; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz;
    float a=atan(position.y,position.x); vTan=mat3(modelMatrix)*vec3(-sin(a),cos(a),0.0);
    gl_Position=projectionMatrix*viewMatrix*w; }`;
const mkDisk = (inner, outer, gain) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTime: { value: 0 }, uInner: { value: inner }, uOuter: { value: outer }, uGain: { value: gain }, uCam: { value: new THREE.Vector3() } },
  vertexShader: diskVert, fragmentShader: diskFrag
});
const diskMat = mkDisk(2.0, 8.5, 1.0);
const disk = new THREE.Mesh(new THREE.RingGeometry(2.0, 8.5, 160, 1), diskMat);
disk.rotation.x = -Math.PI / 2 + 0.22; disk.rotation.z = 0.1; bhGroup.add(disk);
// billboarded halo = lensed back side of disk + photon ring
const haloMat = mkDisk(1.62, 3.8, 0.75);
const halo = new THREE.Mesh(new THREE.RingGeometry(1.62, 3.8, 128, 1), haloMat);
bhGroup.add(halo);
const bhGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex([[0, 'rgba(255,180,120,0)'], [0.18, 'rgba(255,170,110,.5)'], [0.35, 'rgba(255,80,180,.18)'], [1, 'rgba(0,0,0,0)']]),
  blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
}));
bhGlow.scale.set(26, 26, 1); bhGroup.add(bhGlow);

/* ================= SPACETIME GRID (gravity well) ================= */
const gridMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTime: { value: 0 }, uPulse: { value: 0 } },
  vertexShader: `uniform float uTime,uPulse; varying vec2 vXZ; varying float vR;
    void main(){ vec3 p=position; float r=length(p.xz);
      p.y+=-9.0/(r*0.32+1.0) + sin(r*0.55-uTime*1.6)*0.25*exp(-r*0.025) + uPulse*sin(r*0.8-uPulse*10.0)*1.5*exp(-r*0.03);
      vXZ=p.xz; vR=r; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
  fragmentShader: `varying vec2 vXZ; varying float vR;
    void main(){ vec2 g=abs(fract(vXZ/2.4-0.5)-0.5)/fwidth(vXZ/2.4);
      float line=1.0-min(min(g.x,g.y),1.0);
      float fade=smoothstep(75.0,8.0,vR);
      vec3 c=mix(vec3(0.25,0.9,1.0),vec3(0.9,0.3,1.0),smoothstep(5.0,40.0,vR));
      gl_FragColor=vec4(c*line*fade*0.55,1.0); }`
});
const grid = new THREE.Mesh(new THREE.PlaneGeometry(170, 170, 170, 170).rotateX(-Math.PI / 2), gridMat);
grid.position.set(BH.x, BH.y - 4.5, BH.z); scene.add(grid);

/* ================= POST-PROCESSING ================= */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const lensPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uBH: { value: new THREE.Vector2(.5, .5) }, uBHr: { value: 0 }, uBHon: { value: 0 },
    uAsp: { value: 1 }, uSh: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -1, 0)) }
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uBH; uniform float uBHr,uBHon,uAsp; uniform vec4 uSh[4];
    varying vec2 vUv;
    void main(){
      vec2 uv=vUv;
      // gravitational lensing
      vec2 p=(uv-uBH)*vec2(uAsp,1.0); float r=length(p); float rs=uBHr;
      float def=uBHon*rs*rs*1.15/max(r,1e-4);
      def*=smoothstep(rs*1.0,rs*1.7,r)*smoothstep(rs*16.0,rs*4.0,r);
      vec2 off=(p/max(r,1e-4))*def; off.x/=uAsp;
      uv-=off;
      // spacetime ripples
      float glow=0.0; float split=0.0;
      for(int i=0;i<4;i++){
        vec4 s=uSh[i]; if(s.z<0.0||s.z>2.6) continue;
        vec2 d=(vUv-s.xy)*vec2(uAsp,1.0); float rr=length(d);
        float rad=s.z*0.75*sqrt(s.w); float x=(rr-rad)/(0.09*sqrt(s.w));
        float env=exp(-x*x*3.0); float life=1.0-s.z/2.6;
        float amp=0.045*s.w*life*life;
        vec2 o=(d/max(rr,1e-4))*sin(x*4.0)*env*amp; o.x/=uAsp;
        uv+=o; glow+=env*life*0.35*s.w; split+=env*amp*0.6;
      }
      vec2 dir=normalize(vUv-0.5+1e-5)*split;
      vec3 col=vec3(texture2D(tDiffuse,uv+dir).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-dir).b);
      col+=vec3(0.35,0.8,1.0)*glow*0.25;
      gl_FragColor=vec4(col,1.0);
    }`
});
composer.addPass(lensPass);

const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.15, 0.65, 0.12);
composer.addPass(bloom);

const finalPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uWarp: { value: 0 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2() }, uFlash: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uWarp,uTime,uFlash; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec2 c=vUv-0.5; float rr=length(c);
      float ca=0.0012+rr*(0.004+uWarp*0.02);
      vec3 col;
      if(uWarp<0.02){
        col=vec3(texture2D(tDiffuse,0.5+c*(1.0+ca)).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,0.5+c*(1.0-ca)).b);
      } else {
        col=vec3(0.0);
        for(int i=0;i<8;i++){
          float k=1.0-float(i)*uWarp*0.014*rr*2.0;
          col+=vec3(texture2D(tDiffuse,0.5+c*(k+ca)).r,texture2D(tDiffuse,0.5+c*k).g,texture2D(tDiffuse,0.5+c*(k-ca)).b);
        }
        col/=8.0;
      }
      col=(col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
      col*=mix(1.0,smoothstep(0.95,0.2,rr),0.85);
      col+=(hash(vUv*uRes+fract(uTime)*100.0)-0.5)*0.035;
      col*=0.975+0.025*sin(vUv.y*uRes.y*1.2);
      col+=vec3(0.7,0.9,1.0)*uFlash;
      gl_FragColor=vec4(col,1.0);
    }`
});
composer.addPass(finalPass);

/* ================= CAMERA PATH ================= */
const P = (x, y, z) => new THREE.Vector3(x, y, z);
const camPath = new THREE.CatmullRomCurve3([P(0, 7.5, 15), P(11, 2.4, 5.5), P(1.5, 1.2, -30), P(-9, 2.6, -64), P(7, 7.5, -63), P(0, 11, -110)], false, 'catmullrom', 0.3);
const tgtPath = new THREE.CatmullRomCurve3([P(0, -0.5, 0), P(0, 0, -1), P(0, 0, -70), P(0, 0, -80), P(0, -1, -80), P(0, 0, -40)], false, 'catmullrom', 0.3);
const shiftKeys = [0, -0.17, 0, 0.17, 0, 0];

/* ================= QUALITY ================= */
const DPR = Math.min(devicePixelRatio || 1, 2);
const LEVELS = [
  { pr: DPR, count: 1.0 },
  { pr: Math.min(DPR, 1.5), count: 0.75 },
  { pr: Math.min(DPR, 1.0), count: 0.5 },
  { pr: 0.75, count: 0.32 }
];
let level = NX.quality === 'high' ? 0 : NX.quality === 'low' ? 3 : (innerWidth < 900 ? 2 : 1);
let appliedLevel = -1;
function applyLevel() {
  if (appliedLevel === level) return; appliedLevel = level;
  const L = LEVELS[level];
  renderer.setPixelRatio(L.pr); composer.setPixelRatio(L.pr);
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
  galaxy.geometry.setDrawRange(0, Math.floor(MAXG * L.count));
  [starMat, dustMat, galMat].forEach(m => m.uniforms.uPR.value = L.pr);
  finalPass.uniforms.uRes.value.set(innerWidth * L.pr, innerHeight * L.pr);
}
function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  appliedLevel = -1; applyLevel();
  lensPass.uniforms.uAsp.value = camera.aspect;
  cacheSections();
}

/* ================= SCROLL MAPPING ================= */
let secTops = [], secHs = [];
function cacheSections() {
  const s = [...document.querySelectorAll('.sec')];
  secTops = s.map(e => e.offsetTop); secHs = s.map(e => e.offsetHeight);
}
function scrollT() {
  const y = scrollY; let i = 0;
  for (let k = 0; k < secTops.length; k++) if (y >= secTops[k] - 1) i = k;
  if (i >= secTops.length - 1) return secTops.length - 1;
  const span = secTops[i + 1] - secTops[i];
  return i + Math.min(1, Math.max(0, (y - secTops[i]) / span));
}

/* ================= LOOP ================= */
const clock = new THREE.Clock();
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), right = new THREE.Vector3(), look = new THREE.Vector3();
let camT = 0, warp = 0, warpDist = 0, lastY = scrollY, vel = 0, mouseOn = 0;
let fpsAcc = 0, fpsN = 0, fpsT = 0, goodWindows = 0, shockG = 0, gridPulse = 0;
const hudPos = document.getElementById('hudPos'), hudFps = document.getElementById('hudFps');
const ss = t => t * t * (3 - 2 * t);
const smooth = (a, b, x) => ss(Math.min(1, Math.max(0, (x - a) / (b - a))));

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime, now = performance.now() / 1000;

  // quality mode
  const want = NX.quality === 'high' ? 0 : NX.quality === 'low' ? 3 : null;
  if (want !== null) level = want;
  fpsAcc += dt; fpsN++; fpsT += dt;
  if (fpsT > 1.2) {
    const fps = fpsN / fpsAcc; hudFps.textContent = fps.toFixed(0);
    if (want === null && time > 3) {
      if (fps < 46 && level < 3) { level++; goodWindows = 0; }
      else if (fps > 58) { if (++goodWindows > 4 && level > 1) { level--; goodWindows = 0; } }
      else goodWindows = 0;
    }
    fpsAcc = fpsN = fpsT = 0;
  }
  applyLevel();

  // scroll → camera param
  const target = scrollT();
  camT += (target - camT) * Math.min(1, dt * 3.2);
  const u = Math.min(1, Math.max(0, camT / 5));
  camPath.getPointAt(u, tmpV); tgtPath.getPointAt(u, look);

  // warp factor: section bump + scroll velocity + hyperjump
  const dy = scrollY - lastY; lastY = scrollY;
  vel += (Math.abs(dy) / Math.max(1, innerHeight) / Math.max(dt, 1e-3) - vel) * 0.1;
  let w = smooth(1.35, 2.0, camT) * (1 - smooth(2.45, 3.0, camT));
  w = Math.max(w, Math.min(0.55, vel * 0.25));
  if (NX.hyperStart) { const h = now - NX.hyperStart; if (h < 2.6) w = Math.max(w, Math.sin(Math.min(1, h / 2.6) * Math.PI)); else NX.hyperStart = 0; }
  warp += (w - warp) * Math.min(1, dt * 4);
  NX.warp = warp;
  warpDist += dt * (12 + warp * 320);

  // camera + parallax + shake
  const sh = warp * warp * 0.08;
  camera.position.copy(tmpV);
  camera.position.x += NX.sx * 1.2 + (Math.random() - .5) * sh;
  camera.position.y += -NX.sy * 0.7 + (Math.random() - .5) * sh;
  camera.lookAt(look);
  camera.fov = 60 + warp * 28; 
  const si = Math.min(4, Math.floor(u * 5)), sf = u * 5 - si;
  const shift = shiftKeys[si] + (shiftKeys[si + 1] - shiftKeys[si]) * ss(sf);
  camera.setViewOffset(innerWidth, innerHeight, shift * innerWidth, 0, innerWidth, innerHeight);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  stars.position.copy(camera.position);

  // mouse gravity on galaxy plane
  ndc.set(NX.mx, -NX.my);
  ray.setFromCamera(ndc, camera);
  let on = 0;
  if (ray.ray.intersectPlane(plane, hit) && hit.length() < 16) { galMat.uniforms.uMouse.value.copy(hit); on = 1; }
  mouseOn += (on - mouseOn) * 0.08;
  galMat.uniforms.uMouseOn.value = mouseOn;

  // shocks
  const shArr = lensPass.uniforms.uSh.value;
  for (let i = 0; i < 4; i++) {
    const s = NX.shocks[i];
    if (s) shArr[i].set(s.x, s.y, now - s.t, s.power); else shArr[i].set(0, 0, -1, 0);
  }
  const latest = NX.shocks[NX.shocks.length - 1];
  const age = latest ? now - latest.t : 9;
  shockG = age < 1.4 ? (1 - age / 1.4) : 0;
  gridPulse = age < 2.5 ? age : 0;
  galMat.uniforms.uShock.value = shockG * (latest ? Math.min(1.5, latest.power) : 0);
  gridMat.uniforms.uPulse.value = gridPulse ? Math.max(0, 1 - gridPulse / 2.5) * 1.0 : 0;

  // black hole screen-space lens params
  tmpV.copy(BH).project(camera);
  right.setFromMatrixColumn(camera.matrixWorld, 0);
  tmpV2.copy(BH).addScaledVector(right, BH_R).project(camera);
  const inFront = tmpV.z < 1 && tmpV.z > -1;
  lensPass.uniforms.uBH.value.set(tmpV.x * .5 + .5, tmpV.y * .5 + .5);
  lensPass.uniforms.uBHr.value = Math.abs(tmpV2.x - tmpV.x) * .5 * camera.aspect;
  const onScr = inFront && Math.abs(tmpV.x) < 1.6 && Math.abs(tmpV.y) < 1.6;
  lensPass.uniforms.uBHon.value += ((onScr ? 1 : 0) - lensPass.uniforms.uBHon.value) * 0.1;
  halo.quaternion.copy(camera.quaternion);

  // uniforms
  galMat.uniforms.uTime.value = time;
  starMat.uniforms.uTime.value = time;
  dustMat.uniforms.uTime.value = time;
  diskMat.uniforms.uTime.value = time; haloMat.uniforms.uTime.value = time;
  diskMat.uniforms.uCam.value.copy(camera.position); haloMat.uniforms.uCam.value.copy(camera.position);
  gridMat.uniforms.uTime.value = time;
  warpMat.uniforms.uWarp.value = warp; warpMat.uniforms.uDist.value = warpDist;
  finalPass.uniforms.uWarp.value = warp; finalPass.uniforms.uTime.value = time;
  finalPass.uniforms.uFlash.value = shockG * shockG * 0.12;
  bloom.strength = 1.1 + warp * 0.6 + shockG * 0.5;
  coreGlow.material.opacity = 0.9 + Math.sin(time * 1.3) * 0.1;

  composer.render();

  const cp = camera.position;
  hudPos.textContent = `${cp.x.toFixed(1).padStart(6, '0')} / ${cp.y.toFixed(1).padStart(5, '0')} / ${cp.z.toFixed(1)}`;
  requestAnimationFrame(frame);
}

addEventListener('resize', resize);
resize();
camT = scrollT();
composer.render();
NX.ready = true;
requestAnimationFrame(frame);
