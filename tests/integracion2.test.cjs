// node tests/integracion2.test.cjs — builders reales de la integración del 2.º parcial (s1–s6) contra oráculos independientes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=process.argv[2]||path.join(__dirname,'../apuntes interactivos/prog3-ejercicios.html');
const html=fs.readFileSync(file,'utf8');
const slice=(from,to)=>{const a=html.indexOf(from),b=html.indexOf(to);assert(a>=0&&b>a,'Falta el bloque entre «'+from+'» y «'+to+'»');return html.slice(a,b);};
const inputs={};
const context={document:{getElementById:id=>({value:inputs[id]})},esc:s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),cells:a=>JSON.stringify(a)};
vm.createContext(context);
// helpers de PD (dpSteps, dpTable…), helpers de Backtracking (btPush, btFrame…) y el bloque nuevo, hasta la primera llamada a Sim
vm.runInContext(slice('/* ===== Programación Dinámica (Guía PD 1–3)','/* ===== Guía · PD 1'),context);
vm.runInContext(slice('/* ===== Guía · Backtracking ===== */','const btProcSim='),context);
vm.runInContext(slice('/* ===== Integración · Segundo parcial ===== */','const s1Sim='),context);
const B=vm.runInContext('({s1Almacenamiento,s2Subasta,s3Catalogo,s4Estaciones,s5CiudadBase,s6Festival,s2Parse,s4ParseMatriz,s4ParseCasilla,s5Parse,sList,sSameLength,'+
  's2Render,s4Render,s5Render,sDpRender,floydPuro,S2_MAX_STEPS,S4_MOVES,btInteger})',context);
const plain=x=>JSON.parse(JSON.stringify(x)),last=a=>a[a.length-1];
let checks=0,rendered=0,seed=271828;
const rand=n=>{seed=(1664525*seed+1013904223)>>>0;return seed%n;};
const same=(a,b,msg)=>{assert.equal(JSON.stringify(plain(a)),JSON.stringify(plain(b)),msg);checks++;};

function verifySteps(steps,render,keys){
  assert(steps.length>0);
  const seen=new Set();
  for(const s of steps){
    for(const key of keys){
      if(s[key]&&typeof s[key]==='object'){assert(!seen.has(s[key]),'Estado compartido entre pasos ('+key+')');seen.add(s[key]);}
    }
    const out=render(s);assert(!/undefined|NaN/.test(out),out);rendered++;
  }
}
const nums=(re,s)=>[...s.matchAll(re)].map(m=>+m[1]);

