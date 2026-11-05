// node tests/clase10.test.cjs
// Prueba los builders reales del HTML, sin dependencias ni navegador.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[2]||path.join(__dirname,'../apuntes interactivos/index.html'),'utf8');
const marker='/* ==================== CLASE 10: BACKTRACKING ==================== */';
assert(source.includes(marker),'Falta la clase 10');
const code=source.slice(source.indexOf(marker),source.indexOf('const c10QueenSim='));
const inputs={},context={document:{getElementById:id=>({value:inputs[id]})},esc:s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),cells:a=>JSON.stringify(a)};
vm.createContext(context);vm.runInContext(code,context);
const plain=x=>JSON.parse(JSON.stringify(x)),last=x=>x[x.length-1],sort=a=>plain(a).map(x=>JSON.stringify(x)).sort();
let checks=0,rendered=0;
function checkSteps(steps){
  assert(steps.length>0);for(const s of steps){const html=context.c10Render(s);assert(!/undefined|NaN/.test(html),html);rendered++;}
  for(let i=1;i<steps.length;i++){assert.notEqual(steps[i].arr,steps[i-1].arr);if(steps[i].solutions)assert.notEqual(steps[i].solutions,steps[i-1].solutions);}
}
function subsetReference(A,target,partition=false){
  const result=[];
  for(let mask=0;mask<2**A.length;mask++){
    const S=A.map((_,i)=>(mask>>i)&1),a=A.reduce((v,x,i)=>v+(S[i]?x:0),0);
    const b=partition?A.reduce((v,x)=>v+x,0)-a:target;
    if(a===b)result.push(partition?S.map(x=>x?1:2):S);
  }return result;
}
function processorReference(A,m){
  let best=Infinity,answer=null;
  // Enumeración de enteros en base m; orden lexicográfico igual al recorrido del simulador.
  for(let number=0;number<m**A.length;number++){
    let rest=number;const S=new Array(A.length),loads=new Array(m).fill(0);
    for(let i=A.length-1;i>=0;i--){S[i]=rest%m;rest=Math.floor(rest/m);loads[S[i]]+=A[i];}
    const cost=Math.max(...loads);if(cost<best){best=cost;answer=S;}
  }return {best,answer};
}
for(let n=1;n<=8;n++)for(const literal of [false,true]){
  const steps=context.c10Queens(n,literal),end=last(steps);checkSteps(steps);
  assert.equal(end.found,literal?false:![2,3].includes(n));
  if(end.found){const S=plain(end.answer);assert.equal(new Set(S).size,n);for(let i=0;i<n;i++)for(let j=0;j<i;j++)assert.notEqual(Math.abs(S[i]-S[j]),i-j);}
  checks++;
}
for(let n=1;n<=8;n++){ // versión didáctica: misma primera solución que el modo corregido de la lámina, sin omitir la columna 0
  const steps=context.c10QueensDid(n),end=last(steps);checkSteps(steps);
  assert.equal(end.found,![2,3].includes(n));
  if(end.found){const S=plain(end.answer);assert.equal(new Set(S).size,n);for(let i=0;i<n;i++)for(let j=0;j<i;j++)assert.notEqual(Math.abs(S[i]-S[j]),i-j);assert.deepEqual(S,plain(last(context.c10Queens(n,false)).answer));}
  checks++;
}
assert(context.c10Queens(8,false).length<=20000);
assert(context.c10QueensDid(8).length<=20000);
const examples=[[[5,3,2,6,1,4],6],[[13,20,7],20],[[5,-3],2],[[0,0,0],0],[[1,1,1],2],[[2,4],3],[[-2,-3],-5],[[6],6],[[0],0]];
let seed=1729;const rand=n=>{seed=(1664525*seed+1013904223)>>>0;return seed%n;};
for(let t=0;t<300;t++){const n=1+rand(6);examples.push([Array.from({length:n},()=>rand(13)-6),rand(21)-10]);}
for(const [A,target] of examples){
  const sum=context.c10Subsets(A,target,false),partition=context.c10Partition(A);
  assert.deepEqual(sort(last(sum).solutions),sort(subsetReference(A,target)));
  assert.deepEqual(sort(last(partition).solutions),sort(subsetReference(A,0,true)));
  const did=context.c10SubsetsDid(A,target);assert.deepEqual(sort(last(did).solutions),sort(subsetReference(A,target)));
  checkSteps(sum);checkSteps(partition);checkSteps(did);checks+=3;
}
assert.equal(last(context.c10Subsets([5,3,2,6,1,4],6,false)).solutions.length,4);
assert.equal(last(context.c10Subsets([5,3,2,6,1,4],6,true)).solutions.length,1);
assert.equal(last(context.c10Subsets([13,20,7],20,true)).solutions.length,1);
assert.equal(last(context.c10Partition([2,4,5,6,1])).solutions.length,2);
assert.equal(last(context.c10Partition([2,5,8,3,2])).solutions.length,4);
for(let t=0;t<200;t++){
  const A=Array.from({length:1+rand(6)},()=>rand(10)),m=1+rand(3),reference=processorReference(A,m),steps=context.c10Processors(A,m),end=last(steps);
  assert.equal(end.best,reference.best);assert.deepEqual(plain(end.bestAssignment),reference.answer);assert.deepEqual(plain(end.loads),new Array(m).fill(0));checkSteps(steps);checks++;
}
assert.equal(last(context.c10Processors([2,3,4,5],2)).best,7);

