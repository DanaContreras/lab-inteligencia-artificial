# quickdraw.py
import json
import random
import urllib.request
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageDraw

CATEGORIAS = ["cat", "house", "tree"]
CANTIDAD = 30
LADO = 256
GROSOR = 6
DESTINO = Path("quickdraw")
URL = "https://storage.googleapis.com/quickdraw_dataset/full/simplified/{}.ndjson"

ESCALA = 4
MARGEN = 0.1


def dibujar(trazos):
    grande = LADO * ESCALA
    util = grande * (1 - 2 * MARGEN)
    desplazamiento = grande * MARGEN

    imagen = Image.new("L", (grande, grande), 255)
    lapiz = ImageDraw.Draw(imagen)
    for xs, ys in trazos:
        puntos = [(desplazamiento + x / 255 * util, desplazamiento + y / 255 * util)
                  for x, y in zip(xs, ys)]
        grosor = GROSOR * ESCALA
        if len(puntos) > 1:
            lapiz.line(puntos, fill=0, width=grosor, joint="curve")
        for x, y in (puntos[0], puntos[-1]):
            r = grosor / 2
            lapiz.ellipse((x - r, y - r, x + r, y + r), fill=0)

    return imagen.resize((LADO, LADO), Image.LANCZOS)


azar = random.Random(42)
for categoria in CATEGORIAS:
    carpeta = DESTINO / categoria
    carpeta.mkdir(parents=True, exist_ok=True)

    print(f"Descargando {categoria}…")
    guardados = 0
    with urllib.request.urlopen(URL.format(quote(categoria))) as respuesta:
        for linea in respuesta:
            dibujo = json.loads(linea)
            if not dibujo["recognized"] or azar.random() > 0.2:
                continue
            dibujar(dibujo["drawing"]).save(carpeta / f"{categoria}_{guardados:03}.png")
            guardados += 1
            if guardados == CANTIDAD:
                break

    print(f"{categoria}: {guardados} dibujos en {carpeta}")
