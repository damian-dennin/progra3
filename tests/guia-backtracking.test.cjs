// node tests/guia-backtracking.test.cjs — builders reales de la guía (Backtracking 1–3) contra oráculos independientes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=process.argv[2]||path.join(__dirname,'../apuntes interactivos/prog3-ejercicios.html');
const html=fs.readFileSync(file,'utf8');
const start='/* ===== Guía · Backtracking ===== */',end='const btProcSim=';
assert(html.includes(start)&&html.includes(end),'Falta el bloque de Backtracking de la guía');
const inputs={};
const context={document:{getElementById:id=>({value:inputs[id]})},esc:s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),cells:a=>JSON.stringify(a)};
vm.createContext(context);
vm.runInContext(html.slice(html.indexOf(start),html.indexOf(end)),context);
const B=vm.runInContext('({btProcesadores,btLaberinto,btAtila,btParseLab,btParseJardin,btParseCasilla,btInteger,btVector,btProcRender,btMazeRender,btAtilaRender,BT_DIRS,BT_MAX_STEPS})',context);
const plain=x=>JSON.parse(JSON.stringify(x)),last=a=>a[a.length-1];
let checks=0,rendered=0,seed=161803;
const rand=n=>{seed=(1664525*seed+1013904223)>>>0;return seed%n;};
const same=(a,b,msg)=>{assert.equal(JSON.stringify(plain(a)),JSON.stringify(plain(b)),msg);checks++;};

function verifySteps(steps,render){
  assert(steps.length>0);
  const seen=new Set();
  for(const s of steps){
    for(const key of ['arr','loads','path','best','bestAssignment']){
      if(s[key]&&typeof s[key]==='object'){assert(!seen.has(s[key]),'Estado compartido entre pasos ('+key+')');seen.add(s[key]);}
    }
    const out=render(s);assert(!/undefined|NaN/.test(out),out);rendered++;
  }
}

/* ---------- oráculos ---------- */
function procOracle(A,m){let best=Infinity;for(let code=0;code<m**A.length;code++){let r=code;const l=new Array(m).fill(0);for(const t of A){l[r%m]+=t;r=Math.floor(r/m);}best=Math.min(best,Math.max(...l));}return best;}
function labOracle(L,o,d){ // Bellman-Ford con peso en los nodos (>= 0) y aristas dirigidas válidas
  const n=L.length,dist=L.map(r=>r.map(()=>Infinity));dist[o[0]-1][o[1]-1]=L[o[0]-1][o[1]-1].valor;
  for(let it=0;it<n*n+2;it++)for(let f=0;f<n;f++)for(let c=0;c<n;c++){
    if(dist[f][c]===Infinity)continue;
    for(const dd of B.BT_DIRS){if(!L[f][c].abre[dd.k])continue;const nf=f+dd.df,nc=c+dd.dc;if(nf<0||nf>=n||nc<0||nc>=n)continue;dist[nf][nc]=Math.min(dist[nf][nc],dist[f][c]+L[nf][nc].valor);}
  }
  return dist[d[0]-1][d[1]-1];
}
function labEnum(L,o,d){ // todos los caminos simples, sin poda
  const n=L.length,vis=L.map(r=>r.map(()=>false));let best=Infinity;
  (function go(f,c,s){vis[f][c]=true;s+=L[f][c].valor;
    if(f===d[0]-1&&c===d[1]-1)best=Math.min(best,s);
    else for(const dd of B.BT_DIRS){if(!L[f][c].abre[dd.k])continue;const nf=f+dd.df,nc=c+dd.dc;if(nf<0||nf>=n||nc<0||nc>=n||vis[nf][nc])continue;go(nf,nc,s);}
    vis[f][c]=false;})(o[0]-1,o[1]-1,0);
  return best;
}
function hamOracle(J){ // ciclo hamiltoniano por DP de máscaras (k <= 16)
  const cells=[];J.forEach((r,f)=>r.forEach((p,c)=>p&&cells.push([f,c])));const k=cells.length;if(k<4)return false;
  const adj=cells.map(a=>cells.map(b=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1));
  const dp=new Array(1<<k).fill(0);dp[1]=1;
  for(let mask=1;mask<(1<<k);mask++){if(!(mask&1)||!dp[mask])continue;
    for(let v=0;v<k;v++)if(dp[mask]&(1<<v))for(let w=1;w<k;w++)if(!(mask&(1<<w))&&adj[v][w])dp[mask|(1<<w)]|=1<<w;}
  const full=(1<<k)-1;for(let v=1;v<k;v++)if((dp[full]&(1<<v))&&adj[v][0])return true;return false;
}
const labText=L=>L.map(r=>r.map(c=>c.valor+B.BT_DIRS.filter(d=>c.abre[d.k]).map(d=>d.k).join('')).join(' ')).join(' / ');
const gardenText=J=>J.map(r=>r.map(x=>x?'#':'.').join('')).join('/');

