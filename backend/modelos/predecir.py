
import sys
import json
import base64
import io
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image

# Ruta de la carpeta donde está guardado el modelo
carpeta_modelo = Path(sys.argv[1])

# Leer los datos enviados desde Node.js por stdin
datos = json.load(sys.stdin)

imagen = datos["imagen"]
categorias = datos["categorias"]

# Cargar el modelo entrenado
modelo = tf.keras.models.load_model(carpeta_modelo / "modelo.keras")


def normalizar(imagen):
    # Quitar el encabezado data:image/png;base64,
    if "," in imagen:
        imagen = imagen.split(",", 1)[1]

    # Decodificar Base64
    imagen_bytes = base64.b64decode(imagen)

    # Abrir la imagen desde memoria
    imagen_original = Image.open(
        io.BytesIO(imagen_bytes)
    ).convert("L")

    # Redimensionar a 28x28
    imagen_redimensionada = imagen_original.resize((28, 28))

    # Convertir a NumPy y normalizar entre 0 y 1
    imagen_normalizada = np.array(
        imagen_redimensionada,
        dtype=np.float32
    ) / 255.0

    # Agregar dimensiones para el modelo
    imagen_normalizada = np.expand_dims(imagen_normalizada, axis=-1)
    imagen_normalizada = np.expand_dims(imagen_normalizada, axis=0)

    return imagen_normalizada


# Preparar imagen
imagen_normalizada = normalizar(imagen)

# Realizar predicción
prediccion = modelo.predict(imagen_normalizada, verbose=0)

# Obtener la categoría con mayor probabilidad
indice = int(np.argmax(prediccion[0]))

resultado = {
    "prediccion": prediccion.tolist(),
    "indice": indice,
    "categoria": categorias[indice]
}

# IMPORTANTE: imprimir únicamente JSON por stdout
print(json.dumps(resultado))

