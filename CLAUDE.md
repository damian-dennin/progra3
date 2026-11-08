# Apunte interactivo — Programación III (UADE)

Guía de estudio de un solo archivo para Diseño y Análisis de Algoritmos. Cada clase de la
cursada se agrega como un bloque nuevo al final del mismo HTML. El objetivo del material es
aprobar los parciales: primer parcial 16/09/2026, integrador 11/11/2026.

## Archivos

| Archivo | Qué es |
|---|---|
| `apuntes interactivos/index.html` | El apunte de la teoría de la cursada. Una clase por bloque. (Antes se llamaba `prog3-apunte.html` y vivía en la raíz; en esta máquina la carpeta es `apuntes interactivos/`, con espacio, así que las rutas van entre comillas.) |
| `apuntes interactivos/prog3-ejercicios.html` | Los ejercicios de la Guía, los problemas de las clases 7 a 11 y los de Integración de los dos parciales (Divide y Conquista, Greedy, Grafos, Programación Dinámica, Backtracking), con la resolución tapada tras un botón. Mismo motor y CSS que el apunte, archivo aparte. |
| `validate.py` | Validación estructural. Correr sobre **los dos** HTML después de cada cambio. |
| `pdf_imagenes.py` | Extractor de imágenes de los PDF de las clases (`Clase-NN_fecha.pdf`, en la raíz). Ver «Trampas conocidas». |
| `CLAUDE.md` | Este archivo. |

Los PDF de las clases están en `Clases/` (`Clase-01_2026-08-05.pdf` … `Clase-28-10-2026.pdf`; desde la 10 el nombre
cambió de formato; los comandos de más abajo que dicen «en la raíz» hay que correrlos con esa ruta); los
enunciados de la cátedra en `ejercicios/`. Los videos de las clases (`Videos/`, mp4) están en `.gitignore`: no se
versionan.

## Restricciones no negociables

- **Cada HTML es autocontenido: un solo `<style>`, un solo `<script>`.** Sin build, sin npm, sin
  CDN. Tiene que abrirse con doble clic y funcionar sin internet. Son dos archivos
  (`index.html` y `prog3-ejercicios.html`) que se linkean entre sí con rutas relativas; el
  motor `Sim`, los helpers y el `<style>` están duplicados a propósito — un cambio de estilo o de
  motor va en los dos.
- **Vanilla JS.** Sin frameworks ni librerías.
- **Nada de `localStorage` ni `sessionStorage`.**
- **Todo en castellano rioplatense** (vos, no tú). Terminología de la cátedra, no traducciones
  propias: «caso base», «subproblemas», «combinación», «complejidad temporal», «caso resta»,
  «caso división».
- **El pseudocódigo se transcribe literal de las diapositivas**, con sus rarezas incluidas. Si
  algo del PDF está mal o es ambiguo, no se corrige en silencio: se transcribe tal cual y se
  explica la observación en un bloque `.note`. Ejemplo ya presente: la búsqueda binaria del PDF
  indexa desde 0 en el pseudocódigo y desde 1 en el ejemplo numérico.

## Flujo de trabajo para agregar una clase

1. **Leer el PDF** y extraer: temas, pseudocódigos, ejemplos numéricos, resultados de complejidad
   que da la cátedra. Los pseudocódigos y tablas son imágenes **con parches encima**: hay que
   leerlos con `pdf_imagenes.py --componer` (ver «Trampas conocidas»), no con las imágenes sueltas.
2. **Verificar los algoritmos antes de escribir HTML.** Replicar cada pseudocódigo en un `.js`
   suelto y correrlo con Node sobre casos aleatorios, incluyendo duplicados, vector ya ordenado,
   vector invertido y n = 1. Los pseudocódigos de las diapositivas a veces tienen ciclos sin cota
   explícita: hay que confirmar que terminan. Recién después se escribe el simulador.
3. **Agregar el bloque** al HTML (ver «Anatomía» abajo): classbar, secciones, simuladores,
   autoevaluación, resumen.
4. **Actualizar** el sidebar (`.navgroup` + `<ol>`), las tarjetas del índice (`.idx`) y los
   contadores del `.hero-meta`.
5. **Correr `validate.py`** sobre los dos HTML (comandos en «Validación») y dejarlo en verde.
6. **Editar con `str_replace`**, no reescribiendo el archivo entero. Son ~150 KB.

## Anatomía del archivo

```
<style>            variables CSS, layout, componentes, y al final los overrides heredados
<nav class="toc">  brand + stripe + un .navgroup y un <ol> por clase
<main>
  <header class="hero">          título + .hero-meta + .idx (una tarjeta por clase)
  <div class="classbar" id="claseN">   separador de clase
  <section id="...">  × N        contenido de esa clase
  ...                            (bloque de la clase siguiente)
  <p class="srcnote">            cierre del documento
<script>
  motor Sim + helpers            esc, parseArr, cells, arrRender
  simuladores de la clase 2
  /* ==================== CLASE 1 ==================== */
  comparador de crecimiento, simuladores de la clase 1, slotViz/derivSim
  navegación activa (IntersectionObserver)  ← siempre al final
```

Orden del `<script>`: los helpers primero (`esc` es `const`, así que hay temporal dead zone;
cualquier código que lo use tiene que ir después). El IIFE de navegación va último.

### Convención de ids

| Patrón | Uso |
|---|---|
| `claseN` | separador de clase (`classbar`) |
| `sim-xxx` | contenedor de simulador (`sim-bb`, `sim-ms`, `sim-qs`…) |
| `xxx-arr`, `xxx-n`, `xxx-w` | inputs de un simulador, con prefijo del sim |
| `quiz-cN`, `quizbox-cN`, `quiz-check-cN`, `quiz-reset-cN`, `quiz-score-cN` | autoevaluación por clase |
| `chuleta-cN` | resumen para el parcial de esa clase |

Los ids se comparten en un único documento: **cualquier id nuevo tiene que ser único en todo el
archivo**. Es el error más frecuente al fusionar bloques.

## El motor de simulación

Es lo que hace que el apunte sirva: cada algoritmo se ejecuta paso a paso resaltando la línea
del pseudocódigo en curso.

### Marcado HTML de un simulador

```html
<div class="sim" id="sim-xxx">
  <div class="sim-head">
    <div class="title">Algoritmo Xxx<small>Entrada: … · Salida: …</small></div>
    <div class="inputs">
      <label for="xxx-arr">S</label><input type="text" id="xxx-arr" value="…">
      <button class="ghost" data-reload>Ejecutar</button>
    </div>
  </div>
  <div class="sim-body">
    <div class="code" data-code>
      <div class="cl" data-l="1"><span class="ln">1</span><span class="tx">si inicio &lt; fin</span></div>
      …
    </div>
    <div class="viz" data-viz></div>
  </div>
  <div class="explain" data-explain></div>
  <div class="controls" data-controls></div>
</div>
```

- `data-l` es el identificador de línea que usa el builder. **Único dentro del simulador**; no
  tiene que coincidir con el número visible en `.ln`.
- Para dos algoritmos en un mismo simulador (MergeSort + Merge, QuickSort + Pivot): un
  `<div class="cl hdr" data-l="90">` como encabezado y rangos separados, por ejemplo 1–6 para el
  principal y 10–29 para el auxiliar.
- El HTML del pseudocódigo lleva entidades escapadas: `&lt;` `&gt;` `&amp;`.
- Los controles (Anterior / Siguiente / Reproducir / barra de progreso) los inyecta el motor.

### Contrato de JS

```js
Sim(rootId, build, render)
```

- `build()` → array de **steps**. Se llama en cada «Ejecutar» y lee los inputs del DOM.
- `render(step, allSteps)` → string de HTML que se inyecta en `[data-viz]`.

Campos que entiende `arrRender` (el renderer genérico, sirve para la mayoría de los casos):

| Campo | Efecto |
|---|---|
| `line` | número de `data-l` a resaltar (obligatorio salvo en el paso final) |
| `msg` | texto del panel inferior; admite HTML (`<b>`, `<code>`) |
| `arr` | array a dibujar como celdas |
| `marks` | `{índice: {cls, p}}` — `cls`: `out win act cmp piv done hit miss empty`; `p`: etiqueta arriba (`i`, `j`, `k`, `medio`) |
| `base` | offset de los índices mostrados (usar `1` para vectores 1-based) |
| `vlabel` | leyenda que explica el código de colores |
| `vars` | array de strings → chips de contadores |
| `stack` | array de strings → pila de llamadas |
| `extra` | HTML adicional (segundo vector, buffer auxiliar) |
| `result` + `rcls` | caja de resultado final; `rcls`: `good` o `bad` |

Si un algoritmo necesita otra visualización (árbol AVL, casilleros de a/b/k), se escribe un
renderer propio; ver `slotViz` y el renderer SVG de `sim-avl`.

