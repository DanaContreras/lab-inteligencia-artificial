import sys
import json
from pathlib import Path
import numpy as np
import tensorflow as tf
import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
import os
import cv2

carpeta_dataset = Path(sys.argv[1]) #Ruta del dataset
carpeta_modelo = Path(sys.argv[2]) #Ruta donde se guarda el modelo
metodo = sys.argv[3] #arbol, svm o knn
parametros = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}
carpeta_modelo.mkdir(parents=True, exist_ok=True)

TAMANO = (28, 28)
SEMILLA = 42
LOTE = 10
images, labels = [], []

# #Cargar el dataset con la misma división que usa la red neuronal
# def cargar(subset):
#     datos = tf.keras.utils.image_dataset_from_directory(
#         carpeta_dataset,
#         label_mode="int",
#         color_mode="grayscale",
#         image_size=TAMANO,
#         shuffle=True,
#         seed=SEMILLA,
#         validation_split=0.2,
#         subset=subset,
#         batch_size=LOTE,
#     )
#     imagenes, etiquetas = [], []
#     for lote, etiquetas_lote in datos:
#         imagenes.append(lote.numpy().reshape(len(lote), -1) / 255.0)
#         etiquetas.append(etiquetas_lote.numpy())
#     return datos.class_names, np.concatenate(imagenes), np.concatenate(etiquetas)

# clases, x_entrenamiento, y_entrenamiento = cargar("training")

categorias = sorted(
    p.name for p in carpeta_dataset.iterdir() if p.is_dir()
)

def cargarDatosConCentrado(images, labels, centrado):
  for subfolder in sorted(os.listdir(carpeta_dataset)):
    category_path = os.path.join(carpeta_dataset, subfolder)
        
    #print(subfolder)

    for image in os.listdir(category_path):
        img_path = os.path.join(category_path, image)
        #print(img_path)
        img = cv2.imread(img_path)

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

        #Normalizar valores entre 0 y 1
        resize = processed.astype("float32") / 255.0

        images.append(resize)
        labels.append(subfolder)

  etiquetas_numericas = {categoria: i for i, categoria in enumerate(categorias)}

  images = np.array(images)
  labels_num = np.array([etiquetas_numericas[label] for label in labels])

  return images, labels_num, categorias, etiquetas_numericas

x_entrenamiento, y_entrenamiento, clases, etiquetas_numericas = cargarDatosConCentrado(images, labels, True)

# Convertir imágenes a vectores unidimensionales
x_entrenamiento = x_entrenamiento.reshape(
    x_entrenamiento.shape[0], -1
)

#Definición del modelo
if metodo == "arbol":
    parametros = {"profundidad": parametros.get("profundidad", 5)}
    modelo = DecisionTreeClassifier(max_depth=parametros["profundidad"], random_state=SEMILLA)
elif metodo == "svm":
    parametros = {"kernel": parametros.get("kernel", "rbf"), "c": parametros.get("c", 1.0)}
    modelo = SVC(kernel=parametros["kernel"], C=parametros["c"])
elif metodo == "knn":
    #k no puede superar la cantidad de imágenes de entrenamiento
    parametros = {"k": min(parametros.get("k", 3), len(x_entrenamiento))}
    modelo = KNeighborsClassifier(n_neighbors=parametros["k"])
else:
    raise ValueError(f"Método desconocido: {metodo}")

#Entrenamiento
modelo.fit(x_entrenamiento, y_entrenamiento)

#Guardar el modelo entrenado junto con el orden de sus clases
joblib.dump({"modelo": modelo, "clases": clases}, carpeta_modelo / f"{metodo}.joblib")

print(json.dumps({"metodo": metodo, "parametros": parametros}, ensure_ascii=False))
