/* ==================== CLASE 11: BACKTRACKING CON COTAS ==================== */
/* Búsquedas puras. La agrupación visual de podas no modifica el recorrido. */
function c11Record(steps,st){
  const previous=steps[steps.length-1];
  if(st.event==='prune' && previous && previous.event==='prune' && previous.line===st.line){
    st.group=(previous.group||[previous.msg]).concat(st.msg);
    st.msg='Podas consecutivas ('+st.group.length+'). Se muestra el estado de la última: <ul>'+st.group.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
    steps[steps.length-1]=st;
  }else steps.push(st);
}
function c11Order(A){return A.map((time,id)=>({time,id})).sort((a,b)=>b.time-a.time||a.id-b.id);}
function c11Greedy(A,m){
  const order=c11Order(A),loads=new Array(m).fill(0),S=new Array(A.length).fill(null),steps=[];
  const push=(line,msg,stage)=>steps.push({kind:'greedy',input:A.slice(),arr:S.slice(),loads:loads.slice(),order:order.map(x=>x.id),line,msg,stage});
  push(8,'Ordeno por duración decreciente conservando la identidad de cada tarea: '+order.map(x=>'T'+(x.id+1)+' ('+x.time+')').join(', ')+'. Los empates respetan el orden original.');
  push(10,'Inicializo las '+m+' cargas en 0. Una carga indica cuándo queda libre ese procesador.');
  for(const task of order){
    let p=0;
    for(let j=1;j<m;j++)if(loads[j]<loads[p])p=j;
    push(15,'Para T'+(task.id+1)+' = '+task.time+', comparo las cargas ['+loads.join(', ')+']. Elijo P'+(p+1)+', con carga mínima '+loads[p]+'. En empate gana el menor número.',task.id);
    const before=loads[p]; S[task.id]=p;loads[p]+=task.time;
    push(20,'Asigno T'+(task.id+1)+' a P'+(p+1)+': '+before+' + '+task.time+' = '+loads[p]+'. La tarea se ejecuta completa.',task.id);
  }
  push(22,'Devuelvo la asignación en el orden de entrada. Su tiempo es la mayor carga; es una solución factible, que todavía puede mejorar.');
  Object.assign(steps[steps.length-1],{best:Math.max(...loads),bestAssignment:S.slice(),result:'Tiempo Greedy = '+Math.max(...loads),rcls:'good'});
  return steps;
}
function c11Processors(A,m,seeded){
  const order=c11Order(A),loads=new Array(m).fill(0),S=new Array(A.length).fill(null),steps=[];
  const seed=seeded?c11Greedy(A,m).slice(-1)[0]:null;
  let best=seed?seed.best:Infinity,answer=seed?seed.bestAssignment.slice():null,visited=0,pruned=0;
  const push=(line,msg,stage,event)=>c11Record(steps,{kind:'processors',input:A.slice(),arr:S.slice(),loads:loads.slice(),order:order.map(x=>x.id),
    best,bestAssignment:answer?answer.slice():null,visited,pruned,lower:Math.max(...loads),line,msg,stage,event});
  push(1,seeded?'Guardo la solución Greedy completa: mejorTiempo = '+best+'. Esta cota superior inicial ya tiene una asignación factible que la respalda.':'Inicio sin solución conocida: mejorTiempo = ∞. La primera asignación completa establecerá la cota superior.');
  function visit(e,description,stage){
    visited++;
    const lower=Math.max(...loads);
    if(lower>=best){
      pruned++;
      push(5,description+' Cota inferior = máx('+loads.join(', ')+') = '+lower+' ≥ '+best+'. Las duraciones no negativas no pueden reducirla: podo.',stage,'prune');
      return;
    }
    if(e===order.length){
      const old=best;best=lower;answer=S.slice();
      push(7,description+' Asignación completa: '+best+' < '+(old===Infinity?'∞':old)+'. Guardo una copia de S y actualizo la cota superior.',stage,'improve');
      return;
    }
    push(9,description+' La cota inferior '+lower+' es menor que '+(best===Infinity?'∞':best)+'. Pruebo T'+(order[e].id+1)+' en cada procesador.',stage,'expand');
    const task=order[e];
    for(let p=0;p<m;p++){
      S[task.id]=p;loads[p]+=task.time;
      visit(e+1,'T'+(task.id+1)+' ('+task.time+') → P'+(p+1)+'.',task.id);
      loads[p]-=task.time;S[task.id]=null;
    }
  }
  visit(0,'Raíz: todavía no asigné tareas.');
  push(14,'Finalizó la búsqueda. Al volver se restauraron las cargas y las decisiones; la mejor asignación se conserva aparte. Podar la igualdad es válido porque buscamos una solución óptima, no todas.');
  Object.assign(steps[steps.length-1],{result:'Tiempo mínimo = '+best,rcls:'good'});
  return steps;
}
/* La única fracción es la del último objeto. Num/den permite comparar exactamente
   con el mejor entero; con n ≤ 6 y valores/pesos ≤ 1000 los productos son seguros. */