/* ---------- Backtracking 1: procesadores ---------- */
for(let i=0;i<300;i++){
  const len=1+rand(6),m=1+rand(3),A=Array.from({length:len},()=>rand(4)===0?0:1+rand(9));
  const steps=B.btProcesadores(A,m),end=last(steps),exp=procOracle(A,m);
  assert.equal(end.best,exp,JSON.stringify([A,m]));checks++;
  const loads=new Array(m).fill(0);A.forEach((t,j)=>{loads[end.bestAssignment[j]]+=t;});
  assert.equal(Math.max(...loads),exp);checks++;
  assert(end.arr.every(x=>x===null),'S queda sin restos al terminar');assert(end.loads.every(x=>x===0),'las cargas se restauran');
  if(i<40)verifySteps(steps,B.btProcRender);
}
assert.equal(B.btProcesadores([2,3,4,5],2).length,28);
same(last(B.btProcesadores([2,3,4,5],2)).bestAssignment.length,4);
assert.equal(last(B.btProcesadores([2,3,4,5],2)).best,7);
assert.equal(last(B.btProcesadores([2,3,4,5],1)).best,14);
assert.equal(last(B.btProcesadores([4],3)).best,4);
assert.equal(last(B.btProcesadores([0,0],2)).best,0);

/* ---------- Backtracking 2: laberinto ---------- */
const randLab=(n,pOpen,pZero)=>Array.from({length:n},()=>Array.from({length:n},()=>{
  const abre={};B.BT_DIRS.forEach(d=>{abre[d.k]=rand(100)<pOpen;});return {valor:rand(100)<pZero?0:1+rand(9),abre};}));
let labOk=0,labNo=0,labCap=0;
for(let i=0;i<700;i++){
  const n=1+rand(4),L=randLab(n,40+rand(60),rand(3)===0?25:0),o=[1+rand(n),1+rand(n)],d=[1+rand(n),1+rand(n)];
  same(B.btParseLab(labText(L)),L,'el texto vuelve a parsearse igual');
  let steps;try{steps=B.btLaberinto(L,o,d);}catch(e){assert(/más de/.test(e.message));labCap++;continue;}
  const end=last(steps),exp=labEnum(L,o,d);
  assert.equal(exp,labOracle(L,o,d),'los dos oráculos discrepan');checks++;
  if(exp===Infinity){assert.equal(end.rcls,'bad');labNo++;}
  else{
    assert.equal(end.rcls,'good');assert.equal(end.mejor,exp);
    const best=steps.reduce((a,s)=>s.best||a,null);let sum=0;
    best.forEach((p,j)=>{sum+=L[p[0]-1][p[1]-1].valor;
      if(j){const q=best[j-1],dd=B.BT_DIRS.find(x=>q[0]+x.df===p[0]&&q[1]+x.dc===p[1]);assert(dd&&L[q[0]-1][q[1]-1].abre[dd.k],'paso válido');}});
    assert.equal(sum,exp);assert.equal(best[0].join(),o.join());assert.equal(last(best).join(),d.join());
    assert.equal(new Set(best.map(p=>p.join())).size,best.length,'camino simple');
    labOk++;
  }
  assert.equal(end.path.length,0,'el camino actual queda vacío al terminar');
  if(i<60)verifySteps(steps,B.btMazeRender);
}
assert(labOk>300&&labNo>20,'cobertura de casos con y sin camino: '+labOk+'/'+labNo);
const mazeDefault='5E 7ESO 6S 9S / 2ES 7NESO 3NO 5NS / 2NES 7SO 3E 7NSO / 1NE 3NEO 7EO 1NO';
const mazeCases=[[mazeDefault,'1,1','4,4',124,'good',35],['1ES 9SO / 1N 1NO','1,1','2,2',12,'good',11],['1ES 1ESO 1SO / 1N 1N 1N / 1 1 1','1,1','3,3',16,'bad',null],[mazeDefault,'1,1','1,1',5,'good',5],['4','1,1','1,1',5,'good',4]];
for(const [text,o,d,count,rcls,len] of mazeCases){
  const L=B.btParseLab(text),n=L.length,steps=B.btLaberinto(L,B.btParseCasilla(o,n,'o'),B.btParseCasilla(d,n,'d'));
  assert.equal(steps.length,count,text+' '+o+'→'+d);assert.equal(last(steps).rcls,rcls);if(len!==null)assert.equal(last(steps).mejor,len);
  verifySteps(steps,B.btMazeRender);checks+=3;
}
{ // el camino con menos casillas no es el de menor suma en el ejemplo por defecto
  const L=B.btParseLab(mazeDefault),steps=B.btLaberinto(L,[1,1],[4,4]),best=steps.reduce((a,s)=>s.best||a,null);
  assert.equal(best.length,9);
  assert.equal(L[0][0].valor+L[0][1].valor+L[1][1].valor+L[2][1].valor+L[3][1].valor+L[3][2].valor+L[3][3].valor,37,'el camino de 7 casillas por (2,2)→(3,2) cuesta 37');checks+=2;
}
// entradas inválidas: se informan, no se reemplazan
for(const bad of ['','1E 2 / 3','1E 2X / 3 4','1EE 2 / 3 4','1000 2 / 3 4','a b / c d','1 1 1 1 1 / 1 1 1 1 1 / 1 1 1 1 1 / 1 1 1 1 1 / 1 1 1 1 1'])
  assert.throws(()=>B.btParseLab(bad),/laberinto|Casilla/,'laberinto inválido: '+bad);
