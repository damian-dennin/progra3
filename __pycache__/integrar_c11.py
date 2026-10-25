from pathlib import Path
from html import escape
import json
import difflib

patches=['*** Begin Patch']
def patch(path,content):
    before=path.read_text(encoding='utf-8')
    patches.append('*** Update File: '+path.relative_to(root).as_posix())
    for line in list(difflib.unified_diff(before.splitlines(),content.splitlines(),n=3))[2:]:
        patches.append('@@' if line.startswith('@@') else line)

root=Path(__file__).resolve().parent.parent
greedy='''Algoritmo AsignarTareasGreedy
Entradas: Vector<entero> tareas, Entero m
Salida: Vector<entero> asignación
Vector<real> carga ← InicializarVector()
Vector<entero> asignación ← InicializarVector()
Entero i, j, p
Entero mejorProcesador
MergeSort(tareas) // ordenar tareas en forma decreciente por tiempo de ejecución
Para j ← 1 hasta m
    carga[j] ← 0
Fin Para
Para i ← 1 hasta longitud(tareas)
    mejorProcesador ← 1
    Para p ← 2 hasta m
        Si carga[p] < carga[mejorProcesador]
            mejorProcesador ← p
        Fin Si
    Fin Para
    asignacion[i] ← mejorProcesador
    carga[mejorProcesador] ← carga[mejorProcesador] + tareas[i]
Fin Para
devolver asignacion
fin AsignarTareasGreedy'''
processors='''mejorTiempo, mejorS ← Greedy o (∞, sin asignación)
tareas ← ordenar decreciente, conservando su identidad; cargas ← 0; S ← pendiente
procedimiento Buscar(E)
    inferior ← máximo(cargas)
    si inferior ≥ mejorTiempo: volver
    si E = longitud(tareas)
        mejorTiempo ← inferior; mejorS ← copia(S); volver
    t ← tareas[E]
    para p ← 1 hasta m
        S[t.id] ← p; cargas[p] ← cargas[p] + t.tiempo
        Buscar(E + 1)
        cargas[p] ← cargas[p] − t.tiempo; S[t.id] ← pendiente
Buscar(0)
devolver mejorTiempo, mejorS'''
original='''Algoritmo Mochila
Entrada: Objetos: Vector<Objeto>, capacidad: entero, mejorSolucion: Vector<entero>, valorMejorSolucion: entero, solucionActual:
Vector<entero>, valorSolucionActual: entero, pesoSolucionActual: entero,etapa:entero
Salida: entero

para i = 0 hasta 1:
    solucionActual[etapa] <- i
    pesoSolucionActual <- pesoSolucionActual + i * Objetos[etapa].peso
    valorSolucionActual <- valorSolucionActual + i * Objetos[etapa].valor
    si pesoSolucionActual == capacidad:
        si valorMejorSolucion = -1 O valorMejorSolucion < valorSolucionActual
            mejorSolucion <- solucionActual
            valorMejorSolucion <- valorSolucionActual
        fin si
    fin si
    si pesoSolucionActual < capacidad:
        si etapa = longitud(Objetos) - 1
            si valorMejorSolucion = -1 O valorMejorSolucion < valorSolucionActual
                mejorSolucion <- solucionActual
                valorMejorSolucion <- valorSolucionActual
            fin si
        fin si
        sino:
            valorMejorSolucion <- Mochila(Objetos, capacidad, mejorSolucion, valorMejorSolucion,
                                         solucionActual, valorSolucionActual, etapa + 1)
        fin sino
    fin si
fin para
devolver valorMejorSolucion'''
original_bound='''Algoritmo Mochila
Entrada: Objetos: Vector<Objeto>, capacidad: entero, mejorSolucion: Vector<entero>, valorMejorSolucion: entero,
solucionActual: Vector<entero>, valorSolucionActual: entero, pesoSolucionActual: entero,etapa:entero
Salida: entero

para i = 0 hasta 1:
    solucionActual[etapa] <- i
    pesoSolucionActual <- pesoSolucionActual + i * Objetos[etapa].peso
    valorSolucionActual <- valorSolucionActual + i * Objetos[etapa].valor
    si pesoSolucionActual == capacidad:
        si valorMejorSolucion = -1 O valorMejorSolucion < valorSolucionActual
            mejorSolucion <- solucionActual
            valorMejorSolucion <- valorSolucionActual
        fin si
    fin si
    si pesoSolucionActual < capacidad:
        cotaSuperior = calcularCotaSuperior(Objetos, solucionActual, etapa)
        si cotaSuperior > valorMejorSolucion:
            si etapa = longitud(Objetos) - 1
                si valorMejorSolucion = -1 O valorMejorSolucion < valorSolucionActual
                    mejorSolucion <- solucionActual
                    valorMejorSolucion <- valorSolucionActual
                fin si
            fin si
            sino:
                valorMejorSolucion <- Mochila(Objetos, capacidad, mejorSolucion, valorMejorSolucion,
                                             solucionActual, valorSolucionActual, etapa + 1)
            fin sino
        fin si
    fin si
fin para
devolver valorMejorSolucion'''
knapsack='''mejorValor ← 0; mejorS ← vector de ceros; S ← pendiente
procedimiento Buscar(E, peso, valor)
    si peso > capacidad: volver
    si E = n O peso = capacidad
        actualizar mejorValor y copia de S si mejora; completar pendientes con 0; volver
    si usarCota: cota ← CotaFraccionaria(E, capacidad − peso, valor)
    si usarCota
        si cota.num ≤ mejorValor × cota.den: volver
    // Solo se deciden objetos enteros, en su orden original
    para i ← 0 hasta 1
        S[E] ← i; Buscar(E + 1, peso + i × pesos[E], valor + i × valores[E])
        S[E] ← pendiente
Buscar(0, 0, 0)
devolver mejorValor, mejorS'''
bound_code='''CotaFraccionaria(E, restante, valorActual)
    total ← valorActual
    recorrer objetos pendientes (índice ≥ E) por valor/peso decreciente
        si restante = 0: terminar recorrido
        si pesoObjeto ≤ restante
            total ← total + valorObjeto
            restante ← restante − pesoObjeto
        sino
            devolver (total × pesoObjeto + restante × valorObjeto, pesoObjeto)
    devolver (total, 1)  // par (numerador, denominador)'''