function c11Bound(V,W,capacity,stage,weight,value,densityOrder){
  const order=densityOrder||V.map((_,i)=>i).sort((a,b)=>V[b]*W[a]-V[a]*W[b]||a-b);
  let remaining=capacity-weight,whole=value,num=value,den=1;
  const parts=[];
  for(const i of order){
    if(i<stage || remaining<=0)continue;
    const used=Math.min(remaining,W[i]);parts.push({id:i,used,weight:W[i],value:V[i]});
    if(used===W[i]){whole+=V[i];num=whole;remaining-=used;}
    else{den=W[i];num=whole*den+used*V[i];remaining=0;break;}
  }
  return {num,den,parts,remaining:capacity-weight,baseValue:value};
}
function c11Knapsack(V,W,capacity,bounded){
  const S=new Array(V.length).fill(null),steps=[],order=V.map((_,i)=>i).sort((a,b)=>V[b]*W[a]-V[a]*W[b]||a-b);
  let best=0,answer=new Array(V.length).fill(0),visited=0,pruned=0,capacityPruned=0,boundPruned=0;
  const push=(line,msg,e,weight,value,bound,event)=>c11Record(steps,{kind:'knapsack',input:V.slice(),weights:W.slice(),arr:S.slice(),capacity,
    best,bestAssignment:answer.slice(),visited,pruned,capacityPruned,boundPruned,stage:e<V.length?e:undefined,depth:e,weight,value,
    bound:bound?{...bound,parts:bound.parts.map(x=>({...x}))}:null,line,msg,event});
  push(1,'La mochila vacía es factible: mejorValor = 0 y mejorS = [0, …, 0]. '+(bounded?'Preparo el orden valor/peso para calcular cotas; las decisiones conservan el orden original.':'Solo usaré la poda por capacidad; también guardo una sola solución óptima.'),0,0,0,null);
  function visit(e,weight,value,description){
    visited++;
    if(weight>capacity){
      pruned++;capacityPruned++;
      push(3,description+' Peso '+weight+' > '+capacity+': rama no factible. Los pesos positivos impiden recuperar capacidad.',e,weight,value,null,'prune');return;
    }
    if(e===V.length || weight===capacity){
      const improves=value>best;
      if(improves){best=value;answer=S.map(x=>x===null?0:x);}
      push(5,description+' '+(weight===capacity?'Capacidad exacta: los objetos pendientes quedan excluidos.':'Ya decidí sobre todos los objetos.')+' Valor '+value+(improves?' mejora la solución: copio S completando con ceros.':' no mejora '+best+': conservo la anterior.'),e,weight,value,null,improves?'improve':'leaf');return;
    }
    const bound=bounded?c11Bound(V,W,capacity,e,weight,value,order):null;
    if(bound && bound.num<=best*bound.den){
      pruned++;boundPruned++;
      push(8,description+' Cota superior '+c11Fraction(bound.num,bound.den)+' ≤ mejorValor '+best+'. Incluso fraccionando lo pendiente no puedo mejorar: podo.',e,weight,value,bound,'prune');return;
    }
    push(bounded?7:10,description+' Peso '+weight+'/'+capacity+', valor '+value+'. '+(bound?'Cota superior '+c11Fraction(bound.num,bound.den)+' > '+best+': todavía puede mejorar. ':'')+'Pruebo excluir (0) e incluir (1) O'+(e+1)+'.',e,weight,value,bound,'expand');
    for(let choice=0;choice<=1;choice++){
      S[e]=choice;
      visit(e+1,weight+choice*W[e],value+choice*V[e],(choice?'Incluyo':'Excluyo')+' O'+(e+1)+'.');
      S[e]=null;
    }
  }
  visit(0,0,0,'Raíz.');
  push(14,'Terminé todas las ramas capaces de mejorar. Las fracciones solo se usaron para estimar: la solución guardada contiene objetos enteros.',V.length,0,0,null);
  const bestWeight=W.reduce((sum,w,i)=>sum+w*answer[i],0);
  Object.assign(steps[steps.length-1],{bestWeight,result:'Valor máximo = '+best+' · peso = '+bestWeight,rcls:'good'});
  return steps;
}
function c11Fraction(num,den){return num%den===0?String(num/den):num+'/'+den+' ≈ '+(num/den).toLocaleString('es-AR',{maximumFractionDigits:3});}
function c11Comparison(steps,other,labels){
  const last=steps[steps.length-1],alternative=other[other.length-1];
  last.comparison=[{label:labels[0],best:last.best,visited:last.visited,pruned:last.pruned},{label:labels[1],best:alternative.best,visited:alternative.visited,pruned:alternative.pruned}];
  return steps;
}
function c11Render(st){
  if(st.error)return '<div class="result bad" role="alert">'+esc(st.error)+'</div>';
  const knapsack=st.kind==='knapsack',marks={};if(st.stage!==undefined)marks[st.stage]={cls:'act',p:knapsack?'siguiente':'tarea'};
  let out='<div><div class="vlabel">'+(knapsack?'Valores de O1…On':'Duraciones de T1…Tn · orden original')+'</div>'+cells(st.input,{},1)+'</div>';
  if(knapsack)out+='<div><div class="vlabel">Pesos de O1…On</div>'+cells(st.weights,{},1)+'</div>';
  else out+='<div class="vlabel">Orden de búsqueda: '+st.order.map(i=>'T'+(i+1)).join(' → ')+'</div>';
  out+='<div><div class="vlabel">S: '+(knapsack?'0 = excluir · 1 = incluir':'procesador desde 1')+' · «·» = pendiente</div>'+cells(knapsack?st.arr:st.arr.map(x=>x===null?null:x+1),marks,1)+'</div>';
  if(knapsack){
    out+='<div class="vars"><span>Peso actual: '+st.weight+'/'+st.capacity+'</span><span>Valor actual: '+st.value+'</span></div>';
    if(st.bound){
      const b=st.bound;
      out+='<div class="setbox"><span class="k">Cota superior fraccionaria: '+c11Fraction(b.num,b.den)+'</span><div>Valor acumulado '+b.baseValue+'; capacidad restante '+b.remaining+'. Solo objetos pendientes:</div>';
      out+='<ul>'+b.parts.map(x=>'<li>O'+(x.id+1)+': '+x.used+'/'+x.weight+' del objeto → valor '+c11Fraction(x.used*x.value,x.weight)+'</li>').join('')+'</ul>';
      if(!b.parts.length)out+='<div>No quedan objetos aprovechables.</div>';
      out+='<div>Comparación exacta: '+b.num+' '+(b.num<=st.best*b.den?'≤':'>')+' '+st.best+' × '+b.den+'.</div></div>';
    }
  }else{
    out+='<div class="c10-loads">';
    st.loads.forEach((load,p)=>{out+='<div class="setbox"><span class="k">P'+(p+1)+' · carga actual '+load+'</span><div class="c10-load"><i style="width:'+(100*load/Math.max(1,...st.loads))+'%"></i></div>'+c10Items(st.input,st.arr,p,1)+'</div>';});out+='</div>';
    if(st.lower!==undefined)out+='<div class="vars"><span>Cota inferior de esta rama: '+st.lower+'</span></div>';
  }
  if(st.best!==undefined){
    out+='<div class="setbox"><span class="k">'+(knapsack?'Mejor valor factible: ':'Mejor tiempo factible (cota superior): ')+(st.best===Infinity?'∞':st.best)+'</span>';
    if(st.bestAssignment){
      if(knapsack)out+='<div>Objetos: '+(st.bestAssignment.map((x,i)=>x?'O'+(i+1):null).filter(Boolean).join(', ')||'ninguno')+'</div><div>S = ['+st.bestAssignment.join(', ')+'] · peso '+st.weights.reduce((s,w,i)=>s+w*st.bestAssignment[i],0)+'</div>';
      else for(let p=0;p<st.loads.length;p++)out+='<div>P'+(p+1)+': '+c10Items(st.input,st.bestAssignment,p,1)+' · carga '+st.input.reduce((sum,x,i)=>sum+(st.bestAssignment[i]===p?x:0),0)+'</div>';
    }else out+='Todavía no hay una asignación completa.';out+='</div>';
  }
  if(st.visited!==undefined)out+='<div class="vars"><span>Nodos evaluados: '+st.visited+'</span><span>Nodos podados: '+st.pruned+'</span>'+(knapsack?'<span>Por capacidad: '+st.capacityPruned+'</span><span>Por cota: '+st.boundPruned+'</span>':'')+'</div>';
  if(st.comparison)out+='<div class="setbox"><span class="k">Misma entrada y orden de alternativas</span><div class="dpwrap"><table><tr><th>Modo</th><th>Óptimo</th><th>Nodos</th><th>Podados</th></tr>'+st.comparison.map(c=>'<tr><td>'+esc(c.label)+'</td><td>'+c.best+'</td><td>'+c.visited+'</td><td>'+c.pruned+'</td></tr>').join('')+'</table></div><small>Se cuenta la raíz y cada nodo evaluado, incluso los podados; los descendientes descartados no se visitan. Un paso puede agrupar varias podas.</small></div>';
  if(st.result)out+='<div class="result '+st.rcls+'">'+esc(st.result)+'</div>';
  return out;
}
function c11Objects(){
  const V=c10Vector('c11-mochila-valores',true),W=c10Vector('c11-mochila-pesos',true);
  if(V.length!==W.length)throw new Error('Ingresá la misma cantidad de valores y pesos: una pareja por objeto.');
  if(V.concat(W).some(x=>x<1||x>1000))throw new Error('Cada peso y valor debe ser un entero entre 1 y 1000.');
  return {V,W,capacity:c10Integer('c11-mochila-capacidad','Capacidad',0,6000)};
}
/* ===== interfaz clase 11 ===== */
const c11GreedySim=Sim("sim-c11-greedy",()=>c10Guard(()=>c11Greedy(c10Vector('c11-greedy-tareas',true),c10Integer('c11-greedy-m','Procesadores',1,3))),c11Render);
const c11ProcessorSim=Sim("sim-c11-procesadores",()=>c10Guard(()=>{
  const A=c10Vector('c11-procesadores-tareas',true),m=c10Integer('c11-procesadores-m','Procesadores',1,3),seeded=document.getElementById('c11-procesadores-modo').value==='greedy';
  return c11Comparison(c11Processors(A,m,seeded),c11Processors(A,m,!seeded),seeded?['Con cota inicial Greedy','Sin cota inicial']:['Sin cota inicial','Con cota inicial Greedy']);
}),c11Render);
const c11KnapsackSim=Sim("sim-c11-mochila",()=>c10Guard(()=>{
  const {V,W,capacity}=c11Objects(),bounded=document.getElementById('c11-mochila-modo').value==='cota';
  return c11Comparison(c11Knapsack(V,W,capacity,bounded),c11Knapsack(V,W,capacity,!bounded),bounded?['Capacidad + cota superior','Solo capacidad']:['Solo capacidad','Capacidad + cota superior']);
}),c11Render);
document.querySelectorAll('[data-c11-preset]').forEach(button=>button.addEventListener('click',()=>{
  const values=JSON.parse(button.dataset.c11Preset);
  Object.keys(values).forEach(id=>document.getElementById(id).value=values[id]);
  ({greedy:c11GreedySim,procesadores:c11ProcessorSim,mochila:c11KnapsackSim})[button.dataset.c11Sim].reload();
}));
document.getElementById('c11-procesadores-modo').addEventListener('change',()=>c11ProcessorSim.reload());
document.getElementById('c11-mochila-modo').addEventListener('change',()=>c11KnapsackSim.reload());

