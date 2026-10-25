#!/usr/bin/env python3
"""
Vuelca las imágenes de un PDF de la cátedra a PNG, página por página.

Hace falta porque en esta máquina la tool Read no abre los PDF (falta pdftoppm) y en las
diapositivas los pseudocódigos, tablas y fórmulas son imágenes: pdftotext los saca vacíos.

Sin dependencias: solo re + zlib + struct. Entiende image XObjects /FlateDecode (con o sin
predictor PNG) en DeviceRGB / DeviceGray de 8 bits, y guarda los /DCTDecode como .jpg.

Uso:
    python -I pdf_imagenes.py Clase-07_2026-09-23.pdf salida/ [--escala 3] [--paginas 11-13,17]
Escribe  salida/p<pagina>_obj<n>.png  (o .jpg). Con --escala N agranda por vecino más cercano,
útil para el pseudocódigo chico.

IMPORTANTE: las láminas del pseudocódigo suelen ser una imagen base con parches pegados encima
(la clase 7 corrige a mano d[j] -> d[i], agrega "+ 1", cambia "<" por ">"). Las imágenes sueltas
traen la base SIN los parches. Para ver la lámina como la ve el alumno:
    python -I pdf_imagenes.py Clase-07.pdf salida/ --componer --escala 2 --paginas 18,26
y completar los parches de texto (que no se dibujan) con  pdftotext -layout -f N -l N Clase.pdf -
"""
import re, sys, os, zlib, struct, argparse


def leer_objetos(data):
    objs = {}
    for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj(.*?)endobj', data, re.S):
        objs[int(m.group(1))] = m.group(3)
    return objs


def stream_de(obj):
    m = re.search(rb'stream\r?\n', obj)
    if not m:
        return None
    ini = m.end()
    fin = obj.rfind(b'endstream')
    s = obj[ini:fin]
    if s.endswith(b'\r\n'):
        s = s[:-2]
    elif s.endswith(b'\n'):
        s = s[:-1]
    return s


def paginas_en_orden(objs, data):
    root = re.search(rb'/Root\s+(\d+)\s+\d+\s+R', data)
    cat = objs[int(root.group(1))]
    raiz = int(re.search(rb'/Pages\s+(\d+)\s+\d+\s+R', cat).group(1))
    orden = []

    def rec(n):
        o = objs[n]
        if re.search(rb'/Type\s*/Pages\b', o):
            kids = re.search(rb'/Kids\s*\[(.*?)\]', o, re.S).group(1)
            for k in re.findall(rb'(\d+)\s+\d+\s+R', kids):
                rec(int(k))
        else:
            orden.append(n)
    rec(raiz)
    return orden


def xobjects_de_pagina(objs, pagina):
    o = objs[pagina]
    res = re.search(rb'/Resources\s+(\d+)\s+\d+\s+R', o)
    rtxt = objs[int(res.group(1))] if res else o
    xo = re.search(rb'/XObject\s*<<(.*?)>>', rtxt, re.S)
    if xo:
        txt = xo.group(1)
    else:
        xr = re.search(rb'/XObject\s+(\d+)\s+\d+\s+R', rtxt)
        txt = objs[int(xr.group(1))] if xr else b''
    return [int(r) for _, r in re.findall(rb'/(\S+?)\s+(\d+)\s+\d+\s+R', txt)]


def quitar_predictor(raw, w, bpp, predictor):
    """Deshace los predictores PNG (10-15) de FlateDecode. 1 = sin predictor."""
    if predictor < 10:
        return raw
    fila = w * bpp
    salida = bytearray()
    prev = bytearray(fila)
    pos = 0
    while pos < len(raw):
        ft = raw[pos]
        cur = bytearray(raw[pos + 1: pos + 1 + fila])
        pos += 1 + fila
        for i in range(len(cur)):
            a = cur[i - bpp] if i >= bpp else 0
            b = prev[i]
            c = prev[i - bpp] if i >= bpp else 0
            if ft == 1:
                cur[i] = (cur[i] + a) & 255
            elif ft == 2:
                cur[i] = (cur[i] + b) & 255
            elif ft == 3:
                cur[i] = (cur[i] + ((a + b) >> 1)) & 255
            elif ft == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                cur[i] = (cur[i] + pr) & 255
        salida += cur
        prev = cur
    return bytes(salida)


