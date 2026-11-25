import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x879096);
scene.fog = new THREE.FogExp2(0x879096, 0.012);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 450);
camera.position.set(0, 1.7, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.querySelector("#game").prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xb9c9d0, 0x29211c, 1.25));
const sun = new THREE.DirectionalLight(0xffc18b, 2.0);
sun.position.set(-35, 55, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const mats = {
  ground: new THREE.MeshStandardMaterial({ color: 0x4b4b45, roughness: 1 }),
  road: new THREE.MeshStandardMaterial({ color: 0x292d2e, roughness: 1 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x777873, roughness: 1 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x343a3a, roughness: .95 }),
  rust: new THREE.MeshStandardMaterial({ color: 0x754b38, roughness: .9 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x28383c, metalness: .25, roughness: .35 }),
  stripe: new THREE.MeshStandardMaterial({ color: 0xb2a58a, roughness: 1 })
};

function box(w,h,d,mat,x,y,z, parent=scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function building(x,z,w,h,d,seed=0) {
  const b = new THREE.Group(); b.position.set(x,0,z); scene.add(b);
  box(w,h,d,mats.concrete,0,h/2,0,b);
  box(w*1.02,.25,d*1.02,mats.dark,0,h+.12,0,b);
  const cols = Math.max(2, Math.floor(w/2.2));
  for(let yy=1.5; yy<h-1; yy+=2.4) for(let xx=-w/2+.8; xx<w/2-.5; xx+=w/cols) {
    if ((Math.floor(xx*3+yy+seed)%4)===0) continue;
    box(.75,1.05,.07,mats.glass,xx,yy,d/2+.045,b);
  }
  if(seed%2===0) box(w*.18, h*.3, .3, mats.rust, -w*.25,h*.78,d/2+.12,b);
}
building(-13,-12,12,13,9,1); building(13,-18,10,19,10,2);
building(-17,17,9,9,10,3); building(17,15,13,14,9,4);
building(-31,-5,9,22,11,5); building(31,4,10,17,10,6);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(180,180), mats.ground);
ground.rotation.x=-Math.PI/2; ground.position.y=-.12; ground.receiveShadow=true; scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(13,150), mats.road);
road.rotation.x=-Math.PI/2; road.position.set(0,-.09,0); scene.add(road);
for(let z=-68;z<70;z+=9) box(.18,.025,4,mats.stripe,0,-.055,z);

function car(x,z,rot=0) {
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rot; scene.add(g);
  box(3.8,1.05,6,mats.rust,0,.85,0,g);
  box(3.1,.95,2.8,mats.dark,0,1.75,-.2,g);
  box(3.15,.7,.06,mats.glass,0,1.8,1.22,g);
  for(const sx of [-1.9,1.9]) for(const sz of [-1.9,1.9]) {
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.28,12),mats.dark);
    wheel.rotation.z=Math.PI/2; wheel.position.set(sx,.52,sz); wheel.castShadow=true; g.add(wheel);
  }
}
car(-4,-5,.12); car(4,18,-.3); car(-3,39,.2); car(5,-31,.1);

for(let i=0;i<75;i++){
  const x=(Math.random()-.5)*70, z=(Math.random()-.5)*130;
  if(Math.abs(x)<8) continue;
  const size=.25+Math.random()*1.2;
  const rubble=box(size,size*.45,size,mats.dark,x,size*.22,z);
  rubble.rotation.y=Math.random()*Math.PI;
}
for(let i=0;i<18;i++){
  const x=(Math.random()-.5)*100, z=-55-Math.random()*25;
  const h=8+Math.random()*22;
  box(2+Math.random()*5,h,2+Math.random()*4,mats.dark,x,h/2,z);
}

// Player controls
let yaw=0, pitch=0, velocityY=0, grounded=true, running=false, started=false;
const player = { x:0, z:12, speed:5.2, radius:.55 };
const keys = {};
const joystick = {x:0,y:0, active:false, id:null};
let lookPointer=null, lastX=0, lastY=0;
const joyEl=document.querySelector("#joystick"), stickEl=document.querySelector("#stick");
const jumpBtn=document.querySelector("#jump"), runBtn=document.querySelector("#run");
const startScreen=document.querySelector("#start-screen");

function showToast(msg){ const t=document.querySelector("#toast"); t.textContent=msg; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,1800); }
function startGame(){ started=true; startScreen.style.display="none"; showToast("探索を開始した"); }
document.querySelector("#start").addEventListener("click",startGame);