def code(text):
    return '\n'.join(f'<div class="cl" data-l="{i}"><span class="ln">{i}</span><span class="tx">{escape(line)}</span></div>' for i,line in enumerate(text.splitlines(),1))

def preset(kind,label,values):
    return '<button class="ghost" data-c11-sim="'+kind+'" data-c11-preset="'+escape(json.dumps(values,ensure_ascii=False),quote=True)+'">'+label+'</button>'

def sim(kind,title,subtitle,inputs,text,buttons):
    return f'''<div class="sim c11-sim" id="sim-c11-{kind}">
<div class="sim-head"><div class="title">{title}<small>{subtitle}</small></div>
<div class="inputs">{inputs}<button class="ghost" data-reload>Ejecutar</button></div></div>
<div class="c11-presets">{buttons}</div>
<div class="sim-body"><div class="code" data-code>{code(text)}</div><div class="viz" data-viz></div></div>
<div class="explain" data-explain></div><div class="controls" data-controls></div></div>'''

greedy_sim=sim('greedy','Asignar tareas con Greedy','Entrada: duraciones y m · Salida: asignación y tiempo máximo',
'''<label for="c11-greedy-tareas">Duraciones</label><input id="c11-greedy-tareas" type="text" value="8,7,6,5,4">
<label for="c11-greedy-m">Procesadores</label><input class="c11-short" id="c11-greedy-m" type="number" min="1" max="3" value="2">''',greedy,
preset('greedy','Ejemplo del PDF',{'c11-greedy-tareas':'8,7,6,5,4','c11-greedy-m':2})+preset('greedy','Empates y orden original',{'c11-greedy-tareas':'2,4,4,1','c11-greedy-m':2})+preset('greedy','Un procesador',{'c11-greedy-tareas':'8,7,6,5,4','c11-greedy-m':1}))
processor_sim=sim('procesadores','Backtracking: mejorar una solución factible','Entrada: duraciones y m · Salida: una asignación óptima',
'''<label for="c11-procesadores-tareas">Duraciones</label><input id="c11-procesadores-tareas" type="text" value="8,7,6,5,4">
<label for="c11-procesadores-m">Procesadores</label><input class="c11-short" id="c11-procesadores-m" type="number" min="1" max="3" value="2">
<label for="c11-procesadores-modo">Inicio</label><select id="c11-procesadores-modo"><option value="greedy">Con cota inicial Greedy</option><option value="sin">Sin cota inicial</option></select>''',processors,
preset('procesadores','Ejemplo del PDF',{'c11-procesadores-tareas':'8,7,6,5,4','c11-procesadores-m':2})+preset('procesadores','Greedy ya es óptimo',{'c11-procesadores-tareas':'4,4,2,2','c11-procesadores-m':2})+preset('procesadores','Duraciones cero',{'c11-procesadores-tareas':'0,0,0','c11-procesadores-m':2}))
knapsack_sim=sim('mochila','Mochila 0/1: factibilidad y cota superior','Versión corregida · Salida: valor óptimo y selección de objetos enteros',
'''<label for="c11-mochila-valores">Valores</label><input id="c11-mochila-valores" type="text" value="35,30,20,12">
<label for="c11-mochila-pesos">Pesos</label><input id="c11-mochila-pesos" type="text" value="5,3,2,1">
<label for="c11-mochila-capacidad">Capacidad</label><input class="c11-short" id="c11-mochila-capacidad" type="number" min="0" max="6000" value="7">
<label for="c11-mochila-modo">Poda</label><select id="c11-mochila-modo"><option value="cota">Capacidad + cota superior</option><option value="sin">Solo capacidad</option></select>''',knapsack,
preset('mochila','Ejemplo del PDF',{'c11-mochila-valores':'35,30,20,12','c11-mochila-pesos':'5,3,2,1','c11-mochila-capacidad':7})+preset('mochila','Capacidad cero',{'c11-mochila-valores':'35,30','c11-mochila-pesos':'5,3','c11-mochila-capacidad':0})+preset('mochila','No entra ningún objeto',{'c11-mochila-valores':'35,30','c11-mochila-pesos':'5,3','c11-mochila-capacidad':2})+preset('mochila','Capacidad exacta',{'c11-mochila-valores':'8,5','c11-mochila-pesos':'3,2','c11-mochila-capacidad':5}))

