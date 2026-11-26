import json
from pathlib import Path
import sys
import tensorflow as tf
import cv2
import matplotlib.pyplot as plt
import numpy as np
import os

#Preprocesar datos
carpeta_dataset = Path(sys.argv[1]) #Ruta del dataset
carpeta_modelo = Path(sys.argv[2]) #Ruta donde se guarda el modelo
carpeta_modelo.mkdir(parents=True, exist_ok=True)

images, labels = [], []
TAMANO = (32, 32)
SEMILLA = 42

# Parámetros opcionales del nivel avanzado
parametros = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
EPOCAS = parametros.get("epocas", 30)
NEURONAS = parametros.get("neuronas", 50)

# Verificar que cada categoría tenga suficientes imágenes.
categorias = sorted(
    p.name for p in carpeta_dataset.iterdir() if p.is_dir()
)

if len(categorias) < 2:
    raise ValueError("Se necesitan al menos dos categorías.")

for categoria in categorias:
    cantidad = sum(
        1 for p in (carpeta_dataset / categoria).iterdir()
        if p.is_file() and p.suffix.lower() in {
            ".png",
        }
    )
    if cantidad < 3:
        raise ValueError(
            f"La categoría '{categoria}' necesita al menos 3 imágenes."
        )

def leer_imagen_unicode(ruta):
    try:
        # Lee los bytes del archivo soportando tildes, 'ñ' y caracteres especiales en Windows
        bytes_archivo = np.fromfile(ruta, dtype=np.uint8)
        img = cv2.imdecode(bytes_archivo, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Error al leer {ruta}: {e}")
        return None


def cargarDatosConCentrado(images, labels, centrado):
  for subfolder in sorted(os.listdir(carpeta_dataset)):
    category_path = os.path.join(carpeta_dataset, subfolder)
        
    #print(subfolder)

    for image in os.listdir(category_path):
        img_path = os.path.join(category_path, image)
        #print(img_path)
        img = leer_imagen_unicode(img_path)

        #Escala de grises original
        image_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        processed = cv2.resize(image_gray, TAMANO)

        #Centrar dibujo
        if centrado: 
          #Binarizar SOLO para detectar los límites del trazo (Bounding Box)
          _, thresh = cv2.threshold(image_gray, 200, 255, cv2.THRESH_BINARY_INV)

          #Encontrar coordenadas de los píxeles del dibujo
          y_indices, x_indices = np.where(thresh > 0)

          if len(y_indices) > 0 and len(x_indices) > 0:
              ymin, ymax = y_indices.min(), y_indices.max()
              xmin, xmax = x_indices.min(), x_indices.max()

              # Recortar DIRECTAMENTE de la escala de grises original (preserva el trazo real)
              dibujo_recortado = image_gray[ymin:ymax+1, xmin:xmax+1]

              # Crear un lienzo vacío de 32x32 completamente BLANCO (valor 255)
              lienzo = np.ones(TAMANO, dtype=np.uint8) * 255

              # Redimensionar el recorte manteniendo la proporción
              h_rec, w_rec = dibujo_recortado.shape
              max_dim = max(h_rec, w_rec)
              
              escala = 32.0 / max_dim
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

        #Normalizar valores entre 0 y 1
        resize = processed.astype("float32") / 255.0

        guardar_comparativa_informe(img, resize)

        
        images.append(resize)
        labels.append(subfolder)

  etiquetas_numericas = {categoria: i for i, categoria in enumerate(categorias)}

  images = np.array(images)
  labels_num = np.array([etiquetas_numericas[label] for label in labels])

  return images, labels_num, categorias, etiquetas_numericas

images_norm, labels_norm, clases, etiquetas_numericas = cargarDatosConCentrado(images, labels, True)

# Guardar el orden de las etiquetas que utiliza la red.
with open(
    carpeta_modelo / "clases.json",
    "w",
    encoding="utf-8"
) as archivo:
    json.dump(clases, archivo, ensure_ascii=False, indent=2)


#Separar en entrenamiento y validacion
# Mezclar índices aleatoriamente
np.random.seed(SEMILLA)
indices = np.random.permutation(len(images_norm))

# Calcular cantidad de datos para entrenamiento
cantidad_train = int(len(images_norm) * 0.8)

# Dividir índices
indices_train = indices[:cantidad_train]
indices_val = indices[cantidad_train:]

# Obtener imágenes y etiquetas
X_train = images_norm[indices_train]
X_val = images_norm[indices_val]

y_train = labels_norm[indices_train]
y_val = labels_norm[indices_val]


n_categorias = len(np.unique(labels))

fig, ejes = plt.subplots(2, 3, figsize=(10, 5))

for i, ax in enumerate(ejes.flat):
    ax.imshow(X_train[i], cmap="gray")
    ax.set_title(f"{categorias[y_train[i]]} indice: {i}")
    ax.axis("off")

plt.tight_layout()
plt.show()

#Crear modelo
modelo = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(32,32,1)),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(NEURONAS, activation='relu'),
    tf.keras.layers.Dense(NEURONAS, activation='relu'),
    tf.keras.layers.Dense(len(clases), activation='softmax')]
)

modelo.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)

historial = modelo.fit(X_train, y_train, epochs=EPOCAS, validation_data=(X_val, y_val))

#Guardar el modelo entrenado
modelo.save(carpeta_modelo / "modelo.keras")


print(json.dumps({
    "categorias": clases,
    "modelo": str(carpeta_modelo / "modelo.keras"),
}))
