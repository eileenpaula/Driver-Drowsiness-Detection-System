import tensorflow as tf
import numpy as np
import os
import cv2
import matplotlib.pyplot as plt
from keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix

model = tf.keras.models.load_model("/root/ddds/multi_task_drowsiness_model.h5")
print(" Model Loaded Successfully!")

base_test_dir = "/root/ddds/dataset_split/test"
paths = {
    "drowsiness": os.path.join(base_test_dir, "ddd"),
    "yawning": os.path.join(base_test_dir, "yawdd"),
    "blinking": os.path.join(base_test_dir, "eye_state")
}

image_size = (128, 128)
batch_size = 32

datagen = ImageDataGenerator(rescale=1./255)

generators = {
    task: datagen.flow_from_directory(
        paths[task],
        target_size=image_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )
    for task in paths
}

print("\n Evaluating Tasks Separately...")

drowsiness_model = tf.keras.Model(inputs=model.input, outputs=model.get_layer("drowsiness_output").output)
yawning_model    = tf.keras.Model(inputs=model.input, outputs=model.get_layer("yawning_output").output)
blinking_model   = tf.keras.Model(inputs=model.input, outputs=model.get_layer("blinking_output").output)

drowsiness_model.compile(loss="categorical_crossentropy", metrics=["accuracy"])
yawning_model.compile(loss="categorical_crossentropy", metrics=["accuracy"])
blinking_model.compile(loss="categorical_crossentropy", metrics=["accuracy"])

d_loss, d_acc = drowsiness_model.evaluate(generators["drowsiness"], verbose=1)
y_loss, y_acc = yawning_model.evaluate(generators["yawning"], verbose=1)
b_loss, b_acc = blinking_model.evaluate(generators["blinking"], verbose=1)

print(f"\n Evaluation Metrics:")
print(f"  - Drowsiness Accuracy: {d_acc:.4f}")
print(f"  - Yawning Accuracy:    {y_acc:.4f}")
print(f"  - Blinking Accuracy:   {b_acc:.4f}")

def evaluate_task(gen, predictions, task_name):
    y_true = gen.classes
    y_pred = np.argmax(predictions, axis=1)
    labels = list(gen.class_indices.keys())
    
    print(f"\n {task_name.capitalize()} Classification Report:")
    print(classification_report(y_true, y_pred, target_names=labels))

evaluate_task(generators["drowsiness"], model.predict(generators["drowsiness"])[0], "drowsiness")
evaluate_task(generators["yawning"], model.predict(generators["yawning"])[1], "yawning")
evaluate_task(generators["blinking"], model.predict(generators["blinking"])[2], "blinking")

def predict_drowsiness(image_path, model):
    """
    Predicts drowsiness, yawning, and blinking state for a given image.
    """
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image_resized = cv2.resize(image, (128, 128))
    image_normalized = image_resized / 255.0
    image_expanded = np.expand_dims(image_normalized, axis=0)

    predictions = model.predict(image_expanded)

    d_labels = ["Alert", "Low Vigilant", "Drowsy"]
    y_labels = ["Not Yawning", "Yawning"]
    b_labels = ["Eyes Open", "Eyes Closed"]

    print("\n🔍 Real-Time Prediction:")
    print(f"  Drowsiness: {d_labels[np.argmax(predictions[0])]} ({predictions[0].max():.2f})")
    print(f"  Yawning:    {y_labels[np.argmax(predictions[1])]} ({predictions[1].max():.2f})")
    print(f"  Blinking:   {b_labels[np.argmax(predictions[2])]} ({predictions[2].max():.2f})")

    plt.imshow(image)
    plt.axis("off")
    plt.title("Input Image")
    plt.show()

# Uncomment this to test with an actual image
# sample_image_path = "sample_test_image.jpg"
# predict_drowsiness(sample_image_path, model)

print("\n Evaluation & Inference Complete!")