**Traza de ejecución (Backtracking, clases 10–11 y ejercicios).** `Sim` le pasa al renderer también el índice
del paso (`render(step, allSteps, i)`; los renderers viejos lo ignoran) y entiende dos campos más: `cd`
(profundidad de llamada = cantidad de marcos activos) y `frames` (la pila: `[{fn, vars:{…}}]`, con las
variables locales de cada marco). Si algún step tiene `cd ≥ 2`, `Sim` muestra «Saltar llamada» (primer paso
posterior con `cd ≤` el actual; también Mayús + →), «Salir de la función» (primer paso con `cd <` el actual),
«Ir al final» y un selector de velocidad (1×, 4×, 16×, 64×); el clic en la barra de progreso salta a esa parte.
El helper `Traza(snap, tip)` (en la sección de la clase 10 del apunte y en `/* ===== Guía · Backtracking ===== */`
de la página de ejercicios; copiado en los dos, no es parte del motor) arma esos steps:
`T.enter(fn, vars)` / `T.leave()` apilan y desapilan un marco **sin** emitir paso, `T.set(k, v)` / `T.vars({…})`
cambian las locales del marco de arriba y `T.push(line, msg, extra)` emite un step con `cd`, `frames` y lo que
devuelva `snap()` (copias de los vectores, nunca referencias). Reglas que cumplen todos los builders:
un step **por cada línea ejecutada** del panel, sin agrupar nada; el paso de la línea que llama se emite **antes**
de `enter` (con `cd` del que llama) y el de la línea que recibe el resultado **después** de `leave`, así que
«Saltar llamada» desde una línea de llamada cae justo en el paso del resultado; las condiciones con `Y`/`O`
se evalúan con cortocircuito, un paso por operando que se evalúa; el primer paso (llamada inicial) y el último
tienen `cd = 0`. Las funciones auxiliares sin pseudocódigo en la lámina (`Máximo`, `dentro`, `esVecina`) van
solo en el panel del simulador, como `cl hdr` con `data-l` ≥ 40, rotuladas «auxiliar propio»; los `pre.ps`
de la página no se tocan. `trazaPanel(st, prev)` dibuja la pila con las variables que cambiaron respecto del
paso anterior (`.tv.chg`, borde naranja) y `cellsChg(arr, prevArr, marks, base)` hace lo mismo con las celdas
de un vector (`.cell.chg`). El pseudocódigo no borra los restos de una rama abandonada (p. ej. `S[E+1]` en
Reinas): se muestran en gris, no se limpian. Tope: `TRAZA_MAX = 60000` pasos con un error visible.

Para algoritmos que llenan una **tabla** (Programación Dinámica) está `dpRender` / `dpTable`
(sección `CLASE 7` del script). Campos del step: `rows` (rótulos de fila), `cols` (cantidad de
columnas, rotuladas 0..cols-1), `M[i][j]` (copia en cada step; `undefined` = sin calcular,
`Infinity` = ∞), `cur=[i,j]` (celda en cálculo, naranja), `deps=[[i,j],…]` (celdas de las que
depende, celeste), `path=[[i,j],…]` (camino de reconstrucción, verde), más `corner`, `colLabels` (opcional: un rótulo por
columna en vez de 0..cols-1, p. ej. «3 · a» para rotular con el carácter de Y), `vlabel`, `vars`,
`extra`, `result`/`rcls`. Un step **sin `line`** no resalta nada: se usa para pasos que no
están en el pseudocódigo de la lámina (la reconstrucción top-down), para no inventar pseudocódigo.

### Cómo se escribe un builder

Se **ejecuta el algoritmo de verdad** y se va empujando un step por cada decisión relevante:
evaluación de condición, asignación, llamada recursiva, retorno. La granularidad correcta es
«un step por cada cosa que el alumno tiene que entender», no un step por línea ejecutada.

```js
Sim("sim-xxx", function(){
  const A = parseArr(document.getElementById("xxx-arr").value, [6,3,11,15]);
  const S = [];
  const push = (line, msg, marks) => S.push({line, msg, marks, arr: A.slice(), vlabel: "…"});
  push(1, "¿inicio &lt; fin? ¿0 &lt; 3? → <b>true</b>", {0:{cls:"act", p:"i"}});
  // …
  return S;
}, arrRender);
```

Reglas:

- `arr: A.slice()` — **copia** en cada step. Si se guarda la referencia, todos los pasos muestran
  el estado final.
- Los mensajes narran el *porqué*, con los valores concretos sustituidos. «¿S[4] = 8 ≤ S[6] = 12?
  → true, gana la izquierda» sirve; «se compara» no.
- Presupuesto de pasos: **30 a 200**. Si un vector de 8 elementos genera 400 pasos, hay que
  agrupar. Contar antes con un script de Node. **Excepción: Backtracking** (ver «Traza de ejecución»): ahí
  se muestra cada línea, también las auxiliares, y el alumno navega con los botones de salto.
- Valores por defecto: usar **los mismos ejemplos de las diapositivas** (`6,3,11,15,4,7,9,2` para
  Merge Sort, `6,5,3,11,9,7,15` para Quick Sort, `salas` para palíndromo). El alumno tiene que
  poder seguir la lámina en paralelo.
- Ofrecer botones de casos límite: «peor caso», «sin solución», palabra no palíndroma.

## Convenciones de contenido

Cada tema sigue la misma secuencia, que es la que pide la cátedra en los parciales:

1. **Estrategia** — tres `.def` dentro de un `.grid2`: caso base / subproblemas / combinación.
2. **Pseudocódigo** — `.card` con `<pre class="ps">`.
3. **Simulador**.
4. **Complejidad** — identificar tipo, a, b y k; escribir la recurrencia; comparar; y cerrar con
   un `.card` centrado con el resultado en un `.tag`.

Bloques disponibles:

- `.note` — advertencia u observación sobre el material («Ojo con este», «Dato para el parcial»).
- `.first` — razonamiento desde primeros principios: por qué la cosa es así, no solo qué es.
- `.grid2` + `.def` — definiciones en paralelo.
- `.chk` — checklist con checkboxes.

Cada clase cierra con: autoevaluación (8–10 preguntas de opción múltiple, con explicación en
`f` que enseñe algo aunque la respuesta sea correcta) y un resumen «para el parcial» con tabla
de resultados y lista de errores que cuestan puntos.

### Colores por clase de complejidad

Son semánticos, no decorativos. Se usan siempre igual:

| Clase | `.tag` |
|---|---|
| constante | `t-const` (verde) |
| logarítmica | `t-log` (celeste) |
| lineal | `t-lin` (violeta) |
| n log n | `t-nlogn` (magenta) |
| cuadrática / polinomial | `t-cuad` (naranja) |
| exponencial | `t-exp` (rojo) |
| factorial | `t-fact` (bordó) |

La paleta general viene de la identidad de UADE: navy `#0f1b2d` como tinta, naranja `#e2722a`
como acento interactivo, y la franja multicolor de las diapositivas en el sidebar. Serif para el
cuerpo, sans para títulos y UI, mono para código. **No agregar colores nuevos fuera de las
variables CSS.**

## Trampas conocidas

- **`new Array(n)` deja huecos** y `.map()` / `.forEach()` los saltean, así que el vector se
  renderiza vacío. Usar `new Array(n).fill(undefined)`.
- **Ids duplicados al fusionar**: hay que renombrar el atributo HTML *y* el `getElementById`
  correspondiente, juntos. Un arreglo parcial rompe el simulador en silencio.
- **`const esc` y la TDZ**: cualquier código que llame a `esc()` durante la carga tiene que estar
  después de su declaración en el `<script>`.
- **Ciclos sin cota en los pseudocódigos del PDF** (el `mientras S[k] <= p` de Pivot no tiene
  guarda explícita). Verificar terminación con Node antes de meterlo en un builder, o el
  navegador se cuelga al cargar la página.
- **Recursión mutua entre `si`/`sino`**: `a = 1`, no 2. Es el error conceptual que más se repite
  en la materia y el material lo señala en varios lugares; no contradecirlo por descuido en una
  explicación nueva.
- **Leer los PDF de las clases**: en esta máquina la tool Read no abre estos PDF (falta
  `pdftoppm` / librerías Python de PDF). Sí está `pdftotext` en `/mingw64/bin` (`pdftotext -enc UTF-8
  -layout archivo.pdf -`; sin `-enc UTF-8` los acentos salen rotos), pero los pseudocódigos, tablas
  y grafos son **imágenes**, así que el texto sale vacío justo en lo importante. Para verlos está
  **`pdf_imagenes.py`** en la raíz (solo `re` + `zlib`, sin dependencias):
  ```bash
  python -I pdf_imagenes.py Clase-07_2026-09-23.pdf <scratchpad>/c7                       # imágenes sueltas
  python -I pdf_imagenes.py Clase-07_2026-09-23.pdf <scratchpad>/c7 --componer --escala 2 # láminas con parches
  ```
  y después Read sobre los PNG (`--paginas 18,26` para elegir; `--escala 3` agranda el
  pseudocódigo chico).
