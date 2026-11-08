// node tests/clase12.test.cjs [copia-de-index.html] — clase 12 (28/10): laberinto y asignación de tareas.
// Builders reales contra oráculos independientes; el laberinto del apunte contra el de la guía (paridad exacta de pasos).
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const appFile=path.join(__dirname,'../apuntes interactivos/index.html'),guideFile=path.join(__dirname,'../apuntes interactivos/prog3-ejercicios.html');
const html=fs.readFileSync(process.argv[2]||appFile,'utf8').replace(/\r\n/g,'\n'),guide=fs.readFileSync(guideFile,'utf8').replace(/\r\n/g,'\n');
const marker='/* ==================== CLASE 12: LABERINTO Y ASIGNACIÓN DE TAREAS ==================== */',uiMarker='/* ===== interfaz clase 12 ===== */';
assert(html.includes(marker)&&html.includes(uiMarker),'Falta el bloque de la clase 12');
const stubs=()=>({document:{getElementById:id=>({value:inputs[id]})},esc:s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),cells:a=>JSON.stringify(a)});
const inputs={};
/* contexto del apunte: helpers de la clase 10 (Traza…), dpTable de la clase 7 y el bloque de la clase 12 */
const app=stubs();vm.createContext(app);
vm.runInContext(html.slice(html.indexOf('/* ==================== CLASE 10:'),html.indexOf('const c10QueenSim=')),app);
vm.runInContext(html.slice(html.indexOf('function dpTable(st){'),html.indexOf('function dpRender(st){')),app);
vm.runInContext(html.slice(html.indexOf(marker),html.indexOf(uiMarker)),app);
const A=vm.runInContext('({c12Maze,c12ParseLab,c12ParseCell,c12MazeRender,c12Assign,c12AssignRender,c12ParseCosts,c12InitialSolution,c12Bound,C12_DIRS,TRAZA_MAX})',app);
/* contexto de la guía: el laberinto de prog3-ejercicios.html */
const G0=stubs();vm.createContext(G0);
const gs='/* ===== Guía · Backtracking ===== */',ge='const btProcSim=';
vm.runInContext(guide.slice(guide.indexOf(gs),guide.indexOf(ge)),G0);
const G=vm.runInContext('({btLaberinto,btParseLab,btParseCasilla})',G0);
const plain=x=>JSON.parse(JSON.stringify(x)),last=a=>a[a.length-1];
let checks=0,rendered=0,seed=314159;
const rand=n=>{seed=(1664525*seed+1013904223)>>>0;return Math.floor(seed/4294967296*n);}; // bits altos: los bajos del congruencial son periódicos
const same=(a,b,msg)=>{assert.equal(JSON.stringify(plain(a)),JSON.stringify(plain(b)),msg);checks++;};
const unesc=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&');

function verifySteps(steps,render){
  assert(steps.length>0);
  const seen=new Set();
  for(const s of steps){
    for(const key of ['used','asig','best','path','cur','deps']){
      if(s[key]&&typeof s[key]==='object'){assert(!seen.has(s[key]),'Estado compartido entre pasos ('+key+')');seen.add(s[key]);}
    }
  }
  steps.forEach((s,i)=>{const out=render(s,steps,i);assert(!/undefined|NaN/.test(out),out.slice(0,300));rendered++;});
  if(steps[0].frames){ // traza: la pila de marcos es coherente con la profundidad de llamada
    assert.equal(last(steps).cd,0,'la pila termina vacía');
    steps.forEach((s,i)=>{assert.equal(s.frames.length,s.cd);if(i)assert(Math.abs(s.cd-steps[i-1].cd)<=1,'la profundidad cambia de a un marco ('+i+')');
      for(const f of s.frames)for(const [k,v] of Object.entries(f.vars))assert(v!==undefined&&!(typeof v==='number'&&Number.isNaN(v)),'variable '+k+' sin valor');});
  }
}
const dataL=id=>{const b=html.slice(html.indexOf('id="'+id+'"'));return new Set([...b.slice(0,b.indexOf('data-viz')).matchAll(/data-l="(\d+)"/g)].map(m=>+m[1]));};

