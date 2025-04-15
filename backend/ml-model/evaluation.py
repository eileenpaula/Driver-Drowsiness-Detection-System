# Step 1: Import Required Libraries
import tensorflow as tf
import numpy as np
import os
import cv2
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
import seaborn as sns
import pandas as pd

# Step 2: Load the Trained Model
model = tf.keras.models.load_model("/root/ddds/multi_task_drowsiness_model.h5")
print("Model Loaded Successfully!")

# Step 3: Load Test Dataset for Evaluation
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

# Step 4: Confusion Matrix + Per-Class Accuracy
def plot_confusion_matrix(y_true, y_pred, labels, title):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=labels, yticklabels=labels)
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.title(f"{title} Confusion Matrix")
    plt.tight_layout()
    plt.savefig(f"{title.lower()}_confusion_matrix.png")
    plt.close()


# Step 5: Evaluate All Tasks & Store Metrics
task_outputs = ["drowsiness", "yawning", "blinking"]
overall_metrics = []
per_class_metrics = []

for i, task in enumerate(task_outputs):
    print(f"\n Evaluating {task.capitalize()}...")

    generator = generators[task]
    class_names = list(generator.class_indices.keys())

    # Ground truth
    y_true = generator.classes

    # Predictions
    y_probs = model.predict(generator)[i]
    y_pred = np.argmax(y_probs, axis=1)

    # Accuracy
    acc = accuracy_score(y_true, y_pred)

    # ROC AUC
    try:
        y_true_bin = tf.keras.utils.to_categorical(y_true, num_classes=len(class_names))
        auc = roc_auc_score(y_true_bin, y_probs, multi_class="ovr")
    except Exception as e:
        auc = None
        print(f"ROC AUC failed: {e}")

    overall_metrics.append({
        "Task": task.capitalize(),
        "Accuracy": round(acc, 4),
        "ROC AUC": round(auc, 4) if auc else "N/A"
    })

    # Classification report
    report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)

    for cls in class_names:
        if cls in report:
            per_class_metrics.append({
                "Task": task.capitalize(),
                "Class": cls,
                "Precision": report[cls]["precision"],
                "Recall": report[cls]["recall"],
                "F1-Score": report[cls]["f1-score"],
                "Support": int(report[cls]["support"])
            })

    # Per-class accuracy
    print(f"\n{task.capitalize()} Per-Class Accuracy:")
    cm = confusion_matrix(y_true, y_pred)
    per_class_acc = cm.diagonal() / cm.sum(axis=1)
    for j, name in enumerate(class_names):
        print(f"  - {name}: {per_class_acc[j]:.4f}")

    # Plot and save confusion matrix
    plot_confusion_matrix(y_true, y_pred, class_names, task)

# Step 6: Save Metrics to Excel
print("\n Exporting metrics to Excel...")

overall_df = pd.DataFrame(overall_metrics)
per_class_df = pd.DataFrame(per_class_metrics)

excel_path = "/root/ddds/evaluation_metrics.xlsx"
with pd.ExcelWriter(excel_path) as writer:
    overall_df.to_excel(writer, sheet_name="Overall Metrics", index=False)
    per_class_df.to_excel(writer, sheet_name="Per-Class Metrics", index=False)

print(f"All metrics saved to: {excel_path}")