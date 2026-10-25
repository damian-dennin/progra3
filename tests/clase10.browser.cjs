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
async function finish(id){return evaluate(`(()=>{const root=document.getElementById(${JSON.stringify(id)}),next=root.querySelector('[data-a="next"]');let steps=0;while(!next.disabled&&steps<6000){next.click();steps++;}if(!next.disabled)throw Error('No terminó');return {steps,result:root.querySelector('[data-viz]').innerText,count:root.querySelector('.count').textContent};})()`);}
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
    assert.equal(await evaluate(`document.querySelectorAll('.classbar').length`),10);
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
    // Selector literal, presets, mensajes de error y recuperación.
    await evaluate(`document.getElementById('c10-suma-modo').value='literal';document.getElementById('c10-suma-modo').dispatchEvent(new Event('change'))`);
    assert((await finish('sim-c10-suma')).result.includes('1 solución'));
    await evaluate(`document.getElementById('c10-suma-arr').value='1,,2';document.querySelector('#sim-c10-suma [data-reload]').click()`);
    assert(await evaluate(`!!document.querySelector('#sim-c10-suma [role="alert"]')`));
    await evaluate(`document.getElementById('c10-suma-modo').value='corregido';document.querySelector('#sim-c10-suma [data-c10-preset]').click()`);
    assert((await finish('sim-c10-suma')).result.includes('4 soluciones'));
    await evaluate(`document.getElementById('c10-reinas-n').value='1';document.getElementById('c10-reinas-modo').value='literal';document.getElementById('c10-reinas-modo').dispatchEvent(new Event('change'))`);
    assert((await finish('sim-c10-reinas')).result.includes('Sin solución en el modo literal'));
    await evaluate(`document.getElementById('c10-reinas-modo').value='corregido';document.getElementById('c10-reinas-n').value='8';document.querySelector('#sim-c10-reinas [data-reload]').click()`);
    // Cuestionario: sin respuestas, todas correctas y restablecimiento.
    await evaluate(`document.getElementById('quiz-check-c10').click()`);
    assert.equal(await evaluate(`document.getElementById('quiz-score-c10').textContent`),'0 de 10 correctas (10 sin responder)');
    await evaluate(`QUESTIONS_C10.forEach((q,i)=>document.querySelector('input[name="c10q'+i+'"][value="'+q.c+'"]').click());document.getElementById('quiz-check-c10').click()`);
    assert.equal(await evaluate(`document.getElementById('quiz-score-c10').textContent`),'10 de 10 correctas');
    await evaluate(`document.getElementById('quiz-reset-c10').click()`);
    assert.equal(await evaluate(`document.querySelectorAll('#quizbox-c10 input:checked,#quizbox-c10 .fb.show,#quizbox-c10 .right').length`),0);
    await capture('quiz-c10','desktop-quiz');
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
    await evaluate(`document.querySelector('a[href="#clase10"]').click()`);
    assert.equal(await evaluate('location.hash'),'#clase10');
    // Página de práctica: enlace relativo y sus 20 simuladores existentes.
    const practice=pathToFileURL(path.resolve(__dirname,'../apuntes interactivos/prog3-ejercicios.html')).href;
    await call('Page.navigate',{url:practice});await waitFor(`document.readyState==='complete' && !!document.querySelector('#sim-g1 .count')`);
    assert.equal(await evaluate(`document.querySelectorAll('.sim [data-controls] .count').length`),20);
    assert(await evaluate(`!!document.querySelector('a[href="index.html#clase10"]')`));
    assert.equal(errors.length,0,JSON.stringify(errors));
    console.log(JSON.stringify({status:'OK',totals,errors:errors.length,screenshots:output},null,2));
  }finally{
    if(socket&&socket.readyState===WebSocket.OPEN){try{await call('Browser.close');}catch{}socket.close();}
    if(child.exitCode===null)child.kill();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