/* =============================== LABERINTO =============================== */
function labOracle(L,o,d){ // Bellman-Ford con peso en los nodos (>= 0) y aristas dirigidas válidas
  const m=L.length,n=L[0].length,dist=L.map(r=>r.map(()=>Infinity));dist[o[0]-1][o[1]-1]=L[o[0]-1][o[1]-1].valor;
  for(let it=0;it<m*n+2;it++)for(let f=0;f<m;f++)for(let c=0;c<n;c++){
    if(dist[f][c]===Infinity)continue;
    for(const dd of A.C12_DIRS){if(!L[f][c][dd.k])continue;const nf=f+dd.di,nc=c+dd.dj;if(nf<0||nf>=m||nc<0||nc>=n)continue;dist[nf][nc]=Math.min(dist[nf][nc],dist[f][c]+L[nf][nc].valor);}
  }
  return dist[d[0]-1][d[1]-1];
}
function labEnum(L,o,d){ // todos los caminos simples, sin poda
  const m=L.length,n=L[0].length,vis=L.map(r=>r.map(()=>false));let best=Infinity;
  (function go(f,c,s){vis[f][c]=true;s+=L[f][c].valor;
    if(f===d[0]-1&&c===d[1]-1)best=Math.min(best,s);
    else for(const dd of A.C12_DIRS){if(!L[f][c][dd.k])continue;const nf=f+dd.di,nc=c+dd.dj;if(nf<0||nf>=m||nc<0||nc>=n||vis[nf][nc])continue;go(nf,nc,s);}
    vis[f][c]=false;})(o[0]-1,o[1]-1,0);
  return best;
}
/* Réplica literal e independiente de la lámina 14 (matrices con borde); además cuenta los pasos que tiene que generar el simulador:
   2 globales y, por llamada, 6 de entrada + 1 de la condición del destino (+2 si guarda) o 1 de la poda por mejor solución
   (+1 de nuevaPos y, por dirección, 1 de la condición y 4 más si hay llamada) + 3 de salida. */
function labLiteral(L,o,d){
  const m=L.length,n=L[0].length,vis=Array.from({length:m+2},()=>Array(n+2).fill(false));
  let mejor=Infinity,res=null,llamadas=0,podasV=0,podasM=0,pasos=2;
  (function go(i,j,sumaP){
    llamadas++;pasos+=6;vis[i][j]=true;sumaP+=L[i-1][j-1].valor;
    if(i===d[0]&&j===d[1]){pasos+=1;if(sumaP<mejor){mejor=sumaP;pasos+=2;res=vis.map(r=>r.slice());}}
    else{pasos+=1;
      if(sumaP<mejor){pasos+=1;
        for(const dd of A.C12_DIRS){pasos+=1;if(L[i-1][j-1][dd.k]){if(vis[i+dd.di][j+dd.dj])podasV++;else{pasos+=4;go(i+dd.di,j+dd.dj,sumaP);}}}
      }else podasM++;}
    vis[i][j]=false;pasos+=3;
  })(o[0],o[1],0);
  return {mejor,llamadas,podasV,podasM,pasos,res};
}
const labText=L=>L.map(r=>r.map(c=>c.valor+A.C12_DIRS.filter(d=>c[d.k]).map(d=>d.sym).join('')).join(' ')).join(' / ');
const randLab=(m,n,pOpen,pZero)=>Array.from({length:m},(_,f)=>Array.from({length:n},(_,c)=>{
  const cel={valor:rand(100)<pZero?0:1+rand(9)};
  A.C12_DIRS.forEach(d=>{const nf=f+d.di,nc=c+d.dj;cel[d.k]=nf>=0&&nf<m&&nc>=0&&nc<n&&rand(100)<pOpen;});return cel;}));