for(const bad of ['','0,1','1,5','a,b','1;1','1'])assert.throws(()=>B.btParseCasilla(bad,4,'Origen'),/Origen/);
assert.throws(()=>B.btLaberinto(B.btParseLab('6NESO 2NESO 6NESO 6NESO / 1NESO 4NESO 1NESO 2NESO / 1NESO 1NESO 1NESO 5NESO / 6NESO 1NESO 5NESO 9NESO'),[1,1],[4,4]),/más de 400 pasos/,'el tope de pasos del laberinto se informa');
assert.throws(()=>B.btAtila(B.btParseJardin('#####/#####/#####/#####/#####')),/más de 400 pasos/,'el tope de pasos del jardín se informa');
checks+=14;

/* ---------- Backtracking 3: caballo de Atila ---------- */
let atYes=0,atNo=0,atCap=0;
for(let i=0;i<500;i++){
  const n=2+rand(4),dens=30+rand(65),J=Array.from({length:n},()=>Array.from({length:n},()=>rand(100)<dens));
  const k=J.flat().filter(Boolean).length;if(k>16)continue;
  same(B.btParseJardin(gardenText(J)),J,'el texto vuelve a parsearse igual');
  let steps;try{steps=B.btAtila(J);}catch(e){assert(/más de/.test(e.message));atCap++;continue;}
  const end=last(steps),exp=hamOracle(J);
  assert.equal(end.rcls==='good',exp,gardenText(J));checks++;
  if(exp){
    const S=end.path;assert.equal(S.length,k);assert.equal(new Set(S.map(p=>p.join())).size,k);
    S.forEach((p,j)=>{assert(J[p[0]-1][p[1]-1]);const q=S[(j+1)%k];assert.equal(Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1]),1);});
    atYes++;
  }else atNo++;
  if(k%2)assert(!exp,'cantidad impar de pisadas: nunca hay recorrido');
  if(i<80)verifySteps(steps,B.btAtilaRender);
}
assert(atYes>=30&&atNo>100,'cobertura: '+atYes+'/'+atNo);
const gardens=[['.###./####./#.##./####./.##..',169,'good',16],['####/#..#/#..#/####',24,'good',12],['####/####/####/####',32,'good',16],['###/###/###',178,'bad',9],['###../#.#../###../.#.../.#...',42,'bad',10],['##/..',1,'bad',2],['##/##',8,'good',4]];
for(const [text,count,rcls,k] of gardens){
  const J=B.btParseJardin(text),steps=B.btAtila(J);
  assert.equal(steps.length,count,text);assert.equal(last(steps).rcls,rcls);assert.equal(last(steps).k,k);
  verifySteps(steps,B.btAtilaRender);checks+=3;
}
for(const bad of ['','#','##/#','###/###','##/#x','.../.../...x','######/######/######/######/######/######'])assert.throws(()=>B.btParseJardin(bad),/jardín/,'jardín inválido: '+bad);
checks+=7;
// con el jardín 4×4 completo hay 6 ciclos distintos (sin orientación), el algoritmo devuelve uno de ellos
{
  const J=B.btParseJardin('####/####/####/####'),cells=[];J.forEach((r,f)=>r.forEach((p,c)=>p&&cells.push([f,c])));
  const adj=cells.map(a=>cells.map((b,j)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1?j:-1).filter(x=>x>=0));
  let cnt=0;const vis=new Array(16).fill(false);vis[0]=true;
  (function go(v,dep){if(dep===16){if(adj[v].includes(0))cnt++;return;}for(const w of adj[v])if(!vis[w]){vis[w]=true;go(w,dep+1);vis[w]=false;}})(0,1);
  assert.equal(cnt/2,6);checks++;
}

