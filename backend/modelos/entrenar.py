import sys
import json
from pathlib import Path
import numpy as np
import tensorflow as tf


carpeta_dataset = Path(sys.argv[1]) #Ruta del dataset
carpeta_modelo = Path(sys.argv[2]) #Ruta donde se guarda el modelo
carpeta_modelo.mkdir(parents=True, exist_ok=True)

TAMANO = (28, 28)
SEMILLA = 42
LOTE = 10

#Cargar dataset de entrenamiento
entrenamiento = tf.keras.utils.image_dataset_from_directory(
    carpeta_dataset, #Ruta del dataset 
    label_mode="int", #Cambio de etiquetas a enteros
    color_mode="grayscale", #Escala de grises
    image_size=TAMANO, #Tamaño de las imagenes (28x28)
    shuffle=True, #Mezclas las imagenes
    seed=SEMILLA, #Semilla para aleatoriedad
    validation_split=0.2, #Porcentaje de imageness para validacion
    subset="training",
    batch_size=LOTE,
)

validacion = tf.keras.utils.image_dataset_from_directory(
    carpeta_dataset,
    label_mode="int",
    color_mode="grayscale",
    image_size=TAMANO,
    shuffle=True,
    seed=SEMILLA,
    validation_split=0.2,
    subset="validation",
    batch_size=LOTE,
)

#Clases del dataset
clases = entrenamiento.class_names

# Guardar el orden de las etiquetas que utiliza la red.
with open(
    carpeta_modelo / "clases.json",
    "w",
    encoding="utf-8"
) as archivo:
    json.dump(clases, archivo, ensure_ascii=False, indent=2)


#Normalizar las imagenes 
def normalizar(imagenes, etiquetas):
    imagenes = tf.cast(imagenes, tf.float32) / 255.0
    return imagenes, etiquetas

entrenamiento = entrenamiento.map(normalizar)
validacion = validacion.map(normalizar)

#Definición del modelo
modelo = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(28,28,1)),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(50, activation='relu'),
    tf.keras.layers.Dense(50, activation='relu'),
    tf.keras.layers.Dense(len(clases), activation='softmax')]
)

modelo.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)


#Entrenamiento
historial = modelo.fit(
    entrenamiento,
    epochs=30,
    validation_data=validacion,
)

print("Precisión entrenamiento:",
      historial.history["accuracy"][-1])

print("Precisión validación:",
      historial.history["val_accuracy"][-1])

print("Pérdida entrenamiento:",
      historial.history["loss"][-1])

print("Pérdida validación:",
      historial.history["val_loss"][-1])

#Guardar el modelo entrenado
modelo.save(carpeta_modelo / "modelo.keras")


print(json.dumps({
    "categorias": clases,
    "modelo": str(carpeta_modelo / "modelo.keras"),
}))