def escalar(pix, w, h, canales, k):
    if k <= 1:
        return pix, w, h
    out = bytearray()
    fila = w * canales
    for y in range(h):
        linea = pix[y * fila:(y + 1) * fila]
        ancha = bytearray()
        for x in range(w):
            px = linea[x * canales:(x + 1) * canales]
            ancha += px * k
        out += bytes(ancha) * k
    return bytes(out), w * k, h * k


def escribir_png(ruta, pix, w, h, canales):
    tipo = {1: 0, 3: 2}[canales]
    crudo = bytearray()
    fila = w * canales
    for y in range(h):
        crudo.append(0)
        crudo += pix[y * fila:(y + 1) * fila]

    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, tipo, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(crudo), 6))
    png += chunk(b'IEND', b'')
    with open(ruta, 'wb') as f:
        f.write(png)


def componer(objs, pagina, ruta, escala):
    """Arma la lámina como la ve el alumno: imágenes y rectángulos blancos en el orden del content stream.

    Las láminas de la cátedra suelen ser una imagen base con PARCHES pegados encima (rectángulos blancos que
    tapan, imágenes chicas y texto que corrigen el pseudocódigo). Las imágenes sueltas solo traen la base, con
    el error incluido. Acá los parches de imagen quedan dibujados con borde rojo y los rectángulos blancos con
    borde verde. Los parches de TEXTO no se pueden dibujar (no hay renderer de fuentes): aparecen como un
    recuadro blanco vacío; su contenido sale de  pdftotext -layout -f N -l N archivo.pdf -
    """
    o = objs[pagina]
    cref = re.search(rb'/Contents\s*(\d+)', o)
    if not cref:
        return False
    cs = zlib.decompress(stream_de(objs[int(cref.group(1))])).decode('latin1')
    nombres = {n.decode(): int(r) for n, r in re.findall(rb'/(Image\d+)\s+(\d+)\s+\d+\s+R', o)}
    W, H = int(720 * escala), int(540 * escala)           # las láminas son de 720 x 540 pt
    lienzo = bytearray(b'\xff' * (W * H * 3))

    def rect(x, y, w, h, color, solo_borde=False):
        for cy in range(max(0, int((540 - y - h) * escala)), min(H, int((540 - y) * escala) + 1)):
            for cx in range(max(0, int(x * escala)), min(W, int((x + w) * escala) + 1)):
                borde = cx - x * escala < 2 or (x + w) * escala - cx < 2 or cy - (540 - y - h) * escala < 2 or (540 - y) * escala - cy < 2
                if solo_borde and not borde:
                    continue
                q = (cy * W + cx) * 3
                lienzo[q:q + 3] = bytes(color)

    def imagen(ref, cm, marcar):
        ob = objs[ref]
        w = int(re.search(rb'/Width\s+(\d+)', ob).group(1)); h = int(re.search(rb'/Height\s+(\d+)', ob).group(1))
        if not re.search(rb'/Filter\s*\[?\s*/FlateDecode', ob):
            return
        cs_ = re.search(rb'/ColorSpace\s*/?(\w+)', ob); can = 1 if cs_ and cs_.group(1) == b'DeviceGray' else 3
        raw = zlib.decompress(stream_de(ob))
        pred = re.search(rb'/Predictor\s+(\d+)', ob)
        raw = quitar_predictor(raw, w, can, int(pred.group(1)) if pred else 1)
        a, d, e, f = cm[0], cm[3], cm[4], cm[5]
        for cy in range(max(0, int((540 - f - d) * escala)), min(H, int((540 - f) * escala) + 1)):
            ypt = 540 - cy / escala
            sy = min(h - 1, max(0, int((1 - (ypt - f) / d) * h)))
            for cx in range(max(0, int(e * escala)), min(W, int((e + a) * escala) + 1)):
                sx = min(w - 1, max(0, int(((cx / escala) - e) / a * w)))
                p = (sy * w + sx) * can; q = (cy * W + cx) * 3
                lienzo[q:q + 3] = raw[p:p + 3] if can == 3 else bytes([raw[p]] * 3)
        if marcar:
            rect(e, f, a, d, (255, 0, 0), True)

    patron = (r'([\d.\-e ]+) cm\s*\n/(Image\d+) Do|\n1 g\s*\n([\d.\-e ]+) re\s*\nf\*')
    for m in re.finditer(patron, cs):
        if m.group(2):
            cm = [float(v) for v in m.group(1).split()][-6:]
            ref = nombres[m.group(2)]
            esbase = cm[0] > 300 and cm[3] > 300            # la imagen grande es la base; las chicas son parches
            if cm[5] < 40:                                   # el logo de UADE del pie
                continue
            imagen(ref, cm, marcar=not esbase and cm[0] < 300)
        else:
            x, y, w, h = [float(v) for v in m.group(3).split()]
            if w > 600:                                      # el fondo blanco de toda la lámina
                continue
            rect(x, y, w, h, (255, 255, 255)); rect(x, y, w, h, (0, 160, 0), True)
    escribir_png(ruta, bytes(lienzo), W, H, 3)
    return True