- **Las láminas de pseudocódigo tienen parches pegados encima** (descubierto en la clase 7): la
  imagen base trae el error original y arriba hay rectángulos blancos, imágenes chicas y texto que
  lo corrigen a mano, y a veces dejan correcciones a medias. Las imágenes sueltas muestran la base
  *sin* parches y **se transcribiría un pseudocódigo que la diapositiva no muestra**. Siempre
  mirar con `--componer`. Los parches de *texto* no se dibujan (aparecen como recuadro blanco
  vacío): su contenido sale de `pdftotext -layout -f N -l N archivo.pdf -`. Ejemplo: en el Cambio
  de la clase 7 la base dice `d[j]` y `máx(longitud(d), v+1)`, los parches pasan a `d[i]` y
  `longitud(d), v+1` pero dejan dos `d[j]` sin corregir.
- **Finales de línea**: `index.html` y `prog3-ejercicios.html` están en **CRLF** (CLAUDE.md, en LF). Un bloque
  insertado por script con LF deja el archivo mezclado y el diff de git lo muestra entero; después de insertar,
  normalizar con `h.replace(/\r?\n/g, "\r\n")`. Un `Edit` de una sola línea no tiene el problema.
- **`:first-child` cuenta solo elementos**: el override `.note b:not(:first-child)` (para que los
  `<b>` del cuerpo de una nota vayan en línea y solo la etiqueta inicial vaya en bloque) trata como
  etiqueta a un `<b>` que sea el primer *elemento* de un `<li>`/párrafo aunque haya texto antes.
  Si un `<b>` en medio de una frase aparece partido en su propia línea, es eso: sacarle la negrita
  o poner antes un `<code>`. El override está en los dos HTML.
- **`offsetTop` en el autoscroll del pseudocódigo**: `.code` no es `position:relative`, así que `on.offsetTop` se mide contra el
  `body` y no contra el panel; el panel saltaba al fondo apenas el pseudocódigo desbordaba los 560 px (8 simuladores del apunte y 6 de
  la guía). `Sim` ahora ubica la línea con `getBoundingClientRect()` relativa a `[data-code]`. Si se toca el autoscroll, probar con un
  simulador de pseudocódigo largo (`sim-c11-mochila`, `sim-c12-asignacion`, `sim-g16`) y avanzar paso a paso: la línea `.on` tiene que
  quedar siempre dentro del panel. Ojo: en la guía los simuladores están dentro de `.sol` (`display:none`), hay que abrirla para medir.
- **Un error de la propia lámina en una tabla de ejemplo** (clase 7, Mochila: la celda (4, 6) dice
  13 y la regla da 15). Por eso los resultados de ejemplo se **recalculan** en Node y se comparan
  con la lámina antes de darlos por buenos; si difieren, el simulador calcula lo correcto y una
  `.note` explica la discrepancia.

## Estilo didáctico de los pseudocódigos de Backtracking (pedido de Damián)

Todos los Backtracking propios (procesadores —clases 10 y 11 y guía—, Atila, Subasta, Estaciones, Mochila
con cota; **el Laberinto ya no**: ver la excepción al final de esta sección) y las versiones didácticas de Reinas, Suma de subconjuntos y Partición se escriben así; el modelo son el
`Algoritmo AsignarTareas(T, m)` / `Procedimiento Buscar(…)` y el `ReinaValida(S, fila, columna)` que pasó Damián:
- **Todo por parámetro** (nada de variables globales implícitas) y **`ref` solo en lo que se reasigna**
  (`mejorS`, `mejorTiempo`, `mejorValor`…): `mejorS ← copiar(S)` dentro de la recursión se pierde si va por valor (se
  verificó con 3000 casos aleatorios: `mejorS` quedaba sin asignar). Los vectores que se tocan posición por posición no lo necesitan.
- **Nombres que dicen qué son**: `etapa`, `carga`, `tiempoActual`, `fila`, `columna`, `anterior`, `filaVecina`, `nuevaLongitud`,
  `incluir`, `sumaActual`… Índices desde 0 salvo que el enunciado fuerce otra base (Subasta usa productos y personas desde 1).
- **Una acción por línea**, cierres `Fin algoritmo` / `Fin procedimiento` / `Fin función`, y las auxiliares (`maximo`,
  `dentro`, `esVecina`, `CotaFraccionaria`) escritas completas como `Función`. Ya no son `cl hdr`: la cabecera de
  algoritmo/procedimiento/función **se ejecuta** (hay un paso «Entro a …») y las pruebas exigen que cada línea del panel se
  ejecute (los `fin …`, `sino` y comentarios quedan exentos). Una `O`/`Y` se evalúa de a un operando.
- El **marco de abajo de la pila** (el del `Algoritmo`) guarda S, carga, mejorS, mejorTiempo…: se mantienen al día con un
  `P(line, msg)` que sincroniza esos valores antes de cada `T.push` (son los mismos que ve `Buscar`).
- `S[etapa]` **no se borra al volver** si el pseudocódigo no lo borra: queda en gris (`c10Render`, `btProcRender`, `c11Render`).
  Para listar «qué procesador tiene qué tareas» el snapshot lleva `placed` / `placedIds` y el render ignora lo demás.
- **Reinas, Suma y Partición**: el apunte conserva el pseudocódigo **literal de la lámina** y agrega la **versión didáctica** (el
  `bloque-clase` muestra la didáctica, copiada literal del apunte con una `.note`). Reinas y Suma tienen el selector
  «Didáctica / Literal del PDF»: las dos versiones van **en el mismo `[data-code]`** (`Sim` captura las `.cl` una sola vez), la
  didáctica con `data-l` ≥ 200 y el literal con `data-l` < 200, y el builder del simulador pone `hidden` al grupo que no corre
  (hace falta `.cl[hidden]{display:none}`, ya agregado en los dos HTML). Builders: `c10QueensDid` y `c10SubsetsDid`;
  `c10Queens(n, literal)` y `c10Subsets(A, t, literal)` siguen en el script (con `literal=false` es el «corregido» viejo, que
  solo usan las pruebas). `c10Partition` pasó a ser la didáctica, sin selector: el literal con su parche hace lo mismo.
- Si cambia un pseudocódigo didáctico del apunte hay que actualizar sus copias del `bloque-clase` (c11 Reinas, c12 Suma, c13
  Partición, c14 procesadores con cota, c15 Mochila) y los `pre.ps` de la guía (`ej-g15`…`ej-g17`, `ej-s2`, `ej-s4`).
- Pruebas: `clase10.test.cjs` y `clase11.test.cjs` aceptan rangos de líneas por modo; `guia-backtracking.test.cjs` e
  `integracion2.test.cjs` tienen actualizadas las líneas «que tienen que resaltarse» y los pasos esperados;
  `clase10.browser.cjs` usa `CHROME_PATH` y los valores de selector `didactico` / `literal`.
- **Excepción: el Laberinto (`ej-g16`) va con el pseudocódigo literal de la cátedra** (clase del 28/10, lámina 14), sin
  versión didáctica, porque Damián pidió «como está en el pdf del 28-10». Por eso **no** cumple las reglas de arriba:
  `sumaP` y `mejorSuma` no marcan `ref`, no hay `dentro` ni llamada inicial, el `sino` y el `fin si` están desparejos y la
  última línea suma en vez de restar. Cada rareza se explica en la `.note` de la sección y el simulador las ejecuta tal cual.
  La versión didáctica anterior (`Explorar`, `dentro`, `ref mejorCamino`, N/E/S/O, `O(n²·3^(n²))`) quedó en el historial de
  git (commit `75f2c76` y anteriores); si Damián la quiere de vuelta como en Reinas/Suma, el modelo es el selector
  «Didáctica / Literal del PDF» de arriba.

## Validación

```bash
PYTHONUTF8=1 python validate.py "apuntes interactivos/index.html"
PYTHONUTF8=1 python validate.py "apuntes interactivos/prog3-ejercicios.html"
```

(Sin argumentos, `validate.py` valida `apuntes interactivos/index.html` desde la raíz del proyecto.
Al segundo archivo hay que pasarle la ruta.)

Correr sobre **los dos** archivos: `validate.py` no toma varios de una, y tocar el `nav` o el
`.idx` de uno para linkear al otro puede romper un link interno del que se editó.