let labOk=0,labNo=0,labCap=0,parity=0;
for(let i=0;i<700;i++){
  const m=1+rand(4),n=1+rand(4),L=randLab(m,n,40+rand(60),rand(3)===0?25:0),o=[1+rand(m),1+rand(n)],d=[1+rand(m),1+rand(n)];
  same(A.c12ParseLab(labText(L)),L,'el texto vuelve a parsearse igual');
  let steps;try{steps=A.c12Maze(L,o,d);}catch(e){assert(/más de/.test(e.message));labCap++;continue;}
  const end=last(steps),exp=labEnum(L,o,d),lit=labLiteral(L,o,d);
  assert.equal(exp,labOracle(L,o,d),'los dos oráculos discrepan');
  assert.equal(lit.mejor,exp,'la réplica literal discrepa de la enumeración');
  assert.equal(end.mejor,exp);assert.deepEqual(plain(end.stats),{llamadas:lit.llamadas,podasV:lit.podasV,podasM:lit.podasM});
  assert.equal(steps.length,lit.pasos,'cantidad de pasos');checks+=5;
  if(exp===Infinity){assert.equal(end.rcls,'bad');assert.equal(end.best,null);labNo++;}
  else{
    assert.equal(end.rcls,'good');
    const best=steps.reduce((a,s)=>s.best||a,null);let sum=0;
    best.forEach((p,j)=>{sum+=L[p[0]-1][p[1]-1].valor;if(j){const q=best[j-1],dd=A.C12_DIRS.find(x=>q[0]+x.di===p[0]&&q[1]+x.dj===p[1]);assert(dd&&L[q[0]-1][q[1]-1][dd.k],'paso válido');}});
    assert.equal(sum,exp);assert.equal(best[0].slice(0,2).join(),o.join());assert.equal(last(best).slice(0,2).join(),d.join());
    const cb=new Set(best.map(p=>p[0]+','+p[1])),cl=new Set();lit.res.forEach((r,f)=>r.forEach((v,c)=>{if(v)cl.add(f+','+c);}));
    assert.deepEqual([...cb].sort(),[...cl].sort(),'resultado es visitado en el momento de la mejor solución');checks+=5;labOk++;
  }
  assert.equal(end.path.length,0);
  /* paridad exacta con el laberinto de la guía: mismos pasos, mensajes, líneas, pila y estado */
  if(steps.length<=3000){
    const g=G.btLaberinto(G.btParseLab(labText(L)),o,d);
    assert.equal(JSON.stringify(plain(steps)),JSON.stringify(plain(g)),'el laberinto del apunte difiere del de la guía');parity++;checks++;
  }
  if(i<60)verifySteps(steps,A.c12MazeRender);
}
assert(labOk>300&&labNo>20&&parity>400,'cobertura: '+labOk+'/'+labNo+'/'+parity);
const mazeSlide='4v> 3v< 6v> 8< / 5^v 2^v> 1^v<> 5v< / 7^> 3^< 2^> 1^<'; // lámina 10: origen (2,1), destino (3,4)
const mazeCases=[[mazeSlide,'2,1','3,4','good',18],[mazeSlide,'2,1','2,4','good',20],[mazeSlide,'2,1','3,3','good',17],['1v> 9v< / 1^ 1^<','1,1','2,2','good',11],['1v> 1v<> 1v< / 1^ 1^ 1^ / 1 1 1','1,1','3,3','bad',null],[mazeSlide,'2,1','2,1','good',5],['4','1,1','1,1','good',4]];
for(const [text,o,d,rcls,len] of mazeCases){
  const L=A.c12ParseLab(text),m=L.length,n=L[0].length,steps=A.c12Maze(L,A.c12ParseCell(o,m,n,'o'),A.c12ParseCell(d,m,n,'d'));
  assert.equal(steps.length,labLiteral(L,A.c12ParseCell(o,m,n,'o'),A.c12ParseCell(d,m,n,'d')).pasos,text+' '+o+'→'+d);
  assert.equal(last(steps).rcls,rcls);if(len!==null)assert.equal(last(steps).mejor,len);verifySteps(steps,A.c12MazeRender);checks+=3;
}
{ // el ejemplo de la lámina 10, en el orden del pseudocódigo (arriba, abajo, izq, der)
  const L=A.c12ParseLab(mazeSlide),steps=A.c12Maze(L,[2,1],[3,4]),end=last(steps),best=steps.reduce((a,s)=>s.best||a,null);
  same(end.stats,{llamadas:17,podasV:13,podasM:3});assert.equal(end.mejor,18,'17 y 20 de la lámina son sumas parciales sin el valor del destino');assert.equal(steps.length,303);
  same(best.map(p=>p.slice(0,2)),[[2,1],[1,1],[1,2],[2,2],[2,3],[3,3],[3,4]]);same(best.map(p=>p[2]),[5,9,12,14,15,17,18]);checks+=2;
}
for(const bad of ['','1v 2 / 3','1v 2x / 3 4','1vv 2 / 3 4','1000 2 / 3 4','a b / c d','1 1 1 1 1','1 / 1 / 1 / 1 / 1','1^','1< 1','1 1>','1v','1 1 / 1 1^v'])
  assert.throws(()=>A.c12ParseLab(bad),/laberinto|Casilla/,'laberinto inválido: '+bad);
