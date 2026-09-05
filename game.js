const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);const distanceEl=$('distance'),bestEl=$('best'),speedEl=$('speed'),coinsEl=$('coins'),livesEl=$('lives'),nitroBar=$('nitroBar'),stageEl=$('stage'),difficultyEl=$('difficulty'),message=$('message');
const startScreen=$('startScreen'),garage=$('garage'),gameOver=$('gameOver'),finalText=$('finalText');const keys={left:false,right:false,nitro:false};
let W=0,H=0,dpr=1,running=false,last=0,distance=0,best=+localStorage.getItem('freeRideBest')||0,coins=+localStorage.getItem('freeRideCoins')||0,lives=3,nitro=65,roadOffset=0,spawnTimer=0,coinTimer=0,pickupTimer=0,sceneryTimer=0,msgTimer=0;
let traffic=[],pickups=[],scenery=[];let player={x:0,y:0,w:42,h:76,vx:0,inv:0};
const cars=[
{id:'starter',name:'Falcon S',price:0,color:'#e53935',speed:1.00,handling:1.00,nitro:1.00,type:'sport',desc:'Balanced sports coupe'},
{id:'bolt',name:'Bolt GT',price:120,color:'#1687ff',speed:1.10,handling:1.10,nitro:1.02,type:'sport',desc:'Sharp turbo coupe'},
{id:'apex',name:'Apex R',price:300,color:'#f2b705',speed:1.22,handling:1.06,nitro:1.12,type:'super',desc:'Low and seriously fast'},
{id:'phantom',name:'Phantom',price:520,color:'#8b5cf6',speed:1.34,handling:1.16,nitro:1.15,type:'super',desc:'Sleek supercar'},
{id:'viper',name:'Viper X',price:800,color:'#18b96b',speed:1.47,handling:1.23,nitro:1.20,type:'super',desc:'Aggressive performance car'},
{id:'gt',name:'Titan GT',price:1150,color:'#f97316',speed:1.40,handling:1.08,nitro:1.35,type:'muscle',desc:'Powerful muscle machine'},
{id:'royal',name:'Royal S',price:1550,color:'#e7e7ea',speed:1.57,handling:1.25,nitro:1.28,type:'luxury',desc:'Premium grand tourer'},
{id:'shadow',name:'Shadow X',price:2200,color:'#242832',speed:1.70,handling:1.34,nitro:1.32,type:'hyper',desc:'Ultimate hypercar'}
];
let selected=localStorage.getItem('freeRideCar')||'starter';let owned=JSON.parse(localStorage.getItem('freeRideOwned')||'["starter"]');
function save(){localStorage.setItem('freeRideCoins',coins);localStorage.setItem('freeRideBest',best);localStorage.setItem('freeRideCar',selected);localStorage.setItem('freeRideOwned',JSON.stringify(owned))}
bestEl.textContent=best+' m';
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);player.y=H*.72;if(!player.x)player.x=W/2}addEventListener('resize',resize);resize();
const rw=()=>Math.min(W*.76,520),rl=()=> (W-rw())/2,lw=()=>rw()/4,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>Math.random()*(b-a)+a;
function reset(){distance=0;lives=3;nitro=65;roadOffset=0;spawnTimer=coinTimer=pickupTimer=sceneryTimer=0;traffic=[];pickups=[];scenery=[];player.x=W/2;player.vx=0;player.inv=0;for(let i=0;i<16;i++)scenery.push(makeScenery(rnd(-100,H+100)));updateHud()}
function makeScenery(y){let l=rl(),side=Math.random()<.5?-1:1;return{x:side<0?rnd(8,l-18):rnd(l+rw()+18,W-8),y,size:rnd(10,25),type:Math.random()<.62?'tree':Math.random()<.5?'rock':'bush'}}
function difficulty(){return Math.min(10,1+Math.floor(distance/450))}
function spawnCar(){let d=difficulty(),lane=Math.floor(Math.random()*4),colors=['#2dd4bf','#facc15','#60a5fa','#a78bfa','#f97316','#f43f5e','#f8fafc','#ff5a36'];traffic.push({x:rl()+lw()*lane+lw()/2,y:-100,w:rnd(38,45),h:rnd(66,78),speed:rnd(70,150)+d*5,color:colors[Math.floor(Math.random()*colors.length)],type:['sedan','suv','sport'][Math.floor(Math.random()*3)],near:false})}
function spawnCoin(){let lane=Math.floor(Math.random()*4);pickups.push({type:'coin',x:rl()+lw()*lane+lw()/2,y:-30,r:11})}
function spawnNitro(){let lane=Math.floor(Math.random()*4);pickups.push({type:'nitro',x:rl()+lw()*lane+lw()/2,y:-35,r:15})}
function speedValue(){let c=cars.find(x=>x.id===selected)||cars[0],base=(150+Math.min(distance*.43,300))*c.speed;return base+(keys.nitro&&nitro>0?155*c.nitro:0)}
function start(){reset();running=true;startScreen.classList.add('hidden');gameOver.classList.add('hidden');garage.classList.add('hidden');last=performance.now();requestAnimationFrame(loop)}
function crash(){if(player.inv>0)return;lives--;player.inv=1.5;showMsg('💥 CRASH!');if(lives<=0){running=false;let d=Math.floor(distance);if(d>best){best=d;localStorage.setItem('freeRideBest',best)}finalText.textContent=`You drove ${d} m and collected ${Math.floor(coins-sessionCoins)} coins this run.`;save();gameOver.classList.remove('hidden')}updateHud()}
let sessionCoins=0;
function showMsg(t){message.textContent=t;message.style.opacity=1;msgTimer=1}
function updateHud(){distanceEl.textContent=Math.floor(distance)+' m';bestEl.textContent=best+' m';coinsEl.textContent=coins;livesEl.textContent='❤️ '.repeat(lives).trim()||'💔';nitroBar.style.width=clamp(nitro,0,100)+'%';difficultyEl.textContent=difficulty();let c=cars.find(x=>x.id===selected)||cars[0];speedEl.textContent=Math.floor(speedValue()*.55)+' km/h';stageEl.textContent=distance<800?'DAY':distance<1600?'SUNSET':'NIGHT'}
function update(dt){let c=cars.find(x=>x.id===selected)||cars[0],steer=(keys.left?-1:0)+(keys.right?1:0),speed=speedValue();player.vx+=steer*1250*c.handling*dt;if(!steer)player.vx*=Math.pow(.0008,dt);player.vx=clamp(player.vx,-360*c.handling,360*c.handling);player.x+=player.vx*dt;let a=rl()+player.w/2+8,b=rl()+rw()-player.w/2-8;if(player.x<a){player.x=a;player.vx*=-.25}if(player.x>b){player.x=b;player.vx*=-.25}
if(keys.nitro&&nitro>0)nitro-=17*dt/c.nitro;else nitro=Math.min(100,nitro+3*dt);roadOffset=(roadOffset+speed*dt)%70;distance+=speed*dt*.055;spawnTimer+=dt;coinTimer+=dt;pickupTimer+=dt;let d=difficulty(),gap=Math.max(.27,1.0-distance/1800-d*.025);if(spawnTimer>gap){spawnTimer=0;if(traffic.length<7+d/2)spawnCar()}if(coinTimer>.45){coinTimer=0;if(Math.random()<.9)spawnCoin()}if(pickupTimer>Math.max(4,8-d*.35)){pickupTimer=0;if(Math.random()<.8)spawnNitro()}
traffic.forEach(v=>v.y+=(speed-v.speed+105+d*12)*dt);traffic=traffic.filter(v=>v.y<H+130);pickups.forEach(p=>p.y+=speed*dt);pickups=pickups.filter(p=>p.y<H+80);sceneryTimer+=dt;if(sceneryTimer>.13){sceneryTimer=0;scenery.push(makeScenery(-30))}scenery.forEach(s=>s.y+=speed*dt);scenery=scenery.filter(s=>s.y<H+70);if(player.inv>0)player.inv-=dt;
for(const v of traffic){if(overlap(player,v)){crash();break}if(!v.near&&v.y>player.y+20){v.near=true;if(Math.abs(v.x-player.x)<53){coins++;sessionCoins++;showMsg('NEAR MISS +1 🪙')}}}for(let i=pickups.length-1;i>=0;i--){let p=pickups[i];if(Math.hypot(p.x-player.x,p.y-player.y)<35){if(p.type==='coin'){coins++;sessionCoins++;showMsg('🪙 +1')}else{nitro=Math.min(100,nitro+45);showMsg('⚡ NITRO +45%')}pickups.splice(i,1)}}if(msgTimer>0){msgTimer-=dt;if(msgTimer<=0)message.style.opacity=0}updateHud()}
function overlap(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)*.43&&Math.abs(a.y-b.y)<(a.h+b.h)*.43}
function draw(){let night=distance>=1600,sunset=distance>=800&&distance<1600;drawWorld(night,sunset);drawScenery();drawRoad();drawPickups();traffic.forEach(v=>drawCar(v.x,v.y,v.w,v.h,v.color,false,v.type));if(player.inv<=0||Math.floor(player.inv*10)%2){let pc=cars.find(x=>x.id===selected)||cars[0];drawCar(player.x,player.y,player.w,player.h,pc.color,true,pc.type)}if(keys.nitro&&nitro>0)drawFlames()}
function drawWorld(n,s){let g=ctx.createLinearGradient(0,0,0,H);if(n){g.addColorStop(0,'#101b38');g.addColorStop(.55,'#263b43');g.addColorStop(1,'#172c20')}else if(s){g.addColorStop(0,'#d77d5c');g.addColorStop(.45,'#f1b36d');g.addColorStop(1,'#5e984f')}else{g.addColorStop(0,'#6bb7df');g.addColorStop(.55,'#9ed47b');g.addColorStop(1,'#76b85d')}ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle=n?'#f4f1c7':'#fff6bd';ctx.beginPath();ctx.arc(W*.82,H*(n?.15:.13),n?22:38,0,Math.PI*2);ctx.fill()}
function drawScenery(){for(const s of scenery){if(s.x>rl()&&s.x<rl()+rw())continue;if(s.type==='tree'){ctx.fillStyle='#754c2a';ctx.fillRect(s.x-3,s.y+s.size*.35,6,s.size*1.2);ctx.fillStyle='#247a3d';ctx.beginPath();ctx.arc(s.x,s.y,s.size*.72,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(s.x-s.size*.35,s.y+5,s.size*.55,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(s.x+s.size*.35,s.y+5,s.size*.55,0,Math.PI*2);ctx.fill()}else{ctx.fillStyle=s.type==='rock'?'#777':'#3d8b3d';ctx.beginPath();ctx.ellipse(s.x,s.y,s.size,s.size*.6,0,0,Math.PI*2);ctx.fill()}}}
function drawRoad(){let l=rl(),w=rw();ctx.fillStyle='#d6d0bb';ctx.fillRect(l-12,0,w+24,H);ctx.fillStyle='#33363a';ctx.fillRect(l,0,w,H);ctx.fillStyle='#f5f5dc';ctx.fillRect(l+5,0,4,H);ctx.fillRect(l+w-9,0,4,H);ctx.fillStyle='#ffffffbb';for(let lane=1;lane<4;lane++){let x=l+lw()*lane;for(let y=-70+roadOffset;y<H+70;y+=70)ctx.fillRect(x-2,y,4,34)}ctx.fillStyle='#fff';for(let y=-50+roadOffset;y<H+50;y+=55){ctx.fillRect(l-12,y,12,6);ctx.fillRect(l+w,y,12,6)}}
function drawPickups(){for(const p of pickups){ctx.save();ctx.translate(p.x,p.y);ctx.shadowBlur=18;ctx.shadowColor=p.type==='coin'?'#ffd43b':'#6ee7ff';ctx.fillStyle=p.type==='coin'?'#ffd43b':'#66e8ff';ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#222';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.type==='coin'?'$':'⚡',0,1);ctx.restore()}}
function drawFlames(){ctx.save();ctx.translate(player.x,player.y+40);ctx.fillStyle='#ffd43b';ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-4,30+rnd(0,12));ctx.lineTo(0,8);ctx.lineTo(6,32+rnd(0,12));ctx.lineTo(11,0);ctx.fill();ctx.restore()}
function roundRect(x,y,w,h,r){let q=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath()}
function drawCar(x,y,w,h,color,pc=false,type='sport'){
 ctx.save();ctx.translate(x,y);
 // soft road shadow
 ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(0,h*.44,w*.66,h*.16,0,0,Math.PI*2);ctx.fill();
 // wider performance tyres
 ctx.fillStyle='#101216';
 ctx.fillRect(-w*.58,-h*.30,w*.18,h*.29);ctx.fillRect(w*.40,-h*.30,w*.18,h*.29);
 ctx.fillRect(-w*.58,h*.02,w*.18,h*.29);ctx.fillRect(w*.40,h*.02,w*.18,h*.29);
 // rim highlights
 ctx.fillStyle='#8c949d';ctx.fillRect(-w*.54,-h*.22,w*.10,h*.12);ctx.fillRect(w*.44,-h*.22,w*.10,h*.12);ctx.fillRect(-w*.54,h*.10,w*.10,h*.12);ctx.fillRect(w*.44,h*.10,w*.10,h*.12);
 // body silhouette
 let top=.48,bot=.48;
 if(type==='super'||type==='hyper'){top=.37;bot=.44}
 if(type==='suv'){top=.50;bot=.52}
 if(type==='muscle'){top=.48;bot=.52}
 ctx.fillStyle=color;
 ctx.beginPath();
 ctx.moveTo(-w*top,h*.48);ctx.lineTo(-w*.47,h*.22);ctx.lineTo(-w*.40,-h*.34);ctx.quadraticCurveTo(-w*.30,-h*.48,0,-h*.50);ctx.quadraticCurveTo(w*.30,-h*.48,w*.40,-h*.34);ctx.lineTo(w*.47,h*.22);ctx.lineTo(w*bot,h*.48);ctx.closePath();ctx.fill();
 // lower bumper / side skirts
 ctx.fillStyle='rgba(0,0,0,.20)';ctx.beginPath();ctx.moveTo(-w*.46,h*.25);ctx.lineTo(w*.46,h*.25);ctx.lineTo(w*.42,h*.44);ctx.lineTo(-w*.42,h*.44);ctx.closePath();ctx.fill();
 // cabin and windows, shaped like a real car
 let cabinTop=type==='suv'?.27:.30;
 ctx.fillStyle=type==='luxury'?'#18252f':'#b9dbe7';
 ctx.beginPath();ctx.moveTo(-w*.30,-h*.29);ctx.quadraticCurveTo(-w*.24,-h*.42,0,-h*.43);ctx.quadraticCurveTo(w*.24,-h*.42,w*.30,-h*.29);ctx.lineTo(w*.25,h*.04);ctx.lineTo(-w*.25,h*.04);ctx.closePath();ctx.fill();
 // windshield tint
 ctx.fillStyle='rgba(18,35,48,.72)';ctx.beginPath();ctx.moveTo(-w*.25,-h*.27);ctx.quadraticCurveTo(0,-h*.38,w*.25,-h*.27);ctx.lineTo(w*.22,-h*.04);ctx.lineTo(-w*.22,-h*.04);ctx.closePath();ctx.fill();
 // rear window
 ctx.fillStyle='rgba(25,42,55,.62)';ctx.beginPath();ctx.moveTo(-w*.23,h*.00);ctx.lineTo(w*.23,h*.00);ctx.lineTo(w*.20,h*.11);ctx.lineTo(-w*.20,h*.11);ctx.closePath();ctx.fill();
 // center body highlight
 ctx.fillStyle='rgba(255,255,255,.20)';ctx.fillRect(-2,-h*.42,4,h*.78);
 // headlights and DRLs
 ctx.fillStyle='#fff4c7';roundRect(-w*.34,-h*.47,w*.20,6,3);ctx.fill();roundRect(w*.14,-h*.47,w*.20,6,3);ctx.fill();
 ctx.fillStyle='#d9f7ff';ctx.fillRect(-w*.29,-h*.455,w*.11,2);ctx.fillRect(w*.18,-h*.455,w*.11,2);
 // tail lights
 ctx.fillStyle='#ff2f3d';roundRect(-w*.34,h*.38,w*.20,6,3);ctx.fill();roundRect(w*.14,h*.38,w*.20,6,3);ctx.fill();
 // grille / plate
 ctx.fillStyle='#101419';roundRect(-w*.17,h*.27,w*.34,h*.10,4);ctx.fill();
 ctx.fillStyle='#e8edf2';roundRect(-w*.10,h*.285,w*.20,h*.035,2);ctx.fill();
 // sporty details
 if(type==='sport'||type==='super'||type==='hyper'){
   ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-w*.37,h*.14,w*.12,3);ctx.fillRect(w*.25,h*.14,w*.12,3);
 }
 if(type==='muscle'){ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-w*.07,-h*.48,w*.14,h*.30)}
 if(type==='hyper'){ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(-w*.43,h*.45,w*.86,5)}
 if(pc){ctx.strokeStyle='rgba(255,255,255,.30)';ctx.lineWidth=1;ctx.stroke();}
 ctx.restore();
}
function loop(now){if(!running)return;let dt=Math.min((now-last)/1000,.035);last=now;update(dt);draw();if(running)requestAnimationFrame(loop)}
function bindHold(el,dir){let on=e=>{e.preventDefault();keys[dir]=true},off=e=>{e.preventDefault();keys[dir]=false};el.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(x=>el.addEventListener(x,off))}
bindHold($('leftBtn'),'left');bindHold($('rightBtn'),'right');bindHold($('nitroBtn'),'nitro');
addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(e.key==='ArrowLeft'||k==='a')keys.left=true;if(e.key==='ArrowRight'||k==='d')keys.right=true;if(e.code==='Space'||k==='n')keys.nitro=true;if(e.key==='Enter'&&!running&&!garage.classList.contains('hidden'))return;if(e.key==='Enter'&&!running)start()});addEventListener('keyup',e=>{let k=e.key.toLowerCase();if(e.key==='ArrowLeft'||k==='a')keys.left=false;if(e.key==='ArrowRight'||k==='d')keys.right=false;if(e.code==='Space'||k==='n')keys.nitro=false});
function renderGarage(){ $('garageCoins').textContent=coins;let grid=$('carGrid');grid.innerHTML='';cars.forEach(c=>{let isOwned=owned.includes(c.id),isSel=selected===c.id;let el=document.createElement('div');el.className='carCard';el.innerHTML=`<div class="carPreview"><div class="miniCar" style="background:${c.color}"></div></div><div class="carName">${c.name}</div><div class="carInfo">${c.desc}<br>Speed ×${c.speed.toFixed(2)} • Handling ×${c.handling.toFixed(2)} • Nitro ×${c.nitro.toFixed(2)}</div><div class="carActions"><button class="${isSel?'selected':isOwned?'':'locked'}" data-id="${c.id}">${isSel?'SELECTED':isOwned?'SELECT':'🪙 '+c.price}</button></div>`;el.querySelector('button').onclick=()=>{if(isOwned){selected=c.id;save();renderGarage();return}if(coins>=c.price){coins-=c.price;owned.push(c.id);selected=c.id;save();renderGarage();showMsg('🏎️ '+c.name+' UNLOCKED!')}else{showMsg('Need '+(c.price-coins)+' more coins 🪙')}};grid.appendChild(el)})}
$('garageBtn').onclick=()=>{renderGarage();garage.classList.remove('hidden')};$('garageAfter').onclick=()=>{gameOver.classList.add('hidden');renderGarage();garage.classList.remove('hidden')};$('closeGarage').onclick=()=>garage.classList.add('hidden');$('startBtn').onclick=()=>{sessionCoins=0;start()};$('restartBtn').onclick=()=>{sessionCoins=0;start()};reset();draw();
