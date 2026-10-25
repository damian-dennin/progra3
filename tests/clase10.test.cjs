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
assert(context.c10Queens(8,false).length<=200);
const examples=[[[5,3,2,6,1,4],6],[[13,20,7],20],[[5,-3],2],[[0,0,0],0],[[1,1,1],2],[[2,4],3],[[-2,-3],-5],[[6],6],[[0],0]];
let seed=1729;const rand=n=>{seed=(1664525*seed+1013904223)>>>0;return seed%n;};
for(let t=0;t<300;t++){const n=1+rand(6);examples.push([Array.from({length:n},()=>rand(13)-6),rand(21)-10]);}
for(const [A,target] of examples){
  const sum=context.c10Subsets(A,target,false),partition=context.c10Partition(A);
  assert.deepEqual(sort(last(sum).solutions),sort(subsetReference(A,target)));
  assert.deepEqual(sort(last(partition).solutions),sort(subsetReference(A,0,true)));
  checkSteps(sum);checkSteps(partition);checks+=2;
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
for(const value of ['',',','1,','1,,2','1.5','1e3','1,2,3,4,5,6,7','NaN','9007199254740992','9007199254740991,1']){inputs.v=value;assert.throws(()=>context.c10Vector('v',false));checks++;}
inputs.v=' 0, -3, +5 ';assert.deepEqual(plain(context.c10Vector('v',false)),[0,-3,5]);assert.throws(()=>context.c10Vector('v',true));
for(const value of ['','0','9','2.5','x']){inputs.n=value;assert.throws(()=>context.c10Integer('n','N',1,8));checks++;}
inputs.n='8';assert.equal(context.c10Integer('n','N',1,8),8);
assert(context.c10Guard(()=>{throw new Error('Entrada inválida');})[0].error);
console.log(`OK: ${checks} casos; ${rendered} pasos renderizados; modos literales, referencias exhaustivas, entradas y snapshots.`);