/* ---------- oráculos ---------- */
function s1Oracle(S,D){let best=0;for(let mask=0;mask<(1<<S.length);mask++){let t=0;S.forEach((x,i)=>{if(mask>>i&1)t+=x;});if(t<=D&&t>best)best=t;}return best;}
function s3Oracle(c,P){const ok=new Array(P+1).fill(false);ok[0]=true;for(let j=1;j<=P;j++)for(const x of c)if(j>=x&&ok[j-x])ok[j]=true;let best=0;for(let j=0;j<=P;j++)if(ok[j])best=j;return best;}
function s6Oracle(r,c,P){let best=0;const n=r.length;for(let code=0;code<3**n;code++){let q=code,cost=0,val=0;for(let i=0;i<n;i++){const k=q%3;q=Math.floor(q/3);cost+=[0,c[i],c[i]*3/2][k];val+=[0,r[i],2*r[i]][k];}if(cost<=P&&val>best)best=val;}return best;}
function s2Oracle(O){const m=O.length,n=O[0].length;let best=0;(function go(e,used,g){if(e===n){best=Math.max(best,g);return;}go(e+1,used,g);for(let p=0;p<m;p++)if(O[p][e]!==null&&!(used>>p&1))go(e+1,used|1<<p,g+O[p][e]);})(0,0,0);return best;}
const MOVES=[[-1,1],[0,1],[1,1],[1,0]];
function s4Oracle(M,ini,K){ // todos los recorridos de K casillas, sin poda; comprueba además que ninguno repite casilla
  const m=M.length,n=M[0].length;let best=Infinity,count=0;const seen=new Set([ini.join()]);
  (function go(f,c,k,e){
    if(k===K){best=Math.min(best,e);count++;return;}
    for(const [df,dc] of MOVES){const nf=f+df,nc=c+dc;if(nf<1||nf>m||nc<1||nc>n)continue;
      assert(!seen.has(nf+','+nc),'con estos movimientos una casilla nunca se repite');
      seen.add(nf+','+nc);go(nf,nc,k+1,e+M[nf-1][nc-1]);seen.delete(nf+','+nc);}
  })(ini[0],ini[1],1,M[ini[0]-1][ini[1]-1]);
  return {best,count};
}
function s4DP(M,ini,K){ // C[k][i][j]: menor esfuerzo de un recorrido de k casillas desde ini que termina en (i,j)
  const m=M.length,n=M[0].length;let C=Array.from({length:m},()=>new Array(n).fill(Infinity));C[ini[0]-1][ini[1]-1]=M[ini[0]-1][ini[1]-1];
  for(let k=2;k<=K;k++){const N=Array.from({length:m},()=>new Array(n).fill(Infinity));
    for(let i=0;i<m;i++)for(let j=0;j<n;j++)for(const [df,dc] of MOVES){const pi=i-df,pj=j-dc;if(pi<0||pi>=m||pj<0||pj>=n)continue;N[i][j]=Math.min(N[i][j],C[pi][pj]+M[i][j]);}
    C=N;}
  return Math.min(...C.flat());
}
function s5Oracle(A){ // Dijkstra desde cada ciudad, sin Floyd
  const n=A.length,sums=[];
  for(let s=0;s<n;s++){const d=new Array(n).fill(Infinity),done=new Array(n).fill(false);d[s]=0;
    for(let it=0;it<n;it++){let u=-1;for(let v=0;v<n;v++)if(!done[v]&&(u<0||d[v]<d[u]))u=v;if(d[u]===Infinity)break;done[u]=true;
      for(let v=0;v<n;v++)if(v!==u&&A[u][v]>0&&d[u]+A[u][v]<d[v])d[v]=d[u]+A[u][v];}
    sums.push(d.reduce((a,b)=>a+b,0));}
  let best=-1,menor=Infinity;sums.forEach((x,i)=>{if(x<menor){menor=x;best=i;}});
  return {best,menor,sums};
}

/* ---------- s1: almacenamiento ---------- */
for(let i=0;i<300;i++){
  const n=1+rand(6),S=Array.from({length:n},()=>1+rand(9)),D=1+rand(20);
  const steps=B.s1Almacenamiento(S,D),end=last(steps),exp=s1Oracle(S,D);
  assert.equal(end.M[n-1][D],exp,JSON.stringify([S,D]));checks++;
  const m=/máximo = (\d+) GB de (\d+)/.exec(end.result);assert.equal(+m[1],exp);assert.equal(+m[2],D);
  const elegidos=exp?nums(/(\d+)/g,end.result.split('programas ')[1]):[];
  assert.equal(elegidos.reduce((a,o)=>a+S[o-1],0),exp,'los programas reconstruidos suman el máximo');
  assert.equal(new Set(elegidos).size,elegidos.length,'cada programa una sola vez');checks+=2;
  if(i<40)verifySteps(steps,B.sDpRender,['M']);
}
{ const steps=B.s1Almacenamiento([6,5,5,3],10),e=last(steps);
  assert.equal(e.M[3][10],10);assert(/Ningún Greedy llega a 10: «el más grande primero» ocupa 9 GB y «el más chico primero» 8 GB/.test(e.msg),e.msg);checks+=2; }

/* ---------- s3: catálogo de premios (repetición ilimitada) ---------- */
for(let i=0;i<300;i++){
  const n=1+rand(5),c=Array.from({length:n},()=>1+rand(12)),P=1+rand(25);
  const steps=B.s3Catalogo(c,P),end=last(steps),exp=s3Oracle(c,P);
  assert.equal(end.M[n-1][P],exp,JSON.stringify([c,P]));checks++;
  const m=/máximo = (\d+) puntos de (\d+)/.exec(end.result);assert.equal(+m[1],exp);
  let suma=0;if(exp)for(const q of end.result.matchAll(/(\d+) × premio (\d+) \((\d+)\)/g)){assert.equal(c[+q[2]-1],+q[3]);suma+=+q[1]*+q[3];}
  assert.equal(suma,exp,'los premios reconstruidos suman el máximo');checks++;
  if(i<40)verifySteps(steps,B.sDpRender,['M']);
}
{ const steps=B.s3Catalogo([9,6,4],17),e=last(steps);
  assert.equal(e.M[2][17],17);assert(/2 × premio 3 \(4\)/.test(e.result)&&/1 × premio 1 \(9\)/.test(e.result),e.result);assert(/gastaría solo <b>15<\/b>/.test(e.msg));checks+=3; }