for(const bad of ['','0,1','1,5','a,b','1;1','1','3,1','1,4'])assert.throws(()=>A.c12ParseCell(bad,2,3,'Origen'),/Origen/);
for(const bad of ['','1v 2 / 3','1000 2 / 3 4','1^','1 1>'])assert.equal((()=>{try{G.btParseLab(bad);return 'ok';}catch(e){return e.message;}})(),(()=>{try{A.c12ParseLab(bad);return 'ok';}catch(e){return e.message;}})(),'mismo error que la guía: '+bad);
checks+=13+8+5;

/* ========================== ASIGNACIÓN DE TAREAS ========================== */
function permutations(m){const out=[],rec=(a,k)=>{if(k===m){out.push(a.slice());return;}for(let i=k;i<m;i++){[a[k],a[i]]=[a[i],a[k]];rec(a,k+1);[a[k],a[i]]=[a[i],a[k]];}};rec([...Array(m).keys()],0);return out;}
const costOf=(M,asig)=>asig.reduce((s,p,t)=>s+M[p][t],0);
const assignOracle=M=>Math.min(...permutations(M.length).map(a=>costOf(M,a)));
/* Réplica literal e independiente de las láminas 20 a 22 + predicción exacta de la cantidad de pasos del simulador:
   llamada inicial 1 · CALCULAR_SOLUCION_INICIAL 4 + Σ(k+8) + 1 · corrección 1 (solo «Corregido») · fin 1 · por llamada de BackTareas:
   entrada 1 + tarea = m 1 + [hoja: 1 (+2 si guarda)] o [estimado 1 + COSTO_MIN_RESTANTE (3 + 4·(m − tarea)) + estimado 1 + poda 1
   + por persona 2 (+5 si está libre)] + fin 1. */