En esta máquina (Windows) `python3` no existe — dispara el alias de Microsoft Store. Usar
`python` a secas, y forzar UTF-8, porque la consola es cp1252 y `validate.py` imprime `✓`/`✗`
(`PYTHONUTF8=1`, como arriba).

Sin `PYTHONUTF8=1` tira `UnicodeEncodeError: 'charmap' codec can't encode character '✓'`
apenas imprime el primer `✓`, con un traceback que tapa el resultado real de la validación.

Chequea: un solo `<style>` y un solo `<script>`, cero recursos externos, ids únicos, links
internos que resuelven, `getElementById`/`querySelector` con elemento existente, simuladores con
sus cuatro `data-*`, `data-l` sin repetir dentro de un mismo simulador, balance de etiquetas,
antipatrones conocidos y `node --check` sobre el JS. Sale con código 1 si algo falla.

Lo que **no** chequea y hay que probar a mano en el navegador: que los pasos del simulador se
vean bien, que el resaltado caiga en la línea correcta y que el algoritmo dé el resultado
esperado. Antes de dar por cerrado un simulador nuevo, correr su lógica en Node contra una
implementación de referencia.

Para **ver** una sección con Chrome headless (`chrome.exe --headless=new --screenshot=<ruta absoluta
de Windows> --window-size=1500,<alto> <url>`; desde PowerShell, con rutas de Windows: desde Git Bash
el `--screenshot` con ruta relativa no escribe nada): el `#ancla` de la URL **no** scrollea a la
sección en la captura. Hay que generar una copia temporal del HTML (en el scratchpad) con un
`<style>` que oculte todo menos esa sección (`main>*{display:none!important}
main>#id{display:block!important}`) y ocultar el menú con `nav.toc{visibility:hidden}`, **no** con
`display:none`: el layout es una grilla y sin la columna del menú el contenido queda angosto. Para
ver un paso intermedio de un simulador, agregar un `<script>` que haga clic N veces en
`#sim-xxx [data-a=next]`. El `--dump-dom` con `--enable-logging=stderr` sirve para detectar errores
de consola.

## Estado actual

| Clase | Fecha | Temas | Simuladores |
|---|---|---|---|
| 1 | 05/08/2026 | Conceptos, operaciones elementales, notación asintótica, recurrencias, Divide y Conquista | factorial, AVL, algoritmos A/B/C, búsqueda binaria, palíndromo, calculadora de recurrencias, comparador de crecimiento |
| 2 | 12/08/2026 | Ejercicios de la guía, Selección, Inserción, Merge Sort, Quick Sort | estaOrdenada, potencia, punto fijo, selección, inserción, merge sort, quick sort, banco de pruebas |
| 3 | 19/08/2026 | Guía 4 (k-ésimo menor), Fibonacci y los límites de Divide y Conquista, técnica Greedy, Cambio, Mochila fraccionaria | QuickSelect, Fibonacci, esquema Greedy genérico, Cambio (con selector literal/corregido), Mochila fraccionaria |
| 4 | 26/08/2026 | Planificación de tareas con plazo fijo, minimizar tiempo de espera, Código de Huffman | planificación de tareas, minimizar espera, Huffman (árbol dinámico + cola de prioridad) |
| 5 | 02/09/2026 | Mezclado de Cintas, Problema del Mecánico (= minimizar espera), Grafos (dirigido/no dirigido), Dijkstra, introducción a Árboles de Recubrimiento | Mezclado de Cintas, Dijkstra (grafo dirigido editable, primer renderer SVG con aristas y flechas) |
| 6 | 05/09/2026 | Árboles de recubrimiento mínimo, Prim, Kruskal, dos ejercicios de aplicación (Dijkstra sobre capitales, árbol de recubrimiento máximo en un campus) | Prim (selector literal/corregido por el `Y NO` sobrante de la rama `sino`), Kruskal (selector literal/corregido por `E[a.destino]` releído, y selector mínimo/máximo; renderer SVG no dirigido + tabla `E[]`) |
| 7 | 23/09/2026 | Programación Dinámica (principio de optimalidad, los 4 pasos), Fibonacci, Cambio, Mochila 0/1; comparación contra Greedy | Fibonacci con PD (vector), Cambio con PD (tabla n × (v+1), selector literal/corregido por los `d[j]` que la lámina dejó sin corregir, reconstrucción y comparación con Greedy), Mochila 0/1 con PD (tabla n × (P+1), reconstrucción y comparación con Greedy por v/p); renderer nuevo `dpTable`/`dpRender` |
| 8 | 30/09/2026 | Repaso de PD (las tres síntesis), ejercicios de la guía PD 2 y PD 3 (resumen + link a `prog3-ejercicios.html`), qué es una subsecuencia, Subsecuencia común más larga (LCS) | LCS (tabla (m+1) × (n+1) con rótulos de columna `colLabels`, X e Y dibujados con `cells`, reconstrucción con desempate «subir» que también muestra la otra LCS posible; sin selector literal/corregido porque la lámina no tiene errores que rompan) |
| 9 | 07/10/2026 | Repaso de la LCS, ejercicio «Preparación física de la selección» (PD), Algoritmo de Floyd, ejercicio «Centro logístico óptimo» | Preparación física (Mochila con hasta 2 sesiones, tabla n × (C+1), reconstrucción y comparación con «a lo sumo 1 sesión»), Floyd (matriz n × n con `colLabels`, pivote k en verde, 84 pasos con el grafo de la lámina), Centro logístico (R con una columna extra «máx», A como `extra` en el primer paso); sin selector literal/corregido: el pseudocódigo de Floyd no tiene errores que rompan |
| 10 | 14/10/2026 | Repaso de Floyd, Backtracking, N reinas, suma de subconjuntos, partición en mitades, tareas a procesadores | Reinas (tablero SVG, versiones didáctica/literal), suma (decisiones 0/1, modos corregido/literal), partición (conjuntos etiquetados), procesadores (cargas y mejor asignación) |
| 11 | 21/10/2026 | Backtracking con cotas: cota inferior/superior, Greedy (LPT) como cota inicial, procesadores con cota, Mochila 0/1 con cota superior fraccionaria | Greedy de tareas, procesadores (con/sin cota inicial, comparación de nodos), Mochila (con/sin cota superior) |
| 12 | 28/10/2026 | Repaso de cotas, Problema del laberinto (pseudocódigo literal, árbol del ejemplo, `O(3ⁿ)`), Asignación de tareas con matriz de costos (BackTareas, COSTO_MIN_RESTANTE, CALCULAR_SOLUCION_INICIAL; `O(nⁿ)` / `O(n!)`) | Laberinto (tablero SVG rectangular, traza con pila de llamadas), Asignación de tareas (matriz de costos con `dpTable`, selector literal/corregido por el `mejor_asignacion` que la lámina no guarda) |

`index.html`: 42 simuladores, 83 secciones, 120 preguntas de autoevaluación (conteo de `validate.py`). A partir de la clase 7
el quiz reparte la respuesta correcta entre las cuatro posiciones (los de las clases 1–6 la tienen
casi siempre en la segunda).

**Clase 8** (`clase8`, secciones `repaso-c8`, `ejercicios-c8`, `subsecuencia`, `lcs`, `quiz-c8`,
`chuleta-c8`; sim `sim-lcs`, inputs `lcs-x`/`lcs-y`, máx. 8 caracteres alfanuméricos, se respeta
mayúscula/minúscula). El PDF lista «3 · Estrategia primer parcial» pero no trae láminas de ese punto:
Damián aclaró que se refiere a lo ya hecho en el primer parcial, y se ignora. Los ejercicios PD 2 y
PD 3 de la lámina «Problemas a resolver» ya estaban resueltos con simulador en `prog3-ejercicios.html`
(`#ej-g13`, `#ej-g14`), así que en el apunte van como resumen con recurrencia, un ejemplo numérico y
la complejidad, con link (decisión de Damián), sin pseudocódigo ni simulador duplicados. Los ejemplos
numéricos del texto (PD 2 = 120 con Greedy en 110; PD 3 = 33) y los de la LCS (3 «abd» / 4 «abac»;
BCDB con índices {2;3;5;7}) se verificaron en Node. Observaciones en `.note`: la definición de
subsecuencia de la lámina 13 sale sin la `k` («siendo <= m») y sin los puntos suspensivos en
`{z1; z2; ; zk}` e `{i1; i2; ; ik}` (se transcribe tal cual); el pseudocódigo numera los caracteres
desde 1 (`X[i]` con `i` hasta `longitud(X)`) pero la tabla desde 0; la lámina de la tabla de ejemplo
deja vacías las filas `a` y `c` (el apunte las completa). Estos huecos de la definición se leyeron de
la capa de texto del PDF, no de la lámina renderizada: si en la diapositiva se ven bien, es un
artefacto de la extracción y hay que sacar esa `.note`.