/* ---------- s6: festival de cine ---------- */
for(let i=0;i<300;i++){
  const n=1+rand(5),r=Array.from({length:n},()=>1+rand(9)),c=Array.from({length:n},()=>2*(1+rand(5))),P=1+rand(20);
  const steps=B.s6Festival(r,c,P),end=last(steps),exp=s6Oracle(r,c,P);
  assert.equal(end.M[n-1][P],exp,JSON.stringify([r,c,P]));checks++;
  if(exp){
    let gasto=0,val=0;
    for(const q of end.result.matchAll(/(\d) proyecci(?:ón|ones) de la película (\d+)/g)){const k=+q[1],i2=+q[2]-1;gasto+=[0,c[i2],c[i2]*3/2][k];val+=[0,r[i2],2*r[i2]][k];}
    assert.equal(val,exp,'las proyecciones reconstruidas suman la calificación máxima');assert(gasto<=P);checks+=2;
  }
  if(i<40)verifySteps(steps,B.sDpRender,['M']);
}
{ const steps=B.s6Festival([6,4,10],[8,6,4],12),e=last(steps);
  assert.equal(e.M[2][12],24);assert(/Con una sola proyección por película el máximo sería <b>16<\/b>/.test(e.msg),e.msg);checks+=2; }
assert.throws(()=>B.s6Festival([5],[3],10),/impar/,'un costo impar se informa');checks++;

/* ---------- s2: subasta ---------- */
let subCap=0,subOk=0;
for(let i=0;i<400;i++){
  const m=1+rand(4),n=1+rand(4),O=Array.from({length:m},()=>Array.from({length:n},()=>rand(100)<35?null:rand(12)));
  let steps;try{steps=B.s2Subasta(O);}catch(e){assert(/más de/.test(e.message));subCap++;continue;}
  const end=last(steps),exp=s2Oracle(O);
  assert.equal(end.mejor,exp,JSON.stringify(O));checks++;
  const personas=end.mejorS.filter(p=>p>=0);assert.equal(new Set(personas).size,personas.length,'una persona no se lleva dos productos');
  let g=0;end.mejorS.forEach((p,e)=>{if(p>=0){assert(O[p][e]!==null,'solo se adjudica a quien ofertó');g+=O[p][e];}});
  assert.equal(g,exp);assert(end.mejorS.every(p=>p!==null));checks+=3;subOk++;
  assert(steps.every(s=>s.S.length===n));
  if(i<80)verifySteps(steps,B.s2Render,['S','mejorS']);
}
assert(subOk>250,'cobertura de la subasta: '+subOk+' dentro del tope / '+subCap+' sobre el tope');
{ const O=B.s2Parse('3 5 / 5 - / 8 7'),steps=B.s2Subasta(O),e=last(steps);
  assert.equal(e.mejor,13);assert.equal(e.mejorS.join(),'2,0','Z se lleva A y X se lleva B');assert(/A → Z \(8\), B → X \(5\)/.test(e.result),e.result);
  verifySteps(steps,B.s2Render,['S','mejorS']);checks+=3; }
{ const O=B.s2Parse('8 7 / 7 1'),e=last(B.s2Subasta(O));assert.equal(e.mejor,14,'Greedy por mayor oferta daría 9: X se lleva A (8) e Y se lleva B (1)');checks++; }
{ const e=last(B.s2Subasta(B.s2Parse('- - / - -')));assert.equal(e.mejor,0);assert.equal(e.rcls,'good');checks+=2; }

