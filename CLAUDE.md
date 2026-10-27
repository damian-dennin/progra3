# Apunte interactivo — Programación III (UADE)

Guía de estudio de un solo archivo para Diseño y Análisis de Algoritmos. Cada clase de la
cursada se agrega como un bloque nuevo al final del mismo HTML. El objetivo del material es
aprobar los parciales: primer parcial 16/09/2026, integrador 11/11/2026.

## Archivos

| Archivo | Qué es |
|---|---|
| `apuntes interactivos/index.html` | El apunte de la teoría de la cursada. Una clase por bloque. (Antes se llamaba `prog3-apunte.html` y vivía en la raíz; en esta máquina la carpeta es `apuntes interactivos/`, con espacio, así que las rutas van entre comillas.) |
| `apuntes interactivos/prog3-ejercicios.html` | Los ejercicios de la Guía y de Integración (Divide y Conquista, Greedy, Grafos, Programación Dinámica), con la resolución tapada tras un botón. Mismo motor y CSS que el apunte, archivo aparte. |
| `validate.py` | Validación estructural. Correr sobre **los dos** HTML después de cada cambio. |
| `pdf_imagenes.py` | Extractor de imágenes de los PDF de las clases (`Clase-NN_fecha.pdf`, en la raíz). Ver «Trampas conocidas». |
| `CLAUDE.md` | Este archivo. |

Los PDF de las clases están en la raíz (`Clase-01_2026-08-05.pdf` … `Clase-09_2026-10-07.pdf`); los
enunciados de la cátedra en `ejercicios/`.

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
  agrupar. Contar antes con un script de Node.
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
- **`:first-child` cuenta solo elementos**: el override `.note b:not(:first-child)` (para que los
  `<b>` del cuerpo de una nota vayan en línea y solo la etiqueta inicial vaya en bloque) trata como
  etiqueta a un `<b>` que sea el primer *elemento* de un `<li>`/párrafo aunque haya texto antes.
  Si un `<b>` en medio de una frase aparece partido en su propia línea, es eso: sacarle la negrita
  o poner antes un `<code>`. El override está en los dos HTML.
- **Un error de la propia lámina en una tabla de ejemplo** (clase 7, Mochila: la celda (4, 6) dice
  13 y la regla da 15). Por eso los resultados de ejemplo se **recalculan** en Node y se comparan
  con la lámina antes de darlos por buenos; si difieren, el simulador calcula lo correcto y una
  `.note` explica la discrepancia.

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
| 10 | 14/10/2026 | Repaso de Floyd, Backtracking, N reinas, suma de subconjuntos, partición en mitades, tareas a procesadores | Reinas (tablero SVG, modos corregido/literal), suma (decisiones 0/1, modos corregido/literal), partición (conjuntos etiquetados), procesadores (cargas y mejor asignación) |

`index.html`: 37 simuladores, 83 secciones, 100 preguntas de autoevaluación. A partir de la clase 7
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
  empieza en −1. La búsqueda corta en la primera solución; N = 8 produce 115 pasos. Los rechazos
  y retrocesos consecutivos se agrupan en el relato sin cortar la búsqueda ni borrar resultados.
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
  temporal. Los cuatro ejemplos generan 115 / 58 / 64 / 28 pasos. Las secciones de la clase 10
  caben en 390 px; algunas tablas de clases anteriores ya desbordaban ese ancho.
- `pdf_imagenes.py --componer` omite imágenes con coordenada vertical menor a 40, incluso imágenes
  grandes (páginas 10, 38 y 39 de esta clase). Al inspeccionarlas, excluir solo logos pequeños:
  condición `cm[5] < 40 and cm[3] < 40`, usando una copia temporal o adaptación en memoria del helper.
  Completar siempre los parches de texto con `pdftotext`.

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

