// Smoke test en Chrome/Chromium real, usando CDP y WebSocket de Node 22+.
// CHROME_PATH permite elegir el ejecutable. Las capturas se guardan en una carpeta temporal.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url'),assert=require('node:assert/strict');
const chrome=process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const output=fs.mkdtempSync(path.join(os.tmpdir(),'prog3-clase10-browser-'));
const profile=path.join(output,'profile'),url=pathToFileURL(path.resolve(__dirname,'../apuntes interactivos/index.html')).href;
const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
let stderr='',socket,sequence=0;const pending=new Map(),errors=[];
child.stderr.on('data',x=>stderr+=x);child.on('error',e=>stderr+=e.message);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function call(method,params={}){
  return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function waitFor(expression){for(let t=0;t<100;t++){if(await evaluate(expression))return;await sleep(100);}throw new Error('Timeout: '+expression);}
async function finish(id){return evaluate(`(()=>{const root=document.getElementById(${JSON.stringify(id)}),next=root.querySelector('[data-a="next"]');let steps=0;while(!next.disabled&&steps<70000){next.click();steps++;}if(!next.disabled)throw Error('No terminó');return {steps,result:root.querySelector('[data-viz]').innerText,count:root.querySelector('.count').textContent};})()`);}
async function capture(id,name){await evaluate(`document.getElementById(${JSON.stringify(id)}).scrollIntoView({block:'start',behavior:'instant'})`);await sleep(150);const r=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));}
(async()=>{
  try{
    const active=path.join(profile,'DevToolsActivePort');
    for(let i=0;i<100&&!fs.existsSync(active);i++){if(child.exitCode!==null)throw new Error('Chrome cerró: '+stderr);await sleep(100);}
    if(!fs.existsSync(active))throw new Error('Chrome no inició: '+stderr);
    const port=fs.readFileSync(active,'utf8').split(/\r?\n/)[0];
    const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
    socket=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
    socket.addEventListener('message',e=>{
      const message=JSON.parse(e.data);
      if(message.id){const p=pending.get(message.id);if(!p)return;pending.delete(message.id);if(message.error)p.reject(new Error(JSON.stringify(message.error)));else p.resolve(message.result);}
      else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);
    });
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    await call('Page.enable');await call('Runtime.enable');
    await call('Emulation.setDeviceMetricsOverride',{width:1500,height:1000,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url});
    await waitFor(`document.readyState==='complete' && !!document.querySelector('#quizbox-c10 .q')`);
    assert.equal(await evaluate(`document.querySelectorAll('.c10-sim [data-controls] .count').length`),4);
    assert.equal(await evaluate(`document.querySelectorAll('#quizbox-c10 .q').length`),10);
    assert.equal(await evaluate(`document.querySelectorAll('.classbar').length`),12);
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('a[href^="#"]')).filter(a=>!document.getElementById(a.hash.slice(1))).length`),0);
    // Recorrer todos los pasos reales prueba el renderer con helpers del documento y el resaltado.
    const expected={reinas:'Solución: [0, 4, 7, 5, 2, 6, 1, 3]',suma:'4 soluciones',particion:'2 asignaciones',procesadores:'Tiempo mínimo = 7'};
    const totals={};
    for(const [name,text] of Object.entries(expected)){
      const id='sim-c10-'+name,r=await finish(id);assert(r.result.includes(text),r.result);assert(!/undefined|NaN/.test(r.result));totals[name]=r.count;
      await capture(id,'desktop-'+name);
      await evaluate(`document.querySelector('#${id} [data-a="first"]').click()`);
      assert((await evaluate(`document.querySelector('#${id} .count').textContent`)).startsWith('1/'));
      await evaluate(`document.querySelector('#${id} [data-a="next"]').click()`);
      assert.equal(await evaluate(`document.querySelectorAll('#${id} .cl.on').length`),1);
      await evaluate(`document.querySelector('#${id} [data-a="prev"]').click()`);
      assert((await evaluate(`document.querySelector('#${id} .count').textContent`)).startsWith('1/'));
    }
    await evaluate(`document.querySelector('#sim-c10-reinas [data-a="play"]').click()`);await sleep(1000);
    await evaluate(`document.querySelector('#sim-c10-reinas [data-a="play"]').click()`);
    assert(!(await evaluate(`document.querySelector('#sim-c10-reinas .count').textContent`)).startsWith('1/'));
    // Traza: botones de salto, ir al final, velocidad y clic en la barra. Todo se prueba sobre Reinas con N = 4.
    {
      const R='#sim-c10-reinas',click=sel=>evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`);
      const onLine=()=>evaluate(`(document.querySelector('${R} .cl.on')||{dataset:{}}).dataset.l`),explain=()=>evaluate(`document.querySelector('${R} [data-explain]').innerText`);
      const count=()=>evaluate(`document.querySelector('${R} .count').textContent`);
      await evaluate(`document.getElementById('c10-reinas-n').value='4';document.querySelector('${R} [data-reload]').click()`);
      for(const a of ['over','out','last'])assert.equal(await evaluate(`document.querySelector('${R} [data-a="${a}"]').hidden`),false,'botón '+a);
      assert.equal(await evaluate(`document.querySelector('${R} [data-speed]').hidden`),false);
      // «Saltar llamada» desde la línea que llama a ReinaValida cae en la línea 203 con el resultado, sin pasar por la 221–229
      for(let i=0;i<80&&!(await explain()).includes('llamo a ReinaValida');i++)await click(`${R} [data-a="next"]`);
      assert.equal(await onLine(),'203');assert((await explain()).includes('llamo a ReinaValida'));
      const antes=+(await count()).split('/')[0];
      await click(`${R} [data-a="over"]`);
      assert.equal(await onLine(),'203');assert((await explain()).includes('ReinaValida devolvió'),await explain());
      assert(+(await count()).split('/')[0]>antes+2,'saltó por encima de los pasos de ReinaValida');
      // «Salir de la función» desde adentro de ReinaValida vuelve a la línea 203
      await evaluate(`document.querySelector('${R} [data-a="first"]').click()`);
      for(let i=0;i<200&&!(await explain()).includes('Entro a ReinaValida');i++)await click(`${R} [data-a="next"]`);
      assert.equal(await onLine(),'221');assert((await evaluate(`document.querySelector('${R} .traza').innerText`)).includes('ReinaValida'));
      // pila y variables visibles, con lo que cambió resaltado: el marco recién creado aparece con sus variables marcadas
      assert(await evaluate(`document.querySelectorAll('${R} .traza .frame').length===2 && document.querySelectorAll('${R} .traza .tv.chg').length>=1`));
      await click(`${R} [data-a="out"]`);
      assert.equal(await onLine(),'203');assert((await explain()).includes('ReinaValida devolvió'));
      // clic en la barra salta a esa parte; «Ir al final» termina la ejecución
      await evaluate(`(()=>{const b=document.querySelector('${R} .bar'),r=b.getBoundingClientRect();b.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+r.width*0.5,clientY:r.top+2}));})()`);
      const mitad=(await count()).split('/').map(Number);assert(mitad[0]>mitad[1]*0.4&&mitad[0]<mitad[1]*0.6,'la barra salta a la mitad: '+mitad);
      await click(`${R} [data-a="last"]`);const fin=(await count()).split('/');assert.equal(fin[0],fin[1]);
      assert((await evaluate(`document.querySelector('${R} [data-viz]').innerText`)).includes('Solución'));
      await evaluate(`document.getElementById('c10-reinas-n').value='8';document.querySelector('${R} [data-reload]').click()`);
    }
    // Selector literal, presets, mensajes de error y recuperación.
    await evaluate(`document.getElementById('c10-suma-modo').value='literal';document.getElementById('c10-suma-modo').dispatchEvent(new Event('change'))`);
    assert((await finish('sim-c10-suma')).result.includes('1 solución'));
    await evaluate(`document.getElementById('c10-suma-arr').value='1,,2';document.querySelector('#sim-c10-suma [data-reload]').click()`);
    assert(await evaluate(`!!document.querySelector('#sim-c10-suma [role="alert"]')`));
    await evaluate(`document.getElementById('c10-suma-modo').value='didactico';document.querySelector('#sim-c10-suma [data-c10-preset]').click()`);
    assert((await finish('sim-c10-suma')).result.includes('4 soluciones'));
    await evaluate(`document.getElementById('c10-reinas-n').value='1';document.getElementById('c10-reinas-modo').value='literal';document.getElementById('c10-reinas-modo').dispatchEvent(new Event('change'))`);
    assert((await finish('sim-c10-reinas')).result.includes('Sin solución en el modo literal'));
    await evaluate(`document.getElementById('c10-reinas-modo').value='didactico';document.getElementById('c10-reinas-n').value='8';document.querySelector('#sim-c10-reinas [data-reload]').click()`);
    // Cuestionario: sin respuestas, todas correctas y restablecimiento.
    await evaluate(`document.getElementById('quiz-check-c10').click()`);
    assert.equal(await evaluate(`document.getElementById('quiz-score-c10').textContent`),'0 de 10 correctas (10 sin responder)');
    await evaluate(`QUESTIONS_C10.forEach((q,i)=>document.querySelector('input[name="c10q'+i+'"][value="'+q.c+'"]').click());document.getElementById('quiz-check-c10').click()`);
    assert.equal(await evaluate(`document.getElementById('quiz-score-c10').textContent`),'10 de 10 correctas');
    await evaluate(`document.getElementById('quiz-reset-c10').click()`);
    assert.equal(await evaluate(`document.querySelectorAll('#quizbox-c10 input:checked,#quizbox-c10 .fb.show,#quizbox-c10 .right').length`),0);
    await capture('quiz-c10','desktop-quiz');
    // Clase 12: laberinto y asignación de tareas, de punta a punta en el navegador.
    {
      assert.equal(await evaluate(`document.querySelectorAll('.c12-sim [data-controls] .count').length`),2);
      assert.equal(await evaluate(`document.querySelectorAll('#quizbox-c12 .q').length`),10);
      const lab=await finish('sim-c12-laberinto');assert(lab.result.includes('mejorSuma = 18'),lab.result);assert(!/undefined|NaN/.test(lab.result));assert.equal(lab.steps,302,'303 pasos en total');
      await capture('sim-c12-laberinto','desktop-c12-laberinto');
      assert.equal(await evaluate(`document.querySelector('#sim-c12-laberinto [data-a="over"]').hidden`),false);
      await evaluate(`document.querySelectorAll('#sim-c12-laberinto [data-c12-preset]')[1].click()`);
      assert((await finish('sim-c12-laberinto')).result.includes('mejorSuma = 20'),'destino (2,4)');
      await evaluate(`document.querySelectorAll('#sim-c12-laberinto [data-c12-preset]')[4].click()`);
      assert((await finish('sim-c12-laberinto')).result.includes('No existe un camino'),'sin camino');
      await evaluate(`document.getElementById('c12-lab-mapa').value='1^';document.querySelector('#sim-c12-laberinto [data-reload]').click()`);
      assert(await evaluate(`!!document.querySelector('#sim-c12-laberinto [role="alert"]')`),'un booleano que apunta afuera se informa');
      await evaluate(`document.querySelectorAll('#sim-c12-laberinto [data-c12-preset]')[0].click()`);
      const asig=await finish('sim-c12-asignacion');assert(asig.result.includes('lim = 61')&&asig.result.includes('tarea 1 → a'),asig.result);assert(!/undefined|NaN/.test(asig.result));assert.equal(asig.steps,587);
      await capture('sim-c12-asignacion','desktop-c12-asignacion');
      assert.equal(await evaluate(`document.querySelector('#sim-c12-asignacion [data-l="99"]').hidden`),true,'la corrección propia está oculta en modo literal');
      await evaluate(`document.querySelectorAll('#sim-c12-asignacion [data-c12-preset]')[1].click()`);
      assert((await finish('sim-c12-asignacion')).result.includes('quedó sin asignar'),'el hueco de la lámina');
      await evaluate(`document.getElementById('c12-asig-modo').value='corregido';document.getElementById('c12-asig-modo').dispatchEvent(new Event('change'))`);
      assert.equal(await evaluate(`document.querySelector('#sim-c12-asignacion [data-l="99"]').hidden`),false,'la corrección propia aparece en modo corregido');
      const cor=await finish('sim-c12-asignacion');assert(cor.result.includes('mejor_asignacion: tarea 1 → a')&&!cor.result.includes('quedó sin asignar'),cor.result);
      await evaluate(`document.getElementById('c12-asig-modo').value='literal';document.getElementById('c12-asig-costos').value='1 2 / 3';document.querySelector('#sim-c12-asignacion [data-reload]').click()`);
      assert(await evaluate(`!!document.querySelector('#sim-c12-asignacion [role="alert"]')`),'matriz inválida');
      await evaluate(`document.querySelectorAll('#sim-c12-asignacion [data-c12-preset]')[0].click()`);
      await evaluate(`document.getElementById('quiz-check-c12').click()`);
      assert.equal(await evaluate(`document.getElementById('quiz-score-c12').textContent`),'0 de 10 correctas (10 sin responder)');
      await evaluate(`QUESTIONS_C12.forEach((q,i)=>document.querySelector('input[name="c12q'+i+'"][value="'+q.c+'"]').click());document.getElementById('quiz-check-c12').click()`);
      assert.equal(await evaluate(`document.getElementById('quiz-score-c12').textContent`),'10 de 10 correctas');
      await evaluate(`document.getElementById('quiz-reset-c12').click()`);
    }
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    // Las tablas de clases anteriores desbordan en celular. Verificar la clase nueva contra
    // el viewport CSS de 390 px, sin aceptar ese desborde heredado como ancho disponible.
    await call('Emulation.setPageScaleFactor',{pageScaleFactor:1});
    assert.equal(await evaluate('document.documentElement.clientWidth'),390);
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('section[id$="-c10"]')).filter(e=>e.scrollWidth>e.clientWidth+1).length`),0);
    for(const id of ['sim-c10-reinas','sim-c10-suma','sim-c10-particion','sim-c10-procesadores']){
      const box=await evaluate(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return {left:r.left,right:r.right,width:document.documentElement.clientWidth}})()`);
      assert(box.left>=0&&box.right<=box.width+1,JSON.stringify(box));
      const overflow=await evaluate(`Array.from(document.querySelectorAll('#${id} .inputs input,#${id} .inputs select,#${id} .viz')).filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).length`);
      assert.equal(overflow,0);await capture(id,'mobile-'+id);
    }
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('section[id$="-c12"]')).filter(e=>e.scrollWidth>e.clientWidth+1).length`),0);
    for(const id of ['sim-c12-laberinto','sim-c12-asignacion']){
      const box=await evaluate(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return {left:r.left,right:r.right,width:document.documentElement.clientWidth}})()`);
      assert(box.left>=0&&box.right<=box.width+1,JSON.stringify(box));
      const overflow=await evaluate(`Array.from(document.querySelectorAll('#${id} .inputs input,#${id} .inputs select,#${id} .viz')).filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).length`);
      assert.equal(overflow,0,id);await capture(id,'mobile-'+id);
    }
    await evaluate(`document.querySelector('a[href="#clase10"]').click()`);
    assert.equal(await evaluate('location.hash'),'#clase10');
    // Página de práctica: enlace relativo y sus 29 simuladores existentes.
    const practice=pathToFileURL(path.resolve(__dirname,'../apuntes interactivos/prog3-ejercicios.html')).href;
    await call('Page.navigate',{url:practice});await waitFor(`document.readyState==='complete' && !!document.querySelector('#sim-g1 .count')`);
    assert.equal(await evaluate(`document.querySelectorAll('.sim [data-controls] .count').length`),29);
    // Los cinco simuladores de Backtracking de la página traen la traza y los botones de salto; los demás, no.
    for(const id of ['g15','g16','g17','s2','s4'])assert.equal(await evaluate(`document.querySelector('#sim-${id} [data-a="over"]').hidden`),false,'sim-'+id);
    for(const id of ['g1','g12','s1','s5'])assert.equal(await evaluate(`document.querySelector('#sim-${id} [data-a="over"]').hidden`),true,'sim-'+id);
    assert(await evaluate(`!!document.querySelector('a[href="index.html#clase10"]')`));
    assert.equal(errors.length,0,JSON.stringify(errors));
    console.log(JSON.stringify({status:'OK',totals,errors:errors.length,screenshots:output},null,2));
  }finally{
    if(socket&&socket.readyState===WebSocket.OPEN){try{await call('Browser.close');}catch{}socket.close();}
    if(child.exitCode===null)child.kill();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