/* ---------- s4: estaciones de actividades ---------- */
let estOk=0,estNo=0,estCap=0;
for(let i=0;i<600;i++){
  const m=1+rand(4),n=1+rand(4),M=Array.from({length:m},()=>Array.from({length:n},()=>rand(4)===0?0:1+rand(9))),ini=[1+rand(m),1+rand(n)],X=rand(m*n),K=m*n-X;
  const {best:exp,count}=s4Oracle(M,ini,K);
  assert.equal(s4DP(M,ini,K),exp,'la DP y la enumeración coinciden');checks++;
  let steps;try{steps=B.s4Estaciones(M,ini,X);}catch(e){assert(/más de/.test(e.message));estCap++;continue;}
  const end=last(steps);
  if(exp===Infinity){assert.equal(end.rcls,'bad');estNo++;}
  else{
    assert.equal(end.rcls,'good');assert.equal(end.mejor,exp,JSON.stringify([M,ini,X]));
    const best=steps.reduce((a,s)=>s.best||a,null);assert.equal(best.length,K);assert.equal(best[0].join(),ini.join());
    let sum=M[ini[0]-1][ini[1]-1];
    best.forEach((p,j)=>{if(j){const q=best[j-1];assert(B.S4_MOVES.some(d=>q[0]+d.df===p[0]&&q[1]+d.dc===p[1]),'movimiento válido');sum+=M[p[0]-1][p[1]-1];}});
    assert.equal(sum,exp);assert.equal(new Set(best.map(p=>p.join())).size,K);checks+=5;estOk++;
  }
  assert.equal(end.path.length,0,'el recorrido actual queda vacío al terminar');
  if(i<80)verifySteps(steps,B.s4Render,['path','best']);
}
assert(estOk>250&&estNo>50,'cobertura de estaciones: '+estOk+' con recorrido / '+estNo+' sin / '+estCap+' sobre el tope');
{ // el largo máximo de un recorrido es chico: ≈ m + 2(n−1) casillas
  const M=B.s4ParseMatriz('4 2 7 / 1 6 3 / 5 2 8');
  assert.equal(s4Oracle(M,[1,1],7).count,4);assert.equal(s4Oracle(M,[1,1],8).best,Infinity);checks+=2;
}

/* ---------- s5: ciudad base ---------- */
let ciOk=0,ciNo=0;
for(let i=0;i<500;i++){
  const n=2+rand(5),dens=20+rand(70),A=Array.from({length:n},(_,a)=>Array.from({length:n},(_,b)=>a===b?(rand(2)?0:-1):(rand(100)<dens?1+rand(9):-1)));
  const text=A.map(r=>r.join(' ')).join(' / ');
  same(B.s5Parse(text),A,'el texto vuelve a parsearse igual');
  const steps=B.s5CiudadBase(A),end=last(steps),exp=s5Oracle(A);
  if(exp.best<0){assert.equal(end.rcls,'bad');ciNo++;}
  else{assert.equal(end.rcls,'good');const m=/ciudad base = (\d+) · costo total (\d+)/.exec(end.result);assert.equal(+m[1],exp.best+1,JSON.stringify(A));assert.equal(+m[2],exp.menor);ciOk++;checks+=2;}
  assert.equal(end.M.length,n);assert(end.M.every(r=>r.length===n+1));
  if(i<80)verifySteps(steps,B.s5Render,['M']);
}
assert(ciOk>250&&ciNo>20,'cobertura de ciudad base: '+ciOk+' con base / '+ciNo+' sin');
{ const A=B.s5Parse('0 1 9 7 -1 / -1 0 5 -1 6 / 6 -1 0 9 -1 / -1 -1 -1 0 -1 / -1 5 -1 -1 0'),e=last(B.s5CiudadBase(A));
  assert(/ciudad base = 1 · costo total 21/.test(e.result),e.result);
  const R=B.floydPuro(5,A.map((r,i)=>r.map((v,j)=>i===j?0:(v===-1?Infinity:v))));assert.equal(R[0][2],6,'1→3 mejora de 9 a 6 pasando por la 2');checks+=2; }
{ const e=last(B.s5CiudadBase(B.s5Parse('0 1 -1 / 1 0 -1 / -1 -1 0')));assert.equal(e.rcls,'bad');checks++; }
{ const e=last(B.s5CiudadBase(B.s5Parse('0 3 3 / 3 0 3 / 3 3 0')));assert(/ciudad base = 1 · costo total 6/.test(e.result),'empate: queda la primera (el < es estricto)');checks++; }