function asigLiteral(M,literal){
  const m=M.length,usado=new Array(m).fill(false),ini=[];let total=0;
  {const u=new Array(m).fill(false);for(let t=0;t<m;t++){let p=-1;for(let i=0;i<m;i++)if(!u[i]){p=i;break;}u[p]=true;ini.push(p);total+=M[p][t];}}
  let lim=total,best=literal?null:ini.slice(),llamadas=0,hojas=0,podas=0,pasos=1+4+1+(literal?0:1)+1;const limSeq=[total];
  for(let k=0;k<m;k++)pasos+=k+8;
  const asig=new Array(m).fill(null);
  (function go(t,c){
    llamadas++;pasos+=2+1;
    if(t===m){hojas++;pasos+=1;if(c<lim){lim=c;limSeq.push(c);best=asig.slice();pasos+=2;}}
    else{
      let est=c;for(let q=t;q<m;q++){let mn=Infinity;for(let p=0;p<m;p++)if(!usado[p])mn=Math.min(mn,M[p][q]);est+=mn;}
      pasos+=1+(3+4*(m-t))+1+1;
      if(est<lim){for(let p=0;p<m;p++){pasos+=2;if(!usado[p]){pasos+=5;usado[p]=true;asig[t]=p;go(t+1,c+M[p][t]);usado[p]=false;}}}else podas++;
    }
  })(0,0);
  return {lim,best,llamadas,hojas,podas,pasos,limSeq,ini,total};
}
const MAT=[[11,12,18,40],[14,15,13,22],[11,17,19,23],[17,14,20,28]];
let asOk=0,asHole=0,asTies=0;
for(let i=0;i<400;i++){
  const m=2+rand(4),mode=rand(4),M=Array.from({length:m},(_,p)=>Array.from({length:m},(_,t)=>mode===0?rand(100):mode===1?rand(4):mode===2?(p===t?rand(5):5+rand(40)):5));
  const opt=assignOracle(M),ini=A.c12InitialSolution(M);
  for(const literal of [true,false]){
    const steps=A.c12Assign(M,literal),end=last(steps),rep=asigLiteral(M,literal);
    assert.equal(end.lim,opt,JSON.stringify(M));assert.equal(rep.lim,opt,'la réplica literal discrepa de las permutaciones');
    same(end.stats,{llamadas:rep.llamadas,hojas:rep.hojas,podasEst:rep.podas},'árbol de llamadas: '+JSON.stringify([M,literal]));
    assert.equal(steps.length,rep.pasos,'cantidad de pasos '+JSON.stringify([M,literal]));
    const seq=[];steps.forEach(s=>{if(s.lim!==Infinity&&seq[seq.length-1]!==s.lim)seq.push(s.lim);});same(seq,rep.limSeq,'el lim va bajando como en el pseudocódigo');
    assert.equal(ini.valor,rep.total);same(ini.asignacion,rep.ini);checks+=6;
    if(literal){
      if(opt===ini.valor){assert.equal(end.best,null,'lámina: si la inicial ya es óptima, mejor_asignacion nunca se asigna');assert.equal(end.rcls,'bad');asHole++;}
      else{assert.notEqual(end.best,null);assert.equal(costOf(M,end.best),opt);assert.equal(new Set(end.best).size,m);assert.equal(end.rcls,'good');asOk++;}
      same(end.best,rep.best,'mejor_asignacion de la réplica');checks+=2;
    }else{
      assert.notEqual(end.best,null);assert.equal(costOf(M,end.best),opt);assert.equal(new Set(end.best).size,m);assert.equal(end.rcls,'good');checks+=4;
      if(opt===ini.valor)same(end.best,ini.asignacion,'sin mejoras estrictas queda la asignación inicial');
    }
    if(rand(5)===0){assert.equal(steps.length>0,true);}
    if(i<30)verifySteps(steps,A.c12AssignRender);
  }
  if(mode===1)asTies++;
}
assert(asOk>100&&asHole>10&&asTies>50,'cobertura: '+asOk+'/'+asHole+'/'+asTies);
{ // el ejemplo de la lámina 19
  const M=A.c12ParseCosts('11 12 18 40 / 14 15 13 22 / 11 17 19 23 / 17 14 20 28');same(M,MAT);
  const ini=A.c12InitialSolution(M);assert.equal(ini.valor,73);same(ini.asignacion,[0,1,2,3]);assert.equal(A.c12Bound(M,[false,false,false,false],0).valor,58,'cota de la raíz');
  for(const literal of [true,false]){
    const steps=A.c12Assign(M,literal),end=last(steps),seq=[];steps.forEach(s=>{if(s.lim!==Infinity&&seq[seq.length-1]!==s.lim)seq.push(s.lim);});
    same(seq,[73,69,61],'lim: la lámina rotula 73 64 61, la ejecución da 73 → 69 → 61');same(end.stats,{llamadas:23,hojas:2,podasEst:11});same(end.best,[0,3,1,2]);assert.equal(end.lim,61);
    assert.equal(steps.length,literal?588:589);checks+=5;
  }
  // las 14 cotas que rotula la lámina 19 (árbol por personas): costo actual + mínimo de cada tarea que falta entre las personas libres
  const nodes=[['a1'],['a2'],['a3'],['a4'],['a1','b2'],['a1','b3'],['a1','b4'],['a2','b1'],['a2','b3'],['a2','b4'],['a1','b3','c2'],['a1','b3','c4'],['a2','b3','c1'],['a2','b3','c4']];
  const expect=[60,58,65,78,68,61,66,68,59,64,69,61,64,65];
  nodes.forEach((nodo,k)=>{
    const pares=nodo.map(s=>['abcd'.indexOf(s[0]),+s[1]-1]),usadoP=[0,1,2,3].map(p=>pares.some(q=>q[0]===p)),faltan=[0,1,2,3].filter(t=>!pares.some(q=>q[1]===t));
    const c=pares.reduce((s,[p,t])=>s+M[p][t],0)+A.c12Bound(M,usadoP,faltan).valor;
    assert.equal(c,expect[k],'cota del nodo '+nodo.join('·'));checks++;
  });
  // la diagonal óptima: el hueco de la lámina
  const D=A.c12ParseCosts('1 9 9 / 9 1 9 / 9 9 1'),lit=last(A.c12Assign(D,true)),cor=last(A.c12Assign(D,false));
  assert.equal(lit.lim,3);assert.equal(lit.best,null);assert.equal(lit.rcls,'bad');same(cor.best,[0,1,2]);assert.equal(cor.rcls,'good');
  const E=last(A.c12Assign(A.c12ParseCosts('4 4 4 / 4 4 4 / 4 4 4'),true));assert.equal(E.best,null);same(E.stats,{llamadas:1,hojas:0,podasEst:1});
  const Q=last(A.c12Assign(A.c12ParseCosts('5 1 / 1 5'),true));assert.equal(Q.lim,2);same(Q.best,[1,0]);checks+=12;
}
for(const bad of ['','1 2','1 2 / 3','1 2 / 3 x','1 2 / 3 100','1 2 3 4 5 6 / 1 2 3 4 5 6 / 1 2 3 4 5 6 / 1 2 3 4 5 6 / 1 2 3 4 5 6 / 1 2 3 4 5 6','-1 2 / 3 4','1.5 2 / 3 4'])
  assert.throws(()=>A.c12ParseCosts(bad),/matriz de costos|Costo inválido/,'matriz inválida: '+bad);