content='''<!-- ==================== CLASE 11 ==================== -->
<div class="classbar" id="clase11"><span>Clase 11</span><b>Backtracking con cotas</b><em>21/10/2026</em></div>

<section class="c11-section" id="repaso-c11">
<h2>Repaso: recorrer, decidir y volver atrás</h2>
<p class="sub">Láminas 4–9 · De buscar soluciones a buscar la mejor.</p>
<p>En <a href="#backtracking-c10">Backtracking</a>, cada nivel representa una decisión y cada rama una alternativa. Construís una solución parcial, comprobás si vale la pena continuar y, al volver, deshacés la decisión. Podés buscar una solución, todas o una óptima: el criterio de corte cambia según el objetivo.</p>
<div class="grid2"><div class="def"><h4>Representación</h4>S guarda las decisiones del camino actual; la etapa indica qué falta decidir. Una posición pendiente no es una decisión tomada.</div><div class="def"><h4>Retroceso</h4>Restaurá el estado antes de probar otra alternativa. Guardá una copia de la mejor solución: S sigue cambiando.</div></div>
<h3>El ejercicio de práctica de esta clase</h3>
<div class="card"><p>«Se tienen m procesadores idénticos y n tareas con un tiempo de ejecución dado. Se requiere encontrar una asignación de tareas a procesadores de manera de minimizar el tiempo de ejecución del total de tareas».</p></div>
<p>La lámina 9 pide estrategia por Backtracking, pseudocódigo y complejidad. La <a href="#procesadores-c10">resolución base ya está en la clase 10</a>. El tiempo total es el momento en que termina el último procesador: <code>máximo(cargas)</code>. Sumar las cargas no sirve como objetivo porque esa suma es constante.</p>
<p>Esta clase agrega una idea: conseguir primero una solución completa con Greedy para empezar a podar antes. Después aplica una estimación optimista al problema de la Mochila.</p>
<hr class="rule"></section>

<section class="c11-section" id="cotas-c11">
<h2>Cotas: justificar que una rama ya no puede mejorar</h2>
<p class="sub">Láminas 10–13 y 27–29 · Factibilidad y optimalidad.</p>
<p>Una <strong>cota</strong> limita lo que podrías conseguir al completar una solución parcial. No hace falta conocer la mejor continuación exacta: alcanza con una estimación que nunca descarte una mejora real.</p>
<div class="grid2"><div class="def"><h4>Cota inferior · minimizar</h4>Un costo L que ninguna continuación puede bajar. Si ya tenés una solución de costo B y <code>L ≥ B</code>, la rama no puede mejorarla.</div><div class="def"><h4>Cota superior · maximizar</h4>Un beneficio U que ninguna continuación puede superar. Si ya tenés una solución de valor B y <code>U ≤ B</code>, la rama no puede mejorarla.</div></div>
<div class="first"><b>Por qué es seguro</b>Para minimizar, el costo de cualquier continuación es ≥ L ≥ B. Para maximizar, su valor es ≤ U ≤ B. En ambos casos ya guardaste algo al menos igual de bueno.</div>
<div class="dpwrap"><table><tr><th>Problema</th><th>Mejor solución factible conocida</th><th>Estimación de una rama</th><th>Podar si…</th></tr>
<tr><td>Procesadores: minimizar tiempo</td><td>B es una cota superior del óptimo global</td><td>L = mayor carga parcial es una cota inferior</td><td>L ≥ B</td></tr>
<tr><td>Mochila: maximizar valor</td><td>B es una cota inferior del óptimo global</td><td>U = valor actual + mochila fraccionaria pendiente es una cota superior</td><td>U ≤ B</td></tr></table></div>
<div class="note"><b>Una cota inicial no es la estimación de la rama</b>En procesadores, Greedy entrega una asignación completa de tiempo 17: el óptimo es ≤ 17. Una rama con carga parcial 20 tiene costo final ≥ 20. Comparar ambas cotas permite descartarla. Hay que guardar también la asignación que logra 17.</div>
<h3>Dos razones distintas para podar</h3>
<ul><li>Por factibilidad: ninguna continuación será válida. Ejemplo: peso acumulado mayor que la capacidad, con pesos positivos.</li><li>Por optimalidad: podría haber soluciones válidas, pero ninguna mejorará la que ya tenés. Ejemplo: ni tomando fracciones se supera el mejor valor de Mochila.</li></ul>
<p>Los simuladores buscan <strong>una solución óptima</strong>, así que podan también la igualdad. Para enumerar todos los óptimos habría que explorar los empates y guardar todas esas soluciones.</p>
<hr class="rule"></section>

<section class="c11-section" id="greedy-c11">
<h2>Una cota inicial Greedy para asignar tareas</h2>
<p class="sub">Láminas 14–19 · Primero las tareas más largas, al procesador más libre.</p>
<div class="grid2"><div class="def"><h4>Selección</h4>Elegí la tarea pendiente de mayor duración. Ordená de mayor a menor una sola vez.</div><div class="def"><h4>Asignación</h4>Elegí el procesador con menor carga actual. La tarea se ejecuta completa allí; sumá su duración a esa carga.</div></div>
<p>Este criterio se conoce como <strong>LPT</strong> (primero la tarea de mayor duración). Construye una solución factible rápidamente, pero no garantiza que sea óptima.</p>
<div class="dpwrap"><table><tr><th>Tarea</th><th>Procesador elegido</th><th>Cargas después</th></tr><tr><td>8</td><td>P1</td><td>(8, 0)</td></tr><tr><td>7</td><td>P2</td><td>(8, 7)</td></tr><tr><td>6</td><td>P2</td><td>(8, 13)</td></tr><tr><td>5</td><td>P1</td><td>(13, 13)</td></tr><tr><td>4</td><td>P1, desempate</td><td>(17, 13)</td></tr></table></div>
<p>El PDF compara <code>P1 = {8,5,4}</code> y <code>P2 = {7,6}</code>, tiempo <strong>17</strong>, con la asignación óptima <code>{8,7}</code> y <code>{6,5,4}</code>, tiempo <strong>15</strong>. Como hay trabajo total 30 y dos procesadores, 30/2 = 15 es un límite inferior; alcanzar 15 prueba optimalidad en este ejemplo.</p>
<h3>Pseudocódigo de la cátedra y ejecución</h3>
<p>Se transcribe la lámina 18 en el panel de código. El ejemplo arranca con los valores de la lámina 17. Podés ingresar de una a seis duraciones enteras no negativas y de uno a tres procesadores.</p>
<div class="note"><b>Identidad y empates</b>La lámina ordena el vector de tareas y devuelve asignaciones en ese orden. El simulador conserva el identificador original T1…Tn y muestra S en el orden de entrada. Los empates de duración conservan ese orden; los de carga eligen el procesador de menor número, como el &lt; estricto del pseudocódigo.</div>
@@GREEDY_SIM@@
<h3>Complejidad temporal</h3>
<p>Si t es la cantidad de tareas y m la de procesadores: ordenar cuesta O(t log t), inicializar cargas O(m) y buscar la menor carga para cada tarea O(t·m). Para t ≥ 1, el término O(m) queda incluido. Devolver la asignación en el orden original agrega O(t).</p>
<div class="card" style="text-align:center"><span class="tag t-nlogn">O(t log t + t·m)</span> · memoria auxiliar O(t + m).</div>
<hr class="rule"></section>

<section class="c11-section" id="procesadores-c11">
<h2>Backtracking con la cota inicial Greedy</h2>
<p class="sub">Lámina 20 · Empezar con 17, buscar una mejora y conservar 15.</p>
<div class="grid2"><div class="def"><h4>Caso base</h4>Todas las tareas están asignadas. Si la carga máxima mejora la guardada, copiá S y actualizá el mejor tiempo.</div><div class="def"><h4>Subproblemas</h4>Asigná la siguiente tarea a cada uno de los m procesadores. Sumá su duración antes de bajar; restala al volver.</div><div class="def"><h4>Poda y retorno</h4>La mayor carga parcial no puede bajar. Si ya alcanza o supera el mejor tiempo, podá. Conservá la mejor asignación completa de todas las ramas exploradas.</div></div>
<p>La lámina muestra la rama <code>(8,0) → (15,0) → (15,6)</code>. Probar el 5 en P1 da <code>(20,6)</code>: se poda contra 17. En P2 da <code>(15,11)</code>; agregar 4 a P2 completa <code>(15,15)</code>, que mejora la cota a 15.</p>
<div class="note"><b>Cómo leer el árbol del PDF</b>Es un esquema parcial, no una traza completa: la rama (8,7) no se puede podar solo por su carga máxima 8 contra la cota 17. El simulador aplica la desigualdad a cada nodo y explica la causa concreta de cada poda.</div>
<h3>Pseudocódigo propio sobre la estrategia de la lámina</h3>
<p>El PDF publica el árbol, sin pseudocódigo de esta búsqueda. El siguiente desarrollo conserva una sola solución óptima. <code>mejorTiempo</code> y <code>mejorS</code> son compartidos por la búsqueda; las decisiones y cargas se restauran al volver. Las etapas empiezan en 0 y los procesadores visibles en 1.</p>
<p>Los dos modos usan el mismo orden decreciente de tareas y prueban P1…Pm. «Sin cota inicial» también poda cuando ya encontró una solución; la única diferencia es empezar con ∞ o con una asignación Greedy completa.</p>
@@PROCESSOR_SIM@@
<p>La tabla final compara ambos recorridos. Se cuentan nodos, incluidos la raíz y los podados. Las podas consecutivas pueden agruparse en un paso; ninguna alternativa se omite por motivos de animación. El costo de generar la cota Greedy no forma parte de ese conteo de nodos.</p>
<h3>Complejidad temporal</h3>
<p>Sin una poda útil hay m alternativas por tarea y profundidad t: hasta mᵗ asignaciones. Cada nodo calcula un máximo O(m), y copiar una mejora cuesta O(t). Para m ≥ 2, una cota superior del costo es <span class="tag t-exp">O((m + t)·mᵗ)</span>, más el ordenamiento O(t log t) y, cuando se usa, Greedy O(t log t + t·m). Con m = 1 la búsqueda es O(t), y el ordenamiento mantiene el costo total O(t log t). Memoria de la búsqueda: O(t + m), aparte de las instantáneas del simulador.</p>
<div class="first"><b>Menos nodos no es otra clase de complejidad</b>Una buena solución inicial puede ahorrar muchas ramas. El peor caso sigue siendo exponencial: no alcanza con escribir «tiene poda» para justificar tiempo polinomial.</div>
<hr class="rule"></section>

<section class="c11-section" id="mochila-c11">
<h2>Mochila 0/1 con cota superior fraccionaria</h2>
<p class="sub">Láminas 21–30 · Buscar objetos enteros; permitir fracciones solo al estimar.</p>
<p>Tenés objetos con peso y valor positivos y una mochila de capacidad P. Buscás maximizar el valor sin superar P; cada objeto se toma una vez o no se toma. Ya vimos la <a href="#mochila">mochila fraccionaria con Greedy</a> y la <a href="#mochilapd">mochila 0/1 con Programación Dinámica</a>. Acá resolvemos la versión 0/1 por Backtracking.</p>
<div class="grid2"><div class="def"><h4>Caso base</h4>No quedan objetos, o se alcanza la capacidad. Compará el valor con el mejor y copiá la selección si mejora. Al llenar exactamente, los pendientes quedan en 0.</div><div class="def"><h4>Subproblemas</h4>S[E] = 0 excluye el objeto; S[E] = 1 lo incluye. Avanzá una etapa, llevando peso y valor acumulados.</div><div class="def"><h4>Combinación y poda</h4>Conservá la mejor solución factible. Descartá peso excesivo y, opcionalmente, ramas cuya mejor estimación fraccionaria no supere ese valor.</div></div>
<h3>Los datos del PDF</h3>
<div class="dpwrap"><table><tr><th>Objeto</th><th>Valor</th><th>Peso</th><th>Valor/peso</th></tr><tr><td>O1</td><td>35</td><td>5</td><td>7</td></tr><tr><td>O2</td><td>30</td><td>3</td><td>10</td></tr><tr><td>O3</td><td>20</td><td>2</td><td>10</td></tr><tr><td>O4</td><td>12</td><td>1</td><td>12</td></tr></table></div>
<p>Con P = 7, incluir O1 y O2 da peso 8 y se poda. O1 + O3 da valor 55 y peso 7: es factible, pero no óptimo. <strong>O2 + O3 + O4 da valor 62 y peso 6</strong>. La mochila puede quedar con capacidad sin usar.</p>
<h3>Pseudocódigo original · lámina 25</h3>
<div class="card"><pre class="ps">@@ORIGINAL@@</pre></div>
<h3>Pseudocódigo original con cota · lámina 30</h3>
<div class="card"><pre class="ps">@@ORIGINAL_BOUND@@</pre></div>
<div class="note"><b>Qué se completa para poder ejecutarlo</b>
<ul><li>La llamada recursiva omite <code>pesoSolucionActual</code>, aunque figura en la entrada. Además, el <code>sino</code> aparece después del cierre del <code>si</code> de la última etapa; se explicita su asociación.</li><li>La lámina no desarrolla <code>calcularCotaSuperior</code> ni declara cómo recibe la capacidad y los acumulados. Abajo se define con esos datos y solo los objetos pendientes.</li><li>La asignación <code>mejorSolucion ← solucionActual</code> debe conservar una copia, y la mejor solución debe compartirse o devolverse explícitamente. Al llenar antes de la última etapa, se completan las decisiones restantes con 0.</li><li>En la versión ejecutable, peso y valor se pasan por valor y se derivan desde los acumulados del padre; S se restaura. El ciclo 0→1 del original puede funcionar sin restar acumulados si estos son locales y se pasan por valor: esa semántica debe quedar clara.</li></ul>
Se conserva el original a la vista. El simulador ejecuta únicamente la versión corregida y rotulada; no intenta inventar una interpretación literal de una llamada incompleta.</div>
<h3>Construir la cota superior, término por término</h3>
<p>Fijá las decisiones que ya tomaste. De la capacidad total restá el peso actual. Entre los objetos pendientes, tomá primero los de mayor relación valor/peso, enteros mientras entren y una fracción del siguiente si hace falta. Sumá ese beneficio al valor actual.</p>
<div class="card"><p><strong>U = valorActual + mejor valor fraccionario de lo pendiente con capacidad P − pesoActual.</strong></p><p>En la raíz: O4 + O2 + O3 pesan 1 + 3 + 2 = 6 y valen 12 + 30 + 20 = 62. Queda 1 de capacidad, que admite 1/5 de O1: <code>U = 62 + 35/5 = 69</code>. Ese 69 es una cota; el óptimo entero sigue siendo 62.</p></div>
<div class="first"><b>Por qué la cota es optimista</b>Toda continuación 0/1 también es una selección fraccionaria válida. Al permitir fracciones ampliás las posibilidades, por eso el máximo fraccionario no queda por debajo del máximo entero de la rama. Si ni esa ventaja alcanza para mejorar B, podás con seguridad.</div>
<h3>Auxiliar propio para la cota</h3>
<div class="card"><pre class="ps">@@BOUND_CODE@@</pre></div>
<p>El orden por valor/peso se prepara una sola vez; cada evaluación recorre ese orden y saltea los objetos ya decididos. Los empates conservan el índice original. Solo puede haber un objeto fraccionado. Se compara <code>numerador ≤ mejorValor × denominador</code>, con enteros exactos; el decimal se muestra únicamente para facilitar la lectura.</p>
<h3>Versión corregida y simulador</h3>
<p>Elegí de uno a seis objetos, con valores y pesos enteros entre 1 y 1000, y capacidad entre 0 y 6000. El orden de búsqueda siempre es O1…On y primero excluir, después incluir, como el <code>para i = 0 hasta 1</code>. Los árboles ilustrativos del PDF dibujan primero la rama «Sí»; por eso su recorrido visual no coincide con este orden.</p>
@@KNAPSACK_SIM@@
<h3>Complejidad temporal</h3>
<p>Sin cota superior, el recorrido binario cumple <code>T(n) = 2·T(n−1) + O(1)</code>: caso resta, a = 2, b = 1, k = 0 → <span class="tag t-exp">O(2ⁿ)</span>. La lámina 26 da esos parámetros. Copiar cada mejora agrega O(n); una cota superior que incluye esas copias es O(n·2ⁿ).</p>
<p>Con cota fraccionaria, ordenar cuesta O(n log n) una vez y cada evaluación recorre hasta n objetos: O(n) por nodo. El peor caso sigue acotado por <span class="tag t-exp">O(n·2ⁿ + n log n)</span>. La poda puede ahorrar nodos, pero calcular la cota también cuesta trabajo. Memoria de la búsqueda: O(n), sin contar las instantáneas que guarda la animación.</p>
<hr class="rule"></section>

<section class="c11-section" id="quiz-c11">
<h2>Autoevaluación</h2><p class="sub">Diez preguntas sobre cotas, soluciones factibles y decisiones de poda.</p>
<div id="quizbox-c11"></div>
<div class="card" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><button class="primary" id="quiz-check-c11">Corregir</button><button class="ghost" id="quiz-reset-c11">Empezar de nuevo</button><span class="score" id="quiz-score-c11"></span></div>
<hr class="rule"></section>

<section class="c11-section" id="chuleta-c11">
<h2>Resumen para el parcial</h2><p class="sub">Qué representa cada cota, cómo se compara y qué hay que conservar.</p>
<div class="dpwrap"><table><tr><th>Algoritmo</th><th>Idea</th><th>Resultado del ejemplo</th><th>Complejidad</th></tr>
<tr><td>Greedy de tareas</td><td>Mayor duración al procesador menos cargado</td><td>Tiempo 17: cota superior inicial</td><td>O(t log t + t·m)</td></tr>
<tr><td>Procesadores con cotas</td><td>Podar si máx(cargas) ≥ mejorTiempo</td><td>Tiempo óptimo 15</td><td>O((m+t)·mᵗ) para m ≥ 2, más preparación</td></tr>
<tr><td>Mochila 0/1</td><td>Excluir/incluir; descartar exceso de peso</td><td>Valor 62, peso 6</td><td>O(2ⁿ) recorrido; O(n·2ⁿ) incluyendo copias</td></tr>
<tr><td>Mochila con cota superior</td><td>Podar si valor actual + fraccionaria pendiente ≤ mejorValor</td><td>Cota inicial 69; óptimo entero 62</td><td>O(n·2ⁿ + n log n), incluyendo evaluación de cotas y copias</td></tr></table></div>
<h3>Checklist de la estrategia</h3>
<ul class="chk"><li><input type="checkbox"><span>Definí S, la etapa, las alternativas y el objetivo que minimizo o maximizo.</span></li><li><input type="checkbox"><span>Justifiqué por qué la cota nunca subestima el máximo o sobreestima el mínimo de una rama.</span></li><li><input type="checkbox"><span>Distinguí la estimación optimista de la mejor solución factible guardada.</span></li><li><input type="checkbox"><span>Escribí la desigualdad de poda y aclaré que busco una solución óptima.</span></li><li><input type="checkbox"><span>Guardé una copia de la solución inicial y de cada mejora; restauré el estado al retroceder.</span></li><li><input type="checkbox"><span>Conté preparación, nodos, cálculo de cotas y copias al analizar complejidad.</span></li></ul>
<h3>Errores que cuestan puntos</h3>
<ul><li>Afirmar que Greedy siempre encuentra la asignación óptima.</li><li>Llamar cota inferior al tiempo de una asignación Greedy completa, o podar con una comparación invertida.</li><li>Guardar solo el costo Greedy y perder la solución cuando no hay mejoras.</li><li>Calcular la cota fraccionaria sin ordenar por valor/peso: una selección fraccionaria cualquiera no garantiza una cota superior.</li><li>Volver a contar objetos ya elegidos o cambiar decisiones que estaban fijadas en la rama.</li><li>Devolver las fracciones como solución de un problema 0/1, o exigir llenar exactamente la mochila.</li><li>Podar empates y afirmar que se enumeraron todos los óptimos.</li><li>Confundir cantidad de pasos visibles con nodos visitados o con complejidad temporal.</li></ul>
<p class="srcnote">Fuente: «Clase-11- 21-10-2026.pdf», Programación III, UADE. Repaso y práctica: láminas 4–9; cotas: 11–13; tareas: 14–20; Mochila: 22–30. Los pseudocódigos originales se conservan con observaciones. La búsqueda de procesadores, el auxiliar fraccionario y la Mochila ejecutable son desarrollos propios identificados; los óptimos de los ejemplos fueron verificados por enumeración exhaustiva.</p>
</section>

'''
for key,value in {'GREEDY_SIM':greedy_sim,'PROCESSOR_SIM':processor_sim,'KNAPSACK_SIM':knapsack_sim,'ORIGINAL':escape(original),'ORIGINAL_BOUND':escape(original_bound),'BOUND_CODE':escape(bound_code)}.items():
    content=content.replace('@@'+key+'@@',value)