**Clase 9** (`clase9`, secciones `repaso-c9`, `fisica`, `floyd`, `centro-logistico`, `quiz-c9`,
`chuleta-c9`; sims `sim-fisica` (inputs `fis-r`/`fis-c`/`fis-cmax`, hasta 5 actividades y C ≤ 30),
`sim-floyd` (input `flo-edges`, formato `a-b:peso` como Dijkstra, hasta 5 nodos para quedar dentro de
200 pasos) y `sim-centro` (input `cen-edges`, hasta 6 nodos)). Globales nuevos del script: `parseDirW`
(aristas dirigidas → matriz con 0 en la diagonal y ∞ donde no hay arista), `floydPuro` (Floyd sin
pasos, lo usa `sim-centro`) y `fisFmt`. La agenda del PDF es: repaso de la LCS (láminas 3–5, nada
nuevo), «Resolución ejercicios» = Preparación física (lám. 6, enunciado en imagen), Floyd (7–21) y
«Ejercicio sobre Floyd» = Centro logístico (lám. 23). Decisiones y observaciones:
- **Preparación física no está en la guía** ni en `prog3-ejercicios.html`: se resuelve en el apunte,
  a la vista. La lámina no trae números, así que el ejemplo (r = 10,20,50,50; c = 10,5,10,5; C = 20 →
  155; sin la 2.ª sesión sería 120) es **propio** y la sección lo dice. El enunciado no dice que las
  cargas sean enteras: se asume `cᵢ` múltiplo de 5 para que `1,8·cᵢ` lo sea (el simulador redondea
  y avisa). Las mejoras se guardan en décimas (`2,1·r` = 21·r/10) para no arrastrar punto flotante.
  Pseudocódigo **propio**, caso por caso, como el de PD 1–3.
- **Floyd** transcribe literal la lámina 19 (con `VerticesK/I/J`). La lámina del ejemplo solo
  llega a M₁; M₂…M₅ las calcula el apunte (cambios: k=2 (1,3)=5; k=3 (1,4)=11, (2,1)=5, (2,4)=9; k=4
  nada; k=5 (1,4)=5, (2,4)=3) y se verificaron en Node contra Dijkstra desde cada nodo (3000 grafos).
  **La diagonal cuenta como arista de peso 0**, porque la lámina evalúa en k=1 las filas `i=k` y las
  columnas `j=k` (`peso(1,1)+peso(1,j)`): con ese modelo el guardia pasa 42 de 125 veces y se escribe
  en R 8 veces (5 caminos nuevos + 3 mejoras). Si se excluye la diagonal del guardia el resultado es
  el mismo pero el conteo da 18, y no coincide con lo que muestra la lámina. Las láminas 15–17 traen
  la celda (3,5) en 7 en la imagen base y el parche la corrige a 6 (otra vez: mirar con `--componer`).
- **Centro logístico**: el «costo máximo hacia» es el máximo de la **fila** de R (en la lámina 5 / 9 /
  12 → centro 1; por columnas daría otra cosa). Pseudocódigo propio sobre el Floyd de la lámina; un
  centro con ∞ queda descartado (`menorMaximo ← ∞` y `<` estricto).
- La trampa de `.note b:not(:first-child)` volvió a aparecer en esta clase (dos `<li>` de una `.note`
  que arrancaban con `<b>`): no empezar un `<li>` de una `.note` o `.first` con negrita.

**Clase 10** (`clase10`, secciones `repaso-c10`, `backtracking-c10`, `reinas-c10`, `suma-c10`,
`particion-c10`, `procesadores-c10`, `quiz-c10`, `chuleta-c10`). Cuatro simuladores `sim-c10-*`,
con builders puros `c10Queens`, `c10Subsets`, `c10Partition`, `c10Processors` y renderer `c10Render`.
No se modifica el contrato de `Sim`. N entre 1 y 8, vectores de 1–6 enteros seguros (también su
suma absoluta debe ser segura), procesadores entre 1 y 3, duraciones no negativas. Las entradas
inválidas se informan en el simulador, sin reemplazarlas silenciosamente. Puntos importantes:
- Reinas: filas/columnas desde 0; el literal empieza S[E] en 0 y omite la columna 0. El corregido
  empieza en −1. La búsqueda corta en la primera solución; N = 8 produce 12210 pasos (versión didáctica; el literal, 11037)
  (sin agrupar nada: `ReinaValida` se ejecuta línea por línea con su propio marco, `i`, `S[i]`, `|S[i] − S[E]|`,
  `|i − E|`). `S` conserva los restos de las ramas abandonadas, que se ven en gris. El tablero marca la
  candidata (borde punteado), las rechazadas (×) y la comparación en curso (línea celeste, roja si hay ataque).
- Suma: índices visibles 1…n para respetar `etapa = tamaño(v)`. El literal usa `< m`; el corregido
  usa `≤ m` y desactiva la poda por exceso si hay negativos. En {5,3,2,6,1,4}, objetivo 6, da cuatro
  soluciones; el literal solo {2,4}. Se explica el cierre de `si` que falta y el paso por valor
  del acumulador. Los ceros, el subconjunto vacío y las posiciones repetidas se conservan.
- Partición: se transcribe el parche de texto de la página 38, `S, E+1, v`. Se recalculan las
  sumas en cada hoja como en el PDF, se conservan ambas etiquetas y se explica Θ(n·2ⁿ), frente
  al O(2ⁿ) publicado. La representación no exige grupos no vacíos, como el algoritmo de la lámina.
- Procesadores: pseudocódigo y ejemplo propios (tareas 2,3,4,5; m=2 → óptimo 7). Se minimiza la
  carga máxima, restaurando cargas al volver; se copia la primera solución óptima. La poda usa
  cargas no negativas y descarta ramas cuya carga máxima parcial no puede mejorar lo guardado.
- CSS nuevo `.c10-*` copiado en ambos HTML. Los ejercicios de Backtracking de la guía están en
  `prog3-ejercicios.html` (bloque `bloque-bt`, ver más abajo).
- Pruebas reproducibles: `node tests/clase10.test.cjs`, además de `validate.py` sobre ambos HTML.
  Las pruebas comparan los builders reales con enumeración exhaustiva, verifican modos literales,
  casos límite, validación de entradas, snapshots independientes y el HTML de cada paso.
  `node tests/clase10.browser.cjs` usa Chrome headless y CDP (Node 22+, sin npm; `CHROME_PATH`
  permite elegir el ejecutable) para probar navegación, controles, selectores, presets, errores,
  autoevaluación y la página de práctica; guarda capturas de escritorio/celular en el directorio
  temporal. Los ejemplos de la clase 10 generan 12210 / 435 / 924 / 462 pasos (Reinas didáctica / suma / partición / procesadores) y los de la clase 11 47 / 500 / 339 (Greedy / procesadores con cota / mochila con cota). Las secciones de la clase 10
  caben en 390 px; algunas tablas de clases anteriores ya desbordaban ese ancho.
- `pdf_imagenes.py --componer` omite imágenes con coordenada vertical menor a 40, incluso imágenes
  grandes (páginas 10, 38 y 39 de esta clase; en `Clase-28-10-2026.pdf` pasa con las láminas 13–15, el pseudocódigo del
  Laberinto: salen en blanco). Al inspeccionarlas, excluir solo logos pequeños:
  condición `cm[5] < 40 and cm[3] < 40`, usando una copia temporal o adaptación en memoria del helper.
  Completar siempre los parches de texto con `pdftotext`.

**Clase 12** (`clase12`, secciones `repaso-c12`, `laberinto-c12`, `asignacion-c12`, `quiz-c12`, `chuleta-c12`; sims
`sim-c12-laberinto` —inputs `c12-lab-mapa`/`c12-lab-o`/`c12-lab-d`— y `sim-c12-asignacion` —`c12-asig-costos` y el selector
`c12-asig-modo` literal/corregido—; CSS `.c12-*` solo en el apunte, más `.t-fact`). Fuente: `Clases/Clase-28-10-2026.pdf` (24 láminas:
repaso de cotas 3–9, laberinto 8–15, asignación de tareas 16–23; la 4 es un separador y la 19 es vectorial, su texto sale de `pdftotext`).
- **Laberinto**: es el mismo código que `ej-g16` (decisión de Damián: simulador propio en el apunte). El JS se **generó por script**
  renombrando `bt*` / `LAB_*` → `c12*` / `C12_*` desde `prog3-ejercicios.html`, y `tests/clase12.test.cjs` exige que los dos den
  **exactamente los mismos pasos** (JSON idéntico en ~700 laberintos al azar): un cambio en uno hay que hacerlo en el otro.
  `.c12-maze` es `.bt-grid` renombrado. Pseudocódigo, 7 rarezas, árbol y complejidad: ver «Bloque Backtracking» (`ej-g16`).