addEventListener("keydown",e=>{keys[e.code]=true;if(["Space","ArrowUp","ArrowDown"].includes(e.code))e.preventDefault();});
addEventListener("keyup",e=>keys[e.code]=false);
addEventListener("contextmenu",e=>e.preventDefault());

function joyUpdate(e){
  const r=joyEl.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  let dx=e.clientX-cx, dy=e.clientY-cy, len=Math.hypot(dx,dy), max=43;
  if(len>max){dx=dx/len*max;dy=dy/len*max;}
  joystick.x=dx/max; joystick.y=dy/max;
  stickEl.style.transform=`translate(${dx}px,${dy}px)`;
}
joyEl.addEventListener("pointerdown",e=>{e.preventDefault();joystick.active=true;joystick.id=e.pointerId;joyEl.setPointerCapture(e.pointerId);joyUpdate(e);});
joyEl.addEventListener("pointermove",e=>{if(joystick.active&&e.pointerId===joystick.id)joyUpdate(e);});
function joyEnd(e){if(e.pointerId!==joystick.id)return;joystick.active=false;joystick.id=null;joystick.x=joystick.y=0;stickEl.style.transform="translate(0,0)";}
joyEl.addEventListener("pointerup",joyEnd); joyEl.addEventListener("pointercancel",joyEnd);

jumpBtn.addEventListener("pointerdown",e=>{e.preventDefault();if(grounded){velocityY=6.3;grounded=false;}});
runBtn.addEventListener("pointerdown",e=>{e.preventDefault();running=true;});
runBtn.addEventListener("pointerup",()=>running=false);
runBtn.addEventListener("pointercancel",()=>running=false);
runBtn.addEventListener("pointerleave",()=>running=false);

// Drag on the right side to look around on touch screens.
renderer.domElement.addEventListener("pointerdown",e=>{
  if(e.pointerType==="touch" && e.clientX>innerWidth*.38){lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);}
});
renderer.domElement.addEventListener("pointermove",e=>{
  if(lookPointer!==e.pointerId)return;
  const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
  yaw-=dx*.004;pitch-=dy*.0035;pitch=THREE.MathUtils.clamp(pitch,-1.25,1.25);
});
function endLook(e){if(lookPointer===e.pointerId)lookPointer=null;}
renderer.domElement.addEventListener("pointerup",endLook);renderer.domElement.addEventListener("pointercancel",endLook);

// Simple collision volumes around buildings and abandoned cars.
const obstacles=[
  [-13,-12,6.4,5.0],[13,-18,5.4,5.5],[-17,17,5,5.5],[17,15,7,5.2],
  [-31,-5,5,6],[31,4,5.5,5.5],[-4,-5,2.5,3.4],[4,18,2.5,3.4],
  [-3,39,2.5,3.4],[5,-31,2.5,3.4]
];
function blocked(x,z){
  if(Math.abs(x)>78||Math.abs(z)>78)return true;
  return obstacles.some(([ox,oz,rx,rz])=>Math.abs(x-ox)<rx+player.radius&&Math.abs(z-oz)<rz+player.radius);
}

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  if(started){
    const forward=(keys.KeyW?1:0)-(keys.KeyS?1:0)-joystick.y;
    const side=(keys.KeyD?1:0)-(keys.KeyA?1:0)+joystick.x;
    const mag=Math.hypot(forward,side);
    if(mag>.05){
      const speed=(running||keys.ShiftLeft?8.2:player.speed)*Math.min(1,mag);
      const fx=-Math.sin(yaw), fz=-Math.cos(yaw), rx=Math.cos(yaw), rz=-Math.sin(yaw);
      const dx=(fx*forward+rx*side)/Math.max(1,mag)*speed*dt;
      const dz=(fz*forward+rz*side)/Math.max(1,mag)*speed*dt;
      if(!blocked(player.x+dx,player.z))player.x+=dx;
      if(!blocked(player.x,player.z+dz))player.z+=dz;
    }
    if(keys.Space&&grounded){velocityY=6.3;grounded=false;}
    velocityY-=17*dt;camera.position.y+=velocityY*dt;
    if(camera.position.y<1.7){camera.position.y=1.7;velocityY=0;grounded=true;}
    camera.position.x=player.x;camera.position.z=player.z;
    camera.rotation.order="YXZ";camera.rotation.y=yaw;camera.rotation.x=pitch;
  }
  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
});