assert '@@' not in content
css='''
/* --- clase 11: cotas (compartido por ambos apuntes) --- */
.c11-section{min-width:0;overflow-wrap:anywhere}
#clase11{flex-wrap:wrap}
.c11-sim .sim-body{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.c11-sim .inputs{min-width:0;max-width:100%}
.c11-sim .inputs input,.c11-sim .inputs select{max-width:100%;min-width:0}
.c11-sim .inputs .c11-short{width:100px}
.c11-sim .explain,.c11-sim .setbox{overflow-wrap:anywhere}
.c11-sim small{color:var(--mut)}
.c11-presets{display:flex;flex-wrap:wrap;gap:8px;padding:12px 18px;border-bottom:1px solid var(--line)}
.c11-section pre.ps{overflow-x:auto;max-width:100%}
@media(max-width:1100px){.c11-sim .sim-body{grid-template-columns:1fr}}
@media(max-width:600px){.c11-sim .code{max-height:300px}.c11-sim .inputs{width:100%}.c11-sim .inputs label{flex-basis:100%}}
'''
path=root/'apuntes interactivos/index.html'
html=path.read_text(encoding='utf-8')
assert 'id="clase11"' not in html
html=html.replace('  <div class="navgroup">Práctica</div>','''  <div class="navgroup">Clase 11 · 21/10 · Backtracking con cotas</div>
  <ol>
    <li><a href="#repaso-c11">Repaso y ejercicio de práctica</a></li>
    <li><a href="#cotas-c11">Cotas inferiores y superiores</a></li>
    <li><a href="#greedy-c11">Cota inicial Greedy</a></li>
    <li><a href="#procesadores-c11">Procesadores con cota inicial</a></li>
    <li><a href="#mochila-c11">Mochila con cota superior</a></li>
    <li><a href="#quiz-c11">Autoevaluación</a></li>
    <li><a href="#chuleta-c11">Resumen para el parcial</a></li>
  </ol>
  <div class="navgroup">Práctica</div>''',1)