def rango_paginas(txt, total):
    if not txt:
        return set(range(1, total + 1))
    s = set()
    for parte in txt.split(','):
        if '-' in parte:
            a, b = parte.split('-')
            s.update(range(int(a), int(b) + 1))
        else:
            s.add(int(parte))
    return s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf')
    ap.add_argument('salida')
    ap.add_argument('--escala', type=int, default=1)
    ap.add_argument('--paginas', default='')
    ap.add_argument('--componer', action='store_true',
                    help='en vez de volcar las imágenes sueltas, arma cada lámina con sus parches (p<N>_compuesta.png)')
    a = ap.parse_args()

    data = open(a.pdf, 'rb').read()
    objs = leer_objetos(data)
    paginas = paginas_en_orden(objs, data)
    quiero = rango_paginas(a.paginas, len(paginas))
    os.makedirs(a.salida, exist_ok=True)
    hechas = set()
    n_out = 0
    for num, pg in enumerate(paginas, 1):
        if num not in quiero:
            continue
        if a.componer:
            if componer(objs, pg, os.path.join(a.salida, 'p%02d_compuesta.png' % num), max(1, a.escala)):
                n_out += 1
            continue
        for ref in xobjects_de_pagina(objs, pg):
            o = objs.get(ref, b'')
            if b'/Subtype' not in o or not re.search(rb'/Subtype\s*/Image', o):
                continue
            if (num, ref) in hechas:
                continue
            hechas.add((num, ref))
            w = int(re.search(rb'/Width\s+(\d+)', o).group(1))
            h = int(re.search(rb'/Height\s+(\d+)', o).group(1))
            filt = re.search(rb'/Filter\s*\[?\s*/(\w+)', o)
            filt = filt.group(1).decode() if filt else ''
            cs = re.search(rb'/ColorSpace\s*/?(\w+)', o)
            cs = cs.group(1).decode() if cs else 'DeviceRGB'
            s = stream_de(o)
            if s is None:
                continue
            base = os.path.join(a.salida, 'p%02d_obj%d' % (num, ref))
            if filt == 'DCTDecode':
                open(base + '.jpg', 'wb').write(s)
                n_out += 1
                continue
            if filt != 'FlateDecode':
                print('p%d obj %d: filtro %s no soportado, salteada' % (num, ref, filt))
                continue
            canales = 1 if cs == 'DeviceGray' else 3
            pred = re.search(rb'/Predictor\s+(\d+)', o)
            pred = int(pred.group(1)) if pred else 1
            raw = zlib.decompress(s)
            raw = quitar_predictor(raw, w, canales, pred)
            if len(raw) < w * h * canales:
                print('p%d obj %d: datos incompletos (%d < %d), salteada' % (num, ref, len(raw), w * h * canales))
                continue
            pix, W, H = escalar(raw[:w * h * canales], w, h, canales, a.escala)
            escribir_png(base + '.png', pix, W, H, canales)
            n_out += 1
    print('%d imágenes escritas en %s' % (n_out, a.salida))


if __name__ == '__main__':
    main()