same(A.c12ParseCosts('0 99 / 99 0'),[[0,99],[99,0]]);checks+=9;
assert.throws(()=>A.c12Assign(Array.from({length:7},(_,p)=>Array.from({length:7},()=>p===0?1:100)),true),/más de 60000 pasos/,'el tope de pasos se informa (persona 0 barata en todo: la estimación casi no poda)');checks++;

/* ============================ HTML y presets ============================ */
{ // ids, valores por defecto y presets escritos en el HTML corren sin error y dentro del presupuesto
  const defaults={};for(const m of html.matchAll(/<input[^>]*\bid="(c12-[a-z-]+)"[^>]*\bvalue="([^"]*)"/g))defaults[m[1]]=unesc(m[2]);
  assert.deepEqual(Object.keys(defaults).sort(),['c12-asig-costos','c12-lab-d','c12-lab-mapa','c12-lab-o']);
  const presets=[...html.matchAll(/data-c12-sim="(\w+)" data-c12-preset="([^"]*)"/g)].map(m=>({sim:m[1],values:JSON.parse(unesc(m[2]))}));
  assert.equal(presets.length,10,'6 de laberinto + 4 de asignación');
  const run={lab:()=>{const L=A.c12ParseLab(inputs['c12-lab-mapa']),m=L.length,n=L[0].length;return A.c12Maze(L,A.c12ParseCell(inputs['c12-lab-o'],m,n,'Origen'),A.c12ParseCell(inputs['c12-lab-d'],m,n,'Destino'));},
    asig:literal=>A.c12Assign(A.c12ParseCosts(inputs['c12-asig-costos']),literal)};
  for(const p of presets){
    Object.assign(inputs,defaults);Object.keys(p.values).forEach(id=>{inputs[id]=String(p.values[id]);});
    const steps=p.sim==='lab'?run.lab():run.asig(true);assert(steps.length>=1&&steps.length<=A.TRAZA_MAX);
    verifySteps(steps,p.sim==='lab'?A.c12MazeRender:A.c12AssignRender);checks++;
  }
  Object.assign(inputs,defaults);
  assert.equal(run.lab().length,303);assert.equal(run.asig(true).length,588);assert.equal(run.asig(false).length,589);
  assert.equal(defaults['c12-lab-mapa'],mazeSlide);assert.equal(defaults['c12-asig-costos'],'11 12 18 40 / 14 15 13 22 / 11 17 19 23 / 17 14 20 28');checks+=5;
  // el resaltado recorre el pseudocódigo: cada `line` existe como data-l, se ejecuta lo que importa y ninguna línea concentra más del 60 % de los pasos
  const lab=run.lab(),L1=dataL('sim-c12-laberinto'),c1={};
  lab.forEach(s=>{if(s.line!==undefined){assert(L1.has(s.line),'laberinto: la línea '+s.line+' no existe');c1[s.line]=(c1[s.line]||0)+1;}});
  for(const l of [1,5,6,7,8,9,10,11,12,16,17,18,19,20,21,23,24,25,26,28,29,30,31,33,34,35,36,39,40,41])assert(c1[l],'laberinto: nunca se resalta la línea '+l);
  for(const l of Object.keys(c1))assert(c1[l]<=lab.length*0.6);
  const L2=dataL('sim-c12-asignacion');assert.equal(L2.size,58+1,'58 renglones de la cátedra + la corrección propia');assert(html.includes('<div class="cl" data-l="99" hidden>'),'la corrección propia arranca oculta');
  for(const literal of [true,false]){
    const st=run.asig(literal),c2={};st.forEach(s=>{if(s.line!==undefined){assert(L2.has(s.line),'asignación: la línea '+s.line+' no existe');c2[s.line]=(c2[s.line]||0)+1;}});
    for(const l of [1,4,5,6,7,11,12,13,14,15,16,17,18,23,24,27,28,29,32,35,37,38,41,42,44,46,47,48,50,51,52,55,56,58])assert(c2[l],'asignación: nunca se resalta la línea '+l);
    assert.equal(!!c2[99],!literal,'la corrección propia solo se ejecuta en «Corregido»');
    for(const l of Object.keys(c2))assert(c2[l]<=st.length*0.6);
    checks+=34+3+Object.keys(c2).length;
  }
  checks+=30+Object.keys(c1).length+2;
  // los árboles estáticos y la tabla de la lámina 19 que escribió el generador coinciden con la ejecución
  const pres=[...html.matchAll(/<pre class="ps">([^<]*)<\/pre>/g)].map(m=>unesc(m[1]));
  const labTree=pres.find(t=>t.startsWith('(2,1)  sumaP = 5')),asigTree=pres.find(t=>t.startsWith('raíz  costo = 0'));
  assert(labTree&&asigTree,'faltan los árboles estáticos');
  assert.equal((labTree.match(/✗ poda por visitado/g)||[]).length,13);assert.equal((labTree.match(/← poda por mejor solución/g)||[]).length,3);assert(/mejorSuma = 18/.test(labTree));
  assert.equal(asigTree.split('\n').length,23,'una línea por llamada: 23');assert.equal((asigTree.match(/✗ poda: estimado/g)||[]).length,11);assert(/→ lim = 61/.test(asigTree)&&/→ lim = 69/.test(asigTree));
  const tabla=html.slice(html.indexOf('Mínimos de las tareas que faltan, sin las personas ya usadas'));
  same([...tabla.slice(0,tabla.indexOf('</table>')).matchAll(/<td><b>(\d+)<\/b><\/td>/g)].map(m=>+m[1]),[60,58,65,78,68,61,66,68,59,64,69,61,64,65],'las 14 cotas de la lámina 19 en la tabla');checks+=8;
}