- **Asignación de tareas**: pseudocódigos **literales** de las láminas 20–22 (BackTareas 1–23, COSTO_MIN_RESTANTE 24–37,
  CALCULAR_SOLUCION_INICIAL 38–58; `data-l` = número visible; 99 = corrección propia, oculta salvo en «Corregido»), con sus erratas
  («entrero», `y salir =falso`). Builders puros `c12Assign(M, literal)`, `c12Bound(M, usado, desde | lista de tareas)`,
  `c12InitialSolution`, `c12ParseCosts` (cuadrada de 2×2 a 5×5, enteros 0–99, filas = personas, columnas = tareas) y el renderer
  `c12AssignRender` sobre `dpTable`. Un paso por línea, salvo el `para persona` de COSTO_MIN_RESTANTE (líneas 30–34, una vez por columna) y
  el `para i … usado[i] ← falso` de la solución inicial. Pasos del ejemplo: **588** (literal) / 589 (corregido).
  Ejemplo de la lámina 19: matriz 4×4, `lim` inicial 73 (la diagonal), cota de la raíz 58, óptimo **61** = tarea1→a, 2→d, 3→b, 4→c; 23
  llamadas, 2 hojas, 11 podas. Observaciones (todas en `.note`): (1) el árbol de la lámina es **por personas** y BackTareas va **por
  tareas**; (2) la lámina rotula `lim = 73 64 61`, la ejecución da **73 → 69 → 61** (también con la matriz transpuesta);
  (3) **`mejor_asignacion` no se asigna nunca si la inicial ya es la óptima** (`<` estricto, y CALCULAR_SOLUCION_INICIAL solo devuelve el
  valor): de ahí el selector y los presets «La asignación inicial ya es óptima» y «Todo empata»; (4) la lámina 23 dice «k no influye» pero
  cada nodo paga `O(n²)`: lo esperado es `O(nⁿ)` / `O(n!)` y la nota lo matiza (`O(n²·n!)`). Las 14 cotas del árbol de la lámina 19
  (60, 58, 65, 78, 68, 61, 66, 68, 59, 64, 69, 61, 64, 65) se recalcularon y coinciden. **La cota es el mínimo por *tarea* entre las personas
  libres**, así que la matriz transpuesta **no** las reproduce (se probó y daba 55 en vez de 60): por eso `c12Bound` acepta una lista de tareas.
- Quiz de 10 preguntas (respuesta correcta 2/3/3/2 por posición), chuleta y `srcnote`. Hero: 12 clases · 42 algoritmos · 120 preguntas.
- Pruebas: `node tests/clase12.test.cjs` (laberinto contra enumeración, Bellman-Ford, réplica literal con la fórmula exacta de pasos y la
  paridad con la guía; asignación contra permutaciones en 400 matrices × 2 modos con el mismo conteo de pasos, el ejemplo, la diagonal
  óptima, presets, quiz y los árboles estáticos del HTML). Se verificó por mutación (poda `<=`, dirección invertida, hueco «arreglado» en
  modo literal, un texto distinto al de la guía). `tests/clase10.browser.cjs` ahora espera 12 `.classbar` y recorre los dos simuladores,
  el selector, los errores, el quiz y el ancho de 390 px.
- **Trampa del PRNG** de las pruebas: el congruencial `seed % n` es periódico en los bits bajos (`rand(4)` caía siempre en el mismo valor
  y la cobertura daba 0/400/399). `clase12.test.cjs` usa los bits altos (`seed/2³²·n`); `clase10`, `clase11` y `guia-backtracking` siguen con `% n`.

**Sección `estrategia-parcial`** (clase 7, sin simulador propio): cómo escribe la profesora la
estrategia de PD en el parcial (fotos de pizarra del Cambio y de la mochila con hasta 3 unidades).
Receta de 6 ingredientes, el Cambio en base 0 con `denom[i]` y términos rotulados («no la uso» / «sí
la uso»), la Mochila 0/1 y Fibonacci en el mismo formato, cómo se generaliza a «hasta k unidades»,
cómo plantearla ante un problema nuevo y checklist. El preset «orden {4, 6, 1} (pizarra)» de
`sim-cambiopd` reproduce el ejemplo de la foto.

**Dónde va cada cosa** (pedido de Damián): el **apunte** (`index.html`) queda *todo resuelto y a la
vista*, como el resto de las clases. Los **ejercicios para practicar**, con enunciado → pistas →
botón «Ver la resolución», van en `prog3-ejercicios.html`. No poner botones de «ver resolución» en el
apunte.

### `prog3-ejercicios.html`

Página aparte con **42 ejercicios**: Guía de Ejercitación (Divide y Conquista 1–4, Greedy 1–4,
Grafos 1–3, **Programación Dinámica 1–3**, **Backtracking 1–3**) y Ejercicios de Integración del
primer parcial (1, 2, 5, 6, 7, 8 — el PDF de la cátedra no trae el 3 ni el 4), más —en este orden,
antes del mapa de reconocimiento— **13 problemas de clase** (`bloque-clase`: los 12 de la hoja más el
`c16` de la clase 12) y los **6 ejercicios de
integración del segundo parcial** (`bloque-integ2`). Ya no es solo «primer parcial»: PD, Backtracking
y Floyd entran en el integrador (11/11/2026). Con el bloque de Backtracking la guía queda completa;
la teoría está en las clases 10, 11 y 12 del apunte. Hero: «42 ejercicios · 29 simuladores aquí + 13 en
el apunte» (los 13 problemas de clase no tienen simulador propio: enlazan al del apunte).

Fuentes de los bloques nuevos, en `ejercicios/` (sin trackear al escribir esto):
`Progra3-Ejercicios-desde-PD.pdf` (la hoja de práctica «desde PD en adelante»: **Parte A** = 15
problemas de clase numerados 1–15, **Parte B** = las 6 consignas de integración; hay una copia idéntica
en `apuntes interactivos/`) y `Ejercicios de Integración práctica segundo parcial.pdf` (es **solo
texto**: `pdf_imagenes.py --componer` da páginas en blanco, y los símbolos matemáticos del ejercicio 5
salen como `�` con `pdftotext`; se reconstruyeron por contexto, y la hoja de práctica trae el texto
limpio).

**Bloque Backtracking** (`bloque-bt`, `ej-g15`…`ej-g17`, `sim-g15`…`sim-g17`; los enunciados son
**imágenes** en la pág. 6 de la guía: leer las imágenes sueltas, `pdf_imagenes.py --paginas 6` sin
`--componer`; la vista compuesta omite el ejercicio 1 — sin verificar, probablemente por la regla de
`cm[5] < 40` de la clase 10). Procesadores (la mejor; mismo pseudocódigo que la clase 10,
simulador propio; `O((m+n)·mⁿ)`), Laberinto (la mejor; **resuelto como en la clase del 28/10**, ver abajo;
`O(3ⁿ)` con n = celdas) y Caballo de Atila (una; se corta al cerrar; `O(3^(n²))`). Decisiones y observaciones:
- El enunciado del laberinto sale **cortado a la derecha** en el PDF («ur…», «i…», «dadas,»): se
  transcribió completando las palabras y una `.note` lo avisa. Atila **no trae números**:
  pseudocódigo y ejemplos propios (lo dice su `.note`). El de Atila supone que la entrada es el
  jardín con las casillas pisadas marcadas; con `k < 4` devuelve falso (con 2 casillas contiguas
  `esVecina` daría verdadero, pero se pisaría dos veces cada una).
- **Laberinto = `Clase-28-10-2026.pdf`, láminas 9–15** (la clase completa está en el apunte como **clase 12**, con
  este mismo simulador copiado: ver «Clase 12» más arriba; la `.note` de esta sección linkea a `index.html#laberinto-c12`). Pseudocódigo **literal**
  de la lámina 14 (41 renglones, `data-l` = número visible; los `fin …` y el encabezado no se resaltan), con `Celda`
  (`valor, arriba, abajo, izq, der`) y `Posicion` de la 13. Está en una imagen **grande** que `pdf_imagenes.py
  --componer` descarta (`cm[5] < 40`): se leyó con una copia con `cm[5] < 40 and cm[3] < 40`, y se confirmó que las
  páginas 14 y 15 traen la misma imagen sin parches. Ejemplo de la lámina 10: laberinto de **3×4**, origen (2,1),
  destino (3,4); las paredes se leyeron **del píxel** de la imagen (hay pared entre (1,2)|(1,3), (2,1)|(2,2),
  (3,2)|(3,3) y bajo (1,4); la entrada verde está a la izquierda de (2,1) y la salida abajo de (3,4), y no son
  movimientos). Orden de exploración: arriba, abajo, izq, der. Ejecutado así da **mejorSuma = 18**, 17 llamadas,
  13 podas por visitado y 3 por mejor solución, y el camino (2,1)→(1,1)→(1,2)→(2,2)→(2,3)→(3,3)→(3,4). **La lámina 10
  rotula «mejorSol = 20 / 17»**: son las sumaP de (2,4) y (3,3) sin el valor del destino (con destino (2,4) da 20 y con
  (3,3) da 17: hay presets). También dibuja como podas por mejor solución a (3,2)=17 y (1,3)=21, que con ese orden
  todavía se exploran. Todo eso está en una `.note` y el árbol real (generado por script, no a mano) va en un `<pre>`.
  Complejidad de la lámina 15: caso resta, a = 3, b = 1, k = 0, `O(3ⁿ)` con n = cantidad de celdas; una `.note`
  dice que no cuenta el `copiar(resultado, visitado)` (cota `O(n·3ⁿ)`).
