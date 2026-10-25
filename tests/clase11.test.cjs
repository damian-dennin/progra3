// node tests/clase11.test.cjs — builders reales, referencias exhaustivas y cotas exactas.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../apuntes interactivos/index.html'),'utf8');
const source=process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):html;
const marker='/* ==================== CLASE 11: BACKTRACKING CON COTAS ==================== */';
assert(source.includes(marker),'Falta la clase 11');
const inputs={},context={document:{getElementById:id=>({value:inputs[id]})},esc:s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),cells:a=>JSON.stringify(a)};
vm.createContext(context);
vm.runInContext(html.slice(html.indexOf('/* ==================== CLASE 10:'),html.indexOf('const c10QueenSim=')),context);
vm.runInContext(source.slice(source.indexOf(marker),source.indexOf('/* ===== interfaz clase 11 ===== */')),context);
const plain=x=>JSON.parse(JSON.stringify(x)),last=a=>a[a.length-1];
let checks=0,rendered=0,seed=271828;
const rand=n=>{seed=(1664525*seed+1013904223)>>>0;return seed%n;};
function processorOracle(A,m){
  let best=Infinity;
  for(let code=0;code<m**A.length;code++){
    let rest=code;const loads=new Array(m).fill(0);
    for(const time of A){loads[rest%m]+=time;rest=Math.floor(rest/m);}
    best=Math.min(best,Math.max(...loads));
  }return best;
}
function knapsackOracle(V,W,C,stage=0){
  let best=0;
  for(let mask=0;mask<2**(V.length-stage);mask++){
    let weight=0,value=0;
    for(let i=stage;i<V.length;i++)if(mask&(1<<(i-stage))){weight+=W[i];value+=V[i];}
    if(weight<=C)best=Math.max(best,value);
  }return best;
}
function verifySteps(steps){
  assert(steps.length>0);
  const arrays=new Set(),answers=new Set();
  for(const s of steps){
    assert(!arrays.has(s.arr),'Estado compartido entre pasos');arrays.add(s.arr);
    if(s.bestAssignment){assert(!answers.has(s.bestAssignment));answers.add(s.bestAssignment);}
    const output=context.c11Render(s);assert(!/undefined|NaN/.test(output),output);rendered++;
    if(s.group)assert(s.group.length>=2);
  }
}
const taskCases=[[[8,7,6,5,4],2],[[0],1],[[0,0,0],3],[[5],3],[[2,2,2],2],[[1,2,3,4,5,6],3],[[6,5,4,3,2,1],3],[[Number.MAX_SAFE_INTEGER-1,1],2]];
for(let t=0;t<250;t++)taskCases.push([Array.from({length:1+rand(6)},()=>rand(16)),1+rand(3)]);
for(const [A,m] of taskCases){
  const expected=processorOracle(A,m),before=JSON.stringify(A),greedy=context.c11Greedy(A,m);
  const g=last(greedy);assert(g.best>=expected);verifySteps(greedy);
  assert.equal(g.best,Math.max(...g.loads));assert.equal(new Set(g.order).size,A.length);
  for(let p=0;p<m;p++)assert.equal(g.loads[p],A.reduce((sum,x,i)=>sum+(g.bestAssignment[i]===p?x:0),0));
  const both=[context.c11Processors(A,m,false),context.c11Processors(A,m,true)];
  for(const steps of both){
    const end=last(steps);assert.equal(end.best,expected);assert(end.bestAssignment.every(p=>Number.isInteger(p)&&p>=0&&p<m));
    assert.equal(Math.max(...Array.from({length:m},(_,p)=>A.reduce((sum,x,i)=>sum+(end.bestAssignment[i]===p?x:0),0))),expected);
    assert(end.loads.every(x=>x===0));assert(end.arr.every(x=>x===null));verifySteps(steps);checks++;
  }
  assert(last(both[1]).visited<=last(both[0]).visited);
  if(g.best===expected)assert.deepEqual(plain(last(both[1]).bestAssignment),plain(g.bestAssignment),'Debe conservar la solución inicial si no hay mejora');
  assert.equal(JSON.stringify(A),before);
}
assert.deepEqual(plain(last(context.c11Greedy([8,7,6,5,4],2)).loads),[17,13]);
assert.deepEqual(plain(last(context.c11Greedy([2,4,4,1],2)).order),[1,2,0,3]);
assert.deepEqual(plain(last(context.c11Processors([8,7,6,5,4],2,true)).bestAssignment),[0,0,1,1,1]);
const bagCases=[[[35,30,20,12],[5,3,2,1],7],[[1],[1],0],[[5],[2],1],[[5],[2],2],[[3,6],[1,2],3],[[5,5],[2,2],2],[[1000,999],[999,1000],1000],[[1,2,3,4,5,6],[1,1,1,1,1,1],6000]];
for(let t=0;t<300;t++){
  const n=1+rand(6);bagCases.push([Array.from({length:n},()=>1+rand(1000)),Array.from({length:n},()=>1+rand(1000)),rand(3500)]);
}
for(const [V,W,C] of bagCases){
  const expected=knapsackOracle(V,W,C),before=JSON.stringify([V,W]);
  const both=[context.c11Knapsack(V,W,C,false),context.c11Knapsack(V,W,C,true)];
  for(const steps of both){
    const end=last(steps);assert.equal(end.best,expected);assert(end.bestAssignment.every(x=>x===0||x===1));
    assert.equal(V.reduce((s,v,i)=>s+v*end.bestAssignment[i],0),expected);assert(end.bestWeight<=C);
    assert.equal(end.pruned,end.capacityPruned+end.boundPruned);assert(end.arr.every(x=>x===null));verifySteps(steps);
    for(const s of steps)if(s.bound){
      const b=s.bound,exact=s.value+knapsackOracle(V,W,C-s.weight,s.depth);
      assert(b.num>=exact*b.den,'La cota no puede subestimar el mejor valor posible');
      assert(b.parts.every(p=>p.id>=s.depth&&p.used>0&&p.used<=p.weight));
      assert.equal(new Set(b.parts.map(p=>p.id)).size,b.parts.length);
      assert(b.parts.filter(p=>p.used<p.weight).length<=1);
      assert.equal(b.baseValue,s.value);assert.equal(b.remaining,C-s.weight);
      assert.equal(b.parts.reduce((sum,p)=>sum+p.used,0),Math.min(C-s.weight,W.slice(s.depth).reduce((a,b)=>a+b,0)));
      if(s.event==='prune')assert(b.num<=s.best*b.den);
    }
    checks++;
  }
  assert(last(both[1]).visited<=last(both[0]).visited);assert.equal(JSON.stringify([V,W]),before);
}
const bound=context.c11Bound([35,30,20,12],[5,3,2,1],7,0,0,0);
assert.equal(bound.num/bound.den,69);
assert.deepEqual(plain(last(context.c11Knapsack([35,30,20,12],[5,3,2,1],7,true)).bestAssignment),[0,1,1,1]);
assert.equal(last(context.c11Knapsack([35,30,20,12],[5,3,2,1],7,true)).bestWeight,6);
// Entradas: no se reemplazan valores inválidos por ejemplos silenciosamente.
Object.assign(inputs,{'c11-mochila-valores':'35,30,20,12','c11-mochila-pesos':'5,3,2,1','c11-mochila-capacidad':'7'});
assert.equal(context.c11Objects().capacity,7);
for(const [id,value] of [['c11-mochila-valores',''],['c11-mochila-valores','1,,2'],['c11-mochila-valores','0,1,2,3'],['c11-mochila-valores','1001,1,2,3'],['c11-mochila-pesos','-1,1,2,3'],['c11-mochila-pesos','2,3'],['c11-mochila-pesos','1.5,1,2,3'],['c11-mochila-capacidad','6001'],['c11-mochila-capacidad','-1'],['c11-mochila-capacidad','']]){
  const before=inputs[id];inputs[id]=value;assert.throws(()=>context.c11Objects());inputs[id]=before;checks++;
}
const guarded=context.c10Guard(()=>{throw new Error('<entrada inválida>');});assert(context.c11Render(guarded[0]).includes('&lt;entrada inválida&gt;'));
const defaults=[context.c11Greedy([8,7,6,5,4],2),context.c11Processors([8,7,6,5,4],2,true),context.c11Knapsack([35,30,20,12],[5,3,2,1],7,true)];
assert(defaults.every(s=>s.length<=200));
console.log(`OK: ${checks} casos; ${rendered} pasos renderizados; cotas contrastadas con óptimos exhaustivos. Pasos por defecto: ${defaults.map(s=>s.length).join(' / ')}.`);