Página aparte con **23 ejercicios**: Guía de Ejercitación (Divide y Conquista 1–4, Greedy 1–4,
Grafos 1–3, **Programación Dinámica 1–3**, **Backtracking 1–3**) y Ejercicios de Integración del
primer parcial (1, 2, 5, 6, 7, 8 — el PDF de la cátedra no trae el 3 ni el 4). Ya no es solo «primer
parcial»: la PD entra en el integrador (11/11/2026). Con el bloque de Backtracking la guía queda
completa; la teoría está en las clases 10 y 11 del apunte.

**Bloque Backtracking** (`bloque-bt`, `ej-g15`…`ej-g17`, `sim-g15`…`sim-g17`; los enunciados son
**imágenes** en la pág. 6 de la guía: leer las imágenes sueltas, `pdf_imagenes.py --paginas 6` sin
`--componer`; la vista compuesta omite el ejercicio 1 — sin verificar, probablemente por la regla de
`cm[5] < 40` de la clase 10). Procesadores (la mejor; mismo pseudocódigo que la clase 10,
simulador propio; `O((m+n)·mⁿ)`), Laberinto (la mejor; `O(n²·3^(n²))`) y Caballo de Atila (una; se
corta al cerrar; `O(3^(n²))`). Decisiones y observaciones:
- El enunciado del laberinto sale **cortado a la derecha** en el PDF («ur…», «i…», «dadas,»): se
  transcribió completando las palabras y una `.note` lo avisa. Laberinto y Atila **no traen números**:
  pseudocódigo y ejemplos propios (lo dicen sus `.note`). El de Atila supone que la entrada es el
  jardín con las casillas pisadas marcadas; con `k < 4` devuelve falso (con 2 casillas contiguas
  `esVecina` daría verdadero, pero se pisaría dos veces cada una).
- Laberinto: longitud = suma de los valores **incluidos origen y destino**; los booleanos no tienen por
  qué ser simétricos (pasajes de un solo sentido, dibujados con ▶). Entrada de texto: filas separadas por
  `/`, casillas por espacios, `valor` + letras N/E/S/O (`3ES`); filas y columnas desde 1; hasta 4×4. El
  simulador acepta valor 0. Se aclara en una `.first` que el mismo problema es Dijkstra (polinomial).
- Atila: `#` pisada / `.` pasto, cuadrado de 2×2 a 5×5. La paridad (k impar ⇒ sin recorrido) y el grado
  < 2 se explican como poda extra pero **no** están en el pseudocódigo. El 4×4 completo tiene 6 ciclos.
- Builders puros `btProcesadores`, `btLaberinto`, `btAtila` + parseo, renderers `btProcRender` /
  `btMazeRender` / `btAtilaRender` (SVG compartido `btFrame`) y `btGuard`, entre los marcadores
  `/* ===== Guía · Backtracking ===== */` y `const btProcSim=`. Laberinto y Atila **cortan en 400 pasos**
  (`BT_MAX_STEPS`) con un error visible en vez de colgar; Procesadores no tiene tope (igual que la
  clase 10: hasta ~635 pasos con 6 tareas y 3 procesadores). Pasos de los ejemplos: 28 / 52 / 84.
- Ids: `g15-t`, `g15-m`, `g16-lab`, `g16-o`, `g16-d`, `g17-jardin`; presets con `data-bt-sim` +
  `data-bt-preset` (JSON con ids → valores). CSS `.bt-*` solo en esta página.
- Prueba: `node tests/guia-backtracking.test.cjs` (builders reales contra enumeración exhaustiva,
  Bellman-Ford y DP de ciclo hamiltoniano; valida también los presets escritos en el HTML). En vm,
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

Cada ejercicio tiene la misma secuencia: **enunciado textual** (`.enun`) → **«qué te están
pidiendo»** en lenguaje natural → **razonamientos guiados** (`ol.razon`, preguntas con un empujón,
sin spoilear) → botón **«Ver la resolución»** (`button.rev` togglea `.sol.show`) que revela
estrategia con sus elementos, pseudocódigo y un **simulador propio** (`sim-g1`…`sim-i8`, 20 en
total) con el ejemplo del enunciado, más la complejidad. Botón «Abrir todas las resoluciones» en
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
