import sys
import json
import base64
import io
from pathlib import Path

import numpy as np
import joblib
from PIL import Image

# Ruta de la carpeta donde están guardados los modelos
carpeta_modelo = Path(sys.argv[1])

# leer los datos enviados desde Node.js por stdin
datos = json.load(sys.stdin)

imagen = datos["imagen"]
metodos = datos["metodos"]


def normalizar(imagen):
    if "," in imagen:
        imagen = imagen.split(",", 1)[1]

    imagen_original = Image.open(
        io.BytesIO(base64.b64decode(imagen))
    ).convert("L")

    imagen_redimensionada = imagen_original.resize((28, 28))

    imagen_normalizada = np.array(
        imagen_redimensionada,
        dtype=np.float32
    ) / 255.0

    return imagen_normalizada.reshape(1, -1)


imagen_normalizada = normalizar(imagen)


def calcular_confianza(modelo, etiqueta):
    # Árbol y KNN dan probabilidades; SVM se estima con la distancia a la frontera
    columna = list(modelo.classes_).index(etiqueta)

    if hasattr(modelo, "predict_proba"):
        return float(modelo.predict_proba(imagen_normalizada)[0][columna])

    distancias = np.atleast_1d(modelo.decision_function(imagen_normalizada)[0])
    if len(distancias) == 1:
        return float(1 / (1 + np.exp(-abs(distancias[0]))))

    exponentes = np.exp(distancias - distancias.max())
    return float(exponentes[columna] / exponentes.sum())


resultados = {}
for metodo in metodos:
    guardado = joblib.load(carpeta_modelo / f"{metodo}.joblib")
    if not isinstance(guardado, dict):
        raise ValueError(
            f"El modelo '{metodo}' es de una versión anterior. Vuelve a entrenarlo."
        )
    indice = int(guardado["modelo"].predict(imagen_normalizada)[0])
    resultados[metodo] = {
        "indice": indice,
        "categoria": guardado["clases"][indice],
        "confianza": calcular_confianza(guardado["modelo"], indice),
    }

print(json.dumps(resultados, ensure_ascii=False))