/* ---------- entradas inválidas: se informan, no se reemplazan ---------- */
for(const bad of ['','1 2 / 3','1 2 3 4 5 / 1 2 3 4 5','1 x / 2 3','1 2 3 4 5 / 1 2 3 4 5 / 1 2 3 4 5 / 1 2 3 4 5 / 1 2 3 4 5','1000 2','1/2/3/4/5'])
  assert.throws(()=>B.s2Parse(bad),/Escribí|inválida/,'subasta inválida: '+bad);
for(const bad of ['','1 2 / 3','a b / c d','100 2 / 3 4','1 1 1 1 1 / 1 1 1 1 1 / 1 1 1 1 1 / 1 1 1 1 1 / 1 1 1 1 1'])assert.throws(()=>B.s4ParseMatriz(bad),/matriz|Esfuerzo/,'matriz inválida: '+bad);
for(const bad of ['','0,1','1,9','a,b','1;1','1'])assert.throws(()=>B.s4ParseCasilla(bad,3,3),/Casilla de partida/,'casilla inválida: '+bad);
for(const bad of ['','0','0 1 2 / 1 0 1','0 -1 / -1 0 0','0 x / 1 0','0 0 / 1 0','5 1 / 1 0','0 1 1 1 1 1 1 / 1 0 1 1 1 1 1'])assert.throws(()=>B.s5Parse(bad),/cuadrada|inválido|diagonal|positivos/,'matriz de tiempos inválida: '+JSON.stringify(bad));
inputs.v='1,2,3';same(B.sList('v','x',1,5),[1,2,3]);
for(const bad of ['','1,,2','-1,2','1,2,3,4,5,6','a','1.5','0,1']){inputs.v=bad;assert.throws(()=>B.sList('v','x',1,5),/x: /,'lista inválida: '+bad);}
assert.throws(()=>B.sSameLength([1],[1,2],'A','B'),/misma cantidad/);
checks+=8+5+5+5+1+7+1;
// un error de entrada se muestra, no rompe los renderers
for(const r of [B.sDpRender,B.s2Render,B.s4Render,B.s5Render])assert(/result bad/.test(r({error:'x < y'}))&&/x &lt; y/.test(r({error:'x < y'})));checks++;

/* ---------- los ejemplos por defecto y los presets escritos en el HTML ---------- */
const defaults={};for(const m of html.matchAll(/<input[^>]*\bid="(s[1-6]-[a-z]+)"[^>]*\bvalue="([^"]*)"/g))defaults[m[1]]=m[2];
assert.deepEqual(Object.keys(defaults).sort(),['s1-d','s1-s','s2-ofertas','s3-c','s3-p','s4-ini','s4-m','s4-x','s5-a','s6-c','s6-p','s6-r'],'los inputs de los seis simuladores');
const run={
  s1:()=>B.s1Almacenamiento(B.sList('s1-s','Tamaños',1,6),B.btInteger('s1-d','D',1,20)),
  s2:()=>B.s2Subasta(B.s2Parse(inputs['s2-ofertas'])),
  s3:()=>B.s3Catalogo(B.sList('s3-c','Puntos de cada premio',1,5),B.btInteger('s3-p','Puntos acumulados',1,25)),
  s4:()=>{const M=B.s4ParseMatriz(inputs['s4-m']),m=M.length,n=M[0].length;return B.s4Estaciones(M,B.s4ParseCasilla(inputs['s4-ini'],m,n),B.btInteger('s4-x','X',0,m*n-1));},
  s5:()=>B.s5CiudadBase(B.s5Parse(inputs['s5-a'])),
  s6:()=>{const r=B.sList('s6-r','Calificaciones',1,5),c=B.sList('s6-c','Costos',2,5);B.sSameLength(r,c,'Calificaciones','costos');return B.s6Festival(r,c,B.btInteger('s6-p','Presupuesto',1,20));}
};
const renders={s1:B.sDpRender,s2:B.s2Render,s3:B.sDpRender,s4:B.s4Render,s5:B.s5Render,s6:B.sDpRender};
const keysOf={s1:['M'],s2:['S','mejorS'],s3:['M'],s4:['path','best'],s5:['M'],s6:['M']};
const presets=[...html.matchAll(/data-s-sim="(s\d)" data-s-preset="([^"]*)"/g)].map(m=>({sim:m[1],values:JSON.parse(m[2].replace(/&quot;/g,'"'))}));
assert(presets.length>=18,'al menos tres presets por simulador: '+presets.length);
for(const sim of Object.keys(run))assert(presets.some(p=>p.sim===sim),'el simulador '+sim+' no tiene presets');
for(const p of presets){
  Object.assign(inputs,defaults);Object.keys(p.values).forEach(id=>{inputs[id]=String(p.values[id]);}); // como input.value = 2
  const steps=run[p.sim]();assert(steps.length>=1&&steps.length<=B.S2_MAX_STEPS);verifySteps(steps,renders[p.sim],keysOf[p.sim]);checks++;
}
Object.assign(inputs,defaults);
const expected={s1:null,s2:null,s3:null,s4:null,s5:null,s6:null};
for(const sim of Object.keys(run)){
  const steps=run[sim](),min=sim==='s2'?10:30; // el ejemplo del enunciado de la subasta es corto: la cota poda casi todo el árbol
  assert(steps.length>=min&&steps.length<=200,sim+': el ejemplo por defecto tiene '+steps.length+' pasos (presupuesto '+min+'–200)');
  verifySteps(steps,renders[sim],keysOf[sim]);expected[sim]=steps.length;checks+=2;
}
// resultados de los ejemplos por defecto
assert.equal(last(run.s1()).M[3][10],10);assert.equal(last(run.s3()).M[2][17],17);assert.equal(last(run.s6()).M[2][12],24);
assert.equal(last(run.s2()).mejor,13);assert(/ciudad base = 1/.test(last(run.s5()).result));assert.equal(last(run.s4()).rcls,'good');checks+=6;