const QUESTIONS_C11=[
{q:'En minimización, ¿cuándo permite podar una cota inferior L si ya tengo una solución de costo B?',o:['Cuando L < B','Cuando L ≥ B, si busco una sola solución óptima','Siempre que L sea positiva','Solo cuando no exista una solución completa'],c:1,f:'Ninguna continuación cuesta menos que L. Si L ≥ B, no puede mejorar la solución factible guardada. La igualdad se conserva si el objetivo es enumerar todos los óptimos.'},
{q:'¿Qué aporta Greedy al problema de procesadores?',o:['Una solución factible y una cota superior inicial del tiempo óptimo','Una prueba de que su resultado es óptimo','Una cota inferior de todas las ramas','Una asignación fraccionaria de tareas'],c:0,f:'Si Greedy termina en 17, ya existe una solución con ese tiempo: el óptimo es ≤ 17. Backtracking puede encontrar 15 y actualizar esa cota.'},
{q:'Con {8,7,6,5,4} y dos procesadores, ¿qué da el Greedy de la lámina?',o:['15 y 15','20 y 10','17 y 13','16 y 14'],c:2,f:'En orden decreciente: 8→P1, 7→P2, 6→P2, 5→P1 y 4→P1 (empate en 13). Queda {8,5,4} frente a {7,6}; el tiempo es 17.'},
{q:'¿Por qué la mayor carga parcial es una cota inferior válida?',o:['Porque Greedy siempre acierta','Porque todos los procesadores tienen igual carga','Porque las tareas se pueden fraccionar','Porque agregar duraciones no negativas nunca reduce las cargas actuales'],c:3,f:'Toda continuación conserva las tareas ya asignadas. Si una carga ya es 20, ninguna extensión puede terminar antes de 20. Con duraciones negativas esta justificación fallaría.'},
{q:'¿Por qué la mochila fraccionaria sirve como cota superior de la mochila 0/1?',o:['Porque permite más soluciones, incluidas todas las soluciones 0/1','Porque obliga a llenar exactamente la mochila','Porque siempre devuelve objetos enteros','Porque usa menos objetos'],c:0,f:'Permitir fracciones relaja la restricción 0/1. El máximo del problema ampliado no puede ser menor que el de las soluciones enteras; puede ser inalcanzable en el problema original.'},
{q:'En una rama de Mochila, ¿qué objetos entran en el cálculo fraccionario?',o:['Todos, incluso los ya excluidos','Solo el objeto de mayor valor absoluto','Los pendientes, agregando su aporte al valor ya acumulado','Solo los objetos seleccionados'],c:2,f:'Las decisiones del prefijo ya están fijadas. La capacidad restante es P − pesoActual. Reintroducir objetos excluidos confunde la rama; contar incluidos de nuevo duplica su aporte.'},
{q:'Si la cota superior es 58 y ya guardé valor 62, ¿qué hago?',o:['Actualizo el mejor a 58','Podo: ninguna continuación de esa rama mejora 62','Continúo porque 58 es positivo','Borro la solución anterior'],c:1,f:'Incluso con la ventaja de fraccionar solo se llegaría a 58. Las continuaciones 0/1 valen a lo sumo eso; la mejor solución factible 62 se conserva.'},
{q:'Para valores {35,30,20,12}, pesos {5,3,2,1} y capacidad 7, ¿cuál es el óptimo 0/1?',o:['69, peso 7','67, peso 8','55, peso 7','62, peso 6'],c:3,f:'O2 + O3 + O4 suman valor 62 y peso 6. No hace falta ocupar toda la capacidad. La cota fraccionaria 69 usa además 1/5 de O1 y no es una solución 0/1.'},
{q:'¿Qué debe guardarse junto con la cota inicial Greedy?',o:['Solo la duración de la primera tarea','La asignación completa que alcanza esa cota','Todas las ramas descartadas','El número de pasos de la animación'],c:1,f:'Si Greedy ya es óptimo, la búsqueda puede podar todas las ramas sin hallar una mejora estricta. Debe conservarse una solución concreta, no solamente su costo.'},
{q:'¿Qué efecto tienen las cotas sobre la complejidad de peor caso?',o:['Garantizan tiempo lineal','Eliminan la necesidad de analizar el árbol','Pueden reducir el recorrido, pero no garantizan eliminar el peor caso exponencial','Convierten Backtracking en Programación Dinámica'],c:2,f:'La poda depende de los datos y de la calidad de la cota. Hay que contar también el costo de calcularla y de copiar soluciones; menos nodos no implica por sí solo menor tiempo total.'}
];
(function(){
  const box=document.getElementById("quizbox-c11"),score=document.getElementById("quiz-score-c11");
  box.innerHTML=QUESTIONS_C11.map((q,i)=>'<div class="q" data-q="'+i+'"><p class="qt">'+(i+1)+'. '+q.q+'</p>'+q.o.map((o,j)=>'<label><input type="radio" name="c11q'+i+'" value="'+j+'">'+o+'</label>').join('')+'<div class="fb">'+q.f+'</div></div>').join('');
  document.getElementById("quiz-check-c11").addEventListener('click',()=>{
    let ok=0,answered=0;
    QUESTIONS_C11.forEach((q,i)=>{
      const card=box.querySelector('[data-q="'+i+'"]'),selected=card.querySelector('input:checked');
      card.querySelectorAll('label').forEach(l=>l.classList.remove('right','wrong'));
      card.querySelector('.fb').classList.add('show');card.querySelectorAll('label')[q.c].classList.add('right');
      if(selected){answered++;if(+selected.value===q.c)ok++;else selected.closest('label').classList.add('wrong');}
    });score.textContent=ok+' de 10 correctas'+(answered<10?' ('+(10-answered)+' sin responder)':'');
  });
  document.getElementById("quiz-reset-c11").addEventListener('click',()=>{
    box.querySelectorAll('input').forEach(x=>x.checked=false);box.querySelectorAll('label').forEach(l=>l.classList.remove('right','wrong'));
    box.querySelectorAll('.fb').forEach(f=>f.classList.remove('show'));score.textContent='';
  });
})();