- Laberinto, datos: longitud = suma de los valores **incluidos origen y destino**; los booleanos no tienen por
  qué ser simétricos (pasajes de un solo sentido, dibujados con ▶). Entrada de texto: filas separadas por
  `/`, casillas por espacios, `valor` + símbolos **`^ v < >`** (arriba, abajo, izq, der; `3v>`); filas y columnas desde
  1; hasta 4×4 y **no hace falta que sea cuadrado**. Un booleano que apunta afuera del tablero es un **error de
  entrada** (el pseudocódigo no revisa bordes: `visitado[i-1][j]` se saldría). El simulador acepta valor 0. Se
  aclara en una `.first` que el mismo problema es Dijkstra (polinomial).
- Atila: `#` pisada / `.` pasto, cuadrado de 2×2 a 5×5. La paridad (k impar ⇒ sin recorrido) y el grado
  < 2 se explican como poda extra pero **no** están en el pseudocódigo. El 4×4 completo tiene 6 ciclos.
- Builders puros `btProcesadores`, `btLaberinto`, `btAtila` + parseo, renderers `btProcRender` /
  `btMazeRender` / `btAtilaRender` (SVG compartido `btFrame`) y `btGuard`, entre los marcadores
  `/* ===== Guía · Backtracking ===== */` y `const btProcSim=`. Los tres usan la traza (`Traza`, `TRAZA_MAX = 60000` con error visible: el jardín 5×5 sin pasto
  lo alcanza). Pasos de los ejemplos: 462 / **303** / 2796. Cada línea es un paso, también las auxiliares propias
  `Máximo` (Procesadores) y `dentro` / `esVecina` (Atila); en Procesadores y Atila las condiciones con `Y` se evalúan
  de a un operando. **En el Laberinto cada `Si … Y …` es un solo paso** (la lámina lo escribe en una línea) cuyo mensaje
  distingue pared, «poda por visitado» y factible. La vecina que se mira se dibuja con borde
  celeste punteado (`.sq.look`). El test `guia-backtracking.test.cjs` exige que cada línea del panel que
  importa se ejecute, que `cd`/`frames` sean coherentes y que ninguna línea concentre más del 60 % de los pasos.
  Laberinto: `btParseLab` (rectangular), `LAB_DIRS` (orden del pseudocódigo), `btFrame(filas, rótulo, interior,
  columnas)` generalizado a rectángulos (el jardín lo sigue llamando con un solo lado), el marco inferior no existe:
  cada llamada es un marco `Laberinto` y `mejorSuma` se sincroniza en todos (va por referencia). `sumaP` es local
  (por valor), y la línea 40 de la lámina (`sumaP ← sumaP + valor`) se ejecuta tal cual y lo avisa. Los pasos tienen
  `stats {llamadas, podasV, podasM}` y las casillas del camino llevan su sumaP (`Σ`) para compararlas con la lámina.
- Ids: `g15-t`, `g15-m`, `g16-lab`, `g16-o`, `g16-d`, `g17-jardin`; presets con `data-bt-sim` +
  `data-bt-preset` (JSON con ids → valores). CSS `.bt-*` solo en esta página.
- Prueba: `node tests/guia-backtracking.test.cjs` (builders reales contra enumeración exhaustiva,
  Bellman-Ford y DP de ciclo hamiltoniano; valida también los presets escritos en el HTML, **desescapando
  `&lt;`/`&gt;`** porque el laberinto usa `<` y `>`). Para el laberinto hay además una **réplica literal e
  independiente** del pseudocódigo (`labLiteral`) que compara mejorSuma, llamadas, podas, la matriz `resultado` y la
  **cantidad exacta de pasos** (2 + por llamada 6 + …) en 700 laberintos aleatorios de hasta 4×4, más el ejemplo de la
  lámina (17/13/3, 18, sumaP del camino óptimo, y 20 / 17 con los destinos (2,4) / (3,3)). Se verificó por mutación
  (poda `<=`, abajo con `di:-1`) que la prueba falla. En vm,
  las comparaciones entre arrays/errores de dos realms fallan con `deepEqual`/`instanceof`: comparar
  por JSON o por mensaje.
- Falta una prueba de navegador como `clase10.browser.cjs`; la verificación visual se hizo con capturas
  de Chrome headless (sin errores de consola). En headless el ancho mínimo de ventana es 500 px.

**Bloque PD** (`bloque-pd`, `ej-g12`…`ej-g14`, `sim-g12`…`sim-g14`; los enunciados de la guía son
**imágenes** en la pág. 5 del PDF, se leen con `pdf_imagenes.py --paginas 5`): PD 1 El regalo de Darío
(menor gasto que cubre *al menos* X, 0/1, `Θ(n·X)`), PD 2 Las revistas de Howard (= Mochila 0/1,
`Θ(n·P)`), PD 3 De compras en el shopping (hasta 3 unidades; la 2.ª cuesta p−1 y la 3.ª p−2, o sea
costos acumulados p / 2p−1 / 3p−3; **es la mochila de la pizarra**, `Θ(m·K)`). Los tres en base 1,
con la recurrencia por casos en una tabla de 3 columnas (`M[i,j] =` · cuando · en criollo), cada
término rotulado, «leela término por término» y pseudocódigo propio (derivado de la estrategia; la
cátedra no publica uno). Observaciones en `.note`: PD 1 no dice cuántas unidades hay de cada
obsequio (se asume una; con stock ilimitado el término se quedaría en la misma fila); PD 3 necesita
p ≥ 2 (con p = 1 la 3.ª unidad costaría −1 y los rangos se pisan: 44 de 493 casos dan mal). Los
simuladores comparten `dpSteps` (esqueleto: inicializar, un paso por fila y por celda, y un `after`
con el devolver + reconstrucción sin línea); `dpTable`/`dpRender` están copiados del apunte.

**Bloque Problemas de clase** (`bloque-clase`, `ej-c1`…`ej-c15` **con la numeración de la hoja**, Parte A, y `ej-c16`):
existen `c1, c2, c3, c7, c8, c9, c10, c11, c12, c13, c14, c15` y `c16`. **`c16` no está en la hoja**: es la «Asignación de
tareas» con matriz de costos de la lámina 17 de la clase 12 (decisión de Damián: sumarla como práctica); sus tres pseudocódigos se
copiaron literal, por script, de las `.tx` de `sim-c12-asignacion` del apunte (**si cambian allá, actualizar acá**) y enlaza con
`data-apunte-sim="sim-c12-asignacion"`. El laberinto de la clase 12 no es un `c`: es `ej-g16` (guía, Backtracking 2), que ahora linkea a
`index.html#laberinto-c12`. Faltan c4–c6 porque son PD 1–3 de la guía
(`ej-g12`…`ej-g14`), y la parte de la clase 10 del c14 es `ej-g15`; una `.note` al principio del bloque lo
explica. Cada ítem: enunciado de la hoja → qué piden → razonamientos → «Ver la resolución» con estrategia
(`.grid2`/`.def`; en Backtracking los seis elementos), pseudocódigo, complejidad y un link «Ejecutalo paso a
paso» al simulador del apunte (atributo `data-apunte-sim`, que el test comprueba). **No hay simulador
propio ni JS nuevo**: decisión de Damián, para no duplicar código en dos lugares. Los pseudocódigos son
**copias literales** de los `<pre class="ps">` de `index.html` (con sus rarezas; las `.note` de cada
ítem las resumen y enlazan a la sección del apunte que las explica). El bloque se generó con un script que
extrae los `pre.ps` de `index.html` por id de sección y, en la clase 11 (donde el código vive dentro del
simulador), las líneas `.tx` de `sim-c11-greedy` y `sim-c11-procesadores`: **si cambia un pseudocódigo del
apunte hay que actualizar la copia de acá**. Resultados de los ejemplos, verificados en Node: Mochila
(c3) 18 con los objetos 1 y 4; Suma (c12) cuatro soluciones, {6}, {5,1}, {3,2,1} y {2,4}, y el literal solo
{2,4}; Partición (c13) una partición que sale dos veces por las etiquetas 1/2; Mochila con cota (c15) 62.