/* El resaltado recorre el pseudocódigo: cada `line` existe como data-l del simulador y ninguna línea concentra más de la mitad de los pasos. */
for(const sim of Object.keys(run)){
  const block=html.slice(html.indexOf('id="sim-'+sim+'"')),code=block.slice(0,block.indexOf('data-viz'));
  const dataL=new Set([...code.matchAll(/data-l="(\d+)"/g)].map(m=>+m[1]));
  assert(dataL.size>5,'sim-'+sim+': no se encontró su pseudocódigo');
  const steps=run[sim](),count={};
  steps.forEach(s=>{if(s.line!==undefined){assert(dataL.has(s.line),'sim-'+sim+': la línea '+s.line+' no existe en el pseudocódigo');count[s.line]=(count[s.line]||0)+1;}});
  // En las búsquedas (s2, s4) el resaltado tiene que recorrer el pseudocódigo; en los simuladores de tabla y en el posproceso de s5
  // el ciclo interno es el algoritmo (N² sumas, una celda por paso) y es natural que concentre pasos.
  if(sim==='s2'||sim==='s4')for(const l of Object.keys(count))assert(count[l]<=steps.length/2,'sim-'+sim+': la línea '+l+' concentra '+count[l]+' de '+steps.length+' pasos');
  checks+=1+Object.keys(count).length;
}

/* Cada link «index.html#…» de la página de ejercicios existe como id en el apunte (validate.py no revisa links entre archivos). */
const apunte=fs.readFileSync(path.join(path.dirname(file),'index.html'),'utf8');
const ids=new Set([...apunte.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const rotos=[...new Set([...html.matchAll(/href="index\.html#([^"]+)"/g)].map(m=>m[1]))].filter(x=>!ids.has(x));
assert.deepEqual(rotos,[],'links a index.html que no resuelven: '+rotos.join(', '));checks++;
// y los ids de simulador del apunte que enlazan los bloques de práctica
for(const id of [...html.matchAll(/data-apunte-sim="([^"]+)"/g)].map(m=>m[1]))assert(ids.has(id),'falta '+id+' en el apunte');

console.log('integracion2: '+checks+' comprobaciones, '+rendered+' pasos renderizados · subasta '+subOk+' en el tope / '+subCap+' sobre · estaciones '+estOk+' con recorrido / '+estNo+' sin / '+estCap+' sobre · ciudad base '+ciOk+' con base / '+ciNo+' sin · pasos por defecto '+JSON.stringify(expected));