html=html.replace('<b>10 clases</b><b>37 algoritmos ejecutables</b>','<b>11 clases</b><b>40 algoritmos ejecutables</b>',1).replace('<b>100 preguntas de repaso</b>','<b>110 preguntas de repaso</b>',1)
card='    <a href="#clase10">'
start=html.index(card);end=html.index('\n',start)
html=html[:end]+'''\n    <a href="#clase11"><b>Clase 11 · 21/10/2026</b><span>Backtracking con cotas: asignación Greedy, procesadores con cota inicial y Mochila 0/1 con cota superior fraccionaria</span></a>'''+html[end:]
html=html.replace('<p class="srcnote" style="margin-top:40px">',content+'<p class="srcnote" style="margin-top:40px">',1)
script=(root/'__pycache__/clase11.js').read_text(encoding='utf-8')
html=html.replace('/* ===== navegación activa ===== */',script+'\n\n/* ===== navegación activa ===== */',1)
html=html.replace('</style>',css+'</style>',1)
patch(path,html)
practice=root/'apuntes interactivos/prog3-ejercicios.html'
html=practice.read_text(encoding='utf-8').replace('</style>',css+'</style>',1)
html=html.replace('clase 10 del apunte</a>.</div>','clase 10 del apunte</a>. La <a href="index.html#clase11">clase 11</a> desarrolla cotas, la mejora de procesadores con Greedy y Mochila con cota superior.</div>',1)
patch(practice,html)
patches.append('*** End Patch')
print(json.dumps('\n'.join(patches)+'\n',ensure_ascii=False))
