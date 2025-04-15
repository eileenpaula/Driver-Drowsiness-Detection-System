# Step 1: Import Required Libraries
import os
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Step 2: Define Dataset Paths
base_dir = "/dataset_split/train"
paths = {
    "ddd": os.path.join(base_dir, "ddd"),
    "yawdd": os.path.join(base_dir, "yawdd"),
    "eye_state": os.path.join(base_dir, "eye_state")
}

# Step 3: Data Augmentation & Preprocessing
image_size = (128, 128)
batch_size = 32

datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

generators = {
    task: datagen.flow_from_directory(
        paths[task],
        target_size=image_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=True
    )
    for task in paths
}

# Dynamically get class counts
class_counts = {task: len(generators[task].class_indices) for task in generators}
print("Detected classes per task:", class_counts)

# Step 4: Define Multi-Task CNN Model
base_model = MobileNetV2(include_top=False, input_shape=(128, 128, 3), weights='imagenet', pooling='avg')
base_model.trainable = False

x = base_model.output

# Drowsiness Head
drowsiness_fc = Dense(512, activation='relu')(x)
drowsiness_fc = Dropout(0.5)(drowsiness_fc)
drowsiness_output = Dense(class_counts["ddd"], activation='softmax', name='drowsiness_output')(drowsiness_fc)

# Yawning Head
yawning_fc = Dense(256, activation='relu')(x)
yawning_fc = Dropout(0.5)(yawning_fc)
yawning_output = Dense(class_counts["yawdd"], activation='softmax', name='yawning_output')(yawning_fc)

# Blinking Head
blinking_fc = Dense(256, activation='relu')(x)
blinking_fc = Dropout(0.5)(blinking_fc)
blinking_output = Dense(class_counts["eye_state"], activation='softmax', name='blinking_output')(blinking_fc)

model = Model(
    inputs=base_model.input,
    outputs=[drowsiness_output, yawning_output, blinking_output]
)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss={
        'drowsiness_output': 'categorical_crossentropy',
        'yawning_output': 'categorical_crossentropy',
        'blinking_output': 'categorical_crossentropy'
    },
    metrics={
        'drowsiness_output': 'accuracy',
        'yawning_output': 'accuracy',
        'blinking_output': 'accuracy'
    }
)

model.summary()

# Step 5: Define Multi-Task Data Generator
def multi_task_generator(ddd_gen, yawdd_gen, eye_gen):
    while True:
        d_data, d_labels = next(ddd_gen)
        y_data, y_labels = next(yawdd_gen)
        b_data, b_labels = next(eye_gen)

        min_batch_size = min(len(d_data), len(y_data), len(b_data))

        yield d_data[:min_batch_size], {
            "drowsiness_output": d_labels[:min_batch_size],
            "yawning_output": y_labels[:min_batch_size],
            "blinking_output": b_labels[:min_batch_size]
        }

train_generator = multi_task_generator(
    generators["ddd"],
    generators["yawdd"],
    generators["eye_state"]
)

# Step 6: Train the Model
epochs = 20
steps_per_epoch = min(
    len(generators["ddd"]),
    len(generators["yawdd"]),
    len(generators["eye_state"])
)

history = model.fit(
    train_generator,
    steps_per_epoch=steps_per_epoch,
    epochs=epochs,
    verbose=1
)

# Step 7: Save the Model
model.save("/multi_task_drowsiness_model.h5")
print("Multi-task model saved!")