/* ================================ quiz ================================ */
{
  const m=html.slice(html.indexOf('const QUESTIONS_C12=['),html.indexOf('];',html.indexOf('const QUESTIONS_C12=['))+2),ctx={};vm.createContext(ctx);
  const Q=vm.runInContext(m+';QUESTIONS_C12',ctx);
  assert.equal(Q.length,10);const pos=[0,0,0,0];
  Q.forEach(q=>{assert.equal(q.o.length,4);assert(q.c>=0&&q.c<=3);assert(q.q.length>20&&q.f.length>40);assert.equal(new Set(q.o).size,4,'opciones repetidas');pos[q.c]++;});
  assert(pos.every(n=>n>=2),'la respuesta correcta tiene que repartirse entre las cuatro posiciones: '+pos);assert.equal(new Set(Q.map(q=>q.q)).size,10);checks+=45;
}
/* links entre archivos: la guía enlaza a la clase 12 y el apunte a la guía */
for(const id of ['laberinto-c12','asignacion-c12','clase12','repaso-c12','quiz-c12','chuleta-c12'])assert(html.includes('id="'+id+'"'),'falta '+id);
for(const id of ['ej-g16','ej-c16'])assert(guide.includes('id="'+id+'"'),'falta '+id+' en la guía');
assert(/href="index\.html#laberinto-c12"/.test(guide),'la guía tiene que enlazar a la sección del laberinto del apunte');assert(/data-apunte-sim="sim-c12-asignacion"/.test(guide),'ej-c16 enlaza al simulador del apunte');checks+=10;

console.log('clase12: '+checks+' comprobaciones, '+rendered+' pasos renderizados · laberinto '+labOk+' con camino / '+labNo+' sin / '+labCap+' sobre el tope / '+parity+' idénticos a la guía · asignación '+asOk+' con mejora / '+asHole+' con el hueco de la lámina');
