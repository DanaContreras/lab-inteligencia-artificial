import sys
import json
from pathlib import Path
import numpy as np
import tensorflow as tf


carpeta_dataset = Path(sys.argv[1])
carpeta_modelo = Path(sys.argv[2])
carpeta_modelo.mkdir(parents=True, exist_ok=True)

TAMANO = (28, 28)
SEMILLA = 42
LOTE = 16

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
            f"La categoría '{categoria}' necesita al menos 5 imágenes."
        )

entrenamiento = tf.keras.utils.image_dataset_from_directory(
    carpeta_dataset,
    color_mode="grayscale",
    image_size=TAMANO,
    batch_size=LOTE,
    validation_split=0.2,
    subset="training",
    seed=SEMILLA,
    label_mode="int",
)

validacion = tf.keras.utils.image_dataset_from_directory(
    carpeta_dataset,
    color_mode="grayscale",
    image_size=TAMANO,
    batch_size=LOTE,
    validation_split=0.2,
    subset="validation",
    seed=SEMILLA,
    label_mode="int",
)

clases = entrenamiento.class_names

# Guardar el orden de las etiquetas que utiliza la red.
with open(
    carpeta_modelo / "clases.json",
    "w",
    encoding="utf-8"
) as archivo:
    json.dump(clases, archivo, ensure_ascii=False, indent=2)

AUTOTUNE = tf.data.AUTOTUNE

def normalizar(imagenes, etiquetas):
    imagenes = tf.cast(imagenes, tf.float32) / 255.0
    return imagenes, etiquetas

entrenamiento = entrenamiento.map(
    normalizar
).prefetch(AUTOTUNE)

validacion = validacion.map(
    normalizar
).prefetch(AUTOTUNE)

modelo = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(28,28,1)),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(20, activation='relu'),
    tf.keras.layers.Dense(10, activation='relu'),
    tf.keras.layers.Dense(5, activation='softmax')]
)

modelo.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)

modelo.fit(
    entrenamiento,
    validation_data=validacion,
    epochs=15,
)

perdida, precision = modelo.evaluate(validacion, verbose=0)

modelo.save(carpeta_modelo / "modelo.keras")

print(json.dumps({
    "categorias": clases,
    "precision_validacion": float(precision),
    "modelo": str(carpeta_modelo / "modelo.keras"),
}))
