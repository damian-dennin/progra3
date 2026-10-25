#!/usr/bin/env python3
"""
Validación estructural de apuntes interactivos/index.html (o del HTML que se le pase)
Uso:  python3 validate.py [ruta-al-html]
Sale con código 1 si encuentra algún problema.
"""
import re, sys, subprocess, shutil, tempfile, os

PATH = sys.argv[1] if len(sys.argv) > 1 else "apuntes interactivos/index.html"
ok = True

def fail(titulo, detalle=""):
    global ok
    ok = False
    print(f"  ✗ {titulo}")
    if detalle:
        for linea in str(detalle).splitlines():
            print(f"      {linea}")

def passed(titulo, extra=""):
    print(f"  ✓ {titulo}{(' — ' + extra) if extra else ''}")

try:
    H = open(PATH, encoding="utf-8").read()
except FileNotFoundError:
    print(f"No existe {PATH}")
    sys.exit(1)

print(f"\nValidando {PATH} ({len(H):,} bytes)\n")

# ---------- 1. un solo <style> y un solo <script> ----------
print("Estructura del archivo")
estilos = re.findall(r"<style>(.*?)</style>", H, re.S)
scripts = re.findall(r"<script>(.*?)</script>", H, re.S)
if len(estilos) == 1: passed("un único bloque <style>")
else: fail(f"hay {len(estilos)} bloques <style>, debe haber 1")
if len(scripts) == 1: passed("un único bloque <script>")
else: fail(f"hay {len(scripts)} bloques <script>, debe haber 1")
if re.search(r'<(script|link)[^>]+(src|href)="https?://', H):
    fail("hay recursos externos (src/href http)", "el apunte tiene que funcionar offline")
else:
    passed("sin dependencias externas")
JS = scripts[0] if scripts else ""

# ---------- 2. ids duplicados ----------
print("\nIdentificadores")
ids = re.findall(r'\bid="([^"]+)"', H)
dup = sorted({i for i in ids if ids.count(i) > 1})
if dup: fail("ids duplicados", "\n".join(dup))
else: passed(f"{len(ids)} ids, todos únicos")

# ---------- 3. links internos ----------
rotos = sorted({h for h in re.findall(r'href="#([^"]+)"', H) if h not in ids})
if rotos: fail("links internos rotos", "\n".join("#" + r for r in rotos))
else: passed("todos los links del índice y del sidebar resuelven")

# ---------- 4. referencias del JS al DOM ----------
print("\nReferencias del JS al DOM")
faltan = [g for g in sorted(set(re.findall(r'getElementById\("([^"]+)"\)', JS)))
          if f'id="{g}"' not in H]
if faltan: fail("getElementById sin elemento", "\n".join(faltan))
else: passed("todos los getElementById encuentran su elemento")

qs = [q for q in sorted(set(re.findall(r'querySelector(?:All)?\("#([a-zA-Z0-9\-_]+)', JS)))
      if f'id="{q}"' not in H]
if qs: fail("querySelector #id sin elemento", "\n".join(qs))
else: passed("todos los querySelector('#...') encuentran su elemento")

# ---------- 5. simuladores ----------
print("\nSimuladores")
sims = sorted(set(re.findall(r'(?:\bSim|\bderivSim)\("([^"]+)"', JS)))
sin_contenedor = [s for s in sims if f'id="{s}"' not in H]
if sin_contenedor: fail("Sim() sin contenedor en el HTML", "\n".join(sin_contenedor))
else: passed(f"{len(sims)} simuladores con contenedor", ", ".join(sims))

for sid in sims:
    if f'id="{sid}"' not in H:
        continue                     # ya se reportó arriba
    resto = H.split(f'id="{sid}"', 1)[1]
    corte = resto.find("data-controls")
    if corte < 0:
        fail(f"{sid}: falta el contenedor data-controls")
        continue
    bloque = resto[:corte]          # solo este simulador, sin invadir el siguiente
    for req in ("data-code", "data-viz", "data-explain"):
        if req not in bloque:
            fail(f"{sid}: falta el atributo {req}")
    lineas = re.findall(r'data-l="(\d+)"', bloque)
    if len(lineas) != len(set(lineas)):
        rep = sorted({l for l in lineas if lineas.count(l) > 1})
        fail(f"{sid}: data-l repetidos dentro del mismo bloque", ", ".join(rep))

# ---------- 6. balance de etiquetas ----------
print("\nBalance de etiquetas")
desbal = []
for t in ["section", "main", "nav", "div", "table", "tr", "pre", "ol", "ul", "header", "p"]:
    a = len(re.findall(r"<%s[ >]" % t, H))
    c = len(re.findall(r"</%s>" % t, H))
    if a != c:
        desbal.append(f"{t}: abre {a}, cierra {c}")
if desbal: fail("etiquetas desbalanceadas", "\n".join(desbal))
else: passed("section, div, table, pre, ol, ul, p balanceados")

# ---------- 7. antipatrones ----------
print("\nAntipatrones")
problemas = []
if re.search(r"\b(localStorage|sessionStorage)\b", JS):
    problemas.append("uso de localStorage/sessionStorage (no funciona en este contexto)")
if re.search(r"new Array\(\s*\w+\s*\)(?!\s*\.fill)", JS):
    problemas.append("new Array(n) sin .fill(): los huecos hacen que .map()/.forEach() saltee posiciones")
if "innerHTML" in JS and "esc(" not in JS:
    problemas.append("se arma innerHTML pero no se usa esc() en ningún lado")
if problemas:
    for p in problemas: fail(p)
else:
    passed("sin antipatrones conocidos")

# ---------- 8. sintaxis del JS ----------
print("\nSintaxis del JavaScript")
if shutil.which("node"):
    tmp = os.path.join(tempfile.gettempdir(), "_apunte_check.js")
    open(tmp, "w", encoding="utf-8").write(JS)
    r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True)
    if r.returncode == 0: passed("node --check pasa")
    else: fail("error de sintaxis", r.stderr.strip())
    os.remove(tmp)
else:
    print("  · node no está disponible, se omite el chequeo de sintaxis")

# ---------- 9. inventario ----------
print("\nInventario")
clases = re.findall(r'<div class="classbar" id="([^"]+)"', H)
secciones = re.findall(r'<section id="([^"]+)"', H)
preguntas = len(re.findall(r'\bc:\s*\d', JS))
print(f"  clases: {len(clases)} ({', '.join(clases)})")
print(f"  secciones: {len(secciones)}")
print(f"  simuladores: {len(sims)}")
print(f"  preguntas de autoevaluación: {preguntas}")

print("\n" + ("TODO OK" if ok else "HAY PROBLEMAS — revisá los ✗ de arriba") + "\n")
sys.exit(0 if ok else 1)
