import sys
import json
from pathlib import Path
import numpy as np
import tensorflow as tf
import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier


carpeta_dataset = Path(sys.argv[1]) #Ruta del dataset
carpeta_modelo = Path(sys.argv[2]) #Ruta donde se guarda el modelo
metodo = sys.argv[3] #arbol, svm o knn
parametros = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}
carpeta_modelo.mkdir(parents=True, exist_ok=True)

TAMANO = (28, 28)
SEMILLA = 42
LOTE = 10

#Cargar el dataset con la misma división que usa la red neuronal
def cargar(subset):
    datos = tf.keras.utils.image_dataset_from_directory(
        carpeta_dataset,
        label_mode="int",
        color_mode="grayscale",
        image_size=TAMANO,
        shuffle=True,
        seed=SEMILLA,
        validation_split=0.2,
        subset=subset,
        batch_size=LOTE,
    )
    imagenes, etiquetas = [], []
    for lote, etiquetas_lote in datos:
        imagenes.append(lote.numpy().reshape(len(lote), -1) / 255.0)
        etiquetas.append(etiquetas_lote.numpy())
    return datos.class_names, np.concatenate(imagenes), np.concatenate(etiquetas)

clases, x_entrenamiento, y_entrenamiento = cargar("training")

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