**Bloque Integración · Segundo parcial** (`bloque-integ2`, `ej-s1`…`ej-s6`, `sim-s1`…`sim-s6`, numeración
del PDF). **Ninguno trae pseudocódigo ni números**: todo es propio y cada `.note` lo dice. Los enunciados
se transcriben tal cual, con sus erratas («lo cuales», «en tiempo directa», «que valor»). Técnica y
decisiones:
- **s1 Almacenamiento** (PD, `Θ(n·D)`): Mochila 0/1 con valor = peso; es la contracara de `ej-i7`
  (allá, cantidad de archivos ⇒ Greedy; acá, espacio ocupado ⇒ PD), con links cruzados. Ejemplo propio
  S = 6,5,5,3, D = 10: PD 10; Greedy grande→chico 9 y chico→grande 8.
- **s2 Subasta** (Backtracking, la mejor, poda por cota superior, `O((m+n)·(m+1)ⁿ)`): «m personas que
  oferten por cada producto» se lee como m personas en total, con ofertas para algunos productos; S[e] =
  persona o «sin vender»; `cota[e]` suma la mayor oferta de cada producto que falta (sobreestima, por eso
  vale). Poda con `>` estricto y `mejorGanancia ← −1`. Ejemplo del enunciado: 13 (Z→A, X→B) en solo 14
  pasos, porque la cota poda casi todo; por eso el test pide ≥ 10 pasos para s2 y ≥ 30 para el resto.
  Por qué no Greedy (contraejemplo X: 8,7 / Y: 7,1 ⇒ 9 contra 14) ni PD (el estado serían subconjuntos
  de personas, 2ᵐ).
- **s3 Catálogo** (PD con repetición ilimitada, `Θ(n·P)`): «lo uso» se queda en la **misma fila**
  (`M[i, j − cᵢ] + cᵢ`), como el Cambio, pero maximizando lo gastado sin pasarse. Ejemplo c = 9,6,4 y
  P = 17: 17 contra 15 de Greedy.
- **s4 Estaciones** (Backtracking, la mejor, recorrido de exactamente K = m·n − X casillas,
  `O(K·4ᴷ)`): el enunciado se contradice en las guardas de bajar (`i < M` contra `i + 1 < M`); se usa
  `i < M`. La casilla de partida cuenta como visitada. Con estos 4 movimientos la columna nunca baja, así
  que **ninguna casilla se repite** (el oráculo del test lo comprueba), los recorridos miden como mucho
  `m + 2(n − 1)` casillas y un K mayor da «no existe»; también admite una PD `Θ(m·n·K)`, y una `.first` lo
  dice sin cambiar la respuesta de a) (Backtracking). Ejemplo propio 3×3, partida (1,1), X = 4 ⇒ K = 5,
  esfuerzo 15, 110 pasos. Tablero SVG rectangular `sFrame`.
- **s5 Ciudad base** (Grafos: Floyd como caja negra + suma de cada fila, `Θ(N³)`): −1 ⇒ ∞ y diagonal 0;
  costo ∞ ⇒ descartada; `<` estricto. Es el Centro logístico con **suma** en vez de máximo. Floyd no se
  reescribe (`floydPuro`, copiado del apunte). Ejemplo propio de 5 ciudades: gana la 1 con 21; la 4 no
  tiene salidas.
- **s6 Festival** (PD, hasta 2 proyecciones, `Θ(n·P)`): la 2.ª proyección **vuelve a sumar** la calificación
  (si no, nunca convendría) y el par cuesta c + c/2; costos **pares** o el simulador avisa en vez de
  redondear. Ejemplo r = 6,4,10, c = 8,6,4, P = 12: 24 contra 16 con una sola proyección.
- JS: entre `/* ===== Integración · Segundo parcial ===== */` y `const s1Sim=`; builders puros
  `s1Almacenamiento`, `s3Catalogo`, `s6Festival` (sobre `dpSteps`), `s2Subasta`, `s4Estaciones` (los dos con la traza;
  `s4` usa el auxiliar `dentro` y `s2` muestra `S`, `usada` y `cota` cambiando) y `s5CiudadBase`; parseo `sList`, `s2Parse`,
  `s4ParseMatriz`, `s4ParseCasilla`, `s5Parse`; renderers `sDpRender`, `s2Render` (reusa `dpTable`),
  `s4Render`, `s5Render`. Las entradas inválidas se informan (`btGuard` + `btError`), no se recortan. Presets
  con `data-s-sim` + `data-s-preset`. Inputs: `s1-s`/`s1-d`, `s2-ofertas` (filas por `/`, ofertas por espacios,
  `-` = no ofertó, hasta 4×4), `s3-c`/`s3-p`, `s4-m`/`s4-ini`/`s4-x` (hasta 4×4), `s5-a` (de 2×2 a 6×6),
  `s6-r`/`s6-c`/`s6-p`. Pasos por defecto: 56 / 123 / 66 / 1112 / 45 / 49.
- Prueba: `node tests/integracion2.test.cjs` (8000+ comprobaciones): builders reales contra oráculos
  independientes (subconjuntos, asignaciones inyectivas, sumas alcanzables, DFS y DP de recorridos,
  Dijkstra desde cada nodo, 3ⁿ elecciones), reconstrucciones válidas, entradas inválidas, presets del HTML,
  pasos por defecto, que cada `line` exista como `data-l`, **que cada link `index.html#…` y cada
  `data-apunte-sim` de la página exista como id en el apunte** (`validate.py` no revisa links entre archivos)
  y, solo para s2 y s4, que ninguna línea concentre más del 60 % de los pasos (y que `cd`/`frames` sean coherentes) (en los simuladores de tabla
  y en el posproceso de s5 el ciclo interno es el algoritmo). Chrome headless con un arnés que abre todas las
  resoluciones, avanza cada simulador y aprieta los 24 presets: 29 `Sim`, cero errores de consola.

Cada ejercicio tiene la misma secuencia: **enunciado textual** (`.enun`) → **«qué te están
pidiendo»** en lenguaje natural → **razonamientos guiados** (`ol.razon`, preguntas con un empujón,
sin spoilear) → botón **«Ver la resolución»** (`button.rev` togglea `.sol.show`) que revela
estrategia con sus elementos, pseudocódigo y un **simulador propio** (`sim-g1`…`sim-s6`, 29 en
total; los problemas de clase lo enlazan del apunte) con el ejemplo del enunciado, más la complejidad. Botón «Abrir todas las resoluciones» en
el hero. Los subtítulos usan las letras que pide cada PDF (guía a/b/c, integración a/b/c/d).

Reutiliza, copiados del apunte: `Sim`, `esc`, `parseArr`, `cells`, `arrRender`, los helpers de
grafos y el IIFE de navegación. Agrega: `parseChars`, `parseDir`, `layoutCirc`, `dijkstraSteps`
(núcleo de Dijkstra compartido por g9/g10/i8), `dirGraphSVG`, `undGraphSVG`, `actividadesBuilder`
(compartido por i1/i5), `esperaBuilder` (compartido por g6/g8). CSS nuevo al final del `<style>`:
`.exbar`, `.enun`, `ol.razon`, `.sol`, `.t-fact`, y un override de `.note b`/`.first b` para que
solo la etiqueta inicial vaya en bloque.

Verificación de esta sesión (scripts en el scratchpad): `verif.js` corre cada algoritmo contra
los resultados de los PDF y contra fuerza bruta en 200–300 casos aleatorios; `simharness.js`
extrae el `<script>`, stubbea el DOM y ejecuta los 17 builders + sus renderers contra varios
presets, chequeando resultado, cantidad de pasos (30–200) y que no se filtre `undefined`/`NaN` al
HTML. Smoke test final con Chrome headless (`--dump-dom` / `--screenshot`): sin errores de
consola, los 17 `Sim` construyen y pintan el paso 1.

Observaciones que van en `.note` dentro de cada ejercicio (enunciados que no se corrigen en
silencio): i1 define «compatibles» con `>` pero con intervalos `[c, f)` lo correcto es `≥`; i5 es
la trampa del pago único (maximizar ganancia = maximizar cantidad, si no sería Prog. Dinámica);
i6 «inmediato inferior» es estrictamente menor; i7 pide cantidad de archivos, no espacio usado; i8
da velocidad por tramo, no tiempo (tiempo = longitud / velocidad). Pares con la misma resolución,
cruzados con link: g6/g8 (mecánico = minimizar espera) e i1/i5.