/* ---------- traza: cada línea del panel se ejecuta y la pila de llamadas es coherente ---------- */
const panel=id=>{const a=source.indexOf('id="'+id+'"'),b=source.indexOf('<div class="viz"',a);assert(a>=0&&b>a,'Falta el simulador '+id);
  return [...source.slice(a,b).matchAll(/class="cl( hdr)?" data-l="(\d+)"><span class="ln">\d+<\/span><span class="tx">([^<]*)/g)].map(m=>({hdr:!!m[1],l:+m[2],text:m[3].trim()}));};
const executable=({text,hdr})=>!hdr&&!/^(fin |sino$|\/\/)/i.test(text);
function checkTrace(id,steps,{cover=true,range=null}={}){
  const lines=panel(id).filter(x=>!range||range(x.l)),known=new Set(lines.map(x=>x.l));
  assert.equal(steps[0].cd,0,id+': el primer paso es la llamada inicial');assert.equal(last(steps).cd,0,id+': la pila termina vacía');
  const seen=new Set();
  steps.forEach((s,i)=>{
    if(s.line!==undefined){assert(known.has(s.line),id+': la línea '+s.line+' no existe en el panel');seen.add(s.line);}
    assert.equal(s.frames.length,s.cd,id+': cd = cantidad de marcos');
    if(i)assert(Math.abs(s.cd-steps[i-1].cd)<=1,id+': la profundidad cambia de a un marco ('+i+')');
    for(const f of s.frames)for(const [k,v] of Object.entries(f.vars))assert(v!==undefined&&!(typeof v==='number'&&Number.isNaN(v)),id+': variable '+k+' sin valor');
  });
  if(cover)for(const l of lines.filter(executable))assert(seen.has(l.l),id+': la línea '+l.l+' («'+l.text+'») nunca se ejecuta');
  checks++;
}
for(const n of [1,4,8])checkTrace('sim-c10-reinas',context.c10QueensDid(n),{cover:n>1,range:l=>l>=200});
checkTrace('sim-c10-reinas',context.c10Queens(4,true),{cover:false,range:l=>l<200});
assert.equal(context.c10Queens(1,false).length,context.c10Queens(1,false).filter(s=>s.cd>=0).length);
checkTrace('sim-c10-suma',context.c10SubsetsDid([5,3,2,6,1,4],6),{range:l=>l>=200});
checkTrace('sim-c10-suma',context.c10SubsetsDid([5,-3],2),{cover:false,range:l=>l>=200});
checkTrace('sim-c10-suma',context.c10Subsets([5,3,2,6,1,4],6,true),{cover:false,range:l=>l<200});
checkTrace('sim-c10-particion',context.c10Partition([2,4,5,6,1]));
checkTrace('sim-c10-procesadores',context.c10Processors([2,3,4,5],2));
// ReinaValida se recorre completa: en N = 4 hay un ataque por columna, uno por diagonal y llamadas que terminan sin ataque
{const steps=context.c10Queens(4,false),inside=steps.filter(s=>s.frames.some(f=>f.fn==='ReinaValida'));
 assert(inside.some(s=>s.line===23)&&inside.some(s=>s.line===26)&&inside.some(s=>s.line===22));
 assert(inside.every(s=>s.cd>=2),'ReinaValida siempre corre dentro de Reinas');
 const cond=inside.filter(s=>s.line===22);assert(cond.every(s=>/¿S\[i\] = S\[E\]\?/.test(s.msg)),'cada comparación muestra los valores');
 assert(steps.some(s=>s.frames.some(f=>f.vars['|S[i] − S[E]|']!==undefined)),'las variables locales de ReinaValida son visibles');}
{const steps=context.c10QueensDid(4),inside=steps.filter(s=>s.frames.some(f=>f.fn==='ReinaValida'));
 assert(inside.some(s=>s.line===224)&&inside.some(s=>s.line===225)&&inside.some(s=>s.line===228),'ReinaValida didáctica: segundo operando, ataque y éxito');
 assert(inside.every(s=>s.cd>=2),'ReinaValida siempre corre dentro de Reinas');
 assert(inside.filter(s=>s.line===223).every(s=>s.msg.startsWith('¿S[anterior] = columna?')),'el primer operando muestra los valores');
 assert(inside.filter(s=>s.line===224).every(s=>s.msg.startsWith('¿abs(S[anterior] − columna) = fila − anterior?')),'el segundo operando muestra los valores');
 // cortocircuito: tras un 223 verdadero viene el devolver falso (225), nunca el 224
 steps.forEach((s,i)=>{if(s.line===223&&(s.msg.split('→')[1]||'').includes('verdadero'))assert.equal(steps[i+1].line,225,'con O, si la columna coincide no se evalúa la diagonal');});
 // la candidata no está en S mientras se valida
 const during=steps.filter(s=>s.cand&&s.line===203&&s.cd===1&&/Todavía no toqué S/.test(s.msg));
 assert(during.every(s=>s.placed===s.stage),'la reina de la fila actual recién queda en el tablero después de validar');}
for(const value of ['',',','1,','1,,2','1.5','1e3','1,2,3,4,5,6,7','NaN','9007199254740992','9007199254740991,1']){inputs.v=value;assert.throws(()=>context.c10Vector('v',false));checks++;}
inputs.v=' 0, -3, +5 ';assert.deepEqual(plain(context.c10Vector('v',false)),[0,-3,5]);assert.throws(()=>context.c10Vector('v',true));
for(const value of ['','0','9','2.5','x']){inputs.n=value;assert.throws(()=>context.c10Integer('n','N',1,8));checks++;}
inputs.n='8';assert.equal(context.c10Integer('n','N',1,8),8);
assert(context.c10Guard(()=>{throw new Error('Entrada inválida');})[0].error);
console.log(`OK: ${checks} casos; ${rendered} pasos renderizados; modos literales, referencias exhaustivas, entradas y snapshots.`);
