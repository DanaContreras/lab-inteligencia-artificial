
import sys
import json
import base64
import io
from pathlib import Path

import cv2
import numpy as np
import tensorflow as tf
from PIL import Image
import matplotlib.pyplot as plt

TAMANO = (32, 32)

# Ruta de la carpeta donde está guardado el modelo
carpeta_modelo = Path(sys.argv[1])

# Leer los datos enviados desde Node.js por stdin
datos = json.load(sys.stdin)



imagen = datos["imagen"]
categorias = datos["categorias"]


# Cargar el modelo entrenado
modelo = tf.keras.models.load_model(carpeta_modelo / "modelo.keras")

# Usar el orden de clases con el que se entrenó la red (orden alfabético)
ruta_clases = carpeta_modelo / "clases.json"
if ruta_clases.exists():
    categorias = json.loads(ruta_clases.read_text("utf-8"))
else:
    categorias = sorted(c["nombre"] for c in categorias)


def normalizar(imagen, centrado):
    # Quitar el encabezado data:image/png;base64,
    if "," in imagen:
        imagen = imagen.split(",", 1)[1]

    # Decodificar Base64
    imagen_bytes = base64.b64decode(imagen)

    # Abrir la imagen con OpenCV desde memoria
    nparr = np.frombuffer(imagen_bytes, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_cv is None:
            raise ValueError("No se pudo decodificar la imagen recibida.")

    #Escala de grises
    image_gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

    
    processed = cv2.resize(image_gray, TAMANO)

    #Centrar dibujo
    if centrado: 
        # Binarizar SOLO para detectar los límites del trazo (Bounding Box)
        _, thresh = cv2.threshold(image_gray, 200, 255, cv2.THRESH_BINARY_INV)

        # Encontrar coordenadas de los píxeles del dibujo
        y_indices, x_indices = np.where(thresh > 0)

        if len(y_indices) > 0 and len(x_indices) > 0:
            ymin, ymax = y_indices.min(), y_indices.max()
            xmin, xmax = x_indices.min(), x_indices.max()

            # Recortar DIRECTAMENTE de la escala de grises original (preserva el trazo real)
            dibujo_recortado = image_gray[ymin:ymax+1, xmin:xmax+1]

            # Crear un lienzo vacío de 32x32 completamente BLANCO (valor 255)
            lienzo = np.ones(TAMANO, dtype=np.uint8) * 255

            # Redimensionar el recorte manteniendo la proporción para que quepa en 24x24
            h_rec, w_rec = dibujo_recortado.shape
            max_dim = max(h_rec, w_rec)
            
            escala = 24.0 / max_dim
            nuevo_h = int(h_rec * escala)
            nuevo_w = int(w_rec * escala)
            
            if nuevo_h > 0 and nuevo_w > 0:
                dibujo_redim = cv2.resize(dibujo_recortado, (nuevo_w, nuevo_h))
                
                # Calcular posición para centrarlo en el lienzo blanco de 32x32
                start_y = (32 - nuevo_h) // 2
                start_x = (32 - nuevo_w) // 2
                
                lienzo[start_y:start_y+nuevo_h, start_x:start_x+nuevo_w] = dibujo_redim
            else:
                lienzo = cv2.resize(image_gray, TAMANO)
            
            processed = lienzo

    # Normalizar valores entre 0 y 1
    imagen_normalizada = processed.astype("float32") / 255.0

    # Agregar la dimensión del lote (batch size): forma final (1, 32, 32)
    imagen_normalizada = np.expand_dims(imagen_normalizada, axis=0)

    return imagen_normalizada


# def normalizar(imagen, centrado):
#     # Quitar el encabezado data:image/png;base64,
#     if "," in imagen:
#         imagen = imagen.split(",", 1)[1]

#     # Decodificar Base64
#     imagen_bytes = base64.b64decode(imagen)

#     # Abrir la imagen desde memoria
#     imagen_original = Image.open(
#         io.BytesIO(imagen_bytes)
#     ).convert("L")


#     # Redimensionar a 28x28
#     imagen_redimensionada = imagen_original.resize((32, 32))

#     # Convertir a NumPy y normalizar entre 0 y 1
#     imagen_normalizada = np.array(
#         imagen_redimensionada,
#         dtype=np.float32
#     ) / 255.0

#     # Agregar dimensiones para el modelo
#     imagen_normalizada = np.expand_dims(imagen_normalizada, axis=-1)
#     imagen_normalizada = np.expand_dims(imagen_normalizada, axis=0)

#     return imagen_normalizada


# Preparar imagen
imagen_normalizada = normalizar(imagen, True)

imagen_mostrar = imagen_normalizada.squeeze()

# Mostrar imagen original y normalizada
# plt.figure(figsize=(10, 5))

# plt.subplot(1, 2, 1)
# plt.imshow(
#     Image.open(io.BytesIO(base64.b64decode(imagen.split(",")[-1]))).convert("L"),
#     cmap="gray"
# )
# plt.title("Imagen original")
# plt.axis("off")

# plt.subplot(1, 2, 2)
# plt.imshow(
#     imagen_mostrar,
#     cmap="gray",
#     vmin=0,
#     vmax=1
# )
# plt.title("Imagen normalizada 28x28")
# plt.axis("off")

# plt.suptitle("Visualización del procesamiento de la imagen")
# plt.tight_layout()
# plt.show()


# Realizar predicción
prediccion = modelo.predict(imagen_normalizada, verbose=0)

# Obtener la categoría con mayor probabilidad
indice = int(np.argmax(prediccion[0]))


resultado = {
    "prediccion": prediccion.tolist(),
    "indice": indice,
    #"categoria": categorias[indice]
    "categorias": categorias
}

# IMPORTANTE: imprimir únicamente JSON por stdout
print(json.dumps(resultado))