/* ---------- entradas de la interfaz y presets escritos en el HTML ---------- */
inputs.x='3';assert.equal(B.btInteger('x','m',1,3),3);
for(const bad of ['0','4','1.5','','abc','1e1']){inputs.x=bad;assert.throws(()=>B.btInteger('x','m',1,3),/m: ingresá un entero/);}
for(const ok of ['2,3,4,5','0,0','4','1,2,3,4,5,6']){inputs.v=ok;assert.equal(B.btVector('v').length,ok.split(',').length);}
for(const bad of ['','1,,2','-1,2','1,2,3,4,5,6,7','a','1.5']){inputs.v=bad;assert.throws(()=>B.btVector('v'),/entre 1 y 6/);}
checks+=16;
const defaults={};for(const m of html.matchAll(/<input[^>]*\bid="(g1[567]-[a-z]+)"[^>]*\bvalue="([^"]*)"/g))defaults[m[1]]=m[2];
assert.deepEqual(Object.keys(defaults).sort(),['g15-m','g15-t','g16-d','g16-lab','g16-o','g17-jardin']);
const presets=[...html.matchAll(/data-bt-sim="(\w+)" data-bt-preset="([^"]*)"/g)].map(m=>({sim:m[1],values:JSON.parse(m[2].replace(/&quot;/g,'"'))}));
assert.equal(presets.length,13,'4 de procesadores + 4 de laberinto + 5 de jardín');
const run={
  proc:()=>B.btProcesadores(B.btVector('g15-t'),B.btInteger('g15-m','Procesadores',1,3)),
  maze:()=>{const L=B.btParseLab(inputs['g16-lab']),n=L.length;return B.btLaberinto(L,B.btParseCasilla(inputs['g16-o'],n,'Origen'),B.btParseCasilla(inputs['g16-d'],n,'Destino'));},
  atila:()=>B.btAtila(B.btParseJardin(inputs['g17-jardin']))
};
const renders={proc:B.btProcRender,maze:B.btMazeRender,atila:B.btAtilaRender};
for(const p of presets){
  Object.assign(inputs,defaults);Object.keys(p.values).forEach(id=>{inputs[id]=String(p.values[id]);}); // como input.value = 2
  const steps=run[p.sim]();assert(steps.length>=1&&steps.length<=B.BT_MAX_STEPS||p.sim==='proc');verifySteps(steps,renders[p.sim]);checks++;
}
Object.assign(inputs,defaults);
for(const [sim,count] of [['proc',28],['maze',124],['atila',169]]){ // los ejemplos por defecto, dentro del presupuesto del apunte
  assert.equal(run[sim]().length,count);checks++;
}
/* El resaltado recorre el pseudocódigo: cada `line` existe como data-l del simulador, ninguna línea concentra
   más de la mitad de los pasos y aparecen las líneas que antes nunca se resaltaban. */
for(const [sim,id,must] of [['maze','sim-g16',[6,9,15,16,21]],['atila','sim-g17',[8,9,14,18]]]){
  const block=html.slice(html.indexOf('id="'+id+'"'));
  const code=block.slice(0,block.indexOf('data-viz'));
  const dataL=new Set([...code.matchAll(/data-l="(\d+)"/g)].map(m=>+m[1]));
  const steps=run[sim](),count={};
  steps.forEach(s=>{if(s.line!==undefined){assert(dataL.has(s.line),id+': la línea '+s.line+' no existe en el pseudocódigo');count[s.line]=(count[s.line]||0)+1;}});
  for(const l of must)assert(count[l],id+': nunca se resalta la línea '+l);
  for(const l of Object.keys(count))assert(count[l]<=steps.length/2,id+': la línea '+l+' concentra '+count[l]+' de '+steps.length+' pasos');
  checks+=2+must.length+Object.keys(count).length;
}
// un error de entrada se muestra, no rompe el renderer
for(const r of Object.values(renders))assert(/result bad/.test(r({error:'x < y'}))&&/x &lt; y/.test(r({error:'x < y'})));checks++;

console.log('guia-backtracking: '+checks+' comprobaciones, '+rendered+' pasos renderizados · laberinto '+labOk+' con camino / '+labNo+' sin / '+labCap+' sobre el tope · jardín '+atYes+' con recorrido / '+atNo+' sin / '+atCap+' sobre el tope');
